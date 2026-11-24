#!/usr/bin/env python3
"""Local batch manager for Short Studio.

This manages topic queues, initial episode slots, review state,
and the approved local render. Research and writing are performed by the agent
workflow; no generative API is called by this utility.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import statistics
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
BATCH_ROOT = ROOT / "production" / "batches"
OUTPUT_ROOT = ROOT / "out" / "short-studio"
TEMPLATE = ROOT / "kit" / "templates" / "blocky_short"
STYLES = ("blocky-3d", "monochrome", "what-if")
STORY_FORMATS = ("standalone", "choice-story")
TREATMENTS = ("character-led", "graphics-led", "hybrid")
TREATMENT_CHOICES = ("auto",) + TREATMENTS
INITIAL_MAX_PER_TOPIC = 3


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
    if number < 1:
        raise SystemExit("Episode slot must be a positive number.")
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
    if args.limit < 1 or args.limit > INITIAL_MAX_PER_TOPIC:
        raise SystemExit(f"--limit must be between 1 and {INITIAL_MAX_PER_TOPIC} for a new batch.")
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
        episodes = [{"slot": i, "status": "empty", "theme": None, "theme_confirmed": False,
                     "renderer_slug": None, "target_duration_seconds": None, "hook_highlights": [],
                     "story_format": None, "format_confirmed": False, "visual_treatment": None, "visual_treatment_mode": "auto", "treatment_confirmed": True, "call_to_action": None}
                    for i in range(1, args.limit + 1)]
        topics.append({"id": topic_id, "title": title, "notes": notes.strip(), "episodes": episodes})
    if not topics:
        raise SystemExit("No valid topics found.")

    manifest = {
        "schema_version": 1,
        "id": batch_id,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "profile": {"width": 1080, "height": 1920, "fps": 60, "container": "mp4", "video_codec": "h264"},
        "default_voice": "system-offline",
        "initial_episodes_per_topic": args.limit,
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
    print(f"Created {len(topics)} topic(s), up to {args.limit} episode slot(s) each (initial maximum {INITIAL_MAX_PER_TOPIC}).")


def command_pitch(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}'. Create pitches only in empty or revise slots.")
    if args.theme not in STYLES:
        raise SystemExit(f"Theme must be one of: {', '.join(STYLES)}")
    if not slot.get("theme_confirmed") or slot.get("theme") != args.theme:
        raise SystemExit("Choose and save the visual theme with set-theme before researching or pitching.")
    if not slot.get("target_duration_seconds"):
        raise SystemExit("Choose the target length with set-duration before researching or pitching.")
    if args.visual_treatment not in TREATMENTS:
        raise SystemExit(f"Selected visual treatment must be one of: {', '.join(TREATMENTS)}")
    if not slot.get("treatment_confirmed"):
        raise SystemExit("Set the visual treatment to auto or choose an override with set-treatment before pitching.")
    treatment_mode = slot.get("visual_treatment_mode", "auto")
    treatment_scorecard = ""
    if treatment_mode == "auto":
        treatment_scorecard = read_text_arg(args.treatment_scorecard, "treatment scorecard", required=True)
        validate_treatment_scorecard(treatment_scorecard, args.visual_treatment)
    elif slot.get("visual_treatment") != args.visual_treatment:
        raise SystemExit("Use the saved treatment or set a new override with set-treatment before pitching.")
    theme_confirmed = True
    if not slot.get("format_confirmed") or slot.get("story_format") != args.story_format:
        raise SystemExit("Choose and save this video's story format with set-format before researching or pitching.")
    title = read_text_arg(args.title, "title", required=True)
    hook = read_text_arg(args.hook, "hook", required=True)
    hook_highlights = [word.strip() for word in args.hook_highlights if word.strip()]
    hook_tokens = {word.strip(".,!?;:'\"()[]").casefold() for word in hook.split()}
    if len(hook_highlights) != 2 or any(word.casefold() not in hook_tokens for word in hook_highlights):
        raise SystemExit("Choose exactly two emphasis words that appear in the opening hook.")
    visual_plan = read_text_arg(args.visual_plan, "visual plan", required=True)
    validate_visual_plan(visual_plan)
    idea = read_text_arg(args.idea, "idea", required=True)
    script = read_text_arg(args.script, "script", required=True)
    research = read_text_arg(args.research, "research", required=True)
    caption = read_text_arg(args.caption, "caption")
    call_to_action = read_text_arg(args.call_to_action, "call to action", required=True)
    normalized_script = " ".join(script.casefold().split())
    normalized_cta = " ".join(call_to_action.casefold().split())
    if normalized_cta not in normalized_script:
        raise SystemExit("The exact call-to-action line must appear in the spoken script.")
    if len(script.split()) < 20:
        raise SystemExit("The script is unusually short; provide the complete narration before asking for approval.")
    folder = slot_path(batch_dir, topic, slot)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "pitch.md").write_text(f"# {title}\n\n**Topic:** {topic['title']}\n\n**Theme:** {args.theme}\n\n**Visual treatment:** {args.visual_treatment} ({'auto-selected' if treatment_mode == 'auto' else 'manual override'})\n\n**Format:** {args.story_format}\n\n**Hook:** {hook}\n\n**Call to action:** {call_to_action}\n\n{idea}\n", encoding="utf-8")
    (folder / "visual-plan.md").write_text(visual_plan + "\n", encoding="utf-8")
    if treatment_scorecard:
        (folder / "treatment-scorecard.md").write_text(treatment_scorecard + "\n", encoding="utf-8")
    (folder / "script.md").write_text(script + "\n", encoding="utf-8")
    (folder / "research.md").write_text((research or "No research notes attached.\n") + "\n", encoding="utf-8")
    (folder / "post-caption.txt").write_text((caption or f"{hook}\n\n{call_to_action}") + "\n", encoding="utf-8")
    slot.update({"status": "awaiting_approval", "theme": args.theme, "theme_confirmed": theme_confirmed,
                 "title": title, "hook": hook, "hook_highlights": hook_highlights,
                 "story_format": args.story_format, "format_confirmed": True, "visual_treatment": args.visual_treatment, "visual_treatment_mode": treatment_mode, "treatment_confirmed": True, "call_to_action": call_to_action,
                 "renderer_slug": args.renderer_slug or slugify(title), "research_updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds")})
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Pitch saved for {topic['id']} short {args.slot:02d}; status=awaiting_approval")


def command_decide(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    folder = slot_path(batch_dir, topic, slot)
    if slot["status"] != "awaiting_approval":
        raise SystemExit(f"Slot status is '{slot['status']}', expected awaiting_approval.")
    if args.decision == "approve" and not slot.get("theme_confirmed", False):
        raise SystemExit("Choose and save a theme with the set-theme command before approval.")
    if args.decision == "approve" and not slot.get("target_duration_seconds"):
        raise SystemExit("Choose and save a target length with the set-duration command before approval.")
    if args.decision == "approve" and not slot.get("format_confirmed"):
        raise SystemExit("Choose and save a story format with the set-format command before approval.")
    if args.decision == "approve" and not slot.get("treatment_confirmed"):
        raise SystemExit("Set the visual treatment to auto or choose an override before approval.")
    if args.decision == "approve" and not slot.get("call_to_action"):
        raise SystemExit("Add a spoken call to action before approval.")
    if args.decision == "approve":
        required = ["pitch.md", "script.md", "research.md", "visual-plan.md"]
        if slot.get("visual_treatment_mode", "auto") == "auto":
            required.append("treatment-scorecard.md")
        for name in required:
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



def validate_treatment_scorecard(scorecard: str, selected: str) -> None:
    scores: dict[str, int] = {}
    for treatment in TREATMENTS:
        match = re.search(rf"(?m)^\s*{re.escape(treatment)}\s*:\s*topic=(\d),\s*story=(\d),\s*reference=(\d)\s*$", scorecard)
        if not match:
            raise SystemExit(f"Treatment scorecard needs a '{treatment}: topic=0, story=0, reference=0' row.")
        parts = [int(value) for value in match.groups()]
        if any(value > 2 for value in parts):
            raise SystemExit("Each treatment-fit score must be between 0 and 2.")
        scores[treatment] = sum(parts)
    if "evidence:" not in scorecard.casefold() or "why:" not in scorecard.casefold():
        raise SystemExit("Treatment scorecard must include evidence and why sections grounded in this video's research.")
    highest = max(scores.values())
    if scores["hybrid"] >= highest - 1 or scores["character-led"] == scores["graphics-led"]:
        recommended = "hybrid"
    else:
        recommended = max(("character-led", "graphics-led"), key=lambda name: scores[name])
    if selected != recommended:
        raise SystemExit(f"Scorecard recommends {recommended} (character {scores['character-led']}/6, graphics {scores['graphics-led']}/6, hybrid {scores['hybrid']}/6); set --visual-treatment to that choice or use a manual override.")


def validate_visual_plan(plan: str) -> None:
    beats = [line for line in plan.splitlines() if re.match(r"^\s*(?:\d+[.)]|[-*])\s+\S", line)]
    if not 5 <= len(beats) <= 7:
        raise SystemExit(f"Visual plan must have 5–7 numbered or bulleted key-image beats; found {len(beats)}.")


def validate_duration(actual: float, target: int, stage: str) -> None:
    tolerance = max(3.0, target * 0.08)
    if abs(actual - target) > tolerance:
        raise SystemExit(
            f"{stage} is {actual:.1f}s; target is {target}s (allowed difference {tolerance:.1f}s). "
            "Revise the script or scene timing before continuing."
        )


def validate_blocky_story_plan(spec: dict[str, Any], topic: dict[str, Any], slot: dict[str, Any]) -> None:
    if spec.get("_starter_template") is True:
        raise SystemExit(
            "This is still the generic starter scene. Replace the starter shot plan with original scenes "
            "for the approved story, then prepare again."
        )
    if slugify(spec.get("story_title", "")) != slugify(slot.get("title", "")):
        raise SystemExit("Set story_title in shots.py to the approved pitch title before preparation.")
    if slugify(spec.get("story_topic", "")) != slugify(topic.get("title", "")):
        raise SystemExit("Set story_topic in shots.py to this batch topic before preparation.")

    shots = spec.get("shots")
    if not isinstance(shots, list) or not shots:
        raise SystemExit("The story-specific shot plan must contain shots.")
    target = int(slot.get("target_duration_seconds") or spec.get("dur", 0))
    minimum = max(4, (target + 7) // 8)
    if len(shots) < minimum:
        raise SystemExit(
            f"The {target}s plan has {len(shots)} shots; use at least {minimum} story beats "
            "(about one visual change every 6–8 seconds)."
        )
    cameras = {str(shot.get("cam", "ms")) for shot in shots if isinstance(shot, dict)}
    if len(cameras) < 2:
        raise SystemExit("Vary the camera framing across at least two shots before preparation.")
    actions = set()
    for shot in shots:
        if not isinstance(shot, dict):
            continue
        for actor in shot.get("actors", []):
            if not isinstance(actor, dict):
                continue
            if actor.get("anim"):
                actions.add(str(actor["anim"]))
            for event in actor.get("animAt", []):
                if isinstance(event, (list, tuple)) and len(event) > 1:
                    actions.add(str(event[1]))
    if len(actions) < 2:
        raise SystemExit("Give the cast at least two distinct actions across the story shot plan.")


def _storyboard_review_files(slot: dict[str, Any]) -> tuple[Path, list[Path]]:
    if slot.get("theme") in ("blocky-3d", "monochrome"):
        project = ROOT / slot.get("renderer_project", "")
        return project / "stills_sheet.jpg", [project / "shots.py", project / "timed.json"]
    if slot.get("theme") == "what-if":
        slug = slot.get("renderer_slug") or slugify(slot.get("title", ""))
        episode = ROOT / "studio" / "src" / "episodes" / slug
        studio_out = ROOT / "studio" / "out" / slug
        return studio_out / "storyboard.jpg", [
            episode / "episode.json",
            episode / "shots.tsx",
            episode / "index.tsx",
            episode / "timeline.json",
            ROOT / "studio" / "src" / "episodes" / "index.ts",
        ]
    raise SystemExit(f"Unsupported storyboard theme: {slot.get('theme')}")


def _fingerprint_files(paths: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in paths:
        if not path.is_file():
            raise SystemExit(f"Storyboard review input is missing: {path}")
        digest.update(str(path.relative_to(ROOT)).encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def _current_storyboard_fingerprint(slot: dict[str, Any]) -> tuple[Path, str, str]:
    board, sources = _storyboard_review_files(slot)
    if not board.is_file():
        raise SystemExit(f"Storyboard is missing: {board}. Run prepare again.")
    source_fingerprint = _fingerprint_files(sources)
    full_fingerprint = _fingerprint_files([board, *sources])
    return board, source_fingerprint, full_fingerprint


def run(command: list[str], cwd: Path, env: dict[str, str] | None = None) -> None:
    print("$", " ".join(command), flush=True)
    started = time.monotonic()
    subprocess.run(command, cwd=cwd, env=env, check=True)
    print(f"   completed in {time.monotonic() - started:.1f}s", flush=True)


def command_prepare(args: argparse.Namespace) -> None:
    prepare_started = time.monotonic()
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("approved", "storyboard_ready"):
        raise SystemExit("Approve the pitch first, or revise the current storyboard before preparing.")
    eta = _stage_eta(manifest, slot, "prepare_duration_seconds")
    if eta is None:
        print("No comparable local preparation timing yet. Voice and storyboard preparation is roughly 2–10 minutes per video; the first run is unbenchmarked.")
    else:
        print(f"Estimated voice and storyboard preparation time from comparable local videos: about {eta / 60:.1f} minutes (rough estimate).")
    folder = slot_path(batch_dir, topic, slot)
    py = sys.executable
    if slot["theme"] in ("blocky-3d", "monochrome"):
        project = folder / "project"
        shots_path = project / "shots.py"
        if not shots_path.is_file():
            raise SystemExit(f"Write the story-specific shot plan first: {shots_path}")
        starter_path = TEMPLATE / "shots.py"
        shot_source = shots_path.read_text(encoding="utf-8")
        if (starter_path.is_file() and shots_path.read_bytes() == starter_path.read_bytes()) or "STARTER_TEMPLATE = True" in shot_source:
            raise SystemExit(
                f"{shots_path} is still marked as the starter scene. Replace it with the approved story's shot plan."
            )
        env = dict(**__import__("os").environ)
        env["SHORT_STUDIO_VOICE"] = "system"
        run([py, str(ROOT / "kit" / "run.py"), str(project), "shots"], ROOT, env)
        spec_path = project / "timed.json"
        spec = read_json(spec_path)
        validate_blocky_story_plan(spec, topic, slot)
        target_duration = slot.get("target_duration_seconds")
        if target_duration is not None:
            validate_duration(float(spec.get("dur", 0)), int(target_duration), "Blender scene")
        spec["theme"] = slot["theme"]
        spec["visual_treatment"] = slot.get("visual_treatment", "character-led")
        spec["hook"] = slot.get("hook", "")
        spec["hook_highlights"] = slot.get("hook_highlights", [])
        spec["hook_duration_seconds"] = 1.5
        spec["cta"] = slot.get("call_to_action", "")
        spec["cta_duration_seconds"] = 3.5
        write_json(spec_path, spec)
        run([py, str(ROOT / "kit" / "run.py"), str(project), "voice", "compile", "stills"], ROOT, env)
        slot["renderer_project"] = str(project.relative_to(ROOT)).replace("\\", "/")
    elif slot["theme"] == "what-if":
        slug = slot.get("renderer_slug") or slugify(slot["title"])
        ep = ROOT / "studio" / "src" / "episodes" / slug
        if not (ep / "episode.json").is_file() or not (ep / "shots.tsx").is_file() or not (ep / "index.tsx").is_file():
            raise SystemExit(f"Complete the vertical Remotion episode files first under {ep}")
        studio = ROOT / "studio"
        registry_path = studio / "src" / "episodes" / "index.ts"
        if not registry_path.is_file():
            raise SystemExit(f"Episode registry is missing: {registry_path}")
        registry = registry_path.read_text(encoding="utf-8")
        import_match = re.search(
            r"import\s+\{\s*([A-Za-z_$][\w$]*)\s*\}\s+from\s+['\"]\./" + re.escape(slug) + r"['\"]",
            registry,
        )
        episode_list = re.search(r"export\s+const\s+EPISODES\s*=\s*\[([^\]]*)\]", registry, re.S)
        if not import_match or not episode_list or import_match.group(1) not in re.findall(r"[A-Za-z_$][\w$]*", episode_list.group(1)):
            raise SystemExit(
                f"Register {slug} in {registry_path}: import its named episode and add it to EPISODES."
            )
        episode_path = ep / "episode.json"
        episode = read_json(episode_path)
        episode["hook"] = slot.get("hook", "")
        episode["hook_highlights"] = slot.get("hook_highlights", [])
        episode["hook_duration_seconds"] = 1.5
        episode["cta"] = slot.get("call_to_action", "")
        episode["cta_duration_seconds"] = 3.5
        write_json(episode_path, episode)
        run([py, str(ROOT / "scripts" / "local_tts.py"), "--episode", slug], ROOT)
        run([py, str(ROOT / "scripts" / "plan.py"), slug], studio)
        target_duration = slot.get("target_duration_seconds")
        timeline = read_json(ep / "timeline.json")
        if target_duration is not None:
            timeline_fps = float(timeline.get("fps", 0))
            if timeline_fps <= 0:
                raise SystemExit(f"Invalid timeline fps in {ep / 'timeline.json'}")
            validate_duration(float(timeline.get("total", 0)) / timeline_fps, int(target_duration), "Remotion timeline")
        npm = shutil.which("npm.cmd") or shutil.which("npm") or "npm"
        run([npm, "run", "typecheck"], studio)
        run(["node", str(ROOT / "scripts" / "stills.mjs"), slug], studio)
        run(["node", str(ROOT / "scripts" / "stills.mjs"), slug, "--frames", "0"], studio)
        run([py, str(ROOT / "scripts" / "board.py"), slug], studio)
        slot["renderer_slug"] = slug
    else:
        raise SystemExit(f"Unsupported theme: {slot['theme']}")
    _, source_fingerprint, _ = _current_storyboard_fingerprint(slot)
    slot["status"] = "storyboard_ready"
    slot["prepare_duration_seconds"] = round(time.monotonic() - prepare_started, 1)
    slot["prepared_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    slot["storyboard_reviewed"] = False
    slot["prepared_source_fingerprint"] = source_fingerprint
    slot.pop("storyboard_fingerprint", None)
    slot.pop("storyboard_reviewed_at", None)
    for key in ("preview", "preview_audio_qa", "previewed_at", "preview_duration_seconds",
                "preview_reviewed", "preview_fingerprint", "preview_decision", "preview_decision_at"):
        slot.pop(key, None)
    write_json(batch_dir / "manifest.json", manifest)
    board, _, _ = _current_storyboard_fingerprint(slot)
    print(f"Storyboard ready for {topic['id']} short {args.slot:02d}: {board}")
    print(f"Voice and storyboard preparation took {slot['prepare_duration_seconds'] / 60:.1f} minutes.")
    print("Show the storyboard to the user. Render stays blocked until review-storyboard --decision approve.")


def command_review_storyboard(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("storyboard_ready", "prepared"):
        raise SystemExit(
            f"Slot status is '{slot['status']}', expected storyboard_ready. Run prepare first."
        )
    board, source_fingerprint, full_fingerprint = _current_storyboard_fingerprint(slot)
    prepared_source = slot.get("prepared_source_fingerprint")
    if prepared_source and prepared_source != source_fingerprint:
        if args.decision == "approve":
            raise SystemExit(
                "The shot plan or render source changed after the storyboard was built. "
                "Run review-storyboard --decision revise, then prepare and review the new storyboard."
            )
        slot["status"] = "approved"
        slot["storyboard_reviewed"] = False
        slot.pop("storyboard_fingerprint", None)
        slot.pop("prepared_source_fingerprint", None)
        slot.pop("storyboard_reviewed_at", None)
        slot["storyboard_decision"] = "revise"
        slot["storyboard_decision_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        write_json(batch_dir / "manifest.json", manifest)
        print("Storyboard marked for revision because its source changed. Run prepare to build a matching preview.")
        return
    if args.decision == "approve":
        slot["status"] = "prepared"
        slot["storyboard_reviewed"] = True
        slot["storyboard_fingerprint"] = full_fingerprint
        slot["prepared_source_fingerprint"] = source_fingerprint
        slot["storyboard_reviewed_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        print(f"Storyboard approved for {topic['id']} short {args.slot:02d}: {board}")
    else:
        slot["status"] = "approved"
        slot["storyboard_reviewed"] = False
        slot.pop("storyboard_fingerprint", None)
        slot.pop("prepared_source_fingerprint", None)
        slot.pop("storyboard_reviewed_at", None)
        print(f"Storyboard needs changes for {topic['id']} short {args.slot:02d}; edit the plan, then prepare again.")
    slot["storyboard_decision"] = args.decision
    write_json(batch_dir / "manifest.json", manifest)


def _approved_render_slot(args: argparse.Namespace) -> tuple[Path, dict[str, Any], dict[str, Any], dict[str, Any], Path]:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] != "prepared":
        raise SystemExit("Rendering is blocked until the storyboard has been explicitly approved.")
    expected_fingerprint = slot.get("storyboard_fingerprint")
    if not expected_fingerprint:
        raise SystemExit("Review this storyboard first with review-storyboard --decision approve.")
    _, _, current_fingerprint = _current_storyboard_fingerprint(slot)
    if current_fingerprint != expected_fingerprint:
        raise SystemExit(
            "The storyboard or its source files changed after approval. Review the current storyboard again "
            "before rendering."
        )
    return batch_dir, manifest, topic, slot, slot_path(batch_dir, topic, slot)


def _narration_source(slot: dict[str, Any]) -> Path:
    if slot["theme"] in ("blocky-3d", "monochrome"):
        return ROOT / slot["renderer_project"] / "vo.wav"
    slug = slot.get("renderer_slug") or slugify(slot.get("title", ""))
    return ROOT / "studio" / "public" / slug / "voice.wav"


def command_preview(args: argparse.Namespace) -> None:
    batch_dir, manifest, topic, slot, folder = _approved_render_slot(args)
    preview_started = time.monotonic()
    eta = _stage_eta(manifest, slot, "preview_duration_seconds")
    if eta is None:
        print("No comparable local preview timing yet. This half-resolution 540x960 preview is unbenchmarked on this computer.")
    else:
        print(f"Estimated preview time from comparable local videos: about {eta / 60:.1f} minutes (rough estimate).")
    py = sys.executable
    if slot["theme"] in ("blocky-3d", "monochrome"):
        project = ROOT / slot["renderer_project"]
        run([py, str(ROOT / "kit" / "run.py"), str(project), "preview"], ROOT)
        source = project / "out" / f"{project.name}-preview.mp4"
    else:
        slug = slot["renderer_slug"]
        run([py, str(ROOT / "scripts" / "master.py"), slug, "--preview"], ROOT / "studio")
        source = ROOT / "studio" / "out" / slug / f"{slug}-preview-final.mp4"
    if not source.is_file():
        raise SystemExit(f"Expected review preview was not created: {source}")
    qa = folder / "audio-qa-preview.md"
    qa_command = [py, str(ROOT / "scripts" / "quality" / "audio_qa.py"), str(source),
                  "--report", str(qa), "--voice-source", str(_narration_source(slot))]
    print("$", " ".join(qa_command), flush=True)
    qa_started = time.monotonic()
    qa_result = subprocess.run(qa_command, cwd=ROOT, check=False)
    print(f"   audio check completed in {time.monotonic() - qa_started:.1f}s", flush=True)
    destination = OUTPUT_ROOT / manifest["id"] / topic["id"] / f"short-{args.slot:02d}"
    destination.mkdir(parents=True, exist_ok=True)
    preview_target = destination / "preview.mp4"
    shutil.copy2(source, preview_target)
    shutil.copy2(qa, destination / "audio-qa-preview.md")
    slot["preview"] = str(preview_target.relative_to(ROOT)).replace("\\", "/")
    slot["preview_audio_qa"] = str((destination / "audio-qa-preview.md").relative_to(ROOT)).replace("\\", "/")
    slot["previewed_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    slot["preview_duration_seconds"] = round(time.monotonic() - preview_started, 1)
    slot["preview_reviewed"] = False
    slot.pop("preview_fingerprint", None)
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Preview ready: {preview_target}; preview render took {slot['preview_duration_seconds']:.1f}s")
    if qa_result.returncode:
        print("Audio QA failed. You can still listen to diagnose it, but final rendering stays blocked until the audio is fixed and a new preview passes.")
    print("Listen to the narration and check timing. If it is good and the audio report passes, run review-preview --decision approve. The 540x960 preview does not replace the 1080x1920 final render.")


def _stage_eta(manifest: dict[str, Any], slot: dict[str, Any], duration_key: str) -> float | None:
    theme = slot.get("theme")
    target = float(slot.get("target_duration_seconds") or 0)
    samples = []
    for topic in manifest.get("topics", []):
        for previous in topic.get("episodes", []):
            if previous is slot or previous.get("theme") != theme:
                continue
            seconds = previous.get(duration_key)
            duration = float(previous.get("target_duration_seconds") or 0)
            if seconds and duration > 0:
                samples.append(float(seconds) * target / duration)
    return statistics.median(samples) if samples else None


def _render_eta(manifest: dict[str, Any], slot: dict[str, Any]) -> float | None:
    return _stage_eta(manifest, slot, "render_duration_seconds")


def _current_preview_fingerprint(slot: dict[str, Any], require_pass: bool = True) -> str:
    preview = ROOT / slot.get("preview", "")
    report = ROOT / slot.get("preview_audio_qa", "")
    if not preview.is_file() or not report.is_file():
        raise SystemExit("Create the review preview first with preview, then listen to it.")
    if require_pass and "**RESULT: PASS**" not in report.read_text(encoding="utf-8"):
        raise SystemExit("Preview audio QA did not pass. Fix the narration/audio and create a fresh preview.")
    return _fingerprint_files([preview, report, _narration_source(slot)])


def command_review_preview(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot.get("status") != "prepared":
        raise SystemExit("Prepare and approve the storyboard before reviewing its audio preview.")
    fingerprint = _current_preview_fingerprint(slot, require_pass=args.decision == "approve")
    if args.decision == "approve":
        slot["preview_reviewed"] = True
        slot["preview_fingerprint"] = fingerprint
        print("Preview approved. The final render is now available.")
    else:
        slot["status"] = "approved"
        slot["preview_reviewed"] = False
        slot.pop("preview_fingerprint", None)
        slot.pop("storyboard_fingerprint", None)
        slot.pop("prepared_source_fingerprint", None)
        slot.pop("storyboard_reviewed_at", None)
        print("Preview needs changes. Update the voice or shot plan, then prepare, review, and preview again.")
    slot["preview_decision"] = args.decision
    slot["preview_decision_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)


def command_render(args: argparse.Namespace) -> None:
    batch_dir, manifest, topic, slot, folder = _approved_render_slot(args)
    if not slot.get("preview_reviewed"):
        raise SystemExit("Listen to the approved storyboard preview, then run review-preview --decision approve.")
    current_preview = _current_preview_fingerprint(slot)
    if current_preview != slot.get("preview_fingerprint"):
        raise SystemExit("The preview or its audio report changed after approval. Review the current preview again.")
    py = sys.executable
    eta = _render_eta(manifest, slot)
    if eta is None:
        print("No comparable local render timing yet. A 30–60s, 60 fps short contains 1,800–3,600 frames; first blocky 3D renders can take tens of minutes and may approach 50 minutes on some computers.")
    else:
        print(f"Estimated render time from this batch's similar local renders: about {eta / 60:.1f} minutes (rough estimate).")
    render_started = time.monotonic()
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
    slot["render_duration_seconds"] = round(time.monotonic() - render_started, 1)
    target_duration = slot.get("target_duration_seconds")
    if target_duration is not None:
        measured = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(source)],
            check=True, capture_output=True, text=True,
        )
        validate_duration(float(measured.stdout.strip()), int(target_duration), "Rendered MP4")
    qa = folder / "audio-qa.md"
    run([py, str(ROOT / "scripts" / "quality" / "audio_qa.py"), str(source),
         "--report", str(qa), "--voice-source", str(_narration_source(slot))], ROOT)
    destination = OUTPUT_ROOT / manifest["id"] / topic["id"] / f"short-{args.slot:02d}"
    destination.mkdir(parents=True, exist_ok=True)
    target = destination / "final.mp4"
    shutil.copy2(source, target)
    for name in ("pitch.md", "script.md", "research.md", "post-caption.txt", "visual-plan.md", "treatment-scorecard.md", "audio-qa.md"):
        if (folder / name).is_file():
            shutil.copy2(folder / name, destination / name)
    if slot["theme"] in ("blocky-3d", "monochrome"):
        board = ROOT / slot["renderer_project"] / "stills_sheet.jpg"
    else:
        board = ROOT / "studio" / "out" / slot["renderer_slug"] / "storyboard.jpg"
    if board.is_file():
        shutil.copy2(board, destination / "storyboard.jpg")
    if slot["theme"] == "what-if":
        first_frame = ROOT / "studio" / "out" / slot["renderer_slug"] / "frames" / "f0000.png"
        if first_frame.is_file():
            shutil.copy2(first_frame, destination / "frame-one.png")
    slot["status"] = "rendered"
    slot["output"] = str(target.relative_to(ROOT)).replace("\\", "/")
    slot["rendered_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)
    print(target)
    print(f"Full render took {slot['render_duration_seconds'] / 60:.1f} minutes.")
    print("One 1080x1920 H.264 file is ready for TikTok, Instagram Reels, YouTube Shorts, and Facebook Reels.")


def command_status(args: argparse.Namespace) -> None:
    _, manifest = load_batch(args.batch_id)
    for topic in manifest["topics"]:
        rows = ", ".join(f"{slot['slot']}:{slot['status']}" for slot in topic["episodes"])
        print(f"{topic['id']} — {topic['title']} — {rows}")



def command_add(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    if args.count < 1:
        raise SystemExit("--count must be at least 1.")
    if args.topic.casefold() == "all":
        topics = manifest["topics"]
    else:
        topics = [locate_topic(manifest, args.topic)]
    if not TEMPLATE.is_dir():
        raise SystemExit(f"Short template is missing: {TEMPLATE}")

    planned = []
    for topic in topics:
        next_slot = max((slot["slot"] for slot in topic["episodes"]), default=0) + 1
        for offset in range(args.count):
            number = next_slot + offset
            slot = {
                "slot": number, "status": "empty", "theme": None, "theme_confirmed": False,
                "renderer_slug": None, "target_duration_seconds": None, "hook_highlights": [],
                "story_format": None, "format_confirmed": False, "visual_treatment": None, "visual_treatment_mode": "auto", "treatment_confirmed": True, "call_to_action": None,
            }
            folder = slot_path(batch_dir, topic, slot)
            if folder.exists():
                raise SystemExit(f"Refusing to overwrite an existing slot folder: {folder}")
            planned.append((topic, slot, folder))

    created = []
    added = []
    try:
        for topic, slot, folder in planned:
            folder.mkdir(parents=True, exist_ok=False)
            created.append(folder)
            slot["directory"] = str(folder.relative_to(ROOT)).replace("\\", "/")
            shutil.copytree(TEMPLATE, folder / "project")
            (folder / "README.md").write_text(
                f"# {topic['title']} · short {slot['slot']:02d}\n\n"
                "Research this new video from scratch. Ask the user for a theme and 30–60 second target first.\n",
                encoding="utf-8",
            )
            topic["episodes"].append(slot)
            added.append(f"{topic['id']} short {slot['slot']:02d}")
        write_json(batch_dir / "manifest.json", manifest)
    except Exception:
        for topic, slot, folder in planned:
            if slot in topic["episodes"]:
                topic["episodes"].remove(slot)
        for folder in reversed(created):
            shutil.rmtree(folder, ignore_errors=True)
        raise
    print(f"Added {len(added)} slot(s): {', '.join(added)}")


def command_set_format(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}', expected empty or revise.")
    if args.story_format not in STORY_FORMATS:
        raise SystemExit(f"Format must be one of: {', '.join(STORY_FORMATS)}")
    slot["story_format"] = args.story_format
    slot["format_confirmed"] = True
    slot["format_selected_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Story format for {topic['id']} short {args.slot:02d} set to {args.story_format}.")


def command_set_duration(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}', expected empty or revise. Use revise to refresh the pitch first.")
    if args.seconds < 30 or args.seconds > 60:
        raise SystemExit("Target duration must be between 30 and 60 seconds.")
    slot["target_duration_seconds"] = args.seconds
    slot["duration_selected_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Target duration for {topic['id']} short {args.slot:02d} set to {args.seconds}s.")


def command_list(args: argparse.Namespace) -> None:
    manifests = sorted(
        BATCH_ROOT.glob("*/manifest.json"),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not manifests:
        print("No saved batches.")
        return
    for manifest_path in manifests:
        manifest = read_json(manifest_path)
        batch_id = manifest.get("id", manifest_path.parent.name)
        print(f"{batch_id}  (created {manifest.get('created_at', 'unknown')})")
        for topic in manifest.get("topics", []):
            states = ", ".join(
                f"{slot['slot']}:{slot['status']}" for slot in topic.get("episodes", [])
            )
            print(f"  {topic['id']} — {topic['title']} — {states}")


def command_rename(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    old_id = manifest["id"]
    new_id = slugify(args.new_name)
    if new_id == old_id:
        print(f"Batch is already named '{old_id}'.")
        return

    target_dir = BATCH_ROOT / new_id
    old_output_dir = OUTPUT_ROOT / old_id
    new_output_dir = OUTPUT_ROOT / new_id
    if target_dir.exists():
        raise SystemExit(f"Batch already exists: {target_dir}")
    if new_output_dir.exists():
        raise SystemExit(f"An output folder already exists for '{new_id}': {new_output_dir}")

    old_batch_prefix = f"production/batches/{old_id}"
    new_batch_prefix = f"production/batches/{new_id}"
    old_output_prefix = f"out/short-studio/{old_id}"
    new_output_prefix = f"out/short-studio/{new_id}"
    for topic in manifest.get("topics", []):
        for slot in topic.get("episodes", []):
            for key, old_prefix, new_prefix in (
                ("directory", old_batch_prefix, new_batch_prefix),
                ("renderer_project", old_batch_prefix, new_batch_prefix),
                ("output", old_output_prefix, new_output_prefix),
            ):
                value = slot.get(key)
                if isinstance(value, str) and (value == old_prefix or value.startswith(old_prefix + "/")):
                    slot[key] = new_prefix + value[len(old_prefix):]
    manifest["id"] = new_id

    batch_dir.rename(target_dir)
    output_moved = False
    try:
        if old_output_dir.exists():
            old_output_dir.rename(new_output_dir)
            output_moved = True
        write_json(target_dir / "manifest.json", manifest)
    except Exception:
        if output_moved:
            new_output_dir.rename(old_output_dir)
        target_dir.rename(batch_dir)
        raise
    print(f"Renamed batch '{old_id}' to '{new_id}'. Existing queue and outputs were moved in place.")


def command_set_theme(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}', expected empty or revise. Use revise to refresh the pitch first.")
    if args.theme not in STYLES:
        raise SystemExit(f"Theme must be one of: {', '.join(STYLES)}")
    folder = slot_path(batch_dir, topic, slot)
    pitch_path = folder / "pitch.md"
    if pitch_path.is_file():
        pitch = pitch_path.read_text(encoding="utf-8")
        theme_line = re.compile(r"(?m)^\*\*Theme:\*\* .+$")
        if not theme_line.search(pitch):
            raise SystemExit(f"Pitch has no theme line to update: {pitch_path}")
        pitch_path.write_text(theme_line.sub(f"**Theme:** {args.theme}", pitch, count=1), encoding="utf-8")
    slot.update({
        "theme": args.theme,
        "theme_confirmed": True,
        "theme_selected_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Theme for {topic['id']} short {args.slot:02d} set to {args.theme}.")


def command_set_treatment(args: argparse.Namespace) -> None:
    batch_dir, manifest = load_batch(args.batch_id)
    topic = locate_topic(manifest, args.topic)
    slot = locate_slot(topic, args.slot)
    if slot["status"] not in ("empty", "revise"):
        raise SystemExit(f"Slot status is '{slot['status']}', expected empty or revise. Use revise to refresh the pitch first.")
    if args.treatment not in TREATMENT_CHOICES:
        raise SystemExit(f"Treatment must be one of: {', '.join(TREATMENT_CHOICES)}")
    folder = slot_path(batch_dir, topic, slot)
    pitch_path = folder / "pitch.md"
    if pitch_path.is_file():
        pitch = pitch_path.read_text(encoding="utf-8")
        treatment_line = re.compile(r"(?m)^\*\*Visual treatment:\*\* .+$")
        display = "automatic (research-scored)" if args.treatment == "auto" else f"{args.treatment} (manual override)"
        if treatment_line.search(pitch):
            pitch = treatment_line.sub(f"**Visual treatment:** {display}", pitch, count=1)
        else:
            theme_line = re.compile(r"(?m)^\*\*Theme:\*\* .+$")
            pitch = theme_line.sub(lambda match: match.group(0) + f"\n\n**Visual treatment:** {display}", pitch, count=1)
        pitch_path.write_text(pitch, encoding="utf-8")
    slot.update({
        "visual_treatment": None if args.treatment == "auto" else args.treatment,
        "visual_treatment_mode": "auto" if args.treatment == "auto" else "manual",
        "treatment_confirmed": True,
        "treatment_selected_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    write_json(batch_dir / "manifest.json", manifest)
    print(f"Visual treatment for {topic['id']} short {args.slot:02d} set to {args.treatment}.")


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
    pitch.add_argument("--hook-highlights", nargs=2, required=True, help="two words from the hook to emphasize")
    pitch.add_argument("--story-format", choices=STORY_FORMATS, required=True)
    pitch.add_argument("--visual-treatment", choices=TREATMENTS, required=True, help="final treatment selected by the research scorecard or manual override")
    pitch.add_argument("--treatment-scorecard", help="required for automatic mode; path or text with the 3-mode fit scores and research evidence")
    pitch.add_argument("--visual-plan", required=True, help="path or text with 5–7 numbered visual beats, written before the script")
    pitch.add_argument("--call-to-action", required=True, help="spoken CTA line; must also appear in --script")
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

    storyboard_review = sub.add_parser("review-storyboard", help="approve a storyboard or request shot-plan changes")
    storyboard_review.add_argument("--batch-id", required=True)
    storyboard_review.add_argument("--topic", required=True)
    storyboard_review.add_argument("--slot", type=int, required=True)
    storyboard_review.add_argument("--decision", choices=("approve", "revise"), required=True)
    storyboard_review.set_defaults(func=command_review_storyboard)

    preview = sub.add_parser("preview", help="make a quick half-resolution preview with narration for listening")
    preview.add_argument("--batch-id", required=True)
    preview.add_argument("--topic", required=True)
    preview.add_argument("--slot", type=int, required=True)
    preview.set_defaults(func=command_preview)

    preview_review = sub.add_parser("review-preview", help="approve the audio preview or request a revision")
    preview_review.add_argument("--batch-id", required=True)
    preview_review.add_argument("--topic", required=True)
    preview_review.add_argument("--slot", type=int, required=True)
    preview_review.add_argument("--decision", choices=("approve", "revise"), required=True)
    preview_review.set_defaults(func=command_review_preview)

    render = sub.add_parser("render", help="render only after storyboard and audio preview approval")
    render.add_argument("--batch-id", required=True)
    render.add_argument("--topic", required=True)
    render.add_argument("--slot", type=int, required=True)
    render.set_defaults(func=command_render)

    status = sub.add_parser("status", help="show the current review and render queue")
    status.add_argument("--batch-id", required=True)
    status.set_defaults(func=command_status)

    add = sub.add_parser("add", help="add new slot(s) to one topic or every topic in a saved batch")
    add.add_argument("--batch-id", required=True)
    add.add_argument("--topic", required=True, help="topic ID or 'all'")
    add.add_argument("--count", type=int, default=1, help="new slots per selected topic")
    add.set_defaults(func=command_add)

    set_format = sub.add_parser("set-format", help="choose standalone or A/B choice-story format before research")
    set_format.add_argument("--batch-id", required=True)
    set_format.add_argument("--topic", required=True)
    set_format.add_argument("--slot", type=int, required=True)
    set_format.add_argument("--story-format", choices=STORY_FORMATS, required=True)
    set_format.set_defaults(func=command_set_format)

    set_duration = sub.add_parser("set-duration", help="save a 30-60 second target before research")
    set_duration.add_argument("--batch-id", required=True)
    set_duration.add_argument("--topic", required=True)
    set_duration.add_argument("--slot", type=int, required=True)
    set_duration.add_argument("--seconds", type=int, required=True)
    set_duration.set_defaults(func=command_set_duration)

    list_cmd = sub.add_parser("list", help="list saved batches and their queue states")
    list_cmd.set_defaults(func=command_list)

    rename = sub.add_parser("rename", help="rename a batch and move its files and outputs in place")
    rename.add_argument("--batch-id", required=True)
    rename.add_argument("--new-name", required=True)
    rename.set_defaults(func=command_rename)

    set_theme = sub.add_parser("set-theme", help="save the user's theme choice before research")
    set_theme.add_argument("--batch-id", required=True)
    set_theme.add_argument("--topic", required=True)
    set_theme.add_argument("--slot", type=int, required=True)
    set_theme.add_argument("--theme", choices=STYLES, required=True)
    set_theme.set_defaults(func=command_set_theme)

    set_treatment = sub.add_parser("set-treatment", help="save automatic treatment scoring or a manual override")
    set_treatment.add_argument("--batch-id", required=True)
    set_treatment.add_argument("--topic", required=True)
    set_treatment.add_argument("--slot", type=int, required=True)
    set_treatment.add_argument("--treatment", choices=TREATMENT_CHOICES, default="auto", help="auto (default), or one fixed treatment")
    set_treatment.set_defaults(func=command_set_treatment)
    return parser


if __name__ == "__main__":
    parsed = build_parser().parse_args()
    parsed.func(parsed)
