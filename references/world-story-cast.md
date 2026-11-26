# World Story 3D cast and expressions

Pick the character who acts on a line and, when a reaction changes the story, one person who sees it. Give that person a sightline to the action. Use the same archetype in the close shot and the following wide so the viewer can recognize their hair and clothing.

| Archetype | Kenney model | Visual identity | Example beat |
| --- | --- | --- | --- |
| `explorer` | f | Side fringe, earrings, mint sweatshirt | Glances up from a phone |
| `teammate` | b | Red overalls, short dark hair | Watches the result of a pass |
| `authority` | q | Black suit and red tie | Catches the student scrolling |
| `witness` | e | Brown hair, freckles, lilac shirt | Looks up as the giant rises |

These four 3D characters share five face poses: `calm`, `curious`, `wary`, `startled`, and `amused`. Optional `gaze` moves the pupils from −1 to +1 across the face. For an impact, cue anticipation, hold through the last frame before contact, then reveal the reaction. With `at` set to the contact frame in the shot's local clock, a shot can use:

```tsx
<StoryActor
  rig="kenney" archetype="explorer" x={0} t={t} len={len}
  faceCues={[
    { f: 0, expression: 'curious', gaze: 0.6 },
    { f: at - 1, expression: 'curious', gaze: 0.6 },
    { f: at + 3, expression: 'startled' },
    { f: at + 12, expression: 'startled' },
    { f: at + 24, expression: 'amused' },
  ]}
/>
```

Keep cue frames in ascending order. The engine eases eye opening, pupil position, brow height and tilt, and mouth shape into each cue. Repeating a cue holds the pose. An actor with an archetype and no cues holds a calm expression. Direct selection of other raw GLB variants uses the model's baked artwork. The shot author controls speech timing and bodily gestures separately. Lip sync requires its own mouth cues.

In scale-scroll, the teacher's look and the student's stow share a beat (S5C). The router landing triggers a reaction on the protagonist's face (S13). At the choice (S15), the actor glances toward one option and then the other. Inspect the faces at delivery size, especially during the transition, contact and hold. Use body silhouette for wide reactions.

## Art and rendering

Each Kenney head has a textured front face. Only its two front triangles receive the expression texture. The 128-pixel tile retains the original skin, nose and hairline and follows the head through poses, so moving the camera can reveal the ordinary textured sides. Each actor has its own tile. The renderer uploads a new tile when facial values change. To reproduce the four clean tiles from the CC0 Kenney textures, run `python scripts/world_story_face_plates.py` from the repository root with Pillow and NumPy installed. The inputs and outputs are under `studio/public/assets/kenney/blocky-characters/`. See the bundled `License.txt`.

Roblox Studio authors can define a neutral face and key distinct eye, lid and mouth poses on an animatable head. This renderer borrows the principle of a shared expression vocabulary and implements it on the bundled textured meshes. For a native Studio head the equivalent workflow uses facial joints, pose mapping and FaceControls. [Roblox Creator Hub guidance on dynamic heads](https://create.roblox.com/docs/art/characters/facial-animation/create-basic-heads)
