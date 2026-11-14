() => {
  // ===== утилиты =====
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M = 60000, H = 3600000, D = 86400000;

  function fmt(ms){
    ms = Math.max(0, ms);
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h) return h + ' ч ' + (m % 60) + ' мин';
    return String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  async function run(fn){
    try { await fn(); } catch (e) { toast(e.message); }
  }

  // ===== Telegram и пользователь =====
  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  const INIT = (TG && TG.initData) || '';
  const DEV = new URLSearchParams(location.search).get('dev') || '';
  const ME = {
    name: [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || (DEV ? 'Dev ' + DEV : 'Гость'),
    photo: TGU.photo_url || ''
  };

  // ===== справочники для отображения =====
  const RAR = {
    common: ['Обычный', '#9aa0a6'],
    rare: ['Редкий', '#4da3ff'],
    epic: ['Эпический', '#b36bff'],
    legend: ['Легендарный', '#ffb020'],
    mythic: ['Мифический', '#ff3ea5']
  };
  const BASE = { common: 60, rare: 28, epic: 9, legend: 2.5, mythic: 0.5 };
  const COUNT = { common: 5, rare: 5, epic: 6, legend: 6, mythic: 4 };
  const CASE_LIST = [
    { k: 'diary', name: 'Дневничок', cost: 3, cur: 'coins', coin: 2 },
    { k: 'cheat', name: 'Шпаргалка', cost: 10, cur: 'stars', coin: 1 },
    { k: 'stick', name: 'Палочка', cost: 13, cur: 'stars', coin: 1 }
  ];
  const MAZKI = [
    { id: 'm1', n: 'Обычная', ruch: 300, p: 5 },
    { id: 'm2', n: 'Редкая', ruch: 1000, stars: 15, p: 20 },
    { id: 'm3', n: 'Эпическая', ruch: 3000, stars: 40, p: 60 }
  ];
  const RIVALS = [
    { n: 'Гладенковцы', t: 5200 },
    { n: 'Наташины', t: 3100 },
    { n: 'Харитоновы', t: 900 }
  ];
  const POOL_NAMES = ['Саша', 'Марина', 'Никита', 'Лена', 'Игорь'];
  const NEWS = [
    { id: 'n1', src: 'Школьный Дневник', t: 'Новая серия выйдет в пятницу', x: 'Дата премьеры подтверждена. Следите за обновлениями.', ts: Date.parse('2026-11-14T10:00'), l: 124 },
    { id: 'n2', src: 'Руслан Гладенко', t: 'Актёр ответил на главную теорию', x: 'В интервью он намекнул, что одна из версий ближе к истине.', ts: Date.parse('2026-11-13T18:30'), l: 310 },
    { id: 'n3', src: 'Школьный Дневник', t: 'Фото со съёмок павильона Б', x: 'Эксклюзивный кадр с площадки.', ts: Date.parse('2026-11-10T12:00'), l: 88 },
    { id: 'n4', src: 'Руслан Гладенко', t: 'Что будет в финале сезона', x: 'Коротко о планах на следующий сезон.', ts: Date.parse('2026-11-08T09:00'), l: 57 }
  ];

  // ===== состояние: баланс, персонажи и лотереи приходят с сервера =====
  const P = { name: '', stars: 0, coins: 0, points: 0, ruch: 0, kap: 0, sub: 0, dailyAt: 0, ruchAt: 0, kapAt: 0, dropAt: 0, bestDrop: 0, joined: Date.now(), lvl: { tap: 1 } };
  let INV = [];
  let LOTS = [];
  let LT = 'active';
  let CLAN = null;
  const NL = {};
  let G = { t: [] };
  let lastLotRefresh = 0;

  const CD = {
    daily: () => P.dailyAt + D,
    ruch: () => P.ruchAt + H,
    kap: () => P.kapAt + 10 * M,
    drop: () => P.dropAt + M
  };
  function cdLeft(k){ return Math.max(0, CD[k]() - Date.now()); }

  // ===== запросы к серверу =====
  async function api(method, path, body){
    const base = { initData: INIT, dev: DEV };
    const opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    let url = path;
    if (method === 'GET') {
      url += '?' + new URLSearchParams(base).toString();
    } else {
      opts.body = JSON.stringify(Object.assign({}, base, body || {}));
    }
    const r = await fetch(url, opts);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Ошибка сервера');
    return j;
  }

  async function refresh(){
    const results = await Promise.all([
      api('GET', '/api/profile'),
      api('GET', '/api/inventory'),
      api('GET', '/api/lotteries')
    ]);
    Object.assign(P, results[0]);
    INV = results[1];
    LOTS = results[2];
    renderAll();
  }

  // ===== картинка персонажа =====
  function cavHtml(name, img, rar, big){
    const cls = big ? 'cav big' : 'cav';
    const pic = img ? '<img src="' + esc(img) + '" alt="" onerror="this.remove()">' : '';
    return '<div class="' + cls + '" style="--c:' + RAR[rar][1] + '">' + pic + esc(name[0]) + '</div>';
  }

  function cdBtn(k, label, act){
    return '<button class="btn sm" data-cd="' + k + '" data-label="' + label + '" data-a="' + act + '">' + label + '</button>';
  }

  // ===== шапка =====
  function renderHeader(){
    $('#nick').textContent = ME.name;
    $('#av').innerHTML = ME.photo ? '<img src="' + esc(ME.photo) + '" alt="">' : esc(ME.name[0].toUpperCase());
    $('#cS').textContent = P.stars;
    $('#cC').textContent = Number(P.coins).toFixed(1);
    $('#cR').textContent = P.ruch;
  }

  // ===== ПРОФИЛЬ =====
  function renderHome(){
    const clanTxt = CLAN ? '<small class="sub">' + esc(CLAN.name) + '</small>' : '';
    $('#sc-home').innerHTML =
      '<div class="col">' +
        '<div class="card row">' +
          '<div><div class="lab">Баланс звёзд</div><div class="big">★ ' + P.stars + '</div></div>' +
          '<button class="btn" data-a="topup">+ Пополнить</button>' +
        '</div>' +
        '<div class="grid3">' +
          '<button class="tile" data-a="passport"><span class="ico">🪪</span>Паспорт</button>' +
          '<button class="tile" data-a="coll"><span class="ico">🎭</span>Коллекция<small class="sub">' + INV.length + ' шт.</small></button>' +
          '<button class="tile" data-a="cases"><span class="ico">🎁</span>Кейсы</button>' +
          '<button class="tile" data-a="rating"><span class="ico">🏆</span>Рейтинг<small class="sub">' + Number(P.points).toFixed(1) + ' очк.</small></button>' +
          '<button class="tile" data-a="kap"><span class="dot">4 279 играют</span><span class="ico">💧</span>Капельки</button>' +
          '<button class="tile" data-tab="clan"><span class="ico">🛡</span>Кланы' + clanTxt + '</button>' +
        '</div>' +
        '<div class="card col">' +
          '<div class="lab">Заработать</div>' +
          '<div class="row"><div><b>Ежедневный кейс</b><div class="sub">Бесплатно раз в 24 часа</div></div>' + cdBtn('daily', 'Открыть', 'daily') + '</div>' +
          '<div class="row"><div><b>Ручки</b><div class="sub">Раз в час, от 5 до 25 ✎</div></div>' + cdBtn('ruch', 'Получить', 'ruch') + '</div>' +
          '<div class="row"><div><b>Игры</b><div class="sub">Награды в ✎ за уровни и забеги</div></div><button class="btn sm g" data-tab="games">Играть</button></div>' +
        '</div>' +
      '</div>';
  }

  function passportView(){
    const days = Math.floor((Date.now() - P.joined) / D);
    return '<h2>Паспорт</h2>' +
      '<div class="list">' +
        '<div class="item"><div class="grow">В боте</div><b>' + days + ' дн.</b></div>' +
        '<div class="item"><div class="grow">Сообщений в чате</div><b>появится с ботом</b></div>' +
        '<div class="item"><div class="grow">Персонажей в коллекции</div><b>' + INV.length + '</b></div>' +
      '</div>' +
      '<div class="card" style="text-align:center"><div class="lab">Ручек сейчас</div><div class="big" style="color:var(--ruch)">' + P.ruch + ' ✎</div></div>';
  }

  function collView(){
    const rates = Object.keys(RAR).map(r =>
      '<div class="item"><div class="grow" style="color:' + RAR[r][1] + '">' + RAR[r][0] + '</div><b>' + (BASE[r] / COUNT[r]).toFixed(2) + '% у каждого</b></div>'
    ).join('');
    const items = INV.length
      ? INV.map(c =>
          '<div class="item">' + cavHtml(c.name, c.img, c.rar) +
          '<div class="grow"><b>' + esc(c.name) + '</b><div class="sub">№' + c.tir + ' · фон: ' + esc(c.bg) + '</div></div>' +
          '<span class="tag" style="color:' + RAR[c.rar][1] + '">' + RAR[c.rar][0] + '</span></div>'
        ).join('')
      : '<div class="sub">Пока пусто. Открой кейс!</div>';
    return '<h2>Коллекция</h2>' +
      '<p class="sub">Шанс у каждого персонажа в процентах. Чем реже редкость, тем выше очки рейтинга. Персонажи живут только в боте.</p>' +
      '<div class="card"><div class="lab">Шанс у каждого персонажа</div>' +
        '<div class="list" style="margin-top:8px">' + rates + '</div>' +
        '<div class="sub" style="margin-top:8px">Фон: Без фона 60% · Дневник 25% · Школа ночью 12% · Неон 3%</div>' +
      '</div>' +
      '<div class="lab">Мои персонажи (' + INV.length + ')</div>' +
      '<div class="list">' + items + '</div>';
  }

  function casesView(){
    const rows = CASE_LIST.map(c =>
      '<div class="item"><div class="grow"><b>' + c.name + '</b>' +
      '<div class="sub">' + (c.cur === 'stars' ? '★' : '◆') + ' ' + c.cost + ' · монета ' + c.coin + '% · персонажи ' + (100 - c.coin).toFixed(1) + '%</div></div>' +
      '<button class="btn sm" data-a="open" data-k="' + c.k + '">Открыть</button></div>'
    ).join('');
    return '<h2>Кейсы</h2>' +
      '<p class="sub">Внутри кейса могут выпасть персонажи или монета актива (маленький шанс).</p>' +
      '<div class="list">' + rows + '</div>' +
      '<div id="stage" class="stage" style="margin-top:12px">Выбери кейс</div>';
  }

  function ratingView(){
    const rows = [
      { n: 'Наташа-фанатка', p: 420 },
      { n: 'Гладенко', p: 310 },
      { n: 'Ксюша', p: 180 },
      { n: 'Саша', p: 55 },
      { n: ME.name, p: Number(P.points), me: true }
    ].sort((a, b) => b.p - a.p);
    const place = rows.findIndex(r => r.me) + 1;
    const list = rows.map((r, i) =>
      '<div class="item"><b style="width:24px">' + (i + 1) + '</b><div class="grow">' + esc(r.n) + '</div><b>' + r.p.toFixed(1) + '</b></div>'
    ).join('');
    return '<h2>Рейтинг</h2>' +
      '<div class="card row"><div><div class="lab">Твоё место</div><div class="big">' + place + ' <span class="sub">из ' + rows.length + '</span></div></div>' +
      '<div style="text-align:right"><div class="lab">Очков</div><div class="big">' + Number(P.points).toFixed(1) + '</div></div></div>' +
      '<p class="sub">Остальные строки пока демонстрационные.</p>' +
      '<div class="list">' + list + '</div>';
  }

  function kapView(){
    const subOn = P.sub > Date.now();
    const subTxt = subOn ? 'Действует ещё ' + Math.ceil((P.sub - Date.now()) / D) + ' дн.' : '30 дней, ★ 14';
    return '<h2>Капельки</h2>' +
      '<div class="card row"><div><div class="lab">Капелек</div><div class="big">💧 ' + P.kap + '</div></div>' + cdBtn('kap', 'Получить', 'kapget') + '</div>' +
      '<p class="sub">Раз в 10 минут. ' + (subOn ? 'Подписка активна: капельки ×2.' : 'С подпиской капельки ×2.') + '</p>' +
      '<div class="card row"><div><b>Подписка</b><div class="sub">' + subTxt + '</div></div>' +
        '<button class="btn sm" data-a="sub">' + (subOn ? 'Продлить' : 'Оформить') + '</button></div>' +
      '<div class="card col">' +
        '<div class="lab">Обмен</div>' +
        '<div class="row"><div><b>На монету актива</b><div class="sub">100 💧 = ◆ 1</div></div>' +
          '<button class="btn sm" data-a="exCoin"' + (P.kap < 100 ? ' disabled' : '') + '>Обменять</button></div>' +
        '<div class="row"><div><b>На ручки</b><div class="sub">100 💧 = 150 ✎. Остаток меньше 100 — 1 к 1</div></div>' +
          '<button class="btn sm" data-a="exRuch"' + (P.kap < 1 ? ' disabled' : '') + '>Обменять</button></div>' +
      '</div>';
  }

  // ===== НОВОСТИ =====
  function renderNews(){
    const sorted = NEWS.slice().sort((a, b) => b.ts - a.ts);
    const posts = sorted.map(n => {
      const on = !!NL[n.id];
      const date = new Date(n.ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      return '<article class="post">' +
        '<div class="src">' + esc(n.src) + '</div>' +
        '<h3>' + esc(n.t) + '</h3><p>' + esc(n.x) + '</p>' +
        '<div class="m"><span>' + date + '</span>' +
        '<button class="lk ' + (on ? 'on' : '') + '" data-a="nl" data-id="' + n.id + '">♥ ' + (n.l + (on ? 1 : 0)) + '</button></div>' +
        '</article>';
    }).join('');
    $('#sc-news').innerHTML = '<h2>Новости</h2><p class="sub" style="margin-bottom:12px">Свежие сверху. Лайки можно ставить под каждым постом.</p>' + posts;
  }

  // ===== ИГРЫ =====
  function renderGames(){
    $('#sc-games').innerHTML =
      '<h2>Игры</h2>' +
      '<p class="sub" style="margin-bottom:12px">Игры без конца: уровни идут дальше, сложность растёт. Награда в ✎.</p>' +
      '<div class="col">' +
        '<div class="card row"><div><b>Табаска</b><div class="sub">Уровень ' + P.lvl.tap + ' · цель ' + (4 + 2 * P.lvl.tap) + ' попаданий за ' + (8 + P.lvl.tap) + ' сек</div></div>' +
          '<button class="btn sm" data-a="gameTap">Играть</button></div>' +
        '<div class="card row"><div><b>Ловля капелек</b><div class="sub">Рекорд: ' + P.bestDrop + ' · раз в минуту · до 100 ✎</div></div>' +
          '<button class="btn sm" data-cd="drop" data-label="Играть" data-a="gameDrop">Играть</button></div>' +
      '</div>';
  }

  function playTap(){
    const lv = P.lvl.tap;
    const need = 4 + 2 * lv;
    const time = 8 + lv;
    G = { t: [], type: 'tap', lv: lv, need: need, hits: 0, left: time };
    openModal_('<h2>Табаска · ур. ' + lv + '</h2>' +
      '<p class="sub">Поймай персонажа ' + need + ' раз за ' + time + ' сек</p>' +
      '<div class="arena"><button class="tgt cav" style="--c:#ffb020" data-a="tgt" id="tgt">T</button></div>' +
      '<div class="sub" id="gs">Попаданий: 0/' + need + ' · осталось ' + time + ' с</div>');
    moveTarget();
    G.t.push(setInterval(moveTarget, Math.max(250, 900 - lv * 20)));
    G.t.push(setInterval(() => {
      G.left -= 0.1;
      const gs = $('#gs');
      if (gs) gs.textContent = 'Попаданий: ' + G.hits + '/' + G.need + ' · осталось ' + Math.max(0, Math.ceil(G.left)) + ' с';
      if (G.left <= 0) { closeModal(); toast('Время вышло. Попробуй ещё раз'); }
    }, 100));
  }

  function moveTarget(){
    const t = $('#tgt');
    if (!t) return;
    t.style.left = (15 + Math.random() * 70) + '%';
    t.style.top = (15 + Math.random() * 70) + '%';
  }

  async function winTap(){
    const lv = G.lv;
    closeModal();
    await run(async () => {
      const r = await api('POST', '/api/game/tap', { level: lv });
      toast('Уровень ' + lv + ' пройден! Следующий: ' + r.level);
      await refresh();
    });
  }

  function playDrop(){
    G = { t: [], type: 'drop', score: 0, lives: 3, drops: [] };
    openModal_('<h2>Ловля капелек</h2>' +
      '<p class="sub">Лови капли, пока они не упали. Три промаха — конец забега.</p>' +
      '<div class="arena" id="arena"></div>' +
      '<div class="sub" id="gs"></div>');
    updateDrop();
    G.t.push(setInterval(spawnDrop, Math.max(350, 900 - G.score * 8)));
    G.t.push(setInterval(stepDrops, 50));
  }

  function spawnDrop(){
    const a = $('#arena');
    if (!a || G.lives <= 0) return;
    const d = document.createElement('button');
    d.className = 'drop';
    d.textContent = '💧';
    d.style.left = (5 + Math.random() * 85) + '%';
    d.style.top = '-8%';
    d.dataset.a = 'catchDrop';
    a.appendChild(d);
    G.drops.push({ el: d, y: -8 });
  }

  function stepDrops(){
    if (!$('#arena') || G.lives <= 0) return;
    G.drops = G.drops.filter(d => {
      d.y += 1.2 + G.score * 0.02;
      d.el.style.top = d.y + '%';
      if (d.y > 92) {
        d.el.remove();
        G.lives--;
        updateDrop();
        return false;
      }
      return true;
    });
    if (G.lives <= 0) endDrop();
  }

  function updateDrop(){
    const gs = $('#gs');
    if (gs) gs.textContent = 'Счёт: ' + G.score + ' · жизни: ' + '❤'.repeat(Math.max(0, G.lives));
  }

  function endDrop(){
    const score = G.score;
    closeModal();
    run(async () => {
      const r = await api('POST', '/api/game/drop', { score: score });
      toast('Забег окончен · счёт ' + score + ' · +' + r.gain + ' ✎');
      await refresh();
    });
  }

  // ===== ЛОТЕРЕЯ =====
  function lotCard(l){
    const top = l.draw
      ? '<span class="sub">Завершена</span>'
      : '<span class="sub" data-end="' + l.id + '">' + fmt(l.ends - Date.now()) + '</span>';
    let winner = '';
    if (l.draw) {
      winner = '<div class="sub" style="color:var(--star)">Победитель: ' + esc(l.draw.name) +
        (l.draw.isMe ? ' 🎉 персонаж в коллекции' : '') + '</div>';
    }
    const buy = l.draw ? '' :
      '<button class="btn w" style="margin-top:12px" data-a="lotBuy" data-id="' + l.id + '">Купить билет · ★ 2</button>';
    return '<div class="lot" style="margin-bottom:12px">' +
      '<div class="row"><span class="tag" style="color:' + RAR[l.rar][1] + '">' + RAR[l.rar][0] + '</span>' + top + '</div>' +
      '<div class="row" style="margin-top:10px">' + cavHtml(l.prize, l.img, l.rar, true) +
        '<div style="flex:1;min-width:0"><b>' + esc(l.prize) + '</b>' +
        '<div class="sub">Билет ★ 2 · больше билетов — выше шанс</div>' +
        '<div class="sub">Продано: ' + l.sold + ' · твоих билетов: ' + l.mine + '</div>' +
        winner + '</div></div>' +
      buy + '</div>';
  }

  function renderLot(){
    let items;
    if (LT === 'active') items = LOTS.filter(l => !l.draw);
    else if (LT === 'mine') items = LOTS.filter(l => l.mine > 0);
    else items = LOTS.filter(l => l.draw);
    const empty = { active: 'Активных лотерей нет', mine: 'Вы ещё не участвовали', done: 'Итогов пока нет' }[LT];
    const list = items.length ? items.map(lotCard).join('') : '<div class="sub">' + empty + '</div>';
    $('#sc-lot').innerHTML =
      '<h2>Лотерея</h2>' +
      '<p class="sub" style="margin-bottom:10px">Розыгрыш персонажа. Победитель получает персонажа сразу в коллекцию.</p>' +
      '<div class="seg">' +
        '<button class="' + (LT === 'active' ? 'on' : '') + '" data-a="lt" data-v="active">Активные</button>' +
        '<button class="' + (LT === 'mine' ? 'on' : '') + '" data-a="lt" data-v="mine">Мои</button>' +
        '<button class="' + (LT === 'done' ? 'on' : '') + '" data-a="lt" data-v="done">Итоги</button>' +
      '</div>' + list;
  }

  // ===== КЛАНЫ =====
  function renderClan(){
    const c = CLAN;
    if (!c) { renderNoClan(); return; }
    const all = RIVALS.concat([{ n: c.name, t: c.treas, me: true }]).sort((a, b) => b.t - a.t);
    const place = all.findIndex(r => r.me) + 1;
    const pct = Math.min(100, c.mazki.reduce((a, id) => a + MAZKI.find(m => m.id === id).p, 0));
    const pic = c.img ? '<img src="' + esc(c.img) + '" alt="">' : esc(c.name[0]);
    const apps = c.apps.length
      ? c.apps.map((n, i) => '<div class="row"><span>' + esc(n) + '</span><button class="btn sm" data-a="accept" data-i="' + i + '">Принять</button></div>').join('')
      : '<div class="sub">Заявок нет</div>';
    const appsBlock = c.leader ? '<div class="card col"><div class="lab">Заявки в клан</div>' + apps + '</div>' : '';
    $('#sc-clan').innerHTML =
      '<div class="col">' +
        '<div class="card row">' +
          '<div class="row" style="gap:12px"><div class="cav big" style="--c:#ff1e3c">' + pic + '</div>' +
          '<div><div class="nick" style="font-size:18px">' + esc(c.name) + '</div><div class="sub">' + (c.leader ? 'Лидер (создатель)' : 'Участник') + '</div></div></div>' +
          '<div style="text-align:right"><div class="lab">Место</div><div class="big">' + place + '</div></div>' +
        '</div>' +
        '<div class="grid3">' +
          '<button class="tile" data-a="clanMembers"><span class="ico">👥</span>Клан<small class="sub">' + c.members.length + '/10</small></button>' +
          '<button class="tile" data-a="clanTreas"><span class="ico">🏦</span>Общак<small class="sub">✎ ' + c.treas + '</small></button>' +
          '<button class="tile" data-a="clanShop"><span class="ico">🧩</span>Замазки<small class="sub">+' + pct + '%</small></button>' +
        '</div>' +
        '<div class="card row"><div><b>Ручки</b><div class="sub">Раз в час, 5–25 ✎</div></div>' + cdBtn('ruch', 'Получить', 'ruch') + '</div>' +
        appsBlock +
      '</div>';
  }

  function renderNoClan(){
    const rivals = RIVALS.slice().sort((a, b) => b.t - a.t).map((r, i) =>
      '<div class="item"><b style="width:22px">' + (i + 1) + '</b><div class="grow">' + esc(r.n) + '</div><b>✎ ' + r.t + '</b></div>'
    ).join('');
    $('#sc-clan').innerHTML =
      '<h2>Кланы</h2>' +
      '<p class="sub" style="margin-bottom:12px"><span class="dot" style="position:static;display:inline-flex">4 260 играют</span></p>' +
      '<div class="card col">' +
        '<div class="lab">Создать клан · ★ 8</div>' +
        '<input id="cn" placeholder="Название клана" maxlength="24">' +
        '<input id="ci" placeholder="Ссылка на фото клана (необязательно)">' +
        '<button class="btn w" data-a="clanCreate">Создать за ★ 8</button>' +
      '</div>' +
      '<div class="lab" style="margin:14px 0 8px">Кланы в топе</div>' +
      '<div class="list">' + rivals + '</div>';
  }

  function renderAll(){
    renderHeader();
    renderHome();
    renderNews();
    renderGames();
    renderLot();
    renderClan();
  }

  // ===== модалка =====
  const modal = $('#modal');
  const mb = $('#mBody');

  function openModal_(html){
    mb.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function closeModal(){
    G.t.forEach(clearInterval);
    G = { t: [] };
    modal.classList.add('hidden');
  }

  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function showResult(r){
    const st = $('#stage');
    if (!st) return;
    if (!r) { st.textContent = 'Ошибка'; return; }
    if (r.coin) {
      st.innerHTML = '<div class="win"><div class="big" style="color:var(--coin)">+1 ◆</div><span class="sub">монета актива</span></div>';
      return;
    }
    st.innerHTML = '<div class="win" style="--c:' + RAR[r.rar][1] + '">' + cavHtml(r.name, r.img, r.rar, true) +
      '<b style="font-family:Oswald;font-size:20px">' + esc(r.name) + ' №' + r.tir + '</b>' +
      '<span class="tag" style="color:' + RAR[r.rar][1] + '">' + RAR[r.rar][0] + ' · фон: ' + esc(r.bg) + '</span></div>';
  }

  async function openCaseOnServer(key){
    const st = $('#stage');
    if (st) st.textContent = '...';
    try {
      const data = await api('POST', '/api/open-case', { caseKey: key });
      await new Promise(res => setTimeout(res, 800));
      showResult(data.result);
      await refresh();
    } catch (e) {
      if (st) st.textContent = 'Выбери кейс';
      toast(e.message);
    }
  }

  // ===== пополнение звёзд =====
  function topupView(){
    const presets = [50, 100, 250, 500, 1000].map(n =>
      '<button data-a="pick" data-n="' + n + '">★ ' + n + '</button>'
    ).join('');
    openModal_('<h2>Пополнить звёзды</h2>' +
      '<p class="sub">Оплата проходит внутри Telegram. Звёзды зачисляются сервером после оплаты.</p>' +
      '<div class="pre">' + presets + '</div>' +
      '<input id="cu" type="number" min="1" max="10000" placeholder="Своя сумма">' +
      '<button class="btn w" id="pay">Оплатить ★ 250</button>');
    let n = 250;
    const set = v => {
      n = v;
      $('#pay').textContent = 'Оплатить ★ ' + n;
      $$('[data-n]').forEach(b => b.classList.toggle('on', Number(b.dataset.n) === n));
    };
    G.set = set;
    set(250);
    $('#cu').addEventListener('input', e => {
      const v = Math.floor(Number(e.target.value));
      if (v >= 1 && v <= 10000) set(v);
    });
    $('#pay').addEventListener('click', () => run(async () => {
      const data = await api('POST', '/api/create-invoice', { stars: n });
      closeModal();
      if (TG && TG.openInvoice) {
        TG.openInvoice(data.url, status => {
          if (status === 'paid') {
            toast('Оплата прошла, обновляем баланс…');
            setTimeout(() => run(refresh), 1500);
          }
        });
      } else {
        window.open(data.url, '_blank');
      }
    }));
  }

  // ===== клановые окна =====
  function clanMembersView(){
    const list = CLAN.members.map(m =>
      '<div class="item"><div class="grow">' + esc(m) + '</div>' + (m === 'Вы' ? '<span class="tag">Лидер</span>' : '') + '</div>'
    ).join('');
    const add = CLAN.members.length < 10
      ? '<button class="btn w" data-a="addMember">Добавить участника · ★ 4</button>'
      : '<div class="sub">Клан заполнен</div>';
    openModal_('<h2>Участники</h2><p class="sub">До 10 человек. Каждый новый участник — ★ 4.</p>' +
      '<div class="list">' + list + '</div>' + add);
  }

  function clanTreasView(){
    openModal_('<h2>Общак</h2><p class="sub">Вложенные ручки клана. Ими покупаются замазки.</p>' +
      '<div class="card" style="text-align:center"><div class="lab">В общаке</div><div class="big" style="color:var(--ruch)">✎ ' + CLAN.treas + '</div></div>' +
      '<input id="pu" type="number" min="1" placeholder="Сколько ручек вложить">' +
      '<button class="btn w" data-a="put">Вложить</button>');
  }

  function clanShopView(){
    const rows = MAZKI.map(m => {
      const owned = CLAN.mazki.indexOf(m.id) !== -1;
      let buttons = '<span class="tag pos">Куплена</span>';
      if (!owned) {
        buttons = '<button class="btn sm g" data-a="buyMaz" data-id="' + m.id + '" data-cur="ruch">✎ ' + m.ruch + '</button>';
        if (m.stars) buttons += ' <button class="btn sm" data-a="buyMaz" data-id="' + m.id + '" data-cur="stars">★ ' + m.stars + '</button>';
      }
      return '<div class="item"><div class="grow"><b>' + m.n + '</b><div class="sub">+' + m.p + '% к ручкам</div></div>' + buttons + '</div>';
    }).join('');
    openModal_('<h2>Замазки</h2><p class="sub">Замазка даёт % к получению ручек. Суммарно до 100%.</p>' +
      '<div class="list">' + rows + '</div>');
  }

  // ===== действия =====
  const ACT = {
    topup: () => topupView(),
    pick: el => { if (G.set) G.set(Number(el.dataset.n)); },
    close: () => closeModal(),
    passport: () => openModal_(passportView()),
    coll: () => openModal_(collView()),
    cases: () => openModal_(casesView()),
    rating: () => openModal_(ratingView()),
    kap: () => openModal_(kapView()),
    open: el => { if ($('#stage')) openCaseOnServer(el.dataset.k); },

    daily: () => run(async () => {
      if (cdLeft('daily') > 0) throw new Error('Бесплатный кейс уже открыт сегодня');
      openModal_('<h2>Ежедневный кейс</h2><p class="sub">Бесплатно раз в 24 часа</p><div id="stage" class="stage">...</div>');
      const data = await api('POST', '/api/open-case', { caseKey: 'free' });
      await new Promise(res => setTimeout(res, 800));
      showResult(data.result);
      await refresh();
    }),

    ruch: () => run(async () => {
      if (cdLeft('ruch') > 0) throw new Error('Ручки ещё не готовы');
      const r = await api('POST', '/api/ruch');
      toast('+' + r.gain + ' ✎');
      await refresh();
    }),

    kapget: () => run(async () => {
      await api('POST', '/api/kap');
      toast('Капелька получена');
      await refresh();
      openModal_(kapView());
    }),
    sub: () => run(async () => {
      await api('POST', '/api/subscribe');
      toast('Подписка активна');
      await refresh();
      openModal_(kapView());
    }),
    exCoin: () => run(async () => {
      await api('POST', '/api/kap-exchange', { to: 'coins' });
      toast('Капельки обменяны на монету');
      await refresh();
      openModal_(kapView());
    }),
    exRuch: () => run(async () => {
      await api('POST', '/api/kap-exchange', { to: 'ruch' });
      toast('Капельки обменяны на ручки');
      await refresh();
      openModal_(kapView());
    }),

    gameTap: () => playTap(),
    gameDrop: () => {
      const left = cdLeft('drop');
      if (left > 0) return toast('Следующий забег через ' + fmt(left));
      playDrop();
    },
    tgt: () => {
      if (G.type !== 'tap') return;
      G.hits++;
      moveTarget();
      if (G.hits >= G.need) winTap();
    },
    catchDrop: el => {
      if (G.type !== 'drop') return;
      G.score++;
      G.drops = G.drops.filter(d => d.el !== el);
      el.remove();
      updateDrop();
    },

    lt: el => { LT = el.dataset.v; renderLot(); },
    lotBuy: el => run(async () => {
      await api('POST', '/api/lottery/ticket', { id: Number(el.dataset.id) });
      toast('Билет куплен');
      await refresh();
    }),

    nl: el => { const id = el.dataset.id; NL[id] = !NL[id]; renderNews(); },

    clanCreate: () => run(async () => {
      const name = ($('#cn').value || '').trim();
      if (name.length < 2) throw new Error('Введите название клана');
      await api('POST', '/api/spend', { key: 'clan_create' });
      CLAN = { name: name, img: ($('#ci').value || '').trim(), leader: true, members: ['Вы'], treas: 0, mazki: [], apps: ['Саша', 'Марина'] };
      toast('Клан создан');
      await refresh();
    }),
    clanMembers: () => clanMembersView(),
    addMember: () => run(async () => {
      if (CLAN.members.length >= 10) throw new Error('Клан заполнен');
      await api('POST', '/api/spend', { key: 'clan_member' });
      CLAN.members.push(POOL_NAMES[CLAN.members.length % POOL_NAMES.length] + ' ' + CLAN.members.length);
      toast('Участник добавлен');
      await refresh();
      clanMembersView();
    }),
    clanTreas: () => clanTreasView(),
    put: () => run(async () => {
      const n = Math.floor(Number($('#pu').value));
      if (!(n >= 1)) throw new Error('Введите количество');
      await api('POST', '/api/spend', { key: 'treasury', amount: n });
      CLAN.treas += n;
      toast('+' + n + ' ✎ в общак');
      await refresh();
      clanTreasView();
    }),
    clanShop: () => clanShopView(),
    buyMaz: el => run(async () => {
      const m = MAZKI.find(x => x.id === el.dataset.id);
      if (CLAN.mazki.indexOf(m.id) !== -1) return;
      const key = el.dataset.cur === 'ruch' ? 'mazka_' + m.id : 'mazka_' + m.id + '_s';
      await api('POST', '/api/spend', { key: key });
      CLAN.mazki.push(m.id);
      toast('Замазка «' + m.n + '» куплена');
      await refresh();
      clanShopView();
    }),
    accept: el => {
      const i = Number(el.dataset.i);
      const n = CLAN.apps[i];
      if (!n || CLAN.members.length >= 10) return toast('Клан заполнен');
      CLAN.members.push(n);
      CLAN.apps.splice(i, 1);
      toast(n + ' принят в клан');
      renderClan();
    }
  };

  // ===== события =====
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      const t = tab.dataset.tab;
      $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
      $$('.screen').forEach(s => s.classList.toggle('on', s.id === 'sc-' + t));
      return;
    }
    const el = e.target.closest('[data-a]');
    if (el && ACT[el.dataset.a] && !el.disabled) ACT[el.dataset.a](el);
  });

  // ===== таймеры =====
  function tick(){
    const t = Date.now();
    $$('[data-cd]').forEach(b => {
      const left = cdLeft(b.dataset.cd);
      b.disabled = left > 0;
      b.textContent = left > 0 ? fmt(left) : b.dataset.label;
    });
    $$('[data-end]').forEach(el => {
      const L = LOTS.find(x => x.id === Number(el.dataset.end));
      if (L && !L.draw) el.textContent = fmt(L.ends - t);
    });
    if (LOTS.some(L => !L.draw && L.ends <= t) && t - lastLotRefresh > 5000) {
      lastLotRefresh = t;
      run(refresh);
    }
  }

  // ===== старт =====
  renderAll();
  setInterval(tick, 1000);
  run(refresh);
})();
