import React from 'react';
import { PajamaSleeper, SeatedDenimLegs } from '../../engine/stretch-poses';
import { ImpactRing, StoryActor, WorldProp, WorldShotProps } from '../../engine';

const SCROLLER = { archetype: 'explorer' as const, shirt: '#36bd79', pants: '#344b7d', skin: '#e9b58a', hair: '#503a2d', accessory: 'cap' as const };
const CLASSMATE = { archetype: 'teammate' as const, shirt: '#4b91cf', pants: '#3d4f6c', skin: '#efc19e', hair: '#4a3429', accessory: 'glasses' as const };
const BEDROOMER = { shirt: '#ca6a83', pants: '#354c79', skin: '#c78c65', hair: '#382c29', accessory: 'scarf' as const };
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp01(value); return t * t * (3 - 2 * t); };

/** A high city fly-in descends to the sidewalk, revealing the ordinary avatar late. */
export const S1: React.FC<WorldShotProps> = ({ t, len }) => {
  const reveal = smooth((t - 10) / 28);
  return <group>
  <StoryActor x={0.25} z={0.65} t={t} len={len} scale={reveal} action="point" actionBeats={[
    { f: 0, headYaw: -0.2, rightArm: -0.34 },
    { f: 35, headYaw: -0.28, rightArm: -0.52 },
    { f: 72, headYaw: 0.16, rightArm: -0.86 },
    { f: 94, headYaw: 0.02, rightArm: -0.3 },
    { f: len - 1, headYaw: -0.1, rightArm: -0.58 },
  ]} {...SCROLLER} rig="kenney" variant="f" heldPhone />
</group>;
};

/** Phone insert: two explicit finger swipes demonstrate the 10-centimeter rule. */
export const S2: React.FC<WorldShotProps> = ({ t, len }) => {
  const swipeA = t < 12 ? 0 : t < 26 ? 0.82 * smooth((t - 12) / 14) : t < 34 ? 0.82 * (1 - smooth((t - 26) / 8)) : 0;
  const swipeB = t < 40 ? 0 : t < 54 ? 0.82 * smooth((t - 40) / 14) : t < 62 ? 0.82 * (1 - smooth((t - 54) / 8)) : 0;
  const swipe = Math.max(swipeA, swipeB);
  // The feed moves with the thumb across 18 frames; the phone itself stays still.
  const pageIndex = t < 12 ? 0 : t < 40 ? 1 : 2;
  const pageBlend = t < 12 ? 1 : t < 30 ? smooth((t - 12) / 18) : t < 40 ? 1 : t < 58 ? smooth((t - 40) / 18) : 1;
  return <group>
    <group position={[0, 0.1, -0.3]} scale={1.52} rotation={[0.02, 0, 0]}>
      <WorldProp kind="phone" x={0} y={0} z={0} scale={1} color="#f77998" scrollT={t} metric pageIndex={pageIndex} pageBlend={pageBlend} />
      <group position={[0, swipe, 0]} rotation={[0, 0, -0.045]}>
        <mesh position={[0.96, 1.02, 0.18]} rotation={[0, 0, -0.08]} castShadow><boxGeometry args={[0.3, 0.2, 0.19]} /><meshStandardMaterial color="#36bd79" roughness={0.78} /></mesh>
        <mesh position={[0.75, 1.08, 0.29]} rotation={[0, 0, 0.1]} castShadow><boxGeometry args={[0.36, 0.24, 0.18]} /><meshStandardMaterial color="#e9b58a" roughness={0.86} /></mesh>
        <mesh position={[0.57, 1.25, 0.36]} rotation={[0, 0, -0.08]} castShadow><boxGeometry args={[0.14, 0.36, 0.15]} /><meshStandardMaterial color="#e9b58a" roughness={0.82} /></mesh>
        <mesh position={[0.48, 0.99, 0.37]} rotation={[0, 0, 0.46]} castShadow><boxGeometry args={[0.2, 0.14, 0.15]} /><meshStandardMaterial color="#e9b58a" roughness={0.82} /></mesh>
      </group>
    </group>
    <StoryActor x={-2.05} y={0.08} z={1.35} t={t} len={len} scale={0.82} action="point" actionBeats={[
      { f: 0, rightArm: -0.76, headYaw: 0.18 },
      { f: 25, rightArm: -0.94, headYaw: 0.08 },
    ]} {...SCROLLER} rig="kenney" variant="f" />
  </group>;
};

/** The first 10 cm of leg growth lands on the spoken measurement, then keeps going. */
export const S3: React.FC<WorldShotProps> = ({ t, len }) => {
  const p = smooth(t / Math.max(1, len));
  return <group>
    <StoryActor x={0.15} z={0.3} t={t} len={len} legStretch={1 + p * 2.25} action="shock" actionBeats={[
      { f: 0, headPitch: -0.04, rightArm: -0.5, leftArm: 0.25, legStretch: 1 },
      { f: 24, headPitch: -0.04, rightArm: -0.72, leftArm: 0.38, legStretch: 1.08 },
      { f: 54, headPitch: -0.08, rightArm: -0.85, leftArm: 0.62, legStretch: 1.42 },
      { f: 90, headPitch: -0.14, rightArm: -0.42, leftArm: 0.7, legStretch: 2.45 },
      { f: len - 1, headPitch: -0.2, rightArm: -0.28, leftArm: 0.72, legStretch: 3.25 },
    ]} {...SCROLLER} rig="kenney" variant="f" heldPhone />
    {t >= 28 ? <ImpactRing x={0.15} y={0.13} z={0.3} t={t - 28} color="#ff87ae" /> : null}
  </group>;
};

