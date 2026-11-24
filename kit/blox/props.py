"""Code-built, customizable blocky props for the Short Studio sets.

Every prop is a reusable code-built mesh in stud-sized units. Optional upstream branding decals are omitted.
"""
import math
import os
import random

import bpy
import bmesh
from mathutils import Euler, Matrix, Vector

import sets as S

WM_ASPECT = 0.425  # retained only for compatibility with old call sites; no logo is loaded or rendered

def _mtx(loc, rot=(0, 0, 0)):
    return Matrix.Translation(Vector(loc)) @ Euler(rot).to_matrix().to_4x4()

def brand_plate(*args, **kwargs):
    """Brand plates are intentionally omitted from this unbranded derivative."""
    return None

def atlas_decal(*args, **kwargs):
    """Brand atlas decals are intentionally omitted from this unbranded derivative."""
    return None

def brand_objects():
    return []

# ------------------------------------------------------------------ prop builder
class Prop:
    """One bevelled mesh object built from boxes / cylinders / balls in prop-local studs."""

    def __init__(self, coll, name, loc, rotz=0.0, bev=0.05):
        self.coll, self.name, self.bev = coll, name, bev
        self.M = Matrix.Translation(Vector(loc)) @ Matrix.Rotation(math.radians(rotz), 4, 'Z')
        self.bm = bmesh.new()
        self.lay = self.bm.faces.layers.float.new('rnd')
        self.mats, self.kids = [], []
        self.rng = random.Random(name)

    def _add(self, m, verts, smooth=False, rnd=None):
        if m not in self.mats:
            self.mats.append(m)
        i = self.mats.index(m)
        r = self.rng.random() if rnd is None else rnd
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = i
            f[self.lay] = r
            f.smooth = smooth and len(f.verts) == 4

    def box(self, m, size, c, rot=(0, 0, 0), rnd=None):
        M = Matrix.Translation(c) @ Euler(rot).to_matrix().to_4x4() @ Matrix.Diagonal((*size, 1))
        self._add(m, bmesh.ops.create_cube(self.bm, size=1.0, matrix=M)['verts'], rnd=rnd)

    def boxr(self, m, x0, x1, y0, y1, z0, z1, rnd=None):
        self.box(m, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), rnd=rnd)

    def cyl(self, m, r, depth, c, axis='Z', seg=16, r2=None, rot=None, rnd=None):
        R = {'Z': Matrix(), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y'), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X')}[axis]
        if rot:
            R = Euler(rot).to_matrix().to_4x4() @ R
        res = bmesh.ops.create_cone(self.bm, cap_ends=True, segments=seg, radius1=r, radius2=r if r2 is None else r2,
                                    depth=depth, matrix=Matrix.Translation(c) @ R)
        self._add(m, res['verts'], smooth=True, rnd=rnd)

    def ball(self, m, r, c, scale=(1, 1, 1), sub=2, rnd=None):
        M = Matrix.Translation(c) @ Matrix.Diagonal((*scale, 1))
        res = bmesh.ops.create_icosphere(self.bm, subdivisions=sub, radius=r, matrix=M)
        self._add(m, res['verts'], rnd=rnd)
        for f in {f for v in res['verts'] for f in v.link_faces}:
            f.smooth = True

    # Optional upstream branding decals are omitted from this package.
    def decal(self, name, slot, w, c, rot=(0, 0, 0), emissive=False):
        return None

    def band(self, name, slot, r, z0, z1, c=(0, 0, 0)):
        return None

    def brand(self, name, c, rot, width, plate=True, emissive=False, kind='wm', alpha_mul=1.0):
        return None

    def finish(self):
        me = bpy.data.meshes.new(self.name)
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me)
        ob.matrix_world = self.M
        self.coll.objects.link(ob)
        if self.bev:
            md = ob.modifiers.new('bevel', 'BEVEL')
            md.width = self.bev
            md.segments = 2
            md.limit_method = 'ANGLE'
            md.angle_limit = math.radians(40)
            md.harden_normals = False
        for k in self.kids:
            k.parent = ob
            k.matrix_parent_inverse = self.M.inverted()
        return ob


# ------------------------------------------------------------------ prop materials
M = {}


