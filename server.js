const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(express.static(__dirname, { index: false }));

const BOT_TOKEN = process.env.BOT_TOKEN;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CASES = {
  diary: { name: 'Дневничок', price: 3,  cur: 'coins', odds: { common: 60, rare: 30, epic: 9,  legend: 1 } },
  cheat: { name: 'Шпаргалка', price: 10, cur: 'stars', odds: { common: 55, rare: 30, epic: 12, legend: 3 } },
  stick: { name: 'Палочка',   price: 13, cur: 'stars', odds: { common: 45, rare: 35, epic: 15, legend: 5 } }
};

const CHARACTERS = {
  common: ['Школьник', 'Буфетчица'],
  rare:   ['Наташа', 'Харитонов'],
  epic:   ['Ксюша', 'Гладенко'],
  legend: ['Дима']
};

const DAILY_COINS = 0.5;
const DAY_MS = 24 * 60 * 60 * 1000;

pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0')
  .catch(err => console.error('migration:', err.message));

// id и имя приходят через query params, а не через headers (кириллица ломает headers)
const qid = req => (req.query.id || (req.body && req.body.id) || '').toString();
const qname = req => (req.query.name || (req.body && req.body.name) || 'Гость').toString();

async function getUser(id, name) {
  await pool.query(
    `INSERT INTO users (id, first_name) VALUES ($1, $2)
     ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name`,
    [id, name]
  );
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0];
}

const fmtUser = u => ({
  id: String(u.id),
  name: u.first_name,
  stars: u.stars,
  coins: Number(u.coins),
  streak: u.streak || 0
});

const roll = odds => {
  let r = Math.random() * 100;
  for (const [k, v] of Object.entries(odds)) if ((r -= v) < 0) return k;
  return 'common';
};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ---------- ПРОФИЛЬ ----------
app.get('/api/profile/stats', async (req, res) => {
  try {
    const u = await getUser(qid(req), qname(req));
    const last = u.last_daily ? new Date(u.last_daily).getTime() : 0;
    const waitMs = Math.max(0, DAY_MS - (Date.now() - last));
    res.json({ ...fmtUser(u), canClaim: waitMs === 0, waitMs });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка базы' }); }
});

app.get('/api/daily-bonus', async (req, res) => {
  const id = qid(req);
  try {
    const u = await getUser(id, qname(req));
    const last = u.last_daily ? new Date(u.last_daily).getTime() : 0;
    const elapsed = Date.now() - last;
    if (elapsed < DAY_MS) return res.json({ ok: false, waitMs: DAY_MS - elapsed });

    // Серия сбрасывается, если пропущено больше 48 часов
    const streak = (elapsed < 2 * DAY_MS ? (u.streak || 0) : 0) + 1;
    const { rows } = await pool.query(
      `UPDATE users SET coins = coins + $2, streak = $3, last_daily = NOW()
       WHERE id = $1 RETURNING *`,
      [id, DAILY_COINS, streak]
    );
    await pool.query(
      `INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)`,
      [id, 'Ежедневный бонус', `Серия: ${streak} дн.`, '+0.5 монеты']
    );
    res.json({ ok: true, ...fmtUser(rows[0]) });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка базы' }); }
});

app.get('/api/history', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT title, description, amount, created_at FROM history
       WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`, [qid(req)]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка базы' }); }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT character_name, rarity, created_at FROM inventory
       WHERE user_id = $1 ORDER BY created_at DESC`, [qid(req)]);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка базы' }); }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT first_name AS name, coins FROM users ORDER BY coins DESC LIMIT 5`);
    res.json(rows);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка базы' }); }
});

// ---------- КЕЙСЫ ----------
app.post('/api/open-case', async (req, res) => {
  const id = qid(req);
  const c = CASES[req.body && req.body.caseKey];
  if (!c) return res.status(400).json({ error: 'Неизвестный кейс' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO users (id, first_name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [id, qname(req)]);
    const { rows: [u] } = await client.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [id]);

    const balance = c.cur === 'stars' ? u.stars : Number(u.coins);
    if (balance < c.price) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: `Недостаточно ${c.cur === 'stars' ? 'звёзд' : 'монет'}` });
    }

    await client.query(
      `UPDATE users SET ${c.cur} = ${c.cur} - $2 WHERE id = $1`, [id, c.price]);

    const rarity = roll(c.odds);
    const character = pick(CHARACTERS[rarity]);

    await client.query(
      `INSERT INTO inventory (user_id, character_name, rarity) VALUES ($1, $2, $3)`,
      [id, character, rarity]);
    await client.query(
      `INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)`,
      [id, 'Открытие кейса', `Кейс «${c.name}»: ${character}`,
       `-${c.price} ${c.cur === 'stars' ? '★' : 'монет'}`]);

    await client.query('COMMIT');
    res.json({ character, rarity });
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(e);
    res.status(500).json({ error: 'Ошибка базы' });
  } finally {
    client.release();
  }
});

// ---------- ПОПОЛНЕНИЕ ЗВЁЗД (Telegram Stars) ----------
app.post('/api/create-invoice', async (req, res) => {
  const id = qid(req);
  const stars = Math.floor(Number(req.body && req.body.stars));
  if (!(stars >= 1 && stars <= 10000)) return res.status(400).json({ error: 'Некорректная сумма' });

  try {
    const r = await fetch(`${API}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Пополнение звёзд',
        description: `Пополнение баланса в ШД Hub на ${stars} ★`,
        payload: `topup:${id}:${stars}`,
        provider_token: '',
        currency: 'XTR',
        prices: [{ label: `${stars} звёзд`, amount: stars }]
      })
    });
    const j = await r.json();
    if (!j.ok) return res.status(500).json({ error: j.description });
    res.json({ url: j.result });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Ошибка Telegram' }); }
});

// Вебхук бота: подтверждаем предоплату и зачисляем звёзды после оплаты
app.post('/telegram-webhook', async (req, res) => {
  if (process.env.WEBHOOK_SECRET &&
      req.get('x-telegram-bot-api-secret-token') !== process.env.WEBHOOK_SECRET) {
    return res.sendStatus(403);
  }
  res.sendStatus(200);
  const upd = req.body || {};
  try {
    if (upd.pre_checkout_query) {
      await fetch(`${API}/answerPreCheckoutQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pre_checkout_query_id: upd.pre_checkout_query.id, ok: true })
      });
    }
    const sp = upd.message && upd.message.successful_payment;
    if (sp) {
      const [, uid, stars] = sp.invoice_payload.split(':');
      const marker = `Платёж ${sp.telegram_payment_charge_id}`;
      const dup = await pool.query('SELECT 1 FROM history WHERE description = $1', [marker]);
      if (!dup.rows.length) {
        await pool.query('UPDATE users SET stars = stars + $2 WHERE id = $1', [uid, Number(stars)]);
        await pool.query(
          `INSERT INTO history (user_id, title, description, amount) VALUES ($1, $2, $3, $4)`,
          [uid, 'Пополнение звёзд', marker, `+${stars} ★`]);
      }
    }
  } catch (e) { console.error('webhook:', e); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(process.env.PORT || 3000, () => console.log('ШД Hub запущен'));
