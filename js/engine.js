/* 粒子引擎：一個 canvas、一個 context、同一群粒子。啟動拆成多個短工作，不卡主執行緒。 */
(function(){
'use strict';
var RA=window.RA,C=RA.C,root=document.documentElement,qs=new URLSearchParams(location.search),DEBUG=qs.get('debug')==='1';
var cv=document.getElementById('gl');
function $$(s){return [].slice.call(document.querySelectorAll(s))}
function noGL(){root.classList.remove('gl-on');root.classList.add('no-gl')}

/* ---------- 取得 context；失敗就留在靜態層 ---------- */
var gl=null,RENDERER='';
if(!qs.has('nogl')){try{gl=cv.getContext('webgl2',{failIfMajorPerformanceCaveat:!qs.has('sw'),antialias:false,alpha:true,premultipliedAlpha:true,powerPreference:'high-performance',depth:false,stencil:false})}catch(e){}}
if(gl){var ri=gl.getExtension('WEBGL_debug_renderer_info');RENDERER=ri?gl.getParameter(ri.UNMASKED_RENDERER_WEBGL):'unknown';
  if(/swiftshader|llvmpipe|softpipe|software|basic render/i.test(RENDERER)&&!qs.has('sw'))gl=null}
if(!gl){noGL();return}

var INAPP=/\bLine\/|FBAN|FBAV|FB_IAB|Instagram/.test(navigator.userAgent);
var MOBILE=innerWidth<768;
var DPR0=Math.max(1,Math.min(devicePixelRatio||1,MOBILE?1.75:1.5)),DPR=DPR0;
var N=MOBILE?28000:64000,NA=MOBILE?240:520,NAMB=MOBILE?4500:10000;
var countScale=INAPP?.7:1;
var SHAPE_ORDER=C.SHAPE_ORDER,SHAPE_IDX=C.SHAPE_IDX;

/* ---------- 著色器 ---------- */
var MASK='uniform vec4 uR[6];uniform float uRD[6];uniform vec2 uRes;uniform vec2 uSeam;'+
'float maskAt(vec2 p){float m=1.;for(int i=0;i<6;i++){vec2 d=abs(p-uR[i].xy)-uR[i].zw;float e=length(max(d,0.));float f=smoothstep(0.,56.,e);m=min(m,mix(uRD[i],1.,f));}return m;}'+
'float paperAt(float y,float r){float j=(r-.5)*150.;return step(uSeam.x+j,y)*(1.-step(uSeam.y+j,y));}';
var VS='#version 300 es\nprecision highp float;\n'+
'layout(location=0)in vec4 aAp;layout(location=1)in vec4 aAn;layout(location=2)in vec4 aBp;layout(location=3)in vec4 aBn;layout(location=4)in vec4 aR;\n'+
'uniform float uPX,uPass,uT,uTime,uBase,uF,uAsp,uCoc,uAmp,uCamZ,uNa,uCocMax,uPxMax,uWA,uWB,uDimA,uDimB,uDotA,uMess,uSolA,uSolB,uSolP,uSolF;uniform vec3 uDir,uCam,uLt,uDot,uInk,uStamp;uniform vec2 uG;\n'+
'uniform mat3 uRA,uRB;uniform vec4 uOA,uOB;uniform vec3 uFA,uLA,uCA,uFB,uLB,uCB;\n'+MASK+
'out vec4 vC;out vec2 vB;\n'+
'vec3 cn(vec3 p,float t){return vec3(sin(p.y*1.3+p.z*.7+t)+sin(p.z*2.1+1.7),sin(p.z*1.1+p.x*.9+1.3+t)+sin(p.x*1.9+.4),sin(p.x*1.2+p.y*1.4+2.1-t)+sin(p.y*2.3+3.));}\n'+
'float wv(vec3 a,float t){return (sin(a.x*1.5+t*.55)+.7*sin(a.y*2.2-t*.42+a.x*.8)+.35*sin(a.x*3.7+a.y*3.1+t*.3));}\n'+
'vec3 shade(vec3 n,float tag,float e,float pl,vec3 F,vec3 L,vec3 C){vec3 l=normalize(vec3(-.55,.62,.56));float nl=dot(n,l)*.5+.5;nl=nl*nl;float k=clamp(nl*.58+pl*.62-.1+e*.55,0.,1.);vec3 c=mix(F*.72,L,k);return mix(c,C,tag);}\n'+
'void main(){\n'+
' bool isDot=gl_VertexID<int(uNa);\n'+
' vec3 A=aAp.xyz*8.,B=aBp.xyz*8.;\n'+
' if(uWA>0.)A.z+=wv(A,uTime)*uWA;if(uWB>0.)B.z+=wv(B,uTime)*uWB;\n'+
' float wave=clamp(dot(A,uDir)*.28+.5,0.,1.);float d=.6*mix(wave,aR.w,.22);if(isDot)d=.18;float q=clamp((uT-d)/.4,0.,1.);float m=q*q*q*(q*(q*6.-15.)+10.);float bell=sin(3.14159*m);\n'+
' vec3 pa=uRA*A*uOA.w+uOA.xyz,pb=uRB*B*uOB.w+uOB.xyz;\n'+
' vec3 na=uRA*aAn.xyz,nb=uRB*aBn.xyz;vec3 nm=mix(na,nb,m);vec3 n=dot(nm,nm)<1e-4?vec3(0.,0.,1.):normalize(nm);\n'+
' vec3 p=mix(pa,pb,m);\n'+
' if(isDot){p.z+=bell*1.1;p+=cn(p*.5,0.)*bell*.05;}else{\n'+
'  p+=cn(p*1.05+aR.xyz*.25,uTime*.12)*(uAmp*bell*uMess)+cn(p*2.3,uTime*.25)*.0035;\n'+
'  p.z+=bell*uMess*(aR.y-.42)*2.3;}\n'+
' vec3 v=p-uCam;v.z-=uCamZ;float w=-v.z;\n'+
' gl_Position=vec4(v.x*uF/uAsp,v.y*uF,0.,w);\n'+
' vec2 sp=vec2(v.x*uF/uAsp/w*.5+.5,.5-v.y*uF/w*.5)*uRes;\n'+
' float tag=mix(aAp.w,aBp.w,m);float e=mix(aAn.w,aBn.w,m);\n'+
' vec3 lp=mix(uOA.xyz,uOB.xyz,m)+uLt;float dl=length(p-lp);float pl=1./(1.+dl*dl*.3);\n'+
' vec3 c=mix(shade(n,aAp.w,aAn.w,pl,uFA,uLA,uCA),shade(n,aBp.w,aBn.w,pl,uFB,uLB,uCB),m);\n'+
' float facing=smoothstep(-.35,.2,n.z);\n'+
' float fog=clamp((w-uCamZ+.55)/1.9,0.,1.);c=mix(c,mix(uFA,uFB,m)*.5,fog*.72);\n'+
' float P=paperAt(sp.y,isDot?.5:aR.x);\n'+
' float er=step(mix(aAp.w,aBp.w,m),-.01);float sol=mix(uSolA,uSolB,m)*step(.75,n.z)*(1.-er);\n'+
' float r=aR.z;float s=mix(.85+1.9*pow(r,8.),1.,sol);float spark=mix(mix(.82,2.4,pow(aR.x,14.)),1.,sol);\n'+
' float coc=min(uCocMax,uCoc*abs(w-uCamZ)*.42+bell*uMess*(1.+9.*aR.y*aR.y))*(1.-P*.97)*(1.-sol*.9);\n'+
' float px=uBase*s*uCamZ/w*(1.+sol*uSolP);float a=(.3+.95*pl)*spark*mix(.16,1.,facing)*(1.-fog*.55);\n'+
' a*=mix(uG.x,uG.y,m);a=mix(a,max(a,.85*spark),max(tag,0.));\n'+
' if(e>0.)a=mix(a,max(a,1.05),e);else a*=mix(1.,.42,-e);\n'+
' c=mix(c,mix(uLA,uLB,m),sol*(.62+.2*clamp(e,0.,1.)));a=max(a,sol*(uSolF+.3*e));a*=mix(1.,.55,bell*uMess);a*=mix(uDimA,uDimB,m);\n'+
' a*=pow(px/(px+coc),1.35);px+=coc;\n'+
' if(px<1.5){a*=(px/1.5)*(px/1.5);px=1.5;}\n'+
' if(isDot){c=uDot;a=uDotA;px=uBase*2.9*uCamZ/w;coc=0.;}\n'+
' if(P>.5){c=isDot?uStamp:uInk*(.7+.5*clamp(-e,0.,1.));a=isDot?0.:min(1.,a*1.5)*smoothstep(uPX,uPX+140.,sp.x);}\n'+
' float hd=smoothstep(.6,1.,mix(uSolA,uSolB,m))*(1.-er);float mk=maskAt(sp);a*=isDot?pow(smoothstep(.25,.95,mk),2.):pow(mk,1.5+.5*hd);\n'+
' if(uPass>=0.&&abs(step(.5,sol)-uPass)>.5){gl_Position=vec4(2.,2.,2.,1.);gl_PointSize=1.;vB=vec2(0.);vC=vec4(0.);return;}\n if(!isDot)a*=mix(1.,smoothstep(0.,.12,n.z),hd);gl_PointSize=min(px,uPxMax);vB=vec2(isDot?-1.:(hd>0.?-hd:clamp(coc/7.,0.,1.)),P);vC=vec4(c,clamp(a,0.,1.));\n'+
'}';
var VSA='#version 300 es\nprecision highp float;\nlayout(location=0)in vec3 aP;layout(location=1)in vec4 aR;\n'+
'uniform float uTime,uBase,uF,uAsp,uFly,uCamZ,uAmb,uCocMax;uniform vec3 uCam,uCol,uInk;\n'+MASK+
'out vec4 vC;out vec2 vB;\n'+
'void main(){float zz=mod(aP.z-uFly*(.55+.45*aR.x),13.);float w=zz+.45;vec3 v=vec3(aP.x+sin(uTime*.07+aR.x*6.28)*.12,aP.y+cos(uTime*.06+aR.y*6.28)*.12,0.)-uCam;\n'+
' gl_Position=vec4(v.x*uF/uAsp,v.y*uF,0.,w);vec2 sp=vec2(v.x*uF/uAsp/w*.5+.5,.5-v.y*uF/w*.5)*uRes;\n'+
' float dz=abs(w-uCamZ);float coc=min(uCocMax,dz*dz*.12*uBase*.5);float px=uBase*.9*uCamZ/max(w,2.2);\n'+
' float a=uAmb*smoothstep(13.4,9.,w)*smoothstep(1.6,4.2,w)*pow(px/(px+coc),1.15);px+=coc;if(px<1.5){a*=(px/1.5);px=1.5;}\n'+
' a*=maskAt(sp);\n'+
' float P=paperAt(sp.y,aR.x);vec3 c=uCol;if(P>.5)a=0.;\n'+
' gl_PointSize=min(px,14.);vB=vec2(0.,P);vC=vec4(c,clamp(a,0.,1.));}';
var FS='#version 300 es\nprecision highp float;\nin vec4 vC;in vec2 vB;uniform float uOcc;out vec4 o;\n'+
'void main(){vec2 c=gl_PointCoord*2.-1.;float r2=dot(c,c);if(r2>1.)discard;float q=1.-r2;float hs=mix(q*q*q,smoothstep(0.,.22,q)*(.42+.3*r2),max(vB.x,0.));float hr=max(-vB.x,0.);float a=mix(hs,smoothstep(0.,.3,q),hr)*vC.a;float occ=mix(mix(uOcc,1.,vB.y),1.,hr);o=vec4(vC.rgb*a,a*occ);}';

/* 一件工作跑完就讓出主執行緒 */
function later(f){if(window.requestIdleCallback)requestIdleCallback(f,{timeout:80});else setTimeout(f,0)}

var P,PA,vaoM,vaoA,bufS,bufR,bufA,ready=[],curA=-1,curB=-1,randOK=false,ambOK=false,glyphReady=false,gen=0;
var STRIDE=12,SHAPES=SHAPE_ORDER.length;

function compile(vs,fs){
  function sh(t,s){var h=gl.createShader(t);gl.shaderSource(h,s);gl.compileShader(h);return h}
  var p=gl.createProgram(),a=sh(gl.VERTEX_SHADER,vs),b=sh(gl.FRAGMENT_SHADER,fs);
  gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);return{p:p,a:a,b:b};
}
function finish(o){
  var p=o.p;
  if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||gl.getShaderInfoLog(o.a)||gl.getShaderInfoLog(o.b));
  var u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);
  for(var i=0;i<n;i++){var nm=gl.getActiveUniform(p,i).name;u[nm.replace('[0]','')]=gl.getUniformLocation(p,nm)}
  return{p:p,u:u};
}
/* 瀏覽器支援時等背景編譯完成才查狀態，避免卡住 */
function linked(list,cb){
  var ext=gl.getExtension('KHR_parallel_shader_compile');
  (function wait(){
    if(gl.isContextLost())return;
    if(ext&&!list.every(function(o){return gl.getProgramParameter(o.p,ext.COMPLETION_STATUS_KHR)})){setTimeout(wait,16);return}
    later(cb);
  })();
}
function initGL(done){
  var my=++gen;
  curA=curB=-1;ready=SHAPE_ORDER.map(function(){return 0});randOK=ambOK=false;glyphReady=false;
  var a=compile(VS,FS);
  later(function(){
    if(my!==gen)return;
    var b=compile(VSA,FS);
    linked([a,b],function(){
      if(my!==gen||gl.isContextLost())return;
      try{P=finish(a)}catch(e){noGL();return}
      later(function(){
        if(my!==gen||gl.isContextLost())return;
        try{PA=finish(b)}catch(e){noGL();return}
        vaoM=gl.createVertexArray();vaoA=gl.createVertexArray();
        bufS=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,bufS);gl.bufferData(gl.ARRAY_BUFFER,N*STRIDE*SHAPES,gl.STATIC_DRAW);
        bufR=gl.createBuffer();bufA=gl.createBuffer();
        later(function(){if(my===gen)done()});
      });
    });
  });
}
function bindPair(a,b){gl.bindVertexArray(vaoM);if(a===curA&&b===curB)return;curA=a;curB=b;
  gl.bindBuffer(gl.ARRAY_BUFFER,bufS);var oa=a*N*STRIDE,ob=b*N*STRIDE;
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.SHORT,true,STRIDE,oa);
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.BYTE,true,STRIDE,oa+8);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.SHORT,true,STRIDE,ob);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,4,gl.BYTE,true,STRIDE,ob+8);
  gl.bindBuffer(gl.ARRAY_BUFFER,bufR);gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,4,gl.FLOAT,false,0,0);}
