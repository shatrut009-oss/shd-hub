const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- SVG ИКОНКИ ПЕРСОНАЖЕЙ (оставляем те же, чтобы не раздувать код) ---
// (ВСТАВЬ СЮДА ВСЕ КОНСТАНТЫ IMG_... ИЗ ПРЕДЫДУЩЕГО СООБЩЕНИЯ)
const IMG_DIMA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='30' cy='30' r='12' fill='%234a4a4a'/><circle cx='70' cy='30' r='12' fill='%234a4a4a'/><path d='M20,40 Q50,90 80,40 L80,20 Q50,0 20,20 Z' fill='%234a4a4a'/><rect x='30' y='45' width='40' height='12' rx='4' fill='%23111'/><circle cx='40' cy='51' r='3' fill='%23fff'/><circle cx='60' cy='51' r='3' fill='%23fff'/></svg>";
const IMG_DIMA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='22' fill='%23e0ac69'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23333'/><path d='M25,40 Q50,10 75,40 Q75,25 50,20 Q25,25 25,40 Z' fill='%23222'/><circle cx='40' cy='45' r='3' fill='%23000'/><circle cx='60' cy='45' r='3' fill='%23000'/></svg>";
const IMG_KSU_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,90 L40,65 L60,65 L70,90 Z' fill='%23ffb6c1'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><circle cx='42' cy='45' r='2' fill='%23000'/><circle cx='58' cy='45' r='2' fill='%23000'/></svg>";
const IMG_KSU_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,90 L40,65 L60,65 L70,90 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_KSU_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_RITA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23111'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_RITA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='50' r='25' fill='%23fce4d6'/><path d='M20,50 Q20,20 50,20 Q80,20 80,50 Q85,80 90,90 L10,90 Q15,80 20,50 Z' fill='%23f4d03f'/></svg>";
const IMG_ALENA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,20 Q50,10 70,20 L70,35 Q50,25 30,35 Z' fill='%23111'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/></svg>";
const IMG_ALENA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M30,60 L70,100 L60,100 L20,60 Z' fill='%232e8b57'/><path d='M30,30 Q50,15 70,30 Q80,50 70,70 Q50,85 30,70 Q20,50 30,30 Z' fill='%238b4513'/></svg>";
const IMG_ALENA_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23ff9800'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%238b4513'/></svg>";
const IMG_SALAM_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,20 L40,10 L60,10 L70,20 Q60,30 50,30 Q40,30 30,20 Z' fill='%23fff'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,80 Z' fill='%23ff1e3c'/></svg>";
const IMG_SALAM_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/></svg>";
const IMG_NAT_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/></svg>";
const IMG_NAT_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><circle cx='30' cy='20' r='8' fill='%23fff'/><circle cx='70' cy='20' r='8' fill='%23fff'/></svg>";
const IMG_NAT_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_NAT_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M40,55 Q50,60 60,55' stroke='%23000' stroke-width='2' fill='none'/></svg>";
const IMG_GLAD_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23111'/></svg>";
const IMG_GLAD_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23fff'/></svg>";
const IMG_GLAD_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M25,35 Q50,15 75,35 Q75,25 50,20 Q25,25 25,35 Z' fill='%23ffd700'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23ffeb3b'/></svg>";
const IMG_GLAD_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23222'/></svg>";
const IMG_GLAD_5 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23333'/></svg>";
const IMG_GLAD_6 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='25' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/></svg>";
const IMG_MILK_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M35,65 Q50,70 65,65' stroke='%23000' stroke-width='4' fill='none'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%238b4513'/></svg>";
const IMG_MILK_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M25,45 Q25,20 75,20 Q75,45 75,60 Q25,60 25,45 Z' fill='%234caf50'/><circle cx='40' cy='40' r='3' fill='%23000'/><circle cx='60' cy='40' r='3' fill='%23000'/><rect x='45' y='50' width='10' height='5' fill='%23000'/></svg>";
const IMG_MILK_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23111'/></svg>";
const IMG_MILK_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 75,20 Q75,45 75,60 Q25,60 25,45 Z' fill='%234caf50'/><circle cx='40' cy='40' r='3' fill='%23000'/><circle cx='60' cy='40' r='3' fill='%23000'/></svg>";

