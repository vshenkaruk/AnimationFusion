# Third-party notices

This distribution combines multiple upstream projects. Retain the license files in `licenses/upstream/` when copying or redistributing the corresponding code.

## What If animation starter

The original project files in `studio/`, `scripts/`, `references/`, and the root project were supplied from [kelano86/what-if-animation](https://github.com/kelano86/what-if-animation). Its MIT license and attribution are in `LICENSE` (FreshStack, 2026). The Remotion packages and included media have their own terms; see the upstream source documentation and package licenses before commercial redistribution.

## Beta Version Blox Studio

The Blender engine in `kit/` is adapted from [BetaVersionHQ/beta-version-blox-studio](https://github.com/BetaVersionHQ/beta-version-blox-studio), under MIT. The upstream license and notice are in `licenses/upstream/blox-studio-MIT.txt` and `licenses/upstream/blox-studio-NOTICE.md`. This distribution changes the output to 60 fps and vertical 1080 × 1920, uses local system speech by default, and removes the upstream brand graphics and branded end card. Beta Version and Roblox names and marks remain their respective owners' trademarks; this project is not affiliated with or endorsed by them.

## Animated Shorts Skill

The offline QA helper in `scripts/quality/short_qa.py` is adapted from [baerozgaarmard/animated-shorts-skill](https://github.com/baerozgaarmard/animated-shorts-skill), under MIT. Its license is preserved in `licenses/upstream/animated-shorts-skill-MIT.txt`.

## Search and style references

The user-provided Brave URL is a search query, not a repository: `https://search.brave.com/search?q=githuib+animation+short+studio`. The search results included [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts), which was reviewed as a related Remotion project; no code or assets from it were copied. The supplied TikTok links were treated as high-level style direction only. No video, audio, character, or other creator asset from those posts is included.

## Roblox visual references and sound

[isaiahagi/roblox-ai](https://github.com/isaiahagi/roblox-ai) was reviewed as a mixed-rights visual reference gallery. Its `sfx/cc0-audio/impact-hit/slap-2-clean-3fe3c7ff.mp3` sample is included as `kit/blox/assets/sfx/cc0/slap-2-clean.mp3`; the upstream repository identifies the `cc0-audio` collection as CC0 in its [README](https://github.com/isaiahagi/roblox-ai#sound-effects). No gallery images or videos are redistributed here.

[KanzeroG/roblox-vfx-animation](https://github.com/KanzeroG/roblox-vfx-animation) was used as a design reference for effect layering, key poses, and timing. No code or `.rbxm` assets were copied. Its MIT-licensed Blender helpers primarily support Roblox model/animation export, and its prefab pack is designed for Roblox Studio with assets that may require separate Creator Store permissions; neither is bundled in this Blender video renderer. See the upstream [license](https://github.com/KanzeroG/roblox-vfx-animation/blob/main/LICENSE) and [asset notes](https://github.com/KanzeroG/roblox-vfx-animation#download-the-vfx-pack).
