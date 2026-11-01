/* 介面行為：LINE、選單、搜尋、想法與處境按鈕、FAQ、動態開關。
   不碰繪圖；繪圖層掛掉時這裡全部照常運作。 */
(function(){
'use strict';
var root=document.documentElement;
var RA=window.RA=window.RA||{};
function $$(s,p){return [].slice.call((p||document).querySelectorAll(s))}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
/* 繪圖層就緒前是空函式，這裡不等它 */
RA.pick=function(){};
RA.setMotion=function(){};
RA.relayout=function(){};
RA.picked={};

/* ---------- LINE：底部列、桌機面板、複製 ID ---------- */
(function(){
  var bar=document.getElementById('bar'),a=document.querySelector('#heroCta .btn'),b=document.getElementById('closeCta'),va=true,vb=false;
  if('IntersectionObserver'in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){var full=e.isIntersecting&&e.intersectionRatio>=.98;if(e.target===a)va=full;else vb=e.isIntersecting});
      bar.classList.toggle('show',!va&&!vb);
    },{threshold:[0,.98,1]});
    io.observe(a);io.observe(b);
  }else bar.classList.add('show');
  var dlg=document.getElementById('linePanel'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  $$('a[data-line]').forEach(function(l){l.addEventListener('click',function(e){
    if(e.ctrlKey||e.metaKey||e.shiftKey)return;
    if(fine.matches&&innerWidth>=768&&dlg.showModal&&!l.hasAttribute('data-direct')){e.preventDefault();root.classList.add('dlg-open');dlg.showModal()}
  })});
  dlg.addEventListener('close',function(){root.classList.remove('dlg-open')});
  /* 只有點在面板外才關；內側留白的 target 也是 dialog 本身 */
  dlg.addEventListener('click',function(e){if(e.target!==dlg)return;var r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close()});
  document.getElementById('lineClose').addEventListener('click',function(){dlg.close()});
  $$('[data-copy]').forEach(function(btn){
    var t0=btn.textContent;
    function fail(){
      btn.textContent='請手動選取';
      var id=btn.parentNode.querySelector('.id');
      try{var r=document.createRange();r.selectNodeContents(id);var s=getSelection();s.removeAllRanges();s.addRange(r)}catch(e){}
    }
    btn.addEventListener('click',function(){
      var v=btn.getAttribute('data-copy');
      function ok(){btn.textContent='已複製';setTimeout(function(){btn.textContent=t0},1400)}
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(v).then(ok,fail);else fail();
    });
  });
})();

/* ---------- 選單：開啟時其餘區塊 inert，Esc 關閉並還焦點 ---------- */
(function(){
  var b=document.getElementById('menuBtn'),m=document.getElementById('menu');
  var rest=$$('main,footer,#bar,.nav .brand,.skip');
  function set(o){
    m.classList.toggle('open',o);b.setAttribute('aria-expanded',o?'true':'false');b.textContent=o?'關閉':'選單';root.classList.toggle('menu-open',o);
    rest.forEach(function(e){if(o)e.setAttribute('inert','');else e.removeAttribute('inert')});
    if(o){var f=m.querySelector('a');if(f)f.focus()}
  }
  b.addEventListener('click',function(){set(!m.classList.contains('open'))});
  m.addEventListener('click',function(e){if(e.target.tagName==='A')set(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&m.classList.contains('open')){set(false);b.focus()}});
  /* 開著選單時轉橫向或放寬：選單被 CSS 藏起來，鎖定要一起解除 */
  var wide=matchMedia('(min-width:768px)');function wd(e){if(e.matches&&m.classList.contains('open'))set(false)}
  if(wide.addEventListener)wide.addEventListener('change',wd);else if(wide.addListener)wide.addListener(wd);
  addEventListener('resize',function(){wd({matches:wide.matches})});
})();

/* ---------- 手機導覽：下捲藏、回捲出現；transform 動畫，不動版面 ---------- */
(function(){
  var nav=document.querySelector('.nav'),last=0,tick=false;
  function upd(){
    tick=false;var y=Math.max(0,scrollY),d=y-last;
    if(y<52){nav.classList.remove('hide');nav.classList.toggle('solid',y>0);last=y;return}
    if(Math.abs(d)<6)return;
    if(!root.classList.contains('menu-open')){nav.classList.toggle('hide',d>0);nav.classList.add('solid')}
    last=y;
  }
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(upd)}},{passive:true});
  nav.addEventListener('focusin',function(){nav.classList.remove('hide')});
  /* 重新整理停在中段時，第一次捲動事件才定位，這裡不讀 scrollY，免得多算一次版面 */
  requestAnimationFrame(function(){last=Math.max(0,scrollY);if(last>=52)nav.classList.add('hide','solid')});
})();

