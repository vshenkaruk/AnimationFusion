#!/usr/bin/env python3
"""Check a rendered short for a real, audible audio stream and an audible narration source.

This is a signal-level check, not speech recognition or a judgment of pronunciation.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


def command(*args: str) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if result.returncode:
        raise SystemExit(result.stderr.strip() or f"Command failed: {' '.join(args)}")
    return result


def levels(path: Path) -> tuple[str, str]:
    result = command("ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-")
    text = result.stderr
    mean = re.findall(r"mean_volume:\s*(-?inf|-?\d+(?:\.\d+)?)\s*dB", text, re.I)
    peak = re.findall(r"max_volume:\s*(-?inf|-?\d+(?:\.\d+)?)\s*dB", text, re.I)
    return (mean[-1] if mean else "unknown", peak[-1] if peak else "unknown")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--voice-source", type=Path, required=True,
                        help="separate narration WAV used to build the mix")
    args = parser.parse_args()

    failures: list[str] = []
    notes: list[str] = []
    rows = [f"# Audio check: {args.video.name}", ""]
    if not args.video.is_file():
        failures.append(f"Rendered video is missing: {args.video}")
    if not args.voice_source.is_file() or args.voice_source.stat().st_size < 64:
        failures.append(f"Narration source is missing or empty: {args.voice_source}")
    else:
        voice_mean, voice_peak = levels(args.voice_source)
        rows.append(f"- Narration source: {args.voice_source.name}; mean {voice_mean} dB, peak {voice_peak} dB")
        try:
            if voice_peak == "unknown" or float(voice_peak) < -50:
                failures.append("Narration source is effectively silent; regenerate or replace the voice before rendering.")
        except ValueError:
            failures.append("Narration source level could not be measured.")

    if args.video.is_file():
        probe = command("ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_type,codec_name,sample_rate,channels,duration:format=duration",
                        "-of", "json", str(args.video))
        metadata = json.loads(probe.stdout)
        audios = [item for item in metadata.get("streams", []) if item.get("codec_type") == "audio"]
        video_duration = float(metadata.get("format", {}).get("duration", 0) or 0)
        rows.append(f"- Video duration: {video_duration:.2f} s")
        if not audios:
            failures.append("The MP4 has no audio stream.")
        else:
            first = audios[0]
            rows.append(f"- Audio stream: {first.get('codec_name', 'unknown')}, {first.get('sample_rate', 'unknown')} Hz, "
                        f"{first.get('channels', 'unknown')} channel(s), {first.get('duration', 'unknown')} s")
            mean, peak = levels(args.video)
            rows.append(f"- Mixed audio level: mean {mean} dB, peak {peak} dB")
            try:
                if peak == "unknown" or float(peak) < -50:
                    failures.append("The rendered audio stream is effectively silent.")
            except ValueError:
                failures.append("The rendered audio level could not be measured.")
            silences = command("ffmpeg", "-hide_banner", "-nostats", "-i", str(args.video),
                               "-map", "0:a:0", "-af", "silencedetect=n=-50dB:d=1.5", "-f", "null", "-").stderr
            spans = [line.split("] ", 1)[-1].strip() for line in silences.splitlines() if "silence_" in line]
            rows.append("- Long whole-mix silence (>1.5 s): " + ("; ".join(spans) if spans else "none detected"))
            if spans:
                notes.append("Review any detected long silent spans; they may be intentional pauses.")
    rows.append("")
    if failures:
        rows.extend(["**RESULT: FAIL**", *[f"- {item}" for item in failures]])
    else:
        rows.append("**RESULT: PASS** — audio and narration are present above the silence threshold.")
    rows.extend(["", "This check measures track presence and signal level; it cannot judge pronunciation, intelligibility, or whether the spoken words match the script. Listen to the preview before requesting the full render."])
    if notes:
        rows.extend(["", *[f"NOTE: {item}" for item in notes]])
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text("\n".join(rows) + "\n", encoding="utf-8")
    print("\n".join(rows))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
