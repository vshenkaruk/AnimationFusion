"""Low-poly, camera-facing meshes for brief Blocky 3D story cues."""
from __future__ import annotations

import math

import bpy

KINDS = ("burst", "sparkle", "ring", "sound_rings", "dash")


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
    elif kind == "sound_rings":
        for radius in (0.35, 0.68, 1.0):
            _ring(vertices, faces, radius, 0.075)
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
    else:
        raise ValueError(f"Unknown Blocky 3D visual effect {kind!r}")
    return _mesh(name, vertices, faces)