/** The no-limit beat shifts to a low street angle and shows the growing scale. */
export const S4: React.FC<WorldShotProps> = ({ t, len }) => {
  const p = smooth(t / Math.max(1, len));
  return <group>
  <StoryActor x={0.1} z={0.2} t={t} len={len} scale={1.12 + p * 0.18} legStretch={3.1 + p * 0.9} action="shock" actionBeats={[
    { f: 0, legStretch: 3.1, headPitch: -0.16, leftArm: 0.86, rightArm: -0.72 },
    { f: len - 1, legStretch: 4.0, headPitch: -0.12, leftArm: 0.98, rightArm: -0.65 },
  ]} {...SCROLLER} rig="kenney" variant="f" heldPhone />
</group>;
};

/** A brief overhead street insert gives the scale joke a readable town-wide payoff. */
export const S4B: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={0.35} z={-13.5} t={t} len={len} scale={1.3} legStretch={3.8} action="shock" actionBeats={[
    { f: 0, headYaw: -0.12, leftArm: 0.72, rightArm: -0.72, legStretch: 3.8 },
    { f: Math.max(1, len - 1), headYaw: 0.16, leftArm: 0.84, rightArm: -0.84, legStretch: 4.2 },
  ]} {...SCROLLER} rig="kenney" variant="f" heldPhone />
</group>;

/** Secret scrolling in class: the desk, classmates and board establish the set in one shot. */
export const S5: React.FC<WorldShotProps> = ({ t, len }) => {
  const phoneStowAt = 52;
  return <group>
    <StoryActor x={0.45} z={-3.15} t={t} len={len} action="idle" actionBeats={[
      { f: 0, headYaw: 0.18, headPitch: -0.12, leftArm: 0.12, rightArm: -0.22 },
      { f: 10, headYaw: 0.06, headPitch: -0.24, leftArm: 0.34, rightArm: -0.68 },
      { f: 26, headYaw: 0.02, headPitch: -0.22, leftArm: 0.3, rightArm: -0.94 },
      { f: 34, headYaw: 0.38, headPitch: 0.02, leftArm: 0.08, rightArm: -0.76 },
      { f: 40, headYaw: 0.4, headPitch: 0.02, leftArm: 0.08, rightArm: -0.76 },
      { f: 46, headYaw: 0.08, headPitch: 0.12, leftArm: -0.22, rightArm: -0.18 },
      { f: phoneStowAt, headYaw: -0.28, headPitch: 0.16, leftArm: -0.5, rightArm: 0.25 },
      { f: len - 1, headYaw: 0.02, headPitch: 0, leftArm: -0.08, rightArm: 0.08 },
    ]} {...SCROLLER} rig="kenney" variant="f" heldPhone={t < phoneStowAt + 12} phoneStowAt={phoneStowAt} />
    <StoryActor x={-3.35} z={-2.2} t={t} len={len} scale={0.84} action="idle" actionBeats={[
      { f: 0, headYaw: -0.1, rightArm: 0.08, leftArm: 0.04 },
      { f: 28, headYaw: 0.12, rightArm: 0.12, leftArm: 0.02 },
      { f: 35, headYaw: 0.48, headPitch: -0.08, rightArm: -0.28, leftArm: 0.18 },
      { f: 43, headYaw: 0.46, headPitch: -0.08, rightArm: -0.28, leftArm: 0.18 },
      { f: 58, headYaw: 0.08, headPitch: 0.04, rightArm: 0.12, leftArm: 0.02 },
      { f: len - 1, headYaw: 0.22, headPitch: 0 },
    ]} {...CLASSMATE} rig="kenney" />
  </group>;
};

