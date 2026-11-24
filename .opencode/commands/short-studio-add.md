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
duration, then save those choices before research. Research each new video
again from current sources, including each topic separately when `all` is
selected. Do not reuse an older slot's research. Each script must end with its
spoken CTA. Preserve review and render approval gates.
