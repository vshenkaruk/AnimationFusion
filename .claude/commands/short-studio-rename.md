---
description: Rename a saved Short Studio batch in place.
argument-hint: <batch-id> <new-name>
---

Read `SKILL.md` in this repository. Parse the current batch ID and new name
from the user's arguments:

$ARGUMENTS

If either value is missing, run `python scripts/short_studio.py list` and ask
for the missing value. Then run:

```powershell
python scripts/short_studio.py rename --batch-id <batch-id> --new-name <new-name>
```

Report the resulting batch ID. The CLI moves the existing batch and rendered
outputs and updates manifest paths; it does not create a fresh queue. If the
target name already exists, report the collision and leave the original batch
untouched.