/* ---------- h1 放大字保險：不斷字，整體等比縮 ---------- */
function fitH1(){
  var h=document.querySelector('h1'),sp=$$('span',h);
  /* 沒縮過就不動 style，免得多一次整頁版面計算 */
  if(sp[0].style.fontSize)sp.forEach(function(s){s.style.removeProperty('font-size')});
  var w=h.parentElement.clientWidth,max=0;
  sp.forEach(function(s){var r=document.createRange();r.selectNodeContents(s);max=Math.max(max,r.getBoundingClientRect().width)});
  if(max>w+1){
    var fs=parseFloat(getComputedStyle(sp[0]).fontSize)*w/max;
    sp.forEach(function(s){s.style.setProperty('font-size',fs+'px','important')});
  }
}
RA.fitH1=fitH1;
var rzT=0;addEventListener('resize',function(){clearTimeout(rzT);rzT=setTimeout(fitH1,120)});

/* ---------- 全部服務：搜尋與計數，內容全在 HTML，數字由 DOM 算 ---------- */
(function(){
  var box=document.getElementById('capsQ'),groups=$$('.cap'),items=$$('.cap li'),sum=document.getElementById('capsN'),res=document.getElementById('capsR');
  sum.textContent=groups.length+' 大類、'+items.length+' 項';
  /* 全形半形、大小寫、空白都不影響比對：「ＬＩＮＥ」「修bug」「LINE 機器人」都找得到 */
  var hays=null,wide=null;
  function norm(s){return (s.normalize?s.normalize('NFKC'):s).toLowerCase()}
  function flat(s){return norm(s).replace(/\s+/g,'')}
  box.addEventListener('input',function(){
    var raw=box.value.trim(),terms=norm(raw).split(/\s+/).filter(Boolean),q=terms.length>0,n=0;
    if(!hays){hays=items.map(function(li){return flat(li.textContent+' '+(li.getAttribute('data-syn')||''))});
      wide=items.map(function(li,i){var cap=li.closest('.cap');return hays[i]+flat(cap.querySelector('summary').textContent+' '+cap.querySelector('.bl').textContent)})}
    /* 先比對項目本身；一項都沒中才放寬到類別名稱與類別說明，一個詞不會帶出整類 */
    function test(src){var c=0;items.forEach(function(li,i){var hit=terms.every(function(t){return src[i].indexOf(t)>=0});li.hidden=!hit;if(hit)c++});return c}
    n=test(hays);if(q&&!n)n=test(wide);
    groups.forEach(function(g){var any=$$('li',g).some(function(l){return !l.hidden});g.hidden=!any;g.open=!!q&&any});
    res.textContent=q?(n?'「'+raw+'」找到 '+n+' 項':'清單裡沒找到，直接用 LINE 問。'):'';
  });
  /* 舊錨點與導覽連到全部服務時自動展開 */
  var all=document.querySelector('#all>details');
  function hash(){var h=location.hash;if(h!=='#all'&&h!=='#capabilities')return;var was=all.open;all.open=true;if(!was)requestAnimationFrame(function(){all.closest('section').scrollIntoView()})}
  addEventListener('hashchange',hash);hash();
  $$('a[href="#all"],a[href="#capabilities"]').forEach(function(a){a.addEventListener('click',function(){all.open=true})});
})();

/* ---------- 常見問題：支援 details name 的瀏覽器由原生處理；舊瀏覽器這裡保險 ---------- */
(function(){
  var ds=$$('.faq details');
  ds.forEach(function(d){d.addEventListener('toggle',function(){if(d.open)ds.forEach(function(o){if(o!==d&&o.open)o.open=false})})});
})();

