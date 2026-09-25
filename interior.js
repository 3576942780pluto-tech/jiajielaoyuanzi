import * as T from './vendor/three.module.js';
import {outlines} from './ornament-outlines.js?v=20.0';
import {beveledBox} from './solid-materials.js?v=20.0';
// Courtyard-facing finish. Layout comes only from the previously confirmed L data.
export function courtyardFinish({root,L,box,rod,ball,tileMaterial,texture}){
 const finish=new T.Group();finish.name='院内精细构件';root.add(finish);
 const white=new T.MeshStandardMaterial({color:'#dddfd7',roughness:.35});
 function wallPaper(parent,x,y,z,w=.24){const g=new T.Group();g.name='院内红纸_福字';g.position.set(x,y,z);parent.add(g);const paper=new T.Mesh(new T.PlaneGeometry(w,w),new T.MeshStandardMaterial({color:'#bd3527',roughness:.8,side:T.DoubleSide}));paper.rotation.z=Math.PI/4;g.add(paper);
  for(const part of outlines['fu-left'].paths){const draw=(p,s)=>{p.forEach(([u,v],i)=>{const a=(u-.5)*w*1.05,b=(v-.5)*w*1.05;i?s.lineTo(a,b):s.moveTo(a,b);});s.closePath();return s;};const shape=draw(part.outer,new T.Shape());for(const hole of part.holes)shape.holes.push(draw(hole,new T.Path()));const ink=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.0007,bevelEnabled:false}),new T.MeshStandardMaterial({color:'#dfb65d',roughness:.58}));ink.position.z=.001;ink.name='院内福字实体笔画';g.add(ink);}}
 function tileLayer(parent,w,y0,y1,tw,th,holes,stagger=false){
  // Trim individual tiles at openings: never discard an entire crossing course.
  const batches=new Map(),dummy=new T.Object3D();let serial=0;
  for(let row=0,y=y0;y<y1-.0001;y+=th,row++)for(let x=-w/2-tw+(stagger&&row%2?tw/2:0);x<w/2;x+=tw){
   let pieces=[{a:Math.max(-w/2,x+.0015),b:Math.min(w/2,x+tw-.0015),c:y+.001,d:Math.min(y1,y+th-.001)}];
   for(const h of holes){const next=[];for(const r of pieces){
    const a=Math.max(r.a,h.x0),b=Math.min(r.b,h.x1),c=Math.max(r.c,h.y0),d=Math.min(r.d,h.y1);
    if(a>=b||c>=d){next.push(r);continue;}
    next.push({a:r.a,b:a,c:r.c,d:r.d},{a:b,b:r.b,c:r.c,d:r.d},{a,b,c:r.c,d:c},{a,b,c:d,d:r.d});
   }pieces=next.filter(r=>r.b-r.a>.002&&r.d-r.c>.002);}
   for(const r of pieces){if(r.b-r.a<=.002||r.d-r.c<=.002)continue;const width=r.b-r.a,height=r.d-r.c,key=width.toFixed(5)+'/'+height.toFixed(5);
    if(!batches.has(key))batches.set(key,{width,height,tiles:[]});batches.get(key).tiles.push({x:(r.a+r.b)/2,y:(r.c+r.d)/2,tone:.955+(serial++%5)*.006});
   }
  }
  for(const {width,height,tiles} of batches.values()){
   const mesh=new T.InstancedMesh(beveledBox(width,height,.006,.0007),white,tiles.length);
   tiles.forEach((t,i)=>{dummy.position.set(t.x,t.y,.012);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,new T.Color().setRGB(t.tone,t.tone,t.tone));});
   mesh.name='瓷砖_洞口裁切收边';mesh.receiveShadow=mesh.castShadow=true;parent.add(mesh);
  }
 }
 function wall(name,w,position,rot,holes,base=0){
  const g=new T.Group();g.name=name;g.position.fromArray(position);g.rotation.y=rot;finish.add(g);
  tileLayer(g,w,base,base+.96,.24,.06,holes,true);
  tileLayer(g,w,base+.96,base+2.88,.075,.24,holes,false);return g;
 }
 for(const s of [-1,1]){
  const list=s<0?L.west:L.east,ranges=s<0?[[-3.6,12.6]]:[[-3.6,L.hallNorth],[L.hallSouth,12.6]];
  for(const [a,b]of ranges){const mid=(a+b)/2,holes=list.filter(it=>it.u>a&&it.u<b).map(it=>({x0:s*(it.u-mid)-it.w/2-.045,x1:s*(it.u-mid)+it.w/2+.045,y0:it.kind==='window'?L.sideWindow.sill-.095:0,y1:it.kind==='window'?L.sideWindow.sill+L.sideWindow.height+.055:it.kind==='plain-door'?2.10:2.74}));
   const g=wall(s<0?'西侧白瓷砖':'东侧白瓷砖',b-a,[s*(L.halfWidth-.048),0,mid],-s*Math.PI/2,holes);
   // True soffit projection and underside bead, measured here only as working dimensions.
   box(b-a+.08,.095,.55,0,2.98,.22,'#d7d8cf',g);
   box(b-a+.08,.18,.036,0,3.065,.49,tileMaterial('tile-red',b-a+.08,.18,.225,1.62),g);
   box(b-a,.014,.02,0,2.93,.40,'#a9aea1',g);
   // Tile the window sill faces, keeping independent ends at each opening.
   for(const it of list.filter(it=>it.kind==='window'&&it.u>a&&it.u<b))box(it.w+.13,.065,.025,s*(it.u-mid),L.sideWindow.sill-.035,.19,tileMaterial('tile-red',it.w+.13,.065,.225,.585),g);
   const visible=list.filter(it=>it.u>a&&it.u<b);
   for(let j=0;j<visible.length-1;j++){
    const end=visible[j].u+visible[j].w/2,start=visible[j+1].u-visible[j+1].w/2,gap=start-end;
    if(gap>.35&&gap<1.2)wallPaper(g,s*((start+end)/2-mid),1.92,.030,Math.min(.30,gap*.61));
   }
  }
 }
 for(const x of [-5.02,-2.605,0,2.605,5.02])wallPaper(finish,x,3.42,L.northFacade+.165,.23);
 const southPaper=new T.Group();southPaper.position.set(0,0,L.south-.125);southPaper.rotation.y=Math.PI;finish.add(southPaper);
 for(const x of [L.serviceDoorX-.72,L.serviceDoorX+.72])wallPaper(southPaper,-x,1.73,.021,.29);
 const nh=L.north.map(it=>({x0:it.u-it.w/2-.055,x1:it.u+it.w/2+.055,y0:it.kind==='window'?L.northWindow.sill-.10:0,y1:it.kind==='window'?L.northWindow.sill+L.northWindow.height+.055:2.55}));
 const n=new T.Group();n.name='北房白瓷砖及檐下';n.position.set(0,L.platformHeight,L.northFacade+.133);finish.add(n);
 tileLayer(n,15.8,0,.54,.24,.06,nh,true);tileLayer(n,15.8,.54,2.88,.075,.24,nh);
 box(16.16,.10,.57,0,2.99,.18,'#d3d5cb',n);box(16.18,.16,.035,0,3.095,.44,tileMaterial('tile-red',16.18,.16,.225,1.44),n);
 // Hall wainscot: orange running bond, broad dark brown top and end borders.
 for(const z of [L.hallNorth,L.hallSouth]){
  const g=new T.Group();g.name='门厅双色墙裙';g.position.set(6.5,0,z+(z===L.hallNorth?.121:-.121));g.rotation.y=z===L.hallNorth?0:Math.PI;finish.add(g);
  box(2.78,1.16,.025,0,.58,.005,tileMaterial('tile-ochre',2.78,1.16,1.0,.48),g);
  for(const y of [1.095,1.165])box(2.78,.065,.027,0,y,.01,'#573c33',g);
  for(const x of [-1.32,1.32])box(.14,1.14,.03,x,.57,.012,tileMaterial('tile-red',.14,1.14,.42,1.08),g);
  box(2.78,.065,.032,0,.033,.016,'#5f493b',g);
 }
 // Raised side door steps: a separate concrete nose with a fine undercut.
 for(const [s,items]of [[-1,L.west],[1,L.east]])for(const it of items.filter(i=>i.kind==='door')){
  const width=L.sideDoorLeafWidth+L.doorstep.extraWidth;
  box(.035,.025,width+.016,s*(L.halfWidth-L.doorstep.depth+.01),L.doorstep.height-.01,it.u,'#b8b9b1',finish);
 }
 // Stair risers retain the confirmed eleven rises; these are cap and nose details only.
 for(let i=0;i<L.stepCount;i++){
  const y=(i+1)*L.riser,z=-i*L.tread;
  box(L.stairWidth+.012,.016,.034,0,y-.008,z-.008,'#c7c8bf',finish);
  box(L.stairWidth-.012,.008,.005,0,y-.034,z+.002,'#93988b',finish);
 }
 // Stainless handrail terminal caps, spherical finials and floor shoes.
 const steel=new T.MeshStandardMaterial({color:'#aeb8b3',metalness:.84,roughness:.24});
 for(const s of [-1,1])for(let i=0;i<=6;i++){
  const x=s*2.34,z=Math.max(L.platformFront,-i*.6-.015),y=Math.min(L.stepCount,Math.floor(-z/L.tread)+1)*L.riser;
  const shoe=new T.Mesh(new T.CylinderGeometry(.068,.082,.035,24),steel);shoe.position.set(x,y+.018,z);shoe.name='栏杆底座';finish.add(shoe);
  for(const dx of [-.050,.050]){const bolt=new T.Mesh(new T.CylinderGeometry(.010,.010,.009,6),steel);bolt.position.set(x+dx,y+.039,z);finish.add(bolt);}
 }
 // Cellar jambs, open leaf frames and glazing are based at the lower cellar floor.
 for(const s of [-1,1]){
  const cx=s*L.cellarX,dr=cx+L.cellarDoorWidth/2,base=L.cellarFloor;
  for(const x of [cx-L.cellarDoorWidth/2-.04,dr+.04])box(.045,L.cellarDoorHeight+.05,.025,x,base+L.cellarDoorHeight/2,L.platformFront+.205,'#6b4334',finish);
  const leaf=new T.Group();leaf.name='地下室内开门细部';leaf.position.set(dr+.004,base,L.platformFront-L.cellarDoorWidth/2);leaf.rotation.y=Math.PI/2;finish.add(leaf);
  const w=L.cellarDoorWidth-.08;
  box(w-.13,.75,.01,0,1.48,0,new T.MeshStandardMaterial({color:'#667365',roughness:.26,metalness:.12}),leaf);
  for(const y of [.17,.95,1.10,1.86])box(w-.10,.025,.018,0,y,.014,'#785244',leaf);
  for(const x of [-w/2+.045,w/2-.045])box(.032,1.92,.018,x,.98,.014,'#785244',leaf);
  rod([w*.32,.9,.04],[w*.32,1.02,.04],.01,'#afa58c',leaf);
 }
 // Low cement basin: smooth coping bevel, no raised decorative pool wall.
 const b=L.basin;
 for(const s of [-1,1]){
  box(b.wall-.012,.013,b.depth-.014,b.x+s*(b.width-b.wall)/2,b.rim-.0065,b.z,'#a3aaa0',finish);
  box(b.width-2*b.wall,.013,b.wall-.012,b.x,b.rim-.0065,b.z+s*(b.depth-b.wall)/2,'#a3aaa0',finish);
 }
 // Roof surfaces and soffits stay clean, with no discarded boards, wires or belongings.
}
