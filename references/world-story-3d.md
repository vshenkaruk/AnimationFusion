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

If a sentence says the character opens, carries, drops, touches, enters, escapes through, or chooses something, the storyboard must show the action and the result. Do not use a decorative effect to stand in for the action. Do not put an object into the scene only because another story used it.

## Pacing and coverage

For a 30-second episode, use roughly 6–9 readable shots, with a clear visual hook in the first 1–2 seconds. Keep the premise simple enough to show, then escalate through a location, scale, or consequence change every few seconds. Insert one short reaction beat where a character's emotion changes the viewer's interpretation. End with a visual payoff and a concise spoken CTA; keep the CTA card clear of the last action and timed caption.

Use wide, medium, close, and insert coverage deliberately. A world/map view establishes geography; a close insert proves the clue or object; a reaction shows the character understood it; a wider return proves the result in context. Reuse establishing landmarks when the story revisits a place. Use transitions as a story bridge (portal/map-fold) or an action accent (flash/whip/push), not as decoration between every cut.

## Renderer capabilities

`world-story-3d` uses Remotion + Three.js at 1080×1920 and 30 fps. It provides block-built actors with deterministic idle, walk, run, point, cheer, shock, recoil, slap, jump, spin, and dive movement; configurable camera endpoints; per-shot sets and lighting states; reusable map, door, pickup-pin, wave, and breakaway-bridge components; optional route/choice graphics and a per-episode countdown; and timed screen cues for impact, sparkle, speed lines, portals, pins, and flashes. Current location presets include town, park, school, dream, forest, candy canyon, clockwork sea, home, harbor, underwater, control room, and map table. A new story may combine these or add its own subject-specific meshes in `shots.tsx`.

The engine does not have a general physics solver, automatic collision detection, automatic hand/prop attachment, imported Roblox assets, or semantic scene generation. Actor paths and prop animation must be authored in the shot component; `travelFrames` lets an authored path reach a mark before the shot ends, but does not calculate contact. The current cat rig is a simple block-built creature, not a full animal rig. Treat composition and screen-proof as required: a theme label does not make every script line animate itself. Add an animal, machine, landscape, or interaction only when the current episode needs it, then author the action explicitly and inspect multiple frames across it.

## Fast review checklist

- Can a viewer identify the location and protagonist without reading the caption?
- Is the key prop large enough and lit clearly enough to understand on a phone?
- Does every narrated choice or action appear in the shot?
- Do camera distance and angle change as the stakes escalate?
- Does a change of location or world state have an understandable cause?
- Are character paths and screen-space effects clear of each other and the captions?
- Does the final CTA avoid covering the payoff?
- On playback, does the voice match the character/emotion, do captions follow the spoken words, and do impacts/whooshes land on their actions?
