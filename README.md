# AnimationFusion

**Local-first toolkit for researching, scripting, reviewing, and rendering vertical animated shorts.** Choose blocky 3D, monochrome, or the original What If vector style.

AnimationFusion combines the supplied What If Remotion project with a Blender-based blocky renderer. Claude Code and OpenCode commands guide a video from fresh research through a reviewed, ready-to-post MP4.

## Get started

Install Python 3.11, Blender 5.2, FFmpeg and `ffprobe`. The `what-if` vector theme also needs Node.js 18+ and npm. Detailed platform-specific setup is in [FRIEND_GUIDE.md](FRIEND_GUIDE.md).

Clone the repository or download its ZIP. Start Claude Code or OpenCode **from the AnimationFusion folder**. The slash commands are project-local files; there is no separate command or skill installation.

## Choose a workflow

- `/short-studio <topic 1; topic 2>` — start a batch, with up to three initial video slots per topic.
- `/short-studio-one <topic>` — create exactly one researched video in a new batch.
- `/short-studio-add <batch-id> <topic-id|all> [count]` — add new slots to one topic or every topic in an existing batch. The count is new slots **per selected topic**. Each added video gets fresh research; existing folders and renders are kept.
- `/short-studio-list` — list batches and slot states.
- `/short-studio-rename <batch-id> <new-name>` — rename a batch in place, including its paths and output folder.
- `/short-studio-continue <batch-id>` — resume the saved queue without recreating it.

For every video, the workflow asks for a theme, story format, and exact target duration from **30 to 60 seconds** before research. It then researches the selected topic and visual style, writes a complete script with a spoken call to action, and waits for approval. The default duration suggestion is 45 seconds, but the creator chooses.

## Research, scripts, and delivery

Each new video gets new research, even when it belongs to a topic already in the batch. The workflow looks for recent high-performing examples in the selected style and topic area, checks current trend signals, and makes a clearly labeled near-term forecast. It records sources and separates observed facts from inference. Youth relevance is included when a source provides evidence; it is not assumed. If public view counts, upload dates, channel sizes, or trend data are unavailable, the research says so.

Useful public research starting points include [Google Trends](https://trends.google.com/trending), [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter/), and [YouTube Culture & Trends](https://blog.youtube/culture-and-trends/). Trend evidence guides ideas; it cannot guarantee future popularity. Scripts take inspiration from hooks, pacing, and storytelling patterns without copying a creator's exact script, character, or artwork.

Choose either a self-contained story or an optional A/B choice story. Every script ends with one clear spoken CTA. The same CTA is shown in an end card across all three render themes. A Part 2 is created only when the creator asks for it; this version does not connect to social analytics or publish videos automatically.

The opening hook appears on screen in the first 1.5 seconds. The creator reviews the pitch and full script, then the actual storyboard. A CLI review gate blocks the full render until the creator approves that storyboard; edits afterward require a fresh prepare and review. The final folder contains the MP4, caption, script, research notes, and storyboard under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/
```

The portrait master is 1080 × 1920 H.264 at 60 fps. Upload it to TikTok, Instagram Reels, YouTube Shorts, or Facebook Reels yourself.

## Themes

| Theme | Rendering path | What it produces |
|---|---|---|
| `blocky-3d` | Blender | Original blocky 3D scenes with story-specific sets, varied shots, added character gestures, and keyframed rigid story props |
| `monochrome` | Blender + FFmpeg | Blocky 3D scenes with a black-and-white grade |
| `what-if` | Remotion | Original vector animation |

The blocky style uses original generic human characters; it does not include official Roblox characters or assets. Named story props can move as rigid objects, without physics or hand attachment. Animal and robot character rigs are not included. The monochrome grade is applied to the final MP4. Each new What If episode must be registered in `studio/src/episodes/index.ts`; preparation checks the registration.

Visual references and upstream demos are in [FRIEND_GUIDE.md](FRIEND_GUIDE.md). They are examples, not output renders from this repository.

## Manual CLI

Run `python scripts/short_studio.py <command>` from the project folder.

| CLI command | Purpose |
|---|---|
| `init` | Create a batch with up to three initial slots per topic. |
| `add` | Add slots to one topic or all topics in an existing batch. |
| `set-theme` | Save the chosen render theme before research. |
| `set-format` | Save `standalone` or `choice-story` before research. |
| `set-duration` | Save the 30–60 second target before research. |
| `pitch` | Save the researched pitch, complete script, spoken CTA, and caption. |
| `decide` | Record `approve`, `revise`, or `skip`. |
| `prepare` | Build voice, storyboard, and a story-specific scene. |
| `review-storyboard` | Approve the current storyboard or request changes; rendering stays blocked until approval. |
| `render` | Render only after storyboard approval and copy its delivery files. |
| `status` / `list` | Inspect one queue or all saved batches. |
| `rename` | Rename a saved batch and move its files and outputs in place. |

The CLI manages files and approval gates; the slash command performs the research and writes the creative materials. See [SKILL.md](SKILL.md) for the complete workflow.

## Updating an existing copy

After these changes are merged into the repository's main branch, an existing clone should run `git pull` in the AnimationFusion folder. If your friend uses a ZIP, download and extract a fresh copy. Then open Claude Code from that updated folder. The new commands live in `.claude/commands/` (and OpenCode commands in `.opencode/commands/`); no separate chat setup is required.

## Cost, files, and licenses

The project makes no paid API calls by default. Research requires browser or search access. Voice and rendering run locally; ElevenLabs is opt-in. Batch state and rendered files stay in `production/` and `out/`, which are ignored by Git.

This package includes code from multiple projects. Preserve its notices when redistributing it. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [licenses/upstream/](licenses/upstream/).
