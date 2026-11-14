const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const WEBAPP_URL = process.env.WEBAPP_URL || '';
const DEV_MODE = process.env.DEV_MODE === '1';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const MIN = 6e4, DAY = 864e5, HOUR = 36e5;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json({ limit: '50kb' }));

// Служебные файлы сервера не отдаём по прямой ссылке
app.use((req, res, next) => {
  if (/^\/(server\.js|package(-lock)?\.json|\.env)$/i.test(req.path)) return res.sendStatus(404);
  next();
});
app.use(express.static(__dirname, { index: false }));

// ---------- ИГРОВЫЕ ДАННЫЕ ----------
const RAR = {
  common: { ru: 'Обычный',     pts: 1,  color: '#9aa0a6' },
  rare:   { ru: 'Редкий',      pts: 2,  color: '#4da3ff' },
  epic:   { ru: 'Эпический',   pts: 4,  color: '#b36bff' },
  legend: { ru: 'Легендарный', pts: 6,  color: '#ffb020' },
  mythic: { ru: 'Мифический',  pts: 10, color: '#ff3ea5' }
};

// ---------- ВСТРОЕННЫЕ SVG-ИКОНКИ ПЕРСОНАЖЕЙ ----------
const IMG_DIMA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='30' cy='30' r='12' fill='%234a4a4a'/><circle cx='70' cy='30' r='12' fill='%234a4a4a'/><path d='M20,40 Q50,90 80,40 L80,20 Q50,0 20,20 Z' fill='%234a4a4a'/><rect x='30' y='45' width='40' height='12' rx='4' fill='%23111'/><circle cx='40' cy='51' r='3' fill='%23fff'/><circle cx='60' cy='51' r='3' fill='%23fff'/></svg>";
const IMG_DIMA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='22' fill='%23e0ac69'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23333'/><path d='M25,40 Q50,10 75,40 Q75,25 50,20 Q25,25 25,40 Z' fill='%23222'/><circle cx='40' cy='45' r='3' fill='%23000'/><circle cx='60' cy='45' r='3' fill='%23000'/></svg>";
const IMG_KSU_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,90 L40,65 L60,65 L70,90 Z' fill='%23ffb6c1'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><circle cx='42' cy='45' r='2' fill='%23000'/><circle cx='58' cy='45' r='2' fill='%23000'/></svg>";
const IMG_KSU_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,90 L40,65 L60,65 L70,90 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_KSU_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_RITA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23111'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_RITA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='50' r='25' fill='%23fce4d6'/><path d='M20,50 Q20,20 50,20 Q80,20 80,50 Q85,80 90,90 L10,90 Q15,80 20,50 Z' fill='%23f4d03f'/></svg>";
const IMG_ALENA_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,20 Q50,10 70,20 L70,35 Q50,25 30,35 Z' fill='%23111'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/></svg>";
const IMG_ALENA_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M30,60 L70,100 L60,100 L20,60 Z' fill='%232e8b57'/><path d='M30,30 Q50,15 70,30 Q80,50 70,70 Q50,85 30,70 Q20,50 30,30 Z' fill='%238b4513'/></svg>";
const IMG_ALENA_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23ff9800'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%238b4513'/></svg>";
const IMG_SALAM_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M30,20 L40,10 L60,10 L70,20 Q60,30 50,30 Q40,30 30,20 Z' fill='%23fff'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,80 Z' fill='%23ff1e3c'/></svg>";
const IMG_SALAM_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/></svg>";
const IMG_NAT_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M45,65 L55,65 L50,85 Z' fill='%23ff1e3c'/></svg>";
const IMG_NAT_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><circle cx='30' cy='20' r='8' fill='%23fff'/><circle cx='70' cy='20' r='8' fill='%23fff'/></svg>";
const IMG_NAT_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/></svg>";
const IMG_NAT_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23f4d03f'/><path d='M40,55 Q50,60 60,55' stroke='%23000' stroke-width='2' fill='none'/></svg>";
const IMG_GLAD_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23111'/></svg>";
const IMG_GLAD_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23fff'/></svg>";
const IMG_GLAD_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M25,35 Q50,15 75,35 Q75,25 50,20 Q25,25 25,35 Z' fill='%23ffd700'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23ffeb3b'/></svg>";
const IMG_GLAD_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23222'/></svg>";
const IMG_GLAD_5 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/><path d='M20,100 Q20,65 50,60 Q80,65 80,100 Z' fill='%23333'/></svg>";
const IMG_GLAD_6 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='25' fill='%23e0ac69'/><path d='M30,50 Q30,70 50,70 Q70,70 70,50 Z' fill='%23222'/></svg>";
const IMG_MILK_1 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M35,65 Q50,70 65,65' stroke='%23000' stroke-width='4' fill='none'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%238b4513'/></svg>";
const IMG_MILK_2 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23fff'/><path d='M25,45 Q25,20 75,20 Q75,45 75,60 Q25,60 25,45 Z' fill='%234caf50'/><circle cx='40' cy='40' r='3' fill='%23000'/><circle cx='60' cy='40' r='3' fill='%23000'/><rect x='45' y='50' width='10' height='5' fill='%23000'/></svg>";
const IMG_MILK_3 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><circle cx='50' cy='45' r='20' fill='%23fce4d6'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 50,20 Q75,20 75,45 Q80,70 90,80 Q60,70 50,80 Q40,70 10,80 Q20,70 25,45 Z' fill='%23111'/></svg>";
const IMG_MILK_4 = "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><rect width='100' height='100' rx='20' fill='%231c1c22'/><path d='M20,100 Q20,70 50,65 Q80,70 80,100 Z' fill='%23222'/><path d='M25,45 Q25,20 75,20 Q75,45 75,60 Q25,60 25,45 Z' fill='%234caf50'/><circle cx='40' cy='40' r='3' fill='%23000'/><circle cx='60' cy='40' r='3' fill='%23000'/></svg>";

