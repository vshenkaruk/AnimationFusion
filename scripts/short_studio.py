#!/usr/bin/env python3
"""Local batch manager for Short Studio.

This manages topic queues, initial episode slots, review state,
and the approved local render. Research and writing are performed by the agent
workflow; no generative API is called by this utility.
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import math
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
    (folder / "pitch.md").write_text(f"# {title}\n\n**Topic:** {topic['title']}\n\n**Theme:** {args.theme}\n\n**Visual treatment:** {args.visual_treatment} ({'auto-selected' if treatment_mode == 'auto' else 'manual override'})\n\n**Format:** {args.story_