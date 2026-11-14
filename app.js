(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { 
    try { TG.ready(); TG.expand(); } catch(e) {} 
  }
  
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  
  // 1. ЗАПОЛНЕНИЕ ПРОФИЛЯ
  try {
    if (TGU.id) {
      if ($('#userName')) $('#userName').textContent = [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость';
      if ($('#userTag')) $('#userTag').textContent = TGU.username ? '@' + TGU.username : '';
      if ($('#profName')) $('#profName').textContent = [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость';
      
      if (TGU.photo_url) {
        if ($('#userAvatar')) $('#userAvatar').style.backgroundImage = `url('${TGU.photo_url}')`;
        if ($('#profAvatar')) $('#profAvatar').style.backgroundImage = `url('${TGU.photo_url}')`;
      }
    }
  } catch(e) { console.error("Ошибка профиля", e); }

  // 2. ЗАСТАВКА
  let isEntered = false;
  const splash = $('#splash');
  const app = $('#app');

  function enterApp() {
    if (isEntered || !splash) return;
    isEntered = true;
    
    splash.classList.add('open');
    if($('#splashText')) $('#splashText').style.opacity = '0';
    
    setTimeout(() => {
      splash.classList.add('gone');
      if (app) app.classList.add('on');
      loadEdits(); 
    }, 600);
  }

  if (splash) {
    splash.addEventListener('click', enterApp);
    splash.addEventListener('touchstart', enterApp, {passive: true});
  }
  setTimeout(enterApp, 2000);

  // 3. ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      $$('.screen').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      const target = $(`#${btn.dataset.target}`);
      if(target) target.classList.add('active');
      
      // ПРИНУДИТЕЛЬНО ОБНОВЛЯЕМ ДАННЫЕ ПРИ КАЖДОМ КЛИКЕ
      if (btn.dataset.target === 'screen-edits') loadEdits(true);
      if (btn.dataset.target === 'screen-news') loadNews(true);
    });
  });

  // 4. ЗАГРУЗКА ЭДИТОВ (force = принудительно)
  async function loadEdits(force = false) {
    const el = $('#screen-edits');
    if (!el) return;
    
    // Если загружаем в первый раз или принудительно, показываем лоадер
    if (force || !el.innerHTML.trim()) {
      el.innerHTML = '<div class="loader">Обновляем видео... 🎬</div>';
    }
    
    try {
      const res = await fetch('/api/posts?type=edits');
      const posts = await res.json();
      
      if (!posts.length) {
        el.innerHTML = '<div class="loader">Эдитов пока нет. Загляните позже!</div>';
        return;
      }
      
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

    } catch (err) { 
      console.error(err);
      el.innerHTML = '<div class="loader" style="color:#ff1e3c;">Ошибка загрузки видео</div>'; 
    }
  }

  // 5. ЗАГРУЗКА НОВОСТЕЙ (force = принудительно)
  async function loadNews(force = false) {
    const el = $('#screen-news');
    if (!el) return;

    if (force || !el.innerHTML.trim()) {
      el.innerHTML = '<div class="loader">Обновляем новости... 📰</div>';
    }
    
    try {
      const res = await fetch('/api/posts?type=news');
      const items = await res.json();
      
      el.innerHTML = `<h2 style="font-family:Oswald; font-size:28px; color:#fff; margin-bottom:15px;">Новости</h2>
      ${items.length ? items.map(n => {
        const d = new Date(n.date);
        const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' + 
                        d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        return `
        <article class="post">
          ${n.image ? `<img src="${n.image}">` : ''}
          <div class="body">
            <div class="post-header">
              <span class="tag">@${n.author}</span>
              <span class="post-date">${dateStr}</span>
            </div>
            <p>${n.text}</p>
          </div>
        </article>`;
      }).join('') : '<div class="loader">Новостей пока нет</div>'}`;
        
    } catch (err) { 
      console.error(err);
      el.innerHTML = '<div class="loader" style="color:#ff1e3c;">Ошибка загрузки новостей</div>'; 
    }
  }
})();
