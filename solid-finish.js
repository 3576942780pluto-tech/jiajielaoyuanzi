import * as T from './vendor/three.module.js';
import {outlines} from './ornament-outlines.js?v=21.4';
import {beveledBox,solidMat} from './solid-materials.js?v=21.4';
// Turn photographed printed marks into thin, closed contour meshes. No image material survives.
export function solidFinish(root){
 const mapped=[];root.traverse(o=>{if(o.isMesh&&o.material.map)mapped.push(o);});
 const colors={'tile-white':'#dadbd1','tile-vertical':'#dadbd1','tile-red':'#713c31','tile-ochre':'#a77553','brick-grey':'#8c8c81'};
 const printMats=new Map();const ink=c=>{if(!printMats.has(c))printMats.set(c,solidMat(c,'paper'));return printMats.get(c);};
 let vectorParts=0,tileCount=0;
 for(const o of mapped){
  const name=o.material.map.userData.source.split('/').pop().replace('.png',''),data=outlines[name],g=o.geometry;
  g.computeBoundingBox();const b=g.boundingBox,size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());
  if(name in colors){
   o.material=solidMat(colors[name],name.startsWith('brick')?'masonry':'ceramic');
   // Primary white elevations already have independent beveled tiles with real joints.
   if(name==='tile-white'||name==='tile-vertical')continue;
   const axis=size.x<size.z&&size.x<size.y?'x':'z',w=axis==='x'?size.z:size.x,h=size.y;
   const tw=name==='brick-grey'?.24:name==='tile-red'?.225:.22,th=name==='brick-grey'?.065:name==='tile-red'?.15:.06;
   if(w<.05||h<.015)continue;
   o.material=solidMat('#8d897d');
   const group=new T.Group();group.position.copy(o.position);group.quaternion.copy(o.quaternion);group.scale.copy(o.scale);o.parent.add(group);
   for(const side of [-1,1]){
    const mesh=new T.InstancedMesh(beveledBox(tw-.004,th-.003,.009,.0012),solidMat(colors[name],name==='brick-grey'?'masonry':'ceramic'),Math.ceil(w/tw+1)*Math.ceil(h/th+1));
    const d=new T.Object3D();let n=0;
    for(let row=0,y=-h/2+th/2;y<h/2-th*.45;y+=th,row++)for(let x=-w/2+tw/2;x<w/2-tw*.45;x+=tw){
     if(axis==='z'){d.position.set(center.x+x,center.y+y,center.z+side*(size.z/2+.005));d.rotation.y=side<0?Math.PI:0;}
     else{d.position.set(center.x+side*(size.x/2+.005),center.y+y,center.z+x);d.rotation.y=side*Math.PI/2;}
     d.updateMatrix();mesh.setMatrixAt(n,d.matrix);mesh.setColorAt(n,new T.Color().setScalar(.94+(n%7)*.012));n++;
    }
    mesh.count=n;mesh.name='独立砖块_勾缝';mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);tileCount+=n;
   }
   continue;
  }
  if(!data){o.material=solidMat('#b89e65','paper');continue;}
  const group=new T.Group();group.name='实体印纹_'+name;group.position.copy(o.position);group.quaternion.copy(o.quaternion);group.scale.copy(o.scale);o.parent.add(group);
  if(data.base)o.material=ink(data.base);else o.visible=false;
  // Invisible original projection planes are removed; no hidden map remains in exports.
  if(!data.base)o.removeFromParent();
  const uv=g.attributes.uv;let u0=1,u1=0,v0=1,v1=0;
  for(let k=0;k<uv.count;k++){u0=Math.min(u0,uv.getX(k));u1=Math.max(u1,uv.getX(k));v0=Math.min(v0,uv.getY(k));v1=Math.max(v1,uv.getY(k));}
  const xy=([u,v])=>[(u-u0)/(u1-u0)*size.x+b.min.x,(v-v0)/(v1-v0)*size.y+b.min.y];
  for(const part of data.paths){
   if(part.outer.some(([u,v])=>u<u0-.002||u>u1+.002||v<v0-.002||v>v1+.002))continue;
   const contour=(points,shape)=>{points.map(xy).forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return shape;};
   const shape=contour(part.outer,new T.Shape());for(const h of part.holes)shape.holes.push(contour(h,new T.Path()));
   const geo=new T.ExtrudeGeometry(shape,{depth:.0006,bevelEnabled:false,steps:1,curveSegments:1});
   if(name==='lantern-gold-v11'){
    const p=geo.attributes.position;for(let j=0;j<p.count;j++){const x=p.getX(j),y=p.getY(j);p.setZ(j,.3444*Math.sqrt(Math.max(0,1-(x/.441)**2-(y/.3318)**2))+.003+p.getZ(j));}geo.computeVertexNormals();
   }else geo.translate(0,0,b.max.z+.0007);
   const mesh=new T.Mesh(geo,ink(part.color));mesh.name='闭合轮廓印纹';group.add(mesh);vectorParts++;
  }
 }
 root.userData.solidAudit={vectorParts,tileCount,imageMaps:0};
 root.traverse(o=>{if(o.isMesh&&o.material.map)throw new Error('Unexpected image map: '+o.name);});
}
