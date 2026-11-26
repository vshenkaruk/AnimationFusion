import React from 'react';
import {
  BreakawayBridge, ImpactRing, MissingPetPoster, PickupPin, PortalVfx, StoryActor, WorldCreature, WorldDoor, WorldMapDisplay, WorldProp, WorldRiverCurrent, WorldShotProps, WorldWave,
} from '../../engine';

const NIA = { shirt: '#f45a8a', pants: '#31577d', skin: '#f4c6a3', hair: '#452c39', accessory: 'bow' as const };
const THOMAS = { shirt: '#f3b43f', pants: '#344c72', skin: '#e5b58c', hair: '#503827', accessory: 'cap' as const };

// The clock, map, two route cards, bridge, pin, tunnel, and home door each prove a spoken beat.
export const S1: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={-1.8} z={1.2} t={t} len={len} action="point" {...NIA} />
  <StoryActor x={1.6} z={0.4} t={t} len={len} action="shock" {...THOMAS} />
  <WorldProp kind="clock" x={-1.9} y={4.2} z={-1.5} color="#23334c" emissive="#ffd35c" scale={0.96} />
  <MissingPetPoster x={3.0} y={1.8} z={-1.3} />
  <ImpactRing x={0} y={0.25} z={3} t={t - 12} color="#ffe36e" />
</group>;

export const S2: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={-1.35} z={2.1} t={t} len={len} action="shock" scale={0.86} {...NIA} />
  <StoryActor x={1.35} z={2.1} t={t} len={len} action="point" scale={0.86} {...THOMAS} />
  <MissingPetPoster x={0} y={1.55} z={-1.5} />
  <WorldProp kind="clock" x={0} y={3.55} z={-0.4} color="#23334c" emissive="#ffd35c" scale={0.58} />
</group>;

export const S3: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <WorldMapDisplay t={t} orientation="portrait" />
  <StoryActor x={-2.3} z={1.5} t={t} len={len} action="point" scale={0.68} {...NIA} />
</group>;

export const S4: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <WorldMapDisplay t={t} orientation="portrait" />
  <StoryActor x={2.3} z={1.5} t={t} len={len} action="point" scale={0.68} {...THOMAS} />
</group>;

export const S5: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={1.55} y={0.47} z={-3.2} t={t} len={len} action="run" fromX={-2.15} toX={1.55} fromY={0.47} toY={0.47} fromZ={-3.2} toZ={-3.2} travelFrames={52} faceTravelDirection {...NIA} />
  <WorldRiverCurrent t={t} z={-13} />
  <WorldProp kind="bridge" x={0} y={0.38} z={-3.2} color="#d28b52" scale={[1.3, 1, 1.2]} />
  <WorldProp kind="sign" x={-3.2} y={2.9} z={-5.5} color="#f8a6bb" emissive="#ff8cb6" scale={0.7} />
  <WorldProp kind="pin" x={2.7} y={1.7} z={-4.7} color="#ffb945" emissive="#ff9635" scale={0.8} />
  <WorldWave t={t} x={3.4 - Math.min(1, t / Math.max(1, len)) * 2.8} y={1.3} z={-7 + Math.min(1, t / Math.max(1, len)) * 3.6} progress={t / Math.max(1, len)} scale={[1.15, 0.9, 0.8]} />
</group>;

