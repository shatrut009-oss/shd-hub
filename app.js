// ЗАГРУЗКА НОВОСТЕЙ (С датой и временем)
async function loadNews() {
  const el = $('#screen-news');
  if (!el || el.dataset.loaded) return;
  
  try {
    const res = await fetch('/api/posts?type=news');
    const items = await res.json();
    
    el.innerHTML = `<h2 style="font-family:Oswald; font-size:28px; color:#fff; margin-bottom:15px;">Новости</h2>
    ${items.length ? items.map(n => {
      // Форматируем дату (например: 14 ноя, 18:30)
      const d = new Date(n.date);
      const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ', ' + 
                      d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

      return `
      <article class="post">
        ${n.image ? `<img src="${n.image}">` : ''}
        <div class="body">
          <div class="post-header">
            <span class="tag">@${n.author}</span>
            <span class="post-date">${dateStr}</span>
          </div>
          <p>${n.text}</p>
        </div>
      </article>`;
    }).join('') : '<div class="loader">Новостей пока нет</div>'}`;
      
    el.dataset.loaded = "true";
  } catch (err) { 
    console.error(err);
    el.innerHTML = '<div class="loader" style="color:#ff1e3c;">Ошибка загрузки новостей</div>'; 
  }
}