def _m():
    if M:
        return M
    P = S.P
    f = S.flat
    M.update(
        carpaint=f('carpaint', '#2f7fd0', rough=0.32, coat=0.6, var=0.05),
        carglass=f('carglass', '#1b232b', rough=0.06, spec=0.8, var=0.0),
        chrome=f('chrome', '#c9ced3', rough=0.18, metal=1.0, var=0.03),
        taillight=f('taillight', '#b3202a', rough=0.3, emit_col='#ff3030', drv=('0.4+lamp*8', ['lamp'])),
        headlight=f('headlight', '#f4f1e6', rough=0.15, emit_col='#fff2d6', drv=('0.2+lamp*12', ['lamp'])),
        lamppost=f('lamppost', '#1f2b28', rough=0.45, metal=0.5, var=0.06),
        hydrant=f('hydrant', '#c23a2e', rough=0.45, grime=0.25),
        hydcap=f('hydcap', '#d9b443', rough=0.45),
        binmetal=f('binmetal', '#40524a', rough=0.45, metal=0.6, var=0.08),
        wheelie=f('wheelie', '#3e6d4a', rough=0.55, var=0.06),
        cardboard=f('cardboard', '#b58a5b', rough=0.85, var=0.15),
        tape=f('tape', '#d4b98e', rough=0.35, var=0.05),
        ceramic=f('ceramic', '#f1efe9', rough=0.22, coat=0.4, var=0.03),
        brass=f('brass', '#b98d3f', rough=0.3, metal=0.9, var=0.05),
        bottle=f('bottleglass', '#4a2414', rough=0.08, spec=0.8, coat=0.6, var=0.0),
        capred=f('capred', '#c42d2d', rough=0.35, metal=0.5),
        burner=f('burner', '#2a2a2d', rough=0.6),
        shelfpaint=f('shelfpaint', '#7f9c8f', rough=0.6, grime=0.1),
        jar=f('jarglass', '#c9d6d2', rough=0.1, spec=0.7, var=0.0),
        calgrid=f('calgrid', '#8f8a80', rough=0.8, var=0.0),
        cyanled=f('cyanled', '#3de4fd', rough=0.3, emit_col='#3de4fd', drv=('0.5+neon*8', ['neon'])),
        shade=f('shade', '#2f4a3f', rough=0.35, metal=0.4),
        cereal=f('cerealside', '#f5c93a', rough=0.6, var=0.05),
        towel=f('towelcloth', '#e9e6dd', rough=0.95),
        brick_red=f('brickred', '#8e4a3a', rough=0.8, var=0.2),
    )
    return M


def _wheel(p, x, y, z, r=1.25, w=0.9):
    m = _m()
    p.cyl(S.P['tire'], r, w, (x, y, z), axis='Y', seg=24)
    side = -1 if y < 0 else 1
    p.cyl(m['chrome'], r * 0.55, 0.08, (x, y + side * w / 2, z), axis='Y', seg=20)
    p.cyl(S.P['dark'], r * 0.22, 0.12, (x, y + side * (w / 2 + 0.03), z), axis='Y', seg=12)


