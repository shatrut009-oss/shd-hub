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

pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Ошибка БД:', err.message);
  else console.log('✅ База данных Supabase подключена!');
});

// --- ФУНКЦИЯ СОЗДАНИЯ СЧЕТА В TELEGRAM STARS ---
app.post('/api/create-invoice', async (req, res) => {
  const { amount } = req.body; // Сколько звезд хочет купить
  const botToken = process.env.BOT_TOKEN;

  try {
    // Отправляем запрос в Telegram API для создания ссылки на оплату
    const response = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Пополнение баланса ШД Hub',
        description: `Покупка ${amount} звезд на баланс`,
        payload: `topup_${amount}_${Date.now()}`, // Уникальный ID платежа
        currency: 'XTR', // Валюта Telegram Stars
        prices: [{ label: 'Telegram Stars', amount: amount }]
      })
    });

    const data = await response.json();
    if (data.ok) {
      res.json({ url: data.result }); // Отправляем ссылку на оплату клиенту
    } else {
      res.status(400).json({ error: 'Ошибка создания счета' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- ОБРАБОТКА УСПЕШНОЙ ОПЛАТЫ (WEBHOOK) ---
// В реальном проекте Telegram сам пришлет сюда уведомление, когда пользователь оплатит.
// Пока мы просто сделаем эмуляцию для теста.
app.post('/api/confirm-payment', async (req, res) => {
  const { userId, amount } = req.body;
  try {
    await pool.query('UPDATE users SET stars = stars + $1 WHERE id = $2', [amount, userId]);
    await pool.query('INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)', 
      [userId, 'Пополнение баланса', 'Покупка звезд', `+${amount}`]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
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
  } catch (err) {
    res.json([]);
  }
});

// (Здесь остаются функции парсинга постов и лайков, мы их не трогаем)
// ... [Вставь сюда старый код fetchTelegramPosts и app.get('/api/posts') и app.post('/api/like')] ...

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, '0.0.0.0', () => console.log(`Сервер на порту ${port}`));