const CHARACTERS = [
  { name: 'Дима (Балаклава)', rarity: 'Обычный', chance: 15, image: IMG_DIMA_1 },
  { name: 'Дима', rarity: 'Обычный', chance: 15, image: IMG_DIMA_2 },
  { name: 'Ксюша (Розовый)', rarity: 'Обычный', chance: 10, image: IMG_KSU_1 },
  { name: 'Ксюша (Школа)', rarity: 'Обычный', chance: 10, image: IMG_KSU_2 },
  { name: 'Ксюша (Куртка)', rarity: 'Обычный', chance: 10, image: IMG_KSU_3 },
  { name: 'Рита (Коктейль)', rarity: 'Редкий', chance: 7, image: IMG_RITA_1 },
  { name: 'Рита', rarity: 'Редкий', chance: 8, image: IMG_RITA_2 },
  { name: 'Алёна (Ванная)', rarity: 'Редкий', chance: 5, image: IMG_ALENA_1 },
  { name: 'Алёна (Лента)', rarity: 'Редкий', chance: 5, image: IMG_ALENA_2 },
  { name: 'Алёна', rarity: 'Редкий', chance: 5, image: IMG_ALENA_3 },
  { name: 'Саламандра (Машина)', rarity: 'Эпический', chance: 3, image: IMG_SALAM_1 },
  { name: 'Саламандра', rarity: 'Эпический', chance: 2, image: IMG_SALAM_2 },
  { name: 'Наташа (Школа)', rarity: 'Эпический', chance: 1.5, image: IMG_NAT_1 },
  { name: 'Наташа (Цветок)', rarity: 'Эпический', chance: 1.5, image: IMG_NAT_2 },
  { name: 'Наташа', rarity: 'Эпический', chance: 0.5, image: IMG_NAT_3 },
  { name: 'Наташа (Улыбка)', rarity: 'Эпический', chance: 0.5, image: IMG_NAT_4 },
  { name: 'Гладенко (Боксер)', rarity: 'Легендарный', chance: 0.2, image: IMG_GLAD_1 },
  { name: 'Гладенко (Врач)', rarity: 'Легендарный', chance: 0.2, image: IMG_GLAD_2 },
  { name: 'Гладенко (Строитель)', rarity: 'Легендарный', chance: 0.2, image: IMG_GLAD_3 },
  { name: 'Гладенко (Костюм)', rarity: 'Легендарный', chance: 0.1, image: IMG_GLAD_4 },
  { name: 'Гладенко', rarity: 'Легендарный', chance: 0.1, image: IMG_GLAD_5 },
  { name: 'Гладенко (Портрет)', rarity: 'Легендарный', chance: 0.1, image: IMG_GLAD_6 },
  { name: 'Миллкис (Чокер)', rarity: 'Мифический', chance: 0.05, image: IMG_MILK_1 },
  { name: 'Миллкис (Зеленая маска)', rarity: 'Мифический', chance: 0.05, image: IMG_MILK_2 },
  { name: 'Миллкис', rarity: 'Мифический', chance: 0.05, image: IMG_MILK_3 },
  { name: 'Миллкис (Экшн)', rarity: 'Мифический', chance: 0.05, image: IMG_MILK_4 }
];

const CASES = {
  'dnevnik': { name: 'Дневничок', price: 3, currency: 'coins' },
  'shpargalka': { name: 'Шпаргалка', price: 10, currency: 'stars' },
  'palochka': { name: 'Палочка', price: 13, currency: 'stars' }
};

const CHANNELS = {
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'],
  news: ['shgsh_novosti'],
  backstage: ['hladenko', 'gladmedia', 'gladdrophub']
};
const dbLikes = {};

async function fetchTelegramPosts(channels, type) {
  let allPosts = [];
  for (const channel of channels) {
    try {
      const res = await fetch(`https://t.me/s/${channel}`);
      const html = await res.text();
      const $ = cheerio.load(html);
      $('.tgme_widget_message').each((i, el) => {
        const text = $(el).find('.tgme_widget_message_text').text().trim();
        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;
        if (type === 'edits' && !image && !videoUrl) return;
        const dataPost = $(el).attr('data-post');
        const postId = dataPost ? dataPost : `${channel}-${i}`;
        const dateStr = $(el).find('time').attr('datetime') || new Date().toISOString();
        allPosts.push({ id: postId, type: type, author: channel, text: text || '', image: image, videoUrl: videoUrl, date: new Date(dateStr).getTime(), likes: dbLikes[postId] || 0 });
      });
    } catch (e) {}
  }
  allPosts.sort((a, b) => b.date - a.date);
  return allPosts;
}

