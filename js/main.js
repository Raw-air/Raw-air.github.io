/* =========================================================
   RAW AIR — 互動與動畫
   ========================================================= */
(() => {
  'use strict';

  /* ---------- 可以改的設定 ---------- */
  const CONFIG = {
    email: '',            // 填上 Email 後，聯絡區會多一顆「寫信給我」按鈕
    line: '16225113',     // 填上 LINE ID 或 lin.ee 連結，會多一顆 LINE 按鈕
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

  /* ---------- 完整能力清單 ----------
     要加減項目就改這裡：每項是 [名稱, 一句白話說明]。數字會自動算。 */
  const CAPS = [
    { id: 'web', name: '網站與網頁', en: 'Web', blurb: '從一頁式形象網站，到有會員、有後台的網頁系統。手機電腦都好看。', items: [
      ['品牌形象網站', '公司、店家、個人品牌的門面，手機打開一樣專業。'],
      ['活動頁 / 銷售頁', '一頁講清楚賣什麼，按鈕直接導到購買或 LINE。'],
      ['作品集網站', '像這個網站：動畫、互動、分享到社群有預覽圖。'],
      ['網頁應用（React / Next.js / Vue）', '有表單、有登入、會算東西的「會動的網站」。'],
      ['後台管理介面', '給內部人員管訂單、商品、會員、內容。'],
      ['預約 / 報名系統', '選時段、填資料、自動寄確認信。'],
      ['多語系網站', '中文、英文、日文一鍵切換。'],
      ['SEO 基礎優化', '標題、描述、網站地圖、結構化資料，讓 Google 讀得懂你。'],
      ['網站速度優化', '圖片壓縮、延遲載入，附優化前後的量測分數。'],
      ['無障礙調整', '鍵盤可操作、螢幕報讀軟體讀得出來、顏色對比足夠。'],
      ['舊網站翻新', '內容保留，換成現代、手機友善的版面。'],
      ['WordPress 客製與修復', '外掛衝突、版面跑掉、網站被植入惡意程式後的清理。']
    ] },
    { id: 'backend', name: '後端・資料庫・金流', en: 'Backend', blurb: '看不到但最重要的部分：資料存哪、誰能看、錢怎麼收。', items: [
      ['API 開發', '讓網站、App、別的系統互相拿資料。'],
      ['會員登入與權限', 'Email、Google、LINE 登入；誰能看什麼、改什麼。'],
      ['資料庫設計', 'PostgreSQL、MySQL、SQLite、Firebase、Supabase，依規模挑。'],
      ['金流串接', '綠界、藍新、Stripe，付款成功自動開單、寄通知。'],
      ['第三方服務串接', '電子發票、物流、地圖、簡訊，依對方提供的 API 接上。'],
      ['Webhook 系統串接', 'A 系統發生事情，B 系統自動跟著動。'],
      ['檔案上傳與圖片處理', '自動縮圖、加浮水印、存到雲端。'],
      ['即時功能', '聊天室、即時通知、線上人數，不用重新整理。'],
      ['排程任務', '每天幾點自動結帳、寄報表、清理舊資料。'],
      ['資料搬家', '舊系統資料轉進新資料庫，筆數逐一核對。']
    ] },
    { id: 'app', name: '手機 App', en: 'Mobile', blurb: '新開發、修 bug、送審上架。沒有 Mac 也能用雲端編譯 iOS。', items: [
      ['iOS App 開發', 'Swift / SwiftUI 原生開發。'],
      ['Android App 開發', 'Kotlin 原生開發。'],
      ['跨平台 App', 'Flutter / React Native，一份程式同時出 iOS 和 Android。'],
      ['App 當機與 bug 修復', '看錯誤紀錄找根因，不是只把錯誤藏起來。'],
      ['手機硬體功能', '相機、定位、藍牙、推播通知、掃描條碼。'],
      ['訂閱與內購', 'Apple StoreKit、Google Play 帳單，方案與價格對齊後台。'],
      ['上架設定與送審', '權限說明、隱私標籤、被退件的原因處理。'],
      ['雲端編譯與自動打包', '用 GitHub Actions 在雲端 Mac 編譯，每次改完自動檢查。'],
      ['網站變 App（PWA）', '可以加到手機主畫面、離線也能開。']
    ] },
    { id: 'ai', name: 'AI 應用與機器人', en: 'AI & Bots', blurb: '把 AI 放進你的工作流程：自動回客人、讀文件、查資料、做研究。', items: [
      ['AI 客服機器人', '讀你的常見問題和產品資料來回答客人，答不出來轉真人。'],
      ['企業知識庫問答（RAG）', '手冊、規章、合約丟進去，用問的就找到答案。RAG＝先找資料再回答，比較不會亂講。'],
      ['Discord 機器人', '斜線指令、按鈕面板、身分組、排程公告、抽獎。'],
      ['LINE 官方帳號機器人', '自動回覆、預約、查詢訂單、分眾推播。'],
      ['Telegram / Slack 機器人', '團隊通知、指令查詢、流程審核。'],
      ['文件自動摘要與分類', '大量 PDF、Email、表單，自動整理成重點。'],
      ['AI 欄位擷取', '從發票、名片、報價單照片抓出需要的欄位，轉成表格。'],
      ['多 AI 協作流程', '一個負責研究、一個負責查核，像作品裡的台股禿鷹。'],
      ['串接 Claude / OpenAI API', '把 AI 功能加進你現有的網站或系統。'],
      ['MCP 工具開發', '讓 AI 助手能直接查你的資料、操作你的系統。MCP＝讓 AI 呼叫外部工具的標準。'],
      ['提示詞與 AI 流程優化', '回答更穩定、格式固定、API 費用更低。']
    ] },
    { id: 'auto', name: '自動化與資料擷取', en: 'Automation', blurb: '每天重複在做的事，寫成程式讓它自己跑。', items: [
      ['Excel / Google 試算表自動化', '複雜公式、巨集、Apps Script，按一下就整理好。'],
      ['公開資料定時擷取', '政府開放資料、公開網頁資訊定時抓取，遵守網站規範。'],
      ['瀏覽器自動化', '重複點網頁、填表、下載報表，交給程式做。'],
      ['定時通知', '價格變動、庫存不足、新訂單，自動發 LINE / Discord / Email。'],
      ['檔案批次處理', '上千個檔案一次改名、轉檔、壓縮、分資料夾。'],
      ['Email 自動化', '自動分類信件、依內容產生回覆草稿、定時寄報表。'],
      ['表單串接', 'Google 表單送出後，自動建檔、通知、開單。'],
      ['工作流程平台', 'n8n、Zapier、Make，把各種服務串在一起。'],
      ['電腦重複工作腳本', 'Windows / Mac 上一鍵完成的小腳本。']
    ] },
    { id: 'data', name: '資料・報表・文件檔', en: 'Data', blurb: '資料亂、報表手做、單據手打？整理成一鍵產出。', items: [
      ['Excel 變系統', '欄位跟原本一樣，但自動加總、自動防錯。'],
      ['資料清理', '重複資料、格式不一、欄位錯位，一次整理乾淨。'],
      ['儀表板', '營收、庫存、流量，一頁看完。'],
      ['圖表與資料視覺化', '把數字變成一眼看懂的圖。'],
      ['自動產生 PDF 單據', '報價單、出貨單、對帳單，資料填好直接印。'],
      ['Word / Excel / PPT 自動產生', '固定格式的文件，由程式批次產出。'],
      ['統計分析報告', '附圖表和白話結論，不是只丟一堆數字。'],
      ['PDF 處理', '合併、拆頁、抽表格、掃描檔轉文字（OCR）。'],
      ['財經與股市資料整理', '只做資料蒐集與分析工具，不提供投資建議。']
    ] },
    { id: 'legacy', name: '接手舊專案與修復', en: 'Rescue', blurb: '前一個工程師不見了、程式沒人看得懂、一改就壞？從這裡接。', items: [
      ['讀懂沒文件的程式', '整理成架構圖和說明，讓你知道手上有什麼。'],
      ['找 bug 根因', '不只止血，說清楚為什麼壞、怎麼避免再壞。'],
      ['爛尾專案接手', '先健檢，評估修還是重寫比較划算。'],
      ['套件與框架升級', '版本太舊不支援、有已知漏洞，安全地升上去。'],
      ['重構', '功能不變，程式變得好改、好維護。'],
      ['改寫到新技術', '例如 jQuery 換 React、PHP 換 Node。'],
      ['效能問題', '頁面慢、資料庫查詢慢、記憶體爆掉。'],
      ['編譯不過 / 跑不起來', '環境設定、相依套件衝突、建置錯誤。']
    ] },
    { id: 'quality', name: '測試・資安・程式品質', en: 'Quality', blurb: '外包交回來的東西能不能信？上線前先檢查。', items: [
      ['程式碼審查', '幫你看別人寫的程式：品質、隱憂、該先修什麼。'],
      ['安全檢查', '後門、可疑對外連線、明文密碼、藏在建置流程裡的腳本。'],
      ['套件漏洞檢查', '用到的第三方套件有沒有已知漏洞。'],
      ['自動化測試', '單元測試、端對端測試，改東西不怕改壞別的。'],
      ['自動檢查流程（CI）', '每次改程式自動跑測試、檢查格式。'],
      ['常見網站漏洞修補', 'SQL 注入、XSS、權限漏洞這類 OWASP 常見問題。'],
      ['付款前加密試用', '系統加密放上網，拿金鑰才能試用，可隨時停權。'],
      ['版本控制整理', 'Git 分支、紀錄、還原點，出事能退回上一版。']
    ] },
    { id: 'devops', name: '部署・雲端・維運', en: 'DevOps', blurb: '做好之後要放上網、要一直開著、壞了要知道。', items: [
      ['網站上線', 'GitHub Pages、Vercel、Netlify、Cloudflare Pages。'],
      ['雲端主機部署', 'VPS、AWS、GCP，依預算挑。'],
      ['Docker 容器化', '換一台機器也能一鍵跑起來。'],
      ['自動部署', '程式推上去就自動上線，不用手動搬檔案。'],
      ['網域與 HTTPS', '買網域、設定 DNS、掛上安全憑證。'],
      ['機器人 24 小時運行', '部署到雲端，不用開著自己的電腦。'],
      ['備份與監控', '服務掛掉會通知，資料定期自動備份。'],
      ['雲端費用檢查', '看帳單找浪費，同樣效果每月少花一點。']
    ] },
    { id: 'design', name: '設計・原型・簡報', en: 'Design', blurb: '還說不清楚要什麼的時候，先畫出來。', items: [
      ['概念圖與線稿', '聊完一兩天內，先看到畫面長怎樣。'],
      ['可點擊原型', '不用寫完整程式，就能實際點點看流程。'],
      ['UI 介面設計', '顏色、字體、按鈕規範統一，之後擴充不會亂。'],
      ['品牌視覺方向', 'Logo 方向、主色、字體搭配建議。'],
      ['社群圖與 Banner', '貼文圖、廣告圖、網站主視覺。'],
      ['使用體驗健檢', '看你的網站或 App 哪裡讓人卡住、流失。'],
      ['簡報製作', '提案、募資、產品介紹簡報。'],
      ['圖示設計', '一致風格的 SVG 圖示組。']
    ] },
    { id: 'tools', name: '小工具與擴充功能', en: 'Tools', blurb: '不用做成大系統，一個剛好的小工具就解決。', items: [
      ['Chrome 擴充功能', '在你常用的網頁上加按鈕、自動填資料、整理畫面。'],
      ['命令列工具', '給技術團隊用的指令工具。'],
      ['VS Code 擴充功能', '給工程師團隊的編輯器小幫手。'],
      ['桌面小工具', 'Windows / Mac 上的小程式。'],
      ['Google Apps Script 工具', 'Gmail、雲端硬碟、日曆之間的自動化。'],
      ['內部小網頁工具', '報價計算機、單位換算、查詢頁，開瀏覽器就能用。']
    ] },
    { id: 'docs', name: '文件與技術顧問', en: 'Consulting', blurb: '還沒要開發，但想先搞清楚方向、預算、別人報價合不合理。', items: [
      ['需求規格書', '把聊天內容整理成可以報價、可以驗收的文件。'],
      ['系統架構圖與流程圖', '一張圖看懂系統怎麼串。'],
      ['操作手冊', '給不懂技術的同事看的圖文教學。'],
      ['API 文件', '給串接的工程師看的規格。'],
      ['交接文件', '換人維護時不用從頭摸索。'],
      ['版本更新公告', '把改了什麼寫成使用者看得懂的話。'],
      ['技術選型建議', '該用什麼技術、之後每月維運要花多少。'],
      ['外包報價健檢', '別人給的報價和範圍合不合理，幫你看一次。']
    ] }
  ];

  const capTotal = CAPS.reduce((n, c) => n + c.items.length, 0);
  $$('.js-cap-count').forEach((el) => (el.textContent = capTotal));
  $$('.js-cat-count').forEach((el) => (el.textContent = CAPS.length));
  $$('.js-cap-stat').forEach((el) => (el.dataset.count = capTotal));

  const capCats = $('#capCats'), capList = $('#capList'), capSearch = $('#capSearch');
  const capTitle = $('#capTitle'), capEn = $('#capEn'), capBlurb = $('#capBlurb');
  let capCurrent = CAPS[0].id, refreshTimer = null;
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const softRefresh = () => { clearTimeout(refreshTimer); refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 250); };

  capCats.innerHTML = CAPS.map((c, i) =>
    `<button class="cat" role="tab" data-cat="${c.id}" aria-selected="false"><em>${String(i + 1).padStart(2, '0')}</em><span>${c.name}</span><b>${c.items.length}</b></button>`
  ).join('');

  function renderItems(rows) {
    capList.innerHTML = rows.map(([t, d, tag], i) =>
      `<li class="cap"><span class="cap__n">${String(i + 1).padStart(2, '0')}</span><div><h4>${esc(t)}</h4><p>${esc(d)}</p>${tag ? `<small>${esc(tag)}</small>` : ''}</div></li>`
    ).join('');
    if (!reduced) gsap.fromTo($$('.cap', capList), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, ease: 'power3.out', stagger: .025, overwrite: true });
    softRefresh();
  }

  function selectCat(id) {
    capCurrent = id;
    const c = CAPS.find((x) => x.id === id);
    $$('.cat', capCats).forEach((b) => { const on = b.dataset.cat === id; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    capEn.textContent = c.en; capTitle.textContent = c.name; capBlurb.textContent = c.blurb;
    renderItems(c.items);
  }

  function searchCaps(q) {
    const raw = q.trim(); q = raw.toLowerCase();
    if (!q) return selectCat(capCurrent);
    const hits = [];
    CAPS.forEach((c) => c.items.forEach(([t, d]) => { if ((t + d + c.name).toLowerCase().includes(q)) hits.push([t, d, c.name]); }));
    $$('.cat', capCats).forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
    capEn.textContent = 'Search'; capTitle.textContent = `「${raw}」找到 ${hits.length} 項`;
    capBlurb.textContent = hits.length ? '點左邊分類可以回到完整清單。' : '清單裡沒有，但不代表做不到。直接把需求丟給我問問看。';
    renderItems(hits);
  }

  capCats.addEventListener('click', (e) => {
    const b = e.target.closest('.cat'); if (!b) return;
    capSearch.value = ''; selectCat(b.dataset.cat);
    b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  });
  capSearch.addEventListener('input', () => searchCaps(capSearch.value));
  selectCat(capCurrent);

  /* ---------- 常見問題：一次開一題 ---------- */
  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq details').forEach((o) => { if (o !== d) o.open = false; });
  }));

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
    a.className = 'btn btn--primary btn--lg'; a.target = '_blank'; a.rel = 'noopener';
    a.href = CONFIG.line.startsWith('http') ? CONFIG.line : 'https://line.me/ti/p/~' + CONFIG.line;
    a.textContent = CONFIG.line.startsWith('http') ? 'LINE 聊聊' : `LINE 聊聊 · ID ${CONFIG.line}`;
    actions.prepend(a);
    // LINE 當主按鈕，GitHub 退成次要
    const gh = $('a[href*="github.com"]', actions);
    if (gh) gh.classList.remove('btn--primary');
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
