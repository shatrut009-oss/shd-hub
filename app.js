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
      if (!audioCtx || bgmOsc) return;
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
    function stopBGM() { if (bgmOsc) { try { bgmOsc.stop(); } catch(e){} bgmOsc = null; } }
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
        }
      } catch(e) {}
    }
    document.addEventListener('click', () => { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }, { once: true });
    document.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.tile') || e.target.closest('.vn-dialog')) playSFX('click');
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
      } catch(e) { console.error("Ошибка навигации", e); }
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
    // ===== ДЕТЕКТИВ (ПОЛНЫЙ СЮЖЕТ) ============
    // ==========================================
    const BG = { hall: 'bg-hall', gym: 'bg-gym', math: 'bg-math', aud: 'bg-aud', kitchen: 'bg-kitchen', street: 'bg-street', office: 'bg-office' };
    
    // Заглушки для персонажей
    const makeCharSvg = (color) => `data:image/svg+xml;utf8,<svg viewBox='0 0 200 400' xmlns='http://www.w3.org/2000/svg'><path d='M30,400 L30,180 Q100,130 170,180 L170,400 Z' fill='${color}'/><circle cx='100' cy='110' r='45' fill='%23e0ac69'/></svg>`;
    const C = { dima: makeCharSvg('%23222'), derz: makeCharSvg('%23182436'), kamran: makeCharSvg('%232b2b35'), sofia: makeCharSvg('%23332e2e'), ruslan: makeCharSvg('%233b2010'), vachik: makeCharSvg('%23141e14'), ksusha: makeCharSvg('%233d1a3d'), mila: makeCharSvg('%233d2a1a'), sala: makeCharSvg('%232e0a14') };

    const STORY = [
      // ЭПИЗОД 1
      [
        { bg: BG.hall, char: null, name: '', text: 'ЭПИЗОД 1. «Первая записка». Утро. Яркий солнечный свет бьет в окна, отражается от начищенного линолеума. Ряды металлических шкафчиков.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: 'Я стою у своего открытого шкафчика, нервно теребя в руках учебник по геометрии. В коридоре шумно, но я не обращаю внимания.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', text: '— Здорово, чемпион! (сказал Дерзкий, широко ухмыляясь и хлопая ладонью по соседней дверце). — Ты сегодня на спаррингах в зале будешь, или опять дома железо тягаешь?' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', text: '— Нам тренера порадовать надо, (продолжил Дерзкий, понижая голос до театрального шепота). — А то он из-за твоего пропуска в пятницу мне весь мозг вынес.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— Отстань, Дерзкий, (раздраженно вздохнул я, поправляя лямку рюкзака). — У меня голова болит.' },
        { bg: BG.hall, char: C.kamran, name: 'Дима', text: 'В дальнем конце коридора стоит Камран. На нём идеально выглаженная школьная форма, на шее блестит тонкая золотая цепь. Он нервно крутит брелок от ключей, косясь на дверь кабинета математики.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', text: '— О-о, а вот и твой персональный конвой, (сказал Дерзкий, проследив за моим взглядом). — Я испаряюсь, братуха, а то меня сейчас этой аурой пафоса снесёт.' },
        { bg: BG.hall, char: C.kamran, name: 'Камран', text: 'Камран нарочно небрежно протискивается через толпу. Поравнявшись с моим шкафчиком, он тяжело врезается плечом в распахнутую створку. Металл с резким лязгом бьёт меня по предплечью.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— По коридору ровно ходи, пока ноги целы, (хмуро, с глухой угрозой в голосе выдал я, потирая ушибленную руку).' },
        { bg: BG.hall, char: C.kamran, name: 'Камран', text: '— А то что? (шипит Камран, сверкая глазами). — Пожалуешься своей бабке? Или пойдешь к Беде плакать?' },
        { bg: BG.hall, char: C.sofia, name: 'Софья Андреевна', text: '— Что за балаган у десятых кабинетов?! (произнесла Софья Андреевна властным, ледяным голосом). — Я вам сейчас быстро найду полезное применение! Камран, марш на урок. А ты, Дима, задержишься после занятий.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: 'Камран бросает на меня победный взгляд и уходит. Я открываю шкафчик, чтобы достать тетрадь, и замираю. На стопке учебников лежит белый конверт без подписи.' },
        { bg: BG.hall, char: null, name: 'Дима', text: 'Внутри — фотография. На ней запечатлен директор школы, Алексей Евгеньевич, передающий какому-то мужчине в кожанке толстую пачку денег. На обороте — записка: «Ты следующий. Игра началась. 12:00, старый спортзал. Приходи один. Иначе твоя бабушка узнает о…». Конец фразы оборван.' },
        { bg: BG.gym, char: null, name: 'Дима', text: '12:00. Старый спортзал. Полутемно. Окна заколочены досками, повсюду штабеля досок и строительный мусор. В воздухе висит пыль.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', text: '— Ты что здесь забыл, парень? (спросил Руслан, обернувшись). — Здесь опасно, полы гнилые. Мы тут стену ломаем, того и гляди придавит.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', text: '— Да я… ключи ищу, (соврал я). — Обронил где-то.' },
        { bg: BG.gym, char: C.vachik, name: 'Вачик', text: '— Тише, Дима, (сказал Вачик, поднимая руку). — Я знал, что ты придешь. Тебе ведь записку подкинули, верно? Я видел его. Он прятал что-то в стене. Вон там, за матами. Если хочешь найти правду — она там.' },
        { bg: BG.gym, char: null, name: 'Дима', text: 'Я отодвигаю маты. Один кирпич шатается. В нише лежит старая тетрадь и диктофон.' },
        { bg: BG.gym, char: null, name: 'Дима', text: 'Я открываю тетрадь: список фамилий — Директор, Софья Андреевна, Наталья Олеговна, и какой-то Андрей Андреев. Рядом с Андреем стоит крестик.' },
        { bg: BG.gym, char: null, name: 'Дима', text: 'Я включаю диктофон. Голос мужской: «...все должно быть сделано тихо. Директор в курсе. Софья Андреевна прикроет. Если кто-то узнает про этот эксперимент, мы все сядем. Особенно после того, что случилось с Андреем...».' },
        { bg: BG.gym, char: null, name: 'Дима', text: 'В этот момент дверь спортзала с грохотом захлопывается. В замке поворачивается ключ.' }
      ],
      // ЭПИЗОД 2
      [
        { bg: BG.hall, char: null, name: 'Дима', text: 'ЭПИЗОД 2. «Праведные сёстры». Возле доски объявлений висит яркая брошюра: «Праведные сёстры». Рядом стоит Ксюша и приклеивает еще одну.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— Ксюш, привет. Что это? (спросил я, подходя ближе).' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', text: '— О, это круто, Дим, (ответила Ксюша, улыбаясь). — Там реально помогают. Слушают, советуют. Я вот хожу. Мне стало легче после разрыва.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— Ксюша, ты знаешь, кто такой Андрей Андреев? (спросил я в лоб).' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', text: 'Листовки выпадают из ее рук. Она бледнеет. — Откуда ты знаешь это имя? (шепотом спросила Ксюша, озираясь).' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— Нашел старые документы. Это связано с сектой? (спросил я).' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', text: '— Не называй их так! (резко повысила голос Ксюша). — Это не секта. Они просто… они знают, как наказывать плохих людей. Приходи на собрание сегодня в актовый зал в шесть.' },
        { bg: BG.math, char: C.sofia, name: 'Софья Андреевна', text: 'Кабинет математики. После уроков. Софья Андреевна пишет уравнения, но мел ломается в ее руках.' },
        { bg: BG.math, char: C.dima, name: 'Дима', text: '— Софья Андреевна, а вы знали Андрея Андреева? (спросил я).' },
        { bg: BG.math, char: C.sofia, name: 'Софья Андреевна', text: 'Мел с хрустом ломается пополам. — Кто тебе это сказал? (спросила Софья Андреевна металлическим голосом, медленно поворачиваясь ко мне).' },
        { bg: BG.math, char: C.sofia, name: 'Софья Андреевна', text: '— Ты лезешь не в свое дело, Дима. Андрей был хорошим мальчиком. Но он сломался. А те, кто его сломал, сейчас сидят очень высоко. И если ты не хочешь, чтобы тебя сломали так же — забудь это имя. Садись. Палочка.' },
        { bg: BG.aud, char: null, name: 'Дима', text: 'Актовый зал. Полумрак. На сцене стоит женщина в строгом темном платье. В зале сидят ученики и родители. Атмосфера давящая, слишком тихая.' },
        { bg: BG.aud, char: null, name: 'Женщина', text: '— Добро пожаловать, наши дорогие гости. Сегодня мы поговорим о прощении. Я вижу новенького. Молодой человек на последнем ряду. Дима, верно? Поднимись к нам.' },
        { bg: BG.aud, char: null, name: 'Дима', text: 'Я медленно иду к сцене. Она кладет руку мне на плечо. Ее пальцы ледяные.' },
        { bg: BG.aud, char: null, name: 'Женщина', text: '— Расскажи нам, Дима. Ты когда-нибудь чувствовал, что тебя предали? Что те, кто должен был тебя защищать, на самом деле использовали тебя? (понизив голос до шепота): Ищи Андрея в архиве. И передай своей бабушке, Наталье Олеговне, что долг платежом красен.' },
        { bg: BG.aud, char: C.mila, name: 'Мила', text: 'В коридоре меня хватает за руку Мила. Она вся дрожит. — Дима, я знаю, что ты нашел тетрадь. И знаю, кто запер тебя в спортзале. Это был директор. Он забрал ключи у Вачика. Вот, (Мила протянула мне флешку). — Здесь видео. Как Камран передает деньги. И как директор шантажирует его.' }
      ],
      // ЭПИЗОД 3
      [
        { bg: BG.kitchen, char: null, name: 'Дима', text: 'ЭПИЗОД 3. «Тайны семьи». Кухня в доме Димы. Вечер. Тусклый свет. Наталья Олеговна сидит за столом, перед ней чашка чая.' },
        { bg: BG.kitchen, char: C.dima, name: 'Дима', text: '— Наталья Олеговна, мне нужно с тобой поговорить. О школе. О том, что ты перевела туда 50 тысяч. И об Андрее Андрееве, (сказал я).' },
        { bg: BG.kitchen, char: null, name: 'Наталья Олеговна', text: '— Где ты это взял? (спросила Наталья Олеговна дрожащим голосом). Андрей был сыном моей лучшей подруги. Он погиб 15 лет назад. Официально — самоубийство. Но на самом деле его затравили. Мальчишки. Сын одного важного чиновника, директор, который тогда был просто учителем, и... я.' },
        { bg: BG.kitchen, char: null, name: 'Наталья Олеговна', text: '— Я знала о травле. И ничего не сделала. Потому что его отец задолжал моей семье. И я использовала это, чтобы давить на него. Андрей узнал. И не выдержал. Это письмо от него. Он писал мне, просил о помощи. А я... я проигнорировала.' },
        { bg: BG.kitchen, char: null, name: 'Николай Андреевич', text: 'В дверь звонят. На пороге — Николай Андреевич. — Дима, добрый вечер. Я хотел бы поговорить с вами о вашей бабушке и о вашем участии в деле о шантаже. Мила рассказала мне про флешку. Я проверю эту флешку. А вы пока сидите дома.' },
        { bg: BG.street, char: C.vachik, name: 'Вачик', text: 'Я выхожу на улицу и встречаю Вачика. — Вачик, Дерзкий пропал. Не берет трубку. — Я знаю. Он у Саламандры. Она похитила его. И Ксюшу. Они в старом спортзале. Приходи один.' }
      ],
      // ЭПИЗОД 4
      [
        { bg: BG.gym, char: null, name: 'Дима', text: 'ЭПИЗОД 4. «Мотив». Старый спортзал. Ночь. Горит только одна лампа на сцене. Саламандра стоит в центре. Дерзкий связан на стуле. Ксюша сидит рядом, вся в слезах.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', text: '— Юля, отпусти их! (крикнул я, вбегая в зал).' },
        { bg: BG.gym, char: C.sala, name: 'Саламандра', text: '— Зачем? (Саламандра улыбнулась). — Они оба виноваты. Дерзкий предал меня. А Ксюша… она привела тебя в эту секту. Кукольник — это я. Я шантажирую всю школу. Я хочу, чтобы твоя бабушка ответила за смерть моего брата.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', text: '— Андрей был твоим братом? (спросил я).' },
        { bg: BG.gym, char: C.sala, name: 'Саламандра', text: '— Да. И Наталья Олеговна убила его. Она и ее друзья. Я просто восстанавливаю справедливость.' },
        { bg: BG.gym, char: C.derz, name: 'Дерзкий', text: '— Юля… ты не права. Я люблю тебя. Но это не выход, (поднял голову Дерзкий).' },
        { bg: BG.gym, char: null, name: 'Николай Андреевич', text: 'Двери спортзала распахиваются. Вбегают Николай Андреевич и Вачик. За ними — Руслан с аптечкой. — Всем стоять! Юля, ты арестована.' },
        { bg: BG.gym, char: C.derz, name: 'Дерзкий', text: 'Саламандра пытается убежать. Дерзкий, освободившись от веревок, бросается за ней. — Юля, остановись! Я знаю, что ты чувствуешь. Но это не исправит прошлое. Позволь мне помочь тебе.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', text: 'Саламандра плачет и падает на колени. Руслан подбегает к Ксюше. — У нее шок, но физически она цела. Ты молодец, парень. Не каждый бы рискнул.' }
      ],
      // ЭПИЗОД 5
      [
        { bg: BG.office, char: null, name: 'Дима', text: 'ЭПИЗОД 5. «Подстава». Кабинет директора. Дневной свет. Алексей Евгеньевич сидит за столом, бледный, руки трясутся. Рядом стоит Софья Андреевна.' },
        { bg: BG.office, char: null, name: 'Директор', text: '— Дима, я знаю, что ты нашел. Прошу тебя, не надо. Я заплачу. Сколько скажешь.' },
        { bg: BG.office, char: C.dima, name: 'Дима', text: '— Мне не нужны деньги. Мне нужно, чтобы вы рассказали правду. Про Андрея. Про Камрана, (холодно ответил я).' },
        { bg: BG.office, char: C.sofia, name: 'Софья Андреевна', text: '— Алексей Евгеньевич, хватит. Пора остановиться. Я готова дать показания. Дима, я знаю, что ты думаешь обо мне. Я покрывала травлю. Но я не знала, что Андрей покончит с собой. Я хочу все исправить.' },
        { bg: BG.office, char: null, name: 'Николай Андреевич', text: 'В кабинет врывается Николай Андреевич. — Камран в СИЗО. Он признался в убийстве. Но мы нашли видео на флешке. Это Саламандра. Она подставила его. Мы можем его освободить.' }
      ],
      // ЭПИЗОД 6
      [
        { bg: BG.office, char: null, name: 'Дима', text: 'ЭПИЗОД 6. «Разоблачение». Кабинет в отделении. Стол, стулья, лампа. Саламандра сидит, опустив голову. Николай Андреевич напротив. Дерзкий и Дима стоят у стены.' },
        { bg: BG.office, char: C.sala, name: 'Саламандра', text: '— Я не хотела, чтобы он сел, (тихо сказала Саламандра). — Я просто хотела, чтобы он испугался. Я хотела, чтобы он ушел из школы.' },
        { bg: BG.office, char: C.derz, name: 'Дерзкий', text: '— Ты сломала ему жизнь, (тихо сказал Дерзкий).' },
        { bg: BG.office, char: C.sala, name: 'Саламандра', text: '— А что мне было делать?! Наталья Олеговна убила моего брата! И никто не ответил за это!' },
        { bg: BG.office, char: C.dima, name: 'Дима', text: '— Твоя месть — это не ответ. Ты стала такой же, как они. Ты подставила невиновного.' },
        { bg: BG.office, char: C.sala, name: 'Саламандра', text: '— Я знаю, (прошептала Саламандра). — Я просто хотела, чтобы кто-то ответил.' }
      ],
      // ЭПИЗОД 7
      [
        { bg: BG.street, char: null, name: 'Дима', text: 'ЭПИЗОД 7. «Последствия». Улица возле СИЗО. Яркое солнце. Камран выходит из ворот, щурясь. Дима и Дерзкий ждут его.' },
        { bg: BG.street, char: C.kamran, name: 'Камран', text: '— Спасибо, пацаны, (сказал Камран, пожимая нам руки). — Я думал, что сяду надолго.' },
        { bg: BG.street, char: C.dima, name: 'Дима', text: '— Это не мы. Это Саламандра призналась, (ответил я).' },
        { bg: BG.street, char: C.kamran, name: 'Камран', text: '— Знаю. Она сумасшедшая. Но я ее понимаю.' },
        { bg: BG.hall, char: C.mila, name: 'Мила', text: 'Коридор школы. — Мила, я хотела извиниться. За то, что украла наркотики. Я думала, что это поможет мне забыть о проблемах, (сказала Мила).' },
        { bg: BG.hall, char: C.dima, name: 'Дима', text: '— Ты справишься. Главное, что ты остановилась, (ответил я).' }
      ],
      // ЭПИЗОД 8
      [
        { bg: BG.kitchen, char: null, name: 'Дима', text: 'ЭПИЗОД 8. «Семья». Гостиная в доме Димы. Наталья Олеговна сидит в кресле, Дима напротив.' },
        { bg: BG.kitchen, char: null, name: 'Наталья Олеговна', text: '— Я хочу отдать это тебе, (сказала Наталья Олеговна, протягивая конверт). — Письмо Андрея. Я больше не могу его хранить. Это мой грех. Я хочу, чтобы ты знал правду.' },
        { bg: BG.kitchen, char: C.dima, name: 'Дима', text: '— Наталья Олеговна, (я взял ее за руку). — Я не держу на тебя зла. Но ты должна понести наказание. Ты должна рассказать всем правду о том, что случилось с Андреем.' },
        { bg: BG.kitchen, char: null, name: 'Наталья Олеговна', text: '— Я готова, (кивнула Наталья Олеговна).' }
      ],
      // ЭПИЗОД 9
      [
        { bg: BG.street, char: null, name: 'Дима', text: 'ЭПИЗОД 9. «Новый Кукольник». Улица возле дома Димы. Вечер. Фонари. На экране телефона сообщение: «Ты думал, что победил? Кукольник — это не Саламандра. Это я. Игра продолжается».' },
        { bg: BG.street, char: C.vachik, name: 'Вачик', text: '— Кто это может быть? (спросил Вачик, хмурясь).' },
        { bg: BG.street, char: C.dima, name: 'Дима', text: '— Не знаю. Но мы выясним, (ответил я).' },
        { bg: BG.street, char: C.ruslan, name: 'Руслан', text: 'Я вижу Руслана на другой стороне улицы. — Руслан! Стой! (крикнул я). — Это ты? Ты Кукольник?' },
        { bg: BG.street, char: C.ruslan, name: 'Руслан', text: '— Я врач. И строитель. Я просто помогаю людям, (ответил Руслан, подходя ко мне). — Но я знаю, кто ты. И знаю, что ты сделал. Игра только начинается, Дима. Будь осторожен.' },
        { bg: BG.hall, char: null, name: 'Дима', text: 'Коридор школы. Ночь. На фотографии в шкафчике — я, Дерзкий, Камран, Ксюша. И на каждом лице нарисован крестик. Записка: «Ты следующий. Игра началась заново». Конец 1-го сезона...' }
      ]
    ];

    let vnState = { active: false, ep: 0, scene: 0 };

    function renderDetective() {
      const body = $('#nvBody'); if (!body) return;
      
      // Проверка, чтобы экран новеллы был скрыт при входе в меню
      if ($('#vn-screen')) $('#vn-screen').classList.add('hidden');

      body.innerHTML = `
        <div style="text-align:center; margin-top:20px;">
          <h1 style="font-family:'Oswald'; font-size:32px; color:#fff;">Детектив</h1>
          <p class="sub" style="font-size:14px; margin-bottom:20px;">Интерактивная история</p>
          
          <div style="display:flex; flex-direction:column; gap:10px; max-width:300px; margin:0 auto;">
            ${STORY.map((ep, i) => {
              const isUnlocked = i === 0 || S.stat.chapters >= i;
              return `<button class="btn w" style="background:${isUnlocked ? 'linear-gradient(90deg, var(--acc), var(--acc2))' : '#222'}; color:${isUnlocked ? '#fff' : '#666'};" data-ep="${i}" ${!isUnlocked ? 'disabled' : ''}>
                ${isUnlocked ? '▶ ' : '🔒 '} Эпизод ${i+1}
              </button>`;
            }).join('')}
          </div>

          <div style="display:flex; justify-content:center; margin-top:20px;">
            <button class="btn sm g" id="btn-my-choices">♥ Твои выборы</button>
          </div>
        </div>
      `;

      $$('[data-ep]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const epIndex = +e.target.dataset.ep;
          startVN(epIndex);
        });
      });
      if($('#btn-my-choices')) $('#btn-my-choices').addEventListener('click', () => openChoicesModal());
    }

    function startVN(epIndex) {
      vnState = { active: true, ep: epIndex, scene: 0 };
      $('#vn-screen').classList.remove('hidden');
      startBGM();
      showScene();
    }

    function showScene() {
      if (!vnState.active) return;
      const currentEp = STORY[vnState.ep];
      const scene = currentEp[vnState.scene];

      if (!scene) { return endVN(); }

      const bgEl = $('#vn-bg');
      const charEl = $('#vn-char');
      const dialogEl = $('#vn-dialog');
      const speakerEl = $('#vn-speaker');
      const textEl = $('#vn-text');
      const epInfo = $('#vn-ep-info');

      dialogEl.style.display = 'block';
      bgEl.className = 'vn-bg ' + scene.bg;
      bgEl.classList.add('active');

      if (scene.char) { 
        charEl.style.backgroundImage = `url('${scene.char}')`; 
        charEl.classList.add('active'); 
      } else { 
        charEl.classList.remove('active'); 
      }

      speakerEl.textContent = scene.name;
      speakerEl.style.display = scene.name ? 'inline-block' : 'none';
      textEl.textContent = scene.text;
      epInfo.textContent = `Эпизод ${vnState.ep + 1}`;
    }

    if ($('#vn-dialog')) {
      $('#vn-dialog').addEventListener('click', () => {
        if (!vnState.active) return;
        vnState.scene++;
        showScene();
      });
    }

    function endVN() {
      vnState.active = false;
      $('#vn-screen').classList.add('hidden');
      stopBGM();
      if (S.stat.chapters <= vnState.ep) S.stat.chapters = vnState.ep + 1;
      toast(`Эпизод ${vnState.ep + 1} пройден!`);
      renderDetective();
    }

    // --- Пауза и настройки ---
    if ($('#vn-pause-btn')) $('#vn-pause-btn').addEventListener('click', (e) => { e.stopPropagation(); $('#pause-modal').classList.remove('hidden'); });
    if ($('#pause-continue')) $('#pause-continue').addEventListener('click', () => $('#pause-modal').classList.add('hidden'));
    if ($('#pause-exit')) $('#pause-exit').addEventListener('click', () => { $('#pause-modal').classList.add('hidden'); $('#vn-screen').classList.add('hidden'); stopBGM(); vnState.active = false; go('menu'); });
    if ($('#pause-restart')) $('#pause-restart').addEventListener('click', () => { $('#pause-modal').classList.add('hidden'); vnState.scene = 0; showScene(); });
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
      [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(n => L.push([`Пройдено глав: ${n}`, s.chapters >= n]));
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