/** A close insert makes the hidden thumb swipe and changing feed unmistakable. */
export const S5B: React.FC<WorldShotProps> = ({ t }) => {
  const swipe = smooth(clamp01((t - 3) / 12));
  const liftOff = smooth(clamp01((t - 14) / 5));
  const pageBlend = t < 6 ? 1 : smooth((t - 6) / 10);
  return <group>
    <mesh position={[0.35, 0.18, -3.1]} castShadow receiveShadow><boxGeometry args={[3.8, 0.3, 1.8]} /><meshStandardMaterial color="#9b704f" roughness={0.88} /></mesh>
    <WorldProp kind="phone" x={0.35} y={0.42} z={-2.3} scale={0.78} color="#f77998" scrollT={t} metric pageIndex={t < 6 ? 0 : 1} pageBlend={pageBlend} />
    <group position={[0.35, 0.42, -2.3]}>
      {/* Keep the wrist outside the right bezel. The small index finger starts
          on the lower-right glass and travels up-left without hiding the feed. */}
      <group position={[0.38 - swipe * 0.04 + liftOff * 1.2, 0.4 + swipe * 0.52 + liftOff * 0.18, 0.18]} rotation={[0, 0, -0.08 + swipe * 0.08 + liftOff * 0.22]} scale={0.42}>
        <mesh position={[0.52, -0.08, -0.14]} rotation={[0, 0, 0.06]} castShadow><boxGeometry args={[0.36, 0.18, 0.15]} /><meshStandardMaterial color="#36bd79" roughness={0.78} /></mesh>
        <mesh position={[0.25, 0.02, -0.12]} rotation={[0, 0, -0.12]} castShadow><boxGeometry args={[0.23, 0.15, 0.12]} /><meshStandardMaterial color="#e9b58a" roughness={0.84} /></mesh>
        <mesh position={[0.18, 0.22, -0.16]} rotation={[0, 0, -0.08]} castShadow><boxGeometry args={[0.11, 0.29, 0.1]} /><meshStandardMaterial color="#e9b58a" roughness={0.84} /></mesh>
        <mesh position={[0.18, 0.39, -0.16]} rotation={[0, 0, -0.08]} castShadow><boxGeometry args={[0.11, 0.11, 0.1]} /><meshStandardMaterial color="#f0c59f" roughness={0.82} /></mesh>
        <mesh position={[0.04, 0.02, -0.15]} rotation={[0, 0, 0.48]} castShadow><boxGeometry args={[0.15, 0.08, 0.1]} /><meshStandardMaterial color="#e9b58a" roughness={0.84} /></mesh>
      </group>
    </group>
  </group>;
};

/** The teacher notices; the student locks, then slides the phone out of sight. */
export const S5C: React.FC<WorldShotProps> = ({ t, len }) => {
  const phoneStowAt = 11;
  return <group>
    <StoryActor x={0.45} z={-3.15} t={t} len={len} scale={0.96} action="shock" actionBeats={[
      { f: 0, headYaw: 0.12, headPitch: -0.14, rightArm: -0.82, leftArm: 0.18 },
      { f: 6, headYaw: 0.08, headPitch: -0.02, rightArm: -0.72, leftArm: 0.14 },
      { f: phoneStowAt, headYaw: -0.28, headPitch: 0.16, rightArm: -0.28, leftArm: -0.45 },
      { f: Math.min(len - 1, phoneStowAt + 10), headYaw: -0.08, headPitch: 0.03, rightArm: -0.08, leftArm: -0.12 },
      { f: len - 1, headYaw: 0.04, headPitch: 0, rightArm: -0.12, leftArm: 0.08 },
    ]} {...SCROLLER} rig="kenney" faceCues={[{ f: 5, expression: 'curious', gaze: 0.8 }, { f: 10, expression: 'startled', gaze: -1 }, { f: 23, expression: 'wary', gaze: -0.7 }]} heldPhone={t < phoneStowAt + 12} phoneStowAt={phoneStowAt} />
    <StoryActor x={-2.25} z={-5.15} t={t} len={len} scale={1.02} action="point" actionBeats={[
      { f: 0, headYaw: 0.1, rightArm: -0.12, leftArm: 0.08 },
      { f: 5, headYaw: 0.46, headPitch: -0.08, rightArm: -0.94, leftArm: 0.14 },
      { f: 16, headYaw: 0.3, headPitch: 0.02, rightArm: -0.68, leftArm: 0.12 },
      { f: len - 1, headYaw: 0.04, rightArm: -0.15, leftArm: 0.08 },
    ]} rig="kenney" archetype="authority" faceCues={[{ f: 0, expression: 'calm' }, { f: 8, expression: 'wary', gaze: 1 }]} />
  </group>;
};

/** Stage the seated profile and its ceiling insert in one coordinate system. */
function CeilingBench({t,len,insert,contactAt}: WorldShotProps & {insert:boolean;contactAt:number}) {
  const growth = smooth(t / Math.max(1,len-1));
  const compression = insert ? Math.sin(Math.PI * clamp01((t-contactAt)/14)) ** 2 : 0;
  const rise = insert ? smooth(t / Math.max(1,contactAt)) : growth;
  const kneeY = insert ? 5.83 + .32*rise - .16*compression : 1.48 + 4.35*rise;
  const kneeX = insert ? .56-.13*compression : -1.02 + 1.58*rise;
  return <group>
    <StoryActor x={-1.78} y={.09} z={0} t={t} len={len} scale={1.02} action="idle" hideLegs heldPhone
      rig="kenney" variant="f" {...SCROLLER} actionBeats={[
        {f:0,yaw:1.08,headPitch:.09,leftArm:.1,rightArm:-.72},
        {f:len-1,yaw:1.08,headPitch:insert ? -.22 : -.09,headYaw:-.18,leftArm:.22,rightArm:-.55}
      ]}/>
    <SeatedDenimLegs hipX={-1.58} hipY={1.14} kneeX={kneeX} kneeY={kneeY} ankleX={insert ? 2.6 : -.48+3.08*rise}/>
    <StoryActor x={-3.7} z={-3.85} t={t} len={len} scale={.79} rig="kenney" action="idle" {...CLASSMATE}
      actionBeats={[{f:0,yaw:.62,headPitch:0},{f:len-1,yaw:.62,headPitch:-.24,headYaw:.25}]}/>
    {insert && t>=contactAt && t<contactAt+12 && [0,1,2,3].map(i=>{
      const age=(t-contactAt)/12;
      return <mesh key={i} position={[.56+(i-1.5)*age*.48,6.31-age*age*(.37+i*.12),.25+(i%2)*age*.19]} scale={.058*(1-age)}>
        <dodecahedronGeometry/><meshStandardMaterial color="#ece9d4"/>
      </mesh>;
    })}
  </group>;
}
export const S6: React.FC<WorldShotProps> = props => <CeilingBench {...props} insert={false} contactAt={props.len}/>;
export const S6B: React.FC<WorldShotProps> = props => <CeilingBench {...props} insert contactAt={props.events?.ceiling_contact ?? Math.round(props.len*.62)}/>;

