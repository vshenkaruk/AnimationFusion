"""Resolve FFmpeg tools for the local render and QA scripts."""
from __future__ import annotations

import glob
import os
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def ffmpeg_path() -> str:
    configured = os.environ.get("FFMPEG")
    if configured:
        return configured
    system = shutil.which("ffmpeg")
    if system:
        return system
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except (ImportError, RuntimeError):
        return "ffmpeg"


def ffprobe_path() -> str:
    configured = os.environ.get("FFPROBE")
    if configured:
        return configured
    system = shutil.which("ffprobe")
    if system:
        return system
    patterns = (
        ROOT / "studio" / "node_modules" / "@remotion" / "compositor-darwin-*" / "ffprobe",
        ROOT / "studio" / "node_modules" / "@remotion" / "compositor-linux-*" / "ffprobe",
        ROOT / "studio" / "node_modules" / "@remotion" / "compositor-win32-*" / "ffprobe.exe",
    )
    for pattern in patterns:
        found = glob.glob(str(pattern))
        if found:
            return found[0]
    return "ffprobe"


def media_environment(base: dict[str, str] | None = None) -> dict[str, str]:
    """Set explicit tool paths while preserving any caller-provided environment."""
    env = dict(os.environ)
    if base:
        env.update(base)
    if not env.get("FFMPEG"):
        env["FFMPEG"] = ffmpeg_path()
    probe = ffprobe_path()
    if Path(probe).is_file():
        env.setdefault("FFPROBE", probe)
        tool_dir = str(Path(probe).parent)
        env["PATH"] = tool_dir + os.pathsep + env.get("PATH", "")
        if sys_platform_is_macos():
            env["DYLD_LIBRARY_PATH"] = tool_dir + os.pathsep + env.get("DYLD_LIBRARY_PATH", "")
    return env


def sys_platform_is_macos() -> bool:
    import sys

    return sys.platform == "darwin"