const CHARS = {
  common: ['Дима (Балаклава)', 'Дима', 'Ксюша (Розовый)', 'Ксюша (Школа)', 'Ксюша (Куртка)'],
  rare:   ['Рита (Коктейль)', 'Рита', 'Алёна (Ванная)', 'Алёна (Лента)', 'Алёна'],
  epic:   ['Саламандра (Машина)', 'Саламандра', 'Наташа (Школа)', 'Наташа (Цветок)', 'Наташа', 'Наташа (Улыбка)'],
  legend: ['Гладенко (Боксер)', 'Гладенко (Врач)', 'Гладенко (Строитель)', 'Гладенко (Костюм)', 'Гладенко', 'Гладенко (Портрет)'],
  mythic: ['Миллкис (Чокер)', 'Миллкис (Зелёная маска)', 'Миллкис', 'Миллкис (Экшн)']
};

const CUSTOM_IMAGES = {
  'Дима (Балаклава)': IMG_DIMA_1, 'Дима': IMG_DIMA_2,
  'Ксюша (Розовый)': IMG_KSU_1, 'Ксюша (Школа)': IMG_KSU_2, 'Ксюша (Куртка)': IMG_KSU_3,
  'Рита (Коктейль)': IMG_RITA_1, 'Рита': IMG_RITA_2,
  'Алёна (Ванная)': IMG_ALENA_1, 'Алёна (Лента)': IMG_ALENA_2, 'Алёна': IMG_ALENA_3,
  'Саламандра (Машина)': IMG_SALAM_1, 'Саламандра': IMG_SALAM_2,
  'Наташа (Школа)': IMG_NAT_1, 'Наташа (Цветок)': IMG_NAT_2, 'Наташа': IMG_NAT_3, 'Наташа (Улыбка)': IMG_NAT_4,
  'Гладенко (Боксер)': IMG_GLAD_1, 'Гладенко (Врач)': IMG_GLAD_2, 'Гладенко (Строитель)': IMG_GLAD_3, 'Гладенко (Костюм)': IMG_GLAD_4, 'Гладенко': IMG_GLAD_5, 'Гладенко (Портрет)': IMG_GLAD_6,
  'Миллкис (Чокер)': IMG_MILK_1, 'Миллкис (Зелёная маска)': IMG_MILK_2, 'Миллкис': IMG_MILK_3, 'Миллкис (Экшн)': IMG_MILK_4
};

