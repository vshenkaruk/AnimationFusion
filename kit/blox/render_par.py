"""Render EPDIR/scene.blend in K parallel Blender processes.
python render_par.py EPDIR [K=4] [--frames 0,30,60|10..40] [--out frames]
  [--resolution-percentage 1..100] [--threads N]
Preview-only downscaling also disables expensive render effects; final render defaults remain unchanged."""
import sys, os, subprocess, time, glob
BL = os.environ.get('BLENDER') or 'blender'  # kit/run.py sets BLENDER
ep = os.path.abspath(sys.argv[1]); K = int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 4
options = sys.argv[3:]
def option(name, default):
    return options[options.index(name) + 1] if name in options else default
scale = int(option('--resolution-percentage', '100'))
if not 1 <= scale <= 100: sys.exit('--resolution-percentage must be between 1 and 100')
threads = int(option('--threads', str(max(1, (os.cpu_count() or 1) // max(1, K)))))
if threads < 1: sys.exit('--threads must be positive')
blend = os.path.join(ep, 'scene.blend'); t = time.time()
def blender_prefix():
    cmd = [BL, '-b', blend, '-t', str(threads)]
    if scale < 100:
        expr = (
            "import bpy; s=bpy.context.scene; s.render.resolution_percentage=" + str(scale) + "; "
            "s.render.use_motion_blur=False; e=s.eevee; "
            "[(setattr(e,n,v)) for n,v in (('taa_render_samples',8),('use_raytracing',False),"
            "('use_fast_gi',False),('use_volumetric_shadows',False),('volumetric_samples',8)) if hasattr(e,n)]"
        )
        cmd += ['--python-expr', expr]
    return cmd
if '--frames' in sys.argv:
    fr = []
    for x in sys.argv[sys.argv.index('--frames') + 1].split(','):
        a, _, b = x.partition('..'); fr += [str(i) for i in range(int(a), int(b or a) + 1)]
    sub = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else 'stills'
    out = os.path.join(ep, sub, '#####'); groups = [fr[i::K] for i in range(K)]
    cmds = [blender_prefix() + ['-o', out, '-F', 'JPEG', '-f', ','.join(g)] for g in groups if g]
else:
    import json, math
    n = int(math.ceil(json.load(open(os.path.join(ep, 'timed.json')))['dur'] * 60))
    os.makedirs(os.path.join(ep, 'frames'), exist_ok=True)
    CH = -(-n // K); chunks = [(a, min(a + CH, n) - 1) for a in range(0, n, CH)]
    groups = [chunks[i::K] for i in range(K)]
    cmds = []
    for g in groups:
        args = blender_prefix()
        for a, b in g: args += ['-s', str(a), '-e', str(b), '-a']
        cmds.append(args)
ps = [subprocess.Popen(c, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT) for c in cmds]
for p in ps: p.wait()
print('rendered with', len(ps), 'procs in', round(time.time() - t, 1), 's; frames on disk', len(glob.glob(os.path.join(ep, 'frames', '*.jpg'))))
