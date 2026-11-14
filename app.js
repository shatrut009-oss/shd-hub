(() => {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) { tg.ready(); tg.expand(); }
  const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
  const me = { id: tgUser ? String(tgUser.id) : 'guest', name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') : 'Гость', username: tgUser && tgUser.username ? tgUser.username : 'guest', avatar: tgUser && tgUser.photo_url ? tgUser.photo_url : '' };

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2500); }

  async function api(path, opts = {}){
    const url = new URL(path, window.location.origin);
    url.searchParams.append('id', me.id); url.searchParams.append('username', me.username); url.searchParams.append('name', me.name);
    const res = await fetch(url.toString(), { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  }

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

  $('#nav').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.dataset.s === b.dataset.t));
    if (b.dataset.t === 'profile') loadProfile();
  });

  // (Эдиты, Новости, Закулисье - оставляем как было)
  const feed = $('#feed'); let soundOn = false;
  async function loadEdits(){ /* Код ленты */ }
  function observeVideos(){ /* Код обсервера */ }
  $('#soundBtn').addEventListener('click', e => { soundOn = !soundOn; e.currentTarget.textContent = soundOn ? '🔊 Звук вкл' : '🔇 Звук выкл'; feed.querySelectorAll('video').forEach(v => v.muted = !soundOn); });
  feed.addEventListener('click', async e => { /* Код лайков */ });
  async function loadNews(){ /* Код новостей */ }
  async function loadBackstage(){ /* Код закулисья */ }
  $('#backList').addEventListener('click', async e => { /* Код лайков закулисья */ });

  // ПРОФИЛЬ
  $('#whoLabel').textContent = me.name;
  async function loadProfile(){
    try {
      const s = await api('/api/profile/stats');
      $('#topStars').textContent = s.stars; $('#mainStars').textContent = s.stars; $('#topCoins').textContent = s.coins;
      loadLeaderboard();
    } catch (e) {}
  }

  // ТОП
  async function loadLeaderboard() {
    try {
      const top = await api('/api/leaderboard');
      $('#topList').innerHTML = top.map((u, i) => `<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>${i+1}. ${u.first_name || u.username}</span> <span style="color:#5c9aff">${parseFloat(u.coins).toFixed(2)} ⚡</span></div>`).join('');
    } catch (e) {}
  }

  // КЕЙСЫ (тот же код, что был)
  $('#btnCases').addEventListener('click', () => $('#modalCases').classList.add('active'));
  $('#closeCases').addEventListener('click', () => $('#modalCases').classList.remove('active'));
  window.openCase = async (caseId) => { /* Код рулетки */ };
  
  // ИНВЕНТАРЬ (тот же код)
  $('#btnCharacters').addEventListener('click', async () => { /* Код инвентаря */ });
  $('#closeInventory').addEventListener('click', () => $('#modalInventory').classList.remove('active'));

  function getRarityColor(r) { if (r === 'Мифический') return '#ff1e3c'; if (r === 'Легендарный') return '#ffb800'; if (r === 'Эпический') return '#9d4dff'; if (r === 'Редкий') return '#00d2ff'; return '#aaa'; }

  // ОПЛАТА (тот же код)
  let selectedAmt = 250; const customAmountInput = $('#customAmount');
  customAmountInput.addEventListener('input', (e) => { selectedAmt = parseInt(e.target.value) || 1; $('#payAmount').textContent = selectedAmt; });
  document.querySelectorAll('.amt-btn').forEach(btn => { btn.addEventListener('click', (e) => { document.querySelectorAll('.amt-btn').forEach(b => b.classList.remove('active')); e.currentTarget.classList.add('active'); selectedAmt = parseInt(e.currentTarget.dataset.amt); customAmountInput.value = selectedAmt; $('#payAmount').textContent = selectedAmt; }); });
  $('#btnTopUp').addEventListener('click', () => { $('#modalTopUp').classList.add('active'); customAmountInput.value = selectedAmt; $('#payAmount').textContent = selectedAmt; });
  $('#closeTopUp').addEventListener('click', () => $('#modalTopUp').classList.remove('active'));
  $('#btnPay').addEventListener('click', async () => { /* Код оплаты */ });

  // ИСТОРИЯ (тот же код)
  $('#btnHistory').addEventListener('click', async () => { /* Код истории */ });
  $('#closeHistory').addEventListener('click', () => $('#modalHistory').classList.remove('active'));

  // ЕЖЕДНЕВКА
  $('#btnDaily').addEventListener('click', async () => {
    try {
      const res = await api('/api/daily-bonus', { method: 'POST', body: JSON.stringify({ userId: me.id }) });
      toast(res.message);
      loadProfile();
    } catch (e) {
      toast('Приходите завтра!');
    }
  });

  // ЛОТЕРЕЯ (Пока симуляция покупки билета)
  $('#btnLottery').addEventListener('click', () => {
    if(confirm('Купить билет в лотерее за 5 звезд? (Шанс выиграть Мифического персонажа)')) {
      api('/api/like', { method: 'POST', body: JSON.stringify({}) }).then(() => {
         // Тут должна быть логика списания звезд, пока просто заглушка
         toast('Билет куплен! Ждите розыгрыша.');
      });
    }
  });

  $('#btnMyProfile').addEventListener('click', () => toast('Ты уже в профиле'));

  window.openMedia = (src, type) => { const modal = $('#mediaModal'); const content = $('#mediaContent'); content.innerHTML = type === 'video' ? `<video src="${src}" controls autoplay></video>` : `<img src="${src}">`; modal.classList.add('active'); };
  $('#closeMedia').addEventListener('click', () => { $('#mediaModal').classList.remove('active'); $('#mediaContent').innerHTML = ''; });

  loadEdits(); loadNews(); loadBackstage(); loadProfile();
})();