function upload(name,buf){var i=SHAPE_IDX[name];gl.bindBuffer(gl.ARRAY_BUFFER,bufS);gl.bufferSubData(gl.ARRAY_BUFFER,i*N*STRIDE,new Uint8Array(buf));ready[i]=1;if(name==='glyph')glyphReady=true;if(!running)drawOnce()}
function uploadExtras(rd,d){
  gl.bindBuffer(gl.ARRAY_BUFFER,bufR);gl.bufferData(gl.ARRAY_BUFFER,rd,gl.STATIC_DRAW);randOK=true;
  gl.bindVertexArray(vaoA);gl.bindBuffer(gl.ARRAY_BUFFER,bufA);gl.bufferData(gl.ARRAY_BUFFER,d,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);
  gl.bindVertexArray(null);ambOK=true;curA=curB=-1;
}

/* ---------- 量測 ---------- */
var W=0,H=0,dead=false,paperEl=document.getElementById('paper');
function measure(){
  if(dead)return;
  RA.fitH1();
  var vw=innerWidth,nh=cv.clientHeight||innerHeight,pw=Math.round(vw*DPR),ph=Math.round(nh*DPR);
  /* 寬度變或高度變超過 160 裝置像素才重配，網址列收合不重建 */
  if(pw!==W||Math.abs(ph-H)>160*DPR||!C.vh){W=pw;H=ph;cv.width=W;cv.height=H;C.vh=nh;gl.viewport(0,0,W,H)}
  C.vw=vw;
  C.measure();
}
/* 只換解析度，版面不重量 */
function setDPR(d){if(d===DPR)return;DPR=d;W=Math.round(C.vw*DPR);H=Math.round(C.vh*DPR);cv.width=W;cv.height=H;gl.viewport(0,0,W,H)}
var lastBg='';
function setBg(A,B,t){var m=t*t*(3-2*t),a=A.bgc,b=B.bgc,s='rgb('+Math.round((a[0]+(b[0]-a[0])*m)*255)+','+Math.round((a[1]+(b[1]-a[1])*m)*255)+','+Math.round((a[2]+(b[2]-a[2])*m)*255)+')';
  if(s!==lastBg){lastBg=s;root.style.backgroundColor=s}}

