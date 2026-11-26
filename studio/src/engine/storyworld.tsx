import { CastFace, FaceCue, WORLD_CAST, WorldArchetype } from './story-face';
export { WORLD_CAST } from './story-face';
export type { FaceCue, WorldArchetype, WorldExpression } from './story-face';
import React, { createContext, useContext, useLayoutEffect, useMemo, useRef } from 'react';
import { SuburbLane, TeenBedroom } from './sets/suburb';
import { WorldSky } from './world-sky';
import { DayClassroom, CottageBedroom } from './sets/world-interiors';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationMixer, Box3, BoxGeometry, CanvasTexture, CatmullRomCurve3, Color, CylinderGeometry, Group, IcosahedronGeometry, LoopOnce, LoopRepeat, Material, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, SRGBColorSpace, SphereGeometry, Vector3 } from 'three';
import { useLoader, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Deterministic 2D character cards staged in a frame-driven 3D world. */
export type WorldShotProps = { t: number; len: number; f: number; events?: Record<string, number> };
export type WorldShotMap = Record<string, React.FC<WorldShotProps>>;
export type WorldSetName = 'suburb-lane' | 'teen-bedroom' | 'classroom-side' | 'cottage-interior' | 'cottage-exterior' | 'town' | 'city-skyline' | 'city-scale-reveal' | 'park' | 'school' | 'classroom' | 'bedroom' | 'bedroom-exterior' | 'bedroom-exterior-open' | 'basketball-court' | 'dream' | 'forest' | 'candy-canyon' | 'clockwork-sea' | 'home' | 'harbor' | 'underwater' | 'control-room' | 'map-table';
export type WorldTransition = 'flash' | 'push' | 'whip' | 'portal' | 'map-fold';
export type WorldFxCue = {
  f: number;
  kind: 'impact' | 'impact-star' | 'spark' | 'speed-lines' | 'portal' | 'pin-pulse' | 'flash';
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
  shotEvents?: Record<string, Record<string, number>>;
  captionMode?: 'phrase' | 'word';
  captionZones?: Record<string, 'bottom' | 'top-right' | 'top-center'>;
  choiceCue?: WorldChoiceCue;
  choiceCues?: WorldChoiceCue[];
  audio: { voice?: string; sfx?: string; music?: string; voiceVol?: number; sfxVol?: number; musicVol?: number };
};
export type StoryWorldOutput = { width: number; height: number; fps: number };

type CaptionWord = { w: string; s: number; e: number; p?: string };
const WorldFpsContext = createContext(30);

/** Keep a short, already-spoken phrase on screen and highlight its current word. */
const spokenPhrase = (words: CaptionWord[], activeIndex: number, maxWords = 4) => {
  if (activeIndex < 0) return [] as Array<{ word: CaptionWord; index: number }>;
  let start = activeIndex;
  let count = 1;
  let chars = words[activeIndex].w.length;
  while (start > 0 && count < maxWords) {
    const previous = words[start - 1];
    if (/[.!?,]$/.test(previous.p ?? '') || words[start].s - previous.e > 0.42) break;
    const nextChars = chars + previous.w.length + 1;
    if (nextChars > 26) break;
    start -= 1;
    count += 1;
    chars = nextChars;
  }
  return words.slice(start, activeIndex + 1).map((word, offset) => ({ word, index: start + offset }));
};

const OUTPUT: StoryWorldOutput = { width: 1080, height: 1920, fps: 30 };
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
/** C2-continuous travel curve: actors ease into and out of a mark without a velocity pop. */
const smootherStep = (p: number) => {
  const t = clamp01(p);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
/** Normalized derivative of smootherStep; zero at the start/end and one at peak speed. */
const smootherSpeed = (p: number) => {
  const t = clamp01(p);
  return Math.min(1, (30 * t * t * (1 - t) * (1 - t)) / 1.875);
};
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
  'suburb-lane': {sky:'#8dcff9',ground:'#79bd66'},
  'teen-bedroom': {sky:'#2a4266',ground:'#9c7857'},
  'classroom-side': { sky: '#cde3ef', ground: '#bc875d' },
  'cottage-interior': { sky: '#efd6af', ground: '#c3a67e' },
  'cottage-exterior': { sky: '#112248', ground: '#3f9460' },
  town: { sky: '#72b9ed', ground: '#78a86a', road: '#414b59' },
  'city-skyline': { sky: '#86d3fb', ground: '#a3c97c', road: '#414b59' },
  'city-scale-reveal': { sky: '#86d3fb', ground: '#a3c97c', road: '#414b59' },
  park: { sky: '#8bd0f5', ground: '#6dbd68' },
  school: { sky: '#a9c7dc', ground: '#a9b9ca', road: '#414b59' },
  classroom: { sky: '#d6e7f0', ground: '#9b704f' },
  bedroom: { sky: '#b8d9ee', ground: '#c9b59c' },
  'bedroom-exterior': { sky: '#101a35', ground: '#38533e', night: true },
  'bedroom-exterior-open': { sky: '#101a35', ground: '#38533e', night: true },
  'basketball-court': { sky: '#81c6ee', ground: '#b87545' },
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

type KenneyTowerVariant = 'a' | 'b' | 'c' | 'd' | 'e';
const KENNEY_TOWERS: KenneyTowerVariant[] = ['d', 'c', 'e', 'a', 'b', 'c', 'e'];
const KENNEY_TOWER_SPOTS: Array<{ x: number; z: number; scale: number }> = [
  { x: -8.6, z: -12, scale: 3.1 }, { x: 12.2, z: -17, scale: 2.4 },
  { x: -13, z: -25, scale: 2.5 }, { x: 14.5, z: -32, scale: 2.35 },
  { x: -5.5, z: -39, scale: 2.9 }, { x: -13, z: -45, scale: 2.4 },
  { x: 13, z: -48, scale: 2.45 },
];
type KenneyTownVariant = 'a' | 'c' | 'e' | 'h' | 'k' | 'n' | 'q';
const KENNEY_TOWN_SPOTS: Array<{ variant: KenneyTownVariant; x: number; z: number; scale: number; yaw: number }> = [
  { variant: 'a', x: -8.0, z: -3.5, scale: 5.4, yaw: 0.12 },
  { variant: 'c', x: 7.9, z: -8.5, scale: 5.5, yaw: -0.1 },
  { variant: 'e', x: -8.5, z: -15.3, scale: 5.7, yaw: 0.08 },
  { variant: 'h', x: 8.6, z: -23, scale: 5.6, yaw: -0.12 },
  { variant: 'k', x: -8.7, z: -30.5, scale: 5.3, yaw: 0.1 },
  { variant: 'n', x: 9.0, z: -39.5, scale: 5.4, yaw: -0.08 },
  { variant: 'q', x: -8.7, z: -47.5, scale: 5.4, yaw: 0.12 },
];

const KenneyTower: React.FC<{ variant: KenneyTowerVariant; x: number; z: number; scale: number }> = ({ variant, x, z, scale }) => {
  const url = staticFile(`assets/kenney/city-kit-commercial/building-skyscraper-${variant}.glb`);
  const gltf = useLoader(GLTFLoader, url);
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return cloned;
  }, [gltf]);
  return <group position={[x, 0, z]} scale={scale}><primitive object={model} /></group>;
};

const KenneyTownBuilding: React.FC<{ variant: KenneyTownVariant; x: number; z: number; scale: number; yaw: number }> = ({ variant, x, z, scale, yaw }) => {
  const url = staticFile(`assets/kenney/city-kit-suburban/building-type-${variant}.glb`);
  const gltf = useLoader(GLTFLoader, url);
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });
    return cloned;
  }, [gltf]);
  return <group position={[x, 0, z]} rotation={[0, yaw, 0]} scale={scale}><primitive object={model} /></group>;
};

/** Topic-specific, reusable environment blocks with foreground, subject, and background depth layers. */
const NetStrand: React.FC<{ top: [number, number, number]; middle: [number, number, number]; bottom: [number, number, number] }> = ({ top, middle, bottom }) => {
  const curve = useMemo(() => new CatmullRomCurve3([
    new Vector3(...top), new Vector3(...middle), new Vector3(...bottom),
  ]), [top, middle, bottom]);
  return <mesh>
    <tubeGeometry args={[curve, 8, 0.018, 5, false]} />
    <meshBasicMaterial color="#fff7e7" transparent opacity={0.82} />
  </mesh>;
};

