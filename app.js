(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];

  // TELEGRAM API
  const TG = window.Telegram && window.Telegram.WebApp;
  if (TG) { TG.ready(); TG.expand(); }
  const TGU = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
  
  // Установка данных пользователя
  if (TGU.id) {
    $('#userName').textContent = [TGU.first_name, TGU.last_name].filter(Boolean).join(' ') || 'Гость';
    $('#userTag').textContent = TGU.username ? '@' + TGU.username : '';
    if (TGU.photo_url) {
      $('#userAvatar').style.backgroundImage = `url('${TGU.photo_url}')`;
    }
  }

  // ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Убираем активный класс у всех кнопок и экранов
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      $$('.screen').forEach(s => s.classList.remove('active'));
      
      // Добавляем активный класс текущей кнопке и экрану
      btn.classList.add('active');
      const targetId = btn.dataset.target;
      if (targetId) {
        $(`#${targetId}`).classList.add('active');
      }
    });
  });
})();