function avatarSvg(name, rar){
  const c = RAR[rar].color;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" rx="20" fill="#1c1c22"/>` +
    `<path d="M18 100Q18 64 50 60Q82 64 82 100Z" fill="${c}" opacity=".55"/>` +
    `<circle cx="50" cy="40" r="19" fill="${c}"/>` +
    `<text x="50" y="49" text-anchor="middle" font-family="Impact,sans-serif" font-size="22" fill="#000">${name[0]}</text>` +
    `</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const IMG = {};
const CHAR_LIST = [];
for (const [rar, names] of Object.entries(CHARS)) {
  for (const name of names) {
    const img = CUSTOM_IMAGES[name] || avatarSvg(name, rar);
    IMG[name] = img;
    CHAR_LIST.push({ name, rar, img });
  }
}

const BG = { 'Без фона': 60, 'Дневник': 25, 'Школа ночью': 12, 'Неон': 3 };
const CASES = {
  free:  { free: true, odds: { common: 60, rare: 28, epic: 8,   legend: 3,   mythic: 0.5, coin: 0.5 } },
  diary: { cost: 3,  cur: 'coins', odds: { common: 58, rare: 28, epic: 9,   legend: 2.5, mythic: 0.5, coin: 2 } },
  cheat: { cost: 10, cur: 'stars', odds: { common: 54, rare: 30, epic: 11,  legend: 3.5, mythic: 0.5, coin: 1 } },
  stick: { cost: 13, cur: 'stars', odds: { common: 45, rare: 35, epic: 14,  legend: 4.5, mythic: 0.5, coin: 1 } }
};
const SPENDS = {
  clan_create: { cur: 'stars', cost: 8 },
  clan_member: { cur: 'stars', cost: 4 },
  mazka_m1:    { cur: 'ruch',  cost: 300 },
  mazka_m2:    { cur: 'ruch',  cost: 1000 },
  mazka_m3:    { cur: 'ruch',  cost: 3000 },
  mazka_m2_s:  { cur: 'stars', cost: 15 },
  mazka_m3_s:  { cur: 'stars', cost: 40 }
};

const LOTS = [
  { id: 1, prize: 'Ксюша (Розовый)',   rar: 'common', ends: Date.now() + 2 * MIN,  pool: { 'Лена': 12, 'Вика': 30, 'Игорь': 7 }, tk: {}, draw: null },
  { id: 2, prize: 'Гладенко (Боксер)', rar: 'legend', ends: Date.now() + 5 * MIN,  pool: { 'Саша': 9, 'Марина': 4 },            tk: {}, draw: null },
  { id: 3, prize: 'Миллкис (Чокер)',   rar: 'mythic', ends: Date.now() + 10 * MIN, pool: { 'Никита': 20 },                      tk: {}, draw: null }
];

// ---------- БАЗА ----------
async function initDb(){
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY, username TEXT, first_name TEXT,
      stars INTEGER DEFAULT 0, coins NUMERIC DEFAULT 0, points NUMERIC DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY, user_id BIGINT, character_name TEXT, rarity TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS ruch INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS kap INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sub_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_daily TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_ruch TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_kap TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS lvl_tap INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS best_drop INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_drop TIMESTAMPTZ;
    ALTER TABLE inventory
      ADD COLUMN IF NOT EXISTS tirage INTEGER,
      ADD COLUMN IF NOT EXISTS bg TEXT;
    CREATE TABLE IF NOT EXISTS payments (
      charge_id TEXT PRIMARY KEY, user_id BIGINT, stars INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

// ---------- ХЕЛПЕРЫ ----------
const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => {
  if (e.status) return res.status(e.status).json({ error: e.message });
  console.error(e);
  if (!res.headersSent) res.status(500).json({ error: 'Ошибка сервера' });
});
const roll = o => {
  let r = Math.random() * Object.values(o).reduce((a, b) => a + b, 0);
  for (const k in o) { r -= o[k]; if (r < 0) return k; }
  return Object.keys(o)[0];
};
const rnd = n => Math.floor(Math.random() * n);

async function withTx(fn){
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) {
    await c.query('ROLLBACK').catch(() => {});
    throw e;
  } finally { c.release(); }
}

async function getUser(uid){
  const { rows: [u] } = await pool.query('SELECT * FROM users WHERE id = $1', [uid]);
  return u;
}

const view = u => ({
  name: u.first_name,
  stars: u.stars || 0,
  coins: Number(u.coins) || 0,
  points: Number(u.points) || 0,
  ruch: u.ruch || 0,
  kap: u.kap || 0,
  sub: u.sub_until ? new Date(u.sub_until).getTime() : 0,
  dailyAt: u.last_daily ? new Date(u.last_daily).getTime() : 0,
  ruchAt: u.last_ruch ? new Date(u.last_ruch).getTime() : 0,
  kapAt: u.last_kap ? new Date(u.last_kap).getTime() : 0,
  dropAt: u.last_drop ? new Date(u.last_drop).getTime() : 0,
  bestDrop: u.best_drop || 0,
  joined: new Date(u.created_at).getTime(),
  lvl: { tap: u.lvl_tap || 1 }
});

async function grantChar(db, uid, name, rar){
  const { rows: [t] } = await db.query('SELECT COALESCE(MAX(tirage), 0) + 1 AS n FROM inventory');
  const tir = t.n;
  const bg = roll(BG);
  const pts = RAR[rar].pts * (tir <= 100 ? 1.5 : 1) * (bg === 'Неон' ? 1.5 : 1);
  await db.query(
    'INSERT INTO inventory (user_id, character_name, rarity, tirage, bg) VALUES ($1,$2,$3,$4,$5)',
    [uid, name, rar, tir, bg]);
  await db.query('UPDATE users SET points = points + $2 WHERE id = $1', [uid, pts]);
  return { name, rar, tir, bg, img: IMG[name] || null };
}

function parseInitData(initData){
  if (!initData || !BOT_TOKEN) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get('hash');
  if (!hash) return null;
  p.delete('hash');
  const check = [...p.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secret).update(check).digest('hex');
  if (calc.length !== hash.length || !crypto.timingSafeEqual(Buffer.from(calc), Buffer.from(hash))) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date')) > 86400) return null;
  try { return JSON.parse(p.get('user')); } catch { return null; }
}

const auth = wrap(async (req, res, next) => {
  const src = req.method === 'GET' ? req.query : (req.body || {});
  let u = parseInitData(String(src.initData || ''));
  if (!u && DEV_MODE && src.dev) u = { id: Number(src.dev), first_name: 'Dev ' + src.dev };
  if (!u || !u.id) return res.status(401).json({ error: 'Откройте приложение через Telegram' });
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Гость';
  await pool.query(
    `INSERT INTO users (id, first_name, username) VALUES ($1,$2,$3)
     ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, username = EXCLUDED.username`,
    [u.id, name, u.username || null]);
  req.uid = String(u.id);
  next();
});

app.get('/api/profile', auth, wrap(async (req, res) => {
  res.json(view(await getUser(req.uid)));
}));

app.get('/api/inventory', auth, wrap(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT character_name AS name, rarity AS rar, tirage AS tir, bg
     FROM inventory WHERE user_id = $1 ORDER BY tirage ASC`, [req.uid]);
  res.json(rows.map(r => ({ ...r, img: IMG[r.name] || null })));
}));

