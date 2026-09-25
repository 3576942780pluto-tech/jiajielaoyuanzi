import * as T from './vendor/three.module.js';
import {solidMat} from './solid-materials.js?v=18.1';
export function botanical(root,p,y,z){
 let seed=17+Math.round(Math.abs(p.x)*811+p.step*91);const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const group=new T.Group();group.name=p.kind==='fig'?'无花果_分枝叶脉':p.kind==='cactus'?'仙人掌_刺座':'石榴_对生窄叶';group.position.set(p.x,y,z);group.scale.setScalar(p.scale);group.rotation.y=p.turn;root.add(group);
 const terracotta=solidMat(p.color,'ceramic'),soil=solidMat('#4b4031'),bark=solidMat('#65533e','wood'),leafM=[solidMat('#4a6934','leaf'),solidMat('#536f36','leaf'),solidMat('#617a40','leaf')];leafM.forEach(m=>m.side=T.DoubleSide);
 const profile=[[.125,.012],[.145,.012],[.148,.04],[.201,.235],[.215,.244],[.216,.274],[.189,.276],[.184,.248],[.132,.05],[.125,.045]].map(([x,y])=>new T.Vector2(x,y));
 const pot=new T.Mesh(new T.LatheGeometry(profile,40),terracotta);pot.name='中空花盆_盆沿盆底';pot.castShadow=pot.receiveShadow=true;group.add(pot);
 const dirt=new T.Mesh(new T.CylinderGeometry(.183,.176,.014,32),soil);dirt.position.y=.245;group.add(dirt);
 const grainGeo=new T.IcosahedronGeometry(.007,0),grains=new T.InstancedMesh(grainGeo,solidMat('#695b43'),90),dummy=new T.Object3D();
 for(let i=0;i<90;i++){const a=rnd()*Math.PI*2,r=Math.sqrt(rnd())*.176;dummy.position.set(Math.cos(a)*r,.254,Math.sin(a)*r);dummy.scale.setScalar(.4+rnd());dummy.updateMatrix();grains.setMatrixAt(i,dummy.matrix);}group.add(grains);
 const tube=(points,r,material=bark)=>{const curve=new T.CatmullRomCurve3(points.map(a=>new T.Vector3(...a))),geo=new T.TubeGeometry(curve,12,r,9,false),a=geo.attributes.position;
  for(let j=0;j<=12;j++){const t=j/12,c=curve.getPointAt(t),scale=1-.64*t;for(let k=0;k<=9;k++){const i=j*10+k,v=new T.Vector3().fromBufferAttribute(a,i).sub(c).multiplyScalar(scale).add(c);a.setXYZ(i,v.x,v.y,v.z);}}geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);mesh.castShadow=true;group.add(mesh);return mesh;};
 if(p.kind==='cactus'){
  const padMat=solidMat('#58784b','leaf'),spineMat=solidMat('#d3c296');
  const pads=[[0,.39,0,.092,.15,0],[.10,.58,.008,.08,.16,-.38],[-.08,.65,-.005,.085,.15,.35],[.16,.82,.01,.068,.14,-.15]];
  for(const raw of pads.slice(0,3+Math.floor(rnd()*2))){
   const [x0,y0,z0,w0,h0,rot0]=raw,x=x0*(.8+rnd()*.4),y=y0*(.94+rnd()*.12),z=z0+(rnd()-.5)*.018,w=w0*(.87+rnd()*.22),h=h0*(.88+rnd()*.22),rot=rot0+(rnd()-.5)*.19;
   const pad=new T.Group();pad.position.set(x,y,z);pad.rotation.z=rot;group.add(pad);
   const body=new T.Mesh(new T.SphereGeometry(1,20,14),padMat);body.scale.set(w,h,.035);body.castShadow=true;pad.add(body);
   const areoles=new T.InstancedMesh(new T.SphereGeometry(.003,6,4),solidMat('#c0b479'),40);let n=0;
   for(let j=-3;j<=3;j++)for(let k=-2;k<=2;k++){
    const px=k*w*.32+(j%2)*.01,py=j*h*.23;if((px/w)**2+(py/h)**2>.86)continue;
    const zz=.035*Math.sqrt(1-(px/w)**2-(py/h)**2);dummy.position.set(px,py,zz+.002);dummy.scale.setScalar(1);dummy.updateMatrix();areoles.setMatrixAt(n++,dummy.matrix);
    for(let a=0;a<3;a++){const end=new T.Vector3(px+Math.cos(a*2.1)*.008,py+Math.sin(a*2.1)*.008,zz+.013),start=new T.Vector3(px,py,zz),v=end.clone().sub(start);const s=new T.Mesh(new T.ConeGeometry(.0006,v.length(),4),spineMat);s.position.copy(start.addScaledVector(v,.5));s.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());pad.add(s);}
   }areoles.count=n;pad.add(areoles);
  }return;
 }
 tube([[0,.25,0],[.012,.47,-.01],[-.015,.73,.02],[.03,1.05,0]],.017);
 const leafBend=(x,y,variant)=>Math.sqrt(x*x+.00001)*.25-Math.sin(y*15)*.016+y*y*(.18+variant*.18)+Math.sin(y*32+variant)*x*.13;
 const leafShape=(fig,variant)=>{
  const shape=new T.Shape();const pts=fig?[[0,0],[-.04,.025],[-.075,.06],[-.04,.08],[-.082,.13],[-.052,.16],[-.025,.13],[0,.215],[.026,.135],[.057,.17],[.08,.13],[.04,.08],[.073,.057],[.04,.026]]:[[0,0],[-.013,.035],[-.026,.082],[-.017,.13],[0,.17],[.017,.13],[.026,.082],[.013,.035]];
  shape.moveTo(0,0);for(let i=1;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];shape.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}shape.lineTo(0,0);shape.closePath();
  const shell=new T.ExtrudeGeometry(shape,{depth:.00045,bevelEnabled:false,steps:1,curveSegments:4}),sp=shell.attributes.position,sn=shell.attributes.normal,positions=[],smooth=[];
  function split(a,b,c,n,level){
   if(level){const ab=a.clone().add(b).multiplyScalar(.5),bc=b.clone().add(c).multiplyScalar(.5),ca=c.clone().add(a).multiplyScalar(.5);split(a,ab,ca,n,level-1);split(ab,b,bc,n,level-1);split(ca,bc,c,n,level-1);split(ab,bc,ca,n,level-1);return;}
   for(const v of [a,b,c]){positions.push(v.x,v.y,v.z);smooth.push(n.x,n.y,n.z);}
  }
  for(let i=0;i<sp.count;i+=3)split(new T.Vector3().fromBufferAttribute(sp,i),new T.Vector3().fromBufferAttribute(sp,i+1),new T.Vector3().fromBufferAttribute(sp,i+2),new T.Vector3().fromBufferAttribute(sn,i),Math.abs(sn.getZ(i))>.5?2:0);
  const geo=new T.BufferGeometry();geo.type='BotanicalLeafGeometry';geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(smooth,3));const a=geo.attributes.position;
  const normals=geo.attributes.normal;
  const bend=(x,y)=>leafBend(x,y,variant);
  for(let i=0;i<a.count;i++){
   const x=a.getX(i),y=a.getY(i),nz=normals.getZ(i);a.setZ(i,a.getZ(i)+bend(x,y));
   if(Math.abs(nz)>.5){const e=.0001,n=new T.Vector3(-(bend(x+e,y)-bend(x-e,y))/(2*e),-(bend(x,y+e)-bend(x,y-e))/(2*e),1).normalize().multiplyScalar(Math.sign(nz));normals.setXYZ(i,n.x,n.y,n.z);}
  }return geo;
 };
 const fig=p.kind==='fig',leafGeos=[0,1,2].map(i=>leafShape(fig,i)),vein=solidMat('#697c42','leaf');
 for(let j=0;j<(fig?8:12);j++){
  const a=j*2.399+rnd()*.65,by=.42+j*.047,len=.19+rnd()*.20,end=[Math.cos(a)*len,by+.08+rnd()*.12,Math.sin(a)*len];
  tube([[0,by-.055,0],[end[0]*.45,by+.012,end[2]*.45],end],.0045);
  for(let k=0;k<(fig?3:5);k++)for(let side=0;side<(fig?1:2);side++){
   const t=.4+k*(fig?.23:.13),l=new T.Group();l.position.set(end[0]*t,by+(end[1]-by)*t,end[2]*t);l.rotation.set(-.6+rnd()*.8,a+(side?Math.PI:0)+rnd()*.6,-.9+rnd()*1.8);l.scale.setScalar(.65+rnd()*.55);group.add(l);
   const variant=Math.floor(rnd()*3),blade=new T.Mesh(leafGeos[variant],leafM[Math.floor(rnd()*3)]);blade.castShadow=blade.receiveShadow=true;l.add(blade);
   const surfacePoint=(x,y)=>new T.Vector3(x,y,leafBend(x,y,variant)+.0008);
   const curve=new T.CatmullRomCurve3([-.015,0,.04,.08,.12,fig?.20:.16].map(y=>surfacePoint(0,y))),midrib=new T.Mesh(new T.TubeGeometry(curve,12,.00065,4,false),vein);l.add(midrib);
   if(fig)for(const s of [-1,1])for(let v=0;v<3;v++){const x=s*(.055-v*.007),y0=.04+v*.04,y1=.07+v*.036,line=new T.CatmullRomCurve3([surfacePoint(0,y0),surfacePoint(x*.5,(y0+y1)/2),surfacePoint(x,y1)]);l.add(new T.Mesh(new T.TubeGeometry(line,4,.00035,3,false),vein));}
  }
 }
}
