import * as T from './vendor/three.module.js';
// Separate photographed joinery families: north timber, side aluminium, and small cellar windows.
export function joinery({box,rod,ball,tileMaterial}){
 const glass=new T.MeshPhysicalMaterial({color:'#e1e5de',roughness:.065,metalness:0,transparent:true,opacity:.34,ior:1.48,reflectivity:.5,clearcoat:0});
 glass.userData.surface='glass';
 const upperGlass=glass.clone();upperGlass.color.set('#dce0d5');upperGlass.opacity=.49;upperGlass.roughness=.20;
 const rubber='#39423c',silver='#bbc0b2';
 function rectangle(parent,x,y,z,w,h,c,t=.026){
  for(const dx of [-w/2,w/2])box(t,h,.042,x+dx,y,z,c,parent);
  for(const dy of [-h/2,h/2])box(w,t,.042,x,y+dy,z,c,parent);
 }
 function window(parent,x,y,z,w,h=1.85,frame='#67534a',cols=3,profile=null){
  const north=profile==='north'||(!profile&&parent.name?.startsWith('N-')),transom=profile==='transom'||h<.65;
  const rows=transom?[0,1]:north?[0,.22,.49,.75,1]:h<.9?[0,.5,1]:[0,.65,1];
  const thick=north?.035:.027;
  // Recessed reveal and dark room depth; no flat opaque board immediately behind glazing.
  rectangle(parent,x,y,z-.025,w+.10,h+.10,'#d5d7ca',.055);
  box(w-.04,h-.04,.035,x,y,z-.19,'#222720',parent);
  for(let c=0;c<cols;c++)for(let r=0;r<rows.length-1;r++){
   const cw=w/cols,ch=h*(rows[r+1]-rows[r]),px=x-w/2+(c+.5)*cw,py=y-h/2+h*(rows[r]+rows[r+1])/2;
   box(cw-.052,ch-.047,.014,px,py,z+.054,r===rows.length-2?upperGlass:glass,parent);
   rectangle(parent,px,py,z+.074,cw-.044,ch-.042,rubber,.008);
   rectangle(parent,px,py,z+.088,cw-.018,ch-.017,frame,thick);
   // Rebate lip and corner screws are separate solid pieces.
   rectangle(parent,px,py,z+.103,cw-.067,ch-.065,north?'#644339':'#c7c8b9',.006);
   for(const sx of [-1,1])for(const sy of [-1,1]){const screw=ball(.0035,px+sx*(cw/2-.03),py+sy*(ch/2-.03),z+.11,'#777d73',parent);screw.scale.z=.38;}
  }
  rectangle(parent,x,y,z+.085,w,h,frame,thick+.014);
  rectangle(parent,x,y,z+.106,w-.04,h-.04,north?'#97624c':silver,.007);
  if(north&&!transom){
   const ww=w*.48,hh=h*.53;
   rectangle(parent,x,y-.018,z+.121,ww,hh,frame,.034);
   box(.028,hh,.045,x,y-.018,z+.125,frame,parent);
   for(const side of [-1,1]){
    for(const yy of [-hh*.36,hh*.36])box(.018,.068,.028,x+side*ww/2,y+yy,z+.15,'#777567',parent);
    rod([x+side*.05,y-.10,z+.153],[x+side*.05,y+.015,z+.153],.008,'#b5ad8d',parent);
   }
  }else if(!transom&&w>1){
   for(const sign of [-1,1])box(.012,.08,.028,x+sign*w/6,y-h*.02,z+.128,'#a2a999',parent);
  }
  if(!transom){box(w+.12,.058,.24,x,y-h/2-.045,z+.07,tileMaterial('tile-red',w+.12,.058,.30,.45),parent);
  box(w+.10,.014,.018,x,y-h/2-.080,z+.18,'#6a3930',parent);}
 }
 function door(parent,x,floor,z,w,curtain=false,plain=false,frame='#746e5c',leafWidth=null,doubleLeaf=false){
  const north=parent.name?.startsWith('N-'),wc=parent.name==='WC-D';
  const h=plain?2.05:2.5;
  box(w,h,.035,x,floor+h/2,z+.040,'#17201d',parent);
  if(plain){
   const c=wc?'#c1c1ad':'#6b8380';
   box(w-.07,h-.05,.032,x,floor+h/2,z+.054,c,parent);
   rectangle(parent,x,floor+h/2,z+.095,w,h,frame,.044);
   rectangle(parent,x,floor+.67,z+.080,w-.18,1.02,c,.022);
   window(parent,x,floor+1.65,z+.072,w-.14,.57,frame,2,'side');
   rod([x+w*.32,floor+.94,z+.11],[x+w*.32,floor+1.05,z+.11],.008,'#9d9f8d',parent);return;
  }
  const leaf=leafWidth??w*.58,side=(w-leaf)/2,leafH=north?1.81:1.94;
  rectangle(parent,x,floor+h/2,z+.080,w,h,frame,.048);
  for(const sign of [-1,1]){
   const px=x+sign*(leaf/2+side/2);
   window(parent,px,floor+1.35,z+.043,side-.045,1.34,frame,1,north?'north':'side');
   box(side-.048,.67,.035,px,floor+.335,z+.07,tileMaterial('tile-white',side-.048,.67,1.92,.24),parent);
   if(floor>0)box(side-.048,floor,.12,px,floor/2,z+.014,'#d1d0c4',parent);
  }
  window(parent,x,floor+leafH+(h-leafH)/2,z+.054,w-.05,h-leafH-.026,frame,4,'transom');
  const pivot=new T.Group();pivot.name=parent.name+'_门扇';parent.add(pivot);pivot.position.set(x-leaf/2,floor,z+.13);
  if(north)pivot.rotation.y=0;
  const panelW=doubleLeaf?leaf/2:leaf,parts=doubleLeaf?[0,1]:[0];
  for(const k of parts){const px=panelW*(k+.5);
   box(panelW-.018,leafH,.045,px,leafH/2,0,curtain?'#a99266':north?'#5c352a':'#4b6356',pivot);
   if(curtain){
    for(let j=0;j<Math.floor(panelW/.015);j++)box(.007,leafH-.035,.008,k*panelW+.012+j*.015,leafH/2,.028,j%3?'#bda777':'#89774e',pivot);
    for(let j=0;j<7;j++)box(panelW-.02,.005,.01,px,.10+j*(leafH-.2)/6,.034,'#746344',pivot);
   }else{
    box(panelW-.11,leafH*.45,.014,px,leafH*.74,.027,glass,pivot);
    rectangle(pivot,px,leafH*.74,.041,panelW-.09,leafH*.46,frame,.022);
    rectangle(pivot,px,leafH*.255,.035,panelW-.10,leafH*.40,frame,.02);
   }
   const hx=doubleLeaf?(k?panelW+.065:panelW-.065):panelW-.10;
   box(.025,.13,.02,hx,.98,.045,'#a2a38e',pivot);rod([hx,.955,.064],[hx,1.04,.064],.009,'#c2bda3',pivot);
   for(const yy of [.20,leafH-.23]){const hingeX=doubleLeaf&&k===1?leaf-.018:k*panelW+.018;
    box(.027,.088,.058,hingeX,yy,0,'#83877a',pivot);
    rod([hingeX,yy-.052,.035],[hingeX,yy+.052,.035],.007,'#a2a999',pivot);
    for(const offset of [-.032,.032]){const screw=ball(.0035,hingeX+.013,yy+offset,.032,'#777d73',pivot);screw.scale.z=.38;}
   }
  }
  box(leaf+.1,.038,.23,x,floor+.019,z+.10,'#a9a99a',parent);
 }
 return {window,door};
}
