const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Позволяем серверу читать JSON из запросов
app.use(express.json());

// Разрешаем серверу отдавать файлы (style.css, app.js и картинки)
app.use(express.static(__dirname)); 

// Тестовая база данных
const db = {
  posts: [
    // 1. Эдиты (Видео)
    { id: 1, type: 'video', title: 'Эдит: ШГШ 1 сезон', author: 'dima_shgsh', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', likes: 120, liked: false },
    { id: 2, type: 'video', title: 'Спойлер к финалу!', author: 'ksusha_fan', videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', likes: 340, liked: false },
    { id: 3, type: 'video', title: 'Нарезка лучших моментов', author: 'shgsh_edits', videoUrl: 'https://media.w3.org/2010/05/sintel/trailer.mp4', likes: 85, liked: false },
    
    // 2. Новости
    { id: 4, type: 'news', title: 'Выход новой серии', text: 'Сегодня вышла 5 серия! Смотрим все!', date: new Date().toISOString(), tags: ['Новости', 'ШГШ'], image: 'https://picsum.photos/400/200' },
    
    // 3. Закулисье (Блюр до 50 лайков)
    { id: 5, type: 'backstage', title: 'Секрет со съемок', text: 'А вы знали, что сцена в столовой снималась 10 дублей?', date: new Date().toISOString(), likes: 10, liked: false, tags: ['Инсайд'], image: 'https://picsum.photos/400/300' },
    { id: 6, type: 'backstage', title: 'Костюмы актеров', text: 'Фото со склада реквизита!', date: new Date().toISOString(), likes: 55, liked: false, tags: ['Фото'] }
  ],
  comments: []
};
const cheerio = require('cheerio');

// Функция для получения новостей из Telegram-канала
async function fetchTelegramNews() {
  try {
    const response = await fetch('https://t.me/s/shgsh_novosti');
    const html = await response.text();
    const $ = cheerio.load(html);
    const news = [];

    $('.tgme_widget_message').each((i, el) => {
      const text = $(el).find('.tgme_widget_message_text').text().trim();
      const imageStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
      const image = imageStyle ? imageStyle.match(/url\('(.*)'\)/)?.[1] : null;
      const date = $(el).find('.tgme_widget_message_date time').attr('datetime');

      if (text || image) {
        news.push({
          id: 'tg-' + i,
          type: 'news',
          title: 'Новости ШГШ',
          text: text,
          image: image,
          date: date || new Date().toISOString(),
          tags: ['ШГШ', 'Новости']
        });
      }
    });
    return news.reverse(); // Чтобы новые посты были сверху
  } catch (error) {
    console.error('Ошибка парсинга ТГ:', error);
    return [];
  }
}

// ================= API ЭНДПОИНТЫ =================

// 1. Получение постов (с фильтрацией по типу: video, news, backstage)
app.get('/api/posts', (req, res) => {
  const type = req.query.type;
  const filtered = db.posts.filter(p => p.type === type);
  res.json(filtered);
});

// 2. Обработка лайков
app.post('/api/like', (req, res) => {
  const { postId } = req.body;
  const post = db.posts.find(p => p.id === postId);
  
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    res.json(post); // Возвращаем обновленный пост
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// 3. Получение комментариев к посту
app.get('/api/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id);
  res.json(db.comments.filter(c => c.postId === postId));
});

// 4. Добавление нового комментария
app.post('/api/posts/:id/comments', (req, res) => {
  const newComment = { 
    postId: Number(req.params.id), 
    name: req.body.name, 
    text: req.body.text 
  };
  db.comments.push(newComment);
  res.json(newComment);
});

// 5. Статистика профиля и награды
app.get('/api/profile/stats', (req, res) => {
  res.json({ 
    messages: 5, 
    likes: 42, 
    comments: 12, 
    rewards: [{ icon: '🏆', title: 'Активист', description: 'Поставил 10 лайков' }] 
  });
});

// Главная страница (отдаем index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