export const S7: React.FC<WorldShotProps> = ({t,len}) =>
  <PajamaSleeper length={1.12+2.37*smooth((t-7)/Math.max(1,len-8))} kick={0} swipe={smooth(t/16)}/>;

export const S8: React.FC<WorldShotProps> = ({t,len,events={}}) => {
  const exit = events.window_exit ?? len*.24;
  const u = t / Math.max(1,len-1);
  const travel = .24*smooth((u-.12)/.18) + .34*smooth((u-.32)/.19) + .42*smooth((u-.67)/.16);
  const kick = .045*Math.sin(Math.PI*clamp01((t-exit-6)/24))**2;
  return <PajamaSleeper length={3.49+9.8*travel} kick={kick} swipe={1}/>;
};

/** Court establish: keep the hoop and both players in one clean wide composition. */
export const S9: React.FC<WorldShotProps> = ({ t, len }) => {
  const cock = smooth(t / 15);
  const pass = smooth(clamp01((t - 15) / 34));
  const returnAt = 62;
  const greenCatchAt = 83;
  const returnPass = smooth(clamp01((t - returnAt) / (greenCatchAt - returnAt)));
  const senderX = -3.2 + cock * 0.45;
  const senderY = 1.2 + cock * 0.3;
  const receiverGrip = { x: 1.214, y: 1.326, z: 0.749 };
  const receiverRelease = { x: 1.171, y: 1.279, z: 0.562 };
  const greenGrip = { x: -0.485, y: 0.851, z: 0.65 };
  const ballX = t < 15 ? senderX : t < 49 ? senderX + (receiverGrip.x - senderX) * pass : t < returnAt ? receiverGrip.x : receiverRelease.x + (greenGrip.x - receiverRelease.x) * returnPass;
  const ballY = t < 15 ? senderY : t < 49 ? senderY + (receiverGrip.y - senderY) * pass + Math.sin(Math.PI * pass) * 1.25 : t < returnAt ? receiverGrip.y : receiverRelease.y + (greenGrip.y - receiverRelease.y) * returnPass + Math.sin(Math.PI * returnPass) * 0.9;
  const ballZ = t < 15 ? 1.08 : t < 49 ? 1.08 + (receiverGrip.z - 1.08) * pass : t < returnAt ? receiverGrip.z : receiverRelease.z + (greenGrip.z - receiverRelease.z) * returnPass;
  return <group>
    <StoryActor x={-2.1} z={0.8} t={t} len={len} action="point" actionBeats={[
      { f: 0, headYaw: 0.28, headPitch: -0.1, rightArm: -0.42, leftArm: 0.18 },
      { f: 15, headYaw: 0.12, rightArm: -1.25, leftArm: 0.12 },
      { f: 27, headYaw: -0.04, rightArm: -0.62, leftArm: 0.2 },
      { f: 49, x: -2.1, z: 0.8, headYaw: -0.12, rightArm: -0.42, leftArm: 0.18 },
      { f: returnAt, x: -2.1, z: 0.8, headYaw: 0.04, rightArm: -0.38, leftArm: 0.2 },
      { f: 72, x: -1.62, z: 0.72, headYaw: -0.12, rightArm: -0.42, leftArm: 0.72, bodyLean: -0.06 },
      { f: greenCatchAt, x: -1.2, z: 0.65, headYaw: -0.16, rightArm: -0.42, leftArm: 0.32, bodyLean: 0 },
      { f: len - 1, x: -1.2, z: 0.65, headYaw: -0.08, rightArm: -0.42, leftArm: 0.32, bodyLean: 0 },
    ]} {...SCROLLER} rig="kenney" variant="f" heldBall heldBallHand="left" heldBallScale={0.56} heldBallStartFrame={greenCatchAt} />
    <StoryActor x={2.15} z={0.6} t={t} len={len} scale={0.9} action="idle" actionBeats={[
      { f: 0, headYaw: -0.2, headPitch: 0, rightArm: 0.08, leftArm: 0.04 },
      { f: 26, headYaw: -0.1, headPitch: -0.08, rightArm: -0.18, leftArm: 0.18 },
      { f: 47, headYaw: 0.04, headPitch: 0.05, rightArm: -0.82, leftArm: 0.92, bodyLean: -0.08 },
      { f: 55, headYaw: 0.08, headPitch: 0, rightArm: -0.82, leftArm: 0.92, bodyLean: -0.08 },
      { f: returnAt, headYaw: 0.1, rightArm: -1.22, leftArm: 0.92, bodyLean: -0.08 },
      { f: returnAt + 5, headYaw: 0.14, rightArm: -1.42, leftArm: 0.45, bodyLean: -0.12 },
      { f: returnAt + 12, headYaw: 0.08, rightArm: -0.28, leftArm: 0.18, bodyLean: 0 },
      { f: len - 1, headYaw: 0.1, rightArm: -0.18, leftArm: 0.2 },
    ]} {...CLASSMATE} rig="kenney" heldBall heldBallHand="right" heldBallScale={0.56} heldBallStartFrame={49} heldBallEndFrame={returnAt} />
    {[0.11, 0.22, 0.33].map((lag, index) => {
      const progress = clamp01(pass - lag);
      const trailX = senderX + (receiverGrip.x - senderX) * progress;
      const trailY = senderY + (receiverGrip.y - senderY) * progress + Math.sin(Math.PI * progress) * 1.25;
      const trailZ = 1.08 + (receiverGrip.z - 1.08) * progress;
      return t >= 15 && t < 49 && pass < 0.98 ? <mesh key={`pass-trail-${index}`} position={[trailX, trailY, trailZ]}>
        <sphereGeometry args={[0.17 - index * 0.025, 10, 8]} />
        <meshBasicMaterial color="#ffd778" transparent opacity={0.36 - index * 0.08} depthWrite={false} />
      </mesh> : null;
    })}
    {[0.12, 0.24, 0.36].map((lag, index) => {
      const progress = clamp01(returnPass - lag);
      const trailX = receiverRelease.x + (greenGrip.x - receiverRelease.x) * progress;
      const trailY = receiverRelease.y + (greenGrip.y - receiverRelease.y) * progress + Math.sin(Math.PI * progress) * 0.9;
      const trailZ = receiverRelease.z + (greenGrip.z - receiverRelease.z) * progress;
      return t >= returnAt && t < greenCatchAt && returnPass < 0.98 ? <mesh key={`return-trail-${index}`} position={[trailX, trailY, trailZ]}>
        <sphereGeometry args={[0.16 - index * 0.025, 10, 8]} />
        <meshBasicMaterial color="#a7edff" transparent opacity={0.4 - index * 0.08} depthWrite={false} />
      </mesh> : null;
    })}
    {t < 49 || (t >= returnAt && t < greenCatchAt) ? <WorldProp kind="ball" x={ballX} y={ballY} z={ballZ} rotation={[t * 0.18, 0, t * 0.26]} color="#ed8b36" emissive="#a64f1a" scale={0.56} /> : null}
  </group>;
};

