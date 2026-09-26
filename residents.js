import * as T from './vendor/three.module.js';

export const PEOPLE=[{name:'小禾',height:1.62}];
const material=(color,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
export function shape(parent,geo,mat,p=[0,0,0],scale=[1,1,1]){const o=new T.Mesh(geo,mat);o.position.fromArray(p);o.scale.fromArray(scale);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
export function bar(parent,a,b,r,mat){const o=shape(parent,new T.CylinderGeometry(r,r,1,12),mat);between(o,a,b);return o;}
function between(o,a,b){const v=new T.Vector3(...b).sub(new T.Vector3(...a));o.position.copy(new T.Vector3(...a).addScaledVector(v,.5));o.scale.y=v.length();o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());}
export function makeResident(){
 const root=new T.Group();root.name='原创人物_小禾';const scale=1.62/1.7;root.scale.setScalar(scale);
 const skin=material('#e9b894'),coat=material('#287c7b'),pants=material('#394d5b'),shoe=material('#eee8d7'),hair=material('#302e32'),scarf=material('#bd4f3c'),dark=material('#302b2c'),white=material('#fff5e1');
 const sphere=new T.SphereGeometry(1,28,20);
 const torso=shape(root,new T.LatheGeometry([[.17,0],[.21,.04],[.23,.15],[.22,.38],[.18,.47],[.10,.50]].map(([x,y])=>new T.Vector2(x,y)),28),coat,[0,.80,0],[1,1,.72]);
 shape(root,sphere,skin,[0,1.33,0],[.073,.095,.074]);
 const head=new T.Group();head.name='小禾_立体五官';head.position.set(0,1.54,0);root.add(head);
 shape(head,sphere,skin,[0,0,0],[.174,.207,.155]);
 for(const s of [-1,1]){
  shape(head,sphere,skin,[s*.168,-.015,0],[.035,.049,.032]);
  shape(head,sphere,material('#d99d82'),[s*.189,-.014,.013],[.012,.025,.014]);
  shape(head,sphere,white,[s*.062,.008,.139],[.033,.043,.018]);
  shape(head,sphere,dark,[s*.062,.006,.155],[.020,.030,.010]);
  shape(head,sphere,white,[s*.057,.016,.164],[.007,.009,.004]);
  const brow=bar(head,[s*.035,.071,.142],[s*.088,.075,.125],.010,hair);brow.name='眉毛';
  shape(head,sphere,material('#dd9c89'),[s*.106,-.046,.121],[.029,.014,.006]);
 }
 shape(head,sphere,skin,[0,-.033,.159],[.026,.034,.034]);
 const smile=new T.CatmullRomCurve3([new T.Vector3(-.044,-.086,.137),new T.Vector3(0,-.096,.149),new T.Vector3(.044,-.086,.137)]);
 shape(head,new T.TubeGeometry(smile,20,.005,7,false),material('#975346'));
 const cap=shape(head,new T.SphereGeometry(1,28,20,0,Math.PI*2,0,1.8),hair,[0,.022,-.013],[.179,.202,.161]);
 const hp=cap.geometry.attributes.position;for(let i=0;i<hp.count;i++){const a=Math.atan2(hp.getZ(i),hp.getX(i)),t=Math.acos(T.MathUtils.clamp(hp.getY(i),-1,1))/1.8*(1.8-.64*Math.max(0,Math.sin(a)));hp.setXYZ(i,Math.cos(a)*Math.sin(t),Math.cos(t),Math.sin(a)*Math.sin(t));}cap.geometry.computeVertexNormals();
 for(const [x,y,z,sx,sy,rz]of [[-.08,.143,.093,.085,.053,-.4],[.014,.163,.093,.085,.045,.2],[.098,.147,.075,.062,.045,.4]]){const tuft=shape(head,sphere,hair,[x,y,z],[sx,sy,.067]);tuft.rotation.z=rz;}
 for(const s of [-1,1]){
  shape(root,sphere,coat,[s*.215,1.235,0],[.079,.083,.083]);
  bar(root,[s*.095,.91,.156],[s*.17,.94,.135],.007,material('#1b6063'));
 }
 const collar=shape(root,new T.TorusGeometry(.095,.038,12,32),scarf,[0,1.30,0]);collar.rotation.x=Math.PI/2;collar.scale.set(1.15,1,1);
 const tail=shape(root,new T.CapsuleGeometry(.037,.19,6,12),scarf,[.084,1.17,.173],[1,1,.40]);tail.rotation.z=-.16;
 bar(root,[0,.84,.157],[0,1.22,.159],.004,material('#c4c1a8'));
 for(const y of [.95,1.06,1.17])shape(root,sphere,material('#d4b96d',.4,.2),[.018,y,.165],[.012,.012,.006]);
 shape(root,sphere,material('#e0b64e'),[-.135,1.145,.143],[.023,.025,.009]);
 const limbs=[];
 for(const s of [-1,1])for(const leg of [true,false]){const m=leg?pants:coat,r=leg?.076:.068;limbs.push({s,leg,a:bar(root,[0,0,0],[0,1,0],r,m),b:bar(root,[0,0,0],[0,1,0],r*.86,m),joint:shape(root,sphere,m,[0,0,0],[r,r,r]),end:shape(root,sphere,leg?shoe:skin,[0,0,0],leg?[.084,.058,.145]:[.04,.063,.035])});}
 function pose(time,moving,riding=false){for(const l of limbs){const swing=moving?Math.sin(time*7+l.s*Math.PI/2)*.27:0;let a,b,c;
  if(l.leg){a=[l.s*.105,.84,0];b=[l.s*.105,.45,Math.sin(swing)*.36];c=[l.s*.105,.075,Math.sin(swing)*.65];if(riding){b=[l.s*.18,.73,.34];c=[l.s*.17,(.28-(.91-.84*scale))/scale,.40/scale];}}
  else{a=[l.s*.225,1.25,0];b=[l.s*.26,.99,-Math.sin(swing)*.20];c=[l.s*.255,.76,-Math.sin(swing)*.38];if(riding){b=[l.s*.30,1.09,.26];c=[l.s*.28/scale,(1.17-(.91-.84*scale))/scale,.65/scale];}}
  between(l.a,a,b);between(l.b,b,c);l.joint.position.fromArray(b);l.end.position.fromArray(c);if(l.leg)l.end.position.z+=.045;
 }torso.rotation.z=moving&&!riding?Math.sin(time*7)*.018:0;}
 pose(0,false);return {root,pose,scale};
}

export function makeScooter(){
 const root=new T.Group();root.name='照片电动车_银白车身';const silver=material('#aeb7b3',.28,.72),white=material('#e2e5d9',.32,.12),rubber=material('#24282a',.85),seat=material('#3c4140',.72),red=material('#b82a22',.25),wheels=[];
 const ball=new T.SphereGeometry(1,20,14),box=new T.BoxGeometry(1,1,1);
 for(const z of [-.63,.67]){const g=new T.Group();g.position.set(0,.30,z);root.add(g);const tire=shape(g,new T.TorusGeometry(.245,.052,12,40),rubber);tire.rotation.y=Math.PI/2;const rim=shape(g,new T.TorusGeometry(.202,.015,8,32),silver);rim.rotation.y=Math.PI/2;for(let i=0;i<12;i++){const a=i*Math.PI/6;bar(g,[0,0,0],[0,Math.cos(a)*.20,Math.sin(a)*.20],.006,silver);}const hub=shape(g,new T.CylinderGeometry(.058,.058,.18,16),silver);hub.rotation.z=Math.PI/2;wheels.push(g);}
 bar(root,[0,.31,-.63],[0,.43,.17],.043,silver);bar(root,[0,.43,.17],[0,.95,.55],.043,silver);
 shape(root,box,white,[0,.29,.05],[.39,.09,.72]);for(let i=0;i<6;i++)shape(root,box,rubber,[0,.342,-.20+i*.08],[.29,.012,.02]);
 shape(root,ball,white,[0,.49,.40],[.23,.35,.13]);shape(root,box,white,[0,.48,-.35],[.31,.32,.35]);shape(root,ball,seat,[0,.87,-.22],[.235,.068,.37]);
 for(const s of [-1,1]){bar(root,[s*.095,.31,.67],[s*.095,.91,.52],.025,silver);bar(root,[s*.14,.32,-.60],[s*.14,.73,-.38],.029,silver);bar(root,[s*.19,.60,-.67],[s*.19,.77,-.78],.018,silver);}
 bar(root,[0,.84,.53],[0,1.14,.61],.026,silver);bar(root,[-.35,1.17,.65],[.35,1.17,.65],.023,silver);
 for(const s of [-1,1]){bar(root,[s*.24,1.17,.65],[s*.37,1.17,.65],.031,rubber);bar(root,[s*.21,1.17,.63],[s*.25,1.36,.65],.008,silver);shape(root,ball,silver,[s*.25,1.37,.65],[.063,.042,.02]);}
 shape(root,ball,silver,[0,1.12,.67],[.105,.065,.05]);shape(root,ball,material('#f7f1d6',.18),[0,1.12,.707],[.077,.047,.014]);
 shape(root,box,red,[0,.67,-.73],[.12,.16,.025]);shape(root,box,material('#ceddd1'),[0,.52,-.75],[.16,.12,.012]);
 // Open tubular rear rack and wire basket match the visible rear silhouette.
 for(const x of [-.19,.19])bar(root,[x,.77,-.92],[x,.77,-.52],.014,silver);
 for(const z of [-.92,-.79,-.66,-.52])bar(root,[-.19,.77,z],[.19,.77,z],.012,silver);
 for(let i=0;i<8;i++){const x=-.21+i*.06;bar(root,[x,.80,.78],[x,1.04,.85],.004,silver);bar(root,[x,.80,1.02],[x,1.04,1.09],.004,silver);}
 for(let j=0;j<4;j++){const y=.80+j*.08;bar(root,[-.21,y,.78],[.21,y,.78],.004,silver);bar(root,[-.21,y,1.03],[.21,y,1.03],.004,silver);bar(root,[-.21,y,.78],[-.21,y,1.03],.004,silver);bar(root,[.21,y,.78],[.21,y,1.03],.004,silver);}
 const stand=bar(root,[.10,.30,-.28],[.24,.035,-.36],.016,silver);root.position.set(.20,0,1.7);root.rotation.y=Math.PI;
 return {root,wheels,stand};
}
