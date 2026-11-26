# AnimationFusion style-theme handoff

Paste this into the next Codex chat/model, or open this file from the AnimationFusion workspace.

## Goal

Continue the existing AnimationFusion work in this repository. Start by reviewing the current goal chat/history and this handoff, then turn the user's repeated requests into one clear checklist and resolve conflicts using their latest instructions. The user wants a reusable animation skeleton informed by the supplied ten 1–3 minute video references, then improved with their own stories and assets. They still say they want it “1:1” in the sense of matching the reference's visual feel, pacing, action detail, and storytelling very closely from scratch; they do not want to download, repost, or redistribute the finished videos. Use any friend-provided image as an additional reference when it is available; if the new chat cannot see it, ask the user to attach it again while continuing with the clips and repo. Their priority is a much cleaner, more fluid, story-first blocky 3D treatment: readable character actions and contact, camera changes, distinct locations, lighting, purposeful transitions, effects and sound tied to the script, expressive faces, and timing that matches captions and narration. The sample episode is a test of the theme, not the end goal. Keep iterating toward the requested quality; do not call it finished just because it renders or passes numeric QA.

Use the supplied videos as primary visual research to extract a reusable production skeleton: story beats, pacing, shot sizes, camera/lighting changes, visual proof of actions, facial reactions, transition rhythm, captions, effects, and how settings/props support the story. Build an original engine and new scenes from that skeleton, then make them cleaner and more engaging. The user says the videos are their friend's work and provided them for analysis; no formal license is needed for this framework work. Do not repeatedly stop to ask for a license or confuse close style/skeleton recreation with reposting the finished video. The checked-in reference study records the existing sampling method and limits; review/update it if deeper footage analysis changes the findings.

The user explicitly asked to use subagents when helpful to speed up analysis and implementation, including dividing independent video clusters, reusable-system design, engine review, and QA. Delegate distinct work with concrete deliverables, consolidate findings yourself, and do not mistake a subagent's few sampled frames for a full-video audit. The user previously authorized merging/pushing the completed work to the main AnimationFusion repository once it is actually ready. Preserve all existing workspace changes. Do not reset, discard, or overwrite unrelated work. Before any eventual push, inspect the branch, remote, and full status and include all intended project changes.

## Reusable library the user wants

Do not let the research remain only in chat or one sample episode. Save reusable, selectable systems in the repository so future episodes can use and improve them:

- Theme/style profiles with visual rules, pacing, caption conventions, camera/lighting defaults, and supported renderers.
- Character archetypes and character sheets with reusable model/rig options, role, silhouette, wardrobe/props, and facial-expression controls (eyes, brows, mouth, emotions and transitions between them).
- Reusable action clips/pose rigs for verbs such as reach, grab, touch, open, hit, dodge, chase, fall, react, and recover, with contact points and continuity constraints.
- Asset/model and prop catalog with preview, attribution/license/source, engine compatibility, scale, and known limitations.
- Environment/place library with distinctive sets, geography, reusable set dressing, lighting variants, and scale references.
- Camera moves, transitions, VFX, SFX, music/voice profiles, captions and CTA treatments, with rules for when each fits.
- A story-to-style chooser that selects only compatible pieces from topic/script/research, while allowing a blend when appropriate. It must not force every motif or engine into every episode.

Keep the 2D, Blender, Roblox-like/blocky, and Remotion/Three.js paths distinct where their capabilities differ. A 2D theme must not be routed through Blender merely because a new 3D library exists. Record source and license for any third-party models, sounds, or code that are actually bundled. The reference videos are research material, not assets to include in the final videos. The current README says Kenney character clips do not supply facial-expression animation or collision solving: add and validate face-expression support rather than assuming it exists.

## Reference coverage already completed

The ten supplied MP4s total about 22 minutes. Their names, durations, timecoded observations, limits, and broad patterns are recorded in `references/world-story-3d-reference-study.md`.

- An overview sampled about one image per second across each full clip (roughly 1,330 samples overall).
- A full-duration motion scan decoded the 30 fps sources and compared small grayscale samples every eighth frame (3.75 samples per second) to rank sustained-motion windows.
- Four high-change windows per clip were inspected as contact sheets at 8 fps for about 1.9 seconds each.
- This was not a manual inspection of every source frame at 30 fps. It can miss very fast action between samples. Source audio was not listened to or transcribed, so claims about spoken wording, delivery, or source sound-to-picture sync are not verified. Do not overstate the analysis.
- For generated previews, `short_qa.py` scans every output frame numerically and produces two-second contact sheets; manually inspect time-spaced frames around important actions as well. Numeric QA cannot judge whether a pose looks good or a story makes sense.

## Current implementation and files

The new theme is a Remotion + Three.js path, not Blender. The 44.4-second sample episode is “The Doom Scroll That Made His Legs Taller Than a Skyscraper.”

- Episode: `studio/src/episodes/world-story-scale-scroll/episode.json`
- Generated timeline: `studio/src/episodes/world-story-scale-scroll/timeline.json`
- Shot animation: `studio/src/episodes/world-story-scale-scroll/shots.tsx`
- Shared renderer/sets/captions/effects: `studio/src/engine/storyworld.tsx`
- Registration: `studio/src/episodes/index.ts`
- User docs: `README.md`, `references/world-story-3d.md`, and `references/world-story-3d-reference-study.md`
- Third-party asset notices: `THIRD_PARTY_NOTICES.md`

