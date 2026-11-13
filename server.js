const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const CHANNELS = {
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'],
  news: ['shgsh_novosti'],
  backstage: ['hladenko', 'gladmedia', 'gladdrophub']
};

// Временная база для лайков и комментов (чтобы обновлялось в реальном времени)
const db = {
  likes: {}, // { postId: count }
  comments: [] // { postId, name, text }
};

// Кэш для постов, чтобы не грузить Telegram каждый раз (живет 5 минут)
let cache = { edits: null, news: null, backstage: null, lastUpdate: 0 };

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
        const videoUrl = $(el).find('.tgme_widget_message_video_player video').attr('src');
        
        // Парсим опросы
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

        const postId = `${channel}-${i}`;
        
        if (text || image || videoUrl || poll) {
          allPosts.push({
            id: postId,
            type: type,
            author: channel,
            text: text || '',
            image,
            videoUrl,
            poll,
            date: new Date().toISOString(),
            likes: db.likes[postId] || Math.floor(Math.random() * 50), // Если лайков нет, ставим рандом для теста
            comments: db.comments.filter(c => c.postId === postId).length
          });
        }
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  return allPosts.reverse(); // Новые сверху
}

app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  const now = Date.now();
  
  // Если кэшу больше 5 минут, обновляем
  if (!cache[type] || (now - cache.lastUpdate > 300000)) {
    cache[type] = await fetchTelegramPosts(CHANNELS[type], type);
    cache.lastUpdate = now;
  }
  res.json(cache[type]);
});

app.post('/api/like', (req, res) => {
  const { postId, action } = req.body;
  if (!db.likes[postId]) db.likes[postId] = Math.floor(Math.random() * 50); // стартовое значение
  
  if (action === 'unlike') db.likes[postId]--;
  else db.likes[postId]++;
  
  res.json({ likes: db.likes[postId] });
});

app.get('/api/posts/:id/comments', (req, res) => {
  res.json(db.comments.filter(c => c.postId === req.params.id));
});

app.post('/api/posts/:id/comments', (req, res) => {
  db.comments.push({ postId: req.params.id, name: req.body.name, text: req.body.text });
  res.json({ success: true });
});

app.get('/api/profile/stats', (req, res) => {
  res.json({ messages: 5, likes: 42, comments: 12, rewards: [{ icon: '🏆', title: 'Активист', description: 'Поставил 10 лайков' }] });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер запущен на порту ${port}`));
