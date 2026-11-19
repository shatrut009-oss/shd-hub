const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// ===== ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ (задаются в Render -> Environment) =====
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BOT_TOKEN = process.env.BOT_TOKEN;           // токен от @BotFather
const WEBAPP_URL = process.env.WEBAPP_URL;         // https://твой-сервис.onrender.com (без слеша в конце)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET; // любая строка из латиницы, цифр, _ и -

const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (!supabase) console.warn('SUPABASE_URL / SUPABASE_KEY не заданы: база отключена');
if (!BOT_TOKEN) console.warn('BOT_TOKEN не задан: бот и проверка Telegram отключены');

app.use(express.json({ limit: '200kb' }));

// Отдаем только нужные файлы, а не всю папку (чтобы не отдавать server.js и .env)
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(__dirname, 'app.js')));
app.get('/style.css', (req, res) => res.sendFile(path.join(__dirname, 'style.css')));

const CHANNELS = {
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'],
  news: ['shgsh_novosti', 'hladenko', 'gladmedia', 'gladdrophub']
};

// ===== ПРОВЕРКА ПОДПИСИ TELEGRAM (initData) =====
// Без этой проверки любой мог бы подставить чужой ID и изменить чужой аккаунт.
function verifyInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (calc.length !== hash.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;

  // Запрос не старше 24 часов
  const authDate = Number(params.get('auth_date')) || 0;
  if (Date.now() / 1000 - authDate > 86400) return null;

  try { return JSON.parse(params.get('user') || 'null'); } catch (e) { return null; }
}

function authUser(req, res) {
  const user = verifyInitData(req.get('x-tg-init-data'));
  if (!user || !user.id) {
    res.status(401).json({ error: 'Нет авторизации Telegram. Открой приложение через бота.' });
    return null;
  }
  return user;
}

// ===== API ДЛЯ БАЗЫ ДАННЫХ (SUPABASE) =====

// Получить данные пользователя (можно только свои)
app.get('/api/user/:id', async (req, res) => {
  const user = authUser(req, res); if (!user) return;
  if (String(user.id) !== String(req.params.id)) return res.status(403).json({ error: 'Чужой аккаунт' });
  if (!supabase) return res.status(503).json({ error: 'База не подключена' });

  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 значит "не найдено"
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      // Если пользователя еще нет в базе, создаем запись
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{
          id: id,
          username: user.username || ('player_' + id),
          first_name: user.first_name || 'Игрок'
        }])
        .select()
        .single();

      if (createError) throw createError;
      return res.json(newUser);
    }

    res.json(data);
  } catch (err) {
    console.error('Ошибка БД (GET):', err);
    res.status(500).json({ error: err.message });
  }
});

// Сохранить прогресс пользователя (только свой)
app.post('/api/user/:id', async (req, res) => {
  const user = authUser(req, res); if (!user) return;
  if (String(user.id) !== String(req.params.id)) return res.status(403).json({ error: 'Чужой аккаунт' });
  if (!supabase) return res.status(503).json({ error: 'База не подключена' });

  const { id } = req.params;
  const state = req.body || {};

  try {
    const { error } = await supabase.rpc('update_user_state', {
      p_id: id,
      p_stars: state.stars,
      p_coins: state.coins,
      p_inv: state.inv,
      p_hist: state.hist,
      p_choices: state.choices,
      p_active_badge: state.activeBadge,
      p_stat: state.stat
    });

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка БД (POST):', err);
    res.status(500).json({ error: err.message });
  }
});

// ===== TELEGRAM BOT API =====
async function tg(method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json();
  if (!data.ok) throw new Error(`${method}: ${data.description}`);
  return data.result;
}

// Вебхук: бот отвечает только на /start и открывает приложение
app.post('/telegram/webhook', async (req, res) => {
  if (!BOT_TOKEN) return res.sendStatus(503);
  if (WEBHOOK_SECRET && req.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }
  try {
    const msg = (req.body || {}).message;
    if (msg && msg.text && /^\/start(\s|$)/.test(msg.text) && WEBAPP_URL) {
      await tg('sendMessage', {
        chat_id: msg.chat.id,
        text: 'Добро пожаловать в ШД Hub! Нажми кнопку, чтобы открыть приложение.',
        reply_markup: { inline_keyboard: [[{ text: '🎬 Открыть ШД Hub', web_app: { url: WEBAPP_URL } }]] }
      });
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Ошибка вебхука:', err);
    res.sendStatus(500);
  }
});

// Серверное время: нужно для открытия эпизодов по дате
app.get('/api/time', (req, res) => res.json({ now: Date.now() }));

// ===== АВАТАРКА ПОЛЬЗОВАТЕЛЯ (фото из Telegram) =====
app.get('/api/avatar', async (req, res) => {
  const user = authUser(req, res); if (!user) return;
  if (!BOT_TOKEN) return res.status(503).end();
  try {
    const ph = await tg('getUserProfilePhotos', { user_id: user.id, limit: 1 });
    if (!ph.total_count || !ph.photos.length) return res.status(404).end();
    const sizes = ph.photos[0];
    const file = await tg('getFile', { file_id: sizes[sizes.length - 1].file_id });
    const r = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`);
    if (!r.ok) return res.status(502).end();
    res.set('Content-Type', 'image/jpeg');
    res.set('Cache-Control', 'private, max-age=3600');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    console.error('Ошибка аватарки:', e.message);
    res.status(404).end();
  }
});

// ===== ПАРСИНГ ТЕЛЕГРАМ КАНАЛОВ =====
async function fetchTelegramPosts(channels, type) {
  let allPosts = [];
  for (const channel of channels) {
    try {
      const res = await fetch(`https://t.me/s/${channel}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ShdHub/1.0)' }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();
      const $ = cheerio.load(html);

      $('.tgme_widget_message').each((i, el) => {
        if ($(el).hasClass('tgme_widget_message_pinned')) return;
        $(el).find('.tgme_widget_message_text').find('br').replaceWith('\n');
        const text = $(el).find('.tgme_widget_message_text').text().trim();

        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;

        if (!image && !videoUrl && text.length < 15) return;

        allPosts.push({
          id: $(el).attr('data-post') || `${channel}-${i}`,
          type,
          author: channel,
          text,
          image,
          videoUrl,
          date: new Date($(el).find('time').attr('datetime') || Date.now()).getTime()
        });
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  return allPosts.sort((a, b) => b.date - a.date).slice(0, 50);
}

// Кэш на 5 минут, чтобы не дергать телеграм на каждый клик
const postsCache = {};
app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  if (!CHANNELS[type]) return res.json([]);

  const cached = postsCache[type];
  if (cached && Date.now() - cached.at < 5 * 60 * 1000) return res.json(cached.data);

  try {
    const posts = await fetchTelegramPosts(CHANNELS[type], type);
    postsCache[type] = { at: Date.now(), data: posts };
    res.json(posts);
  } catch (e) {
    res.json(cached ? cached.data : []);
  }
});

app.listen(port, '0.0.0.0', async () => {
  console.log(`Сервер запущен на порту ${port}`);

  // Автоматически регистрируем вебхук бота
  if (BOT_TOKEN && WEBAPP_URL) {
    try {
      await tg('setWebhook', {
        url: `${WEBAPP_URL}/telegram/webhook`,
        allowed_updates: ['message'],
        ...(WEBHOOK_SECRET ? { secret_token: WEBHOOK_SECRET } : {})
      });
      console.log('Вебхук бота установлен');
    } catch (e) {
      console.error('Не удалось установить вебхук:', e.message);
    }
  }
});
