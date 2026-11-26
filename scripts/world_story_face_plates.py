"""Rebuild the small, editable front-face tiles from the bundled Kenney CC0 atlases."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "studio/public/assets/kenney/blocky-characters"
# Hair fringe edge in tile pixels; keep the hair, freckles, nose, ears, and beard.
FRINGES = {
    'f': [(0,61),(9,41),(19,28),(29,22),(38,24),(49,34),(60,42),(73,50),(86,55),(99,55),(113,51),(127,49)],
    'b': [(0,39),(16,39),(30,37),(43,34),(62,27),(78,22),(94,21),(108,22),(127,32)],
    'q': [(0,25),(15,22),(32,25),(49,35),(65,39),(82,35),(99,25),(115,21),(127,28)],
    'e': [(0,46),(20,50),(37,50),(52,44),(72,31),(90,23),(102,23),(112,31),(127,65)],
}


def clean_tile(variant, points):
    tile = Image.open(ROOT / 'Textures' / f'texture-{variant}.png').convert('RGB').crop((128, 128, 256, 256))
    pixels = np.asarray(tile).astype(float)
    y, x = np.mgrid[:128, :128]
    edge = np.interp(x, *zip(*points))
    eye_regions = (((x >= 17) & (x < 54)) | ((x >= 76) & (x < 119))) & (y >= 38) & (y <= 79)
    mouth_region = (x >= 42) & (x <= 98) & (y >= 82) & (y <= 106)
    mask = (eye_regions & (y > edge)) | mouth_region
    # Fill only the old eyes, brows and mouth. A harmonic fill carries the cheek
    # and beard colours smoothly into each hole, retaining the original edges.
    for _ in range(800):
        means = (np.roll(pixels, 1, 0) + np.roll(pixels, -1, 0) + np.roll(pixels, 1, 1) + np.roll(pixels, -1, 1)) * .25
        pixels[mask] = means[mask]
    return Image.fromarray(np.uint8(np.round(pixels)))


if __name__ == '__main__':
    output = ROOT / 'expressions'
    output.mkdir(exist_ok=True)
    for variant, fringe in FRINGES.items():
        clean_tile(variant, fringe).save(output / f'face-{variant}.png', optimize=True)
