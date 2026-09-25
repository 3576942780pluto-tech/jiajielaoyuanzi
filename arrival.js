import * as T from './vendor/three.module.js';
import {beveledBox} from './solid-materials.js?v=18.1';

export function createArrival({renderer,scene,camera,courtyard,controls,host}){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const overlay=document.getElementById('arrival'),open=document.getElementById('arrival-open'),skip=document.getElementById('arrival-skip'),caption=document.getElementById('arrival-caption');
 const canvas=renderer.domElement,originalCamera=camera.position.clone(),originalTarget=controls.target.clone();
 const stage=new T.Scene();stage.background=new T.Color('#090807');stage.environment=scene.environment;stage.environmentIntensity=.13;
 const eye=new T.PerspectiveCamera(38,innerWidth/innerHeight,.03,200);eye.position.set(5,5.4,7.5);eye.lookAt(0,.1,0);
 const initialEye=eye.position.clone(),initialTarget=new T.Vector3(0,.1,0);
 const suitcase=new T.Group();stage.add(suitcase);
 const leather=new T.MeshStandardMaterial({color:'#48271c',roughness:.48,metalness:0});
 leather.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 hidePosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nhidePosition=position;');s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 hidePosition;\nfloat leatherGrain(vec3 p){return fract(sin(dot(floor(p),vec3(127.1,311.7,74.7)))*43758.5453);}').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+(leatherGrain(hidePosition*850.)-.5)*.18,.25,.8);').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=.91+.13*leatherGrain(hidePosition*680.);');};
 const trim=new T.MeshStandardMaterial({color:'#281812',roughness:.54}),brass=new T.MeshStandardMaterial({color:'#b59a62',metalness:.85,roughness:.26}),lining=new T.MeshStandardMaterial({color:'#39312b',roughness:.95});
 const resources=[];
 function block(w,h,d,x,y,z,m,parent=suitcase,r=.04){const geo=beveledBox(w,h,d,Math.min(r,w*.2,h*.2,d*.2)).clone();resources.push(geo);const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 // Open hollow base, with a padded lining beneath the actual courtyard geometry.
 block(3.9,.17,3.3,0,.04,0,leather);block(3.65,.05,3.08,0,.145,0,lining);
 for(const x of [-1.89,1.89])block(.14,.39,3.3,x,.23,0,leather);
 for(const z of [-1.59,1.59])block(3.78,.39,.14,0,.23,z,leather);
 const lid=new T.Group();lid.position.set(0,.43,-1.62);suitcase.add(lid);
 block(3.9,.19,3.3,0,.045,1.62,leather,lid);block(3.62,.035,3.02,0,-.063,1.62,lining,lid);
 for(const x of [-1.3,1.3]){block(.22,.025,3.27,x,.153,1.62,trim,lid);block(.25,.39,.025,x,.23,1.667,trim);block(.30,.20,.055,x,.33,1.69,brass);block(.19,.12,.025,x,.33,1.727,trim);}
 // Piping, saddle stitches, brass corners, hinges and a curved leather carry handle.
 function line(points,r,m,parent){const g=new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),64,r,6,false);resources.push(g);const o=new T.Mesh(g,m);o.castShadow=true;parent.add(o);}
 line([[-1.84,.13,.12],[-1.84,.13,3.12],[1.84,.13,3.12],[1.84,.13,.12],[-1.84,.13,.12]],.014,trim,lid);
 const stitchMat=new T.MeshStandardMaterial({color:'#b2946c',roughness:.9}),sg=new T.BoxGeometry(.027,.005,.005);resources.push(sg);const stitches=new T.InstancedMesh(sg,stitchMat,260);const dummy=new T.Object3D();let count=0;
 for(const z of [.16,3.08])for(let x=-1.77;x<1.78;x+=.055){dummy.position.set(x,.148,z);dummy.rotation.y=0;dummy.updateMatrix();stitches.setMatrixAt(count++,dummy.matrix);}
 for(const x of [-1.79,1.79])for(let z=.20;z<3.08;z+=.055){dummy.position.set(x,.148,z);dummy.rotation.y=Math.PI/2;dummy.updateMatrix();stitches.setMatrixAt(count++,dummy.matrix);}stitches.count=count;lid.add(stitches);
 for(const x of [-1.8,1.8])for(const z of [.16,3.08])block(.22,.025,.20,x,.154,z,brass,lid,.035);
 for(const x of [-1.1,1.1])block(.35,.12,.13,x,.42,-1.63,brass);
 line([[-.48,.28,1.68],[-.48,.27,1.95],[-.32,.26,2.05],[.32,.26,2.05],[.48,.27,1.95],[.48,.28,1.68]],.065,leather,suitcase);
 for(const x of [-.48,.48])block(.17,.13,.05,x,.28,1.7,brass);
 const floor=block(200,.1,200,0,-.13,0,new T.MeshStandardMaterial({color:'#0d0b09',roughness:.63}),stage,.01);
 const light=new T.SpotLight(0xffe6c1,110,35,.47,.8,1.3);light.position.set(-1,8,3);light.target.position.set(0,0,0);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.bias=-.00015;stage.add(light,light.target);
 const fill=new T.HemisphereLight(0xe0d5c7,0x17100b,.14);stage.add(fill);
 const daylight=scene.children.filter(o=>o.isLight).map(o=>{const copy=o.clone();copy.castShadow=false;const power=o.intensity;copy.intensity=0;stage.add(copy);return {copy,power};});
 const model=new T.Group();model.scale.setScalar(.103);model.position.set(0,.22,-.24);stage.add(model);model.add(courtyard);courtyard.visible=false;
 let state='enter',started=null,phase=0,finished=false,lastNow=0;
 const ease=t=>t*t*(3-2*t),clamp=t=>Math.max(0,Math.min(1,t));
 const page=[document.querySelector('header'),document.querySelector('main')];page.forEach(e=>e.inert=true);document.body.classList.add('arriving');controls.enabled=false;
 open.disabled=true;caption.textContent='一只行囊，装着四代人的故乡。';
 function start(){if(state!=='ready')return;state='open';phase=lastNow;open.disabled=true;open.classList.add('depart');caption.textContent='院子还在，回忆就有了归处。';}
 function finish(){if(finished)return;finished=true;scene.add(courtyard);courtyard.visible=true;model.removeFromParent();canvas.removeAttribute('style');document.body.classList.remove('arriving');page.forEach(e=>e.inert=false);overlay.remove();camera.position.copy(originalCamera);controls.target.copy(originalTarget);controls.enabled=true;controls.autoRotate=false;const rotate=document.getElementById('rotate');rotate.textContent='自动旋转';rotate.setAttribute('aria-pressed','false');controls.update();renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();document.getElementById('orbit').focus({preventScroll:true});open.removeEventListener('click',start);skip.removeEventListener('click',finish);resources.forEach(g=>g.dispose());[leather,trim,brass,lining,stitchMat,floor.material].forEach(m=>m.dispose());light.shadow.map?.dispose();}
 open.addEventListener('click',start);skip.addEventListener('click',finish);
 return {update(now){if(finished)return false;lastNow=now;if(started===null)started=now;const elapsed=(now-started)/1000;
  if(state==='enter'){const t=clamp(elapsed/(reduced?.25:2.3));suitcase.position.y=(1-ease(t))*3.7;suitcase.rotation.set((1-t)*.20,(1-ease(t))*-.35,(1-t)*.12);if(t===1){state='ready';open.disabled=false;caption.textContent='点击手提箱，打开家的记忆';}}
  if(state==='open'){const t=clamp((now-phase)/(reduced?250:1600));lid.rotation.x=-ease(t)*Math.PI*.64;courtyard.visible=t>.18;if(t===1){state='hold';phase=now;}}
  if(state==='hold'&&now-phase>=1000){state='travel';phase=now;overlay.classList.add('travelling');}
  initialEye.set(5,5.4,7.5).multiplyScalar(Math.max(1,1.05/(innerWidth/innerHeight)));
  if(state!=='travel'){eye.position.copy(initialEye);eye.lookAt(initialTarget);}
  let travel=state==='travel'?ease(clamp((now-phase)/(reduced?350:2400))):0;
  if(state==='travel'){
   model.scale.setScalar(T.MathUtils.lerp(.103,1,travel));model.position.set(0,.22*(1-travel),-.24*(1-travel));
   eye.position.lerpVectors(initialEye,originalCamera,travel);eye.lookAt(initialTarget.clone().lerp(originalTarget,travel));
   suitcase.position.y=-travel*5;stage.background.copy(new T.Color('#090807')).lerp(scene.background,travel);
   fill.intensity=.14*(1-travel);light.intensity=110*(1-travel);daylight.forEach(({copy,power})=>copy.intensity=power*travel);stage.environmentIntensity=T.MathUtils.lerp(.13,.65,travel);
   floor.material.transparent=true;floor.material.opacity=1-travel;document.body.style.setProperty('--arrival-reveal',travel);
   if(travel>=1){finish();return false;}
  }
  overlay.dataset.phase=state;
  const rect=host.getBoundingClientRect(),x=rect.left*travel,y=rect.top*travel,w=T.MathUtils.lerp(innerWidth,rect.width,travel),h=T.MathUtils.lerp(innerHeight,rect.height,travel);
  Object.assign(canvas.style,{position:'fixed',left:x+'px',top:y+'px',width:w+'px',height:h+'px',zIndex:'40'});if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);eye.aspect=w/h;eye.updateProjectionMatrix();renderer.render(stage,eye);return true;
 }};
}
