---
description: Continue a saved Short Studio batch from its existing queue.
---

Read `SKILL.md` in this repository and follow its “Continue and rename a saved
batch” workflow. The user's batch ID is:

$ARGUMENTS

If no batch ID was supplied, run `python scripts/short_studio.py list` and ask
which batch to continue. Run `status` for the selected ID and inspect its
manifest and existing slot files before acting. Never run `init`, create a
second batch, or copy the episode template when continuing. Reuse research,
scripts, renderer sources, storyboards, and completed renders. Work on the first
unfinished slot and preserve the approval and explicit theme-choice gates.
