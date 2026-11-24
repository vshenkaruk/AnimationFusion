# AnimationFusion

**Local-first toolkit for researching, scripting, reviewing, and rendering vertical animated shorts.** Choose blocky 3D, monochrome, or the original What If vector style. Research then scores character-led, graphics-led, and hybrid treatments for each video.

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
- **Codex:** ask it to create exactly one AnimationFusion short; the project skill is `.agents/skills/short-studio/SKILL.md`.

Claude Code and OpenCode expose the slash commands above. Codex uses the repository skill from a new session opened at the AnimationFusion root; it does not use Claude's `/short-studio-one` command. For every video, the workflow asks for three choices before research: render theme, story format, and exact target duration from **30 to 60 seconds**. It chooses visual treatment automatically after research by scoring character-led, graphics-led, and hybrid fit; the creator can request an override. Research and trend checks happen for every new video. The workflow plans 5–7 key images before drafting the narration, then waits for pitch approval.

## Research, scripts, and delivery

Each new video gets new research, even when it belongs to a topic already in the batch. The workflow looks for recent high-performing examples in the selected style and topic area, checks current trend signals, and makes a clearly labeled near-term forecast. It records sources and separates observed facts from inference. Youth relevance is included when a source provides evidence; it is not assumed. If public view counts, upload dates, channel sizes, or trend data are unavailable, the research says so.