app.get('/api/leaderboard', auth, wrap(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT first_name AS name, points FROM users ORDER BY points DESC LIMIT 5');
  res.json(rows);
}));

app.post('/api/open-case', auth, wrap(async (req, res) => {
  const c = CASES[(req.body || {}).caseKey];
  if (!c) fail(400, 'Неизвестный кейс');

  const result = await withTx(async db => {
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    if (c.free) {
      if (u.last_daily && Date.now() - new Date(u.last_daily).getTime() < DAY) fail(429, 'Бесплатный кейс уже открыт сегодня');
      await db.query('UPDATE users SET last_daily = NOW() WHERE id = $1', [req.uid]);
    } else {
      const bal = c.cur === 'stars' ? u.stars : Number(u.coins);
      if (bal < c.cost) fail(402, 'Недостаточно ' + (c.cur === 'stars' ? 'звёзд' : 'монет'));
      await db.query(`UPDATE users SET ${c.cur} = ${c.cur} - $2 WHERE id = $1`, [req.uid, c.cost]);
    }

    const r = roll(c.odds);
    if (r === 'coin') {
      await db.query('UPDATE users SET coins = coins + 1 WHERE id = $1', [req.uid]);
      return { coin: true };
    }
    const list = CHAR_LIST.filter(ch => ch.rar === r);
    const ch = list[rnd(list.length)];
    return grantChar(db, req.uid, ch.name, r);
  });

  res.json({ result });
}));

app.post('/api/ruch', auth, wrap(async (req, res) => {
  const gain = 5 + rnd(21);
  const r = await pool.query(
    `UPDATE users SET ruch = ruch + $2, last_ruch = NOW()
     WHERE id = $1 AND (last_ruch IS NULL OR last_ruch <= NOW() - INTERVAL '1 hour') RETURNING id`,
    [req.uid, gain]);
  if (!r.rowCount) fail(429, 'Ручки ещё не готовы');
  res.json({ ok: true, gain });
}));