// API
app.get('/api/posts', async (req, res) => { try { res.json(await fetchTelegramPosts(CHANNELS[req.query.type] || [], req.query.type)); } catch (e) { res.json([]); } });
app.post('/api/like', (req, res) => { const { postId, action } = req.body; if (dbLikes[postId] === undefined) dbLikes[postId] = 0; if (action === 'unlike' && dbLikes[postId] > 0) dbLikes[postId]--; else if (action === 'like') dbLikes[postId]++; res.json({ likes: dbLikes[postId] }); });

app.get('/api/profile/stats', async (req, res) => {
  const userId = req.query.id;
  if (!userId || userId === 'guest') return res.json({ stars: 0, coins: 0 });
  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      await pool.query('INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3)', [userId, req.query.username || 'unknown', req.query.name || 'Гость']);
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    }
    res.json({ stars: userResult.rows[0].stars || 0, coins: parseFloat(userResult.rows[0].coins) || 0 });
  } catch (err) { res.json({ stars: 0, coins: 0 }); }
});

app.get('/api/history', async (req, res) => { try { const hist = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC', [req.query.id]); res.json(hist.rows); } catch (err) { res.json([]); } });

// ЛОТЕРЕЯ (Топ)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const top = await pool.query('SELECT username, first_name, coins FROM users ORDER BY coins DESC LIMIT 5');
    res.json(top.rows);
  } catch (err) { res.json([]); }
});

// ЕЖЕДНЕВКА (Капельки)
app.post('/api/daily-bonus', async (req, res) => {
  const { userId } = req.body;
  try {
    const userRes = await pool.query('SELECT last_daily FROM users WHERE id = $1', [userId]);
    const lastDaily = userRes.rows[0].last_daily;
    const now = new Date();
    
    if (lastDaily && (now - new Date(lastDaily)) < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Приходите завтра!' });
    }

    await pool.query('UPDATE users SET coins = coins + 0.5, last_daily = $1 WHERE id = $2', [now, userId]);
    await pool.query('INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)', [userId, 'Ежедневный бонус', 'Капельки', '+0.5']);
    
    res.json({ success: true, message: 'Вы получили 0.5 монеты!' });
  } catch (e) { res.status(500).json({ error: 'Ошибка' }); }
});

// ОПЛАТА И КЕЙСЫ
app.post('/api/create-invoice', async (req, res) => {
  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Пополнение', description: `Покупка ${req.body.amount} звезд`, payload: `topup_${Date.now()}`, currency: 'XTR', prices: [{ label: 'Stars', amount: req.body.amount }] })
    });
    const data = await response.json(); res.json({ url: data.result });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/confirm-payment', async (req, res) => {
  const { userId, amount } = req.body;
  await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2', [amount, userId]);
  await pool.query('INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)', [userId, 'Пополнение', 'Покупка звезд', `+${amount}`]);
  res.json({ success: true });
});

app.post('/api/open-case', async (req, res) => {
  const { userId, caseId } = req.body;
  const caseInfo = CASES[caseId];
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    if (caseInfo.currency === 'coins' && parseFloat(user.coins) < caseInfo.price) return res.status(400).json({ error: 'Мало монет!' });
    if (caseInfo.currency === 'stars' && user.stars < caseInfo.price) return res.status(400).json({ error: 'Мало звезд!' });

    if (caseInfo.currency === 'coins') await pool.query('UPDATE users SET coins = coins - $1 WHERE id = $2', [caseInfo.price, userId]);
    else await pool.query('UPDATE users SET stars = stars - $1 WHERE id = $2', [caseInfo.price, userId]);

    const rand = Math.random() * 100; let cumulative = 0; let drop = CHARACTERS[0];
    for (const char of CHARACTERS) { cumulative += char.chance; if (rand <= cumulative) { drop = char; break; } }
    await pool.query('INSERT INTO inventory (user_id, character_name, rarity) VALUES ($1, $2, $3)', [userId, drop.name, drop.rarity]);
    await pool.query('INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)', [userId, 'Кейс', `Выпал ${drop.name}`, `-${caseInfo.price}`]);
    res.json({ success: true, drop });
  } catch (err) { res.status(500).json({ error: 'Ошибка' }); }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE user_id = $1 ORDER BY created_at DESC', [req.query.id]);
    res.json(result.rows.map(item => { const charData = CHARACTERS.find(ch => ch.name === item.character_name); return { ...item, image: charData ? charData.image : '' }; }));
  } catch (err) { res.json([]); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Server started on port ${port}`));
