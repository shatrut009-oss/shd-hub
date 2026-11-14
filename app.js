$('#splash').addEventListener('click', () => {
    $('#splash').classList.add('open');
    setTimeout(() => { $('#splash').classList.add('gone'); $('#app').classList.add('on'); }, 900);
  });

  // ===== таймеры =====
  function tick(){
    // ... (какой-то код)
  }

  // ===== старт =====
  renderAll();
  setInterval(tick, 1000);
  run(refresh);
})();