/* ---------- 繪製 ---------- */
var motion=RA.motion,yD=scrollY,sD=0,intro=(scrollY<40&&motion)?0:1,introDelay=.75,mx=0,my=0,tx=0,ty=0,time=0,last=0,running=false,count=N;
var quality={coc:1,amb:true};
function poseU(uR,uO,st,shape,y,intr){var p=C.pose(st,shape,y,time,intr,mx,my);gl.uniformMatrix3fv(uR,false,p.r);gl.uniform4f(uO,p.x,p.y,0,p.s);return p.s}
function render(){
  if(dead||!randOK||!C.ST.length)return;
  var ST=C.ST,y=yD,s=sD,a=Math.min(ST.length-1,Math.floor(s)),T=s-a,b=Math.min(ST.length-1,a+1);
  if(!motion){T=T>=.5?1:0}
  var A=ST[a],B=T>0?ST[b]:ST[a],sa=A.shape,sb=B.shape,introOn=false,pick=C.pick;
  if(T===0)b=a;
  if(T===0&&pick.stage===a&&pick.t<1){sa=pick.from;sb=pick.to;T=pick.t;T=T*T*(3-2*T)}
  if(a===0&&T===0&&intro<1){sa='grid';sb='glyph';T=intro;introOn=true}
  if(!ready[SHAPE_IDX.grid])return;
  /* 形狀還沒到就先用格網，姿勢也跟著用格網 */
  if(!ready[SHAPE_IDX[sa]])sa='grid';
  if(!ready[SHAPE_IDX[sb]]){sb=sa;T=0}
  var ia=SHAPE_IDX[sa],ib=SHAPE_IDX[sb];
  setBg(A.world,B.world,T);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  var ry=scrollY;C.fillRects(ry);
  var seamA=-1e5,seamB=-1e5,vw=C.vw,vh=C.vh,mob=C.MOBILE;
  if(paperEl){var pr=paperEl.getBoundingClientRect();seamA=pr.top;seamB=pr.bottom}
  var base=(DPR>1.2?1.85:2.45)*DPR,camx=mx*.16,camy=-my*.1,fly=ry/(mob?620:760);
  var wm=T*T*(3-2*T),ac=A.world.ambc,bc=B.world.ambc,wa=A.world,wb=B.world;
  /* 環境層 */
  if(quality.amb&&ambOK){
    gl.useProgram(PA.p);var ua=PA.u;gl.bindVertexArray(vaoA);
    gl.uniform1f(ua.uTime,time);gl.uniform1f(ua.uBase,base*.9);gl.uniform1f(ua.uF,C.F);gl.uniform1f(ua.uAsp,C.asp);gl.uniform1f(ua.uFly,fly);gl.uniform1f(ua.uCamZ,C.CAMZ);gl.uniform1f(ua.uAmb,.8);gl.uniform1f(ua.uCocMax,(mob?3:5)*quality.coc);
    gl.uniform3f(ua.uCam,camx,camy,0);gl.uniform3f(ua.uCol,ac[0]+(bc[0]-ac[0])*wm,ac[1]+(bc[1]-ac[1])*wm,ac[2]+(bc[2]-ac[2])*wm);gl.uniform3fv(ua.uInk,C.INK);
    gl.uniform1f(ua.uOcc,.35);gl.uniform2f(ua.uRes,vw,vh);gl.uniform4fv(ua.uR,C.rectArr);gl.uniform1fv(ua.uRD,C.rectDim);gl.uniform2f(ua.uSeam,seamA,seamB);
    gl.drawArrays(gl.POINTS,0,Math.round(NAMB*Math.max(.4,countScale)));
  }
  /* 主體 */
  gl.useProgram(P.p);var u=P.u;bindPair(ia,ib);
  gl.uniform1f(u.uT,T);gl.uniform1f(u.uTime,time);gl.uniform1f(u.uBase,base);gl.uniform1f(u.uF,C.F);gl.uniform1f(u.uAsp,C.asp);gl.uniform1f(u.uCamZ,C.CAMZ);gl.uniform1f(u.uCoc,mob?2.6:3.6);gl.uniform1f(u.uAmp,introOn?.22:.42);gl.uniform1f(u.uNa,NA);
  gl.uniform1f(u.uCocMax,(mob?15:30)*quality.coc);gl.uniform1f(u.uPxMax,mob?26:48);
  gl.uniform3f(u.uDir,Math.sin(a*2.4+.4),Math.cos(a*1.7),.3);
  gl.uniform3f(u.uCam,camx,camy,0);gl.uniform3f(u.uLt,-1.5+mx*1.6+Math.sin(time*.22)*.3,1.5-my*1.1,1.9);gl.uniform1f(u.uOcc,.42);gl.uniform2f(u.uRes,vw,vh);gl.uniform4fv(u.uR,C.rectArr);gl.uniform1fv(u.uRD,C.rectDim);gl.uniform2f(u.uSeam,seamA,seamB);
  gl.uniform3fv(u.uFA,wa.farc);gl.uniform3fv(u.uLA,wa.litc);gl.uniform3fv(u.uCA,wa.accc);gl.uniform3fv(u.uFB,wb.farc);gl.uniform3fv(u.uLB,wb.litc);gl.uniform3fv(u.uCB,wb.accc);
  var d0=wa.dotc,d1=wb.dotc;gl.uniform3f(u.uDot,d0[0]+(d1[0]-d0[0])*wm,d0[1]+(d1[1]-d0[1])*wm,d0[2]+(d1[2]-d0[2])*wm);gl.uniform3fv(u.uInk,C.INK);gl.uniform3fv(u.uStamp,C.STAMP);
  gl.uniform2f(u.uG,wa.g,wb.g);
  gl.uniform1f(u.uWA,introOn?.05:(A.wave||0));gl.uniform1f(u.uWB,B.wave||0);gl.uniform1f(u.uDimA,introOn?3.:A.dim);gl.uniform1f(u.uDimB,B.dim);gl.uniform1f(u.uMess,(A.fix&&B.fix)?0:(A.fix||B.fix)?.12:1);gl.uniform1f(u.uSolF,.8);gl.uniform1f(u.uPX,vw>=768?vw*.6:-999);gl.uniform1f(u.uSolA,sa==='glyph'?1:0);gl.uniform1f(u.uSolB,sb==='glyph'?1:0);gl.uniform1f(u.uDotA,(A.fix?0:1)*(1-wm)+(B.fix?0:1)*wm);
  var sca=poseU(u.uRA,u.uOA,A,sa,y,introOn),scb=poseU(u.uRB,u.uOB,B,sb,y,false),gs=sb==='glyph'?scb:sa==='glyph'?sca:0;
  count=Math.round(N*countScale);
  /* 字面點徑依字的實際大小與顆數算：滿載覆蓋約 6 倍才融成連續的面；降階時覆蓋跟著降，填充率才真的變少 */
  if(gs){var gd=2*gs*vh/(2*C.halfH)*DPR*Math.sqrt(12/(Math.PI*.6*Math.sqrt(count*N)));gl.uniform1f(u.uSolP,Math.max(0,gd/base-1))}else gl.uniform1f(u.uSolP,0);
  gl.uniform1f(u.uPass,-1);
  if(gs){
    /* 沒有深度緩衝：先畫側牆再畫字面，牆不會灑在面上；紅點最後補上 */
    gl.uniform1f(u.uPass,0);gl.drawArrays(gl.POINTS,0,count);
    gl.uniform1f(u.uPass,1);gl.drawArrays(gl.POINTS,0,count);
    gl.uniform1f(u.uPass,-1);gl.drawArrays(gl.POINTS,0,NA);
  }else gl.drawArrays(gl.POINTS,0,count);
  if(!root.classList.contains('gl-on'))root.classList.add('gl-on');
  /* 第一幀就讓實心字退場，格網塌縮才看得到；沒有開場時等粒子字到位 */
  if((introOn||glyphReady)&&!root.classList.contains('intro-done'))root.classList.add('intro-done');
}