# ------------------------------------------------------------------ STREET props
def lamp_post(coll, name, loc, rotz=0.0, banner=None, side=1):
    """Victorian-style gas lamp, 13.5 studs. banner=atlas slot -> a lamp-post ad banner hung on the +X/-X side."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.04)
    L = m['lamppost']
    p.cyl(L, 0.62, 0.35, (0, 0, 0.175), seg=8)
    p.cyl(L, 0.48, 1.3, (0, 0, 1.0), seg=8, r2=0.36)
    p.cyl(L, 0.42, 0.18, (0, 0, 1.75), seg=8)
    p.cyl(L, 0.2, 9.4, (0, 0, 6.5), seg=12, r2=0.16)
    for z in (4.0, 8.0, 11.2):
        p.cyl(L, 0.27, 0.16, (0, 0, z), seg=12)
    p.box(L, (2.0, 0.14, 0.14), (0, 0, 10.4))              # ladder arm
    for sx in (-0.9, 0.9):
        p.ball(L, 0.1, (sx, 0, 10.4), sub=1)
    p.cyl(L, 0.18, 0.4, (0, 0, 11.45), seg=4, r2=0.5, rot=(0, 0, math.pi / 4))
    p.cyl(P['lampglass'], 0.5, 1.2, (0, 0, 12.25), seg=4, rot=(0, 0, math.pi / 4))
    for a in range(4):
        aa = math.pi / 4 + a * math.pi / 2
        p.box(L, (0.08, 0.08, 1.25), (0.5 * math.cos(aa), 0.5 * math.sin(aa), 12.25))
    p.cyl(L, 0.78, 0.45, (0, 0, 13.05), seg=4, r2=0.12, rot=(0, 0, math.pi / 4))
    p.ball(L, 0.13, (0, 0, 13.38), sub=1)
    if banner:
        bx = side * 1.35
        p.box(L, (2.6, 0.1, 0.1), (side * 1.2, 0, 9.75))
        p.box(L, (2.6, 0.1, 0.1), (side * 1.2, 0, 6.4))
        for k in (-1, 1):
            p.decal(f'{name}.banner{"F" if k < 0 else "B"}', banner, 2.2, (bx, k * 0.03, 8.07),
                    (0, 0, 0 if k < 0 else math.pi))
    return p.finish()


def hydrant(coll, name, loc, rotz=0.0):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.03)
    R, C = m['hydrant'], m['hydcap']
    p.cyl(R, 0.6, 0.2, (0, 0, 0.1), seg=10)
    p.cyl(R, 0.42, 1.75, (0, 0, 1.07), seg=18)
    p.cyl(R, 0.52, 0.2, (0, 0, 1.95), seg=18)
    p.ball(R, 0.44, (0, 0, 2.05), scale=(1, 1, 0.75))
    p.cyl(C, 0.13, 0.3, (0, 0, 2.45), seg=5)
    p.cyl(R, 0.17, 1.3, (0, 0, 1.45), axis='X', seg=12)
    for sx in (-0.67, 0.67):
        p.cyl(C, 0.21, 0.12, (sx, 0, 1.45), axis='X', seg=6)
    p.cyl(R, 0.24, 0.35, (0, -0.48, 1.2), axis='Y', seg=12)
    p.cyl(C, 0.28, 0.12, (0, -0.68, 1.2), axis='Y', seg=6)
    return p.finish()


def trash_can(coll, name, loc, rotz=0.0):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.03)
    B = m['binmetal']
    p.cyl(B, 0.78, 2.5, (0, 0, 1.3), seg=20, r2=0.85)
    for z in (0.5, 1.3, 2.1):
        p.cyl(S.P['dark'], 0.84, 0.12, (0, 0, z), seg=20)
    p.cyl(B, 0.95, 0.18, (0, 0, 2.6), seg=20)
    p.ball(B, 0.85, (0, 0, 2.65), scale=(1, 1, 0.35))
    p.cyl(S.P['black'], 0.42, 0.06, (0, -0.0, 2.95), seg=16)
    p.cyl(S.P['dark'], 0.7, 0.12, (0, 0, 0.06), seg=12)
    return p.finish()


def wheelie_bin(coll, name, loc, rotz=0.0):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.06)
    G = m['wheelie']
    p.boxr(G, -0.85, 0.85, -0.95, 0.95, 0.35, 2.7)
    p.boxr(G, -0.95, 0.95, -1.08, 1.05, 2.7, 2.92)
    p.boxr(S.P['dark'], -0.6, 0.6, -1.05, -0.95, 2.4, 2.65)
    p.cyl(S.P['dark'], 0.06, 1.7, (0, 1.12, 2.65), axis='X', seg=8)
    for sx in (-0.7, 0.7):
        p.cyl(S.P['tire'], 0.36, 0.3, (sx, 0.85, 0.36), axis='X', seg=16)
    return p.finish()


def bench(coll, name, loc, rotz=0.0):
    """Park bench: 3 seat planks, 2 back planks, cast-iron ends with armrests; back on +Y."""
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.04)
    for i in range(3):
        p.box(P['plank'], (4.4, 0.36, 0.14), (0, -0.42 + i * 0.4, 1.38))
    for z in (2.0, 2.55):
        p.box(P['plank'], (4.4, 0.13, 0.36), (0, 0.62 + (z - 2.0) * 0.12, z), rot=(-0.2, 0, 0))
    for k in (-1.85, 1.85):
        p.box(P['dark'], (0.16, 0.16, 1.32), (k, -0.55, 0.66))
        p.box(P['dark'], (0.16, 0.16, 2.9), (k, 0.6, 1.45), rot=(-0.12, 0, 0))
        p.box(P['dark'], (0.16, 1.3, 0.16), (k, 0.0, 1.25))
        p.box(P['dark'], (0.2, 1.2, 0.12), (k, -0.05, 2.05))
        p.box(P['dark'], (0.16, 0.16, 0.7), (k, -0.6, 1.7))
    return p.finish()


def cardboard_box(coll, name, loc, rotz=0.0, h=1.25, stamp=False):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.03)
    w, d = h * 1.3, h * 1.05
    p.boxr(m['cardboard'], -w / 2, w / 2, -d / 2, d / 2, 0, h)
    p.boxr(m['tape'], -0.18 * h, 0.18 * h, -d / 2 - 0.01, d / 2 + 0.01, h - 0.01, h + 0.01)
    p.boxr(m['tape'], -0.18 * h, 0.18 * h, -d / 2 - 0.01, -d / 2 + 0.01, h * 0.75, h)
    if stamp:
        p.decal(name + '.stamp', 'CRATE', h * 0.55, (w * 0.18, -d / 2 - 0.015, h * 0.45))
    return p.finish()


def crate(coll, name, loc, rotz=0.0, h=2.4, stamp=True):
    """Wooden slat crate; stamp=True prints the brand crate stamp on the -Y and +X faces."""
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.03)
    s = h
    p.boxr(P['plank'], -s / 2 + 0.08, s / 2 - 0.08, -s / 2 + 0.08, s / 2 - 0.08, 0.05, s - 0.05)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p.box(P['wood'], (0.26, 0.26, s), (sx * (s / 2 - 0.13), sy * (s / 2 - 0.13), s / 2))
    for z in (0.13, s - 0.13):
        for sy in (-1, 1):
            p.box(P['wood'], (s, 0.26, 0.26), (0, sy * (s / 2 - 0.13), z))
            p.box(P['wood'], (0.26, s, 0.26), (sy * (s / 2 - 0.13), 0, z))
    for sy in (-1, 1):
        p.box(P['wood'], (s * 1.05, 0.12, 0.26), (0, sy * (s / 2 - 0.02), s / 2), rot=(0, 0.78, 0))
    if stamp:
        p.decal(name + '.stamp', 'CRATE', s * 0.42, (0, -s / 2 - 0.09, s * 0.68))
        p.decal(name + '.stampX', 'CRATE', s * 0.42, (s / 2 + 0.09, 0, s * 0.68), (0, 0, math.pi / 2))
    return p.finish()


def pallet(coll, name, loc, rotz=0.0):
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.02)
    for i in range(7):
        p.box(P['plank'], (0.42, 3.0, 0.1), (-1.6 + i * 0.533, 0, 0.6))
    for i in range(3):
        p.box(P['plank'], (3.6, 0.42, 0.1), (0, -1.25 + i * 1.25, 0.05))
        for j in range(3):
            p.box(P['wood'], (0.45, 0.42, 0.42), (-1.5 + j * 1.5, -1.25 + i * 1.25, 0.31))
    p.box(P['plank'], (3.6, 0.42, 0.08), (0, -1.25, 0.69))
    return p.finish()


def shrub(coll, name, loc, rotz=0.0, length=5.2):
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0)
    rnd = random.Random(name)
    n = 6
    for i in range(n):
        x = -length / 2 + 0.7 + i * (length - 1.4) / (n - 1)
        r = rnd.uniform(0.75, 1.05)
        p.ball(P['leaf' if i % 2 else 'leaf2'], r, (x, rnd.uniform(-0.2, 0.2), r * 0.7 + rnd.uniform(0, 0.25)),
               scale=(1.1, 0.85, 0.9), sub=2)
    for i in range(3):
        p.ball(P['leaf2'], 0.7, (rnd.uniform(-1.5, 1.5), rnd.uniform(-0.1, 0.1), 1.6), scale=(1, 0.8, 0.8))
    return p.finish()


def car(coll, name, loc, rotz=0.0, length=13.5):
    """Chunky boxy hatchback (front +X), branded doors on both sides."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.12)
    L = length / 2
    C, G = m['carpaint'], m['carglass']
    p.boxr(C, -L, L, -3.0, 3.0, 0.95, 3.25)                     # body tub
    p.boxr(C, -L + 0.9, 2.4, -2.75, 2.75, 3.25, 5.35)           # cabin
    p.boxr(C, 2.0, L - 0.2, -2.9, 2.9, 3.2, 3.45)               # bonnet lip
    # glass: windscreen / rear / side windows (split by pillars)
    p.boxr(G, 2.38, 2.48, -2.45, 2.45, 3.6, 5.1)
    p.boxr(G, -L + 0.82, -L + 0.92, -2.4, 2.4, 3.7, 5.1)
    for sy in (-1, 1):
        y = sy * 2.77
        p.boxr(G, -L + 1.3, -1.75, y - 0.04, y + 0.04, 3.65, 5.05)
        p.boxr(G, -1.45, 2.05, y - 0.04, y + 0.04, 3.65, 5.05)
        p.boxr(P['black'], -1.7 + 0.0, -1.5, y - 0.06, y + 0.06, 3.3, 5.2)   # B pillar seam
        p.boxr(P['black'], -1.66, -1.62, sy * 3.0 - 0.03, sy * 3.0 + 0.03, 1.1, 3.2)  # door seams
        p.boxr(P['black'], 2.2, 2.24, sy * 3.0 - 0.03, sy * 3.0 + 0.03, 1.1, 3.2)
        p.box(m['chrome'], (0.6, 0.12, 0.14), (1.4, sy * 3.05, 2.9))           # handle
        p.box(C, (0.5, 0.5, 0.35), (2.0, sy * 3.05, 4.0))                     # mirror
        for x in (-4.4, 4.4):
            _wheel(p, x, sy * 2.75, 1.25)
            p.boxr(P['black'], x - 1.55, x + 1.55, sy * 3.0 - 0.05, sy * 3.0 + 0.05, 2.45, 2.7)  # arch trim
    # bumpers, lights, grille, plates
    for sx in (-1, 1):
        p.boxr(P['dark'], sx * L - 0.25, sx * L + 0.25, -3.05, 3.05, 0.85, 1.65)
        p.boxr(P['white'], sx * (L + 0.24) - 0.03, sx * (L + 0.24) + 0.03, -0.7, 0.7, 1.0, 1.5)
    for sy in (-1, 1):
        p.boxr(m['headlight'], L - 0.02, L + 0.06, sy * 2.1 - 0.6, sy * 2.1 + 0.6, 2.3, 2.95)
        p.boxr(m['taillight'], -L - 0.06, -L + 0.02, sy * 2.3 - 0.45, sy * 2.3 + 0.45, 2.1, 3.0)
    p.boxr(P['black'], L - 0.02, L + 0.05, -1.3, 1.3, 2.0, 2.85)
    for z in (2.2, 2.45, 2.7):
        p.boxr(m['chrome'], L + 0.03, L + 0.07, -1.25, 1.25, z - 0.04, z + 0.04)
    p.boxr(P['dark'], -L + 1.0, 2.2, -2.5, 2.5, 5.35, 5.5)       # roof rails
    # brand on both front doors
    p.brand(name + '.doorL', (0.3, -3.08, 2.15), (0, 0, 0), 2.6, plate=True)
    p.brand(name + '.doorR', (0.3, 3.08, 2.15), (0, 0, math.pi), 2.6, plate=True)
    return p.finish()


