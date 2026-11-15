(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rnd = n => Math.floor(Math.random() * n);
  const H = 36e5, D = 864e5;

  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const U = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  const NAME = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Гость';

  const RAR = { common: ['Обычный', '#9aa0a6'], rare: ['Редкий', '#4da3ff'], epic: ['Эпический', '#b36bff'], legend: ['Легендарный', '#ffb020'], mythic: ['Мифический', '#ff3ea5'] };
  const CHARS = [
    { n: 'Дима', r: 'common' }, { n: 'Ксюша', r: 'common' }, { n: 'Вачик', r: 'common' }, { n: 'Бабушка Димы', r: 'common' },
    { n: 'Рита', r: 'rare' }, { n: 'Дерзкий', r: 'rare' }, { n: 'Камран', r: 'rare' }, { n: 'Директор', r: 'rare' }, { n: 'Николай Анатольевич', r: 'rare' },
    { n: 'Саламандра (1)', r: 'epic' }, { n: 'Саламандра (2)', r: 'epic' }, { n: 'Руслан (2)', r: 'epic' }, { n: 'Беда (Софья Андреевна)', r: 'epic' },
    { n: 'Руслан (1)', r: 'legend' }, { n: 'Загадочный мужчина из СТО', r: 'legend' },
    { n: 'Миллкис', r: 'mythic' }
  ];
  const CASES = {
    diary: { name: 'Дневничок', cost: 3, cur: 'coins', head: 'Дима', odds: { common: 58, rare: 28, epic: 10, legend: 3, mythic: 0.5, coin: 0.5 } },
    cheat: { name: 'Шпаргалка', cost: 10, cur: 'stars', head: 'Саламандра (1)', odds: { common: 50, rare: 30, epic: 13, legend: 5, mythic: 1, coin: 1 } },
    stick: { name: 'Палочка', cost: 13, cur: 'stars', head: 'Миллкис', odds: { common: 40, rare: 33, epic: 16, legend: 7.5, mythic: 2.5, coin: 1 } },
    free: { name: 'Ежедневный', cost: 0, head: 'Бесплатно', odds: { common: 60, rare: 28, epic: 8, legend: 3, mythic: 0.5, coin: 0.5 } }
  };

  const S = {
    stars: 20, coins: 0, inv: [], hist: [], liked: {},
    spinAt: 0, dailyAt: 0, det: { st: 0, clues: 0, done: false },
    stat: { cases: 0, likes: 0, spins: 0, stars: 0, daily: 0, chapters: 0, epic: 0, legend: 0, mythic: 0 }
  };
  const addH = (t, d, a) => S.hist.unshift({ t, d, a, at: Date.now() });

  function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200); }

  $('#splash').addEventListener('click', () => {
    $('#splash').classList.add('open');
    setTimeout(() => { $('#splash').classList.add('gone'); $('#app').classList.add('on'); }, 900);
  });

  const SCREENS = ['menu', 'edit', 'cases', 'roulette', 'detective', 'awards', 'profile'];
  function go(name){
    SCREENS.forEach(s => $('#s-' + s).classList.toggle('on', s === name));
    $('#backBtn').classList.toggle('hidden', name === 'menu');
    if (name === 'edit') loadRealEdits();
    if (name === 'cases') renderCases();
    if (name === 'roulette') renderRoulette();
    if (name === 'detective') renderDetective();
    if (name === 'awards') renderAwards();
    if (name === 'profile') renderProfile();
  }
  document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) go(g.dataset.go); });
  $('#backBtn').addEventListener('click', () => go('menu'));

  function roll(o){ const t = Object.values(o).reduce((a, b) => a + b, 0); let r = Math.random() * t; for (const k in o) { r -= o[k]; if (r < 0) return k; } return Object.keys(o)[0]; }
  function giveChar(rar){ const pool = CHARS.filter(c => c.r === rar); const c = pool[rnd(pool.length)]; S.inv.unshift({ n: c.n, r: rar }); if (rar === 'epic') S.stat.epic++; if (rar === 'legend') S.stat.legend++; if (rar === 'mythic') S.stat.mythic++; return c; }
  function cavHtml(name, rar){ return `<div class="cav" style="--c:${RAR[rar][1]}">${esc(name[0])}</div>`; }

  // ===== РЕАЛЬНАЯ ЗАГРУЗКА ЭДИТОВ =====
  async function loadRealEdits() {
    const container = $('#posts');
    container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Загрузка видео из Telegram...</div>';
    
    try {
      const res = await fetch('/api/posts?type=edits');
      const posts = await res.json();
      
      if (!posts || !posts.length) {
        container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Эдитов пока нет. Загляните позже!</div>';
        return;
      }

      container.innerHTML = posts.map(p => {
        let mediaHtml = '';
        if (p.videoUrl) {
          mediaHtml = `<video src="${p.videoUrl}" controls playsinline style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;"></video>`;
        } else if (p.image) {
          mediaHtml = `<img src="${p.image}" style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;">`;
        }

        return `<article class="post" style="padding: 0; overflow: hidden;">
          ${mediaHtml}
          <div class="b">
            <div class="au">@${esc(p.author)}</div>
            <p class="sub" style="margin-bottom: 10px; color: #fff; font-size: 14px;">${esc(p.text.substring(0, 100))}</p>
            <div class="row">
              <a href="https://t.me/${p.author}" target="_blank" class="btn sm g" style="text-decoration:none;">Открыть канал</a>
              <button class="like" data-like="${p.id}">♥ Лайк</button>
            </div>
          </div>
        </article>`;
      }).join('');

    } catch (err) {
      console.error(err);
      container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px; color: #ff1e3c;">Ошибка загрузки видео</div>';
    }
  }

  $('#posts').addEventListener('click', e => { 
    const b = e.target.closest('[data-like]'); 
    if (!b) return; 
    b.classList.toggle('on');
    b.textContent = b.classList.contains('on') ? '♥ В лайках' : '♥ Лайк';
  });

  // ===== ОСТАЛЬНОЙ КОД (КЕЙСЫ, РУЛЕТКА, ДЕТЕКТИВ) =====
  function renderCases(){
    $('#caseList').innerHTML = ['diary', 'cheat', 'stick'].map(k => {
      const c = CASES[k];
      return `<div class="card row"><div><b style="font-family:Oswald;font-size:17px;text-transform:uppercase">${c.name}</b><div class="sub">${c.cur === 'stars' ? '★' : '◆'} ${c.cost} · главный: ${esc(c.head)}</div><div class="sub">Монета ${c.odds.coin}% · мифический ${c.odds.mythic}%</div></div><button class="btn sm" data-case="${k}">Открыть</button></div>`;
    }).join('');
  }
  $('#caseList').addEventListener('click', e => { const b = e.target.closest('[data-case]'); if (b) openCase(b.dataset.case); });

  function openCase(k){
    const c = CASES[k];
    if (c.cost) { if (S[c.cur] < c.cost) return toast('Недостаточно ' + (c.cur === 'stars' ? 'звёзд' : 'монет')); S[c.cur] -= c.cost; }
    const r = roll(c.odds);
    const items = []; const WIN = 28;
    for (let i = 0; i < 36; i++) { const cc = i === WIN ? null : CHARS[rnd(CHARS.length)]; const rar = i === WIN ? r : cc.r; const name = i === WIN ? (r === 'coin' ? '+1 ◆' : '?') : cc.n; items.push(`<div class="it" style="--c:${RAR[rar] ? RAR[rar][1] : '#ffb020'}">${esc(name)}<i>${RAR[rar] ? RAR[rar][0] : 'Монета'}</i></div>`); }
    $('#caseStage').innerHTML = `<div class="strip"><div class="track" id="track">${items.join('')}</div></div><div id="res"></div>`;
    const stepW = 100; const offset = $('#caseStage').clientWidth / 2 - 46 - WIN * stepW;
    requestAnimationFrame(() => requestAnimationFrame(() => { $('#track').style.transform = `translateX(${offset}px)`; }));
    $$('[data-case]').forEach(b => b.disabled = true);
    setTimeout(() => {
      S.stat.cases++; let text;
      if (r === 'coin') { S.coins += 1; text = `<div class="win"><div class="o" style="font-size:24px;color:var(--coin)">+1 ◆</div><span class="sub">монета актива</span></div>`; addH(`Кейс «${c.name}»`, 'Монета актива', '+1 ◆'); }
      else { const ch = giveChar(r); text = `<div class="win" style="--c:${RAR[r][1]}">${cavHtml(ch.n, r)}<b class="o" style="font-size:20px">${esc(ch.n)}</b><span class="tag" style="color:${RAR[r][1]}">${RAR[r][0]}</span></div>`; addH(`Кейс «${c.name}»`, `${ch.n} · ${RAR[r][0]}`, c.cost ? `-${c.cost} ${c.cur === 'stars' ? '★' : '◆'}` : 'Бесплатно'); }
      $('#res').innerHTML = text; $$('[data-case]').forEach(b => b.disabled = false); renderTop();
    }, 3300);
    renderTop();
  }

  const SLICES = 10, FREE = [3, 7];
  const RL = { abs: 0, spinning: false };
  function fmt(ms){ const m = Math.ceil(ms / 60000), h = Math.floor(m / 60); return h ? `${h} ч ${m % 60} мин` : `${m} мин`; }
  function buildWheel(){
    const parts = []; for (let i = 0; i < SLICES; i++) { const f = FREE.includes(i); const c = f ? '#ffb020' : (i % 2 ? '#1a1a24' : '#101018'); parts.push(`${c} ${i * 36}deg ${(i + 1) * 36}deg`); }
    const disc = $('#disc'); disc.style.background = `conic-gradient(${parts.join(',')})`;
    disc.innerHTML = Array.from({ length: SLICES }, (_, i) => { const f = FREE.includes(i); return `<span class="lbl" style="transform:rotate(${i * 36 + 18}deg)"><b>${f ? '🎁' : '✖'}</b><i>${f ? 'кейс' : 'пусто'}</i></span>`; }).join('');
  }
  function renderRoulette(){
    if (!$('#disc').children.length) buildWheel();
    $('#disc').style.transform = `rotate(${RL.abs}deg)`;
    const left = S.spinAt + 2 * H - Date.now();
    $('#spinBtn').disabled = left > 0 || RL.spinning;
    $('#spinBtn').textContent = left > 0 ? 'Подождите' : 'Крутить';
    $('#spinTxt').textContent = RL.spinning ? 'Крутим…' : (left > 0 ? 'Следующая прокрутка через ' + fmt(left) : 'Готово к прокрутке');
  }
  $('#spinBtn').addEventListener('click', () => {
    if (RL.spinning || Date.now() < S.spinAt + 2 * H) return;
    S.spinAt = Date.now(); S.stat.spins++; RL.spinning = true;
    const win = rnd(SLICES); const center = win * 36 + 18; const delta = 360 * 6 + ((360 - ((center + RL.abs) % 360)) % 360);
    RL.abs += delta; $('#disc').style.transform = `rotate(${RL.abs}deg)`; renderRoulette();
    setTimeout(() => {
      RL.spinning = false; const hit = FREE.includes(win);
      addH('Рулетка', hit ? 'Бесплатный кейс' : 'Пусто', hit ? 'Кейс' : '—'); renderRoulette();
      if (hit) { toast('Бесплатный кейс!'); setTimeout(() => { go('cases'); openCase('free'); }, 400); }
      else toast('Пусто. Попробуйте через 2 часа');
    }, 5100);
  });

  const NV_EPS = [{id:1,t:'Раздевалка 9Б',rel:'2026-11-01'}, {id:2,t:'Подвал',rel:'2026-11-22'}, {id:3,t:'Сёстры',rel:'2026-11-29'}, {id:4,t:'Журнал',rel:'2026-12-06'}, {id:5,t:'Палочки',rel:'2026-12-13'}, {id:6,t:'Камеры',rel:'2026-12-20'}, {id:7,t:'Мастерская',rel:'2026-12-27'}, {id:8,t:'Блог',rel:'2027-01-03'}, {id:9,t:'Финал',rel:'2027-01-10'}];
  const NV_R = (x,y,w,h,f) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`;
  const NV_C = (x,y,r,f) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/>`;
  const NV_LK = (k,col) => Array.from({length:k}, (_,i) => NV_R(20+i*46,40,40,110,col)).join('');
  const NV_ART = { raz:()=>NV_R(0,0,400,180,'#1a0c12')+NV_LK(8,'#2b2f3a')+NV_R(40,140,320,10,'#5a3a2a')+NV_C(200,20,8,'#ffdf8a'), hall:()=>NV_R(0,0,400,180,'#0a1a2a')+NV_LK(8,'#1f3a5a')+NV_R(0,150,400,30,'#132033'), dir:()=>NV_R(0,0,400,180,'#101a0a')+NV_R(250,30,110,70,'#2a4a2a')+NV_R(120,110,160,18,'#4a2e18')+NV_R(190,95,30,20,'#222'), garage:()=>NV_R(0,0,400,180,'#16161c')+NV_R(60,120,280,12,'#555')+NV_R(120,85,160,35,'#2a2a33')+NV_C(150,125,14,'#111')+NV_C(250,125,14,'#111'), staff:()=>NV_R(0,0,400,180,'#0f1a06')+NV_R(60,110,280,16,'#5a3f22')+NV_R(80,95,40,15,'#2d6a9a'), sizo:()=>NV_R(0,0,400,180,'#1a1a1a')+Array.from({length:10},(_,i)=>NV_R(40+i*32,20,5,140,'#666')).join('') };
  const NV_TITLE = {raz:'Раздевалка 9Б', hall:'Коридор', dir:'Приёмная директора', garage:'Подвал', staff:'Охрана школы', sizo:'СИЗО'};
  const NV_NODES = {
    n0:{bg:'raz', t:'Утро, раздевалка 9Б. Вачик лежит на полу без сознания. Ключ от подвала валяется рядом. Что ты делаешь?', ch:[{t:'Вызвать скорую', to:'n1a'}, {t:'Спрятать ключ в карман', to:'n1b', f:'hid'}, {t:'Позвать Дерзкого и Риту', to:'n1c'}]},
    n1a:{bg:'raz', t:'Скорая едет. Вачик на секунду приходит в себя и шепчет: «Не доверяй директору».', ch:[{t:'Спросить, что он имеет в виду', to:'n2'}, {t:'Не отвлекаться, идти в коридор', to:'n2b'}]},
    n1b:{bg:'raz', t:'Ключ тяжёлый, на нём гравировка мастерской у СТО. Из-за шкафчика за тобой наблюдает Миллкис.', ch:[{t:'Подойти к ней', to:'n2'}, {t:'Выйти незаметно', to:'n2b'}]},
    n1c:{bg:'raz', t:'Дерзкий и Рита прибегают. Рита бледная: она слышала, как хлопнула дверь подвала.', ch:[{t:'Спросить Риту', to:'n2'}, {t:'Отправить Дерзкого к охране', to:'n3b'}]},
    n2:{bg:'hall', t:'Коридор. Миллкис спускается с лестницы: «Я видела директора с ключом в руке. Что ты будешь делать?»', ch:[{t:'Пойти к директору', to:'n3'}, {t:'Попросить Миллкис молчать', to:'n3b'}, {t:'Пробраться в подвал через окно', to:'n3s', star:10, key:'basement'}]},
    n2b:{bg:'hall', t:'Коридор. Дерзкий шепчет: «Кто-то стёр запись с камеры у лестницы».', ch:[{t:'Идти в приёмную директора', to:'n3'}, {t:'Проверить запись в охране', to:'n3b'}]},
    n3:{bg:'dir', t:'Приёмная. Директор и куратор Николай Анатольевич говорят за дверью: «Журнал должен исчезнуть до пятницы».', ch:[{t:'Войти и задать вопрос', to:'n4'}, {t:'Подслушать дальше', to:'n4'}]},
    n3b:{bg:'staff', t:'В охране старый монитор: в 3 часа ночи кто-то спускался в подвал с фонарём. Лица не видно.', ch:[{t:'Пойти к директору', to:'n4'}]},
    n3s:{bg:'garage', t:'Подвал. На полке коробка с ключами с биркой СТО и письмо на имя директора.', ch:[{t:'Забрать письмо и уйти', to:'n4', f:'letter'}]},
    n4:{bg:'dir', t:'Вачик приходит в себя в больнице: «Директор не тот, кем кажется». Что дальше?', ch:[{t:'Обвинить директора прямо сейчас', to:'bad'}, {t:'Собрать улики и поговорить с Камраном в СИЗО', to:'good'}, {t:'Пригрозить письмом из подвала', to:'secret', star:15, key:'threat', need:'letter'}]},
    bad:{bg:'dir', end:true, t:'Директор отрицает всё. Без доказательств тебя просят уйти. Эпизод закрыт, но правда не раскрыта.', ch:[{t:'Начать эпизод заново', restart:true}]},
    good:{bg:'sizo', end:true, t:'Камран подтверждает: директор выходил из подвала с ключом. Эпизод 1 пройден. Следующий выйдет 22 ноября.', ch:[{t:'К списку эпизодов', menu:true}]},
    secret:{bg:'dir', end:true, t:'Директор понимает, что ты была в подвале. Он сдаётся и рассказывает про журнал. Эпизод 1 пройден, открыт особый финал.', ch:[{t:'К списку эпизодов', menu:true}]}
  };
  
  const NV = { node:'n0', flags:[], unlocked:[] };
  const nvStatus = t => { const el = $('#nvStatus'); if (el) el.textContent = t; };

  function renderDetective(){
    const today = new Date().toISOString().slice(0, 10);
    $('#nvBody').innerHTML = `<h2>Детектив</h2><p class="sub" style="margin-bottom:12px">Эпизоды выходят по расписанию. Прогресс сохраняется в браузере.</p>` +
      NV_EPS.map((e, i) => {
        const avail = i === 0 && today >= e.rel;
        const btn = avail ? `<button class="btn" data-nv="play">${NV.node === 'n0' ? 'Играть' : 'Продолжить'}</button>` : `<span class="tag" style="color:var(--mut)">${new Date(e.rel).toLocaleDateString('ru-RU', {day:'numeric', month:'short'})}</span>`;
        return `<div class="nvEp"><div><b>${e.id}. ${esc(e.t)}</b><div class="sub">${avail ? 'Открыт' : 'Скоро'}</div></div>${btn}</div>`;
      }).join('') + `<div class="nvStatus" id="nvStatus">Прогресс сохраняется локально</div>`;
  }
  function renderNvNode(){
    const N = NV_NODES[NV.node];
    const choices = (N.ch || []).filter(c => !c.need || NV.flags.includes(c.need));
    const list = choices.map((c, i) => {
      if (c.star) {
        const open = NV.unlocked.includes(c.key);
        return `<button class="nvCh star ${open ? 'open' : ''}" data-nv="choose" data-i="${i}"><span>${open ? '🔓' : '🔒'} ${esc(c.t)}</span><span class="nvPrice ${open ? 'ok' : ''}">${open ? 'открыто' : '★ ' + c.star}</span></button>`;
      }
      return `<button class="nvCh" data-nv="choose" data-i="${i}"><span>${esc(c.t)}</span></button>`;
    }).join('');
    $('#nvBody').innerHTML = `<div class="nvArt"><svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice">${NV_ART[N.bg]()}</svg><div class="nvCap">${esc(NV_TITLE[N.bg])}</div></div><div class="nvBox"><p>${esc(N.t)}</p></div>${list}${N.end ? '' : '<button class="btn g" style="width:100%;margin-top:6px" data-nv="menu">К эпизодам</button>'}<div class="nvStatus" id="nvStatus">Прогресс сохраняется локально</div>`;
  }
  function nvChoose(i){
    const N = NV_NODES[NV.node];
    const c = (N.ch || []).filter(x => !x.need || NV.flags.includes(x.need))[i];
    if (!c) return;
    if (c.menu) return renderDetective();
    if (c.restart) { NV.node = 'n0'; NV.flags = []; return renderNvNode(); }
    if (c.star && !NV.unlocked.includes(c.key)) {
      if (S.stars < c.star) return toast('Нужно ★ ' + c.star + '. Пополни звёзды');
      S.stars -= c.star; NV.unlocked.push(c.key); renderTop(); toast('Выбор открыт навсегда');
    }
    if (c.f && !NV.flags.includes(c.f)) NV.flags.push(c.f);
    NV.node = c.to; renderNvNode();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-nv]'); if (!b) return;
    const a = b.dataset.nv;
    if (a === 'play') renderNvNode();
    else if (a === 'choose') nvChoose(+b.dataset.i);
    else if (a === 'menu') renderDetective();
  });

  function achievements(){
    const s = S.stat, L = [];
    [1, 10, 50, 100].forEach(n => L.push([`Откройте кейсов: ${n}`, s.cases >= n]));
    [1, 10, 50, 100].forEach(n => L.push([`Поставьте лайков: ${n}`, s.likes >= n]));
    [1, 10, 50].forEach(n => L.push([`Крутите рулетку: ${n}`, s.spins >= n]));
    [1, 100, 500].forEach(n => L.push([`Пополните звёзды на ${n} ★`, s.stars >= n]));
    [1, 2, 3, 4, 5].forEach(n => L.push([`Пройдите глав детектива: ${n}`, s.chapters >= n]));
    [1, 7, 30].forEach(n => L.push([`Заходите дней подряд: ${n}`, s.daily >= n]));
    [1, 5, 10].forEach(n => L.push([`Выбейте эпических: ${n}`, s.epic >= n]));
    [1, 3, 5].forEach(n => L.push([`Выбейте легендарных: ${n}`, s.legend >= n]));
    [1, 3].forEach(n => L.push([`Выбейте мифических: ${n}`, s.mythic >= n]));
    return L;
  }
  function renderAwards(){ const L = achievements(); const done = L.filter(a => a[1]).length; $('#awSub').textContent = `${done} из ${L.length}`; $('#achList').innerHTML = L.map(a => `<div class="ach ${a[1] ? 'done' : ''}"><span>${esc(a[0])}</span></div>`).join(''); }
  $('#dailyBtn').addEventListener('click', () => { if (Date.now() < S.dailyAt + D) return toast('Бесплатный кейс уже открыт сегодня'); S.dailyAt = Date.now(); S.stat.daily++; go('cases'); openCase('free'); });

  function renderTop(){ $('#cS').textContent = S.stars; $('#cC').textContent = S.coins; }
  function renderProfile(){
    $('#bS').textContent = S.stars; $('#bC').textContent = S.coins;
    const done = achievements().filter(a => a[1]).length; $('#pAw').textContent = `${done} из 30`;
    $('#inv').innerHTML = S.inv.length ? S.inv.slice(0, 18).map(i => `<div class="pc" style="--c:${RAR[i.r][1]}"><div class="cav" style="width:40px;height:40px;font-size:17px">${esc(i.n[0])}</div>${esc(i.n)}<i>${RAR[i.r][0]}</i></div>`).join('') : '<div class="sub" style="grid-column:1/-1">Пока пусто. Открой кейс!</div>';
    $('#hist').innerHTML = S.hist.length ? S.hist.slice(0, 12).map(h => `<div class="card row" style="padding:10px 12px;margin-bottom:8px"><div><b style="font-size:13px">${esc(h.t)}</b><div class="sub">${esc(h.d)}</div></div><b style="font-size:13px">${esc(h.a)}</b></div>`).join('') : '<div class="sub">История пуста</div>';
    renderTop();
    $('#rlSub').textContent = Date.now() < S.spinAt + 2 * H ? 'до следующей: ' + fmt(S.spinAt + 2 * H - Date.now()) : 'доступна сейчас';
    $('#awSub').textContent = `${done} из 30`;
  }

  $('#topBtn').addEventListener('click', openTopup);
  function openTopup(){
    $('#modal').classList.remove('hidden');
    $('#mSheet').innerHTML = `<h2>Пополнить звёзды</h2><p class="sub">Оплата проходит внутри Telegram. Звёзды зачисляются на баланс бота.</p><div class="pre">${[50, 100, 250, 500, 1000].map(n => `<button data-n="${n}">★ ${n}</button>`).join('')}</div><input id="cu" type="number" min="1" max="10000" placeholder="Своя сумма"><button class="btn w" id="pay">Оплатить ★ 250</button><button class="btn g w" id="mClose">Закрыть</button>`;
    let n = 250; const set = v => { n = v; $('#pay').textContent = `Оплатить ★ ${n}`; $$('[data-n]').forEach(b => b.classList.toggle('on', +b.dataset.n === n)); };
    set(250);
    $('#mSheet').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { $('#cu').value = ''; set(+b.dataset.n); } });
    $('#cu').addEventListener('input', e => { const v = Math.floor(+e.target.value); if (v >= 1 && v <= 10000) set(v); });
    $('#pay').addEventListener('click', () => {
      $('#mSheet').innerHTML = `<h2>Подтверждение покупки</h2><p class="sub">Списать ★ ${n} из вашего аккаунта Telegram и зачислить на баланс бота?</p><button class="btn w" id="ok">Подтвердить и заплатить ★ ${n}</button><button class="btn g w" id="mClose">Отмена</button>`;
      $('#ok').addEventListener('click', () => { S.stars += n; S.stat.stars += n; addH('Пополнение звёзд', 'Оплата через Telegram', `+${n} ★`); toast(`+${n} ★ на баланс`); closeModal(); renderTop(); });
      $('#mClose').addEventListener('click', closeModal);
    });
    $('#mClose').addEventListener('click', closeModal);
  }
  function closeModal(){ $('#modal').classList.add('hidden'); }
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  $('#nick').textContent = NAME; $('#nick2').textContent = NAME;
  $('#av').textContent = NAME[0].toUpperCase(); $('#av2').textContent = NAME[0].toUpperCase();
  renderTop();
  setInterval(() => { if ($('#s-roulette').classList.contains('on')) renderRoulette(); }, 1000);
})();