/* ---------- 自動調適（?fix=1 關閉，量測用；?slow=ms 模擬慢機）。門檻是推論值，待真機校正 ---------- */
var FIX=qs.get('fix')==='1',SLOW=+qs.get('slow')||0,ft=[],overT=0,p90T=0,locked=false,coolT=0,okT=0,lastUp=-1e9,steps=0;
var LADDER=[1,.8,.62,.48,.36],TOP=LADDER.length-1;
/* 填充率受限時只減顆數幾乎沒用：第 3 階起移動中也把畫布降到 1x */
function dprFor(){return steps>=3?1:DPR0}
function applyStep(){
  countScale=LADDER[steps]*(INAPP?.7:1);
  quality.coc=steps>=3?0:steps>=2?.5:1;  /* 第 2 階散焦減半，第 3 階關散焦 */
  quality.amb=steps<3;                   /* 第 3 階停環境層 */
  setDPR(dprFor());
}
function adapt(dt){
  if(FIX||locked)return;if(dt>250||document.hidden)return;
  ft.push(dt);if(ft.length>90)ft.shift();if(ft.length<60||time<1)return;
  var so=ft.slice().sort(function(a,b){return a-b}),med=so[so.length>>1],p90=so[so.length*.9|0];
  var mean=0,sd=0,i;for(i=0;i<so.length;i++)mean+=so[i];mean/=so.length;for(i=0;i<so.length;i++)sd+=(so[i]-mean)*(so[i]-mean);sd=Math.sqrt(sd/so.length);
  /* 中位 31–36ms 且很穩：多半是 rAF 被系統限速（低電量），降過一階就鎖住，不再硬降 */
  if(med>31&&med<36&&sd<4&&steps>=1&&!SLOW){locked=true;return}
  if(med>24)overT+=dt;else overT=0;
  if(p90>40)p90T+=dt;else p90T=0;
  if((overT>1500||p90T>3000)&&time>coolT){
    overT=p90T=0;coolT=time+2;ft.length=0;
    /* 到底仍中位 >33ms：停繪定格，開關顯示關 */
    if(steps===TOP){if(med>33)stopForever();return}
    steps++;applyStep();
    /* 才升上去 5 秒內又撐不住：這台就停在這階，不再來回跳 */
    if(time-lastUp<5)locked=true;
    return;
  }
  if(med<18)okT+=dt;else okT=0;
  if(okT>5000&&steps>0&&time>coolT){steps--;applyStep();okT=0;coolT=time+2;lastUp=time}
}
function stopForever(){locked=true;stop();setDPR(DPR0);motion=false;RA.paintMotion(false);drawOnce()}