export const WorldStage: React.FC<{ set?: WorldSetName; sky?: string; t?: number; events?: Record<string, number> }> = ({ set = 'town', sky, t = 0, events = {} }) => {
  const look = SET_LOOKS[set];
  const actualSky = sky ?? look.sky;
  const ground = look.ground;
  const road = Boolean(look.road);
  const netAge = t - (events.net_contact ?? Number.POSITIVE_INFINITY);
  const netSag = netAge >= 0 ? 0.58 * Math.exp(-netAge / 10) * Math.sin(Math.PI * Math.min(netAge / 14, 1)) : 0;
  const netBottomY = 3.73 - netSag;
  const netBottomRadius = 0.32 + (netSag / 0.58) * 0.075;
  const bedroomWindowOpen = set === 'bedroom' ? smootherStep(clamp01((t - 35) / 12)) : 0;
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
      {road && ['city-skyline', 'city-scale-reveal'].includes(set) ? <group>
        {[-1, 1].map((side) => <mesh key={`city-sidewalk-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 5.35, 0.008, 1]}>
          <planeGeometry args={[1.7, 60]} /><meshStandardMaterial color="#e3d8c7" roughness={0.92} />
        </mesh>)}
        {[-1, 1].map((side) => <mesh key={`city-curb-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 4.53, 0.022, 1]}>
          <planeGeometry args={[0.16, 60]} /><meshStandardMaterial color="#f7eedc" roughness={0.82} />
        </mesh>)}
        {[-14, -34].map((z) => Array.from({ length: 9 }, (_, stripe) => <mesh key={`crosswalk-${z}-${stripe}`} rotation={[-Math.PI / 2, 0, 0]} position={[-3.7 + stripe * 0.92, 0.026, z]}>
          <planeGeometry args={[0.58, 1.25]} /><meshBasicMaterial color="#fff2d9" />
        </mesh>))}
      </group> : null}
      {road && ['town', 'city-skyline', 'city-scale-reveal'].includes(set) ? <group>
        {[-1, 1].map((side) => <mesh key={`sidewalk-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 5.15, 0.005, 1]}>
          <planeGeometry args={[1.2, 60]} /><meshStandardMaterial color="#c9bea0" roughness={0.9} />
        </mesh>)}
        {[-1, 1].map((side) => [-10, -22].map((z) => <group key={`lamp-${side}-${z}`} position={[side * 5.0, 0, z]}>
          <mesh position={[0, 2.5, 0]}><cylinderGeometry args={[0.08, 0.13, 5, 8]} /><meshStandardMaterial color="#36495e" metalness={0.45} /></mesh>
          <mesh position={[side * -0.45, 5, 0]} rotation={[0, 0, side * -0.25]}><boxGeometry args={[1.0, 0.12, 0.14]} /><meshStandardMaterial color="#36495e" /></mesh>
          <mesh position={[side * -0.78, 4.9, 0]}><sphereGeometry args={[0.23, 12, 10]} /><meshStandardMaterial color="#ffe58c" emissive="#ffca57" emissiveIntensity={0.45} /></mesh>
        </group>))}
      </group> : null}
      {['town', 'city-skyline', 'city-scale-reveal', 'school', 'home', 'control-room'].includes(set) ? Array.from({ length: 7 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        // A vertical camera has a much narrower horizontal field than a game camera.
        // Keep the first town façades inside that portrait-safe frame, then step the
        // distant buildings outward for depth instead of leaving an empty road.
        const x = side * (5.2 + Math.floor(index / 2) * 4.8);
        const depth = -4 - (index % 3) * 7;
        const isSkyline = set === 'city-skyline' || set === 'city-scale-reveal';
        if (isSkyline) return null;
        const height = 5 + ((index * 7) % 6);
        const width = 4.2 + (index % 2) * 1.2;
        const color = isSkyline ? ['#6bc3e5', '#55aed5', '#83d5ed', '#72badf'][index % 4] : buildingColors[index % buildingColors.length];
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
          {['town', 'city-scale-reveal'].includes(set) ? <group position={[0, 0, 1.62]}>
            <mesh position={[0, 0.72, 0]} castShadow><boxGeometry args={[width * 0.94, 1.45, 0.12]} /><meshStandardMaterial color={index % 2 ? '#f7d4a0' : '#f4e1c5'} roughness={0.88} /></mesh>
            {[-0.28, 0.28].map((side) => <group key={`shop-window-${side}`} position={[side * width * 0.25, 0.78, 0.09]}>
              <mesh><boxGeometry args={[width * 0.31, 0.72, 0.045]} /><meshStandardMaterial color="#e8f7fb" metalness={0.08} roughness={0.24} /></mesh>
              <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.055, 0.78, 0.04]} /><meshStandardMaterial color="#fff2d8" /></mesh>
              <mesh position={[0, 0, 0.031]}><boxGeometry args={[width * 0.31, 0.05, 0.04]} /><meshStandardMaterial color="#fff2d8" /></mesh>
            </group>)}
            <mesh position={[0, 1.58, 0.1]} castShadow><boxGeometry args={[width * 0.78, 0.34, 0.22]} /><meshStandardMaterial color={['#ed705b', '#38aeb7', '#f1b441', '#8471ca'][index % 4]} roughness={0.48} /></mesh>
            {Array.from({ length: 6 }, (_, stripe) => <mesh key={`awning-stripe-${stripe}`} position={[-width * 0.35 + stripe * width * 0.14, 1.31, 0.22]}><boxGeometry args={[width * 0.12, 0.24, 0.18]} /><meshStandardMaterial color={stripe % 2 ? '#fff4df' : ['#ed705b', '#38aeb7', '#f1b441'][index % 3]} /></mesh>)}
            <mesh position={[0, 2.0, 0.05]}><boxGeometry args={[width * 0.48, 0.28, 0.08]} /><meshBasicMaterial color="#fff5dc" /></mesh>
            <mesh position={[0, 0.14, 0.17]}><boxGeometry args={[0.78, 0.24, 0.16]} /><meshStandardMaterial color="#6d7380" /></mesh>
          </group> : null}
        </group>;
      }) : null}
      {['city-skyline', 'city-scale-reveal'].includes(set) ? <group>
        {KENNEY_TOWN_SPOTS.map((spot, index) => <KenneyTownBuilding key={`townhouse-${index}`} {...spot} />)}
        {KENNEY_TOWER_SPOTS.map((spot, index) => <KenneyTower key={`kenney-tower-${index}`} variant={KENNEY_TOWERS[index]} {...spot} scale={spot.scale * (set === 'city-scale-reveal' ? 0.72 : 1)} />)}
      </group> : null}
      {['park', 'town', 'city-skyline', 'city-scale-reveal', 'basketball-court', 'forest', 'candy-canyon'].includes(set) ? Array.from({ length: ['city-skyline', 'city-scale-reveal'].includes(set) ? 9 : set === 'basketball-court' ? 8 : set === 'forest' ? 10 : 5 }, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const x = set === 'basketball-court' ? side * (7.1 + Math.floor(index / 2) * 1.4) : side * (5.5 + Math.floor(index / 2) * 3.2);
        const z = set === 'basketball-court' ? -8 - index * 3.3 : -3 - index * 5.4;
        const trunk = set === 'candy-canyon' ? '#9a526b' : set === 'forest' ? '#342b25' : '#805c3d';
        const crown = set === 'candy-canyon' ? ['#ff77b7', '#ffd25d', '#9de6ff'][index % 3] : set === 'forest' ? '#1f483d' : index % 2 ? '#53ad68' : '#71c56c';
        return (
        <group key={`tree-${index}`} position={[x, 0, z]}>
          <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.18, 0.25, 2.2, 7]} /><meshStandardMaterial color={trunk} /></mesh>
          <mesh position={[0, set === 'candy-canyon' ? 3.0 : 2.65, 0]} castShadow><icosahedronGeometry args={[set === 'forest' ? 1.5 : 1.15, 1]} /><meshStandardMaterial color={crown} roughness={0.92} /></mesh>
        </group>);
      }) : null}
      {road && ['town', 'city-skyline', 'city-scale-reveal'].includes(set) ? <group>
        {[-1, 1].map((side) => <mesh key={`curb-${side}`} rotation={[-Math.PI / 2, 0, 0]} position={[side * 4.45, 0.012, 1]}><planeGeometry args={[0.12, 60]} /><meshStandardMaterial color="#f0dfbb" roughness={0.9} /></mesh>)}
        {[-7, -19].map((z, index) => <group key={`car-${z}`} position={[index === 0 ? -2.45 : 2.45, 0, z]}>
          <mesh position={[0, 0.52, 0]} castShadow><boxGeometry args={[1.38, 0.48, 2.25]} /><meshStandardMaterial color={z < -10 ? '#e56a58' : '#efbd55'} roughness={0.52} /></mesh>
          <mesh position={[0, 0.88, -0.1]} castShadow><boxGeometry args={[0.96, 0.38, 1.12]} /><meshStandardMaterial color="#d8f3fb" metalness={0.08} roughness={0.2} /></mesh>
          {[-1, 1].map((side) => [-0.7, 0.72].map((wheelZ) => <mesh key={`wheel-${side}-${wheelZ}`} position={[side * 0.7, 0.31, wheelZ]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.25, 0.25, 0.16, 12]} /><meshStandardMaterial color="#253240" roughness={0.82} /></mesh>))}
          {[-0.48, 0.48].map((lampX) => <mesh key={`headlamp-${lampX}`} position={[lampX, 0.56, 1.14]}><boxGeometry args={[0.22, 0.12, 0.035]} /><meshBasicMaterial color="#fff2ad" /></mesh>)}
        </group>)}
      </group> : null}
      {set === 'school' ? <group position={[0, 0, -8]}>
        <mesh position={[0, 3.1, 0]}><boxGeometry args={[11, 6.2, 1.4]} /><meshStandardMaterial color="#e5c98d" /></mesh>
        <mesh position={[0, 6.5, 0]}><boxGeometry args={[12, 0.38, 1.7]} /><meshStandardMaterial color="#ad6654" /></mesh>
        <mesh position={[0, 4.2, 0.76]}><planeGeometry args={[3.2, 1.1]} /><meshBasicMaterial color="#fff5d5" /></mesh>
      </group> : null}
      {set === 'suburb-lane' && <SuburbLane/>}
      {set === 'teen-bedroom' && <TeenBedroom/>}
      {set === 'classroom-side' && <DayClassroom/>}
      {(set === 'cottage-interior' || set === 'cottage-exterior') && <CottageBedroom outside={set === 'cottage-exterior'}/>}
      {set === 'classroom' ? <group>
        <mesh position={[0, 3.7, -8]}><boxGeometry args={[18, 7.4, 0.4]} /><meshStandardMaterial color="#e7dfd2" roughness={0.9} /></mesh>
        <mesh position={[0, 5.0, -7.76]}><boxGeometry args={[8.8, 3.15, 0.16]} /><meshStandardMaterial color="#24564b" roughness={0.84} /></mesh>
        <mesh position={[0, 3.35, -7.72]}><boxGeometry args={[9.1, 0.16, 0.26]} /><meshStandardMaterial color="#72533d" /></mesh>
        {[-6.1, 6.1].map((x) => <group key={`class-window-${x}`} position={[x, 4.25, -7.72]}>
          <mesh><boxGeometry args={[3.1, 2.7, 0.12]} /><meshStandardMaterial color="#f8f2e4" /></mesh>
          <mesh position={[0, 0, 0.08]}><boxGeometry args={[2.78, 2.38, 0.04]} /><meshBasicMaterial color="#8bd5f2" /></mesh>
          <mesh position={[0, 0, 0.12]}><boxGeometry args={[0.08, 2.38, 0.035]} /><meshStandardMaterial color="#f8f2e4" /></mesh>
          <mesh position={[0, 0, 0.12]}><boxGeometry args={[2.78, 0.08, 0.035]} /><meshStandardMaterial color="#f8f2e4" /></mesh>
        </group>)}
        {[[-3.2, -2.5], [0, -3.8], [3.2, -2.5], [-3.2, -5.3], [3.2, -5.3]].map(([x, z], index) => <group key={`school-desk-${index}`} position={[x, 0, z]}>
          <mesh position={[0, 0.98, 0]}><boxGeometry args={[2.25, 0.16, 1.35]} /><meshStandardMaterial color={index % 2 ? '#ba7444' : '#c98a52'} /></mesh>
          {[-0.82, 0.82].map((leg) => <mesh key={`desk-leg-${leg}`} position={[leg, 0.48, 0]}><boxGeometry args={[0.12, 0.94, 0.12]} /><meshStandardMaterial color="#55515a" /></mesh>)}
          <mesh position={[0, 0.73, 0.66]}><boxGeometry args={[2.2, 0.42, 0.12]} /><meshStandardMaterial color="#c48750" /></mesh>
        </group>)}
        <mesh position={[0, 6.55, -4]}><boxGeometry args={[14, 0.12, 7]} /><meshStandardMaterial color="#f3efe6" roughness={0.85} /></mesh>
        <mesh position={[0, 6.42, -4]}><boxGeometry args={[14, 0.1, 7]} /><meshStandardMaterial color="#d7cfc0" /></mesh>
      </group> : null}
      {set === 'bedroom' ? <group>
        <mesh position={[-4.75, 3.7, -8]}><boxGeometry args={[4.5, 7.4, 0.4]} /><meshStandardMaterial color="#f2e8d9" roughness={0.92} /></mesh>
        <mesh position={[4.75, 3.7, -8]}><boxGeometry args={[4.5, 7.4, 0.4]} /><meshStandardMaterial color="#f2e8d9" roughness={0.92} /></mesh>
        <mesh position={[0, 6.3, -8]}><boxGeometry args={[5, 2.2, 0.4]} /><meshStandardMaterial color="#f2e8d9" /></mesh>
        <mesh position={[0, 0.2, -8]}><boxGeometry args={[5, 0.4, 0.4]} /><meshStandardMaterial color="#f2e8d9" /></mesh>
        <group position={[0, 2.7, -7.7]}>
          {/* Four frame bars leave a real opening behind the sliding sash for the leg gag. */}
          <mesh position={[0, 1.67, 0]}><boxGeometry args={[5.1, 0.16, 0.2]} /><meshStandardMaterial color="#f8e7c8" /></mesh>
          <mesh position={[0, -1.67, 0]}><boxGeometry args={[5.1, 0.16, 0.2]} /><meshStandardMaterial color="#e4c18c" /></mesh>
          {[-2.47, 2.47].map((x) => <mesh key={`bedroom-window-jamb-${x}`} position={[x, 0, 0]}><boxGeometry args={[0.16, 3.5, 0.2]} /><meshStandardMaterial color="#e4c18c" /></mesh>)}
          <group position={[0, bedroomWindowOpen * 3.05, 0.08]}>
            <mesh><boxGeometry args={[4.72, 3.2, 0.035]} /><meshBasicMaterial color="#142345" /></mesh>
            <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.1, 3.2, 0.035]} /><meshStandardMaterial color="#e4c18c" /></mesh>
            <mesh position={[0, 0, 0.04]}><boxGeometry args={[4.72, 0.1, 0.035]} /><meshStandardMaterial color="#e4c18c" /></mesh>
          </group>
        </group>
        <group position={[0, 0.35, -3.2]}>
          <mesh position={[0, 0.42, 0]}><boxGeometry args={[4.9, 0.55, 6.3]} /><meshStandardMaterial color="#9a7055" /></mesh>
          <mesh position={[0, 0.82, 2.15]}><boxGeometry args={[4.6, 0.34, 1.7]} /><meshStandardMaterial color="#f5f1e8" /></mesh>
          <mesh position={[0, 0.74, -0.45]}><boxGeometry args={[4.65, 0.22, 3.6]} /><meshStandardMaterial color="#72b985" roughness={0.88} /></mesh>
          {[-1.35, 1.35].map((x) => <mesh key={`bed-foot-${x}`} position={[x, 0.13, -2.3]}><boxGeometry args={[0.18, 0.26, 0.18]} /><meshStandardMaterial color="#594449" /></mesh>)}
        </group>
        <group position={[-5.8, 0, -5.8]}>
          <mesh position={[0, 0.65, 0]}><boxGeometry args={[1.55, 1.3, 1.35]} /><meshStandardMaterial color="#9a7055" /></mesh>
          <mesh position={[0, 1.38, 0]}><cylinderGeometry args={[0.055, 0.055, 0.66, 8]} /><meshStandardMaterial color="#e7d2a5" /></mesh>
          <mesh position={[0, 1.78, 0]}><sphereGeometry args={[0.28, 10, 8]} /><meshStandardMaterial color="#fff1ae" emissive="#ffcf6e" emissiveIntensity={0.6} /></mesh>
        </group>
      </group> : null}
      {['bedroom-exterior', 'bedroom-exterior-open'].includes(set) ? <group>
        <group position={[0, 0, -8.15]}>
          <mesh position={[-3.85, 2.85, 0]}><boxGeometry args={[2.5, 5.7, 0.42]} /><meshStandardMaterial color="#d3834e" roughness={0.82} /></mesh>
          <mesh position={[3.85, 2.85, 0]}><boxGeometry args={[2.5, 5.7, 0.42]} /><meshStandardMaterial color="#d3834e" roughness={0.82} /></mesh>
          <mesh position={[0, 5.05, 0]}><boxGeometry args={[5.2, 1.4, 0.42]} /><meshStandardMaterial color="#d3834e" roughness={0.82} /></mesh>
          <mesh position={[0, 0.34, 0]}><boxGeometry args={[5.2, 0.68, 0.42]} /><meshStandardMaterial color="#d3834e" roughness={0.82} /></mesh>
          {Array.from({ length: 7 }, (_, row) => {
            const y = 0.92 + row * 0.58;
            const color = row % 2 ? '#bb6c43' : '#e09a61';
            if (set === 'bedroom-exterior-open' && y < 4.34) return [-1, 1].map((side) => <mesh key={`open-siding-${row}-${side}`} position={[side * 3.9, y, 0.224]}><boxGeometry args={[2.5, 0.035, 0.025]} /><meshStandardMaterial color={color} /></mesh>);
            return <mesh key={`siding-${row}`} position={[0, y, 0.224]}><boxGeometry args={[10.25, 0.035, 0.025]} /><meshStandardMaterial color={color} /></mesh>;
          })}
          <mesh position={[0, 0.78, 0.29]}><boxGeometry args={[5.55, 0.18, 0.2]} /><meshStandardMaterial color="#f6e6c9" /></mesh>
          <mesh position={[-2.72, 2.55, 0.3]}><boxGeometry args={[0.18, 3.6, 0.2]} /><meshStandardMaterial color="#f6e6c9" /></mesh>
          <mesh position={[2.72, 2.55, 0.3]}><boxGeometry args={[0.18, 3.6, 0.2]} /><meshStandardMaterial color="#f6e6c9" /></mesh>
          <mesh position={[0, 4.34, 0.3]}><boxGeometry args={[5.55, 0.18, 0.2]} /><meshStandardMaterial color="#f6e6c9" /></mesh>
          {set === 'bedroom-exterior' ? <>
            <mesh position={[0, 2.55, -0.05]}><planeGeometry args={[5.3, 3.48]} /><meshBasicMaterial color="#ffd890" transparent opacity={0.34} side={2} /></mesh>
            <mesh position={[0, 2.54, 0.36]}><boxGeometry args={[0.12, 3.5, 0.08]} /><meshStandardMaterial color="#f4d8ad" /></mesh>
            <mesh position={[0, 2.54, 0.36]}><boxGeometry args={[5.45, 0.12, 0.08]} /><meshStandardMaterial color="#f4d8ad" /></mesh>
          </> : null}
          {[-3.2, 3.2].map((x) => <group key={`window-light-${x}`} position={[x, 3.65, 0.32]}>
            <mesh><boxGeometry args={[0.28, 0.46, 0.12]} /><meshStandardMaterial color="#fff0b5" emissive="#ffcc63" emissiveIntensity={1.1} /></mesh>
          </group>)}
        </group>
        <mesh position={[-3.15, 5.68, -8.1]} rotation={[0, 0, 0.42]}><boxGeometry args={[7.5, 0.55, 0.92]} /><meshStandardMaterial color="#3458a4" roughness={0.8} /></mesh>
        <mesh position={[3.15, 5.68, -8.1]} rotation={[0, 0, -0.42]}><boxGeometry args={[7.5, 0.55, 0.92]} /><meshStandardMaterial color="#3458a4" roughness={0.8} /></mesh>
        <group position={[5.35, 0, -8.0]}>
          <mesh position={[0, 1.45, 0]}><boxGeometry args={[1.45, 2.9, 0.3]} /><meshStandardMaterial color="#428c94" roughness={0.8} /></mesh>
          <mesh position={[-0.42, 1.5, 0.18]}><boxGeometry args={[0.08, 0.18, 0.04]} /><meshStandardMaterial color="#ffe394" metalness={0.5} /></mesh>
          <mesh position={[0, 2.95, 0.1]}><boxGeometry args={[1.9, 0.16, 0.52]} /><meshStandardMaterial color="#f5dec0" /></mesh>
        </group>
        <group position={[0, 0.55, -11.1]}>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[4.8, 0.62, 5.7]} /><meshStandardMaterial color="#503c50" /></mesh>
          <mesh position={[0, 0.82, -1.92]}><boxGeometry args={[4.55, 0.34, 1.65]} /><meshStandardMaterial color="#d6c7b5" /></mesh>
          <mesh position={[0, 0.76, -0.48]}><boxGeometry args={[4.56, 0.22, 3.2]} /><meshStandardMaterial color="#bb5860" roughness={0.9} /></mesh>
        </group>
        {[-5.2, 5.2].map((x) => <group key={`night-bush-${x}`} position={[x, 0, -7]}>
          <mesh position={[0, 0.55, 0]}><icosahedronGeometry args={[0.85, 1]} /><meshStandardMaterial color="#24533c" roughness={0.94} /></mesh>
          <mesh position={[x < 0 ? 0.45 : -0.45, 0.88, 0.2]}><icosahedronGeometry args={[0.55, 1]} /><meshStandardMaterial color="#326748" roughness={0.94} /></mesh>
        </group>)}
      </group> : null}
      {set === 'basketball-court' ? <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -4]}><planeGeometry args={[12, 34]} /><meshStandardMaterial color="#b87545" roughness={0.84} /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.024, -4]}><planeGeometry args={[11.4, 33.4]} /><meshStandardMaterial color="#d78a57" roughness={0.78} /></mesh>
        {[-5.45, 5.45].map((x) => <mesh key={`court-boundary-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.035, -4]}><planeGeometry args={[0.11, 33]} /><meshBasicMaterial color="#fff2d9" /></mesh>)}
        {[-20.45, 12.45].map((z) => <mesh key={`court-baseline-${z}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.035, z]}><planeGeometry args={[10.9, 0.12]} /><meshBasicMaterial color="#fff2d9" /></mesh>)}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.028, 0]}><planeGeometry args={[10.8, 0.1]} /><meshBasicMaterial color="#fff2d9" /></mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -10.5]}><ringGeometry args={[3.4, 3.52, 48]} /><meshBasicMaterial color="#fff2d9" side={2} /></mesh>
        <group position={[0, 0, -10.6]}>
          <mesh position={[1.05, 2.55, -0.52]}><cylinderGeometry args={[0.14, 0.22, 5.1, 10]} /><meshStandardMaterial color="#455468" metalness={0.5} /></mesh>
          <mesh position={[0.52, 4.91, -0.42]} rotation={[0, 0, -0.3]}><boxGeometry args={[1.2, 0.18, 0.2]} /><meshStandardMaterial color="#455468" metalness={0.42} /></mesh>
          <mesh position={[0, 5.1, -0.18]}><boxGeometry args={[2.8, 1.7, 0.18]} /><meshStandardMaterial color="#f4f4eb" /></mesh>
          <mesh position={[0, 5.1, -0.07]}><boxGeometry args={[1.4, 0.82, 0.05]} /><meshStandardMaterial color="#ee9f66" /></mesh>
          <mesh position={[0, 4.23, 0.26]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.58, 0.09, 8, 24]} /><meshStandardMaterial color="#ed7b35" metalness={0.2} /></mesh>
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const top: [number, number, number] = [Math.cos(angle) * 0.49, 4.18, 0.26 + Math.sin(angle) * 0.49];
            const bottom: [number, number, number] = [Math.cos(angle) * netBottomRadius, netBottomY, 0.26 + Math.sin(angle) * netBottomRadius];
            const middle: [number, number, number] = [
              (top[0] + bottom[0]) * 0.5,
              (top[1] + bottom[1]) * 0.5 - netSag * 0.18,
              (top[2] + bottom[2]) * 0.5,
            ];
            return <NetStrand key={`net-line-${i}`} top={top} middle={middle} bottom={bottom} />;
          })}
          <mesh position={[0, netBottomY, 0.26]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[netBottomRadius, 0.025, 6, 16]} /><meshBasicMaterial color="#fff7e7" transparent opacity={0.72} /></mesh>
        </group>
        {[-7.4, 7.4].map((x) => <group key={`bleachers-${x}`} position={[x, 0, -8]}>
          {[0, 1, 2].map((row) => <mesh key={`bench-${row}`} position={[0, 0.48 + row * 0.42, -row * 0.8]}><boxGeometry args={[2.3, 0.36, 0.42]} /><meshStandardMaterial color={row % 2 ? '#416d9a' : '#e7b75a'} /></mesh>)}
        </group>)}
        {[-1, 1].map((side) => <group key={`court-fence-${side}`} position={[side * 6.2, 0.7, -7]}>
          {[-1, 1].map((height) => <mesh key={`rail-${height}`} position={[0, height * 0.62, 0]}><boxGeometry args={[0.1, 0.08, 22]} /><meshStandardMaterial color="#7d9da8" metalness={0.3} /></mesh>)}
          {Array.from({ length: 12 }, (_, i) => <mesh key={`fence-post-${i}`} position={[0, 0, -10 + i * 2]}><boxGeometry args={[0.09, 1.4, 0.09]} /><meshStandardMaterial color="#7d9da8" metalness={0.3} /></mesh>)}
        </group>)}
        {[
          { variant: 'a' as const, x: -10.2, z: -22, scale: 4.8, yaw: 0.08 },
          { variant: 'e' as const, x: 10.4, z: -25, scale: 4.65, yaw: -0.08 },
          { variant: 'n' as const, x: -14.5, z: -37, scale: 4.4, yaw: 0.12 },
          { variant: 'q' as const, x: 14.5, z: -40, scale: 4.6, yaw: -0.1 },
        ].map((spot, index) => <KenneyTownBuilding key={`court-neighborhood-${index}`} {...spot} />)}
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
        <mesh position={[-3.25, 2.7, -0.2]}><boxGeometry args={[4.5, 5.4, 0.35]} /><meshStandardMaterial color="#f4e7d3" /></mesh>
        <mesh position={[3.25, 2.7, -0.2]}><boxGeometry args={[4.5, 5.4, 0.35]} /><meshStandardMaterial color="#f4e7d3" /></mesh>
        <mesh position={[0, 4.2, -0.2]}><boxGeometry args={[2, 2.4, 0.35]} /><meshStandardMaterial color="#f4e7d3" /></mesh>
        <mesh position={[-2.35, 5.25, 0]} rotation={[0, 0, 0.42]}><boxGeometry args={[5.7, 0.56, 0.7]} /><meshStandardMaterial color="#d56a54" /></mesh>
        <mesh position={[2.35, 5.25, 0]} rotation={[0, 0, -0.42]}><boxGeometry args={[5.7, 0.56, 0.7]} /><meshStandardMaterial color="#d56a54" /></mesh>
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
  kind?: 'box' | 'ball' | 'door' | 'gem' | 'pin' | 'portal' | 'bridge' | 'clock' | 'book' | 'sign' | 'gear' | 'phone' | 'router'; x: number; y: number; z: number; color: string;
  scale?: number | [number, number, number]; rotation?: [number, number, number]; emissive?: string; active?: boolean; scrollT?: number; metric?: boolean; pageIndex?: number; pageBlend?: number;
}> = ({ kind = 'box', x, y, z, color, scale = 1, rotation = [0, 0, 0], emissive = '#000000', active = true, scrollT = 0, metric = false, pageIndex = 0, pageBlend = 1 }) => (
  <group position={[x, y, z]} rotation={rotation} scale={scale}>
    {kind === 'ball' ? <mesh castShadow><icosahedronGeometry args={[0.58, 1]} /><meshStandardMaterial color={color} emissive={emissive} roughness={0.38} />
    </mesh>
      : kind === 'phone' ? <group>
        <mesh position={[0, 1.18, 0]} castShadow><boxGeometry args={[1.32, 2.48, 0.16]} /><meshStandardMaterial color="#20212b" roughness={0.34} metalness={0.35} /></mesh>
        <PhoneScreenTexture metric={metric} pageIndex={pageIndex} pageBlend={pageBlend} />
        <mesh position={[0.43, 1.08 + Math.sin(scrollT * 0.17) * 0.22, 0.14]}><sphereGeometry args={[0.09, 12, 10]} /><meshBasicMaterial color="#fff" /></mesh>
        <mesh position={[0, -0.14, 0.11]}><boxGeometry args={[0.32, 0.035, 0.02]} /><meshBasicMaterial color="#7b6671" /></mesh>
      </group>
        : kind === 'router' ? <group>
          <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[1.55, 0.62, 0.9]} /><meshStandardMaterial color={color} roughness={0.46} metalness={0.16} /></mesh>
          <mesh position={[0, 0.78, 0.06]}><boxGeometry args={[1.3, 0.08, 0.68]} /><meshStandardMaterial color="#f4f2e9" roughness={0.45} /></mesh>
          {[-0.54, 0, 0.54].map((x, index) => <group key={`router-antenna-${index}`} position={[x, 0.78, -0.25]} rotation={[0, 0, (index - 1) * -0.12]}>
            <mesh position={[0, 0.72, 0]}><cylinderGeometry args={[0.045, 0.055, 1.45, 8]} /><meshStandardMaterial color="#353d4a" /></mesh>
            <mesh position={[0, 1.48, 0]}><sphereGeometry args={[0.075, 8, 6]} /><meshStandardMaterial color="#73e4ff" emissive="#38c9ff" emissiveIntensity={0.85} /></mesh>
          </group>)}
          {[-0.42, -0.14, 0.14, 0.42].map((x) => <mesh key={`router-light-${x}`} position={[x, 0.52, 0.46]}><sphereGeometry args={[0.045, 8, 6]} /><meshStandardMaterial color={active ? '#7de9ff' : '#48515c'} emissive={active ? '#5edbff' : '#111821'} emissiveIntensity={active ? 1.1 : 0} /></mesh>)}
        </group>
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

/** A feed screen with a pinned measurement label and an authored vertical swipe between clips. */
const PhoneScreenTexture: React.FC<{ metric: boolean; pageIndex: number; pageBlend: number }> = ({ metric, pageIndex, pageBlend }) => {
  const texture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const palettes = [
      { sky: ['#91def8', '#f5f8ff', '#f6ca82'], player: '#34b980', label: 'CLIP 1', buildings: ['#ef9c65', '#59b9cf', '#f1c451', '#d98cac'] },
      { sky: ['#ffb7d0', '#fff3f8', '#ffd58b'], player: '#ff6d8e', label: 'CLIP 2', buildings: ['#df7590', '#c96c88', '#efb64f', '#9d78d5'] },
      { sky: ['#9bb5ff', '#f1f2ff', '#a9e4c4'], player: '#8069dc', label: 'CLIP 3', buildings: ['#697bd5', '#4d9dab', '#73bb8e', '#8d79ce'] },
    ];
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, 512, 1024);
    ctx.fillStyle = '#182439';
    ctx.fillRect(0, 0, 512, 88);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 38px Arial';
    ctx.fillText('FOR YOU', 27, 58);
    ctx.fillStyle = '#59d7e8';
    ctx.fillRect(32, 92, 448, 7);
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 114, 472, 640);
    ctx.clip();
    ctx.fillStyle = '#92d9ed';
    ctx.fillRect(20, 114, 472, 640);
    const drawClip = (index: number, offsetY: number) => {
      const pagePalette = palettes[((index % palettes.length) + palettes.length) % palettes.length];
      ctx.save();
      ctx.translate(0, offsetY);
      const videoSky = ctx.createLinearGradient(0, 116, 0, 754);
      videoSky.addColorStop(0, pagePalette.sky[0]);
      videoSky.addColorStop(0.63, pagePalette.sky[1]);
      videoSky.addColorStop(1, pagePalette.sky[2]);
      ctx.fillStyle = videoSky;
      ctx.fillRect(20, 114, 472, 640);
      ctx.fillStyle = '#f2a862';
      ctx.fillRect(20, 624, 472, 130);
      ctx.fillStyle = '#3e5268';
      ctx.beginPath();
      ctx.moveTo(190, 754); ctx.lineTo(320, 754); ctx.lineTo(280, 480); ctx.lineTo(230, 480); ctx.closePath(); ctx.fill();
      const buildings = [[42, 414, 96, 210], [142, 376, 68, 248], [342, 392, 112, 232], [260, 432, 72, 192]];
      for (const [buildingIndex, [x, y, w, h]] of buildings.entries()) {
        ctx.fillStyle = pagePalette.buildings[buildingIndex];
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = '#e4f7fb';
        for (let wy = y + 24; wy < y + h - 12; wy += 40) {
          for (let wx = x + 12; wx < x + w - 8; wx += 32) ctx.fillRect(wx, wy, 15, 18);
        }
      }
      ctx.fillStyle = pagePalette.player;
      ctx.fillRect(220 + (index === 1 ? -34 : index === 2 ? 32 : 0), 390, 72, 94);
      ctx.fillStyle = '#c8815e'; ctx.fillRect(233, 344, 47, 48);
      ctx.fillStyle = '#3c4e7a'; ctx.fillRect(223, 480, 28, 132); ctx.fillRect(262, 480, 28, 132);
      ctx.fillStyle = '#272d3c'; ctx.fillRect(218, 602, 42, 21); ctx.fillRect(256, 602, 42, 21);
      ctx.fillStyle = '#172439d9'; ctx.fillRect(30, 132, 194, 52);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 24px Arial'; ctx.fillText(pagePalette.label, 43, 166);
      ctx.fillStyle = '#ff5b79'; ctx.beginPath(); ctx.arc(451, 524, 19, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(451, 570, 17, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    if (pageIndex === 0) {
      drawClip(0, 0);
    } else {
      const progress = Math.max(0, Math.min(1, pageBlend));
      drawClip(pageIndex - 1, -progress * 640);
      drawClip(pageIndex, (1 - progress) * 640);
    }
    ctx.restore();
    ctx.fillStyle = '#162438'; ctx.fillRect(32, 790, 448, 112);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px Arial'; ctx.fillText('Swipe 10 cm', 48, 839);
    ctx.fillStyle = '#8fe8f6'; ctx.font = 'bold 54px Arial'; ctx.fillText(metric ? '10 cm' : '1 new clip', 48, 882);
    ctx.fillStyle = '#152033'; ctx.fillRect(32, 930, 448, 62);
    ctx.fillStyle = '#fff'; ctx.fillRect(74, 949, 36, 25); ctx.fillRect(240, 949, 36, 25); ctx.fillRect(406, 949, 36, 25);
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, [metric, pageIndex, pageBlend]);
  return texture ? <mesh position={[0, 1.18, 0.105]} renderOrder={2}><planeGeometry args={[1.12, 2.2]} /><meshBasicMaterial map={texture} toneMapped={false} /></mesh>
    : <mesh position={[0, 1.18, 0.105]} renderOrder={2}><planeGeometry args={[1.12, 2.2]} /><meshBasicMaterial color="#8bd8ef" /></mesh>;
};

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

export type StoryActorAction = 'idle' | 'walk' | 'run' | 'point' | 'cheer' | 'shock' | 'recoil' | 'slap' | 'jump' | 'spin' | 'dive' | 'grab' | 'hug-left' | 'hug-right';
/** Sparse pose keys in local shot frames; all numeric channels ease between authored keys. */
export type StoryActorPoseBeat = {
  f: number; scale?: number; legStretch?: number;
  x?: number; y?: number; z?: number; yaw?: number;
  bodyPitch?: number; bodyLean?: number; headYaw?: number; headPitch?: number;
  leftArm?: number; rightArm?: number; leftElbow?: number; rightElbow?: number;
  leftLeg?: number; rightLeg?: number; leftKnee?: number; rightKnee?: number;
  lift?: number;
  event?: string;
};
type StoryActorBeatChannel = Exclude<keyof StoryActorPoseBeat, 'f' | 'event'>;
const sampleActorBeat = (beats: StoryActorPoseBeat[] | undefined, frame: number, channel: StoryActorBeatChannel, fallback: number) => {
  const keys = (beats ?? []).filter((beat) => typeof beat[channel] === 'number').sort((a, b) => a.f - b.f);
  if (!keys.length) return fallback;
  const nextIndex = keys.findIndex((beat) => beat.f >= frame);
  if (nextIndex === -1) return keys[keys.length - 1][channel] as number;
  const next = keys[nextIndex];
  if (nextIndex === 0 || next.f <= frame) return next[channel] as number;
  const previous = keys[nextIndex - 1];
  const span = next.f - previous.f;
  if (span <= 0) return next[channel] as number;
  const tangentAt = (index: number) => {
    if (index <= 0 || index >= keys.length - 1) return 0;
    const before = keys[index - 1];
    const at = keys[index];
    const after = keys[index + 1];
    const h0 = at.f - before.f;
    const h1 = after.f - at.f;
    if (h0 <= 0 || h1 <= 0) return 0;
    const yBefore = before[channel] as number;
    const yAt = at[channel] as number;
    const yAfter = after[channel] as number;
    const d0 = (yAt - yBefore) / h0;
    const d1 = (yAfter - yAt) / h1;
    if (d0 === 0 || d1 === 0 || d0 * d1 <= 0) return 0;
    // PCHIP's weighted harmonic mean keeps keyed motion smooth without
    // overshooting a pose, and preserves real stops at reversals or holds.
    const w0 = 2 * h1 + h0;
    const w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / d0 + w1 / d1);
  };
  const progress = clamp01((frame - previous.f) / span);
  const p2 = progress * progress;
  const p3 = p2 * progress;
  const y0 = previous[channel] as number;
  const y1 = next[channel] as number;
  const m0 = tangentAt(nextIndex - 1) * span;
  const m1 = tangentAt(nextIndex) * span;
  const h00 = 2 * p3 - 3 * p2 + 1;
  const h10 = p3 - 2 * p2 + progress;
  const h01 = -2 * p3 + 3 * p2;
  const h11 = p3 - p2;
  return h00 * y0 + h10 * m0 + h01 * y1 + h11 * m1;
};

export type StoryActorProps = {
  archetype?: WorldArchetype; faceCues?: readonly FaceCue[];
  x: number; y?: number; z?: number; scale?: number; legStretch?: number; t: number; len: number; action?: StoryActorAction; actionBeats?: StoryActorPoseBeat[];
  shirt?: string; pants?: string; skin?: string; hair?: string; fromX?: number; toX?: number; fromY?: number; toY?: number; fromZ?: number; toZ?: number; travelFrames?: number; faceTravelDirection?: boolean; accessory?: 'cap' | 'bow' | 'scarf' | 'glasses';
  rig?: 'procedural' | 'kenney'; variant?: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r'; animationClip?: string; animationStartFrame?: number; heldPhone?: boolean; phoneStowAt?: number; heldBall?: boolean; heldBallHand?: 'left' | 'right'; heldBallScale?: number; heldBallStartFrame?: number; heldBallEndFrame?: number; hideLegs?: boolean; headRouter?: boolean; headRouterStart?: number; headRouterDropStart?: number; headRouterDropFrames?: number; headRouterDropHeight?: number;
};

const ACTOR_CLIPS: Record<StoryActorAction, string> = {
  idle: 'idle', walk: 'walk', run: 'sprint', point: 'interact-right', cheer: 'emote-yes', shock: 'emote-no',
  recoil: 'emote-no', slap: 'attack-melee-right', jump: 'idle', spin: 'idle', dive: 'die', grab: 'pick-up',
  'hug-left': 'holding-left', 'hug-right': 'holding-right',
};

/** Three.js GLB actor with frame-addressable Kenney motion clips and optional hand-held phone. */
const KenneyActor: React.FC<StoryActorProps> = (props) => {
  const {
    x, y = 0, z = 0, scale = 1, legStretch = 1, t, len, action = 'idle', actionBeats,
    fromX, toX, fromY, toY, fromZ, toZ, travelFrames, faceTravelDirection = false,
    archetype, faceCues, variant: variantOverride, animationClip, animationStartFrame = 0, heldPhone = false, phoneStowAt, heldBall = false, heldBallHand = 'right', heldBallScale = 0.48, heldBallStartFrame = 0, heldBallEndFrame, hideLegs = false, headRouter = false, headRouterStart, headRouterDropStart, headRouterDropFrames = 16, headRouterDropHeight = 2.7,
  } = props;
  const variant = variantOverride ?? (archetype ? WORLD_CAST[archetype].variant : 'f');
  const fps = useContext(WorldFpsContext);
  const url = staticFile(`assets/kenney/blocky-characters/character-${variant}.glb`);
  const gltf = useLoader(GLTFLoader, url);
  const model = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((object) => {
      const mesh = object as Mesh;
      if (hideLegs && (object.name === 'leg-left' || object.name === 'leg-right')) object.visible = false;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const convert = (material: Material): Material => {
        if (!(material instanceof MeshBasicMaterial)) return material;
        return new MeshStandardMaterial({
          map: material.map,
          color: material.color,
          transparent: material.transparent,
          opacity: material.opacity,
          alphaTest: material.alphaTest,
          side: material.side,
          roughness: 0.78,
          metalness: 0,
        });
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material);
    });
    if (heldPhone) {
      const arm = cloned.getObjectByName('arm-right');
      if (arm) {
        const phone = new Group();
        phone.name = 'story-held-phone';
        phone.position.set(0, -0.58, 0.2);
        phone.rotation.z = -0.08;
        phone.scale.setScalar(0.62);
        const shell = new Mesh(new BoxGeometry(0.48, 0.82, 0.075), new MeshStandardMaterial({ color: '#242a36', roughness: 0.38, metalness: 0.28 }));
        shell.position.z = 0.015;
        shell.castShadow = true;
        const screen = new Mesh(new PlaneGeometry(0.41, 0.69), new MeshBasicMaterial({ color: '#ff7ca1' }));
        screen.position.z = 0.057;
        phone.add(shell, screen);
        const feed = new Group();
        feed.name = 'story-phone-feed';
        for (let i = 0; i < 3; i++) {
          const bar = new Mesh(new BoxGeometry(0.27, 0.045, 0.012), new MeshBasicMaterial({ color: i === 1 ? '#fff0a8' : '#fff8f3' }));
          bar.position.set(0, 0.18 - i * 0.15, 0.066);
          feed.add(bar);
        }
        const badge = new Mesh(new BoxGeometry(0.28, 0.14, 0.012), new MeshBasicMaterial({ color: '#34c9d8' }));
        badge.position.set(0, -0.245, 0.066);
        feed.add(badge);
        phone.add(feed);
        arm.add(phone);
      }
    }
    if (heldBall) {
      const arm = cloned.getObjectByName(`arm-${heldBallHand}`);
      if (arm) {
        const ball = new Mesh(new IcosahedronGeometry(0.58, 1), new MeshStandardMaterial({ color: '#ed8b36', emissive: '#a64f1a', roughness: 0.38 }));
        ball.name = 'story-held-ball';
        // The bottom-center of the block arm is the wrist proxy in these GLBs.
        // A small forward offset seats the ball in the palm and follows every
        // authored pose, gait and scale change without a floating world-space prop.
        ball.position.set(heldBallHand === 'right' ? -0.2 : 0, heldBallHand === 'right' ? -0.9 : -1, 0.1);
        ball.castShadow = true;
        ball.receiveShadow = true;
        arm.add(ball);
      }
    }
    if (headRouter) {
      const head = cloned.getObjectByName('head');
      if (head) {
        cloned.updateMatrixWorld(true);
        const headBounds = new Box3().setFromObject(head);
        const headCenter = headBounds.getCenter(new Vector3());
        const headTop = headBounds.max.y;
        const localTop = head.worldToLocal(new Vector3(headCenter.x, headTop, headCenter.z));
        // The Kenney GLBs scale the head node itself to 0.1. Counter-scale the
        // accessory so its size is expressed in avatar space, not raw mesh space.
        const headScale = Math.max(0.01, Math.abs(head.scale.y));
        const accessoryScale = 0.58 / headScale;
        const router = new Group();
        router.name = 'story-head-router';
        router.position.set(localTop.x, localTop.y - 0.14 * accessoryScale, localTop.z + 0.24 / headScale);
        router.userData.anchorY = router.position.y;
        router.scale.setScalar(accessoryScale);
        const shellMaterial = new MeshStandardMaterial({ color: '#e8edf2', roughness: 0.46, metalness: 0.16 });
        const darkMaterial = new MeshStandardMaterial({ color: '#353d4a', roughness: 0.68 });
        const base = new Mesh(new BoxGeometry(1.55, 0.62, 0.9), shellMaterial);
        base.position.set(0, 0.45, 0);
        base.castShadow = true;
        router.add(base);
        const cap = new Mesh(new BoxGeometry(1.3, 0.08, 0.68), new MeshStandardMaterial({ color: '#f4f2e9', roughness: 0.45 }));
        cap.position.set(0, 0.78, 0.06);
        router.add(cap);
        [-0.54, 0, 0.54].forEach((x, index) => {
          const antenna = new Group();
          antenna.position.set(x, 0.78, -0.25);
          antenna.rotation.z = (index - 1) * -0.12;
          const stem = new Mesh(new CylinderGeometry(0.045, 0.055, 1.45, 8), darkMaterial);
          stem.position.y = 0.72;
          const tip = new Mesh(new SphereGeometry(0.075, 8, 6), new MeshStandardMaterial({ color: '#73e4ff', emissive: '#38c9ff', emissiveIntensity: 0 }));
          tip.name = 'story-router-tip';
          tip.position.y = 1.48;
          antenna.add(stem, tip);
          router.add(antenna);
        });
        [-0.42, -0.14, 0.14, 0.42].forEach((x) => {
          const light = new Mesh(new SphereGeometry(0.045, 8, 6), new MeshStandardMaterial({ color: '#48515c', emissive: '#111821', emissiveIntensity: 0 }));
          light.name = 'story-router-light';
          light.position.set(x, 0.52, 0.46);
          router.add(light);
        });
        head.add(router);
      }
    }
    return cloned;
  }, [gltf, heldPhone, heldBall, heldBallHand, hideLegs, headRouter]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const bindPose = useMemo(() => {
    const nodes = ['root', 'torso', 'head', 'arm-left', 'arm-right', 'leg-left', 'leg-right'];
    return new Map(nodes.map((name) => {
      const object = model.getObjectByName(name);
      return [name, object ? { rotation: object.rotation.clone(), scale: object.scale.clone() } : null] as const;
    }));
  }, [model]);
  const clipName = animationClip ?? ACTOR_CLIPS[action];
  const requestedClip = gltf.animations.find((candidate) => candidate.name === clipName) ?? gltf.animations.find((candidate) => candidate.name === 'idle');
  const idleClip = gltf.animations.find((candidate) => candidate.name === 'idle');
  const clip = animationStartFrame > 0 && t < animationStartFrame ? idleClip : requestedClip;
  const clipTime = animationStartFrame > 0 && clip === requestedClip ? Math.max(0, t - animationStartFrame) : t;
  const loopClip = ['idle', 'walk', 'sprint', 'holding-right', 'holding-left', 'holding-both'].includes(clip?.name ?? '');
  const actionRef = useRef<ReturnType<AnimationMixer['clipAction']> | null>(null);
  useLayoutEffect(() => {
    mixer.stopAllAction();
    actionRef.current = clip ? mixer.clipAction(clip) : null;
    if (actionRef.current) {
      actionRef.current.reset();
      actionRef.current.setLoop(loopClip ? LoopRepeat : LoopOnce, loopClip ? Infinity : 1);
      actionRef.current.clampWhenFinished = !loopClip;
      actionRef.current.play();
    }
    return () => { mixer.stopAllAction(); };
  }, [mixer, clip, loopClip]);

  const startX = fromX ?? x, endX = toX ?? x;
  const startY = fromY ?? y, endY = toY ?? y;
  const startZ = fromZ ?? z, endZ = toZ ?? z;
  const hasPath = (fromX !== undefined && toX !== undefined) || (fromY !== undefined && toY !== undefined) || (fromZ !== undefined && toZ !== undefined);
  const travel = smootherStep(clamp01(t / Math.max(1, travelFrames ?? len)));
  const actorX = sampleActorBeat(actionBeats, t, 'x', hasPath ? mix(startX, endX, travel) : x);
  const actorY = sampleActorBeat(actionBeats, t, 'y', hasPath ? mix(startY, endY, travel) : y);
  const actorZ = sampleActorBeat(actionBeats, t, 'z', hasPath ? mix(startZ, endZ, travel) : z);
  const actorScale = sampleActorBeat(actionBeats, t, 'scale', scale);
  const stretch = Math.max(0.7, Math.min(9, sampleActorBeat(actionBeats, t, 'legStretch', legStretch)));
  const actorYaw = sampleActorBeat(actionBeats, t, 'yaw', faceTravelDirection && hasPath ? Math.atan2(endX - startX, endZ - startZ) : 0);
  const actorPitch = sampleActorBeat(actionBeats, t, 'bodyPitch', 0);
  const actorLean = sampleActorBeat(actionBeats, t, 'bodyLean', 0);
  const pose = (channel: StoryActorBeatChannel) => sampleActorBeat(actionBeats, t, channel, 0);
  const actionProgress = clamp01(t / Math.max(1, len));
  const actionLift = action === 'jump' ? Math.max(0, Math.sin(smootherStep(actionProgress) * Math.PI)) * 0.9 : 0;
  const actorLift = sampleActorBeat(actionBeats, t, 'lift', actionLift);
  const spinYaw = action === 'spin' ? smootherStep(actionProgress) * Math.PI * 2 : 0;
  // GLB legs are one local unit long and stretch from their hip downwards. The
  // root compensation must use the actor scale too, or scaled characters sink
  // through the floor while their torso fails to rise with their legs.
  const feetOffset = Math.max(0, stretch - 1) * actorScale * Math.max(0, Math.cos(actorPitch));

  useLayoutEffect(() => {
    // Restore the imported bind pose before seeking the clip so random-access
    // frame renders never accumulate last frame's pose offsets.
    for (const [name, base] of bindPose) {
      const object = model.getObjectByName(name);
      if (!object || !base) continue;
      object.rotation.copy(base.rotation);
      object.scale.copy(base.scale);
    }
    mixer.setTime(clipTime / fps);
    const addRotation = (name: string, axis: 'x' | 'y' | 'z', value: number) => {
      const object = model.getObjectByName(name);
      const base = bindPose.get(name);
      if (object && base) object.rotation[axis] = base.rotation[axis] + value;
    };
    const leftLeg = model.getObjectByName('leg-left');
    const rightLeg = model.getObjectByName('leg-right');
    const leftBase = bindPose.get('leg-left');
    const rightBase = bindPose.get('leg-right');
    if (leftLeg && leftBase) {
      leftLeg.scale.y = leftBase.scale.y * stretch;
      leftLeg.rotation.z += pose('leftLeg');
    }
    if (rightLeg && rightBase) {
      rightLeg.scale.y = rightBase.scale.y * stretch;
      rightLeg.rotation.z += pose('rightLeg');
    }
    addRotation('head', 'x', pose('headPitch'));
    addRotation('head', 'y', pose('headYaw'));
    addRotation('arm-left', 'z', pose('leftArm'));
    addRotation('arm-right', 'z', pose('rightArm'));
    const feed = model.getObjectByName('story-phone-feed');
    if (feed) {
      const page = Math.floor(Math.max(0, t) / 18) % 3;
      feed.position.y = -page * 0.075 + Math.sin(t * 0.18) * 0.018;
      feed.rotation.z = Math.sin(t * 0.16) * 0.025;
    }
    const heldPhoneProp = model.getObjectByName('story-held-phone');
    if (heldPhoneProp && phoneStowAt !== undefined) {
      const stow = smootherStep(clamp01((t - phoneStowAt) / 12));
      heldPhoneProp.visible = stow < 0.995;
      heldPhoneProp.scale.setScalar(0.62 * (1 - stow));
      heldPhoneProp.position.y = -0.58 - 0.18 * stow;
    }
    const headRouterProp = model.getObjectByName('story-head-router');
    if (headRouterProp) {
      const anchorY = typeof headRouterProp.userData.anchorY === 'number' ? headRouterProp.userData.anchorY : 0;
      const head = model.getObjectByName('head');
      const localToWorldY = Math.max(0.01, actorScale * Math.abs(head?.scale.y ?? 1));
      const dropAge = headRouterDropStart === undefined ? Number.POSITIVE_INFINITY : t - headRouterDropStart;
      const dropping = dropAge >= 0 && dropAge < headRouterDropFrames;
      const dropProgress = smootherStep(clamp01(dropAge / Math.max(1, headRouterDropFrames)));
      if (dropping) {
        headRouterProp.position.y = anchorY + ((1 - dropProgress) * headRouterDropHeight) / localToWorldY;
        // A short, readable tumble settles onto the head without a final-frame
        // 180-degree snap; the small post-contact wobble carries the impact.
        headRouterProp.rotation.z = (1 - dropProgress) * 0.85;
        headRouterProp.rotation.x = (1 - dropProgress) * 0.12;
      } else {
        const age = headRouterStart === undefined ? 0 : Math.max(0, t - headRouterStart);
        const impactWobble = headRouterStart === undefined ? 0 : Math.max(0, 1 - age / 18);
        const idleWobble = headRouterStart === undefined || t < headRouterStart ? 0 : Math.sin(age * 0.14) * 0.035;
        headRouterProp.rotation.z = Math.sin(age * 0.78) * 0.11 * impactWobble + idleWobble;
        headRouterProp.rotation.x = Math.sin(age * 0.34) * 0.025 * (headRouterStart !== undefined && t >= headRouterStart ? 1 : 0);
        headRouterProp.position.y = anchorY + (headRouterStart !== undefined && t >= headRouterStart ? Math.max(0, Math.sin(age * 0.84)) * 0.09 * Math.exp(-age / 7) : 0);
      }
      const installed = headRouterStart !== undefined && t >= headRouterStart;
      const signal = installed ? 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(Math.max(0, t - headRouterStart) * 0.3)) : 0;
      headRouterProp.traverse((child) => {
        if (!(child instanceof Mesh)) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (!(material instanceof MeshStandardMaterial)) continue;
          if (child.name === 'story-router-tip') {
            material.emissive.set(installed ? '#38c9ff' : '#000000');
            material.emissiveIntensity = signal * 0.85;
          } else if (child.name === 'story-router-light') {
            material.color.set(installed ? '#7de9ff' : '#48515c');
            material.emissive.set(installed ? '#5edbff' : '#111821');
            material.emissiveIntensity = signal * 1.1;
          }
        }
      });
    }
    const heldBallProp = model.getObjectByName('story-held-ball') as Mesh | null;
    if (heldBallProp) {
      heldBallProp.visible = t >= heldBallStartFrame && (heldBallEndFrame === undefined || t < heldBallEndFrame);
      heldBallProp.scale.setScalar(heldBallScale / Math.max(0.01, actorScale));
    }
    model.updateMatrixWorld(true);
  }, [model, mixer, bindPose, t, stretch, actorScale, actionBeats, clipTime, fps, phoneStowAt, heldBallScale, heldBallStartFrame, heldBallEndFrame, headRouterStart, headRouterDropStart, headRouterDropFrames, headRouterDropHeight]);

  return <group>
    {actorY < 0.6 ? <mesh position={[actorX, 0.02, actorZ]} rotation={[-Math.PI / 2, 0, 0]} scale={[actorScale * 0.74, actorScale * 0.42, 1]}>
      <circleGeometry args={[1, 32]} /><meshBasicMaterial color="#101722" transparent opacity={0.2} depthWrite={false} />
    </mesh> : null}
    <group position={[actorX, actorY + actorLift + feetOffset, actorZ]} scale={actorScale} rotation={[actorPitch, actorYaw + spinYaw, actorLean]}>
      <primitive object={model} />
      {archetype && WORLD_CAST[archetype].variant === variant ? <CastFace model={model} actor={archetype} frame={t} cues={faceCues} /> : null}
    </group>
  </group>;
};

/** A modular block-built game-world actor. Pose and travel are deterministic from the shot clock. */
export const StoryActor: React.FC<StoryActorProps> = (props) => {
  const { rig = 'procedural', x, y = 0, z = 0, scale = 1, legStretch = 1, t, len, action = 'idle', actionBeats, shirt = '#ef735e', pants = '#344d7c', skin = '#f5c995', hair = '#493329', fromX, toX, fromY, toY, fromZ, toZ, travelFrames, faceTravelDirection = false, accessory } = props;
  if (rig === 'kenney') return <KenneyActor {...props} />;
  const progress = clamp01(t / Math.max(1, len));
  const rawTravel = clamp01(t / Math.max(1, travelFrames ?? len));
  const travelProgress = smootherStep(rawTravel);
  const startX = fromX ?? x;
  const startY = fromY ?? y;
  const startZ = fromZ ?? z;
  const endX = toX ?? x;
  const endY = toY ?? y;
  const endZ = toZ ?? z;
  const hasPath = (fromX !== undefined && toX !== undefined) || (fromY !== undefined && toY !== undefined) || (fromZ !== undefined && toZ !== undefined);
  const pathLength = Math.hypot(endX - startX, endY - startY, endZ - startZ);
  const moveX = hasPath ? mix(startX, endX, travelProgress) : x;
  const moveY = hasPath ? mix(startY, endY, travelProgress) : y;
  const moveZ = hasPath ? mix(startZ, endZ, travelProgress) : z;
  const moving = action === 'run' || action === 'walk';
  const travelSpeed = hasPath ? smootherSpeed(rawTravel) : 1;
  // One complete cycle is a left/right step pair. Phase is based on distance covered,
  // so feet stop when the actor reaches the authored mark instead of jogging in place.
  const strideLength = action === 'run' ? 3.1 : 4.6;
  const cycleCount = Math.max(0.72, pathLength / strideLength);
  const cyclePhase = hasPath ? travelProgress * cycleCount * Math.PI * 2 : t * (action === 'run' ? 0.52 : 0.34);
  const gaitStrength = moving ? travelSpeed : 0;
  const cycle = Math.sin(cyclePhase);
  const legSwing = cycle * (action === 'run' ? 0.72 : 0.32) * gaitStrength;
  const leftKnee = moving ? Math.max(0, Math.sin(cyclePhase + 0.55)) * (action === 'run' ? 0.48 : 0.22) * gaitStrength : 0;
  const rightKnee = moving ? Math.max(0, Math.sin(cyclePhase + Math.PI + 0.55)) * (action === 'run' ? 0.48 : 0.22) * gaitStrength : 0;
  const strideBounce = moving ? Math.abs(Math.sin(cyclePhase * 2)) * (action === 'run' ? 0.085 : 0.035) * gaitStrength : 0;
  const armsUp = action === 'cheer' || action === 'shock';
  const actionProgress = hasPath ? travelProgress : smootherStep(progress);
  const hop = action === 'jump' ? Math.max(0, Math.sin(actionProgress * Math.PI)) * 1.15 : action === 'cheer' ? Math.max(0, Math.sin(t * 0.72)) * 0.22 : 0;
  const diveLean = action === 'dive' ? Math.sin(actionProgress * Math.PI) * 0.7 : 0;
  const lean = action === 'recoil' ? -0.16 : action === 'run' ? 0.1 * gaitStrength : action === 'walk' ? 0.035 * gaitStrength : action === 'dive' ? 0.16 : action === 'hug-left' ? -0.1 : action === 'hug-right' ? 0.1 : 0;
  const rightArm = armsUp ? -2.45 : action === 'point' ? -1.1 : action === 'slap' ? mix(-1.85, 0.72, smootherStep(clamp01((t - 3) / 7))) : action === 'dive' ? -0.95 - diveLean : action === 'grab' ? 1.05 : action === 'hug-left' ? 1.38 : action === 'hug-right' ? -0.12 : moving ? -cycle * 0.62 * gaitStrength : action === 'recoil' ? -0.55 : 0.08;
  const leftArm = armsUp ? 2.45 : action === 'dive' ? 0.65 + diveLean : action === 'grab' ? 0.18 : action === 'hug-left' ? 0.12 : action === 'hug-right' ? -1.38 : moving ? cycle * 0.62 * gaitStrength : action === 'recoil' ? 0.48 : 0.04;
  const leftElbow = moving ? Math.max(0, Math.sin(cyclePhase + Math.PI)) * 0.28 * gaitStrength : action === 'grab' ? -0.2 : action === 'dive' ? -0.16 : 0;
  const rightElbow = moving ? Math.max(0, Math.sin(cyclePhase)) * 0.28 * gaitStrength : action === 'grab' ? -0.55 : action === 'dive' ? -0.2 : action === 'slap' ? -0.25 : 0;
  const spinYaw = action === 'spin' ? smootherStep(progress) * Math.PI * 4 : 0;
  const pathYaw = faceTravelDirection && hasPath ? Math.atan2(endX - startX, endZ - startZ) : 0;
  const eyeScale = action === 'shock' ? 1.2 : action === 'cheer' ? 0.9 : 1;
  const mouthHeight = action === 'shock' ? 0.14 : action === 'cheer' ? 0.085 : 0.045;
  const actorX = sampleActorBeat(actionBeats, t, 'x', moveX);
  const actorY = sampleActorBeat(actionBeats, t, 'y', moveY);
  const actorZ = sampleActorBeat(actionBeats, t, 'z', moveZ);
  const actorYaw = sampleActorBeat(actionBeats, t, 'yaw', pathYaw + spinYaw);
  const actorPitch = sampleActorBeat(actionBeats, t, 'bodyPitch', action === 'dive' ? -diveLean : 0);
  const actorLean = sampleActorBeat(actionBeats, t, 'bodyLean', lean);
  const actorLift = sampleActorBeat(actionBeats, t, 'lift', 0);
  const actorLeftArm = sampleActorBeat(actionBeats, t, 'leftArm', leftArm);
  const actorRightArm = sampleActorBeat(actionBeats, t, 'rightArm', rightArm);
  const actorLeftElbow = sampleActorBeat(actionBeats, t, 'leftElbow', leftElbow);
  const actorRightElbow = sampleActorBeat(actionBeats, t, 'rightElbow', rightElbow);
  const actorLeftLeg = sampleActorBeat(actionBeats, t, 'leftLeg', legSwing);
  const actorRightLeg = sampleActorBeat(actionBeats, t, 'rightLeg', -legSwing);
  const actorLeftKnee = sampleActorBeat(actionBeats, t, 'leftKnee', leftKnee);
  const actorRightKnee = sampleActorBeat(actionBeats, t, 'rightKnee', rightKnee);
  const actorHeadYaw = sampleActorBeat(actionBeats, t, 'headYaw', 0);
  const actorHeadPitch = sampleActorBeat(actionBeats, t, 'headPitch', 0);
  const actorScale = sampleActorBeat(actionBeats, t, 'scale', scale);
  const actorLegStretch = Math.max(0.7, Math.min(9, sampleActorBeat(actionBeats, t, 'legStretch', legStretch)));
  // Stretch the legs without lifting the feet. For a horizontal pose, suppress
  // this compensation so the legs extend along the floor toward the window.
  const uprightFactor = Math.max(0, Math.cos(actorPitch));
  const legLift = (actorLegStretch - 1) * 0.92 * uprightFactor;
  const footPlantOffset = uprightFactor * ((actorScale - 1) * 0.3 + actorScale * (actorLegStretch - 1) * 0.02);
  return (
    <group>
    {uprightFactor > 0.7 && actorY < 0.6 ? <mesh position={[actorX, 0.018, actorZ]} rotation={[-Math.PI / 2, 0, 0]} scale={[actorScale * 0.74, actorScale * 0.42, 1]}>
      <circleGeometry args={[1, 32]} /><meshBasicMaterial color="#101722" transparent opacity={0.22} depthWrite={false} />
    </mesh> : null}
    <group position={[actorX, actorY + 0.2 + strideBounce + hop + actorLift + footPlantOffset, actorZ]} scale={actorScale} rotation={[actorPitch, actorYaw, actorLean]}>
      <mesh position={[0, 0.66 + legLift, 0]} castShadow><boxGeometry args={[0.66, 0.28, 0.46]} /><meshStandardMaterial color={pants} /></mesh>
      <group position={[-0.2, 0.64 + legLift, 0]} rotation={[0, 0, actorLeftLeg]} scale={[1, actorLegStretch, 1]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.25, 0.44, 0.32]} /><meshStandardMaterial color={pants} /></mesh>
        <group position={[0, -0.42, 0]} rotation={[0, 0, actorLeftKnee]}>
          <mesh position={[0, -0.21, 0]} castShadow><boxGeometry args={[0.24, 0.42, 0.3]} /><meshStandardMaterial color={pants} /></mesh>
          <mesh position={[0, -0.43, 0.13]} castShadow><boxGeometry args={[0.34, 0.18, 0.48]} /><meshStandardMaterial color="#292d38" /></mesh>
        </group>
      </group>
      <group position={[0.2, 0.64 + legLift, 0]} rotation={[0, 0, actorRightLeg]} scale={[1, actorLegStretch, 1]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.25, 0.44, 0.32]} /><meshStandardMaterial color={pants} /></mesh>
        <group position={[0, -0.42, 0]} rotation={[0, 0, actorRightKnee]}>
          <mesh position={[0, -0.21, 0]} castShadow><boxGeometry args={[0.24, 0.42, 0.3]} /><meshStandardMaterial color={pants} /></mesh>
          <mesh position={[0, -0.43, 0.13]} castShadow><boxGeometry args={[0.34, 0.18, 0.48]} /><meshStandardMaterial color="#292d38" /></mesh>
        </group>
      </group>
      <mesh position={[0, 1.24 + legLift, 0]} castShadow><boxGeometry args={[0.9, 0.94, 0.48]} /><meshStandardMaterial color={shirt} roughness={0.72} /></mesh>
      <mesh position={[0, 0.98 + legLift, 0.255]}><boxGeometry args={[0.42, 0.22, 0.035]} /><meshStandardMaterial color={shirt} roughness={0.6} /></mesh>
      <mesh position={[0, 1.1 + legLift, 0.258]} castShadow><boxGeometry args={[0.48, 0.23, 0.05]} /><meshStandardMaterial color={shirt} roughness={0.7} /></mesh>
      <group position={[-0.53, 1.53 + legLift, action === 'grab' ? 0.38 : 0]} rotation={[0, 0, actorLeftArm]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.28, 0.44, 0.34]} /><meshStandardMaterial color={shirt} /></mesh>
        <group position={[0, -0.44, 0]} rotation={[0, 0, actorLeftElbow]}>
          <mesh position={[0, -0.18, 0]} castShadow><boxGeometry args={[0.26, 0.36, 0.31]} /><meshStandardMaterial color={shirt} /></mesh>
          <mesh position={[0, -0.39, 0.02]} castShadow><boxGeometry args={[0.29, 0.24, 0.3]} /><meshStandardMaterial color={skin} /></mesh>
        </group>
      </group>
      <group position={[0.53, 1.53 + legLift, action === 'grab' ? 0.38 : 0]} rotation={[0, 0, actorRightArm]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.28, 0.44, 0.34]} /><meshStandardMaterial color={shirt} /></mesh>
        <group position={[0, -0.44, 0]} rotation={[0, 0, actorRightElbow]}>
          <mesh position={[0, -0.18, 0]} castShadow><boxGeometry args={[0.26, 0.36, 0.31]} /><meshStandardMaterial color={shirt} /></mesh>
          <mesh position={[0, -0.39, 0.02]} castShadow><boxGeometry args={[0.29, 0.24, 0.3]} /><meshStandardMaterial color={skin} /></mesh>
        </group>
      </group>
      <group position={[0, 2.13 + legLift, 0]} rotation={[actorHeadPitch, actorHeadYaw, 0]}>
      <mesh position={[0, 0, 0]} castShadow><boxGeometry args={[0.74, 0.72, 0.66]} /><meshStandardMaterial color={skin} roughness={0.82} /></mesh>
      <group>
        <mesh position={[0, 0.36, -0.015]}><boxGeometry args={[0.78, 0.24, 0.72]} /><meshStandardMaterial color={hair} roughness={0.84} /></mesh>
        {[-0.28, -0.09, 0.1, 0.29].map((cx, i) => <mesh key={`curl-${i}`} position={[cx, 0.44 + (i % 2) * 0.055, 0.12]} castShadow><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color={hair} roughness={0.9} /></mesh>)}
      </group>
      {[-0.17, 0.17].map((eyeX, eyeIndex) => <group key={`eye-${eyeIndex}`} position={[eyeX, 0.05, 0.352]} scale={[1, eyeScale, 1]}>
        <mesh><sphereGeometry args={[0.092, 12, 10]} /><meshBasicMaterial color="#fffaf0" /></mesh>
        <mesh position={[0, -0.005, 0.072]}><sphereGeometry args={[0.044, 10, 8]} /><meshBasicMaterial color="#18212b" /></mesh>
        <mesh position={[0, 0.13, -0.004]} rotation={[0, 0, eyeIndex ? -0.14 : 0.14]}><boxGeometry args={[0.18, 0.045, 0.045]} /><meshStandardMaterial color={hair} /></mesh>
      </group>)}
      <mesh position={[0, -0.15, 0.35]}><boxGeometry args={[action === 'shock' ? 0.15 : 0.2, mouthHeight, 0.035]} /><meshBasicMaterial color="#7d3d41" /></mesh>
      {accessory === 'cap' ? <mesh position={[0, 0.47, 0.03]}><boxGeometry args={[0.82, 0.18, 0.76]} /><meshStandardMaterial color={shirt} /></mesh> : null}
      {accessory === 'bow' ? <group position={[0, 0.44, 0.08]}><mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.35]}><boxGeometry args={[0.28, 0.18, 0.1]} /><meshStandardMaterial color={shirt} /></mesh><mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.28, 0.18, 0.1]} /><meshStandardMaterial color={shirt} /></mesh></group> : null}
      {accessory === 'scarf' ? <mesh position={[0, -0.4, 0.25]} rotation={[0.12, 0, -0.2]}><boxGeometry args={[0.84, 0.16, 0.12]} /><meshStandardMaterial color={hair} /></mesh> : null}
      {accessory === 'glasses' ? <group position={[0, 0.04, 0.38]}><mesh position={[-0.17, 0, 0]}><boxGeometry args={[0.19, 0.16, 0.04]} /><meshStandardMaterial color="#10243c" metalness={0.6} /></mesh><mesh position={[0.17, 0, 0]}><boxGeometry args={[0.19, 0.16, 0.04]} /><meshStandardMaterial color="#10243c" metalness={0.6} /></mesh></group> : null}
      </group>
    </group>
    </group>
  );
};

export type WorldCreatureKind = 'cat' | 'dog' | 'bug' | 'monster' | 'bird';
export const WorldCreature: React.FC<{ kind: WorldCreatureKind; x: number; y?: number; z?: number; scale?: number; t: number; len?: number; fromX?: number; toX?: number; fromY?: number; toY?: number; fromZ?: number; toZ?: number; travelFrames?: number; travelStartFrame?: number; faceTravelDirection?: boolean; action?: 'idle' | 'look' | 'walk' | 'run' | 'hop' | 'roar'; color?: string; eyeColor?: string }> = ({ kind, x, y = 0, z = 0, scale = 1, t, len = 30, fromX, toX, fromY, toY, fromZ, toZ, travelFrames, travelStartFrame = 0, faceTravelDirection = false, action = 'idle', color, eyeColor = '#ffe36e' }) => {
  const move = action === 'run' || action === 'walk';
  const progress = clamp01(t / Math.max(1, len));
  const rawTravel = clamp01((t - travelStartFrame) / Math.max(1, travelFrames ?? len));
  const travelProgress = smootherStep(rawTravel);
  const startX = fromX ?? x;
  const startY = fromY ?? y;
  const startZ = fromZ ?? z;
  const endX = toX ?? x;
  const endY = toY ?? y;
  const endZ = toZ ?? z;
  const hasPath = (fromX !== undefined && toX !== undefined) || (fromY !== undefined && toY !== undefined) || (fromZ !== undefined && toZ !== undefined);
  const pathLength = Math.hypot(endX - startX, endY - startY, endZ - startZ);
  const motionX = hasPath ? mix(startX, endX, travelProgress) : x;
  const motionY = hasPath ? mix(startY, endY, travelProgress) : y;
  const motionZ = hasPath ? mix(startZ, endZ, travelProgress) : z;
  // Animals are modeled nose-first along local +X; humans face local +Z.
  const pathYaw = faceTravelDirection && hasPath
    ? Math.atan2(endX - startX, endZ - startZ) - (kind === 'cat' || kind === 'dog' ? Math.PI / 2 : 0)
    : 0;
  const speed = hasPath ? smootherSpeed(rawTravel) : 1;
  const strideLength = action === 'run' ? 2.6 : 3.8;
  const gaitPhase = hasPath ? travelProgress * Math.max(0.72, pathLength / strideLength) * Math.PI * 2 : t * 0.42;
  const bob = action === 'hop' ? Math.max(0, Math.sin(smootherStep(progress) * Math.PI)) * 0.7 : move ? Math.abs(Math.sin(gaitPhase * 2)) * 0.12 * speed : Math.sin(t * 0.12) * 0.025;
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
  const stride = move ? Math.sin(gaitPhase) * (action === 'run' ? 0.72 : 0.35) * speed : 0;
  return <group position={[motionX, motionY + bob, motionZ]} scale={scale} rotation={[0, pathYaw, 0]}>
    <mesh position={[-0.05, 0.62, 0]} castShadow><boxGeometry args={[0.95, 0.5, 0.48]} /><meshStandardMaterial color={fur} roughness={0.72} /></mesh>
    <mesh position={[0.44, 0.9, 0.02]} castShadow><boxGeometry args={[0.58, 0.58, 0.5]} /><meshStandardMaterial color={fur} /></mesh>
    {isCat ? [-1, 1].map((side) => <mesh key={`ear-${side}`} position={[0.44 + side * 0.18, 1.28, 0.01]} rotation={[0, 0, side * -0.12]}><coneGeometry args={[0.19, 0.42, 4]} /><meshStandardMaterial color={fur} /></mesh>) : <mesh position={[0.72, 0.97, 0.13]}><boxGeometry args={[0.34, 0.22, 0.3]} /><meshStandardMaterial color="#eee8dd" /></mesh>}
    {[-0.02, 0.25].map((px) => <mesh key={px} position={[0.44 + px - 0.12, 0.98, 0.28]}><sphereGeometry args={[0.045, 8, 6]} /><meshBasicMaterial color="#17212a" /></mesh>)}
    {[-0.34, 0.34].map((px, index) => <group key={`leg-${px}`} position={[px, 0.48, 0.16]} rotation={[0, 0, px < 0 ? stride : -stride]}>
      <mesh position={[0, -0.15, 0]}><boxGeometry args={[0.17, 0.3, 0.18]} /><meshStandardMaterial color={fur} /></mesh>
      <group position={[0, -0.3, 0]} rotation={[0, 0, Math.max(0, Math.sin(gaitPhase + (index ? 0 : Math.PI) + 0.4)) * 0.28 * speed]}>
        <mesh position={[0, -0.13, 0]}><boxGeometry args={[0.17, 0.26, 0.18]} /><meshStandardMaterial color={fur} /></mesh>
      </group>
    </group>)}
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
  if (cue.kind === 'impact-star') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.07, height: height * 0.07, transform: `translate(-50%,-50%) rotate(${age * 5}deg) scale(${1 - p * 0.35})`, background: `radial-gradient(circle, #fff 0 7%, ${color} 8% 17%, transparent 19%), repeating-conic-gradient(from ${age * 5}deg, transparent 0 17deg, ${color} 18deg 22deg, transparent 23deg 45deg)`, filter: 'drop-shadow(0 0 12px #fff)', opacity: (1 - p) * (1 - p), pointerEvents: 'none' }} />;
  if (cue.kind === 'portal') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.42, height: height * 0.42, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale}) rotate(${age * 7}deg)`, border: `12px solid ${color}`, boxShadow: `0 0 28px ${color}, inset 0 0 32px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
  if (cue.kind === 'pin-pulse') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.06, height: height * 0.06, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale})`, border: `6px solid ${color}`, boxShadow: `0 0 14px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
  if (cue.kind === 'spark') return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.24, height: height * 0.24, transform: `translate(-50%,-50%) rotate(${age * 2.2}deg) scale(${scale})`, background: `radial-gradient(circle, #fff 0 4%, ${color} 5% 11%, transparent 13%), repeating-conic-gradient(from 0deg, transparent 0 11deg, ${color} 12deg 14deg, transparent 15deg 28deg)`, filter: 'drop-shadow(0 0 18px #fff)', opacity: 1 - p, pointerEvents: 'none' }} />;
  return <div style={{ position: 'absolute', left: x, top: y, width: height * 0.18, height: height * 0.18, borderRadius: '50%', transform: `translate(-50%,-50%) scale(${scale})`, border: `10px solid ${color}`, boxShadow: `0 0 18px ${color}`, opacity: 1 - p, pointerEvents: 'none' }} />;
};

