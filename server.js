const express = require('express');
const path = require('path');
const cheerio = require('cheerio');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ВСЕ ТВОИ КАНАЛЫ
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
        const text = $(el).find('.tgme_widget_message_text').text().trim();
        
        // Картинки
        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        
        // Видео (только прямые mp4)
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;
        
        // В Эдиты берем только если есть фото или видео
        if (type === 'edits' && !image && !videoUrl) return;

        allPosts.push({ 
          id: $(el).attr('data-post') || `${channel}-${i}`, 
          type, 
          author: channel, 
          text: text || '', 
          image, 
          videoUrl, 
          date: new Date($(el).find('time').attr('datetime') || Date.now()).getTime() 
        });
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  
  // Сортируем: самые новые сверху
  return allPosts.sort((a, b) => b.date - a.date);
}

app.get('/api/posts', async (req, res) => {
  const type = req.query.type;
  if (!CHANNELS[type]) return res.json([]);
  try {
    const posts = await fetchTelegramPosts(CHANNELS[type], type);
    res.json(posts);
  } catch (e) { res.json([]); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(port, '0.0.0.0', () => console.log(`Сервер запущен на порту ${port}`));