/* ---------- 量測面板：只在 ?debug=1 ---------- */
var dbgEl=null,dbgT=0,frames=[],fontRatio=0;
function dbg(now,dt){
  frames.push(dt);if(frames.length>180)frames.shift();if(now-dbgT<400)return;dbgT=now;
  var so=frames.slice().sort(function(a,b){return a-b}),med=so[so.length>>1]||0,p90=so[so.length*.9|0]||0;
  var base=(DPR>1.2?1.85:2.45)*DPR,dot=Math.PI*base*base/4,over=(count*dot*1.1+NAMB*Math.max(.4,countScale)*dot*.9)/(W*H||1);
  window.__stats={med:med,p90:p90,n:count,amb:NAMB,dpr:DPR,w:W,h:H,scale:countScale,steps:steps,coc:quality.coc,ambOn:quality.amb,renderer:RENDERER,inapp:INAPP,running:running,lost:lostN,fontRatio:fontRatio,overdraw:over};
  if(dbgEl)dbgEl.textContent='幀 中位 '+med.toFixed(1)+'ms  p90 '+p90.toFixed(1)+'ms\nn '+count+' + '+NAMB+'  階 '+steps+'  比例 '+countScale.toFixed(2)+'  散焦 '+quality.coc+'  環境 '+(quality.amb?'開':'關')+'\nDPR '+DPR+'  '+W+'x'+H+'  inner '+innerWidth+'x'+innerHeight+'  vv '+(window.visualViewport?Math.round(visualViewport.height):'-')+'  screen '+screen.height+'\nin-app '+INAPP+'  dark '+matchMedia('(prefers-color-scheme: dark)').matches+'  lost '+lostN+'  字級比 '+fontRatio.toFixed(2)+'  overdraw(計算) '+over.toFixed(2)+'x\n'+RENDERER.slice(0,52);
}
if(DEBUG){
  var probe=document.createElement('span');probe.textContent='畫';probe.style.cssText='position:absolute;visibility:hidden;font-size:100px;line-height:1;font-family:sans-serif';
  document.body.appendChild(probe);fontRatio=probe.getBoundingClientRect().height/100;document.body.removeChild(probe);
  if(!qs.has('clean')){dbgEl=document.createElement('div');dbgEl.id='dbg';document.body.appendChild(dbgEl)}
}