/* ---------- 處境與概念圖：筆記與彩稿一定會切，粒子變形是加分 ---------- */
(function(){
  var btns=$$('#ideas button'),notes=$$('.idea-notes'),mocks=$$('.mock'),slot=document.querySelector('#concept .slot'),box=document.querySelector('.mocks'),tm=0;
  function on(i,first){
    btns.forEach(function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false')});
    notes.forEach(function(n,j){n.classList.toggle('on',j===i)});
    clearTimeout(tm);
    function show(){mocks.forEach(function(m,j){m.classList.toggle('on',j===i)})}
    if(first){show();return}
    /* 舊稿留到變形結束才換，中間不留空框；看不到粒子或沒有變形時不等 */
    var r=slot.getBoundingClientRect(),seen=r.bottom>60&&r.top<innerHeight-60,wait=(root.classList.contains('gl-on')&&RA.motion&&seen)?950:30;
    tm=setTimeout(show,wait);
    if(innerWidth<768)box.scrollIntoView({block:'nearest',behavior:RA.motion?'smooth':'auto'});
  }
  btns.forEach(function(b,i){b.addEventListener('click',function(){var s=b.getAttribute('data-pick');on(i);RA.picked.concept=s;RA.pick('concept',s)})});
  on(0,true);
  /* 處境：滑過與聚焦只是預覽，點了才算選；離開列表回到選的那一列 */
  var list=document.getElementById('pick'),pb=$$('button',list),stuckSlot=document.querySelector('#stuck .slot'),fbs=$$('[data-fb]',stuckSlot),cur=pb[0];
  function show(b){var s=b.getAttribute('data-pick');fbs.forEach(function(f){if(f.getAttribute('data-fb')===s)f.removeAttribute('hidden');else f.setAttribute('hidden','')});RA.pick('stuck',s)}
  function pk(b){
    var top0=b.getBoundingClientRect().top;
    cur=b;pb.forEach(function(x){var on=x===b;x.setAttribute('aria-pressed',on?'true':'false');x.parentNode.classList.toggle('sel',on)});
    RA.picked.stuck=b.getAttribute('data-pick');show(b);RA.relayout();
    /* 上一列收合不能把剛點的列推走 */
    var dy=b.getBoundingClientRect().top-top0;if(Math.abs(dy)>1)scrollBy({top:dy,behavior:'instant'});
    /* 上下堆疊時：圖完全看不到才往回捲，而且剛點的列要留在畫面內 */
    if(getComputedStyle(stuckSlot).position==='absolute')return;
    var nav=68,r=stuckSlot.getBoundingClientRect();if(r.bottom>nav+40)return;
    var bar=document.getElementById('bar'),vb=innerHeight-(bar.classList.contains('show')?60:0)-8;
    var room=vb-b.parentNode.getBoundingClientRect().bottom,d=Math.min(nav+r.height-r.bottom,room);
    if(d>8)scrollBy({top:-d,behavior:RA.motion?'smooth':'auto'});
  }
  pb.forEach(function(b){
    b.addEventListener('click',function(){pk(b)});
    b.addEventListener('focus',function(){show(b)});
    if(matchMedia('(hover:hover)').matches)b.addEventListener('pointerenter',function(){show(b)});
  });
  list.addEventListener('pointerleave',function(){show(cur)});
  list.addEventListener('focusin',function(e){if(e.target.tagName!=='BUTTON')show(cur)});
  list.addEventListener('focusout',function(e){if(!e.relatedTarget||!list.contains(e.relatedTarget))show(cur)});
})();

/* ---------- 動態開關 ---------- */
(function(){
  var btns=$$('[data-mo]'),mq=matchMedia('(prefers-reduced-motion: reduce)'),conn=navigator.connection||{};
  RA.motion=!mq.matches&&store('rawair-motion')!=='off'&&!conn.saveData&&!/2g/.test(conn.effectiveType||'');
  RA.paintMotion=function(m){RA.motion=m;btns.forEach(function(b){b.textContent='動態：'+(m?'開':'關');b.setAttribute('aria-checked',m?'true':'false')})};
  RA.paintMotion(RA.motion);
  btns.forEach(function(b){b.addEventListener('click',function(){var m=!RA.motion;store('rawair-motion',m?'on':'off');RA.paintMotion(m);RA.setMotion(m)})});
  function ch(e){var m=!e.matches&&store('rawair-motion')!=='off';RA.paintMotion(m);RA.setMotion(m)}
  if(mq.addEventListener)mq.addEventListener('change',ch);
})();

/* 第一次繪製之後才量，不在解析期同步排版 */
requestAnimationFrame(function(){setTimeout(fitH1,0)});
})();
