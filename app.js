(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const me = {
    id: tgUser ? String(tgUser.id) : 'guest',
    name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость',
    username: tgUser && tgUser.username ? tgUser.username : 'guest'
  };

  const LIKES_TO_UNLOCK = 50;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function api(path, opts = {}){
    const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', 'X-User-Id': me.id, ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  // СПЛЭШ
  $('#splash').addEventListener('click', () => {
    $('#splash').classList.add('open');
    setTimeout(() => { $('#splash').classList.add('gone'); $('#app').classList.add('on'); }, 900);
  });

  // ВКЛАДКИ
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.s === b.dataset.t));
    if (b.dataset.t === 'profile') loadProfile();
  });

  // ===== ЭДИТЫ =====
  const feed = $('#feed');
  async function loadEdits(){
    try {
      const posts = await api('/api/posts?type=edits');
      if (!posts.length){ feed.innerHTML = '<div class="empty">Эдитов пока нет</div>'; return; }
      
      feed.innerHTML = posts.map(p => `
        <div class="slide" data-id="${p.id}">
          ${p.videoUrl ? `<video src="${esc(p.videoUrl)}" playsinline muted loop preload="metadata"></video>` : ''}
          ${p.image && !p.videoUrl ? `<div class="bg-img" style="background-image:url('${esc(p.image)}')"></div>` : ''}
          <div class="shade"></div>
          <div class="overlay">
            <a class="author" href="https://t.me/${encodeURIComponent(p.author)}" target="_blank">@${esc(p.author)}</a>
            <div class="ttl" style="font-size:16px;margin-top:4px;">${esc(p.text.substring(0, 100))}${p.text.length > 100 ? '...' : ''}</div>
          </div>
          <div class="side">
            <button class="like" data-id="${p.id}">
              <span class="ic">♥</span><span class="cnt">${p.likes}</span>
            </button>
          </div>
        </div>`).join('');
      observeVideos();
    } catch { feed.innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  function observeVideos(){
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) video.play().catch(() => {});
        else video.pause();
      });
    }, { root: feed, threshold: [0.6] });
    feed.querySelectorAll('.slide').forEach(s => io.observe(s));
  }

  // ЛАЙКИ В ЭДИТАХ (Мгновенное обновление)
  feed.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like'); if (!likeBtn) return;
    const isLiked = likeBtn.classList.contains('on');
    const cntEl = likeBtn.querySelector('.cnt');
    let currentCount = parseInt(cntEl.textContent);

    // Оптимистичное обновление (сразу меняем на экране)
    likeBtn.classList.toggle('on', !isLiked);
    cntEl.textContent = isLiked ? currentCount - 1 : currentCount + 1;

    try {
      const data = await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: likeBtn.dataset.id, action: isLiked ? 'unlike' : 'like' }) });
      cntEl.textContent = data.likes; // Синхронизация с сервером
    } catch { toast('Ошибка сети'); }
  });

  // ===== НОВОСТИ =====
  async function loadNews(){
    try {
      const items = await api('/api/posts?type=news');
      $('#newsList').innerHTML = items.length ? items.map(n => `
        <article class="post">
          ${n.image ? `<img src="${esc(n.image)}" alt="">` : ''}
          <div class="body">
            <h3>Новости ШГШ</h3>
            <p>${esc(n.text)}</p>
            <div class="meta"><span>@${esc(n.author)}</span></div>
          </div>
        </article>`).join('') : '<div class="empty">Новостей пока нет</div>';
    } catch { $('#newsList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  // ===== ЗАКУЛИСЬЕ =====
  async function loadBackstage(){
    try {
      const items = await api('/api/posts?type=backstage');
      $('#backList').innerHTML = items.length ? items.map(b => {
        const unlocked = b.likes >= LIKES_TO_UNLOCK;
        return `
        <article class="post ${unlocked ? 'unlocked' : 'locked'}" data-id="${b.id}">
          <div class="body">
             <span class="tag">@${esc(b.author)}</span>
            <div class="content">
              ${b.image ? `<img src="${esc(b.image)}" style="width:100%;border-radius:10px;margin:8px 0">` : ''}
              <p>${esc(b.text)}</p>
              ${b.poll ? `
                <div class="poll" style="background:#15151b; padding:10px; border-radius:10px; margin-top:10px;">
                  <b>${esc(b.poll.question)}</b>
                  ${b.poll.options.map(o => `<button class="poll-opt" style="display:block;width:100%;margin-top:6px;padding:8px;background:#222;border-radius:6px;color:#fff;">${esc(o)}</button>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
          <div class="gate">
            <div class="lock-ic">🔒</div>
            <div class="need">Наберите ${LIKES_TO_UNLOCK} лайков</div>
            <button class="unlock-btn" style="background:#ff1e3c;padding:8px 16px;border-radius:8px;">Разблокировать</button>
          </div>
          <div class="body" style="padding-top:0">
            <div class="counter">
              <span>♥ <b class="cnt">${b.likes}</b> / ${LIKES_TO_UNLOCK}</span>
            </div>
            <div class="meta">
              <div class="actions">
                <button class="bs-like ${b.likes >= LIKES_TO_UNLOCK ? 'on' : ''}" data-id="${b.id}">♥ Лайк</button>
                <button class="bs-comments" data-id="${b.id}">💬 <span>${b.comments}</span></button>
              </div>
            </div>
          </div>
        </article>`;
      }).join('') : '<div class="empty">Пусто</div>';
    } catch { $('#backList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  $('#backList').addEventListener('click', async e => {
    const card = e.target.closest('.post');
    if (!card) return;

    if (e.target.closest('.poll-opt')) {
      toast('Голос засчитан (симуляция)');
      return;
    }

    if (e.target.closest('.bs-like')) {
      const btn = e.target.closest('.bs-like');
      const cntSpan = card.querySelector('.counter .cnt');
      let c = parseInt(cntSpan.textContent);
      
      // Мгновенно обновляем UI
      cntSpan.textContent = c + 1;
      card.classList.remove('locked');
      card.classList.add('unlocked');

      try { await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: card.dataset.id, action: 'like' }) }); } catch {}
    }

    if (e.target.closest('.bs-comments')) openComments(card.dataset.id);
  });

  // ===== КОММЕНТАРИИ =====
  const sheet = $('#sheet'), sheetBg = $('#sheetBg');
  let currentPostId = null;

  function openSheet(){ sheet.classList.add('open'); sheetBg.classList.add('open'); }
  function closeSheet(){ sheet.classList.remove('open'); sheetBg.classList.remove('open'); }
  $('#sheetClose').addEventListener('click', closeSheet);
  sheetBg.addEventListener('click', closeSheet);

  async function openComments(postId){
    currentPostId = postId;
    openSheet();
    $('#sheetList').innerHTML = '<div class="empty">Загрузка…</div>';
    try {
      const list = await api(`/api/posts/${postId}/comments`);
      $('#sheetList').innerHTML = list.length ? list.map(c => `<div class="comment"><b>${esc(c.name)}</b><span>${esc(c.text)}</span></div>`).join('') : '<div class="empty">Нет комментариев</div>';
    } catch { $('#sheetList').innerHTML = '<div class="empty">Ошибка</div>'; }
  }

  $('#commentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const text = $('#commentInput').value.trim();
    if (!text || !currentPostId) return;
    try {
      await api(`/api/posts/${currentPostId}/comments`, { method: 'POST', body: JSON.stringify({ name: me.name, text }) });
      $('#commentInput').value = '';
      
      // Мгновенно обновляем счетчик комментариев на карточке
      const card = $(`.post[data-id="${currentPostId}"]`);
      if (card) {
        const span = card.querySelector('.bs-comments span');
        if (span) span.textContent = parseInt(span.textContent) + 1;
      }
      
      await openComments(currentPostId);
    } catch { toast('Ошибка'); }
  });

  // ===== ПРОФИЛЬ =====
  $('#whoLabel').innerHTML = `<b>${esc(me.name)}</b>`;
  $('#profName').textContent = me.name;
  $('#profHandle').textContent = '@' + me.username;
  $('#avatar').textContent = (me.name[0] || '?').toUpperCase();

  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#statMsgs').textContent = s.messages;
      $('#statLikes').textContent = s.likes;
      $('#statComments').textContent = s.comments;
      $('#rewardsList').innerHTML = s.rewards.map(r => `<div class="reward"><div class="ico">${esc(r.icon)}</div><div><b>${esc(r.title)}</b><span>${esc(r.description)}</span></div></div>`).join('');
    } catch { toast('Ошибка профиля'); }
  }

  // СТАРТ
  loadEdits();
  loadNews();
  loadBackstage();
})();
