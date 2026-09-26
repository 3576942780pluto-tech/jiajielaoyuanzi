import * as T from './vendor/three.module.js';
import {createSkyEnvironment} from './sky-environment.js?v=23.0';
import {surface} from './navigation.js?v=23.0';
import './vendor/suncalc.js';
export function weatherKind(code){return [71,73,75,77,85,86].includes(code)?'snow':[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)?'rain':code===0||code===1?'sun':'cloud';}
export function seasonFor(month){return month>=3&&month<=5?'春':month>=6&&month<=8?'夏':month>=9&&month<=11?'秋':'冬';}
export function weatherLabel(code){return ({0:'晴',1:'少云',2:'多云',3:'阴',45:'雾',48:'雾凇',51:'小毛毛雨',53:'毛毛雨',55:'强毛毛雨',56:'冻毛毛雨',57:'冻毛毛雨',61:'小雨',63:'中雨',65:'大雨',66:'冻雨',67:'强冻雨',71:'小雪',73:'中雪',75:'大雪',77:'米雪',80:'阵雨',81:'中阵雨',82:'强阵雨',85:'阵雪',86:'强阵雪',95:'雷雨',96:'雷雨伴冰雹',99:'雷雨伴强冰雹'})[code]||'天气状态未知';}
export function validateCurrent(c){if(!c||!Number.isFinite(c.temperature_2m)||!Number.isFinite(c.weather_code)||!Number.isFinite(c.wind_speed_10m)||!Number.isFinite(c.wind_direction_10m)||![0,1].includes(c.is_day)||!Number.isFinite(c.time))throw Error('天气数据不完整');return c;}
export function createWeather({scene,courtyard,sun}){
 const skyEnvironment=createSkyEnvironment(scene);
 const panel=document.getElementById('weather-panel'),dateEl=document.getElementById('weather-date'),summary=document.getElementById('weather-summary'),status=document.getElementById('weather-status'),select=document.getElementById('weather-mode');
 const flags=[];courtyard.traverse(o=>{if(o.name==='门楣挂笺'||o.name.startsWith('实体印纹_banner'))flags.push(o);});
 const cloth=[];for(const root of flags)root.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();if(o.name==='门楣挂笺'){
  let arr=Array.from((o.geometry.index?o.geometry.toNonIndexed():o.geometry).attributes.position.array);
  for(let level=0;level<4;level++){const next=[];for(let i=0;i<arr.length;i+=9){const a=arr.slice(i,i+3),b=arr.slice(i+3,i+6),c=arr.slice(i+6,i+9),ab=a.map((x,k)=>(x+b[k])/2),bc=b.map((x,k)=>(x+c[k])/2),ca=c.map((x,k)=>(x+a[k])/2);next.push(...a,...ab,...ca,...ab,...b,...bc,...ca,...bc,...c,...ab,...bc,...ca);}arr=next;}
  o.geometry.dispose();o.geometry=new T.BufferGeometry();o.geometry.setAttribute('position',new T.Float32BufferAttribute(arr,3));o.geometry.computeVertexNormals();
 }cloth.push({o,phase:root.position.x*3,base:o.geometry.attributes.position.array.slice()});});
 const leaves=new Map();courtyard.traverse(o=>{if(o.isMesh&&o.material.userData.surface==='leaf'&&!leaves.has(o.material))leaves.set(o.material,o.material.color.clone());});
 const group=new T.Group();group.name='实时天气';scene.add(group);
 const N=9000,positions=new Float32Array(N*6),snowPos=new Float32Array(N*3),seed=new Float32Array(N*3);for(let i=0;i<N;i++){const radius=i<3500?24:90,ceiling=i<3500?24:50;seed[i*3]=(Math.random()*2-1)*radius;seed[i*3+1]=Math.random()*ceiling-1.8;seed[i*3+2]=(Math.random()*2-1)*radius;}
 const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(positions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xb9d1de,transparent:true,opacity:.5,depthWrite:false}));rain.frustumCulled=false;group.add(rain);
 const snowGeo=new T.BufferGeometry();snowGeo.setAttribute('position',new T.BufferAttribute(snowPos,3));const snowMat=new T.PointsMaterial({color:0xf6f8ff,size:.085,transparent:true,opacity:.88,depthWrite:false});snowMat.onBeforeCompile=s=>{s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n float flake=length(gl_PointCoord-.5);diffuseColor.a*=1.-smoothstep(.24,.5,flake);');};const snow=new T.Points(snowGeo,snowMat);snow.frustumCulled=false;group.add(snow);
 const tree=courtyard.getObjectByName('东南梨树_独立枝叶与梨果');
 const leafWind={time:{value:0},strength:{value:0}};const flutterMaterials=new Set();tree?.traverse(o=>{if(o.isMesh&&o.material.userData.surface==='leaf')flutterMaterials.add(o.material);});
 for(const m of flutterMaterials){const original=m.onBeforeCompile;m.onBeforeCompile=s=>{original(s);s.uniforms.leafTime=leafWind.time;s.uniforms.leafStrength=leafWind.strength;s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nuniform float leafTime;uniform float leafStrength;').replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\ntransformed.z+=sin(leafTime*(2.+leafStrength*.1)+instanceMatrix[3].x*5.+instanceMatrix[3].y*3.)*leafStrength*.004*pow(clamp(position.y/.19,0.,1.),2.);\n#endif');};m.customProgramCacheKey=()=> 'pear-leaf-flutter-v22';}
 const solar=new T.Object3D();
 const hemi=scene.children.find(o=>o.isHemisphereLight),baseBg=scene.background.clone();
 let clothTime=0;let current=null,active='cloud',wind=0,windDirection=0,day=true,lastSeason='',lastRefresh=0,busy=false;
 function dateParts(){return Object.fromEntries(new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',year:'numeric',month:'numeric',day:'numeric',hour:'numeric',hourCycle:'h23'}).formatToParts(new Date()).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));}
 function apply(){const d=dateParts(),season=seasonFor(d.month);dateEl.textContent=`${d.year}年${d.month}月${d.day}日 · ${season}`;
  if(lastSeason!==season){for(const [m,c]of leaves)m.color.copy(c).lerp(new T.Color(season==='秋'?'#8b7938':season==='冬'?'#69765c':season==='春'?'#739449':'#416c32'),season==='秋'?.26:.13);lastSeason=season;}
  const demo=select.value!=='live';active=demo?select.value:current?weatherKind(current.weather_code):'cloud';wind=demo?(active==='wind'?9:active==='rain'?4:2):current?Math.min(20,current.wind_speed_10m):0;windDirection=current?current.wind_direction_10m*Math.PI/180:Math.PI/3;day=demo?select.value!=='night':current?!!current.is_day:d.hour>=7&&d.hour<18;
  rain.visible=active==='rain';snow.visible=active==='snow';solar.visible=day&&active==='sun';sun.intensity=day?(active==='sun'?3:active==='rain'||active==='snow'?.65:1.45):.08;hemi.intensity=day?(active==='sun'?1.65:1.4):1.35;sun.color.set(day?0xfff0d9:0xa2b8e5);scene.background.copy(day?active==='sun'?new T.Color('#b9d4e4'):new T.Color('#a8b1b7'):new T.Color('#202b40'));scene.fog=new T.Fog(scene.background,day?65:55,day?150:140);
  const date=demo?new Date(`${d.year}-${String(d.month).padStart(2,'0')}-${String(d.day).padStart(2,'0')}T${active==='night'?'21':'12'}:00:00+08:00`):new Date();
  const sp=window.SunCalc.getPosition(date,37.75,112.56),mp=window.SunCalc.getMoonPosition(date,37.75,112.56);
  if(!demo)day=sp.altitude>-.0145;
  const direction=p=>new T.Vector3(-Math.sin(p.azimuth)*Math.cos(p.altitude),Math.sin(p.altitude),Math.cos(p.azimuth)*Math.cos(p.altitude));
  skyEnvironment.set(day,active);skyEnvironment.root.userData.celestial(direction(sp),direction(mp));
  scene.environmentIntensity=day?1.05:.85;sun.position.copy(direction(day?sp:mp).multiplyScalar(35));if(!day){sun.intensity=mp.altitude>0?.65:0;hemi.intensity=1.35;}
  const names={night:'星月夜景',sun:'晴',cloud:'多云 / 阴',rain:'降雨',snow:'降雪',wind:'大风'};
  if(demo){summary.textContent=`${names[active]} · 效果预览`;status.textContent='预览模式，不代表当前实况';}
  else if(current){summary.textContent=`${weatherLabel(current.weather_code)}${day?'':'（夜间）'} · ${current.temperature_2m.toFixed(1)}°C · 风 ${current.wind_speed_10m.toFixed(1)} m/s`;}
  else summary.textContent='天气与温度暂未获取';
  panel.dataset.effect=active;
 }
 async function refresh(){if(busy)return;busy=true;status.textContent='正在获取太原天气…';const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);try{
  const url='https://api.open-meteo.com/v1/forecast?latitude=37.75&longitude=112.56&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day&wind_speed_unit=ms&timeformat=unixtime&timezone=Asia%2FShanghai&forecast_days=1';
  const res=await fetch(url,{signal:controller.signal});if(!res.ok)throw Error('HTTP '+res.status);const json=await res.json();const c=validateCurrent(json.current);if(Math.abs(Date.now()/1000-c.time)>10800)throw Error('天气时刻已过期');current=c;lastRefresh=Date.now();apply();if(select.value==='live')status.textContent='数据时刻 '+new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'}).format(new Date(c.time*1000))+' · 每15分钟更新';
 }catch(e){apply();if(select.value==='live')status.textContent=current?'更新失败，显示上次数据（'+new Date(current.time*1000).toLocaleTimeString('zh-CN',{timeZone:'Asia/Shanghai',hour:'2-digit',minute:'2-digit'})+'）':'暂时无法连接天气服务，可重试或选择效果预览';}finally{clearTimeout(timeout);busy=false;}}
 select.addEventListener('change',()=>{apply();if(select.value==='live')refresh();});document.getElementById('weather-refresh').addEventListener('click',refresh);apply();refresh();setInterval(()=>{if(!document.hidden)refresh();},900000);setInterval(apply,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-lastRefresh>900000)refresh();});
 return {environment:skyEnvironment,get day(){return day;},get wind(){return wind;},movingRoots:[...flags,tree].filter(Boolean),update(time,dt,camera){skyEnvironment.update(time,camera);
  leafWind.time.value=time;leafWind.strength.value=wind;
  if(tree){const gust=(Math.sin(time*1.4)+.35*Math.sin(time*3.1))*.0018*wind;tree.rotation.z=gust*Math.sin(windDirection);tree.rotation.x=gust*Math.cos(windDirection);}
  for(let i=0;i<N;i++){let x=seed[i*3],y=seed[i*3+1],z=seed[i*3+2];if(rain.visible||snow.visible){const radius=i<3500?24:90,ceiling=i<3500?24:50,speed=rain.visible?11:.22+(i%13)*.018;y-=dt*speed;x-=Math.sin(windDirection)*wind*dt*(rain.visible?.15:.065);z+=Math.cos(windDirection)*wind*dt*(rain.visible?.15:.065);let ground=-1.8;if(Math.abs(x)<5.1&&z>-3.6&&z<12.6)ground=surface(x,z);else if(Math.abs(x)>5.1&&Math.abs(x)<7.95&&z>-3.6&&z<12.6)ground=x<0&&z>11.56?2.68:3.16;else if(Math.abs(x)<7.95&&z<=-3.6&&z>-10.4)ground=z<-6.6?5.25:2.16;if(y<ground+.04){y=ceiling-4+Math.random()*4;x=(Math.random()*2-1)*radius;z=(Math.random()*2-1)*radius;}if(x< -radius)x+=radius*2;if(x>radius)x-=radius*2;if(z< -radius)z+=radius*2;if(z>radius)z-=radius*2;seed.set([x,y,z],i*3);if(rain.visible){positions.set([x,y,z,x+Math.sin(windDirection)*.02*wind,y+.35,z-Math.cos(windDirection)*.02*wind],i*6);}else snowPos.set([x+Math.sin(time*.5+i)*.13,y,z+Math.cos(time*.4+i)*.08],i*3);}}
  if(rain.visible)rainGeo.attributes.position.needsUpdate=true;if(snow.visible)snowGeo.attributes.position.needsUpdate=true;
  if(time-clothTime<1/24)return;clothTime=time;
  for(let k=0;k<cloth.length;k++){const {o,base,phase}=cloth[k],a=o.geometry.attributes.position;for(let j=0;j<a.count;j++){const x=base[j*3],y=base[j*3+1],free=T.MathUtils.clamp((.275-y)/.55,0,1);a.setZ(j,base[j*3+2]+free*free*Math.min(.13,wind*.016)*(.6+.4*Math.abs(Math.sin(windDirection)))*(Math.sin(time*(2+wind*.13)+y*8+x*4+phase)+.3*Math.sin(time*4+y*15+phase)));}a.needsUpdate=true;o.geometry.computeVertexNormals();}
 }};
}
