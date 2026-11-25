import React, { useLayoutEffect } from 'react';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { CatmullRomCurve3, Color, PerspectiveCamera, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';

/** Deterministic 2D character cards staged in a frame-driven 3D world. */
export type WorldShotProps = { t: number; len: number; f: number };
export type WorldShotMap = Record<string, React.FC<WorldShotProps>>;
export type WorldSetName = 'town' | 'park' | 'school' | 'dream' | 'forest' | 'candy-canyon' | 'clockwork-sea' | 'home' | 'harbor' | 'underwater' | 'control-room' | 'map-table';
export type WorldTransition = 'flash' | 'push' | 'whip' | 'portal' | 'map-fold';
export type WorldFxCue = {
  f: number;
  kind: 'impact' | 'spark' | 'speed-lines' | 'portal' | 'pin-pulse' | 'flash';
  x?: number;
  y?: number;
  color?: string;
  duration?: number;
  strength?: number;
};
export type WorldChoiceCue = {
  a: string;
  b: string;
  startSeconds: number;
  endSeconds: number;
  selected?: 'A' | 'B';
  title?: string;
  topPercent?: number;
};
export type WorldCamera = {
  from?: { position?: [number, number, number]; target?: [number, number, number]; fov?: number };
  to?: { position?: [number, number, number]; target?: [number, number, number]; fov?: number };
};
export type WorldTimeline = {
  slug: string;
  title: string;
  fps: number;
  total: number;
  countdownSeconds?: number;
  hook?: string;
  hookHighlights?: string[];
  hookDurationSeconds?: number;
  cta?: string;
  ctaDurationSeconds?: number;
  segments: Array<{ shot: string; a: number; b: number; t0: number; t1: number; line?: string; transition?: { kind: WorldTransition; frames?: number; direction?: string; color?: string } }>;
  shots: Array<{ id: string; key: number; len: number; first: number; camera?: WorldCamera; set?: WorldSetName; sky?: string; light?: 'day' | 'sunset' | 'night' | 'storm' | 'neon' }>;
  words?: Array<{ w: string; s: number; e: number; p?: string }>;
  fx?: WorldFxCue[];
  choiceCue?: WorldChoiceCue;
  choiceCues?: WorldChoiceCue[];
  audio: { voice?: string; sfx?: string; music?: string; voiceVol?: number; sfxVol?: number; musicVol?: number };
};
export type StoryWorldOutput = { width: number; height: number; fps: number };

const OUTPUT: StoryWorldOutput = { width: 1080, height: 1920, fps: 30 };
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const vec = (a: [number, number, number], b: [number, number, number], p: number): [number, number, number] => [mix(a[0], b[0], p), mix(a[1], b[1], p), mix(a[2], b[2], p)];
const segmentAt = (timeline: WorldTimeline, frame: number) => timeline.segments.find((segment) => frame >= segment.a && frame < segment.b) ?? timeline.segments[timeline.segments.length - 1];
const localAt = (segment: WorldTimeline['segments'][number], frame: number) => {
  const span = segment.b - segment.a;
  if (span <= 0) return segment.t0;
  return segment.t0 + (segment.t1 - segment.t0) * ((frame - segment.a) / span);
};

const CameraRig: React.FC<{ position: [number, number, number]; target: [number, number, number]; fov: number }> = ({ position, target, fov }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(new Vector3(...target));
    if (camera instanceof PerspectiveCamera) camera.fov = fov;
    camera.updateProjectionMatrix();
  }, [camera, position[0], position[1], position[2], target[0], target[1], target[2], fov]);
  return null;
};

type SetLook = { sky: string; ground: string; road?: string; buildings?: string[]; night?: boolean };
const SET_LOOKS: Record<WorldSetName, SetLook> = {
  town: { sky: '#72b9ed', ground: '#78a86a', road: '#414b59' },
  park: { sky: '#8bd0f5', ground: '#6dbd68' },
  school: { sky: '#a9c7dc', ground: '#a9b9ca', road: '#414b59' },
  dream: { sky: '#403b82', ground: '#29264f', night: true },
  forest: { sky: '#263a53', ground: '#3d5543', night: true },
  'candy-canyon': { sky: '#ffad9a', ground: '#d87b85' },
  'clockwork-sea': { sky: '#46a6c7', ground: '#17678a', night: false },
  home: { sky: '#a9c8df', ground: '#b69d81' },
  harbor: { sky: '#62b6d0', ground: '#755c47' },
  underwater: { sky: '#0d5876', ground: '#123c56', night: true },
  'control-room': { sky: '#101b37', ground: '#172540', night: true },
  'map-table': { sky: '#1e3150', ground: '#725b44', night: true },
};