/* ---------- 迴圈：沒事就停，省電 ---------- */
var lastInput=performance.now(),frameN=0,rafId=0,half=false;
function wake(){lastInput=performance.now();if(steps>=TOP)setDPR(dprFor());if(motion&&!running&&!document.hidden&&!dead)start()}
function frame(now){
  rafId=0;if(!running)return;
  rafId=requestAnimationFrame(frame);
  if(document.hidden){last=0;return}
  var idle=now-lastInput;
  frameN++;
  /* 手機靜止半幀省電：進出時清掉取樣，減半的節拍不能算成慢機 */
  var hf=C.MOBILE&&idle>3000;
  if(hf!==half){half=hf;ft.length=0;overT=p90T=okT=0;last=0}
  if(half&&frameN%2)return;
  var dt=last?now-last:16;last=now;var ds=Math.min(dt,100)/1000;
  time+=ds;if(time>600)time-=600;
  var y=scrollY;if(Math.abs(y-yD)>innerHeight*2.2)yD=y;else yD+=(y-yD)*(1-Math.exp(-ds*11));
  var s=C.stageCoord(yD);if(Math.abs(s-sD)>1.2)sD=s;else sD+=(s-sD)*(1-Math.exp(-ds*7));if(Math.abs(s-sD)<.0015)sD=s;
  mx+=(tx-mx)*(1-Math.exp(-ds*3.5));my+=(ty-my)*(1-Math.exp(-ds*3.5));
  if(glyphReady&&intro<1){if(introDelay>0)introDelay-=ds;else intro=Math.min(1,intro+ds/1.5)}
  var pick=C.pick;if(pick.t<1)pick.t=Math.min(1,pick.t+ds/.95);
  if(steps>=TOP&&idle>3000)setDPR(1);
  render();
  if(SLOW){var t0=performance.now();while(performance.now()-t0<SLOW){}}
  if(DEBUG)dbg(now,dt);
  if(motion&&!half)adapt(dt);
  var busy=intro<1||pick.t<1||Math.abs(y-yD)>.5||Math.abs(s-sD)>.002;
  if(busy)lastInput=now;
  if(idle>6000&&!busy&&!qs.has('noidle')){running=false;cancelAnimationFrame(rafId);rafId=0;last=0}
}
function start(){if(running||!motion||dead)return;running=true;last=0;if(!rafId)rafId=requestAnimationFrame(frame)}
function stop(){running=false;if(rafId){cancelAnimationFrame(rafId);rafId=0}}
var drawPending=false;
function drawOnce(){if(drawPending)return;drawPending=true;requestAnimationFrame(function(){drawPending=false;if(running||dead)return;yD=scrollY;sD=C.stageCoord(yD);if(!motion)sD=Math.round(sD);render()})}

