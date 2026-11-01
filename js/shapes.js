/* 形狀生成：可在 worker 或主執行緒跑。每個形狀回傳同點數、同排序規則的緊湊 buffer。 */
function shapesLib(){
'use strict';
var NEEDS=[[-1.02,.72,.34],[.5,.86,.27],[1.16,.12,.36],[-.3,.02,.44],[-1.2,-.56,.28],[.52,-.74,.34]];
var R;
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(){return (R()+R()+R()-1.5)/1.5}
/* R2 低差異序列：面上取樣不再像砂紙 */
function ld(){var off=[R(),R()],i=0;return function(){i++;return[(off[0]+i*.7548776662+(R()-.5)*.012+1)%1,(off[1]+i*.5698402910+(R()-.5)*.012+1)%1]}}
function rrSd(x,y,hw,hh,r){var dx=Math.abs(x)-hw+r,dy=Math.abs(y)-hh+r;return Math.min(Math.max(dx,dy),0)+Math.hypot(Math.max(dx,0),Math.max(dy,0))-r}
function Shape(){this.pr=[]}
Shape.prototype.add=function(w,f){this.pr.push([w,f]);return this};
Shape.prototype.bake=function(n){
  var tot=0,i,j;this.pr.forEach(function(p){tot+=p[0]});
  var d=new Float32Array(n*8),k=0,o=[0,0,0,0,0,1,0,0];
  for(i=0;i<this.pr.length;i++){
    var c=i===this.pr.length-1?n-k:Math.round(n*this.pr[i][0]/tot);
    for(j=0;j<c&&k<n;j++,k++){o[7]=0;this.pr[i][1](o);d.set(o,k*8)}
  }
  return d;
};
/* o: x y z nx ny nz tag(強調色) e(亮度偏移 -1..1) */
function set(o,x,y,z,nx,ny,nz,t,e){o[0]=x;o[1]=y;o[2]=z;o[3]=nx;o[4]=ny;o[5]=nz;o[6]=t||0;o[7]=e||0}
function face(cx,cy,hw,hh,r,z,nz,t,hole,e,grad){var q=ld();return function(o){var x,y,tries=0,u;do{u=q();x=(u[0]*2-1)*hw;y=(u[1]*2-1)*hh;tries++}while((rrSd(x,y,hw,hh,r)>0||(hole&&hole(x+cx,y+cy)))&&tries<60);
  var ed=rrSd(x,y,hw,hh,r),b=Math.max(0,1+ed/.05),ax=Math.abs(x)-hw+.05>0?(x>0?1:-1):0,ay=Math.abs(y)-hh+.05>0?(y>0?1:-1):0;
  var g=grad?((-x/hw*.5+y/hh*.5)*grad):0;
  set(o,x+cx,y+cy,z,ax*b*.7,ay*b*.7,nz,t,(e||0)+g)}}
function perim(hw,hh,r,s){var sx=2*(hw-r),sy=2*(hh-r),arc=Math.PI*r/2,x,y,nx,ny;
  if(s<sx){x=-hw+r+s;y=hh;nx=0;ny=1}else if((s-=sx)<sy){x=hw;y=hh-r-s;nx=1;ny=0}else if((s-=sy)<sx){x=hw-r-s;y=-hh;nx=0;ny=-1}else if((s-=sx)<sy){x=-hw;y=-hh+r+s;nx=-1;ny=0}else{s-=sy;var k=Math.min(3,Math.floor(s/arc)),a=(s-k*arc)/arc*Math.PI/2;
    var ang=[Math.PI/2-a,-a,-Math.PI/2-a,Math.PI-a][k];nx=Math.cos(ang);ny=Math.sin(ang);x=[hw-r,hw-r,-hw+r,-hw+r][k]+nx*r;y=[hh-r,-hh+r,-hh+r,hh-r][k]+ny*r}
  return[x,y,nx,ny]}
function perLen(hw,hh,r){return 4*(hw-r)+4*(hh-r)+2*Math.PI*r}
function wall(cx,cy,hw,hh,r,z0,z1,t){var per=perLen(hw,hh,r),q=ld();return function(o){var u=q(),p=perim(hw,hh,r,u[0]*per);
  var zz=z0+(z1-z0)*u[1];set(o,p[0]+cx,p[1]+cy,zz,p[2],p[3],.15,t,-.35+.75*Math.pow(u[1],2.2))}}
/* 邊緣亮線：外框要像畫出來的線，不是噪點 */
function rim(cx,cy,hw,hh,r,z,w,t,e){var per=perLen(hw,hh,r);return function(o){var p=perim(hw,hh,r,R()*per),g=gauss()*w;set(o,p[0]+cx+p[2]*g,p[1]+cy+p[3]*g,z,p[2]*.5,p[3]*.5,.8,t,e===undefined?1:e)}}
function poly(pts,w,z,t,e){var L=[],tot=0,i;for(i=0;i<pts.length-1;i++){var l=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]);L.push(l);tot+=l}
  return function(o){var s=R()*tot,i=0;while(i<L.length-1&&s>L[i]){s-=L[i];i++}var u=s/L[i],a=pts[i],b=pts[i+1];var dx=(b[0]-a[0])/L[i],dy=(b[1]-a[1])/L[i],g=gauss()*w;
    set(o,a[0]+(b[0]-a[0])*u-dy*g,a[1]+(b[1]-a[1])*u+dx*g,z+(R()-.5)*.012,0,0,1,t,e)}}
