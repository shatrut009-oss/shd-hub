(() => {
  try {
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rnd = n => Math.floor(Math.random() * n);
    const H = 36e5, D = 864e5;

    // ===== АУДИО ДВИЖОК =====
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    try { audioCtx = AudioContext ? new AudioContext() : null; } catch(e) {}

    let bgmOsc = null; let bgmGain = null; let sfxVolume = 1.0;

    function startBGM() {
      if (!audioCtx) return;
      if (bgmOsc) return;
      try {
        bgmOsc = audioCtx.createOscillator();
        bgmGain = audioCtx.createGain();
        bgmOsc.type = 'sine';
        bgmOsc.frequency.setValueAtTime(60, audioCtx.currentTime);
        bgmGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        bgmOsc.connect(bgmGain); bgmGain.connect(audioCtx.destination);
        bgmOsc.start();
      } catch(e) {}
    }

    function stopBGM() {
      if (bgmOsc) { try { bgmOsc.stop(); } catch(e){} bgmOsc = null; }
    }

    function playSFX(type) {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.1 * sfxVolume, now);
        
        if (type === 'click') {
          osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.start(); osc.stop(now + 0.1);
        } else if (type === 'step') {
          osc.type = 'triangle'; osc.frequency.setValueAtTime(100, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.start(); osc.stop(now + 0.3);
        } else if (type === 'rain') {
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(80, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
          osc.start(); osc.stop(now + 1.0);
        }
      } catch(e) {}
    }

    document.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
    document.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.tile') || e.target.closest('.nv-dialog')) playSFX('click');
    });

    const TG = window.Telegram && window.Telegram.WebApp;
    if (TG) { try { TG.ready(); TG.expand(); } catch(e) {} }
    const U = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
    const NAME = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Гость';

    // ===== ДАННЫЕ =====
    const RAR = { common: ['Обычный', '#9aa0a6'], rare: ['Редкий', '#4da3ff'], epic: ['Эпический', '#b36bff'], legend: ['Легендарный', '#ffb020'], mythic: ['Мифический', '#ff3ea5'] };
    const CHARS = [{ n: 'Дима', r: 'common' }, { n: 'Ксюша', r: 'common' }, { n: 'Вачик', r: 'common' }, { n: 'Бабушка Димы', r: 'common' }, { n: 'Рита', r: 'rare' }, { n: 'Дерзкий', r: 'rare' }, { n: 'Камран', r: 'rare' }, { n: 'Директор', r: 'rare' }, { n: 'Николай Анатольевич', r: 'rare' }, { n: 'Саламандра (1)', r: 'epic' }, { n: 'Саламандра (2)', r: 'epic' }, { n: 'Руслан (2)', r: 'epic' }, { n: 'Беда (Софья Андреевна)', r: 'epic' }, { n: 'Руслан (1)', r: 'legend' }, { n: 'Загадочный мужчина из СТО', r: 'legend' }, { n: 'Миллкис', r: 'mythic' }];
    const CASES = { diary: { name: 'Дневничок', cost: 3, cur: 'coins', head: 'Дима', odds: { common: 58, rare: 28, epic: 10, legend: 3, mythic: 0.5, coin: 0.5 } }, cheat: { name: 'Шпаргалка', cost: 10, cur: 'stars', head: 'Саламандра (1)', odds: { common: 50, rare: 30, epic: 13, legend: 5, mythic: 1, coin: 1 } }, stick: { name: 'Палочка', cost: 13, cur: 'stars', head: 'Миллкис', odds: { common: 40, rare: 33, epic: 16, legend: 7.5, mythic: 2.5, coin: 1 } }, free: { name: 'Ежедневный', cost: 0, head: 'Бесплатно', odds: { common: 60, rare: 28, epic: 8, legend: 3, mythic: 0.5, coin: 0.5 } } };

    const S = {
      stars: 20, coins: 0, inv: [], hist: [], liked: {}, choices: [],
      spinAt: 0, dailyAt: 0, stat: { cases: 0, likes: 0, spins: 0, stars: 0, daily: 0, chapters: 0, epic: 0, legend: 0, mythic: 0 }
    };
    const addH = (t, d, a) => S.hist.unshift({ t, d, a, at: Date.now() });

    function toast(msg){ const t = $('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }

    // ===== НАВИГАЦИЯ =====
    const SCREENS = ['menu', 'edit', 'cases', 'roulette', 'detective', 'awards', 'profile'];
    function go(name){
      SCREENS.forEach(s => { const el = $('#s-' + s); if(el) el.classList.toggle('on', s === name); });
      const backBtn = $('#backBtn');
      if (backBtn) backBtn.classList.toggle('hidden', name === 'menu');
      
      try {
        if (name === 'edit') loadRealEdits();
        if (name === 'cases') renderCases();
        if (name === 'roulette') renderRoulette();
        if (name === 'detective') renderDetective();
        if (name === 'awards') renderAwards();
        if (name === 'profile') renderProfile();
      } catch(e) { console.error("Ошибка при переходе:", e); }
    }
    document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });
    if ($('#backBtn')) $('#backBtn').addEventListener('click', () => go('menu'));

    function roll(o){ const t = Object.values(o).reduce((a, b) => a + b, 0); let r = Math.random() * t; for (const k in o) { r -= o[k]; if (r < 0) return k; } return Object.keys(o)[0]; }
    function giveChar(rar){ const pool = CHARS.filter(c => c.r === rar); const c = pool[rnd(pool.length)]; S.inv.unshift({ n: c.n, r: rar }); if (rar === 'epic') S.stat.epic++; if (rar === 'legend') S.stat.legend++; if (rar === 'mythic') S.stat.mythic++; return c; }
    function cavHtml(name, rar){ return `<div class="cav" style="--c:${RAR[rar][1]}">${esc(name[0])}</div>`; }

    // ===== ЭДИТЫ =====
    async function loadRealEdits() {
      const container = $('#posts'); if (!container) return;
      container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Загрузка свежих видео...</div>';
      try {
        const res = await fetch('/api/posts?type=edits');
        const posts = await res.json();
        if (!posts || !posts.length) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Новых эдитов пока нет.</div>'; return; }
        container.innerHTML = posts.map(p => {
          let mediaHtml = '';
          if (p.videoUrl) mediaHtml = `<video src="${p.videoUrl}" controls controlsList="nodownload" playsinline style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;"></video>`;
          else if (p.image) mediaHtml = `<img src="${p.image}" style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;">`;
          const d = new Date(p.date); const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
          return `<article class="post" style="padding: 0; overflow: hidden; margin-bottom: 20px;">${mediaHtml}<div class="b"><div class="row" style="margin-bottom: 6px;"><div class="au" style="margin:0;">@${esc(p.author)}</div><div class="sub" style="font-size: 11px;">${dateStr}</div></div><p class="sub" style="margin-bottom: 10px; color: #fff; font-size: 14px; white-space: pre-wrap;">${esc(p.text.substring(0, 120))}...</p><div class="row"><a href="https://t.me/${p.author}" target="_blank" class="btn sm g" style="text-decoration:none;">В канал</a><button class="like" data-like="${p.id}">♥ Нравится</button></div></div></article>`;
        }).join('');
      } catch (err) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px; color: #ff1e3c;">Ошибка загрузки</div>'; }
    }
    if ($('#posts')) $('#posts').addEventListener('click', e => { const b = e.target.closest('[data-like]'); if (!b) return; b.classList.toggle('on'); b.textContent = b.classList.contains('on') ? '♥ В избранном' : '♥ Нравится'; });

    // ===== КЕЙСЫ =====
    function renderCases(){
      const list = $('#caseList'); if (!list) return;
      list.innerHTML = ['diary', 'cheat', 'stick'].map(k => {
        const c = CASES[k];
        return `<div class="card row"><div><b style="font-family:Oswald;font-size:17px;text-transform:uppercase">${c.name}</b><div class="sub">${c.cur === 'stars' ? '★' : '◆'} ${c.cost} · главный: ${esc(c.head)}</div><div class="sub">Монета ${c.odds.coin}% · мифический ${c.odds.mythic}%</div></div><button class="btn sm" data-case="${k}">Открыть</button></div>`;
      }).join('');
    }
    if ($('#caseList')) $('#caseList').addEventListener('click', e => { const b = e.target.closest('[data-case]'); if (b) openCase(b.dataset.case); });

    function openCase(k){
      const c = CASES[k];
      if (c.cost) { if (S[c.cur] < c.cost) return toast('Недостаточно ' + (c.cur === 'stars' ? 'звёзд' : 'монет')); S[c.cur] -= c.cost; }
      const r = roll(c.odds);
      const items = []; const WIN = 28;
      for (let i = 0; i < 36; i++) { const cc = i === WIN ? null : CHARS[rnd(CHARS.length)]; const rar = i === WIN ? r : cc.r; const name = i === WIN ? (r === 'coin' ? '+1 ◆' : '?') : cc.n; items.push(`<div class="it" style="--c:${RAR[rar] ? RAR[rar][1] : '#ffb020'}">${esc(name)}<i>${RAR[rar] ? RAR[rar][0] : 'Монета'}</i></div>`); }
      const stage = $('#caseStage'); if(!stage) return;
      stage.innerHTML = `<div class="strip"><div class="track" id="track">${items.join('')}</div></div><div id="res"></div>`;
      const stepW = 100; const offset = stage.clientWidth / 2 - 46 - WIN * stepW;
      requestAnimationFrame(() => requestAnimationFrame(() => { const track = $('#track'); if(track) track.style.transform = `translateX(${offset}px)`; }));
      $$('[data-case]').forEach(b => b.disabled = true);
      setTimeout(() => {
        S.stat.cases++; let text;
        if (r === 'coin') { S.coins += 1; text = `<div class="win"><div class="o" style="font-size:24px;color:var(--coin)">+1 ◆</div><span class="sub">монета актива</span></div>`; addH(`Кейс «${c.name}»`, 'Монета актива', '+1 ◆'); }
        else { const ch = giveChar(r); text = `<div class="win" style="--c:${RAR[r][1]}">${cavHtml(ch.n, r)}<b class="o" style="font-size:20px">${esc(ch.n)}</b><span class="tag" style="color:${RAR[r][1]}">${RAR[r][0]}</span></div>`; addH(`Кейс «${c.name}»`, `${ch.n} · ${RAR[r][0]}`, c.cost ? `-${c.cost} ${c.cur === 'stars' ? '★' : '◆'}` : 'Бесплатно'); }
        const res = $('#res'); if(res) res.innerHTML = text;
        $$('[data-case]').forEach(b => b.disabled = false); renderTop();
      }, 3300);
      renderTop();
    }

    // ===== РУЛЕТКА =====
    const SLICES = 10, FREE = [3, 7];
    const RL = { abs: 0, spinning: false };
    function fmt(ms){ const m = Math.ceil(ms / 60000), h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${m} мин`; }
    function buildWheel(){
      const disc = $('#disc'); if(!disc) return;
      const parts = []; for (let i = 0; i < SLICES; i++) { const f = FREE.includes(i); const c = f ? '#ffb020' : (i % 2 ? '#1a1a24' : '#101018'); parts.push(`${c} ${i * 36}deg ${(i + 1) * 36}deg`); }
      disc.style.background = `conic-gradient(${parts.join(',')})`;
      disc.innerHTML = Array.from({ length: SLICES }, (_, i) => { const f = FREE.includes(i); return `<span class="lbl" style="transform:rotate(${i * 36 + 18}deg)"><b>${f ? '🎁' : '✖'}</b><i>${f ? 'кейс' : 'пусто'}</i></span>`; }).join('');
    }
    function renderRoulette(){
      if (!$('#disc')) return;
      if (!$('#disc').children.length) buildWheel();
      $('#disc').style.transform = `rotate(${RL.abs}deg)`;
      const left = S.spinAt + 2 * H - Date.now();
      const btn = $('#spinBtn'); const txt = $('#spinTxt');
      if(btn) { btn.disabled = left > 0 || RL.spinning; btn.textContent = left > 0 ? 'Подождите' : 'Крутить'; }
      if(txt) txt.textContent = RL.spinning ? 'Крутим…' : (left > 0 ? 'Новая попытка через ' + fmt(left) : 'Испытай удачу');
    }
    if ($('#spinBtn')) $('#spinBtn').addEventListener('click', () => {
      if (RL.spinning || Date.now() < S.spinAt + 2 * H) return;
      S.spinAt = Date.now(); S.stat.spins++; RL.spinning = true;
      const win = rnd(SLICES); const center = win * 36 + 18; const delta = 360 * 6 + ((360 - ((center + RL.abs) % 360)) % 360);
      RL.abs += delta; if($('#disc')) $('#disc').style.transform = `rotate(${RL.abs}deg)`; renderRoulette();
      setTimeout(() => {
        RL.spinning = false; const hit = FREE.includes(win);
        addH('Рулетка', hit ? 'Бесплатный кейс' : 'Пусто', hit ? 'Кейс' : '—'); renderRoulette();
        if (hit) { toast('Джекпот! Бесплатный кейс!'); setTimeout(() => { go('cases'); openCase('free'); }, 400); }
        else toast('Увы, пусто. Повезет в следующий раз');
      }, 5100);
    });

    // ==========================================
    // ===== ДЕТЕКТИВ (ВИЗУАЛЬНАЯ НОВЕЛЛА) ========
    // ==========================================
    const BG_YARD = "data:image/svg+xml;utf8,<svg viewBox='0 0 400 800' xmlns='http://www.w3.org/2000/svg'><defs><linearGradient id='g1' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='%23222'/><stop offset='100%' stop-color='%23050a10'/></linearGradient></defs><rect width='400' height='800' fill='url(%23g1)'/><path d='M50,800 L50,400 L350,400 L350,800 Z' fill='%23111'/><path d='M100,400 L100,300 L300,300 L300,400 Z' fill='%231a1a1a'/><rect x='150' y='450' width='100' height='150' fill='%23222'/><path d='M0,800 Q100,700 200,800 Q300,750 400,800' fill='%23000' opacity='0.5'/></svg>";
    const BG_CLASS = "data:image/svg+xml;utf8,<svg viewBox='0 0 400 800' xmlns='http://www.w3.org/2000/svg'><rect width='400' height='800' fill='%23151a22'/><rect x='50' y='200' width='300' height='400' fill='%230a0a0a'/><rect x='200' y='300' width='100' height='200' fill='%23333'/><rect x='220' y='350' width='60' height='100' fill='%23ffc83d' opacity='0.2'/></svg>";
    const CHAR_DIMA = "data:image/svg+xml;utf8,<svg viewBox='0 0 200 400' xmlns='http://www.w3.org/2000/svg'><path d='M40,400 L40,200 Q100,150 160,200 L160,400 Z' fill='%23222'/><circle cx='100' cy='120' r='50' fill='%23e0ac69'/><path d='M50,100 Q100,50 150,100 Q150,50 100,40 Q50,50 50,100 Z' fill='%23111'/><path d='M80,180 L80,350 L120,350 L120,180 Z' fill='%23fff'/><path d='M85,180 L85,350 L115,350 L115,180 Z' fill='%23a11f1f'/></svg>";
    const CHAR_DERZKIY = "data:image/svg+xml;utf8,<svg viewBox='0 0 200 400' xmlns='http://www.w3.org/2000/svg'><path d='M30,400 L30,180 Q100,130 170,180 L170,400 Z' fill='%23182436'/><circle cx='100' cy='110' r='45' fill='%23e0ac69'/><path d='M60,80 L140,80 L130,50 L70,50 Z' fill='%23111'/><path d='M70,180 L70,350 L130,350 L130,180 Z' fill='%23fff'/></svg>";

    const EP1_SCENES = [
      { bg: BG_YARD, char: null, name: '', text: 'Ночной холодный ливень к утру сменился вязким, липким туманом.' },
      { bg: BG_YARD, char: null, name: '', text: 'Сырой воздух забивает лёгкие. На часах — семь утра. Школьный двор за пустырём ещё вымерший, серый, словно слепой.' },
      { bg: BG_YARD, char: CHAR_DERZKIY, name: 'Дерзкий', text: 'Дерзкий выныривает из сырой дымки, пряча руки в карманы потёртого блейзера.' },
      { bg: BG_YARD, char: CHAR_DIMA, name: 'Дима', text: '— Значит, тайник там. Он не рискнул тащить остальное домой под нос родителям.', sfx: 'step' },
      { choice: true, name: 'Дима', text: 'Что будем делать?', options: [{ text: 'Осмотреть раздевалку', next: 'class' }, { text: 'Проверить подвал', next: 'class' }]},
      { bg: BG_CLASS, char: CHAR_DIMA, name: 'Дима', text: 'Мы зашли в школу. В коридорах тихо, только где-то капает вода.', sfx: 'rain' }
    ];

    let vnState = { active: false, index: 0 };

    function renderDetective() {
      const body = $('#nvBody'); if (!body) return;
      const hasProgress = S.stat.chapters > 0;
      body.innerHTML = `
        <div style="text-align:center; margin-top:40px;">
          <h1 style="font-family:'Oswald'; font-size:36px; color:#fff;">Эпизод 1</h1>
          <p class="sub" style="font-size:16px; margin-bottom:30px;">Тайна раздевалки</p>
          <button class="btn w" id="btn-start-vn" style="font-size:18px; padding:15px; margin-bottom:10px;">${hasProgress ? '▶ Продолжить' : '▶ Начать главу'}</button>
          <button class="btn g w" id="btn-restart-vn" style="margin-bottom:20px;">↺ Пройти заново</button>
          <div style="display:flex; justify-content:flex-end;"><button class="btn sm" id="btn-my-choices">♥ Твои выборы</button></div>
        </div>
      `;
      if($('#btn-start-vn')) $('#btn-start-vn').addEventListener('click', () => startVN());
      if($('#btn-restart-vn')) $('#btn-restart-vn').addEventListener('click', () => { S.stat.chapters = 0; renderDetective(); });
      if($('#btn-my-choices')) $('#btn-my-choices').addEventListener('click', () => openChoicesModal());
    }

    function startVN() {
      vnState = { active: true, index: 0 };
      $('#vn-screen').classList.remove('hidden');
      startBGM();
      showScene();
    }

    function showScene() {
      if (!vnState.active) return;
      const scene = EP1_SCENES[vnState.index];
      if (!scene) return endVN();

      const bgEl = $('#vn-bg');
      const charEl = $('#vn-char');
      const dialogEl = $('#vn-dialog');
      const speakerEl = $('#vn-speaker');
      const textEl = $('#vn-text');

      if (scene.choice) {
        dialogEl.style.display = 'none';
        charEl.classList.remove('active');
        let choiceHtml = `<div style="position:absolute; inset:0; background:rgba(0,0,0,0.8); display:flex; flex-direction:column; justify-content:center; padding:20px; z-index:70;">`;
        choiceHtml += `<h3 style="color:#fff; margin-bottom:20px; text-align:center;">Сделай выбор</h3>`;
        scene.options.forEach((opt, i) => { choiceHtml += `<button class="btn w" style="margin-bottom:10px; background:#333;" onclick="window.makeChoice(${i})">${opt.text}</button>`; });
        choiceHtml += `</div>`;
        $('#vn-screen').insertAdjacentHTML('beforeend', choiceHtml);
        window.makeChoice = (idx) => {
          const opt = scene.options[idx];
          S.choices.unshift({ ep: 'Эпизод 1', loc: 'Двор', choice: opt.text });
          document.querySelector('#vn-screen > div[style*="position:absolute"]').remove();
          dialogEl.style.display = 'block';
          vnState.index++;
          showScene();
        };
        return;
      }

      dialogEl.style.display = 'block';
      bgEl.style.backgroundImage = `url('${scene.bg}')`;
      bgEl.classList.add('active');
      if (scene.char) { charEl.style.backgroundImage = `url('${scene.char}')`; charEl.classList.add('active'); } else { charEl.classList.remove('active'); }
      speakerEl.textContent = scene.name;
      speakerEl.style.display = scene.name ? 'inline-block' : 'none';
      textEl.textContent = scene.text;
      if (scene.sfx) playSFX(scene.sfx);
    }

    if ($('#vn-dialog')) $('#vn-dialog').addEventListener('click', () => { if (!vnState.active) return; vnState.index++; showScene(); });

    function endVN() {
      vnState.active = false;
      $('#vn-screen').classList.add('hidden');
      stopBGM();
      S.stat.chapters++;
      toast('Глава пройдена!');
      renderDetective();
    }

    if ($('#vn-pause-btn')) $('#vn-pause-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#pause-modal').classList.remove('hidden'); });
    if ($('#pause-continue')) $('#pause-continue').addEventListener('click', () => $('#pause-modal').classList.add('hidden'));
    if ($('#pause-exit')) $('#pause-exit').addEventListener('click', () => { $('#pause-modal').classList.add('hidden'); $('#vn-screen').classList.add('hidden'); stopBGM(); vnState.active = false; go('menu'); });
    if ($('#pause-restart')) $('#pause-restart').addEventListener('click', () => { $('#pause-modal').classList.add('hidden'); vnState.index = 0; showScene(); });
    if ($('#vol-sfx')) $('#vol-sfx').addEventListener('input', (e) => { sfxVolume = e.target.value / 100; });
    if ($('#vol-music')) $('#vol-music').addEventListener('input', (e) => { if(bgmGain) bgmGain.gain.value = (e.target.value / 100) * 0.1; });
    
    function openChoicesModal() {
      $('#choices-modal').classList.remove('hidden');
      const container = $('#choices-content');
      if (!S.choices.length) {
        container.innerHTML = '<div class="sub" style="text-align:center; margin-top:20px;">Ты пока не сделал ни одного выбора.</div>';
      } else {
        container.innerHTML = S.choices.map(c => `
          <div class="card" style="padding:12px; margin-bottom:8px; border-left: 3px solid var(--star);">
            <div class="sub" style="font-size:10px; margin-bottom:4px; text-transform:uppercase;">${esc(c.ep)}</div>
            <b style="font-size:14px; color:#fff;">${esc(c.choice)}</b>
          </div>
        `).join('');
      }
    }
    if ($('#pause-choices')) $('#pause-choices').addEventListener('click', () => openChoicesModal());
    if ($('#choices-close')) $('#choices-close').addEventListener('click', () => $('#choices-modal').classList.add('hidden'));
    if ($('#pause-album')) $('#pause-album').addEventListener('click', () => $('#album-modal').classList.remove('hidden'));
    if ($('#album-close')) $('#album-close').addEventListener('click', () => $('#album-modal').classList.add('hidden'));

    // ===== НАГРАДЫ И ПРОФИЛЬ =====
    function achievements(){
      const s = S.stat, L = [];
      [1, 5, 10, 25, 50].forEach(n => L.push([`Открыто кейсов: ${n}`, s.cases >= n]));
      [1, 5, 10, 25, 50].forEach(n => L.push([`Поставлено лайков: ${n}`, s.likes >= n]));
      [1, 5, 10, 25, 50].forEach(n => L.push([`Прокручено рулетки: ${n}`, s.spins >= n]));
      [10, 50, 100, 250, 500].forEach(n => L.push([`Пополнено звёзд: ${n}`, s.stars >= n]));
      [1, 2, 3, 4, 5].forEach(n => L.push([`Пройдено глав: ${n}`, s.chapters >= n]));
      [1, 3, 5].forEach(n => L.push([`Эпических персонажей: ${n}`, s.epic >= n]));
      [1, 3].forEach(n => L.push([`Легендарных персонажей: ${n}`, s.legend >= n]));
      return L;
    }
    function renderAwards(){ 
      const list = $('#achList'); const sub = $('#awSub'); if (!list) return;
      const L = achievements(); const done = L.filter(a => a[1]).length;
      if(sub) sub.textContent = `${done} из ${L.length}`;
      list.innerHTML = L.map(a => `<div class="ach ${a[1] ? 'done' : ''}"><span>${esc(a[0])}</span></div>`).join('');
    }
    if ($('#dailyBtn')) $('#dailyBtn').addEventListener('click', () => { if (Date.now() < S.dailyAt + D) return toast('Бесплатный кейс уже открыт сегодня'); S.dailyAt = Date.now(); S.stat.daily++; go('cases'); openCase('free'); });

    function renderTop(){ if($('#cS')) $('#cS').textContent = S.stars; if($('#cC')) $('#cC').textContent = S.coins; }
    function renderProfile(){
      if (!$('#bS')) return;
      $('#bS').textContent = S.stars; $('#bC').textContent = S.coins;
      $('#inv').innerHTML = S.inv.length ? S.inv.slice(0, 18).map(i => `<div class="pc" style="--c:${RAR[i.r][1]}"><div class="cav" style="width:40px;height:40px;font-size:17px">${esc(i.n[0])}</div>${esc(i.n)}<i>${RAR[i.r][0]}</i></div>`).join('') : '<div class="sub" style="grid-column:1/-1">Пока пусто. Открой кейс!</div>';
      $('#hist').innerHTML = S.hist.length ? S.hist.slice(0, 12).map(h => `<div class="card row" style="padding:10px 12px;margin-bottom:8px"><div><b style="font-size:13px">${esc(h.t)}</b><div class="sub">${esc(h.d)}</div></div><b style="font-size:13px">${esc(h.a)}</b></div>`).join('') : '<div class="sub">История пуста</div>';
      renderTop();
      if($('#rlSub')) $('#rlSub').textContent = Date.now() < S.spinAt + 2 * H ? 'до следующей: ' + fmt(S.spinAt + 2 * H - Date.now()) : 'доступна сейчас';
      const L = achievements(); const done = L.filter(a => a[1]).length;
      if($('#pAw')) $('#pAw').textContent = `${done} из ${L.length}`;
    }

    // ===== ПОПОЛНЕНИЕ =====
    if ($('#topBtn')) $('#topBtn').addEventListener('click', openTopup);
    function openTopup(){
      const modal = $('#modal'); const sheet = $('#mSheet'); if(!modal || !sheet) return;
      modal.classList.remove('hidden');
      sheet.innerHTML = `<h2>Пополнить звёзды</h2><p class="sub">Оплата проходит внутри Telegram. Звёзды зачисляются на баланс бота.</p><div class="pre">${[50, 100, 250, 500, 1000].map(n => `<button data-n="${n}">★ ${n}</button>`).join('')}</div><input id="cu" type="number" min="1" max="10000" placeholder="Своя сумма"><button class="btn w" id="pay">Оплатить ★ 250</button><button class="btn g w" id="mClose">Закрыть</button>`;
      let n = 250; const set = v => { n = v; if($('#pay')) $('#pay').textContent = `Оплатить ★ ${n}`; $$('[data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); };
      set(250);
      sheet.addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { if($('#cu')) $('#cu').value = ''; set(+b.dataset.n); } });
      if($('#cu')) $('#cu').addEventListener('input', e => { const v = Math.floor(+e.target.value); if (v >= 1 && v <= 10000) set(v); });
      if($('#pay')) $('#pay').addEventListener('click', () => {
        sheet.innerHTML = `<h2>Подтверждение покупки</h2><p class="sub">Списать ★ ${n} из вашего аккаунта Telegram и зачислить на баланс?</p><button class="btn w" id="ok">Подтвердить ★ ${n}</button><button class="btn g w" id="mClose">Отмена</button>`;
        if($('#ok')) $('#ok').addEventListener('click', () => { S.stars += n; S.stat.stars += n; addH('Пополнение звёзд', 'Оплата через Telegram', `+${n} ★`); toast(`+${n} ★ на баланс`); closeModal(); renderTop(); });
        if($('#mClose')) $('#mClose').addEventListener('click', closeModal);
      });
      if($('#mClose')) $('#mClose').addEventListener('click', closeModal);
    }
    function closeModal(){ const m = $('#modal'); if(m) m.classList.add('hidden'); }
    if ($('#modal')) $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

    // ===== СТАРТ =====
    if($('#nick')) $('#nick').textContent = NAME; if($('#nick2')) $('#nick2').textContent = NAME;
    if($('#av')) $('#av').textContent = NAME[0].toUpperCase(); if($('#av2')) $('#av2').textContent = NAME[0].toUpperCase();
    renderTop();
    setInterval(() => { if ($('#s-roulette') && $('#s-roulette').classList.contains('on')) renderRoulette(); }, 1000);

  } catch (error) {
    console.error("Критическая ошибка:", error);
  }
})();
