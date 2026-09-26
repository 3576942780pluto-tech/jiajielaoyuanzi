import * as T from './vendor/three.module.js';
import {PEOPLE,makeResident,makeScooter,shape,bar} from './residents.js?v=23.0';
import {movePlayer,surface,passable} from './navigation.js?v=23.0';
import {L} from './layout.js?v=23.0';

export async function createPromenade({courtyard,camera,controls,canvas,weather,getGateAngle,onGate}){
 const $=id=>document.getElementById(id),actorGroup=new T.Group();actorGroup.name='可操纵人物';courtyard.add(actorGroup);
 const scooter=makeScooter();courtyard.add(scooter.root);
 const fixtures=new T.Group();fixtures.name='门厅实体开关与灯具';courtyard.add(fixtures);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.55});
 const switches=[],lamps=[];
 const entries=[{label:'门厅灯',x:6.05,light:[6.4,2.80,8.3]},{label:'大门灯',x:6.49,light:[8.05,2.94,8.3]}];
 for(const item of entries){const g=new T.Group();g.position.set(item.x,1.30,L.hallNorth+.14);fixtures.add(g);
  shape(g,new T.BoxGeometry(.19,.26,.055),mat('#e6e2cf'));const rocker=shape(g,new T.BoxGeometry(.12,.17,.04),mat('#b7bdb7'),[0,0,.035]);
  const indicator=shape(g,new T.SphereGeometry(.013,10,8),mat('#e2ab4e'),[.055,.098,.031]);
  const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#f5f0e3';ctx.fillRect(0,0,256,64);ctx.fillStyle='#343d35';ctx.font='bold 40px Microsoft YaHei';ctx.textAlign='center';ctx.fillText(item.label,128,46);const tex=new T.CanvasTexture(labelCanvas);tex.colorSpace=T.SRGBColorSpace;
  shape(g,new T.PlaneGeometry(.37,.0925),new T.MeshBasicMaterial({map:tex}),[0,.22,.035]);
  const light=new T.PointLight('#ffe2a0',0,8,2);light.position.fromArray(item.light);fixtures.add(light);
  const glow=mat('#fff1c7');glow.emissive=new T.Color('#ffca72');const bulb=shape(fixtures,new T.SphereGeometry(.11,20,14),glow,item.light);shape(fixtures,new T.CylinderGeometry(.16,.20,.055,24),mat('#747b72'),[item.light[0],item.light[1]+.11,item.light[2]]);
  switches.push({g,rocker,indicator,label:item.label});lamps.push({light,bulb,on:false});g.traverse(o=>o.userData.switchIndex=switches.length-1);
 }
 function setLamp(i,on){const l=lamps[i];l.on=on;l.light.intensity=on?15:0;l.bulb.material.emissiveIntensity=on?2.2:0;switches[i].rocker.rotation.x=on?-.15:.15;switches[i].indicator.material.color.set(on?'#efba52':'#696d61');}
 function defaults(){lamps.forEach((_,i)=>setLamp(i,!weather.day));}
 let active=false,riding=false,resident=null,player={x:0,z:6,level:'yard'},selected=0,heading=Math.PI,clock=0,lastDay=weather.day;
 let previous=null,stick={x:0,y:0},pointer=null,keys=new Set(),lastPointer=null;
 for(const [id,name]of [['westStorage','西侧储物间与厕所'],['scooter','电动车近景']])$('viewpoints').add(new Option(name,id));
 resident=makeResident();actorGroup.add(resident.root);actorGroup.visible=false;
 function neutral(){stick={x:0,y:0};pointer=null;keys.clear();$('joystick-thumb').style.transform='translate(0,0)';}
 function setMode(value){active=value;neutral();riding=false;scooter.stand.visible=true;$('ride').textContent='骑电动车';$('ride').setAttribute('aria-pressed','false');
  if(active){previous={position:camera.position.clone(),target:controls.target.clone(),auto:controls.autoRotate};player={x:0,z:6,level:'yard'};heading=Math.PI;controls.autoRotate=false;controls.minDistance=2;controls.maxDistance=6;controls.maxPolarAngle=Math.PI*.48;controls.enablePan=false;camera.position.set(0,3.5,10);controls.target.set(0,1.1,6);defaults();}
  else{controls.minDistance=1.2;controls.maxDistance=65;controls.enablePan=true;if(previous){camera.position.copy(previous.position);controls.target.copy(previous.target);controls.autoRotate=previous.auto;}defaults();}
  actorGroup.visible=active;$('walk-controls').hidden=!active;$('walk').textContent=active?'结束逛院子':'逛一逛院子';$('walk').setAttribute('aria-pressed',active);$('ride').disabled=!active;$('viewpoints').disabled=active;$('rotate').disabled=active;$('rotate').textContent=controls.autoRotate?'暂停旋转':'自动旋转';document.body.classList.toggle('walking',active);controls.update();placeActor();}
 $('walk').onclick=()=>setMode(!active);
 const joy=$('joystick');function updateStick(e){const r=joy.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),radius=r.width*.31,factor=Math.min(radius,len)/Math.max(1,len);stick={x:dx*factor/radius,y:dy*factor/radius};$('joystick-thumb').style.transform=`translate(${dx*factor}px,${dy*factor}px)`;}
 joy.onpointerdown=e=>{e.preventDefault();pointer=e.pointerId;joy.setPointerCapture(pointer);updateStick(e);};joy.onpointermove=e=>{if(e.pointerId===pointer)updateStick(e);};joy.onpointerup=joy.onpointercancel=()=>neutral();joy.onlostpointercapture=()=>neutral();
 window.addEventListener('blur',neutral);document.addEventListener('visibilitychange',neutral);
 window.addEventListener('keydown',e=>{if(!active||/SELECT|INPUT|TEXTAREA|BUTTON/.test(document.activeElement.tagName))return;if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();keys.add(e.key);}});window.addEventListener('keyup',e=>keys.delete(e.key));
 function obstructed(x,z,bike=false){const r=bike?.30:.22,tree=courtyard.getObjectByName('东南梨树_独立枝叶与梨果');if(tree&&Math.hypot(x-tree.position.x,z-tree.position.z)<r+.20)return true;if(z<.1&&z>-3.65&&Math.abs(Math.abs(x)-2.34)<r+.04)return true;if(x<-.9&&x>-2.55&&z<.08&&z>-2.35)return true;if(!riding&&Math.abs(x-scooter.root.position.x)<.5&&Math.abs(z-scooter.root.position.z)<1.05)return true;return false;}
 function validBike(x,z){if(z<1.10||z>L.south-1.08)return false;for(const dx of [-.34,.34])for(const dz of [-.94,.94]){const xx=x+dx*Math.cos(heading)+dz*Math.sin(heading),zz=z-dx*Math.sin(heading)+dz*Math.cos(heading);if(!passable(xx,zz,getGateAngle())||obstructed(xx,zz,true))return false;}return true;}
 $('ride').onclick=()=>{if(!active)return;
  if(!riding){const pos=scooter.root.position;player={x:pos.x,z:pos.z,level:'yard'};heading=scooter.root.rotation.y;riding=true;scooter.stand.visible=false;}
  else{const candidates=[[.72,0],[-.72,0],[0,1.28],[0,-1.28]];const pos=candidates.map(([x,z])=>({x:player.x+x,z:player.z+z,level:'yard'})).find(p=>passable(p.x,p.z,getGateAngle())&&!obstructed(p.x,p.z));if(!pos){$('walk-status').textContent='这里空间不足，请移到空处下车';return;}player=pos;riding=false;scooter.stand.visible=true;}
  neutral();$('ride').textContent=riding?'下车':'骑电动车';$('ride').setAttribute('aria-pressed',riding);placeActor();const target=actorGroup.position.clone().add(new T.Vector3(0,1,0)),delta=target.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(target);};
 function placeActor(){if(!resident)return;actorGroup.position.set(player.x,surface(player.x,player.z,player.level),player.z);actorGroup.rotation.y=heading;resident.root.position.set(0,riding?.91-.84*resident.scale:0,riding?-.22:0);if(riding){scooter.root.position.copy(actorGroup.position);scooter.root.rotation.y=heading;}}
 const ray=new T.Raycaster(),mouse=new T.Vector2();
 canvas.addEventListener('pointerdown',e=>lastPointer=[e.clientX,e.clientY]);
 canvas.addEventListener('pointerup',e=>{if(!active||!lastPointer||Math.hypot(e.clientX-lastPointer[0],e.clientY-lastPointer[1])>7)return;const r=canvas.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects(switches.map(s=>s.g),true)[0];if(hit){const i=hit.object.userData.switchIndex,s=switches[i];if(Math.hypot(player.x-s.g.position.x,player.z-s.g.position.z)>2.2){$('walk-status').textContent='走近门厅开关后再操作';return;}setLamp(i,!lamps[i].on);$('walk-status').textContent=s.label+(lamps[i].on?'已打开':'已关闭');}});
 $('hall-gate').onclick=onGate;defaults();
 return {movingRoots:[actorGroup,scooter.root,fixtures],get active(){return active;},get riding(){return riding;},get player(){return {...player};},get lights(){return lamps.map(l=>l.on);},update(dt){
  if(lastDay!==weather.day){lastDay=weather.day;defaults();}if(!active)return;
  clock+=dt;let sx=stick.x,sy=stick.y;if(keys.has('w')||keys.has('ArrowUp'))sy-=1;if(keys.has('s')||keys.has('ArrowDown'))sy+=1;if(keys.has('a')||keys.has('ArrowLeft'))sx-=1;if(keys.has('d')||keys.has('ArrowRight'))sx+=1;const mag=Math.min(1,Math.hypot(sx,sy));
  let moved=0;if(mag>.10){const forward=camera.getWorldDirection(new T.Vector3());forward.y=0;forward.normalize();const right=new T.Vector3(-forward.z,0,forward.x),dir=forward.multiplyScalar(-sy).addScaledVector(right,sx).normalize(),wanted=Math.atan2(dir.x,dir.z);let turn=T.MathUtils.euclideanModulo(wanted-heading+Math.PI,Math.PI*2)-Math.PI;heading+=T.MathUtils.clamp(turn,-dt*(riding?1.7:7),dt*(riding?1.7:7));const speed=(riding?2.35:1.35)*mag,dx=(riding?Math.sin(heading):dir.x)*speed*dt,dz=(riding?Math.cos(heading):dir.z)*speed*dt;
   if(riding){if(validBike(player.x+dx,player.z+dz)){player.x+=dx;player.z+=dz;moved=Math.hypot(dx,dz);}}
   else{const p=movePlayer(player,dx,dz,getGateAngle());if(!obstructed(p.x,p.z)){moved=Math.hypot(p.x-player.x,p.z-player.z);player=p;}}
  }
  const old=actorGroup.position.clone();placeActor();resident.pose(clock,moved>.0001,riding);if(riding)for(const wheel of scooter.wheels)wheel.rotation.x+=moved/.245;
  const target=actorGroup.position.clone().add(new T.Vector3(0,1.15,0)),delta=target.clone().sub(controls.target);camera.position.add(delta);controls.target.copy(target);
  // Keep the follow camera out of side rooms and the southern wall.
  if(player.x<4.85){camera.position.x=T.MathUtils.clamp(camera.position.x,-4.75,4.75);camera.position.z=Math.min(camera.position.z,12.25);}else{camera.position.z=T.MathUtils.clamp(camera.position.z,L.hallNorth+.3,L.hallSouth-.3);}
  camera.position.y=Math.max(camera.position.y,actorGroup.position.y+.65);
  const nearby=switches.findIndex(s=>Math.hypot(player.x-s.g.position.x,player.z-s.g.position.z)<2.2);
  if(nearby>=0)$('walk-status').textContent=`${switches[nearby].label} · ${lamps[nearby].on?'开':'关'}`;else $('walk-status').textContent=riding?'骑行中':PEOPLE[selected].name;
 },setMode};
}
