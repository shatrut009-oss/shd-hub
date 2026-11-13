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

// Хранилище лайков (стабильное)
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
        
        // Берем только НАСТОЯЩИЕ видео (.mp4), игнорируем ссылки на YouTube/TikTok
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;
        
        // Уникальный ID поста из Telegram (data-post="channel/123")
        const dataPost = $(el).attr('data-post');
        const postId = dataPost ? dataPost : `${channel}-${i}`;
        
        const dateStr = $(el).find('time').attr('datetime') || new Date().toISOString();

        // Опросы
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

        // Если есть контент
        if (text || image || videoUrl || poll) {
          allPosts.push({
            id: postId,
            type: type,
            author: channel,
            text: text || '',
            image: image,
            videoUrl: videoUrl,
            poll,
            date: new Date(dateStr).getTime(), // Переводим в миллисекунды для сортировки
            likes: dbLikes[postId] || 0, // Всегда начинаем с 0
            comments: 0
          });
        }
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  
  // Сортируем ВСЕ посты по времени (новые сверху)
  allPosts.sort((a, b) => b.date - a.date);
  return allPosts;
}

app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  try {
    const posts = await fetchTelegramPosts(CHANNELS[type], type);
    res.json(posts);
  } catch (e) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/like', (req, res) => {
  const { postId, action } = req.body;
  if (dbLikes[postId] === undefined) dbLikes[postId] = 0;
  
  if (action === 'unlike' && dbLikes[postId] > 0) dbLikes[postId]--;
  else if (action === 'like') dbLikes[postId]++;
  
  res.json({ likes: dbLikes[postId] });
});

// Комментарии (имитация)
const dbComments = [];
app.get('/api/posts/:id/comments', (req, res) => {
  res.json(dbComments.filter(c => c.postId === req.params.id));
});
app.post('/api/posts/:id/comments', (req, res) => {
  dbComments.push({ postId: req.params.id, name: req.body.name, text: req.body.text });
  res.json({ success: true });
});

// Статистика профиля
app.get('/api/profile/stats', (req, res) => {
  res.json({ 
    rank: 140, points: 54, items: 8,
    messages: 12, likes: 42, comments: 5, 
    rewards: [
      { icon: '🏆', title: 'Активист', description: 'Поставил 10 лайков' },
      { icon: '🔥', title: 'Олдфаг', description: 'С нами с первого сезона' }
    ] 
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер запущен на порту ${port}`));
