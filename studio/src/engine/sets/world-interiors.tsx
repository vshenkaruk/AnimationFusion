import React from 'react';

type Vec = [number, number, number];
export function Timber({at, size, color, rotation, glow}: {
  at: Vec; size: Vec; color: string; rotation?: Vec; glow?: string;
}) {
  return <mesh position={at} rotation={rotation} castShadow receiveShadow>
    <boxGeometry args={size}/><meshStandardMaterial color={color} roughness={0.83} emissive={glow} emissiveIntensity={glow ? 0.68 : 0}/>
  </mesh>;
}

function Chair({x, z}: {x: number; z: number}) {
  return <group position={[x, 0, z]}>
    <Timber at={[0, .82, 0]} size={[1.06, .14, .92]} color="#7dba51"/>
    <Timber at={[-.49, 1.36, 0]} size={[.13, .95, .94]} color="#80bd67"/>
    {[-.39,.39].flatMap(dx => [-.35,.35].map(dz =>
      <Timber key={dx+','+dz} at={[dx,.39,dz]} size={[.075,.78,.075]} color="#717b83"/>))}
  </group>;
}

function Desk({x,z}: {x:number; z:number}) {
  return <group position={[x,0,z]}>
    <Timber at={[0,1.39,0]} size={[1.45,.14,1.05]} color="#d9a557"/>
    <Timber at={[.12,1.476,-.11]} size={[.54,.026,.38]} color="#fff6df" rotation={[0,.18,0]}/>
    <Timber at={[-.25,1.481,.12]} size={[.32,.024,.027]} color="#dc703f" rotation={[0,.25,0]}/>
    {[-.62,.62].flatMap(dx=>[-.42,.42].map(dz=><Timber key={dx+','+dz} at={[dx,.68,dz]} size={[.085,1.36,.085]} color="#697d88"/>))}
  </group>;
}

/** Desks face +X. Keep the foreground aisle open for the side-on growth shot. */
export function DayClassroom() {
  return <group>
    <Timber at={[0,-.095,-1]} size={[20,.18,22]} color="#c18b57"/>
    {Array.from({length:23},(_,i)=><group key={i}>
      <Timber at={[0,.001,-10+i*.8]} size={[20,.012,.015]} color="#986940"/>
      {[-7,-2,3,8].map(x=><Timber key={x} at={[x+(i%2)*1.7,.002,-9.6+i*.8]} size={[.013,.012,.78]} color="#aa784e"/>)}
    </group>)}
    <Timber at={[0,3.2,-6.5]} size={[19,6.4,.18]} color="#f8eaca"/>
    <Timber at={[0,.79,-6.38]} size={[19,1.58,.1]} color="#56b7a5"/>
    <Timber at={[-7.7,3.2,-1]} size={[.2,6.4,12]} color="#cbddec"/>
    <Timber at={[0,6.49,-.5]} size={[19,.24,17]} color="#f7f2e9"/>
    {[-4.3,.3,4.8].map(x=><group key={x}>
      <Timber at={[x,3.8,-6.36]} size={[3.65,2.78,.16]} color="#c5ba9b"/>
      <Timber at={[x,3.8,-6.24]} size={[3.45,2.58,.08]} color="#e0f6fb" glow="#c5e7f1"/>
      <Timber at={[x,3.8,-6.16]} size={[.085,2.6,.09]} color="#fff2dc"/>
      <Timber at={[x,3.8,-6.16]} size={[3.48,.09,.09]} color="#fff2dc"/>
      <Timber at={[x,2.43,-6.22]} size={[3.77,.12,.35]} color="#e1cfaa"/>
      {[-3,2].map(z=><Timber key={z} at={[x,6.34,z]} size={[1.05,.05,2.35]} color="#fffdf2" glow="#fffbe9"/>)}
    </group>)}
    {[-4.1,-1.25,1.65,4.45].map(x=><group key={x}><Chair x={x-.7} z={-3.85}/><Desk x={x+.48} z={-3.85}/></group>)}
    <Chair x={-1.78} z={0}/>
    <Desk x={-.56} z={-.85}/>
    <Desk x={3.95} z={-1.35}/>
  </group>;
}

function Shrub({at,scale}: {at:Vec;scale:number}) {
  return <group position={at} scale={scale}>
    {[[0,.44,0,.78],[-.37,.31,.15,.48],[.33,.46,.05,.47],[-.13,.74,-.12,.37]].map(([x,y,z,r],i)=>
      <mesh key={i} position={[x,y,z]} scale={[1,1.04,1]} castShadow receiveShadow>
        <icosahedronGeometry args={[r,1]}/><meshStandardMaterial color={['#4c912f','#63a239','#558d2b','#73a942'][i]} flatShading/>
      </mesh>)}
  </group>;
}