function disc(cx,cy,r,z,t,e){var q=ld();return function(o){var u=q(),a=u[0]*6.2832,k=Math.sqrt(u[1])*r;set(o,cx+Math.cos(a)*k,cy+Math.sin(a)*k,z,0,0,1,t,e)}}
function ring(cx,cy,r,w,z,t,e){return function(o){var a=R()*6.2832,k=r+gauss()*w;set(o,cx+Math.cos(a)*k,cy+Math.sin(a)*k,z,Math.cos(a)*.5,Math.sin(a)*.5,1,t,e)}}
function tube(f,rad,t,e){return function(o){var u=R(),a=f(u),b=f(Math.min(1,u+.002)),c=f(Math.max(0,u-.002));var tx=b[0]-c[0],ty=b[1]-c[1],l=Math.hypot(tx,ty)||1;tx/=l;ty/=l;var px=-ty,py=tx,th=R()*6.2832,cs=Math.cos(th),sn=Math.sin(th);
  set(o,a[0]+px*cs*rad,a[1]+py*cs*rad,sn*rad,px*cs,py*cs,sn,t,(e||0)+(cs>.7&&sn>0?.5:0))}}

/* 開場與紙段共用：規則格點頁，帳本橫線藏在格子裡；透視下立刻讀出 3D */
function makeGrid(n){
  var cols=Math.ceil(Math.sqrt(n*1.6)),rows=Math.ceil(n/cols),d=new Float32Array(n*8),i=0,r,c;
  for(r=0;r<rows;r++)for(c=0;c<cols&&i<n;c++,i++){
    var x=(c/(cols-1)-.5)*6.8,y=(r/(rows-1)-.5)*4.4,line=(r%12===0||c%18===0)?1:0;
    d.set([x,y,0,0,0,1,0,line?.9:-.22],i*8)}
  return{d:d,dot:[0,.06,.12,.085]};
}
/* 畫：字形遮罩＋擠出。正面亮、外框一條線、側牆由亮轉暗 */
function makeGlyph(n,G){
  var S=G.S,a=G.a,minx=S,maxx=0,miny=S,maxy=0,ix,iy;
  for(iy=0;iy<S;iy++)for(ix=0;ix<S;ix++)if(a[iy*S+ix]>128){if(ix<minx)minx=ix;if(ix>maxx)maxx=ix;if(iy<miny)miny=iy;if(iy>maxy)maxy=iy}
  var cx=(minx+maxx)/2,cy=(miny+maxy)/2,sc=2/Math.max(maxx-minx,maxy-miny,1);
  function ink(px,py){if(px<0||py<0||px>=S||py>=S)return 0;return a[py*S+px]>128?1:0}
  var inside=[],edge=[],k=3;
  for(iy=miny;iy<=maxy;iy++)for(ix=minx;ix<=maxx;ix++)if(ink(ix,iy)){var gx=ink(ix-k,iy)-ink(ix+k,iy),gy=ink(ix,iy-k)-ink(ix,iy+k);var e=(ink(ix-k,iy)&&ink(ix+k,iy)&&ink(ix,iy-k)&&ink(ix,iy+k))?0:1;(e?edge:inside).push(ix,iy,-gx,-gy)}
  if(!edge.length){return makeGrid(n)}
  if(!inside.length){inside=edge.slice()}
  var PT=[0,0,0,0],d=new Float32Array(n*8),D=.5,q1=ld(),q2=ld(),ni=inside.length/4,ne=edge.length/4;
  for(var i=0;i<n;i++){
    var u=R(),arr,z,nx,ny,nz,t=0,j,e2=0,ox=0,oy=0;
    if(u<.6){arr=PT;var tr=0,px1,py1,uu;do{uu=q1();px1=minx+uu[0]*(maxx-minx+1)|0;py1=miny+uu[1]*(maxy-miny+1)|0;tr++}while(!ink(px1,py1)&&tr<40);PT[0]=px1;PT[1]=py1;PT[2]=0;PT[3]=0;j=0;z=D;nx=0;ny=0;nz=1;
      var fx=(px1-cx)*sc,fy=-(py1-cy)*sc;e2=.28-.62*fx+.72*fy}
    else if(u<.68){arr=edge;j=(q2()[0]*ne|0)*4;z=D+.002;var l0=Math.hypot(arr[j+2],arr[j+3])||1;nx=arr[j+2]/l0*.5;ny=-arr[j+3]/l0*.5;nz=1;var fx0=(arr[j]-cx)*sc,fy0=-(arr[j+1]-cy)*sc;e2=.5-.5*fx0+.6*fy0;t=R()<.05?.5:0}
    else if(u<.94){arr=edge;j=(R()*ne|0)*4;var dz=R();z=D-dz*2*D;var l=Math.hypot(arr[j+2],arr[j+3])||1;nx=arr[j+2]/l;ny=-arr[j+3]/l;nz=.18;e2=.7-dz*1.3}
    else{/* 筆畫侵蝕：字的邊緣有粒子正在被吹離 */
      arr=edge;j=(R()*ne|0)*4;var st=-Math.log(1-R()*.985)*.075,l1=Math.hypot(arr[j+2],arr[j+3])||1;
      ox=arr[j+2]/l1*st+.5*st;oy=-arr[j+3]/l1*st+.75*st;z=D+st*1.6;nx=0;ny=0;nz=1;t=-.02;e2=-.05-Math.min(.75,st*2.6)}
    var s=i*8;d[s]=(arr[j]+R()-cx)*sc+ox;d[s+1]=-(arr[j+1]+R()-cy)*sc+oy;d[s+2]=z;d[s+3]=nx;d[s+4]=ny;d[s+5]=nz;d[s+6]=t;d[s+7]=e2;
  }
  return{d:d,dot:[.74,-.84,D+.04,.085]};
}
var PH={hw:.56,hh:1.08,r:.15,th:.075,ix:.14,iy:.24};
function phoneBody(s){
  var hw=PH.hw,hh=PH.hh,r=PH.r,th=PH.th;
  function scr(x,y){return rrSd(x,y,hw-.05,hh-.05,r-.03)}
  var q=ld();
  s.add(16,function(o){var k=0,x,y,u;do{u=q();x=(u[0]*2-1)*hw;y=(u[1]*2-1)*hh;k++}while(k<80&&(rrSd(x,y,hw,hh,r)>0||scr(x,y)<0));set(o,x,y,th,x>0?.35:-.35,y>0?.35:-.35,1,0,.2)});
  s.add(12,rim(0,0,hw,hh,r,th+.004,.005,0,1));
  s.add(5,rim(0,0,hw-.05,hh-.05,r-.03,th+.002,.004,0,.55));
  s.add(14,wall(0,0,hw,hh,r,-th,th,0));
  s.add(6,face(0,0,hw,hh,r,-th,-1,0,null,-.5));
  s.add(4,face(0,hh-.15,.15,.042,.04,th+.004,1,0,null,.5));
  s.add(1.6,face(0,-hh+.1,.17,.012,.01,th+.004,1,0,null,.6));
  return scr;
}
/* 手機：厚度、邊框、裂痕從撞擊點放射 */
function makePhone(n){
  var s=new Shape(),ix=PH.ix,iy=PH.iy,hw=PH.hw,hh=PH.hh,th=PH.th;
  var crack=[[[ix,iy],[.3,.5],[.26,.68],[.42,.98]],[[ix,iy],[.32,.2],[.5,.27]],[[ix,iy],[.28,-.08],[.2,-.32],[.36,-.62],[.3,-.98]],[[ix,iy],[-.04,.04],[-.22,.1],[-.5,-.06]],[[ix,iy],[-.1,.44],[-.28,.56],[-.34,.96]],[[ix,iy],[-.02,-.22],[-.2,-.52],[-.12,-.98]],[[-.22,.1],[-.3,.32],[-.5,.4]],[[.2,-.32],[.04,-.44]]];
  var scr=phoneBody(s),q=ld();
  s.add(7,function(o){var x,y,u;do{u=q();x=(u[0]*2-1)*(hw-.05)+(R()-.5)*.03;y=(u[1]*2-1)*(hh-.05)+(R()-.5)*.03}while(scr(x,y)>0);var di=Math.hypot(x-ix,y-iy);set(o,x,y,th-.008,(x-ix)*.3,(y-iy)*.3,1,di<.2?.45:0,-.55+Math.max(0,.5-di)*.8)});
  crack.forEach(function(c,i){s.add(i<6?5.2:2,poly(c,i<6?.0085:.006,th+.012,1,1))});
  return{d:s.bake(n),dot:[ix,iy,th+.03,.05]};
}
/* 修好的手機：同外框、同包圍盒；裂痕收成一個打勾 */
function makeFixed(n){
  var s=new Shape(),hw=PH.hw,hh=PH.hh,th=PH.th,scr=phoneBody(s),q=ld();
  s.add(9,function(o){var x,y,u;do{u=q();x=(u[0]*2-1)*(hw-.05)+(R()-.5)*.03;y=(u[1]*2-1)*(hh-.05)+(R()-.5)*.03}while(scr(x,y)>0);var g=.5-Math.hypot(x,y-.05);set(o,x,y,th-.008,x*.2,y*.2,1,0,-.42+Math.max(0,g)*.75)});
  var c=[[-.28,.02],[-.06,-.22],[.32,.3]];
  s.add(20,poly(c,.028,th+.016,1,1));
  s.add(8,ring(0,.04,.47,.006,th+.012,1,.8));
  return{d:s.bake(n),dot:[.32,.3,th+.03,.05]};
}
/* 帳本：攤開、頁面微彎、紙疊厚度、表格與數字列 */
function makeLedger(n){
  var W=1.12,H=.8,s=new Shape();
  function pz(x){var u=Math.abs(x)/W;return .03+.17*Math.pow(Math.sin(Math.min(1,u*1.12)*Math.PI),.75)*(1-u*.25)}
  function pn(x){var e=.01,dz=(pz(x+e)-pz(x-e))/(2*e),l=Math.hypot(dz,1);return[-dz/l,1/l]}
  function pagePt(o,x,y,t,lift,e){var p=pn(x);set(o,x,y,pz(x)+(lift||0),p[0],0,p[1],t,e)}
  var rows=[H*.56,H*.14,-H*.28,-H*.7];
  [-1,1].forEach(function(side){
    var qp=ld();
    s.add(14,function(o){var u=qp();pagePt(o,side*(.02+u[0]*(W-.02)),(u[1]*2-1)*H,0,0,-.5)});
    s.add(6.5,function(o){pagePt(o,side*(.1+R()*(W-.2)),H*.56+R()*(H*.33),1,.006,.2)});
    rows.forEach(function(ry){s.add(3.6,function(o){pagePt(o,side*(.1+R()*(W-.2)),ry+gauss()*.012,.82,.006,1)})});
    [.1,.42,.74,W-.1].forEach(function(cx){s.add(2.8,function(o){var x=side*(cx+gauss()*.012);pagePt(o,x,-H*.7+R()*(H*1.26),.82,.006,1)})});
    for(var ri=0;ri<3;ri++)for(var ci=0;ci<3;ci++)(function(ri,ci){
      var y0=rows[ri]-(rows[ri]-rows[ri+1])*.5,len=.08+.13*R(),xs=[.42,.74,W-.1][ci]-.05-len;
      s.add(1.15,function(o){pagePt(o,side*(xs+R()*len),y0+gauss()*.02,.45,.006,.3)});
    })(ri,ci);
    s.add(7,function(o){var z=-.1+.12*(Math.floor(R()*5)/5),y=(R()*2-1)*H;set(o,side*W,y,z,side,0,.25,0,-.1)});
    s.add(5,function(o){var z=-.1+.12*(Math.floor(R()*5)/5),x=side*(.02+R()*(W-.02));set(o,x,-H,z+pz(x)*.45,0,-1,.3,0,-.1)});
    s.add(5,function(o){var x=side*(R()*(W+.07)),y=(R()*2-1)*(H+.07);set(o,x,y,-.12,0,0,1,.12,-.4)});
    s.add(3,function(o){var u=R()*4,x,y;if(u<2){x=side*(.02+R()*(W-.02));y=u<1?H:-H}else{x=side*W;y=(R()*2-1)*H}pagePt(o,x,y,.5,.004,1)});
  });
  s.add(3,function(o){set(o,gauss()*.012,(R()*2-1)*H,.03+R()*.03,0,0,1,.8,1)});
  return{d:s.bake(n),dot:[.58,-.07,.22,.05]};
}
/* 台股：一格一格的公司資料長條。量體有頂面與側面，亮點只留紅點 */
function makeTicker(n){
  var nc=20,nr=14,X=1.5,Y=1.05,cw=X*2/nc,ch=Y*2/nr,hw=cw*.36,hh=ch*.36,cells=[],hi=0,hmax=-1,i;
  function nz(x,y){return .5+.28*Math.sin(x*1.5+1.1)*Math.cos(y*1.9+.6)+.16*Math.sin(x*3.3-y*2.4)}
  for(var r=0;r<nr;r++)for(var c=0;c<nc;c++){var x=-X+cw*(c+.5),y=-Y+ch*(r+.5),h=Math.round(Math.max(.08,nz(x,y)+(R()-.5)*.18)*8)/8*.72;cells.push([x,y,h]);if(h>hmax){hmax=h;hi=cells.length-1}}
  var wt=0;for(i=0;i<cells.length;i++)wt+=.5+cells[i][2];
  var d=new Float32Array(n*8),k=0;
  for(i=0;i<cells.length;i++){var ce=cells[i],cnt=i===cells.length-1?n-k:Math.round(n*(.5+ce[2])/wt),light=ce[2]/hmax,j;
    for(j=0;j<cnt&&k<n;j++,k++){var u=R(),s=k*8,px,py,pz,nx=0,ny=0,nzz=1,e;
      if(u<.5){px=(R()*2-1)*hw;py=(R()*2-1)*hh;pz=ce[2];e=-.25+.95*light}
      else if(u<.62){var ee=R()<.5?-1:1;if(R()<.5){px=ee*hw;py=(R()*2-1)*hh}else{px=(R()*2-1)*hw;py=ee*hh}pz=ce[2];nx=px/hw*.4;ny=py/hh*.4;e=1}
      else{var z0=R()*ce[2];if(R()<.5){px=hw;py=(R()*2-1)*hh;nx=1}else{px=(R()*2-1)*hw;py=-hh;ny=-1}pz=z0;nzz=.3;e=-.7+.8*z0/ce[2]*light}
      d[s]=ce[0]+px;d[s+1]=ce[1]+py;d[s+2]=pz;d[s+3]=nx;d[s+4]=ny;d[s+5]=nzz;d[s+6]=0;d[s+7]=e}}
  var H=cells[hi];
  return{d:d,dot:[H[0],H[1],H[2]+.1,.07]};
}
/* 鎖＋鑰匙 */
function makeLock(n){
  var hw=.74,hh=.6,r=.16,cy=-.36,D=.27,s=new Shape(),cx=-.28;
  function hole(x,y){var dx=x-cx,dy=y-(cy+.08);if(dx*dx+dy*dy<.125*.125)return true;var v=(cy+.08)-y;return v>0&&v<.32&&Math.abs(dx)<.05+v*.13}
  s.add(22,face(cx,cy,hw,hh,r,D,1,0,hole,.05,.6));
  s.add(9,rim(cx,cy,hw,hh,r,D+.004,.005,0,1));
  s.add(7,face(cx,cy,hw,hh,r,-D,-1,0,null,-.5));
  s.add(14,wall(cx,cy,hw,hh,r,-D,D,0));
  var R0=.44,top=cy+hh;
  s.add(19,tube(function(u){
    var a=.42,b=Math.PI*R0,tot=2*a+b,q=u*tot;
    if(q<a)return[cx-R0,top-.02+q];q-=a;
    if(q<b){var t=q/R0;return[cx-R0*Math.cos(t),top+a-.02+R0*Math.sin(t)]}q-=b;
    return[cx+R0,top+a-.02-q]},.092,0,0));
  s.add(4,ring(cx,cy+.08,.155,.008,D+.004,1,1));
  s.add(4,function(o){var y=(cy+.08)-.14-R()*.2,sp=.06+((cy+.08)-y)*.13,sd=R()<.5?-1:1;set(o,cx+sd*(sp+.012)+gauss()*.005,y,D+.004,0,0,1,1,1)});
  [[-.58,.46],[.58,.46],[-.58,-.46],[.58,-.46]].forEach(function(p){s.add(.7,disc(cx+p[0],cy+p[1],.028,D+.004,.4,.8))});
  /* 鑰匙：斜放右下 */
  var ka=-.72,kc=[.86,.34],ca=Math.cos(ka),sa=Math.sin(ka);
  function kp(u,v){return[kc[0]+ca*u-sa*v,kc[1]+sa*u+ca*v]}
  s.add(6,tube(function(u){var a=u*6.2832;return kp(Math.cos(a)*.17,Math.sin(a)*.17)},.042,1,.8));
  s.add(7,tube(function(u){return kp(.17+u*.82,0)},.034,1,.8));
  [.72,.9].forEach(function(t){s.add(1.6,tube(function(u){return kp(t,-u*.15)},.03,1,.8))});
  return{d:s.bake(n),dot:[cx,cy+.08,D+.04,.075]};
}
/* 對話氣泡：黃銅主體，只有三個點會亮 */
function makeBubble(n){
  var hw=1.14,hh=.74,r=.34,cy=.12,D=.17,s=new Shape(),dots=[-.5,0,.5];
  function hole(x,y){for(var i=0;i<3;i++){var dx=x-dots[i],dy=y-cy;if(dx*dx+dy*dy<.17*.17)return true}return false}
  s.add(30,face(0,cy,hw,hh,r,D,1,0,hole,0,.7));
  s.add(10,rim(0,cy,hw,hh,r,D+.004,.006,0,1));
  s.add(9,face(0,cy,hw,hh,r,-D,-1,0,null,-.5));
  s.add(15,wall(0,cy,hw,hh,r,-D,D,0));
  var tail=[[-.56,cy-hh+.04],[-.72,cy-hh-.42],[-.14,cy-hh+.02]];
  function inTail(x,y){function sg(a,b){return (x-b[0])*(a[1]-b[1])-(a[0]-b[0])*(y-b[1])}var d1=sg(tail[0],tail[1]),d2=sg(tail[1],tail[2]),d3=sg(tail[2],tail[0]);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0))}
  s.add(4,function(o){var x,y,q=0;do{x=-.8+R()*.75;y=cy-hh-.45+R()*.52;q++}while(!inTail(x,y)&&q<60);set(o,x,y,D,0,0,1,0,0)});
  s.add(2.4,poly([tail[0],tail[1]],.005,D,0,1));s.add(2.4,poly([tail[2],tail[1]],.005,D,0,1));
  s.add(2.4,function(o){var a=tail[0],b=tail[1],u=R();set(o,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,-D+2*D*R(),-1,-.2,.2,0,-.2)});
  s.add(2.4,function(o){var a=tail[2],b=tail[1],u=R();set(o,a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,-D+2*D*R(),1,-.2,.2,0,-.2)});
  dots.forEach(function(x){var q=ld();s.add(5.5,function(o){var u=q(),a=u[0]*6.2832,k=Math.sqrt(u[1])*.142,bb=Math.sqrt(Math.max(0,1-k*k/(.142*.142)));set(o,x+Math.cos(a)*k,cy+Math.sin(a)*k,D+.03+bb*.06,Math.cos(a)*k*5,Math.sin(a)*k*5,bb+.2,1,1)})});
  return{d:s.bake(n),dot:[.5,cy,D+.1,.06]};
}
/* 記帳 App：同手機外框，畫面換成介面 */
function makeApp(n){
  var s=new Shape(),th=PH.th;phoneBody(s);
  s.add(6,face(0,-.0,.46,.96,.1,th-.008,1,0,null,-.5));
  s.add(12,face(0,.62,.4,.2,.05,th+.012,1,1,null,.9));
  [.2,.0,-.2,-.4].forEach(function(y,i){s.add(3.2,poly([[-.38,y],[.1-.08*i,y]],.012,th+.012,0,1));s.add(1.6,poly([[.22,y],[.38,y]],.012,th+.012,i===2?1:0,1))});
  s.add(8,disc(.3,-.76,.11,th+.016,1,1));
  return{d:s.bake(n),dot:[.3,-.76,th+.04,.06]};
}
/* 需求小球：每顆是客人講的一件事；位置由 RA.C.NEEDS 傳進來，窄螢幕是另一組 */
function makeNeeds(n){
  var s=new Shape(),B=NEEDS;
  B.forEach(function(b,i){var cx=b[0],cy=b[1],r=b[2],t=i%2?1:0;
    s.add(r*r*100,function(o){var z=R(),a=R()*6.2832,q=Math.sqrt(1-z*z),nx=Math.cos(a)*q,ny=Math.sin(a)*q,lit=-.5*nx+.62*ny+.6*z;
      set(o,cx+nx*r,cy+ny*r,z*r,nx,ny,z,t,Math.max(-1,Math.min(1,lit*1.5-.45)))});
  });
  return{d:s.bake(n),dot:[B[3][0],B[3][1],B[3][2]+.02,.07]};
}
/* 瀏覽器視窗 */
function makeWindow(n){
  var hw=1.22,hh=.82,r=.07,D=.06,s=new Shape();
  s.add(12,face(0,0,hw,hh,r,D,1,0,null,-.42,.4));
  s.add(14,rim(0,0,hw,hh,r,D+.004,.005,0,1));
  s.add(10,wall(0,0,hw,hh,r,-D,D,0));
  s.add(4,face(0,0,hw,hh,r,-D,-1,0,null,-.5));
  s.add(5,poly([[-hw,hh-.17],[hw,hh-.17]],.005,D+.004,0,1));
  [-1.1,-1.0,-.9].forEach(function(x,i){s.add(1.1,disc(x,hh-.085,.03,D+.006,i===0?1:0,1))});
  s.add(2.6,rim(.05,hh-.085,.72,.038,.03,D+.006,.003,0,.7));
  s.add(9,face(-.38,.16,.68,.3,.03,D+.012,1,0,null,.5,.4));
  s.add(3,poly([[-1.0,-.28],[-.1,-.28]],.012,D+.008,0,1));
  s.add(3,poly([[-1.0,-.38],[-.28,-.38]],.012,D+.008,0,.8));
  s.add(5,face(-.78,-.6,.24,.07,.02,D+.012,1,1,null,1));
  s.add(6,face(.72,.1,.34,.36,.03,D+.01,1,0,null,.15));
  s.add(5,face(.72,-.5,.34,.16,.03,D+.01,1,0,null,0));
  return{d:s.bake(n),dot:[-.78,-.6,D+.04,.055]};
}
/* 循環箭頭 */
function makeLoop(n){
  var s=new Shape(),Ro=.82;
  function arc(a0,a1){return function(u){var a=a0+(a1-a0)*u;return[Math.cos(a)*Ro,Math.sin(a)*Ro]}}
  function head(a,sign){var c=[Math.cos(a)*Ro,Math.sin(a)*Ro],t=[-Math.sin(a)*sign,Math.cos(a)*sign],o=[Math.cos(a),Math.sin(a)];var tip=[c[0]+t[0]*.42,c[1]+t[1]*.42],l=[c[0]+o[0]*.27,c[1]+o[1]*.27],m=[c[0]-o[0]*.27,c[1]-o[1]*.27];
    return function(O){var u=Math.sqrt(R()),v=R(),x=c[0]+(tip[0]-c[0])*(1-u)+(l[0]-c[0])*u*v+(m[0]-c[0])*u*(1-v),y=c[1]+(tip[1]-c[1])*(1-u)+(l[1]-c[1])*u*v+(m[1]-c[1])*u*(1-v);set(O,x,y,(R()-.5)*.12,0,0,1,1,1)}}
  s.add(34,tube(arc(.5,2.7),.1,0,0));s.add(34,tube(arc(3.64,5.84),.1,0,0));
  s.add(12,head(2.7,1));s.add(12,head(5.84,1));
  s.add(4,tube(arc(.5,2.7),.102,0,1));s.add(4,tube(arc(3.64,5.84),.102,0,1));
  return{d:s.bake(n),dot:[Math.cos(2.7)*Ro-.06,Math.sin(2.7)*Ro-.06,.14,.06]};
}
/* 燈泡 */
function makeBulb(n){
  var s=new Shape(),Rb=.72,cy=.24;
  var q=ld();
  s.add(26,function(o){var u=q(),a=u[0]*6.2832,z=u[1]*2-1,rr=Math.sqrt(1-z*z);var x=Math.cos(a)*rr*Rb,y=Math.sin(a)*rr*Rb*1.02+cy,zz=z*Rb*.72;if(y<cy-.56){x*=.62;y=cy-.56}set(o,x,y,zz,Math.cos(a)*rr,Math.sin(a)*rr,z,0,-.12)});
  s.add(14,tube(function(u){var a=-.86+u*(Math.PI+1.72);return[Math.cos(a)*Rb,Math.sin(a)*Rb*1.02+cy]},.008,0,1));
  s.add(3,poly([[Math.cos(-.86)*Rb,Math.sin(-.86)*Rb*1.02+cy],[.3,-.68]],.008,0,0,1));
  s.add(3,poly([[-Math.cos(-.86)*Rb,Math.sin(-.86)*Rb*1.02+cy],[-.3,-.68]],.008,0,0,1));
  [-.74,-.86,-.98].forEach(function(y,i){s.add(8,tube(function(u){return[-.3+i*.03+u*(.6-i*.06),y]},.05,0,.4))});
  s.add(10,poly([[-.2,-.66],[-.14,.14],[-.07,.04],[0,.2],[.07,.04],[.14,.14],[.2,-.66]],.008,.03,1,1));
  return{d:s.bake(n),dot:[0,.2,.08,.06]};
}

