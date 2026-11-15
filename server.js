const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- БАЗА ДАННЫХ ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err) => {
  if (err) console.error('❌ Ошибка БД:', err.message);
  else console.log('✅ База данных Supabase подключена!');
});

// --- ПАРСЕР TELEGRAM ---
const CHANNELS = { 
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'], 
  news: ['shgsh_novosti', 'hladenko', 'gladmedia', 'gladdrophub'] 
};

async function fetchTelegramPosts(channels, type) {
  let allPosts = [];
  for (const channel of channels) {
    try {
      const res = await fetch(`https://t.me/s/${channel}`); 
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

app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  if (!CHANNELS[type]) return res.json([]);
  try {
    const posts = await fetchTelegramPosts(CHANNELS[type], type);
    res.json(posts);
  } catch (e) { res.json([]); }
});

// --- ПРОФИЛЬ И ИГРЫ ---
// Простой тестовый ID, чтобы работало без авторизации (для теста)
const TEST_UID = 123456789; 

app.get('/api/profile', async (req, res) => {
  try {
    let result = await pool.query('SELECT * FROM users WHERE id = $1', [TEST_UID]);
    if (result.rows.length === 0) {
      await pool.query('INSERT INTO users (id, first_name, stars, coins) VALUES ($1, $2, $3, $4)', [TEST_UID, 'Игрок', 20, 0]);
      result = await pool.query('SELECT * FROM users WHERE id = $1', [TEST_UID]);
    }
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/spin', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT last_spin FROM users WHERE id = $1', [TEST_UID]);
    const lastSpin = rows[0].last_spin ? new Date(rows[0].last_spin).getTime() : 0;
    if (Date.now() - lastSpin < 2 * 3600 * 1000) return res.status(400).json({ error: 'Кулдаун 2 часа' });
    
    await pool.query('UPDATE users SET last_spin = NOW() WHERE id = $1', [TEST_UID]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ОТДАЧА HTML ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер запущен на порту ${port}`));
