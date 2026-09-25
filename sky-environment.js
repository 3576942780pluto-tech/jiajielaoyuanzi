import * as T from './vendor/three.module.js';
// Scenic environment, intentionally decorative rather than surveyed surroundings.
export function createSkyEnvironment(scene){
 const root=new T.Group();root.name='天空与装饰性远景';scene.add(root);
 const uniforms={reveal:{value:1},day:{value:1},time:{value:0},zenith:{value:new T.Color('#8faeba')},horizon:{value:new T.Color('#e9ddce')}};
 const sky=new T.Mesh(new T.SphereGeometry(110,40,24),new T.ShaderMaterial({side:T.BackSide,transparent:true,depthWrite:false,uniforms,vertexShader:'varying vec3 skyDir; void main(){skyDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float reveal;uniform float day;uniform float time;uniform vec3 zenith;uniform vec3 horizon;varying vec3 skyDir;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main(){vec3 d=normalize(skyDir);float h=max(d.y,0.);vec3 col=mix(horizon,zenith,smoothstep(0.,.85,h));
 vec2 p=d.xz/max(.18,d.y+.25)*2.5+vec2(time*.002,0.);float n=noise(p)*.58+noise(p*2.03)*.28+noise(p*4.1)*.14;
 float cloud=smoothstep(.53,.78,n)*smoothstep(.08,.28,h)*(1.-smoothstep(.6,.95,h));col=mix(col,vec3(.98,.95,.90),cloud*day*.60);
 gl_FragColor=vec4(col,reveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`}));sky.renderOrder=-10;root.add(sky);
 let seed=473;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const starPos=[],starSize=[];for(let i=0;i<850;i++){const az=rnd()*Math.PI*2,y=.09+rnd()*.91,r=Math.sqrt(1-y*y);starPos.push(Math.cos(az)*r*97,y*97,Math.sin(az)*r*97);starSize.push(1+rnd()*2.3);}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.Float32BufferAttribute(starPos,3));sg.setAttribute('spark',new T.Float32BufferAttribute(starSize,1));
 const stars=new T.Points(sg,new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},alpha:{value:1}},vertexShader:'attribute float spark;uniform float time;varying float glow;void main(){glow=.7+.3*sin(time*.6+position.x);gl_PointSize=spark;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float alpha;varying float glow;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.84,.9,1.,smoothstep(.5,.04,d)*glow*alpha);}'}));root.add(stars);
 const moon=new T.Mesh(new T.SphereGeometry(2.1,36,24),new T.ShaderMaterial({transparent:true,uniforms:{reveal:{value:1}},vertexShader:'varying vec3 p;void main(){p=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float reveal;varying vec3 p;void main(){float light=smoothstep(-.15,.55,dot(normalize(p),normalize(vec3(-.7,.3,1.))));float grain=sin(p.x*44.)*sin(p.y*37.)*.035+sin(p.y*83.+p.z*30.)*.025;vec3 c=mix(vec3(.07,.10,.18),vec3(.89,.89,.76)+grain,light);gl_FragColor=vec4(c,reveal);\n #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}'}));moon.position.set(8,16,-61);root.add(moon);
 const solar=new T.Mesh(new T.SphereGeometry(1.65,32,20),new T.MeshBasicMaterial({color:'#fff0bf',fog:false}));solar.position.set(12,17,-58);root.add(solar);
 function halo(body,color,size){const m=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{tint:{value:new T.Color(color)}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 v;uniform vec3 tint;void main(){float d=length(v-.5)*2.;gl_FragColor=vec4(tint,pow(max(0.,1.-d),3.)*.3);}'});const o=new T.Mesh(new T.PlaneGeometry(size,size),m);o.position.copy(body.position);root.add(o);return o;}
 const sunHalo=halo(solar,'#ffbf6c',17),moonHalo=halo(moon,'#96b3e1',13);
 const groundUniforms={reveal:{value:1},center:{value:new T.Color('#cfc5b6')},edge:{value:new T.Color('#e9ddce')}};
 const groundMat=new T.ShaderMaterial({transparent:true,uniforms:groundUniforms,vertexShader:'varying vec2 p;void main(){p=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform vec3 center;uniform vec3 edge;uniform float reveal;varying vec2 p;
 void main(){float dist=length(p/vec2(60.,65.));vec3 col=mix(center,edge,smoothstep(.12,1.,dist));float shadow=exp(-pow(length((p-vec2(1.,-2.5))/vec2(13.,16.)),4.)*2.);col*=1.-.24*shadow;gl_FragColor=vec4(col,reveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`});const ground=new T.Mesh(new T.CircleGeometry(105,96),groundMat);ground.rotation.x=-Math.PI/2;ground.position.y=-1.36;root.add(ground);
 const hills=[];for(let ring=0;ring<3;ring++){const v=[],ids=[],rad=73+ring*10;for(let i=0;i<=128;i++){const a=i/128*Math.PI*2,height=.6+ring*.9+Math.sin(a*3+ring)*.65+Math.sin(a*7+ring)*.35;v.push(Math.cos(a)*rad,-.7,Math.sin(a)*rad,Math.cos(a)*rad,height,Math.sin(a)*rad);if(i<128){const k=i*2;ids.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(ids);g.computeVertexNormals();const m=new T.MeshBasicMaterial({color:['#b4b9b0','#c6c9bf','#dbd8cc'][ring],side:T.DoubleSide,fog:false});const h=new T.Mesh(g,m);root.add(h);hills.push(m);}
 let daylight=true,overcast=false,reveal=1,hillFade=1;
 function updateReveal(){uniforms.reveal.value=reveal;groundUniforms.reveal.value=reveal;moon.material.uniforms.reveal.value=reveal;stars.material.uniforms.alpha.value=reveal*(overcast?.22:.72);for(const o of [solar,sunHalo,moonHalo]){o.material.transparent=true;o.material.opacity=reveal;}hills.forEach(m=>{m.transparent=true;m.opacity=reveal*hillFade;});}
 return {root,reveal(value){reveal=value;updateReveal();},set(day,kind){daylight=day;overcast=['rain','snow','cloud'].includes(kind);uniforms.day.value=day?1:0;uniforms.zenith.value.set(day?overcast?'#a0b1b8':'#8faeba':'#091426');uniforms.horizon.value.set(day?overcast?'#dddcd4':'#e9ddce':'#24334c');stars.visible=!day;moon.visible=!day;moonHalo.visible=!day&&!overcast;solar.visible=day&&!overcast;sunHalo.visible=solar.visible;groundUniforms.center.value.set(day?'#cfc5b6':'#283649');groundUniforms.edge.value.set(day?overcast?'#dddcd4':'#e9ddce':'#24334c');hills.forEach((m,i)=>m.color.set(day?['#b4b9b0','#c6c9bf','#dbd8cc'][i]:['#29394d','#2d3d53','#32435d'][i]));updateReveal();},sunPosition:solar.position,update(t,camera){hillFade=1-T.MathUtils.smoothstep(camera.position.y,6,16);hills.forEach(m=>m.opacity=reveal*hillFade);uniforms.time.value=t;stars.material.uniforms.time.value=t;sunHalo.quaternion.copy(camera.quaternion);moonHalo.quaternion.copy(camera.quaternion);}};
}
