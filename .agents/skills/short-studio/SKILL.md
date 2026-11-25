---
name: short-studio
description: Create or continue animated short videos with AnimationFusion. Use when the user asks Codex to research, script, storyboard, preview, or render a short, especially a single test video.
---

# AnimationFusion Short Studio for Codex

Use this skill to run the repository's existing video workflow from Codex. Read the repository-root `SKILL.md`, `README.md`, and `FRIEND_GUIDE.md` first; those are the source of truth for current themes, requirements, commands, and limits.

## One-video test

- Work from the AnimationFusion repository root and check that the current checkout contains this skill. Do not assume GitHub files are present in the local workspace.
- For a new test, make exactly one video in one new batch. Use the existing CLI's one-slot setup (`init --limit 1`); never create extra slots or duplicate an existing batch. If the user wants to add to an existing batch, use its saved queue.
- Ask for missing choices before researching: topic, render theme (`blocky-3d`, `monochrome`, `rule-world-3d`, `what-if`, or `world-story-3d`), story format (`standalone` or `choice-story`), and exact 30–60 second duration. In an interactive conversation, ask one question at a time. Reuse choices the user has already made in the conversation.
- Keep visual treatment on automatic unless the user asks to override it. After fresh research, score character-led, graphics-led, and hybrid fit using the root skill's rubric.
- Research current sources and date them. Separate sourced facts from estimates and forecasts. If search is unavailable, say that current trends could not be checked.
- Before work starts, show the rough per-video stages: research 4–10 minutes; treatment score, visual plan, pitch, and script 2–6 minutes; voice and storyboard preparation 2–10 minutes. Use local measured preview/render estimates when available; otherwise mark them unbenchmarked. Include user-review pauses separately.
- Show the complete pitch, sources, visual plan, script, treatment scorecard, and spoken CTA. Wait for the user's pitch approval before preparing.
- After preparation, show the actual storyboard and wait for approve/revise. Then render the low-resolution audio preview, show its QA report, and ask the user to listen. Do not run the full render until the user has approved the preview.
- Use the CLI commands documented in the root skill and README. Report the output paths and any audio or render issues. The tool exports a file; it does not upload or post it.

## Local prerequisites and boundaries

Check the selected renderer's prerequisites in `FRIEND_GUIDE.md`: Blender themes need Python 3.11, Blender, FFmpeg, and ffprobe; What If also needs Node.js and npm. If a required tool is missing, explain what is missing and pause for setup rather than claiming a video was rendered.

Do not install tools, change renderer code, push commits, or publish a video as part of a normal one-video run. If the user asks for code changes, work separately from generated production files and follow their approval instructions.
