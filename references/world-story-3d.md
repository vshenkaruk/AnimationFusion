# World story 3D

This is the art-direction and production guide for AnimationFusion's `world-story-3d` renderer. It captures broad visual lessons from the user's supplied reference clips and turns them into original, reusable choices. It does not reproduce a creator's scripts, characters, exact shot sequences, logos, or source assets.

## What the reference review supports

The ten supplied clips are 108–153 seconds long. The full reference method and timecoded examples are in [world-story-3d-reference-study.md](world-story-3d-reference-study.md): a one-image-per-second overview across each full clip, a 3.75-sample-per-second scan of all frames, then selected 8 fps action windows. The denser samples help identify pose and event order, but they still do not prove exact 30 fps movement or collision timing. Embedded audio was not listened to or transcribed. Repeated broad visual patterns include:

- Begin with a wide or aerial view that makes the geography legible. Later, return to that geography so a change in the world has a clear before/after.
- Prove the story rule with a specific thing: a scale-changing character or animal, a key/door/control panel, a message page, a storm landmark, or a portal. Use the prop again at the payoff.
- Change framing with the beat: world wide → character two-shot → face reaction → close prop insert → large payoff wide. Overhead and low angles help make size and danger readable.
- Keep the protagonist identifiable through several locations with a silhouette, color pair, hair/accessory, or carried object.
- Use a visible state change in lighting or palette when the story changes state: clear daytime versus night threat, warm gold versus cool blue control room, or ordinary sky versus storm color.
- Keep captions short and high-contrast, but keep them clear of the face, hands, and story-critical object.
- Let locations change because the story moves there. The samples visit streets, homes, schools, shops, forests, control rooms, portals, and fantasy places; no single prop or backdrop belongs in every story.
- Make a small action readable through its states: a door goes from closed to open, a figure steps across the threshold, and a reaction confirms the result. Use a short effect at the state change rather than placing a glow beside a static prop.
- Use different reveal approaches where the story needs them: an elevated camera move into a street, lights that reveal a figure in darkness, particles around a transformation, or a portal that visibly draws a character across.

The reference notes are sampled visual observations; they do not establish exact choreography, word timing, voice quality, sound design, or every moment between frames. The repository stores the written playbook, not trained weights, source-channel footage, or automatic motion capture. A real review of a rendered video must include playback and audio listening.

## Script-to-screen contract

Every spoken beat in a new episode must specify its visible evidence before the renderer is called:

1. **Story beat:** the exact line or short phrase.
2. **Actor action:** what the character does, where they travel, and what their face/body should communicate.
3. **Prop proof:** the specific object that makes the line understandable. For a choice story, show both choices before asking the viewer.
4. **Shot:** framing and camera direction that make the action readable on a phone.
5. **World state:** set, lighting, weather/color cue, and any location change.
6. **Timed effects:** only the impact, sparkle, portal, speed-line, pin-pulse, or transition needed to clarify or emphasize the beat.
7. **Sound cue:** a matching one-shot SFX in the episode's mixed audio track when the action needs one; keep it aligned to the spoken action.

### Cast and location continuity

Choose cast roles from the current story rather than dropping a fixed cast into every episode: protagonist, friend/foil, witness, helper/authority, or threat/creature are useful starting points. Give each speaking or reacting role a readable silhouette, strong clothing colors, one memorable prop, and an emotional change that lands on a narrated word. Keep the active cast small enough that faces, hands, and the story prop remain readable on a phone. Use a reaction close-up at a story turn; do not leave a character's body and face neutral when the script says they notice, fear, celebrate, or understand something.

Build the place around the action. Establish the street, home, school, court, or fantasy setting with foreground, middle-ground, and distant landmarks; then move the camera through that geography so the viewer feels inside the location. Use a wide to orient, a medium to stage the cast, and an insert to prove the object or clue. Keep the same color/wardrobe cues and landmarks when returning to a location. A new clip should select the right archetypes and sets from its own script; the renderer does not infer these from text.

If a sentence says the character opens, carries, drops, touches, enters, escapes through, or chooses something, the storyboard must show the action and the result. Do not use a decorative effect to stand in for the action. Do not put an object into the scene only because another story used it.

## Pacing and coverage

For a 30-second episode, use roughly 6–9 readable shots, with a clear visual hook in the first 1–2 seconds. Keep the premise simple enough to show, then escalate through a location, scale, or consequence change every few seconds. Insert one short reaction beat where a character's emotion changes the viewer's interpretation. End with a visual payoff and a concise spoken CTA; keep the CTA card clear of the last action and timed caption.

Use wide, medium, close, and insert coverage deliberately. A world/map view establishes geography; a close insert proves the clue or object; a reaction shows the character understood it; a wider return proves the result in context. Reuse establishing landmarks when the story revisits a place. Use transitions as a story bridge (portal/map-fold) or an action accent (flash/whip/push), not as decoration between every cut.

## Renderer capabilities

`world-story-3d` uses Remotion + Three.js at 1080×1920 and 30 fps. It mixes authored block geometry with 18 included CC0 Kenney Blocky Characters variants and five Kenney commercial-city skyline models. Kenney's frame-seekable clips cover idle, walk, sprint, pickup, yes/no emotes, holds, melee, and interaction; authored shot beats add actor placement, scale, body/head/arm angles, phone attachment, and timed one-shot starts. The renderer also provides configurable camera endpoints; per-shot sets and lighting states; reusable map, door, pickup-pin, wave, and breakaway-bridge components; optional route/choice graphics and a per-episode countdown; and timed screen cues for impact, sparkle, speed lines, portals, pins, and flashes. Current locations include town, skyline, classroom, bedroom/interior and exterior, basketball court, park, school, dream, forest, candy canyon, clockwork sea, home, harbor, underwater, control room, and map table. A new story may combine the sets or add subject-specific meshes in `shots.tsx`.

The imported Kenney models are licensed generic game assets, not official Roblox assets. Their supplied animation clips are node-transform animations, not a facially expressive skin rig; this version has no animated facial-expression system, general physics solver, automatic collision detection, or automatic contact calculation. A phone can attach to an actor's hand, but arbitrary props still need authored transforms. The current cat rig is a simple block-built creature, not a full animal rig. `travelFrames` lets an authored path reach a mark before a shot ends, but does not keep a hand from passing through a wall or prove a foot landed. Treat composition and screen-proof as required: the theme does not make every script line animate itself. Add an animal, machine, landscape, or interaction only when the story needs it, then author and inspect several frames around its contact and reaction.

## Fast review checklist

- Can a viewer identify the location and protagonist without reading the caption?
- Is the key prop large enough and lit clearly enough to understand on a phone?
- Does every narrated choice or action appear in the shot?
- Do camera distance and angle change as the stakes escalate?
- Does a change of location or world state have an understandable cause?
- Are character paths and screen-space effects clear of each other and the captions?
- Does the final CTA avoid covering the payoff?
- On playback, does the voice match the character/emotion, do captions follow the spoken words, and do impacts/whooshes land on their actions?
