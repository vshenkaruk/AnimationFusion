# World Story 3D: Reference Study

This is a production study for a reusable animation skeleton based on ten MP4s supplied for this project. The user wants a very close “1:1” match to the references' visual feel, pacing, detailed actions, and storytelling, recreated from scratch as a base for future iteration with their own stories and assets. They do not want to download, repost, or redistribute the finished videos. The user says the videos are their friend's work and supplied them for analysis; no formal license is needed for this framework work. This study captures broad visual and pacing patterns, but the sampling below is not a frame-by-frame audit, transcript, or proof that the current theme matches the references. Further targeted frame and audio review is needed for exact action, wording, and sound timing.

## Source coverage and method

All ten supplied files were checked for stream metadata. Each is vertical H.264 video at 576×1024 and 30 fps, with a 44.1 kHz stereo AAC audio stream. Their durations are:

| Clip | File | Duration |
| --- | --- | ---: |
| 00 | `Download.mp4` | 108.0 s |
| 01 | `Download (1).mp4` | 129.5 s |
| 02 | `Download (2).mp4` | 132.6 s |
| 03 | `Download (3).mp4` | 123.3 s |
| 04 | `Download (4).mp4` | 151.8 s |
| 05 | `Download (5).mp4` | 149.1 s |
| 06 | `Download (6).mp4` | 135.6 s |
| 07 | `Download (7).mp4` | 143.8 s |
| 08 | `Download (8).mp4` | 127.0 s |
| 09 | `Download (9).mp4` | 131.0 s |

The combined running time is about 22 minutes. Review used three visual passes:

1. An existing overview pass sampled about one image per second through each full clip, giving roughly 1,330 timeline samples. This maps locations, shot changes, visible text, and recurring objects.
2. A whole-clip motion scan decoded each 30 fps source and compared small grayscale images sampled every eighth frame (3.75 samples per second). It ranked short windows with sustained pixel change, discounting the largest jump in each window so one hard cut would not dominate every selection.
3. Four high-change windows per clip were then sampled at 8 images per second for about 1.9 seconds each. All ten contact sheets were inspected. The denser pass reveals brief actions and visual effects that the one-second overview misses.

This still is a sampled visual study. The 3.75-sample-per-second scan can miss a fast movement between samples, and its ranking can still favor camera moves, lighting changes, text changes, or cuts over character motion. The 8 fps windows show poses and event order but do not establish exact 30 fps choreography or collision timing. The audio streams are present, but speech and sound effects have not been listened to or transcribed in this study. No claims about exact voice timing or sound-to-picture sync should be inferred from it.

## Reusable visual grammar

- **Change the view when the story advances.** The clips often move from a broad location view to a character or object view, then to a reaction or reveal. Use wide shots to establish where the characters are; use medium shots for interaction; use close-ups for the clue, face, or prop that changes the stakes.
- **Make scale legible.** Aerial town views, tall buildings, giant objects, and oversized characters create immediate contrast. Establish a size reference—such as a character beside a door, vehicle, or object—before pushing close to the reveal.
- **Make locations distinct.** Daylight town scenes, dark streets, interiors, shops, parks, and fantasy spaces use different silhouettes, colors, and lighting. A new beat can change location, camera height, foreground framing, time of day, or a meaningful prop state; it should not merely reuse an unchanged classroom backdrop.
- **Show the narrated verb.** The stronger moments make an action visible: a character reaches for a lever, a portal draws someone in, a door opens, an object falls, or a light turns on. Useful reusable action beats are anticipation, contact/action, follow-through, and reaction. Choose them only when the script calls for that action; do not insert a door, portal, or other fixed prop into unrelated stories.
- **Use effects to communicate a cause or consequence.** Examples in the samples include a portal glow during travel, a brief particle burst during a transformation, lights revealing a creature, and a flash after a lever action. Tie VFX to the story event and keep the subject readable through the effect.
- **Use camera movement with purpose.** The sampled clips include aerial pushes, small moves toward a subject, angle changes, and prop-focused inserts. A camera move should reveal information, increase scale, or follow an action. Do not mistake a cut or camera move for character animation.
- **Keep captions readable and tied to narration.** Many sampled shots show short, high-contrast lower-frame caption units that change as the narration progresses. The new theme can use concise, narration-matched captions with its own typography and placement; it should not reproduce the source platform watermark or copy a creator's exact caption treatment.
- **Use hard cuts as the baseline, then motivate special transitions.** Many changes in the sampled windows are direct cuts. Use a special transition only when the story gives it a reason—for example, following a falling object, moving through a portal, or revealing a new scale.

## Variety across all ten clips

The extra clips change the setting, cast roles, and visual proof; the engine should select a pattern per story instead of reusing the scale-scroll episode as a template.

