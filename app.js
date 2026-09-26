import {createArrival} from './arrival.js?v=23.0';
import {createWeather} from './weather.js?v=23.0';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import {L,VIEWS} from './layout.js?v=23.0';
import {batchStatic} from './render-batch.js?v=23.0';
import {buildCourtyard} from './model.js?v=23.0';
import {createPromenade} from './promenade.js?v=23.0';

const $=id=>document.getElementById(id), host=$('scene');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e3dfd6');
const camera=new THREE.PerspectiveCamera(45,1,.08,180);camera.position.fromArray(VIEWS.overview.position);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}catch(e){document.getElementById('arrival')?.remove();$('loading').textContent='当前设备无法启动三维画面，请在支持 WebGL 的浏览器中打开。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(VIEWS.overview.target);controls.enableDamping=true;controls.minDistance=1.2;controls.maxDistance=65;controls.maxPolarAngle=Math.PI*.48;controls.autoRotate=true;controls.autoRotateSpeed=.525;
scene.add(new THREE.HemisphereLight(0xf7f9ff,0x777b76,1.2));const sun=new THREE.DirectionalLight(0xfffbf5,3);sun.position.set(12,25,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:70});sun.shadow.bias=-.0004;scene.add(sun);
await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
document.getElementById('memory-progress').textContent='正在整理院落与手提箱…';
const {root:courtyard,gateLeaves}=buildCourtyard(scene);
// Rendered studio sky for physical reflections; no external environment image.
const reflectionScene=new THREE.Scene();reflectionScene.background=new THREE.Color('#b9c6d1');
const dome=new THREE.Mesh(new THREE.SphereGeometry(35,24,12),new THREE.MeshBasicMaterial({color:'#c0cbd5',side:THREE.BackSide}));reflectionScene.add(dome);
for(const [x,y,z,w,h]of [[-12,12,5,15,10],[14,8,-10,7,15],[0,25,0,20,20]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:'#fff8e9',side:THREE.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);reflectionScene.add(p);}
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(reflectionScene,.08).texture;scene.environmentIntensity=.65;pmrem.dispose();
const weather=createWeather({scene,courtyard,sun});
controls.rotateSpeed=.30;controls.zoomSpeed=.65;controls.panSpeed=.45;
const promenade=await createPromenade({courtyard,camera,controls,canvas:renderer.domElement,weather,getGateAngle:()=>gateAngle,onGate:()=>document.getElementById('gate').click()});
batchStatic(courtyard.getObjectByName('东南梨树_独立枝叶与梨果'),[]);
batchStatic(courtyard,[...gateLeaves.map(g=>g.pivot),...weather.movingRoots,...promenade.movingRoots]);
if(new URLSearchParams(location.search).has('qa'))window.courtyardQA={scene,camera,controls,courtyard,weather,promenade,renderer};

await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
frameView('overview');
const arrival=createArrival({renderer,scene,camera,courtyard,controls,host,environment:weather.environment});
function frameView(name){const v=VIEWS[name];controls.target.fromArray(v.target);camera.position.fromArray(v.position);if(name==='overview'||name==='top'){const fit=Math.min(2,Math.max(1,1.12/(host.clientWidth/host.clientHeight)));camera.position.sub(controls.target).multiplyScalar(fit).add(controls.target);}controls.update();}
let gateOpen=false,gateAngle=0;
const rotate=$('rotate');rotate.textContent='暂停旋转';
$('gate').onclick=()=>{gateOpen=!gateOpen;$('gate').textContent=gateOpen?'关闭大门':'打开大门';$('gate').setAttribute('aria-pressed',gateOpen);};
rotate.onclick=()=>{controls.autoRotate=!controls.autoRotate;rotate.textContent=controls.autoRotate?'暂停旋转':'自动旋转';rotate.setAttribute('aria-pressed',controls.autoRotate);};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());
$('viewpoints').onchange=()=>{const v=VIEWS[$('viewpoints').value];controls.autoRotate=false;rotate.textContent='自动旋转';rotate.setAttribute('aria-pressed','false');frameView($('viewpoints').value);};
new ResizeObserver(()=>{if(document.body.classList.contains('arriving'))return;const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);if(!promenade.active&&['overview','top'].includes($('viewpoints').value))frameView($('viewpoints').value);}).observe(host);
let last=performance.now();function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.04);last=now;if(document.hidden)return;if(arrival.update(now))return;weather.update(now/1000,dt,camera);promenade.update(dt);if(promenade.active||Math.abs(gateAngle-(gateOpen?1.55:0))>.001||now-(renderer.userDataShadowTime||0)>1000){renderer.shadowMap.needsUpdate=true;renderer.userDataShadowTime=now;}gateAngle=THREE.MathUtils.damp(gateAngle,gateOpen?1.55:0,5,dt);for(const {pivot,s}of gateLeaves)pivot.rotation.y=-s*gateAngle;controls.update(dt);$('north').style.transform=`rotate(${controls.getAzimuthalAngle()}rad)`;renderer.render(scene,camera);}
requestAnimationFrame(animate);$('loading').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='三维画面暂时中断，请刷新页面重新进入。';});
