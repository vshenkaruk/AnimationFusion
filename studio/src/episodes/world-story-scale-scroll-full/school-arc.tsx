import React, {useEffect, useMemo} from 'react';
import {CanvasTexture, SRGBColorSpace} from 'three';
import {StoryActor, WorldShotProps} from '../../engine/storyworld';
import {Timber} from '../../engine/sets/world-interiors';

type Vec = [number,number,number];
const clamp = (n:number) => Math.max(0,Math.min(1,n));
const ease = (n:number) => {const p=clamp(n);return p*p*(3-2*p);};
const cue = (s:WorldShotProps,name:string,at:number) => s.events?.[name] ?? Math.round((s.len-1)*at);
const shirt='#356944', jeans='#354c59', shoe='#ecefe7', busYellow='#ffc12a';

function Decal({text,at,width,height,ink='#27303a',paper='#ffcd36'}: {
  text:string;at:Vec;width:number;height:number;ink?:string;paper?:string
}) {
  const map=useMemo(()=>{
    const c=document.createElement('canvas'); c.width=512; c.height=128;
    const g=c.getContext('2d')!; g.fillStyle=paper; g.fillRect(0,0,512,128);
    g.fillStyle=ink;g.font='bold 80px Arial';g.textAlign='center';g.textBaseline='middle';
    g.fillText(text,256,67,476);
    const tex=new CanvasTexture(c); tex.colorSpace=SRGBColorSpace; return tex;
  },[text,ink,paper]);
  useEffect(()=>()=>map.dispose(),[map]);
  return <mesh position={at}><planeGeometry args={[width,height]}/><meshBasicMaterial map={map}/></mesh>;
}
function Wheel({x,z}: {x:number;z:number}) {
  return <group position={[x,.72,z]} rotation={[Math.PI/2,0,0]}>
    <mesh castShadow><cylinderGeometry args={[.68,.68,.34,24]}/><meshStandardMaterial color="#222937"/></mesh>
    <mesh position={[0,.186,0]}><cylinderGeometry args={[.38,.38,.05,18]}/><meshStandardMaterial color="#cbcfd0" metalness={.4} roughness={.48}/></mesh>
    <mesh position={[0,.22,0]}><cylinderGeometry args={[.17,.17,.085,8]}/><meshStandardMaterial color="#677584"/></mesh>
  </group>;
}
/** The hero and tire have a fixed common pavement plane across four shots. */
function BusStop() {
  return <group>
    <Timber at={[0,-.025,-.45]} size={[30,.09,3.05]} color="#ddd6c9"/>
    <Timber at={[0,.002,1.07]} size={[30,.095,.11]} color="#e9e2d8"/>
    <group position={[1,0,-2.65]}>
      <Timber at={[0,1.27,0]} size={[7.75,1.26,2.19]} color={busYellow}/>
      <Timber at={[-.25,2.27,0]} size={[6.92,1.08,2.16]} color="#eaa124"/>
      <Timber at={[-.25,2.89,0]} size={[7.06,.2,2.23]} color="#ffcf49"/>
      <Timber at={[3.43,1.82,0]} size={[.85,.28,2.16]} color="#ffcf3c"/>
      {[-1,1].map(side=><group key={side}>
        {Array.from({length:7},(_,i)=><group key={i} position={[-3.16+i*.85,2.31,side*1.088]}>
          <Timber at={[0,0,0]} size={[.77,.77,.042]} color="#324955"/>
          <Timber at={[0,.03,side*.027]} size={[.64,.59,.036]} color={i%2?'#95bfd0':'#b2d5dd'}/>
          <Timber at={[0,-.02,side*.054]} size={[.69,.036,.013]} color="#637b84"/>
        </group>)}
        {[1,1.13,1.56].map(y=><Timber key={y} at={[-.22,y,side*1.105]} size={[7.13,.066,.039]} color="#34414b"/>)}
        {[-2.61,2.62].map(x=><Wheel key={x} x={x} z={side*1.062}/>)}
      </group>)}
      <Timber at={[2.76,1.78,1.112]} size={[.95,1.93,.06]} color="#39414a"/>
      {[-1,1].map(side=><Timber key={side} at={[2.76+side*.204,2.05,1.151]} size={[.34,1.05,.023]} color="#a1c5cc"/>)}
      <Decal text="SCHOOL BUS" at={[-.66,1.35,1.134]} width={2.54} height={.31}/>
      <Timber at={[-3.91,.91,0]} size={[.22,.26,2.33]} color="#354351"/>
      <Timber at={[3.93,.91,0]} size={[.22,.26,2.33]} color="#354351"/>
    </group>
    {/* The school entrance sits in front of the WorldStage facade and behind the bus. */}
    <Timber at={[0,2.2,-7.13]} size={[11,4.34,.15]} color="#bf7156"/>
    {[-4.1,-2.5,2.5,4.1].map(x=><group key={x}>
      <Timber at={[x,2.89,-7.02]} size={[1.28,1.36,.09]} color="#f4e6c9"/>
      <Timber at={[x,2.89,-6.94]} size={[1.08,1.15,.07]} color="#93c7d4"/>
      <Timber at={[x,2.89,-6.89]} size={[.065,1.2,.035]} color="#f3e7d3"/>
    </group>)}
    <Decal text="ELEMENTARY SCHOOL" at={[0,5.06,-7.08]} width={4.72} height={.65} paper="#f6e7cf"/>
    <Timber at={[0,1.15,-6.98]} size={[1.97,2.3,.12]} color="#55747b"/>
  </group>;
}
function Hero({s,hip,x=0,z=.42,phone=true,expression='curious',yaw=0,head=0,arm=0,panic=0}:{
  s:WorldShotProps; hip:number;x?:number;z?:number;phone?:boolean;expression?:'curious'|'wary'|'amused'|'startled';
  yaw?:number;head?:number;arm?:number;panic?:number
}) {
  // Body only. Separate legs retain real shoe thickness at both tiny and giant height.
  return <StoryActor x={x} y={hip-1} z={z} t={s.t} len={s.len} rig="kenney" archetype="narrator" hideLegs
    action="idle" heldPhone={phone} animationClip={phone?'holding-right':'idle'}
    faceCues={[{f:0,expression,gaze:head}]}
    actionBeats={[{f:0,yaw,headYaw:head*.32,headPitch:phone?.11:-.04,rightArm:-.13-arm*.35-panic*.7,leftArm:.035+panic*.9}]}/>;
}
function Limb({a,b,width,depth,color}: {a:Vec;b:Vec;width:number;depth:number;color:string}) {
  const dx=b[0]-a[0],dy=b[1]-a[1];
  return <Timber at={[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]} size={[width,Math.max(.01,Math.hypot(dx,dy)),depth]} color={color} rotation={[0,0,-Math.atan2(dx,dy)]}/>;
}
function Foot({x,y,z,toward=0}: {x:number;y:number;z:number;toward?:number}) {
  return <group position={[x,y,z]} rotation={[0,toward,0]}>
    <Timber at={[0,.12,.095]} size={[.39,.2,.58]} color={shoe}/>
    <Timber at={[0,.038,.11]} size={[.41,.075,.61]} color="#b3bcc0"/>
    <Timber at={[0,.221,.108]} size={[.23,.015,.12]} color="#c8d4d4"/>
  </group>;
}
function StraightLegs({height,x=0,z=.42}: {height:number;x?:number;z?:number}) {
  return <group>{[-.205,.205].map(side=><group key={side}>
    <Timber at={[x+side,(height+.19)/2,z]} size={[.386,Math.max(.024,height-.19),.37]} color={jeans}/>
    <Foot x={x+side} y={0} z={z}/>
  </group>)}</group>;
}
function ShrinkingBoy({s,hip,panic=0}: {s:WorldShotProps;hip:number;panic?:number}) {
  return <group><StraightLegs height={hip}/><Hero s={s} hip={hip} expression={panic>.1?'startled':'wary'} head={-.38+panic*.4} panic={panic}/></group>;
}

