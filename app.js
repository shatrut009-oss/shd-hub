(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M = 6e4, H = 36e5, D = 864e5;
  const fmt = ms => { ms = Math.max(0, ms); const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
  function toast(msg){ const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }
  const run = async fn => { try { await fn(); } catch (e) { toast(e.message); } };

  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  const INIT = (TG && TG.initData) || '';
  const ME = { name: [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость', photo: TGU.photo_url || '' };

  // ЗВУКИ И ВИБРАЦИЯ
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = AudioContext ? new AudioContext() : null;
  document.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
  
  function playSound(type) {
    if (!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
    if (type === 'click') { osc.frequency.setValueAtTime(600, now); gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1); osc.start(); osc.stop(now + 0.1); }
    else if (type === 'win') { osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(800, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3); osc.start(); osc.stop(now + 0.3); }
    else if (type === 'lose') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4); osc.start(); osc.stop(now + 0.4); }
  }
  function playTone(freq) { if(!audioCtx) return; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain(); osc.frequency.value = freq; osc.connect(gain); gain.connect(audioCtx.destination); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5); }
  
  function vibrate(style = 'light') { if (TG && TG.HapticFeedback) { if (style === 'success') TG.HapticFeedback.notificationOccurred('success'); else if (style === 'error') TG.HapticFeedback.notificationOccurred('error'); else TG.HapticFeedback.impactOccurred(style); } }

  // СПРАВОЧНИКИ
  const RAR = { common:['Обычный','#9aa0a6'], rare:['Редкий','#4da3ff'], epic:['Эпический','#b36bff'], legend:['Легендарный','#ffb020'], mythic:['Мифический','#ff3ea5'] };
  const CASE_LIST = [ { k:'diary', name:'Дневничок', cost:3, cur:'coins' }, { k:'cheat', name:'Шпаргалка', cost:10, cur:'stars' }, { k:'stick', name:'Палочка', cost:13, cur:'stars' } ];
  const P = { name:'', stars:0, coins:0, points:0, ruch:0, kap:0, sub:0, dailyAt:0, ruchAt:0, kapAt:0, joined:Date.now(), lvl:{tap:1} };
  let INV = [], LOTS = [], CLAN = null, G = { t: [] };

  async function api(method, path, body){
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    let url = path; const base = { initData: INIT };
    if (method === 'GET') url += '?' + new URLSearchParams(base).toString();
    else opts.body = JSON.stringify({ ...base, ...(body || {}) });
    const r = await fetch(url, opts); const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Ошибка'); return j;
  }

  async function refresh(){ try { const [p, inv] = await Promise.all([ api('GET', '/api/profile'), api('GET', '/api/inventory') ]); Object.assign(P, p); INV = inv; renderAll(); } catch (e) {} }
  const cavHtml = (name, img, rar, big) => `<div class="cav ${big ? 'big' : ''}" style="--c:${RAR[rar][1]}">${img ? `<img src="${esc(img)}" alt="">` : ''}${esc(name[0])}</div>`;

  function renderHeader(){
    if($('#nick')) $('#nick').textContent = ME.name;
    if($('#av')) $('#av').innerHTML = ME.photo ? `<img src="${esc(ME.photo)}" alt="">` : esc(ME.name[0].toUpperCase());
    if($('#cS')) $('#cS').textContent = P.stars;
    if($('#cC')) $('#cC').textContent = Number(P.coins).toFixed(1);
    if($('#cR')) $('#cR').textContent = P.ruch;
  }

  // ===== ЭДИТЫ И НОВОСТИ =====
  async function renderEdits(){
    const el = $('#sc-edits'); if(!el) return; el.innerHTML = '<div class="sub" style="text-align:center;margin-top:20px">Загрузка эдитов...</div>';
    try {
      const posts = await api('GET', '/api/posts?type=edits');
      if (!posts.length) return el.innerHTML = '<div class="sub" style="text-align:center;margin-top:20px">Эдитов пока нет</div>';
      el.innerHTML = `<div class="feed" id="feed">${posts.map(p => `
        <div class="slide">${p.videoUrl ? `<video src="${esc(p.videoUrl)}" playsinline muted loop preload="metadata"></video>` : ''}${p.image && !p.videoUrl ? `<div class="bg-img" style="background-image:url('${esc(p.image)}')"></div>` : ''}<div class="shade"></div><div class="overlay"><a class="author" href="https://t.me/${encodeURIComponent(p.author)}" target="_blank">@${esc(p.author)}</a><div class="ttl">${esc(p.text.substring(0, 80))}</div></div></div>`).join('')}</div><button class="sound-btn" id="soundBtn">🔇 Звук выкл</button>`;
      let soundOn = false; const feed = $('#feed');
      const io = new IntersectionObserver(entries => { entries.forEach(entry => { const video = entry.target.querySelector('video'); if (!video) return; if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { video.muted = !soundOn; video.play().catch(() => {}); } else { video.pause(); } }); }, { root: feed, threshold: [0.6] });
      feed.querySelectorAll('.slide').forEach(s => io.observe(s));
      $('#soundBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл'; feed.querySelectorAll('video').forEach(v => v.muted = !soundOn); });
    } catch { el.innerHTML = '<div class="sub" style="text-align:center;margin-top:20px">Ошибка загрузки</div>'; }
  }

  async function renderNews(){
    const el = $('#sc-news'); if(!el) return; el.innerHTML = '<div class="sub" style="text-align:center;margin-top:20px">Загрузка новостей...</div>';
    try {
      const items = await api('GET', '/api/posts?type=news');
      el.innerHTML = `<h2>Новости</h2>${items.length ? items.map(n => `<article class="post">${n.image ? `<img src="${esc(n.image)}">` : ''}<div class="body"><span class="tag">@${esc(n.author)}</span><p>${esc(n.text)}</p></div></article>`).join('') : '<div class="sub">Новостей пока нет</div>'}`;
    } catch { el.innerHTML = '<div class="sub">Ошибка загрузки</div>'; }
  }

  function renderHome(){
    const el = $('#sc-home'); if(!el) return;
    el.innerHTML = `<div class="col">
      <div class="card row"><div><div class="lab">Баланс звёзд</div><div class="big">★ ${P.stars}</div></div><button class="btn" data-a="topup">+ Пополнить</button></div>
      <div class="grid3">
        <button class="tile" data-a="passport"><span class="ico">🪪</span>Паспорт</button>
        <button class="tile" data-a="coll"><span class="ico">🎭</span>Коллекция</button>
        <button class="tile" data-a="cases"><span class="ico">🎁</span>Кейсы</button>
        <button class="tile" data-a="rating"><span class="ico">🏆</span>Рейтинг</button>
        <button class="tile" data-a="kap"><span class="ico">💧</span>Капельки</button>
        <button class="tile" data-tab="clan"><span class="ico">🛡</span>Кланы</button>
      </div>
      <div class="card col"><div class="lab">Заработать</div><div class="row"><div><b>Ежедневный кейс</b></div><button class="btn sm" data-cd="daily" data-label="Открыть" data-a="daily">Открыть</button></div><div class="row"><div><b>Ручки</b></div><button class="btn sm" data-cd="ruch" data-label="Получить" data-a="ruch">Получить</button></div></div>
    </div>`;
  }

  function renderGames(){
    const el = $('#sc-games'); if(!el) return;
    el.innerHTML = `<h2>Игровая зона</h2><div class="col">
      <div class="card row"><div><b>🎯 Тир</b><div class="sub">Стреляй по банкам</div></div><button class="btn sm" data-a="gameTir">Играть</button></div>
      <div class="card row"><div><b>🎈 Шарики</b><div class="sub">Лопай шары</div></div><button class="btn sm" data-a="gameBalls">Играть</button></div>
      <div class="card row"><div><b>💣 Сапёр</b><div class="sub">Ставки и коэффициенты</div></div><button class="btn sm" data-a="gameMines">Играть</button></div>
      <div class="card row"><div><b>🪙 Монетка</b><div class="sub">Орёл или Решка</div></div><button class="btn sm" data-a="gameCoin">Играть</button></div>
      <div class="card row"><div><b>🏠 Прятки с мамой</b><div class="sub">Успей сделать уроки</div></div><button class="btn sm" data-a="gameMom">Играть</button></div>
      <div class="card row"><div><b>🎸 Гитара</b><div class="sub">Просто играй</div></div><button class="btn sm" data-a="gameGuitar">Играть</button></div>
    </div>`;
  }

  // ИГРЫ ЛОГИКА
  function playTir(){
    openModal_(`<h2>Тир</h2><div class="arena" id="arena" style="height:300px; position:relative;"><div id="target" style="position:absolute; font-size:50px; transition:all 0.3s; cursor:pointer;" onclick="window.tirHit()">🥫</div></div>`);
    const move = () => { const t = $('#target'); if(t) { t.style.left = (10+Math.random()*70)+'%'; t.style.top = (10+Math.random()*70)+'%'; } };
    move(); G.t.push(setInterval(move, 800));
    window.tirHit = () => { playSound('win'); vibrate('medium'); toast('Попал!'); G.t.forEach(clearInterval); closeModal(); };
  }
  function playBalls(){
    openModal_(`<h2>Лопни шары</h2><div class="arena" id="arena" style="height:300px; position:relative;"></div>`);
    G.t.push(setInterval(() => { const a = $('#arena'); if(!a) return; const b = document.createElement('div'); b.textContent = '🎈'; b.style.position = 'absolute'; b.style.left = Math.random()*80+'%'; b.style.bottom = '-50px'; b.style.fontSize = '40px'; b.style.transition = 'bottom 2s linear'; a.appendChild(b); setTimeout(()=>b.style.bottom = '110%', 10); setTimeout(()=>b.remove(), 2000); b.onclick = () => { playSound('win'); vibrate('light'); b.remove(); }; }, 500));
  }
  function playMines(){
    openModal_(`<h2>Сапёр (5 мин)</h2><div class="row" style="margin-bottom:10px"><select id="mCur" style="padding:5px; border-radius:5px; background:#15151b; color:#fff; border:1px solid #333"><option value="stars">★ Звезды</option><option value="coins">◆ Монеты</option><option value="ruch">✎ Ручки</option></select><input id="mBet" type="number" value="1" style="width:60px; padding:5px; border-radius:5px; background:#15151b; color:#fff; border:1px solid #333"></div><button class="btn w" onclick="window.startMines()">Начать игру</button><div id="mGrid" style="display:grid; grid-template-columns:repeat(5,1fr); gap:5px; margin-top:15px;"></div>`);
    window.startMines = async () => {
      const bet = +$('#mBet').value; const cur = $('#mCur').value;
      if(bet < 1) return toast('Мин. ставка 1');
      try {
        await api('POST', '/api/games/mines/start', { bet, cur });
        $('#mGrid').innerHTML = Array.from({length:25}).map((_, i) => `<div style="background:#15151b; height:50px; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:20px;" onclick="window.clickMine(${i})">?</div>`).join('');
        $('#mGrid').insertAdjacentHTML('afterend', `<button class="btn w" style="margin-top:15px" onclick="window.cashoutMines()">Забрать выигрыш</button>`);
        vibrate('success');
      } catch(e) { toast(e.message); }
    };
    window.clickMine = async (idx) => {
      try {
        const r = await api('POST', '/api/games/mines/click', { index: idx });
        const grid = $('#mGrid');
        if(r.lost) { grid.innerHTML = Array.from({length:25}).map((_, i) => `<div style="background:${r.mines.includes(i) ? '#ff1e3c' : '#15151b'}; height:50px; border-radius:10px; display:flex; align-items:center; justify-content:center;">${r.mines.includes(i) ? '💣' : ''}</div>`).join(''); playSound('lose'); vibrate('error'); setTimeout(closeModal, 2000); }
        else { grid.children[idx].style.background = '#4ade80'; grid.children[idx].textContent = '💎'; playSound('win'); vibrate('light'); toast(`Коэф: x${r.mult}`); }
      } catch(e) { toast(e.message); }
    };
    window.cashoutMines = async () => { try { const r = await api('POST', '/api/games/mines/cashout'); toast(`Выигрыш: +${r.win}`); playSound('win'); vibrate('success'); closeModal(); refresh(); } catch(e) { toast(e.message); } };
  }
  function playCoin(){
    openModal_(`<h2>Монетка</h2><div class="row" style="margin-bottom:10px"><select id="cCur" style="padding:5px; border-radius:5px; background:#15151b; color:#fff; border:1px solid #333"><option value="stars">★ Звезды</option><option value="coins">◆ Монеты</option><option value="ruch">✎ Ручки</option></select><input id="cBet" type="number" value="1" style="width:60px; padding:5px; border-radius:5px; background:#15151b; color:#fff; border:1px solid #333"></div><div class="row" style="gap:10px;"><button class="btn" style="flex:1" onclick="window.flipCoin('heads')">Орёл</button><button class="btn" style="flex:1" onclick="window.flipCoin('tails')">Решка</button></div><div id="coinRes" style="text-align:center; font-size:50px; margin-top:20px;"></div>`);
    window.flipCoin = async (choice) => {
      const bet = +$('#cBet').value; const cur = $('#cCur').value;
      try { const r = await api('POST', '/api/games/coinflip', { bet, cur, choice }); $('#coinRes').textContent = r.result === 'heads' ? '🦅' : '👑'; if(r.win) { playSound('win'); vibrate('success'); toast('Ты выиграл!'); refresh(); } else { playSound('lose'); vibrate('error'); toast('Проиграл'); } } catch(e) { toast(e.message); }
    };
  }
  function playGuitar(){
    openModal_(`<h2>Гитара</h2><div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">${[1,2,3,4,5,6].map(n => `<div style="height:30px; background:#333; border-radius:15px; border-top:2px solid #777;" onclick="window.strum(${200+n*50})"></div>`).join('')}</div><div class="sub" style="text-align:center;margin-top:10px">Нажимай на струны</div>`);
    window.strum = (freq) => { playTone(freq); vibrate('light'); };
  }
  function playMom(){
    openModal_(`<h2>Прятки с мамой</h2><div style="text-align:center; font-size:50px; margin:20px 0;" id="momFace">👩</div><button class="btn w" id="doHw" style="background:#4ade80; color:#000;">ДЕЛАТЬ УРОКИ</button><div class="sub" style="text-align:center; margin-top:10px;">Зажми кнопку, чтобы играть. Отпусти — чтобы делать уроки.</div>`);
    let isPlaying = false; const hwBtn = $('#doHw');
    hwBtn.addEventListener('pointerdown', () => { isPlaying = false; hwBtn.textContent = '📚 ДЕЛАЮ УРОКИ...'; });
    hwBtn.addEventListener('pointerup', () => { isPlaying = true; hwBtn.textContent = '🎮 ИГРАЮ В КОМП...'; });
    const momInterval = setInterval(() => {
      const mom = $('#momFace'); if(!mom) { clearInterval(momInterval); return; }
      mom.style.transform = `translateX(${Math.random()*200-100}px)`;
      if(Math.random() > 0.8) {
        if(isPlaying) { clearInterval(momInterval); playSound('lose'); vibrate('error'); mom.textContent = '😡'; toast('Мама спалила!'); setTimeout(closeModal, 2000); }
        else { playSound('win'); mom.textContent = '👩‍🦱'; }
      }
    }, 1000);
    G.t.push(momInterval);
  }

  function renderAll(){ renderHeader(); renderHome(); renderGames(); }

  const modal = $('#modal'), mb = $('#mBody');
  function openModal_(html){ if(mb && modal) { mb.innerHTML = html; modal.classList.remove('hidden'); } }
  function closeModal(){ G.t.forEach(clearInterval); G = { t: [] }; if (modal) modal.classList.add('hidden'); }
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  const ACT = {
    close: () => closeModal(), topup: () => openModal_(`<h2>Пополнить</h2>`), passport: () => toast('Паспорт'), coll: () => toast('Коллекция'), cases: () => toast('Кейсы'), rating: () => toast('Рейтинг'), kap: () => toast('Капельки'),
    gameTir: () => playTir(), gameBalls: () => playBalls(), gameMines: () => playMines(), gameCoin: () => playCoin(), gameGuitar: () => playGuitar(), gameMom: () => playMom()
  };

  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { vibrate('light'); playSound('click'); const t = tab.dataset.tab; $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); $$('.screen').forEach(s => s.classList.toggle('on', s.id === 'sc-' + t)); if (t === 'edits') renderEdits(); if (t === 'news') renderNews(); return; }
    const el = e.target.closest('[data-a]');
    if (el && ACT[el.dataset.a] && !el.disabled) { vibrate('light'); playSound('click'); ACT[el.dataset.a](el); }
  });

  const splashEl = $('#splash');
  if (splashEl) splashEl.addEventListener('click', () => { splashEl.classList.add('open'); setTimeout(() => { splashEl.classList.add('gone'); $('#app').classList.add('on'); renderEdits(); renderAll(); run(refresh); }, 900); });
  setTimeout(() => { if ($('#splash')) { $('#splash').classList.add('gone'); $('#app').classList.add('on'); } renderEdits(); renderAll(); run(refresh); }, 2000);
})();