/** Topic-specific, reusable environment blocks with foreground, subject, and background depth layers. */
export const WorldStage: React.FC<{ set?: WorldSetName; sky?: string }> = ({ set = 'town', sky }) => {
  const look = SET_LOOKS[set];
  const actualSky = sky ?? look.sky;
  const ground = look.ground;
  const road = Boolean(look.road);
  const buildingColors = ['#f2bd77', '#7eb9bd', '#df8871', '#e4d796', '#8ca6d5', '#d5a2c3'];
  return (
    <group>
      <color attach="background" args={[actualSky]} />
      <fog attach="fog" args={[new Color(actualSky), 20, 74]} />
      {set !== 'underwater' ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={ground} roughness={0.96} />
      </mesh> : <group>
        {[-5, -1, 3, 7].map((x, i) => <mesh key={`underwater-shaft-${i}`} position={[x, 3.5, -12]} rotation={[0, 0, (i - 1.5) * 0.045]}>
          <planeGeometry args={[1.5, 24]} /><meshBasicMaterial color={i % 2 ? '#36c8eb' : '#8ceaff'} transparent opacity={0.08} side={2} />
        </mesh>)}
      </group>}
      {road ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 1]}>
        <planeGeometry args={[9, 60]} />
        <meshStandardMaterial color={look.road} roughness={0.82} />
      </mesh> : null}
      {road ? Array.from({ length: 9 }, (_, index) => (
        <mesh key={`lane-${index}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -24 + index * 6]}>
          <planeGeometry args={[0.12, 2.2]} />
          <meshBasicMaterial color="#f3e7bb" />
        </mesh>
      )) : null}
      {road && set === 'town' ? <group>
        {[-1, 1].map((side) => <mesh key={`sidewalk-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 5.15, 0.005, 1]}>
          <planeGeometry args={[1.2, 60]} /><meshStandardMaterial color="#c9bea0" roughness={0.9} />
        </mesh>)}
        {[-1, 1].map((side) => [-10, -22].map((z) => <group key={`lamp-${side}-${z}`} position={[side * 5.0, 0, z]}>
          <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.08, 0.13, 5, 8]} /><meshStandardMaterial color="#36495e" metalness={0.45} /></mesh>
          <mesh position={[side * -0.45, 5, 0]} rotation={[0, 0, side * -0.25]}><boxGeometry args={[1.0, 0.12, 0.14]} /><meshStandardMaterial color="#36495e" /></mesh>
          <mesh position={[side * -0.78, 4.9, 0]}><sphereGeometry args={[0.23, 12, 10]} /><meshStandardMaterial color="#ffe58c" emissive="#ffca57" emissiveIntensity={0.45} /></mesh>
        </group>))}
      </group> : null}
      {['town', 'school', 'home', 'control-room'].includes(set) ? Array.from({ length: 7 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        // A vertical camera has a much narrower horizontal field than a game camera.
        // Keep the first town façades inside that portrait-safe frame, then step the
        // distant buildings outward for depth instead of leaving an empty road.
        const x = side * (5.2 + Math.floor(index / 2) * 4.8);
        const depth = -4 - (index % 3) * 7;
        const height = 5 + ((index * 7) % 6);
        const width = 4.2 + (index % 2) * 1.2;
        const color = buildingColors[index % buildingColors.length];
        return <group key={`building-${index}`} position={[x, 0, depth]}>
          <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[width, height, 3]} />
            <meshStandardMaterial color={set === 'control-room' ? '#253653' : color} roughness={0.82} />
          </mesh>
          {Array.from({ length: Math.max(2, Math.floor(height / 2.4)) }, (_, row) => Array.from({ length: 2 }, (_, column) => (
            <mesh key={`window-${row}-${column}`} position={[-width * 0.24 + column * width * 0.48, 1.25 + row * 2.0, 1.54]}>
              <planeGeometry args={[0.82, 0.92]} />
              <meshBasicMaterial color={set === 'control-room' ? (index + row + column) % 2 ? '#48d5f6' : '#ffca62' : row === 1 && index % 3 === 0 ? '#ffe29a' : '#bfe6f4'} />
            </mesh>
          ))) }
        </group>;
      }) : null}
      {['park', 'town', 'forest', 'candy-canyon'].includes(set) ? Array.from({ length: set === 'forest' ? 10 : 5 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const x = side * (5.5 + Math.floor(index / 2) * 3.2);
        const z = -3 - index * 5.4;
        const trunk = set === 'candy-canyon' ? '#9a526b' : set === 'forest' ? '#342b25' : '#805c3d';
        const crown = set === 'candy-canyon' ? ['#ff77b7', '#ffd25d', '#9de6ff'][index % 3] : set === 'forest' ? '#1f483d' : index % 2 ? '#53ad68' : '#71c56c';
        return (
        <group key={`tree-${index}`} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.18, 0.25, 2.2, 7]} /><meshStandardMaterial color={trunk} /></mesh>
          <mesh position={[0, set === 'candy-canyon' ? 3.0 : 2.65, 0]} castShadow><icosahedronGeometry args={[set === 'forest' ? 1.5 : 1.15, 1]} /><meshStandardMaterial color={crown} roughness={0.92} /></mesh>
        </group>);
      }) : null}
      {set === 'school' ? <group position={[0, 0, -8]}>
        <mesh position={[0, 3.1, 0]}><boxGeometry args={[11, 6.2, 1.4]} /><meshStandardMaterial color="#e5c98d" /></mesh>
        <mesh position={[0, 6.5, 0]}><boxGeometry args={[12, 0.38, 1.7]} /><meshStandardMaterial color="#ad6654" /></mesh>
        <mesh position={[0, 4.2, 0.76]}><planeGeometry args={[3.2, 1.1]} /><meshBasicMaterial color="#fff5d5" /></mesh>
      </group> : null}
      {set === 'candy-canyon' ? <group>
        {[-1, 1].map((side) => <mesh key={`cliff-${side}`} position={[side * 7.6, 5, -13]} rotation={[0, 0, side * -0.08]}><boxGeometry args={[5.2, 12, 34]} /><meshStandardMaterial color={side < 0 ? '#a75d9f' : '#dc768a'} roughness={0.72} /></mesh>)}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, -13]}><planeGeometry args={[8.6, 38]} /><meshStandardMaterial color="#f0b36f" roughness={0.82} /></mesh>
        {[-1, 1].map((side) => [-2, -10, -19, -28].map((z, index) => <group key={`canyon-ledge-${side}-${z}`} position={[side * (5.5 + (index % 2) * 0.65), 0, z]}>
          <mesh position={[0, 1.1 + (index % 2) * 0.7, 0]} castShadow><boxGeometry args={[2.1, 2.2 + (index % 2) * 0.8, 2.8]} /><meshStandardMaterial color={side < 0 ? '#934e91' : '#c45e83'} roughness={0.9} /></mesh>
          <mesh position={[0, 2.35 + (index % 2) * 0.8, 0.12]}><boxGeometry args={[2.24, 0.2, 2.96]} /><meshStandardMaterial color={['#ffc95f', '#ff8fb8', '#9deaff'][index % 3]} roughness={0.35} /></mesh>
        </group>))}
        {[-1, 1].map((side, i) => <mesh key={`candy-${i}`} position={[side * 4.4, 4, -5 - i * 7]} rotation={[0, 0, 0.5]}><cylinderGeometry args={[0.8, 0.8, 4.6, 12]} /><meshStandardMaterial color={i ? '#fff0d0' : '#ff6e99'} roughness={0.3} /></mesh>)}
      </group> : null}
      {set === 'clockwork-sea' ? <group>
        <mesh position={[0, 0.04, -5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[32, 50]} /><meshStandardMaterial color="#2184a8" metalness={0.24} roughness={0.34} /></mesh>
        <mesh position={[0, -0.04, -5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[32, 50]} /><meshBasicMaterial color="#27b7d2" transparent opacity={0.12} /></mesh>
        {[-9, 0, 9].map((x, i) => <mesh key={`gear-${i}`} position={[x, 0.18, -8 - i * 5]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[2.1, 0.3, 8, 12]} /><meshStandardMaterial color="#e1b85c" metalness={0.72} roughness={0.28} /></mesh>)}
        {Array.from({ length: 12 }, (_, i) => <mesh key={`bubble-${i}`} position={[(i % 4 - 1.5) * 2.5, 0.5 + (i % 3) * 0.75, -2 - Math.floor(i / 4) * 7]}><sphereGeometry args={[0.09 + (i % 3) * 0.04, 8, 8]} /><meshBasicMaterial color="#a8f3ff" transparent opacity={0.48} /></mesh>)}
      </group> : null}
      {set === 'home' ? <group position={[0, 0, -7]}>
        <mesh position={[0, 2.7, -0.2]}><boxGeometry args={[11, 5.4, 0.35]} /><meshStandardMaterial color="#f4e7d3" /></mesh>
        <mesh position={[-2.35, 5.25, 0]} rotation={[0, 0, 0.42]}><boxGeometry args={[5.7, 0.56, 0.7]} /><meshStandardMaterial color="#d56a54" /></mesh>
        <mesh position={[2.35, 5.25, 0]} rotation={[0, 0, -0.42]}><boxGeometry args={[5.7, 0.56, 0.7]} /><meshStandardMaterial color="#d56a54" /></mesh>
        <mesh position={[0, 1.25, 0.24]}><boxGeometry args={[1.9, 2.55, 0.18]} /><meshStandardMaterial color="#e7c56c" roughness={0.28} metalness={0.16} emissive="#8a5712" emissiveIntensity={0.24} /></mesh>
        <mesh position={[0, 1.2, 0.08]}><boxGeometry args={[1.4, 2.4, 0.25]} /><meshStandardMaterial color="#6f513b" /></mesh>
      </group> : null}
      {set === 'harbor' ? <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, -10]}><planeGeometry args={[80, 80]} /><meshStandardMaterial color="#238db1" metalness={0.18} roughness={0.34} /></mesh>
        {[-5, -11, -17].map((z, i) => <mesh key={`harbor-ripple-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005 + i * 0.002, z]}><planeGeometry args={[42, 0.08]} /><meshBasicMaterial color={i % 2 ? '#8de9f2' : '#d2fbff'} transparent opacity={0.34} /></mesh>)}
        <mesh position={[0, 0.18, -8]}><boxGeometry args={[8.5, 0.34, 18]} /><meshStandardMaterial color="#8b6449" /></mesh>
        {[-3.8, 3.8].map((x) => [-2, -8, -14].map((z) => <mesh key={`pier-post-${x}-${z}`} position={[x, 0.68, z]}><cylinderGeometry args={[0.12, 0.16, 1.2, 8]} /><meshStandardMaterial color="#594438" /></mesh>))}
        <mesh position={[4.4, 3.2, -19]}><cylinderGeometry args={[0.7, 1.05, 6.4, 8]} /><meshStandardMaterial color="#f1eee1" /></mesh>
        <mesh position={[4.4, 6.55, -19]}><coneGeometry args={[1.1, 1.2, 8]} /><meshStandardMaterial color="#ef6e57" /></mesh>
        <mesh position={[-4.8, 0.9, -18]}><cylinderGeometry args={[0.45, 0.65, 1.8, 10]} /><meshStandardMaterial color="#ffcd64" emissive="#805322" emissiveIntensity={0.2} /></mesh>
      </group> : null}
      {set === 'map-table' ? <group>
        <mesh position={[0, 0.8, -5]} rotation={[-0.22, 0, 0]}><boxGeometry args={[12, 0.22, 9]} /><meshStandardMaterial color="#c6a36e" /></mesh>
        {[-3, 0, 3].map((x, i) => <mesh key={`map-island-${i}`} position={[x, 1.03, -5 - (i % 2) * 1.2]}><boxGeometry args={[2.2, 0.12, 1.8]} /><meshStandardMaterial color={['#71b97d', '#7fc0d5', '#d7b26d'][i]} /></mesh>)}
        <mesh position={[0, 1.55, -5]}><sphereGeometry args={[0.22, 12, 8]} /><meshStandardMaterial color="#ff5f53" emissive="#c5263d" emissiveIntensity={0.6} /></mesh>
      </group> : null}
      {set === 'control-room' ? <group position={[0, 0, -10]}>
        {Array.from({ length: 5 }, (_, i) => <mesh key={`monitor-${i}`} position={[-8 + i * 4, 5.3, -0.3]}><boxGeometry args={[3.2, 2.2, 0.18]} /><meshStandardMaterial color={i % 2 ? '#36cbe1' : '#bf73ff'} emissive={i % 2 ? '#16809a' : '#6232a4'} emissiveIntensity={0.4} /></mesh>)}
        <mesh position={[0, 0.9, 1]}><boxGeometry args={[10, 1.8, 2.2]} /><meshStandardMaterial color="#202c45" /></mesh>
      </group> : null}
      {look.night ? <ambientLight intensity={0.5} color="#9db7ff" /> : null}
    </group>
  );
};

export const WorldProp: React.FC<{
  kind?: 'box' | 'ball' | 'door' | 'gem' | 'pin' | 'portal' | 'bridge' | 'clock' | 'book' | 'sign' | 'gear'; x: number; y: number; z: number; color: string;
  scale?: number | [number, number, number]; rotation?: [number, number, number]; emissive?: string;
}> = ({ kind = 'box', x, y, z, color, scale = 1, rotation = [0, 0, 0], emissive = '#000000' }) => (
  <group position={[x, y, z]} rotation={rotation} scale={scale}>
    {kind === 'ball' ? <mesh castShadow><icosahedronGeometry args={[0.58, 1]} /><meshStandardMaterial color={color} emissive={emissive} roughness={0.38} />
    </mesh>
      : kind === 'gem' ? <mesh castShadow rotation={[0, 0, Math.PI / 4]}><octahedronGeometry args={[0.65, 0]} /><meshStandardMaterial color={color} emissive={emissive} metalness={0.2} roughness={0.22} /></mesh>
        : kind === 'pin' ? <group>
          <mesh position={[0, 0.42, 0]}><cylinderGeometry args={[0.1, 0.16, 0.72, 8]} /><meshStandardMaterial color={color} emissive={emissive} /></mesh>
          <mesh position={[0, 0.92, 0]}><sphereGeometry args={[0.34, 16, 12]} /><meshStandardMaterial color={color} emissive={emissive} metalness={0.15} roughness={0.25} /></mesh>
        </group>
        : kind === 'portal' ? <group>
          <mesh><torusGeometry args={[1.2, 0.16, 10, 48]} /><meshStandardMaterial color={color} emissive={emissive || color} emissiveIntensity={0.65} metalness={0.3} roughness={0.22} /></mesh>
          <mesh position={[0, 0, -0.03]}><circleGeometry args={[1.08, 48]} /><meshBasicMaterial color={color} transparent opacity={0.22} /></mesh>
        </group>
        : kind === 'bridge' ? <group>
          <mesh position={[0, 0, 0]}><boxGeometry args={[3.8, 0.28, 1]} /><meshStandardMaterial color={color} /></mesh>
          {[-1.5, -0.5, 0.5, 1.5].map((px) => <mesh key={px} position={[px, 0.26, 0]}><boxGeometry args={[0.12, 0.5, 0.9]} /><meshStandardMaterial color={emissive !== '#000000' ? emissive : '#65452d'} /></mesh>)}
        </group>
        : kind === 'clock' ? <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.78, 0.78, 0.18, 32]} /><meshStandardMaterial color={color} metalness={0.4} roughness={0.3} /></mesh>
          <mesh position={[0, 0, 0.12]}><torusGeometry args={[0.62, 0.065, 8, 32]} /><meshStandardMaterial color={emissive !== '#000000' ? emissive : '#f5df9b'} metalness={0.4} /></mesh>
          <mesh position={[0, 0.19, 0.21]} rotation={[0, 0, -0.4]}><boxGeometry args={[0.06, 0.42, 0.05]} /><meshBasicMaterial color="#fff7dd" /></mesh>
          <mesh position={[0.15, -0.08, 0.22]} rotation={[0, 0, 0.9]}><boxGeometry args={[0.06, 0.3, 0.05]} /><meshBasicMaterial color="#fff7dd" /></mesh>
        </group>
        : kind === 'gear' ? <group>
          <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.62, 0.19, 8, 16]} /><meshStandardMaterial color={color} emissive={emissive} metalness={0.72} roughness={0.3} /></mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.34, 0.34, 0.16, 12]} /><meshStandardMaterial color={emissive !== '#000000' ? emissive : '#f1d27c'} metalness={0.7} roughness={0.25} /></mesh>
          {Array.from({ length: 8 }, (_, index) => <mesh key={index} position={[Math.cos(index * Math.PI / 4) * 0.78, 0, Math.sin(index * Math.PI / 4) * 0.78]} rotation={[0, -index * Math.PI / 4, Math.PI / 2]}><boxGeometry args={[0.28, 0.24, 0.2]} /><meshStandardMaterial color={color} metalness={0.65} roughness={0.32} /></mesh>)}
        </group>
        : kind === 'book' ? <group rotation={[0.12, 0.08, -0.12]}>
          <mesh position={[0, 0, -0.07]}><boxGeometry args={[1.25, 0.12, 0.18]} /><meshStandardMaterial color={emissive !== '#000000' ? emissive : '#f1e5c8'} /></mesh>
          <mesh position={[-0.34, 0.08, 0]}><boxGeometry args={[0.58, 0.08, 0.18]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.34, 0.08, 0]}><boxGeometry args={[0.58, 0.08, 0.18]} /><meshStandardMaterial color={color} /></mesh>
        </group>
        : kind === 'sign' ? <group>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.65, 0.85, 0.14]} /><meshStandardMaterial color={color} emissive={emissive} roughness={0.42} /></mesh>
          <mesh position={[0, -0.48, 0]}><cylinderGeometry args={[0.07, 0.08, 1.1, 8]} /><meshStandardMaterial color="#604d3e" /></mesh>
        </group>
        : kind === 'door' ? <group>
          <mesh position={[0, 1.12, -0.045]}><boxGeometry args={[1.42, 2.52, 0.2]} /><meshBasicMaterial color="#172130" /></mesh>
          <mesh position={[0, 1.12, 0]}><boxGeometry args={[1.22, 2.3, 0.15]} /><meshStandardMaterial color={color} emissive={emissive} roughness={0.35} metalness={0.14} /></mesh>
          <mesh position={[0.42, 1.08, 0.12]}><sphereGeometry args={[0.09, 12, 8]} /><meshStandardMaterial color={emissive !== '#000000' ? emissive : '#e9c16a'} metalness={0.65} /></mesh>
        </group>
        : <group>
          <mesh castShadow><boxGeometry args={[0.96, 0.96, 0.86]} /><meshStandardMaterial color={color} emissive={emissive} roughness={0.6} /></mesh>
        </group>}
  </group>
);

/** A legible tabletop map with two genuinely different routes, relief and destination pins. */
export const WorldMapDisplay: React.FC<{ x?: number; y?: number; z?: number; t?: number; orientation?: 'landscape' | 'portrait' }> = ({ x = 0, y = 1.02, z = -5, t = 0, orientation = 'landscape' }) => {
  const routeA = new CatmullRomCurve3([
    new Vector3(-3.55, 0.16, 1.75), new Vector3(-2.6, 0.17, 1.2), new Vector3(-2.85, 0.18, 0.45),
    new Vector3(-1.7, 0.17, 0.1), new Vector3(-1.2, 0.16, -1.25), new Vector3(-2.35, 0.16, -1.85),
  ]);
  const routeB = new CatmullRomCurve3([
    new Vector3(3.55, 0.17, 1.75), new Vector3(2.6, 0.18, 1.0), new Vector3(2.5, 0.18, 0.2),
    new Vector3(1.3, 0.17, -0.4), new Vector3(1.7, 0.16, -1.25), new Vector3(2.55, 0.16, -1.9),
  ]);
  const pulse = 0.72 + Math.sin(t * 0.42) * 0.18;
  return <group position={[x, y, z]} rotation={[0, orientation === 'portrait' ? Math.PI / 2 : 0, 0]} scale={orientation === 'portrait' ? [0.86, 1, 0.86] : 1}>
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[8.6, 5.7]} /><meshStandardMaterial color="#e9d29c" roughness={0.76} />
    </mesh>
    <mesh position={[0, -0.045, 0]}><boxGeometry args={[8.9, 0.16, 5.95]} /><meshStandardMaterial color="#6f4e37" roughness={0.72} /></mesh>
    {[
      [-2.45, 0.06, 1.0, 1.45, 0.48, '#73b96c'], [-1.95, 0.06, -1.12, 1.6, 0.62, '#ec9b83'],
      [2.15, 0.06, 0.95, 1.75, 0.52, '#62b9c4'], [2.35, 0.06, -1.45, 1.35, 0.58, '#4d9dad'],
      [0, 0.06, 0, 1.1, 0.82, '#a8cb83'],
    ].map(([ix, iy, iz, width, depth, color], i) => <mesh key={`land-${i}`} position={[Number(ix), Number(iy), Number(iz)]} rotation={[-Math.PI / 2, 0, (i % 2 ? 0.12 : -0.08)]}>
      <circleGeometry args={[1, 9]} /><meshStandardMaterial color={String(color)} roughness={0.9} />
    </mesh>)}
    <mesh position={[0, 0.18, 0]}><tubeGeometry args={[routeA, 36, 0.1, 8, false]} /><meshBasicMaterial color="#ffb83e" /></mesh>
    <mesh position={[0, 0.18, 0]}><tubeGeometry args={[routeB, 36, 0.1, 8, false]} /><meshBasicMaterial color="#44d8ed" /></mesh>
    {[-3.55, 3.55].map((px, i) => <group key={`pin-${i}`} position={[px, 0.18, 1.75]} scale={i === 0 ? pulse : 0.9 + (1 - pulse) * 0.4}>
      <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.24, 12, 10]} /><meshStandardMaterial color={i === 0 ? '#ffb83e' : '#44d8ed'} emissive={i === 0 ? '#e58a1a' : '#088ba6'} emissiveIntensity={0.42} /></mesh>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.08, 0.15, 0.42, 8]} /><meshStandardMaterial color={i === 0 ? '#ffb83e' : '#44d8ed'} /></mesh>
    </group>)}
    {Array.from({ length: 7 }, (_, i) => <mesh key={`tree-${i}`} position={[(i % 4 - 1.5) * 1.35, 0.35, i < 4 ? -1.65 : 1.45]}>
      <coneGeometry args={[0.19, 0.48, 5]} /><meshStandardMaterial color={i % 2 ? '#568a56' : '#7cbd68'} />
    </mesh>)}
  </group>;
};

/** Small prop with a readable silhouette for a missing-pet clue. */
export const MissingPetPoster: React.FC<{ x?: number; y?: number; z?: number }> = ({ x = -3.2, y = 1.5, z = -2 }) => <group position={[x, y, z]}>
  <mesh castShadow><boxGeometry args={[1.6, 2.25, 0.1]} /><meshStandardMaterial color="#f6e9c6" roughness={0.92} /></mesh>
  <mesh position={[0, 0.9, 0.07]}><boxGeometry args={[1.34, 0.26, 0.035]} /><meshStandardMaterial color="#ef6b63" /></mesh>
  <mesh position={[0, -0.12, 0.075]}><boxGeometry args={[0.82, 0.88, 0.04]} /><meshStandardMaterial color="#b4d8e2" /></mesh>
  <mesh position={[0, -0.18, 0.12]}><boxGeometry args={[0.55, 0.35, 0.08]} /><meshStandardMaterial color="#f2b879" /></mesh>
  <mesh position={[0, 0.12, 0.15]}><boxGeometry args={[0.48, 0.42, 0.08]} /><meshStandardMaterial color="#f2b879" /></mesh>
  {[-1, 1].map((side) => <mesh key={side} position={[side * 0.15, 0.38, 0.15]} rotation={[0, 0, side * -0.15]}><coneGeometry args={[0.12, 0.26, 4]} /><meshStandardMaterial color="#f2b879" /></mesh>)}
  {[-1, 1].map((side) => <mesh key={`eye-${side}`} position={[side * 0.085, 0.14, 0.205]}><sphereGeometry args={[0.035, 8, 6]} /><meshBasicMaterial color="#20232c" /></mesh>)}
  <mesh position={[0, -0.58, 0.08]}><boxGeometry args={[0.84, 0.1, 0.04]} /><meshStandardMaterial color="#e6cb95" /></mesh>
  <mesh position={[0, 1.14, -0.02]}><boxGeometry args={[1.78, 0.12, 0.12]} /><meshStandardMaterial color="#795b3d" /></mesh>
</group>;

/** A hinged, glowing doorway that opens before a character crosses its plane. */
export const WorldDoor: React.FC<{ t: number; x?: number; y?: number; z?: number; openAt?: number }> = ({ t, x = 0, y = 0.02, z = -4, openAt = 8 }) => {
  const open = clamp01((t - openAt) / 20);
  return <group position={[x, y, z]}>
    <mesh position={[-0.78, 1.32, -0.12]}><boxGeometry args={[0.22, 2.88, 0.42]} /><meshStandardMaterial color="#9a6b32" metalness={0.36} roughness={0.32} /></mesh>
    <mesh position={[0.78, 1.32, -0.12]}><boxGeometry args={[0.22, 2.88, 0.42]} /><meshStandardMaterial color="#9a6b32" metalness={0.36} roughness={0.32} /></mesh>
    <mesh position={[0, 2.7, -0.12]}><boxGeometry args={[1.78, 0.22, 0.42]} /><meshStandardMaterial color="#9a6b32" metalness={0.36} roughness={0.32} /></mesh>
    <mesh position={[0, 1.3, -0.22]}><planeGeometry args={[1.3, 2.35]} /><meshBasicMaterial color="#ffdf83" transparent opacity={0.12 + open * 0.65} /></mesh>
    <group position={[-0.67, 0, 0]} rotation={[0, -open * 1.22, 0]}>
      <mesh position={[0.67, 1.25, 0]} castShadow><boxGeometry args={[1.32, 2.5, 0.16]} /><meshStandardMaterial color="#d8a846" metalness={0.22} roughness={0.32} emissive="#a36b1b" emissiveIntensity={0.1 + open * 0.32} /></mesh>
      <mesh position={[0.67, 1.25, 0.09]}><boxGeometry args={[1.02, 2.12, 0.035]} /><meshStandardMaterial color="#f2d37d" roughness={0.38} /></mesh>
      <mesh position={[1.08, 1.2, 0.14]}><sphereGeometry args={[0.085, 12, 8]} /><meshStandardMaterial color="#fff1ad" emissive="#ffd658" emissiveIntensity={0.55} /></mesh>
    </group>
  </group>;
};

/** A pin that blinks, then flies to the actor's hand on its pickup cue. */
export const PickupPin: React.FC<{ t: number; at: number; from: [number, number, number]; to: [number, number, number]; color?: string; scale?: number }> = ({ t, at, from, to, color = '#55e6ff', scale = 1 }) => {
  const flight = clamp01((t - at) / 12);
  const pulse = 0.78 + Math.sin(t * 0.5) * 0.22;
  if (flight >= 1) return null;
  const p = flight * flight * (3 - 2 * flight);
  const position: [number, number, number] = [mix(from[0], to[0], p), mix(from[1], to[1], p), mix(from[2], to[2], p)];
  return <group position={position} scale={(flight > 0 ? 1 - flight * 0.12 : pulse) * scale}>
    <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.25, 14, 12]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55 + pulse * 0.35} metalness={0.18} roughness={0.2} /></mesh>
    <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.08, 0.14, 0.48, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0.72, 0]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[0.46 + (t % 18) * 0.018, 0.035, 6, 24]} /><meshBasicMaterial color={color} transparent opacity={0.55} /></mesh>
  </group>;
};

/** A bridge that breaks from the center outward when its action cue lands. */
export const BreakawayBridge: React.FC<{ t: number; impactAt?: number; x?: number; y?: number; z?: number; color?: string; scale?: number | [number, number, number] }> = ({
  t, impactAt = 24, x = 0, y = 0.62, z = -3.8, color = '#b98755', scale = 1,
}) => <group position={[x, y, z]} scale={scale}>
  {[-1, 1].map((side) => {
    const split = clamp01((t - impactAt - 1) / 12);
    return <mesh key={`beam-${side}`} position={[side * (0.82 + split * 0.18), -0.24 - split * 0.5, split * 0.52]} rotation={[0, 0, side * (0.06 + split * 0.2)]}>
      <boxGeometry args={[1.52, 0.14, 0.16]} /><meshStandardMaterial color="#6e4d35" />
    </mesh>;
  })}
  {Array.from({ length: 5 }, (_, index) => {
    const offset = index - 2;
    const delay = Math.max(0, 2 - Math.abs(offset)) * 3;
    const fall = clamp01((t - impactAt - delay) / 22);
    return <group key={`plank-${index}`} position={[offset * 0.9 + Math.sign(offset || 1) * fall * 0.4, -fall * 1.35, fall * 0.78]} rotation={[Math.sign(offset || 1) * fall * 0.34, 0, Math.sign(offset || 1) * fall * 0.3]}>
      <mesh castShadow><boxGeometry args={[0.86, 0.28, 1.4]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 0.19, 0]}><boxGeometry args={[0.1, 0.32, 1.28]} /><meshStandardMaterial color="#694931" /></mesh>
    </group>;
  })}
  {[-1, 1].map((side) => <mesh key={`post-${side}`} position={[side * 1.8, 0.22, 0]}>
    <boxGeometry args={[0.16, 0.82, 0.18]} /><meshStandardMaterial color="#704b30" />
  </mesh>)}
</group>;

export type StoryActorProps = {
  x: number; y?: number; z?: number; scale?: number; t: number; len: number; action?: 'idle' | 'walk' | 'run' | 'point' | 'cheer' | 'shock' | 'recoil' | 'slap' | 'jump' | 'spin' | 'dive' | 'grab' | 'hug-left' | 'hug-right';
  shirt?: string; pants?: string; skin?: string; hair?: string; fromX?: number; toX?: number; fromY?: number; toY?: number; fromZ?: number; toZ?: number; travelFrames?: number; faceTravelDirection?: boolean; accessory?: 'cap' | 'bow' | 'scarf' | 'glasses';
};

/** A modular block-built game-world actor. Pose and travel are deterministic from the shot clock. */
export const StoryActor: React.FC<StoryActorProps> = ({ x, y = 0, z = 0, scale = 1, t, len, action = 'idle', shirt = '#ef735e', pants = '#344d7c', skin = '#f5c995', hair = '#493329', fromX, toX, fromY, toY, fromZ, toZ, travelFrames, faceTravelDirection = false, accessory }) => {
  const progress = clamp01(t / Math.max(1, len));
  const travelProgress = clamp01(t / Math.max(1, travelFrames ?? len));
  const moveX = fromX === undefined || toX === undefined ? x : mix(fromX, toX, travelProgress);
  const moveY = fromY === undefined || toY === undefined ? y : mix(fromY, toY, travelProgress);
  const moveZ = fromZ === undefined || toZ === undefined ? z : mix(fromZ, toZ, travelProgress);
  const cycle = Math.sin(t * 0.42);
  const moving = action === 'run' || action === 'walk';
  const armsUp = action === 'cheer' || action === 'shock';
  const hop = action === 'jump' ? Math.max(0, Math.sin(progress * Math.PI)) * 1.15 : action === 'cheer' ? Math.max(0, Math.sin(t * 0.72)) * 0.22 : 0;
  const diveLean = action === 'dive' ? Math.sin(progress * Math.PI) * 0.7 : 0;
  const lean = action === 'recoil' ? -0.16 : action === 'run' ? 0.1 : action === 'dive' ? 0.16 : action === 'hug-left' ? -0.1 : action === 'hug-right' ? 0.1 : 0;
  const legSwing = moving ? cycle * (action === 'run' ? 0.78 : 0.36) : 0;
  const rightArm = armsUp ? -2.45 : action === 'point' ? -1.1 : action === 'slap' ? -1.65 + clamp01(t / 8) * 2.3 : action === 'dive' ? -0.95 - diveLean : action === 'grab' ? 1.05 : action === 'hug-left' ? 1.38 : action === 'hug-right' ? -0.12 : moving ? -cycle * 0.72 : action === 'recoil' ? -0.55 : 0.08;
  const leftArm = armsUp ? 2.45 : action === 'dive' ? 0.65 + diveLean : action === 'grab' ? 0.18 : action === 'hug-left' ? 0.12 : action === 'hug-right' ? -1.38 : moving ? cycle * 0.72 : action === 'recoil' ? 0.48 : 0.04;
  const spinYaw = action === 'spin' ? progress * Math.PI * 4 : 0;
  const pathYaw = faceTravelDirection && fromX !== undefined && toX !== undefined && fromZ !== undefined && toZ !== undefined
    ? Math.atan2(toX - fromX, toZ - fromZ) : 0;
  return (
    <group position={[moveX, moveY + hop, moveZ]} scale={scale} rotation={[action === 'dive' ? -diveLean : 0, pathYaw + spinYaw, lean]}>
      <mesh position={[0, 0.66, 0]} castShadow><boxGeometry args={[0.66, 0.28, 0.46]} /><meshStandardMaterial color={pants} /></mesh>
      <group position={[-0.2, 0.64, 0]} rotation={[0, 0, legSwing]}><mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[0.25, 0.82, 0.32]} /><meshStandardMaterial color={pants} /></mesh><mesh position={[0, -0.82, 0.13]}><boxGeometry args={[0.34, 0.18, 0.48]} /><meshStandardMaterial color="#292d38" /></mesh></group>
      <group position={[0.2, 0.64, 0]} rotation={[0, 0, -legSwing]}><mesh position={[0, -0.4, 0]} castShadow><boxGeometry args={[0.25, 0.82, 0.32]} /><meshStandardMaterial color={pants} /></mesh><mesh position={[0, -0.82, 0.13]}><boxGeometry args={[0.34, 0.18, 0.48]} /><meshStandardMaterial color="#292d38" /></mesh></group>
      <mesh position={[0, 1.24, 0]} castShadow><boxGeometry args={[0.9, 0.94, 0.48]} /><meshStandardMaterial color={shirt} roughness={0.72} /></mesh>
      <mesh position={[0, 0.98, 0.255]}><boxGeometry args={[0.42, 0.22, 0.035]} /><meshStandardMaterial color={shirt} roughness={0.6} /></mesh>
      <group position={[-0.53, 1.53, action === 'grab' ? 0.38 : 0]} rotation={[0, 0, leftArm]}><mesh position={[0, -0.36, 0]} castShadow><boxGeometry args={[0.28, 0.76, 0.34]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0, -0.78, 0.02]}><boxGeometry args={[0.29, 0.26, 0.3]} /><meshStandardMaterial color={skin} /></mesh></group>
      <group position={[0.53, 1.53, action === 'grab' ? 0.38 : 0]} rotation={[0, 0, rightArm]}><mesh position={[0, -0.36, 0]} castShadow><boxGeometry args={[0.28, 0.76, 0.34]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0, -0.78, 0.02]}><boxGeometry args={[0.29, 0.26, 0.3]} /><meshStandardMaterial color={skin} /></mesh></group>
      <mesh position={[0, 2.13, 0]} castShadow><boxGeometry args={[0.74, 0.72, 0.66]} /><meshStandardMaterial color={skin} roughness={0.82} /></mesh>
      <mesh position={[0, 2.5, 0]}><boxGeometry args={[0.76, 0.23, 0.7]} /><meshStandardMaterial color={hair} /></mesh>
      <mesh position={[-0.17, 2.17, 0.34]}><boxGeometry args={[0.08, 0.1, 0.035]} /><meshBasicMaterial color="#18212b" /></mesh>
      <mesh position={[0.17, 2.17, 0.34]}><boxGeometry args={[0.08, 0.1, 0.035]} /><meshBasicMaterial color="#18212b" /></mesh>
      <mesh position={[0, 1.98, 0.35]}><boxGeometry args={[action === 'shock' ? 0.15 : 0.2, action === 'shock' ? 0.13 : 0.045, 0.035]} /><meshBasicMaterial color="#7d3d41" /></mesh>
      {accessory === 'cap' ? <mesh position={[0, 2.6, 0.03]}><boxGeometry args={[0.82, 0.18, 0.76]} /><meshStandardMaterial color={shirt} /></mesh> : null}
      {accessory === 'bow' ? <group position={[0, 2.57, 0.08]}><mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.28, 0.18, 0.1]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.28, 0.18, 0.1]} /><meshStandardMaterial color={shirt} /></mesh></group> : null}
      {accessory === 'scarf' ? <mesh position={[0, 1.73, 0.25]} rotation={[0.12, 0, -0.2]}><boxGeometry args={[0.84, 0.16, 0.12]} /><meshStandardMaterial color={hair} /></mesh> : null}
      {accessory === 'glasses' ? <group position={[0, 2.17, 0.38]}><mesh position={[-0.17, 0, 0]}><boxGeometry args={[0.19, 0.16, 0.04]} /><meshStandardMaterial color="#10243c" metalness={0.6} /></mesh><mesh position={[0.17, 0, 0]}><boxGeometry args={[0.19, 0.16, 0.04]} /><meshStandardMaterial color="#10243c" metalness={0.6} /></mesh></group> : null}
    </group>
  );
};

export type WorldCreatureKind = 'cat' | 'dog' | 'bug' | 'monster' | 'bird';
export const WorldCreature: React.FC<{ kind: WorldCreatureKind; x: number; y?: number; z?: number; scale?: number; t: number; len?: number; fromX?: number; toX?: number; fromY?: number; toY?: number; fromZ?: number; toZ?: number; travelFrames?: number; travelStartFrame?: number; faceTravelDirection?: boolean; action?: 'idle' | 'look' | 'walk' | 'run' | 'hop' | 'roar'; color?: string; eyeColor?: string }> = ({ kind, x, y = 0, z = 0, scale = 1, t, len = 30, fromX, toX, fromY, toY, fromZ, toZ, travelFrames, travelStartFrame = 0, faceTravelDirection = false, action = 'idle', color, eyeColor = '#ffe36e' }) => {
  const move = action === 'run' || action === 'walk';
  const progress = clamp01(t / Math.max(1, len));
  const travelProgress = clamp01((t - travelStartFrame) / Math.max(1, travelFrames ?? len));
  const motionX = fromX === undefined || toX === undefined ? x : mix(fromX, toX, travelProgress);
  const motionY = fromY === undefined || toY === undefined ? y : mix(fromY, toY, travelProgress);
  const motionZ = fromZ === undefined || toZ === undefined ? z : mix(fromZ, toZ, travelProgress);
  const pathYaw = faceTravelDirection && fromX !== undefined && toX !== undefined && fromZ !== undefined && toZ !== undefined
    ? Math.atan2(toX - fromX, toZ - fromZ) : 0;
  const bob = action === 'hop' ? Math.max(0, Math.sin(t * 0.5)) * 0.7 : move ? Math.abs(Math.sin(t * 0.52)) * 0.12 : Math.sin(t * 0.12) * 0.025;
  const fur = color ?? (kind === 'cat' ? '#f3b27c' : kind === 'dog' ? '#f4f1e6' : kind === 'bug' ? '#6c3e50' : kind === 'bird' ? '#ffcf58' : '#20232e');
  if (kind === 'bug') return <group position={[motionX, motionY + bob, motionZ]} scale={scale} rotation={[0, pathYaw, 0]}>
    <mesh position={[0, 0.68, 0]} castShadow><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color={fur} roughness={0.4} /></mesh>
    <mesh position={[0, 0.75, 0.43]}><sphereGeometry args={[0.38, 14, 10]} /><meshStandardMaterial color={fur} /></mesh>
    {[-1, 1].map((side) => [-1, 0, 1].map((row) => <group key={`${side}-${row}`} position={[side * 0.3, 0.55, row * 0.28]} rotation={[0, 0, side * (0.5 + Math.abs(row) * 0.1)]}><mesh position={[side * 0.38, -0.08, 0]}><boxGeometry args={[0.82, 0.1, 0.1]} /><meshStandardMaterial color={fur} /></mesh></group>))}
    {[[-0.14, 0.86], [0.14, 0.86]].map(([px, py]) => <mesh key={`${px}-${py}`} position={[px, py, 0.75]}><sphereGeometry args={[0.07, 8, 6]} /><meshBasicMaterial color={eyeColor} /></mesh>)}
  </group>;
  if (kind === 'monster') return <group position={[motionX, motionY + bob, motionZ]} scale={scale} rotation={[0, pathYaw, 0]}>
    <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[1.0, 1.85, 0.56]} /><meshStandardMaterial color={fur} roughness={0.86} /></mesh>
    <mesh position={[0, 2.72, 0]} castShadow><boxGeometry args={[0.92, 0.82, 0.7]} /><meshStandardMaterial color={fur} /></mesh>
    {[-0.19, 0.19].map((px) => <mesh key={px} position={[px, 2.82, 0.37]}><sphereGeometry args={[0.095, 10, 8]} /><meshBasicMaterial color={eyeColor} /></mesh>)}
    <mesh position={[0, 2.52, 0.38]}><boxGeometry args={[0.45, 0.08, 0.05]} /><meshBasicMaterial color="#f8ece2" /></mesh>
    {[-1, 1].map((side) => <group key={side} position={[side * 0.66, 1.9, 0]} rotation={[0, 0, action === 'roar' ? side * -0.45 : side * 0.08]}><mesh position={[side * 0.17, -0.46, 0]}><boxGeometry args={[0.36, 1.1, 0.38]} /><meshStandardMaterial color={fur} /></mesh></group>)}
  </group>;
  if (kind === 'bird') return <group position={[motionX, motionY + bob + 0.9, motionZ]} scale={scale} rotation={[0, pathYaw, 0]}>
    <mesh castShadow><boxGeometry args={[0.72, 0.56, 0.6]} /><meshStandardMaterial color={fur} /></mesh>
    <mesh position={[0, 0.27, 0.35]}><boxGeometry args={[0.42, 0.36, 0.42]} /><meshStandardMaterial color={fur} /></mesh>
    <mesh position={[0, 0.14, 0.68]} rotation={[0.6, 0, 0]}><coneGeometry args={[0.12, 0.3, 4]} /><meshStandardMaterial color="#f08a4b" /></mesh>
    {[-0.28, 0.28].map((px) => <mesh key={px} position={[px, 0.29, 0.54]}><sphereGeometry args={[0.04, 8, 6]} /><meshBasicMaterial color="#18212b" /></mesh>)}
  </group>;
  const isCat = kind === 'cat';
  const stride = move ? Math.sin(t * 0.52) * (action === 'run' ? 0.72 : 0.35) : 0;
  return <group position={[motionX, motionY + bob, motionZ]} scale={scale} rotation={[0, pathYaw, 0]}>
    <mesh position={[-0.05, 0.62, 0]} castShadow><boxGeometry args={[0.95, 0.5, 0.48]} /><meshStandardMaterial color={fur} roughness={0.72} /></mesh>
    <mesh position={[0.44, 0.9, 0.02]} castShadow><boxGeometry args={[0.58, 0.58, 0.5]} /><meshStandardMaterial color={fur} /></mesh>
    {isCat ? [-1, 1].map((side) => <mesh key={`ear-${side}`} position={[0.44 + side * 0.18, 1.28, 0.01]} rotation={[0, 0, side * -0.12]}><coneGeometry args={[0.19, 0.42, 4]} /><meshStandardMaterial color={fur} /></mesh>) : <mesh position={[0.72, 0.97, 0.13]}><boxGeometry args={[0.34, 0.22, 0.3]} /><meshStandardMaterial color="#eee8dd" /></mesh>}
    {[-0.02, 0.25].map((px) => <mesh key={px} position={[0.44 + px - 0.12, 0.98, 0.28]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#17212a" /></mesh>)}
    {[-0.34, 0.34].map((px) => <group key={`leg-${px}`} position={[px, 0.48, 0.16]} rotation={[0, 0, px < 0 ? stride : -stride]}><mesh position={[0, -0.27, 0]}><boxGeometry args={[0.17, 0.55, 0.18]} /><meshStandardMaterial color={fur} /></mesh></group>)}
    <group position={[-0.54, 0.72, 0]} rotation={[0, 0, Math.sin(t * 0.2) * (isCat ? 0.3 : 0.16)]}><mesh position={[-0.26, 0, 0]} rotation={[0, 0, isCat ? 0.5 : -0.15]}><boxGeometry args={[0.68, 0.13, 0.14]} /><meshStandardMaterial color={fur} /></mesh></group>
  </group>;
};

export const PortalVfx: React.FC<{ t: number; x?: number; y?: number; z?: number; color?: string }> = ({ t, x = 0, y = 2, z = 0.5, color = '#62eaff' }) => {
  const phase = clamp01(t / 32);
  if (phase >= 1) return null;
  return <group position={[x, y, z]} scale={0.4 + phase * 0.9}>
    {[0, 1, 2].map((index) => <mesh key={index} rotation={[0, 0, (index * Math.PI) / 3 + phase * (index % 2 ? -1.8 : 2.2)]}>
      <torusGeometry args={[0.8 + index * 0.12, 0.035, 6, 32]} />
      <meshBasicMaterial color={index === 1 ? '#fff3be' : color} transparent opacity={1 - phase * 0.7} />
    </mesh>)}
    <pointLight position={[0, 0, 0]} intensity={2 * (1 - phase)} color={color} distance={8} />
  </group>;
};

const ScreenFx: React.FC<{ cue: WorldFxCue; frame: number; fps: number; width: number; height: number }> = ({ cue, frame, fps, width, height }) => {
  const duration = Math.max(1, (cue.duration ?? 16) * fps);
  const age = frame - cue.f;
  if (age < 0 || age >= duration) return null;
  const p = clamp01(age / duration);
  const scale = 0.35 + p * 1.5;
  const x = `${cue.x ?? 50}%`;
  const y = `${cue.y ?? 48}%`;
  const color = cue.color ?? '#ffe36e';
  if (cue.kind === 'flash') return <AbsoluteFill style={{ pointerEvents: 'none', background: color, opacity: (1 - p) * 0.72 }} />;
  if (cue.kind === 'speed-lines') return <AbsoluteFill style={{ pointerEvents: 'none', opacity: (1 - p) * (cue.strength ?? 0.65), background: 'repeating-conic-gradient(from 8deg at 50% 50%, transparent 0 12deg, #ffffffd9 12.5deg 13.5deg, transparent 14deg 25deg)', maskImage: 'radial-gradient(ellipse at center, transparent 0 24%, #000 68%)' }} />;
  if (cue.kind === 'portal') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.42, height: height * 0.42, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale}) rotate(${age * 7}deg)`, border: `12px solid ${color}`, boxShadow: `0 0 28px ${color}, inset 0 0 32px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
  if (cue.kind === 'pin-pulse') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.08, height: height * 0.08, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale})`, border: `10px solid ${color}`, boxShadow: `0 0 24px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
  if (cue.kind === 'spark') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.24, height: height * 0.24, transform: `translate(-50%,-50%) rotate(${age * 2.2}deg) scale(${scale})`, background: `radial-gradient(circle, #fff 0 4%, ${color} 5% 11%, transparent 13%), repeating-conic-gradient(from 0deg, transparent 0 11deg, ${color} 12deg 14deg, transparent 15deg 28deg)`, filter: 'drop-shadow(0 0 18px #fff)', opacity: 1 - p, pointerEvents: 'none' }} />;
  return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.18, height: height * 0.18, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale})`, border: `10px solid ${color}`, boxShadow: `0 0 18px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
};

export const ImpactRing: React.FC<{ x: number; y: number; z?: number; t: number; color?: string }> = ({ x, y, z = 0.45, t, color = '#ffe36e' }) => {
  const p = clamp01(t / 18);
  return p >= 1 ? null : <mesh position={[x, y, z]} rotation={[0, 0, 0]} scale={0.35 + p * 1.7}>
    <torusGeometry args={[0.46, 0.055, 6, 24]} />
    <meshBasicMaterial color={color} transparent opacity={1 - p} />
  </mesh>;
};

/** A readable, moving water/sugar surge built from smooth volume, foam and timed spray. */
export const WorldWave: React.FC<{ t: number; x: number; y?: number; z: number; progress?: number; scale?: number | [number, number, number]; color?: string }> = ({ t, x, y = 1.8, z, progress = 0, scale = 1, color = '#ff62aa' }) => {
  const advance = clamp01(progress);
  const wobble = Math.sin(t * 0.18) * 0.08;
  const burst = clamp01((t - 2) / 18);
  return <group position={[x, y + wobble, z]} scale={scale}>
    <mesh castShadow scale={[1.7, 1.06, 0.72]}>
      <sphereGeometry args={[1.28, 28, 18]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.1} roughness={0.3} metalness={0.03} />
    </mesh>
    <mesh position={[0.6, 0.45, 0.18]} rotation={[0, 0, -0.24]} scale={[1.0, 0.8, 0.78]}>
      <torusGeometry args={[0.82, 0.34, 10, 32, Math.PI * 1.35]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.14} roughness={0.27} />
    </mesh>
    {[-1, 0, 1].map((side, i) => <mesh key={`foam-${i}`} position={[side * 1.06 + 0.32, 0.88 + (i === 1 ? 0.28 : 0), 0.34]} scale={[1.05, 0.58, 0.64]}>
      <sphereGeometry args={[0.64, 18, 12]} /><meshStandardMaterial color="#fff7fc" emissive="#ffe2f0" emissiveIntensity={0.12} roughness={0.24} />
    </mesh>)}
    {Array.from({ length: 7 }, (_, i) => {
      const side = i % 2 ? 1 : -1;
      const drift = burst * (0.45 + (i % 3) * 0.22);
      return <mesh key={`spray-${i}`} position={[side * (1.7 + i % 3 * 0.28), -0.08 + (i % 4) * 0.29 + drift, 0.42 + drift]} rotation={[0, 0, side * (0.15 + drift)]}>
        <icosahedronGeometry args={[0.14 + (i % 3) * 0.07, 1]} /><meshStandardMaterial color={i % 2 ? '#fff7fc' : color} emissive={color} emissiveIntensity={0.16} roughness={0.24} />
      </mesh>;
    })}
    <mesh position={[0, -1.02, 0]} scale={[1.12, 0.32 + advance * 0.16, 0.56]}>
      <sphereGeometry args={[1.4, 18, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.22} roughness={0.35} />
    </mesh>
  </group>;
};

/** A visible river lane with moving current streaks, authored per-shot so dry canyon sets stay dry. */
export const WorldRiverCurrent: React.FC<{ t: number; width?: number; length?: number; z?: number; color?: string }> = ({ t, width = 5.8, length = 36, z = -13, color = '#37b7cf' }) => {
  const half = length / 2;
  return <group>
    <mesh position={[0, 0.075, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, length]} /><meshStandardMaterial color={color} roughness={0.26} metalness={0.12} />
    </mesh>
    {[-1, 1].map((side) => <mesh key={`bank-foam-${side}`} position={[side * width * 0.46, 0.088, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.1, length]} /><meshBasicMaterial color="#e7fcff" transparent opacity={0.56} />
    </mesh>)}
    {Array.from({ length: 7 }, (_, index) => {
      const phase = ((t * 0.045 + index * 0.17) % 1 + 1) % 1;
      const streakZ = z - half + phase * length;
      const streakX = Math.sin(index * 2.1) * width * 0.28;
      return <mesh key={`current-${index}`} position={[streakX, 0.099, streakZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.12 + (index % 3) * 0.04, 1.2 + (index % 2) * 0.8]} /><meshBasicMaterial color={index % 2 ? '#d7fbff' : '#74ecf2'} transparent opacity={0.5} />
      </mesh>;
    })}
  </group>;
};

export const StoryWorldEpisode: React.FC<{ timeline: WorldTimeline; shots: WorldShotMap; sky?: string }> = ({ timeline, shots, sky = '#72b9ed' }) => {
  const frame = useCurrentFrame() * timeline.fps / OUTPUT.fps;
  return <StoryWorldFrame timeline={timeline} shots={shots} frame={frame} sky={sky} />;
};

const WorldSceneLayer: React.FC<{ timeline: WorldTimeline; shots: WorldShotMap; frame: number; sky: string; boardIndex?: number }> = ({ timeline, shots, frame, sky, boardIndex }) => {
  const { width, height } = useVideoConfig();
  const segment = segmentAt(timeline, frame);
  const meta = timeline.shots.find((shot) => shot.id === segment?.shot) ?? timeline.shots[0];
  const local = segment ? localAt(segment, frame) : 0;
  const Shot = boardIndex === undefined ? shots[segment?.shot ?? ''] : shots[meta?.id ?? ''];
  const duration = boardIndex === undefined ? (segment?.b ?? frame) - (segment?.a ?? frame) : meta?.len ?? 1;
  const clock = boardIndex === undefined ? local : meta?.key ?? 0;
  const camera = meta?.camera ?? {};
  const camFrom = camera.from ?? { position: [0, 5.2, 13] as [number, number, number], target: [0, 1.4, -1] as [number, number, number], fov: 36 };
  const camTo = camera.to ?? camFrom;
  const linearMove = clamp01(clock / Math.max(1, duration));
  const move = linearMove * linearMove * (3 - 2 * linearMove);
  const position = vec(camFrom.position ?? [0, 5.2, 13], camTo.position ?? camFrom.position ?? [0, 5.2, 13], move);
  const target = vec(camFrom.target ?? [0, 1.4, -1], camTo.target ?? camFrom.target ?? [0, 1.4, -1], move);
  const fov = mix(camFrom.fov ?? 36, camTo.fov ?? camFrom.fov ?? 36, move);
  const set = meta?.set ?? 'town';
  const lighting = meta?.light ?? 'day';
  const shotSky = meta?.sky ?? (lighting === 'night' ? '#101a35' : lighting === 'storm' ? '#524a70' : lighting === 'sunset' ? '#ee9a78' : lighting === 'neon' ? '#141b46' : sky);
  const lightColor = lighting === 'night' || lighting === 'storm' ? '#adbeff' : lighting === 'sunset' ? '#ffd2a2' : lighting === 'neon' ? '#75e5ff' : '#fff3dd';
  const ambientIntensity = lighting === 'night' ? 0.55 : lighting === 'storm' ? 0.68 : 1.0;
  return <div style={{ position: 'absolute', inset: 0, backgroundColor: shotSky }}>
    <ThreeCanvas width={width} height={height} camera={{ position, fov, near: 0.1, far: 120 }} style={{ position: 'absolute', inset: 0 }}>
      <CameraRig position={position} target={target} fov={fov} />
      <WorldStage set={set} sky={shotSky} />
      <ambientLight intensity={ambientIntensity} color={lightColor} />
      <hemisphereLight args={['#eff8ff', '#5d5b69', 1.05]} />
      <directionalLight position={[-5, 11, 8]} intensity={lighting === 'night' ? 1.0 : 2.2} color={lightColor} />
      <pointLight position={[5, 5, 6]} intensity={lighting === 'neon' ? 1.8 : lighting === 'storm' ? 0.3 : 0.7} color={lighting === 'neon' ? '#5ce9ff' : '#ffcb78'} distance={22} />
      {Shot ? <Shot t={clock} len={duration} f={frame} /> : null}
    </ThreeCanvas>
  </div>;
};

const StoryWorldFrame: React.FC<{ timeline: WorldTimeline; shots: WorldShotMap; frame: number; sky: string; boardIndex?: number }> = ({ timeline, shots, frame, sky, boardIndex }) => {
  const { width, height } = useVideoConfig();
  const seg = segmentAt(timeline, frame);
  const meta = timeline.shots.find((shot) => shot.id === seg?.shot) ?? timeline.shots[0];
  const seconds = frame / timeline.fps;
  const cueFrame = boardIndex === undefined ? frame : (meta?.first ?? 0) + (meta?.key ?? 0);
  const choiceCues = [...(timeline.choiceCue ? [timeline.choiceCue] : []), ...(timeline.choiceCues ?? [])].filter((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds);
  const timedWord = timeline.words?.find((word) => seconds >= word.s && seconds < word.e);
  const caption = timedWord ? `${timedWord.w}${timedWord.p ?? ''}` : '';
  const captionPop = timedWord ? clamp01((seconds - timedWord.s) / 0.07) : 0;
  const countdown = timeline.countdownSeconds === undefined ? null : Math.max(0, Math.ceil(timeline.countdownSeconds - seconds));
  const isHook = Boolean(timeline.hook) && seconds < (timeline.hookDurationSeconds ?? 1.5);
  const isCta = Boolean(timeline.cta) && (timeline.total / timeline.fps - seconds) <= (timeline.ctaDurationSeconds ?? 3.5);
  const transition = boardIndex === undefined ? seg?.transition : undefined;
  const transitionAge = transition ? frame - (seg?.a ?? frame) : 99;
  const transitionFrames = Math.max(1, transition?.frames ?? 8);
  const transitionProgress = transition ? clamp01(transitionAge / transitionFrames) : 1;
  const transitionAlpha = transition ? 1 - transitionProgress : 0;
  const segmentIndex = timeline.segments.findIndex((item) => item === seg);
  const previousSegment = segmentIndex > 0 ? timeline.segments[segmentIndex - 1] : undefined;
  const transitioning = Boolean(transition && previousSegment && transitionAge >= 0 && transitionAge < transitionFrames);
  const previousFrame = previousSegment ? Math.max(previousSegment.a, previousSegment.b - transitionFrames + transitionAge) : 0;
  const direction = transition?.direction ?? 'left';
  const travel: [number, number] = direction === 'left' ? [-1, 0] : direction === 'right' ? [1, 0] : direction === 'up' ? [0, -1] : direction === 'down' ? [0, 1] : [-1, 0];
  const incomingOffset = (transition?.kind === 'push' || transition?.kind === 'whip') ? `${-travel[0] * (1 - transitionProgress) * width}px, ${-travel[1] * (1 - transitionProgress) * height}px` : '0px, 0px';
  const outgoingOffset = (transition?.kind === 'push' || transition?.kind === 'whip') ? `${travel[0] * transitionProgress * width}px, ${travel[1] * transitionProgress * height}px` : '0px, 0px';
  return (
      <AbsoluteFill style={{ backgroundColor: '#101827', overflow: 'hidden', fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif' }}>
      {transitioning && previousSegment ? <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: transition?.kind === 'flash' ? 1 - transitionProgress : 1, transform: `translate(${outgoingOffset})`, zIndex: 0 }}>
        <WorldSceneLayer timeline={timeline} shots={shots} frame={previousFrame} sky={sky} />
      </div> : null}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1, opacity: transitioning && transition?.kind === 'flash' ? transitionProgress : 1,
        transform: `translate(${incomingOffset}) ${transition?.kind === 'map-fold' && transitioning ? `perspective(1000px) rotateY(${(1 - transitionProgress) * -68}deg)` : ''} ${transition?.kind === 'portal' && transitioning ? `scale(${1.08 - transitionProgress * 0.08})` : ''}`,
        clipPath: transition?.kind === 'portal' && transitioning ? `circle(${Math.max(3, transitionProgress * 150)}% at 50% 50%)` : undefined }}>
        <WorldSceneLayer timeline={timeline} shots={shots} frame={frame} sky={sky} boardIndex={boardIndex} />
      </div>
      <AbsoluteFill style={{ zIndex: 3, pointerEvents: 'none', alignItems: 'center', justifyContent: 'flex-end', padding: '0 54px 350px' }}>
        {caption && !isCta && !isHook ? <div style={{ color: '#fff', fontSize: 76, lineHeight: 1, fontWeight: 1000, textTransform: 'uppercase', textAlign: 'center', WebkitTextStroke: '3px #14233b', paintOrder: 'stroke fill', textShadow: '0 5px 0 #101827, 0 8px 16px #0008', maxWidth: 960, padding: '13px 28px', borderRadius: 18, border: '3px solid #ffd35c', background: 'linear-gradient(135deg,#101827eb,#24365adc)', boxShadow: '0 8px 22px #0008', transform: `scale(${0.9 + captionPop * 0.1})`, opacity: captionPop }}>{caption}</div> : null}
      </AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        {timeline.fx?.map((cue, index) => <ScreenFx key={`${cue.kind}-${cue.f}-${index}`} cue={cue} frame={cueFrame} fps={timeline.fps} width={width} height={height} />)}
      </div>
      {countdown !== null ? <div style={{ position: 'absolute', zIndex: 4, top: 64, right: 54, minWidth: 162, padding: '12px 18px', borderRadius: 18, border: '4px solid #ffe071', background: 'linear-gradient(135deg,#101827f2,#24365af0)', color: '#fff', fontFamily: 'Arial, sans-serif', fontSize: 46, lineHeight: 1, fontWeight: 1000, textAlign: 'center', fontVariantNumeric: 'tabular-nums', boxShadow: '0 7px 22px #0009, 0 0 20px #ffd35c66', pointerEvents: 'none' }}>00:{String(countdown).padStart(2, '0')}</div> : null}
      {choiceCues.map((choice, choiceIndex) => <AbsoluteFill key={`${choice.startSeconds}-${choiceIndex}`} style={{ zIndex: 5, pointerEvents: 'none', justifyContent: 'flex-start', padding: '0 54px', top: `${choice.topPercent ?? 22}%` }}>
        {choice.title ? <div style={{ color: '#fff', textAlign: 'center', fontSize: 54, fontWeight: 950, textShadow: '0 4px 10px #000', marginBottom: 22 }}>{choice.title}</div> : null}
        <div style={{ display: 'flex', gap: 24, width: '100%' }}>
          {(['A', 'B'] as const).map((letter) => {
            const active = choice.selected === letter;
            const label = letter === 'A' ? choice.a : choice.b;
            const accent = letter === 'A' ? '#ffbf53' : '#59d8ed';
            return <div key={letter} style={{ flex: 1, minHeight: 190, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: active ? '#142342f2' : '#101827df', border: `${active ? 7 : 4}px solid ${accent}`, borderRadius: 26, boxShadow: active ? `0 0 34px ${accent}cc` : '0 10px 22px #0008', transform: active ? 'scale(1.04)' : 'scale(1)' }}>
              <span style={{ color: accent, fontSize: 56, fontWeight: 1000, lineHeight: 1 }}>{letter}</span>
              <span style={{ color: '#fff', fontSize: 40, fontWeight: 900, textAlign: 'center', marginTop: 12, maxWidth: '92%' }}>{label}</span>
            </div>;
          })}
        </div>
      </AbsoluteFill>)}
      {isHook || isCta ? <AbsoluteFill style={{ zIndex: 6, pointerEvents: 'none', alignItems: 'center', justifyContent: isHook ? 'flex-start' : 'flex-end', padding: isHook ? '190px 54px 0' : '0 54px 260px' }}>
        <div style={{ background: 'linear-gradient(135deg,#101827f2,#24365af0)', border: '4px solid #ffcf58', borderRadius: 20, color: '#fff', padding: '20px 26px', fontSize: 46, lineHeight: 1.12, fontWeight: 950, textAlign: 'center', textShadow: '0 3px 5px #000', maxWidth: 960, boxShadow: '0 12px 32px #0009' }}>{isHook ? timeline.hook : timeline.cta}</div>
      </AbsoluteFill> : null}
      {transitioning && transition ? <AbsoluteFill style={{ zIndex: 7, pointerEvents: 'none', background: transition.kind === 'flash' ? (transition.color ?? '#fff6dd') : transition.kind === 'portal' ? `radial-gradient(circle at 50% 50%, transparent 0 16%, ${transition.color ?? '#36dff1'} 17% 21%, #121629 60%)` : transition.kind === 'map-fold' ? `linear-gradient(135deg,${transition.color ?? '#dfc17d'} 0 48%,#fff3cd 49% 51%,#543e58 52% 100%)` : transition.kind === 'push' ? 'linear-gradient(135deg,#ffffff22,#11172322)' : 'transparent', opacity: transition.kind === 'flash' ? transitionAlpha * 0.72 : transition.kind === 'portal' ? transitionAlpha * 0.55 : transition.kind === 'map-fold' ? transitionAlpha * 0.26 : transition.kind === 'push' ? transitionAlpha * 0.18 : 0, transform: transition.kind === 'portal' ? `scale(${1.1 + transitionProgress * 0.8})` : undefined }} /> : null}
      {transitioning && transition?.kind === 'whip' ? <AbsoluteFill style={{ zIndex: 8, pointerEvents: 'none', background: `linear-gradient(${direction === 'up' ? '0deg' : direction === 'down' ? '180deg' : direction === 'right' ? '270deg' : '90deg'}, transparent 25%, #fff9 48%, #75d9ff 52%, transparent 75%)`, transform: direction === 'left' ? `translateX(${(1 - transitionProgress) * width}px)` : direction === 'right' ? `translateX(${-(1 - transitionProgress) * width}px)` : direction === 'up' ? `translateY(${(1 - transitionProgress) * height}px)` : `translateY(${-(1 - transitionProgress) * height}px)`, opacity: transitionAlpha * 0.85 }} /> : null}
      {boardIndex === undefined ? <>
        {timeline.audio.voice ? <Audio src={staticFile(timeline.audio.voice)} volume={timeline.audio.voiceVol ?? 1} /> : null}
        {timeline.audio.sfx ? <Audio src={staticFile(timeline.audio.sfx)} volume={timeline.audio.sfxVol ?? 1} /> : null}
        {timeline.audio.music ? <Audio src={staticFile(timeline.audio.music)} volume={timeline.audio.musicVol ?? 1} /> : null}
      </> : null}
    </AbsoluteFill>
  );
};

export const StoryWorldBoard: React.FC<{ timeline: WorldTimeline; shots: WorldShotMap; sky?: string }> = ({ timeline, shots, sky }) => {
  const index = useCurrentFrame();
  const shot = timeline.shots[Math.min(index, timeline.shots.length - 1)];
  return <StoryWorldFrame timeline={timeline} shots={shots} frame={(shot?.first ?? 0) + (shot?.key ?? 0)} sky={sky ?? '#72b9ed'} boardIndex={index} />;
};

export const defineStoryWorldEpisode = (id: string, timeline: WorldTimeline, shots: WorldShotMap, sky = '#72b9ed') => ({
  id,
  total: timeline.total,
  shotCount: timeline.shots.length,
  output: OUTPUT,
  durationInFrames: Math.max(1, Math.round(timeline.total * OUTPUT.fps / timeline.fps)),
  Main: () => <StoryWorldEpisode timeline={timeline} shots={shots} sky={sky} />,
  Board: () => <StoryWorldBoard timeline={timeline} shots={shots} sky={sky} />,
});
