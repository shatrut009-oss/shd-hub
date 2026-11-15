const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// ТВОИ ДАННЫЕ ИЗ SUPABASE (Добавь их в настройках Environment на Render!)
const supabaseUrl = process.env.SUPABASE_URL || 'https://твой-проект.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'твой-anon-ключ';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static(__dirname));

const CHANNELS = { 
  edits: ['kseshaxs', 'dimonchikshgsh', 'margarinkf547', 'streetlightmeow', 'vladanasv', 'salamandrrrrrrrra', 'kanyyy11', 'myshhkaas', 'banttiiikk', 'xixnow'], 
  news: ['shgsh_novosti', 'hladenko', 'gladmedia', 'gladdrophub'] 
};

// ==========================================
// ===== API ДЛЯ БАЗЫ ДАННЫХ (SUPABASE) =====
// ==========================================

// Получить данные пользователя по Telegram ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', id)
      .single();
      
    if (error && error.code !== 'PGRST116') { 
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      // Если пользователя нет в базе, создаем нового
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ telegram_id: id }])
        .select()
        .single();
        
      if (createError) throw createError;
      return res.json(newUser);
    }
    
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Сохранить/обновить данные пользователя
app.post('/api/user/:id', async (req, res) => {
  const { id } = req.params;
  const state = req.body;
  
  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        telegram_id: id,
        stars: state.stars,
        coins: state.coins,
        inv: state.inv,
        hist: state.hist,
        choices: state.choices,
        active_badge: state.activeBadge,
        stat: state.stat,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ===== ПАРСИНГ ТЕЛЕГРАМ КАНАЛОВ ===========
// ==========================================

async function fetchTelegramPosts(channels, type) {
  let allPosts = [];
  for (const channel of channels) {
    try {
      const res = await fetch(`https://t.me/s/${channel}`); 
      const html = await res.text(); 
      const $ = cheerio.load(html);
      
      $('.tgme_widget_message').each((i, el) => {
        if ($(el).hasClass('tgme_widget_message_pinned')) return;
        $(el).find('.tgme_widget_message_text').find('br').replaceWith('\n');
        const text = $(el).find('.tgme_widget_message_text').text().trim();
        
        const imgStyle = $(el).find('.tgme_widget_message_photo_wrap').attr('style');
        const image = imgStyle ? imgStyle.match(/url\('(.*)'\)/)?.[1] : null;
        const videoTag = $(el).find('.tgme_widget_message_video_wrap video');
        const videoUrl = videoTag.length ? videoTag.attr('src') : null;

        if (!image && !videoUrl && text.length < 15) return; 

        allPosts.push({ 
          id: $(el).attr('data-post') || `${channel}-${i}`, 
          type, 
          author: channel, 
          text, 
          image, 
          videoUrl, 
          date: new Date($(el).find('time').attr('datetime') || Date.now()).getTime() 
        });
      });
    } catch (e) { console.error(`Ошибка парсинга ${channel}:`, e.message); }
  }
  return allPosts.sort((a, b) => b.date - a.date).slice(0, 50);
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
