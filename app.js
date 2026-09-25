import {createArrival} from './arrival.js?v=18.1';
import {createWeather} from './weather.js?v=18.1';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import {surface,movePlayer} from './navigation.js?v=18.1';
import {L,VIEWS} from './layout.js?v=18.1';
import {batchStatic} from './render-batch.js?v=18.1';
import {buildCourtyard} from './model.js?v=18.1';

const $=id=>document.getElementById(id), host=$('scene');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e3dfd6');
const camera=new THREE.PerspectiveCamera(45,1,.08,180);camera.position.fromArray(VIEWS.overview.position);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true});}catch(e){document.getElementById('arrival')?.remove();$('loading').textContent='当前设备无法启动三维画面，请在支持 WebGL 的浏览器中打开。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(VIEWS.overview.target);controls.enableDamping=true;controls.minDistance=1.2;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.48;controls.autoRotate=!matchMedia('(prefers-reduced-motion: reduce)').matches;controls.autoRotateSpeed=.35;
scene.add(new THREE.HemisphereLight(0xf7f9ff,0x777b76,1.2));const sun=new THREE.DirectionalLight(0xfffbf5,3);sun.position.set(12,25,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});sun.shadow.bias=-.0004;scene.add(sun);
const {root:courtyard,gateLeaves}=buildCourtyard(scene);
// Rendered studio sky for physical reflections; no external environment image.
const reflectionScene=new THREE.Scene();reflectionScene.background=new THREE.Color('#b9c6d1');
const dome=new THREE.Mesh(new THREE.SphereGeometry(35,24,12),new THREE.MeshBasicMaterial({color:'#c0cbd5',side:THREE.BackSide}));reflectionScene.add(dome);
for(const [x,y,z,w,h]of [[-12,12,5,15,10],[14,8,-10,7,15],[0,25,0,20,20]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:'#fff8e9',side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);reflectionScene.add(p);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(reflectionScene,.08).texture;scene.environmentIntensity=.65;pmrem.dispose();
const weather=createWeather({scene,courtyard,sun});
batchStatic(courtyard,[...gateLeaves.map(g=>g.pivot),...weather.movingRoots]);

const arrival=createArrival({renderer,scene,camera,courtyard,controls,host});
let playerLevel='yard';
let mode='orbit', gateOpen=false,gateAngle=0,yaw=Math.PI/2,pitch=0;const keys=new Set();const player=new THREE.Vector3(L.spawn.x,surface(L.spawn.x,L.spawn.z)+1.62,L.spawn.z);let dragging=null;
function setMode(next){keys.clear();mode=next;$('viewpoints').parentElement.hidden=mode==='walk';controls.enabled=mode==='orbit';$('orbit').classList.toggle('selected',mode==='orbit');$('walk').classList.toggle('selected',mode==='walk');$('orbit').setAttribute('aria-pressed',mode==='orbit');$('walk').setAttribute('aria-pressed',mode==='walk');$('walkpad').hidden=mode!=='walk';$('mode-label').textContent=mode==='walk'?'步行漫游':'院落全景';$('hint').textContent=mode==='walk'?'方向键行走 · 拖动画面环顾':'拖动旋转 · 滚轮或双指缩放';$('rotate').disabled=mode==='walk';reset();if(innerWidth<=650)host.scrollIntoView({block:'start',behavior:'instant'});}
function reset(){if(mode==='walk'){playerLevel='yard';player.set(L.spawn.x,surface(L.spawn.x,L.spawn.z)+1.62,L.spawn.z);yaw=Math.PI/2;pitch=0;}else{$('viewpoints').value='overview';camera.position.fromArray(VIEWS.overview.position);controls.target.fromArray(VIEWS.overview.target);controls.update();}}
function toggleGate(){if(gateOpen&&mode==='walk'&&Math.abs(player.x-L.gateX)<1.4&&Math.abs(player.z-L.gateZ)<1.5){$('hint').textContent='先离开门扇附近，再关门';return;}gateOpen=!gateOpen;for(const id of ['gate','walk-gate']){$(id).textContent=gateOpen?'关闭大门':'打开大门';$(id).setAttribute('aria-pressed',gateOpen);}}
$('orbit').onclick=()=>setMode('orbit');$('walk').onclick=()=>setMode('walk');$('reset').onclick=reset;$('gate').onclick=toggleGate;
$('walk-gate').onclick=toggleGate;
$('rotate').textContent=controls.autoRotate?'暂停旋转':'自动旋转';$('rotate').setAttribute('aria-pressed',controls.autoRotate);$('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').textContent=controls.autoRotate?'暂停旋转':'自动旋转';$('rotate').setAttribute('aria-pressed',controls.autoRotate);};
const keyMap={ArrowUp:'w',ArrowDown:'s',ArrowLeft:'a',ArrowRight:'d'};
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const k=keyMap[e.key]||e.key.toLowerCase();if(mode==='walk'&&['w','a','s','d'].includes(k)){e.preventDefault();keys.add(k);}if(k==='e'&&!e.repeat)toggleGate();});addEventListener('keyup',e=>keys.delete(keyMap[e.key]||e.key.toLowerCase()));addEventListener('blur',()=>{keys.clear();dragging=null;});document.addEventListener('visibilitychange',()=>{keys.clear();dragging=null;});
renderer.domElement.addEventListener('pointerdown',e=>{if(mode==='walk'){dragging={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}});renderer.domElement.addEventListener('pointermove',e=>{if(dragging?.id===e.pointerId&&mode==='walk'){yaw-=(e.clientX-dragging.x)*.004;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-dragging.y)*.004,-1.1,1.1);dragging.x=e.clientX;dragging.y=e.clientY;}});for(const ev of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(ev,()=>dragging=null);
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(b.dataset.key);b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.key));});
const photos=[['north','北向全景','北房：窗—门—窗—窗—门—窗；最外侧两窗依据家人补充。地下室门前平地，进门后下沉。'],['steps','台阶与花盆','桶与植物的位置以项目说明为准，小石榴树来自家人的补充记忆。'],['gate','门面','蓝色户牌、白色牛奶箱、灯笼与黑色双扇门；题字、福字和对联采用实体轮廓网格；照片仅用于外形参考，细小笔画仍待核对。'],['south','向南望院子','从北侧台阶向南看，照片右侧为西侧；厕所位于西南角。'],['plan','结构核对','依据最新平面图修订：西侧窗门门窗厕所；东侧窗门窗门厅门；杂物道入口靠西。水池沿高7厘米，其他尺寸仍待校准。']];
function showPhoto(i){const [file,title,caption]=photos[i];$('photo-image').src=`./assets/${file}.${['plan','west-spacing'].includes(file)?'svg':'jpg'}`;$('photo-image').alt=title;$('photo-caption').textContent=caption;$('zoom-plan').hidden=!['plan','west-spacing'].includes(file);$('photo-frame').classList.remove('enlarged');$('zoom-plan').textContent='放大结构图';$('zoom-plan').setAttribute('aria-pressed','false');[...$('photo-tabs').children].forEach((b,k)=>b.classList.toggle('selected',k===i));}
photos.push(['gate-open','开门对景','门洞内对面为带门帘的住宅门组合；已由家人确认为西侧门2；准确中心偏移仍待校准。'],['gate-side','门外小坡','小斜坡连接门槛与外侧地面；当前坡长与落差为照片推定。']);
photos.push(['west-spacing','西侧间距','北到南：窗1—门1—门2—窗2—厕所。墙段净距暂为0.75、0.45、0.40、0.60米；非实测。']);
photos.forEach((p,i)=>{const b=document.createElement('button');b.textContent=p[1];b.onclick=()=>showPhoto(i);$('photo-tabs').append(b);});
$('photos').onclick=()=>{keys.clear();showPhoto(0);$('photo-dialog').showModal();};$('about').onclick=()=>{keys.clear();$('about-dialog').showModal();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('viewpoints').onchange=()=>{const selected=$('viewpoints').value;if(mode!=='orbit')setMode('orbit');$('viewpoints').value=selected;const v=VIEWS[selected];controls.autoRotate=false;$('rotate').textContent='自动旋转';$('rotate').setAttribute('aria-pressed','false');camera.position.fromArray(v.position);controls.target.fromArray(v.target);controls.update();renderer.render(scene,camera);};
$('plan').onclick=()=>{keys.clear();showPhoto(4);$('photo-dialog').showModal();};
$('zoom-plan').onclick=()=>{const enlarged=$('photo-frame').classList.toggle('enlarged');$('zoom-plan').textContent=enlarged?'查看全图':'放大结构图';$('zoom-plan').setAttribute('aria-pressed',enlarged);};
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(host);
let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;if(arrival.update(now))return;weather.update(now/1000,dt,camera);gateAngle=THREE.MathUtils.damp(gateAngle,gateOpen?1.55:0,5,dt);for(const {pivot,s}of gateLeaves)pivot.rotation.y=-s*gateAngle;
if(mode==='orbit')controls.update(dt);else{let forward=(keys.has('w')?1:0)-(keys.has('s')?1:0),side=(keys.has('d')?1:0)-(keys.has('a')?1:0);const len=Math.hypot(forward,side)||1;forward/=len;side/=len;const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*dt*2.4,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*dt*2.4;const next=movePlayer({x:player.x,z:player.z,level:playerLevel},dx,dz,gateAngle);player.x=next.x;player.z=next.z;playerLevel=next.level||'yard';player.y=THREE.MathUtils.damp(player.y,surface(player.x,player.z,playerLevel)+1.62,16,dt);camera.position.copy(player);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw,0);}
$('north').style.transform=`rotate(${mode==='walk'?yaw:controls.getAzimuthalAngle()}rad)`;renderer.render(scene,camera);}
requestAnimationFrame(animate);$('loading').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='三维画面暂时中断，请刷新页面重新进入。';});