app.post('/api/kap', auth, wrap(async (req, res) => {
  const r = await pool.query(
    `UPDATE users SET kap = kap + (CASE WHEN sub_until > NOW() THEN 2 ELSE 1 END), last_kap = NOW()
     WHERE id = $1 AND (last_kap IS NULL OR last_kap <= NOW() - INTERVAL '10 minutes') RETURNING id`,
    [req.uid]);
  if (!r.rowCount) fail(429, 'Капельку можно получить раз в 10 минут');
  res.json({ ok: true });
}));

app.post('/api/kap-exchange', auth, wrap(async (req, res) => {
  const to = (req.body || {}).to;
  await withTx(async db => {
    const { rows: [u] } = await db.query('SELECT kap FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    const kap = u.kap || 0;
    if (to === 'coins') {
      if (kap < 100) fail(400, 'Нужно 100 капелек');
      const n = Math.floor(kap / 100);
      await db.query('UPDATE users SET kap = kap - $2, coins = coins + $3 WHERE id = $1', [req.uid, n * 100, n]);
    } else if (to === 'ruch') {
      if (kap < 1) fail(400, 'Нет капелек');
      const full = Math.floor(kap / 100);
      const got = full * 150 + (kap - full * 100);
      await db.query('UPDATE users SET kap = 0, ruch = ruch + $2 WHERE id = $1', [req.uid, got]);
    } else fail(400, 'Неизвестный обмен');
  });
  res.json({ ok: true });
}));

app.post('/api/subscribe', auth, wrap(async (req, res) => {
  const r = await pool.query(
    `UPDATE users SET stars = stars - 14,
       sub_until = GREATEST(COALESCE(sub_until, NOW()), NOW()) + INTERVAL '30 days'
     WHERE id = $1 AND stars >= 14 RETURNING id`, [req.uid]);
  if (!r.rowCount) fail(402, 'Нужно ★ 14');
  res.json({ ok: true });
}));

app.post('/api/spend', auth, wrap(async (req, res) => {
  const body = req.body || {};
  let cur, cost;
  if (body.key === 'treasury') {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount < 1) fail(400, 'Некорректное количество');
    cur = 'ruch'; cost = amount;
  } else {
    const s = SPENDS[body.key];
    if (!s) fail(400, 'Неизвестная покупка');
    cur = s.cur; cost = s.cost;
  }
  await withTx(async db => {
    const { rows: [u] } = await db.query('SELECT stars, ruch FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    if (u[cur] < cost) fail(402, cur === 'stars' ? 'Нужно больше звёзд' : 'Нужно больше ручек');
    await db.query(`UPDATE users SET ${cur} = ${cur} - $2 WHERE id = $1`, [req.uid, cost]);
  });
  res.json({ ok: true });
}));

app.post('/api/game/tap', auth, wrap(async (req, res) => {
  const level = Number((req.body || {}).level);
  const r = await pool.query(
    `UPDATE users
       SET ruch = ruch + LEAST(80, 10 + (FLOOR(lvl_tap / 3.0) * 2))::int,
           lvl_tap = lvl_tap + 1
     WHERE id = $1 AND lvl_tap = $2
     RETURNING lvl_tap`, [req.uid, level]);
  if (!r.rowCount) fail(409, 'Уровень уже засчитан');
  res.json({ ok: true, level: r.rows[0].lvl_tap });
}));

app.post('/api/game/drop', auth, wrap(async (req, res) => {
  const score = Math.max(0, Math.min(500, Math.floor(Number((req.body || {}).score)) || 0));
  const gain = Math.min(100, Math.floor(score / 5));
  const r = await pool.query(
    `UPDATE users
       SET ruch = ruch + $2, best_drop = GREATEST(best_drop, $3), last_drop = NOW()
     WHERE id = $1 AND (last_drop IS NULL OR last_drop <= NOW() - INTERVAL '60 seconds')
     RETURNING id`, [req.uid, gain, score]);
  if (!r.rowCount) fail(429, 'Новый забег будет доступен через минуту');
  res.json({ ok: true, gain });
}));

async function resolveLots(){
  const t = Date.now();
  for (const L of LOTS) {
    if (L.draw || L.ends > t) continue;
    const entries = [
      ...Object.entries(L.pool).map(([name, c]) => ({ name, c, uid: null })),
      ...Object.entries(L.tk).map(([uid, v]) => ({ name: v.name, c: v.n, uid }))
    ];
    const total = entries.reduce((a, e) => a + e.c, 0);
    let r = Math.random() * total, w = entries[0];
    for (const e of entries) { r -= e.c; if (r < 0) { w = e; break; } }
    L.draw = { name: w.name, uid: w.uid };
    if (w.uid) await grantChar(pool, w.uid, L.prize, L.rar).catch(e => console.error('lottery grant', e));
  }
}

app.get('/api/lotteries', auth, wrap(async (req, res) => {
  await resolveLots();
  res.json(LOTS.map(L => ({
    id: L.id, prize: L.prize, rar: L.rar, ends: L.ends, img: IMG[L.prize] || null,
    mine: (L.tk[req.uid] && L.tk[req.uid].n) || 0,
    sold: Object.values(L.tk).reduce((a, v) => a + v.n, 0),
    draw: L.draw ? { name: L.draw.name, isMe: L.draw.uid === req.uid } : null
  })));
}));

app.post('/api/lottery/ticket', auth, wrap(async (req, res) => {
  await resolveLots();
  const L = LOTS.find(x => x.id === Number((req.body || {}).id));
  if (!L || L.draw || L.ends <= Date.now()) fail(400, 'Лотерея недоступна');
  if (((L.tk[req.uid] && L.tk[req.uid].n) || 0) >= 100) fail(400, 'Лимит билетов в этой лотерее');
  await withTx(async db => {
    const r = await db.query('UPDATE users SET stars = stars - 2 WHERE id = $1 AND stars >= 2 RETURNING first_name', [req.uid]);
    if (!r.rowCount) fail(402, 'Нужно ★ 2');
    const cur = L.tk[req.uid] || { name: r.rows[0].first_name, n: 0 };
    cur.n++;
    L.tk[req.uid] = cur;
  });
  res.json({ ok: true });
}));

async function tgCall(method, body){
  const r = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!j.ok) throw new Error(j.description || 'Ошибка Telegram');
  return j.result;
}

