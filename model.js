import * as T from './vendor/three.module.js';
import {addDetails,tileMaterial,texture} from './detail.js?v=20.0';
import {courtyardFinish} from './interior.js?v=20.0';
import {joinery} from './joinery.js?v=20.0';
import {L} from './layout.js?v=20.0';
import {beveledBox,mineralBlock} from './solid-materials.js?v=20.0';
import {solidFinish} from './solid-finish.js?v=20.0';
import {botanical} from './botanical.js?v=20.0';
import {surfaceShading} from './surface-shading.js?v=20.0';

export function buildCourtyard(scene){
 const root=new T.Group();root.name='courtyard';scene.add(root);const materials=new Map(),openings=[];
 const metalColors=new Set(['#b0b5b0','#c0c5bd','#aeb8b3','#bbc0b2','#b5ad8d','#a2a38e','#c2bda3','#83877a','#a2a999','#777d73','#8c8f7d','#9d9e8c','#c7c8b9']);
 const woodColors=new Set(['#6d4237','#644339','#67534a','#733d32']);
 const paintColors=new Set(['#252e2d','#535b52','#777e6f']);
 const m=c=>{if(!materials.has(c)){const metal=metalColors.has(c),wood=woodColors.has(c),paint=paintColors.has(c),mat=new T.MeshStandardMaterial({color:c,roughness:metal?.29:wood?.4:paint?.34:.84,metalness:metal?.82:0});mat.userData.surface=metal?'steel':wood?'wood':paint?'paint':'masonry';materials.set(c,mat);}return materials.get(c);};
 const box=(w,h,d,x,y,z,c,parent=root)=>{const o=new T.Mesh(beveledBox(w,h,d),typeof c==='string'?m(c):c);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const rod=(a,b,r=.032,c='#b0b5b0',parent=root)=>{const v=new T.Vector3(...b).sub(new T.Vector3(...a));const o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),16),m(c));o.position.copy(new T.Vector3(...a).addScaledVector(v,.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;parent.add(o);return o;};
 const ball=(r,x,y,z,c,parent=root)=>{const o=new T.Mesh(new T.SphereGeometry(r,20,14),m(c));o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;};
 function tiled(w,h,x,y,z,parent=root,color='#dce1d7',unit=.3){
   return box(w,h,.025,x,y,z,tileMaterial(color==='#9c533b'?'tile-ochre':'tile-white',w,h,1.92,.24),parent);
 }
 const {window,door}=joinery({box,rod,ball,tileMaterial});
 function piercedWall(parent,w,h,holes){
  const xs=[-w/2,w/2],ys=[0,h];for(const a of holes){xs.push(Math.max(-w/2,a.x0),Math.min(w/2,a.x1));ys.push(Math.max(0,a.y0),Math.min(h,a.y1));}
  const xx=[...new Set(xs)].sort((a,b)=>a-b),yy=[...new Set(ys)].sort((a,b)=>a-b);
  for(let i=0;i<xx.length-1;i++)for(let j=0;j<yy.length-1;j++){const x=(xx[i]+xx[i+1])/2,y=(yy[j]+yy[j+1])/2;
   if(holes.some(a=>x>a.x0&&x<a.x1&&y>a.y0&&y<a.y1))continue;
   box(xx[i+1]-xx[i],yy[j+1]-yy[j],.18,x,y,-.07,'#d1d0c4',parent);
  }
 }
 function facade(items,side,parent=root,floor=0,depth=0){
   for(const it of items){const g=new T.Group();g.name=it.id;parent.add(g);let u=it.u;
     if(side==='north')g.position.set(u,floor,L.northFacade+.10);
     else{g.position.set(side==='west'?-L.halfWidth+.03:L.halfWidth-.03,floor,u);g.rotation.y=side==='west'?Math.PI/2:-Math.PI/2;}
     if(it.kind==='window')window(g,0,side==='north'?L.northWindow.sill+L.northWindow.height/2:L.sideWindow.sill+L.sideWindow.height/2,0,it.w,side==='north'?L.northWindow.height:L.sideWindow.height,side==='north'?'#6d4237':'#8c8f7d',side==='north'?4:3);
     else door(g,0,side!=='north'&&it.kind==='door'?L.doorstep.height:0,0,it.w,it.curtain,it.kind==='plain-door',side==='north'?'#6d4237':'#9d9e8c',side==='north'?null:L.sideDoorLeafWidth,side!=='north');
     openings.push({id:it.id,kind:it.kind,position:[g.position.x,g.position.y,g.position.z],width:it.w});
   }
 }
 // Courtyard continues LEVEL to the cellar doors. The basin is an actual hole in the slab.
 // Rounded exhibition plinth; top remains below the original courtyard datum.
 function plinth(w,d,r,y,h,color,metalness){
  const shape=new T.Shape(),x=-w/2,z=-d/2;
  shape.moveTo(x+r,z);shape.lineTo(x+w-r,z);shape.quadraticCurveTo(x+w,z,x+w,z+r);
  shape.lineTo(x+w,z+d-r);shape.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
  shape.lineTo(x+r,z+d);shape.quadraticCurveTo(x,z+d,x,z+d-r);
  shape.lineTo(x,z+r);shape.quadraticCurveTo(x,z,x+r,z);
  const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSegments:3,bevelSize:.07,bevelThickness:.05,curveSegments:10,steps:1});
  geo.rotateX(-Math.PI/2);const mesh=new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:.36,metalness}));mesh.position.set(1,y,2.5);mesh.name='圆角展示台';mesh.receiveShadow=true;mesh.castShadow=true;root.add(mesh);
 }
 plinth(22,27,.9,-1.27,.68,'#353e42',.3);
 plinth(22.06,27.06,.93,-.64,.055,'#ae9160',.72);
 plinth(22,27,.9,-.57,.10,'#c1bba9',.08);
 const B=L.basin,bx0=B.x-B.width/2,bx1=B.x+B.width/2,bz0=B.z-B.depth/2,bz1=B.z+B.depth/2;
 const slab=(x0,x1,z0,z1)=>box(x1-x0,.16,z1-z0,(x0+x1)/2,-.08,(z0+z1)/2,'#aaa795');
 slab(-5.1,bx0,-3.6,12.6);slab(bx1,5.1,-3.6,12.6);slab(bx0,bx1,-3.6,bz0);slab(bx0,bx1,bz1,12.6);
 const paving=Array.from({length:6},(_,i)=>{const o=new T.InstancedMesh(mineralBlock(.234,.026,.114,i),m('#aaa79b'),1000);o.name='交错铺砌独立地砖_'+i;o.receiveShadow=o.castShadow=true;root.add(o);return o;}),counts=Array(6).fill(0);const d=new T.Object3D();let count=0;
 for(let iz=0;iz<27;iz++)for(let ix=0;ix<21;ix++)for(let q=0;q<4;q++)for(let pair=0;pair<2;pair++){
  const cellX=-5.04+ix*.48+(q%2)*.24,cellZ=-.16+iz*.48+Math.floor(q/2)*.24,flip=(ix+iz+q)%2;
  const x=cellX+(flip?pair*.12+.06:.12),z=cellZ+(flip?.12:pair*.12+.06);
  if(x>.0+5.0||z>12.52||x+.12>bx0&&x-.12<bx1&&z+.12>bz0&&z-.12<bz1)continue;
  const jitter=((ix*17+iz*31+q*13)%11-5)*.00022;
  d.position.set(x+jitter,.003+jitter,z-jitter);d.rotation.set(jitter*.4,(flip?Math.PI/2:0)+jitter*.9,jitter*.3);d.updateMatrix();const variant=(ix*13+iz*7+q+pair)%6,k=counts[variant]++;paving[variant].setMatrixAt(k,d.matrix);paving[variant].setColorAt(k,new T.Color().setHSL(.10+((ix+iz)%4)*.008,.035,.70+(ix*7+iz*11+q)%9*.018));count++;
 }paving.forEach((o,i)=>o.count=counts[i]);
 // North house with distinct doors and central windows, behind an unobstructed landing.
 box(15.8,2.95,.22,0,3.635,L.northBack,'#c8c7ba');
 const northSpan=L.platformFront-L.northBack,northCenter=(L.platformFront+L.northBack)/2;
 box(15.8,.22,northSpan,0,2.05,northCenter,'#b9b4a6');
 for(const x of [-7.9,7.9])box(.22,5.16,northSpan,x,2.18,northCenter,'#c6c7bb');
 const northWall=new T.Group();northWall.position.set(0,L.platformHeight,L.northFacade);root.add(northWall);
 piercedWall(northWall,15.8,2.95,L.north.map(it=>({x0:it.u-it.w/2,x1:it.u+it.w/2,y0:it.kind==='window'?L.northWindow.sill:0,y1:it.kind==='window'?L.northWindow.sill+L.northWindow.height:2.55})));
 facade(L.north,'north',root,L.platformHeight);
 box(16.2,.18,4.05,0,L.northEave,(L.northFacade+L.northBack)/2-.03,'#7c7b70');box(16.3,.19,.14,0,5.17,L.northFacade+.20,'#803e32');
 // Under-platform face: window, door, stair, door, window. Doors hug the stair edges.
 for(const s of [-1,1]){
   const g=new T.Group();root.add(g);g.position.set(s*3.76,0,L.platformFront);
   // Split the wall around a real opening. Door/frame are based on the LOWER cellar floor.
   const cx=s*L.cellarX,lo=s<0?-5.1:2.42,hi=s<0?-2.42:5.1,dl=cx-L.cellarDoorWidth/2,dr=cx+L.cellarDoorWidth/2,top=L.cellarFloor+L.cellarDoorHeight;
   for(const [a,b]of [[lo,dl],[dr,hi]]){box(b-a,2.48,.2,(a+b)/2,.92,L.platformFront,'#d0d3c7');tiled(b-a,2.16,(a+b)/2,1.08,L.platformFront+.11);}
   box(L.cellarDoorWidth,2.16-top,.2,cx,(top+2.16)/2,L.platformFront,'#d0d3c7');
   for(const x of [dl,dr])box(.065,L.cellarDoorHeight,.17,x,L.cellarFloor+L.cellarDoorHeight/2,L.platformFront+.13,'#733d32');
   box(L.cellarDoorWidth,.065,.17,cx,top,L.platformFront+.13,'#733d32');
   // Door shown open inward; its leaf bottom remains at cellar floor, not courtyard level.
   box(.08,L.cellarDoorHeight-.08,L.cellarDoorWidth-.08,dr-.05,L.cellarFloor+(L.cellarDoorHeight-.08)/2,L.platformFront-L.cellarDoorWidth/2,'#495447');
   box(L.cellarDoorWidth,.10,.12,cx,-.05,L.platformFront-.06,'#a7a28f');
   box(L.cellarDoorWidth,.10,L.cellarStepDepth,cx,-.21,L.platformFront-.12-L.cellarStepDepth/2,'#a39d8d');
   const start=L.platformFront-.12-L.cellarStepDepth;
   box(L.cellarDoorWidth,.10,start-L.cellarBack,cx,L.cellarFloor-.05,(start+L.cellarBack)/2,'#858277');
   for(const x of [dl-.05,dr+.05])box(.1,2.35,L.platformFront-L.cellarBack,x,.855,(L.platformFront+L.cellarBack)/2,'#92988b');
   box(L.cellarDoorWidth,2.35,.1,cx,.855,L.cellarBack,'#626b60');
   window(root,s*L.cellarWindowX,.92,L.platformFront+.18,.88,.78,'#726e5c',2);
 }
 for(let i=0;i<L.stepCount;i++){const h=(i+1)*L.riser,o=new T.Mesh(mineralBlock(L.stairWidth,h,L.tread,i,48,5),m('#b9bab4'));o.position.set(0,h/2,-(i+.5)*L.tread);o.name='水泥踏步_细分抹面';o.castShadow=o.receiveShadow=true;root.add(o);}
 for(const s of [-1,1]){
   const x=s*2.34;for(let i=0;i<=6;i++){const z=-i*.6,y=i*.36;rod([x,y,z],[x,y+1,z]);ball(.062,x,y+1,z,'#c0c5bd');}
   for(const h of [.43,1])rod([x,h,0],[x,L.platformHeight+h,L.platformFront]);
   // Exactly one transverse railing section, ending at each side-house wall.
   for(const a of [2.34,3.34,4.22,5.08])rod([s*a,2.16,-3.57],[s*a,3.16,-3.57]);
   for(const y of [2.58,3.16])rod([s*2.34,y,-3.57],[s*5.1,y,-3.57]);
 }
 // West row includes its southwest toilet; east south room is flush with the east row.
 function wing(s,front,back){const len=back-front,z=(front+back)/2,x=s*6.5;
  box(.18,3.02,len,s*7.85,1.51,z,'#c8cabd');for(const zz of [front,back])box(2.8,3.02,.16,x,1.51,zz,'#c8cabd');
  box(2.8,.10,len,x,.02,z,'#8c8779');box(3.12,.15,len+.15,x,3.05,z,'#7a7b6c');const face=new T.Group();face.position.set(s*5.085,0,z);face.rotation.y=-s*Math.PI/2;root.add(face);
  piercedWall(face,len,3.02,(s<0?L.west:L.east).filter(it=>it.u>front&&it.u<back).map(it=>({x0:s*(it.u-z)-it.w/2,x1:s*(it.u-z)+it.w/2,y0:it.kind==='window'?L.sideWindow.sill:0,y1:it.kind==='window'?L.sideWindow.sill+L.sideWindow.height:it.kind==='plain-door'?2.10:2.70})));
  box(len+.1,.16,.14,0,3.06,.05,'#844439',face);
 }
 wing(-1,-3.6,12.6);wing(1,-3.6,L.hallNorth);wing(1,L.hallSouth,12.6);
 facade(L.west,'west');facade(L.east,'east');
 // Raised narrow thresholds/stoops, visually separate from the courtyard paving.
 for(const [s,items] of [[-1,L.west],[1,L.east]])for(const it of items.filter(o=>o.kind==='door')){const st=L.doorstep;box(st.depth,st.height,L.sideDoorLeafWidth+st.extraWidth,s*(L.halfWidth-st.depth/2),st.height/2,it.u,'#a6a595');}
 // Hall runs east-west and opens onto the west southern dwelling door W-D2.
 for(const z of [L.hallNorth,L.hallSouth]){box(2.8,3.02,.18,6.5,1.51,z,'#dedacd');const wall=new T.Group();wall.position.set(6.5,0,z+(z===L.hallNorth?.11:-.11));wall.rotation.y=z===L.hallNorth?0:Math.PI;root.add(wall);tiled(2.8,1.05,0,.525,0,wall,'#9c533b',.30);}
 box(2.8,.12,2.9,6.5,.005,L.gateZ,'#aea99b');box(3.05,.16,3.15,6.5,3.1,L.gateZ,'#7d7a6e');ball(.12,6.4,2.96,L.gateZ,'#f1eacb');
 const gate=new T.Group();gate.position.set(L.gateX,0,L.gateZ);gate.rotation.y=Math.PI/2;root.add(gate);
 for(const x of [-1.625,1.625])box(.85,3.02,.28,x,1.51,0,'#8e3b32',gate);box(4.1,.54,.28,0,2.94,0,'#8e3b32',gate);
 const gateLeaves=[];for(const s of [-1,1]){const pivot=new T.Group();pivot.position.set(s*1.2,0,0);gate.add(pivot);box(1.2,2.64,.1,-s*.6,1.32,0,'#252e2d',pivot);gateLeaves.push({pivot,s});}
 // A low wedge (not a floating tilted slab), sloping down away from the threshold.
 const rampGeo=new T.BufferGeometry();const x0=7.91,x1=x0+L.rampLength,z0=L.gateZ-1.5,z1=L.gateZ+1.5;
 const verts=[x0,0,z0,x0,0,z1,x1,-.15,z1,x0,0,z0,x1,-.15,z1,x1,-.15,z0,x0,-.25,z0,x0,0,z0,x1,-.15,z0,x0,-.25,z0,x1,-.15,z0,x1,-.25,z0,x0,-.25,z1,x1,-.15,z1,x0,0,z1,x0,-.25,z1,x1,-.25,z1,x1,-.15,z1];rampGeo.setAttribute('position',new T.Float32BufferAttribute(verts,3));rampGeo.computeVertexNormals();const ramp=new T.Mesh(rampGeo,new T.MeshStandardMaterial({color:'#a49f90',side:T.DoubleSide}));ramp.receiveShadow=true;root.add(ramp);box(2.1,.12,6,9.2,-.22,9,'#9f998b');
 // South boundary and long service strip across the southwest end, as latest sketch.
 box(10.2,2.55,.18,0,1.275,12.6,'#b48568');box(.18,2.55,1.5,-7.9,1.275,13.35,'#b48568');box(8.7,2.55,.18,-3.55,1.275,14.1,'#b48568');box(.18,2.55,1.5,.8,1.275,13.35,'#b48568');box(8.7,.12,1.5,-3.55,-.03,13.35,'#a19a89');const serviceFront=new T.Group();serviceFront.position.set(L.serviceDoorX,0,12.48);serviceFront.rotation.y=Math.PI;root.add(serviceFront);door(serviceFront,0,0,0,L.serviceDoorWidth,false,true,'#777e6f');
 // Recessed basin: user-confirmed rim only 7 cm above yard; bottom depth remains estimated.
 const bh=B.rim-B.bottom,by=(B.rim+B.bottom)/2;
 for(const x of [bx0+B.wall/2,bx1-B.wall/2])box(B.wall,bh,B.depth,x,by,B.z,'#92998c');
 for(const z of [bz0+B.wall/2,bz1-B.wall/2])box(B.width-2*B.wall,bh,B.wall,B.x,by,z,'#92998c');
 box(B.width-2*B.wall,.06,B.depth-2*B.wall,B.x,B.bottom-.03,B.z,'#52645b');
 rod([B.x,.07,bz0+.06],[B.x,.48,bz0+.06],.022);rod([B.x,.48,bz0+.06],[B.x,.48,B.z],.022);
 for(const [x,c]of [[-2.08,'#e6e8d5'],[-1.58,'#6b9ca3']]){
  const bucket=new T.Group();bucket.name='第一阶倒扣水桶';bucket.position.set(x,L.riser,-L.tread/2);root.add(bucket);
  const profile=[[.202,0],[.215,0],[.216,.018],[.203,.025],[.152,.245],[.149,.270],[0,.270],[0,.263],[.141,.261],[.195,.021],[.202,0]].map(p=>new T.Vector2(...p));
  const skin=new T.Mesh(new T.LatheGeometry(profile,40),m(c));skin.castShadow=skin.receiveShadow=true;bucket.add(skin);
  for(const y of c==='#6b9ca3'?[.035,.065,.095,.125,.155,.185,.215]:[.023]){const r=.21-y*.22,ring=new T.Mesh(new T.TorusGeometry(r,.0026,5,40),m(c));ring.rotation.x=Math.PI/2;ring.position.y=y;bucket.add(ring);}
 }
 for(const p of L.stairPlants)botanical(root,p,p.step*L.riser,-(p.step-.5)*L.tread);
 // The iron ladder rests on the platform and leans north onto the eave.
 const {bottom:lb,top:lt,width:lw}=L.ladder;for(const dx of [-lw/2,lw/2])rod([lb[0]+dx,lb[1],lb[2]],[lt[0]+dx,lt[1],lt[2]],.025,'#535b52');
 for(let i=1;i<12;i++){const t=i/12,y=lb[1]+(lt[1]-lb[1])*t,z=lb[2]+(lt[2]-lb[2])*t;rod([lb[0]-lw/2,y,z],[lb[0]+lw/2,y,z],.022,'#535b52');}
 addDetails({root,gate,gateLeaves,L,box,rod,ball,m});
 courtyardFinish({root,L,box,rod,ball,tileMaterial,texture});
 solidFinish(root);
 surfaceShading(root);
 return {root,gateLeaves,openings};
}
