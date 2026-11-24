# AnimationFusion — Short Studio

> **GitHub description:** Local-first toolkit for researching, scripting, reviewing, and rendering 60 fps vertical animated shorts in blocky 3D, monochrome, or vector styles.

Short Studio is a local-first toolkit for planning and producing vertical animated shorts from one or more topics. It combines the supplied What If vector animation project with the blocky Blender renderer from [BetaVersionHQ/beta-version-blox-studio](https://github.com/BetaVersionHQ/beta-version-blox-studio).

## What it does

- Starts a topic batch with up to three video slots per topic.
- Supports three selectable looks: `blocky-3d` (the primary look), `monochrome`, and `what-if` (the original vector animation style).
- Guides a Claude Code or OpenCode session through trend research, up to three distinct pitches, script review, storyboard review, and rendering. Each video needs user approval before preparation and again before render after storyboard inspection.
- Produces a vertical 1080 × 1920 H.264 MP4 at 60 fps for short-form platforms.
- Keeps research, scripting, voices, music, rendering, and post-processing local wherever the selected engine allows.

The provided `Brave Search` URL is a search query rather than another source repository. It is documented with the other upstream references in [`references/upstream-integration.md`](references/upstream-integration.md). This package also uses a small offline quality-check utility from [baerozgaarmard/animated-shorts-skill](https://github.com/baerozgaarmard/animated-shorts-skill).

## Cost and network behavior

No paid API key is required by the default workflow. The batch manager and renderers do not make generative API calls. Research uses the web search/browser tools already available to the agent or user; there is no Brave Search API client or paid search integration. Speech uses installed OS voices. The Blox renderer synthesizes its music and sound effects locally; the What If renderer uses local narration and can be paired with user-provided audio. Its legacy ElevenLabs voice and SFX scripts are not called by `/short-studio`.

Using `/short-studio` in Claude Code still uses the user's configured Claude plan or account. The project itself does not make an additional model API call. ElevenLabs and other external voice services are optional and are not called by the default batch workflow. Users can also provide a recorded `vo.wav` and word timings.

Rendering uses local CPU/GPU time and disk space. Blender, FFmpeg, Python packages, and Node packages are free to download; check each tool's own license and any applicable commercial terms. Social media publishing is manual: this package exports files and captions, and does not connect to social accounts.

## Requirements

For blocky 3D or monochrome rendering:

- Windows, macOS, or Linux
- Blender 5.2 available on `PATH`, or set `BLENDER` to the executable path
- Python 3.11 recommended
- FFmpeg and `ffprobe` on `PATH`
- The Python packages in `kit/requirements.txt`

For the What If vector renderer:

- Node.js 18 or newer and npm
- FFmpeg and `ffprobe`
- Python 3.11 recommended, plus the Python packages in `kit/requirements.txt` for local voice and quality tools

Claude Code or OpenCode is optional for manual CLI production, but is needed for the guided research and script workflow. Research availability depends on the search/browser tools configured in that agent environment.

## Install

From the project folder, install the Python packages:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r kit/requirements.txt
```

On macOS or Linux, activate with `source .venv/bin/activate` instead. Install Blender, FFmpeg, and Node.js separately using their official installers. For Blender, either add `blender` to `PATH` or set the environment variable, for example:

```powershell
$env:BLENDER = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
```

Install the Remotion dependencies only if using the `what-if` theme:

```powershell
Set-Location studio
npm ci
Set-Location ..
```

No model, voice, sound, or search API key is needed for the local-first flow.

## Use `/short-studio`

Open Claude Code or OpenCode with the project folder as the working directory. The project includes a `/short-studio` command for both environments. Start with one or more topics, for example:

```text
/short-studio Roblox myths; strange ocean facts; everyday science
```

The command runs a compact research pass for each topic, prepares up to three distinct ideas per topic, then presents one pitch and full script at a time for approval. The user can revise, skip, or approve each idea and can pick a theme for each video. After approval, the agent prepares the storyboard; inspect it before approving the render. The queue can contain 3 topics × 3 videos, 4 × 3, or any other size, with a hard maximum of three videos for each topic.

Research notes should cite a few dated sources and distinguish observed interest from speculation. Trends cannot be predicted with certainty. Keep only useful evidence in the project to reduce prompt size; reuse the topic research for that topic's three shorts.

See [`FRIEND_GUIDE.md`](FRIEND_GUIDE.md) for the full friend-facing setup and an explanation of each queue command.

## Use the batch CLI

Create a topic list, one topic per line. A suffix after `|` can hold topic-specific notes:

```text
Roblox myths | Keep the stories original and suitable for a general audience
Ocean facts
```

Initialize the queue:

```powershell
python scripts/short_studio.py init --topics-file topics.txt --limit 3 --batch-id my-first-batch
```

The CLI stores scripts, sources, approval state, and project templates in `production/batches/`. Use `python scripts/short_studio.py --help` for commands and arguments. The CLI requires the pitch and script to be supplied before approval; writing and trend research are performed by the agent workflow, not by a hidden API service.

## Themes

| Theme | Renderer | Notes |
|---|---|---|
| `blocky-3d` | Vendored Blender / Blox Studio kit | Primary style; original characters, sets, props, and shot plans. |
| `monochrome` | Same Blender kit | Black-and-white finishing grade. |
| `what-if` | Existing Remotion project | Original vector look, adapted for vertical 60 fps compositions. |

The Blox renderer generates draft stills before the full animation. The Remotion engine has its own storyboard flow. Review the storyboard for framing, readability, character continuity, and factual visual details before rendering.

## Output and workflow files

- Batch state and per-episode source: `production/batches/<batch-id>/`
- Rendered social-ready MP4s and copy: `out/short-studio/<batch-id>/<topic>/<short>/`
- Blender assets and API: `kit/`
- What If Remotion project: `studio/`
- Local speech and queue tools: `scripts/`
- Claude Code command: `.claude/commands/short-studio.md`
- OpenCode command: `.opencode/commands/short-studio.md`
- Skill instructions: `SKILL.md`
- Upstream sources and license notes: `references/upstream-integration.md`, `licenses/upstream/`

The MP4 is ready to upload manually to Reels, TikTok, YouTube Shorts, or Facebook Reels. Captions and scripts are exported alongside it.

## Licensing

This folder includes code from more than one project. Keep all notices in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`licenses/upstream/`](licenses/upstream/) when redistributing it. The bundled Blox kit and copied QA utility retain their upstream MIT notices. The Remotion project also includes its own fonts, packages, and example media with separate terms; review those terms before commercial redistribution. This README does not grant rights to third-party characters, platform branding, or creator-specific stories.
