import * as T from './vendor/three.module.js';
// Preserve editable source objects in Blender, but batch static web geometry by material.
export function batchStatic(root,movingRoots){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map(),moving=new Set(movingRoots),remove=[];
 root.traverse(o=>{
  if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
  for(let p=o;p;p=p.parent)if(moving.has(p))return;
  const key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,p:[],n:[],uv:[],index:[]});
  const local=new T.Matrix4().multiplyMatrices(inverse,o.matrixWorld),b=buckets.get(key),g=o.geometry,p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv,off=b.p.length/3,normal=new T.Matrix3().getNormalMatrix(local),v=new T.Vector3();
  for(let i=0;i<p.count;i++){
   v.fromBufferAttribute(p,i).applyMatrix4(local);b.p.push(v.x,v.y,v.z);
   if(n)v.fromBufferAttribute(n,i).applyMatrix3(normal).normalize();else v.set(0,1,0);b.n.push(v.x,v.y,v.z);
   b.uv.push(uv?uv.getX(i):0,uv?uv.getY(i):0);
  }
  if(g.index)for(const i of g.index.array)b.index.push(i+off);else for(let i=0;i<p.count;i++)b.index.push(i+off);
  remove.push(o);
 });
 for(const o of remove)o.removeFromParent();
 for(const b of buckets.values()){
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new T.Float32BufferAttribute(b.uv,2));g.setIndex(b.index);g.computeBoundingSphere();
  const mesh=new T.Mesh(g,b.material);mesh.castShadow=mesh.receiveShadow=true;mesh.name='static-material-batch';root.add(mesh);
 }
 return {sourceMeshes:remove.length,batches:buckets.size};
}