app.post('/api/create-invoice', auth, wrap(async (req, res) => {
  const stars = Math.floor(Number((req.body || {}).stars));
  if (!(stars >= 1 && stars <= 10000)) fail(400, 'Сумма от 1 до 10000 ★');
  const url = await tgCall('createInvoiceLink', {
    title: 'Пополнение звёзд',
    description: `Пополнение баланса ШД Hub на ${stars} ★`,
    payload: `topup:${req.uid}:${stars}`,
    provider_token: '',
    currency: 'XTR',
    prices: [{ label: `${stars} звёзд`, amount: stars }]
  });
  res.json({ url });
}));

app.post('/telegram-webhook', async (req, res) => {
  if (WEBHOOK_SECRET && req.get('x-telegram-bot-api-secret-token') !== WEBHOOK_SECRET) return res.sendStatus(403);
  res.sendStatus(200);
  try {
    const upd = req.body || {};
    if (upd.pre_checkout_query) {
      await tgCall('answerPreCheckoutQuery', { pre_checkout_query_id: upd.pre_checkout_query.id, ok: true });
    }
    const msg = upd.message;
    if (msg && msg.text && msg.text.startsWith('/start') && WEBAPP_URL) {
      await tgCall('sendMessage', {
        chat_id: msg.chat.id,
        text: 'Добро пожаловать в ШД Hub',
        reply_markup: { inline_keyboard: [[{ text: 'Открыть ШД Hub', web_app: { url: WEBAPP_URL } }]] }
      });
    }
    const sp = msg && msg.successful_payment;
    if (sp) {
      const [, uid, stars] = sp.invoice_payload.split(':');
      const ins = await pool.query(
        'INSERT INTO payments (charge_id, user_id, stars) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
        [sp.telegram_payment_charge_id, uid, Number(stars)]);
      if (ins.rowCount) await pool.query('UPDATE users SET stars = stars + $2 WHERE id = $1', [uid, Number(stars)]);
    }
  } catch (e) { console.error('webhook:', e.message); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => app.listen(PORT, () => console.log(`ШД Hub запущен на порту ${PORT}`)))
  .catch(e => { console.error('Ошибка базы:', e); process.exit(1); });
