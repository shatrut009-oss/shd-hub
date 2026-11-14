const express = require('express');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const { Pool } = require('pg');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const DAY = 864e5;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

const app = express();
app.use(express.json({ limit: '50kb' }));
app.use(express.static(__dirname, { index: false }));

// --- КАНАЛЫ ДЛЯ ПАРСИНГА ---
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
        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;
        
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
  return allPosts.sort((a, b) => b.date - a.date);
}

// --- ИГРОВЫЕ ДАННЫЕ ---
const RAR = { 
  common: { ru: 'Обычный', pts: 1, color: '#9aa0a6' }, 
  rare: { ru: 'Редкий', pts: 2, color: '#4da3ff' }, 
  epic: { ru: 'Эпический', pts: 4, color: '#b36bff' }, 
  legend: { ru: 'Легендарный', pts: 6, color: '#ffb020' }, 
  mythic: { ru: 'Мифический', pts: 10, color: '#ff3ea5' } 
};

const CHARS = { 
  common: ['Дима (Балаклава)', 'Дима', 'Ксюша (Розовый)', 'Ксюша (Школа)', 'Ксюша (Куртка)'], 
  rare: ['Рита (Коктейль)', 'Рита', 'Алёна (Ванная)', 'Алёна (Лента)', 'Алёна'], 
  epic: ['Саламандра (Машина)', 'Саламандра', 'Наташа (Школа)', 'Наташа (Цветок)', 'Наташа', 'Наташа (Улыбка)'], 
  legend: ['Гладенко (Боксер)', 'Гладенко (Врач)', 'Гладенко (Строитель)', 'Гладенко (Костюм)', 'Гладенко', 'Гладенко (Портрет)'], 
  mythic: ['Миллкис (Чокер)', 'Миллкис (Зелёная маска)', 'Миллкис', 'Миллкис (Экшн)'] 
};

// 26 ВСТРОЕННЫХ SVG-КАРТИНОК
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

function avatarSvg(name, rar){ 
  const c = RAR[rar].color; 
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#1c1c22"/><path d="M18 100Q18 64 50 60Q82 64 82 100Z" fill="${c}" opacity=".55"/><circle cx="50" cy="40" r="19" fill="${c}"/><text x="50" y="49" text-anchor="middle" font-family="Impact,sans-serif" font-size="22" fill="#000">${name[0]}</text></svg>`; 
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); 
}

const IMG = {}; 
const CHAR_LIST = [];
const CUSTOM_IMAGES = { 
  'Дима (Балаклава)': IMG_DIMA_1, 'Дима': IMG_DIMA_2, 'Ксюша (Розовый)': IMG_KSU_1, 'Ксюша (Школа)': IMG_KSU_2, 'Ксюша (Куртка)': IMG_KSU_3, 'Рита (Коктейль)': IMG_RITA_1, 'Рита': IMG_RITA_2, 'Алёна (Ванная)': IMG_ALENA_1, 'Алёна (Лента)': IMG_ALENA_2, 'Алёна': IMG_ALENA_3, 'Саламандра (Машина)': IMG_SALAM_1, 'Саламандра': IMG_SALAM_2, 'Наташа (Школа)': IMG_NAT_1, 'Наташа (Цветок)': IMG_NAT_2, 'Наташа': IMG_NAT_3, 'Наташа (Улыбка)': IMG_NAT_4, 'Гладенко (Боксер)': IMG_GLAD_1, 'Гладенко (Врач)': IMG_GLAD_2, 'Гладенко (Строитель)': IMG_GLAD_3, 'Гладенко (Костюм)': IMG_GLAD_4, 'Гладенко': IMG_GLAD_5, 'Гладенко (Портрет)': IMG_GLAD_6, 'Миллкис (Чокер)': IMG_MILK_1, 'Миллкис (Зелёная маска)': IMG_MILK_2, 'Миллкис': IMG_MILK_3, 'Миллкис (Экшн)': IMG_MILK_4 
};

for (const [rar, names] of Object.entries(CHARS)) { 
  for (const name of names) { 
    const img = CUSTOM_IMAGES[name] || avatarSvg(name, rar); 
    IMG[name] = img; 
    CHAR_LIST.push({ name, rar, img }); 
  } 
}

