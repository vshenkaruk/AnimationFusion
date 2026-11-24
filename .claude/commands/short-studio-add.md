---
description: Add freshly researched video slots to an existing Short Studio batch.
argument-hint: <batch-id> <topic-id|all> [count per topic]
---

Read `SKILL.md` and follow the `/short-studio-add` workflow. Arguments:

$ARGUMENTS

Inspect the existing manifest and confirm the batch and topic IDs. Run the CLI
`add` command on that batch; never run `init`, rename the batch, or copy
folders manually. The default count is one new slot for the selected topic, or
one per topic when the selection is `all`.

For every new slot, ask for its theme, story format, and exact 30–60 second
duration, then save those three choices before research; treatment stays
automatic unless the user requests an override. Before starting, show this
per-video rough timing: research 4–10 minutes; treatment score, visual plan,
pitch, and script 2–6 minutes; voice and storyboard preparation 2–10 minutes.
Give preview and full-render estimates from saved local timings when available;
otherwise label them unbenchmarked (the friend's first full render took close
to 50 minutes). For multiple new slots, explain that independent research may
run in groups of up to three, while scripting, preparation, review, and renders
still take per-video time. Give elapsed times after long local stages; these
are estimates, not guarantees.
For multiple topics, use up to three read-only research subagents in parallel
when Claude Code's Agent and web-search tools exist; keep file changes and
treatment scoring in the main session. Research every new video from current
sources. Do not reuse older-slot research. Each script needs its spoken CTA.
After storyboard approval, render and play a low-resolution audio preview.
Record `review-preview --decision approve` before the final render. Subagents
can speed the research wait, not Blender/Remotion renders, and use additional
Claude usage.
