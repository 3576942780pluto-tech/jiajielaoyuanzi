// Analytic surface shading: no photograph, bitmap, canvas or image sampler.
export function surfaceShading(root){
 const materials=new Set();root.traverse(o=>{if(o.isMesh)materials.add(o.material);});
 for(const m of materials){
  if(m.transparent||m.userData.surface==='paper')continue;
  const ceramic=m.userData.surface==='ceramic',leaf=m.userData.surface==='leaf',metal=m.metalness>.5,wood=m.userData.surface==='wood',paint=m.userData.surface==='paint';
  m.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSolidPosition;');
   shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`#include <project_vertex>
    vec4 sp=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
    sp=instanceMatrix*sp;
    #endif
    vSolidPosition=(modelMatrix*sp).xyz;`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
    varying vec3 vSolidPosition;
    float shash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float snoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(shash(i),shash(i+vec3(1,0,0)),f.x),mix(shash(i+vec3(0,1,0)),shash(i+vec3(1,1,0)),f.x),f.y),mix(mix(shash(i+vec3(0,0,1)),shash(i+vec3(1,0,1)),f.x),mix(shash(i+vec3(0,1,1)),shash(i+vec3(1,1,1)),f.x),f.y),f.z);}`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float grain=snoise(vSolidPosition*${ceramic?'90.0':leaf?'55.0':'140.0'});
    float mineral=snoise(vSolidPosition*5.0);
    diffuseColor.rgb*= ${metal||paint?'0.99+0.01*grain':ceramic?'0.975+0.035*grain':leaf?'0.94+0.09*grain':'0.91+0.07*mineral+0.06*grain'};`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
    roughnessFactor=clamp(roughnessFactor+(snoise(vSolidPosition*${metal?'vec3(1600.0,180.0,1600.0)':'vec3(42.0)'})-.5)*${metal?'.024':ceramic?'.08':'.14'},.055,.98);`);
   if(!leaf)shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
    float relief=snoise(vSolidPosition*${metal?'vec3(1600.0,180.0,1600.0)':wood?'vec3(160.0,4.0,160.0)':'vec3(220.0)'})*${metal?'0.000004':paint?'0.000025':wood?'0.00005':ceramic?'0.000035':'0.0006'};
    vec3 sx=dFdx(-vViewPosition),sy=dFdy(-vViewPosition);
    vec3 rx=cross(sy,normal),ry=cross(normal,sx);
    float determinant=dot(sx,rx);
    normal=normalize(abs(determinant)*normal-sign(determinant)*(dFdx(relief)*rx+dFdy(relief)*ry));`);
  };
  m.customProgramCacheKey=()=>`solid-analytic-relief-v15-${ceramic}-${leaf}-${metal}-${wood}-${paint}`;
 }
}
