() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }

  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const ME = {
    id: tgUser ? String(tgUser.id) : '0',
    name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость',
    photo: tgUser && tgUser.photo_url ? tgUser.photo_url : null
  };

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const RARITY = { common:'#9aa0a6', rare:'#4da3ff', epic:'#b36bff', legend:'#ffb020' };
  const RARITY_RU = { common:'Обычный', rare:'Редкий', epic:'Эпический', legend:'Легендарный' };
  const NAMES = ['Дима','Ксюша','Наташа','Гладенко','Харитонов','Школьник','Буфетчица'];
  const CASE_LIST = [
    { key:'diary', name:'Дневничок', price:'3 ◆', desc:'Для всех, без спешки', odds:'60 / 30 / 9 / 1' },
    { key:'cheat', name:'Шпаргалка', price:'★ 10', desc:'Есть шанс на эпика', odds:'55 / 30 / 12 / 3' },
    { key:'stick', name:'Палочка', price:'★ 13', desc:'Выше шанс на легенду', odds:'45 / 35 / 15 / 5' }
  ];

  // Все запросы передают id и имя в query params (кириллица не идёт в headers)
  const qs = (extra = {}) => new URLSearchParams({ id: ME.id, name: ME.name, ...extra }).toString();

  async function api(path, body) {
    const opts = body
      ? { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...body, id: ME.id, name: ME.name }) }
      : {};
    const res = await fetch(`${path}?${qs()}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Ошибка');
    return data;
  }

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  const fmtWait = ms => {
    const m = Math.ceil(ms / 60000), h = Math.floor(m / 60), mm = m % 60;
    return h ? `${h} ч ${mm} мин` : `${mm} мин`;
  };

  // ---------- ЗАСТАВКА ----------
  const splash = $('#splash');
  splash.addEventListener('click', () => {
    splash.classList.add('open');
    setTimeout(() => { splash.classList.add('gone'); $('#app').classList.add('on'); }, 900);
  });

  // ---------- ШАПКА ----------
  function renderHeader(){
    $('#nick').textContent = ME.name;
    const av = $('#avatar');
    if (ME.photo) av.innerHTML = `<img src="${esc(ME.photo)}" alt="">`;
    else av.textContent = (ME.name[0] || '?').toUpperCase();
  }

  // ---------- ПРОФИЛЬ ----------
  async function loadProfile(){
    const s = await api('/api/profile/stats');
    $('#chipStars').textContent = s.stars;
    $('#bigStars').textContent = s.stars;
    $('#chipCoins').textContent = s.coins.toFixed(1);
    $('#dailyBtn').disabled = !s.canClaim;
    $('#dailyBtn').textContent = s.canClaim ? 'Забрать +0.5 ◆' : `Через ${fmtWait(s.waitMs)}`;
    $('#dailyTxt').textContent = `Серия: ${s.streak} дн.`;
  }

  async function loadTop(){
    const rows = await api('/api/leaderboard');
    $('#top').innerHTML = rows.length
      ? rows.map(r => `<li><span>${esc(r.name)}</span><b>◆ ${Number(r.coins).toFixed(1)}</b></li>`).join('')
      : '<li class="sub">Пока пусто</li>';
  }

  $('#dailyBtn').addEventListener('click', async () => {
    try {
      const r = await api('/api/daily-bonus');
      toast(r.ok ? '+0.5 ◆ начислено' : 'Ещё не время');
      await loadProfile();
    } catch (e) { toast(e.message); }
  });

  // ---------- МОДАЛКИ ----------
  const modal = $('#modal'), body = $('#modalBody');
  const openModal = html => { body.innerHTML = html; modal.classList.remove('hidden'); };
  const closeModal = () => modal.classList.add('hidden');
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Пополнение звёзд
  function openTopup(){
    openModal(`
      <h2>Пополнить звёзды</h2>
      <p class="sub">Оплата внутри Telegram. Звёзды сразу попадут на баланс.</p>
      <div class="presets">${[50,100,250,500,1000].map(n => `<button data-n="${n}">★ ${n}</button>`).join('')}</div>
      <input id="customN" type="number" min="1" max="10000" placeholder="Своя сумма">
      <button class="btn-primary wide" id="payBtn"></button>`);

    let n = 250;
    const setN = v => { n = v; $('#payBtn').textContent = `Оплатить ★ ${n}`; };
    setN(250);
    body.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
      setN(Number(b.dataset.n)); $('#customN').value = '';
    }));
    $('#customN').addEventListener('input', e => {
      const v = Math.floor(Number(e.target.value));
      if (v > 0) setN(v);
    });
    $('#payBtn').addEventListener('click', async () => {
      try {
        const { url } = await api('/api/create-invoice', { stars: n });
        const done = status => {
          if (status === 'paid') {
            toast('Звёзды зачисляются ★');
            closeModal();
            setTimeout(loadProfile, 1500); // даём вебхуку время записать платёж
          }
        };
        if (tg && tg.openInvoice) tg.openInvoice(url, done);
        else window.open(url, '_blank');
      } catch (e) { toast(e.message); }
    });
  }

  // История
  async function openHistory(){
    openModal(`<h2>История</h2><div id="hist" class="list"><div class="sub">Загрузка…</div></div>`);
    const rows = await api('/api/history');
    $('#hist').innerHTML = rows.length ? rows.map(r => `
      <div class="row">
        <div><b>${esc(r.title)}</b><div class="sub">${esc(r.description)}</div></div>
        <div class="amt ${String(r.amount).startsWith('+') ? 'pos' : 'neg'}">
          ${esc(r.amount)}
          <div class="sub">${new Date(r.created_at).toLocaleDateString('ru-RU')}</div>
        </div>
      </div>`).join('') : '<div class="sub">Пока пусто</div>';
  }

  // Мои персонажи
  async function openInventory(){
    const items = await api('/api/inventory');
    openModal(`
      <h2>Мои персонажи</h2>
      <div class="grid">${items.length ? items.map(i => `
        <div class="char" style="--c:${RARITY[i.rarity]}">
          <div class="cav">${esc(i.character_name[0])}</div>
          <b>${esc(i.character_name)}</b>
          <span>${RARITY_RU[i.rarity]}</span>
        </div>`).join('') : '<div class="sub">Пока никого. Открой кейс!</div>'}
      </div>`);
  }

  // Кейсы
  function openCases(){
    openModal(`
      <h2>Кейсы</h2>
      <div class="list">${CASE_LIST.map(c => `
        <div class="case">
          <div>
            <b>${c.name}</b>
            <div class="sub">${c.desc}</div>
            <div class="sub">Шансы %: ${c.odds}</div>
          </div>
          <button class="btn-primary" data-case="${c.key}">${c.price}</button>
        </div>`).join('')}
      </div>
      <div id="reel" class="reel hidden"></div>`);
    body.querySelectorAll('[data-case]').forEach(b =>
      b.addEventListener('click', () => openCase(b.dataset.case)));
  }

  async function openCase(key){
    const reel = $('#reel');
    const btns = body.querySelectorAll('[data-case]');
    reel.classList.remove('hidden');
    btns.forEach(b => b.disabled = true);

    const spin = setInterval(() => {
      reel.textContent = NAMES[Math.floor(Math.random() * NAMES.length)];
    }, 90);

    try {
      const [r] = await Promise.all([
        api('/api/open-case', { caseKey: key }),
        new Promise(res => setTimeout(res, 1600))
      ]);
      clearInterval(spin);
      reel.innerHTML = `
        <div class="win" style="--c:${RARITY[r.rarity]}">
          <div class="cav">${esc(r.character[0])}</div>
          <b>${esc(r.character)}</b>
          <span>${RARITY_RU[r.rarity]}</span>
        </div>`;
      loadProfile();
    } catch (e) {
      clearInterval(spin);
      reel.classList.add('hidden');
      toast(e.message);
    } finally {
      btns.forEach(b => b.disabled = false);
    }
  }

  // Кнопки меню
  const actions = { topup: openTopup, history: openHistory, inventory: openInventory, cases: openCases };
  document.querySelectorAll('[data-open]').forEach(b =>
    b.addEventListener('click', () => actions[b.dataset.open]().catch(e => toast(e.message))));

  // Нижние вкладки: остальные разделы подключим на следующих этапах
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.soon) return toast('Раздел в следующем этапе');
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  }));

  // ---------- СТАРТ ----------
  renderHeader();
  loadProfile().catch(e => toast(e.message));
  loadTop().catch(() => {});
})();
