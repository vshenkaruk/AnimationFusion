#!/usr/bin/env python3
"""Local batch manager for Short Studio.

This manages topic queues, the maximum of three episode slots, review state,
and the approved local render. Research and writing are performed by the agent
workflow; no generative API is called by this utility.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BATCH_ROOT = ROOT / "production" / "batches"
OUTPUT_ROOT = ROOT / "out" / "short-studio"
TEMPLATE = ROOT / "kit" / "templates" / "blocky_short"
STYLES = ("blocky-3d", "monochrome", "what-if")
MAX_PER_TOPIC = 3


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug[:64] or "topic"


def write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Cannot read {path}: {exc}") from exc


def batch_path(batch_id: str) -> Path:
    path = BATCH_ROOT / slugify(batch_id)
    if not path.is_dir():
        raise SystemExit(f"Batch not found: {path}. Run the init command first.")
    return path


def load_batch(batch_id: str) -> tuple[Path, dict[str, Any]]:
    path = batch_path(batch_id)
    file = path / "manifest.json"
    manifest = read_json(file)
    return path, manifest


def locate_topic(manifest: dict[str, Any], topic_id: str) -> dict[str, Any]:
    key = slugify(topic_id)
    for topic in manifest["topics"]:
        if topic["id"] == key or slugify(topic["title"]) == key:
            return topic
    choices = ", ".join(t["id"] for t in manifest["topics"])
    raise SystemExit(f"Unknown topic '{topic_id}'. Available topic IDs: {choices}")


def locate_slot(topic: dict[str, Any], number: int) -> dict[str, Any]:
    if number < 1 or number > MAX_PER_TOPIC:
        raise SystemExit(f"Episode slot must be 1-{MAX_PER_TOPIC}.")
    for slot in topic["episodes"]:
        if slot["slot"] == number:
            return slot
    raise SystemExit(f"Slot {number} was not created for topic '{topic['id']}'.")


def slot_path(batch_dir: Path, topic: dict[str, Any], slot: dict[str, Any]) -> Path:
    return batch_dir / topic["id"] / f"short-{slot['slot']:02d}"


def read_text_arg(value: str | None, label: str, required: bool = False) -> str:
    if not value:
        if required:
            raise SystemExit(f"Provide {label} with --{label.replace(' ', '-')}.")
        return ""
    path = Path(value)
    if path.is_file():
        return path.read_text(encoding="utf-8").strip()
    return value.strip()


def command_init(args: argparse.Namespace) -> None:
    if args.limit < 1 or args.limit > MAX_PER_TOPIC:
        raise SystemExit(f"--limit must be between 1 and {MAX_PER_TOPIC}.")
    raw_topics = []
    if args.topics_file:
        source = Path(args.topics_file)
        if not source.is_file():
            raise SystemExit(f"Topics file not found: {source}")
        raw_topics.extend(line.strip() for line in source.read_text(encoding="utf-8").splitlines() if line.strip() and not line.lstrip().startswith("#"))
    if args.topics:
        raw_topics.extend(topic.strip() for topic in args.topics if topic.strip())
    if not raw_topics:
        raise SystemExit("Provide --topics-file or at least one --topics entry.")

    batch_id = slugify(args.batch_id or datetime.now(timezone.utc).strftime("batch-%Y%m%d-%H%M%S"))
    target = BATCH_ROOT / batch_id
    if target.exists():
        raise SystemExit(f"Batch already exists: {target}")
    titles: set[str] = set()
    topics = []
    for raw in raw_topics:
        title, _, notes = raw.partition("|")
        title = title.strip()
        if not title:
            continue
        base = slugify(title)
        topic_id = base
        suffix = 2
        while topic_id in titles:
            topic_id = f"{base}-{suffix}"
            suffix += 1
        titles.add(topic_id)
        episodes = [{"slot": i, "status": "empty", "theme": None, "renderer_slug": None} for i in range(1, args.limit + 1)]
        topics.append({"id": topic_id, "title": title, "notes": notes.strip(), "episodes": episodes})
    if not topics:
        raise SystemExit("No valid topics found.")

    manifest = {
        "schema_version": 1,
        "id": batch_id,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "profile": {"width": 1080, "height": 1920, "fps": 60, "container": "mp4", "video_codec": "h264"},
        "default_voice": "system-offline",
        "max_episodes_per_topic": MAX_PER_TOPIC,
        "topics": topics,
    }
    target.mkdir(parents=True)
    write_json(target / "manifest.json", manifest)
    for topic in topics:
        for slot in topic["episodes"]:
            folder = slot_path(target, topic, slot)
            folder.mkdir(parents=True, exist_ok=True)
            slot["directory"] = str(folder.relative_to(ROOT)).replace("\\", "/")
            project = folder / "project"
            shutil.copytree(TEMPLATE, project)
            (folder / "README.md").write_text(
                f"# {topic['title']} · short {slot['slot']:02d}\n\n"
                "Add the approved pitch, research notes, and script here. For blocky or monochrome videos, "
                "replace `project/shots.py` with the story-specific shot plan before preparation.\n",
                encoding="utf-8",
            )
    write_json(target / "manifest.json", manifest)
    print(target / "manifest.json")
    print(f"Created {len(topics)} topic(s), up to {args.limit} episode slot(s) each (hard maximum {MAX_PER_TOPIC}).")


def command_pitch(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}'. Create pitches only in empty or revise slots.")
    if args.theme not in STYLES:
        raise SystemExit(f"Theme must be one of: {', '.join(STYLES)}")
    title = read_text_arg(args.title, "title", required=True)
    hook = read_text_arg(args.hook, "hook", required=True)
    idea = read_text_arg(args.idea, "idea", required=True)
    script = read_text_arg(args.script, "script", required=True)
    research = read_text_arg(args.research, "research", required=True)
    caption = read_text_arg(args.caption, "caption")
    if len(script.split()) < 20:
        raise SystemExit("The script is unusually short; provide the complete narration before asking for approval.")
    folder = slot_path(batch_dir, topic, slot)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "pitch.md").write_text(f"# {title}\n\n**Topic:** {topic['title']}\n\n**Theme:** {args.theme}\n\n**Hook:** {hook}\n\n{idea}\n", encoding="utf-8")
    (folder / "script.md").write_text(script + "\n", encoding="utf-8")
    (folder / "research.md").write_text((research or "No research notes attached.\n") + "\n", encoding="utf-8")
    (folder / "post-caption.txt").write_text((caption or hook) + "\n", encoding="utf-8")
    slot.update({"status": "awaiting_approval", "theme": args.theme, "title": title, "hook": hook,
                 "renderer_slug": args.renderer_slug or slugify(title), "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds")})
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Pitch saved for {topic['id']} short {args.slot:02d}; status=awaiting_approval")


def command_decide(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    folder = slot_path(batch_dir, topic, slot)
    if slot["status"] != "awaiting_approval":
        raise SystemExit(f"Slot status is '{slot['status']}', expected awaiting_approval.")
    if args.decision == "approve":
        for name in ("pitch.md", "script.md", "research.md"):
            if not (folder / name).is_file() or not (folder / name).read_text(encoding="utf-8").strip():
                raise SystemExit(f"Cannot approve without {folder / name}")
        slot["status"] = "approved"
    elif args.decision == "revise":
        slot["status"] = "revise"
    else:
        slot["status"] = "skipped"
    slot["decision_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    slot["decision"] = args.decision
    write_json(batch_dir / "manifest.json", manifest)
    print(f"{topic['id']} short {args.slot:02d}: {slot['status']}")


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    print("$", " ".join(command))
    subprocess.run(command, cwd=cwd, env=env, check=True)


def command_prepare(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] != "approved":
        raise SystemExit("The user must approve the pitch and script before preparation.")
    folder = slot_path(batch_dir, topic, slot)
    py = sys.executable
    if slot["theme"] in ("blocky-3d", "monochrome"):
        project = folder / "project"
        shots_path = project / "shots.py"
        if not shots_path.is_file():
            raise SystemExit(f"Write the story-specific shot plan first: {shots_path}")
        env = dict(**__import__("os").environ)
        env["SHORT_STUDIO_VOICE"] = "system"
        run([py, str(ROOT / "kit" / "run.py"), str(project), "shots"], ROOT, env)
        spec_path = project / "timed.json"
        spec = read_json(spec_path)
        spec["theme"] = slot["theme"]
        write_json(spec_path, spec)
        run([py, str(ROOT / "kit" / "run.py"), str(project), "voice", "compile", "stills"], ROOT, env)
        slot["renderer_project"] = str(project.relative_to(ROOT)).replace("\\", "/")
    elif slot["theme"] == "what-if":
        slug = slot.get("renderer_slug") or slugify(slot["title"])
        ep = ROOT / "studio" / "src" / "episodes" / slug
        if not (ep / "episode.json").is_file() or not (ep / "shots.tsx").is_file() or not (ep / "index.tsx").is_file():
            raise SystemExit(f"Complete the vertical Remotion episode files first under {ep}")
        run([py, str(ROOT / "scripts" / "local_tts.py"), "--episode", slug], ROOT)
        studio = ROOT / "studio"
        run([py, str(ROOT / "scripts" / "plan.py"), slug], studio)
        npm = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
        run([npm, "run", "typecheck"], studio)
        run(["node", str(ROOT / "scripts" / "stills.mjs"), slug], studio)
        run([py, str(ROOT / "scripts" / "board.py"), slug], studio)
        slot["renderer_slug"] = slug
    else:
        raise SystemExit(f"Unsupported theme: {slot['theme']}")
    slot["status"] = "prepared"
    slot["prepared_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Prepared {topic['id']} short {args.slot:02d}; review the storyboard in {folder} before render.")


def command_render(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] != "prepared":
        raise SystemExit("Render is blocked until the approved script has been prepared.")
    py = sys.executable
    folder = slot_path(batch_dir, topic, slot)
    if slot["theme"] in ("blocky-3d", "monochrome"):
        project = ROOT / slot["renderer_project"]
        run([py, str(ROOT / "kit" / "run.py"), str(project), "render", "post"], ROOT)
        source = project / "out" / f"{project.name}.mp4"
    else:
        slug = slot["renderer_slug"]
        run([py, str(ROOT / "scripts" / "master.py"), slug], ROOT / "studio")
        source = ROOT / "studio" / "out" / slug / f"{slug}-final.mp4"
    if not source.is_file():
        raise SystemExit(f"Expected render was not created: {source}")
    destination = OUTPUT_ROOT / manifest["id"] / topic["id"] / f"short-{args.slot:02d}"
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / "final.mp4"
    shutil.copy2(source, target)
    for name in ("pitch.md", "script.md", "research.md", "post-caption.txt"):
        if (folder / name).is_file():
            shutil.copy2(folder / name, destination / name)
    if slot["theme"] in ("blocky-3d", "monochrome"):
        board = ROOT / slot["renderer_project"] / "stills_sheet.jpg"
    else:
        board = ROOT / "studio" / "out" / slot["renderer_slug"] / "storyboard.jpg"
    if board.is_file():
        shutil.copy2(board, destination / "storyboard.jpg")
    slot["status"] = "rendered"
    slot["output"] = str(target.relative_to(ROOT)).replace("\\", "/")
    slot["rendered_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)
    print(target)
    print("One 1080x1920 H.264 file is ready for TikTok, Instagram Reels, YouTube Shorts, and Facebook Reels.")


def command_status(args: argparse.Namespace) -> None:
    _, manifest = load_batch(args.batch_id)
    for topic in manifest["topics"]:
        rows = ", ".join(f"{slot['slot']}:{slot['status']}" for slot in topic["episodes"])
        print(f"{topic['id']} — {topic['title']} — {rows}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    init = sub.add_parser("init", help="create a multi-topic batch with up to three short slots per topic")
    init.add_argument("--batch-id")
    init.add_argument("--topics-file")
    init.add_argument("--topics", nargs="*")
    init.add_argument("--limit", type=int, default=3)
    init.set_defaults(func=command_init)

    pitch = sub.add_parser("pitch", help="save a researched idea and script for review")
    pitch.add_argument("--batch-id", required=True)
    pitch.add_argument("--topic", required=True)
    pitch.add_argument("--slot", type=int, required=True)
    pitch.add_argument("--theme", choices=STYLES, required=True)
    pitch.add_argument("--title", required=True)
    pitch.add_argument("--hook", required=True)
    pitch.add_argument("--idea", required=True, help="text or path to a text file")
    pitch.add_argument("--script", required=True, help="text or path to a text file")
    pitch.add_argument("--research", required=True, help="text or path to a research notes file")
    pitch.add_argument("--caption", help="text or path to a post caption")
    pitch.add_argument("--renderer-slug")
    pitch.set_defaults(func=command_pitch)

    decide = sub.add_parser("decide", help="record the user's approve, revise, or skip decision")
    decide.add_argument("--batch-id", required=True)
    decide.add_argument("--topic", required=True)
    decide.add_argument("--slot", type=int, required=True)
    decide.add_argument("--decision", choices=("approve", "revise", "skip"), required=True)
    decide.set_defaults(func=command_decide)

    prepare = sub.add_parser("prepare", help="prepare local voice and storyboard after approval")
    prepare.add_argument("--batch-id", required=True)
    prepare.add_argument("--topic", required=True)
    prepare.add_argument("--slot", type=int, required=True)
    prepare.set_defaults(func=command_prepare)

    render = sub.add_parser("render", help="render an approved, prepared episode")
    render.add_argument("--batch-id", required=True)
    render.add_argument("--topic", required=True)
    render.add_argument("--slot", type=int, required=True)
    render.set_defaults(func=command_render)

    status = sub.add_parser("status", help="show the current review and render queue")
    status.add_argument("--batch-id", required=True)
    status.set_defaults(func=command_status)
    return parser


if __name__ == "__main__":
    parsed = build_parser().parse_args()
    parsed.func(parsed)
