import * as T from './vendor/three.module.js';
const bevels=new Map();
// Rounded solid blocks with sub-millimetre surface variation, never image displacement.
export function mineralBlock(w,h,d,seed=0,nx=8,nz=4){
 const r=Math.min(.0025,h*.12),geo=new T.BoxGeometry(w,h,d,nx,2,nz),a=geo.attributes.position;
 const half=new T.Vector3(w/2,h/2,d/2),core=half.clone().addScalar(-r);
 for(let i=0;i<a.count;i++){
  const v=new T.Vector3().fromBufferAttribute(a,i),c=v.clone().clamp(core.clone().negate(),core),n=v.clone().sub(c).normalize();v.copy(c).addScaledVector(n,r);
  if(v.y>h/2-r-.00001){const edge=Math.max(0,Math.min(1,(half.x-Math.abs(v.x))/.015,(half.z-Math.abs(v.z))/.012));
   const grain=Math.sin(v.x*137+seed*1.71)*Math.cos(v.z*193+seed*.91)+.4*Math.sin(v.x*313+v.z*119+seed);
   v.y+=grain*.00032*edge;
  }a.setXYZ(i,v.x,v.y,v.z);
 }geo.computeVertexNormals();geo.type='MineralBlockGeometry';return geo;
}
export function beveledBox(w,h,d,r=Math.min(w,h,d)*.13){
 r=Math.min(r,.008,w*.2,h*.2,d*.2);const key=[w,h,d,r].map(n=>n.toFixed(5)).join('/');
 if(bevels.has(key))return bevels.get(key);
 const s=new T.Shape(),x=w/2-r,y=h/2-r;
 s.moveTo(-x,-y);s.lineTo(x,-y);s.lineTo(x,y);s.lineTo(-x,y);s.closePath();
 const geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:r>0,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1,curveSegments:1});
 geo.translate(0,0,-d/2+r);geo.userData.dimensions=[w,h,d];bevels.set(key,geo);return geo;
}
export function solidMat(color,kind='masonry'){
 const sets={masonry:[.86,0],ceramic:[.25,0],steel:[.23,.92],wood:[.52,0],leaf:[.6,0],paper:[.8,0]};
 const [roughness,metalness]=sets[kind]||sets.masonry;
 const m=new T.MeshStandardMaterial({color,roughness,metalness});m.userData.surface=kind;return m;
}
