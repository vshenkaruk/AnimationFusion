import React, {useLayoutEffect, useRef} from 'react';
import {useLoader} from '@react-three/fiber';
import {staticFile} from 'remotion';
import {CanvasTexture, Group, Mesh, MeshStandardMaterial, SRGBColorSpace, TextureLoader} from 'three';

/** References to the actual wardrobe baked into each bundled model. */
export const WORLD_CAST = {
  explorer: {variant: 'f', wardrobe: 'mint sweatshirt', role: 'curious lead'},
  teammate: {variant: 'b', wardrobe: 'red overalls', role: 'competitive friend'},
  authority: {variant: 'q', wardrobe: 'black suit and red tie', role: 'watchful authority'},
  witness: {variant: 'e', wardrobe: 'lilac shirt', role: 'observant bystander'},
} as const;
export type WorldArchetype = keyof typeof WORLD_CAST;

const expressions = {
  calm:     {eyes: 0.78, brows: 0,    tilt: 0.1,   smile: 0.38, opening: 0.05},
  curious:  {eyes: 0.93, brows: 0.48, tilt: -0.12, smile: 0.2,  opening: 0.12},
  wary:     {eyes: 0.59, brows: -0.2, tilt: 0.38,  smile: -0.3, opening: 0.02},
  startled: {eyes: 1.24, brows: 0.92, tilt: -0.18, smile: 0,    opening: 1},
  amused:   {eyes: 0.58, brows: 0.24, tilt: -0.12, smile: 1,    opening: 0.46},
};
export type WorldExpression = keyof typeof expressions;
/** Target pose at local shot frame f. Gaze ranges from -1 (left) to 1 (right). */
export type FaceCue = {f: number; expression: WorldExpression; gaze?: number};
type FacePose = typeof expressions.calm & {gaze: number};
const initial: FacePose = {...expressions.calm, gaze: 0};

function faceAt(frame: number, cues: readonly FaceCue[]): FacePose {
  let previous = initial;
  let previousFrame = 0;
  for (const cue of cues) {
    const next = {...expressions[cue.expression], gaze: Math.max(-1, Math.min(1, cue.gaze ?? 0))};
    if (frame < cue.f) {
      const t = Math.min(1, Math.max(0, (frame - previousFrame) / Math.max(1, cue.f - previousFrame)));
      const blend = t * t * (3 - 2 * t);
      const mix = (key: keyof FacePose) => previous[key] + (next[key] - previous[key]) * blend;
      return {eyes: mix('eyes'), brows: mix('brows'), tilt: mix('tilt'), smile: mix('smile'), opening: mix('opening'), gaze: mix('gaze')};
    }
    previous = next;
    previousFrame = cue.f;
  }
  return previous;
}

function paint(ctx: CanvasRenderingContext2D, plate: HTMLImageElement, actor: WorldArchetype, pose: FacePose) {
  ctx.drawImage(plate, 0, 0, 128, 128);
  const ink = actor === 'witness' ? '#653c31' : '#322c33';
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const x = 64 + side * 25;
    const y = 69;
    const ry = 8.1 * pose.eyes;
    const eyeX = x + pose.gaze * 3.5;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(eyeX, y, 6.1, ry, side * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff8e5';
    ctx.beginPath();
    ctx.ellipse(eyeX - 1.5, y - ry * 0.42, 1.65, 1.85 * pose.eyes, 0, 0, Math.PI * 2);
    ctx.fill();

    // The explorer has a sweeping fringe over the right brow.
    if (actor === 'explorer' && side === 1) continue;
    const height = y - 15 - 6 * pose.brows;
    ctx.strokeStyle = ink;
    ctx.lineWidth = actor === 'authority' ? 4.6 : 3.9;
    ctx.beginPath();
    ctx.moveTo(x - side * 7.5, height + 6 * pose.tilt);
    ctx.quadraticCurveTo(x, height - 2.5, x + side * 7.8, height - 5 * pose.tilt);
    ctx.stroke();
  }
  const y = 91;
  const halfWidth = 12 + pose.smile * 4 - pose.opening * 4;
  const corner = y - pose.smile * 3.5;
  const lower = y + pose.smile * 4 + pose.opening * 15;
  ctx.strokeStyle = '#543032';
  ctx.fillStyle = '#61353c';
  ctx.lineWidth = 3.25;
  ctx.beginPath();
  ctx.moveTo(64 - halfWidth, corner);
  ctx.quadraticCurveTo(64, y + pose.smile * 5 - pose.opening * 9, 64 + halfWidth, corner);
  ctx.quadraticCurveTo(64 + halfWidth * .65, lower, 64, lower);
  ctx.quadraticCurveTo(64 - halfWidth * .65, lower, 64 - halfWidth, corner);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/** Replace only the two front triangles. The remaining head and outfit keep their GLB atlas. */
function bindFace(model: Group, plate: HTMLImageElement, actor: WorldArchetype) {
  const head = model.getObjectByName('head');
  if (!(head instanceof Mesh) || !(head.material instanceof MeshStandardMaterial) || !head.geometry.index) return;
  const originalMaterial = head.material;
  const originalGeometry = head.geometry;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.flipY = false;
  // Front UVs in the shipped 1024-square atlas occupy x134..251, y1156..1273.
  // Its V coordinate wraps once. This tile starts at unwrapped (128,1152).
  texture.repeat.set(8, 8);
  texture.offset.set(-1, -9);
  const faceMaterial = originalMaterial.clone();
  faceMaterial.map = texture;
  const geometry = originalGeometry.clone();
  const index = geometry.index!;
  const points = geometry.getAttribute('position');
  geometry.clearGroups();
  let groupStart = 0;
  let lastMaterial = -1;
  for (let i = 0; i < index.count; i += 3) {
    const isFront = [0, 1, 2].every(offset => Math.abs(points.getZ(index.getX(i + offset)) - 4) < 0.0001);
    const material = isFront ? 1 : 0;
    if (material === lastMaterial) continue;
    if (i > groupStart) geometry.addGroup(groupStart, i - groupStart, lastMaterial);
    groupStart = i;
    lastMaterial = material;
  }
  geometry.addGroup(groupStart, index.count - groupStart, lastMaterial);
  head.geometry = geometry;
  head.material = [originalMaterial, faceMaterial];
  let last: FacePose | undefined;
  return {
    draw: (pose: FacePose) => {
      if (last && (Object.keys(pose) as (keyof FacePose)[]).every(k => last![k] === pose[k])) return;
      paint(ctx, plate, actor, pose);
      texture.needsUpdate = true;
      last = pose;
    },
    dispose: () => {
      head.geometry = originalGeometry;
      head.material = originalMaterial;
      geometry.dispose();
      faceMaterial.dispose();
      texture.dispose();
    },
  };
}

export const CastFace: React.FC<{model: Group; actor: WorldArchetype; frame: number; cues?: readonly FaceCue[]}> = ({model, actor, frame, cues}) => {
  const variant = WORLD_CAST[actor].variant;
  const plate = useLoader(TextureLoader, staticFile(`assets/kenney/blocky-characters/expressions/face-${variant}.png`));
  const rig = useRef<ReturnType<typeof bindFace>>(undefined);
  useLayoutEffect(() => {
    rig.current = bindFace(model, plate.image as HTMLImageElement, actor);
    return () => { rig.current?.dispose(); rig.current = undefined; };
  }, [model, plate, actor]);
  useLayoutEffect(() => { rig.current?.draw(faceAt(frame, cues ?? [])); }, [model, plate, actor, frame, cues]);
  return null;
};