Important pipeline detail: camera edits in `episode.json` do not appear in the composition until the generated timeline is rebuilt. After editing an episode, run from `studio/`:

```sh
../.venv/bin/python ../scripts/plan.py world-story-scale-scroll
npm run typecheck
```

Then render the composition from `studio/` (the local Chromium/graphics render may need the already-authorized graphics permission):

```sh
./node_modules/.bin/remotion render src/index.ts WorldStoryScaleScroll /private/tmp/world-story-scale-scroll-preview-r45.mp4 --scale=0.5 --codec=h264 --x264-preset=veryfast --jpeg-quality=70 --overwrite --gl=angle --concurrency=1 --log=error
```

## Latest actual state (R44)

- Preview file: `/private/tmp/world-story-scale-scroll-preview-r44.mp4`
- 540×960, 30 fps, 1,332 frames, 44.459 seconds.
- `npm run typecheck` passed; `plan.py` produced 20 segments / 20 shots / 44.4 seconds. It still warns that S15 holds for 4.4 seconds and asks for an action/light/push or split; inspect and decide whether the CTA action in the shot is enough to satisfy it.
- R44 source includes a larger V-shaped knee pose, compact low-poly knee joints, a short eased knee/body recoil, and a redesigned S8: the sleeper lies on a visible bed/pillow, the feet extend together through a framed window, and the three-quarter camera keeps both jambs visible. These are improvements, not final polish.
- Time-spaced R43 stills are in `/private/tmp/r43-frame-*.png`; R44 exact impact stills are `/private/tmp/r44-frame-476.png`, `477`, `479`, and `480`. The R43 S8 frames at 575/583/601/625 show the widened view and lowered sleeper; R44 only changed the S6 impact easing after that render.
- R44 raw frame QA found no black frames, unplanned white frames, or frozen spans. It flagged frames 477 and 479 before the effect window was classified. I inspected those exact frames: the changes are the intentional, expanding ceiling-contact rings plus the authored compression. With the known impact window 474–482 listed as planned in `/private/tmp/r44-shots.json`, the QA report at `/private/tmp/world-story-scale-scroll-r44-qa-planned/report.md` shows no unplanned pops. Do not hide a genuine glitch by marking it planned; the current planned interval corresponds to the visibly authored impact effect.
- R44 audio QA passed signal checks: AAC stereo 48 kHz, 44.46 s; mixed mean −24.8 dB and peak −4.6 dB; no whole-mix silence longer than 1.5 s. This is not a listening, pronunciation, or speech/script alignment check. The source and rendered audio still need a real listen-through.
- Latest visual review: S6/S6B now reads as a cartoon bent-leg V gag, but the long rectangular legs remain rigid-looking; inspect if hinge/rebound needs more shaping. S8 now communicates feet projecting through the window, but the model/arms/shoes remain blocky and the framing/action can still improve. Continue with concrete defects from sampled frames rather than making unsupported “perfect” claims.
- The change is local and uncommitted/unpushed. Working tree already contains project work across README, notices, reference docs, renderer, TTS/SFX/plan scripts, a map episode, assets, outputs, and this theme. Preserve it.

## QA commands

The latest timing specification is `/private/tmp/r39-shots.json`; the R44 version adds the planned S6 impact range at `/private/tmp/r44-shots.json`. For later renders, generate a matching shots JSON from the rebuilt timeline and annotate only genuinely planned transitions/impact effects.

```sh
../.venv/bin/python ../scripts/quality/short_qa.py /private/tmp/world-story-scale-scroll-preview-r45.mp4 /private/tmp/world-story-scale-scroll-r45-qa /private/tmp/r45-shots.json
../.venv/bin/python ../scripts/quality/audio_qa.py /private/tmp/world-story-scale-scroll-preview-r45.mp4 --report /private/tmp/world-story-scale-scroll-r45-audio-qa.md --voice-source public/world-story-scale-scroll/voice.wav
git diff --check
```

Render still frames sequentially with `remotion still` around action start, contact, follow-through, and settle. Do not launch many Chromium still renders in parallel; that caused `SIGTRAP` crashes. Six parallel still browsers failed, while one sequential process works.

## Remaining work

1. Continue visually improving S6/S6B and S8 using sampled sequences; prioritize clear articulation, believable attachment, clean jamb/sill clearance, and smoother anticipation/contact/follow-through/reaction.
2. Review the complete 44-second preview across the generated two-second contact sheets, not only the two changed shots. Compare narration, words, captions, events, and visual actions; listen to the narration/mix because current audio QA does not.
3. Review the full theme and its extension beyond this one story: story-specific sets/props/actions, style guidance, checks, README instructions, reference study limits, and no requirement that 2D themes use Blender or this renderer.
4. Convert the reference findings into the reusable library described above, including facial expressions, and expose the compatible options through the theme/episode workflow.
5. Investigate the remaining script/production requests still outside this preview, including voice-provider selection (ElevenLabs, Windows, Voicemod, or none) and transparent per-stage timings. Do not claim Voicemod is installed/integrated unless verified in code and a working voice sample.
6. Fix actual defects, regenerate the timeline after episode changes, typecheck, render, visually inspect, run full-frame/audio QA, and repeat. Only then prepare the repository changes and use the user's prior authorization to merge/push to main; report what was and was not verified.