def billboard(coll, name, loc, rotz=0.0, width=12.0):
    """Rooftop billboard on two legs with a catwalk and three lamp heads; lit art from the atlas (BILL)."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.05)
    h = width * 864 / 2048
    z0 = 2.2
    D = P['dark']
    for sx in (-width * 0.3, width * 0.3):
        p.box(D, (0.45, 0.45, z0 + h), (sx, 0.5, (z0 + h) / 2))
        p.box(D, (0.25, 2.2, 0.25), (sx, 0.3, z0 * 0.5), rot=(0.6, 0, 0))
    p.boxr(D, -width / 2 - 0.3, width / 2 + 0.3, -0.05, 0.35, z0 - 0.3, z0 + h + 0.3)
    p.boxr(D, -width / 2, width / 2, -1.3, 0.0, z0 - 0.45, z0 - 0.3)                  # catwalk
    p.boxr(D, -width / 2, width / 2, -1.32, -1.22, z0 - 0.3, z0 + 0.6)
    for i in range(3):
        x = -width / 3 + i * width / 3
        p.box(D, (0.12, 1.6, 0.12), (x, -0.8, z0 + h + 0.55))
        p.box(D, (0.6, 0.45, 0.25), (x, -1.55, z0 + h + 0.5))
        p.box(P['lampglass'], (0.5, 0.35, 0.06), (x, -1.55, z0 + h + 0.36))
    p.decal(name + '.art', 'BILL', width, (0, -0.07, z0 + h / 2), emissive=True)
    return p.finish()


def shop_sign(coll, name, loc, rotz=0.0, width=4.2, height=1.35):
    """Fascia sign: dark board with a lit wordmark and a cyan LED strip (faces -Y)."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.04)
    p.boxr(P['black'], -width / 2, width / 2, -0.25, 0.0, 0, height)
    p.boxr(P['trim'], -width / 2 - 0.08, width / 2 + 0.08, -0.32, 0.0, height - 0.05, height + 0.08)
    p.boxr(m['cyanled'], -width / 2 + 0.1, width / 2 - 0.1, -0.29, -0.24, 0.06, 0.14)
    p.brand(name + '.wordmark', (0, -0.27, height / 2 + 0.05), (0, 0, 0), min(width * 0.72, (height - 0.3) / WM_ASPECT),
            plate=False, emissive=True)
    return p.finish()


