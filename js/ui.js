/* 介面行為：LINE、選單、搜尋、想法與處境按鈕、FAQ、需求小球、誠實報價、動態開關。
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
RA.setNeeds=function(){};
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
    if(fine.matches&&innerWidth>=768&&dlg.showModal&&!l.hasAttribute('data-direct')){e.preventDefault();RA.openLine(l.id==='qLine')}
  })});
  var paste=document.getElementById('linePaste');
  /* 帶著需求單開面板：剪貼簿裡是單子，不放「複製 ID」免得被蓋掉；焦點先落在開啟 LINE，讀屏會念下一步 */
  RA.openLine=function(p){
    if(paste)paste.hidden=!p;dlg.classList.toggle('pasting',!!p);
    if(p)dlg.setAttribute('aria-describedby','linePaste');else dlg.removeAttribute('aria-describedby');
    if(dlg.showModal){root.classList.add('dlg-open');dlg.showModal();if(p){var go=dlg.querySelector('a[data-direct]');if(go)go.focus()}}
  };
  dlg.addEventListener('close',function(){root.classList.remove('dlg-open');dlg.classList.remove('pasting');dlg.removeAttribute('aria-describedby');if(paste)paste.hidden=true});
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

/* ---------- 需求小球：可複選，選到的帶進需求單。#needsFly 是引擎複製的，用事件委派，兩份一起更新 ---------- */
(function(){
  var list=document.getElementById('needsL');if(!list)return;
  /* 沒有 JS 時是純文字；到這裡才升級成按鈕，引擎複製飛行標籤在這之後 */
  $$('span.nd',list).forEach(function(s){
    var n=document.createElement('button');n.type='button';n.className='nd';n.setAttribute('data-need',s.getAttribute('data-need'));n.setAttribute('aria-pressed','false');
    while(s.firstChild)n.appendChild(s.firstChild);s.parentNode.replaceChild(n,s);
  });
  var keys=$$('[data-need]',list).map(function(b){return b.getAttribute('data-need')}),on={},say=document.getElementById('needsS'),t0=say.textContent;
  RA.needs={
    list:function(){return keys.filter(function(k){return on[k]})},
    names:function(){return RA.needs.list().map(function(k){return list.querySelector('[data-need="'+k+'"]').textContent.trim()})},
    clear:function(){on={};paint()}
  };
  function paint(){
    $$('button[data-need]').forEach(function(b){b.setAttribute('aria-pressed',on[b.getAttribute('data-need')]?'true':'false')});
    var n=RA.needs.list().length;
    if(n){say.textContent='記下 '+n+' 件，會帶到需求單。';var a=document.createElement('a');a.href='#quote';a.textContent='看需求單';say.appendChild(a)}else say.textContent=t0;
    RA.needsOn=keys.map(function(k){return on[k]?1:0});RA.setNeeds(RA.needsOn);
    if(RA.quoteRender)RA.quoteRender();
  }
  document.addEventListener('click',function(e){
    if(!e.target.closest)return;
    var b=e.target.closest('[data-need]');
    if(b){var k=b.getAttribute('data-need');on[k]=!on[k];paint();return}
    /* 手機從單子回來改：落在球停好、標籤點得到的位置，不用原生錨點 */
    var l=e.target.closest('a[href="#needs"]'),y=l&&RA.needsY?RA.needsY():null;
    if(y===null)return;
    e.preventDefault();scrollTo({top:y,behavior:RA.motion?'smooth':'auto'});
    var f=list.querySelector('button');if(f)f.focus({preventScroll:true});
  });
  /* 鍵盤進到列表：把原本那份顯示出來，焦點才看得到 */
  list.addEventListener('focusin',function(e){if(e.target.matches(':focus-visible'))root.classList.add('needs-kbd')});
  list.addEventListener('focusout',function(e){if(!e.relatedTarget||!list.contains(e.relatedTarget))root.classList.remove('needs-kbd')});
})();

