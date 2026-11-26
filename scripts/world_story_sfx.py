#!/usr/bin/env python3
"""Mix locally licensed CC0 action cues for the world-story 3D renderer.

Episode files may define ``world_sfx.events`` as ``[{at, clip, gain}]``. ``at``
uses the same word/shot/frame cue syntax as plan.py, plus ``event:SHOT.NAME``
to bind a sound to a named shot event shared with the animation. The script uses only the
CC0 WAV samples already included in kit/blox/assets/sfx/cc0/sfx-kit/; it makes
no network requests and spends no voice-generation credits.

Run from studio/: python scripts/world_story_sfx.py <episode-slug>
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

from wi import ep_dir, load_episode, load_json, resolve, save_json

STUDIO = Path.cwd()
ROOT = STUDIO.parent
SAMPLE_RATE = 48_000
SFX_ROOT = ROOT / "kit" / "blox" / "assets" / "sfx" / "cc0" / "sfx-kit"
CLIPS = {
    "impact-heavy-hard": "impact-heavy-hard.wav",
    "mechanical-latch-heavy": "mechanical-latch-heavy.wav",
    "move-spin": "move-spin.wav",
    "riser-1s-strong": "riser-1s-strong.wav",
    "shimmer-short-sparkle": "shimmer-short-sparkle.wav",
    "whoosh-fast-hard": "whoosh-fast-hard.wav",
}


def resolve_sfx_cue(cue: str, words: list, timeline: dict, shot_ids: list, fps: float) -> int:
    match = re.fullmatch(r"event:([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)", cue)
    if not match:
        return resolve(cue, words, fps, timeline.get("segments"), shot_ids)
    shot_id, event_name = match.groups()
    local_frame = timeline.get("shotEvents", {}).get(shot_id, {}).get(event_name)
    if local_frame is None:
        raise ValueError(f"unknown shot event '{shot_id}.{event_name}'")
    candidates = [
        segment for segment in timeline.get("segments", [])
        if segment.get("shot") == shot_id
        and float(segment.get("t0", 0)) <= float(local_frame) <= float(segment.get("t1", -1))
    ]
    if not candidates:
        raise ValueError(f"shot event '{shot_id}.{event_name}' at local frame {local_frame} is outside its timeline segment")
    segment = candidates[0]
    global_frame = round(float(segment["a"]) + float(local_frame) - float(segment.get("t0", 0)))
    if global_frame < int(segment["a"]) or global_frame >= int(segment["b"]):
        raise ValueError(f"shot event '{shot_id}.{event_name}' resolves outside its global segment")
    return global_frame


def mono_float(path: Path) -> np.ndarray:
    rate, raw = wavfile.read(path)
    samples = np.asarray(raw)
    if samples.ndim == 2:
        samples = samples.astype(np.float64).mean(axis=1)
    if np.issubdtype(samples.dtype, np.integer):
        info = np.iinfo(samples.dtype)
        samples = samples.astype(np.float64) / max(abs(info.min), info.max)
    else:
        samples = samples.astype(np.float64)
    if rate != SAMPLE_RATE:
        divisor = np.gcd(int(rate), SAMPLE_RATE)
        samples = resample_poly(samples, SAMPLE_RATE // divisor, int(rate) // divisor)
    peak = float(np.max(np.abs(samples))) if len(samples) else 0.0
    return samples / max(peak, 1e-9)


def main(slug: str) -> None:
    episode = load_episode(slug)
    config = episode.get("world_sfx", {})
    events = config.get("events", [])
    if not events:
        print("No world_sfx.events in episode.json; leaving the SFX stem unchanged.")
        return
    folder = ep_dir(slug)
    timeline_path = folder / "timeline.json"
    timeline = load_json(timeline_path)
    if not timeline:
        raise SystemExit("No timeline.json; run plan.py before mixing effects.")
    words = load_json(folder / "words.json", [])
    fps = float(timeline.get("fps", 0))
    if fps <= 0:
        raise SystemExit("timeline.json has no positive fps value.")
    total_samples = round(float(timeline["total"]) / fps * SAMPLE_RATE)
    mix = np.zeros(total_samples, dtype=np.float64)
    shot_ids = [shot["id"] for shot in timeline.get("shots", [])]
    loaded: dict[str, np.ndarray] = {}
    placements = []

    for index, event in enumerate(events, start=1):
        clip_name = str(event.get("clip", ""))
        if clip_name not in CLIPS:
            raise SystemExit(f"Event {index} uses an unsupported CC0 clip '{clip_name}'. Available: {', '.join(CLIPS)}")
        cue = str(event.get("at", ""))
        try:
            frame = resolve_sfx_cue(cue, words, timeline, shot_ids, fps)
        except Exception as exc:
            raise SystemExit(f"Cannot place world SFX event {index} at cue '{cue}': {exc}") from exc
        gain = float(event.get("gain", 0.35))
        if not 0 <= gain <= 1.5:
            raise SystemExit(f"Event {index} gain must be between 0 and 1.5.")
        if clip_name not in loaded:
            loaded[clip_name] = mono_float(SFX_ROOT / CLIPS[clip_name])
        samples = loaded[clip_name] * gain
        start = max(0, round(frame / fps * SAMPLE_RATE))
        end = min(total_samples, start + len(samples))
        if end > start:
            mix[start:end] += samples[: end - start]
        placements.append({"at": cue, "frame": frame, "seconds": round(frame / fps, 3), "clip": clip_name, "gain": gain})

    peak = float(np.max(np.abs(mix))) if len(mix) else 0.0
    if peak > 0.82:
        mix *= 0.82 / peak
    public = STUDIO / "public" / slug
    public.mkdir(parents=True, exist_ok=True)
    output = public / "sfx.wav"
    pcm = (np.clip(mix, -1.0, 1.0) * 32767).astype(np.int16)
    wavfile.write(output, SAMPLE_RATE, pcm)
    audio = timeline.setdefault("audio", {})
    audio["sfx"] = f"{slug}/sfx.wav"
    audio["sfxVol"] = float(config.get("volume", 0.48))
    save_json(timeline_path, timeline)
    report = folder / "world-sfx-report.json"
    report.write_text(json.dumps({"source": "project CC0 SFX Kit samples", "sample_rate": SAMPLE_RATE, "peak": round(peak, 4), "events": placements}, indent=2) + "\n", encoding="utf-8")
    print(f"Mixed {len(placements)} CC0 sound cues into {output}; peak {peak:.3f}.")
    print(f"Cue report: {report}")


if __name__ == "__main__":
    if len(sys.argv) != 2 or not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", sys.argv[1]):
        raise SystemExit("Usage: python scripts/world_story_sfx.py <episode-slug>")
    main(sys.argv[1])