# ------------------------------------------------------------------ KITCHEN props
def fridge(coll, name, loc, rotz=0.0, w=8.3, d=4.65, h=8.0):
    """Two-door commercial fridge, front face at local y=-d/2; brand magnet on the right door."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.06)
    B = P['brushed']
    p.boxr(B, -w / 2, w / 2, -d / 2 + 0.1, d / 2, 0.75, h)
    p.boxr(P['dark'], -w / 2 + 0.1, w / 2 - 0.1, -d / 2 + 0.15, d / 2, 0.0, 0.75)
    for i in range(8):
        p.boxr(P['black'], -w / 2 + 0.6 + i * (w - 1.2) / 8, -w / 2 + 0.6 + i * (w - 1.2) / 8 + 0.5,
               -d / 2 + 0.12, -d / 2 + 0.16, 0.2, 0.6)
    for sx in (-1, 1):
        x0, x1 = (-w / 2 + 0.08, -0.05) if sx < 0 else (0.05, w / 2 - 0.08)
        p.boxr(B, x0, x1, -d / 2, -d / 2 + 0.12, 0.85, h - 0.55)
        p.cyl(P['metal'], 0.09, 2.8, (sx * 0.45, -d / 2 - 0.25, 4.6), seg=10)
        for z in (3.3, 5.9):
            p.box(P['metal'], (0.12, 0.3, 0.12), (sx * 0.45, -d / 2 - 0.12, z))
    p.boxr(P['dark'], -w / 2 + 0.1, w / 2 - 0.1, -d / 2 + 0.05, -d / 2 + 0.12, h - 0.5, h - 0.08)
    p.boxr(m['cyanled'], -0.6, 0.6, -d / 2 + 0.02, -d / 2 + 0.06, h - 0.38, h - 0.2)
    p.brand(name + '.magnet', (2.9, -d / 2 - 0.03, 7.0), (0, 0, 0), 1.2, plate=True)
    return p.finish()


def stove(coll, name, loc, rotz=0.0, w=4.0, d=3.9, h=3.4):
    """Enamel range: black cooktop, 4 burners, oven door with window + bar handle, brand badge on the door."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.05)
    E, K = P['enamel'], P['black']
    fy = -d / 2
    p.boxr(E, -w / 2, w / 2, fy, d / 2, 0.25, h - 0.2)
    p.boxr(K, -w / 2, w / 2, fy, d / 2, h - 0.2, h)
    p.boxr(P['dark'], -w / 2 + 0.15, w / 2 - 0.15, fy + 0.1, d / 2, 0.0, 0.25)
    for (bx, by) in ((-1.0, -0.05), (1.0, -0.05), (-1.0, 0.95), (1.0, 0.95)):
        p.cyl(m['burner'], 0.55, 0.06, (bx, by, h + 0.03), seg=20)
        p.box(P['dark'], (1.2, 0.08, 0.08), (bx, by, h + 0.1))
        p.box(P['dark'], (0.08, 1.2, 0.08), (bx, by, h + 0.1))
    p.boxr(E, -w / 2, w / 2, d / 2 - 0.35, d / 2, h, h + 1.0)                     # backguard
    p.boxr(K, -w / 2 + 0.15, w / 2 - 0.15, fy - 0.08, fy, 0.55, 2.65)              # oven door
    p.boxr(m['carglass'], -1.1, 1.1, fy - 0.1, fy - 0.07, 0.9, 1.85)
    p.cyl(P['metal'], 0.08, w - 0.8, (0, fy - 0.32, 2.78), axis='X', seg=10)
    for sx in (-1.4, 1.4):
        p.box(P['metal'], (0.12, 0.3, 0.12), (sx, fy - 0.17, 2.78))
    p.boxr(K, -w / 2, w / 2, fy - 0.05, fy, 2.92, h - 0.2)                        # knob panel
    for i in range(5):
        p.cyl(P['metal'], 0.13, 0.15, (-1.5 + i * 0.75, fy - 0.12, 3.06), axis='Y', seg=12)
    p.brand(name + '.badge', (-0.55, fy - 0.1, 2.33), (0, 0, 0), 1.15, plate=False)
    # tea towel over the handle (brand atlas TOWEL)
    tw = 1.0
    th = tw * 512 / 384
    p.decal(name + '.towel', 'TOWEL', tw, (0.95, fy - 0.42, 2.82 - th / 2))
    p.cyl(m['towel'], 0.1, tw, (0.95, fy - 0.33, 2.86), axis='X', seg=10)
    return p.finish()


