import React from 'react';
import {BackSide} from 'three';

const vertex = `
varying vec3 direction;
void main() { direction = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fragment = `
varying vec3 direction;
uniform float night;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);
}
void main() {
  vec3 ray=normalize(direction);
  float h=max(ray.y,0.);
  vec3 horizon=mix(vec3(.54,.83,.99),vec3(.046,.062,.15),night);
  vec3 high=mix(vec3(.10,.56,.99),vec3(.012,.019,.060),night);
  vec3 sky=mix(horizon,high,smoothstep(0.,.73,h));
  vec2 p=ray.xz/(h+.12)*1.7+vec2(11.4,4.9);
  float density=noise(p)*.53+noise(p*2.1)*.29+noise(p*4.3)*.12+noise(p*8.7)*.06;
  float clouds=smoothstep(.52,.70,density)*smoothstep(.018,.17,h);
  sky=mix(sky,mix(vec3(.96,.985,1.),vec3(.14,.17,.25),night),clouds*.82);
  gl_FragColor=vec4(sky,1.);
  #include <colorspace_fragment>
}
`;

/** A frame-independent sky anchored to the camera, so a long move cannot reach its edge. */
export function WorldSky({position,night}: {position:[number,number,number];night:boolean}) {
  return <mesh position={position} renderOrder={-100}>
    <sphereGeometry args={[83,24,16]}/>
    <shaderMaterial vertexShader={vertex} fragmentShader={fragment} uniforms={{night:{value:night?1:0}}} side={BackSide} depthWrite={false}/>
  </mesh>;
}
