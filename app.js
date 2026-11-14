(() => {
  // ===== УТИЛИТЫ =====
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  const D = 864e5;
  
  function toast(msg){ const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2500); }
  const run = async fn => { try { await fn(); } catch (e) { toast(e.message); } };

  // ===== TELEGRAM API =====
  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  const INIT = (TG && TG.initData) || '';
  const ME = { name: [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость', username: TGU.username ? '@' + TGU.username : '', photo: TGU.photo_url || '' };

  // ===== ЗВУКИ И ВИБРАЦИЯ =====
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioContext ? new AudioContext() : null;
  document.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });

  function playSound(type) {
    if (!audioCtx) return; 
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'click') { osc.type='sine'; osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(); osc.stop(now + 0.1); }
    else if (type === 'win') { osc.type='triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); osc.start(); osc.stop(now + 0.3); }
    else if (type === 'lose') { osc.type='sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(); osc.stop(now + 0.4); }
    else if (type === 'step') { osc.type='sine'; osc.frequency.setValueAtTime(150, now); gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2); osc.start(); osc.stop(now + 0.2); }
  }
  function playTone(freq) { if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.frequency.value = freq; osc.connect(gain); gain.connect(audioCtx.destination); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5); }
  function vibrate(style = 'light') { if (TG && TG.HapticFeedback) { if (style === 'success') TG.HapticFeedback.notificationOccurred('success'); else if (style === 'error') TG.HapticFeedback.notificationOccurred('error'); else TG.HapticFeedback.impactOccurred(style); } }

  // ===== СОСТОЯНИЕ =====
  const P = { name:'', stars:0, coins:0, points:0, ruch:0, kap:0, joined:Date.now() };
  let INV = [];
  let G = { t: [] }; // Хранилище таймеров игр

  // ===== API =====
  async function api(method, path, body){
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    let url = path; const base = { initData: INIT };
    if (method === 'GET') url += '?' + new URLSearchParams(base).toString();
    else opts.body = JSON.stringify({ ...base, ...(body || {}) });
    const res = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
    return data;
  }

  // ===== ЗАГРУЗКА ПРОФИЛЯ =====
  async function loadProfile() {
    try {
      const p = await api('GET', '/api/profile');
      Object.assign(P, p);
      if ($('#headerStars')) $('#headerStars').textContent = P.stars;
      if ($('#headerCoins')) $('#headerCoins').textContent = Number(P.coins).toFixed(1);
      if ($('#profStars')) $('#profStars').textContent = P.stars;
      if ($('#profCoins')) $('#profCoins').textContent = Number(P.coins).toFixed(1);
      if ($('#detailPoints')) $('#detailPoints').textContent = Number(P.points).toFixed(1);
      
      INV = await api('GET', '/api/inventory');
      if ($('#detailItems')) $('#detailItems').textContent = INV.length;
    } catch (e) { console.error(e); }
  }

  // ===== ИНИЦИАЛИЗАЦИЯ UI =====
  if (TGU.id) {
    if ($('#userName')) $('#userName').textContent = ME.name;
    if ($('#userTag')) $('#userTag').textContent = ME.username;
    if ($('#detailName')) $('#detailName').textContent = ME.name;
    if ($('#detailTag')) $('#detailTag').textContent = ME.username;
    if (ME.photo) {
      if ($('#userAvatar')) $('#userAvatar').style.backgroundImage = `url('${ME.photo}')`;
      if ($('#detailAvatar')) $('#detailAvatar').style.backgroundImage = `url('${ME.photo}')`;
    }
  }

  // ===== ЭДИТЫ =====
  async function renderEdits(){
    const el = $('#screen-edits'); if(!el) return; 
    el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Загрузка эдитов...</div>';
    try {
      const posts = await api('GET', '/api/posts?type=edits');
      if (!posts.length) return el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Эдитов пока нет</div>';
      
      el.innerHTML = `<div class="feed" id="feed">${posts.map(p => `
        <div class="slide">
          ${p.videoUrl ? `<video src="${esc(p.videoUrl)}" playsinline muted loop preload="metadata"></video>` : ''}
          ${p.image && !p.videoUrl ? `<div class="bg-img" style="background-image:url('${esc(p.image)}')"></div>` : ''}
          <div class="shade"></div>
          <div class="overlay">
            <a class="author" href="https://t.me/${encodeURIComponent(p.author)}" target="_blank">@${esc(p.author)}</a>
            <div class="ttl">${esc(p.text.substring(0, 80))}</div>
          </div>
        </div>`).join('')}</div>
        <button class="sound-btn" id="soundBtn">🔇 Звук выкл</button>`;
      
      let soundOn = false; const feed = $('#feed');
      const io = new IntersectionObserver(entries => { 
        entries.forEach(entry => { 
          const video = entry.target.querySelector('video'); 
          if (!video) return; 
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { video.muted = !soundOn; video.play().catch(() => {}); } 
          else { video.pause(); } 
        }); 
      }, { root: feed, threshold: [0.6] });
      
      feed.querySelectorAll('.slide').forEach(s => io.observe(s));
      $('#soundBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл'; feed.querySelectorAll('video').forEach(v => v.muted = !soundOn); });
    } catch { el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#ff1e3c;">Ошибка загрузки</div>'; }
  }

  // ===== НОВОСТИ =====
  async function renderNews(){
    const el = $('#screen-news'); if(!el) return; 
    el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Загрузка новостей...</div>';
    try {
      const items = await api('GET', '/api/posts?type=news');
      el.innerHTML = `<h2 style="font-family:Oswald; font-size:28px; color:#fff; margin-bottom:15px;">Новости</h2>
      ${items.length ? items.map(n => `
        <article class="post">
          ${n.image ? `<img src="${esc(n.image)}">` : ''}
          <div class="body">
            <span class="tag">@${esc(n.author)}</span>
            <p>${esc(n.text)}</p>
          </div>
        </article>`).join('') : '<div style="text-align:center; color:#8b95a5;">Новостей пока нет</div>'}`;
    } catch { el.innerHTML = '<div style="text-align:center; color:#ff1e3c;">Ошибка загрузки</div>'; }
  }

  // ===== ИГРЫ =====
  function playTir(){
    openModal_(`<h2>Тир</h2><div class="arena" id="arena" style="height:300px; position:relative;"><div id="target" style="position:absolute; font-size:50px; transition:all 0.3s; cursor:pointer;" onclick="window.tirHit()">🥫</div></div>`);
    const move = () => { const t = $('#target'); if(t) { t.style.left = (10+Math.random()*70)+'%'; t.style.top = (10+Math.random()*70)+'%'; } };
    move(); G.t.push(setInterval(move, 800));
    window.tirHit = () => { playSound('win'); vibrate('medium'); toast('Попал!'); G.t.forEach(clearInterval); closeModal(); };
  }

  function playBalls(){
    openModal_(`<h2>Лопни шары</h2><div class="arena" id="arena" style="height:300px; position:relative; overflow:hidden;"></div>`);
    G.t.push(setInterval(() => { 
      const a = $('#arena'); if(!a) return; 
      const b = document.createElement('div'); b.textContent = '🎈'; 
      b.style.position = 'absolute'; b.style.left = Math.random()*80+'%'; b.style.bottom = '-50px'; b.style.fontSize = '40px'; b.style.transition = 'bottom 2s linear'; 
      a.appendChild(b); setTimeout(()=>b.style.bottom = '110%', 10); setTimeout(()=>b.remove(), 2000); 
      b.onclick = () => { playSound('win'); vibrate('light'); b.remove(); }; 
    }, 500));
  }

  function playMines(){
    openModal_(`<h2>Сапёр (5 мин)</h2>
      <div class="row" style="margin-bottom:10px">
        <select id="mCur" style="padding:10px; border-radius:12px; background:#15151b; color:#fff; border:1px solid #333; flex:1;">
          <option value="stars">★ Звезды</option><option value="coins">◆ Монеты</option><option value="ruch">✎ Ручки</option>
        </select>
        <input id="mBet" type="number" value="1" min="1" style="width:100px; padding:
