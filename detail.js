import * as T from './vendor/three.module.js';
const cache=new Map(),waiting=new Map();
export function texture(name){
 if(cache.has(name))return cache.get(name);
 const url=`./assets/detail/${name}.png`;
 // Construction-time metadata only. solidFinish replaces every map with physical geometry.
 const tex=new T.Texture();
 tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;tex.userData.source=url;cache.set(name,tex);return tex;
}
export function tileMaterial(name,w,h,unitW=.6,unitH=.6){
 const base=texture(name),tex=base.clone();
 if(base.image)tex.needsUpdate=true;else{tex.version=0;if(!waiting.has(name))waiting.set(name,[]);waiting.get(name).push(tex);}
 tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(w/unitW,h/unitH);
 return new T.MeshStandardMaterial({map:tex,roughness:name.includes('brick')?.91:.33,metalness:0});
}
export function addDetails({root,gate,gateLeaves,L,box,rod,ball,m}){
 function art(name,w,h,x,y,z,parent=root,rotation=0){const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:texture(name),transparent:true,alphaTest:.03,roughness:.63,side:T.DoubleSide}));mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.z=rotation;parent.add(mesh);return mesh;}
 function torus(r,tube,x,y,z,c,parent=root){const o=new T.Mesh(new T.TorusGeometry(r,tube,8,32),m(c));o.position.set(x,y,z);parent.add(o);o.castShadow=true;return o;}
 const gold='#b59b57',steel='#9da9a4',red='#77382e';
 // Reference gate: polished burgundy tile reveal, deep canopy and original brush strokes.
 box(4.36,.12,1.05,0,3.30,.13,'#943f37',gate);
 box(4.24,.055,.97,0,3.21,.13,'#deddd2',gate);
 const lamp=ball(.115,0,3.16,.38,'#e5e6d7',gate);lamp.scale.set(1,.36,1);
 box(2.92,.66,.035,0,2.87,.161,'#70332d',gate);
 art('plaque',2.88,.66,0,2.87,.185,gate);
 for(const x of [-1.625,1.625]){
  box(.85,3.02,.022,x,1.51,.154,tileMaterial('tile-red',.85,3.02,1.2,3.6),gate);
  box(.08,2.69,.09,x<0?-1.205:1.205,1.345,.08,'#622b27',gate);
 }
 // Fresh complete paper pair; crop generator margins in UVs, never the original photographs.
 for(const [name,x,u0,u1] of [['couplet-left-new',-1.64,.180,.820],['couplet-right-new',1.64,.167,.833]]){
  const paper=art(name,.35,1.75,x,1.725,.181,gate),uv=paper.geometry.attributes.uv;
  for(let j=0;j<uv.count;j++)uv.setX(j,u0+uv.getX(j)*(u1-u0));
  paper.material.roughness=.55;
 }
 // Right couplet is visible in the supplementary open-gate photograph.
 for(const {pivot,s}of gateLeaves){
  const x=-s*.6;
  for(const [yy,hh]of [[.52,.83],[1.77,1.27]]){
   for(const xx of [x-.51,x+.51])box(.019,hh,.013,xx,yy,.062,'#515553',pivot);
   for(const y of [yy-hh/2,yy+hh/2])box(1.02,.019,.013,x,y,.062,'#515553',pivot);
  }
  for(let i=0;i<5;i++)for(let j=0;j<4;j++)ball(.014,x-.31+i*.155,.26+j*.14,.081,'#777b72',pivot);
  art('door-emboss',.37,.33,x,2.01,.078,pivot);
  art(s<0?'fu-left':'fu-right',.59,.59,x,1.40,.085,pivot,Math.PI/4);
  const hx=-s*1.025;
  const head=ball(.079,hx,1.57,.10,gold,pivot);head.scale.set(1,1.04,.48);
  for(let k=0;k<10;k++){const a=k*Math.PI/5;ball(.022,hx+Math.cos(a)*.065,1.57+Math.sin(a)*.065,.11,gold,pivot);}
  for(const dx of [-.028,.028])ball(.014,hx+dx,1.588,.148,'#665b38',pivot);
  ball(.025,hx,1.556,.158,gold,pivot);torus(.065,.01,hx,1.48,.14,gold,pivot);
  art('lion-head',.135,.124,hx,1.57,.163,pivot);
  for(const yy of [.32,1.1,2.31])box(.034,.13,.035,-s*1.165,yy,.08,'#343d38',pivot);
 }
 // Five swallowtail hanging papers, cut geometry rather than rectangular decals.
 for(let i=0;i<5;i++){
  const w=.34,h=.55,x=-.91+i*.45;
  const shape=new T.Shape();shape.moveTo(-w/2,h/2);shape.lineTo(w/2,h/2);shape.lineTo(w/2,-h/2);shape.lineTo(0,-h*.28);shape.lineTo(-w/2,-h/2);shape.closePath();
  const geo=new T.ShapeGeometry(shape);const uv=geo.attributes.uv,pos=geo.attributes.position;for(let j=0;j<uv.count;j++)uv.setXY(j,(pos.getX(j)+w/2)/w,(pos.getY(j)+h/2)/h);
  // Conservatively renewed center: retain unresolved original ink contours, clean paper only.
  const name=i===2?'banner-3-renewed-v11':'banner-'+(i+1)+'-new';
  const o=new T.Mesh(geo,new T.MeshStandardMaterial({map:texture(name),side:T.DoubleSide,roughness:.76}));o.position.set(x,2.26,.22);o.rotation.set(.015,(i-2)*.018,(i%2-.5)*.015);o.name='门楣挂笺';gate.add(o);
 }
 for(const sx of [-1,1]){
  const g=new T.Group();g.name='红灯笼';g.position.set(sx*1.88,2.80,.40);g.rotation.z=-sx*.08;gate.add(g);
  rod([sx*1.88,3.22,.40],[sx*1.88,3.15,.40],.008,'#943f37',gate);
  const body=new T.Mesh(new T.SphereGeometry(.42,48,32),new T.MeshStandardMaterial({color:'#bd292e',roughness:.48,metalness:.02}));
  body.name='新红绸灯笼';body.scale.set(1.05,.79,.82);body.castShadow=true;g.add(body);
  for(let k=0;k<16;k++){
   const a=k*Math.PI/8,points=[];
   for(let j=0;j<=16;j++){const t=.16+j*(Math.PI-.32)/16;points.push(new T.Vector3(.444*Math.sin(t)*Math.cos(a),.334*Math.cos(t),.348*Math.sin(t)*Math.sin(a)));}
   const line=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.0035,6,false),new T.MeshStandardMaterial({color:'#dfbe64',roughness:.4,metalness:.35}));g.add(line);
  }
  for(const y of [-.327,.327]){const cap=new T.Mesh(new T.CylinderGeometry(.095,.105,.043,32),m(gold));cap.position.y=y;g.add(cap);}
  for(let k=0;k<48;k++){const a=k*Math.PI/24,r=.064;rod([Math.cos(a)*r,-.35,Math.sin(a)*r],[Math.cos(a)*r*1.10,-.60-(k%3)*.003,Math.sin(a)*r*1.10],.0036,'#ebcd64',g);}
  // Gold ink alone follows the oblate surface, with no rectangular photographic fabric patch.
  const printMap=texture('lantern-gold-v11');
  const printGeo=new T.PlaneGeometry(.22,.23,12,12),pp=printGeo.attributes.position,puv=printGeo.attributes.uv;
  for(let j=0;j<pp.count;j++){
   const u=puv.getX(j),v=puv.getY(j),x=pp.getX(j),y=pp.getY(j)+.10;
   pp.setXYZ(j,x,y,.3444*Math.sqrt(Math.max(0,1-(x/.441)**2-(y/.3318)**2))+.003);
   puv.setXY(j,u,v);
  }
  printGeo.computeVertexNormals();
  const print=new T.Mesh(printGeo,new T.MeshStandardMaterial({map:printMap,transparent:true,alphaTest:.12,roughness:.4,metalness:.25}));print.name='灯笼金印_曲面透明底';g.add(print);
 }
 // Photographed blue house number and milk box, mounted to the original exterior wall.
 const extras=new T.Group();extras.position.set(7.923,0,5.95);extras.rotation.y=Math.PI/2;root.add(extras);
 art('house-number',.18,.13,0,1.93,.052,extras);
 box(.28,.22,.10,0,1.70,.075,'#ddd9be',extras);art('milkbox',.255,.187,0,1.70,.128,extras);
 // Separate tile directions: vertical wall piers above sill, running bond below.
 for(const side of ['west','east']){
  const s=side==='west'?-1:1;const ranges=side==='west'?[[-3.6,12.6]]:[[-3.6,L.hallNorth],[L.hallSouth,12.6]];
  for(const [a,b]of ranges){const f=new T.Group();f.position.set(s*(L.halfWidth-.011),0,(a+b)/2);f.rotation.y=-s*Math.PI/2;root.add(f);
   // Roof trim is built once in interior.js, avoiding coplanar red top faces.

  }
  // Downpipes at the facade joins, a fixed architectural detail visible in panoramas.
  for(const z of side==='west'?[2.45,9.22]:[.02,6.57,10.0]){
   rod([s*(L.halfWidth-.16),.1,z],[s*(L.halfWidth-.16),2.96,z],.035,'#cccec1');
   for(const y of [.45,1.5,2.65]){const clamp=torus(.044,.009,s*(L.halfWidth-.16),y,z,'#999c92');clamp.rotation.x=Math.PI/2;}
  }
 }
 // North tiled face; preserve full opening order and all calibrated locations.
 // North wall Fu papers are built as explicit red paper and upright glyphs in interior.js.
 // Only the legible photographed cellar couplet is reproduced, without inventing its pair.
 art('cellar-couplet',.145,1.32,L.cellarX+L.cellarDoorWidth/2+.15,1.10,L.platformFront+.145);
 art('cellar-heading',.55,.14,L.cellarX,1.89,L.platformFront+.145);
 // Roof is flat in the references, with an ornamental pierced band, not pitched tiles.
 box(16.25,.095,.43,0,5.27,L.northFacade+.20,tileMaterial('tile-red',16.25,.095,.45,.45));
 box(16.15,.21,.065,0,5.40,L.northFacade+.05,'#6a352f');
 for(let k=0;k<49;k++){
  const x=-7.87+k*.328,z=L.northFacade+.098;
  rod([x,5.32,z],[x,5.40,z],.018,'#d4d6cb');rod([x,5.40,z],[x-.093,5.48,z],.018,'#d4d6cb');rod([x,5.40,z],[x+.093,5.48,z],.018,'#d4d6cb');
  rod([x-.093,5.48,z],[x-.14,5.47,z],.018,'#d4d6cb');rod([x+.093,5.48,z],[x+.14,5.47,z],.018,'#d4d6cb');
 }
 box(16.2,.055,.17,0,5.515,L.northFacade+.05,red);
 // Smaller vertical rail bars and circular medallions seen on the north platform.
 for(const s of [-1,1]){
  for(let i=1;i<18;i++){const t=i/18;rod([s*2.34,.10+L.platformHeight*t,L.platformFront*t],[s*2.34,.97+L.platformHeight*t,L.platformFront*t],.010,steel);}
  for(let j=1;j<12;j++){const x=s*(2.34+j*2.64/12);rod([x,2.22,-3.57],[x,3.12,-3.57],.009,steel);}
  const med=torus(.073,.008,s*3.8,2.97,-3.565,steel);rod([s*3.75,2.92,-3.565],[s*3.85,3.02,-3.565],.007,steel);
 }
 // Paired clean fascia bands and roof edge drips on the exposed brick walls.
 for(const s of [-1,1])for(const [a,b]of s<0?[[-3.6,12.6]]:[[-3.6,L.hallNorth],[L.hallSouth,12.6]]){
  box(.023,2.18,b-a,s*7.916,1.91,(a+b)/2,tileMaterial('brick-grey',b-a,2.18,1.0,.6));
  box(.024,.80,b-a,s*7.917,.40,(a+b)/2,'#b9bbb0');
 }
 // South boundary terracotta horizontal tilework, facing into the yard.
 const south=new T.Group();south.position.set(0,0,12.485);south.rotation.y=Math.PI;root.add(south);
 box(10.2,2.20,.014,0,1.42,0,tileMaterial('tile-ochre',10.2,2.20,1.1,.6),south);
 box(10.25,.10,.24,0,2.59,0,tileMaterial('tile-red',10.25,.1,.45,.45),south);
}