/** Close player gag: two friends scroll before the game, then look up at the hoop. */
export const S10: React.FC<WorldShotProps> = ({ t, len, events = {} }) => {
  const revealAt = events.tall_reveal ?? len;
  const phoneStowAt = Math.min(len - 13, Math.max(revealAt + 8, len - 24));
  const phoneVisibleUntil = Math.min(len - 1, phoneStowAt + 12);
  const reveal = smooth(t / Math.max(1, revealAt));
  return <group>
  <StoryActor x={-1.2} z={0.65} t={t} len={len} scale={1 + reveal * 0.42} legStretch={1 + reveal * 3.55} action="point" actionBeats={[
    { f: 0, scale: 1, legStretch: 1, headYaw: 0.18, rightArm: -0.58, leftArm: 0.32 },
    { f: Math.max(1, revealAt - 18), scale: 1.12, legStretch: 1.8, headYaw: -0.08, rightArm: -0.72, leftArm: 0.4 },
    { f: revealAt, scale: 1.42, legStretch: 4.55, headYaw: -0.2, rightArm: -0.78, leftArm: 0.45 },
    { f: phoneStowAt, scale: 1.42, legStretch: 4.55, headYaw: 0.06, rightArm: -0.36, leftArm: 0.25 },
    { f: len - 1, scale: 1.42, legStretch: 4.55, headYaw: 0.12, rightArm: -0.12, leftArm: 0.14 },
  ]} {...SCROLLER} rig="kenney" variant="f" heldPhone={t < phoneVisibleUntil} phoneStowAt={phoneStowAt} heldBall heldBallHand="left" />
  <StoryActor x={1.25} z={0.45} t={t} len={len} scale={0.88} action="shock" actionBeats={[
    { f: 0, headYaw: -0.22, headPitch: -0.08, rightArm: -0.42, leftArm: 0.24 },
    { f: Math.max(1, revealAt - 4), headYaw: -0.04, headPitch: 0.02, rightArm: -0.35, leftArm: 0.16 },
    { f: Math.min(len - 1, revealAt + 4), headYaw: 0.26, headPitch: -0.16, bodyLean: -0.12, lift: 0.1, rightArm: -1.05, leftArm: 1.1 },
    { f: Math.min(len - 1, revealAt + 16), headYaw: 0.08, headPitch: -0.04, bodyLean: 0, lift: 0, rightArm: -0.52, leftArm: 0.55 },
    { f: len - 1, headYaw: -0.08, rightArm: -0.35, leftArm: 0.24 },
  ]} {...CLASSMATE} rig="kenney" heldPhone={t < phoneVisibleUntil} phoneStowAt={phoneStowAt} />
</group>;
};