| Clip | Story pattern seen in the sample | Production pattern to support |
| --- | --- | --- |
| 00 | Creator and game-world scenes, then a mammoth and large in-world boards | A guide/protagonist, a creature reveal, and readable world-building props |
| 01 | Doom-scrolling changes leg length through class, bedroom, basketball, and skyline gags | A rule demonstrated by a phone, reactions in several places, then a scale payoff |
| 02 | Written warnings, a faceless figure, dark corridors, and flashlight reveals | Clue close-ups, a threatened character, a restrained light/fog reveal |
| 03 | Red-sky disaster states, city/tunnel travel, repairs, and the danger returning | A landmark that survives multiple lighting/weather states; helper and threat roles |
| 04 | Familiar homes and streets, a dog, a skinwalker transformation, and a chase | A family/pet cast, clear before/change/after poses, then a readable chase path |
| 05 | Neon robot, portal, future city, oversized gags, and a robot fight | A guide/threat pair, threshold crossing, new-world establishing shot, and action wide |
| 06 | Disaster imagery, bunker cutaways, a generator, lever, and underground rooms | A clear surface-to-interior geography change and a visible machine interaction |
| 07 | A pet warns a household before a huge night creature appears | Pet reaction as an early clue, window/door framing, silhouette scale reveal |
| 08 | Toys and money rain onto a town, keys select a door, a screen room reveals worlds | Many small props as a wide event, then one chosen object as the close-up clue |
| 09 | Giant flower/ant, baby and animal scale comparisons, chase, and family ending | Size references, repeatable scale marks, animal/child reactions, and a family payoff |

Roles that recur across these varied examples can be represented as reusable *choices*: lead, friend/foil, witness, helper/authority, pet/guide, or threat. A new episode should select only the roles its script needs, then assign each a silhouette, clothing colors, prop, and timed reaction. The samples do not justify putting the same cast, suburb, door, or effect into every story.

## Timecoded observations

Timestamps below identify moments from the supplied files to make the study auditable. They are examples of broad techniques, not a blueprint for recreating those shots.

| Clip and approximate time | Observed visual event | Original production lesson |
| --- | --- | --- |
| 00, about 8.6–10.5 s | A breakfast setup cuts to a character moving along a street with a small animal. | A location change can carry the story forward; make the new geography obvious in the first frame. |
| 00, about 15.6–16.9 s | A character raises and looks at a handheld screen; the view moves toward the screen. | Give important props an insert and a readable interaction, rather than mentioning them only in dialogue. |
| 00, about 58.5–59.5 s | A character appears to clip through a wall during a movement beat. | Treat this as a defect example: check trajectories against walls and props; do not let a character pass through solid geometry. |
| 01, about 1.3–2.2 s | An elevated camera travels into a dense city street. | Establish the setting with a moving aerial, then cut to the character-scale story. |
| 02, about 12–14 s | A tall, faceless figure is revealed first in a wide night view, then by its legs and upper body. | Build a suspense reveal from silhouette and scale; reveal detail in deliberate stages. |
| 03, about 69.6–70.8 s | A red alarm-like view gives way to characters running through a bright corridor. | Pair a clear danger cue with a visible reaction and a change in movement. |
| 03, about 76.8–77.8 s | The story cuts to a security-monitor wall and a character watching it. | A screen or map can orient the viewer and connect distant events. |
| 04, about 25.1–26.7 s | A large character changes form amid a short burst of particles. | Use a brief, readable effect for a transformation; show the before, change, and after. |
| 05, about 21.6–22.5 s | A character enters a bright, swirling portal. | Make a portal interaction sequential: approach, cross the threshold, then show the new location. |
| 05, about 117.8–118.8 s | A tall figure is shown in a wide city view, then closer to emphasize its height. | Use a wide-to-close scale reveal instead of relying on dialogue to say something is huge. |
| 06, about 100.5–101.4 s | A character reaches toward an emergency lever, followed by a bright flash and dark transition. | Attach the visual effect and scene change to the triggering action. |
| 07, about 19.5–21.4 s | Lights appear in darkness, then the creature's body is revealed at a much larger scale. | Use light, silhouette, and a reaction shot to pace a reveal. |
| 08, about 24.1–26.0 s | Objects descend through the sky while characters watch from below. | Show the source, falling path, and observer so a large event is easy to understand. |
| 08, about 45.1–47.1 s | A field of keys is followed by closer views of individual keys. | Establish quantity, then isolate a meaningful item when the story needs detail. |
| 08, about 70.7–71.4 s | A large door changes from closed to open across several sampled poses. | Animate the door state and frame the threshold so the audience can see that it opened. |
| 09, about 4.5–5.5 s | The view moves from a character to an oversized baby reveal. | Use a visible size reference and a cut or push that makes the scale change unmistakable. |
| 09, about 87.5–88.4 s | A character moves toward and interacts with a large screen. | For reach, touch, or grab actions, show contact and follow-through before cutting away. |

## Implementation and review rules for this theme

1. Turn every script beat into an explicit shot with a location, subject, camera framing, visible action, and resulting state. Any important noun in narration should be visible or clearly represented; any important verb should have a matching visual event.
2. For collisions, grabs, doors, buttons, jumps, and other prop interactions, inspect multiple timestamps across the complete action. Confirm that the character reaches the object, contact occurs at the right position, and the object or character responds afterward.
3. Validate character and prop paths against scene geometry. No walking through walls, floating feet without an intentional jump, intersecting bodies, or jittering between poses.
4. Make each escalation stage visibly different through a change in location, scale, camera angle, lighting, prop state, or character action. Keep continuity cues so the viewer still understands where the characters are.
5. Match the reference's visual and storytelling skeleton as closely as practical, but build every output from its own scene assets and keyframed actions rather than pasting source footage. Keep the skeleton reusable and data-driven: do not make one source-specific character, prop, scene, caption, or event sequence mandatory for unrelated future stories or other themes.

This study should inform the new `world-story-3d` theme only. It is not a requirement that other 2D or existing 3D themes switch renderers or inherit this look.
