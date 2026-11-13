(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const me = {
    id: tgUser ? String(tgUser.id) : 'guest',
    name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость',
    username: tgUser && tgUser.username ? tgUser.username : 'guest'
  };

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg){
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function api(path, opts = {}){
    const res = await fetch(path, { 
      ...opts, 
      headers: { 
        'Content-Type': 'application/json', 
        'X-User-Id': me.id, 
        'X-Username': me.username,
        'X-Firstname': me.name,
        ...(opts.headers || {}) 
      } 
    });
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
  let soundOn = false;
  
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
            <div class="ttl" style="font-size:14px;margin-top:4px;color:#ccc;">${esc(p.text.substring(0, 100))}</div>
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
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          video.muted = !soundOn;
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { root: feed, threshold: [0.6] });
    feed.querySelectorAll('.slide').forEach(s => io.observe(s));
  }

  // Кнопка звука
  $('#soundBtn').addEventListener('click', e => {
    soundOn = !soundOn;
    e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл';
    feed.querySelectorAll('video').forEach(v => v.muted = !soundOn);
  });

  // Лайки в эдитах
  feed.addEventListener('click', async e => {
    const likeBtn = e.target.closest('.like'); if (!likeBtn) return;
    const isLiked = likeBtn.classList.contains('on');
    const cntEl = likeBtn.querySelector('.cnt');
    
    likeBtn.classList.toggle('on', !isLiked);
    let current = parseInt(cntEl.textContent) || 0;
    cntEl.textContent = isLiked ? current - 1 : current + 1;

    try {
      const data = await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: likeBtn.dataset.id, action: isLiked ? 'unlike' : 'like' }) });
      cntEl.textContent = data.likes; 
    } catch { toast('Ошибка сети'); }
  });

  // ===== НОВОСТИ =====
  async function loadNews(){
    try {
      const items = await api('/api/posts?type=news');
      $('#newsList').innerHTML = items.length ? items.map(n => `
        <article class="post">
          ${n.image ? `<img src="${esc(n.image)}" alt="" onclick="openMedia('${esc(n.image)}', 'image')">` : ''}
          <div class="body">
            <span class="tag">@${esc(n.author)}</span>
            <p>${esc(n.text)}</p>
          </div>
        </article>`).join('') : '<div class="empty">Новостей пока нет</div>';
    } catch { $('#newsList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  // ===== ЗАКУЛИСЬЕ =====
  async function loadBackstage(){
    try {
      const items = await api('/api/posts?type=backstage');
      $('#backList').innerHTML = items.length ? items.map(b => {
        const unlocked = b.likes >= 50;
        return `
        <article class="post ${unlocked ? 'unlocked' : 'locked'}" data-id="${b.id}">
          <div class="body">
             <span class="tag">@${esc(b.author)}</span>
            <div class="content">
              ${b.image ? `<img src="${esc(b.image)}" style="width:100%;border-radius:10px;margin:8px 0" onclick="openMedia('${esc(b.image)}', 'image')">` : ''}
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
            <div class="need">Наберите 50 лайков</div>
            <button class="unlock-btn" style="background:#ff1e3c;padding:8px 16px;border-radius:8px;">Разблокировать</button>
          </div>
          <div class="body" style="padding-top:10px">
            <div class="meta">
              <div class="actions">
                <button class="bs-like" data-id="${b.id}">♥ <span class="cnt">${b.likes}</span> / 50</button>
              </div>
            </div>
          </div>
        </article>`;
      }).join('') : '<div class="empty">Пусто</div>';
    } catch { $('#backList').innerHTML = '<div class="empty">Ошибка загрузки</div>'; }
  }

  $('#backList').addEventListener('click', async e => {
    const card = e.target.closest('.post'); if (!card) return;

    if (e.target.closest('.bs-like')) {
      const btn = e.target.closest('.bs-like');
      const cntSpan = btn.querySelector('.cnt');
      let c = parseInt(cntSpan.textContent) || 0;
      
      cntSpan.textContent = c + 1;
      if (c + 1 >= 50) {
        card.classList.remove('locked');
        card.classList.add('unlocked');
      }

      try { await api('/api/like', { method: 'POST', body: JSON.stringify({ postId: card.dataset.id, action: 'like' }) }); } catch {}
    }
  });

  // ===== ПРОФИЛЬ =====
  $('#whoLabel').textContent = me.name;
  $('#headerAvatar').textContent = (me.name[0] || '?').toUpperCase();
  $('#profName').textContent = me.name;
  $('#profHandle').textContent = '@' + me.username;
  $('#avatar').textContent = (me.name[0] || '?').toUpperCase();

  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#statRank').textContent = s.rank || 0;
      $('#statPoints').textContent = s.points || 0;
      $('#statItems').textContent = s.items || 0;
      
      // Баланс звезд и монет
      document.querySelector('.top-balance .balance-item:nth-child(1) b').textContent = s.stars || 0;
      document.querySelector('.top-balance .balance-item:nth-child(2) b').textContent = s.coins || 0;
      
      if (s.rewards && s.rewards.length) {
        $('#rewardsList').innerHTML = s.rewards.map(r => `
          <div class="reward">
            <div class="ico">${esc(r.icon)}</div>
            <div><b>${esc(r.title)}</b><span>${esc(r.description)}</span></div>
          </div>`).join('');
      }
    } catch { toast('Ошибка профиля'); }
  }

  // Модалка для просмотра фото
  window.openMedia = (src, type) => {
    const modal = $('#mediaModal');
    const content = $('#mediaContent');
    content.innerHTML = type === 'video' ? `<video src="${src}" controls autoplay></video>` : `<img src="${src}">`;
    modal.classList.add('active');
  };

  $('#closeMedia').addEventListener('click', () => {
    $('#mediaModal').classList.remove('active');
    $('#mediaContent').innerHTML = '';
  });

  // СТАРТ
  loadEdits();
  loadNews();
  loadBackstage();
  loadProfile();
})();