def sink_unit(coll, name, loc, rotz=0.0, w=8.0, d=3.44, h=3.35):
    """Steel sink run: cabinet, two basins, gooseneck faucet; right deck kept free (cereal box goes there)."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.04)
    B = P['brushed']
    fy = -d / 2
    p.boxr(B, -w / 2, w / 2, fy + 0.1, d / 2, 0.3, h - 0.3)
    p.boxr(P['dark'], -w / 2 + 0.1, w / 2 - 0.1, fy + 0.2, d / 2, 0.0, 0.3)
    p.boxr(B, -w / 2, w / 2, fy, d / 2, h - 0.3, h)
    for i in range(4):
        x0 = -w / 2 + 0.1 + i * (w - 0.2) / 4
        p.boxr(B, x0 + 0.05, x0 + (w - 0.2) / 4 - 0.05, fy + 0.02, fy + 0.12, 0.45, h - 0.45)
        p.box(P['metal'], (0.8, 0.14, 0.12), (x0 + (w - 0.2) / 8, fy - 0.02, h - 0.75))
    for cx in (-2.0, 1.0):
        p.boxr(P['dark'], cx - 1.2, cx + 1.2, fy + 0.45, d / 2 - 0.6, h - 0.02, h + 0.005)
        p.boxr(B, cx - 1.3, cx + 1.3, fy + 0.35, fy + 0.45, h, h + 0.08)
    fx, fyb = -0.5, d / 2 - 0.4
    p.cyl(P['metal'], 0.14, 1.7, (fx, fyb, h + 0.85), seg=12)
    p.cyl(P['metal'], 0.11, 1.1, (fx, fyb - 0.5, h + 1.7), axis='Y', seg=12)
    p.cyl(P['metal'], 0.1, 0.4, (fx, fyb - 1.0, h + 1.5), seg=12)
    for sx in (-0.5, 0.5):
        p.cyl(P['metal'], 0.1, 0.4, (fx + sx, fyb, h + 0.2), seg=10)
        p.box(P['metal'], (0.35, 0.1, 0.08), (fx + sx, fyb, h + 0.42))
    return p.finish()


def cereal_box(coll, name, loc, rotz=0.0, w=1.1):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.015)
    h, d = w * 1.5, w * 0.4
    p.boxr(m['cereal'], -w / 2, w / 2, -d / 2, d / 2, 0, h)
    p.decal(name + '.front', 'CEREAL', w * 0.995, (0, -d / 2 - 0.006, h / 2))
    p.decal(name + '.back', 'CEREAL', w * 0.995, (0, d / 2 + 0.006, h / 2), (0, 0, math.pi))
    return p.finish()


def cola_bottle(coll, name, loc, rotz=0.0, h=0.9):
    """Generic glass cola bottle with a wrap-around brand label (atlas COLA)."""
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0)
    k = h / 0.9
    p.cyl(m['bottle'], 0.16 * k, 0.55 * k, (0, 0, 0.275 * k), seg=20)
    p.cyl(m['bottle'], 0.16 * k, 0.17 * k, (0, 0, 0.635 * k), seg=20, r2=0.065 * k)
    p.cyl(m['bottle'], 0.065 * k, 0.15 * k, (0, 0, 0.795 * k), seg=14)
    p.cyl(m['capred'], 0.078 * k, 0.05 * k, (0, 0, 0.875 * k), seg=14)
    p.band(name + '.label', 'COLA', 0.166 * k, 0.12 * k, 0.46 * k)
    return p.finish()


def mug(coll, name, loc, rotz=0.0, h=0.5):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.01)
    r = h * 0.48
    p.cyl(m['ceramic'], r, h, (0, 0, h / 2), seg=24)
    p.cyl(S.P['dark'], r * 0.85, 0.02, (0, 0, h - 0.005), seg=24)
    p.box(m['ceramic'], (0.07, 0.06, h * 0.55), (r + 0.13, 0, h / 2))
    p.box(m['ceramic'], (0.16, 0.06, 0.06), (r + 0.06, 0, h * 0.78))
    p.box(m['ceramic'], (0.16, 0.06, 0.06), (r + 0.06, 0, h * 0.22))
    p.band(name + '.print', 'MUG', r + 0.004, h * 0.12, h * 0.85)
    return p.finish()


def brass_pan(coll, name, loc, rotz=0.0):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0.01)
    p.cyl(m['brass'], 0.72, 0.3, (0, 0, 0.17), seg=24, r2=0.8)
    p.cyl(S.P['dark'], 0.7, 0.02, (0, 0, 0.3), seg=24)
    p.box(m['brass'], (1.3, 0.14, 0.08), (1.4, 0, 0.3), rot=(0, -0.12, 0))
    return p.finish()


def wall_clock(coll, name, loc, rotz=0.0, d=2.6):
    """Round wall clock, bottom at loc (centre at loc.z + d/2), face towards -Y."""
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.02)
    r = d / 2
    c = r
    p.cyl(P['black'], r, 0.3, (0, 0, c), axis='Y', seg=32)
    p.cyl(P['white'], r * 0.86, 0.06, (0, -0.15, c), axis='Y', seg=32)
    for i in range(12):
        a = i * math.pi / 6
        L = 0.22 if i % 3 == 0 else 0.12
        p.box(P['black'], (0.06, 0.04, L), (math.sin(a) * r * 0.72, -0.19, c + math.cos(a) * r * 0.72), rot=(0, a, 0))
    p.box(P['black'], (0.08, 0.04, r * 0.45), (math.sin(-0.9) * r * 0.2, -0.22, c + math.cos(-0.9) * r * 0.2),
          rot=(0, -0.9, 0))
    p.box(P['black'], (0.06, 0.04, r * 0.7), (math.sin(2.1) * r * 0.32, -0.24, c + math.cos(2.1) * r * 0.32),
          rot=(0, 2.1, 0))
    p.box(P['red'], (0.03, 0.04, r * 0.75), (math.sin(4.0) * r * 0.33, -0.26, c + math.cos(4.0) * r * 0.33),
          rot=(0, 4.0, 0))
    p.cyl(P['black'], 0.08, 0.1, (0, -0.25, c), axis='Y', seg=10)
    return p.finish()


def calendar(coll, name, loc, rotz=0.0, h=2.6):
    """Plain paper wall calendar (no year): red header, 5 x 7 day grid, one day ringed."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.0)
    w = h * 0.7
    p.boxr(P['white'], -w / 2, w / 2, -0.02, 0.02, 0, h)
    p.boxr(P['white'], -w / 2 + 0.05, w / 2 - 0.05, -0.04, -0.02, h * 0.02, h * 0.52)   # page curl hint
    p.boxr(P['red'], -w / 2, w / 2, -0.035, -0.02, h * 0.8, h * 0.97)
    p.boxr(P['white'], -w * 0.3, w * 0.3, -0.045, -0.03, h * 0.86, h * 0.91)
    gw, gh = (w - 0.3) / 7, (h * 0.5) / 5
    for r in range(5):
        for c in range(7):
            x = -w / 2 + 0.15 + (c + 0.5) * gw
            z = h * 0.08 + (r + 0.5) * gh
            mat = P['red'] if (r, c) == (2, 4) else m['calgrid']
            p.box(mat, (gw * 0.72, 0.012, gh * 0.72), (x, -0.03, z))
    p.box(P['white'], (w - 0.3, 0.012, h * 0.08), (0, -0.03, h * 0.66))
    p.cyl(P['dark'], 0.06, 0.12, (0, -0.05, h * 0.985), axis='Y', seg=8)
    return p.finish()


