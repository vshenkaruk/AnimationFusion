#!/usr/bin/env python3
"""Select an available Voicemod filter for live microphone narration.

This controls the locally installed Voicemod Desktop app. It does not process
an existing WAV or generate narration; the changed mic audio must be recorded
and added to the episode as vo.wav with matching words.json timings.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any

PORTS = (59129, 20000, 39273, 42152, 43782, 46667, 35679, 37170, 38501, 33952, 30546)
PROFILES = {
    "playful": ("cartoon", "baby", "chipmunk", "funny"),
    "suspense": ("cave", "deep", "monster", "dark"),
    "hype": ("gamer", "hero", "cartoon", "bright"),
    "calm": ("clean", "normal", "nofx"),
}


def request_id() -> str:
    return str(uuid.uuid4())


def recv_action(ws: Any, action: str, timeout: float = 4.0) -> dict[str, Any]:
    import time

    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            value = json.loads(ws.recv())
        except Exception as exc:
            raise RuntimeError(f"Voicemod did not return a {action} response: {exc}") from exc
        if value.get("actionType") == action:
            return value
        if value.get("error") or value.get("status") == "error":
            raise RuntimeError(str(value.get("error") or value))
    raise RuntimeError(f"Timed out waiting for Voicemod's {action} response.")


def connect():
    try:
        import websocket
    except ImportError as exc:
        raise SystemExit("Optional dependency missing. Install it with: python -m pip install -r kit/requirements-voicemod.txt") from exc
    key = os.environ.get("VOICEMOD_CLIENT_KEY", "").strip()
    if not key:
        raise SystemExit("Set VOICEMOD_CLIENT_KEY from the Voicemod developer portal. Keep it in your shell or ignored local env file, never in Git.")
    errors = []
    for port in PORTS:
        ws = None
        try:
            ws = websocket.create_connection(f"ws://localhost:{port}/v1", timeout=2)
            # Voicemod requires registerClient to be the first API message.
            ws.send(json.dumps({"id": request_id(), "action": "registerClient",
                                "payload": {"clientKey": key}}))
            return ws
        except Exception as exc:
            errors.append(f"{port}: {exc}")
            if ws:
                try:
                    ws.close()
                except Exception:
                    pass
    raise SystemExit("Voicemod Desktop was not found on its documented local API ports. Open the app and try again. " + "; ".join(errors[-3:]))


def get_voices(ws) -> tuple[list[dict[str, Any]], str | None]:
    ws.send(json.dumps({"id": request_id(), "action": "getVoices", "payload": {}}))
    response = recv_action(ws, "getVoices")
    data = response.get("actionObject") or {}
    voices = [voice for voice in data.get("voices", []) if isinstance(voice, dict)]
    current = data.get("currentVoice") or response.get("currentVoice")
    return voices, str(current) if current else None


def choose_voice(voices: list[dict[str, Any]], voice_id: str | None, tone: str | None) -> dict[str, Any] | None:
    available = [voice for voice in voices if voice.get("enabled", True)]
    if voice_id:
        match = next((voice for voice in available if str(voice.get("id", "")).casefold() == voice_id.casefold()), None)
        if not match:
            raise SystemExit(f"Voicemod filter {voice_id!r} is not currently enabled. Run with --list to see this account's available filters.")
        return match
    if not tone:
        return None
    for hint in PROFILES[tone]:
        match = next((voice for voice in available if hint in str(voice.get("friendlyName", "")).casefold()
                      or hint in str(voice.get("id", "")).casefold()), None)
        if match:
            return match
    names = ", ".join(str(voice.get("friendlyName") or voice.get("id")) for voice in available) or "none"
    raise SystemExit(f"No enabled Voicemod filter matches the {tone!r} profile. Available: {names}. Choose one with --voice-id.")


def project_tone(project: Path | None) -> str | None:
    if project is None:
        return None
    path = project / "timed.json"
    if not path.is_file():
        raise SystemExit(f"Cannot read per-video voice settings: {path}")
    spec = json.loads(path.read_text(encoding="utf-8"))
    tone = spec.get("voice_tone")
    if tone and tone not in PROFILES:
        raise SystemExit(f"timed.json voice_tone must be one of: {', '.join(PROFILES)}")
    return str(tone) if tone else None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", type=Path, help="episode project; reads voice_tone from timed.json")
    parser.add_argument("--tone", choices=tuple(PROFILES), help="per-video delivery tone; project setting takes priority")
    parser.add_argument("--voice-id", help="explicit available Voicemod filter ID")
    parser.add_argument("--list", action="store_true", help="list currently enabled Voicemod filters")
    args = parser.parse_args()
    tone = project_tone(args.project) or args.tone
    ws = connect()
    try:
        voices, current = get_voices(ws)
        if args.list:
            print("Voicemod filters available right now:")
            for voice in voices:
                enabled = "available" if voice.get("enabled", True) else "locked"
                print(f"- {voice.get('friendlyName', voice.get('id'))} [{voice.get('id')}] — {enabled}")
            print(f"Current filter: {current or 'unknown'}")
            return
        selected = choose_voice(voices, args.voice_id, tone)
        if selected is None:
            raise SystemExit("Choose --tone, --voice-id, or --list. For automatic per-video selection, set voice_tone in timed.json.")
        ws.send(json.dumps({"id": request_id(), "action": "loadVoice",
                            "payload": {"voiceID": str(selected.get("id"))}}))
        print(f"Requested Voicemod filter: {selected.get('friendlyName')} ({selected.get('id')})")
        print("Record the changed mic audio into vo.wav; Voicemod does not transform the renderer's existing TTS WAV.")
    finally:
        try:
            ws.close()
        except Exception:
            pass


if __name__ == "__main__":
    main()