/** The same bed, pillow, lamp and room coordinates work on either side of the front wall. */
export function CottageBedroom({outside=false}: {outside?:boolean}) {
  const wood='#a16135';
  return <group>
    <Timber at={[0,.13,-3.6]} size={[9,.26,8.2]} color="#b69a76"/>
    <Timber at={[0,2.64,-7.6]} size={[9,5.02,.2]} color="#f1c99e"/>
    {[-4.5,4.5].map(x=><Timber key={x} at={[x,2.64,-3.57]} size={[.23,5.02,8.2]} color="#e6bd92"/>)}
    <Timber at={[0,.64,-3.34]} size={[2.6,.56,3.95]} color={wood}/>
    <Timber at={[0,1.06,-3.34]} size={[2.48,.35,3.85]} color="#fff3dc"/>
    <Timber at={[0,1.34,-5.26]} size={[2.69,1.6,.14]} color="#b67242"/>
    <Timber at={[0,1.35,-4.65]} size={[1.63,.23,.74]} color="#f9eada" rotation={[-.1,0,0]}/>
    <Timber at={[1.98,.87,-4.88]} size={[.91,1.2,.74]} color={wood}/>
    <Timber at={[1.98,1.67,-4.88]} size={[.11,.42,.11]} color="#bf8b4a"/>
    <mesh position={[1.98,1.99,-4.88]}><cylinderGeometry args={[.22,.39,.48,16]}/><meshStandardMaterial color="#fff2d9" emissive="#ffcf8b" emissiveIntensity={1.1}/></mesh>
    <pointLight position={[1.83,2.65,-4.55]} intensity={24} distance={12} color="#ffd6a0"/>
    <pointLight position={[-2.4,3.7,-1.4]} intensity={18} distance={13} color="#ffdcb3"/>
    <Timber at={[0,5.19,-3.55]} size={[9,.12,8.1]} color="#f7dec1"/>
    {outside && <group>
      {/* Solid siding surrounds an actual aperture from x=-1.62 to 1.62, y=.93 to 3.23. */}
      {Array.from({length:22},(_,i)=>{
        const y=(i+.5)*.233;
        const color=['#c88954','#bc7d49','#c0834e'][i%3];
        return i<4||i>=14 ? <Timber key={i} at={[0,y,.55]} size={[9,.24,.22]} color={color}/> :
          <group key={i}>{[-1,1].map(s=><Timber key={s} at={[s*3.06,y,.55]} size={[2.88,.24,.22]} color={color}/>)}</group>;
      })}
      {[-1,1].map(s=><Timber key={s} at={[s*1.66,2.1,.67]} size={[.12,2.45,.29]} color="#f7ead6"/>)}
      {[.91,3.27].map(y=><Timber key={y} at={[0,y,.69]} size={[3.45,.13,.38]} color="#fff1db"/>)}
      <Timber at={[0,5.13,-3.55]} size={[9.62,.26,8.9]} color="#243858"/>
      {Array.from({length:21},(_,i)=>{
        const k=(21-i)/21;
        return <mesh key={i} position={[0,5.29+i*.15,-3.55]} rotation={[0,Math.PI/4,0]} scale={[1,1,.93]} castShadow receiveShadow>
          <cylinderGeometry args={[Math.max(0,k-1/21)*6.78,k*6.78+.045,.16,4]}/><meshStandardMaterial color={i%2?'#314e8a':'#385896'} flatShading/>
        </mesh>;
      })}
      <Timber at={[0,4.48,-3.52]} size={[8.9,1.22,8.05]} color="#efcc9a" rotation={[0,0,0]}/>
      {[[-3.5,0,1.2,1.24],[3.7,0,1.05,1.14],[-5.25,0,-1.3,1.03],[5.3,0,-3.4,.92]].map(([x,y,z,r])=><Shrub key={x} at={[x,y,z]} scale={r}/>)}
      {[-1,1].map(s=><group key={s} position={[s*10,0,-9]}>
        {[-5,-2,1,4].map(x=><Timber key={x} at={[x,.68,0]} size={[.16,1.36,.18]} color="#d6dbc8"/>)}
        {[.4,.93].map(y=><Timber key={y} at={[-.5,y,0]} size={[9.8,.13,.13]} color="#c4cdbf"/>)}
      </group>)}
    </group>}
  </group>;
}
