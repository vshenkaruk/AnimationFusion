# Transitions and motion

AnimationFusion has five render themes: Blender-based `blocky-3d`, `monochrome`, and `rule-world-3d`; Remotion-based 2D `what-if`; and Remotion + Three.js `world-story-3d`. Treat theme-specific transitions as separate implementations; don't assume an effect exists in every renderer.

## Start with a purposeful cut

- Use a hard cut when the image, action, narration cue, or sound changes clearly.
- Use a match cut when the same shape, direction, color, prop, or gesture connects two places.
- Cut on the action or a key spoken word. Keep each shot's action readable before changing scenes.
- Avoid dissolves, generic wipes, and repeated flashes. A transition must clarify a change or carry energy into the next beat.

## Existing Blender path

A shot can use its existing move field (creep, push, reveal_push, crash_in, drift, or lock) to shape camera motion within that shot. A crash_in already cues a short whoosh in the post mix. Existing flash, impact, and sfx cues can accent a story beat. For a brief transition at the incoming cut, use:

```python
{
    "t0": 12, "t1": 18, "set": "Rooftop", "cam": "low",
    "move": "crash_in", "sfx": ["impact@1.2"],
    "transition": {"kind": "whip", "frames": 8, "direction": "left"},
    "text": "The signal lights up."
}
```

`kind` may be `whip`, `push`, or `flash`; duration is clamped to 6–12 frames at 60 fps. `direction` is `left` or `right` for `whip`; `color` is an optional RGB triplet for `flash`. The transition is composited after Blender frames render, so it adds no scene-render cost. `whip` and `push` automatically use the selected CC0 hard-whoosh sample when present. `flash` remains silent unless the shot also requests a matching sound.

The exact shot API is in kit/API.md. Named props and rigid motion can bridge a cut through a repeated shape or action. A transition does not replace a clear new angle, readable action, or story-specific background.

## Existing What If path

The shared Remotion engine supports timeline flash and shake effects. The author can animate a vector shape or object into the next shot and time the edit to a word using episode.json's edit cues. Use only effects and scene code the current episode can render. If a matching SFX track is used, align its whoosh/hit to the same beat; the engine does not synthesize a transition sound automatically.

## World-story 3D path

`world-story-3d` is a separate 3D Remotion composition. Its current transition kinds are `flash`, `push`, `whip`, `portal`, and `map-fold`, rendered as short overlays at incoming cuts. Choose them only when the story moves through a portal, map, impact, or quick location shift. Add a matching cue to the episode's mixed SFX stem; these visual overlays do not create sound. Reusable `impact`, `spark`, `speed-lines`, `portal`, `pin-pulse`, and `flash` screen cues are listed by frame in `timeline.json`. Use per-shot `set`, `light`, and `camera` fields to make location/state changes readable. Storyboard review includes the shared world renderer in its fingerprint, so an engine change invalidates an earlier approval.

## Check in the storyboard

Review both sides of every scene change:

1. Does the outgoing frame leave a clear visual question or action?
2. Does the incoming frame change place, scale, perspective, or story state?
3. Does the cut land on the matching word, movement, or sound?
4. Is the transition short enough that the audience sees the new scene immediately?
5. Does the motion fit the story and avoid hiding a weak set or generic character?

Use the per-shot storyboard as the fast preview. The full vertical render happens after the user approves it; `blocky-3d` uses 60 fps, while the Remotion episodes use their configured 30 fps timeline.
