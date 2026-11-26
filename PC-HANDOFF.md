# Resume AnimationFusion on Windows

This branch is a development checkpoint. The friend-facing release still lives on main. Start Codex in this clone on the PC so new renders use the PC hardware.

## Files to open first

1. Play the 44-second earlier preview in `docs/pc-handoff/world-story-scale-scroll-preview-r44.mp4`, then the revised classroom and window excerpt in `docs/pc-handoff/af45-class-house.mp4`. The newer excerpt covers only those shots.
2. Read `references/world-story-3d.md`, `references/world-story-cast.md`, `references/world-story-3d-reference-study.md` and `docs/pc-handoff/earlier-review.md`. The earlier review contains historical Mac paths. Work relative to this clone.
3. Extract the companion private references ZIP beside the repository. It contains the ten supplied clips plus comparison sheets, frame measurements and the source edit breakdown. Use clips/Download (1).mp4 as the roughly 129-second benchmark. Keep reference footage and study sheets local.
4. Inspect `studio/src/episodes/world-story-scale-scroll-full/`. The opening uses the short's shot implementations. Bedtime and school work is in progress. Check the finale import, narrator archetype, generated timeline, camera metadata and final sound mix first. The full registered composition depends on all of them. Existing generated voice and short audio stems are under studio/public. The separate Roblox Studio experiment is under docs/pc-handoff/roblox-reference-prototype.

## First prompt for the PC agent

Read PC-HANDOFF.md and its linked guides. Inspect the working tree and report the first reproducible build issue. Continue the World Story 3D benchmark from this checkpoint. Use the provided local clips to compare staging, silhouettes, facial reactions, scale, sets, camera motion, contact, caption timing and sound across entire sequences. Use bounded subagents for independent work if useful. Finish the missing full-episode shots, keep characters and props reusable, and preserve existing 2D theme rendering. Verify against the source across the opening, middle and ending. Show the rendered video and concrete remaining differences. Keep local inference and rendering free of paid API calls unless I explicitly choose another voice provider. Run the end-to-end checks before merging to main.

## Local verification

Install the repo prerequisites in README.md. From studio run `npm ci`, then `npm run typecheck`. Resolve incomplete full-episode imports before rendering. From the repo root run `python scripts/plan.py world-story-scale-scroll-full` after editing shot or camera metadata. From studio render a short range first using `npx remotion render src/index.ts WorldStoryScaleScrollFull test.mp4 --frames=0-299 --scale=0.5 --gl=angle --concurrency=2`. Confirm voice, caption onsets and contact frames in the actual preview. Then render the complete composition and run the repo's audio and frame QA. Record hardware, resolution, frame range, concurrency and elapsed seconds before predicting full render time.
