/* =========================================================
   RAW AIR — 互動與動畫
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 可以改的設定 ---------- */
  const CONFIG = {
    email: '',            // 填上 Email 後，聯絡區會多一顆「寫信給我」按鈕
    line: '',             // 填上 LINE ID 或 lin.ee 連結，會多一顆 LINE 按鈕
    autoCycleConcept: true // 概念圖區沒人點的時候自動輪播
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 平滑捲動 ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: -70, duration: 1.4 });
    else target.scrollIntoView({ behavior: 'smooth' });
  };
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const t = id === '#top' ? document.body : $(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollTo(id === '#top' ? 0 : t);
    });
  });

  /* ---------- 文字拆字 ---------- */
  function splitChars(el) {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of n.textContent) {
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = ch === ' ' ? ' ' : ch;
            frag.appendChild(s);
          }
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    $$('.ch', el).forEach((c, i) => (c.style.transitionDelay = `${i * 28}ms`));
  }
  $$('[data-split]').forEach(splitChars);

  /* ---------- 載入畫面 ---------- */
  const loader = $('#loader');
  const heroIntro = () => {
    $$('#hero [data-split]').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 80 + i * 160));
    $$('#hero .reveal').forEach((el, i) => setTimeout(() => el.classList.add('is-in'), 500 + i * 140));
    $('#nav').style.opacity = '1';
  };
  $('#nav').style.opacity = '0';
  $('#nav').style.transition = 'opacity .8s ease, transform .6s cubic-bezier(.16,1,.3,1), background .4s, backdrop-filter .4s';

  if (reduced) {
    loader.remove();
    heroIntro();
  } else {
    document.body.classList.add('is-locked');
    const num = { v: 0 };
    const tl = gsap.timeline({
      onComplete() {
        loader.remove();
        document.body.classList.remove('is-locked');
      }
    });
    tl.to(num, {
      v: 100, duration: 1.7, ease: 'power3.inOut',
      onUpdate() {
        $('#loaderNum').textContent = Math.round(num.v);
        $('#loaderBar').style.width = num.v + '%';
      }
    })
      .to('.loader__inner', { opacity: 0, y: -20, duration: .45, ease: 'power2.in' }, '-=.1')
      .to('.loader__panel', { yPercent: -100, duration: .9, ease: 'expo.inOut', stagger: .08, onStart: heroIntro }, '-=.2');
  }

  /* ---------- 導覽列 ---------- */
  const nav = $('#nav');
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 300 && !menu.classList.contains('is-open'));
    lastY = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  const tick = () => {
    const d = new Date();
    const t = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei' }).format(d);
    $('#clock').textContent = t;
  };
  tick(); setInterval(tick, 15000);
  $('#year').textContent = new Date().getFullYear();

  const menu = $('#menu'), burger = $('#burger');
  function closeMenu() {
    menu.classList.remove('is-open'); burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start(); document.body.classList.remove('is-locked');
  }
  burger.addEventListener('click', () => {
    const open = !menu.classList.contains('is-open');
    if (!open) return closeMenu();
    menu.classList.add('is-open'); burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true'); menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop(); document.body.classList.add('is-locked');
  });

  /* ---------- 游標 + 磁吸 ---------- */
  const cursor = $('#cursor');
  if (!isTouch && !reduced) {
    const dotX = gsap.quickTo(cursor, 'x', { duration: .12, ease: 'power3' });
    const dotY = gsap.quickTo(cursor, 'y', { duration: .12, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { dotX(e.clientX); dotY(e.clientY); cursor.classList.add('is-on'); }, { passive: true });
    $$('[data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => { cursor.classList.add('is-view'); $('.cursor__label').textContent = el.dataset.cursor; });
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-view'));
    });
    $$('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-link'));
    });
    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'elastic.out(1,.5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'elastic.out(1,.5)' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .28);
        yTo((e.clientY - r.top - r.height / 2) * .28);
      });
      el.addEventListener('mouseleave', () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- 進場 ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal:not(#hero .reveal), [data-split]:not(#hero [data-split])').forEach((el) => io.observe(el));

  /* ---------- 宣言：逐字亮起 ---------- */
  const mani = $('[data-words]');
  if (mani) {
    const text = mani.textContent;
    mani.innerHTML = Array.from(text).map((c) => `<span class="w">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    const words = $$('.w', mani);
    if (reduced) words.forEach((w) => (w.style.opacity = 1));
    else gsap.to(words, {
      opacity: 1, ease: 'none', stagger: .06,
      scrollTrigger: { trigger: mani, start: 'top 75%', end: 'bottom 45%', scrub: .6 }
    });
  }

  /* ---------- 數字跑動 ---------- */
  const countUp = (el) => {
    const end = +el.dataset.count;
    const fmt = (n) => Math.round(n).toLocaleString('en-US');
    if (reduced) { el.textContent = fmt(end); return; }
    const o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.8, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  };
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
  }, { threshold: .5 });
  $$('[data-count]:not([data-count-play])').forEach((el) => cio.observe(el));

  /* ---------- 跑馬燈 ---------- */
  const track = $('.marquee__track');
  if (track && !reduced) {
    const w = track.scrollWidth / 2;
    const mq = gsap.to(track, { x: -w, duration: 28, ease: 'none', repeat: -1 });
    let vel = 0;
    ScrollTrigger.create({
      onUpdate(self) { vel = self.getVelocity(); gsap.to(mq, { timeScale: 1 + Math.min(Math.abs(vel) / 600, 3), duration: .4, overwrite: true }); }
    });
  }

  /* ---------- 作品：進場播放 + 視差 ---------- */
  $$('.work').forEach((w) => {
    ScrollTrigger.create({
      trigger: w, start: 'top 70%', once: true,
      onEnter() {
        w.classList.add('play');
        $$('.mk-dash__bars i', w).forEach((b, i) => b.style.setProperty('--i', i));
        $$('[data-count-play]', w).forEach(countUp);
      }
    });
    const v = $('.work__visual', w);
    if (v && !reduced) gsap.fromTo(v, { yPercent: -(+v.dataset.parallax || 6) }, {
      yPercent: +v.dataset.parallax || 6, ease: 'none',
      scrollTrigger: { trigger: w, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  /* ---------- 概念圖實驗室 ---------- */
  const IDEAS = [
    {
      notes: ['手機優先，單手就能操作', '一鍵記一筆，三秒完成', '月報表自動產生，不用手算', '資料存在手機裡，不用註冊帳號'],
      html: `<div class="cm cm-phone"><div class="cm-phone__dev">
        <div class="b b--bar">9:41</div>
        <div class="b b--balance"><small>本月還能花</small><strong>NT$ 18,240</strong></div>
        <div class="b-row"><div class="b b--chip">餐飲</div><div class="b b--chip">交通</div><div class="b b--chip">娛樂</div></div>
        <div class="b b--item"><i></i><span>午餐 便當</span><b>-120</b></div>
        <div class="b b--item"><i></i><span>捷運</span><b>-35</b></div>
        <div class="b b--item"><i></i><span>薪水入帳</span><b class="up">+48,000</b></div>
        <div class="b b--fab">＋</div>
        <div class="b b--tabs"><i></i><i></i><i></i><i></i></div>
      </div></div>`
    },
    {
      notes: ['斜線指令：/排班 /抽獎 /公告', '按鈕面板，成員不用打字', '管理員功能只有管理員看得到', '24 小時掛在雲端，不用開電腦'],
      html: `<div class="cm cm-chat">
        <div class="b b--side"><i></i><i></i><i></i><i></i></div>
        <div class="cm-chat__main">
          <div class="b b--msg"><i></i><span>/排班 本週</span></div>
          <div class="b b--bot"><i></i><div><span>本週排班表</span><div class="b-row"><em>一 小明</em><em>二 阿華</em><em>三 小美</em></div><div class="b-row"><b class="b b--btn">我要換班</b><b class="b b--btn ghost">看全部</b></div></div></div>
          <div class="b b--msg"><i></i><span>/抽獎 3 名</span></div>
          <div class="b b--bot"><i></i><div><span>中獎：阿華、小美、阿明</span></div></div>
          <div class="b b--input">輸入訊息…</div>
        </div>
      </div>`
    },
    {
      notes: ['首頁 5 秒講清楚你是誰', '作品和照片用大圖說話', '手機打開一樣好看', '一鍵聯絡：LINE、電話、地圖'],
      html: `<div class="cm cm-web">
        <div class="b b--nav"><i class="logo"></i><span></span><span></span><span></span><b class="b b--btn">聯絡</b></div>
        <div class="b b--hero x"><strong>好咖啡，<br>不用等。</strong><em>台北東區 · 自家烘焙 · 每日現烤</em><b class="b b--btn">看菜單</b></div>
        <div class="b-row"><div class="b b--card x"></div><div class="b b--card x"></div><div class="b b--card x"></div></div>
        <div class="b b--foot"><span>LINE</span><span>電話</span><span>地圖</span></div>
      </div>`
    },
    {
      notes: ['欄位跟你的 Excel 一模一樣，不用重學', '自動加總，不會再算錯', '一鍵列印、存 PDF', '舊資料一次匯入，不用重打'],
      html: `<div class="cm cm-dash">
        <div class="b b--side"><i></i><i></i><i></i><i></i><i></i></div>
        <div class="cm-dash__main">
          <div class="b-row"><div class="b b--kpi"><small>本月進貨</small><b>712,379</b></div><div class="b b--kpi"><small>本月售出</small><b>934,120</b></div><div class="b b--kpi up"><small>毛利</small><b>+221,741</b></div></div>
          <div class="b b--table">
            <div class="tr th"><span>日期</span><span>品項</span><span>數量</span><span>金額</span></div>
            <div class="tr"><span>08/28</span><span>紅肉火龍果 600</span><span>320 斤</span><span>19,200</span></div>
            <div class="tr"><span>08/28</span><span>紅肉火龍果 500</span><span>410 斤</span><span>20,500</span></div>
            <div class="tr"><span>08/29</span><span>白肉火龍果 B級</span><span>180 斤</span><span>5,400</span></div>
            <div class="tr"><span>08/30</span><span>紅肉火龍果 400</span><span>260 斤</span><span>10,400</span></div>
          </div>
          <div class="b-row"><b class="b b--btn">列印</b><b class="b b--btn ghost">存 PDF</b><b class="b b--btn ghost">匯入 Excel</b></div>
        </div>
      </div>`
    }
  ];
  const canvas = $('#canvas'), notesEl = $('#notes'), phase = $('.concept__phase'), phaseLabel = $('#phaseLabel');
  let conceptTl = null, noteTimer = null, cycleTimer = null, current = -1;

  function typeNotes(list) {
    clearTimeout(noteTimer);
    notesEl.innerHTML = '';
    let li = 0;
    const next = () => {
      if (li >= list.length) return;
      const item = document.createElement('li');
      notesEl.appendChild(item);
      const text = list[li];
      let ci = 0;
      const cur = document.createElement('i'); cur.className = 'cur';
      item.appendChild(cur);
      const step = () => {
        if (ci < text.length) {
          cur.before(document.createTextNode(text[ci++]));
          noteTimer = setTimeout(step, reduced ? 0 : 28);
        } else {
          cur.remove(); item.classList.add('done'); li++;
          noteTimer = setTimeout(next, reduced ? 0 : 260);
        }
      };
      step();
    };
    next();
  }

  function showIdea(idx, fromUser) {
    if (idx === current) return;
    current = idx;
    $$('.idea').forEach((b, i) => { b.classList.toggle('is-active', i === idx); b.setAttribute('aria-selected', i === idx); });
    if (conceptTl) conceptTl.kill();
    const old = canvas.firstElementChild;
    const mount = () => {
      canvas.innerHTML = IDEAS[idx].html;
      const cm = canvas.firstElementChild;
      const blocks = $$('.b', cm);
      phase.classList.remove('hifi'); phaseLabel.textContent = '線稿';
      typeNotes(IDEAS[idx].notes);
      if (reduced) { blocks.forEach((b) => (b.style.opacity = 1)); cm.classList.add('hifi'); phase.classList.add('hifi'); phaseLabel.textContent = '彩稿'; return; }
      conceptTl = gsap.timeline();
      conceptTl.fromTo(blocks, { opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: .55, ease: 'power3.out', stagger: .09 })
        .add(() => { cm.classList.add('hifi'); phase.classList.add('hifi'); phaseLabel.textContent = '彩稿'; }, '+=.55')
        .fromTo(cm, { y: 0 }, { y: -4, duration: .6, ease: 'power2.out' }, '<');
    };
    if (old && !reduced) gsap.to(old, { opacity: 0, y: 12, duration: .3, ease: 'power2.in', onComplete: mount });
    else mount();
    if (fromUser) { clearInterval(cycleTimer); cycleTimer = null; }
  }
  $$('.idea').forEach((b) => b.addEventListener('click', () => showIdea(+b.dataset.idea, true)));
  ScrollTrigger.create({
    trigger: '#concept', start: 'top 70%', once: true,
    onEnter() {
      showIdea(0);
      if (CONFIG.autoCycleConcept && !reduced) cycleTimer = setInterval(() => showIdea((current + 1) % IDEAS.length), 7500);
    }
  });

  /* ---------- 能做的事：聚光 + 傾斜 ---------- */
  $$('[data-tilt]').forEach((tile) => {
    if (isTouch) return;
    tile.addEventListener('mousemove', (e) => {
      const r = tile.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tile.style.setProperty('--mx', `${px * 100}%`); tile.style.setProperty('--my', `${py * 100}%`);
      if (!reduced) { tile.style.setProperty('--ry', `${(px - .5) * 6}deg`); tile.style.setProperty('--rx', `${(.5 - py) * 6}deg`); }
    });
    tile.addEventListener('mouseleave', () => { tile.style.setProperty('--ry', '0deg'); tile.style.setProperty('--rx', '0deg'); });
  });

  /* ---------- 流程：橫向捲動 ---------- */
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': () => {
      if (reduced) return;
      const trackEl = $('#ptrack');
      const dist = () => trackEl.scrollWidth - window.innerWidth;
      gsap.to(trackEl, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.process__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
      });
    }
  });

  /* ---------- 聯絡按鈕 ---------- */
  const actions = $('#contactActions');
  if (CONFIG.email) {
    const a = document.createElement('a');
    a.className = 'contact__email'; a.href = 'mailto:' + CONFIG.email;
    a.innerHTML = `${CONFIG.email}<small>EMAIL</small>`;
    actions.prepend(a);
  }
  if (CONFIG.line) {
    const a = document.createElement('a');
    a.className = 'btn btn--lg'; a.target = '_blank'; a.rel = 'noopener';
    a.href = CONFIG.line.startsWith('http') ? CONFIG.line : 'https://line.me/ti/p/~' + CONFIG.line;
    a.textContent = 'LINE';
    actions.appendChild(a);
  }

  /* ---------- HERO：WebGL 流體光 ---------- */
  (function hero() {
    const cv = $('#gl');
    const gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!gl) return;
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = `precision highp float;
uniform vec2 u_res;uniform float u_t;uniform vec2 u_m;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);
 for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*u_res)/u_res.y;
 float t=u_t*.07;
 vec2 m=(u_m-.5)*vec2(u_res.x/u_res.y,1.);
 vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(5.2,1.3)-t*.7));
 vec2 r=vec2(fbm(uv+2.*q+vec2(1.7,9.2)+t*.5+m*.25),fbm(uv+2.*q+vec2(8.3,2.8)-t*.4));
 float f=fbm(uv+2.4*r);
 vec3 c0=vec3(.035,.035,.055);
 vec3 c1=vec3(.30,.20,.85);
 vec3 c2=vec3(1.,.42,.21);
 vec3 c3=vec3(.22,.80,.72);
 vec3 col=mix(c0,c1,smoothstep(.25,.85,f));
 col=mix(col,c2,smoothstep(.45,.95,length(q))*.65);
 col=mix(col,c3,smoothstep(.55,1.,r.y)*.3);
 float d=length(uv-m*.6);
 col*=1.-smoothstep(.15,1.5,d)*.75;
 col*=.5+.5*f;
 col+=(hash(gl_FragCoord.xy+u_t)-.5)*.03;
 gl_FragColor=vec4(col,1.);
}`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, 'u_res'), uT = gl.getUniformLocation(prog, 'u_t'), uM = gl.getUniformLocation(prog, 'u_m');
    const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (window.innerWidth < 700 ? .5 : .6);
    const resize = () => { cv.width = Math.floor(cv.clientWidth * scale); cv.height = Math.floor(cv.clientHeight * scale); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uRes, cv.width, cv.height); };
    resize(); window.addEventListener('resize', resize);
    const m = { x: .5, y: .5, tx: .5, ty: .5 };
    window.addEventListener('mousemove', (e) => { m.tx = e.clientX / window.innerWidth; m.ty = 1 - e.clientY / window.innerHeight; }, { passive: true });
    let visible = true, t0 = performance.now();
    new IntersectionObserver((en) => (visible = en[0].isIntersecting)).observe(cv);
    const frame = (now) => {
      requestAnimationFrame(frame);
      if (!visible) return;
      m.x += (m.tx - m.x) * .04; m.y += (m.ty - m.y) * .04;
      gl.uniform1f(uT, reduced ? 0 : (now - t0) / 1000); gl.uniform2f(uM, m.x, m.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    requestAnimationFrame(frame);
  })();

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