const BG = { 'Без фона': 60, 'Дневник': 25, 'Школа ночью': 12, 'Неон': 3 };
const CASES = { 
  free: { free: true, odds: { common: 60, rare: 28, epic: 8, legend: 3, mythic: 0.5, coin: 0.5 } }, 
  diary: { cost: 3, cur: 'coins', odds: { common: 58, rare: 28, epic: 9, legend: 2.5, mythic: 0.5, coin: 2 } }, 
  cheat: { cost: 10, cur: 'stars', odds: { common: 54, rare: 30, epic: 11, legend: 3.5, mythic: 0.5, coin: 1 } }, 
  stick: { cost: 13, cur: 'stars', odds: { common: 45, rare: 35, epic: 14, legend: 4.5, mythic: 0.5, coin: 1 } } 
};

const activeMines = {}; 

// --- ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---
async function initDb(){ 
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY, username TEXT, first_name TEXT, 
      stars INTEGER DEFAULT 0, coins NUMERIC DEFAULT 0, points NUMERIC DEFAULT 0, 
      ruch INTEGER DEFAULT 0, kap INTEGER DEFAULT 0, sub_until TIMESTAMPTZ, 
      last_daily TIMESTAMPTZ, last_ruch TIMESTAMPTZ, last_kap TIMESTAMPTZ, 
      lvl_tap INTEGER DEFAULT 1, best_drop INTEGER DEFAULT 0, last_drop TIMESTAMPTZ, 
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ); 
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY, user_id BIGINT, character_name TEXT, rarity TEXT, 
      tirage INTEGER, bg TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    ); 
    CREATE TABLE IF NOT EXISTS payments (
      charge_id TEXT PRIMARY KEY, user_id BIGINT, stars INTEGER, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS lottery_tickets (
      lottery_id INT, user_id BIGINT, tickets INT DEFAULT 0, PRIMARY KEY (lottery_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS clans (
      id SERIAL PRIMARY KEY, name TEXT UNIQUE, owner_id BIGINT, treasury INT DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS clan_members (
      clan_id INT, user_id BIGINT UNIQUE, role TEXT DEFAULT 'member', joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `); 
}

// --- ХЕЛПЕРЫ ---
const fail = (s, m) => { const e = new Error(m); e.status = s; throw e; };
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(e => { 
  if (e.status) return res.status(e.status).json({ error: e.message }); 
  console.error(e); 
  if (!res.headersSent) res.status(500).json({ error: 'Ошибка сервера' }); 
});
const roll = o => { let r = Math.random() * Object.values(o).reduce((a, b) => a + b, 0); for (const k in o) { r -= o[k]; if (r < 0) return k; } return Object.keys(o)[0]; };
const rnd = n => Math.floor(Math.random() * n);
async function withTx(fn){ 
  const c = await pool.connect(); 
  try { await c.query('BEGIN'); const r = await fn(c); await c.query('COMMIT'); return r; } 
  catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; } 
  finally { c.release(); } 
}
async function getUser(uid){ const { rows: [u] } = await pool.query('SELECT * FROM users WHERE id = $1', [uid]); return u; }
const view = u => ({ 
  name: u.first_name, stars: u.stars || 0, coins: Number(u.coins) || 0, points: Number(u.points) || 0, 
  ruch: u.ruch || 0, kap: u.kap || 0, sub: u.sub_until ? new Date(u.sub_until).getTime() : 0, 
  dailyAt: u.last_daily ? new Date(u.last_daily).getTime() : 0, ruchAt: u.last_ruch ? new Date(u.last_ruch).getTime() : 0, 
  kapAt: u.last_kap ? new Date(u.last_kap).getTime() : 0, dropAt: u.last_drop ? new Date(u.last_drop).getTime() : 0, 
  bestDrop: u.best_drop || 0, joined: new Date(u.created_at).getTime(), lvl: { tap: u.lvl_tap || 1 } 
});

async function grantChar(db, uid, name, rar){ 
  const { rows: [t] } = await db.query('SELECT COALESCE(MAX(tirage), 0) + 1 AS n FROM inventory'); 
  const tir = t.n; const bg = roll(BG); const pts = RAR[rar].pts * (tir <= 100 ? 1.5 : 1); 
  await db.query('INSERT INTO inventory (user_id, character_name, rarity, tirage, bg) VALUES ($1,$2,$3,$4,$5)', [uid, name, rar, tir, bg]); 
  await db.query('UPDATE users SET points = points + $2 WHERE id = $1', [uid, pts]); 
  return { name, rar, tir, bg, img: IMG[name] || null }; 
}

// --- АВТОРИЗАЦИЯ TELEGRAM ---
function parseInitData(initData){ 
  if (!initData || !BOT_TOKEN) return null; 
  const p = new URLSearchParams(initData); const hash = p.get('hash'); 
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
  if (!u || !u.id) return res.status(401).json({ error: 'Авторизация' }); 
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Гость'; 
  await pool.query(`INSERT INTO users (id, first_name, username) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name`, [u.id, name, u.username || null]); 
  req.uid = String(u.id); 
  next(); 
});

// --- ЭНДПОИНТЫ ---
app.get('/api/profile', auth, wrap(async (req, res) => { res.json(view(await getUser(req.uid))); }));

app.get('/api/inventory', auth, wrap(async (req, res) => { 
  const { rows } = await pool.query(`SELECT character_name AS name, rarity AS rar, tirage AS tir, bg FROM inventory WHERE user_id = $1 ORDER BY tirage ASC`, [req.uid]); 
  res.json(rows.map(r => ({ ...r, img: IMG[r.name] || null }))); 
}));

app.get('/api/posts', auth, wrap(async (req, res) => { 
  res.json(await fetchTelegramPosts(CHANNELS[req.query.type] || [], req.query.type)); 
}));

// --- КЛАНЫ ---
app.get('/api/clans', auth, wrap(async (req, res) => {
  const { rows: top } = await pool.query(`
    SELECT c.id, c.name, c.treasury, c.owner_id, u.first_name as owner_name, COUNT(cm.user_id) as members_count
    FROM clans c
    LEFT JOIN clan_members cm ON c.id = cm.clan_id
    LEFT JOIN users u ON c.owner_id = u.id
    GROUP BY c.id, u.first_name
    ORDER BY c.treasury DESC LIMIT 10
  `);
  
  const { rows: myClan } = await pool.query(`
    SELECT c.id, c.name, c.treasury, c.owner_id, cm.role
    FROM clan_members cm
    JOIN clans c ON cm.clan_id = c.id
    WHERE cm.user_id = $1
  `, [req.uid]);

  res.json({ top, myClan: myClan[0] || null });
}));

app.post('/api/clans/create', auth, wrap(async (req, res) => {
  const { name } = req.body;
  if (!name || name.length < 2 || name.length > 20) fail(400, 'Название от 2 до 20 символов');
  
  await withTx(async db => {
    const { rows: [u] } = await db.query('SELECT stars FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    if (u.stars < 8) fail(402, 'Нужно ★ 8 для создания');
    
    const check = await db.query('SELECT id FROM clans WHERE name = $1', [name]);
    if (check.rows.length > 0) fail(400, 'Клан с таким названием уже есть');
    
    const { rows: [clan] } = await db.query('INSERT INTO clans (name, owner_id, treasury) VALUES ($1, $2, 0) RETURNING id', [name, req.uid]);
    await db.query('INSERT INTO clan_members (clan_id, user_id, role) VALUES ($1, $2, $3)', [clan.id, req.uid, 'leader']);
    await db.query('UPDATE users SET stars = stars - 8 WHERE id = $1', [req.uid]);
  });
  res.json({ ok: true });
}));

app.post('/api/clans/deposit', auth, wrap(async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount < 1) fail(400, 'Неверное количество');
  
  await withTx(async db => {
    const { rows: [m] } = await db.query('SELECT clan_id FROM clan_members WHERE user_id = $1', [req.uid]);
    if (!m) fail(400, 'Вы не в клане');
    
    const { rows: [u] } = await db.query('SELECT ruch FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    if (u.ruch < amount) fail(402, 'Мало ручек');
    
    await db.query('UPDATE users SET ruch = ruch - $1 WHERE id = $2', [amount, req.uid]);
    await db.query('UPDATE clans SET treasury = treasury + $1 WHERE id = $2', [amount, m.clan_id]);
  });
  res.json({ ok: true });
}));

// --- ЛОТЕРЕИ ---
app.get('/api/lotteries', auth, wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT lottery_id, tickets FROM lottery_tickets WHERE user_id = $1', [req.uid]);
  const myTickets = {}; rows.forEach(r => myTickets[r.lottery_id] = r.tickets);
  const LOTS = [
    { id: 1, prize: 'Дима в маске', rar: 'legend', ends: Date.now() + 4 * 3600 * 1000, sold: 203, participants: 73 },
    { id: 2, prize: 'Наташа x +1', rar: 'epic', ends: Date.now() + 5 * 3600 * 1000, sold: 319, participants: 89 }
  ];
  res.json(LOTS.map(l => ({ ...l, myTickets: myTickets[l.id] || 0 })));
}));

app.post('/api/lottery/buy', auth, wrap(async (req, res) => {
  const { lotteryId, currency } = req.body;
  await withTx(async db => {
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.uid]);
    if (u[currency] < 1) fail(402, 'Мало средств');
    await db.query(`UPDATE users SET ${currency} = ${currency} - 1 WHERE id = $1`, [req.uid]);
    await db.query(`INSERT INTO lottery_tickets (lottery_id, user_id, tickets) VALUES ($1, $2, 1) ON CONFLICT (lottery_id, user_id) DO UPDATE SET tickets = lottery_tickets.tickets + 1`, [lotteryId, req.uid]);
  });
  res.json({ ok: true });
}));

// --- КЕЙСЫ ---
app.post('/api/open-case', auth, wrap(async (req, res) => { 
  const c = CASES[(req.body || {}).caseKey]; 
  if (!c) fail(400, 'Ошибка'); 
  const result = await withTx(async db => { 
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.uid]); 
    if (c.free) { 
      if (u.last_daily && Date.now() - new Date(u.last_daily).getTime() < DAY) fail(429, 'Открыт'); 
      await db.query('UPDATE users SET last_daily = NOW() WHERE id = $1', [req.uid]); 
    } else { 
      const bal = c.cur === 'stars' ? u.stars : Number(u.coins); 
      if (bal < c.cost) fail(402, 'Мало средств'); 
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

// --- ИГРЫ СО СТАВКАМИ ---
app.post('/api/games/mines/start', auth, wrap(async (req, res) => {
  const { bet, cur } = req.body; const amount = Math.floor(Number(bet));
  if (!amount || amount < 1) fail(400, 'Минимальная ставка 1');
  await withTx(async db => { 
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.uid]); 
    if (u[cur] < amount) fail(402, 'Мало средств'); 
    await db.query(`UPDATE users SET ${cur} = ${cur} - $2 WHERE id = $1`, [req.uid, amount]); 
    const mines = []; while (mines.length < 5) { const r = rnd(25); if (!mines.includes(r)) mines.push(r); } 
    activeMines[req.uid] = { mines, bet: amount, cur, mult: 1.0, opened: 0 }; 
  });
  res.json({ ok: true, gridSize: 25 });
}));

app.post('/api/games/mines/click', auth, wrap(async (req, res) => {
  const { index } = req.body; const game = activeMines[req.uid]; if (!game) fail(400, 'Игра не найдена');
  if (game.mines.includes(index)) { delete activeMines[req.uid]; return res.json({ lost: true, mines: game.mines }); }
  game.opened++; game.mult = (1 + (game.opened * 0.2)).toFixed(2); res.json({ ok: true, mult: game.mult, mines: game.mines });
}));

app.post('/api/games/mines/cashout', auth, wrap(async (req, res) => {
  const game = activeMines[req.uid]; if (!game) fail(400, 'Нет игры'); const win = Math.floor(game.bet * game.mult);
  await pool.query(`UPDATE users SET ${game.cur} = ${game.cur} + $2 WHERE id = $1`, [req.uid, win]); delete activeMines[req.uid]; res.json({ ok: true, win });
}));

app.post('/api/games/coinflip', auth, wrap(async (req, res) => {
  const { bet, cur, choice } = req.body; const amount = Math.floor(Number(bet));
  if (!amount || amount < 1) fail(400, 'Мин. ставка 1');
  await withTx(async db => { 
    const { rows: [u] } = await db.query('SELECT * FROM users WHERE id = $1 FOR UPDATE', [req.uid]); 
    if (u[cur] < amount) fail(402, 'Мало средств'); 
    await db.query(`UPDATE users SET ${cur} = ${cur} - $2 WHERE id = $1`, [req.uid, amount]); 
    const result = rnd(2) === 0 ? 'heads' : 'tails'; 
    if (result === choice) { 
      await db.query(`UPDATE users SET ${cur} = ${cur} + $2 WHERE id = $1`, [req.uid, amount * 2]); 
      res.json({ win: true, result }); 
    } else res.json({ win: false, result }); 
  });
}));

// --- ОПЛАТА TELEGRAM STARS ---
async function tgCall(method, body){ 
  const r = await fetch(`${TG_API}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); 
  const j = await r.json(); 
  if (!j.ok) throw new Error(j.description); 
  return j.result; 
}

app.post('/api/create-invoice', auth, wrap(async (req, res) => { 
  const stars = Math.floor(Number((req.body || {}).stars)); 
  const url = await tgCall('createInvoiceLink', { 
    title: 'Пополнение', description: `Покупка ${stars} ★`, payload: `topup:${req.uid}:${stars}`, provider_token: '', currency: 'XTR', prices: [{ label: `${stars} ★`, amount: stars }] 
  }); 
  res.json({ url }); 
}));

// --- ЗАПУСК ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
const PORT = process.env.PORT || 3000;
initDb().then(() => app.listen(PORT, () => console.log(`Server started on port ${PORT}`))).catch(e => { console.error(e); process.exit(1); });
