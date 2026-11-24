# Upstream integration map

## Included in this package

| Source | How it is used | License / changes |
|---|---|---|
| [BetaVersionHQ/beta-version-blox-studio](https://github.com/BetaVersionHQ/beta-version-blox-studio) | Vendored Blender renderer under `kit/`; provides the blocky 3D theme and storyboard stills. | MIT notice preserved. Modified for vertical 1080 × 1920 / 60 fps, offline system speech by default, and removal of upstream branding. |
| [baerozgaarmard/animated-shorts-skill](https://github.com/baerozgaarmard/animated-shorts-skill) | Its `short_qa.py` offline video QA script is included at `scripts/quality/short_qa.py`. | MIT notice preserved. |
| User-provided What If animation project | Existing Remotion/vector animation engine and creative references remain in `studio/`, `scripts/`, and `references/`. | Root MIT license preserved. Its new `defineShortEpisode` path supports portrait 60 fps output. |

## Reviewed but not copied

- [Brave Search query: “githuib animation short studio”](https://search.brave.com/search?q=githuib+animation+short+studio) is a discovery link, not an upstream project. It led to related projects including [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts). That project also centers on Remotion, so it would duplicate the existing vector engine; no code or assets were copied.
- The user's TikTok references were not imported as media. Their descriptions guide the monochrome and blocky 3D themes. The blocky style here uses original characters and props and is not an official Roblox product.

## Why the package combines these sources

The existing Remotion project supplies a 2D vector theme. The Blox Studio source adds a distinct Blender-based blocky renderer. The local queue presents them as choices per short and tracks research, approval, theme, preparation, and final render. The QA helper checks a rendered file locally and does not call a model or media API.

See [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and `../licenses/upstream/` for redistribution details.
