# Blocky 3D art direction

Use the supplied Goopie and Synelite TikTok links as style references for a polished blocky-game short. Use high-level visual lessons only; keep the cast, story, sets, staging, and artwork original. Reference videos are supplied here:

- [Goopie example](https://www.tiktok.com/@goopie.yt/video/7710822244808707360)
- [Synelite example](https://www.tiktok.com/@synelite1/video/7710324819836833057)

The reference pages may not be playable in every Claude Code/browser setup. Do not claim to have reviewed frames or their camera work when you cannot open the clips. Ask the creator to describe a specific shot only if it materially changes the intended look; otherwise use this guide.

## Target frame

Aim for clean, cinematic, readable blocky 3D: one clear focal action; strong separation between the character and the set; crisp silhouette; intentional color palette; soft contact shadows; visible foreground, subject, and background; camera angle and shot scale that make the action easy to read on a phone. Keep the frame full enough to feel designed while leaving breathing room around faces, hands, props, and captions.

Make the setting serve the beat. Give each location a few large, readable landmarks and story props. Add smaller detail only when the camera is close enough to show it. Use restrained surface variation and a few well-chosen colors instead of piles of noisy textures or random clutter. Use the supplied street/kitchen sets and lighting helpers as starting points, then make the story's location and props distinctive.

## Character and material direction

For every recurring character, specify a different silhouette, body proportions, clothing/color block, signature prop, role, and attitude. In wide shots, read the character by silhouette and color; in close-ups, preserve face visibility and the action. Characters must act on the line: point, reach, turn, recoil, exchange, or react with a held pose. Avoid a line of generic idle actors.

Use broad, consistent material families: matte body/clothing, slightly varied roughness for wood/paint/metal, and small controlled emissive accents only on visible practicals or story-critical cues. Avoid uncontrolled metallic shine, blown-out emissive areas, noisy procedural surfaces, and duplicate materials that do not read at phone size. Keep feet and props grounded with contact shadows and correct scale.

## Lighting and framing

Keep a clear key, gentle fill, and rim/separation light where the story motivates them. Give the light a visible source when practical: window, lamp, sign, screen, sun, doorway, or vehicle light. Use contrasting warm/cool color only when it supports mood. Protect face and hand readability; do not bury the action in darkness, fog, bloom, or motion blur.

Use the existing EEVEE render setup and set builders. Frame the main action inside the vertical safe area. Plan an establishing wide with foreground depth, a medium for interaction, a close or insert for the key prop, and a changed angle/scale for the reveal. Change location, camera scale, or scene state as the story escalates, at least every 6–8 seconds. Make each change readable; do not add a camera move or transition just for decoration.

## Fast polish loop

1. Replace the starter shot plan with 5–7 story-specific visual beats and distinct actions.
2. Review the storyboard contact sheet at phone size. Fix flat lighting, empty backdrops, weak silhouettes, confusing hands/props, and repeated framing before animating.
3. Render the half-resolution preview with voice, captions, music, and sound effects. Listen to the narration and inspect scene timing.
4. Render the full-quality master only after the storyboard and audio preview are acceptable.
5. If a rendered shot feels generic, change its set landmarks, prop, light source, pose, or camera composition. Do not add a new renderer or expensive global effects as the first fix.

The quick preview lowers output resolution to 50%, disables motion blur, and reduces expensive EEVEE features for review. It is for pacing and audio checks; judge final material and lighting quality from the full render.

Keep the published final at 1080×1920 and 60 fps. Speed work must not silently reduce those final settings.
