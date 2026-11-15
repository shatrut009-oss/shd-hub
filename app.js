(() => {
  try {
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rnd = n => Math.floor(Math.random() * n);
    const H = 36e5, D = 864e5;

    // ===== МУЗЫКА =====
    const MUSIC = {
      calm: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', 
      tense: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b1b0b6e9c.mp3?filename=dark-ambient-horror-111163.mp3', 
      sad: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_9c5b2c8a4b.mp3?filename=sad-emotional-piano-124109.mp3', 
      climax: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_00ff97be42.mp3?filename=epic-hollywood-trailer-11470.mp3' 
    };

    let bgmVolume = 0.15;
    let currentMusicUrl = null;
    const musicPlayer = new Audio();
    musicPlayer.loop = true;
    musicPlayer.volume = bgmVolume;

    function playMusic(type) {
      const url = MUSIC[type];
      if (!url || currentMusicUrl === url) return; 
      currentMusicUrl = url;
      musicPlayer.src = url;
      if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); }
      musicPlayer.play().catch(e => {
          document.addEventListener('click', () => { musicPlayer.play(); }, { once: true });
      });
    }
    function stopMusic() { musicPlayer.pause(); currentMusicUrl = null; }

    // ===== ЗВУКИ =====
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null; try { audioCtx = AudioContext ? new AudioContext() : null; } catch(e) {}
    let sfxVolume = 0.8;
    
    document.addEventListener('click', () => { 
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); 
      if (musicPlayer && musicPlayer.paused && currentMusicUrl) musicPlayer.play().catch(()=>{});
    });

    function playSFX(type) { 
      if (!audioCtx) return; 
      if (audioCtx.state === 'suspended') audioCtx.resume();
      try { 
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.connect(audioCtx.destination);
        
        if (type === 'click') { 
          const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(1000, now); 
          gain.gain.setValueAtTime(0.2 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); 
          osc.connect(gain); osc.start(); osc.stop(now + 0.08); 
        } else if (type === 'win') {
          const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
          gain.gain.setValueAtTime(0.3 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain); osc.start(); osc.stop(now + 0.4);
        } else if (type === 'tape') {
          const bufferSize = audioCtx.sampleRate * 1.5;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
          const source = audioCtx.createBufferSource(); source.buffer = buffer;
          const filter = audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1500;
          gain.gain.setValueAtTime(0.2 * sfxVolume, now); gain.gain.linearRampToValueAtTime(0.2 * sfxVolume, now + 1.2); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          source.connect(filter); filter.connect(gain); source.start(); source.stop(now + 1.5);
        } else if (type === 'door' || type === 'scream' || type === 'step') {
          const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(type==='door'?60:type==='scream'?600:150, now);
          osc.frequency.exponentialRampToValueAtTime(type==='door'?100:type==='scream'?200:50, now + 0.4);
          gain.gain.setValueAtTime(0.3 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain); osc.start(); osc.stop(now + 0.5);
        }
      } catch(e) {} 
    }
    document.addEventListener('click', (e) => { 
      if (e.target.closest('button') || e.target.closest('.tile') || e.target.closest('.vn-dialog') || e.target.closest('.case-card')) playSFX('click'); 
    });

    const TG = window.Telegram && window.Telegram.WebApp; if (TG) { try { TG.ready(); TG.expand(); } catch(e) {} }
    const U = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
    const NAME = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Гость';

    // ===== ДАННЫЕ =====
    const RAR = { common: ['Обычный', '#9aa0a6'], rare: ['Редкий', '#4da3ff'], epic: ['Эпический', '#b36bff'], legend: ['Легендарный', '#ffb020'], mythic: ['Мифический', '#ff3ea5'] };
    
    const C = { 
      dima: 'https://i.postimg.cc/QNbfg9tC/1794726184077.png', derz: 'https://i.postimg.cc/Bn8NGmCs/1794726189222.png',
      kamran: 'https://i.postimg.cc/rpxJDz3K/1794726194181.png', sofia: 'https://i.postimg.cc/yxYXpjdZ/1794726201907.png',
      ruslan: 'https://i.postimg.cc/tR2zZKS5/1794726208162.png', ruslan_doc: 'https://i.postimg.cc/bvc0fpJF/1794726213335.png',
      vachik: 'https://i.postimg.cc/0jQD0NWx/1794727136951.png', ksusha: 'https://i.postimg.cc/DwssgHg1/1794726228602.png',
      mila: 'https://i.postimg.cc/FFBLQNCx/1794726290228.png', sala: 'https://i.postimg.cc/CxynzJgZ/1794726297100.png',
      woman: 'https://i.postimg.cc/0ypMmm5g/1794726593166.png', babushka: 'https://i.postimg.cc/kMzBpwBP/1794726311325.png',
      nikolay: 'https://i.postimg.cc/SKdn1hzM/1794726596195.png', director: 'https://i.postimg.cc/mrmrNy05/1794726601497.png'
    };

    const CHARS = [
      { n: 'Дима', r: 'common', img: C.dima }, { n: 'Дерзкий', r: 'common', img: C.derz }, { n: 'Вачик', r: 'common', img: C.vachik }, { n: 'Ксюша', r: 'common', img: C.ksusha },
      { n: 'Камран', r: 'rare', img: C.kamran }, { n: 'Софья Андреевна', r: 'rare', img: C.sofia }, { n: 'Руслан', r: 'rare', img: C.ruslan }, { n: 'Николай Андреевич', r: 'rare', img: C.nikolay },
      { n: 'Саламандра', r: 'epic', img: C.sala }, { n: 'Мила', r: 'epic', img: C.mila }, { n: 'Директор', r: 'epic', img: C.director },
      { n: 'Наталья Олеговна', r: 'legend', img: C.babushka }, { n: 'Руслан (Врач)', r: 'legend', img: C.ruslan_doc },
      { n: 'Женщина в чёрном', r: 'mythic', img: C.woman }
    ];

    const CASES = { 
      diary: { name: 'Дневничок', cost: 3, cur: 'coins', bg: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)', icon: '🎒', odds: { common: 58, rare: 28, epic: 10, legend: 3, mythic: 1 } }, 
      cheat: { name: 'Шпаргалка', cost: 10, cur: 'stars', bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', icon: '📘', odds: { common: 50, rare: 30, epic: 13, legend: 5, mythic: 2 } }, 
      stick: { name: 'Палочка', cost: 13, cur: 'stars', bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', icon: '🪄', odds: { common: 40, rare: 33, epic: 16, legend: 7, mythic: 4 } }, 
      free: { name: 'Ежедневный', cost: 0, bg: '#222', icon: '🎁', odds: { common: 60, rare: 28, epic: 8, legend: 3, mythic: 1 } } 
    };

    // ===== ЛОКАЛЬНОЕ СОХРАНЕНИЕ =====
    const DEFAULT_S = {
      stars: 20, coins: 0, inv: [], hist: [], liked: {}, choices: [], activeBadge: null,
      spinAt: 0, dailyAt: 0, stat: { cases: 0, likes: 0, spins: 0, spinsChar: 0, stars: 0, daily: 0, chapters: 0 }
    };
    let S = { ...DEFAULT_S };
    try {
      const saved = localStorage.getItem('shd_app_state');
      if (saved) S = { ...DEFAULT_S, ...JSON.parse(saved) };
    } catch(e) {}
    
    function saveState() {
      try { localStorage.setItem('shd_app_state', JSON.stringify(S)); } catch(e) {}
    }

    function getPoints() {
      let p = 0;
      S.inv.forEach(c => {
        if (c.r === 'common') p += 1;
        else if (c.r === 'rare') p += 5;
        else if (c.r === 'epic') p += 20;
        else if (c.r === 'legend') p += 100;
        else if (c.r === 'mythic') p += 500;
      });
      return p;
    }
    
    const addH = (t, d, a) => { S.hist.unshift({ t, d, a, at: Date.now() }); saveState(); };
    function toast(msg){ const t = $('#toast'); if(!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }

    // ===== НАВИГАЦИЯ =====
    const SCREENS = ['menu', 'edit', 'cases', 'roulette', 'detective', 'awards', 'profile'];
    function go(name){
      SCREENS.forEach(s => { const el = $('#s-' + s); if(el) el.classList.toggle('on', s === name); });
      const backBtn = $('#backBtn'); if (backBtn) backBtn.classList.toggle('hidden', name === 'menu');
      try { if (name === 'edit') loadRealEdits(); if (name === 'cases') renderCases(); if (name === 'roulette') renderRoulette(); if (name === 'detective') renderDetective(); if (name === 'awards') renderAwards(); if (name === 'profile') renderProfile(); } catch(e) {}
    }
    document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });
    if ($('#backBtn')) $('#backBtn').addEventListener('click', () => go('menu'));

    function roll(o){ const t = Object.values(o).reduce((a, b) => a + b, 0); let r = Math.random() * t; for (const k in o) { r -= o[k]; if (r < 0) return k; } return Object.keys(o)[0]; }
    function giveChar(rar){ const pool = CHARS.filter(c => c.r === rar); const c = pool[rnd(pool.length)]; S.inv.unshift({ n: c.n, r: rar, img: c.img, id: Date.now()+rnd(9999) }); saveState(); return c; }
    function cavHtml(name, rar, img){ return `<div class="cav" style="--c:${RAR[rar][1]}; overflow:hidden; padding:0;">${img ? `<img src="${img}" style="width:100%; height:100%; object-fit:cover;">` : esc(name[0])}</div>`; }

    // ===== ЭДИТЫ =====
    async function loadRealEdits() {
      const container = $('#posts'); if (!container) return; container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Загрузка...</div>';
      try { const res = await fetch('/api/posts?type=edits'); const posts = await res.json(); if (!posts || !posts.length) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Пусто</div>'; return; }
        container.innerHTML = posts.map(p => { let mediaHtml = ''; if (p.videoUrl) mediaHtml = `<video src="${p.videoUrl}" controls controlsList="nodownload" playsinline style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;"></video>`; else if (p.image) mediaHtml = `<img src="${p.image}" style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;">`; const d = new Date(p.date); const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); return `<article class="post" style="padding: 0; overflow: hidden; margin-bottom: 20px;">${mediaHtml}<div class="b"><div class="row" style="margin-bottom: 6px;"><div class="au" style="margin:0;">@${esc(p.author)}</div><div class="sub" style="font-size: 11px;">${dateStr}</div></div><p class="sub" style="margin-bottom: 10px; color: #fff; font-size: 14px; white-space: pre-wrap;">${esc(p.text.substring(0, 120))}...</p><div class="row"><a href="https://t.me/${p.author}" target="_blank" class="btn sm g" style="text-decoration:none;">В канал</a><button class="like" data-like="${p.id}">♥ Нравится</button></div></div></article>`; }).join('');
      } catch (err) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px; color: #ff1e3c;">Ошибка</div>'; } }
    if ($('#posts')) $('#posts').addEventListener('click', e => { const b = e.target.closest('[data-like]'); if (!b) return; b.classList.toggle('on'); b.textContent = b.classList.contains('on') ? '♥ В избранном' : '♥ Нравится'; S.stat.likes++; saveState(); });

    // ===== КЕЙСЫ =====
    function renderCases(){
      const list = $('#caseList'); if (!list) return;
      const onlineCount = 4517 + rnd(1500);
      let html = `
        <div class="cases-header">
          <button class="history-btn" id="btn-history">⏱ История выигрышей</button>
          <div class="online-badge"><div class="online-dot"></div>${onlineCount.toLocaleString('ru-RU')} играют</div>
        </div>
        <div class="case-cards-list">
      `;
      ['diary', 'cheat', 'stick'].forEach(k => {
        const c = CASES[k];
        html += `
          <div class="case-card" data-case="${k}" style="background: ${c.bg}">
            <div class="case-icon">${c.icon}</div>
            <div class="case-info">
              <div class="case-sub">${k === 'cheat' ? 'Рисковый' : 'Стандартный'}</div>
              <div class="case-title">${c.name}</div>
              <div class="case-price"><span>${c.cur === 'stars' ? '★' : '◆'} ${c.cost}</span></div>
            </div>
            <div class="case-chevron">›</div>
          </div>
        `;
      });
      html += `</div><div id="caseStage" style="margin-top:20px;"></div>`;
      list.innerHTML = html;

      if ($('#btn-history')) {
        $('#btn-history').addEventListener('click', () => {
          renderHistory();
          $('#modal-history').classList.remove('hidden');
        });
      }
    }

    if ($('#caseList')) $('#caseList').addEventListener('click', e => { 
      const b = e.target.closest('[data-case]'); 
      if (b) openCaseDetails(b.dataset.case); 
    });

    function openCaseDetails(k) {
      const c = CASES[k];
      const modal = $('#modal-case-details');
      const content = $('#case-modal-content');
      
      // Генерируем превью-ленту
      let previewItems = '';
      for(let i=0; i<15; i++) {
        const r = i === 7 ? 'epic' : 'common';
        const img = CHARS[rnd(CHARS.length)].img;
        previewItems += `<div class="preview-item" style="border-color:${RAR[r][1]}"><img src="${img}"></div>`;
      }

      // Сортируем шансы для красоты
      const oddsList = [
        { type: 'common', label: 'Обычный', color: RAR.common[1], chance: c.odds.common, icon: '🎒' },
        { type: 'rare', label: 'Редкий', color: RAR.rare[1], chance: c.odds.rare, icon: '📘' },
        { type: 'epic', label: 'Эпический', color: RAR.epic[1], chance: c.odds.epic, icon: '🪄' },
        { type: 'legend', label: 'Легендарный', color: RAR.legend[1], chance: c.odds.legend, icon: '🏆' },
        { type: 'mythic', label: 'Мифический', color: RAR.mythic[1], chance: c.odds.mythic, icon: '💎' }
      ].filter(o => o.chance > 0);

      content.innerHTML = `
        <div style="text-align:center; margin-bottom:20px;">
          <h2 style="font-family:'Oswald'; font-size:28px; color:#fff;">${c.name}</h2>
          <div class="sub">${c.cur === 'stars' ? 'Стоимость: ★ ' + c.cost : 'Стоимость: ◆ ' + c.cost}</div>
        </div>

        <div class="preview-strip">
          <div class="preview-track">
            ${previewItems}
          </div>
          <div class="preview-ptr"></div>
        </div>

        <div class="row" style="margin:20px 0 10px;">
          <div style="font-family:'Oswald'; font-size:18px; color:#fff;">Что может выпасть</div>
          <div class="sub">шансы</div>
        </div>
        
        <div class="odds-list">
          ${oddsList.map(o => `
            <div class="odds-item">
              <div class="odds-icon" style="background:${o.color}22; color:${o.color}; border:1px solid ${o.color}44;">${o.icon}</div>
              <div class="odds-info">
                <div style="font-weight:600; color:#fff; font-size:15px;">${o.label}</div>
                <div class="sub" style="font-size:12px;">Персонаж</div>
              </div>
              <div class="odds-chance" style="background:${o.color}22; color:${o.color};">${o.chance}%</div>
            </div>
          `).join('')}
        </div>

        <button class="btn w" id="confirm-open-case" style="margin-top:20px; font-size:16px; padding:15px;">Открыть за ${c.cur === 'stars' ? '★' : '◆'} ${c.cost}</button>
        <button class="btn g w close-modal" style="margin-top:10px;">Отмена</button>
      `;

      modal.classList.remove('hidden');
      
      // Анимация превью (просто едет)
      const track = content.querySelector('.preview-track');
      setTimeout(() => { track.style.transform = 'translateX(-140px)'; track.style.transition = 'transform 2s ease-out'; }, 100);

      $('#confirm-open-case').addEventListener('click', () => {
        modal.classList.add('hidden');
        executeOpenCase(k);
      });
    }

    function executeOpenCase(k){
      const c = CASES[k]; if (c.cost) { if (S[c.cur] < c.cost) return toast('Недостаточно средств'); S[c.cur] -= c.cost; saveState(); }
      const r = roll(c.odds); const items = []; const WIN = 28;
      
      for (let i = 0; i < 36; i++) { 
        const cc = i === WIN ? null : CHARS[rnd(CHARS.length)]; 
        const rar = i === WIN ? r : cc.r; 
        const img = i === WIN ? '' : cc.img; 
        items.push(`<div class="it" style="--c:${RAR[rar] ? RAR[rar][1] : '#ffb020'}">${img ? `<img src="${img}">` : '?'}</div>`); 
      }
      
      const stage = $('#caseStage'); if(!stage) return; 
      stage.innerHTML = `<div class="strip"><div class="track" id="track">${items.join('')}</div></div><div id="res"></div>`;
      const stepW = 100; const offset = stage.clientWidth / 2 - 46 - WIN * stepW;
      requestAnimationFrame(() => requestAnimationFrame(() => { const track = $('#track'); if(track) track.style.transform = `translateX(${offset}px)`; }));
      
      $$('[data-case]').forEach(b => { b.style.pointerEvents = 'none'; b.style.opacity = '0.5'; });
      
      setTimeout(() => {
        const ch = giveChar(r); playSFX('win');
        const text = `<div class="win" style="--c:${RAR[r][1]}">${cavHtml(ch.n, r, ch.img)}<b class="o" style="font-size:20px">${esc(ch.n)}</b><span class="tag" style="color:${RAR[r][1]}">${RAR[r][0]}</span></div>`; 
        addH(`Кейс «${c.name}»`, `Выпал: ${ch.n} (${RAR[r][0]})`, c.cost ? `-${c.cost} ${c.cur === 'stars' ? '★' : '◆'}` : 'Бесплатно'); 
        const res = $('#res'); if(res) res.innerHTML = text; 
        
        $$('[data-case]').forEach(b => { b.style.pointerEvents = 'auto'; b.style.opacity = '1'; });
        renderTop();
      }, 3300);
      renderTop();
    }

    // ===== ИСТОРИЯ =====
    function renderHistory() {
      const list = $('#history-list');
      if (!S.hist.length) {
        list.innerHTML = '<div class="sub" style="text-align:center; padding:20px;">Тут пока пусто</div>';
        return;
      }
      
      list.innerHTML = S.hist.map(h => {
        const d = new Date(h.at);
        const dateStr = `${d.getDate()}.${d.getMonth()+1}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        
        let icon = '🎁'; let iconBg = 'rgba(255,255,255,0.1)';
        if (h.t.includes('Дневничок')) { icon = '🎒'; iconBg = 'rgba(157, 77, 255, 0.2)'; }
        else if (h.t.includes('Шпаргалка')) { icon = '📘'; iconBg = 'rgba(77, 163, 255, 0.2)'; }
        else if (h.t.includes('Палочка')) { icon = '🪄'; iconBg = 'rgba(74, 222, 128, 0.2)'; }

        return `
          <div class="hist-card">
            <div class="hist-icon" style="background:${iconBg}">${icon}</div>
            <div class="hist-info">
              <div class="hist-title">${esc(h.d)}</div>
              <div class="hist-sub">${esc(h.t)} · ${dateStr}</div>
            </div>
            <div class="hist-price" style="color:${h.a === 'Бесплатно' ? '#4ade80' : 'var(--star)'}">${esc(h.a)}</div>
          </div>
        `;
      }).join('');
    }

    // ===== РУЛЕТКИ =====
    const SLICES = 10, FREE = [3, 7];
    const RL = { abs: 0, spinning: false };
    const RL2 = { abs: 0, spinning: false };
    
    function buildWheel(){
      const disc = $('#disc'); if(!disc) return;
      const parts = []; for (let i = 0; i < SLICES; i++) { const f = FREE.includes(i); const c = f ? '#ffb020' : (i % 2 ? '#1a1a24' : '#101018'); parts.push(`${c} ${i * 36}deg ${(i + 1) * 36}deg`); }
      disc.style.background = `conic-gradient(${parts.join(',')})`;
      disc.innerHTML = Array.from({ length: SLICES }, (_, i) => { const f = FREE.includes(i); return `<span class="lbl" style="transform:rotate(${i * 36 + 18}deg)"><b>${f ? '🎁' : '✖'}</b><i>${f ? 'кейс' : 'пусто'}</i></span>`; }).join('');
    }
    
    function buildWheel2(){
      const disc = $('#disc2'); if(!disc) return;
      const parts = []; for (let i = 0; i < SLICES; i++) { const isChar = i % 3 === 0; const c = isChar ? '#4da3ff' : (i % 2 ? '#1a1a24' : '#101018'); parts.push(`${c} ${i * 36}deg ${(i + 1) * 36}deg`); }
      disc.style.background = `conic-gradient(${parts.join(',')})`;
      disc.innerHTML = Array.from({ length: SLICES }, (_, i) => { const isChar = i % 3 === 0; return `<span class="lbl" style="transform:rotate(${i * 36 + 18}deg)"><b>${isChar ? '👤' : '✖'}</b><i>${isChar ? 'герой' : 'пусто'}</i></span>`; }).join('');
    }

    function renderRoulette(){
      if (!$('#disc')) return;
      if (!$('#disc').children.length) buildWheel();
      if (!$('#disc2').children.length) buildWheel2();
      
      $('#disc').style.transform = `rotate(${RL.abs}deg)`;
      const btn = $('#spinBtn');
      if(btn) { btn.disabled = RL.spinning; btn.textContent = RL.spinning ? 'Крутим...' : 'Крутить'; }
      
      $('#disc2').style.transform = `rotate(${RL2.abs}deg)`;
      const btn2 = $('#spinBtn2');
      if(btn2) { btn2.disabled = RL2.spinning; btn2.textContent = RL2.spinning ? 'Крутим...' : 'Крутить (★ 7)'; }
    }

    document.querySelectorAll('.rt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.rt-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if(e.currentTarget.dataset.rt === 'daily') { $('#roulette-daily').classList.remove('hidden'); $('#roulette-char').classList.add('hidden'); }
        else { $('#roulette-daily').classList.add('hidden'); $('#roulette-char').classList.remove('hidden'); }
      });
    });

    if ($('#spinBtn')) $('#spinBtn').addEventListener('click', () => {
      if (RL.spinning) return;
      RL.spinning = true;
      const win = rnd(SLICES); const center = win * 36 + 18; const delta = 360 * 6 + ((360 - ((center + RL.abs) % 360)) % 360);
      RL.abs += delta; $('#disc').style.transform = `rotate(${RL.abs}deg)`; renderRoulette();
      setTimeout(() => {
        RL.spinning = false; const hit = FREE.includes(win); renderRoulette();
        if (hit) { playSFX('win'); toast('Бесплатный кейс!'); setTimeout(() => { go('cases'); openCaseDetails('free'); }, 400); }
        else toast('Пусто');
      }, 5100);
    });

    if ($('#spinBtn2')) $('#spinBtn2').addEventListener('click', () => {
      if (RL2.spinning) return;
      if (S.stars < 7) return toast('Нужно ★ 7 для прокрутки');
      S.stars -= 7; S.stat.spinsChar++; RL2.spinning = true; saveState(); renderTop();
      
      const win = rnd(SLICES); const center = win * 36 + 18; const delta = 360 * 6 + ((360 - ((center + RL2.abs) % 360)) % 360);
      RL2.abs += delta; $('#disc2').style.transform = `rotate(${RL2.abs}deg)`; renderRoulette();
      
      setTimeout(() => {
        RL2.spinning = false; renderRoulette();
        const isChar = win % 3 === 0;
        if (isChar) {
          playSFX('win');
          const rar = roll({ epic: 70, legend: 25, mythic: 5 });
          const ch = giveChar(rar);
          addH('Рулетка (Персонажи)', `Выпал: ${ch.n} (${RAR[rar][0]})`, '-7 ★');
          toast(`Выпал: ${ch.n} (${RAR[rar][0]})!`);
        } else {
          addH('Рулетка (Персонажи)', 'Пусто', '-7 ★');
          toast('Пусто. Попробуй еще!');
        }
      }, 5100);
    });

    // ===== НАГРАДЫ (НОВЫЙ ДИЗАЙН) =====
    const ACHIEVEMENTS = [
      { id: 'start', icon: '👋', name: 'Новичок', desc: 'Зашел в бота', reward: 1, check: () => true },
      { id: 'case1', icon: '📦', name: 'Первак', desc: 'Открыл 1 кейс', reward: 1, check: () => S.stat.cases >= 1 },
      { id: 'case10', icon: '🎁', name: 'Лудоман', desc: 'Открыл 10 кейсов', reward: 3, check: () => S.stat.cases >= 10 },
      { id: 'ep1', icon: '🕵️', name: 'Сыщик', desc: 'Прошел Эпизод 1', reward: 2, check: () => S.stat.chapters >= 1 },
      { id: 'ep3', icon: '🔎', name: 'Детектив', desc: 'Прошел Эпизод 3', reward: 5, check: () => S.stat.chapters >= 3 },
      { id: 'spin1', icon: '🎡', name: 'Удачливый', desc: 'Крутил рулетку', reward: 1, check: () => S.stat.spins >= 1 },
      { id: 'hero1', icon: '🦸', name: 'Коллекционер', desc: 'Собрал 1 героя', reward: 1, check: () => S.inv.length >= 1 },
      { id: 'hero5', icon: '🎭', name: 'Фанат', desc: 'Собрал 5 героев', reward: 3, check: () => S.inv.length >= 5 },
      { id: 'hero10', icon: '💎', name: 'Геймер', desc: 'Собрал 10 героев', reward: 5, check: () => S.inv.length >= 10 }
    ];

    function renderAwards() {
      const grid = $('#achGrid'); const sub = $('#awSub'); if (!grid) return;
      const unlocked = ACHIEVEMENTS.filter(a => a.check());
      if (sub) sub.textContent = `${unlocked.length} из ${ACHIEVEMENTS.length}`;
      
      grid.innerHTML = ACHIEVEMENTS.map(a => {
        const isDone = a.check();
        const isEquipped = S.activeBadge === a.id;
        
        return `
          <div class="ach-card ${isDone ? 'done' : 'locked'} ${isEquipped ? 'equipped' : ''}" data-ach="${a.id}">
            <div class="ach-card-icon">${isDone ? a.icon : '🔒'}</div>
            <div class="ach-card-title">${esc(a.name)}</div>
            <div class="ach-card-desc">${esc(a.desc)}</div>
            <div class="ach-card-reward">⭐ +${a.reward}</div>
            ${isDone ? `<button class="ach-card-btn">${isEquipped ? '✓ На аватарке' : 'Надеть'}</button>` : `<div class="ach-card-locked-text">Не получено</div>`}
          </div>
        `;
      }).join('');
    }

    if ($('#achGrid')) $('#achGrid').addEventListener('click', (e) => {
      const card = e.target.closest('.ach-card');
      if (!card || card.classList.contains('locked')) return;
      
      const achId = card.dataset.ach;
      if (S.activeBadge === achId) S.activeBadge = null;
      else S.activeBadge = achId;
      
      saveState();
      renderAwards();
      renderProfile();
      toast(S.activeBadge ? 'Награда надета!' : 'Награда снята');
    });

    // ===== ПРОФИЛЬ И РЕЙТИНГ =====
    function renderProfile(){
      if (!$('#bS')) return;
      $('#bS').textContent = S.stars; 
      $('#bC').textContent = S.inv.length;
      
      const activeAch = ACHIEVEMENTS.find(a => a.id === S.activeBadge);
      const badgeHtml = activeAch ? activeAch.icon : '';
      if ($('#activeBadge')) { $('#activeBadge').textContent = badgeHtml; $('#activeBadge').classList.toggle('hidden', !activeAch); }
      if ($('#activeBadge2')) { $('#activeBadge2').textContent = badgeHtml; $('#activeBadge2').classList.toggle('hidden', !activeAch); }

      const pts = getPoints();
      $('#prof-points').textContent = `${pts} очков`;
      $('#my-points-text').textContent = `${pts} очков`;

      // Рейтинг
      const mockUsers = [
        { name: 'Мила', pts: 540, me: false }, { name: 'Кирилл', pts: 1200, me: false },
        { name: 'Анна', pts: 850, me: false }, { name: 'Тимур', pts: 2100, me: false },
        { name: 'Соня', pts: 320, me: false }, { name: 'Артем', pts: 110, me: false },
        { name: 'Даша', pts: 80, me: false }, { name: 'Егор', pts: 2500, me: false }
      ];
      mockUsers.push({ name: NAME, pts: pts, me: true });
      mockUsers.sort((a, b) => b.pts - a.pts);
      const myRank = mockUsers.findIndex(u => u.me) + 1;
      
      $('#my-rank').textContent = myRank;
      $('#total-users').textContent = mockUsers.length + 42; // Фейковое кол-во людей

      // Сетка персонажей (показываем всех)
      const sortedInv = [...S.inv].sort((a,b) => {
        const ranks = { mythic: 5, legend: 4, epic: 3, rare: 2, common: 1 };
        return ranks[b.r] - ranks[a.r];
      });

      $('#inv').innerHTML = sortedInv.length ? sortedInv.map(i => `
        <div class="pc" style="--c:${RAR[i.r][1]}">
          <div class="cav" style="width:50px;height:50px;overflow:hidden;padding:0;border-radius:50%;">
            ${i.img ? `<img src="${i.img}" style="width:100%;height:100%;object-fit:cover;">` : ''}
          </div>
          <div style="font-size:11px; margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; text-align:center;">${esc(i.n)}</div>
        </div>
      `).join('') : '<div class="sub" style="grid-column:1/-1; text-align:center;">У тебя пока нет персонажей. Открой кейс!</div>';
    }

    if ($('#btn-open-rating')) {
      $('#btn-open-rating').addEventListener('click', () => {
        const list = $('#rating-list');
        const pts = getPoints();
        
        // Фейковые данные
        const users = [
          { name: 'Тимур', pts: 2100, me: false }, { name: 'Кирилл', pts: 1200, me: false },
          { name: 'Анна', pts: 850, me: false }, { name: 'Мила', pts: 540, me: false },
          { name: 'Соня', pts: 320, me: false }, { name: 'Артем', pts: 110, me: false },
          { name: 'Даша', pts: 80, me: false }, { name: 'Егор', pts: 2500, me: false },
          { name: 'Влад', pts: 400, me: false }, { name: 'Максим', pts: 50, me: false }
        ];
        users.push({ name: NAME, pts: pts, me: true });
        users.sort((a, b) => b.pts - a.pts);

        list.innerHTML = users.map((u, i) => `
          <div class="rating-row ${u.me ? 'me' : ''}">
            <div class="rating-pos">${i+1}</div>
            <div class="rating-name">${esc(u.name)} ${u.me ? '(Ты)' : ''}</div>
            <div class="rating-score">${u.pts} очков</div>
          </div>
        `).join('');
        
        $('#modal-rating').classList.remove('hidden');
      });
    }

    function renderTop(){ if($('#cS')) $('#cS').textContent = S.stars; if($('#cC')) $('#cC').textContent = S.coins; }

    // ===== ПОПОЛНЕНИЕ =====
    if ($('#topBtn')) $('#topBtn').addEventListener('click', openTopup);
    function openTopup(){
      const modal = $('#modal'); const sheet = $('#mSheet'); if(!modal || !sheet) return;
      modal.classList.remove('hidden');
      sheet.innerHTML = `<h2>Пополнить звёзды</h2><p class="sub">Оплата проходит внутри Telegram.</p><div class="pre">${[50, 100, 250, 500, 1000].map(n => `<button data-n="${n}">★ ${n}</button>`).join('')}</div><input id="cu" type="number" min="1" max="10000" placeholder="Своя сумма"><button class="btn w" id="pay">Оплатить ★ 250</button><button class="btn g w" id="mClose">Закрыть</button>`;
      let n = 250; const set = v => { n = v; if($('#pay')) $('#pay').textContent = `Оплатить ★ ${n}`; $$('[data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); };
      set(250);
      sheet.addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { if($('#cu')) $('#cu').value = ''; set(+b.dataset.n); } });
      if($('#cu')) $('#cu').addEventListener('input', e => { const v = Math.floor(+e.target.value); if (v >= 1 && v <= 10000) set(v); });
      if($('#pay')) $('#pay').addEventListener('click', () => {
        sheet.innerHTML = `<h2>Подтверждение</h2><p class="sub">Списать ★ ${n}?</p><button class="btn w" id="ok">Подтвердить ★ ${n}</button><button class="btn g w" id="mClose">Отмена</button>`;
        if($('#ok')) $('#ok').addEventListener('click', () => { S.stars += n; S.stat.stars += n; addH('Пополнение', 'Оплата через Telegram', `+${n} ★`); toast(`+${n} ★`); closeModal(); renderTop(); });
        if($('#mClose')) $('#mClose').addEventListener('click', closeModal);
      });
      if($('#mClose')) $('#mClose').addEventListener('click', closeModal);
    }
    function closeModal(){ const m = $('#modal'); if(m) m.classList.add('hidden'); }

    // Закрытие модалок
    $$('.close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.add('hidden');
      });
    });

    // ===== СТАРТ =====
    if($('#nick')) $('#nick').textContent = NAME; if($('#nick2')) $('#nick2').textContent = NAME;
    if($('#av')) $('#av').textContent = NAME[0].toUpperCase(); if($('#av2')) $('#av2').textContent = NAME[0].toUpperCase();
    renderTop();
    renderProfile();
    
  } catch (error) { console.error("Критическая ошибка:", error); }
})();