var GENS={grid:makeGrid,glyph:makeGlyph,crack:makePhone,fixed:makeFixed,ledger:makeLedger,ticker:makeTicker,lock:makeLock,bubble:makeBubble,app:makeApp,window:makeWindow,loop:makeLoop,bulb:makeBulb,needs:makeNeeds};

/* 配對：所有形狀同一 Morton 規則＋同一打亂表；前 Na 顆保留給那顆紅點 */
function part(v){v=Math.min(1023,Math.max(0,v*1023|0));v=(v|v<<16)&0x30000FF;v=(v|v<<8)&0x300F00F;v=(v|v<<4)&0x30C30C3;v=(v|v<<2)&0x9249249;return v}
function encode(res,n,Na,perm){
  var d=res.d,i,minx=1e9,miny=1e9,minz=1e9,maxx=-1e9,maxy=-1e9,maxz=-1e9,m=n-Na;
  var keys=new Float64Array(m),ca=.82,sa=.57,xs=new Float32Array(m),ys=new Float32Array(m),zs=new Float32Array(m);
  for(i=0;i<m;i++){var x=d[i*8],y=d[i*8+1],z=d[i*8+2],rx=ca*x+sa*z,rz=-sa*x+ca*z,ry=ca*y+sa*rz;rz=-sa*y+ca*rz;xs[i]=rx;ys[i]=ry;zs[i]=rz;
    if(rx<minx)minx=rx;if(rx>maxx)maxx=rx;if(ry<miny)miny=ry;if(ry>maxy)maxy=ry;if(rz<minz)minz=rz;if(rz>maxz)maxz=rz}
  var J=.1,idx=new Uint32Array(m);
  for(i=0;i<m;i++){var a=(xs[i]-minx)/(maxx-minx||1)+(R()-.5)*J,b=(ys[i]-miny)/(maxy-miny||1)+(R()-.5)*J,c=(zs[i]-minz)/(maxz-minz||1)+(R()-.5)*J;
    keys[i]=part(a)|part(b)<<1|part(c)<<2;idx[i]=i}
  idx.sort(function(p,q){return keys[p]-keys[q]});
  var buf=new ArrayBuffer(n*12),v=new DataView(buf),S=32767/8,dt=res.dot;
  function w(o,px,py,pz,nx,ny,nz,t,e){
    v.setInt16(o,px*S,true);v.setInt16(o+2,py*S,true);v.setInt16(o+4,pz*S,true);v.setInt16(o+6,t*32767,true);
    var l=Math.hypot(nx,ny,nz)||1;v.setInt8(o+8,nx/l*127);v.setInt8(o+9,ny/l*127);v.setInt8(o+10,nz/l*127);v.setInt8(o+11,Math.max(-1,Math.min(1,e))*127)}
  for(i=0;i<Na;i++){var th=R()*6.2832,zz=R()*2-1,rr=Math.sqrt(1-zz*zz),q=Math.cbrt(R())*dt[3]*.3,hx=Math.cos(th)*rr,hy=Math.sin(th)*rr;w(i*12,dt[0]+hx*q,dt[1]+hy*q,dt[2]+zz*q,hx,hy,zz,1,1)}
  for(i=0;i<m;i++){var s=idx[perm[i]]*8;w((Na+i)*12,d[s],d[s+1],d[s+2],d[s+3],d[s+4],d[s+5],d[s+6],d[s+7])}
  return buf;
}
function makePerm(n,Na){var m=n-Na,p=new Uint32Array(m),i,r=rng(20261101);for(i=0;i<m;i++)p[i]=i;for(i=m-1;i>0;i--){var j=r()*(i+1)|0,t=p[i];p[i]=p[j];p[j]=t}return p}
var permCache=null;
function gen(name,n,Na,G,NB){
  if(NB)NEEDS=NB;
  var h=0;for(var c=0;c<name.length;c++)h=(h*31+name.charCodeAt(c))|0;
  R=rng(h^0x5bd1e995);
  if(!permCache||permCache.length!==n-Na)permCache=makePerm(n,Na);
  var res=GENS[name](n,G);
  return encode(res,n,Na,permCache);
}
return{gen:gen};
}