/** No-jump payoff: the player gets taller while the fixed hoop and ball stay in scale. */
export const S11: React.FC<WorldShotProps> = ({ t, len, events = {} }) => {
  const dropAt = events.ball_drop ?? len - 1;
  const flightFrames = 64;
  const releaseAt = Math.max(12, dropAt - flightFrames);
  const flight = clamp01((t - releaseAt) / flightFrames);
  const releaseGrip = { x: 0.764, y: 7.376, z: 0.433 };
  const targetZ = -10.34;
  const arc = Math.sin(Math.PI * flight) * 6.2;
  const rimY = 4.72;
  const ballX = releaseGrip.x * (1 - flight);
  const ballZ = releaseGrip.z + (targetZ - releaseGrip.z) * flight;
  const flightY = releaseGrip.y + (rimY - releaseGrip.y) * flight + arc;
  const ballY = t < dropAt ? flightY : rimY;
  const trailFrames = [0.035, 0.1, 0.18, 0.27, 0.37];
  return <group>
    <StoryActor x={-1.2} z={0.65} t={t} len={len} scale={1.42} legStretch={4.55} action="idle" actionBeats={[
      { f: 0, scale: 1.42, legStretch: 4.55, headYaw: 0.2, leftArm: 0 },
      { f: 12, scale: 1.42, legStretch: 4.55, headYaw: -0.16, leftArm: 1.4 },
      { f: releaseAt, scale: 1.42, legStretch: 4.55, leftArm: 1.4 },
      { f: Math.min(len - 1, releaseAt + 4), scale: 1.42, legStretch: 4.55, leftArm: 1.9 },
      { f: len - 1, scale: 1.42, legStretch: 4.55, headYaw: -0.1, leftArm: 1.9 },
    ]} {...SCROLLER} rig="kenney" variant="f" heldBall heldBallHand="left" heldBallEndFrame={releaseAt} />
    {trailFrames.map((delay, index) => {
      const trailT = clamp01(flight - delay);
      const trailY = releaseGrip.y + (rimY - releaseGrip.y) * trailT + Math.sin(Math.PI * trailT) * 6.2;
      const trailZ = releaseGrip.z + (targetZ - releaseGrip.z) * trailT;
      const trailX = releaseGrip.x * (1 - trailT);
      return t >= releaseAt && flight > delay && t < dropAt + 3 ? <mesh key={`ball-trail-${index}`} position={[trailX, trailY, trailZ]}>
        <sphereGeometry args={[0.15 - index * 0.018, 8, 6]} />
        <meshBasicMaterial color={index < 2 ? '#ffe38a' : '#ff9d48'} transparent opacity={0.42 - index * 0.065} depthWrite={false} />
      </mesh> : null;
    })}
    <StoryActor x={1.25} z={0.45} t={t} len={len} scale={0.88} action="idle" actionBeats={[
      { f: 0, headYaw: -0.08, rightArm: -0.35, leftArm: 0.24 },
      { f: 12, headYaw: -0.16, headPitch: -0.1, rightArm: -0.35, leftArm: 0.24 },
      { f: releaseAt, headYaw: 0.02, headPitch: -0.16, rightArm: -0.28, leftArm: 0.2 },
      { f: dropAt, headYaw: 0.18, headPitch: -0.2, rightArm: -0.35, leftArm: 0.28 },
      { f: len - 1, headYaw: 0.1, rightArm: -0.35, leftArm: 0.24 },
    ]} {...CLASSMATE} rig="kenney" />
    {t >= releaseAt ? <WorldProp kind="ball" x={ballX} y={ballY} z={ballZ} rotation={[t * 0.32, 0, t * 0.23]} color="#ff9238" emissive="#a64f1a" scale={0.56} /> : null}
  </group>;
};

