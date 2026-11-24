# Quick start for friends

AnimationFusion researches and scripts vertical animated shorts, then renders approved videos in blocky 3D, monochrome, or original What If vector style. Each video is 30–60 seconds, gets its own fresh research, and ends with a spoken call to action. It exports files; it does not post to social accounts.

## Install tools

For `blocky-3d` and `monochrome`, install Python 3.11, Blender 5.2, FFmpeg, and `ffprobe`. Make Blender and FFmpeg available on PATH.

For `what-if`, also install Node.js 18+ and npm. No ElevenLabs key or paid search API is needed for the default workflow.

Install Python packages from the project folder:

```powershell
py -3.11 -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install -r kit\\requirements.txt
```

On macOS or Linux, activate with `source .venv/bin/activate`. Install What If's Node packages once:

```powershell
cd studio
npm ci
cd ..
```

## Get the current repo commands

If you already cloned AnimationFusion, go into its folder and run:

```powershell
git pull
```

If you use a ZIP, download and extract the latest copy from GitHub. Start Claude Code or OpenCode with the updated AnimationFusion folder as its working directory. Commands in `.claude/commands/` and `.opencode/commands/` are project-local; there is nothing to install into a separate chat.

## Make videos

Start a batch:

```text
/short-studio Roblox myths; strange ocean facts
```

Make one video only:

```text
/short-studio-one strange ocean facts
```

Add one fresh video to a topic in a saved batch, or one to every topic:

```text
/short-studio-add december-shorts roblox-myths
/short-studio-add december-shorts all
```

The optional count is the number of new slots per selected topic. Check a batch ID and topic IDs with `/short-studio-list`. To rename and resume a saved batch:

```text
/short-studio-rename december-shorts winter-shorts
/short-studio-continue winter-shorts
```

Continuing or adding videos reuses the existing batch folder. It does not rebuild the old slots. Every new video gets fresh topic-specific research.

For each slot, Claude/OpenCode asks you to choose:

- A render theme: `blocky-3d`, `monochrome`, or `what-if`.
- A story format: `standalone` or an optional `choice-story` with an A/B decision.
- An exact target length from 30 to 60 seconds.

Then it researches the topic and chosen style again, prepares a complete script with a spoken CTA, and waits for review. A choice-story asks viewers to comment A or B and gives the first short its own payoff. The CTA says “Part 2” only if the creator has decided to make one; generating a Part 2 is manual in this version.

Research looks for recent high-performing examples in the chosen style, current topic signals, and evidence of youth relevance when available. It notes source links, dates, and what is a fact versus a forecast. It does not promise a topic will go viral or copy another creator's content.

Choose the theme and story only after reviewing the idea, sources, and full script. After approval, inspect the storyboard and ask for changes if needed, then render.

## Output files

Each finished folder is under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/
```

It contains `final.mp4`, `script.md`, `research.md`, `post-caption.txt`, and `storyboard.jpg`. The video is a vertical 1080×1920 H.264 MP4 at 60 fps. Upload it manually to the social platform you choose.

## Theme notes

| Theme | Renderer | Notes |
|---|---|---|
| `blocky-3d` | Blender | Original blocky 3D look and characters |
| `monochrome` | Blender + FFmpeg | Same blocky renderer with a final black-and-white grade |
| `what-if` | Remotion | Original vector animation |

The blocky theme is generic and does not use official Roblox assets. New What If episodes need files under `studio/src/episodes/<slug>/` and a registration in `studio/src/episodes/index.ts`. The prepare command checks this.

## Cost and research tools

Voice and rendering are local. Trend research uses the browser/search access available in Claude Code or OpenCode; if access is unavailable, the assistant should say it cannot verify current signals. Public starting points include Google Trends, TikTok Creative Center, and YouTube Culture & Trends. The repository does not read a creator's post analytics, generate a Part 2 automatically from views, or post to a social account.