C.onPick=function(i,from,name){if(!motion){drawOnce();return}C.pick={stage:i,from:from,to:name,t:0};wake()};
RA.pick=C.pickHook;
RA.relayout=function(){if(!C.vh)return;measure();wake();if(!motion)drawOnce()};
RA.setMotion=function(m){motion=m;if(m){intro=1;wake();start()}else{stop();drawOnce()}};
addEventListener('scroll',function(){if(motion)wake();else drawOnce()},{passive:true});
if(matchMedia('(hover:hover) and (pointer:fine)').matches)addEventListener('pointermove',function(e){tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;wake()},{passive:true});
var rzT=0;addEventListener('resize',function(){clearTimeout(rzT);rzT=setTimeout(function(){measure();wake();if(!motion)drawOnce()},120)});
addEventListener('load',function(){if(C.vh)measure()});
$$('details').forEach(function(d){d.addEventListener('toggle',function(){if(!C.vh)return;measure();wake();if(!motion)drawOnce()})});
document.addEventListener('visibilitychange',function(){last=0;if(document.hidden)stop();else if(motion){wake();start()}});

/* ---------- Context 遺失：先退到靜態層，恢復就重建；30 秒內兩次就永遠靜態 ---------- */
var lostN=0,lostAt=-1e9;
cv.addEventListener('webglcontextlost',function(e){e.preventDefault();stop();dead=true;gen++;root.classList.remove('gl-on');root.classList.add('gl-lost');
  if(worker){worker.terminate();worker=null}
  var now=performance.now();if(now-lostAt<30000)lostN=99;lostAt=now;lostN++;
  if(lostN>=99)noGL()});
cv.addEventListener('webglcontextrestored',function(){
  if(lostN>=99){noGL();return}
  dead=false;root.classList.remove('gl-lost');W=H=0;
  initGL(function(){measure();buildAll();if(motion){wake();start()}else drawOnce()});
});

/* ---------- 量測介面：只在 debug ---------- */
if(DEBUG){
  window.__lose=function(){return gl.getExtension('WEBGL_lose_context')};
  window.__probe=function(){
    render();var res=[],full=new Uint8Array(W*H*4);gl.readPixels(0,0,W,H,gl.RGBA,gl.UNSIGNED_BYTE,full);
    function lin(c){c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4)}
    var bgm=(root.style.backgroundColor.match(/\d+/g)||[8,24,27]).map(Number),pr=paperEl.getBoundingClientRect();
    C.rects.forEach(function(r){var cy=r.cy-scrollY;if(cy+r.hh<0||cy-r.hh>innerHeight)return;
      var bg=(cy>pr.top&&cy<pr.bottom)?[241,234,219]:bgm;
      var ls=[],x0=Math.max(0,(r.cx-r.hw)*DPR|0),x1=Math.min(W,(r.cx+r.hw)*DPR|0),y0=Math.max(0,(cy-r.hh)*DPR|0),y1=Math.min(H,(cy+r.hh)*DPR|0);
      for(var yy=y0;yy<y1;yy+=2)for(var xx=x0;xx<x1;xx+=2){var o=((H-1-yy)*W+xx)*4,a=full[o+3]/255,cr=full[o]+bg[0]*(1-a),cg=full[o+1]+bg[1]*(1-a),cb=full[o+2]+bg[2]*(1-a);ls.push(.2126*lin(Math.min(255,cr))+.7152*lin(Math.min(255,cg))+.0722*lin(Math.min(255,cb)))}
      if(!ls.length)return;ls.sort(function(a,b){return a-b});
      var col=getComputedStyle(r.e).color.match(/\d+/g).map(Number),tl=.2126*lin(col[0])+.7152*lin(col[1])+.0722*lin(col[2]);
      function c2(l){return(Math.max(tl,l)+.05)/(Math.min(tl,l)+.05)}
      var dark=tl>.5,wp95=dark?ls[ls.length*.95|0]:ls[ls.length*.05|0],wp995=dark?ls[ls.length*.995|0]:ls[ls.length*.005|0];
      res.push({t:r.e.textContent.trim().slice(0,10),fs:getComputedStyle(r.e).fontSize,p95:+c2(wp95).toFixed(2),p995:+c2(wp995).toFixed(2)})});
    return res};
  window.__state=function(){return{sD:sD,yD:yD,ST:C.ST.map(function(s){return{id:s.id,shape:s.shape,start:Math.round(s.start)}}),ready:ready,running:running,intro:intro,W:W,H:H,DPR:DPR}};
}

