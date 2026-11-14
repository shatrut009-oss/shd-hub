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

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Ошибка БД:', err.message);
  else console.log('✅ База данных Supabase подключена!');
});

// --- КАНАЛЫ ---
const CHANNELS = {
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'],
  news: ['shgsh_novosti'],
  backstage: ['hladenko', 'gladmedia', 'gladdrophub']
};

const dbLikes = {};

// --- ПАРСЕР TELEGRAM ---
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

        let poll = null;
        const pollEl = $(el).find('.tgme_widget_message_poll');
        if (pollEl.length) {
           const question = pollEl.find('.tgme_widget_message_poll_question').text().trim();
           const options = [];
           pollEl.find('.tgme_widget_message_poll_option').each((j, opt) => {
             options.push($(opt).find('.tgme_widget_message_poll_option_text').text().trim());
           });
           if (question) poll = { question, options };
        }

        allPosts.push({
          id: postId,
          type: type,
          author: channel,
          text: text || '',
          image: image,
          videoUrl: videoUrl,
          poll,
          date: new Date(dateStr).getTime(),
          likes: dbLikes[postId] || 0
        });
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  allPosts.sort((a, b) => b.date - a.date);
  return allPosts;
}

app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  try {
    const posts = await fetchTelegramPosts(CHANNELS[type] || [], type);
    res.json(posts);
  } catch (e) { res.json([]); }
});

app.post('/api/like', (req, res) => {
  const { postId, action } = req.body;
  if (dbLikes[postId] === undefined) dbLikes[postId] = 0;
  if (action === 'unlike' && dbLikes[postId] > 0) dbLikes[postId]--;
  else if (action === 'like') dbLikes[postId]++;
  res.json({ likes: dbLikes[postId] });
});

// --- ПРОФИЛЬ ---
app.get('/api/profile/stats', async (req, res) => {
  const userId = req.query.id;
  const username = req.query.username || 'unknown';
  const firstname = req.query.name || 'Гость';
  const avatar = req.query.avatar || '';
  
  if (!userId || userId === 'guest') return res.json({ stars: 0, coins: 0, points: 0 });

  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (id, username, first_name, avatar_url) VALUES ($1, $2, $3, $4)',
        [userId, username, firstname, avatar]
      );
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    }

    const user = userResult.rows[0];
    res.json({ stars: user.stars || 0, coins: parseFloat(user.coins) || 0, points: user.points || 0 });
  } catch (err) {
    res.json({ stars: 0, coins: 0, points: 0 });
  }
});

// --- ИСТОРИЯ ---
app.get('/api/history', async (req, res) => {
  const userId = req.query.id;
  try {
    const hist = await pool.query('SELECT * FROM history WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(hist.rows);
  } catch (err) { res.json([]); }
});

// --- ОПЛАТА ЗВЕЗДАМИ (STARS) ---
app.post('/api/create-invoice', async (req, res) => {
  const { amount } = req.body;
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('❌ ОШИБКА: BOT_TOKEN не добавлен в переменные окружения на Render!');
    return res.status(500).json({ error: 'Server configuration error: No Bot Token' });
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Пополнение баланса ШД Hub',
        description: `Покупка ${amount} звезд на баланс`,
        payload: `topup_${amount}_${Date.now()}`,
        currency: 'XTR',
        prices: [{ label: 'Telegram Stars', amount: amount }]
      })
    });

    const data = await response.json();
    
    if (data.ok) {
      res.json({ url: data.result });
    } else {
      console.error('❌ Ошибка от Telegram API:', data);
      res.status(400).json({ error: 'Ошибка создания счета в Telegram' });
    }
  } catch (error) { 
    console.error('❌ Ошибка сервера при создании счета:', error);
    res.status(500).json({ error: 'Server error' }); 
  }
});

// Подтверждение оплаты
app.post('/api/confirm-payment', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2', [amount, userId]);
    await pool.query('INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)', 
      [userId, 'Пополнение баланса', 'Покупка звезд', `+${amount}`]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'DB error' }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер на порту ${port}`));