/* ---------- 誠實報價：點選題，一行一行寫出需求單。單子本身不寫金額 ---------- */
(function(){
  var box=document.getElementById('quote');if(!box)return;

  /* 金額：屋主決定後填在這裡，單位新台幣。全部空著時，畫面與複製文字都不會出現金額。
     range：要做什麼 x 規模，每格填 [最低, 最高]
     rush：急件倍率，例如 rush:1.3 代表乘上 1.3
     after：做完之後的加項，每格填 [最低, 最高]
     選「還說不上來」或「看別人的報價」時沒有對應的格子，就不顯示金額（check 也可以改填 [最低, 最高]）。
     金額只看上面三題，不算小球勾了幾顆；小球勾得比選的規模多時不顯示金額，要聊過才說。
     有填金額時，開頭那句「這張單子不寫金額」會自動換掉，見 render。 */
  var PRICE=RA.PRICE={
    range:{
      site:{small:null,mid:null,large:null},
      system:{small:null,mid:null,large:null},
      app:{small:null,mid:null,large:null},
      auto:{small:null,mid:null,large:null},
      fix:{small:null,mid:null,large:null},
      check:null
    },
    rush:{flex:null,date:null,rush:null},
    after:{self:null,learn:null,maint:null,unsure:null}
  };

  var SAY={
    site:'好，網站。',system:'好，內部系統。資料怎麼進出，我會多問幾句。',app:'好，手機 App。',auto:'好。先把你現在手動的步驟攤開來看。',fix:'好。先健檢，再決定修還是重寫。',check:'好。把對方的報價單傳給我，一起看哪裡要再問。',
    small:'範圍小，價格也比較容易準。',mid:'中等的案子，先把範圍寫清楚最重要。',large:'有登入、有串接，工作量會明顯變多，先講。',unknown:'沒關係，這題單子上先留著，一起釐清。',
    flex:'不急，就排在品質優先的節奏。',date:'把日期告訴我，先看排不排得進去。',rush:'急件可以，但會影響價格，先講。',
    self:'付清後原始碼交給你，要自己改、找別人維護都可以。',learn:'好，教你自己改，確認範圍時一起寫進去。',maint:'維護另外談，月費或按次計都可以。',unsure:'沒關係，晚點決定也行，開工前講好就好。'
  };
  /* 可能會做的工作：都是要談的事，確認範圍時才定，不是承諾 */
  var INC={
    site:['內容跟版面怎麼整理','手機電腦都能看','上線要怎麼設定'],
    system:['資料怎麼存、怎麼查','每天要用的操作畫面','上線要放在哪裡'],
    app:['手機上的畫面與功能','實機測試怎麼做','上架要不要一起做'],
    auto:['把手動步驟整理成流程','哪些步驟交給程式跑','出錯時怎麼通知你'],
    fix:['先看一次程式（健檢）','列出問題，評估修還是重寫比較划算','修好後怎麼確認'],
    check:['看懂對方報價裡的每一項','列出哪些要再問清楚','用白話回給你']
  };
  var NEED={
    stock:['庫存進出紀錄與對帳','現在庫存記在哪裡？紙本、Excel，還是記在腦袋？'],
    report:['報表自動產出','報表長什麼樣？給一份範例最快。'],
    faq:['常見問題自動回覆','客人最常問的是哪幾句？'],
    idea:['先畫概念圖，確認方向','這個想法要解決誰的什麼麻煩？'],
    order:['把訂單收到同一個地方','訂單從哪幾個群組或管道進來？'],
    mobile:['手機上也能看的畫面','誰要看？最想隨時看到哪幾個數字？']
  };
  var ASK={
    site:['內容跟照片有現成的嗎？','主機和網域要用誰的名義？'],
    system:['幾個人會用？每個人能看到的一樣嗎？','有沒有舊資料要搬進來？','主機要放哪裡？'],
    app:['iPhone、Android 都要嗎？','上架帳號用誰的名義？'],
    auto:['現在這件事一次要做多久、多久做一次？'],
    fix:['程式碼或專案檔拿得到嗎？','現在壞的樣子，有截圖或錄影嗎？'],
    check:['對方的報價單可以傳給我嗎？']
  };
  /* 網站上已經寫明的兩件事 */
  var FACT=['尾款前先完整試用','付清後原始碼與說明文件交給你'];
  var TIER=['小型','中型','大型'],SYS={stock:1,report:1,faq:1,order:1,mobile:1},BT0='先複製目前寫好的',BT1='複製這張需求單，用 LINE 傳給我';
  /* 工作量的三團粒子：同一個亂數序列，每次畫出來一樣 */
  var CLUST=[16,44,110].map(function(n,c){
    var R=6+c*5,s='',a=7+c;function r(){a=(a*16807)%2147483647;return a/2147483647}
    for(var i=0;i<n;i++){var t=i*2.39996,q=R*Math.sqrt((i+.5)/n)*(.82+.3*r());s+='<circle cx="'+(30+q*1.5*Math.cos(t)).toFixed(1)+'" cy="'+(22+q*Math.sin(t)).toFixed(1)+'" r="'+(.8+.5*r()).toFixed(2)+'"/>'}
    return '<svg viewBox="0 0 60 44" fill="currentColor">'+s+'</svg>';
  });

  var qs=$$('.q',box),ql=box.querySelector('.q-l'),say=document.getElementById('qSay'),doneSay=document.getElementById('qDone'),sheet=document.getElementById('qSheet'),body=document.getElementById('qBody'),acts=$$('[data-act]',box),dones=$$('[data-done]',box),price=document.getElementById('price'),barEl=document.getElementById('bar'),send=document.getElementById('qSend'),
      btn=document.getElementById('qCopy'),res=document.getElementById('qRes'),txt=document.getElementById('qTxt'),lnk=document.getElementById('qLine'),seen={},ans={},reT=0,goT=0,opened=null,wasDone=false,sheetOn=false,keyed=false;
  function qk(q){return q.getAttribute('data-q')}
  /* 只讀 ans：瀏覽器還原的勾選不算數 */
  function label(k){var i=ans[k]&&box.querySelector('input[name="q-'+k+'"][value="'+ans[k]+'"]');if(!i)return'';var s=i.nextElementSibling.cloneNode(true),sm=s.querySelector('small');if(sm)s.removeChild(sm);return s.textContent.trim()}
  /* 看別人的報價只問急不急，其他題不適用 */
  function active(){return qs.filter(function(q){var k=qk(q);return !(ans.what==='check'&&(k==='size'||k==='after'))})}
  function firstOpen(){return active().filter(function(q){return !ans[qk(q)]})[0]||null}
  function nsel(){return RA.needs?RA.needs.list():[]}
  function sysN(){return nsel().filter(function(k){return SYS[k]}).length}
  /* 選的規模裝不下勾的事：不給一個低的工作量，也不替客人加碼，聊過才說 */
  function conflict(){return ans.what!=='check'&&((ans.size==='small'&&sysN()>=2)||(ans.size==='mid'&&sysN()>=4))}
  /* 修東西沒看過程式不預告小；其他句子照表 */
  function sayFor(v){return v==='small'&&ans.what==='fix'?'單點問題也接，先看一次程式。':SAY[v]}

  function tier(){
    /* 工作量不超過客人自己選的規模；修東西要看過程式才知道 */
    if(ans.what==='check'||ans.what==='fix'||!ans.size||ans.size==='unknown'||conflict())return -1;
    return {small:0,mid:1,large:2}[ans.size];
  }
  function incl(){
    var a=ans.what?INC[ans.what].slice():[];
    if(ans.what==='check')return a;
    if(ans.size==='large')a.push('登入與權限、串接別的系統');
    nsel().forEach(function(k){a.push(NEED[k][0])});
    if(ans.after==='learn')a.push('教你自己改');
    if(ans.after==='maint')a.push('交付後的維護方式（另外談）');
    return a;
  }
  function drivers(){
    var d=[];
    if(ans.what==='check')return d;
    if(ans.what==='fix')d.push('要看過程式才說得準，健檢後才知道修還是重寫。');
    if(conflict())d.push('要做的事比規模看起來多，要一起看。');
    else if(ans.size==='small'&&!nsel().length&&ans.what!=='fix'&&ans.what!=='auto')d.push('畫面少、功能單純，通常比較省。');
    if(ans.size==='mid')d.push(ans.what==='fix'||ans.what==='auto'?'範圍越清楚，價格越準。':'畫面數量、資料多少。範圍越清楚，價格越準。');
    if(ans.size==='large')d.push('登入、後台、串金流或別的系統，工作量會明顯變多。');
    if(ans.size==='unknown')d.push('範圍還沒定，這是現在最大的變數。');
    if(ans.rush==='flex')d.push('時間不趕，不會有急件的影響。');
    if(ans.rush==='date')d.push('日期排不排得進去，看範圍。');
    if(ans.rush==='rush')d.push('急件會影響價格。');
    if(ans.after==='self')d.push('不含長期維護。');
    if(ans.after==='learn')d.push('要多一段教你自己改。');
    if(ans.after==='maint')d.push('長期維護另外算，月費或按次計。');
    if(ans.after==='unsure')d.push('要不要維護，開工前先講。');
    return d;
  }
  function asks(){
    var a=ans.what?ASK[ans.what].slice():[];
    if(ans.size==='unknown')a.push('如果只能先解決一件事，是哪一件？');
    if(ans.rush==='date'||ans.rush==='rush')a.push('最晚要哪一天能用？');
    if(ans.what!=='check')nsel().forEach(function(k){a.push(NEED[k][1])});
    return a;
  }
  /* 有金額才回傳字串；對應的格子空著就是空字串，畫面整列不出現 */
  function money(n){return 'NT$ '+Math.round(n).toLocaleString('en-US')}
  function priceText(){
    if(firstOpen()||conflict())return'';
    var t=PRICE.range[ans.what],r=ans.what==='check'?t:(t&&t[ans.size]);if(!r)return'';
    var lo=r[0],hi=r[1],m=PRICE.rush[ans.rush],f=PRICE.after[ans.after];
    if(m){lo*=m;hi*=m}
    if(f){lo+=f[0];hi+=f[1]}
    return money(lo)+' 到 '+money(hi);
  }
  /* 新寫上去的行依序出現；還沒寫的留虛線，高度不會一次跳太多 */
  var wr=0;
  function fresh(key){if(seen[key])return'';return ' class="new" style="--d:'+(wr++*70)+'ms"'}
  function rows(items,tag,ph){
    if(!items.length){var s='';for(var i=0;i<ph;i++)s+='<li class="ph" aria-hidden="true"></li>';return s}
    return items.map(function(t){return '<li'+fresh(tag+t)+'>'+t+'</li>'}).join('');
  }
  /* 開頭兩句寫的是「不寫金額」：屋主填了金額就不成立，跟著換 */
  var qinS=box.querySelector('.q-in span'),sTop=box.querySelector('.s-top'),QIN0=qinS.textContent,TOP0=sTop.textContent;
  function anyPrice(){return /\d/.test(JSON.stringify(PRICE))}
  function render(){
    var names=RA.needs?RA.needs.names():[],got=Object.keys(ans).length,h='',comp=got>0&&!firstOpen();
    var none=!got&&!names.length;acts.forEach(function(x){x.hidden=none});
    dones.forEach(function(x){x.hidden=!comp});
    price.classList.toggle('sheet-has',!none);
    sheet.classList.toggle('complete',comp);
    send.textContent=ans.what==='check'?'連同對方的報價單傳給我。':'傳給我，確認範圍後才報價。';
    wr=0;
    if(none)h+='<p class="s-empty">還是空的。選第一題，這裡就開始寫。</p>';
    h+='<dl class="s-ans">'+active().map(function(q){var k=qk(q),v=label(k);return '<div><dt>'+q.querySelector('.q-s').textContent+'</dt>'+(v?'<dd'+fresh('q'+k+v)+'>'+v+'</dd>':'<dd class="ph" aria-hidden="true"></dd>')+'</div>'}).join('')+'</dl>';
    if(ans.what&&ans.what!=='check'&&ans.size){
      var ti=tier();
      h+='<div class="s-row"><h4>工作量：'+(ti>=0?TIER[ti]:'聊過才知道')+'</h4><div class="scale" aria-hidden="true">'+TIER.map(function(t,i){return '<i'+(i===ti?' class="on"':'')+'>'+CLUST[i]+t+'</i>'}).join('')+'</div><p class="s-note">'+(ti>=0?'這是相對大小，實際要看過需求才算數。':ans.what==='fix'?'要看過程式才知道工作量。':conflict()?'你選了'+label('size')+'，但要做的事比規模看起來多。':'範圍定了才看得出來。')+'</p></div>';
    }
    var pt=priceText();
    qinS.textContent=anyPrice()?'金額要看過需求才報得準，先把要談的事列清楚。':QIN0;
    sTop.textContent=pt?'下面是參考金額，確認範圍後才正式報價。':TOP0;
    if(pt)h+='<div class="s-row"><h4>參考金額</h4><p class="s-range">'+pt+'</p><p class="s-note">實際金額要看過需求才確定。</p></div>';
    if(ans.what!=='check')h+='<div class="s-row"><h4>你提到的事</h4>'+(names.length?'<a class="s-back" href="#needs">回去改</a><ul>'+rows(names,'n',0)+'</ul>':'<p class="s-note"><a href="#needs">上面的小球點過的事，會記在這裡</a></p>')+'</div>';
    var ic=incl(),dr=drivers(),as=asks(),chk=ans.what==='check';
    h+='<div class="s-row"><h4>'+(chk?'會看的地方':'可能會做的工作（確認範圍時再定）')+'</h4><ul class="s-2">'+rows(ic,'i',3)+'</ul></div>';
    if(!chk){
      h+='<div class="s-row"><h4>會影響價格的事</h4><ul>'+rows(dr,'d',2)+'</ul></div>';
      h+='<div class="s-row"><h4>先講好的</h4><ul>'+rows(ans.what?FACT:[],'f',2)+'</ul></div>';
    }
    h+='<div class="s-row"><h4>我可能還會問你</h4><ul>'+rows(as,'a',2)+'</ul></div>';
    body.innerHTML=h;
    seen={};
    active().forEach(function(q){var k=qk(q),v=label(k);if(v)seen['q'+k+v]=1});
    ic.forEach(function(t){seen['i'+t]=1});names.forEach(function(t){seen['n'+t]=1});dr.forEach(function(t){seen['d'+t]=1});as.forEach(function(t){seen['a'+t]=1});if(ans.what)FACT.forEach(function(t){seen['f'+t]=1});
    btn.textContent=comp?BT1:BT0;
    barYield();
    RA.relayout();
    if(comp&&!wasDone)stampFx();
    wasDone=comp;
    RA.quoteLevel&&RA.quoteLevel(active().length?active().filter(function(q){return ans[qk(q)]}).length/active().length:0);
  }
  /* 傳出去的是客人自己的話：只帶選了什麼、遇到什麼，加一句請託 */
  function sheetText(){
    var L=['我在 RAW AIR 網站點的需求：'];
    active().forEach(function(q){var v=label(qk(q));if(v)L.push(q.querySelector('.q-s').textContent+'：'+v)});
    var pt=priceText();if(pt)L.push('網站上的參考金額：'+pt);
    var n=RA.needs?RA.needs.names():[];
    if(n.length&&ans.what!=='check'){L.push('','我遇到的事：');n.forEach(function(x){L.push('・'+x)})}
    L.push('',ans.what==='check'?'想請你幫我看一份報價，報價單我再傳給你。':'想請你看一下，確認範圍後再報價給我。');
    return L.join('\n');
  }
  RA.quoteRender=function(){render();clearRes()};
  RA.quoteText=sheetText;

  /* 粒子回饋：沒有繪圖層或動態關閉時這些都是空的 */
  /* 漣漪從題目下方的粒子帶發出：字塊上有遮罩，放在印章或選項上會被吃掉 */
  function fxOrigin(){
    var l=ql.getBoundingClientRect(),s=sheet.getBoundingClientRect(),stacked=s.top>=l.bottom-1;
    return[l.left+l.width/2,Math.max(90,Math.min(innerHeight-50,stacked?(l.bottom+s.top)/2:l.bottom+60))];
  }
  function answerFx(){
    if(!RA.ripple)return;
    var o=fxOrigin();RA.ripple(o[0],o[1],innerWidth<768?64:72,1.9,.6);
    if(RA.quoteSurge)RA.quoteSurge(.35);
  }
  function stampFx(){
    if(!RA.ripple)return;
    var o=fxOrigin();RA.ripple(o[0],o[1],innerWidth<768?110:150,1.25,1);
    if(RA.quoteSurge)RA.quoteSurge(1);
  }

  /* 題目開合：一次開一題，答過的收成一行 */
  function layout(){
    var a=active();
    qs.forEach(function(q){
      var k=qk(q),i=a.indexOf(q),isOpen=q===opened;
      q.hidden=i<0;
      q.classList.toggle('done',!!ans[k]&&!isOpen);
      q.classList.toggle('wait',!ans[k]&&!isOpen);
      if(i<0)return;
      q.querySelector('.q-n').textContent='第 '+(i+1)+' 題，共 '+a.length+' 題';
      var v=label(k),ch=q.querySelector('.q-ch');ch.querySelector('.q-a').textContent=v;
      ch.setAttribute('aria-label','改「'+q.querySelector('.q-s').textContent+'」，現在是：'+v);
      q.querySelector('.q-next').textContent=a.some(function(x){return x!==q&&!ans[qk(x)]})?'下一題':'完成';
    });
  }
  /* 綠條亮起來又在畫面上時，底部綠列讓位，不疊兩條綠 */
  function barYield(){if(barEl)barEl.classList.toggle('yield',sheetOn&&sheet.classList.contains('complete'))}
  function bar(){return innerWidth<768&&barEl&&barEl.classList.contains('show')&&!barEl.classList.contains('yield')?60:0}
  if('IntersectionObserver'in window)new IntersectionObserver(function(es){sheetOn=es[es.length-1].isIntersecting;barYield()},{rootMargin:'0px 0px -70px 0px'}).observe(sheet);
  /* inset：下面還黏著什麼（複製鈕）；topEl：要一起留在畫面裡的上一塊 */
  var progUntil=0;
  function keepInView(el,inset,topEl){
    var r=el.getBoundingClientRect(),top=topEl?topEl.getBoundingClientRect().top:r.top,go=RA.motion?'smooth':'auto',over=r.bottom-(innerHeight-bar()-10-(inset||0));
    if(top<72){progUntil=performance.now()+700;scrollBy({top:top-72,behavior:go})}
    else if(over>0){progUntil=performance.now()+700;scrollBy({top:Math.min(over,top-72),behavior:go})}
  }
  function stickH(){var s=box.querySelector('.s-stick');return sheet.classList.contains('complete')&&getComputedStyle(s).position==='sticky'?s.offsetHeight:0}
  function advance(viaKey,noScroll){
    clearTimeout(reT);reT=0;
    /* 收合會把選到的那顆 radio 藏起來，焦點要先記 */
    var had=ql.contains(document.activeElement);
    opened=firstOpen();
    qs.forEach(function(q){q.classList.remove('kb')});
    layout();RA.relayout();
    if(opened){
      var f=opened.querySelector('input');
      if(f&&(viaKey||had))f.focus({preventScroll:true});
      if(!noScroll)keepInView(opened);
    }else{
      var ti=document.getElementById('qSheetT'),go=RA.motion?'smooth':'auto';
      if(viaKey||had)ti.focus({preventScroll:true});
      if(noScroll)return;
      /* 全部答完：上下堆疊時把單子帶到眼前；左右分欄時確保標題在畫面內 */
      if(sheet.getBoundingClientRect().left<box.getBoundingClientRect().left+40)sheet.scrollIntoView({block:'start',behavior:go});
      else sheet.scrollIntoView({block:'nearest',behavior:go});
      var t=sheet.getBoundingClientRect().top;if(t>=innerHeight||t<72)scrollBy({top:t-84,behavior:go});
    }
  }
  /* 答完到往下那段等待裡，人自己捲走或按了導覽，就不再把畫面拉回來 */
  var moved=false,yAns=0,trustY=true;
  function userMoved(){if(reT)moved=true}
  addEventListener('wheel',userMoved,{passive:true});
  addEventListener('touchmove',userMoved,{passive:true});
  addEventListener('hashchange',userMoved);
  /* 方向鍵與空白鍵的 click 要等「下一題」；滑鼠、手指點了就往下。WebKit 的 detail 不可靠，自己記 */
  box.addEventListener('keydown',function(){keyed=true},true);
  box.addEventListener('pointerdown',function(){keyed=false},true);
  box.addEventListener('click',function(e){
    var t=e.target;
    if(t.matches('input[type=radio]')){
      var q=t.closest('.q'),k=qk(q),had=ans[k],viaKey=keyed;
      ans[k]=t.value;
      /* 改成看別人的報價：不適用的題目清掉 */
      if(k==='what'&&t.value==='check')['size','after'].forEach(function(x){delete ans[x];$$('input[name="q-'+x+'"]',box).forEach(function(i){i.checked=false});box.querySelector('.q[data-q="'+x+'"] .q-said').textContent=''});
      q.querySelector('.q-said').textContent=sayFor(t.value);
      /* 換了「要做什麼」，規模那句可能要跟著換 */
      if(k==='what'&&ans.size)box.querySelector('.q[data-q="size"] .q-said').textContent=sayFor(ans.size);
      var wd=wasDone;
      render();clearRes();
      var r=active().filter(function(x){return !ans[qk(x)]}).length;
      say.textContent=sayFor(t.value)+(r?'還有 '+r+' 題。':'寫好了，這張單子可以傳給我了。');
      doneSay.textContent=r?'':'寫好了，傳給我。確認範圍後才報價。';
      /* 剛好答完那一下由蓋章接手，不再蓋掉它 */
      if((!had||had!==t.value)&&(r||wd))answerFx();
      /* 滑鼠或手指點了就往下一題；方向鍵只是換選項，要按「下一題」才走，鍵盤才選得到別的選項 */
      if(viaKey){q.classList.add('kb');layout();RA.relayout();return}
      layout();
      moved=false;yAns=scrollY;trustY=performance.now()>progUntil;
      /* 最後一題多留一拍，湧起來的波看得到才往下 */
      clearTimeout(reT);reT=setTimeout(function(){advance(false,moved||(trustY&&Math.abs(scrollY-yAns)>40))},RA.motion?(had?360:r?620:1000):180);
      return;
    }
    var ch=t.closest('.q-ch');
    if(ch){
      clearTimeout(reT);reT=0;opened=ch.closest('.q');
      qs.forEach(function(x){x.classList.remove('kb')});opened.classList.add('kb');
      layout();RA.relayout();
      var i=opened.querySelector('input:checked')||opened.querySelector('input');if(i)i.focus({preventScroll:true});
      keepInView(opened);
      return;
    }
    if(t.closest('.q-next'))advance(true);
  });
  document.getElementById('qReset').addEventListener('click',function(){
    clearTimeout(reT);reT=0;ans={};seen={};$$('input[type=radio]',box).forEach(function(i){i.checked=false});
    $$('.q-said',box).forEach(function(p){p.textContent=''});
    opened=qs[0];say.textContent='';doneSay.textContent='';qs.forEach(function(q){q.classList.remove('kb')});layout();
    /* 全部重選連小球一起清；清小球會順便重畫單子 */
    if(RA.needs)RA.needs.clear();else render();
    clearRes();
    qs[0].querySelector('input').focus({preventScroll:true});
    qs[0].scrollIntoView({block:'nearest'});
  });

  /* 複製：先 clipboard，不行再 execCommand，再不行把文字攤開讓人手動選 */
  function fine(){return matchMedia('(hover:hover) and (pointer:fine)').matches}
  function clearRes(){clearTimeout(goT);res.textContent='';txt.hidden=true;lnk.hidden=true;btn.textContent=sheet.classList.contains('complete')?BT1:BT0}
  function legacyCopy(s){
    var ok=false,a=document.createElement('textarea');a.value=s;a.setAttribute('readonly','');a.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:0';
    document.body.appendChild(a);a.select();a.setSelectionRange(0,s.length);try{ok=document.execCommand('copy')}catch(e){}
    document.body.removeChild(a);btn.focus({preventScroll:true});return ok;
  }
  function failed(s){
    clearRes();res.textContent=fine()?'沒辦法自動複製。下面的文字已選取，按 Ctrl+C（Mac 是 ⌘C）複製，再打開 LINE 貼上。':'沒辦法自動複製。請長按下面的文字全選、複製，再打開 LINE 貼上。';
    txt.value=s;txt.hidden=false;lnk.hidden=false;RA.relayout();
    txt.focus({preventScroll:true});txt.select();
    keepInView(txt);
  }
  function copied(){
    btn.textContent='已複製';lnk.hidden=false;RA.relayout();
    if(fine()&&innerWidth>=768){
      res.textContent='已複製。接著加我的 LINE，在對話框貼上、送出。';
      RA.openLine(true);
      return;
    }
    res.textContent='已複製。加好友後，在對話框長按貼上、送出。';
    keepInView(lnk,stickH(),res);
    /* 連按只開一次 */
    clearTimeout(goT);goT=setTimeout(function(){window.open(lnk.href,'_blank','noopener')},700);
  }
  btn.addEventListener('click',function(){
    var s=sheetText();
    function fb(){if(legacyCopy(s))copied();else failed(s)}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(s).then(copied,fb);else fb();
  });

  /* 從別的頁面回來：瀏覽器可能把勾選還原，跟 ans 對不上就以 ans 為準 */
  addEventListener('pageshow',function(e){
    if(e.persisted)return;
    var dirty=false;
    $$('input[type=radio]',box).forEach(function(i){var w=ans[i.name.slice(2)]===i.value;if(i.checked!==w){i.checked=w;dirty=true}});
    if(dirty){layout();render()}
  });

  opened=qs[0];layout();render();
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
