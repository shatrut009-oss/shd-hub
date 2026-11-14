(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const me = {
    id: tgUser ? String(tgUser.id) : 'guest',
    name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость',
    username: tgUser && tgUser.username ? tgUser.username : 'guest',
    avatar: tgUser && tgUser.photo_url ? tgUser.photo_url : ''
  };

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2500);
  }

  async function api(path, opts = {}){
    const url = new URL(path, window.location.origin);
    url.searchParams.append('id', me.id);
    url.searchParams.append('username', me.username);
    url.searchParams.append('name', me.name);

    const res = await fetch(url.toString(), { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  // ЗАСТАВКА
  if (me.avatar) {
    $('#headerAvatar').src = me.avatar; $('#headerAvatar').style.display = 'block'; $('#headerAvatarText').style.display = 'none';
    $('#profAvatar').src = me.avatar; $('#profAvatar').style.display = 'block'; $('#profAvatarText').style.display = 'none';
  } else {
    $('#headerAvatarText').textContent = me.name[0].toUpperCase(); $('#profAvatarText').textContent = me.name[0].toUpperCase();
  }

  $('#splash').addEventListener('click', () => {
    $('#splash').classList.add('open');
    setTimeout(() => { $('#splash').classList.add('gone'); $('#app').classList.add('on'); }, 800);
  });

  // ВКЛАДКИ
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.s === b.dataset.t));
    if (b.dataset.t === 'profile') loadProfile();
  });

  // ЭДИТЫ
  const feed = $('#feed'); let soundOn = false;
  async function loadEdits(){
    try {
      const posts = await api('/api/posts?type=edits');
      if (!posts.length){ feed.innerHTML = '<div class="empty">Эдитов пока нет</div>'; return; }
      feed.innerHTML = posts.map(p => `
        <div class="slide" data-id="${p.id}">
          ${p.videoUrl ? `<video src="${esc(p.videoUrl)}" playsinline muted loop preload="metadata"></video>` : ''}
          ${p.image && !p.videoUrl ? `<div class="bg-img" style="background-image:url('${esc(p.image)}')" onclick="openMedia('${esc(p.image)}', 'image')"></div>` : ''}
          <div class="shade"></div>
          <div class="overlay"><a class="author" href="https://t.me/${encodeURIComponent(p.author)}" target="_blank">@${esc(p.author)}</a><div class="ttl" style="font-size:14px;margin-top:4px;color:#ccc;">${esc(p.text.substring(0, 100))}</div></div>
          <div class="side"><button class="like" data-id="${p.id}"><span class="ic">♥</span><span class="cnt">${p.likes}</span></button></div>
        </div>`).join('');
      observeVideos();
    } catch { feed.innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }
  function observeVideos(){
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) { video.muted = !soundOn; video.play().catch(() => {}); } else { video.pause(); }
      });
    }, { root: feed, threshold: [0.6] });
    feed.querySelectorAll('.slide').forEach(s => io.observe(s));
  }
  $('#soundBtn').addEventListener('click', e => {
    soundOn = !soundOn; e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл';
    feed.querySelectorAll('video').forEach(v => v.muted = !soundOn);
  });
  feed.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like'); if (!likeBtn) return;
    const isLiked = likeBtn.classList.contains('on'); const cntEl = likeBtn.querySelector('.cnt');
    likeBtn.classList.toggle('on', !isLiked);
    let current = parseInt(cntEl.textContent) || 0; cntEl.textContent = isLiked ? current - 1 : current + 1;
    try { const data = await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: likeBtn.dataset.id, action: isLiked ? 'unlike' : 'like' }) }); cntEl.textContent = data.likes; } catch { toast('Ошибка сети'); }
  });

  // НОВОСТИ
  async function loadNews(){
    try {
      const items = await api('/api/posts?type=news');
      $('#newsList').innerHTML = items.length ? items.map(n => `
        <article class="post">${n.image ? `<img src="${esc(n.image)}" onclick="openMedia('${esc(n.image)}', 'image')">` : ''}<div class="body"><span class="tag">@${esc(n.author)}</span><p>${esc(n.text)}</p></div></article>`).join('') : '<div class="empty">Новостей пока нет</div>';
    } catch { $('#newsList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  // ЗАКУЛИСЬЕ
  async function loadBackstage(){
    try {
      const items = await api('/api/posts?type=backstage');
      $('#backList').innerHTML = items.length ? items.map(b => {
        const unlocked = b.likes >= 50;
        return `<article class="post ${unlocked ? 'unlocked' : 'locked'}" data-id="${b.id}"><div class="body"><span class="tag">@${esc(b.author)}</span><div class="content">${b.image ? `<img src="${esc(b.image)}" onclick="openMedia('${esc(b.image)}', 'image')">` : ''}<p>${esc(b.text)}</p></div></div><div class="gate"><div class="lock-ic">🔒</div><div class="need">Наберите 50 лайков</div><button class="unlock-btn">Разблокировать</button></div><div class="body" style="padding-top:10px"><div class="meta"><div class="actions"><button class="bs-like" data-id="${b.id}">♥ <span class="cnt">${b.likes}</span> / 50</button></div></div></div></article>`;
      }).join('') : '<div class="empty">Пусто</div>';
    } catch { $('#backList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }
  $('#backList').addEventListener('click', async e => {
    const card = e.target.closest('.post'); if (!card) return;
    if (e.target.closest('.bs-like')) {
      const btn = e.target.closest('.bs-like'); const cntSpan = btn.querySelector('.cnt'); let c = parseInt(cntSpan.textContent) || 0;
      cntSpan.textContent = c + 1; if (c + 1 >= 50) { card.classList.remove('locked'); card.classList.add('unlocked'); }
      try { await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: card.dataset.id, action: 'like' }) }); } catch {}
    }
  });

  // ПРОФИЛЬ
  $('#whoLabel').textContent = me.name;
  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#topStars').textContent = s.stars; $('#mainStars').textContent = s.stars; $('#topCoins').textContent = s.coins;
    } catch (e) {}
  }

  // КЕЙСЫ
  $('#btnCases').addEventListener('click', () => $('#modalCases').classList.add('active'));
  $('#closeCases').addEventListener('click', () => $('#modalCases').classList.remove('active'));

  window.openCase = async (caseId) => {
    $('#modalCases').classList.remove('active');
    const animModal = $('#modalCaseAnim'); const box = $('#rouletteBox'); const status = $('#animStatus'); const btnCollect = $('#btnCollect');
    animModal.classList.add('active'); status.textContent = 'Крутим...'; btnCollect.style.display = 'none'; box.className = 'roulette-box spinning'; box.innerHTML = '🎁';

    const interval = setInterval(() => { box.innerHTML = `<img src="https://api.dicebear.com/7.x/adventurer/svg?seed=${Math.random()}" style="width:100%; height:100%; border-radius:20px;">`; }, 100);

    try {
      const res = await api('/api/open-case', { method: 'POST', body: JSON.stringify({ userId: me.id, caseId }) });
      setTimeout(() => {
        clearInterval(interval); box.className = 'roulette-box result';
        box.innerHTML = `<img src="${res.drop.image}" style="width:100%; height:100%; border-radius:20px;">`;
        status.innerHTML = `Выпал:<br><b style="font-size:24px; color:#fff;">${res.drop.name}</b><br><span style="color:${getRarityColor(res.drop.rarity)}; font-weight:bold;">${res.drop.rarity}</span>`;
        btnCollect.style.display = 'block';
        btnCollect.onclick = () => { animModal.classList.remove('active'); loadProfile(); };
      }, 2000);
    } catch (e) { clearInterval(interval); animModal.classList.remove('active'); toast(e.message.includes('400') ? 'Недостаточно средств!' : 'Ошибка сервера'); }
  };

  // ИНВЕНТАРЬ
  $('#btnCharacters').addEventListener('click', async () => {
    $('#modalInventory').classList.add('active'); $('#inventoryList').innerHTML = '<div class="empty">Загрузка...</div>';
    try {
      const inv = await api('/api/inventory');
      if (!inv.length) return $('#inventoryList').innerHTML = '<div class="empty" style="grid-column:1/-1;">Нет персонажей</div>';
      $('#inventoryList').innerHTML = inv.map(c => `<div class="inv-card"><img src="${c.image}" style="width:80px; height:80px; border-radius:16px; margin-bottom:10px; background:#222;"><b>${c.character_name}</b><span style="color:${getRarityColor(c.rarity)}">${c.rarity}</span></div>`).join('');
    } catch { $('#inventoryList').innerHTML = '<div class="empty">Ошибка</div>'; }
  });
  $('#closeInventory').addEventListener('click', () => $('#modalInventory').classList.remove('active'));

  function getRarityColor(r) {
    if (r === 'Мифический') return '#ff1e3c'; if (r === 'Легендарный') return '#ffb800'; if (r === 'Эпический') return '#9d4dff'; if (r === 'Редкий') return '#00d2ff'; return '#aaa';
  }

  // ОПЛАТА
  let selectedAmt = 250; const customAmountInput = $('#customAmount');
  customAmountInput.addEventListener('input', (e) => { selectedAmt = parseInt(e.target.value) || 1; $('#payAmount').textContent = selectedAmt; });
  document.querySelectorAll('.amt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.amt-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active');
      selectedAmt = parseInt(e.currentTarget.dataset.amt); customAmountInput.value = selectedAmt; $('#payAmount').textContent = selectedAmt;
    });
  });
  $('#btnTopUp').addEventListener('click', () => { $('#modalTopUp').classList.add('active'); customAmountInput.value = selectedAmt; $('#payAmount').textContent = selectedAmt; });
  $('#closeTopUp').addEventListener('click', () => $('#modalTopUp').classList.remove('active'));

  $('#btnPay').addEventListener('click', async () => {
    try {
      $('#btnPay').textContent = 'Загрузка...';
      const res = await api('/api/create-invoice', { method: 'POST', body: JSON.stringify({ amount: selectedAmt }) });
      if (res.url && window.Telegram.WebApp.openInvoice) {
        window.Telegram.WebApp.openInvoice(res.url, (status) => {
          if (status === 'paid') {
            toast('Оплата успешна!');
            api('/api/confirm-payment', { method: 'POST', body: JSON.stringify({ userId: me.id, amount: selectedAmt }) }).then(() => { loadProfile(); $('#modalTopUp').classList.remove('active'); });
          } else { toast('Оплата отменена'); }
          $('#btnPay').innerHTML = `Оплатить ⭐ <span id="payAmount">${selectedAmt}</span>`;
        });
      } else { toast('Ошибка сервера'); $('#btnPay').innerHTML = `Оплатить ⭐ <span id="payAmount">${selectedAmt}</span>`; }
    } catch (e) { toast('Ошибка'); $('#btnPay').innerHTML = `Оплатить ⭐ <span id="payAmount">${selectedAmt}</span>`; }
  });

  // ИСТОРИЯ
  $('#btnHistory').addEventListener('click', async () => {
    $('#modalHistory').classList.add('active'); $('#historyList').innerHTML = '<div class="empty">Загрузка...</div>';
    try {
      const hist = await api('/api/history');
      if (!hist.length) { $('#historyList').innerHTML = '<div class="empty">История пуста</div>'; return; }
      $('#historyList').innerHTML = hist.map(h => `<div class="history-item"><div class="h-left"><b>${esc(h.title)}</b><span>${esc(h.description)}</span></div><div class="h-right"><b style="color:#0f0">${esc(h.amount)}</b><span>${new Date(h.created_at).toLocaleDateString()}</span></div></div>`).join('');
    } catch(e) { $('#historyList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  });
  $('#closeHistory').addEventListener('click', () => $('#modalHistory').classList.remove('active'));

  // ЗАГЛУШКИ
  $('#btnMyProfile').addEventListener('click', () => toast('Ты уже в профиле'));
  $('#btnLottery').addEventListener('click', () => toast('Лотерея скоро!'));
  $('#btnDrops').addEventListener('click', () => toast('Капельки скоро!'));

  // МЕДИА
  window.openMedia = (src, type) => {
    const modal = $('#mediaModal'); const content = $('#mediaContent');
    content.innerHTML = type === 'video' ? `<video src="${src}" controls autoplay></video>` : `<img src="${src}">`;
    modal.classList.add('active');
  };
  $('#closeMedia').addEventListener('click', () => { $('#mediaModal').classList.remove('active'); $('#mediaContent').innerHTML = ''; });

  // СТАРТ
  loadEdits(); loadNews(); loadBackstage(); loadProfile();
})();
