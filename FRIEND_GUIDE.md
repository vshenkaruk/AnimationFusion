# Quick start for friends

Short Studio researches topics, drafts up to three short video ideas per topic, and renders approved scripts as vertical 60 fps videos. Choose between blocky 3D, monochrome, and the original vector style. It exports files for social platforms; it does not post to social accounts.

## Start with Claude Code

### 1. Install the tools

For the main `blocky-3d` and `monochrome` themes, install:

- Python 3.11
- Blender 5.2
- FFmpeg, with `ffprobe`, and make both commands available on PATH

For the `what-if` vector theme, also install Node.js 18+ and npm. You do not need an ElevenLabs key or any search API key for the default workflow.

### 2. Download the project

Clone the repository, replacing the example URL with the link the owner shared:

```powershell
git clone https://github.com/OWNER/REPOSITORY.git
cd REPOSITORY
```

Or use GitHub's **Code → Download ZIP**, then extract it. Open the project folder in PowerShell.

### 3. Install Python packages

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r kit\requirements.txt
```

If PowerShell blocks activation, use `python -m pip install -r kit\requirements.txt` from the project folder; the system Python can install the same packages.

If Blender is not on PATH, set its location in the same PowerShell window before starting Claude Code:

```powershell
$env:BLENDER = "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe"
```

For the `what-if` theme, install the Node dependencies once:

```powershell
cd studio
npm ci
cd ..
```

### 4. Start Claude Code and make a batch

Start Claude Code **from the project folder**, then type:

```text
/short-studio Roblox myths; strange ocean facts; everyday science
```

Separate topics with semicolons or put each on a new line. The command researches each topic using available browser/search access, then presents one idea and complete script at a time. It shows the sources and suggested theme so you can review them.

For each video, Claude asks you to choose a theme—**blocky 3D**, **monochrome**, or **What If vector**—and to **approve**, **revise**, or **skip** the script. Choose a theme explicitly before approval. After approval, Claude prepares a storyboard in that theme. Look it over and ask for corrections if needed; then tell Claude to render it. Repeat for the next pitch. The maximum is three videos per topic.

The output is saved under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/final.mp4
```

The script, research notes, caption, and storyboard are saved next to the MP4. Upload the final MP4 manually to the social platform you choose.

## What the CLI commands do

The Python CLI stores batch state and enforces the approval order. It does not generate research or scripts by itself; Claude Code or OpenCode does that when you use `/short-studio`. You can also use the CLI manually if you provide the research, pitch, script, and renderer source files yourself.

### `init` — create a queue

Create `topics.txt`, one topic per line. Optional notes can follow a `|`:

```text
Roblox myths | Keep stories original
Ocean facts
```

Then run:

```powershell
python scripts/short_studio.py init --topics-file topics.txt --limit 3 --batch-id first-batch
```

`--limit` accepts 1, 2, or 3. The default is 3, and the tool will not accept a higher limit.

### `pitch` — save a pitch and full script for review

Save the pitch, script, research, and caption as text files, then run:

```powershell
python scripts/short_studio.py pitch --batch-id first-batch --topic roblox-myths --slot 1 --theme blocky-3d --title "The Myth" --hook "What if this were true?" --idea .\idea.md --script .\script.md --research .\research.md --caption .\caption.txt
```

`--theme` must be `blocky-3d`, `monochrome`, or `what-if`. This saves the files and sets the slot to `awaiting_approval`.

### `decide` — approve, request a revision, or skip

```powershell
python scripts/short_studio.py decide --batch-id first-batch --topic roblox-myths --slot 1 --decision approve
```

Replace `approve` with `revise` or `skip` as appropriate. Only an approved slot can be prepared. Before approval, save the user's explicit theme choice:

```powershell
python scripts/short_studio.py set-theme --batch-id first-batch --topic roblox-myths --slot 1 --theme what-if
```

Choose `blocky-3d`, `monochrome`, or `what-if`. The CLI blocks approval until a theme has been explicitly saved.

### `prepare` — create the voice and storyboard

```powershell
python scripts/short_studio.py prepare --batch-id first-batch --topic roblox-myths --slot 1
```

The approved script needs renderer source files before preparation: a `shots.py` plan inside the Blox project for the 3D themes, or an episode under `studio/src/episodes/` for the vector theme. The AI command creates these as part of its workflow. Inspect the storyboard before rendering.

### `render` — export the approved, prepared video

```powershell
python scripts/short_studio.py render --batch-id first-batch --topic roblox-myths --slot 1
```

The command stops if the script was not approved or the slot was not prepared. It copies the MP4, script, research, caption, and storyboard into `out/short-studio/`.

### `status` — check the queue

```powershell
python scripts/short_studio.py status --batch-id first-batch
```

Possible states include `empty`, `awaiting_approval`, `approved`, `prepared`, `rendered`, and `skipped`.

### List, rename, and continue a batch

List saved batches and their IDs:

```powershell
python scripts/short_studio.py list
```

Rename a batch in place. Its queue, saved files, manifest paths, and rendered outputs move with it:

```powershell
python scripts/short_studio.py rename --batch-id first-batch --new-name december-shorts
```

In Claude Code or OpenCode, continue the existing queue with its current ID:

```text
/short-studio-continue december-shorts
```

This resumes the existing slots; it does not create a new batch or copy the episode templates again. Use `/short-studio-rename <old-id> <new-name>` to rename from chat, or `/short-studio-list` to find the ID.

## OpenCode

The project also includes an OpenCode `/short-studio` command. Start OpenCode from the project folder and enter the same topic prompt. The setup and approval flow is the same.

## Cost and research

The project code makes no paid API calls by default. Local voices and rendering use the computer; the Blox theme also synthesizes music and sound effects locally. Claude Code uses the plan/account configured by its user. Trend research depends on browser/search access; if that is unavailable, ask the owner to provide sources rather than treating guesses as current trends. ElevenLabs and other external services are optional and are not called unless explicitly selected.
