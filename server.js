const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ (БЕЗ ПАДЕНИЙ) ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Ошибка подключения БД:', err.message);
  else console.log('✅ База данных Supabase успешно подключена!');
});

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
        
        // Фильтр для Эдитов (чтобы не было пустых постов)
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
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/like', (req, res) => {
  const { postId, action } = req.body;
  if (dbLikes[postId] === undefined) dbLikes[postId] = 0;
  if (action === 'unlike' && dbLikes[postId] > 0) dbLikes[postId]--;
  else if (action === 'like') dbLikes[postId]++;
  res.json({ likes: dbLikes[postId] });
});

// --- ПРОФИЛЬ (БЕЗОПАСНАЯ ПЕРЕДАЧА ДАННЫХ) ---
app.get('/api/profile/stats', async (req, res) => {
  const userId = req.query.id;
  const username = req.query.username || 'unknown';
  const firstname = req.query.name || 'Гость';
  
  if (!userId || userId === 'guest') {
    return res.json({ stars: 0, coins: 0, points: 0 });
  }

  try {
    let userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      // Создаем нового пользователя
      await pool.query(
        'INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3)',
        [userId, username, firstname]
      );
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    }

    const user = userResult.rows[0];
    res.json({ stars: user.stars || 0, coins: parseFloat(user.coins) || 0, points: user.points || 0 });
  } catch (err) {
    console.error('Ошибка профиля:', err);
    // Если база упала, отдаем нули, чтобы интерфейс не ломался
    res.json({ stars: 0, coins: 0, points: 0 });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер запущен на порту ${port}`));
