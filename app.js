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
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function api(path, opts = {}){
    const url = new URL(path, window.location.origin);
    url.searchParams.append('id', me.id);
    url.searchParams.append('username', me.username);
    url.searchParams.append('name', me.name);
    url.searchParams.append('avatar', me.avatar);

    const res = await fetch(url.toString(), { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

  // --- АВАТАРКИ ---
  if (me.avatar) {
    $('#headerAvatar').src = me.avatar;
    $('#headerAvatar').style.display = 'block';
    $('#headerAvatarText').style.display = 'none';
    
    $('#profAvatar').src = me.avatar;
    $('#profAvatar').style.display = 'block';
    $('#profAvatarText').style.display = 'none';
  } else {
    $('#headerAvatarText').textContent = me.name[0].toUpperCase();
    $('#profAvatarText').textContent = me.name[0].toUpperCase();
  }

  // СПЛЭШ
  $('#splash').addEventListener('click', () => {
    $('#splash').classList.add('gone'); $('#app').classList.add('on');
  });

  // ВКЛАДКИ
  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.s === b.dataset.t));
    if (b.dataset.t === 'profile') loadProfile();
  });

  // --- ЗАГРУЗКА ПРОФИЛЯ ---
  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#topStars').textContent = s.stars;
      $('#mainStars').textContent = s.stars;
      $('#topCoins').textContent = s.coins;
      $('#whoLabel').textContent = me.name;
    } catch (e) { console.error(e); }
  }

  // --- ПОПОЛНЕНИЕ ЗВЕЗД ---
  let selectedAmt = 250;

  $('#btnTopUp').addEventListener('click', () => $('#modalTopUp').classList.add('active'));
  $('#closeTopUp').addEventListener('click', () => $('#modalTopUp').classList.remove('active'));

  document.querySelectorAll('.amt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.amt-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      selectedAmt = parseInt(e.currentTarget.dataset.amt);
      $('#selectedAmount').textContent = selectedAmt;
      $('#payAmount').textContent = selectedAmt;
    });
  });

  $('#btnPay').addEventListener('click', async () => {
    try {
      $('#btnPay').textContent = 'Загрузка...';
      // Просим сервер создать счет
      const res = await api('/api/create-invoice', {
        method: 'POST',
        body: JSON.stringify({ amount: selectedAmt })
      });
      
      // Открываем нативное окно оплаты Telegram
      if (tg && res.url) {
        tg.openInvoice(res.url, (status) => {
          if (status === 'paid') {
            toast('Оплата успешна! Звезды зачислены.');
            // В реальности нужно ждать подтверждения от Telegram (Webhook), 
            // но для теста мы просто обновим профиль
            loadProfile();
            $('#modalTopUp').classList.remove('active');
          } else {
            toast('Оплата отменена');
          }
          $('#btnPay').innerHTML = `Оплатить ⭐ <span id="payAmount">${selectedAmt}</span>`;
        });
      } else {
        toast('Ошибка открытия оплаты');
      }
    } catch (e) {
      toast('Ошибка сервера');
      $('#btnPay').innerHTML = `Оплатить ⭐ <span id="payAmount">${selectedAmt}</span>`;
    }
  });

  // --- ИСТОРИЯ ---
  $('#btnHistory').addEventListener('click', async () => {
    $('#modalHistory').classList.add('active');
    $('#historyList').innerHTML = '<div class="empty">Загрузка...</div>';
    try {
      const hist = await api('/api/history');
      if (!hist.length) {
        $('#historyList').innerHTML = '<div class="empty">История пуста</div>';
        return;
      }
      $('#historyList').innerHTML = hist.map(h => `
        <div class="history-item">
          <div class="h-left">
            <div class="h-icon">⚡</div>
            <div>
              <b>${esc(h.title)}</b>
              <span>${esc(h.description)}</span>
            </div>
          </div>
          <div class="h-right">
            <b style="color:#0f0">${esc(h.amount)}</b>
            <span>${new Date(h.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    } catch(e) {
      $('#historyList').innerHTML = '<div class="empty">Ошибка загрузки</div>';
    }
  });
  $('#closeHistory').addEventListener('click', () => $('#modalHistory').classList.remove('active'));

  // Заглушки для кнопок (пока нет логики)
  $('#btnMyProfile').addEventListener('click', () => toast('Ты уже в профиле'));
  $('#btnCharacters').addEventListener('click', () => toast('Персонажей пока нет'));
  $('#btnEarn').addEventListener('click', () => toast('Ежедневный бонус скоро!'));
  $('#btnCases').addEventListener('click', () => toast('Кейсы появятся завтра!'));
  $('#btnLottery').addEventListener('click', () => toast('Лотерея скоро откроется!'));
  $('#btnDrops').addEventListener('click', () => toast('Капельки скоро!'));
  
  loadProfile();
})();
