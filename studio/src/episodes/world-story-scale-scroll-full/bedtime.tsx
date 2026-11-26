import React from 'react';
import {StoryActor, WorldProp, WorldShotProps} from '../../engine';
import {BED_X, Sash} from '../../engine/sets/suburb';
import {Timber} from '../../engine/sets/world-interiors';

const ease=(value:number)=>{const x=Math.min(1,Math.max(0,value));return x*x*(3-2*x);};

export const A01:React.FC<WorldShotProps>=({t,len})=><group>
  <StoryActor rig="kenney" archetype="narrator" x={-2.2} y={.06} z={-5.65} t={t} len={len} action="idle" hideLegs
    faceCues={[{f:0,expression:'calm'},{f:len*.68,expression:'wary',gaze:1}]}
    actionBeats={[{f:0,headPitch:.09,rightArm:-.22},{f:len*.55,headYaw:.4,rightArm:-.68},{f:len-1,headYaw:.08,rightArm:-.36}]}/>
  {[-.22,.22].map(x=><group key={x}>
    <Timber at={[-2.2+x,.97,-5.19]} size={[.4,.38,.86]} color="#344c68"/>
    <Timber at={[-2.2+x,.57,-4.85]} size={[.4,.82,.36]} color="#344c68"/>
    <Timber at={[-2.2+x,.13,-4.77]} size={[.42,.23,.52]} color="#f1ebdc"/>
  </group>)}
  <Timber at={[-1.38,1.37,-4.6]} size={[.23,.034,.42]} color="#292d3d"/>
</group>;

function InBed({t,len,rise=0,phone=true}:WorldShotProps & {rise?:number;phone?:boolean}){
  // Keep the hip on the mattress as the upper body rotates upright.
  const pitch=-1.36+rise*.95;
  const hipHeight=1.56, hipZ=-3.45;
  return <group>
    <StoryActor rig="kenney" archetype="narrator" x={BED_X} y={hipHeight-.95*Math.cos(pitch)} z={hipZ-.95*Math.sin(pitch)} t={t} len={len}
      heldPhone={phone} action="idle" hideLegs
      faceCues={[{f:0,expression:rise>.35?'startled':'calm'},{f:len*.64,expression:rise>.35?'wary':'curious',gaze:-.6}]}
      actionBeats={[{f:0,bodyPitch:pitch,rightArm:-1,leftArm:.46,headPitch:.12},{f:len-1,bodyPitch:pitch,rightArm:-.83,leftArm:.35,headPitch:.04}]}/>
    <Timber at={[BED_X,1.54,-2.54]} size={[2.15,.51,1.74]} rotation={[-.055,0,0]} color="#c54d40"/>
    <Timber at={[BED_X,1.795,-3.3]} size={[2.16,.09,.25]} rotation={[-.1,0,0]} color="#ef7962"/>
  </group>;
}
export const A02:React.FC<WorldShotProps>=props=><InBed {...props}/>;
function FeedInsert({t,len,repeat=false}:WorldShotProps & {repeat?:boolean}){
  const f=t/Math.max(1,len-1);
  const phase=repeat ? Math.min(1.999,2*f) : Math.min(.999,f);
  const swipe=ease((phase%1-.12)/.43);
  const lift=ease((phase%1-.56)/.3);
  return <group position={[BED_X,2.02,-3.08]} rotation={[-.1,-.08,-.05]}>
    <WorldProp kind="phone" color="#f5ac7d" x={0} y={0} z={0} scale={.66} scrollT={t} pageIndex={1+Math.floor(phase)} pageBlend={swipe}/>
    <group position={[.26+lift*.58,.32+swipe*.68,.14+lift*.09]} rotation={[0,0,-.56]}>
      <Timber at={[.15,-.12,0]} size={[.36,.28,.21]} color="#dca781"/>
      <Timber at={[0,.08,.02]} size={[.12,.3,.12]} color="#e4b18b"/>
      <Timber at={[.39,-.22,-.04]} size={[.3,.29,.22]} color="#326a53"/>
    </group>
  </group>;
}
export const A03:React.FC<WorldShotProps>=p=><FeedInsert {...p}/>;
export const A04:React.FC<WorldShotProps>=p=><FeedInsert {...p} repeat/>;
export const A05:React.FC<WorldShotProps>=p=><InBed {...p} rise={.14}/>;

function Clock({hours}: {hours:number}) {
  const z=-4.41;
  return <group position={[2.9,1.75,z]}>
    <mesh rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.265,.265,.11,32]}/><meshStandardMaterial color="#f8e7bc"/></mesh>
    {Array.from({length:12},(_,i)=><group key={i} rotation={[0,0,-i*Math.PI/6]}><Timber at={[0,.223,.06]} size={[.014,.038,.016]} color="#644a40"/></group>)}
    {[[hours*Math.PI/6,.13],[hours*2*Math.PI,.2]].map(([angle,size],i)=>
      <group key={i} rotation={[0,0,-angle]}><Timber at={[0,size/2,.073+i*.009]} size={[.018,size,.012]} color="#604438"/></group>)}
  </group>;
}
export const A06:React.FC<WorldShotProps>=({t,len,events={}})=>{
  const put=events.phone_down??Math.round(len*.75);
  const move=ease((t-put+9)/16);
  return <group><InBed t={t} len={len} phone={false}/>
    <Clock hours={11+3*ease(t/Math.max(1,put-8))}/>
    <group position={[1.81+.85*move,2.01-.48*move+.16*Math.sin(move*Math.PI),-4.55]} rotation={[-Math.PI*.49*move,0,.19*(1-move)]}>
      <WorldProp kind="phone" x={0} y={0} z={0} scale={.19} color="#5e7697" scrollT={t}/>
    </group>
  </group>;
};
export const A07:React.FC<WorldShotProps>=({t,len,events={}})=><InBed t={t} len={len} phone={false} rise={ease((t-(events.rise??12)+8)/20)}/>;

function ThroughWindow({length}: {length:number}) {
  return <group>
    {[-.24,.24].map(dx=><group key={dx} position={[BED_X+dx,1.58,-1.0]}>
      <Timber at={[0,0,length/2]} size={[.47,.43,length]} color="#40567b"/>
      {[-.16,-.05,.08,.18].map(line=><Timber key={line} at={[line,.219,length/2]} size={[.018,.009,length]} color="#a0b6d1"/>)}
      <Timber at={[0,-.018,length+.12]} size={[.48,.47,.26]} color="#f5eee0"/>
    </group>)}
  </group>;
}
export const A08:React.FC<WorldShotProps>=({t,len,events={}})=>{
  const grow=ease(t/Math.max(1,(events.stretch??len*.6)+12));
  return <group><ThroughWindow length={3.2+8.8*grow}/><Sash x={-2.5} y={2.12} z={.67}/></group>;
};
export const A09:React.FC<WorldShotProps>=({t,len,events={}})=>{
  const scold=events.scold??Math.round(len*.52);
  return <group>
    <ThroughWindow length={12}/><Sash x={-2.5} y={2.12} z={.67} opening={ease(t/Math.max(8,scold))}/>
    <StoryActor rig="kenney" archetype="witness" x={-2.5} y={.49} z={-.13} t={t} len={len} action="idle"
      faceCues={[{f:0,expression:'curious'},{f:scold,expression:'wary',gaze:1}]}
      actionBeats={[{f:0,leftArm:.1,headYaw:.05},{f:scold,leftArm:.98,headYaw:.46,headPitch:-.13},{f:len-1,leftArm:.5,headYaw:.34}]}/>
  </group>;
};