/** Side-angle hoop insert proves the ball enters the net and returns to the floor. */
export const S11B: React.FC<WorldShotProps> = ({ t, len, events = {} }) => {
  const netAt = events.net_contact ?? 5;
  const through = Math.min(13, t);
  const netFall = 4.72 - 0.345 * through + 0.03322 * through ** 2 - 0.001259 * through ** 3;
  const floorFrames = Math.max(0, Math.min(11, t - 13));
  const floorFall = 3.08 - 0.12 * floorFrames - 0.01107 * floorFrames ** 2;
  const bounce = clamp01((t - 27) / 10);
  const settledX = smooth((t - 13) / 11) * 0.65;
  const landingDrift = smooth((t - 13) / 11);
  const impactSquash = t >= 24 && t < 27 ? 1 - (t - 24) / 3 : 0;
  const ballScaleY = 0.68 - impactSquash * 0.08;
  const ballRestY = 0.024 + 0.58 * ballScaleY;
  const ballY = t < 13 ? netFall : t < 24 ? floorFall : ballRestY + Math.sin(Math.PI * bounce) * 0.7;
  // Let the ball clear the support post and centered captions on its way down;
  // the floor ring makes the impact legible before the small return bounce.
  const ballX = settledX;
  const ballZ = -10.34 + landingDrift * 1.1;
  const impact = clamp01((t - 24) / 7);
  return <group>
    <WorldProp kind="ball" x={ballX} y={ballY} z={ballZ} rotation={[t * 0.42, 0, t * 0.28]} color="#ff9238" emissive="#d45117" scale={[0.68 + impactSquash * 0.025, ballScaleY, 0.68 + impactSquash * 0.025]} />
    <ImpactRing x={0} y={4.23} z={-10.02} t={t} color="#ffd46a" />
    {t >= 24 && t < 34 ? <mesh position={[ballX, 0.045, ballZ]} rotation={[-Math.PI / 2, 0, 0]} scale={0.55 + impact * 2.0}>
      <torusGeometry args={[0.42, 0.035, 8, 24]} />
      <meshBasicMaterial color="#ffe58a" transparent opacity={0.88 * (1 - impact) ** 0.7} depthWrite={false} />
    </mesh> : null}
    <StoryActor x={-0.25} z={-9.55} t={t} len={len} scale={0.72} action="cheer" animationStartFrame={netAt} actionBeats={[
      { f: 0, headYaw: 0.18, rightArm: -0.18, leftArm: 0.18 },
      { f: Math.max(1, netAt - 1), headYaw: -0.2, headPitch: 0.08, rightArm: -0.2, leftArm: 0.2 },
      { f: netAt, headYaw: -0.2, headPitch: 0.08, rightArm: -0.85, leftArm: 0.95, bodyLean: -0.08 },
      { f: Math.min(len - 1, netAt + 7), headYaw: 0.12, rightArm: -1.7, leftArm: 1.72, bodyLean: 0.1, lift: 0.1 },
      { f: Math.min(len - 1, netAt + 17), headYaw: 0.02, rightArm: -0.65, leftArm: 0.72, bodyLean: 0, lift: 0 },
      { f: 46, headYaw: 0, rightArm: -0.3, leftArm: 0.3 },
    ]} {...CLASSMATE} rig="kenney" />
  </group>;
};

/** Low street-to-skyline reveal: the giant grows into the full-height composition. */
export const S12: React.FC<WorldShotProps> = ({ t, len, events = {} }) => {
  const skyscraperAt = events.skyscraper ?? Math.min(78, len - 1);
  return <group>
    <StoryActor x={0.35} z={-1.8} t={t} len={len} scale={1.42} legStretch={4.55} action="idle" actionBeats={[
      { f: 0, scale: 1.05, legStretch: 1.35, headYaw: -0.12, headPitch: -0.1, leftArm: 0.12, rightArm: -0.18 },
      { f: 35, scale: 1.25, legStretch: 2.2, headYaw: -0.05, headPitch: -0.18, leftArm: 0.18, rightArm: -0.35 },
      { f: Math.max(36, skyscraperAt - 12), scale: 1.5, legStretch: 3.8, headYaw: -0.12, headPitch: -0.24, leftArm: 0.26, rightArm: -0.48 },
      { f: skyscraperAt, scale: 1.72, legStretch: 5.3, headYaw: 0.04, headPitch: -0.2, leftArm: 0.5, rightArm: -0.62 },
      { f: Math.min(len - 1, skyscraperAt + 12), scale: 2.05, legStretch: 7.5, headYaw: 0.16, headPitch: -0.16, leftArm: 0.68, rightArm: -0.84 },
      { f: len - 1, scale: 2.05, legStretch: 7.5, headYaw: -0.1, headPitch: -0.1, leftArm: 0.38, rightArm: -0.42 },
    ]} {...SCROLLER} rig="kenney" variant="f" heldPhone />
    {[-2.8, 2.9].map((x, i) => {
      const reactAt = Math.max(0, skyscraperAt - 6 + (i % 2) * 5);
      return <StoryActor key={`scale-witness-${i}`} x={x} z={-3.5} t={t} len={len} scale={0.68} action={i % 2 ? 'shock' : 'point'} actionBeats={[
      { f: 0, headYaw: i % 2 ? -0.08 : 0.08, rightArm: -0.16, leftArm: 0.12 },
      { f: 34, headYaw: i % 2 ? 0.12 : -0.12, rightArm: -0.28, leftArm: 0.28 },
      { f: reactAt, headYaw: i % 2 ? 0.3 : -0.3, headPitch: -0.12, rightArm: -1.15, leftArm: 1.2, bodyLean: -0.08 },
      { f: Math.min(len - 1, reactAt + 9), headYaw: i % 2 ? 0.18 : -0.18, rightArm: -0.86, leftArm: 0.92, bodyLean: 0.04 },
      { f: len - 1, headYaw: 0, rightArm: -0.7, leftArm: 0.72 },
    ]} rig="kenney" archetype={i ? 'witness' : 'teammate'} faceCues={[
        { f: reactAt - 4, expression: 'curious', gaze: i ? -0.6 : 0.6 },
        { f: reactAt + 3, expression: i ? 'startled' : 'amused' },
      ]} />;
    })}
  </group>;
};

