# Upstream integration map

## Included in this package

| Source | How it is used | License / changes |
|---|---|---|
| [BetaVersionHQ/beta-version-blox-studio](https://github.com/BetaVersionHQ/beta-version-blox-studio) | Vendored Blender renderer under `kit/`; provides the blocky 3D theme and storyboard stills. | MIT notice preserved. Modified for vertical 1080 × 1920 / 60 fps, offline system speech by default, and removal of upstream branding. |
| [baerozgaarmard/animated-shorts-skill](https://github.com/baerozgaarmard/animated-shorts-skill) | Its `short_qa.py` offline video QA script is included at `scripts/quality/short_qa.py`. | MIT notice preserved. |
| [wyzowl/sfx-kit](https://github.com/wyzowl/sfx-kit) | Six CC0 WAVs for hard whooshes, impacts, a latch, shimmer, spin, and a riser. `kit/blox/post.py` reads each file's sync point and mix guidance from `kit/blox/assets/sfx/cc0/sfx-kit/manifest.json`. | CC0 assets and the upstream CC0 notice are preserved. The manifest pins the source commit and SHA-256 for each selected file. |
| User-provided What If animation project | Existing Remotion/vector animation engine and creative references remain in `studio/`, `scripts/`, and `references/`. | Root MIT license preserved. Its new `defineShortEpisode` path supports portrait 60 fps output. |

## Reviewed but not copied

- [Brave Search query: “githuib animation short studio”](https://search.brave.com/search?q=githuib+animation+short+studio) is a discovery link, not an upstream project. It led to related projects including [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts). That project also centers on Remotion, so it would duplicate the existing vector engine; no code or assets were copied.
- The user's TikTok references were not imported as media. Their descriptions guide the monochrome and blocky 3D themes. The blocky style here uses original characters and props and is not an official Roblox product.

The Blocky 3D polish update adapts upstream VFX timing and layering principles as original Blender geometry: a traveling trail, directional sound rings, eased prop arcs and spins, short scene transitions, licensed CC0 sound effects, a night-court set, and script/voice timing checks. It does not import the upstream Roblox Studio prefab pack or copy its code/assets.

## Additional GitHub research and implementation choices

These repositories were compared for direct engine compatibility, license clarity, render cost, and relevance to a clean short-form shot:

| Repository | Finding | Decision |
|---|---|---|
| [wyzowl/sfx-kit](https://github.com/wyzowl/sfx-kit) | CC0 standalone WAV effects with sync points, intended visual events, target loudness, and under-voiceover guidance. | Integrated six selected sounds. The mixer preserves file offsets, aligns each sound's named event to the requested action time, and uses the source level guidance under narration. |
| [daim1993/blender-energy-trails-fx](https://github.com/daim1993/blender-energy-trails-fx) | Demonstrates tapered trails, path-following cues, and layered flow. The README also describes a particle-heavy option; no repository license file was found during review. | Concepts only. `energy_trail` is original, small fixed mesh geometry; no upstream code or assets are copied. |
| [mrachinskiy/commotion](https://github.com/mrachinskiy/commotion) | Blender motion-graphics add-on with timing/offset ideas, distributed under GPL-3.0. | No code copied into this MIT project. Use the existing keyed-motion API and native post compositor. |
| [Mcamento8/omnimod-3d-library](https://github.com/Mcamento8/omnimod-3d-library) | Large CC0 low-poly OBJ library for general scenes and maps; useful when a story needs a matching prop, but not a Roblox character/action engine. | Reviewed, not bundled wholesale. Prefer story-built props to a generic asset dump that adds download size and clutter. |
| [KanzeroG/roblox-vfx-animation](https://github.com/KanzeroG/roblox-vfx-animation) | VFX examples and prefab workflow target Roblox Studio and `.rbxm`; some pack assets have separate Creator Store permissions. | Timing and layering concepts only. The prefabs cannot be used directly by this Blender renderer and are not redistributed. |
| [isaiahagi/roblox-ai](https://github.com/isaiahagi/roblox-ai) | Mixed-rights docs/reference gallery; the README cautions that references are not automatically free to reuse. | Use selected images only when explicitly loaded for comparison. Keep story art original; retain only the identified CC0 slap sample. |
| [Roblox/roblox-blender-plugin](https://github.com/Roblox/roblox-blender-plugin) | Blender-to-Roblox publishing tool, not a short-film renderer or character animation engine. | Not applicable to video rendering. |

### Resulting low-cost polish path

- Build the original three-ribbon `energy_trail` and arrow-tipped sound rings from a few polygons. They use the existing keyframe baker, so there is no particle simulation or 50,000-mote dependency.
- Use short `whip`, `push`, or `flash` transitions in the existing Pillow post stage. They composite over rendered frames, last 6–12 frames, and add no Blender scene-render work. `whip` and `push` also receive an event-synced licensed whoosh.
- A script cue such as `sfxkit_impact_heavy_hard@0.65` names the sound event time; the manifest offsets the WAV onset so the recorded sync point lands on the action. The screen-proof row maps it to the visible pose and VFX.
- Validate sound-file hashes, approved-script/shot/voice text, timed contact and crossing beats, and scene overlap before full render. These checks catch missing or impossible plan data; they do not replace reviewing the storyboard or listening to the preview.

These changes improve timing and readability without making the renderer trained on GitHub repositories. The renderer reads committed code/assets and the current project's shot data.

## Why the package combines these sources

The existing Remotion project supplies a 2D vector theme. The Blox Studio source adds a distinct Blender-based blocky renderer. The local queue presents them as choices per short and tracks research, approval, theme, preparation, and final render. The QA helper checks a rendered file locally and does not call a model or media API.

See [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and `../licenses/upstream/` for redistribution details.
