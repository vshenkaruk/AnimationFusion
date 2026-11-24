# AnimationFusion

**Local-first toolkit for researching, scripting, reviewing, and rendering 60 fps vertical animated shorts.** Choose blocky 3D, monochrome, or the original vector style.

AnimationFusion combines the supplied What If Remotion project with the Blender-based blocky renderer from [BetaVersionHQ/beta-version-blox-studio](https://github.com/BetaVersionHQ/beta-version-blox-studio). It includes a Claude Code `/short-studio` command to guide a topic from research through a reviewed, ready-to-post video.

## Use it with Claude Code

### 1. Get the project and install the tools

Clone the GitHub repository or download and extract its ZIP. Install Python 3.11, Blender 5.2, and FFmpeg with `ffprobe`; make Blender and FFmpeg available on `PATH`.

From the project folder, install the Python packages:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r kit\requirements.txt
```

On macOS or Linux, activate the environment with `source .venv/bin/activate` instead. If Blender is not on `PATH`, set its path in PowerShell before opening Claude Code:

```powershell
$env:BLENDER = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
```

The `what-if` vector theme also needs Node.js 18+ and npm. Install its packages once:

```powershell
cd studio
npm ci
cd ..
```

### 2. Start Claude Code from the project folder

Open Claude Code with the AnimationFusion folder as its working directory. Enter one or more topics, separated by semicolons:

```text
/short-studio economics; motivation; Roblox myths
```

If no topics are supplied, `/short-studio` asks for them. It creates a local batch with up to three short-video slots per topic, researches each topic using available browser or search access, and prepares ideas one at a time.

For each short, review the idea and full script, then reply **approve**, **revise**, or **skip**. Choose a theme for each video. After approving a script, review its storyboard before asking Claude to render. This keeps you in control of what gets produced.

### 3. Find the finished videos

Rendered MP4s, captions, scripts, research notes, and storyboards are saved locally under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/
```

The video is a vertical 1080 × 1920 H.264 MP4 at 60 fps. Upload it to TikTok, Instagram Reels, YouTube Shorts, or Facebook Reels yourself; AnimationFusion does not post to social accounts.

## Themes

| Theme | Look | Renderer |
|---|---|---|
| `blocky-3d` | Customizable blocky 3D animation | Blender; primary theme |
| `monochrome` | Black-and-white blocky animation | Blender with a monochrome grade |
| `what-if` | Original vector animation style | Remotion |

### Visual examples

These are external style references and upstream demos, not renders made by AnimationFusion:

- **Blocky 3D:** [Blox Studio showcase video](https://github.com/BetaVersionHQ/beta-version-blox-studio/blob/main/showcase.mp4) and the [TikTok reference](https://www.tiktok.com/@zaylento.yt/video/7706689478533909792?is_from_webapp=1).
- **Monochrome:** [black-and-white TikTok reference](https://www.tiktok.com/@silversociety_0/video/7706208134599019808?is_from_webapp=1&sender_device=pc). AnimationFusion applies a monochrome grade to its blocky 3D render.
- **What If vector:** the project includes the `Rewind` and `CopyPaste` example episodes under [`studio/src/episodes/`](studio/src/episodes/). To preview them, run `npm run studio` from the `studio/` directory and select an example composition.

## Commands

The main Claude Code command is `/short-studio <topics>`. The project also has an OpenCode command with the same name.

For manual queue management, run `python scripts/short_studio.py <command>` from the project folder:

| CLI command | What it does |
|---|---|
| `init` | Creates a batch and up to three short slots per topic. |
| `pitch` | Saves an idea, script, research, caption, and theme for review. |
| `decide` | Records `approve`, `revise`, or `skip`. |
| `prepare` | Prepares the voice and storyboard after approval. |
| `render` | Renders a prepared short and copies its files to the output folder. |
| `status` | Shows each topic's queue status. |

Example:

```powershell
python scripts/short_studio.py init --topics-file topics.txt --limit 3 --batch-id my-batch
python scripts/short_studio.py status --batch-id my-batch
```

The CLI manages files and approvals; it does not write scripts or perform research by itself. See [`FRIEND_GUIDE.md`](FRIEND_GUIDE.md) for detailed CLI examples.

## Cost and local files

No paid API key is needed by default. Voice and rendering run locally; the Blox renderer also creates music and sound effects locally. `/short-studio` uses the Claude account or plan configured by its user, but the project does not make additional model-provider API calls. Trend research needs browser or search access; if none is available, Claude should say it cannot verify current trends rather than inventing evidence.

Batch files and rendered videos stay on the computer in `production/` and `out/`; those generated folders are ignored by Git. External voice services such as ElevenLabs are optional and are not called unless explicitly selected.

## Project files and licenses

- `SKILL.md` — full research, script approval, and production workflow
- `.claude/commands/short-studio.md` — Claude Code slash command
- `.opencode/commands/short-studio.md` — OpenCode slash command
- `scripts/short_studio.py` — local batch and approval manager
- `scripts/local_tts.py` — offline system-voice support
- `kit/` — Blender renderer and blocky 3D templates
- `studio/` — Remotion vector animation project
- `references/upstream-integration.md` — source integration notes
- `THIRD_PARTY_NOTICES.md` and `licenses/upstream/` — license notices

This package includes code from multiple projects. Preserve their notices when redistributing it. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`licenses/upstream/`](licenses/upstream/) for details.