export const ImpactRing: React.FC<{ x: number; y: number; z?: number; t: number; color?: string; duration?: number; size?: number }> = ({ x, y, z = 0.45, t, color = '#ffe36e', duration = 18, size = 2.05 }) => {
  const p = clamp01(t / Math.max(1, duration));
  return p >= 1 ? null : <mesh position={[x, y, z]} rotation={[0, 0, 0]} scale={0.35 + p * (size - 0.35)}>
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
  const interiorShadows = ['classroom-side','cottage-interior','cottage-exterior','teen-bedroom','suburb-lane'].includes(set);
  return <div style={{ position: 'absolute', inset: 0, backgroundColor: shotSky }}>
    <WorldFpsContext.Provider value={timeline.fps}>
    <ThreeCanvas shadows={interiorShadows} width={width} height={height} camera={{ position, fov, near: 0.1, far: 120 }} style={{ position: 'absolute', inset: 0 }}>
      <CameraRig position={position} target={target} fov={fov} />
      {['town','city-skyline','city-scale-reveal','basketball-court','suburb-lane','cottage-exterior'].includes(set) && <WorldSky position={position} night={lighting==='night'}/>}
      <WorldStage set={set} sky={shotSky} t={clock} events={timeline.shotEvents?.[segment?.shot ?? '']} />
      <ambientLight intensity={ambientIntensity} color={lightColor} />
      <hemisphereLight args={['#eff8ff', '#5d5b69', 1.05]} />
      <directionalLight castShadow={interiorShadows} shadow-mapSize={[1024,1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-normalBias={0.025} position={[-5, 11, 8]} intensity={lighting === 'night' ? 1.0 : 2.2} color={lightColor} />
      <pointLight position={[5, 5, 6]} intensity={lighting === 'neon' ? 1.8 : lighting === 'storm' ? 0.3 : 0.7} color={lighting === 'neon' ? '#5ce9ff' : '#ffcb78'} distance={22} />
      {Shot ? <Shot t={clock} len={duration} f={frame} events={timeline.shotEvents?.[segment?.shot ?? '']} /> : null}
    </ThreeCanvas>
    </WorldFpsContext.Provider>
  </div>;
};

const StoryWorldFrame: React.FC<{ timeline: WorldTimeline; shots: WorldShotMap; frame: number; sky: string; boardIndex?: number }> = ({ timeline, shots, frame, sky, boardIndex }) => {
  const { width, height } = useVideoConfig();
  const seg = segmentAt(timeline, frame);
  const meta = timeline.shots.find((shot) => shot.id === seg?.shot) ?? timeline.shots[0];
  const seconds = frame / timeline.fps;
  const cueFrame = boardIndex === undefined ? frame : (meta?.first ?? 0) + (meta?.key ?? 0);
  const choiceCues = [...(timeline.choiceCue ? [timeline.choiceCue] : []), ...(timeline.choiceCues ?? [])].filter((cue) => seconds >= cue.startSeconds && seconds < cue.endSeconds);
  const wordMode = timeline.captionMode === 'word';
  const words = timeline.words ?? [];
  const activeWordIndex = words.findIndex((word) => seconds >= word.s && seconds < word.e);
  const timedWord = words[activeWordIndex];
  const captionWords = spokenPhrase(words, activeWordIndex, wordMode || seg?.shot === 'S11B' ? 1 : 4);
  // Keep every syllable legible from its first frame, even if a short article
  // finishes before the pop animation. Only the active word changes scale.
  const popProgress = timedWord ? clamp01((seconds - timedWord.s) / 0.10) : 1;
  const wordScale = 1 + 0.075 * Math.sin(popProgress * Math.PI);
  const captionZone = timeline.captionZones?.[seg?.shot ?? ''] ?? 'bottom';
  const topRightCaption = captionZone === 'top-right';
  const topCenterCaption = captionZone === 'top-center';
  const topCaption = topRightCaption || topCenterCaption;
  const captionBottomPadding = wordMode ? height * 0.23 : 320;
  const countdown = timeline.countdownSeconds === undefined ? null : Math.max(0, Math.ceil(timeline.countdownSeconds - seconds));
  const isHook = Boolean(timeline.hook) && seconds < (timeline.hookDurationSeconds ?? 1.5);
  const isCta = Boolean(timeline.cta) && (timeline.total / timeline.fps - seconds) <= (timeline.ctaDurationSeconds ?? 3.5);
  const campaignFallback = !timeline.words?.length && (isHook || isCta);
  const transition = boardIndex === undefined ? seg?.transition : undefined;
  const transitionAge = transition ? frame - (seg?.a ?? frame) : 99;
  const transitionFrames = Math.max(1, transition?.frames ?? 8);
  const transitionProgress = transition ? smootherStep(transitionAge / transitionFrames) : 1;
  const transitionAlpha = transition ? 1 - transitionProgress : 0;
  const segmentIndex = timeline.segments.findIndex((item) => item === seg);
  const previousSegment = segmentIndex > 0 ? timeline.segments[segmentIndex - 1] : undefined;
  // Never overlap two rendered WebGL scenes: that produced ghosted actors and
  // exposed canvas strips. The next shot is an opaque hard cut; a short 2D overlay
  // can accent the cut without blending unrelated geometry.
  const transitionOverlayActive = Boolean(transition && previousSegment && transitionAge >= 0 && transitionAge < transitionFrames);
  const transitioning = false;
  const whipActive = Boolean(transitionOverlayActive && transition?.kind === 'whip');
  const pushActive = Boolean(transitionOverlayActive && transition?.kind === 'push');
  const flashActive = Boolean(transitionOverlayActive && transition?.kind === 'flash');
  const previousFrame = previousSegment ? Math.max(previousSegment.a, previousSegment.b - transitionFrames + transitionAge) : 0;
  const direction = transition?.direction ?? 'left';
  const travel: [number, number] = direction === 'left' ? [-1, 0] : direction === 'right' ? [1, 0] : direction === 'up' ? [0, -1] : direction === 'down' ? [0, 1] : [-1, 0];
  const incomingOffset = transitioning && (transition?.kind === 'push' || transition?.kind === 'whip') ? `${-travel[0] * (1 - transitionProgress) * width}px, ${-travel[1] * (1 - transitionProgress) * height}px` : '0px, 0px';
  const outgoingOffset = transitioning && (transition?.kind === 'push' || transition?.kind === 'whip') ? `${travel[0] * transitionProgress * width}px, ${travel[1] * transitionProgress * height}px` : '0px, 0px';
  const sceneOffset = whipActive ? `${-travel[0] * (1 - transitionProgress) * width * 0.06}px, ${-travel[1] * (1 - transitionProgress) * height * 0.06}px` : incomingOffset;
  const sceneScale = whipActive ? 1.06 - transitionProgress * 0.06 : pushActive ? 1.05 - transitionProgress * 0.05 : 1;
  const sceneBlur = whipActive ? (1 - transitionProgress) * 4 : pushActive ? (1 - transitionProgress) * 1.5 : 0;
  const streakTravel = direction === 'left' ? (1 - 2 * transitionProgress) * width
    : direction === 'right' ? -(1 - 2 * transitionProgress) * width
      : direction === 'up' ? (1 - 2 * transitionProgress) * height
        : -(1 - 2 * transitionProgress) * height;
  return (
      <AbsoluteFill style={{ backgroundColor: '#101827', overflow: 'hidden', fontFamily: '"Trebuchet MS", Arial, Helvetica, sans-serif' }}>
      {transitioning && previousSegment ? <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: transition?.kind === 'flash' ? 1 - transitionProgress : 1, transform: `translate(${outgoingOffset})`, zIndex: 0 }}>
        <WorldSceneLayer timeline={timeline} shots={shots} frame={previousFrame} sky={sky} />
      </div> : null}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1,
        transform: `translate(${sceneOffset}) scale(${sceneScale}) ${transition?.kind === 'map-fold' && transitioning ? `perspective(1000px) rotateY(${(1 - transitionProgress) * -68}deg)` : ''} ${transition?.kind === 'portal' && transitioning ? `scale(${1.08 - transitionProgress * 0.08})` : ''}`,
        filter: sceneBlur > 0 ? `blur(${sceneBlur}px) saturate(${1 + sceneBlur * 0.015})` : undefined,
        clipPath: transition?.kind === 'portal' && transitioning ? `circle(${Math.max(3, transitionProgress * 150)}% at 50% 50%)` : undefined }}>
        <WorldSceneLayer timeline={timeline} shots={shots} frame={frame} sky={sky} boardIndex={boardIndex} />
      </div>
      <AbsoluteFill style={{ zIndex: 3, pointerEvents: 'none', alignItems: topRightCaption ? 'flex-end' : 'center', justifyContent: topCaption ? 'flex-start' : 'flex-end', padding: topRightCaption ? '190px 54px 0' : topCenterCaption ? '24px 28px 0' : `0 54px ${captionBottomPadding}px` }}>
        {captionWords.length ? <div style={{ display: 'flex', justifyContent: topRightCaption ? 'flex-end' : 'center', flexWrap: 'wrap', gap: '0.1em 0.22em', maxWidth: topRightCaption ? 600 : topCenterCaption ? 484 : 1000, padding: topCaption ? '8px 14px' : 0, fontFamily: 'Arial Rounded MT Bold, Arial Black, Helvetica, sans-serif', fontSize: topRightCaption ? 52 : topCenterCaption ? 38 : wordMode ? 90 : 64, lineHeight: 1.03, fontWeight: 950, textAlign: topRightCaption ? 'right' : 'center', background: topCaption ? 'linear-gradient(135deg, #142641f2, #233f5ef0)' : undefined, border: topCaption ? '2px solid #bcefff99' : undefined, borderRadius: topCaption ? 14 : undefined, boxShadow: topCaption ? '0 7px 18px #0008' : undefined }}>
          {captionWords.map(({ word, index }) => <span key={`${word.s}-${word.w}`} style={{ display: 'inline-block', color: index === activeWordIndex ? '#ffe536' : '#fffaf0', WebkitTextStroke: wordMode && !topCaption ? '7px #15191d' : '2.5px #15191d', paintOrder: 'stroke fill', textShadow: '0 4px 2px #000, 0 7px 10px #000b', transform: index === activeWordIndex ? `scale(${wordScale})` : 'scale(1)' }}>{word.w}{word.p ?? ''}</span>)}
        </div> : null}
      </AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }}>
        {timeline.fx?.map((cue, index) => <ScreenFx key={`${cue.kind}-${cue.f}-${index}`} cue={cue} frame={cueFrame} fps={timeline.fps} width={width} height={height} />)}
      </div>
      {countdown !== null ? <div style={{ position: 'absolute', zIndex: 4, top: 60, right: 52, minWidth: 122, padding: '9px 13px', borderRadius: 14, border: '3px solid #ffe071', background: '#101827dc', color: '#fff', fontFamily: 'Arial, sans-serif', fontSize: 36, lineHeight: 1, fontWeight: 950, textAlign: 'center', fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 4px #000', pointerEvents: 'none' }}>00:{String(countdown).padStart(2, '0')}</div> : null}
      {choiceCues.map((choice, choiceIndex) => {
        const choiceIn = smootherStep(clamp01((seconds - choice.startSeconds) * timeline.fps / 9));
        return <AbsoluteFill key={`${choice.startSeconds}-${choiceIndex}`} style={{ zIndex: 5, pointerEvents: 'none', justifyContent: 'flex-start', padding: '0 54px', top: `${choice.topPercent ?? 7}%`, opacity: choiceIn, transform: `translateY(${(1 - choiceIn) * 42}px) scale(${0.97 + 0.03 * choiceIn})` }}>
        {choice.title ? <div style={{ color: '#fff', textAlign: 'center', fontSize: 38, fontWeight: 950, textShadow: '0 3px 8px #000', marginBottom: 10, WebkitTextStroke: '1px #121820', paintOrder: 'stroke fill' }}>{choice.title}</div> : null}
        <div style={{ display: 'flex', gap: 24, width: '100%' }}>
          {(['A', 'B'] as const).map((letter) => {
            const active = choice.selected === letter;
            const label = letter === 'A' ? choice.a : choice.b;
            const accent = letter === 'A' ? '#ffbf53' : '#59d8ed';
            return <div key={letter} style={{ flex: 1, minHeight: 138, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: active ? '#142342' : '#101827', border: `${active ? 5 : 3}px solid ${accent}`, borderRadius: 18, boxShadow: active ? `0 0 24px ${accent}aa` : '0 8px 18px #0008', transform: active ? 'scale(1.025)' : 'scale(1)' }}>
              <span style={{ color: accent, fontSize: 44, fontWeight: 1000, lineHeight: 1 }}>{letter}</span>
              <span style={{ color: '#fff', fontSize: 30, fontWeight: 900, textAlign: 'center', marginTop: 9, maxWidth: '92%' }}>{label}</span>
            </div>;
          })}
        </div>
      </AbsoluteFill>;
      })}
      {campaignFallback ? <AbsoluteFill style={{ zIndex: 6, pointerEvents: 'none', alignItems: 'center', justifyContent: isHook ? 'flex-start' : 'flex-end', padding: isHook ? '190px 54px 0' : '0 54px 200px' }}>
        <div style={{ color: '#ffe72f', WebkitTextStroke: '2px #16191e', paintOrder: 'stroke fill', fontSize: 58, lineHeight: 1.06, fontWeight: 950, textAlign: 'center', textShadow: '0 4px 9px #000d', maxWidth: 960 }}>{isHook ? timeline.hook : timeline.cta}</div>
      </AbsoluteFill> : null}
      {flashActive ? <AbsoluteFill style={{ zIndex: 7, pointerEvents: 'none', background: transition?.color ?? '#fff6dd', opacity: Math.sin(transitionProgress * Math.PI) * 0.18 }} /> : null}
      {transitionOverlayActive && transition && transition.kind !== 'flash' ? <AbsoluteFill style={{ zIndex: 7, pointerEvents: 'none', background: transition.kind === 'portal' ? `radial-gradient(circle at 50% 50%, transparent 0 16%, ${transition.color ?? '#36dff1'} 17% 21%, #121629 60%)` : transition.kind === 'map-fold' ? `linear-gradient(135deg,${transition.color ?? '#dfc17d'} 0 48%,#fff3cd 49% 51%,#543e58 52% 100%)` : transition.kind === 'push' ? 'radial-gradient(circle at 50% 50%,transparent 38%,#fff5 100%)' : 'transparent', opacity: transition.kind === 'portal' ? transitionAlpha * 0.55 : transition.kind === 'map-fold' ? transitionAlpha * 0.26 : transition.kind === 'push' ? transitionAlpha * 0.12 : 0, transform: transition.kind === 'portal' ? `scale(${1.1 + transitionProgress * 0.8})` : undefined }} /> : null}
      {whipActive ? <AbsoluteFill style={{ zIndex: 8, pointerEvents: 'none', background: `linear-gradient(${direction === 'up' ? '0deg' : direction === 'down' ? '180deg' : direction === 'right' ? '270deg' : '90deg'}, transparent 44%, #ffffff40 48%, #c4f6ff9c 50%, #ffffff50 52%, transparent 56%)`, transform: direction === 'left' || direction === 'right' ? `translateX(${streakTravel}px)` : `translateY(${streakTravel}px)`, opacity: Math.pow(Math.sin(transitionProgress * Math.PI), 0.7) * 0.58, filter: 'blur(6px)', mixBlendMode: 'screen' }} /> : null}
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
