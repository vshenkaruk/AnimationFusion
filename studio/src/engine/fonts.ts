import { loadFont } from '@remotion/fonts';
import { staticFile } from 'remotion';
import { STUDIO } from '../studio.config';

// Use installed system fonts so the local renderer does not fetch fonts from a
// remote service. A user-supplied local title font remains supported.
if (STUDIO.titleFont) loadFont({ family: STUDIO.titleFont.family, url: staticFile(STUDIO.titleFont.file), weight: STUDIO.titleFont.weight });

export const FONT = {
  title: STUDIO.titleFont ? STUDIO.titleFont.family : 'Impact, Arial Black, sans-serif',
  ui: 'Consolas, "Courier New", monospace',
  hand: '"Comic Sans MS", "Segoe Print", cursive',
};
