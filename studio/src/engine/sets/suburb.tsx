import React from 'react';
import {Timber} from './world-interiors';

export const BED_X=1.25;
const white='#faf3e4';
function Sash({x,y,z,wide=1.85,opening=0}: {x:number;y:number;z:number;wide?:number;opening?:number}) {
  return <group position={[x,y,z]}>
    {[-1,1].map(s=><Timber key={s} at={[s*wide/2,0,0]} size={[.13,1.75,.16]} color={white}/>)}
    {[-.84,.84].map(h=><Timber key={h} at={[0,h,0]} size={[wide+.19,.12,.18]} color={white}/>)}
    <group position={[0,opening*1.58,-.06]}>
      <mesh><boxGeometry args={[wide-.14,1.56,.025]}/><meshStandardMaterial transparent opacity={.22} depthWrite={false} color="#9bd2eb"/></mesh>
      <Timber at={[0,0,0]} size={[wide-.12,.056,.065]} color={white}/>
    </group>
  </group>;
}
function StreetHouse({x,color,roof}: {x:number;color:string;roof:string}) {
  return <group position={[x,0,-2.5]}>
    <Timber at={[0,2.4,0]} size={[7.25,4.8,6]} color={color}/>
    {[-1,1].map(s=><Timber key={s} at={[s*1.92,5.16,0]} size={[4.28,.25,6.55]} rotation={[0,0,-s*.32]} color={roof}/>)}
    <Timber at={[0,1.16,3.04]} size={[1.18,2.32,.16]} color="#885632"/>
    {[-2.17,2.17].map(dx=><group key={dx}>
      <Timber at={[dx,2.02,3.03]} size={[1.74,1.58,.08]} color="#8acfea"/>
      <Sash x={dx} y={2.02} z={3.11}/>
    </group>)}
  </group>;
}

function StreetTree({x,z}: {x:number;z:number}) {
  return <group position={[x,0,z]}>
    <Timber at={[0,1.28,0]} size={[.32,2.56,.31]} color="#976a40"/>
    {[[0,3.6,0,1.42],[-.62,3.3,.13,1],[.67,3.45,-.2,.94],[.16,4.32,-.11,.91]].map(([dx,y,dz,r],i)=><mesh key={i} position={[dx,y,dz]} castShadow receiveShadow><icosahedronGeometry args={[r,1]}/><meshStandardMaterial color={['#6bbc59','#70ae43','#488f4c','#86c455'][i]} flatShading/></mesh>)}
  </group>;
}

export function SuburbLane() {
  return <group>
    <Timber at={[0,-.015,10]} size={[118,.09,6.8]} color="#555f70"/>
    {[-9,0,9,18,27,-18,-27].map(x=><Timber key={x} at={[x,.038,10]} size={[2.5,.012,.1]} color="#f4eedb"/>)}
    {[5.88,14.1].map(z=><Timber key={z} at={[0,.03,z]} size={[108,.16,1.44]} color="#e0dbce"/>)}
    {[-28,-18,-9,10,20,30].map((x,i)=><StreetHouse key={x} x={x} color={['#ffe77d','#f3a690','#89bdce'][i%3]} roof={['#637595','#995760'][i%2]}/>)}
    {[-13,-6,6,14,25].map(x=><StreetTree key={x} x={x} z={3.52}/>)}
    {[-18,-9,0,9,18].map(x=><group key={x} position={[x,0,3.75]}>
      {Array.from({length:9},(_,i)=><Timber key={i} at={[-3.35+i*.43,.54,0]} size={[.23,1.08,.13]} color={white}/>)}
      {[.28,.72].map(y=><Timber key={y} at={[-1.65,y,-.07]} size={[3.7,.11,.12]} color="#e2e8da"/>)}
    </group>)}
    {/* Two clear openings. The mother's sash and the hero's striped legs can move independently. */}
    {[[0,.52,8.85,1.04],[0,4.13,8.85,2.02],[-3.97,2.08,.91,2.08],[-.62,2.08,1.88,2.08],[3.35,2.08,2.14,2.08]].map(([x,y,w,h],i)=><Timber key={i} at={[x,y,.52]} size={[w,h,.24]} color="#66cddd"/>)}
    <Timber at={[0,2.5,-6.65]} size={[8.85,5.1,.18]} color="#6485ad"/>
    {[-4.34,4.34].map(x=><Timber key={x} at={[x,2.54,-3.12]} size={[.18,5.08,7.24]} color="#65b8cd"/>)}
    <Timber at={[0,5.34,-3.09]} size={[9.44,.42,7.97]} color="#ba444a"/>
    <Timber at={[0,5.07,-3.09]} size={[9.28,.13,7.81]} color={white}/>
    <Sash x={1.3} y={2.12} z={.67} wide={2.04} opening={1}/>
    <pointLight position={[0,3,-1.6]} intensity={15} color="#f8dfba" distance={10}/>
  </group>;
}