/* ---------- 啟動：形狀與亂數都在 worker；失敗就分段在主執行緒做 ---------- */
var worker=null,lib=null,pend=0;
/* 字型到位才取樣；未到位前「畫」不生成，開場停在格網 */
function fontOK(){return !document.fonts||!document.fonts.check||document.fonts.check('400 200px "RawDisplay"','畫')}
function glyphMask(){
  var S=512,c=document.createElement('canvas');c.width=c.height=S;var x=c.getContext('2d',{willReadFrequently:true});
  x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.font='400 '+(S*.94)+'px "RawDisplay"';x.fillText('畫',S/2,S*.5);
  var d=x.getImageData(0,0,S,S).data,a=new Uint8Array(S*S);for(var i=0;i<a.length;i++)a[i]=d[i*4+3];
  return{S:S,a:a};
}
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
/* 亂數屬性與環境流線：純計算，放 worker */
function extras(N,NAMB,mk){
  var R=mk(77),rd=new Float32Array(N*4),i;for(i=0;i<N*4;i++)rd[i]=R();
  var d=new Float32Array(NAMB*7);i=0;
  function g(){return (R()+R()+R()-1.5)/1.5}
  function fld(x,y,z){return[Math.sin(y*.55+1.1)+.6*Math.sin(z*.4),Math.sin(x*.42+z*.3+2.2)*.8,Math.sin(x*.3+y*.5)]}
  while(i<NAMB){var x=(R()*2-1)*8,y=(R()*2-1)*4.6,z=R()*13,len=40+R()*140|0,sp=R();
    for(var k=0;k<len&&i<NAMB;k++,i++){var f=fld(x,y,z);x+=f[0]*.028;y+=f[1]*.028;z+=f[2]*.028;var jt=.018*(1+2*k/len);
      d[i*7]=x+g()*jt;d[i*7+1]=y+g()*jt;d[i*7+2]=((z%13)+13)%13;d[i*7+3]=sp;d[i*7+4]=R();d[i*7+5]=R();d[i*7+6]=R()}}
  return{rd:rd,d:d};
}
var WSRC='('+function(){var L=/*LIB*/null,EX=/*EXTRAS*/null,RNG=/*RNG*/null;self.onmessage=function(e){var m=e.data;
  if(m.extras){var x=EX(m.N,m.NAMB,RNG);self.postMessage({rd:x.rd,d:x.d},[x.rd.buffer,x.d.buffer])}
  for(var i=0;i<m.names.length;i++){var n=m.names[i],b=L.gen(n,m.N,m.NA,m.G);self.postMessage({name:n,buf:b},[b])}}}.toString()+')()';
function buildAll(){
  /* 開場兩個最先，其他按捲動順序 */
  var names=SHAPE_ORDER.slice(),my=gen;pend=0;
  later(function(){
    if(my!==gen)return;
    var G=null;
    if(fontOK())G=glyphMask();
    else{names=names.filter(function(n){return n!=='glyph'});fontLater(my)}
    send(names,G,true);
  });
}
function fontLater(my){
  if(!document.fonts||!document.fonts.load)return;
  document.fonts.load('400 200px "RawDisplay"','畫').then(function(){if(my===gen&&!dead&&fontOK()&&!glyphReady)send(['glyph'],glyphMask(),false)},function(){});
}
function send(names,G,ex){
  if(!worker&&window.Worker&&window.Blob&&!qs.has('noworker')){
    try{
      var src=WSRC.replace('/*LIB*/null',function(){return'('+shapesLib.toString()+')()'}).replace('/*EXTRAS*/null',function(){return extras.toString()}).replace('/*RNG*/null',function(){return rng.toString()});
      worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
      worker.onmessage=function(e){if(dead)return;var m=e.data;if(m.rd){uploadExtras(m.rd,m.d);wake();if(!running)drawOnce()}else upload(m.name,m.buf);
        /* 全部形狀到齊就收掉；字型晚到時 send 會再開一個 */
        if(--pend<=0&&worker){worker.terminate();worker=null}};
      /* 遮罩已轉移給 worker，失敗時要重取 */
      worker.onerror=function(){worker=null;if(dead)return;var g=fontOK()?glyphMask():null;fallback(g?names:names.filter(function(n){return n!=='glyph'}),g,!randOK)};
    }catch(e){worker=null}
  }
  if(worker){pend+=names.length+(ex?1:0);worker.postMessage({names:names,N:N,NA:NA,NAMB:NAMB,G:G,extras:ex},G?[G.a.buffer]:[])}
  else fallback(names,G,ex);
}
function fallback(names,G,ex){
  lib=lib||shapesLib();var i=0,my=gen;
  function step(){if(i>=names.length||dead||my!==gen)return;var n=names[i++];if(!ready[SHAPE_IDX[n]])upload(n,lib.gen(n,N,NA,G));setTimeout(step,24)}
  if(ex)setTimeout(function(){if(dead||my!==gen)return;var x=extras(N,NAMB,rng);uploadExtras(x.rd,x.d);setTimeout(step,24)},0);else setTimeout(step,0);
}
function boot(){measure();yD=scrollY;sD=C.stageCoord(yD);buildAll();if(motion)start();else drawOnce()}
try{initGL(boot)}catch(e){noGL()}
})();