Useful public research starting points include [Google Trends](https://trends.google.com/trending), [TikTok Creative Center](https://ads.tiktok.com/business/creativecenter/), and [YouTube Culture & Trends](https://blog.youtube/culture-and-trends/). Trend evidence guides ideas; it cannot guarantee future popularity. Scripts take inspiration from hooks, pacing, and storytelling patterns without copying a creator's exact script, character, or artwork.

Choose either a self-contained story or an optional A/B choice story. The treatment choice is separate: a video can be a character-led A/B story, a graphics-led A/B story, or any other combination. Every script ends with one clear spoken CTA. The same CTA is shown in an end card across all three render themes. A Part 2 is created only when the creator asks for it; this version does not connect to social analytics or publish videos automatically.

The opening hook appears on screen in the first 1.5 seconds. Every video gets a 5–7 beat visual plan, original set/cast design notes, and a purposeful cut/transition plan before the complete script. The creator reviews the pitch and full script, then the actual storyboard. A CLI review gate blocks the full render until the creator approves that storyboard; edits afterward require a fresh prepare and review. The final folder contains the MP4, caption, script, research notes, 5–7 beat visual plan, and storyboard under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/
```

After storyboard approval, `preview` renders a quick 540 × 960 review MP4 with the same voice, music, captions, and 60 fps timing. The audio check verifies that a narration source and audio stream exist and are above a silence threshold; listen to the preview, then record `review-preview --decision approve` before starting the final export. The final portrait master remains 1080 × 1920 H.264 at 60 fps.

Typical time per new video, before user review pauses:

| Stage | Rough time |
|---|---:|
| Choose theme, format, and target length | Usually under a minute of setup; user response time varies |
| Fresh topic and trend research | 4–10 minutes |
| Treatment score, visual plan, pitch, and full script | 2–6 minutes |
| Voice and storyboard preparation | 2–10 minutes |
| Storyboard review and preview listening | User-controlled |
| 540 × 960 preview | Estimate from this computer's saved preview timings when available; first preview is unbenchmarked |
| Full 1080 × 1920 render | Estimate from saved same-theme local timings when available; first full render is unbenchmarked and may take tens of minutes (the friend's computer has taken close to 50 minutes) |

These are planning ranges, not guarantees. The CLI records preparation, preview, and render durations, then estimates those machine-bound stages from comparable renders in the same batch, scaled to the requested length. A 30–60 second, 60 fps final contains 1,800–3,600 frames. For `/short-studio-add` with several new videos, independent research may run in groups of up to three; scripts, preparation, review, and final renders still add time per video. Subagents use additional Claude usage and do not speed rendering.

For speed, the Blender preview renders at half resolution with reduced preview-only effects and per-worker thread caps; the final Blender settings stay at full quality. The What If renderer uses high-quality JPEG frame capture for its opaque scenes, which Remotion documents as faster than PNG. See [Blender's command-line thread controls](https://docs.blender.org/manual/en/latest/advanced/command_line/render.html), [EEVEE sampling costs](https://docs.blender.org/manual/en/5.1/render/eevee/render_settings/sampling.html), and [Remotion's frame-format guidance](https://www.remotion.dev/docs/options/video-image-format).

## Themes

| Theme | Rendering path | What it produces |
|---|---|---|
| `blocky-3d` | Blender | Original blocky 3D scenes with story-specific sets, varied shots, added character gestures, and keyframed rigid story props |
| `monochrome` | Blender + FFmpeg | Blocky 3D scenes with a black-and-white grade |
| `what-if` | Remotion | Original vector animation |

The visual treatment is an episode-level choice independent of the theme and A/B format:

| Treatment | What leads the story |
|---|---|
| character-led | Distinctive cast actions and reactions carry the story. |
| graphics-led | Props, diagrams, counters, and visual proof lead; characters are optional. |
| hybrid | Characters and graphics share the storytelling. |

These treatments reuse the three existing render paths. Graphics-led Blender videos use the kit's current physical props, camera moves, captions, and cards; they do not promise an unimplemented 2D HUD. The What If engine uses its existing vector shots and overlays. The blocky style uses original human characters when chosen; it does not include official Roblox characters or assets. Named story props can move as rigid objects, without physics or hand attachment. Animal and robot character rigs are not included. The monochrome grade is applied to the final MP4. Each new What If episode must be registered in `studio/src/episodes/index.ts`; preparation checks the registration.

Visual references and upstream demos are in [FRIEND_GUIDE.md](FRIEND_GUIDE.md). See the [blocky 3D art-direction guide](references/blocky-3d.md) for clean set, light, material, and framing checks. These references are examples, not output renders from this repository.

## Manual CLI

Run `python scripts/short_studio.py <command>` from the project folder.

| CLI command | Purpose |
|---|---|
| `init` | Create a batch with up to three initial slots per topic. |
| `add` | Add slots to one topic or all topics in an existing batch. |
| `set-theme` | Save the chosen render theme before research. |
| `set-treatment` | Save automatic treatment selection (default) or a manual override. |
| `set-format` | Save `standalone` or `choice-story` before research. |
| `set-duration` | Save the 30–60 second target before research. |
| `pitch` | Save the researched pitch, visual plan, complete script, spoken CTA, and caption. |
| `decide` | Record `approve`, `revise`, or `skip`. |
| `prepare` | Build voice, storyboard, and a story-specific scene. |
| `review-storyboard` | Approve the current storyboard or request changes; rendering stays blocked until approval. |
| `preview` | Render a half-resolution review video with narration and run audio QA. |
| `review-preview` | Record that you listened to the passing preview, or request revision. |
| `render` | Render only after storyboard and preview approval; run audio QA before delivery. |
| `status` / `list` | Inspect one queue or all saved batches. |
| `rename` | Rename a saved batch and move its files and outputs in place. |

The CLI manages files, stage timings, audio-preview approval, and render gates; the slash command performs research and writes the creative materials. Claude Code can run up to three independent topic-research subagents in parallel for a multi-video batch when its Agent and web-search tools are available. The read-only worker is in `.claude/agents/shorts-topic-researcher.md`. This can shorten research wait time but uses additional Claude usage and does not speed local rendering. OpenCode or sessions without those tools continue in one agent. See [Claude Code subagents](https://code.claude.com/docs/en/sub-agents) for tool and usage details. See [SKILL.md](SKILL.md), the [blocky 3D art-direction guide](references/blocky-3d.md), [visual treatment guide](references/visual-treatment.md), [niche playbooks](references/niches.md), and [transition guide](references/transitions.md).

## Updating an existing copy

For an existing clone, run `git pull` in the AnimationFusion folder. If you use a ZIP, download and extract a fresh copy. Start Claude Code, OpenCode, or Codex from that updated folder. Claude Code and OpenCode read the project commands in `.claude/commands/` and `.opencode/commands/`; Codex discovers the repo-local skill in `.agents/skills/short-studio/`. Start a new Codex session after updating so it can discover the skill.

## Cost, files, and licenses

The project makes no paid API calls by default. Research requires browser or search access. Voice and rendering run locally; ElevenLabs is opt-in. Batch state and rendered files stay in `production/` and `out/`, which are ignored by Git.

This package includes code from multiple projects. Preserve its notices when redistributing it. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [licenses/upstream/](licenses/upstream/).