/** Router landing close-up, with the drop and the blue network lights visible. */
export const S13: React.FC<WorldShotProps> = ({ t, len, events = {} }) => {
  const contactAt = events.router_contact ?? Math.round(len * 0.68);
  const actorScale = 2.05;
  const legStretch = 7.5;
  return <group>
    <StoryActor x={0.2} z={-2.3} t={t} len={len} scale={actorScale} legStretch={legStretch} action="shock" animationStartFrame={contactAt} actionBeats={[
      { f: 0, scale: actorScale, legStretch, headYaw: 0.15, headPitch: -0.08, leftArm: -0.08, rightArm: -0.18 },
      { f: Math.max(0, contactAt - 4), scale: actorScale, legStretch, headYaw: -0.18, headPitch: -0.2, leftArm: -0.08, rightArm: -0.18 },
      { f: contactAt, scale: actorScale, legStretch, headYaw: -0.28, headPitch: 0.26, bodyLean: 0.12, leftArm: -1.35, rightArm: 1.4 },
      { f: Math.min(len - 1, contactAt + 8), scale: actorScale, legStretch, headYaw: 0.18, headPitch: 0.11, bodyLean: -0.06, leftArm: 0.65, rightArm: -0.7 },
      { f: len - 1, scale: actorScale, legStretch, headYaw: 0, headPitch: 0.02, bodyLean: 0, leftArm: 0.08, rightArm: -0.16 },
    ]} {...SCROLLER} rig="kenney" faceCues={[{ f: 0, expression: 'curious' }, { f: contactAt - 2, expression: 'curious' }, { f: contactAt + 3, expression: 'startled' }, { f: contactAt + 12, expression: 'startled' }, { f: contactAt + 25, expression: 'amused' }]} heldPhone headRouter headRouterStart={contactAt} headRouterDropStart={-2} headRouterDropFrames={contactAt + 2} headRouterDropHeight={2.7} />
  </group>;
};

/** Final wide: the new router stays on the giant's head as he keeps scrolling. */
export const S14: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={0.15} z={-2.1} t={t} len={len} scale={2.05} legStretch={7.5} action="point" actionBeats={[
    { f: 0, scale: 2.05, legStretch: 7.5, headYaw: -0.08, headPitch: -0.04, rightArm: -0.48, leftArm: 0.12 },
    { f: 10, scale: 2.05, legStretch: 7.5, headYaw: -0.22, headPitch: -0.12, rightArm: -0.64, leftArm: 0.22 },
    { f: 26, scale: 2.05, legStretch: 7.5, headYaw: 0.18, headPitch: -0.04, rightArm: -1.02, leftArm: 0.28 },
    { f: 38, scale: 2.05, legStretch: 7.5, headYaw: -0.08, headPitch: 0.02, rightArm: -0.56, leftArm: 0.2 },
    { f: len - 1, scale: 2.05, legStretch: 7.5, headYaw: 0.08, headPitch: 0, rightArm: -0.72, leftArm: 0.12 },
  ]} {...SCROLLER} rig="kenney" variant="f" heldPhone headRouter headRouterStart={-60} />
</group>;

/** Finish on the protagonist's reaction so the spoken CTA feels addressed to the viewer. */
export const S15: React.FC<WorldShotProps> = ({ t, len }) => <group>
  <StoryActor x={0.15} z={-1.35} t={t} len={len} scale={1.82} legStretch={7.5} action="point" actionBeats={[
    { f: 0, scale: 1.82, legStretch: 7.5, headYaw: -0.2, headPitch: 0.04, leftArm: 0.08, rightArm: -0.68 },
    { f: 17, scale: 1.82, legStretch: 7.5, headYaw: -0.34, headPitch: 0, leftArm: 0.72, rightArm: -0.18 },
    { f: 34, scale: 1.82, legStretch: 7.5, headYaw: -0.26, headPitch: 0.02, leftArm: 0.64, rightArm: -0.24 },
    { f: 46, scale: 1.82, legStretch: 7.5, headYaw: 0.3, headPitch: -0.04, leftArm: 0.12, rightArm: -1.12 },
    { f: 62, scale: 1.82, legStretch: 7.5, headYaw: 0.24, headPitch: -0.02, leftArm: 0.18, rightArm: -0.96 },
    { f: 80, scale: 1.82, legStretch: 7.5, headYaw: -0.12, headPitch: 0.04, leftArm: 0.12, rightArm: -0.52 },
    { f: len - 1, scale: 1.82, legStretch: 7.5, headYaw: 0, headPitch: 0.02, leftArm: 0.12, rightArm: -0.48 },
  ]} {...SCROLLER} rig="kenney" faceCues={[{ f: 0, expression: 'amused' }, { f: 17, expression: 'curious', gaze: -0.8 }, { f: 34, expression: 'curious', gaze: -0.8 }, { f: 46, expression: 'curious', gaze: 0.8 }, { f: 72, expression: 'amused' }]} heldPhone headRouter headRouterStart={-110} />
</group>;
