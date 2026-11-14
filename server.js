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
        // 1. Пропускаем закрепленные сообщения
        if ($(el).hasClass('tgme_widget_message_pinned')) return;

        // 2. Сохраняем переносы строк в тексте
        $(el).find('.tgme_widget_message_text').find('br').replaceWith('\n');
        const text = $(el).find('.tgme_widget_message_text').text().trim();
        
        // 3. Ищем картинки
        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        
        // 4. Ищем видео
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;

        // 5. ЖЕСТКИЙ ФИЛЬТР СПАМА
        // Если нет картинки, нет видео и текст меньше 15 символов — это мусор
        if (!image && !videoUrl && text.length < 15) return; 
        // Если это просто ссылка без текста
        if (!image && !videoUrl && text.startsWith('http') && text.split(' ').length === 1) return;

        // 6. Получаем дату
        const dateStr = $(el).find('time').attr('datetime') || new Date().toISOString();
        const timestamp = new Date(dateStr).getTime();

        allPosts.push({ 
          id: $(el).attr('data-post') || `${channel}-${i}`, 
          type, 
          author: channel, 
          text, 
          image, 
          videoUrl, 
          date: timestamp
        });
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  
  // Сортируем: новые сверху
  allPosts.sort((a, b) => b.date - a.date);
  
  // Отдаем только 50 самых свежих постов, чтобы не грузить ленту бесконечно
  return allPosts.slice(0, 50);
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