export function A10(s:WorldShotProps) {
  // Alternating contacts: one shoe stays planted while the other follows a lifted arc.
  const last=cue(s,'sixth_step',.91), phase=clamp(s.t/Math.max(1,last))*6;
  const i=Math.min(5,Math.floor(phase)), p=phase-i;
  const start=-5.1, stride=1.64, base=start+phase*stride, z=9.6;
  return <group>{[-1,1].map((side,index)=>{
    const swing=i%2===index;
    const planted=start+i*stride;
    const fx=swing ? planted-stride+2*stride*ease(p) : planted;
    const lift=swing ? Math.sin(Math.PI*p)*1.2 : 0;
    const knee:Vec=[(fx+base)/2+.21+(swing?.62*Math.sin(Math.PI*p):0),3.4+lift*.54,z+side*.23];
    return <group key={side}><Limb a={[base,6.7,z+side*.23]} b={knee} width={.42} depth={.43} color={jeans}/>
      <Limb a={knee} b={[fx,lift+.16,z+side*.23]} width={.4} depth={.42} color={jeans}/>
      <Foot x={fx} y={lift+.075} z={z+side*.23} toward={Math.PI/2}/></group>;
  })}<Hero s={s} hip={6.7} x={base} z={z} yaw={1.18} phone={false} expression="amused"/>
  </group>;
}
export function A11(s:WorldShotProps) {
  const fold=ease((s.t+5)/Math.max(10,cue(s,'blocked',.75)));
  const hip=3.2-1.05*fold;
  return <group><BusStop/>{[-1,1].map(side=>{
    const z=.4+side*.28, knee:Vec=[.3+side*.75,5.14+.29*fold,z];
    return <group key={side}><Limb a={[-.9,hip,z]} b={knee} width={.42} depth={.42} color={jeans}/>
      <Limb a={knee} b={[.9+side*.82,.16,z]} width={.42} depth={.42} color={jeans}/>
      <Foot x={.9+side*.82} y={0} z={z} toward={.52}/></group>;
  })}<Hero s={s} hip={hip} x={-.9} phone={false} expression="wary" yaw={.34} head={.9}/></group>;
}
function Spark({x,y,age}: {x:number;y:number;age:number}) {
  const phase=clamp(age/14), size=Math.sin(phase*Math.PI)*.12;
  if(size<.001)return null;
  return <group position={[x+phase*.08,y+phase*.23,.93]} scale={size}>
    {[0,Math.PI/2].map(r=><mesh key={r} rotation={[0,0,r]}><sphereGeometry args={[1,6,4]}/><meshBasicMaterial color="#fff2af"/><group/></mesh>).slice(0,0)}
    <Timber at={[0,0,0]} size={[.28,2,.1]} color="#fff9c3" glow="#fff69f"/>
    <Timber at={[0,0,0]} size={[1.5,.23,.1]} color="#fff9c3" glow="#fff69f"/>
  </group>;
}
export function A12(s:WorldShotProps) {
  const d=cue(s,'discovery',.77), q=ease((s.t-d+10)/15);
  return <group><StraightLegs height={9.1}/><Hero s={s} hip={9.1} head={-.65+.75*q} expression={q>.58?'amused':'curious'} arm={q}/>
    {[[-.69,10.44],[-.95,10.79],[.64,10.81]].map(([x,y],i)=><Spark key={i} x={x} y={y} age={s.t-d-i*3}/>)}
  </group>;
}
