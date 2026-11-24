# Per-video visual treatment

The render theme chooses the existing engine. The treatment chooses what carries the story. Automatic selection is the default; users can request a fixed treatment. The A/B `story_format` remains a separate choice.

| Treatment | Story driver | Use it when |
|---|---|---|
| `character-led` | Cast choices, action, reaction, and relationships | The viewer needs to care about a person or compare two decisions. |
| `graphics-led` | Objects, diagrams, counters, maps, visual proof, and movement | The idea is easier to understand as a visible system than as a conversation. |
| `hybrid` | A cast member interacts with a clear object or graphic metaphor | The story needs both emotion and explanation. |

## Automatic treatment scoring

After fresh research and before the final pitch, score each treatment 0–2 on three factors:

1. **Topic fit:** how naturally this topic can be shown using the treatment.
2. **Story fit:** how well it supports the story's emotion, choice, or explanation.
3. **Reference fit:** how closely current high-performing examples in the selected style/topic use this visual grammar.

Write one row per treatment in `treatment-scorecard.md`:

```text
character-led: topic=0, story=0, reference=0
graphics-led: topic=0, story=0, reference=0
hybrid: topic=0, story=0, reference=0
evidence: cite the current research that affected the scores
why: explain the selected treatment and any useful secondary device
```

The CLI calculates the totals and checks the choice. Use the highest-scoring mode unless hybrid is tied or within one point of the highest; then choose hybrid. When one mode leads by at least two points, make it the base and borrow at most one device from another mode if that serves the story. Don't force all three modes into every episode. These are creative-fit scores based on available evidence, not predicted views or a promise of engagement. User-requested overrides take precedence.

## Reuse the current engines

- **blocky-3d:** Use existing Blender characters, story-built sets, named rigid props, supported camera moves, lighting, and post captions/cards. A graphics-led scene can follow a moving object or show a physical metaphor. The current Blender path does not provide a general 2D HUD, physics, hand attachment, or new actor rigs.
- **monochrome:** Uses the same Blender geometry and motion as blocky 3D with a final monochrome grade. The treatment choice still applies.
- **what-if:** Use current Remotion vector-shot components, shapes, labels, overlays, and timeline effects. Build diagrams as original vector components where the existing episode code supports them.

Do not describe an effect in the pitch as available unless the selected engine already supports it or the user approves implementing it.

## Story-first visual plan

Before writing narration, make 5–7 numbered key-image beats in `visual-plan.md`. Each beat names its approximate time, action/image, shot scale or perspective, story place/state, and the line or dialogue it carries. The CLI requires this plan and saves it with the pitch.

For each beat, ask: what should the viewer notice, predict, feel, or understand in this image? A line that cannot be visualized should be rewritten or paired with concrete proof. Let the images establish the script's order; don't write a generic paragraph and decorate it afterward.

## Visual and cast gates

For all treatments:

- Open with a legible image or action. Show a meaningful change in location, scale, camera, prop, lighting, or story state every 6–8 seconds as a guide.
- Change shot size or angle across adjacent beats. A wide shot should separate foreground, subject/midground, and background, with a clear perspective direction.
- Stage at least one reveal, reversal, reaction, or payoff. Prefer a cut on action, a spoken keyword, or a music beat.
- Keep the frame purposeful: a few readable props and depth layers are better than a crowded set or decorative effects with no story job.
- At storyboard size, confirm the action reads without narration and the subject separates from the background.

For character-led and hybrid treatments, give every recurring character a different silhouette, signature color, prop, role, and attitude/flaw. Keep those anchors stable across a series. Review the cast and first storyboard frames before rendering; revise any cast member who reads as a default mannequin or cannot be identified at phone size.

For graphics-led treatments, make the subject of each shot unmistakable: a prop, diagram, counter, map, or proof point. Keep labels short and readable, and show how the value or state changes. Never use fake charts or make evidence look stronger than its source.

## Engagement without clutter

Use one or two story-relevant viewer actions: predict the outcome, choose A/B, spot a clue, compare a before/after, or follow for another episode in a series the creator has chosen. Show the evidence or consequence before asking for a response. A CTA should feel like the next beat of the story, not an unrelated sign-off. Engagement choices do not guarantee reach.
