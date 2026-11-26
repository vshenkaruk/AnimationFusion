# Roblox Studio reference prototype

A local Roblox Studio scene study based on the supplied “Second Place” Short. It recreates the broad visual language: blocky racers, a colorful town street, large glowing speed gauges, a quick chase, motion trails, camera cuts, and bold timed captions. Characters, text, and set pieces are original.

## Open the saved place

Open `SecondPlacePrototype.rbxl` in Roblox Studio and press **Play**. The 22-second cinematic runs from `StarterPlayer > StarterPlayerScripts > Cinematic`. It hides the local player character and Roblox interface while the shot plays, then restores them. The place is local and has not been published.

## Source files

- `build_scene.lua` builds an editable road, storefronts, street furniture, start line, speed tokens, and three block avatars in `Workspace.SecondPlacePrototype`.
- `Cinematic.client.lua` contains the camera, chase motion, gauges, trails, and captions.
- `SecondPlacePrototype.rbxl` is the saved, runnable Studio place.

The saved place already contains the scene and LocalScript. To rebuild the scene in another local test place, run `build_scene.lua` from **View → Command Bar**, then add `Cinematic.client.lua` under `StarterPlayer > StarterPlayerScripts`.

This is a first visual test rather than a finished short. For a closer match to the vertical reference, frame or record the Studio viewport in a 9:16 layout.