export function TeenBedroom() {
  return <group>
    <Timber at={[0,-.07,-3]} size={[10,.14,10]} color="#b58b5c"/>
    {Array.from({length:16},(_,i)=><Timber key={i} at={[0,.008,-7.95+i*.62]} size={[10,.012,.017]} color="#8f714d"/>)}
    <Timber at={[0,2.6,-7.35]} size={[10,5.2,.17]} color="#3e5c94"/>
    <Timber at={[-4.8,2.6,-2.6]} size={[.16,5.2,9.7]} color="#456993"/>
    <Timber at={[4.8,2.6,-2.6]} size={[.16,5.2,9.7]} color="#43658f"/>
    <Timber at={[0,5.32,-2.7]} size={[10,.18,10]} color="#efdbb5"/>
    <Timber at={[0,.16,-7.18]} size={[9.53,.32,.12]} color="#f4eee2"/>
    <Timber at={[BED_X,.67,-3.4]} size={[2.39,.61,3.85]} color="#aa7246"/>
    <Timber at={[BED_X,1.09,-3.4]} size={[2.3,.34,3.75]} color="#f4e7d2"/>
    <Timber at={[BED_X,1.43,-5.33]} size={[2.5,1.81,.16]} color="#d1be9c"/>
    <Timber at={[BED_X,1.37,-4.73]} size={[1.65,.23,.72]} color="#f6f1dd"/>
    <Timber at={[3.04,.88,-4.8]} size={[.91,1.2,.82]} color="#aa7544"/>
    <Timber at={[3.04,1.65,-4.83]} size={[.1,.32,.1]} color="#b28353"/>
    <mesh position={[3.04,1.92,-4.83]}><cylinderGeometry args={[.22,.39,.39,12]}/><meshStandardMaterial color="#ffefc0" emissive="#ffd675" emissiveIntensity={.88}/></mesh>
    <pointLight position={[2.91,2.32,-4.7]} intensity={22} distance={12} color="#ffcb89"/>
    <Timber at={[-2.26,1.27,-4.73]} size={[2.94,.15,1.2]} color="#c59e76"/>
    {[-3.54,-.99].map(x=><Timber key={x} at={[x,.62,-4.73]} size={[.13,1.24,1.01]} color="#9e764f"/>)}
    <Timber at={[-2.55,1.37,-4.6]} size={[.83,.065,.51]} color="#3f4a5d"/>
    <Timber at={[-2.55,1.68,-4.84]} size={[.83,.58,.055]} color="#546475" rotation={[-.11,0,0]}/>
    <Timber at={[-2.55,1.68,-4.80]} size={[.75,.49,.02]} color="#a3d9db" glow="#7babc6" rotation={[-.11,0,0]}/>
    <Timber at={[-2.2,.89,-5.64]} size={[1.05,.13,.94]} color="#bd7952"/>
    <Timber at={[-2.2,1.38,-6.06]} size={[1.04,.96,.11]} color="#c98a4b"/>
    <Timber at={[-2.2,.46,-5.64]} size={[.37,.86,.39]} color="#716657"/>
    {[-3.2,-1.4].map((x,i)=><group key={x}>
      <Timber at={[x,3.17,-7.19]} size={[1.28,1.65,.12]} color="#f7dcac"/>
      <Timber at={[x,3.17,-7.1]} size={[1.13,1.49,.065]} color={i?'#d17a69':'#5399ab'}/>
      <Timber at={[x,3.19,-7.04]} size={[.51,.51,.06]} color="#f7db78" rotation={[0,0,.72]}/>
    </group>)}
  </group>;
}
export {Sash};
