/* 編排：每段的世界色、形狀尺寸，以及由 DOM 量出的停靠位置。新增段落只改 HTML 屬性。 */
(function(){
'use strict';
var RA=window.RA=window.RA||{};
function $$(s){return [].slice.call(document.querySelectorAll(s))}
function hex(h){return[parseInt(h.slice(1,3),16)/255,parseInt(h.slice(3,5),16)/255,parseInt(h.slice(5,7),16)/255]}
var SHAPE_ORDER=['grid','glyph','crack','ledger','fixed','ticker','lock','bubble','app','window','loop','bulb','needs'],SHAPE_IDX={};
SHAPE_ORDER.forEach(function(s,i){SHAPE_IDX[s]=i});
/* 半寬半高：用來把形狀塞進插槽 */
var EXT={grid:[3.4,2.2],glyph:[1,1],crack:[.56,1.08],fixed:[.56,1.08],app:[.56,1.08],ledger:[1.15,.87],ticker:[1.5,1.05],lock:[1.72,1.12],bubble:[1.14,1.05],window:[1.22,.82],loop:[1.1,1.1],bulb:[.74,1.08],needs:[1.56,1.14]};
var NEEDS=[[-1.02,.72,.34],[.5,.86,.27],[1.16,.12,.36],[-.3,.02,.44],[-1.2,-.56,.28],[.52,-.74,.34]];
var WORLD={
 hero:{bg:'#08181B',far:'#1B8F98',lit:'#FFF6E2',acc:'#FF6A48',amb:'#3E9AA3',dot:'#FF5A3C',g:2},
 stuck:{bg:'#0A1C22',far:'#238E96',lit:'#E8F8F4',acc:'#FF5A3C',amb:'#3E9AA3',dot:'#FF5A3C',g:1.35},
 ledger:{bg:'#1D1006',far:'#A8611C',lit:'#FFC558',acc:'#FFF2CF',amb:'#C47F2B',dot:'#FF5233',g:1.15},
 crack:{bg:'#071A24',far:'#3199B4',lit:'#E2FAFA',acc:'#FF4B30',amb:'#3A8EA8',dot:'#FF4B30',g:1.4},
 fixed:{bg:'#071F24',far:'#2AA6A6',lit:'#E2FAFA',acc:'#B9FFF0',amb:'#3AA8A0',dot:'#FF7A5C',g:1.4},
 ticker:{bg:'#0A1420',far:'#2A6F9E',lit:'#BFE6F2',acc:'#FFC558',amb:'#3A7FA8',dot:'#FF5A3C',g:1.35},
 lock:{bg:'#10130F',far:'#5F7168',lit:'#F1EADB',acc:'#FF8A50',amb:'#6E7F72',dot:'#FF5233',g:1.5},
 concept:{bg:'#14100E',far:'#B4702A',lit:'#FFE7B8',acc:'#FFB52E',amb:'#A87A3A',dot:'#FF5A3C',g:1.35},
 close:{bg:'#14100E',far:'#8A6A34',lit:'#F3D79A',acc:'#06C755',amb:'#8C7A44',dot:'#06C755',g:1.5}};
Object.keys(WORLD).forEach(function(k){var w=WORLD[k];w.bgc=hex(w.bg);w.farc=hex(w.far);w.litc=hex(w.lit);w.accc=hex(w.acc);w.ambc=hex(w.amb);w.dotc=hex(w.dot)});

var C=RA.C={NEEDS:NEEDS,SHAPE_ORDER:SHAPE_ORDER,SHAPE_IDX:SHAPE_IDX,EXT:EXT,WORLD:WORLD,INK:hex('#1C2733'),STAMP:hex('#B5332A'),
  ST:[],rects:[],vw:0,vh:0,asp:1,SPLIT:'(min-width:960px),(min-width:768px) and (max-height:560px)',MOBILE:true,MW:200,F:1/Math.tan(21*Math.PI/180),CAMZ:6.2,
  rectArr:new Float32Array(24),rectDim:new Float32Array(6),
  pick:{stage:-1,from:0,to:0,t:1},onPick:function(){}};
C.halfH=C.CAMZ/C.F;

function nums(s){return (s||'').split(',').map(Number)}
/* 舞台與文字保護框都由 DOM 決定；vw、vh 由引擎先寫入 */
function side(s){return s.cfg[0]<0?-1:1}
C.measure=function(){
  var vh=C.vh,mob=C.MOBILE=!matchMedia(C.SPLIT).matches,sy=scrollY,old=C.ST,prev=null;
  C.asp=C.vw/vh;C.MW=mob?320:440;
  C.ST=$$('[data-stage]').map(function(e,i){
    var r=e.getBoundingClientRect(),sl=e.querySelector('.slot'),sr=sl?sl.getBoundingClientRect():null;
    var st={el:e,id:e.id,top:r.top+sy,bottom:r.bottom+sy,shape:(old[i]&&old[i].id===e.id&&old[i].shape)||RA.picked[e.id]||e.getAttribute('data-shape'),world:WORLD[e.getAttribute('data-world')],cfg:nums(e.getAttribute(mob?'data-m':'data-d')),
      wave:parseFloat(e.getAttribute('data-wave')||0),dim:parseFloat(e.getAttribute('data-dimp')||1),fix:e.hasAttribute('data-fix'),mw:e.hasAttribute('data-merge')?C.MW*1.8:C.MW};
    if(sr&&sr.height>0){st.st=sr.top+sy;st.sh=sr.height;st.sw=sr.width;st.sx=sr.left+sr.width/2}
    var anchor=(mob&&sr&&sr.height>0)?st.st:st.top;
    st.start=i===0?-1e9:anchor-vh*(mob?.74:.6);
    if(i>0&&!st.fix){
      if(mob){
        /* 形變盡量在屏外做完：前一個插槽離開視窗就開始，新插槽進視窗前結束 */
        var gone=(!prev.fix&&prev.st!==undefined)?prev.st+prev.sh:-1e9;
        st.start=Math.min(st.start,Math.max(anchor-vh-C.MW,gone));
      }else if(prev.fix||side(prev)!==side(st)){
        /* 換邊交棒：標題進視窗時形狀要已經離開標題那一側 */
        var h2=e.querySelector('h2');st.hold=true;
        if(h2)st.start=Math.min(st.start,h2.getBoundingClientRect().top+sy-vh-C.MW-8);
      }
    }
    /* 合成要被看見：從上一個插槽還在畫面中段就開始，不躲到屏外 */
    if(mob&&e.hasAttribute('data-merge')&&prev.st!==undefined)st.start=prev.st-vh*.3;
    if(prev&&i>1)st.start=Math.max(st.start,prev.start+C.MW+1);
    prev=st;
    return st;
  });
  C.rects=$$('[data-dim]').map(function(e){
    /* 只有字塊用 Range 量到緊貼文字；容器用外框，免得逼收合內容排版 */
    var b;if(/^(P|H1|H2)$/.test(e.tagName)){var rg=document.createRange();rg.selectNodeContents(e);b=rg.getBoundingClientRect()}else b=e.getBoundingClientRect();
    return{cx:b.left+b.width/2,cy:b.top+sy+b.height/2,hw:b.width/2+6,hh:b.height/2+6,d:parseFloat(e.getAttribute('data-dim')),e:e};
  }).filter(function(r){return r.hw>7});
};
C.fillRects=function(y){
  var k=0,i,a=C.rectArr,d=C.rectDim,rs=C.rects,vh=C.vh;
  for(i=0;i<rs.length&&k<6;i++){var r=rs[i],cy=r.cy-y;if(cy+r.hh<-70||cy-r.hh>vh+70)continue;a[k*4]=r.cx;a[k*4+1]=cy;a[k*4+2]=r.hw;a[k*4+3]=r.hh;d[k]=r.d;k++}
  for(;k<6;k++){a[k*4]=-9999;a[k*4+1]=-9999;a[k*4+2]=0;a[k*4+3]=0;d[k]=1}
};
/* 捲動位置換成「第幾段＋過場進度」：無狀態，倒捲對稱 */
C.stageCoord=function(y){var ST=C.ST,i;for(i=ST.length-1;i>=1;i--){if(y>=ST[i].start+ST[i].mw)return i;if(y>=ST[i].start)return i-1+(y-ST[i].start)/ST[i].mw}return 0};
function rot(yaw,pit,rol){var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pit),sp=Math.sin(pit),cr=Math.cos(rol),sr=Math.sin(rol);
  return new Float32Array([cr*cy,sr*cy,-sy,cr*sy*sp-sr*cp,sr*sy*sp+cr*cp,cy*sp,cr*sy*cp+sr*sp,sr*sy*cp-cr*sp,cy*cp])}
/* 投影包圍盒八角，回傳要縮多少才不超出左右邊界（以形狀中心為基準） */
function fitX(m,e,s,ox,pad){
  var vw=C.vw,lim=(vw/2-pad)/(vw/2),cn=C.F/C.asp,c=ox*cn/C.CAMZ,worst=0,ix,iy,iz;
  for(ix=-1;ix<2;ix+=2)for(iy=-1;iy<2;iy+=2)for(iz=-1;iz<2;iz+=2){
    var x=ix*e[0],y=iy*e[1],z=iz*.2,wx=(m[0]*x+m[3]*y+m[6]*z)*s+ox,wz=(m[2]*x+m[5]*y+m[8]*z)*s,n=wx*cn/(C.CAMZ-wz);
    var room=n>c?(lim-c)/(n-c):(c+lim)/(c-n);if(n!==c&&(worst===0||room<worst))worst=room;
  }
  return Math.min(1,worst||1);
}
var GRID_POSE={yaw:-.32,pit:-1.02,rol:.1};
/* 回傳此段此形狀的旋轉矩陣與位移縮放 */
C.pose=function(st,shape,y,t,intro,mx,my){
  var e=EXT[shape],c=st.cfg,vw=C.vw,vh=C.vh,cx,cy,bw,bh,k=1,yaw,pit,rol;
  if(C.MOBILE){k=c[0];yaw=c[1];pit=c[2];rol=c[3]||0;
    if(st.fix){cx=vw/2;cy=vh*c[4];bw=vw*c[5];bh=vh*c[6]}
    else{cx=st.sx||vw/2;cy=(st.st!==undefined?st.st+st.sh/2:st.top+st.sh/2)-y;bw=(st.sw||vw);bh=st.sh||vh*.4}
  }else{
    cx=vw*(.5+c[0]*.5);bw=vw*c[2];bh=vh*c[3];yaw=c[4];pit=c[5];rol=c[6]||0;
    var tg=vh*(.5+c[1]);
    /* 換邊交棒後直接停在定點，段落還沒到也不留空屏 */
    cy=st.fix?tg:Math.min(st.hold?tg:Math.max(tg,st.top-y+bh*.42),st.bottom-y-bh*.42);
    /* 不鑽進導覽列底下 */
    if(!st.fix&&st!==C.ST[C.ST.length-1])cy=Math.max(cy,Math.min(tg,64+bh/2));
  }
  var yaw0=yaw,pit0=pit,rol0=rol;
  /* 輕微擺動，不累加；停留點面向鏡頭 */
  var drift=Math.max(-1,Math.min(1,(y+vh/2-(st.top+st.bottom)/2)/(vh*1.2)));
  yaw+=drift*.1+mx*.1+Math.sin(t*.33)*.018;pit+=my*.06+Math.cos(t*.27)*.012;
  if(intro){yaw=GRID_POSE.yaw+mx*.04;pit=GRID_POSE.pit;rol=GRID_POSE.rol}
  var ppu=Math.min(bh/2/e[1],bw/2/e[0])*k,wp=2*C.halfH/vh,scale=ppu*wp;
  if(intro)scale=(C.MOBILE?1.5:1.25)*wp*vh/2/1.2;
  /* 只有 Hero 可以出血：其餘形狀含透視要整個留在視窗內 */
  else if(st.id!=='top'&&!st.fix)scale*=fitX(rot(yaw0,pit0,rol0),e,scale,(cx-vw/2)*wp,C.MOBILE?10:24);
  return{r:rot(yaw,pit,rol),x:(cx-vw/2)*wp,y:(vh/2-cy)*wp-(intro?.45:0),s:scale};
};
/* 處境與概念圖按鈕換形狀 */
C.pickHook=function(id,name){
  var i=-1;C.ST.forEach(function(s,j){if(s.id===id)i=j});
  if(i<0||C.ST[i].shape===name)return;
  var from=C.ST[i].shape;C.ST[i].shape=name;C.onPick(i,from,name);
};
})();
