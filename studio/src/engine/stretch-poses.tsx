import React from 'react';
import { Timber } from './sets/world-interiors';

type Point = [number,number];
function DenimLink({from,to,z,width}: {from:Point;to:Point;z:number;width:number}) {
  const dx=to[0]-from[0], dy=to[1]-from[1];
  const length=Math.hypot(dx,dy);
  return <group position={[(to[0]+from[0])/2,(to[1]+from[1])/2,z]} rotation={[0,0,Math.atan2(-dx,dy)]}>
    <Timber at={[0,0,0]} size={[width,length,.39]} color="#4782bb"/>
    <Timber at={[-width*.33,0,.197]} size={[.018,length*.96,.006]} color="#72a1ca"/>
  </group>;
}

/** Both knees bend in the direction the seated character faces. */
export function SeatedDenimLegs({hipX,hipY,kneeX,kneeY,ankleX}: {
  hipX:number;hipY:number;kneeX:number;kneeY:number;ankleX:number;
}) {
  return <group>{[-.225,.225].map(z=><group key={z}>
    <DenimLink from={[hipX,hipY]} to={[kneeX,kneeY]} z={z} width={.41}/>
    <DenimLink from={[kneeX,kneeY]} to={[ankleX,.31]} z={z} width={.39}/>
    <mesh position={[kneeX,kneeY,z]} scale={[.221,.22,.202]} castShadow>
      <sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#4782bb"/>
    </mesh>
    <Timber at={[ankleX+.11,.18,z]} size={[.64,.28,.4]} color="#f0ede3"/>
    <Timber at={[ankleX+.11,.055,z]} size={[.66,.085,.414]} color="#b3c1cd"/>
  </group>)}</group>;
}

/** Stripes follow the cloth down the length of each leg. The anchored hips and
 * bed coordinates stay identical across the interior/exterior cut. */
export function PajamaSleeper({length,kick,swipe}: {length:number;kick:number;swipe:number}) {
  const shirt='#69bd89',skin='#c89063';
  const hipZ=-3.18, hipY=1.53, thigh=length*.46, shin=length-thigh;
  function cloth(segment:number,width:number) {
    return <group>
      <Timber at={[0,0,segment/2]} size={[width,.39,segment]} color={shirt}/>
      {[-.14,-.04,.06,.16].map(x=><Timber key={x} at={[x,.197,segment/2]} size={[.026,.01,segment]} color="#c3e4ae"/>)}
    </group>;
  }
  return <group>
    <Timber at={[0,1.54,-3.83]} size={[.95,.51,1.39]} color={shirt}/>
    <group position={[0,1.78,-4.64]} rotation={[-.38,.06,0]}>
      <Timber at={[0,0,0]} size={[.63,.56,.61]} color={skin}/>
      <Timber at={[0,.27,-.03]} size={[.67,.12,.63]} color="#593923"/>
      <Timber at={[-.25,.19,.29]} size={[.18,.19,.08]} color="#674027" rotation={[0,0,-.22]}/>
      {[-.14,.14].map(x=><Timber key={x} at={[x,.04,.312]} size={[.072,.035,.015]} color="#412e2a"/>)}
      <Timber at={[0,-.1,.311]} size={[.11,.021,.012]} color="#804f43"/>
    </group>
    {[-1,1].map(s=><group key={s}>
      <group position={[s*.53,1.62,-4.11]} rotation={[-.5,0,-s*.22]}>
        <Timber at={[0,.16,.07]} size={[.31,.45,.36]} color={shirt}/>
        <Timber at={[0,.47,.05]} size={[.26,.22,.27]} color={skin}/>
        {s<0 && <group position={[0,.53,.15]} rotation={[-.16+swipe*.12,0,0]}>
          <Timber at={[0,0,0]} size={[.26,.44,.048]} color="#272c40"/>
          <Timber at={[0,0,.028]} size={[.22,.35,.015]} color="#a6dfed" glow="#71c3d5"/>
        </group>}
      </group>
      <group position={[s*.226,hipY,hipZ]}>
        {cloth(thigh,.437)}
        <group position={[0,0,thigh]} rotation={[-kick,0,0]}>
          {cloth(shin,.43)}
          <Timber at={[0,.025,shin+.09]} size={[.436,.39,.23]} color="#ecf4df"/>
          <Timber at={[0,.02,shin+.221]} size={[.386,.34,.038]} color="#9fa6ab"/>
        </group>
      </group>
    </group>)}
  </group>;
}
