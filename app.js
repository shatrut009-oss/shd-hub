// app.js
(() => {
  // ===== TELEGRAM =====
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
  const fmtDate = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('ru-RU', {day:'numeric', month:'long', year:'numeric'}); };

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function api(path, opts = {}){
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'X-User-Id': me.id, ...(opts.headers || {}) }
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  // ===== ИНИЦИАЛИЗАЦИЯ ПРОФИЛЯ (шапка и вкладка) =====
  function renderHeader(){
    $('#whoLabel').innerHTML = `<b>${esc(me.name)}</b>`;
    $('#profName').textContent = me.name;
    $('#profHandle').textContent = '@' + me.username;
    $('#avatar').textContent = (me.name[0] || '?').toUpperCase();
  }

  // ===== СПЛЭШ =====
  const splash = $('#splash'), app = $('#app');
  splash.addEventListener('click', () => {
    splash.classList.add('open');
    setTimeout(() => { splash.classList.add('gone'); app.classList.add('on'); }, 900);
  });

  // ===== ВКЛАДКИ =====
  const nav = $('#nav');
  nav.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    nav.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.s === b.dataset.t));
    if (b.dataset.t === 'profile') loadProfile();
  });

  // ===== ЭДИТЫ: видео-лента =====
  const feed = $('#feed');
  let soundOn = false;
  let videoIO = null;

  async function loadEdits(){
    try {
      const videos = await api('/api/posts?type=video');
      if (!videos.length){ feed.innerHTML = '<div class="empty">Эдитов пока нет</div>'; return; }
      feed.innerHTML = videos.map(v => `
        <div class="slide" data-id="${v.id}">
          <video src="${esc(v.videoUrl)}" playsinline muted loop preload="metadata"></video>
          <div class="shade"></div>
          <div class="overlay">
            <div class="ttl">${esc(v.title)}</div>
            <a class="author" href="https://t.me/${encodeURIComponent(v.author)}" target="_blank" rel="noopener">@${esc(v.author)}</a>
          </div>
          <div class="side">
            <button class="like ${v.liked ? 'on' : ''}" data-id="${v.id}">
              <span class="ic">♥</span><span class="cnt">${v.likes}</span>
            </button>
            <button class="share" data-id="${v.id}">
              <span class="ic">↗</span><span>Share</span>
            </button>
          </div>
        </div>`).join('');
      observeVideos();
    } catch (err) {
      feed.innerHTML = '<div class="empty">Не удалось загрузить ленту</div>';
      console.error(err);
    }
  }

  // Играем только видимый слайд (порог 60%)
  function observeVideos(){
    if (videoIO) videoIO.disconnect();
    videoIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = !soundOn;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { root: feed, threshold: [0, 0.6, 1] });
    feed.querySelectorAll('.slide').forEach(s => videoIO.observe(s));
  }

  // Тап по видео — пауза/плей
  feed.addEventListener('click', e => {
    if (e.target.closest('button,a')) return;
    const slide = e.target.closest('.slide'); if (!slide) return;
    const v = slide.querySelector('video');
    v.paused ? v.play() : v.pause();
  });

  $('#soundBtn').addEventListener('click', e => {
    soundOn = !soundOn;
    e.currentTarget.textContent = soundOn ? '🔊 звук' : '🔇 звук';
    feed.querySelectorAll('video').forEach(v => v.muted = !soundOn);
  });

  // ===== ЛАЙКИ И ШАРИНГ В ЛЕНТЕ =====
  feed.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like');
    const shareBtn = e.target.closest('.share');

    if (likeBtn) {
      try {
        const data = await api('/api/like', {
          method: 'POST',
          body: JSON.stringify({ postId: Number(likeBtn.dataset.id), name: me.name })
        });
        likeBtn.classList.toggle('on', data.liked);
        likeBtn.querySelector('.cnt').textContent = data.likes;
        toast(data.liked ? 'Лайк поставлен ♥' : 'Лайк снят');
      } catch { toast('Ошибка сети'); }
    }

    if (shareBtn) {
      const slide = shareBtn.closest('.slide');
      const title = slide.querySelector('.ttl').textContent;
      const link = location.origin + '/#' + shareBtn.dataset.id;
      const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(title + ' — ШД Hub')}`;
      tg && tg.openTelegramLink ? tg.openTelegramLink(url) : window.open(url, '_blank');
    }
  });

  // ===== НОВОСТИ =====
  async function loadNews(){
    try {
      const items = await api('/api/posts?type=news');
      $('#newsList').innerHTML = items.length ? items.map(n => `
        <article class="post">
          ${n.image ? `<img src="${esc(n.image)}" alt="" loading="lazy">` : ''}
          <div class="body">
            <div class="tags">${(n.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <h3>${esc(n.title)}</h3>
            <p>${esc(n.text)}</p>
            <div class="meta"><span>${fmtDate(n.date)}</span></div>
          </div>
        </article>`).join('') : '<div class="empty">Новостей пока нет</div>';
    } catch { $('#newsList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  // ===== ЗАКУЛИСЬЕ: блюр до 50 лайков =====
  async function loadBackstage(){
    try {
      const items = await api('/api/posts?type=backstage');
      $('#backList').innerHTML = items.length ? items.map(b => {
        const unlocked = b.likes >= LIKES_TO_UNLOCK;
        const pct = Math.min(100, Math.round(b.likes / LIKES_TO_UNLOCK * 100));
        return `
        <article class="post ${unlocked ? 'unlocked' : 'locked'}" data-id="${b.id}">
          <div class="body">
            <div class="tags">${(b.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
            <h3>${esc(b.title)}</h3>
            <div class="content">
              ${b.image ? `<img src="${esc(b.image)}" alt="" style="width:100%;border-radius:10px;margin:8px 0">` : ''}
              <p>${esc(b.text)}</p>
            </div>
          </div>
          <div class="gate">
            <div class="lock-ic">🔒</div>
            <div class="need">Наберите ${LIKES_TO_UNLOCK} лайков</div>
            <button class="unlock-btn">Разблокировать</button>
            <div class="warn">Наберите ${LIKES_TO_UNLOCK} лайков, чтобы открыть пост</div>
          </div>
          <div class="body" style="padding-top:0">
            <div class="counter">
              <span>♥ ${b.likes} / ${LIKES_TO_UNLOCK}</span>
              <div class="bar"><i style="width:${pct}%"></i></div>
              <span>${fmtDate(b.date)}</span>
            </div>
            <div class="meta">
              <div class="actions">
                <button class="bs-like ${b.liked ? 'on' : ''}" data-id="${b.id}">♥ Лайк</button>
                <button class="bs-comments" data-id="${b.id}">💬 ${b.comments || 0}</button>
              </div>
            </div>
          </div>
        </article>`;
      }).join('') : '<div class="empty">Пусто</div>';
    } catch { $('#backList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  $('#backList').addEventListener('click', async e => {
    const card = e.target.closest('.post.locked, .post.unlocked');
    if (!card) return;
    const id = Number(card.dataset.id);

    // Кнопка "Разблокировать": если лайков мало, показываем предупреждение
    if (e.target.closest('.unlock-btn')) {
      const gate = card.querySelector('.gate');
      gate.classList.add('warned');
      toast(`Наберите ${LIKES_TO_UNLOCK} лайков`);
      return;
    }

    if (e.target.closest('.bs-like')) {
      try {
        const data = await api('/api/like', {
          method: 'POST',
          body: JSON.stringify({ postId: id, name: me.name })
        });
        await loadBackstage(); // перерисовываем, чтобы обновить блюр и счётчик
        toast(data.liked ? 'Лайк поставлен ♥' : 'Лайк снят');
      } catch { toast('Ошибка сети'); }
    }

    if (e.target.closest('.bs-comments')) openComments(id);
  });

  // ===== КОММЕНТАРИИ =====
  const sheet = $('#sheet'), sheetBg = $('#sheetBg');
  let currentPostId = null;

  function openSheet(){ sheet.classList.add('open'); sheetBg.classList.add('open'); sheet.setAttribute('aria-hidden','false'); }
  function closeSheet(){ sheet.classList.remove('open'); sheetBg.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); }
  $('#sheetClose').addEventListener('click', closeSheet);
  sheetBg.addEventListener('click', closeSheet);

  async function openComments(postId){
    currentPostId = postId;
    openSheet();
    $('#sheetList').innerHTML = '<div class="empty">Загрузка…</div>';
    try {
      const list = await api(`/api/posts/${postId}/comments`);
      $('#sheetList').innerHTML = list.length
        ? list.map(c => `<div class="comment"><b>${esc(c.name)}</b><span>${esc(c.text)}</span></div>`).join('')
        : '<div class="empty">Комментариев пока нет</div>';
    } catch { $('#sheetList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  $('#commentForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = $('#commentInput');
    const text = input.value.trim();
    if (!text || currentPostId == null) return;
    try {
      await api(`/api/posts/${currentPostId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ name: me.name, text })
      });
      input.value = '';
      await openComments(currentPostId);
      toast('Комментарий добавлен');
    } catch { toast('Не удалось отправить'); }
  });

  // ===== ПРОФИЛЬ =====
  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#statMsgs').textContent = s.messages;
      $('#statLikes').textContent = s.likes;
      $('#statComments').textContent = s.comments;
      const rewards = s.rewards || [];
      $('#rewardsList').innerHTML = rewards.length
        ? rewards.map(r => `
          <div class="reward">
            <div class="ico">${esc(r.icon || '★')}</div>
            <div><b>${esc(r.title)}</b><span>${esc(r.description)}</span></div>
          </div>`).join('')
        : '<div class="empty">Наград пока нет</div>';
    } catch { toast('Не удалось загрузить профиль'); }
  }

  // ===== СТАРТ =====
  renderHeader();
  loadEdits();
  loadNews();
  loadBackstage();
})();
