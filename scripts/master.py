"""Step 8: the master. Renders the episode, then brings the mix to -14 LUFS with true peaks under -1 dBTP (two-pass
loudnorm, video copied untouched), measures the result and writes the report.

python <skill>/scripts/master.py <slug> [--skip-render] [--concurrency 6] [--preview]
Writes an optional half-resolution preview or the full-size master under out/<slug>/
"""
import json, os, re, subprocess, sys, time

from media_tools import ffmpeg_path, ffprobe_path, media_environment
from wi import STUDIO, ep_dir, load_episode, load_json, loudness, out_dir, save_json

slug = sys.argv[1]
args = sys.argv[2:]
tool_env = media_environment()
conc = args[args.index('--concurrency') + 1] if '--concurrency' in args else None
preview = '--preview' in args
ep = load_episode(slug)
od = out_dir(slug)
stem = f'{slug}-preview' if preview else slug
raw = od / f'{stem}-raw.mp4'
final = od / f'{stem}-final.mp4'
npx = 'npx.cmd' if sys.platform == 'win32' else 'npx'
tl = load_json(ep_dir(slug) / 'timeline.json')
duration_seconds = float(tl['total']) / float(tl['fps'])
if duration_seconds <= 0:
    raise SystemExit(f"Invalid planned duration in {ep_dir(slug) / 'timeline.json'}")

if '--skip-render' not in args:
    t0 = time.time()
    cmd = [npx, 'remotion', 'render', 'src/index.ts', ep['id'], str(raw), '--log', 'error',
           '--image-format', 'jpeg', '--jpeg-quality', '95',
           '--gl', os.environ.get('REMOTION_GL', 'angle')]
    if preview:
        cmd += ['--scale', '0.5']
    if conc:
        cmd += ['--concurrency', conc]
    print(' '.join(cmd))
    subprocess.run(cmd, cwd=STUDIO, check=True)
    print(f'rendered in {time.time() - t0:.0f} s')

I, TP, LRA = -14.0, -1.5, 11
first = subprocess.run([ffmpeg_path(), '-hide_banner', '-nostats', '-i', str(raw), '-af', f'loudnorm=I={I}:TP={TP}:LRA={LRA}:print_format=json', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
m = json.loads(first[first.rfind('{'):first.rfind('}') + 1])
filt = (f"loudnorm=I={I}:TP={TP}:LRA={LRA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run([ffmpeg_path(), '-y', '-v', 'error', '-i', str(raw), '-t', f'{duration_seconds:.6f}', '-c:v', 'copy', '-af', filt, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', str(final)], check=True)
lufs, peak = loudness(final)
tp = subprocess.run([ffmpeg_path(), '-hide_banner', '-nostats', '-i', str(final), '-af', f'loudnorm=I={I}:TP={TP}:print_format=json', '-f', 'null', '-'],
                    capture_output=True, text=True, encoding='utf-8', errors='ignore').stderr
true_peak = float(json.loads(tp[tp.rfind('{'):tp.rfind('}') + 1])['input_tp'])
dur = float(subprocess.run([ffprobe_path(), '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(final)], capture_output=True, text=True, check=True, env=tool_env).stdout.strip())
costs = load_json(od / 'costs.json', [])
report = {
    'episode': ep['id'], 'file': str(final), 'seconds': round(dur, 2), 'lufs': lufs, 'true_peak_dbtp': true_peak,
    'segments': len(tl['segments']), 'cuts_per_min': round((len(tl['segments']) - 1) / (tl['total'] / tl['fps']) * 60, 1),
    'elevenlabs_credits': sum(c['credits'] for c in costs), 'cost_lines': costs,
}
save_json(od / f'{stem}-report.json', report)
print(json.dumps({k: v for k, v in report.items() if k != 'cost_lines'}, indent=1))
ok = abs(lufs + 14) <= 0.5 and true_peak <= -1.0
print('loudness OK' if ok else '! loudness off target: check the report')
