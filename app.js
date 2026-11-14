(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  
  if (TGU.id) {
    $('#userName').textContent = [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость';
    $('#userTag').textContent = TGU.username ? '@' + TGU.username : '';
    $('#profName').textContent = [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость';
    if (TGU.photo_url) {
      $('#userAvatar').style.backgroundImage = `url('${TGU.photo_url}')`;
      $('#profAvatar').style.backgroundImage = `url('${TGU.photo_url}')`;
    }
  }

  // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      $$('.screen').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      $(`#${btn.dataset.target}`).classList.add('active');
      
      if (btn.dataset.target === 'screen-edits') loadEdits();
      if (btn.dataset.target === 'screen-news') loadNews();
    });
  });

  // ЗАГРУЗКА ЭДИТОВ
  async function loadEdits() {
    const el = $('#screen-edits');
    el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Загрузка видео...</div>';
    try {
      const res = await fetch('/api/posts?type=edits');
      const posts = await res.json();
      
      if (!posts.length) return el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Эдитов пока нет</div>';
      
      el.innerHTML = `<div class="feed" id="feed">${posts.map(p => `
        <div class="slide">
          ${p.videoUrl ? `<video src="${p.videoUrl}" playsinline muted loop preload="metadata"></video>` : ''}
          ${p.image && !p.videoUrl ? `<div class="bg-img" style="background-image:url('${p.image}')"></div>` : ''}
          <div class="shade"></div>
          <div class="overlay">
            <a class="author" href="https://t.me/${p.author}" target="_blank">@${p.author}</a>
            <div class="ttl">${p.text.substring(0, 80)}</div>
          </div>
        </div>`).join('')}</div>
        <button class="sound-btn" id="soundBtn">🔇 Звук выкл</button>`;

      let soundOn = false;
      const feed = $('#feed');
      
      // Автовоспроизведение при скролле
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
      
      $('#soundBtn').addEventListener('click', e => {
        soundOn = !soundOn;
        e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл';
        feed.querySelectorAll('video').forEach(v => v.muted = !soundOn);
      });

    } catch { el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#ff1e3c;">Ошибка загрузки</div>'; }
  }

  // ЗАГРУЗКА НОВОСТЕЙ
  async function loadNews() {
    const el = $('#screen-news');
    el.innerHTML = '<div style="text-align:center; margin-top:50px; color:#8b95a5;">Загрузка новостей...</div>';
    try {
      const res = await fetch('/api/posts?type=news');
      const items = await res.json();
      el.innerHTML = `<h2 style="font-family:Oswald; font-size:28px; color:#fff; margin-bottom:15px;">Новости</h2>
      ${items.length ? items.map(n => `
        <article class="post">
          ${n.image ? `<img src="${n.image}">` : ''}
          <div class="body">
            <span class="tag">@${n.author}</span>
            <p>${n.text}</p>
          </div>
        </article>`).join('') : '<div style="text-align:center; color:#8b95a5;">Новостей пока нет</div>'}`;
    } catch { el.innerHTML = '<div style="text-align:center; color:#ff1e3c;">Ошибка загрузки</div>'; }
  }

  // Старт
  loadEdits();
})();
