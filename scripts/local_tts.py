#!/usr/bin/env python3
"""Generate speech with voices already installed on this computer.

This script uses pyttsx3 and the operating system's speech engine. It makes no
network requests. Word timestamps are approximate because local system voices
do not consistently expose word-level alignment on every operating system.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import wave
from pathlib import Path
from typing import Any

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[1]
SAMPLE_RATE = 48_000
WORD_RE = re.compile(r"[\w]+(?:[’'-][\w]+)*|[^\w\s]", re.UNICODE)


def _engine():
    try:
        import pyttsx3
    except ImportError as exc:
        raise SystemExit("Offline voice support is missing. Install it with: python -m pip install -r kit/requirements.txt") from exc
    engine = pyttsx3.init()
    wanted = os.environ.get("SHORT_STUDIO_SYSTEM_VOICE", "").strip().lower()
    if wanted:
        for voice in engine.getProperty("voices"):
            if wanted in str(voice.id).lower() or wanted in str(voice.name).lower():
                engine.setProperty("voice", voice.id)
                break
        else:
            names = ", ".join(str(v.name) for v in engine.getProperty("voices"))
            raise SystemExit(f"Voice '{wanted}' was not found. Installed voices: {names}")
    try:
        engine.setProperty("rate", int(os.environ.get("SHORT_STUDIO_SPEECH_RATE", "178")))
    except ValueError:
        raise SystemExit("SHORT_STUDIO_SPEECH_RATE must be an integer")
    return engine


def _speak(engine, text: str, path: Path) -> None:
    if not text.strip():
        wavfile.write(path, SAMPLE_RATE, np.zeros(1, dtype=np.int16))
        return
    engine.save_to_file(text, str(path))
    engine.runAndWait()
    if not path.exists() or path.stat().st_size < 64:
        raise SystemExit(f"The local speech engine did not create {path}. Check that this computer has a system voice installed.")
    # pyttsx3's macOS NSSpeechSynthesizer driver writes AIFF bytes even when
    # the requested filename ends in .wav. Normalize that output so the WAV
    # reader below works consistently across operating systems.
    header = path.read_bytes()[:12]
    if header[:4] == b"FORM" and header[8:12] in (b"AIFF", b"AIFC"):
        ffmpeg = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
        aiff_path = path.with_suffix(".aiff")
        path.replace(aiff_path)
        try:
            subprocess.run(
                [ffmpeg, "-nostdin", "-v", "error", "-y", "-i", str(aiff_path),
                 "-ar", str(SAMPLE_RATE), "-ac", "1", "-c:a", "pcm_s16le", str(path)],
                check=True,
            )
        finally:
            aiff_path.unlink(missing_ok=True)


def _read_mono_48k(path: Path) -> np.ndarray:
    rate, data = wavfile.read(path)
    data = np.asarray(data)
    if data.ndim == 2:
        data = data.astype(np.float64).mean(axis=1)
    if np.issubdtype(data.dtype, np.integer):
        scale = float(max(abs(np.iinfo(data.dtype).min), np.iinfo(data.dtype).max))
        data = data.astype(np.float64) / scale
    else:
        data = data.astype(np.float64)
    if rate != SAMPLE_RATE:
        divisor = math.gcd(int(rate), SAMPLE_RATE)
        data = resample_poly(data, SAMPLE_RATE // divisor, int(rate) // divisor)
    return np.clip(data, -1, 1)


def _write_voice(path: Path, samples: np.ndarray) -> None:
    pcm = (np.clip(samples, -1, 1) * 32767).astype(np.int16)
    wavfile.write(path, SAMPLE_RATE, pcm)


def _weighted_words(text: str, start: float, duration: float) -> list[dict[str, Any]]:
    tokens = WORD_RE.findall(text)
    words = [t for t in tokens if re.search(r"\w", t, re.UNICODE)]
    if not words:
        return []
    # Keep captions readable while distributing local speech timing across the line.
    weights = [max(1.0, len(re.sub(r"\W", "", w)) ** 0.72) for w in words]
    usable = max(0.02, duration - min(0.14, duration * 0.08))
    total = sum(weights)
    cursor = start
    result = []
    for word, weight in zip(words, weights):
        span = usable * weight / total
        result.append({"w": word, "s": round(cursor, 3), "e": round(cursor + span, 3), "p": ""})
        cursor += span
    # Preserve punctuation as a pause cue for plan.py when possible.
    word_index = -1
    for token in tokens:
        if re.search(r"\w", token, re.UNICODE):
            word_index += 1
        elif word_index >= 0 and re.fullmatch(r"[^\w\s]+", token, re.UNICODE):
            result[word_index]["p"] += token
    return result


def _sig(text: str) -> str:
    voice = os.environ.get("SHORT_STUDIO_SYSTEM_VOICE", "default")
    rate = os.environ.get("SHORT_STUDIO_SPEECH_RATE", "178")
    return hashlib.sha256(f"{text}\0{voice}\0{rate}".encode("utf-8")).hexdigest()


def make_project_voice(project: Path) -> None:
    spec_path = project / "timed.json"
    if not spec_path.exists():
        raise SystemExit(f"Missing {spec_path}. Run the shots stage first.")
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    shots = spec.get("shots", [])
    texts = [str(shot.get("text", "")).strip() for shot in shots]
    signature = _sig("\n".join(texts))
    meta_path = project / ".voice_system.json"
    voice_path = project / "vo.wav"
    words_path = project / "words.json"
    if meta_path.exists() and voice_path.exists() and words_path.exists():
        try:
            if json.loads(meta_path.read_text(encoding="utf-8")).get("signature") == signature:
                print("Offline voice cache hit; reusing vo.wav and words.json.")
                return
        except (OSError, json.JSONDecodeError):
            pass

    engine = _engine()
    utterances: list[np.ndarray] = []
    durations: list[float] = []
    word_rows: list[list[Any]] = []
    gap = 0.08
    clock = 0.0
    with tempfile.TemporaryDirectory(prefix="short-studio-tts-") as td:
        temp_dir = Path(td)
        for index, (shot, text) in enumerate(zip(shots, texts)):
            tmp = temp_dir / f"line-{index:03d}.wav"
            _speak(engine, text, tmp)
            samples = _read_mono_48k(tmp)
            spoken = len(samples) / SAMPLE_RATE
            old_len = max(0.25, float(shot.get("t1", 0)) - float(shot.get("t0", 0)))
            slot_len = max(old_len, spoken + 0.06)
            shot["t0"], shot["t1"] = round(clock, 3), round(clock + slot_len, 3)
            utterances.append(samples)
            durations.append(slot_len)
            for word in _weighted_words(text, clock, spoken):
                word_rows.append([word["w"], word["s"], word["e"]])
            utterances.append(np.zeros(int((slot_len - spoken + gap) * SAMPLE_RATE), dtype=np.float64))
            clock += slot_len + gap

    if utterances:
        audio = np.concatenate(utterances)
    else:
        audio = np.zeros(SAMPLE_RATE, dtype=np.float64)
    spec["dur"] = round(max(float(spec.get("dur", 0)), clock), 3)
    spec_path.write_text(json.dumps(spec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    _write_voice(voice_path, audio)
    words_path.write_text(json.dumps(word_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    meta_path.write_text(json.dumps({"signature": signature, "backend": "system"}, indent=2) + "\n", encoding="utf-8")
    (project / ".voice_system").touch()
    print(f"Offline system voice: {len(texts)} lines, {len(word_rows)} approximate word timings, {len(audio) / SAMPLE_RATE:.1f}s.")


def make_episode_voice(slug: str) -> None:
    episode_dir = ROOT / "studio" / "src" / "episodes" / slug
    episode_path = episode_dir / "episode.json"
    if not episode_path.exists():
        raise SystemExit(f"Missing episode file: {episode_path}")
    ep = json.loads(episode_path.read_text(encoding="utf-8"))
    lines = [str(row.get("text", "")).strip() for row in ep.get("script", [])]
    text = " ".join(line for line in lines if line)
    if not text:
        raise SystemExit("episode.json has no script text")
    signature = _sig(text)
    public_dir = ROOT / "studio" / "public" / slug
    public_dir.mkdir(parents=True, exist_ok=True)
    voice_path = public_dir / "voice.wav"
    words_path = episode_dir / "words.json"
    meta_path = episode_dir / ".voice_system.json"
    if voice_path.exists() and words_path.exists() and not meta_path.exists():
        print("Imported voice.wav and words.json found; keeping the provided recording.")
        return
    if meta_path.exists() and voice_path.exists() and words_path.exists():
        try:
            if json.loads(meta_path.read_text(encoding="utf-8")).get("signature") == signature:
                print("Offline voice cache hit; reusing voice.wav and words.json.")
                return
        except (OSError, json.JSONDecodeError):
            pass
    with tempfile.TemporaryDirectory(prefix="short-studio-tts-") as td:
        raw = Path(td) / "voice.wav"
        _speak(_engine(), text, raw)
        audio = _read_mono_48k(raw)
    _write_voice(voice_path, audio)
    words = _weighted_words(text, 0.0, len(audio) / SAMPLE_RATE)
    words_path.write_text(json.dumps(words, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    meta_path.write_text(json.dumps({"signature": signature, "backend": "system"}, indent=2) + "\n", encoding="utf-8")
    print(f"Offline system voice: {len(words)} approximate word timings, {len(audio) / SAMPLE_RATE:.1f}s.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--project", type=Path, help="Blocky Blender project folder")
    group.add_argument("--episode", help="What If episode slug in studio/src/episodes")
    args = parser.parse_args()
    if args.project:
        make_project_voice(args.project.resolve())
    else:
        make_episode_voice(args.episode)


if __name__ == "__main__":
    main()
