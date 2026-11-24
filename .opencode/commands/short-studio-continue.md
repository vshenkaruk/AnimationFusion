---
description: Continue a saved Short Studio batch from its existing queue.
argument-hint: <batch-id>
---

Read `SKILL.md` and follow its “Continue and rename a saved batch” workflow.
The user's batch ID is:

$ARGUMENTS

If no batch ID was supplied, run `python scripts/short_studio.py list` and ask
which batch to continue. Run `status` for the selected ID and inspect its
manifest and existing slot files before acting. Never run `init`, create a
second batch, or copy the episode template while continuing.

For an empty new slot, ask for theme, story format, and exact 30–60 second
target. Save those three choices, leave visual treatment automatic unless
overridden, then research afresh. For a new slot, show per-video rough ranges:
research 4–10 minutes; treatment score/visual plan/pitch/script 2–6 minutes;
voice/storyboard preparation 2–10 minutes. For a partially completed slot,
estimate only the remaining stages. Use saved local preview/render timings
when available; otherwise label them unbenchmarked, and note first full renders
can take tens of minutes (the friend's computer has taken close to 50 minutes).
Give elapsed times after long local stages; estimates are not guarantees. For an
`awaiting_approval` slot, show its saved research, pitch, and complete script,
including the spoken CTA, and wait for the user's decision. For a revised
slot, refresh research if the user requests a new angle or the old trend signal
has gone stale. For `approved`, finish missing source/preparation work; for
`storyboard_ready`, show the current storyboard and ask for approval or changes. For an approved `prepared` slot without a current preview approval, run `preview`, show it and the audio report, and let the user listen. If approved, run `review-preview --decision approve`, then the final `render`. Legacy `prepared` slots without a review fingerprint still need an explicit `review-storyboard --decision approve` before previewing. Skip
`rendered` and `skipped` slots. Do not regenerate or duplicate completed
slot folders.