export const S6: React.FC<WorldShotProps> = ({ t, len }) => {
  const current = Math.min(1, t / 30);
  return <group>
    <WorldRiverCurrent t={t} z={-13} />
    <BreakawayBridge t={t} impactAt={2} x={0} y={0.38} z={-3.2} scale={[1.18, 1.35, 1.2]} />
    <WorldWave t={t} x={0.12} y={0.24} z={-3.5 + current * 3.4} progress={current} scale={[0.48 + current * 0.14, 0.32, 0.48]} />
    <StoryActor x={-1.35} y={0.47} z={-3.2} t={t} len={len} action="shock" actionBeats={[
      { f: 0, x: -1.35, y: 0.47, z: -3.2, yaw: 0, leftArm: 0.18, rightArm: -0.2 },
      { f: 4, x: -1.35, y: 0.47, z: -3.2, bodyLean: -0.12, headPitch: -0.12, leftArm: 1.05, rightArm: -1.02 },
      { f: 15, x: -1.2, y: 0.22, z: -2.85, bodyPitch: 0.12, bodyLean: -0.22, leftArm: 1.4, rightArm: -1.35, leftLeg: -0.3, rightLeg: 0.35, leftKnee: 0.24, rightKnee: 0.18 },
      { f: 32, x: -1.1, y: -0.08, z: -2.0, bodyPitch: 0.08, bodyLean: -0.08, leftArm: 0.95, rightArm: -0.92, leftLeg: -0.18, rightLeg: 0.2 },
      { f: 58, x: -1.1, y: -0.08, z: -1.7, bodyPitch: 0, bodyLean: 0, leftArm: 0.35, rightArm: -0.32, leftLeg: 0, rightLeg: 0 },
    ]} {...THOMAS} />
    <StoryActor x={1.35} y={0.47} z={-3.2} t={t} len={len} action="shock" actionBeats={[
      { f: 0, x: 1.35, y: 0.47, z: -3.2, yaw: 0, leftArm: 0.18, rightArm: -0.2 },
      { f: 4, x: 1.35, y: 0.47, z: -3.2, bodyLean: 0.14, headPitch: -0.16, leftArm: 1.08, rightArm: -1.1 },
      { f: 15, x: 1.22, y: 0.22, z: -2.82, bodyPitch: -0.12, bodyLean: 0.24, leftArm: 1.42, rightArm: -1.4, leftLeg: -0.32, rightLeg: 0.34, leftKnee: 0.2, rightKnee: 0.28 },
      { f: 32, x: 1.08, y: -0.08, z: -2.0, bodyPitch: -0.08, bodyLean: 0.08, leftArm: 0.96, rightArm: -0.94, leftLeg: -0.2, rightLeg: 0.22 },
      { f: 58, x: 1.08, y: -0.08, z: -1.7, bodyPitch: 0, bodyLean: 0, leftArm: 0.35, rightArm: -0.32, leftLeg: 0, rightLeg: 0 },
    ]} {...NIA} />
    <ImpactRing x={0} y={1.02} z={-3.2} t={t - 2} color="#fff0a5" />
  </group>;
};

export const S7: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={1.8} z={1.5} t={t} len={len} action="point" {...THOMAS} />
  <StoryActor x={-1.8} z={2.3} t={t} len={len} action="shock" scale={0.82} {...NIA} />
  <WorldProp kind="bridge" x={0} y={0.3} z={-3} color="#8a6548" scale={[1.55, 1.1, 1.6]} />
  <PickupPin t={t} at={1000} from={[1.15, 0.24, -1.2]} to={[1.15, 0.24, -1.2]} scale={1.35} />
</group>;

export const S8: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <WorldProp kind="bridge" x={0} y={0.48} z={-2.5} color="#846247" scale={[1.8, 1.1, 2.0]} />
  <WorldProp kind="pin" x={0.8} y={0.12} z={-0.4} color="#54e3f6" emissive="#31d6ef" scale={0.9 + Math.sin(t * 0.45) * 0.08} />
  <ImpactRing x={0.8} y={0.25} z={-0.4} t={t * 0.45} color="#69eaff" />
  {[0, 1, 2].map((i) => <WorldProp key={`pin-bubble-${i}`} kind="ball" x={0.35 + i * 0.5} y={0.44 + i * 0.26} z={-0.35} color="#a5f2ff" emissive="#6ce7ff" scale={0.08} />)}
</group>;

