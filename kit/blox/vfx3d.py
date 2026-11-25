"""Low-poly, camera-facing meshes for brief Blocky 3D story cues."""
from __future__ import annotations

import math

import bpy

KINDS = ("burst", "sparkle", "ring", "ground_ring", "sound_rings", "signal_arrows", "dash", "comet", "energy_trail")


def _mesh(name: str, vertices: list[tuple[float, float, float]], faces: list[tuple[int, ...]]):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    return data


def _ring(vertices, faces, radius: float, width: float, segments: int = 20):
    base = len(vertices)
    for r in (radius, radius - width):
        vertices.extend((r * math.cos(2 * math.pi * i / segments),
                         r * math.sin(2 * math.pi * i / segments), 0.0)
                        for i in range(segments))
    for i in range(segments):
        j = (i + 1) % segments
        faces.append((base + i, base + j, base + segments + j, base + segments + i))


def mesh(kind: str, name: str):
    """Return a flat mesh that the renderer aims toward the camera from the set's open side."""
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, ...]] = []
    if kind == "burst":
        # A chunky star pop with varied ray length, inspired by the readable burst silhouettes
        # in the supplied Roblox VFX references.
        center = len(vertices)
        vertices.append((0.0, 0.0, 0.0))
        points = []
        for i in range(20):
            angle = 2 * math.pi * i / 20
            radius = (1.0 if i % 2 == 0 else 0.34) * (1.0 + 0.12 * math.sin(i * 4.17))
            points.append(len(vertices))
            vertices.append((radius * math.cos(angle), radius * math.sin(angle), 0.0))
        for i, current in enumerate(points):
            faces.append((center, current, points[(i + 1) % len(points)]))
    elif kind == "sparkle":
        # A crisp four-point glint for polished metal, gold trim, and other selected highlights.
        vertices = [(0.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.17, 0.17, 0.0),
                    (1.0, 0.0, 0.0), (0.17, -0.17, 0.0), (0.0, -1.0, 0.0),
                    (-0.17, -0.17, 0.0), (-1.0, 0.0, 0.0), (-0.17, 0.17, 0.0)]
        faces = [(0, i, i + 1) for i in range(1, 8)] + [(0, 8, 1)]
    elif kind == "ring":
        _ring(vertices, faces, 1.0, 0.13)
    elif kind == "ground_ring":
        # Floor-plane arrival/impact pulse; unlike a camera-facing ring it stays
        # around feet and pads instead of turning into a floating arch.
        _ring(vertices, faces, 1.0, 0.12, segments=32)
    elif kind == "sound_rings":
        # Perspective wave markers: three separate rings shrink toward a shared
        # forward point, with an arrow tip on each. This reads as a signal
        # travelling down the scene instead of a decorative halo around a prop.
        for radius, cy in ((0.47, -1.16), (0.34, 0.0), (0.23, 1.12)):
            base = len(vertices)
            _ring(vertices, faces, radius, 0.065, segments=24)
            for i in range(base, len(vertices)):
                x, y, z = vertices[i]
                vertices[i] = (x, y + cy, z)
            tip = len(vertices)
            vertices.extend(((-0.15, cy + radius * 0.73, 0.0),
                             (0.0, cy + radius + 0.13, 0.0),
                             (0.15, cy + radius * 0.73, 0.0),
                             (0.07, cy + radius * 0.71, 0.0),
                             (0.0, cy + radius * 0.83, 0.0),
                             (-0.07, cy + radius * 0.71, 0.0)))
            faces.extend(((tip, tip + 1, tip + 4, tip + 5),
                          (tip + 4, tip + 1, tip + 2, tip + 3)))
    elif kind == "signal_arrows":
        # Three separated, filled chevrons point away from the sound source.
        # The gap keeps the cue from collapsing into a floating loop/halo.
        for cy, scale in ((-1.0, 1.0), (0.0, 0.78), (0.95, 0.58)):
            base = len(vertices)
            vertices.extend(((-0.12 * scale, cy - 0.40 * scale, 0.0),
                             (0.12 * scale, cy - 0.40 * scale, 0.0),
                             (0.12 * scale, cy + 0.02 * scale, 0.0),
                             (0.34 * scale, cy + 0.02 * scale, 0.0),
                             (0.0, cy + 0.42 * scale, 0.0),
                             (-0.34 * scale, cy + 0.02 * scale, 0.0),
                             (-0.12 * scale, cy + 0.02 * scale, 0.0)))
            faces.append(tuple(base + i for i in range(7)))
    elif kind == "dash":
        # Five asymmetric tapered speed marks; the short/long rhythm keeps them from reading
        # like a flat barcode when seen on a phone.
        for i, (x, y, length, tilt) in enumerate(((-1.4, 0.72, 1.5, 0.06), (-0.6, 0.28, 2.8, -0.08),
                                                  (0.4, -0.14, 2.1, 0.04), (1.0, -0.55, 1.6, -0.06),
                                                  (-1.25, -0.92, 1.05, 0.09))):
            half = length / 2
            thickness = 0.035 if i % 2 else 0.05
            base = len(vertices)
            vertices.extend(((x - half, y - tilt - thickness, 0.0), (x + half, y + tilt - thickness, 0.0),
                             (x + half * 0.75, y + tilt + thickness, 0.0), (x - half * 0.75, y - tilt + thickness, 0.0)))
            faces.append((base, base + 1, base + 2, base + 3))
    elif kind == "comet":
        # A clean, tapered travel mark with a bright head and staggered wake.
        for y, length, width in ((0.42, 1.45, 0.035), (0.08, 2.0, 0.055), (-0.34, 1.25, 0.04)):
            base = len(vertices)
            vertices.extend(((-length, y - width, 0.0), (-0.22, y - width * 0.55, 0.0),
                             (-0.12, y + width * 0.55, 0.0), (-length * 0.76, y + width, 0.0)))
            faces.append((base, base + 1, base + 2, base + 3))
        base = len(vertices)
        vertices.extend(((0.0, 0.0, 0.0), (0.47, 0.16, 0.0), (0.97, 0.0, 0.0),
                         (0.47, -0.16, 0.0), (0.57, 0.0, 0.0)))
        faces.extend(((base, base + 1, base + 4), (base + 1, base + 2, base + 4),
                      (base + 2, base + 3, base + 4), (base + 3, base, base + 4)))
    elif kind == "energy_trail":
        # Lightweight, original layered streaks: three tapered ribbons plus a
        # bright leading wedge. Fixed geometry stays cheap in the 60 fps bake.
        for y, width, length in ((0.34, 0.045, 1.55), (0.06, 0.075, 2.15), (-0.27, 0.05, 1.72)):
            base = len(vertices)
            vertices.extend(((-length, y - width, 0.0), (-0.24, y - width * 0.55, 0.0),
                             (-0.10, y + width * 0.55, 0.0), (-length * 0.76, y + width, 0.0)))
            faces.append((base, base + 1, base + 2, base + 3))
        base = len(vertices)
        vertices.extend(((0.0, 0.0, 0.0), (0.34, 0.18, 0.0), (0.88, 0.0, 0.0),
                         (0.34, -0.18, 0.0), (0.51, 0.0, 0.0)))
        faces.extend(((base, base + 1, base + 4), (base + 1, base + 2, base + 4),
                      (base + 2, base + 3, base + 4), (base + 3, base, base + 4)))
    else:
        raise ValueError(f"Unknown Blocky 3D visual effect {kind!r}")
    return _mesh(name, vertices, faces)