def chair(coll, name, loc, rotz=0.0, h=3.4):
    """Dining chair, seat 1.75, back towards +Y."""
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.04)
    W = P['wood']
    p.boxr(W, -0.8, 0.8, -0.75, 0.75, 1.55, 1.8)
    for sx in (-0.65, 0.65):
        p.box(W, (0.2, 0.2, 1.55), (sx, -0.6, 0.775))
        p.box(W, (0.2, 0.2, h), (sx, 0.65, h / 2))
    p.boxr(W, -0.65, 0.65, 0.58, 0.72, h - 0.65, h - 0.1)
    p.boxr(W, -0.65, 0.65, 0.6, 0.7, 2.35, 2.55)
    for sx in (-0.25, 0.25):
        p.boxr(W, sx - 0.06, sx + 0.06, 0.6, 0.7, 2.55, h - 0.65)
    p.boxr(W, -0.6, 0.6, -0.08, 0.08, 0.5, 0.65)
    return p.finish()


def pendant_lamp(coll, name, loc, rotz=0.0, h=4.6):
    """Ceiling pendant: canopy, cord, green enamel shade, emissive bulb; loc = shade bottom."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.01)
    p.cyl(m['shade'], 1.0, 1.0, (0, 0, 0.5), seg=24, r2=0.28)
    p.cyl(m['shade'], 0.28, 0.25, (0, 0, 1.1), seg=16)
    p.cyl(P['black'], 0.04, h - 1.2, (0, 0, 1.2 + (h - 1.2) / 2), seg=6)
    p.cyl(m['shade'], 0.4, 0.12, (0, 0, h - 0.06), seg=16)
    p.ball(P['bulb'], 0.28, (0, 0, 0.3), sub=2)
    return p.finish()


def plate_set(coll, name, loc, rotz=0.0):
    m = _m()
    p = Prop(coll, name, loc, rotz, bev=0)
    p.cyl(m['ceramic'], 0.45, 0.04, (0, 0, 0.02), seg=24, r2=0.5)
    p.cyl(m['ceramic'], 0.33, 0.05, (0, 0, 0.06), seg=24, r2=0.36)
    return p.finish()


def cutlery(coll, name, loc, rotz=0.0):
    P = S.P
    p = Prop(coll, name, loc, rotz, bev=0)
    for dx in (-0.12, 0.12):
        p.box(P['metal'], (0.06, 0.75, 0.025), (dx, 0, 0.015))
        p.box(P['metal'], (0.1, 0.22, 0.025), (dx, 0.42, 0.015))
    return p.finish()


def shelves(coll, name, loc, rotz=0.0, h=7.0, w=4.4, d=1.4):
    """Painted kitchen shelf unit (front -Y before rotz) with jars, books and a plant."""
    m = _m(); P = S.P
    p = Prop(coll, name, loc, rotz, bev=0.03)
    Sp = m['shelfpaint']
    for sx in (-1, 1):
        p.boxr(Sp, sx * w / 2 - 0.12, sx * w / 2 + 0.12, -d / 2, d / 2, 0, h)
    p.boxr(Sp, -w / 2, w / 2, d / 2 - 0.08, d / 2, 0, h)
    zs = [0.2, 1.9, 3.6, 5.3, h - 0.1]
    for z in zs:
        p.boxr(Sp, -w / 2, w / 2, -d / 2, d / 2, z - 0.1, z + 0.1)
    rnd = random.Random(name)
    x = -w / 2 + 0.35
    while x < w / 2 - 0.5:
        bw = rnd.uniform(0.18, 0.3); bh = rnd.uniform(1.0, 1.4)
        p.boxr(P['books'], x, x + bw, -0.4, 0.45, 5.4, 5.4 + bh, rnd=rnd.random())
        x += bw + 0.02
    for i, jx in enumerate((-1.4, -0.5, 0.4, 1.3)):
        p.cyl(m['jar'], 0.3, 0.9 - 0.1 * (i % 2), (jx, 0, 3.7 + 0.45 - 0.05 * (i % 2)), seg=16)
        p.cyl(P['wood'], 0.32, 0.12, (jx, 0, 4.18 - 0.1 * (i % 2)), seg=16)
    p.cyl(flat_pot(), 0.4, 0.7, (1.2, 0, 2.35), seg=14, r2=0.32)
    p.ball(P['leaf'], 0.55, (1.2, 0, 3.0), sub=2)
    for i, bx in enumerate((-1.5, -0.8)):
        p.boxr(P['white'], bx - 0.25, bx + 0.25, -0.4, 0.4, 2.0, 2.0 + 0.12 * (i + 1))
    return p.finish()


def flat_pot():
    return S.flat('pot', '#9a6a4a', rough=0.8)


def framed_print(coll, name, loc, rotz=0.0, slot='P2', w=2.0):
    """Wooden frame with a plain paper insert on a wall; faces -Y before rotz."""
    P = S.P
    h = w * 1.35
    p = Prop(coll, name, loc, rotz, bev=0.03)
    fw = 0.22
    p.boxr(P['wood'], -w / 2 - fw, w / 2 + fw, 0.0, 0.18, -h / 2 - fw, h / 2 + fw)
    p.boxr(P['white'], -w / 2, w / 2, -0.025, 0.0, -h / 2, h / 2)
    return p.finish()