export const S9: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={0.12} y={-0.18} z={0.72} t={t} len={len} travelFrames={22} scale={0.82} action={t >= 22 ? 'grab' : 'dive'} fromX={-0.75} toX={0.12} fromY={0.05} toY={-0.18} fromZ={-1.9} toZ={0.72} faceTravelDirection {...THOMAS} />
  <PickupPin t={t} at={23} from={[0.8, 0.12, -0.4]} to={[0.78, 1.25, 1.06]} color="#54e3f6" scale={0.82} />
  {t >= 35 ? <WorldProp kind="pin" x={0.78} y={1.12} z={1.06} color="#54e3f6" emissive="#31d6ef" scale={0.55} /> : null}
  <WorldProp kind="gear" x={-2.4} y={-0.6} z={-4.4} color="#e4b957" scale={0.9} />
  <WorldProp kind="gear" x={2.6} y={-0.7} z={-5.5} color="#c78a50" scale={0.82} />
  {[0, 1, 2, 3, 4, 5].map((i) => <WorldProp key={`bubble-${i}`} kind="ball" x={-2.0 + i * 0.8} y={-0.1 + (i % 3) * 0.55} z={-1.2 - i * 0.8} color="#a5f2ff" emissive="#6ce7ff" scale={0.12 + (i % 2) * 0.08} />)}
</group>;

export const S10: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <WorldMapDisplay t={t} orientation="portrait" />
  {t >= 12 ? <WorldProp kind="pin" x={0.25} y={1.16} z={-4.45} color="#54e3f6" emissive="#31d6ef" scale={0.6} /> : null}
  <PickupPin t={t} at={0} from={[2.1, 2.5, -3.8]} to={[0.25, 1.16, -4.45]} color="#54e3f6" scale={0.9} />
  <PortalVfx t={t - 36} x={0.25} y={1.25} z={-4.45} color="#ffd15c" />
  {t >= 68 ? <WorldProp kind="portal" x={0.25} y={1.25} z={-4.45} color="#ffd15c" emissive="#ffbd32" scale={0.72} /> : null}
</group>;

export const S11: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={-2.1} z={0.8} t={t} len={len} action="cheer" {...NIA} />
  <StoryActor x={1.5} z={0.4} t={t} len={len} action="cheer" {...THOMAS} />
  <WorldCreature kind="cat" x={0.25} z={-4.55} t={t} len={len} travelStartFrame={18} travelFrames={52} fromX={0} toX={0.25} fromZ={-8.1} toZ={-4.55} scale={0.82} faceTravelDirection action="run" color="#f3b878" />
  <WorldDoor t={t} x={0} y={0.05} z={-6.82} openAt={8} />
</group>;

export const S12: React.FC<WorldShotProps> = ({ t }) => <group>
  <WorldMapDisplay t={t} orientation="portrait" />
  <WorldProp kind="pin" x={0.25} y={1.16} z={-4.45} color="#ffb945" emissive="#ff9635" scale={0.65 * Math.max(0.02, Math.min(1, t / 7))} />
  {t >= 10 ? <WorldProp kind="pin" x={-0.4} y={1.16} z={-3.7} color="#53dff0" emissive="#27aecd" scale={0.65 * Math.max(0.02, Math.min(1, (t - 10) / 7))} /> : null}
  <ImpactRing x={0.25} y={1.35} z={-4.45} t={t} color="#ffd15c" />
  {t >= 10 ? <ImpactRing x={-0.4} y={1.35} z={-3.7} t={t - 10} color="#54e3f6" /> : null}
</group>;

export const S13: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={-1.08} z={0.7} t={t} len={len} action="hug-left" {...NIA} />
  <StoryActor x={1.08} z={0.2} t={t} len={len} action="hug-right" {...THOMAS} />
  <WorldCreature kind="cat" x={0} z={1.8} scale={0.78} t={t} len={len} travelFrames={30} fromX={-0.45} toX={0} fromZ={3.0} toZ={1.8} faceTravelDirection action="hop" color="#f3b878" />
  <ImpactRing x={0} y={1.5} z={1.0} t={t - 43} color="#ffe16e" />
</group>;

export const S14: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={-0.92} z={0.65} t={t} len={len} scale={1.04} action="hug-left" {...NIA} />
  <StoryActor x={0.92} z={0.25} t={t} len={len} scale={1.04} action="hug-right" {...THOMAS} />
  <WorldCreature kind="cat" x={0} z={1.72} scale={0.88} t={t} len={len} travelFrames={22} fromX={-0.18} toX={0} fromZ={2.5} toZ={1.72} faceTravelDirection action="hop" color="#f3b878" />
  <ImpactRing x={0} y={1.6} z={1.05} t={t - 2} color="#ffe16e" />
</group>;
