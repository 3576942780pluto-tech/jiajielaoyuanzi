import {L} from './layout.js?v=21.3';
// Navigation uses the same working dimensions as the render model.
export function surface(x,z,level='yard'){
 if(level==='cellar')return z>=L.platformFront-.12?0:z>=L.platformFront-.12-L.cellarStepDepth?L.cellarFloor/2:L.cellarFloor;
 if(x>L.gateX)return -L.rampDrop*Math.min((x-L.gateX)/L.rampLength,1);
 if(z<=L.platformFront)return L.platformHeight;
 if(Math.abs(x)<L.stairWidth/2 && z<0)return Math.min(L.platformHeight,Math.ceil(-z/L.tread)*L.riser);
 const st=L.doorstep;
 if(Math.abs(x)>L.halfWidth-st.depth&&Math.abs(x)<=L.halfWidth){const items=x<0?L.west:L.east;if(items.some(o=>o.kind==='door'&&Math.abs(z-o.u)<(L.sideDoorLeafWidth+st.extraWidth)/2))return st.height;}
 return 0;
}
export function passable(x,z,gateAngle,level='yard'){
 if(level==='cellar')return Math.abs(Math.abs(x)-L.cellarX)<L.cellarDoorWidth/2-.18&&z>L.cellarBack+.24&&z<=L.platformFront+.1;
 if(z>L.south-.26||z<L.northFacade+.27)return false;
 if(z<=L.platformFront)return Math.abs(x)<L.halfWidth+L.sideDepth-.24;
 if(x>L.halfWidth-.24)return x<10.2&&Math.abs(z-L.gateZ)<1.08&&(gateAngle>.95||Math.abs(x-L.gateX)>.24);
 if(x< -L.halfWidth+.24)return false;
 if(z< -1.68)return Math.abs(x)<2.18||Math.abs(x)>2.72;
 // Basin is a blocking object, not a pass-through decorative cube.
 const b=L.basin;
 if(Math.abs(x-b.x)<b.width/2+.18&&Math.abs(z-b.z)<b.depth/2+.18)return false;
 return true;
}
export function movePlayer(p,dx,dz,angle){
 const q={...p};
 for(const [ax,delta]of [['x',dx],['z',dz]]){
  const t={...q,[ax]:q[ax]+delta};
  let level=q.level||'yard';
  if(level==='cellar'&&t.z>L.platformFront)level='yard';
  else if(level!=='cellar'&&q.z>L.platformFront&&t.z<=L.platformFront&&Math.abs(Math.abs(t.x)-L.cellarX)<L.cellarDoorWidth/2-.18&&surface(q.x,q.z,level)<.3)level='cellar';
  if(passable(t.x,t.z,angle,level)&&Math.abs(surface(t.x,t.z,level)-surface(q.x,q.z,q.level))<=.205){q[ax]=t[ax];q.level=level;}
 }
 return q;
}
