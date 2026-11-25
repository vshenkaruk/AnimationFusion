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

## Optional Voicemod live microphone

The renderer creates local narration and adjusts its rate using each video's `voice_tone` and `voice_speed`. Voicemod is a separate optional path for a creator recording narration through a microphone. Install Voicemod Desktop from its official site, open it, and set up a developer client key. Keep that key local, then run:

```powershell
python -m pip install -r kit\\requirements-voicemod.txt
$env:VOICEMOD_CLIENT_KEY = "your-local-client-key"
python scripts\\voicemod_control.py --project <episode-project> --list
python scripts\\voicemod_control.py --project <episode-project>
```

The helper reads `voice_tone` from the episode and selects a matching filter currently enabled on that account. After recording, provide `vo.wav` and matching `words.json` for the microphone audio before rendering. The live-mic Control API cannot transform the renderer's existing TTS file. Voicemod's free tier has a limited set of filters that rotates; see its current [Free vs PRO feature list](https://support.voicemod.net/hc/en-us/articles/360014300760-Voicemod-Features-Free-vs-PRO). Voicemod Desktop is not installed on the current computer, so this optional connection has not been activated here.

## Get the current repo commands

If you already cloned AnimationFusion, go into its folder and run:

```powershell
git pull
```

If you use a ZIP, download and extract the latest copy from GitHub. Open the updated AnimationFusion folder as the project in Claude Code, OpenCode, or Codex. Claude Code and OpenCode use the project commands in `.claude/commands/` and `.opencode/commands/`. Codex uses the repo-local skill in `.agents/skills/short-studio/`; start a new Codex session after updating so it discovers the skill.

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

For each new slot, the workflow asks you to choose the render theme, story format (`standalone` or `choice-story`), and exact target length from 30 to 60 seconds. Treatment is selected automatically after research from character-led, graphics-led, and hybrid options; you can request an override.

In Codex, ask: `Create exactly one AnimationFusion short about [topic]. Follow the short-studio skill and ask me for each choice one step at a time.` In Claude Code, use `/short-studio-one [topic]`.

Before work starts, expect roughly 4–10 minutes of research per video; 2–6 minutes for treatment scoring, beat plan, pitch, and script; and 2–10 minutes for voice and storyboard preparation. Choosing the three options is usually quick. Storyboard review and listening pauses depend on you. Preview and full-render times are machine-dependent: this computer uses comparable saved timings after a video completes; first runs are unbenchmarked. A 30–60 second final contains 1,800–3,600 frames at 60 fps, and your friend's computer has taken close to 50 minutes for a render. These are estimates, not guarantees. The CLI records actual preparation, preview, and final-render time so later estimates improve. For `/short-studio-add` with several videos, the research may run in parallel; scripting, preparation, review, preview, and final rendering still add time per video.

For a multi-video batch, Claude Code can research up to three topics in parallel using read-only subagents when its Agent and web-search tools are available. This can cut the serial research wait, but uses additional Claude usage and does not make Blender or Remotion renders run faster. OpenCode and sessions without subagent tools run the same research directly.

Research and topic/style scoring happen first. It makes a 5–7 image beat plan before writing the narration, prepares the complete script and spoken CTA, and waits for your pitch review. After approval, it builds the voice and storyboard; you review the prepared storyboard before preview. A choice-story asks viewers to comment A or B and gives the first short its own payoff. The CTA says “Part 2” only if the creator has decided to make one; generating a Part 2 is manual in this version.

Research looks for recent high-performing examples in the chosen style, current topic signals, and evidence of youth relevance when available. It notes source links, dates, and what is a fact versus a forecast. It does not promise a topic will go viral or copy another creator's content.

Review the idea, sources, and full script before approving. After script approval, inspect the actual storyboard. For blocky videos, replace the copied starter shot plan with the approved story's title/topic, enough story beats, varied camera framings, layered set depth, scene-specific props, and distinct character actions. Character-led or hybrid stories need a recognizable silhouette, signature color and prop, and a clear role for each character. If you want a particular Roblox look, attach a small reference pack (2–5 images) to the session; the assistant will inspect those actual images, record high-level cues, and compare the storyboard at phone size. Follow [the blocky 3D art-direction guide](references/blocky-3d.md) to keep the render clean and readable. Use the storyboard sheet to check the hook, location and scale changes, perspective, character design, actions, and scene continuity. Approve the storyboard before a quick audio preview.

### Manual storyboard review

After `prepare`, the storyboard is saved at `production/batches/<batch-id>/<topic-id>/short-<n>/project/stills_sheet.jpg` for Blender themes or `studio/out/<slug>/storyboard.jpg` for What If. Ask Claude to show it. To approve the current storyboard:

```powershell
python scripts/short_studio.py review-storyboard --batch-id <batch-id> --topic <topic-id> --slot <n> --decision approve
```

If changes are needed, use `--decision revise`, edit the scene plan, run `prepare` again, and review the new storyboard. The `preview` command uses the approved storyboard to create a fast 540×960 video with narration and the full 60 fps timing. Listen for missing, quiet, or cut-off voice and check scene timing. The automatic audio report checks source and output signal levels but cannot judge pronunciation or whether the narration sounds natural. If it is good, record your review, then run `render` for the unchanged 1080×1920 final. The render command also checks audio before delivering the file.

```powershell
python scripts/short_studio.py preview --batch-id <batch-id> --topic <topic-id> --slot <n>
python scripts/short_studio.py review-preview --batch-id <batch-id> --topic <topic-id> --slot <n> --decision approve
python scripts/short_studio.py render --batch-id <batch-id> --topic <topic-id> --slot <n>
```

## Output files

Each finished folder is under:

```text
out/short-studio/<batch-id>/<topic-id>/short-01/
```

It contains `final.mp4`, `preview.mp4`, `audio-qa.md`, `audio-qa-preview.md`, `script.md`, `research.md`, `visual-plan.md`, `post-caption.txt`, and `storyboard.jpg`. The video is a vertical 1080×1920 H.264 MP4 at 60 fps. Upload it manually to the social platform you choose.

## Treatment notes

| Treatment | How to use it |
|---|---|
| `character-led` | Let cast actions, reactions, and relationships tell the story. |
| `graphics-led` | Let moving props, diagrams, counters, and proof lead; characters are optional. |
| `hybrid` | Combine a distinctive cast with a clear visual metaphor or diagram. |

The choice reuses the existing renderers. In Blender styles, graphics-led means story-specific 3D props, camera movement, and existing caption/card layers; it does not add a new 2D overlay engine. What If uses its existing vector components. See [the blocky 3D guide](references/blocky-3d.md) for the visual polish checks.

## Theme notes

| Theme | Renderer | Notes |
|---|---|---|
| `blocky-3d` | Blender | Story-specific scenes, slap/knock gestures, quick low-poly effects, action-linked sound cues, and named rigid props |
| `monochrome` | Blender + FFmpeg | Same Blender scenes, actions, effects, and checks, then a black-and-white grade |
| `what-if` | Remotion | Separate 2D vector scenes, graphics, overlays, transitions, and audio mix |

Blocky 3D uses original generic human characters and no official Roblox assets. Both Blender themes use the screen-proof check to catch script-to-shot omissions; storyboard review checks the actual picture. Actions such as a door hit should show a matching contact pose, impact effect, and sound on the spoken hit word; doorway routes and spawn returns are checked against their visible landmarks. The selected CC0 sounds can be called in `shots.py` as `sfxkit_impact_heavy_hard@0.65`; the number is the visible action time, and the sound's recorded sync point is aligned to it automatically. `whip`, `push`, and `flash` transitions are added to the incoming shot and composited after scene rendering; whip/push add a synced whoosh. Story props can move as rigid objects, but they do not attach to hands or use physics; animal and robot actor rigs are not included. The monochrome theme shares the same Blender checks and then gets its grayscale grade. What If is a separate 2D vector renderer; `prepare` checks that its approved `script.md`, `episode.json`, timed `timeline.json` segment lines, and caption words in `words.json` match, that the spoken CTA is near the end, and that timing fits. It uses vector graphics and its own overlays, transitions, and audio—not Blender geometry or 3D physics. In every theme, design and check the story's actual objects/actions; there is no universal door requirement. A choice story must visually show both choices. Reference libraries guide the assistant only when their images are supplied or explicitly loaded. They do not train the renderer. New What If episodes need files under `studio/src/episodes/<slug>/` and a registration in `studio/src/episodes/index.ts`. The prepare command checks this.

### Repeat this quality sequence for every video

1. Choose the theme, story format, and duration; research the topic and current examples again.
2. Score character-led, graphics-led, and hybrid treatments; make a 5–7 image visual plan before writing narration.
3. Write the complete script and spoken CTA, then get the pitch/script approved.
4. Make every spoken line visible in the chosen engine. Show every story-critical prop and both sides of any A/B choice; use only effects the selected renderer supports.
5. Run `prepare` and fix any script, CTA, timing, or engine checks it reports.
6. Review the storyboard at phone size and inspect key action frames; revise and prepare again if anything is missing or confusing.
7. Render a preview, listen to the voice/music/effects, inspect the audio report, then approve the preview before the full render.

This sequence is stored in the repository's `SKILL.md` so Claude Code/OpenCode can repeat it each session. It is a playbook and validation workflow, not model training; it tells the assistant how to handle a new story without assuming every story contains the same props.

## Cost and research tools

Voice and rendering are local. Trend research uses the browser/search access available in Claude Code or OpenCode; if access is unavailable, the assistant should say it cannot verify current signals. Public starting points include Google Trends, TikTok Creative Center, and YouTube Culture & Trends. The repository does not read a creator's post analytics, generate a Part 2 automatically from views, or post to a social account.
