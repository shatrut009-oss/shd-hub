(() => {
  try {
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const rnd = n => Math.floor(Math.random() * n);
    const H = 36e5, D = 864e5;

    // ===== МУЗЫКА =====
    const MUSIC = {
      calm: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3', 
      tense: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_2b1b0b6e9c.mp3?filename=dark-ambient-horror-111163.mp3', 
      sad: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_9c5b2c8a4b.mp3?filename=sad-emotional-piano-124109.mp3', 
      climax: 'https://cdn.pixabay.com/download/audio/2021/11/25/audio_00ff97be42.mp3?filename=epic-hollywood-trailer-11470.mp3' 
    };

    let bgmVolume = 0.15;
    let currentMusicUrl = null;
    const musicPlayer = new Audio();
    musicPlayer.loop = true;
    musicPlayer.volume = bgmVolume;

    function playMusic(type) {
      const url = MUSIC[type];
      if (!url || currentMusicUrl === url) return; 
      currentMusicUrl = url;
      musicPlayer.src = url;
      if (audioCtx && audioCtx.state === 'suspended') { audioCtx.resume(); }
      musicPlayer.play().catch(e => {
          document.addEventListener('click', () => { musicPlayer.play(); }, { once: true });
      });
    }
    function stopMusic() { musicPlayer.pause(); currentMusicUrl = null; }

    // ===== ЗВУКИ =====
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null; try { audioCtx = AudioContext ? new AudioContext() : null; } catch(e) {}
    let sfxVolume = 0.8;
    
    document.addEventListener('click', () => { 
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); 
      if (musicPlayer && musicPlayer.paused && currentMusicUrl) musicPlayer.play().catch(()=>{});
    });

    function playExtraSFX(type) {
      const t0 = audioCtx.currentTime;
      const beep = (freq, start, dur, vol) => {
        const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.value = freq;
        g.gain.setValueAtTime(vol * sfxVolume, t0 + start);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + start + dur);
        osc.connect(g); g.connect(audioCtx.destination);
        osc.start(t0 + start); osc.stop(t0 + start + dur + 0.02);
      };
      if (type === 'car') { beep(1400, 0, 0.08, 0.25); beep(1400, 0.14, 0.08, 0.25); }
      if (type === 'phone') { for (let i = 0; i < 4; i++) beep(i % 2 ? 660 : 880, i * 0.3, 0.22, 0.18); }
      if (type === 'msg') { beep(1200, 0, 0.09, 0.18); beep(1800, 0.1, 0.12, 0.18); }
      if (type === 'shot') {
        const len = audioCtx.sampleRate * 0.25;
        const buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = audioCtx.createBufferSource(); const g = audioCtx.createGain();
        src.buffer = buf; g.gain.value = 0.5 * sfxVolume;
        src.connect(g); g.connect(audioCtx.destination); src.start(t0);
      }
    }

    function playSFX(type) { 
      if (!audioCtx) return; 
      if (['car', 'phone', 'msg', 'shot'].includes(type)) { if (audioCtx.state === 'suspended') audioCtx.resume(); return playExtraSFX(type); }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      try { 
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.connect(audioCtx.destination);
        
        if (type === 'click') { 
          const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(1000, now); 
          gain.gain.setValueAtTime(0.2 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08); 
          osc.connect(gain); osc.start(); osc.stop(now + 0.08); 
        } else if (type === 'win') {
          const osc = audioCtx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(600, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
          gain.gain.setValueAtTime(0.3 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gain); osc.start(); osc.stop(now + 0.4);
        } else if (type === 'tape') {
          const bufferSize = audioCtx.sampleRate * 1.5;
          const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
          const source = audioCtx.createBufferSource(); source.buffer = buffer;
          const filter = audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 1500;
          gain.gain.setValueAtTime(0.2 * sfxVolume, now); gain.gain.linearRampToValueAtTime(0.2 * sfxVolume, now + 1.2); gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
          source.connect(filter); filter.connect(gain); source.start(); source.stop(now + 1.5);
        } else if (type === 'door' || type === 'scream' || type === 'step') {
          const osc = audioCtx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(type==='door'?60:type==='scream'?600:150, now);
          osc.frequency.exponentialRampToValueAtTime(type==='door'?100:type==='scream'?200:50, now + 0.4);
          gain.gain.setValueAtTime(0.3 * sfxVolume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
          osc.connect(gain); osc.start(); osc.stop(now + 0.5);
        }
      } catch(e) {} 
    }
    document.addEventListener('click', (e) => { 
      if (e.target.closest('button') || e.target.closest('.tile') || e.target.closest('.vn-dialog') || e.target.closest('.case-card')) playSFX('click'); 
    });

    // ===== ИНИЦИАЛИЗАЦИЯ TELEGRAM =====
    const TG = window.Telegram && window.Telegram.WebApp; 
    if (TG) { try { TG.ready(); TG.expand(); } catch(e) {} }
    
    const U = (TG && TG.initDataUnsafe && TG.initDataUnsafe.user) || {};
    const NAME = [U.first_name, U.last_name].filter(Boolean).join(' ') || 'Гость';
    const TG_ID = (U && U.id) ? U.id : '999999'; // Если открыто на ПК, ID будет 999999
    const authHeaders = () => ({ 'x-tg-init-data': (TG && TG.initData) || '' });
    const RAR = { common: ['Обычный', '#9aa0a6'], rare: ['Редкий', '#4da3ff'], epic: ['Эпический', '#b36bff'], legend: ['Легендарный', '#ffb020'], mythic: ['Мифический', '#ff3ea5'] };

    // ===== ПЕРСОНАЖИ (ССЫЛКИ) =====
    const C = {
      dima: 'https://i.postimg.cc/QNbfg9tC/1794726184077.png',
      dimaStreet: 'https://i.postimg.cc/y6hXYYvv/1794771254309.png',
      dimaRest: 'https://i.postimg.cc/KvJPBpXz/1794771261495.png',
      dimaHurt: 'https://i.postimg.cc/NjF148Yp/1794771268492.png',
      derz: 'https://i.postimg.cc/Bn8NGmCs/1794726189222.png',
      derzStreet: 'https://i.postimg.cc/DZkLntGt/1794771892176.png',
      derzCrowbar: 'https://i.postimg.cc/J0RXBZPp/1794771898766.png',
      derzEyes: 'https://i.postimg.cc/L4VLFQ8C/1794771908125.png',
      kamran: 'https://i.postimg.cc/rpxJDz3K/1794726194181.png',
      kamranSizo: 'https://i.postimg.cc/xTxmckHm/1794772098141.png',
      kamranHosp: 'https://i.postimg.cc/3RT4P25M/1794772146282.png',
      sofia: 'https://i.postimg.cc/yxYXpjdZ/1794726201907.png',
      ruslan: 'https://i.postimg.cc/FzPYdqfF/1794726208162.png',
      ruslanDoc: 'https://i.postimg.cc/fRSVy8MQ/1794726213335.png',
      ruslanCasual: 'https://i.postimg.cc/qR4qm0yB/1794772433067.png',
      ruslanArrested: 'https://i.postimg.cc/nrLzJk3W/1794772442578.png',
      vachik: 'https://i.postimg.cc/0jQD0NWx/1794727136951.png',
      ksusha: 'https://i.postimg.cc/DwssgHg1/1794726228602.png',
      ksushaKidnapped: 'https://i.postimg.cc/XJjNfL6B/1794772880614.png',
      ksushaDate: 'https://i.postimg.cc/kGDnZ54n/1794773002191.png',
      mila: 'https://i.postimg.cc/FFBLQNCx/1794726290228.png',
      sala: 'https://i.postimg.cc/CxynzJgZ/1794726297100.png',
      salaAngry: 'https://i.postimg.cc/T2k1czPH/1794772521706.png',
      salaSorry: 'https://i.postimg.cc/J4GnYpDR/1794772571288.png',
      woman: 'https://i.postimg.cc/RFstfjt7/1794763986923.png',
      babushka: 'https://i.postimg.cc/kMzBpwBP/1794726311325.png',
      babushkaScared: 'https://i.postimg.cc/pdtLTx0d/1794772638437.png',
      babushkaRemorse: 'https://i.postimg.cc/nLYc955S/1794772710129.png',
      nikolay: 'https://i.postimg.cc/SKdn1hzM/1794726596195.png',
      director: 'https://i.postimg.cc/mrmrNy05/1794726601497.png',
      kozhan: 'https://i.postimg.cc/zGZgnwLf/1794763986634.png',
      sto: 'https://i.postimg.cc/LsmgWHBw/1794763990745.png',
      mikhail: 'https://i.postimg.cc/cHbK6fqV/1794763991498.png',
      mikhailSkin: 'https://i.postimg.cc/mZ6Z97Xx/1794773076740.png',
      mystery: 'https://i.postimg.cc/mkrg3k4Q/1794764979117.png',
      mysterySkin: 'https://i.postimg.cc/XvV6mv1S/1794764979117.png',
      doctor: 'https://i.postimg.cc/hvHRJtPC/1794726213335.png',
      cop: 'https://i.postimg.cc/sDhRk7TD/1794764982627.png',
      hooded: 'https://i.postimg.cc/hj5Hwtx0/1794764983561.png',
      carMan: 'https://i.postimg.cc/52DgZQkW/Bez-nazvania1490-20261115210500.png'
    };

    // story: true — персонаж не выпадает из кейсов, выдаётся только по сюжету
    const CHARS = [
      { n: 'Дима', r: 'common', img: C.dima }, { n: 'Дерзкий', r: 'common', img: C.derz }, { n: 'Вачик', r: 'common', img: C.vachik }, { n: 'Ксюша', r: 'common', img: C.ksusha },
      { n: 'Камран', r: 'rare', img: C.kamran }, { n: 'Беда', r: 'rare', img: C.sofia }, { n: 'Руслан', r: 'rare', img: C.ruslan }, { n: 'Николай Андреевич', r: 'rare', img: C.nikolay }, { n: 'Мужчина из СТО', r: 'rare', img: C.sto },
      { n: 'Саламандра', r: 'epic', img: C.sala }, { n: 'Мила', r: 'epic', img: C.mila }, { n: 'Директор', r: 'epic', img: C.director }, { n: 'Мужчина в кожанке', r: 'epic', img: C.kozhan },
      { n: 'Наталья Олеговна', r: 'legend', img: C.babushka }, { n: 'Руслан (Врач)', r: 'legend', img: C.ruslanDoc }, { n: 'Михаил', r: 'legend', img: C.mikhail },
      { n: 'Алиса', r: 'mythic', img: C.woman },
      { n: 'Загадочный Мужчина', r: 'mythic', img: C.mystery, story: true }
    ];


    // Персонажи второго сезона: вставьте ссылки
    
    

    // ===== КЕЙСЫ: ИНТЕРВАЛ И ШАНСЫ (проценты в каждом кейсе = 100) =====
    const CASES = {
      diary: { name: 'Дневничок', period: 'Раз в сутки', cd: 24 * H, bg: 'linear-gradient(135deg, #2b1055 0%, #7597de 100%)', icon: '🎒', odds: { common: 55, rare: 28, epic: 12, legend: 4, mythic: 1 } },
      cheat: { name: 'Шпаргалка', period: 'Раз в 10 часов', cd: 10 * H, bg: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', icon: '📘', odds: { common: 48, rare: 30, epic: 15, legend: 5, mythic: 2 } },
      stick: { name: 'Палочка', period: 'Раз в 2 часа', cd: 2 * H, bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', icon: '🪄', odds: { common: 42, rare: 32, epic: 16, legend: 7, mythic: 3 } }
    };

    // ===== ФОНЫ =====
    const BG = {
      hall: 'https://i.postimg.cc/XqVLZjcx/AIRetouch-20261115-083654547-(1).png',
      gym: 'https://i.postimg.cc/WzCdBS39/AIRetouch-20261115-084408474-(1).png',
      math: 'https://i.postimg.cc/vZ34MQcW/AIRetouch-20261115-084901505-(1).png',
      aud: 'https://i.postimg.cc/VNBPwsYp/IMG-20261115-094052-969.jpg',
      kitchen: 'https://i.postimg.cc/NGPqBzcg/IMG-20261115-094058-247.jpg',
      street: 'https://i.postimg.cc/52LZ59FL/IMG-20261115-094100-132.jpg',
      office: 'https://i.postimg.cc/D0SNS7TV/IMG-20261115-094102-192.jpg',
      sizo: 'https://i.postimg.cc/52z8T4YL/2f6d826e13411f188b2da9a777c83ab-1.jpg',
      stairs: 'https://i.postimg.cc/nhWwYh8K/2aef488e13311f1a5f33a6ca34e81cf-1.jpg',
      directorCorridor: 'https://i.postimg.cc/mgPmDWch/913af61e13311f1a0c53e3ecddc87a2-1.jpg',
      boiler: 'https://i.postimg.cc/2jwDrCDM/AIRetouch-20261115-211355404-(1).png',
      guard: 'https://i.postimg.cc/CxWym1GG/AIRetouch-20261115-211556507-(1).png',
      music: 'https://i.postimg.cc/3NLVpJrw/AIRetouch-20261115-211759934-(1).png',
      assembly: 'https://i.postimg.cc/c1nNtff0/AIRetouch-20261115-213118475-(1).png',
      police: 'https://i.postimg.cc/PJG9QFYy/AIRetouch-20261115-213322456-(1).png',
      home: 'https://i.postimg.cc/zXF6T7BP/AIRetouch-20261115-213507468-(1).png',
      car: 'https://i.postimg.cc/KzTsjrwV/AIRetouch-20261115-213720816-(1).png',
      yard: 'https://i.postimg.cc/zvCWPpPF/AIRetouch-20261115-215725480-(1).png',
      basement: 'https://i.postimg.cc/VN2Cf2xk/AIRetouch-20261115-220216946-(1).png',
      sto: 'https://i.postimg.cc/RhL6ThN0/AIRetouch-20261115-220531140-(1).png',
      hospital: 'https://i.postimg.cc/9FcqQdnS/AIRetouch-20261115-220750011-(1).png',
      archive: 'https://i.postimg.cc/tTRLgmFy/792431ae12911f1872ca2d9c9abc235-1.jpg',
      theatre: 'https://i.postimg.cc/Hs5HRR23/377abf4e12911f1b6feb2ef94b5359b-1.jpg',
      roof: 'https://i.postimg.cc/HnMDG8Qp/480aabbe12911f1b6feb2ef94b5359b-1.jpg',
      restaurant: 'https://i.postimg.cc/jScVrbJB/91161f9e12911f1afdeb6d6614830bc-1.jpg',
      city: 'https://i.postimg.cc/jd6mzbvK/8d48931e12a11f18f7382cf82552570-1.jpg',
      interrogation: 'https://i.postimg.cc/FHWPZsLC/bee7b63e12a11f1ba345279096def6d-1.jpg'
    };


    // Фоны второго сезона: вставьте ссылки в пустые строки
    Object.assign(BG, {
      disco: 'https://i.postimg.cc/yYDCHR6m/8a3bdb2e1ac11f1b75daa6270386144-1.jpg',
      entrance: 'https://i.postimg.cc/R0MPMrQN/64e6f1fe1ac11f1a0c53e3ecddc87a2-1.jpg',
      bedroom: 'https://i.postimg.cc/YqQK0HgW/957f05be1ac11f1b75daa6270386144-1.jpg',
      cemetery: 'https://i.postimg.cc/VvyZPJKZ/AIRetouch-20261116-140346673-(1).png',
      highway: 'https://i.postimg.cc/Nfd81yRW/62e445ae1ad11f18f7382cf82552570-1.jpg',
      factory: 'https://i.postimg.cc/CKkf6dfH/77e692be1ad11f1ba345279096def6d-1.jpg',
      factoryBasement: 'https://i.postimg.cc/3JzN5YhD/e80db0ee1ad11f184d1deb018b157f4-1.jpg',
      powerStation: 'https://i.postimg.cc/dVKFj1v2/80585c2e1ad11f1bc9cfe7d908c9910-1.jpg',
      hospitalWard: 'https://i.postimg.cc/rF5sk7wh/906d8f9e1ad11f1a5f33a6ca34e81cf-1.jpg',
      psych: 'https://i.postimg.cc/m23LqMmp/a6247b3e1ae11f1b6feb2ef94b5359b-1.jpg',
      stoBasement: 'https://i.postimg.cc/Kv5bQbzS/207af4de1ae11f1a0c53e3ecddc87a2-1.jpg'
    });

    // Иконка флешки из первого эпизода: вставьте ссылку на картинку
    Object.assign(BG, { flash: '' });


    // Фоны 3 и 4 сезонов
    Object.assign(BG, {
      newYearHall: 'https://i.postimg.cc/SNd0XjbJ/f0482382e34d11f19a798aca3635d12d-1.jpg',
      nyStreet: 'https://i.postimg.cc/g0f19Z8S/0432a35ae34e11f1af5d0e44567a5659-1.jpg',
      nyApt: 'https://i.postimg.cc/3Nh6NQS5/21ed0b63e34e11f19122aa6270386144-1.jpg',
      nyDisco: 'https://i.postimg.cc/2SytVwwm/36f5e955e34e11f1bda21a9eb1acb801-1.jpg',
      floor2: 'https://i.postimg.cc/hjWZZqq4/4c931808e34e11f182d3a2d9c9abc235-1.jpg',
      nyYard: 'https://i.postimg.cc/1RK7BT7t/625c4355e34e11f198cd3e3ecddc87a2-1.jpg',
      itRoom: 'https://i.postimg.cc/TPmCDH5F/751da264e34e11f198cd3e3ecddc87a2-1.jpg',
      theatreNY: 'https://i.postimg.cc/3NLBTszW/8bd2ed32e34e11f182d3a2d9c9abc235-1.jpg',
      theatreStreet: 'https://i.postimg.cc/9QwB6NbC/a324975ae34e11f182d3a2d9c9abc235-1.jpg',
      cityChase: 'https://i.postimg.cc/TwfqW26C/b7e0f0f4e34e11f186b2b2ef94b5359b-1.jpg',
      hangar: 'https://i.postimg.cc/Kv6TMc7c/cc6d4d51e34e11f1bda21a9eb1acb801-1.jpg',
      library: 'https://i.postimg.cc/vmzxkWJh/e0453f0fe34e11f1b1fa5279096def6d-1.jpg',
      deputyOffice: 'https://i.postimg.cc/brGGZ4sJ/03623121e34f11f184d816a5a3972705-1.jpg',
      directorFlat: 'https://i.postimg.cc/RhjWKGHd/130b1f26e34f11f19122aa6270386144-1.jpg',
      directorStreet: 'https://i.postimg.cc/FsLdN5tQ/24e0a17ee34f11f19122aa6270386144-1.jpg'
    });

    // Образы персонажей 3 и 4 сезонов
    Object.assign(C, {
      dimaWinter: 'https://i.postimg.cc/TPY4wmV1/1794950979753.png',
      dimaNY: 'https://i.postimg.cc/Y0cR1mWF/1794950981510.png',
      dimaCrumpled: 'https://i.postimg.cc/mZM8TVv6/1794950983652.png',
      dimaSchool: 'https://i.postimg.cc/dVQBmFLN/1794950988205.png',
      derzNY: 'https://i.postimg.cc/ZRPBM9QL/1794951493892.png',
      derzWinter: 'https://i.postimg.cc/7hmCqFwT/1794951497893.png',
      derzSnow: 'https://i.postimg.cc/gk2Xg2HN/1794951503739.png',
      ksusha1: 'https://i.postimg.cc/50H1XDBr/1794951804579.png',
      ksusha2: 'https://i.postimg.cc/Fz34Zcnm/IMG-20261118-004625-727.png',
      ksusha3: 'https://i.postimg.cc/Fz34Zcn0/1794952012408.png',
      ksusha4: 'https://i.postimg.cc/KvhFYqRY/1794952014901.png',
      kamranNY: 'https://i.postimg.cc/tgx2751R/1794952356981.png',
      kamranCoat: 'https://i.postimg.cc/QtgmJdk4/1794952361791.png',
      milaNY: 'https://i.postimg.cc/TYTd9NGZ/1794953108358.png',
      salaNY: 'https://i.postimg.cc/4xdJCKYb/1794953113213.png',
      ritaNY: 'https://i.postimg.cc/L8bmmHf5/1794953118800.png',
      ritaWinter: 'https://i.postimg.cc/G2kRPGfR/1794953124539.png',
      daniil1: 'https://i.postimg.cc/FKCDKHVz/1794953953270.png',
      daniil2: 'https://i.postimg.cc/Y9JR1DPD/1794954023185.png',
      daniil3: 'https://i.postimg.cc/bYt3z8GW/1794954078906.png',
      daniil4: 'https://i.postimg.cc/YqB80VY9/1794954131448.png',
      nikolayA: 'https://i.postimg.cc/cHMCmrkJ/1794954689727.png',
      nikolayB: 'https://i.postimg.cc/v8hDxx6V/1794954697951.png',
      nikolayC: 'https://i.postimg.cc/kX5GQMQD/1794954702653.png',
      vachikA: 'https://i.postimg.cc/D0rNmKzx/1794955473466.png',
      vachikB: 'https://i.postimg.cc/x1TZjhSV/1794955479986.png',
      vachikC: 'https://i.postimg.cc/zfyPKhBT/1794955492721.png',
      sofiaLib: 'https://i.postimg.cc/DzY0p9nj/1794955835789.png',
      sofiaOpen: 'https://i.postimg.cc/nzyzpqsm/1794955841386.png',
      zavuch1: 'https://i.postimg.cc/Wz043trx/1794956241159.png',
      zavuch2: 'https://i.postimg.cc/FFSzGCqn/1794956246056.png',
      director2: 'https://i.postimg.cc/5ym0G1YR/1795005380176.png',
      rita: 'https://i.postimg.cc/G2kRPGfR/1794953124539.png'
    });
    CHARS.push({ n: 'Даниил', r: 'mythic', img: C.daniil1, story: true });
    CHARS.push({ n: 'Завуч', r: 'mythic', img: C.zavuch1, story: true });

    const EP_NAMES = [
      'Тот, кто дергает за ниточки', 'Праведные сёстры', 'Скелет в шкафу',
      'Лицо Кукольника', 'Правила игры', 'Разбитые маски',
      'Исцеление болью', 'В ловушке котельной', 'Новый Кукольник'
    ];

    // ===== СТОРИ: СЕЗОН 1 (эпизод 1 — готовый, 2–9 — заглушки) =====
    const S1_EPISODES = [
      [ /* ЭПИЗОД 1 */
        { bg: BG.hall, char: C.dima, name: '', music: 'calm', text: 'Коридор школы, второй этаж. Утро. Яркий солнечный свет бьет в окна, отражается от начищенного линолеума. Ряды металлических шкафчиков. У одного из них стоит Дима в школьной форме с расслабленным галстуком, рядом висит его джинсовка.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Я стою у своего открытого шкафчика, нервно теребя в руках учебник по геометрии. В коридоре шумно, старшеклассники толкаются, кто-то смеется, но я не обращаю внимания. Мысли крутятся вокруг предстоящей контрольной.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Здорово, чемпион! Ты сегодня на спаррингах в зале будешь, или опять дома железо тягаешь?' },
        { bg: BG.hall, char: C.derz, name: '', music: 'calm', text: 'Он широко ухмыляется, хлопая ладонью по соседней металлической дверце. Звук получается громким, эхо разносится по коридору.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Отстань, Дерзкий. У меня голова болит.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Нам тренера порадовать надо. А то он из-за твоего пропуска в пятницу мне весь мозг вынес. Говорит, если Дима не придет, я буду за него отжиматься. Представляешь? Я, и вдруг отжиматься!' },
        { bg: BG.hall, char: C.kamran, name: '', music: 'calm', text: 'Я перевожу взгляд в дальний конец коридора. Там, словно хищник, стоит Камран. На нем идеально выглаженная школьная форма с синим блейзером, на шее под воротником блестит тонкая золотая цепь.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'О-о, а вот и твой персональный конвой. Смотри, как сверкает, аж глаза слепит.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Он меня уже достал.' },
        { bg: BG.hall, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Я испаряюсь, братуха, а то меня сейчас этой аурой пафоса снесет. Если что, я в столовой, буду спасать булочки от голодной толпы.' },
        { bg: BG.hall, char: C.kamran, name: '', music: 'calm', text: 'Дерзкий ныряет в поток учеников и исчезает за поворотом. Камран тут же направляется в мою сторону. Поравнявшись с моим шкафчиком, он нарочно небрежно протискивается, тяжело врезаясь плечом в распахнутую металлическую створку.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'По коридору ровно ходи, пока ноги целы.' },
        { bg: BG.hall, char: C.kamran, name: 'Камран', music: 'calm', text: 'А то что? Пожалуешься своей бабке, Наталье Олеговне? Или пойдешь к Беде плакать?' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Слушай, тебе заняться больше нечем?' },
        { bg: BG.hall, char: C.kamran, name: 'Камран', music: 'calm', text: 'Мне? Это ты тут стоишь, как памятник, и портишь мне настроение своим видом.' },
        { bg: BG.hall, char: C.sofia, name: 'Беда', music: 'tense', text: 'Что за балаган у десятых кабинетов?!' },
        { bg: BG.hall, char: C.sofia, name: '', music: 'tense', text: 'Учительница математики с ледяным взглядом и классным журналом, прижатым к груди, как щит. Ее очки угрожающе поблескивают.' },
        { bg: BG.hall, char: C.sofia, name: 'Беда', music: 'tense', text: 'Я вам сейчас быстро найду полезное применение на дежурстве по столовой! Камран, марш на урок! А ты, Дима, задержишься после занятий. У нас с тобой будет серьезный разговор.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Камран бросает на меня победный взгляд и быстро уходит. Я открываю шкафчик, чтобы достать тетрадь, и замираю. На стопке учебников лежит белый конверт без подписи.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Внутри, фотография. На ней запечатлен директор школы, Алексей Евгеньевич, передающий какому-то мужчине в кожанке толстую пачку денег. А на обороте, короткая записка: «Ты следующий. Игра началась. 12:00, старый спортзал. Приходи один».' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Я быстро оглядываюсь по сторонам. Коридор пустеет. Кто-то знает о моих проблемах с Натальей Олеговной. И этот кто-то явно следит за мной.' },
        { choice: true, name: 'Дима', text: 'Что делать?', options: [ { text: 'Показать фото директору', next: 22 }, { text: 'Позвонить Дерзкому', next: 31 } ]},
        { bg: BG.office, char: C.director, name: '', music: 'tense', text: 'Кабинет директора. Светло, но царит напряжение. Алексей Евгеньевич сидит за большим дубовым столом.' },
        { bg: BG.office, char: C.dima, name: 'Дима', music: 'tense', text: 'Я врываюсь в кабинет без стука и кладу фотографию прямо на его стол. Директор поднимает глаза, и я вижу, как краска сходит с его лица.' },
        { bg: BG.office, char: C.dima, name: 'Дима', music: 'tense', text: 'Алексей Евгеньевич, что это? Кто этот мужчина и за что вы ему платите?' },
        { bg: BG.office, char: C.director, name: 'Директор', music: 'tense', text: 'Где ты это взял? Немедленно убери это со стола!' },
        { bg: BG.office, char: C.dima, name: 'Дима', music: 'tense', text: 'Кто-то подкинул это в мой шкафчик. И этот кто-то знает про мою семью. Зачем вы платите ему?' },
        { bg: BG.office, char: C.director, name: 'Директор', music: 'tense', text: 'Это не твое дело! Это... это спонсорская помощь. Да, точно. На ремонт школы.' },
        { bg: BG.office, char: C.dima, name: 'Дима', music: 'tense', text: 'Не врите мне. На обороте написано, что это часть какой-то игры.' },
        { bg: BG.office, char: C.director, name: 'Директор', music: 'tense', text: 'Слушай меня внимательно. Если ты кому-то покажешь это фото, я тебя выпру из школы. Ты понял меня? Убирайся!' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Я выхожу из кабинета, сжимая фото в кармане. Он явно что-то скрывает, но с ним бесполезно говорить. Я решаю идти в спортзал сам.', next: 40 },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Школьный двор. Я набираю номер Дерзкого. Он отвечает после второго гудка, на фоне слышен гул столовой.' },
        { bg: BG.street, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Чего хотел, братуха? Я тут булочку отбиваю у десятиклассников.' },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Дерзкий, это не шутки. Кто-то подкинул мне фото директора с деньгами и записку с угрозами. Меня вызывают в старый спортзал.' },
        { bg: BG.street, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Твою ж мать. И что ты хочешь сделать?' },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Встретиться с этим шантажистом в 12:00.' },
        { bg: BG.street, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Сдурел? Это может быть ловушка Камрана. Или кого похуже.' },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Поэтому я звоню тебе. Приходи туда, но стой на стреме снаружи. Если я не выйду через двадцать минут, звони Вачику.' },
        { bg: BG.street, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Ладно, братуха. Но если тебя там прикончат, я твой компьютер заберу. И приставку.' },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Я вешаю трубку и направляюсь к старому корпусу. В любом случае, мне нужно туда попасть.', next: 40 },
        { bg: BG.gym, char: null, name: '', music: 'tense', text: '12:00. Старый школьный спортзал. Полутемно. Окна заколочены досками, повсюду штабеля досок, мешки с цементом и строительный мусор. В воздухе висит густая пыль.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я тихо прохожу мимо штабелей, стараясь не шуметь. Внутри пахнет сыростью и краской. В центре зала стоит Руслан. На нем оранжевая каска и рабочий комбинезон.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', music: 'tense', text: 'Ты что здесь забыл, парень? Здесь опасно, полы гнилые. Мы тут стену ломаем, того и гляди придавит.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Да я… ключи ищу. Обронил где-то вчера.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', music: 'tense', text: 'Ну, смотри под ноги. Если что, я на другом конце зала, буду сносить перегородку.' },
        { bg: BG.gym, char: C.vachik, name: 'Вачик', music: 'tense', text: 'Тише, Дима. Я знал, что ты придешь.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Вачик? Ты меня напугал. Ты знаешь, кто это сделал?' },
        { bg: BG.gym, char: C.vachik, name: 'Вачик', music: 'tense', text: 'Я видел его. Какой-то тип в темной одежде. Он прятал что-то в стене. Вон там, за матами. Но если хочешь найти правду, она там.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Вачик кивает и растворяется в полумраке коридора. Я подхожу к матам, отодвигаю один. За ним в стене шатается кирпич. Я вытаскиваю его. В нише лежит старая тетрадь, диктофон и пачка фотографий.' },
        { choice: true, name: 'Дима', text: 'Что сделать первым?', music: 'tense', options: [ { text: 'Открыть тетрадь', next: 50 }, { text: 'Включить диктофон', next: 54 } ]},
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я открываю тетрадь. На первой странице список фамилий: Директор, Беда, Наталья Олеговна, и какой-то Андрей Андреев. Рядом с Андреем стоит жирный крестик.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я перелистываю страницу и читаю запись: «Наталья Олеговна перевела 50 тысяч на счет школы. Это не спонсорская помощь. Это откуп. За что? Нужно копнуть глубже».' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Бабушка? Какое она имеет к этому отношение? Я листаю дальше. Там записи про Камрана, про то, как он передает деньги. Про какого-то Дениса. И снова про Андрея.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', sfx: 'door', text: 'В этот момент дверь спортзала с грохотом захлопывается. В замке поворачивается ключ.', next: 58 },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', sfx: 'tape', text: 'Я включаю диктофон. Запись старая, шипящая. Голос мужской: «...все должно быть сделано тихо. Директор в курсе. Если кто-то узнает про этот эксперимент, мы все сядем. Особенно после того, что случилось с Андреем...».' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Что за эксперимент? Кто такой Андрей? Я перематываю запись, но там только шум.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', sfx: 'door', text: 'В этот момент дверь спортзала с грохотом захлопывается. В замке поворачивается ключ.', next: 58 },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я бросаюсь к двери и дергаю ручку. Бесполезно. Металл даже не дрогнул.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Эй! Кто здесь? Откройте!' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', sfx: 'step', text: 'С той стороны слышны удаляющиеся шаги. Я остаюсь в темноте. В кармане лежит тетрадь с фамилией моей бабушки. Кто-то запер меня здесь.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Меня выпустил Руслан. Утром следующего дня я иду в школу. У доски объявлений стоит Ксюша и приклеивает листовку «Праведные сёстры».' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Ксюш, привет. Что это?' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', music: 'calm', text: 'О, привет. Это кружок. Праведные сёстры. Там реально помогают. Я вот хожу.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Ксюша, ты знаешь, кто такой Андрей Андреев?' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', music: 'calm', text: 'Откуда ты знаешь это имя? Кто тебе сказал?' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'calm', text: 'Нашел старые документы. Это связано с сектой, в которую ты ходишь?' },
        { bg: BG.hall, char: C.ksusha, name: 'Ксюша', music: 'calm', text: 'Не называй их так! Приходи на собрание сегодня в актовый зал в шесть. Я тебе все расскажу. Только никому не говори.' },
        { bg: BG.math, char: C.sofia, name: '', music: 'sad', text: 'Кабинет математики. После уроков. Беда пишет уравнения.' },
        { bg: BG.math, char: C.dima, name: 'Дима', music: 'sad', text: 'Софья Андреевна, а вы знали Андрея Андреева?' },
        { bg: BG.math, char: C.sofia, name: 'Беда', music: 'sad', text: 'Кто тебе это сказал? Андрей был хорошим мальчиком. Но он сломался. А те, кто его сломал, сейчас сидят очень высоко. Забудь это имя, если не хочешь проблем.' },
        { bg: BG.aud, char: C.woman, name: 'Секта', music: 'tense', text: 'Актовый зал. Добро пожаловать. Я вижу новенького. Дима, верно? Поднимись к нам.' },
        { bg: BG.aud, char: C.dima, name: 'Дима', music: 'tense', text: 'Я медленно иду к сцене. Она кладет руку мне на плечо. Ее пальцы ледяные.' },
        { bg: BG.aud, char: C.woman, name: 'Секта', music: 'tense', text: 'Расскажи нам, Дима. Ты когда-нибудь чувствовал, что тебя предали? Ищи Андрея в архиве. И передай своей бабушке, Наталье Олеговне, что долг платежом красен.' },
        { bg: BG.hall, char: undefined, name: "", music: 'tense', text: "Я сбегаю со сцены. В коридоре меня хватает за руку Мила." },
        { bg: BG.aud, char: C.mila, name: "Мила", music: 'tense', text: "Дима. Я знаю, кто запер тебя в спортзале. Это был директор. Он забрал ключи у Вачика." },
        { bg: BG.aud, char: C.dima, name: "Дима", music: 'tense', text: "Зачем ему это?" },
        { bg: BG.aud, char: C.mila, name: "Мила", music: 'tense', text: "Он боится. И еще… я украла кое-что из его сейфа." },
        { bg: undefined, char: undefined, name: "", music: 'tense', text: "Мила протягивает мне флешку. Здесь видно, как Камран передает деньги, и как директор шантажирует его." },
        { bg: BG.aud, char: C.dima, name: "Дима", music: 'tense', choice: true, text: "Что делать с флешкой?", options: [ { text: "Отдать флешку полиции", next: 79 }, { text: "Найти Камрана", next: 81 } ] },
        { bg: BG.police, char: undefined, name: "", music: 'tense', text: "Отделение полиции. Я протягиваю флешку Николаю Андреевичу." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Это неполное видео, Дима. Нам нужно больше доказательств.", next: 83 },
        { bg: BG.street, char: C.kamran, name: "Камран", music: 'tense', text: "Школьный двор. Зачем ты мне помогаешь? Директор заставил меня. Он сказал, что если я не передам деньги, он выгонит мою бабушку из школы." },
        { bg: BG.street, char: C.dima, name: "Дима", music: 'tense', text: "Тогда пойдем в полицию вместе. Николай Андреевич должен это увидеть.", next: 83 },
        { bg: BG.police, char: undefined, name: "", music: 'tense', text: "Я иду по пустому коридору отделения. Внезапно экран телефона загорается: «Ты думал, что нашел правду? Ты даже не представляешь, кто настоящий Кукольник. Оглянись»." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Я резко оборачиваюсь. В конце темного коридора мелькает тень. Сердце уходит в пятки." },
      ],
      [
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "Я резко оборачиваюсь. В конце темного коридора мелькает тень. Кто-то стоит там и смотрит на меня. Сердце уходит в пятки. Я сжимаю кулаки, готовый бежать или драться. Тишина в коридоре становится оглушительной." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Кто здесь? Выходи!" },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "Силуэт делает шаг вперед. Свет от мигающей лампы падает на лицо." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Тихо, братуха, это я! Чего ты орешь на весь этаж?" },
        { bg: BG.hall, char: C.derz, name: "", music: 'tense', text: "Я выдыхаю, чувствуя, как адреналин медленно отступает. Дерзкий подходит ближе, на его лице написано беспокойство." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Дерзкий, черт тебя дери! Я чуть инфаркт не схватил. Ты чего здесь крадешься?" },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Я стоял на стреме снаружи, как ты и просил. Но потом увидел, как какой-то тип в темной куртке выбежал из запасного выхода. Я пытался его догнать, но он будто сквозь землю провалился. Ты в порядке?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "В порядке. Только что получил сообщение от нашего шантажиста. Он знает, что я нашел тетрадь." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Покажи." },
        { bg: BG.hall, char: C.derz, name: "", music: 'tense', text: "Я протягиваю ему телефон. Дерзкий читает сообщение, и его лицо мрачнеет." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "«Следующие гости уже идут за тобой». Это что за бред? Он что, хочет нас запугать?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Думаю, он не шутит. Нам нужно где-то спрятаться и изучить то, что я нашел. И желательно подальше от школы." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Мы с Дерзким сидим за старым столом. Я включаю фонарик на телефоне и кладу его так, чтобы свет падал на тетрадь. Дерзкий вертит в руках диктофон." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Итак, что мы имеем? Тетрадь с именами, где есть твоя бабушка, директор, Беда и какой-то мертвый Андрей. Диктофон с голосом, который говорит про какой-то эксперимент. И флешку от Милы с видео, где Камран передает деньги." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Не забывай про сообщение. Кто-то следит за каждым моим шагом. И этот кто-то запер меня в спортзале." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "И этот кто-то знает про твою бабушку. Слушай, а может, это она сама все подстроила? Ну, в смысле, Наталья Олеговна. Ты же сам говорил, что у вас отношения не очень." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Я думал об этом. Но зачем ей шантажировать саму себя? Она перевела эти 50 тысяч, чтобы скрыть что-то. Если бы она хотела тебя подставить, она бы сделала это иначе." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Логично. А что насчет Беды? Она ведь тоже в списке." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Она знает об Андрее больше, чем говорит. Когда я спросил ее, она так испугалась, что чуть мел из рук не выронила. И палочку поставила просто так, чтобы я замолчал." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Я открываю тетрадь на середине. На одной из страниц нарисована странная схема. Стрелки указывают от слова «Эксперимент» к именам учеников. Рядом с каждым именем стоят оценки и какие-то цифры." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Смотри. Это похоже на табель успеваемости. Но оценки странные. У кого-то «А+», у кого-то «F». И цифры. Что они значат?" },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Может, это взятки? Типа, кто сколько заплатил?" },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Не похоже. Слишком мало. Вот у Камрана стоит «B». И сумма 500. Это что, доллары?" },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Если это доллары, то 500, это не так много. А у Андрея что?" },
        { bg: BG.boiler, char: C.derz, name: "", music: 'tense', text: "Я ищу имя Андрея в схеме. Возле него стоит «F» и сумма 0. А рядом приписка рукой: «Отказ. Сломался»." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "«Отказ. Сломался». Это не просто травля. Это какой-то психологический эксперимент. Они ломали учеников." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Жесть. И твоя бабушка в этом участвовала?" },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Не знаю. Но нам нужно узнать больше. У нас есть два варианта: либо идти к Вачику, он охранник и может знать прошлое школы, либо к Беде, чтобы вытрясти из нее правду." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Пойти к охраннику Вачику и показать ему тетрадь.", next: 29 }, { text: "Пойти к Беде и заставить ее рассказать правду прямо сейчас.", next: 44 } ] },
        { bg: BG.guard, char: C.dima, name: "", music: 'tense', text: "Мы с Дерзким приходим на пост охраны. Вачик сидит в полумраке, глядя на мониторы. Он оборачивается, услышав шаги." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Вы чего здесь ночью шаритесь? Школа закрыта." },
        { bg: BG.guard, char: C.dima, name: "Дима", music: 'tense', text: "Вачик, нам нужна твоя помощь. Мы нашли тетрадь в спортзале. И там записи про учеников. Про какой-то эксперимент." },
        { bg: BG.guard, char: C.dima, name: "", music: 'tense', text: "Я кладу тетрадь на стол. Вачик берет ее в руки. Он перелистывает страницы, и его лицо становится очень серьезным. Он больше не выглядит как простой охранник." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Откуда это у вас? И кто еще видел?" },
        { bg: BG.guard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Пока только мы. И тот, кто подкинул нам фото директора." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Фото директора?" },
        { bg: BG.guard, char: C.vachik, name: "", music: 'tense', text: "Мы рассказываем ему про фотографию и про записку. Вачик откидывается на спинку стула и тяжело вздыхает." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Я знал, что эта школа с гнильцой. Слушайте сюда. Я работаю здесь не просто так. У меня есть свои причины следить за этим местом. И я знаю про Андрея. Он был не единственным." },
        { bg: BG.guard, char: C.dima, name: "Дима", music: 'tense', text: "Что ты имеешь в виду?" },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "В тетради должны быть имена других учеников. Тех, кто «сломался». Этот эксперимент назывался «Программа адаптации». Якобы для подготовки к экзаменам. А на самом деле, это была система отбора. Кто выдержит давление, получает место в элитном вузе. Кто нет, вылетает." },
        { bg: BG.guard, char: C.dima, name: "Дима", music: 'tense', text: "И Андрей не выдержал?" },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Он покончил с собой прямо в спортзале. Там, где ты нашел тетрадь. Повесился на баскетбольном кольце. Директор тогда сказал, что это трагическая случайность. Но все знали, что его травили." },
        { bg: BG.guard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Почему ты не сдал их? Ты же охранник, у тебя есть доступ." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Потому что директор заплатил мне. Я тогда нуждался в деньгах. Но с тех пор я собираю доказательства. Эта тетрадь, ключ. И тот, кто вам ее подкинул, знает это.", next: 54 },
        { bg: BG.math, char: C.vachik, name: "", music: 'tense', text: "Мы с Дерзким ждем у кабинета. Я стучу в дверь. Беда сидит за столом, проверяя тетради. Она поднимает голову, и я вижу, что она не удивлена." },
        { bg: BG.math, char: C.sofia, name: "Беда", music: 'tense', text: "Я так и знала, что ты придешь. Заходите, оба." },
        { bg: BG.math, char: C.sofia, name: "", music: 'tense', text: "Мы проходим внутрь. Беда откладывает ручку в сторону." },
        { bg: BG.math, char: C.dima, name: "Дима", music: 'tense', text: "Софья Андреевна, я знаю про эксперимент. Про Андрея. И про то, что вы в этом участвовали." },
        { bg: BG.math, char: C.dima, name: "", music: 'tense', text: "Она закрывает лицо руками. Проходит несколько секунд, прежде чем она заговаривает." },
        { bg: BG.math, char: C.sofia, name: "Беда", music: 'tense', text: "Это была не моя идея. Директор придумал эту программу. Он сказал, что это поможет выявить сильнейших. А я... я просто ставила оценки. Я не знала, что Андрей настолько сломается." },
        { bg: BG.math, char: C.derz, name: "Дерзкий", music: 'tense', text: "Вы знали, что его травят. И ничего не делали." },
        { bg: BG.math, char: C.sofia, name: "Беда", music: 'tense', text: "Я боялась. Меня бы уволили. А я всю жизнь работала только здесь. Я не могла потерять работу." },
        { bg: BG.math, char: C.dima, name: "Дима", music: 'tense', text: "А теперь? Вы готовы рассказать правду?" },
        { bg: BG.math, char: C.sofia, name: "Беда", music: 'tense', text: "Если я это сделаю, меня посадят. И директора тоже. Но... я устала бояться. Я помогу вам. Но вы должны найти доказательства. Тетрадь, это только начало. Вам нужны записи из его сейфа. Там хранится все." },
        { bg: BG.yard, char: C.sofia, name: "", music: 'tense', text: "Мы выходим на улицу. Ночь холодная. Дерзкий передергивает плечами." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ну что, теперь у нас есть план. Вскрыть сейф директора. И как мы это сделаем?" },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Нам нужен ключ." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Или тот, кто умеет вскрывать сейфы. Слушай, а давай спросим у Милы? Она же убиралась в кабинете директора. Она могла видеть, где он хранит ключ." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Хорошая идея. Но сначала нам нужно переварить то, что мы узнали." },
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "В этот момент мой телефон вибрирует. Пришло сообщение от Ксюши." },
        { bg: BG.yard, char: C.dima, name: "Ксюша (сообщение)", music: 'tense', text: "Дима, приходи в музыкальный класс. Срочно. Я знаю, кто тебе угрожает. И я боюсь." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Это Ксюша. Она хочет встретиться в музыкальном классе." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Это может быть ловушка." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Может. Но если она знает, кто шантажист, я должен узнать это первым." },
        { bg: BG.music, char: C.dima, name: "", music: 'tense', text: "Мы заходим в музыкальный класс. Ксюша сидит на стуле, прижимая к груди скрипку. Она выглядит очень напуганной." },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Спасибо, что пришел." },
        { bg: BG.music, char: C.dima, name: "Дима", music: 'tense', text: "Что случилось? Кто тебя напугал?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Я была на собрании «Праведных сестер». И я слышала, как они говорили о тебе. Они знают про тетрадь. И они хотят ее получить." },
        { bg: BG.music, char: C.derz, name: "Дерзкий", music: 'tense', text: "А при чем тут ты?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Потому что они заставили меня привести тебя туда. Они сказали, что если я не сделаю этого, они расскажут всем про моего брата. Про то, что он не сын моего отца." },
        { bg: BG.music, char: C.dima, name: "Дима", music: 'tense', text: "Они шантажируют тебя?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Да. И они шантажируют многих. Эта женщина на сцене... она знает все секреты всех учеников. Она использует их." },
        { bg: BG.music, char: C.dima, name: "Дима", music: 'tense', text: "Нам нужно вывести ее на чистую воду. Ты поможешь нам?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Я не знаю. Мне страшно." },
        { bg: BG.music, char: C.ksusha, name: "", music: 'tense', text: "В коридоре раздаются шаги. Ксюша вздрагивает." },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Это они. Они идут сюда. Прячьтесь!" },
        { bg: BG.music, char: C.ksusha, name: "", music: 'tense', text: "Мы с Дерзким прячемся за шкафом с инструментами. Дверь открывается. В класс входит Саламандра. Она одна. Она подходит к Ксюше." },
        { bg: BG.music, char: C.sala, name: "Саламандра", music: 'tense', text: "Ты сделала то, о чем тебя просили?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Да. Он придет на собрание." },
        { bg: BG.music, char: C.sala, name: "Саламандра", music: 'tense', text: "Хорошо. Если он принесет тетрадь, мы отпустим тебя. И твоего брата." },
        { bg: BG.music, char: C.sala, name: "", music: 'tense', text: "Саламандра уходит. Мы выходим из укрытия." },
        { bg: BG.music, char: C.dima, name: "Дима", music: 'tense', text: "Саламандра? Она тоже в этом участвует?" },
        { bg: BG.music, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Она не просто участвует. Она, правая рука этой женщины. Она знает все." },
        { bg: BG.music, char: C.ksusha, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Пойти на собрание «Праведных сестер» и попытаться поймать Саламандру с поличным.", next: 84 }, { text: "Пойти к Николаю Андреевичу и рассказать ему про шантаж и секту.", next: 88 } ] },
        { bg: BG.assembly, char: C.ksusha, name: "", music: 'tense', text: "Мы с Дерзким проникаем в актовый зал через запасной вход. Мы прячемся за кулисами. На сцене стоит женщина. Рядом с ней, Саламандра." },
        { bg: BG.assembly, char: C.woman, name: "Секта", music: 'tense', text: "Сегодня мы поговорим о тех, кто мешает нам. О тех, кто пытается разрушить наше сообщество." },
        { bg: BG.assembly, char: C.woman, name: "", music: 'tense', text: "Она смотрит прямо в сторону кулис, где мы прячемся. Я чувствую, как холодный пот стекает по спине." },
        { bg: BG.assembly, char: C.woman, name: "Секта", music: 'tense', text: "Выходи, Дима. Мы знаем, что ты здесь.", next: 103 },
        { bg: BG.police, char: C.woman, name: "", music: 'tense', text: "Я прихожу к Николаю Андреевичу. Он сидит за столом, просматривая бумаги." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Николай Андреевич, мне нужна ваша помощь. В школе есть секта. «Праведные сестры». Они шантажируют учеников." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Это серьезные обвинения. У тебя есть доказательства?" },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Вот. Тетрадь с записями. И флешка с видео." },
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Николай Андреевич берет тетрадь. Он листает ее, и его лицо становится все более мрачным." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Я знал про эту организацию. Но у меня не было доказательств. Теперь есть. Но действовать нужно осторожно. Если мы просто арестуем их, они могут уничтожить улики." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Что вы предлагаете?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Я дам тебе прослушку. Ты пойдешь на их собрание. И запишешь их разговор. Это будет доказательством." },
        { bg: BG.assembly, char: C.nikolay, name: "", music: 'tense', text: "Я захожу в зал. В кармане у меня прослушка, которую дал Николай Андреевич. На сцене стоит женщина. Рядом с ней, Саламандра." },
        { bg: BG.assembly, char: C.woman, name: "Секта", music: 'tense', text: "А вот и наш гость. Дима. Мы ждали тебя. Ты принес то, что мы просили?" },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "Я принес тетрадь. Но сначала я хочу знать, зачем вам это." },
        { bg: BG.assembly, char: C.woman, name: "Секта", music: 'tense', text: "Мы не хотим зла. Мы просто восстанавливаем справедливость. Твоя бабушка, Наталья Олеговна, покрывала смерть Андрея. Она должна ответить." },
        { bg: BG.assembly, char: C.sala, name: "Саламандра", music: 'tense', text: "Отдай тетрадь, Дима. Иначе мы расскажем всем, что ты помогал Камрану скрывать улики." },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "У вас нет доказательств." },
        { bg: BG.assembly, char: C.sala, name: "Саламандра", music: 'tense', text: "А нам и не нужны. Достаточно слухов. Ты же знаешь, как это работает в школе." },
        { bg: BG.hall, char: C.sala, name: "", music: 'tense', text: "После собрания мы с Дерзким выходим на улицу. У меня в кармане запись разговора с женщиной. Но радости нет." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Мы получили то, что хотели. Почему ты такой хмурый?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Потому что эта женщина не блефовала. Она действительно знает про Наталью Олеговну. И про Андрея. И я не уверен, что мы сможем это остановить." },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "В этот момент мой телефон звонит. Это Наталья Олеговна. Я беру трубку." },
        { bg: BG.hall, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Дима. Приезжай домой. Срочно." },
        { bg: BG.hall, char: C.babushka, name: "", music: 'tense', text: "Ее голос дрожит. Я никогда не слышал, чтобы она так говорила." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Что случилось?" },
        { bg: BG.hall, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Они были здесь. Они забрали письмо. И... они оставили записку для тебя." },
        { bg: BG.home, char: C.babushka, name: "", music: 'tense', text: "Я влетаю в дом. Наталья Олеговна сидит на диване, укутавшись в плед. Вся комната перевернута вверх дном. На столе лежит записка." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Вы целы?" },
        { bg: BG.home, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Да. Они ничего мне не сделали. Просто забрали письмо и ушли. Они знали, где оно лежит." },
        { bg: BG.home, char: C.babushka, name: "", music: 'tense', text: "Я беру записку. На ней напечатано: «Игра продолжается. Ты думал, что тетрадь, это главное? Нет. Главное, это то, что в письме. И теперь оно у нас. Если хочешь увидеть Ксюшу живой, принеси нам все, что у тебя есть. Завтра в полночь. Старый спортзал»." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Ксюша... Они забрали Ксюшу." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Наталья Олеговна смотрит на меня с ужасом." },
        { bg: BG.home, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Дима, что происходит? Кто эти люди?" },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Это долгая история. И я не уверен, что у нас есть время ее рассказывать. Мне нужно идти." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Я разворачиваюсь и бегу к двери. В голове стучит одна мысль: я должен спасти Ксюшу. Но когда я выбегаю на улицу, я вижу знакомый силуэт. Это Руслан. Он стоит возле своей машины и смотрит на меня." },
        { bg: BG.home, char: C.ruslan, name: "Руслан", music: 'tense', text: "Садись. У нас мало времени." },
        { bg: BG.home, char: C.ruslan, name: "", music: 'tense', text: "Я замираю. Откуда он знает? И почему он здесь?" },
      ],
      [
        { bg: BG.car, char: C.dimaStreet, name: "", music: 'tense', text: "Я сижу на переднем сиденье, вжавшись в кресло. Руки инстинктивно сжимают ремень безопасности. Руслан ведет машину молча, его лицо освещается только огнями встречных фар. Я смотрю на его профиль и пытаюсь понять: он на моей стороне или это очередная ловушка?" },
        { bg: BG.car, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Откуда вы знаете про Ксюшу? И почему вы вообще оказались у моего дома?" },
        { bg: BG.car, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Я работаю в школе, Дима. И я вижу больше, чем кажется. Сегодня вечером я задержался в старом корпусе, чтобы доделать проводку. И увидел, как двое мужчин в темных куртках тащили упирающуюся девчонку в подвал. Я узнал ее. Это была та девочка со скрипкой." },
        { bg: BG.car, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Почему вы не вызвали полицию?" },
        { bg: BG.car, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Потому что у меня нет с ними хороших отношений. И потому что я знаю, что ты в это вляпался по уши. Я решил, что тебе можно доверять." },
        { bg: BG.car, char: C.ruslanCasual, name: "", music: 'tense', text: "Я не знаю, верить ему или нет. Но у меня нет выбора. Ксюша в опасности." },
        { bg: BG.car, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Куда мы едем?" },
        { bg: BG.car, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "В подвал. Тот, что под старым спортзалом. Туда редко кто заходит. Идеальное место для грязных делишек. У меня есть ключи от служебного входа." },
        { bg: BG.yard, char: C.ruslanCasual, name: "", music: 'tense', text: "Мы тормозим у забора. Из тени выходит Дерзкий. Он явно нервничает и держит в руках монтировку." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Ты чего так долго? И кто это с тобой?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Это Руслан. Он видел, как Ксюшу тащили в подвал." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Строитель? И ты ему веришь?" },
        { bg: BG.yard, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Парень, если бы я хотел вас сдать, я бы не привозил его сюда. У нас мало времени. Через десять минут они поймут, что мы здесь." },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Так, слушайте. Нам нужно вызвать подмогу. Я позвоню Вачику. Он охранник и знает, что делать." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "А если он в доле?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "У нас нет выбора. Либо мы идем втроем против неизвестно скольких людей, либо ждем Вачика." },
        { bg: BG.yard, char: C.dimaStreet, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Позвонить Вачику и ждать его прибытия.", next: 17 }, { text: "Не тратить время и втроем спуститься в подвал прямо сейчас.", next: 24 } ] },
        { bg: BG.yard, char: C.dimaStreet, name: "", music: 'tense', text: "Я набираю номер Вачика. Он отвечает сонным голосом." },
        { bg: BG.yard, char: C.vachik, name: "Вачик", music: 'tense', text: "Дима? Ты знаешь, сколько времени?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Вачик, Ксюшу похитили. Ее держат в подвале под старым спортзалом. Нам нужна твоя помощь." },
        { bg: BG.yard, char: C.vachik, name: "Вачик", music: 'tense', text: "Подвал? Понял. Никуда не лезьте. Я буду через пять минут. И, Дима... если увидите там кого-то из «Праведных сестер», не вступайте в диалог. Они опасны." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Ну что, он едет?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Едет. Ждем." },
        { bg: BG.yard, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Пять минут, это много. Если они увидят, что их засекли, они могут избавиться от заложницы.", next: 27 },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Нет времени ждать. Идем сейчас." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Надеюсь, мы не подписываем себе смертный приговор." },
        { bg: BG.yard, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Я пойду первым. У меня есть ключ от служебной двери. Вы за мной." },
        { bg: BG.basement, char: C.ruslanCasual, name: "", music: 'tense', text: "Мы спускаемся по скрипучей лестнице. В подвале пахнет плесенью и машинным маслом. В центре комнаты стоит стул. На нем, привязанная скотчем, сидит Ксюша. У нее во рту кляп, а на глазах слезы. Рядом с ней стоят двое мужчин в черных куртках. А перед ними, спиной к нам, стоит Саламандра." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Вы уверены, что он придет? Может, он уже сдал нас копам." },
        { bg: BG.basement, char: C.salaAngry, name: "Мужчина в куртке", music: 'tense', text: "Он придет. У него нет выбора. Эта девчонка, его слабость." },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', text: "Я делаю шаг вперед, сжимая монтировку, которую мне передал Дерзкий." },
        { bg: BG.basement, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Отпустите ее." },
        { bg: BG.basement, char: C.dimaStreet, name: "", music: 'tense', text: "Саламандра резко оборачивается. На ее лице появляется удивление, а затем злая ухмылка." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Надо же. Дима. А ты быстрее, чем я думала. И даже привел с собой друзей." },
        { bg: BG.basement, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Юля, ты что творишь? Ты совсем сбрендила?" },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Я восстанавливаю справедливость. Твоя бабушка, Наталья Олеговна, убила моего брата. И теперь она заплатит." },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', text: "Ксюша мычит, пытаясь что-то сказать." },
        { bg: BG.basement, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Наталья Олеговна здесь ни при чем. Отпусти Ксюшу, она не имеет к этому отношения." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Она знает слишком много. И она твоя подруга. Поэтому она, часть игры. Ты принес то, что я просила? Тетрадь и письмо?" },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', choice: true, text: "Что ответить?", options: [ { text: "Сказать правду, что письмо украли из дома Натальи Олеговны.", next: 40 }, { text: "Сблефовать и сказать, что оставил их в надежном месте, и отпущу их только в обмен на Ксюшу.", next: 46 } ] },
        { bg: BG.basement, char: C.dimaStreet, name: "Дима", music: 'tense', text: "У меня нет письма. Сегодня кто-то вломился в дом Натальи Олеговны и украл его." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Что? Ты врешь!" },
        { bg: BG.basement, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Я не вру! Комната перевернута вверх дном. Если ты думаешь, что это сделал я, то ты ошибаешься." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Значит, у нас проблемы. Потому что я тоже не отправляла своих людей к твоей бабке." },
        { bg: BG.basement, char: C.salaAngry, name: "Мужчина в куртке", music: 'tense', text: "Босс, если письмо у кого-то другого, это меняет дело." },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', text: "Дверь подвала с грохотом открывается. Наверху появляется Вачик.", next: 50 },
        { bg: BG.basement, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Я принес тетрадь и письмо. Но они у Дерзкого. Отпусти Ксюшу, и я отдам их тебе." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Ты думаешь, я поверю? Дерзкий, покажи." },
        { bg: BG.basement, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Ага, сейчас. Сначала отпусти ее." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Вы не в том положении, чтобы торговаться!" },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', text: "В этот момент в подвал врывается Вачик с фонарем в руках. Он мгновенно оценивает обстановку." },
        { bg: BG.basement, char: C.vachik, name: "Вачик", music: 'tense', text: "Всем стоять! Полиция уже едет! Саламандра, у тебя есть ровно минута, чтобы отпустить заложницу." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Полиция? Ты вызвал полицию, Дима? Ты идиот! Они убьют нас всех!" },
        { bg: BG.basement, char: C.salaAngry, name: "", music: 'tense', text: "Мужчины в куртках бросаются врассыпную. Один из них толкает стул с Ксюшей, и она падает на пол. Я бросаюсь к ней, пытаясь развязать узлы. Дерзкий преграждает путь Саламандре." },
        { bg: BG.basement, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Юля, остановись! Это уже не месть, это безумие!" },
        { bg: BG.basement, char: C.derzStreet, name: "", music: 'tense', text: "Саламандра выхватывает из кармана газовый баллончик и брызгает Дерзкому в лицо. Он кричит от боли и закрывает глаза. Саламандра бросается к выходу, но на ее пути встает Руслан. Он хватает ее за руку." },
        { bg: BG.basement, char: C.salaAngry, name: "Саламандра", music: 'tense', text: "Отпусти меня! Ты кто такой вообще?!" },
        { bg: BG.basement, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Тот, кто не даст тебе разрушить жизни других людей." },
        { bg: BG.basement, char: C.ruslanCasual, name: "", music: 'tense', text: "Саламандра вырывается и убегает. Руслан пытается ее догнать, но спотыкается о трубу и падает. Вачик помогает мне освободить Ксюшу. Она вся дрожит, но цела." },
        { bg: BG.yard, char: C.ruslanCasual, name: "", music: 'tense', text: "Врач осматривает Ксюшу. Я стою рядом с Дерзким, который промывает глаза водой из бутылки. Вачик стоит в стороне и говорит по рации." },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Ксюш, ты как?" },
        { bg: BG.yard, char: C.ksushaKidnapped, name: "Ксюша", music: 'tense', text: "Нормально. Они ничего не сделали. Просто хотели, чтобы ты пришел." },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Прости меня. Я не должен был втягивать тебя в это." },
        { bg: BG.yard, char: C.ksushaKidnapped, name: "Ксюша", music: 'tense', text: "Ты не виноват. Это все Саламандра и эта секта." },
        { bg: BG.yard, char: C.ksushaKidnapped, name: "", music: 'tense', text: "К нам подходит Руслан. У него разбита коленка, но он улыбается." },
        { bg: BG.yard, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Ну что, живой?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Живой. Спасибо вам." },
        { bg: BG.yard, char: C.ruslanCasual, name: "Руслан", music: 'tense', text: "Не за что. Если понадобится помощь, обращайся." },
        { bg: BG.yard, char: C.ruslanCasual, name: "", music: 'tense', text: "Он уходит в сторону старого корпуса. Я смотрю ему вслед. В его походке есть что-то странное. Он не хромает, хотя должен. И он даже не запыхался, хотя бежал за Саламандрой." },
        { bg: BG.yard, char: C.ruslanCasual, name: "", music: 'tense', text: "В этот момент мой телефон вибрирует. Пришло сообщение с неизвестного номера." },
        { bg: BG.yard, char: C.ruslanCasual, name: "Неизвестный номер (сообщение)", music: 'tense', text: "«Ты думал, что спас ее? Ты просто пешка в моей игре. Письмо у меня. И я знаю, что в нем. Скоро ты узнаешь правду о Наталье Олеговне. И она тебе не понравится. Кукольник»." },
        { bg: BG.yard, char: C.ruslanCasual, name: "", music: 'tense', text: "Я смотрю на экран телефона. Руки начинают дрожать. Кто-то следит за нами. И этот кто-то знает больше, чем я думал." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Дим, что там?" },
        { bg: BG.yard, char: C.derzStreet, name: "", music: 'tense', text: "Я показываю ему телефон. Дерзкий бледнеет." },
        { bg: BG.yard, char: C.derzStreet, name: "Дерзкий", music: 'tense', text: "Кукольник? Это что, тот же, кто подкинул тебе фото?" },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Да. И он украл письмо у Натальи Олеговны. Значит, Саламандра не врала. Но кто тогда?" },
        { bg: BG.yard, char: C.dimaStreet, name: "", music: 'tense', text: "Я поднимаю глаза и смотрю в сторону старого корпуса. В окне на втором этаже горит свет. Там никого нет, но я чувствую чей-то взгляд." },
        { bg: BG.yard, char: C.dimaStreet, name: "Дима", music: 'tense', text: "Нам нужно узнать, что было в этом письме. И кто его украл. Потому что если Кукольник узнает правду раньше нас, мы все в опасности." },
      ],
      [
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Дом Натальи Олеговны. Утро. В комнате все еще царит легкий беспорядок после погрома, но окно открыто, и солнечный свет пробивается сквозь шторы. Наталья Олеговна сидит в кресле, укутавшись в шаль, и держит в руках чашку с остывшим чаем." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Я стою перед ней, скрестив руки на груди. Дерзкий остался ждать на улице, чтобы не смущать Наталью Олеговну. В доме тихо, слышно только, как тикают старые часы в углу." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Наталья Олеговна, нам нужно серьезно поговорить. Сегодня ночью я был в подвале. Ксюшу похитили, чтобы выманить меня. А когда я вернулся, ты сказала, что кто-то украл письмо. Ты должна рассказать мне всю правду." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Дима, я уже сказала тебе все, что знаю. Какие-то люди ворвались в дом, перевернули все вверх дном и забрали конверт. Я не знаю, кто они." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Ты знаешь больше, чем говоришь. Что было в этом письме? Почему оно так важно для всех? Для Саламандры, для «Праведных сестер», для этого Кукольника?" },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Наталья Олеговна отставляет чашку в сторону. Ее руки дрожат." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Я не могу тебе этого сказать, Дима. Это уничтожит нашу семью. Это уничтожит меня." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Твоя семья и так уже почти уничтожена! Меня чуть не убили! Ксюшу держали в подвале! Пожалуйста, если ты хоть что-то чувствуешь ко мне, расскажи правду." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Наталья Олеговна закрывает лицо руками. Проходит несколько секунд, прежде чем она заговаривает." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Это письмо было не от Андрея. Точнее, не только от него. Там была записка от директора школы. Он шантажировал меня. В письме были доказательства того, что я переводила деньги на счета школы не просто так. Это были деньги за молчание." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "За молчание о чем?" },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "О том, что случилось с Андреем. Директор сказал, что если я не заплачу, он сделает так, что виновной сделают меня. Я была там в тот день. Я видела, как его травили. И я не остановила их. Я просто стояла и смотрела. А потом он... он сделал это с собой. Директор записал это на камеру и использовал против меня." },
        { bg: BG.home, char: C.babushkaScared, name: "", music: 'tense', choice: true, text: "Что ответить Наталье Олеговне?", options: [ { text: "Сказать Наталье Олеговне, что мы пойдем к Николаю Андреевичу и сдадим директора.", next: 13 }, { text: "Успокоить ее и пообещать, что найду это письмо сам, не втягивая полицию.", next: 18 } ] },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Наталья Олеговна, мы должны рассказать все Николаю Андреевичу. Это единственный способ остановить директора и того, кто за этим стоит." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Ты не понимаешь! Если я признаюсь, меня посадят за соучастие. Я не выдержу этого." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Я не дам тебя в обиду. Но мы не можем больше молчать. Они уже перешли черту." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Наталья Олеговна тяжело вздыхает и кивает, вытирая слезы." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Хорошо. Я сделаю это. Ради тебя.", next: 22 },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Я найду это письмо. Кто бы его ни забрал, я его верну. Мы решим это без полиции." },
        { bg: BG.home, char: C.babushkaScared, name: "Наталья Олеговна", music: 'tense', text: "Дима, это опасно. Тот, кто это сделал, может убить." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Я справлюсь. Просто доверься мне." },
        { bg: BG.home, char: C.dima, name: "", music: 'tense', text: "Наталья Олеговна смотрит на меня с благодарностью, но в ее глазах все еще читается страх." },
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "Я выхожу на улицу. Дерзкий ждет меня, сидя на бордюре и кидая камешки в асфальт." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ну что, выяснил что-нибудь?" },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Выяснил. Директор шантажировал Наталью Олеговну видеозаписью травли Андрея. Письмо, которое украли, содержало доказательства. Нам нужно найти оригиналы. Или хотя бы эту запись." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "И где мы будем искать? В кабинете директора?" },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "В школьном архиве. Вачик говорил, что там хранятся старые документы. Если директор что-то и прятал, то там." },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "Мы стоим у двери с табличкой «Архив». Дерзкий возится с замком, высунув язык от усердия." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Сейчас... почти... есть!" },
        { bg: BG.hall, char: C.derz, name: "", music: 'tense', text: "Замок щелкает. Мы осторожно заходим внутрь." },
        { bg: BG.archive, char: C.derz, name: "", music: 'tense', text: "Внутри пахнет затхлостью. Стеллажи тянутся до самого потолка. Я включаю фонарик на телефоне." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Нам нужны дела за позапрошлый год. Ищи папки с фамилией Андреев." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Мы начинаем перебирать папки. Пыль летит в глаза." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дима, смотри. Вот папка с его именем." },
        { bg: BG.archive, char: C.derz, name: "", music: 'tense', text: "Я открываю папку. Внутри, стопка писем, фотографий и... тонкая тетрадь. Но самое главное, конверт, который я сразу узнаю. Это тот самый конверт, который украли из дома Натальи Олеговны." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Он здесь. Письмо здесь." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Как оно сюда попало?" },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Директор. Он забрал его. Он знает, что мы копаем." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Я открываю конверт. Внутри, не только письмо Наталье Олеговне. Там фотография. На ней запечатлен директор, передающий деньги... тому самому мужчине в кожанке с первой фотографии." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Это же тот тип, которому директор платил! Значит, они заодно." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "И еще одна записка. «Проект закрыт. Все концы в воду. Андрей, последний, кто знал. Убери его»." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "«Убери»? Это же заказное убийство! Они заказали Андрея!" },
        { bg: BG.archive, char: C.derz, name: "", music: 'tense', choice: true, text: "Что делаем с находкой?", options: [ { text: "Забрать папку с собой и уйти прямо сейчас.", next: 43 }, { text: "Сфотографировать все документы на телефон и оставить папку на месте, чтобы директор ничего не заподозрил.", next: 48 } ] },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Забираем папку. Это улика." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "А если нас поймают?" },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Не поймают. Пошли." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Мы прячем папку в рюкзак и выбираемся из архива. Но когда мы выходим в коридор, то натыкаемся на Софью Андреевну. Она стоит прямо перед нами с фонариком в руке." },
        { bg: BG.archive, char: C.sofia, name: "Беда", music: 'tense', text: "Что вы делаете в архиве? И что у вас в рюкзаке?", next: 53 },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Мы не можем забирать оригиналы. Если директор хватится, он поймет, что мы были здесь. Фотографируем все." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Я достаю телефон и начинаю фотографировать каждую страницу папки. Дерзкий стоит на стреме." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дима, быстрее. Мне кажется, кто-то идет." },
        { bg: BG.archive, char: C.derz, name: "", music: 'tense', text: "Я заканчиваю и кладу папку на место. Мы выходим в коридор. Навстречу нам идет Беда. Она смотрит на нас с подозрением." },
        { bg: BG.archive, char: C.sofia, name: "Беда", music: 'tense', text: "Что вы здесь делаете?" },
        { bg: BG.hall, char: C.sofia, name: "", music: 'tense', text: "Беда преграждает нам путь. Ее лицо бледное, а в глазах читается страх." },
        { bg: BG.hall, char: C.sofia, name: "Беда", music: 'tense', text: "Я знаю, что вы здесь искали. Вы нашли то, что нужно?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Вы знали, что директор заказал убийство Андрея?" },
        { bg: BG.hall, char: C.sofia, name: "Беда", music: 'tense', text: "Я... я догадывалась. Но у меня не было доказательств. Директор сказал мне, что это был несчастный случай. Я хотела верить в это." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "И поэтому вы просто поставили ему палочку и пошли дальше?" },
        { bg: BG.hall, char: C.sofia, name: "Беда", music: 'tense', text: "Я боялась. Я старая женщина. Что я могла сделать? Но сейчас я вижу, что вы не остановитесь. Я помогу вам. В кабинете директора есть тайник. За портретом. Там хранится флешка с записями." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Спасибо, Беда." },
        { bg: BG.hall, char: C.sofia, name: "Беда", music: 'tense', text: "Только будьте осторожны. Директор сейчас в школе. И он не один." },
        { bg: BG.directorCorridor, char: C.sofia, name: "", music: 'tense', text: "Мы с Дерзким стоим перед кабинетом. Из-за двери слышны голоса." },
        { bg: BG.directorCorridor, char: C.derz, name: "Дерзкий", music: 'tense', text: "Я слышу директора. И еще кого-то. Это тот мужчина, с фотографии?" },
        { bg: BG.directorCorridor, char: C.dima, name: "Дима", music: 'tense', text: "Похоже на то. Они обсуждают, что делать с нами." },
        { bg: BG.directorCorridor, char: C.dima, name: "", music: 'tense', text: "Я осторожно приоткрываю дверь. Директор стоит у окна, а напротив него сидит мужчина в кожанке. В руках у него папка." },
        { bg: BG.directorCorridor, char: C.director, name: "Директор", music: 'tense', text: "Ты должен был избавиться от мальчишки. А теперь у нас проблемы." },
        { bg: BG.directorCorridor, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Он твой ученик. Ты и решай. Или я решу это по-другому." },
        { bg: BG.directorCorridor, char: C.director, name: "Директор", music: 'tense', text: "Ладно. Я все улажу. Но ты должен дать мне еще немного времени." },
        { bg: BG.directorCorridor, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Время, это роскошь, которой у тебя нет. Если до завтра он не замолчит, я буду вынужден принять меры. И тогда пострадает не только он." },
        { bg: BG.directorCorridor, char: C.kozhan, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Ворваться в кабинет прямо сейчас и потребовать объяснений.", next: 70 }, { text: "Тихо уйти и позвонить Николаю Андреевичу, чтобы он приехал с ордером.", next: 75 } ] },
        { bg: BG.office, char: C.kozhan, name: "", music: 'tense', text: "Я распахиваю дверь и влетаю в кабинет." },
        { bg: BG.office, char: C.dima, name: "Дима", music: 'tense', text: "Это вы заказали убийство Андрея!" },
        { bg: BG.office, char: C.dima, name: "", music: 'tense', text: "Директор бледнеет. Мужчина в кожанке медленно поднимается со стула." },
        { bg: BG.office, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Мальчик, ты выбрал не ту дверь. И не то время." },
        { bg: BG.office, char: C.kozhan, name: "", music: 'tense', text: "Он достает из кармана пистолет. Дерзкий застывает на месте.", next: 105 },
        { bg: BG.directorCorridor, char: C.kozhan, name: "", music: 'tense', text: "Я закрываю дверь и отхожу в сторону." },
        { bg: BG.directorCorridor, char: C.dima, name: "Дима", music: 'tense', text: "Дерзкий, звони Николаю Андреевичу. Немедленно." },
        { bg: BG.directorCorridor, char: C.dima, name: "", music: 'tense', text: "Дерзкий достает телефон и набирает номер. Я тем временем смотрю в щель. Мужчина в кожанке выходит из кабинета и идет в сторону лестницы." },
        { bg: BG.directorCorridor, char: C.dima, name: "Дима", music: 'tense', text: "Нам нужно задержать его до приезда полиции." },
        { bg: BG.stairs, char: C.dima, name: "", music: 'tense', text: "Я и Дерзкий перекрываем ему путь на лестнице. Мужчина в кожанке останавливается." },
        { bg: BG.stairs, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Вы что, ребята, самоубийцы?" },
        { bg: BG.stairs, char: C.dima, name: "Дима", music: 'tense', text: "Вы никуда не пойдете. Полиция уже едет." },
        { bg: BG.stairs, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Полиция? Ты думаешь, они успеют?" },
        { bg: BG.stairs, char: C.kozhan, name: "", music: 'tense', text: "Он делает шаг вперед. В этот момент на лестнице появляется Руслан. Он в рабочем комбинезоне и с молотком в руке." },
        { bg: BG.stairs, char: C.ruslan, name: "Руслан", music: 'tense', text: "Опусти пушку, приятель. Или я случайно проломлю тебе голову." },
        { bg: BG.stairs, char: C.ruslan, name: "", music: 'tense', text: "Мужчина в кожанке оглядывается и видит, что путь заблокирован." },
        { bg: BG.stairs, char: C.kozhan, name: "Мужчина в кожанке", music: 'tense', text: "Вы пожалеете об этом." },
        { bg: BG.stairs, char: C.kozhan, name: "", music: 'tense', text: "Он бросает пистолет на пол. Руслан подходит и забирает его. Через минуту в школу врываются полицейские во главе с Николаем Андреевичем." },
        { bg: BG.office, char: C.kozhan, name: "", music: 'tense', text: "Вечер. Директор сидит за столом, опустив голову. Николай Андреевич стоит рядом." },
        { bg: BG.office, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Вы арестованы. И вы, и ваш подельник. Мы нашли все доказательства в архиве." },
        { bg: BG.office, char: C.director, name: "Директор", music: 'tense', text: "Это была ошибка. Я не хотел." },
        { bg: BG.office, char: C.dima, name: "Дима", music: 'tense', text: "Вы убили человека. И вы хотели убить меня. Это не ошибка. Это преступление." },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "Я выхожу из кабинета. В коридоре меня ждет Руслан. Он улыбается." },
        { bg: BG.hall, char: C.ruslan, name: "Руслан", music: 'tense', text: "Ну что, герой. Теперь можно и отдохнуть." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Спасибо, Руслан. Вы нас спасли." },
        { bg: BG.hall, char: C.ruslan, name: "Руслан", music: 'tense', text: "Это моя работа. Я же строитель. Строю, ломаю... выбиваю пистолеты из рук плохих парней." },
        { bg: BG.hall, char: C.ruslan, name: "", music: 'tense', text: "Он смеется и уходит. Я смотрю ему вслед. Что-то в нем все еще кажется мне странным. Но сейчас не время об этом думать." },
        { bg: BG.city, char: C.ruslan, name: "", music: 'tense', text: "Ночь. Фонари. Я стою с телефоном в руке. Я набираю номер Ксюши. Она отвечает после первого гудка." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима? Ты в порядке?" },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "В порядке. Директора арестовали. Все кончено." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Слава богу. Я так за тебя переживала." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Я тоже за тебя переживал. Отдыхай. Завтра поговорим." },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Я вешаю трубку. В этот момент на телефон приходит сообщение. Я открываю его и чувствую, как холодок пробегает по спине." },
        { bg: BG.city, char: C.dima, name: "Неизвестный номер (сообщение)", music: 'tense', text: "«Ты думаешь, что победил? Директор, это лишь мелкая сошка. Игра еще не закончена. Кукольник всегда на шаг впереди. Продолжение следует...»" },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Я поднимаю глаза. Напротив школы, на другой стороне улицы, стоит человек в капюшоне. Он смотрит прямо на меня. Я делаю шаг вперед, но он разворачивается и исчезает в темноте переулка." },
      ],
      [
        { bg: BG.hall, char: C.dima, name: "", music: 'calm', text: "Я стою у окна, глядя на школьный двор. Вчерашний вечер кажется мне кошмарным сном. Арест директора, человек с пистолетом, загадочный Кукольник на другой стороне улицы. Я не спал всю ночь, прокручивая в голове каждую деталь. Ко мне подходит Дерзкий, он выглядит не лучше меня." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'calm', text: "Народ гудит. Говорят, директора увезли в наручниках. И завтра сюда приедет комиссия из управления образования. Школа на ушах." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'calm', text: "Это хорошо. Значит, правда вылезет наружу. Но у нас другая проблема. Кукольник все еще на свободе." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'calm', text: "И он написал тебе, что директор, лишь мелкая сошка. Слушай, а что если он имеет в виду кого-то из наших? Ну, из учителей, например." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'calm', text: "Или из учеников. Я всю ночь думал об этом. Саламандра сбежала, но она была лишь пешкой. Кто-то дергал за ниточки." },
        { bg: BG.hall, char: C.dima, name: "", music: 'calm', text: "В этот момент мой телефон вибрирует. Звонит Николай Андреевич." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'calm', text: "Алло?" },
        { bg: BG.hall, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Дима, доброе утро. Есть новости. Твоего друга Камрана сегодня выпускают. Директор дал показания и признался, что подбросил ему наркотики и шантажировал его. Камрана выпускают прямо сейчас." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'calm', text: "Отличные новости. Спасибо, Николай Андреевич." },
        { bg: BG.hall, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Но есть проблема. Мужчина в кожанке, которого мы задержали... он молчит. Он не говорит, на кого работает. И еще. Кто-то пытался взломать сейф с уликами в участке сегодня ночью. Мы усилили охрану, но я советую вам быть осторожнее. Кукольник может попытаться добраться до вас." },
        { bg: BG.hall, char: C.nikolay, name: "", music: 'calm', text: "Я вешаю трубку. Дерзкий смотрит на меня с надеждой." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'calm', text: "Камрана выпускают?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'calm', text: "Да. Но Кукольник не дремлет. Нам нужно встретить Камрана и узнать, что он видел в СИЗО. Может, он что-то слышал или видел." },
        { bg: BG.sizo, char: C.dima, name: "", music: 'calm', text: "Мы с Дерзким ждем Камрана у ворот. Он выходит, щурясь от яркого солнца. Увидев нас, он останавливается." },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Вы? Решили посмотреть на бомжа?" },
        { bg: BG.sizo, char: C.dima, name: "Дима", music: 'calm', text: "Мы пришли, чтобы забрать тебя. И поговорить." },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "О чем? О том, как я убил человека? Или о том, как меня подставили?" },
        { bg: BG.sizo, char: C.derz, name: "Дерзкий", music: 'calm', text: "О том, кто тебя подставил. Камран, это не Дима. Это директор и его люди. И теперь мы ищем настоящего зачинщика." },
        { bg: BG.sizo, char: C.derz, name: "", music: 'calm', text: "Камран тяжело вздыхает и подходит к нам." },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Ладно. Я устал. Говорите, что вам нужно." },
        { bg: BG.sizo, char: C.dima, name: "Дима", music: 'calm', text: "Ты видел кого-нибудь странного в СИЗО? Кто-то приходил к тебе?" },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Приходил следователь. Николаем зовут. Но он нормальный. А еще... приходил врач. Говорил, что проверяет мое здоровье. Но он не измерял давление и не слушал легкие. Он просто смотрел на меня и улыбался. А потом сказал странную вещь." },
        { bg: BG.sizo, char: C.dima, name: "Дима", music: 'calm', text: "Какую?" },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Он сказал: «Передай Диме, что игра только начинается. И что он должен быть осторожен со своими друзьями. Особенно с теми, кто строит и лечит»." },
        { bg: BG.sizo, char: C.kamranSizo, name: "", music: 'calm', choice: true, text: "Что делаем?", options: [ { text: "Сразу же спросить Камрана, как выглядел этот врач.", next: 25 }, { text: "Отвести Камрана к Николаю Андреевичу, чтобы он описал врача следователю.", next: 29 } ] },
        { bg: BG.sizo, char: C.dima, name: "Дима", music: 'calm', text: "Как он выглядел? Опиши его." },
        { bg: BG.sizo, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Высокий. Светлые волосы. В очках. Одет в белый халат. Но самое странное... у него были руки строителя. Мозолистые. Очень грубые руки." },
        { bg: BG.sizo, char: C.derz, name: "Дерзкий", music: 'calm', text: "Строителя? Дима, это же..." },
        { bg: BG.sizo, char: C.dima, name: "Дима", music: 'calm', text: "Руслан.", next: 35 },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Нам нужно ехать в участок. Пусть он опишет врача Николаю Андреевичу." },
        { bg: BG.police, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Я не хочу туда возвращаться." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Это ненадолго. Нам нужна помощь. Этот врач, не просто врач. Он опасен." },
        { bg: BG.police, char: C.dima, name: "", music: 'calm', text: "Камран соглашается. Мы едем в участок. Николай Андреевич выслушивает Камрана и составляет фоторобот." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Похоже, это тот же человек, что и мужчина в кожанке. Но он был в другом обличье. Опишите его еще раз." },
        { bg: BG.police, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Высокий, светлые волосы, очки. И мозолистые руки. Как у строителя." },
        { bg: BG.city, char: C.kamranSizo, name: "", music: 'calm', text: "Мы выходим из участка." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Строитель с мозолистыми руками. У нас в школе такой только один." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Руслан. Он работает строителем. И он был в спортзале в тот день, когда меня заперли. И он дал мне аптечку. И он... он помог спасти Ксюшу. Но почему-то он всегда оказывается рядом." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Может, он и есть Кукольник?" },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Или он просто хороший человек, который оказался не в том месте. Нам нужно проверить." },
        { bg: BG.sto, char: C.dima, name: "", music: 'calm', text: "Старое СТО на окраине города. Запах машинного масла и бензина. Мы с Дерзким приезжаем в гараж. Здесь работает загадочный мужчина из СТО, о котором все говорят. Мы находим его, он копается в двигателе старой машины. Он вытирает руки ветошью и смотрит на нас." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Чего надо, пацаны? Ремонт или просто мимо шли?" },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Мы ищем информацию. Один человек сказал, что вы можете помочь." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Кто сказал?" },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Николай Андреевич." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Ах, он. Ну, тогда слушаю." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Мы ищем человека по имени Руслан. Он работает в школе. Строитель. И он же врач. Вы знаете его?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Руслан? А зачем вам его искать?" },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'calm', text: "Он может быть замешан в убийстве и похищении." },
        { bg: BG.sto, char: C.derz, name: "", music: 'calm', text: "Мужчина из СТО вытирает руки и садится на покрышку." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Я знаю Руслана. Хороший мужик. Однажды помог мне с проводкой в гараже. Но я не знал, что он врач. И я не знал, что он работает в школе." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "А откуда вы его знаете?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Он приезжал сюда год назад. Искал какую-то машину. Говорил, что хочет купить старую иномарку. Но потом передумал. Сказал, что нашел то, что искал." },
        { bg: BG.sto, char: C.sto, name: "", music: 'calm', choice: true, text: "Что спросить?", options: [ { text: "Спросить, какую именно машину искал Руслан.", next: 54 }, { text: "Попросить показать записи с камер наблюдения за тот день.", next: 59 } ] },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Какую машину он искал?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Синюю «Ниву». Старую, разбитую. Он сказал, что она принадлежала его брату. И он хочет ее восстановить. Но у меня ее не было. Я продал ее другому человеку." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Кому?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Какому-то мужику в кожанке." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'calm', text: "Тот самый, что был с пистолетом!", next: 63 },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Покажите записи с камер. Это важно." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "У меня камеры только в гараже. Но я помню тот день. Руслан приезжал, искал синюю «Ниву». Говорил, что она принадлежала его брату. А потом приехал мужик в кожанке и выкупил ее. Руслан был в ярости." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Почему он был в ярости?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'calm', text: "Я не знаю. Но он кричал, что эта машина, единственное, что у него осталось от брата. А мужик в кожанке просто ухмыльнулся и уехал." },
        { bg: BG.city, char: C.sto, name: "", music: 'calm', text: "Мы выходим из гаража. Камран сидит на бордюре, держится за живот." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Камран, ты чего?" },
        { bg: BG.city, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Не знаю. Живот прихватило. И голова кружится." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Может, тебя отравили в СИЗО?" },
        { bg: BG.city, char: C.kamranSizo, name: "Камран", music: 'calm', text: "Может быть. Этот врач... он дал мне какую-то таблетку от головы. Я выпил." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Нам нужно в больницу. Срочно." },
        { bg: BG.city, char: C.dima, name: "", music: 'calm', text: "Камран теряет сознание и падает на асфальт. Мы с Дерзким подхватываем его." },
        { bg: BG.hospital, char: C.dima, name: "", music: 'calm', text: "Камрана увозят в реанимацию. Мы с Дерзким стоим в коридоре. Я звоню Николаю Андреевичу." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Николай Андреевич, Камран в больнице. Его отравили. Тот врач дал ему таблетку." },
        { bg: BG.hospital, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Я выезжаю. И, Дима... я пробил Руслана по базе. У него нет судимостей. Но есть одна странность. Он числится в списке студентов медицинского университета, но отчислен после третьего курса. И еще. У него был брат. Андрей Андреев." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Андрей Андреев? Тот самый, который погиб в школе?" },
        { bg: BG.hospital, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Да. Руслан, его старший брат." },
        { bg: BG.hospital, char: C.nikolay, name: "", music: 'calm', text: "Я вешаю трубку. В коридоре больницы появляется Руслан. Он в белом халате, на лице медицинская маска." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "Руслан", music: 'calm', text: "Я слышал, что кому-то плохо. Я врач. Могу помочь." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "", music: 'calm', text: "Я смотрю на него. В голове проносятся все моменты, когда он оказывался рядом. Спортзал, подвал, лестница. И сейчас." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Руслан. Вы брат Андрея." },
        { bg: BG.hospital, char: C.dima, name: "", music: 'calm', text: "Руслан останавливается. Медленно снимает маску. На его лице играет легкая улыбка." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "Руслан", music: 'calm', text: "Я знал, что ты догадаешься. Но ты слишком поздно это понял." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "", music: 'calm', text: "Он делает шаг назад и достает из кармана шприц." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "Руслан", music: 'calm', text: "Это не яд. Это снотворное. Вам обоим нужно отдохнуть. Пока я закончу игру." },
        { bg: BG.hospital, char: C.derz, name: "Дерзкий", music: 'calm', text: "Стой! Не подходи!" },
        { bg: BG.hospital, char: C.derz, name: "", music: 'calm', text: "Руслан бросается к нам. В этот момент двери больницы распахиваются, и вбегает Вачик с пистолетом в руках." },
        { bg: BG.hospital, char: C.vachik, name: "Вачик", music: 'calm', text: "Стоять! Полиция!" },
        { bg: BG.hospital, char: C.vachik, name: "", music: 'calm', text: "Руслан останавливается. Он смотрит на Вачика, на меня, на Дерзкого. Потом бросает шприц на пол и поднимает руки." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "Руслан", music: 'calm', text: "Вы ничего не докажете. У меня есть алиби. И я не делал ничего противозаконного." },
        { bg: BG.hospital, char: C.ruslanDoc, name: "", music: 'calm', text: "К нему подбегают полицейские и надевают наручники. Руслана уводят. Вачик подходит к нам." },
        { bg: BG.hospital, char: C.vachik, name: "Вачик", music: 'calm', text: "Вы как?" },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Живы. Спасибо." },
        { bg: BG.hospital, char: C.vachik, name: "Вачик", music: 'calm', text: "Он опасен. И он умен. Нам нужно собрать все улики." },
        { bg: BG.hospital, char: C.vachik, name: "", music: 'calm', text: "Больничный коридор. Ночь. Мы сидим на скамейке. Камран приходит в себя. Врачи говорят, что его жизнь вне опасности. Николай Андреевич уехал допрашивать Руслана. Мы с Дерзким сидим на скамейке." },
        { bg: BG.hospital, char: C.derz, name: "Дерзкий", music: 'calm', text: "Вот и все. Кукольник пойман. Это был Руслан." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Не все так просто. Он сказал, что закончит игру. Значит, у него есть план. И этот план еще не закончен." },
        { bg: BG.hospital, char: C.dima, name: "", music: 'calm', text: "В этот момент мой телефон вибрирует. Пришло сообщение с незнакомого номера." },
        { bg: BG.hospital, char: C.dima, name: "Неизвестный номер (сообщение)", music: 'calm', text: "«Ты думаешь, что арестовал меня? Но я не Руслан. Я, тот, кто дал ему информацию. Я, тот, кто дергал за ниточки. И я все еще здесь. Продолжение следует...»" },
        { bg: BG.hospital, char: C.dima, name: "", music: 'calm', text: "Я показываю сообщение Дерзкому. Он бледнеет." },
        { bg: BG.hospital, char: C.derz, name: "Дерзкий", music: 'calm', text: "Это не Руслан?" },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'calm', text: "Нет. Это кто-то другой. И этот кто-то наблюдает за нами прямо сейчас." },
        { bg: BG.hospital, char: C.dima, name: "", music: 'calm', text: "Я поднимаю глаза. В окне на противоположной стороне улицы мелькает тень." },
      ],
      [
        { bg: BG.interrogation, char: C.ruslanArrested, name: "", music: 'tense', text: "Допросная в отделении полиции. Тусклый свет. Стол. Напротив друг друга сидят Руслан (в наручниках) и Николай Андреевич. Дима стоит у стены, скрестив руки." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "", music: 'tense', text: "Я смотрю на Руслана. Еще вчера он казался мне обычным работягой, который случайно оказался в центре событий. Сейчас же передо мной сидел человек с холодным, расчетливым взглядом, который разрушил жизни нескольких людей ради своей мести." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Руслан, мы знаем, что вы устроили весь этот шантаж. Мы знаем, что вы отравили Камрана и подставили Саламандру. Но кто вам помогал? У вас был сообщник." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "Руслан", music: 'tense', text: "У меня не было сообщников. Я все спланировал сам. Я хотел, чтобы Наталья Олеговна и директор ответили за смерть моего брата." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Тогда откуда у вас ключи от сейфа директора? Откуда вы знали про эксперимент? Вы же не работали в школе пятнадцать лет назад." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "Руслан", music: 'tense', text: "Я нашел старые документы. Это было несложно." },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'tense', text: "Ты врешь. Тот, кто писал мне сообщения, говорил, что ты всего лишь пешка. Что настоящий Кукольник, это кто-то другой. Кто он?" },
        { bg: BG.interrogation, char: C.dima, name: "", music: 'tense', text: "Руслан усмехается и откидывается на спинку стула." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "Руслан", music: 'tense', text: "Ты думаешь, я тебе все расскажу? Дима, ты даже не представляешь, во что ты ввязался. Я был лишь инструментом. А тот, кто дергал за ниточки, находится гораздо ближе, чем ты думаешь." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Надавить на Руслана, пригрозив ему пожизненным сроком за соучастие в убийстве.", next: 10 }, { text: "Выйти из допросной и отправиться на поиски улик в школу.", next: 14 } ] },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'tense', text: "Ты понимаешь, что если ты не сдашь своего босса, то сядешь за все преступления один? Похищение, отравление, шантаж. Ты проведешь остаток жизни за решеткой." },
        { bg: BG.interrogation, char: C.ruslanArrested, name: "Руслан", music: 'tense', text: "Мне уже все равно. Моей жизни кончена с того дня, как Андрей умер. А ты... ты просто мальчишка, который играет в героя." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима, оставь нас. Я сам с ним поговорю." },
        { bg: BG.interrogation, char: C.nikolay, name: "", music: 'tense', text: "Я выхожу из допросной. Разговор с Русланом ничего не дал. Он явно чего-то боится. Или кого-то.", next: 16 },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'tense', text: "Он нам ничего не скажет. Он слишком запуган. Нам нужно искать настоящего Кукольника самим." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Согласен. Я оставлю его здесь. А вы пока проверьте школу. Возможно, там остались следы." },
        { bg: BG.assembly, char: C.nikolay, name: "", music: 'tense', text: "Мы с Дерзким возвращаемся в школу. Здесь тихо и темно. Только аварийные огни горят над дверями. Мы проходим к сцене, где проходило собрание «Праведных сестер». Я помню, как эта женщина смотрела на меня. И помню, как Саламандра стояла рядом с ней." },
        { bg: BG.assembly, char: C.derz, name: "Дерзкий", music: 'tense', text: "И где мы будем искать? Здесь все вычистили после ареста директора." },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "Не все. Саламандра сказала, что у секты здесь было что-то вроде штаба. За кулисами." },
        { bg: BG.assembly, char: C.dima, name: "", music: 'tense', text: "Мы проходим за кулисы. Там пыльно и темно. Дерзкий находит на стене старый шкаф. Он открывает его, и мы видим кучу бумаг, тетрадей и небольшую коробку." },
        { bg: BG.assembly, char: C.derz, name: "Дерзкий", music: 'tense', text: "Смотри. Это похоже на архивы секты." },
        { bg: BG.assembly, char: C.derz, name: "", music: 'tense', text: "Я открываю коробку. Внутри, несколько диктофонов, записные книжки и странный конверт с печатью. Я открываю конверт и достаю оттуда фотографию." },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "Дерзкий, посмотри на это." },
        { bg: BG.assembly, char: C.dima, name: "", music: 'tense', text: "На фотографии запечатлена женщина из секты. Она стоит рядом с каким-то мужчиной. Я присматриваюсь и узнаю его. Это же тот самый мужчина из СТО, который продал машину Руслана человеку в кожанке." },
        { bg: BG.assembly, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ничего себе. Значит, эта женщина была с ним заодно?" },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "Или она тоже была пешкой. Смотри, на обороте написано: «Ты следующая. Если не будешь молчать, они уничтожат тебя»." },
        { bg: BG.assembly, char: C.derz, name: "Дерзкий", music: 'tense', text: "Значит, ей тоже угрожали? Кто-то управлял и ею?" },
        { bg: BG.assembly, char: C.dima, name: "Дима", music: 'tense', text: "Похоже на то. Нам нужно найти эту женщину. Или хотя бы узнать, кто такой этот мужчина со СТО." },
        { bg: BG.hospital, char: C.kamranHosp, name: "", music: 'tense', text: "Больница. Палата Камрана. Утро. Камран сидит на кровати, рядом стоит поднос с едой. Мы приезжаем, чтобы проведать его. Он выглядит лучше, хотя все еще бледный. Мила сидит рядом с ним на стуле." },
        { bg: BG.hospital, char: C.mila, name: "Мила", music: 'tense', text: "Вы пришли. Спасибо." },
        { bg: BG.hospital, char: C.kamranHosp, name: "Камран", music: 'tense', text: "Я слышал, вы поймали Руслана. Это он меня отравил?" },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'tense', text: "Да. Но у него был сообщник. Или начальник. Мы ищем его." },
        { bg: BG.hospital, char: C.kamranHosp, name: "Камран", music: 'tense', text: "Я вспомнил кое-что. Когда этот врач давал мне таблетку, он кому-то звонил. Он говорил очень тихо, но я слышал." },
        { bg: BG.hospital, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что он говорил?" },
        { bg: BG.hospital, char: C.kamranHosp, name: "Камран", music: 'tense', text: "Он сказал: «Босс, я все сделал. Он больше не будет проблемой». А потом он назвал имя. Но я не уверен, что расслышал правильно." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'tense', text: "Какое имя?" },
        { bg: BG.hospital, char: C.kamranHosp, name: "Камран", music: 'tense', text: "Он сказал «Архитектор». Или что-то похожее." },
        { bg: BG.hospital, char: C.kamranHosp, name: "", music: 'tense', choice: true, text: "Что делаем дальше?", options: [ { text: "Пойти к Миле и спросить, не знает ли она что-нибудь о секте и ее лидере.", next: 38 }, { text: "Отправиться в СТО и попытаться найти мужчину с фотографии.", next: 42 } ] },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'tense', text: "Мила, ты была в секте. Ты знаешь, кто эта женщина? И кто мог быть ее «боссом»?" },
        { bg: BG.hospital, char: C.mila, name: "Мила", music: 'tense', text: "Я видела ее несколько раз. Она всегда говорила загадками. Но однажды я подслушала ее разговор с кем-то по телефону. Она называла его «Кукольник». И она боялась его больше, чем кого-либо." },
        { bg: BG.hospital, char: C.dima, name: "Дима", music: 'tense', text: "Кукольник? Значит, он был ее боссом. Но кто он?" },
        { bg: BG.hospital, char: C.mila, name: "Мила", music: 'tense', text: "Я не знаю. Но она сказала, что он всегда на шаг впереди. И что он знает все секреты всех, кто находится в школе.", next: 49 },
        { bg: BG.sto, char: C.mila, name: "", music: 'tense', text: "Мы приезжаем на СТО. Мужчина из СТО удивлен нашему визиту." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Мы нашли вашу фотографию. С женщиной из секты. Кто она?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'tense', text: "Вы что, следите за мной? Я же сказал, что не знаю никаких сектантов." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "Не врите. Мы знаем, что вы связаны с ними." },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'tense', text: "Ладно, слушайте. Эта женщина, моя сестра. Она связалась с плохой компанией. Я пытался ее вытащить, но она не слушала. А потом она исчезла." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Куда исчезла?" },
        { bg: BG.sto, char: C.sto, name: "Мужчина из СТО", music: 'tense', text: "Я не знаю. Но она сказала, что если с ней что-то случится, я должен передать конверт одному человеку. И я передал." },
        { bg: BG.archive, char: C.sto, name: "", music: 'tense', text: "Мы возвращаемся в школу. Мужчина из СТО сказал, что передал конверт какому-то человеку из школы. Мы решаем проверить архив еще раз." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Кому он мог передать конверт?" },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Возможно, тому, кто работает в школе. Но кто?" },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Я открываю дверь архива. Внутри темно. Я включаю фонарик и вижу, что на полу лежит какой-то предмет. Я подхожу ближе и поднимаю его. Это старый диктофон." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Смотри. Это тот же диктофон, который я нашел в спортзале." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Я нажимаю на кнопку воспроизведения. Голос на записи очень искажен. Но я слышу слова." },
        { bg: BG.archive, char: C.dima, name: "Голос на диктофоне", music: 'tense', text: "«Если ты это слушаешь, значит, меня уже нет. Кукольник, это не один человек. Это организация. И они уже внутри школы. Они везде»." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Запись обрывается. Я смотрю на Дерзкого." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что за организация?" },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Я не знаю. Но нам нужно быть осторожнее. Кто-то может быть среди наших." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "В этот момент я замечаю, что дверь в архив начала медленно закрываться. Я оборачиваюсь. В дверном проеме стоит тень. Она делает шаг вперед, и я узнаю этого человека." },
      ],
      [
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', text: "Школьный архив. Ночь. Тусклый свет фонарика выхватывает из темноты стеллажи с пыльными папками. В дверном проеме стоит темный силуэт." },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', text: "Я инстинктивно делаю шаг назад, загораживая Дерзкого. Рука сама тянется к тяжелому степлеру на столе. Тень делает шаг вперед, и луч моего фонарика падает на ее лицо. Это Саламандра. Она выглядит ужасно: волосы растрепаны, куртка порвана, под глазом расплывается свежий синяк. Она тяжело дышит, будто бежала всю дорогу." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Юля? Какого черта ты здесь делаешь?" },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Тихо! Не ори. Если они узнают, что я здесь, они убьют меня." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Они? Кто они? Твои дружки из «Праведных сестер»?" },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Это не моих дружков! Это они заставили меня. Они угрожали моей семье. Я думала, что помогаю восстанавливать справедливость, а на самом деле я была просто пешкой в их игре." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты похитила Ксюшу! Ты подставила Камрана! И теперь хочешь, чтобы мы тебе поверили?" },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Я знаю, что виновата. Но я не хотела, чтобы кто-то умер. И я знаю, кто стоит за всем этим. Тот, кого они называют Архитектором." },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Сразу же схватить Саламандру и сдать ее Николаю Андреевичу.", next: 9 }, { text: "Выслушать ее, но потребовать весомые доказательства.", next: 14 } ] },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', text: "Я хватаю Саламандру за запястье и выкручиваю руку." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Ты арестована. Мы сдадим тебя полиции прямо сейчас." },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Отпусти меня, идиот! Если ты меня сдашь, Архитектор заметет следы! Я единственная, кто может вывести вас на него!" },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дим, может, она права. Если мы сдадим ее, мы останемся с носом." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Ладно. Говори быстро. У тебя пять минут.", next: 18 },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "У тебя есть пять минут. Если соврешь, мы сдадим тебя сами." },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Спасибо. Слушайте. Эта женщина на сцене... ее зовут Алиса. Она не просто фанатичка. Она собирает компромат на всех. На учеников, на учителей, на родителей. А потом продает эту информацию." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Кому?" },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Тому, кто платит больше. Но всем управляет Архитектор. Он никогда не показывает своего лица. Он общается только через записки и зашифрованные сообщения. Он тот, кто нанял Руслана. И он тот, кто приказал мне подставить Камрана." },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', text: "Саламандра достает из-за стеллажа старый рюкзак. Внутри лежит ноутбук и несколько флешек." },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Вот. Здесь все. Переписки, платежки, планы. Я украла это из кабинета Алисы, пока она не видела. Но я не успела это изучить. Мне нужно было скрыться." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "И почему мы должны тебе верить? Может, это очередная ловушка?" },
        { bg: BG.archive, char: C.salaSorry, name: "Саламандра", music: 'tense', text: "Потому что Архитектор знает про письмо твоей бабушки. И он знает, что оно у него. Он сказал Алисе, что игра переходит в финальную стадию. И что ты, главный приз." },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', choice: true, text: "Что делаем с ноутбуком?", options: [ { text: "Открыть ноутбук и посмотреть файлы прямо здесь.", next: 23 }, { text: "Взять ноутбук с собой и уйти из школы, пока нас не засекли.", next: 27 } ] },
        { bg: BG.archive, char: C.salaSorry, name: "", music: 'tense', text: "Я открываю ноутбук. Он включается, и на экране появляется рабочий стол. Я захожу в папку с документами. Там сотни фотографий и текстовых файлов. Я открываю один из них. Это досье на директора. Компромат, фотографии, суммы взяток. Все подтверждается." },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Ничего себе. Здесь досье на всех." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дим, смотри. Здесь есть папка с твоим именем." },
        { bg: BG.archive, char: C.derz, name: "", music: 'tense', text: "Я открываю папку. Внутри, фотографии моего дома, Натальи Олеговны, мои старые школьные снимки. И записка: «Он не знает правду. Но скоро узнает».", next: 35 },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "Нет времени. Нам нужно уходить. Если Алиса или ее люди узнают, что мы здесь, нам конец." },
        { bg: BG.archive, char: C.dima, name: "", music: 'tense', text: "Мы забираем ноутбук и выбираемся из школы через запасной выход. На улице темно и тихо. Мы садимся в старую машину Дерзкого." },
        { bg: BG.archive, char: C.derz, name: "Дерзкий", music: 'tense', text: "Куда едем?" },
        { bg: BG.archive, char: C.dima, name: "Дима", music: 'tense', text: "В безопасное место. В котельную." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Заброшенная котельная. Ночь. Мы сидим вокруг старого стола. Ноутбук светится в темноте." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Мы открываем ноутбук. Я захожу в папку с файлами. Здесь досье на всех, кого мы знаем. На директора, на Софью Андреевну, на Камрана, на Милу. И на меня." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Черт. Они следили за тобой с самого начала." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Смотри. Здесь есть файл с названием «Архитектор»." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Я открываю его. Внутри, пустой лист. И одна фотография. На ней запечатлен школьный двор пятнадцать лет назад. И среди толпы учеников я вижу молодого мужчину. Он стоит рядом с Андреем. И я узнаю его." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Этого не может быть." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Кто это?" },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Это... это же наш новый завхоз. Тот, которого наняли на место Руслана." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что? Ты уверен?" },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Я видел его вчера в школьном коридоре. Он сказал, что его зовут Михаил. И он очень интересовался, как идет ремонт в спортзале." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Пойти в школу прямо сейчас и попытаться задержать Михаила.", next: 42 }, { text: "Позвонить Николаю Андреевичу и передать ему всю информацию, чтобы он арестовал Михаила.", next: 45 } ] },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Идем в школу. Если мы возьмем его сейчас, он не успеет скрыться." },
        { bg: BG.boiler, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты с ума сошел? Он может быть вооружен. Мы не знаем, что он из себя представляет." },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "У нас нет времени ждать. Он может уничтожить все улики.", next: 50 },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Позвоню Николаю Андреевичу. Это дело для профессионалов." },
        { bg: BG.boiler, char: C.dima, name: "", music: 'tense', text: "Я набираю номер. Николай Андреевич отвечает после второго гудка." },
        { bg: BG.boiler, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима? Что случилось?" },
        { bg: BG.boiler, char: C.dima, name: "Дима", music: 'tense', text: "Николай Андреевич, мы нашли Архитектора. Это новый завхоз. Михаил. Он сейчас в школе." },
        { bg: BG.boiler, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Я выезжаю. Никуда не лезьте. Я пришлю наряд." },
        { bg: BG.hall, char: C.nikolay, name: "", music: 'tense', text: "Мы с Дерзким и Саламандрой осторожно идем по коридору. Мы подходим к кабинету завхоза. Дверь приоткрыта. Внутри горит свет. Я заглядываю внутрь. Михаил стоит у стола и сжигает какие-то бумаги в металлическом ведре. Он не замечает нас." },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Вот он." },
        { bg: BG.hall, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что делаем?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Ждем Николая Андреевича." },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "В этот момент Саламандра делает шаг вперед. Она спотыкается о ведро, и оно с грохотом падает." },
        { bg: BG.hall, char: C.dima, name: "", music: 'tense', text: "Михаил резко оборачивается. Увидев нас, он злобно ухмыляется." },
        { bg: BG.hall, char: C.mikhailSkin, name: "Михаил", music: 'tense', text: "Надо же. Мальчики и их подружка. Вы решили поиграть в детективов? Это похвально. Но глупо." },
        { bg: BG.hall, char: C.mikhailSkin, name: "", music: 'tense', text: "Он достает из-за стола пистолет с глушителем. И направляет его на нас." },
        { bg: BG.hall, char: C.mikhailSkin, name: "Михаил", music: 'tense', text: "Вы знаете, почему меня зовут Архитектор? Потому что я строю и разрушаю. И сейчас я разрушу вас." },
        { bg: BG.hall, char: C.mikhailSkin, name: "", music: 'tense', text: "В этот момент двери распахиваются. В коридор вбегает Николай Андреевич с группой захвата." },
        { bg: BG.hall, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Брось оружие!" },
        { bg: BG.hall, char: C.nikolay, name: "", music: 'tense', text: "Михаил отвлекается на секунду. Я бросаюсь вперед и сбиваю его с ног. Пистолет отлетает в сторону. Полицейские набрасываются на Михаила и надевают на него наручники." },
        { bg: BG.hall, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Все кончено, Михаил. Ты арестован." },
        { bg: BG.hall, char: C.mikhailSkin, name: "Михаил", music: 'tense', text: "Вы ничего не понимаете. Вы думаете, я один? Вы думаете, это конец? Это только начало!" },
        { bg: BG.hall, char: C.mikhailSkin, name: "", music: 'tense', text: "Его уводят. Николай Андреевич подходит к нам." },
        { bg: BG.hall, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "С вами все в порядке?" },
        { bg: BG.hall, char: C.dima, name: "Дима", music: 'tense', text: "Да. Спасибо." },
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "Улица перед школой. Ночь. Скорая, полицейские машины. Мы стоим в стороне. Саламандра сидит на бордюре. Ее увозят в другую машину. Она смотрит на нас, и в ее глазах читается раскаяние." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ну что, вот и все? Кукольник пойман?" },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Осталось узнать, что в письме Натальи Олеговны. И почему Михаил хотел его уничтожить." },
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "В этот момент ко мне подходит Николай Андреевич." },
        { bg: BG.yard, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима. Я нашел кое-что в кабинете Михаила. Это было в сейфе. Он пытался сжечь, но не успел." },
        { bg: BG.yard, char: C.nikolay, name: "", music: 'tense', text: "Он протягивает мне обугленный конверт. Я открываю его. Внутри, клочок бумаги и старинная фотография. На фотографии запечатлен молодой мужчина. Он держит на руках маленького мальчика. На обороте надпись: «Андрей и его отец»." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Это же... это же Михаил?" },
        { bg: BG.yard, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Похоже на то. Михаил был отцом Андрея. И он мстил за смерть сына. Все это время." },
        { bg: BG.yard, char: C.nikolay, name: "", music: 'tense', text: "Я смотрю на фотографию. Теперь все встает на свои места. Я понимаю, почему он хотел уничтожить всех нас. Но есть что-то еще. Я переворачиваю фотографию и вижу надпись, написанную другой рукой, более свежими чернилами: «Ты опоздал. Кукольник, это я. И я все еще здесь. Продолжение следует...»" },
        { bg: BG.yard, char: C.nikolay, name: "", music: 'tense', text: "Я поднимаю глаза на Николая Андреевича. Он смотрит на меня с тревогой." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Это не Михаил. Кукольник, кто-то другой." },
      ],
      [
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "Школьный двор. Ночь. Мигалки полицейских машин освещают фасад школы. Возле забора стоит Дима, сжимая в руках обгоревший клочок фотографии. Рядом стоит Николай Андреевич, он хмурится и смотрит на здание школы." },
        { bg: BG.yard, char: C.dima, name: "", music: 'tense', text: "Я смотрю на обугленную надпись: «Ты опоздал. Кукольник, это я». Руки трясутся. Если Михаил был Архитектором, но не Кукольником, то кто тогда все это время управлял им? Кто отдавал приказы Руслану? Кто украл письмо из дома Натальи Олеговны, пока мы были в подвале?" },
        { bg: BG.yard, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима, ты должен отдать мне эту улику. Это дело полиции. Мы сами разберемся, кто настоящий Кукольник." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'tense', text: "Вы не понимаете. Он играет с нами. Он знает каждый наш шаг. Если я отдам вам фото, он просто исчезнет. Он ждет, чтобы я сам его нашел." },
        { bg: BG.yard, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Это слишком опасно. Михаил задержан, но его люди все еще на свободе." },
        { bg: BG.yard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Николай Андреевич, мы справимся. Мы уже не в первый раз." },
        { bg: BG.yard, char: C.derz, name: "", music: 'tense', text: "Николай Андреевич тяжело вздыхает и качает головой, но отступает." },
        { bg: BG.yard, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "У вас есть сутки. Если за это время вы ничего не найдете, я забираю дело себе. И, Дима... будь осторожен. Тот, кто написал это на фото, был в кабинете Михаила до нас." },
        { bg: BG.yard, char: C.nikolay, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Пойти к Вачику и проверить записи с камер видеонаблюдения в школе.", next: 9 }, { text: "Поехать к Наталье Олеговне и попытаться восстановить сожженное письмо.", next: 20 } ] },
        { bg: BG.guard, char: C.nikolay, name: "", music: 'tense', text: "Пост охраны. Ночь. На мониторах мелькают записи с камер. Мы с Дерзким стоим за спиной Вачика. Он быстро переключает камеры." },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Смотрите. Вот запись с камеры у кабинета завхоза. Время, 23:45. Михаил сидит и сжигает бумаги. А вот 23:50." },
        { bg: BG.guard, char: C.vachik, name: "", music: 'tense', text: "На экране появляется размытая фигура в капюшоне. Она проходит мимо кабинета, останавливается, а затем исчезает из поля зрения камеры." },
        { bg: BG.guard, char: C.dima, name: "Дима", music: 'tense', text: "Кто это? Можно увеличить?" },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Пытаюсь. Но качество плохое. Похоже на ученика. Форма, рюкзак." },
        { bg: BG.guard, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ученик? В такое время?" },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Это не единственный странный момент. Смотрите, что происходит через минуту." },
        { bg: BG.guard, char: C.vachik, name: "", music: 'tense', text: "На экране фигура в капюшоне возвращается. Она подходит к двери кабинета, открывает ее и заходит внутрь. Через минуту выходит и быстро уходит." },
        { bg: BG.guard, char: C.dima, name: "Дима", music: 'tense', text: "Он был внутри вместе с Михаилом. Он и написал ту записку на фото!" },
        { bg: BG.guard, char: C.vachik, name: "Вачик", music: 'tense', text: "Похоже на то. Но лица не видно. Я могу попробовать прогнать через нейросеть для распознавания, но это займет время." },
        { bg: BG.guard, char: C.derz, name: "Дерзкий", music: 'tense', text: "У нас нет времени.", next: 28 },
        { bg: BG.home, char: C.derz, name: "", music: 'tense', text: "Мы приехали к Наталье Олеговне. Она разложила обгоревшие куски конверта на столе." },
        { bg: BG.home, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Я пыталась собрать это, но не хватает многих фрагментов. Однако я нашла вот это." },
        { bg: BG.home, char: C.babushka, name: "", music: 'tense', text: "Она протягивает мне маленький клочок бумаги. На нем едва различимы слова, написанные выцветшими чернилами: «...он не тот, кем кажется. Ищи в театре...»." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "В театре? В школьном театре?" },
        { bg: BG.home, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Я не знаю. Но почерк мне кажется знакомым. Я видела его раньше." },
        { bg: BG.home, char: C.derz, name: "Дерзкий", music: 'tense', text: "У кого?" },
        { bg: BG.home, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "У директора. Но директор же арестован." },
        { bg: BG.home, char: C.dima, name: "Дима", music: 'tense', text: "Значит, у него был сообщник. Или кто-то, кто использовал его почерк." },
        { bg: BG.theatre, char: C.dima, name: "", music: 'tense', text: "Мы проходим в театр. Здесь пахнет пылью и старыми декорациями. Внезапно свет на сцене включается. Мы видим, что посередине сцены стоит стул. На нем сидит Ксюша. Ее руки связаны, во рту кляп." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Ксюша!" },
        { bg: BG.theatre, char: C.dima, name: "", music: 'tense', text: "Я бросаюсь к ней, но в этот момент динамики включаются, и по всему залу разносится искаженный голос." },
        { bg: BG.theatre, char: C.mystery, name: "Голос из динамиков", music: 'tense', text: "Не так быстро, Дима. Ты пришел один, как я и просил. Но я вижу, ты привел друга." },
        { bg: BG.theatre, char: C.derz, name: "Дерзкий", music: 'tense', text: "Покажись! Хватит прятаться!" },
        { bg: BG.theatre, char: C.mystery, name: "Голос из динамиков", music: 'tense', text: "Я не прячусь. Я всегда был рядом. Я, тот, кто направлял тебя. Я, тот, кто дал тебе тетрадь. Я, тот, кто запер тебя в спортзале, чтобы ты нашел правду." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Кто ты?" },
        { bg: BG.theatre, char: C.mystery, name: "Голос из динамиков", music: 'tense', text: "Я, тот, кого ты меньше всего ожидаешь увидеть." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "В этот момент из-за кулис выходит фигура в черном плаще и маске. Фигура медленно снимает маску." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Сразу же наброситься на него.", next: 38 }, { text: "Попытаться завязать разговор и узнать его мотивы.", next: 40 } ] },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "Я бросаюсь вперед, пытаясь схватить его. Но он ловко уворачивается и достает электрошокер. Я получаю разряд в плечо и падаю на пол." },
        { bg: BG.theatre, char: C.mystery, name: "Голос", music: 'tense', text: "Глупо. Я же сказал, что всегда на шаг впереди.", next: 44 },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Зачем тебе все это? Зачем ты убивал людей?" },
        { bg: BG.theatre, char: C.mystery, name: "Голос", music: 'tense', text: "Я не убивал. Я лишь направлял. Михаил, Руслан, Саламандра, все они были пешками. Я давал им то, что они хотели. Месть, власть, деньги. А они делали грязную работу." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "А письмо? Зачем ты украл письмо Натальи Олеговны?" },
        { bg: BG.theatre, char: C.mystery, name: "Голос", music: 'tense', text: "Потому что в нем была правда. Правда о том, кто на самом деле убил Андрея." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "Свет на сцене. Перед нами стоит новый персонаж, Мужчина в строгом костюме, с холодным взглядом." },
        { bg: BG.theatre, char: C.mystery, name: "Мужчина", music: 'tense', text: "Меня зовут Загадочный Мужчина. Но ты можешь звать меня по имени. Я, тот, кто создал «Праведных сестер». Я, тот, кто управлял директором и Михаилом." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Ты? Но зачем?" },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Потому что эта школа, гнездо лжи. Директор, учителя, твоя бабушка, все они покрывали друг друга. Я хотел разрушить это изнутри. И у меня почти получилось." },
        { bg: BG.theatre, char: C.derz, name: "Дерзкий", music: 'tense', text: "А при чем тут Ксюша? Отпусти ее!" },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Она, мой козырь. Пока она здесь, ты будешь слушать меня." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "Он подходит к Ксюше и проводит рукой по ее волосам. Она вздрагивает." },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Твоя бабушка, Наталья Олеговна, знала о травле Андрея. Но она не просто знала. Она была инициатором. Она заплатила директору, чтобы он замял дело." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Ты врешь!" },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "У меня есть доказательства. Письмо, которое я украл. Оно у меня. И я готов обменять его на твою жизнь." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "В этот момент двери театра распахиваются. В зал вбегает Николай Андреевич с пистолетом. За ним, Вачик." },
        { bg: BG.theatre, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Загадочный Мужчина, вы арестованы! Отпустите заложницу!" },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Ах, инспектор. Вы пришли. Но вы опоздали. Я уже нажал на кнопку. В здании школы заложена бомба. У вас есть ровно десять минут, чтобы найти ее." },
        { bg: BG.theatre, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Вы блефуете!" },
        { bg: BG.theatre, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Проверьте." },
        { bg: BG.theatre, char: C.mystery, name: "", music: 'tense', text: "В этот момент Загадочный Мужчина бросает дымовую шашку. Театр наполняется густым дымом. Мы теряем его из виду. Я слышу, как Ксюша кричит." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'tense', text: "Ксюша!" },
        { bg: BG.theatre, char: C.dima, name: "", music: 'tense', text: "Я бросаюсь в дым. Я нахожу стул, но Ксюши на нем нет. Загадочный Мужчина забрал ее с собой." },
      ],
      [
        { bg: BG.theatre, char: C.dima, name: "", music: 'climax', text: "Школьный театр. Ночь. Густой дым заполнил сцену и зал. Слышны кашель, крики и топот ног. Свет мигает." },
        { bg: BG.theatre, char: C.dima, name: "", music: 'climax', text: "Я пробираюсь сквозь дым, закрывая лицо рукавом. Стул, на котором сидела Ксюша, пуст. Веревки валяются на полу. Загадочный Мужчина исчез, забрав ее с собой." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'climax', text: "Ксюша! Ксюша, где ты?!" },
        { bg: BG.theatre, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Дима, назад! Здесь может быть бомба! Вачик, проверь сцену и кулисы!" },
        { bg: BG.theatre, char: C.vachik, name: "Вачик", music: 'climax', text: "Есть!" },
        { bg: BG.theatre, char: C.derz, name: "Дерзкий", music: 'climax', text: "Он ушел через служебный выход! Я видел, как мелькнул его плащ!" },
        { bg: BG.theatre, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Оставайтесь здесь. Мы сами его найдем." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'climax', text: "Нет. Он забрал Ксюшу. Я не могу стоять в стороне." },
        { bg: BG.theatre, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Дима, это приказ! Это слишком опасно!" },
        { bg: BG.theatre, char: C.nikolay, name: "", music: 'climax', choice: true, text: "Что делаем?", options: [ { text: "Подчиниться приказу и остаться с Дерзким искать бомбу в школе.", next: 10 }, { text: "Проигнорировать приказ и броситься вслед за Загадочным Мужчиной на крышу.", next: 16 } ] },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'climax', text: "Ладно. Дерзкий, пошли. Проверим подвал и котельную. Если бомба есть, она должна быть там." },
        { bg: BG.theatre, char: C.dima, name: "", music: 'climax', text: "Мы с Дерзким выбегаем из театра. В коридорах пусто. Мы спускаемся в подвал. Там темно и пахнет сыростью. Внезапно я слышу тиканье." },
        { bg: BG.theatre, char: C.derz, name: "Дерзкий", music: 'climax', text: "Дим, смотри. Под лестницей." },
        { bg: BG.theatre, char: C.derz, name: "", music: 'climax', text: "Я подхожу ближе. Там стоит черный чемодан, обмотанный проводами. На нем мигает красный индикатор. До конца отсчета осталось три минуты." },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'climax', text: "Это настоящая бомба. Нам нужно звонить." },
        { bg: BG.theatre, char: C.dima, name: "", music: 'climax', text: "По рации раздается голос Вачика: «Он на крыше!» Мы бросаемся наверх.", next: 20 },
        { bg: BG.theatre, char: C.dima, name: "Дима", music: 'climax', text: "К черту приказы. Дерзкий, за мной!" },
        { bg: BG.theatre, char: C.dima, name: "", music: 'climax', text: "Я выбегаю через служебный выход. Лестница ведет наверх, на крышу. Дерзкий бежит за мной, на ходу достав монтировку." },
        { bg: BG.theatre, char: C.derz, name: "Дерзкий", music: 'climax', text: "Если он выкинет что-то похуже дымовой шашки, я его сам приложу!" },
        { bg: BG.theatre, char: C.derz, name: "", music: 'climax', text: "Мы выбегаем на крышу. Ветер бьет в лицо. Загадочный Мужчина стоит у края, удерживая Ксюшу за руку. Она плачет и пытается вырваться. У него в руках детонатор." },
        { bg: BG.roof, char: C.derz, name: "", music: 'climax', text: "Крыша школы. Ночь. Ветер. Загадочный Мужчина держит Ксюшу у края." },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Отпусти ее! Ты уже проиграл!" },
        { bg: BG.roof, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Проиграл? Дима, ты так ничего и не понял. Я не проиграл. Я просто дошел до финальной стадии своего плана. Бомба в подвале, это отвлекающий маневр. Настоящая бомба здесь." },
        { bg: BG.roof, char: C.mystery, name: "", music: 'climax', text: "Он поднимает руку, и я вижу маленькую коробочку, прикрепленную к его груди." },
        { bg: BG.roof, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Я уйду отсюда, забрав с собой твою подругу и всех, кто находится в этом здании." },
        { bg: BG.roof, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Дима, не слушай его! Он сумасшедший!" },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Ты же сам говорил, что хотел разрушить систему. Ксюша тут ни при чем." },
        { bg: BG.roof, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Она, твоя слабость. А слабость нужно уничтожать. Разве не этому учит эта школа?" },
        { bg: BG.roof, char: C.derz, name: "Дерзкий", music: 'climax', text: "Ты больной ублюдок." },
        { bg: BG.roof, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Называй как хочешь. Но через пять минут от этой крыши ничего не останется." },
        { bg: BG.roof, char: C.mystery, name: "", music: 'climax', choice: true, text: "Что делаем?", options: [ { text: "Попытаться отвлечь его разговором, пока Дерзкий обходит сзади.", next: 31 }, { text: "Броситься на него, рискуя упасть с крыши вместе с ним.", next: 35 } ] },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Хорошо. Ты победил. Отпусти Ксюшу, и я сделаю все, что ты скажешь." },
        { bg: BG.roof, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Ты сдаешься?" },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Да. Ты же этого хотел. Только отпусти ее." },
        { bg: BG.roof, char: C.dima, name: "", music: 'climax', text: "Пока он отвлекается на меня, Дерзкий тихо обходит его со спины. Он поднимает монтировку.", next: 36 },
        { bg: BG.roof, char: C.dima, name: "", music: 'climax', text: "Я бросаюсь вперед, целясь ему в ноги. Он не ожидает такого. Ксюша вырывается и отбегает в сторону. Я сбиваю его с ног, мы падаем на бетон. Детонатор отлетает в сторону." },
        { bg: BG.roof, char: C.dima, name: "", music: 'climax', text: "Дерзкий бьет его по руке монтировкой. Загадочный Мужчина вскрикивает и выпускает Ксюшу. Она бежит ко мне. Я поднимаюсь и хватаю детонатор." },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Всем стоять! Дерзкий, забери у него устройство!" },
        { bg: BG.roof, char: C.dima, name: "", music: 'climax', text: "Дерзкий выхватывает детонатор. В этот момент на крышу вбегают Николай Андреевич и Вачик." },
        { bg: BG.roof, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Всем оставаться на местах! Загадочный Мужчина, вы арестованы." },
        { bg: BG.roof, char: C.nikolay, name: "", music: 'climax', text: "Его уводят. Ксюша плачет у меня на плече." },
        { bg: BG.roof, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Спасибо, Дима. Я думала, что мы умрем." },
        { bg: BG.roof, char: C.dima, name: "Дима", music: 'climax', text: "Все позади. Теперь все точно позади." },
        { bg: BG.yard, char: C.dima, name: "", music: 'climax', text: "Школьный двор. Утро. Яркое солнце. Ученики стоят в стороне. Полицейские машины." },
        { bg: BG.yard, char: C.dima, name: "", music: 'climax', text: "Прошел час. Саперы нашли бомбу в подвале и обезвредили ее. Она была муляжом, но с настоящим взрывпакетом. Директора увозят, Михаила увозят, Загадочного Мужчину увозят. Арестованы все." },
        { bg: BG.yard, char: C.dima, name: "", music: 'climax', text: "Ко мне подходит Наталья Олеговна. Она выглядит уставшей, но спокойной." },
        { bg: BG.yard, char: C.babushka, name: "Наталья Олеговна", music: 'climax', text: "Дима. Я сдала все документы Николаю Андреевичу. Я призналась во всем." },
        { bg: BG.yard, char: C.dima, name: "Дима", music: 'climax', text: "Я знаю. Ты сделала правильный выбор." },
        { bg: BG.yard, char: C.babushka, name: "Наталья Олеговна", music: 'climax', text: "Меня, возможно, посадят. Но я устала жить в страхе. И я хочу, чтобы ты знал... я горжусь тобой." },
        { bg: BG.yard, char: C.babushka, name: "", music: 'climax', text: "Она обнимает меня. Впервые за долгое время это искренние объятия." },
        { bg: BG.city, char: C.babushka, name: "", music: 'climax', text: "Улица возле школы. День. Мы с Дерзким и Камраном сидим на лавочке." },
        { bg: BG.city, char: C.kamran, name: "Камран", music: 'climax', text: "Знаете, я думал, что после СИЗО моя жизнь кончена. А теперь... теперь я свободен. И даже не знаю, что с этим делать." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'climax', text: "Для начала, перестань вести себя как мажор. И, возможно, мы даже подружимся." },
        { bg: BG.city, char: C.derz, name: "", music: 'climax', text: "Камран усмехается." },
        { bg: BG.city, char: C.kamran, name: "Камран", music: 'climax', text: "Посмотрим. Но спасибо вам. Я ваш должник." },
        { bg: BG.city, char: C.kamran, name: "", music: 'climax', text: "В этот момент к нам подходит Мила. Она смущенно улыбается." },
        { bg: BG.city, char: C.mila, name: "Мила", music: 'climax', text: "Камран... я хотела сказать тебе спасибо. За то, что заступился. Я... я была дурой, когда связалась с этой дрянью." },
        { bg: BG.city, char: C.kamran, name: "Камран", music: 'climax', text: "Забудь. Главное, что ты остановилась." },
        { bg: BG.city, char: C.kamran, name: "", music: 'climax', text: "Мила краснеет. Кажется, между ними пробегает искра." },
        { bg: BG.restaurant, char: C.dima, name: "", music: 'climax', text: "Ресторан. Вечер. Столик у окна. Дима и Ксюша сидят напротив друг друга." },
        { bg: BG.restaurant, char: C.dima, name: "", music: 'climax', text: "Прошло две недели. Школа вернулась к обычной жизни. Директора уволили, на его место пришел новый. Беда ушла на пенсию, но иногда заходит в школу. Руслан и Михаил ждут суда. Загадочный Мужчина тоже." },
        { bg: BG.restaurant, char: C.dima, name: "", music: 'climax', text: "Я пригласил Ксюшу в ресторан. Мы давно не были на свидании." },
        { bg: BG.restaurant, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Знаешь, я до сих пор не могу поверить, что все это было с нами." },
        { bg: BG.restaurant, char: C.dima, name: "Дима", music: 'climax', text: "Я тоже. Но теперь все кончено." },
        { bg: BG.restaurant, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Надеюсь. Я так устала бояться." },
        { bg: BG.restaurant, char: C.ksusha, name: "", music: 'climax', text: "Мы сидим и разговариваем. Смеемся. Впервые за долгое время я чувствую себя нормально." },
        { bg: BG.city, char: C.ksusha, name: "", music: 'climax', text: "Улица возле ресторана. Ночь. Фонари. Дима провожает Ксюшу. Мы выходим из ресторана. Ксюша держит меня за руку. Внезапно мой телефон вибрирует. Пришло сообщение с неизвестного номера." },
        { bg: BG.city, char: C.ksusha, name: "Неизвестный номер (сообщение)", music: 'climax', text: "«Ты думал, что победил? Ты думал, что Загадочный Мужчина был главным? Он был лишь одним из многих. Добро пожаловать в настоящую игру. Игра только начинается. Продолжение следует...»" },
        { bg: BG.city, char: C.ksusha, name: "", music: 'climax', text: "Я замираю. Ксюша смотрит на меня." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Дима? Что там?" },
        { bg: BG.city, char: C.carMan, name: "", music: 'climax', text: "Я поднимаю глаза. На противоположной стороне улицы стоит черный автомобиль. Заднее стекло медленно опускается. Я вижу лишь силуэт человека в темных очках. Он смотрит на меня. Затем стекло поднимается, и машина уезжает в ночь." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'climax', text: "Ничего. Просто... реклама." },
        { bg: BG.city, char: C.dima, name: "", music: 'climax', text: "Я вру. Но я не хочу, чтобы она снова боялась. Я сжимаю ее руку крепче. Где-то там, в темноте, за нами наблюдают. И это значит, что история еще не закончена." },
      ],
    ];

    // ===== СТОРИ: СЕЗОН 2 =====
    const S2_EPISODES = [
      [
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Улица возле ресторана. Ночь. Фонари. Черный автомобиль медленно скрывается за поворотом. Дима и Ксюша стоят на тротуаре." },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Я смотрю вслед уехавшей машине. Холодный пот стекает по спине. Ксюша все еще держит меня за руку, ее пальцы теплые, а мои ледяные. Она смотрит на меня с тревогой, пытаясь заглянуть в глаза." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима, ты побледнел. Что в этом сообщении? Кто это был в машине?" },
        { bg: BG.city, char: C.ksusha, name: "", music: 'tense', text: "Я быстро убираю телефон в карман и натягиваю фальшивую улыбку. Врать ей сейчас это единственный способ сохранить ее спокойствие. Я не могу втягивать ее в это снова." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Да ничего. Просто спам. Реклама какого-то магазина. А в машине показалось. Наверное, просто похожий силуэт." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Ты уверен? Ты выглядишь так, будто увидел призрака." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Устал просто. Давай я тебя провожу до дома. Уже поздно." },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Мы идем по ночной улице. Ксюша что-то рассказывает про учебу, про планы на выпускной, но я не слышу ее. В голове крутится одна мысль: «Игра только начинается». Загадочный Мужчина арестован. Михаил арестован. Руслан арестован. Кто тогда написал это сообщение? Кто сидел в машине? И почему этот голос показался мне знакомым?" },
        { bg: BG.entrance, char: C.dima, name: "", music: 'tense', text: "Мы подходим к ее подъезду. Ксюша открывает дверь и оборачивается." },
        { bg: BG.entrance, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Спасибо за вечер. Даже если ты весь вечер витал в облаках." },
        { bg: BG.entrance, char: C.dima, name: "Дима", music: 'tense', text: "Прости. Мне правда нужно выспаться. Завтра будет тяжелый день." },
        { bg: BG.entrance, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Береги себя, Дима. И если что-то случилось... ты знаешь, где меня найти." },
        { bg: BG.entrance, char: C.ksusha, name: "", music: 'tense', text: "Она уходит. Дверь подъезда захлопывается. Я остаюсь один на улице. Достаю телефон. Сообщение все еще висит на экране. Я набираю номер Николая Андреевича." },
        { bg: BG.police, char: C.ksusha, name: "", music: 'tense', text: "Я влетаю в кабинет без стука. Николай Андреевич сидит за столом, перед ним гора бумаг и остывший кофе. Он поднимает на меня уставшие глаза." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима? Что ты здесь делаешь в такое время? Школа закрыта, все подозреваемые в изоляторе." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Загадочный Мужчина. Вы его допросили? Он сказал, на кого работает?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Он молчит. Говорит, что это была его личная инициатива. Что он устал от системы и решил все разрушить. Но я ему не верю. Он слишком спокоен для фанатика." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Он врет. Кто-то другой управлял им. Кто-то, кто был на свободе, пока мы ловили Руслана и Михаила. Посмотрите." },
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Я достаю телефон и показываю ему сообщение. Николай Андреевич внимательно читает его, и его лицо мрачнеет." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "«Игра только начинается». Это плохо. Очень плохо. Если Загадочный Мужчина был пешкой, то тот, кто за ним стоит, сейчас заметает следы. И он знает, что мы в тупике." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "У нас есть кто-то, кто может знать больше. Мужчина из СТО. Помните, он говорил про синюю «Ниву», про брата Андрея? И на фото из кабинета Михаила был он. Мне кажется, он знает больше, чем говорит." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Мужчина из СТО... Я проверял его. Обычный автомеханик. Ничего подозрительного. Но если ты считаешь, что он замешан, съезди к нему. Только возьми с собой Дерзкого. И вот, возьми прослушку." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', text: "Он протягивает мне маленькую черную кнопку." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Если что-то пойдет не так, нажми на нее. Мы приедем." },
        { bg: BG.sto, char: C.nikolay, name: "", music: 'tense', text: "Мы с Дерзким подъезжаем к СТО. Дерзкий нервно крутит в руках гаечный ключ." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты уверен, что он не выкинет нас отсюда? В прошлый раз он был не очень-то рад нашему визиту." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "У нас есть прослушка. Если он рыпнется, Николай Андреевич приедет с группой захвата." },
        { bg: BG.sto, char: C.dima, name: "", music: 'tense', text: "Мы заходим в гараж. Мужчина из СТО вытирает руки ветошью. Увидев нас, он хмурится." },
        { bg: BG.sto, char: C.sto, name: "Андрей", music: 'tense', text: "Опять вы? Я же сказал, что больше нечего вам рассказать. Я не знаю никакого Руслана и не знаю, кто такой Кукольник." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Мы знаем про Архитектора. И про то, что он был отцом Андрея. Но мы также знаем, что он был не один. Кто помогал ему?" },
        { bg: BG.sto, char: C.sto, name: "Андрей", music: 'tense', text: "Понятия не имею. Я вам все рассказал в прошлый раз. Убирайтесь." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "А как же фото, где вы стоите с Алисой? И фото, где вы стоите с Андреем?" },
        { bg: BG.sto, char: C.derz, name: "", music: 'tense', text: "Мужчина из СТО замирает. Его лицо меняется. На секунду в его глазах мелькает страх, а затем злость. Он делает шаг к нам." },
        { bg: BG.sto, char: C.sto, name: "Андрей", music: 'tense', text: "Слушайте сюда, пацаны. Если вы не уйдете сейчас, я вызову полицию. И поверьте, у меня есть связи. Я знаю людей, которые могут сделать так, что вы исчезнете." },
        { bg: BG.sto, char: C.sto, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Надавить на него и сказать, что мы знаем про Андрея.", next: 35 }, { text: "Уйти, сделав вид, что поверили, и проследить за ним.", next: 40 } ] },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Мы знаем, что Андрей жив. И мы знаем, что он прячется. Скажи нам, где он." },
        { bg: BG.sto, char: C.dima, name: "", music: 'tense', text: "Мужчина из СТО бледнеет. Он отступает на шаг назад." },
        { bg: BG.sto, char: C.sto, name: "Андрей", music: 'tense', text: "Вы не знаете, о чем говорите. Андрей умер. Я был на его похоронах." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Могила пустая. Мы проверили." },
        { bg: BG.sto, char: C.sto, name: "Андрей", music: 'tense', text: "Это невозможно...", next: 45 },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Ладно. Мы уйдем. Простите, что побеспокоили." },
        { bg: BG.sto, char: C.dima, name: "", music: 'tense', text: "Мы выходим из гаража. Дерзкий смотрит на меня с недоумением." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты чего? Мы же только что его прижали!" },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Он слишком напуган. Если мы надавим, он просто закроется. Нам нужно узнать, куда он поедет. Может, он выведет нас на Андрея." },
        { bg: BG.sto, char: C.dima, name: "", music: 'tense', text: "Мы садимся в машину и ждем. Через полчаса Мужчина из СТО выходит из гаража, закрывает его на замок и садится в старую «Ниву». Он едет куда-то за город. Мы следуем за ним." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Машина Мужчины из СТО останавливается у старого кладбища. Мы паркуемся в стороне и идем за ним. Он идет по темным дорожкам, освещая путь фонариком. Мы держимся на расстоянии." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Он останавливается у старого, заросшего мхом памятника. Мы подходим ближе. На памятнике высечено имя: «Андрей Андреев. 1985-2003. Спи спокойно»." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Мужчина из СТО достает из кармана ключ и откручивает одну из декоративных панелей памятника. Внутри пустота." },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Черт... Это же..." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Могила пустая." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Мужчина из СТО оборачивается. Увидев нас, он вздрагивает." },
        { bg: BG.cemetery, char: C.sto, name: "Андрей", music: 'tense', text: "Вы... Вы следили за мной?" },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Где Андрей?" },
        { bg: BG.cemetery, char: C.sto, name: "Андрей", music: 'tense', text: "Его здесь нет. Он никогда не был здесь. Он жив." },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Где он?" },
        { bg: BG.cemetery, char: C.sto, name: "Андрей", music: 'tense', text: "Я не могу вам сказать. Это опасно. Если он узнает, что я привел вас..." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Кто он? Загадочный Мужчина? Или кто-то другой?" },
        { bg: BG.cemetery, char: C.sto, name: "Андрей", music: 'tense', text: "Загадочный Мужчина это его правая рука. А тот, кого вы ищете... Это он. Он все это время был рядом. Он создал «Праведных сестер». Он нанял Руслана. Он управлял всем." },
        { bg: BG.disco, char: C.sto, name: "", music: 'tense', text: "Я не могу уснуть. После всего, что я узнал, мне нужно забыться. Я приезжаю в клуб. Музыка бьет по ушам, разноцветные лазеры режут полумрак. Я иду к бару и заказываю воду." },
        { bg: BG.disco, char: C.sto, name: "", music: 'tense', text: "В толпе я вижу Ксюшу. Она танцует с каким-то парнем. Я подхожу к ней." },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Ксюша, нам нужно поговорить. Это срочно." },
        { bg: BG.disco, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима? Что случилось? Ты выглядишь ужасно." },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Я знаю, кто такой Кукольник. Это Андрей. Он жив." },
        { bg: BG.disco, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Что? Как?" },
        { bg: BG.disco, char: C.ksusha, name: "", music: 'tense', text: "Она отходит от парня и ведет меня к стене. Музыка здесь грохочет не так сильно." },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Я был на его могиле. Она пустая. Он инсценировал свою смерть. И он все это время управлял сектой." },
        { bg: BG.disco, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Это безумие. Кто он?" },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Я не знаю. Но он хочет отомстить Наталье Олеговне. И он использует нас." },
        { bg: BG.disco, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима, нам нужно идти в полицию. Прямо сейчас." },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Мы не можем. У нас нет доказательств. Только слова Мужчины из СТО." },
        { bg: BG.disco, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Тогда что мы будем делать?" },
        { bg: BG.disco, char: C.dima, name: "Дима", music: 'tense', text: "Я не знаю. Но я не хочу, чтобы ты пострадала. Пожалуйста, будь осторожна." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Мы с Ксюшей в квартире, которую снимает Дерзкий. Он уехал к Николаю Андреевичу, чтобы узнать новости о Наталье Олеговне. Мы остались вдвоем." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Ксюша сидит на краю кровати, обхватив себя руками. Я стою у окна, глядя на огни города." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима, я боюсь. Я боюсь того, что будет дальше. Если Андрей жив... если он мстит... кто следующий?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Я не знаю. Но я знаю одно: я не позволю, чтобы ты пострадала. Ни ты, ни Дерзкий, ни Камран." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "А как ты мне помешаешь? Ты же не всесильный. Ты такой же школьник, как и я." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Я подхожу к ней и сажусь рядом. Беру ее за руку." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Я не всесильный. Но я не один. У меня есть ты. И это делает меня сильнее." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Ксюша поднимает на меня глаза. В них слезы. Она кладет голову мне на плечо. Я обнимаю ее. Мы сидим так несколько минут, слушая тишину." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима... я не хочу думать о плохом. Я хочу забыть обо всем этом хотя бы на одну ночь." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Она поднимает голову и смотрит на меня. Я вижу в ее глазах не страх, а что-то другое. Что-то, что заставляет мое сердце биться быстрее." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Ты уверена?" },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Да. Я хочу быть с тобой. Здесь и сейчас." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Она целует меня. Я отвечаю на поцелуй. Мы медленно опускаемся на кровать. Ночник отбрасывает мягкие тени на стены. Одежда падает на пол. Мы остаемся вдвоем, забывая обо всем: о шантаже, о секте, о предательстве. Есть только мы, наши чувства и эта ночь, которая может стать последней." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Спальня. Утро. Солнце пробивается сквозь шторы. Дима и Ксюша лежат в кровати. Я просыпаюсь первым. Ксюша спит, уткнувшись мне в плечо. Ее волосы разметались по подушке. Я осторожно убираю прядь с ее лица. Она улыбается во сне. В этот момент мой телефон вибрирует. Сообщение от Дерзкого." },
        { bg: BG.bedroom, char: C.ksusha, name: "Дерзкий (сообщение)", music: 'tense', text: "«Дима, срочно в отделение. Наталья Олеговна дала показания. Она призналась во всем. И еще... Андрей здесь. Он пришел сам. Прямо в участок»." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Я резко сажусь в кровати. Ксюша просыпается." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Что случилось?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Андрей пришел в полицию. Сдаваться. Или... что-то другое." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Я вскакиваю с кровати и начинаю одеваться." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Я с тобой." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Нет. Останься здесь. Это слишком опасно." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Я не буду сидеть в стороне. Я иду с тобой." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Согласиться и взять Ксюшу с собой.", next: 95 }, { text: "Настоять на том, чтобы она осталась в квартире.", next: 97 } ] },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Хорошо. Но ты должна слушаться меня. И если я скажу бежать, ты бежишь." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Договорились.", next: 101 },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Нет, Ксюша. Я не могу рисковать тобой. Останься здесь. Я приеду, как только все закончится." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима..." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Пожалуйста. Ради меня." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Она нехотя кивает. Я выбегаю из квартиры." },
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Я приезжаю в участок. Возле входа меня встречает Николай Андреевич." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима. Хорошо, что ты пришел. Твоя бабушка дала признательные показания. Она рассказала все про эксперимент, про травлю Андрея, про взятки директору." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "А Андрей? Он здесь?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Здесь. В допросной. Он пришел сам. Говорит, что хочет рассказать свою версию событий." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', text: "Мы заходим в участок. В коридоре я вижу Дерзкого. Он бледный." },
        { bg: BG.police, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дима, это пиздец. Я слышал, как Андрей говорил с Николаем Андреевичем. Он хочет, чтобы Наталью Олеговну посадили. Но он также хочет, чтобы ее судили за убийство, которого она не совершала. Он утверждает, что она заказала его убийство." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Но он же жив!" },
        { bg: BG.police, char: C.derz, name: "Дерзкий", music: 'tense', text: "Он говорит, что она пыталась его убить. Что она заплатила врачам, чтобы они сделали ему смертельную инъекцию. Но они не смогли. И он выжил." },
        { bg: BG.interrogation, char: C.derz, name: "", music: 'tense', text: "Я распахиваю дверь допросной. Андрей сидит в инвалидном кресле. Он смотрит на меня с холодной улыбкой." },
        { bg: BG.interrogation, char: C.sto, name: "Андрей", music: 'tense', text: "А, Дима. Пришел защищать бабушку?" },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'tense', text: "Ты врешь. Она не заказывала твое убийство. Ты сам сломался." },
        { bg: BG.interrogation, char: C.sto, name: "Андрей", music: 'tense', text: "Ты не знаешь всей правды. Ты знаешь только то, что она тебе рассказала. А правда в том, что она хотела моей смерти. И она заплатила за это." },
        { bg: BG.interrogation, char: C.sto, name: "", music: 'tense', text: "В этот момент в допросную вбегает Дерзкий." },
        { bg: BG.interrogation, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дима! Там Ксюша! Она в машине Загадочного Мужчины! Он ее увез!" },
        { bg: BG.interrogation, char: C.derz, name: "", music: 'tense', text: "Я выбегаю на улицу. Черная машина Загадочного Мужчины уже сворачивает за угол. Я бросаюсь к своей машине." },
      ],
      [
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Отделение полиции. Утро. Коридор перед допросной. Дима, Дерзкий, Николай Андреевич." },
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Я выбегаю из допросной, едва не сбивая с ног Вачика. В коридоре пахнет кофе и хлоркой. Дерзкий бежит следом за мной, на ходу натягивая свою черную бейсболку." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Он увез ее! Я видел черную машину, она свернула за угол!" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Стой! Дима, остановись! Ты не знаешь, куда он поехал!" },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', text: "Я разворачиваюсь к Николаю Андреевичу. Меня трясет от злости и бессилия." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Он работает на Андрея. Куда он мог ее повезти, если не туда, где прячется сам Андрей?!" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Мы не знаем всех его убежищ. Если ты бросишься туда один, он может убить вас обоих." },
        { bg: BG.police, char: C.derz, name: "Дерзкий", music: 'tense', text: "Николай Андреевич, у нас нет времени! Ксюша в опасности!" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Вачик, немедленно свяжись с патрульными машинами. Пусть перекроют выезды из города. Дерзкий, ты остаешься здесь. Дима, ты идешь со мной в допросную. Если Андрей знает, куда его человек повез Ксюшу, мы выбьем из него эту информацию." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Подчиниться Николаю Андреевичу и пойти допрашивать Андрея.", next: 10 }, { text: "Сбежать из участка и попытаться найти их самому.", next: 18 } ] },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', text: "Я стискиваю зубы, но понимаю, что Николай Андреевич прав. Без информации мы просто будем колесить по городу." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Хорошо. Но если он не заговорит, я сам его заставлю." },
        { bg: BG.police, char: C.dima, name: "", music: 'tense', text: "Мы заходим в допросную. Андрей сидит в инвалидном кресле. Он спокоен, будто ждал нас." },
        { bg: BG.interrogation, char: C.sto, name: "Андрей", music: 'tense', text: "Я слышал шум. Что-то случилось, Дима? Потерял свою подружку?" },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'tense', text: "Твой человек забрал Ксюшу. Где они?" },
        { bg: BG.interrogation, char: C.sto, name: "Андрей", music: 'tense', text: "Мой человек? Ты имеешь в виду того, кто все эти годы был моими руками и ногами? Он не забрал ее. Он спас ее от меня." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Прекратите игры. Где они находятся?" },
        { bg: BG.interrogation, char: C.sto, name: "Андрей", music: 'tense', text: "Я не знаю. Он не докладывает мне о каждом шаге. Но я знаю, что он не сделает ей больно. Он слишком мягкосердечный для этого.", next: 24 },
        { bg: BG.police, char: C.sto, name: "", music: 'tense', text: "Я отталкиваю Николая Андреевича и бегу к выходу из участка." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима! Стой, черт возьми!" },
        { bg: BG.police, char: C.nikolay, name: "", music: 'tense', text: "Я выбегаю на улицу. Дерзкий догоняет меня." },
        { bg: BG.police, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты рехнулся? Они нас арестуют за побег!" },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'tense', text: "Плевать. Я не могу сидеть сложа руки, пока Ксюша в руках сумасшедшего." },
        { bg: BG.police, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ладно. Тогда я с тобой. У меня есть идея, где они могут быть." },
        { bg: BG.city, char: C.derz, name: "", music: 'tense', text: "Улица перед отделением полиции. Утро. Дима и Дерзкий садятся в машину." },
        { bg: BG.city, char: C.derz, name: "", music: 'tense', text: "Мы прыгаем в машину. Дерзкий достает телефон." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'tense', text: "Мужчина из СТО. Помнишь, мы нашли его номер в старых бумагах Михаила? Может, Загадочный Мужчина использует его гараж как перевалочный пункт?" },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Звони ему. Если он не ответит, мы едем туда." },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Дерзкий набирает номер. Идут длинные гудки. Никто не берет." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'tense', text: "Глухо. Едем на СТО." },
        { bg: BG.sto, char: C.derz, name: "", music: 'tense', text: "Старое СТО. Утро. Ворота открыты, но внутри никого нет." },
        { bg: BG.sto, char: C.derz, name: "", music: 'tense', text: "Мы подъезжаем к СТО. Ворота гаража распахнуты. Внутри пусто. Машины нет." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Он уехал. Но куда?" },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "Смотри. На столе записка." },
        { bg: BG.sto, char: C.derz, name: "", music: 'tense', text: "Я подбегаю к столу. На пыльной поверхности лежит клочок бумаги. На нем написано корявым почерком: «Заброшенный завод на северной окраине. Приезжайте один. Иначе она умрет»." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "Это он. Загадочный Мужчина. Он оставил нам адрес." },
        { bg: BG.sto, char: C.derz, name: "Дерзкий", music: 'tense', text: "Или Андрей. Это может быть ловушка." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'tense', text: "У нас нет выбора. Едем." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Шоссе за городом. Утро. Машина Димы мчится на скорости." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Мы летим по трассе. Я не смотрю на спидометр. В голове одна мысль: успеть." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Николай Андреевич, наверное, уже поднял всех на уши." },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Пусть поднимает. Главное, чтобы он не успел раньше нас. Если полиция ворвется туда с оружием, Загадочный Мужчина может запаниковать." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Или Андрей. Слушай, а что если Загадочный Мужчина не на стороне Андрея? Что если он действительно пытается ее спасти?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Тогда почему он не отдал ее нам? Почему не остановился?" },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Может, у него был план." },
        { bg: BG.highway, char: C.derz, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Продолжать ехать на максимальной скорости, не останавливаясь.", next: 46 }, { text: "Сбавить скорость и позвонить Николаю Андреевичу, чтобы скоординировать действия.", next: 50 } ] },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Мы не можем терять ни секунды." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Я вдавливаю педаль газа в пол. Машина ревет. Дерзкий хватается за ручку двери." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты нас угробишь!" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Зато успеем.", next: 57 },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Подожди. Если мы ворвемся туда без прикрытия, нас могут убить. Нужно позвонить Николаю Андреевичу." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Я набираю номер. Николай Андреевич отвечает мгновенно." },
        { bg: BG.highway, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима, где ты?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Мы едем на заброшенный завод на северной окраине. Загадочный Мужчина оставил записку. Он хочет, чтобы мы приехали одни." },
        { bg: BG.highway, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Это ловушка. Не входите туда. Мы будем через пятнадцать минут." },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "У нас нет пятнадцати минут." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Я вешаю трубку." },
        { bg: BG.factory, char: C.dima, name: "", music: 'tense', text: "Заброшенный завод на северной окраине. Утро. Огромное здание с разбитыми окнами, ржавые ворота." },
        { bg: BG.factory, char: C.dima, name: "", music: 'tense', text: "Мы подъезжаем к заводу. Ворота приоткрыты. Внутри темно и тихо. Мы выходим из машины." },
        { bg: BG.factory, char: C.derz, name: "Дерзкий", music: 'tense', text: "И где нам их искать?" },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'tense', text: "Смотри. На асфальте свежие следы шин." },
        { bg: BG.factory, char: C.dima, name: "", music: 'tense', text: "Мы идем по следам. Они ведут к главному входу. Внутри пахнет мазутом и гнилью. Мы проходим через пустые цеха. В одном из них мы слышим голоса." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'tense', text: "Тихо." },
        { bg: BG.factory, char: C.dima, name: "", music: 'tense', text: "Мы подкрадываемся к приоткрытой двери. Внутри горит лампа. Я вижу Ксюшу. Она сидит на стуле. Рядом с ней стоит Загадочный Мужчина." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Ты не должна бояться. Я не причиню тебе вреда." },
        { bg: BG.factory, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Зачем ты меня забрал? Дима подумает, что ты меня убил." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Я забрал тебя, чтобы он приехал сюда. И он уже здесь." },
        { bg: BG.factory, char: C.derz, name: "Дерзкий", music: 'tense', text: "Нас раскрыли." },
        { bg: BG.factory, char: C.derz, name: "", music: 'tense', text: "Мы входим в комнату. Загадочный Мужчина оборачивается." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'tense', text: "Отпусти ее." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Я и не держу ее. Она свободна." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'tense', text: "Ксюша встает со стула и бежит ко мне." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Я забрал ее, чтобы она не пострадала. Андрей собирался использовать ее в своем плане мести. Я не мог этого допустить." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'tense', text: "Где Андрей?" },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Он в соседнем здании. Он не знает, что я здесь. И он не знает, что Ксюша здесь." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'tense', text: "Заброшенный завод. Коридор перед выходом. Утро. Слышны звуки сирен." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'tense', text: "В этот момент снаружи раздаются звуки полицейских сирен. Николай Андреевич с группой захвата врываются на территорию." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Полиция. Быстрее. Нам нужно уходить." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'tense', text: "Подожди. Ты сказал, что Андрей не знает, что мы здесь. Что это значит?" },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Это значит, что он придет сюда. И он будет не один." },
      ],
      [
        { bg: BG.factory, char: C.dima, name: "", music: 'climax', text: "Заброшенный завод на северной окраине. Коридор перед выходом. Утро. Снаружи воют полицейские сирены, слышны крики и топот ног." },
        { bg: BG.factory, char: C.dima, name: "", music: 'climax', text: "Синий свет мигалок пробивается сквозь грязные окна, разрисовывая стены странными тенями. Мы с Дерзким стоим возле Ксюши, а Загадочный Мужчина напряженно смотрит в сторону главных ворот. Он явно нервничает, и это первый раз, когда я вижу его таким." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "Что значит «он будет не один»? Кого он приведет?" },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Людей, которые все эти годы были в тени. Тех, кто помогал Михаилу и Алисе собирать компромат. Они не полиция и не сектанты. Это головорезы, которых наняли для грязной работы." },
        { bg: BG.factory, char: C.derz, name: "Дерзкий", music: 'climax', text: "Отлично. Просто отличные новости. И что нам теперь делать? Стоять здесь и ждать, пока они нас найдут?" },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Полиция уже здесь. Если мы выйдем к ним, Андрей поймет, что я его предал. Он может отдать приказ своим людям атаковать здание. Начнется перестрелка." },
        { bg: BG.factory, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Мы должны предупредить Николая Андреевича! Он же не знает, что здесь еще и бандиты!" },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "У нас нет связи. Если я позвоню, Андрей может перехватить сигнал или услышать звонок." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Есть другой путь. В подвале этого завода есть старые трубы, которые ведут к канализационным стокам. Можно вывести вас отсюда незамеченными." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'climax', choice: true, text: "Что делаем?", options: [ { text: "Согласиться на план Загадочного Мужчины и уйти через подвал.", next: 10 }, { text: "Остаться на месте и попытаться прорваться к полиции, чтобы предупредить их.", next: 13 } ] },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "Хорошо. Веди. Но если ты нас обманешь, я не буду ждать полицию." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "У меня нет причин вас обманывать. Я хочу, чтобы Андрей остановился. Он уже зашел слишком далеко." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'climax', text: "Мы идем за ним. В коридорах темно, пахнет сыростью и старой краской. Мы спускаемся по скрипучей металлической лестнице.", next: 16 },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "Нет. Мы идем к полиции. Если там люди Андрея, Николай Андреевич должен знать." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Ты рискуешь всеми нами. Но если ты так решил, я пойду с вами. Я не оставлю вас в такой ситуации." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'climax', text: "Мы выходим к главному входу, стараясь не шуметь." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Заброшенный завод. Подвал. Утро. Тусклый свет фонарика, сырые стены, трубы." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Мы спускаемся в подвал. Загадочный Мужчина светит фонариком. Вдруг он останавливается и поднимает руку. Мы замираем." },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Тихо. Слышите?" },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Мы прислушиваемся. Где-то наверху раздается тяжелый топот и лязг оружия. Потом крик." },
        { bg: BG.factoryBasement, char: C.dima, name: "Дима", music: 'climax', text: "Они уже внутри." },
        { bg: BG.factoryBasement, char: C.derz, name: "Дерзкий", music: 'climax', text: "И они не похожи на полицию." },
        { bg: BG.factoryBasement, char: C.derz, name: "", music: 'climax', text: "Ксюша прижимается ко мне. Я чувствую, как она дрожит." },
        { bg: BG.factoryBasement, char: C.dima, name: "Дима", music: 'climax', text: "Где выход?" },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "В конце коридора. Там есть дверь. Но нам нужно быть быстрыми." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Мы бежим по коридору. Вдруг сзади раздается выстрел. Пуля высекает искры из трубы над нашими головами." },
        { bg: BG.factoryBasement, char: C.derz, name: "Дерзкий", music: 'climax', text: "Ложись!" },
        { bg: BG.factoryBasement, char: C.derz, name: "", music: 'climax', text: "Мы падаем на пол. Я закрываю Ксюшу собой." },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Они нашли нас. Через вентиляцию." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Загадочный Мужчина достает пистолет. Я не знал, что у него есть оружие." },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Я прикрою вас. Идите к двери." },
        { bg: BG.factoryBasement, char: C.dima, name: "Дима", music: 'climax', text: "Нет, ты идешь с нами!" },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Если я пойду с вами, они поймают нас всех. Я задержу их. Идите." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', choice: true, text: "Что делаем?", options: [ { text: "Послушаться Загадочного Мужчины и бежать с Ксюшей и Дерзким.", next: 34 }, { text: "Остаться и помочь ему отбиться.", next: 38 } ] },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Я хватаю Ксюшу за руку и бегу. Дерзкий за мной. За спиной слышны выстрелы и звуки борьбы." },
        { bg: BG.factoryBasement, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Мы не можем его оставить!" },
        { bg: BG.factoryBasement, char: C.dima, name: "Дима", music: 'climax', text: "Он знает, что делает! Бежим!" },
        { bg: BG.factoryBasement, char: C.dima, name: "", music: 'climax', text: "Мы выбегаем за дверь и оказываемся на улице. Свежий воздух бьет в лицо. С другой стороны завода уже видны полицейские машины.", next: 43 },
        { bg: BG.factoryBasement, char: C.dima, name: "Дима", music: 'climax', text: "Я не оставлю тебя одного." },
        { bg: BG.factoryBasement, char: C.dima, name: "", music: 'climax', text: "Я поднимаю с пола кусок арматуры. Загадочный Мужчина усмехается." },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Ты смелый парень, Дима. Ладно. Держись за мной." },
        { bg: BG.factoryBasement, char: C.mystery, name: "", music: 'climax', text: "Мы прижимаемся к стенам. Из-за угла выходит человек в черной маске с пистолетом. Загадочный Мужчина делает точный выстрел ему в плечо. Бандит падает." },
        { bg: BG.factoryBasement, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Бежим!" },
        { bg: BG.factory, char: C.mystery, name: "", music: 'climax', text: "Заброшенный завод. Территория возле главного входа. Утро. Полицейские машины, группа захвата." },
        { bg: BG.factory, char: C.mystery, name: "", music: 'climax', text: "Мы выбегаем на улицу. Николай Андреевич стоит возле машины с мегафоном. Увидев нас, он бежит навстречу." },
        { bg: BG.factory, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Дима! Ксюша! Вы целы?" },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "Целы. Но там люди Андрея. Они вооружены." },
        { bg: BG.factory, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Мы уже знаем. Снайперы на позициях. Сейчас мы их накроем." },
        { bg: BG.factory, char: C.nikolay, name: "", music: 'climax', text: "В этот момент из здания выходит Андрей. Он сам катит свое инвалидное кресло. Рядом с ним двое мужчин в черной одежде с оружием. Они сдаются полиции." },
        { bg: BG.factory, char: C.sto, name: "Андрей", music: 'climax', text: "Хватит. Я не хочу больше крови." },
        { bg: BG.factory, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Андрей Андреев, вы арестованы." },
        { bg: BG.factory, char: C.nikolay, name: "", music: 'climax', text: "Андрей смотрит на меня. Его взгляд пустой и уставший." },
        { bg: BG.factory, char: C.sto, name: "Андрей", music: 'climax', text: "Ты победил, Дима. Ты и твоя бабушка. Но знай, что это не конец. Это только начало." },
        { bg: BG.factory, char: C.sto, name: "", music: 'climax', text: "Его уводят. Загадочный Мужчина выходит из здания, держась за плечо. Он ранен." },
        { bg: BG.factory, char: C.dima, name: "Дима", music: 'climax', text: "Ты ранен." },
        { bg: BG.factory, char: C.mystery, name: "Загадочный Мужчина", music: 'climax', text: "Царапина. Жить буду." },
        { bg: BG.factory, char: C.nikolay, name: "Николай Андреевич", music: 'climax', text: "Вы тоже арестованы. Но учитывая вашу помощь, суд будет снисходителен." },
        { bg: BG.bedroom, char: C.nikolay, name: "", music: 'climax', text: "Спальня. Вечер. Тусклый свет ночника, широкая кровать." },
        { bg: BG.bedroom, char: C.nikolay, name: "", music: 'climax', text: "Я сижу на кровати. Ксюша рядом. Она прижимается ко мне." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Я так испугалась. Думала, что больше не увижу тебя." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'climax', text: "Я тоже. Но все закончилось. Андрей арестован. Загадочный Мужчина тоже. Полиция нашла их логово." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'climax', text: "А что с Натальей Олеговной?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'climax', text: "Она дает показания. Завтра я поеду к Николаю Андреевичу. Он сказал, что она хочет поговорить со мной." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Ты поедешь?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'climax', text: "Поеду. Я должен услышать, что она скажет." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'climax', text: "Ксюша поднимает голову и смотрит на меня." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'climax', text: "Дима... я не хочу, чтобы ты уходил. Не сегодня." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'climax', text: "Она целует меня. Мы остаемся вдвоем. За окном темно, но в комнате тепло. И на несколько часов мы забываем обо всем." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'climax', text: "Спальня. Утро. Солнце пробивается сквозь шторы." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'climax', text: "Я просыпаюсь. Ксюша спит. Я тихо встаю и беру телефон. На экране сообщение от Николая Андреевича." },
        { bg: BG.bedroom, char: C.ksusha, name: "Николай Андреевич (сообщение)", music: 'climax', text: "«Дима, приезжай. Наталья Олеговна готова говорить. И еще. Мы нашли в компьютере Андрея список тех, кто участвовал в эксперименте. Там есть имя, которое тебя удивит»." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'climax', text: "Я хмурюсь. Кто еще? Кого я не знаю?" },
      ],
      [
        { bg: BG.bedroom, char: C.dima, name: "", music: 'calm', text: "Спальня. Утро. Солнце пробивается сквозь шторы. Дима сидит на кровати, сжимая телефон. Рядом спит Ксюша." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'calm', text: "Я смотрю на сообщение от Николая Андреевича. «Имя, которое тебя удивит». В голове проносится миллион вариантов. Кто еще мог быть замешан в том эксперименте? Я осторожно встаю с кровати, стараясь не разбудить Ксюшу. Она что-то бормочет во сне и переворачивается на другой бок. Я быстро одеваюсь, беру ключи от машины и выхожу из квартиры." },
        { bg: BG.police, char: C.dima, name: "", music: 'calm', text: "Отделение полиции. Утро. Кабинет Николая Андреевича. На столе разложены папки и ноутбук." },
        { bg: BG.police, char: C.dima, name: "", music: 'calm', text: "Я захожу в кабинет. Николай Андреевич выглядит так, будто не спал всю ночь. Перед ним стоит кружка с остывшим кофе, а на столе лежит распечатка какого-то документа." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Присаживайся, Дима. Разговор будет тяжелым." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Что за имя? Кто еще был в этом списке?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Мы взломали зашифрованный файл в ноутбуке Андрея. Там список всех, кто участвовал в «Программе адаптации». Учителя, спонсоры, ученики. Имена твоей бабушки, директора, Беды мы уже знаем. Но есть один человек, который до сих пор работает в школе." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Кто это?" },
        { bg: BG.police, char: C.dima, name: "", music: 'calm', text: "Николай Андреевич берет распечатку и протягивает мне. Я смотрю на строчку, выделенную маркером. Там написано: «Рита. Ученица 10 класса. Куратор Наталья Олеговна»." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Рита? Та самая девочка, которая играет на скрипке? Но она же учится со мной в одном классе! Как она могла быть в списке пятнадцатилетней давности?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Не она. Ее мать. Рита тогда была еще маленькой. Но она тоже была частью этой системы. Твоя бабушка использовала ее талант. Она заставляла ее играть для взрослых мужчин, чтобы те платили деньги в фонд школы." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Что? Вы хотите сказать, что Наталья Олеговна..." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Да. Она использовала детей для своих целей. И Рита была одной из них. Но это еще не все. Когда Андрей узнал про это, он попытался ее спасти. Но его остановили." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'calm', text: "Я сжимаю распечатку в руке. В голове не укладывается. Я знал, что Наталья Олеговна была жестокой, но чтобы настолько..." },
        { bg: BG.interrogation, char: C.nikolay, name: "", music: 'calm', text: "Отделение полиции. Коридор. Утро. Возле комнаты для допросов." },
        { bg: BG.interrogation, char: C.nikolay, name: "", music: 'calm', text: "Николай Андреевич ведет меня к комнате для допросов. Внутри сидит Наталья Олеговна. Она выглядит постаревшей и разбитой. На ней нет макияжа, волосы растрепаны. Увидев меня, она поднимает голову." },
        { bg: BG.interrogation, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "У вас десять минут. Потом я ее увезу." },
        { bg: BG.interrogation, char: C.nikolay, name: "", music: 'calm', text: "Я захожу в комнату. Сажусь напротив Натальи Олеговны." },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "Наталья Олеговна", music: 'calm', text: "Ты пришел. Я боялась, что ты не захочешь меня видеть." },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'calm', text: "Я пришел, чтобы услышать правду. Про Андрея. Про Риту. Про все." },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "Наталья Олеговна", music: 'calm', text: "Я знаю, что ты меня ненавидишь. И я тебя понимаю. Я сама себя ненавижу." },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'calm', text: "Зачем? Зачем ты это делала? Ты же знала, что это неправильно!" },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "Наталья Олеговна", music: 'calm', text: "Я хотела, чтобы школа процветала. Я хотела, чтобы у меня была власть. Я думала, что делаю это ради блага. Но это было ради моего эго." },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "", music: 'calm', choice: true, text: "О чем спросить?", options: [ { text: "Спросить Наталью Олеговну, знала ли она о том, что Андрей выжил.", next: 24 }, { text: "Спросить, почему она использовала Риту.", next: 26 } ] },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'calm', text: "Ты знала, что Андрей выжил? Знала, что он все эти годы был рядом?" },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "Наталья Олеговна", music: 'calm', text: "Нет. Я была уверена, что он умер. Я заплатила врачам, чтобы они сделали вид, что он мертв. Но я не знала, что они его спасут.", next: 28 },
        { bg: BG.interrogation, char: C.dima, name: "Дима", music: 'calm', text: "Почему Рита? Она же была ребенком." },
        { bg: BG.interrogation, char: C.babushkaRemorse, name: "Наталья Олеговна", music: 'calm', text: "Ее мать была моей должницей. Она задолжала мне крупную сумму. И я предложила ей сделку. Она приведет Риту, а я спишу долг. Рита играла на скрипке перед богатыми людьми. Это приносило деньги." },
        { bg: BG.police, char: C.babushkaRemorse, name: "", music: 'calm', text: "Отделение полиции. Коридор. Утро." },
        { bg: BG.police, char: C.babushkaRemorse, name: "", music: 'calm', text: "Я выхожу из комнаты для допросов. В коридоре меня ждет Николай Андреевич. Он смотрит на меня с сочувствием." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Она во всем призналась. Суд будет. Но учитывая ее возраст и состояние здоровья, скорее всего, она не доживет до приговора." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Она больна?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Да. Рак. Последняя стадия." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'calm', text: "Я прислоняюсь к стене. Теперь все становится на свои места. Она хотела признаться, потому что знала, что скоро умрет." },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "А что с Ритой?" },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Она ничего не знает. Мы не будем ей ничего рассказывать. Это разрушит ее жизнь." },
        { bg: BG.police, char: C.nikolay, name: "", music: 'calm', text: "В этот момент в коридор вбегает Вачик. Он бледный." },
        { bg: BG.police, char: C.vachik, name: "Вачик", music: 'calm', text: "Николай Андреевич! Проблема. Загадочный Мужчина сбежал из-под стражи." },
        { bg: BG.police, char: C.vachik, name: "", music: 'calm', choice: true, text: "Что делаем?", options: [ { text: "Потребовать, чтобы Николай Андреевич немедленно отправил группу на его поиски.", next: 39 }, { text: "Остаться в участке и попытаться понять, как он сбежал.", next: 42 } ] },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Как он сбежал? Он же был под охраной!" },
        { bg: BG.police, char: C.vachik, name: "Вачик", music: 'calm', text: "Он обманул охрану. Сказал, что ему плохо, а когда его повели в медпункт, напал на конвоира." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Поднимай всех на уши. Он не мог далеко уйти.", next: 44 },
        { bg: BG.police, char: C.dima, name: "Дима", music: 'calm', text: "Он не мог сбежать сам. Ему кто-то помог." },
        { bg: BG.police, char: C.nikolay, name: "Николай Андреевич", music: 'calm', text: "Согласен. Вачик, проверь записи с камер. Кто-то из наших может быть заодно с ним." },
        { bg: BG.city, char: C.nikolay, name: "", music: 'calm', text: "Улица перед отделением полиции. День." },
        { bg: BG.city, char: C.nikolay, name: "", music: 'calm', text: "Я выхожу на улицу. Мне нужно глотнуть свежего воздуха. В этот момент ко мне подъезжает знакомая машина. Это машина Дерзкого. Он выходит и подходит ко мне." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Дима! Я слышал, что произошло. Ты как?" },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "В порядке. Но Загадочный Мужчина сбежал." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Я знаю. И я знаю, куда он направился." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Откуда?" },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Он оставил мне сообщение. На телефоне. Он сказал, что если я хочу спасти тебя, то должен приехать на старую электростанцию. И привезти тебя." },
        { bg: BG.city, char: C.derz, name: "", music: 'calm', choice: true, text: "Что делаем?", options: [ { text: "Согласиться поехать с Дерзким.", next: 52 }, { text: "Отказаться и поехать туда с полицией.", next: 54 } ] },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Тогда едем. Немедленно." },
        { bg: BG.city, char: C.dima, name: "", music: 'calm', text: "Мы садимся в машину Дерзкого и уезжаем.", next: 58 },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Мы должны сообщить Николаю Андреевичу. Это ловушка." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Он сказал, что если мы приведем копов, то он убьет заложника." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Какого заложника?" },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "Он не сказал. Просто сказал, что это будет человек, который мне дорог." },
        { bg: BG.powerStation, char: C.derz, name: "", music: 'calm', text: "Старая электростанция на окраине города. Вечер. Огромное здание с трубами." },
        { bg: BG.powerStation, char: C.derz, name: "", music: 'calm', text: "Мы подъезжаем к электростанции. Вокруг никого. Мы заходим внутрь. В центре зала стоит стул, на котором сидит Ксюша." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'calm', text: "Ксюша!" },
        { bg: BG.powerStation, char: C.dima, name: "", music: 'calm', text: "Я бросаюсь к ней, но меня останавливает голос." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'calm', text: "Стой на месте, Дима. Или я выстрелю." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'calm', text: "Он выходит из тени. В руках у него пистолет." },
      ],
      [
        { bg: BG.powerStation, char: C.dima, name: "", music: 'tense', text: "Старая электростанция на окраине города. Вечер. Огромный пустой зал с ржавыми трубами. Свет пробивается сквозь разбитые окна. Ксюша привязана к стулу. Загадочный Мужчина держит Диму на прицеле." },
        { bg: BG.powerStation, char: C.dima, name: "", music: 'tense', text: "Я застываю на месте. Руки сами тянутся вверх. Ксюша всхлипывает на стуле, пытаясь вырваться из веревок. Дерзкий замирает позади меня, я слышу его тяжелое дыхание." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Ты сошел с ума? Отпусти ее!" },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Я не собираюсь причинять ей вред. Мне нужен ты. И мне нужно, чтобы ты выслушал меня до конца. Без полиции. Без Николая Андреевича." },
        { bg: BG.powerStation, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты сбежал из-под стражи, похитил Ксюшу, а теперь хочешь, чтобы мы просто сели и послушали тебя?" },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Именно так. Потому что то, что я скажу, разрушит все, во что ты веришь, Дима. И если ты не узнаешь правду сейчас, ты никогда ее не узнаешь." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Согласиться выслушать его, но потребовать отпустить Ксюшу.", next: 7 }, { text: "Попытаться отвлечь его и наброситься, пока он говорит.", next: 13 } ] },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Хорошо. Я слушаю. Но сначала отпусти Ксюшу. Она не имеет к этому отношения." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Она уйдет, как только ты дашь мне слово, что не сдашь меня полиции, пока не выслушаешь." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Даю слово. Отпусти ее." },
        { bg: BG.powerStation, char: C.dima, name: "", music: 'tense', text: "Он медленно опускает пистолет и подходит к Ксюше. Развязывает узлы. Ксюша бежит ко мне." },
        { bg: BG.powerStation, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима..." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Все хорошо. Иди к Дерзкому. Я разберусь.", next: 18 },
        { bg: BG.powerStation, char: C.dima, name: "", music: 'tense', text: "Я смотрю на Дерзкого. Он едва заметно кивает. Я делаю шаг в сторону, делая вид, что сдаюсь." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Ладно. Говори. Я слушаю." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Умно. Но не пытайся меня обмануть. Я вижу тебя насквозь." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', text: "В этот момент Дерзкий бросает в него гаечный ключ, который подобрал на полу. Загадочный Мужчина уворачивается, и я бросаюсь на него, сбивая с ног. Пистолет отлетает в сторону. Ксюша кричит." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Идиоты! Вы все испортили!" },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', text: "Я стою над ним, держа в руках его пистолет. Дерзкий помогает Ксюше встать." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Говори. Что ты хотел мне сказать? Только быстро, пока я не позвонил Николаю Андреевичу." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Твоя бабушка, Наталья Олеговна, не просто использовала Риту. Она использовала и других детей. И одна из этих детей... моя сестра." },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Что?" },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Она умерла. В психиатрической больнице. После того, как Наталья Олеговна заставила ее выступать перед взрослыми мужчинами, а потом бросила, когда она перестала быть полезной. Я работал на Андрея, потому что мы оба хотели мести. Но Андрей хотел только правосудия. А я хотел крови." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', choice: true, text: "Что спросить?", options: [ { text: "Спросить, почему он не убил Наталью Олеговну, если хотел крови.", next: 24 }, { text: "Спросить, знает ли Андрей о его планах.", next: 26 } ] },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Почему ты не убил ее? У тебя были сотни возможностей." },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Потому что смерть это слишком легко. Я хотел, чтобы она страдала. Чтобы она увидела, как рушится все, что она строила. Чтобы она знала, что ее внук, Дима, узнает правду и отвернется от нее.", next: 28 },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Андрей знал, что ты хочешь убить ее?" },
        { bg: BG.powerStation, char: C.mystery, name: "Загадочный Мужчина", music: 'tense', text: "Нет. Андрей был против. Он хотел, чтобы она предстала перед судом. А я хотел, чтобы она сдохла. Но я не успел." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', text: "Старая электростанция. Вечер. Снаружи слышны полицейские сирены." },
        { bg: BG.powerStation, char: C.mystery, name: "", music: 'tense', text: "В этот момент ворота электростанции распахиваются. Вбегает Николай Андреевич с группой захвата. Вачик с пистолетом. Дерзкий поднимает руки." },
        { bg: BG.powerStation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Всем стоять! Дима, опусти оружие!" },
        { bg: BG.powerStation, char: C.nikolay, name: "", music: 'tense', text: "Я медленно опускаю пистолет. Загадочный Мужчина сдается без сопротивления." },
        { bg: BG.powerStation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Как вы здесь оказались?" },
        { bg: BG.powerStation, char: C.dima, name: "Дима", music: 'tense', text: "Он нас вызвал. Хотел сказать, что Наталья Олеговна... она использовала и других детей. И его сестра умерла из-за нее." },
        { bg: BG.powerStation, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Мы проверим эту информацию. А сейчас всем нужно уехать. Здесь небезопасно." },
        { bg: BG.city, char: C.nikolay, name: "", music: 'tense', text: "Улица перед электростанцией. Вечер. Полицейские машины. Ксюша, Дима и Дерзкий сидят на бордюре." },
        { bg: BG.city, char: C.nikolay, name: "", music: 'tense', text: "Мы сидим втроем. Ксюша держит меня за руку. Дерзкий смотрит в небо." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'tense', text: "Я так больше не могу. Каждый раз, когда мы думаем, что все закончилось, появляется кто-то новый." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Это последний раз. Теперь мы знаем все. Андрей арестован. Загадочный Мужчина арестован. Наталья Олеговна призналась." },
        { bg: BG.city, char: C.ksusha, name: "Ксюша", music: 'tense', text: "А что с Ритой? Ты расскажешь ей правду?" },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'tense', text: "Не знаю. Это может ее сломать." },
        { bg: BG.city, char: C.dima, name: "", music: 'tense', text: "Николай Андреевич подходит к нам." },
        { bg: BG.city, char: C.nikolay, name: "Николай Андреевич", music: 'tense', text: "Дима. Твоя бабушка в больнице. Ей стало плохо. Врачи говорят, что у нее осталось не так много времени. Она хочет тебя видеть." },
        { bg: BG.hospitalWard, char: C.nikolay, name: "", music: 'tense', text: "Больница. Палата Натальи Олеговны. Ночь. Тусклый свет, капельница, мониторы." },
        { bg: BG.hospitalWard, char: C.nikolay, name: "", music: 'tense', text: "Я захожу в палату. Наталья Олеговна лежит на кровати. Она выглядит очень бледной и слабой. Увидев меня, она пытается улыбнуться." },
        { bg: BG.hospitalWard, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Дима. Ты пришел." },
        { bg: BG.hospitalWard, char: C.dima, name: "Дима", music: 'tense', text: "Николай Андреевич сказал, что тебе плохо." },
        { bg: BG.hospitalWard, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Я знаю. Я чувствую. Врачи говорят, что это конец." },
        { bg: BG.hospitalWard, char: C.babushka, name: "", music: 'tense', choice: true, text: "Что ответить?", options: [ { text: "Сказать ей, что она заслуживает этого.", next: 49 }, { text: "Сказать ей, что вы прощаетесь, но не прощаете ее.", next: 51 } ] },
        { bg: BG.hospitalWard, char: C.dima, name: "Дима", music: 'tense', text: "Ты заслуживаешь этого. Ты разрушила столько жизней. Андрей, его сестра, Рита, моя жизнь." },
        { bg: BG.hospitalWard, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Я знаю. Я не прошу прощения. Я просто хотела увидеть тебя в последний раз.", next: 53 },
        { bg: BG.hospitalWard, char: C.dima, name: "Дима", music: 'tense', text: "Я не прощаю тебя за то, что ты сделала. Но я прощаюсь с тобой. Потому что ты моя бабушка. И я не хочу, чтобы ты умирала одна." },
        { bg: BG.hospitalWard, char: C.babushka, name: "Наталья Олеговна", music: 'tense', text: "Спасибо. Это больше, чем я заслуживаю." },
        { bg: BG.cemetery, char: C.babushka, name: "", music: 'tense', text: "Кладбище. Ночь. Туман, старые надгробия, одинокий фонарь." },
        { bg: BG.cemetery, char: C.babushka, name: "", music: 'tense', text: "Прошла неделя. Наталья Олеговна умерла в больнице. Ее похоронили на старом кладбище, недалеко от могилы Андрея. Я стою у ее могилы вместе с Ксюшей и Дерзким." },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ну что, теперь все?" },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Теперь все. Андрей в психбольнице. Загадочный Мужчина в тюрьме. Михаил и Руслан тоже. Секты больше нет." },
        { bg: BG.cemetery, char: C.ksusha, name: "Ксюша", music: 'tense', text: "А что с Ритой?" },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Я поговорил с ней. Она не знала о том, что ее мать брала деньги у Натальи Олеговны. Я не стал ей рассказывать. Это слишком." },
        { bg: BG.cemetery, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Ты правильно сделал." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Спальня. Ночь. Тусклый свет ночника, широкая кровать." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Мы с Ксюшей вернулись в квартиру Дерзкого. Он уехал к Камрану, чтобы помочь ему с учебой. Мы остались вдвоем." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима... я так устала. Я хочу, чтобы все это закончилось." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Все закончилось. Теперь мы можем жить нормально." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "А что если появится кто-то еще? Что если кто-то захочет отомстить?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Тогда мы справимся. Вместе." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Она целует меня. Мы остаемся вдвоем. Эта ночь наша. Никаких сект, никаких шантажистов, никаких тайн. Только мы." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Спальня. Утро. Солнце пробивается сквозь шторы." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Я просыпаюсь от того, что мой телефон вибрирует. На экране сообщение от Николая Андреевича." },
        { bg: BG.bedroom, char: C.dima, name: "Николай Андреевич (сообщение)", music: 'tense', text: "«Дима, доброе утро. Есть новости. Андрей попросил о встрече. Говорит, что хочет передать тебе что-то важное. Он сказал, что это касается его отца. Михаил оставил завещание. И ты в нем упомянут»." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Я смотрю на спящую Ксюшу. Кажется, история еще не закончена." },
      ],
      [
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'calm', text: "Спальня. Утро. Солнце пробивается сквозь шторы. Дима сидит на кровати, сжимая телефон. Ксюша медленно просыпается и потягивается." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'calm', text: "Я смотрю на сообщение от Николая Андреевича. Завещание Михаила. Я в нем упомянут. В голове не укладывается, зачем Архитектору оставлять что-то мне. Мы ведь были врагами." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Дима? Ты чего вскочил ни свет ни заря? Опять что-то случилось?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'calm', text: "Андрей попросил о встрече. Говорит, что Михаил оставил завещание. И я в нем упомянут." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Что? Но зачем? Он же хотел тебя убить!" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'calm', text: "Я не знаю. Но я должен поехать. Это может быть последней ниточкой, которая свяжет все концы." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Я с тобой." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'calm', text: "Нет. В психбольницу лучше не соваться без лишней необходимости. Я возьму Дерзкого. А ты побудь здесь, хорошо?" },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'calm', text: "Ксюша нехотя кивает. Я быстро одеваюсь и выхожу из квартиры." },
        { bg: BG.psych, char: C.dima, name: "", music: 'calm', text: "Психиатрическая больница. Палата Андрея. День. Белые стены, решетки на окнах. Андрей сидит в инвалидном кресле у окна." },
        { bg: BG.psych, char: C.dima, name: "", music: 'calm', text: "Мы с Дерзким заходим в палату. Здесь пахнет лекарствами и хлоркой. Андрей выглядит спокойным, даже умиротворенным. Увидев нас, он слабо улыбается." },
        { bg: BG.psych, char: C.sto, name: "Андрей", music: 'calm', text: "Пришли. А я думал, ты не захочешь меня видеть после всего." },
        { bg: BG.psych, char: C.dima, name: "Дима", music: 'calm', text: "Я пришел не ради тебя. Я пришел ради завещания. Что в нем?" },
        { bg: BG.psych, char: C.sto, name: "Андрей", music: 'calm', text: "Мой отец, Михаил, был сложным человеком. Он хотел разрушить систему, но сам стал ее частью. Перед смертью он понял, что ошибался. Он написал завещание, в котором передал тебе кое-что." },
        { bg: BG.psych, char: C.dima, name: "Дима", music: 'calm', text: "Мне? Зачем?" },
        { bg: BG.psych, char: C.sto, name: "Андрей", music: 'calm', text: "Потому что ты, в отличие от нас всех, не потерял себя. Ты не стал мстить. Ты просто хотел правды. Отец уважал это." },
        { bg: BG.psych, char: C.sto, name: "", music: 'calm', choice: true, text: "Что спросить?", options: [ { text: "Спросить, что именно Михаил оставил мне.", next: 17 }, { text: "Спросить, почему Михаил не оставил это Андрею.", next: 20 } ] },
        { bg: BG.psych, char: C.dima, name: "Дима", music: 'calm', text: "Что это? Деньги? Документы?" },
        { bg: BG.psych, char: C.sto, name: "Андрей", music: 'calm', text: "Это ключ. И адрес. Я не знаю, что находится по этому адресу, но отец сказал, что это самая важная вещь, которую он когда-либо создавал. И он хочет, чтобы распоряжался этим ты." },
        { bg: BG.psych, char: C.sto, name: "", music: 'calm', text: "Он протягивает мне небольшой конверт.", next: 22 },
        { bg: BG.psych, char: C.dima, name: "Дима", music: 'calm', text: "Почему не тебе? Ты же его сын." },
        { bg: BG.psych, char: C.sto, name: "Андрей", music: 'calm', text: "Потому что я болен, Дима. Мой разум разрушен. Я не могу нести такую ответственность. А ты можешь." },
        { bg: BG.city, char: C.sto, name: "", music: 'calm', text: "Улица возле больницы. День. Дима и Дерзкий стоят возле машины." },
        { bg: BG.city, char: C.sto, name: "", music: 'calm', text: "Я открываю конверт. Внутри старый ржавый ключ и клочок бумаги с адресом. Старое СТО." },
        { bg: BG.city, char: C.derz, name: "Дерзкий", music: 'calm', text: "СТО? Опять это место? Там же ничего нет, кроме старых машин." },
        { bg: BG.city, char: C.dima, name: "Дима", music: 'calm', text: "Значит, есть что-то, чего мы не видели. Поехали." },
        { bg: BG.sto, char: C.dima, name: "", music: 'calm', text: "Старое СТО. День. Ворота гаража открыты. Внутри пусто, если не считать старой «Нивы» в углу." },
        { bg: BG.sto, char: C.dima, name: "", music: 'calm', text: "Мы приезжаем на СТО. Внутри никого. Мы начинаем обыскивать гараж. Я замечаю, что пол под машиной выглядит странно. Я отодвигаю старый коврик и вижу металлический люк." },
        { bg: BG.sto, char: C.dima, name: "Дима", music: 'calm', text: "Смотри. Здесь что-то есть." },
        { bg: BG.sto, char: C.dima, name: "", music: 'calm', text: "Мы с Дерзким поднимаем люк. Под ним узкая лестница, ведущая вниз." },
        { bg: BG.stoBasement, char: C.dima, name: "", music: 'calm', text: "Подвал под СТО. Свет тусклой лампочки. Стеллажи с бумагами, старый сейф." },
        { bg: BG.stoBasement, char: C.dima, name: "", music: 'calm', text: "Мы спускаемся в подвал. Здесь сухо и пыльно. В центре комнаты стоит старый сейф. Я вставляю ключ и поворачиваю его. Замок щелкает." },
        { bg: BG.stoBasement, char: C.dima, name: "", music: 'calm', text: "Внутри сейфа лежит толстая папка с документами. Я открываю ее. Это финансовые отчеты, списки имен, адреса. И фотографии. На одной из них я вижу Наталью Олеговну. А рядом с ней мужчину, которого я никогда раньше не видел. Но что-то в его лице кажется мне знакомым." },
        { bg: BG.stoBasement, char: C.dima, name: "Дима", music: 'calm', text: "Кто это?" },
        { bg: BG.stoBasement, char: C.derz, name: "Дерзкий", music: 'calm', text: "Понятия не имею. Но смотри, на обороте что-то написано." },
        { bg: BG.stoBasement, char: C.derz, name: "", music: 'calm', text: "Я переворачиваю фотографию. На обороте написано корявым почерком Михаила: «Твой настоящий отец. Он жив. И он ищет тебя»." },
        { bg: BG.stoBasement, char: C.derz, name: "", music: 'calm', choice: true, text: "Что делаем?", options: [ { text: "Показать фотографию Николаю Андреевичу и попросить пробить этого человека.", next: 37 }, { text: "Никому не говорить и попытаться найти его самостоятельно.", next: 39 } ] },
        { bg: BG.stoBasement, char: C.dima, name: "Дима", music: 'calm', text: "Нам нужно ехать в полицию. Николай Андреевич поможет." },
        { bg: BG.stoBasement, char: C.dima, name: "", music: 'calm', text: "Мы садимся в машину и едем в участок.", next: 42 },
        { bg: BG.stoBasement, char: C.dima, name: "Дима", music: 'calm', text: "Пока никто не должен знать. Я сам разберусь." },
        { bg: BG.stoBasement, char: C.derz, name: "Дерзкий", music: 'calm', text: "Ты с ума сошел? Этот тип может быть опасен." },
        { bg: BG.stoBasement, char: C.dima, name: "Дима", music: 'calm', text: "Я справлюсь." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'calm', text: "Старое кладбище. Ночь. Туман, старые надгробия. Дима стоит у могилы Натальи Олеговны." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'calm', text: "Я приезжаю на кладбище. Мне нужно побыть одному. Я смотрю на могилу Натальи Олеговны. Столько тайн она унесла с собой. И теперь я узнаю, что мой отец, возможно, жив." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'calm', text: "В этот момент я слышу шаги за спиной. Я оборачиваюсь. Из тумана выходит Саламандра. Она выглядит уставшей и напуганной." },
        { bg: BG.cemetery, char: C.sala, name: "Саламандра", music: 'calm', text: "Дима. Я знала, что найду тебя здесь." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'calm', text: "Что ты здесь делаешь? Тебя же должны были посадить." },
        { bg: BG.cemetery, char: C.sala, name: "Саламандра", music: 'calm', text: "Меня выпустили под залог. Но это не важно. Я знаю про фотографию. И я знаю, кто этот человек." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'calm', text: "Откуда?" },
        { bg: BG.cemetery, char: C.sala, name: "Саламандра", music: 'calm', text: "Михаил рассказал мне перед арестом. Он сказал, что твой отец это не просто человек. Это бывший агент спецслужб, который инсценировал свою смерть и скрылся. И он опасен." },
        { bg: BG.cemetery, char: C.sala, name: "", music: 'calm', choice: true, text: "Что делаем?", options: [ { text: "Поверить Саламандре и попросить ее помочь.", next: 51 }, { text: "Не верить ей и прогнать ее.", next: 53 } ] },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'calm', text: "Почему я должен тебе верить?" },
        { bg: BG.cemetery, char: C.sala, name: "Саламандра", music: 'calm', text: "Потому что я хочу искупить свою вину. Я была пешкой, но теперь я хочу помочь. Твой отец ищет тебя, чтобы использовать. Он не тот, за кого себя выдает.", next: 56 },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'calm', text: "Убирайся. Я больше не верю ни одному твоему слову." },
        { bg: BG.cemetery, char: C.sala, name: "Саламандра", music: 'calm', text: "Ты совершаешь ошибку, Дима. Он найдет тебя. И тогда будет поздно." },
        { bg: BG.cemetery, char: C.sala, name: "", music: 'calm', text: "Она уходит в туман." },
        { bg: BG.bedroom, char: C.sala, name: "", music: 'calm', text: "Спальня. Ночь. Ксюша сидит на кровати, ждет Диму." },
        { bg: BG.bedroom, char: C.sala, name: "", music: 'calm', text: "Я возвращаюсь домой. Ксюша ждет меня." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Ты где был? Я волновалась." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'calm', text: "Мне нужно было подумать." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'calm', text: "Я рассказываю ей про завещание, про фотографию и про встречу с Саламандрой." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Что? Твой отец жив? И он бывший агент?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'calm', text: "Похоже на то. И я не знаю, что мне делать." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'calm', text: "Мы справимся. Вместе. Как всегда." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'calm', text: "Она обнимает меня. В этот момент мой телефон вибрирует. Пришло сообщение с неизвестного номера." },
        { bg: BG.bedroom, char: C.ksusha, name: "Неизвестный номер (сообщение)", music: 'calm', text: "«Здравствуй, сын. Я знаю, что ты нашел фотографию. Пришло время нам встретиться. Завтра, в полночь, на старом кладбище. Приходи один. Иначе твоя девушка пострадает»." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'calm', text: "Я показываю сообщение Ксюше. Она бледнеет." },
      ],
      [
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Спальня. Ночь. Тусклый свет ночника. Дима и Ксюша сидят на кровати. Телефон с сообщением лежит между ними." },
        { bg: BG.bedroom, char: C.ksusha, name: "", music: 'tense', text: "Я смотрю на экран. «Приходи один. Иначе твоя девушка пострадает». Руки сжимаются в кулаки сами собой. Ксюша читает сообщение через мое плечо. Ее лицо бледнеет, но она не отводит взгляда." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Это ловушка. Ты же понимаешь, что это ловушка." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Понимаю. Но если я не приду, он может исполнить угрозу." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Мы можем позвонить Николаю Андреевичу. Он пришлет людей." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Он сказал прийти одному. Если он увидит полицию, он исчезнет. И тогда мы никогда его не найдем." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "А если ты пойдешь один, он убьет тебя." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Он не убьет. Он хочет встретиться. Ему что-то от меня нужно." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Позвонить Дерзкому и попросить его тайно прикрыть меня на кладбище.", next: 9 }, { text: "Пойти одному, не втягивая никого.", next: 19 } ] },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Я беру телефон и набираю номер Дерзкого. Он отвечает после второго гудка, сонным голосом." },
        { bg: BG.bedroom, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дим, ты знаешь, сколько времени?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Дерзкий, слушай внимательно. Мне нужно, чтобы ты кое-что сделал. И никому не говори." },
        { bg: BG.bedroom, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что случилось?" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Мне пришло сообщение от человека, который называет себя моим отцом. Он хочет встретиться на кладбище в полночь. Один." },
        { bg: BG.bedroom, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ты рехнулся? Это же явно ловушка!" },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Я знаю. Поэтому мне нужно, чтобы ты был рядом. Спрячься где-нибудь недалеко. Если что-то пойдет не так, ты сможешь вмешаться." },
        { bg: BG.bedroom, char: C.derz, name: "Дерзкий", music: 'tense', text: "Ладно. Но если тебя там прикончат, я твой компьютер заберу." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Договорились." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Я вешаю трубку.", next: 23 },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Я пойду один. Это единственный способ." },
        { bg: BG.bedroom, char: C.ksusha, name: "Ксюша", music: 'tense', text: "Дима, пожалуйста. Не надо." },
        { bg: BG.bedroom, char: C.dima, name: "Дима", music: 'tense', text: "Я должен. Ради тебя. Ради всех нас." },
        { bg: BG.bedroom, char: C.dima, name: "", music: 'tense', text: "Она обнимает меня, и я чувствую, как она дрожит. Я отстраняюсь и выхожу из квартиры." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Старое кладбище. Ночь. Туман, старые надгробия, одинокий фонарь." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Полночь. Я стою у могилы Натальи Олеговны. Вокруг тишина, только ветер шуршит сухими листьями. В руке я сжимаю фонарик. В кармане перочинный нож." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Проходит несколько минут. Я слышу шаги. Они медленные, уверенные. Из тумана выходит мужчина. Высокий, седой, в длинном черном пальто. Его лицо кажется знакомым, но я не могу вспомнить, где я его видел. Он останавливается в нескольких метрах от меня." },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Здравствуй, Дима. Ты вырос. Совсем как твоя мать." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Ты кто?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я тот, кого ты ищешь. Твой отец. Меня зовут Даниил." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "Я смотрю на него. В голове проносятся обрывки воспоминаний. Я никогда не знал своего отца. Наталья Олеговна говорила, что он умер. А теперь он стоит передо мной." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Ты жив. Все эти годы ты был жив, и ты не попытался найти меня?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я не мог. Я работал под прикрытием. Если бы я появился в твоей жизни, ты был бы в опасности." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "В опасности? Я и так был в опасности! Из-за Натальи Олеговны, из-за секты, из-за всего!" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я знаю. И я сожалею. Но я здесь, чтобы все исправить." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', choice: true, text: "Что спросить?", options: [ { text: "Спросить, что ему нужно от меня.", next: 35 }, { text: "Спросить, почему он не помог, когда я был в опасности.", next: 39 } ] },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Что тебе от меня нужно? Зачем ты пришел?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Мне нужен документ, который ты нашел в сейфе. Финансовые отчеты. Списки. Фотографии. Это мой компромат на людей, которые до сих пор находятся у власти. Если он попадет в чужие руки, начнется война." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Ты хочешь, чтобы я отдал тебе то, что нашел Михаил?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Да. Я хочу, чтобы ты передал это мне. И тогда я смогу завершить то, что начал он.", next: 43 },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Почему ты не помог мне? Когда меня похищали, когда меня шантажировали, когда моя жизнь была под угрозой?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я следил за тобой. Каждый день. Я знал, что происходит. Но я не мог вмешаться. Если бы я это сделал, я бы раскрыл себя. И тогда все, над чем я работал, рухнуло бы." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "И ты думаешь, что это оправдание?" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Нет. Я не ищу оправданий. Я просто объясняю." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "Старое кладбище. Ночь. Из тумана появляется еще одна фигура." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "В этот момент из тумана выходит Дерзкий. Он держит в руках монтировку." },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Дима! Я не мог остаться в стороне!" },
        { bg: BG.cemetery, char: C.derz, name: "", music: 'tense', text: "Даниил резко оборачивается. В его руке появляется пистолет." },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я же сказал прийти одному!" },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Не стреляй! Это мой друг!" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Ты нарушил условие. Я не могу тебе доверять." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "Он делает шаг назад, не опуская пистолет." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', choice: true, text: "Что делаем?", options: [ { text: "Попытаться успокоить Даниила и объяснить, что Дерзкий не опасен.", next: 52 }, { text: "Броситься на Даниила и попытаться отобрать пистолет.", next: 56 } ] },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Он не опасен. Он просто хочет помочь. Пожалуйста, опусти пистолет." },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Я не верю людям. Я слишком долго жил в мире, где каждый может предать." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Он не предаст. Он мой друг. И он единственный, кто был рядом, когда мне было трудно." },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Даниил медленно опускает пистолет.", next: 59 },
        { bg: BG.cemetery, char: C.dima, name: "", music: 'tense', text: "Я бросаюсь на Даниила. Он не ожидает этого. Пистолет отлетает в сторону. Мы падаем на землю. Дерзкий подбегает и хватает пистолет." },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Лежи, не дергайся!" },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Глупец. Ты только что подписал себе приговор." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "Старое кладбище. Ночь. Даниил сидит на земле. Дерзкий держит его на прицеле." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "Я встаю и отряхиваюсь. Даниил смотрит на меня с презрением." },
        { bg: BG.cemetery, char: C.sergey, name: "Даниил", music: 'tense', text: "Ты думаешь, что победил? Я пришел сюда не один. Мои люди уже здесь." },
        { bg: BG.cemetery, char: C.sergey, name: "", music: 'tense', text: "В этот момент из тумана появляются две тени. Это люди в черных костюмах. Они направляются к нам." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Дерзкий, уходи!" },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Я тебя не оставлю!" },
        { bg: BG.cemetery, char: C.derz, name: "", music: 'tense', text: "Старое кладбище. Ночь. Перестрелка. Люди в черных костюмах наступают." },
        { bg: BG.cemetery, char: C.derz, name: "", music: 'tense', text: "Люди в черных костюмах открывают огонь. Мы с Дерзким прячемся за надгробиями. Даниил поднимается с земли и убегает в туман." },
        { bg: BG.cemetery, char: C.dima, name: "Дима", music: 'tense', text: "Он уходит!" },
        { bg: BG.cemetery, char: C.derz, name: "Дерзкий", music: 'tense', text: "Плевать! Нам нужно выбираться отсюда!" },
        { bg: BG.cemetery, char: C.derz, name: "", music: 'tense', text: "Мы бежим к машине. Пули свистят над головами. Мы запрыгиваем в машину и уезжаем." },
        { bg: BG.highway, char: C.derz, name: "", music: 'tense', text: "Шоссе за городом. Ночь. Машина Димы мчится на скорости." },
        { bg: BG.highway, char: C.derz, name: "", music: 'tense', text: "Я выжимаю педаль газа. Дерзкий сидит рядом, тяжело дыша." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Что это было? Кто эти люди?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Его люди. Он сказал, что работает под прикрытием. Но это было похоже на спецоперацию." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Твой отец это кто-то из спецслужб?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Я не знаю. Но он опасен. И он хочет то, что я нашел." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "И что теперь?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Теперь мы знаем, что он не остановится. И нам нужно найти способ его остановить." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "В этот момент мой телефон вибрирует. Пришло сообщение от Николая Андреевича." },
        { bg: BG.highway, char: C.dima, name: "Николай Андреевич (сообщение)", music: 'tense', text: "«Дима, срочно. В участке произошла утечка. Кто-то передал информацию о завещании Михаила. Твой отец знает, что ты нашел документы. Будь осторожен»." },
        { bg: BG.highway, char: C.dima, name: "", music: 'tense', text: "Я показываю сообщение Дерзкому." },
        { bg: BG.highway, char: C.derz, name: "Дерзкий", music: 'tense', text: "Утечка? В полиции?" },
        { bg: BG.highway, char: C.dima, name: "Дима", music: 'tense', text: "Похоже, у него есть люди везде." },
      ],
    ];

    // ===== СЕЗОНЫ ДЕТЕКТИВА =====
    // released — сколько эпизодов открыто для игроков.
    // Меняй цифру: 1 → открыт 1 эпизод, 2 → открыто 2, и так далее до total.
    // Сезон 2: released: 0 → показывается «СКОРО». Поставь 1 — откроется первый эпизод второго сезона.
    const SEASONS = [
      { title: 'Сезон 1', total: 9, released: 1, names: EP_NAMES, story: S1_EPISODES },
      { title: 'Сезон 2', total: 7, released: 0, names: ['Пустая могила', 'Заброшенный завод', 'Крах Андрея', 'Признание Натальи Олеговны', 'Цена мести', 'Секреты старого СТО', 'Ночная встреча на кладбище'], story: S2_EPISODES }, { title: 'Сезон 3', total: 5, released: 0, names: ['Эпизод 1', 'Эпизод 2', 'Эпизод 3', 'Эпизод 4', 'Эпизод 5'], story: [] }, { title: 'Сезон 4', total: 8, released: 0, names: ['Эпизод 1', 'Эпизод 2', 'Эпизод 3', 'Эпизод 4', 'Эпизод 5', 'Эпизод 6', 'Эпизод 7', 'Эпизод 8'], story: [] }
    ];

    // Награда за прохождение эпизода. Ключ: 'номер сезона-номер эпизода'
    const EPISODE_REWARDS = { '1-8': 'Загадочный Мужчина' };
    // ===== ЭДИТЫ =====
    async function loadRealEdits() {
      const container = $('#posts'); if (!container) return; container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Загрузка...</div>';
      try { const res = await fetch('/api/posts?type=edits'); const posts = await res.json(); if (!posts || !posts.length) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px;">Пусто</div>'; return; }
        container.innerHTML = posts.map(p => { let mediaHtml = ''; if (p.videoUrl) mediaHtml = `<video src="${p.videoUrl}" controls controlsList="nodownload" playsinline style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;"></video>`; else if (p.image) mediaHtml = `<img src="${p.image}" style="width:100%; height:auto; max-height:400px; object-fit:cover; border-radius: 16px 16px 0 0;">`; const d = new Date(p.date); const dateStr = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); return `<article class="post" style="padding: 0; overflow: hidden; margin-bottom: 20px;">${mediaHtml}<div class="b"><div class="row" style="margin-bottom: 6px;"><div class="au" style="margin:0;">@${esc(p.author)}</div><div class="sub" style="font-size: 11px;">${dateStr}</div></div><p class="sub" style="margin-bottom: 10px; color: #fff; font-size: 14px; white-space: pre-wrap;">${esc(p.text.substring(0, 120))}...</p><div class="row"><a href="https://t.me/${p.author}" target="_blank" class="btn sm g" style="text-decoration:none;">В канал</a><button class="like" data-like="${p.id}">♥ Нравится</button></div></div></article>`; }).join('');
      } catch (err) { container.innerHTML = '<div class="sub" style="text-align:center; padding: 20px; color: #ff1e3c;">Ошибка</div>'; }
    }
    if ($('#posts')) $('#posts').addEventListener('click', e => { const b = e.target.closest('[data-like]'); if (!b) return; b.classList.toggle('on'); b.textContent = b.classList.contains('on') ? '♥ В избранном' : '♥ Нравится'; S.stat.likes++; saveState(); });


    // ===== СОХРАНЕНИЕ И ЗАГРУЗКА =====
    const DEFAULT_S = {
      stars: 0, coins: 0, inv: [], hist: [], liked: {}, choices: [], activeBadge: null,
      stat: { cases: 0, likes: 0, progress: {}, caseAt: {}, rewards: {} }
    };
    let S = JSON.parse(JSON.stringify(DEFAULT_S));
    let stateLoaded = false;
    let saveTimeout;

    // Приводит stat к нужному виду (и переносит старое поле chapters)
    function normalizeStat(st) {
      const s = { ...DEFAULT_S.stat, ...(st || {}) };
      s.progress = { ...((st && st.progress) || {}) };
      if (!s.progress[1] && st && st.chapters) s.progress[1] = st.chapters;
      s.caseAt = { ...((st && st.caseAt) || {}) };
      s.rewards = { ...((st && st.rewards) || {}) };
      return s;
    }

    async function loadUserState() {
      try {
        const res = await fetch(`/api/user/${TG_ID}`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Ошибка загрузки');
        S = {
          ...DEFAULT_S,
          inv: Array.isArray(data.inv) ? data.inv : [],
          hist: Array.isArray(data.hist) ? data.hist : [],
          choices: Array.isArray(data.choices) ? data.choices : [],
          activeBadge: data.active_badge || null,
          stat: normalizeStat(data.stat)
        };
      } catch (e) {
        console.error('Ошибка загрузки БД', e);
        try {
          const saved = localStorage.getItem('shd_app_state');
          if (saved) {
            const parsed = JSON.parse(saved);
            S = { ...DEFAULT_S, ...parsed, stat: normalizeStat(parsed.stat) };
          }
        } catch (err) {}
      }
      stateLoaded = true;
      renderProfile();
    }

    function saveState() {
      try { localStorage.setItem('shd_app_state', JSON.stringify(S)); } catch (e) {}
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(async () => {
        if (!stateLoaded) return;
        try {
          await fetch(`/api/user/${TG_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify(S)
          });
        } catch (e) { console.error('Ошибка сохранения БД', e); }
      }, 1000);
    }

    const addH = (t, d, a) => { S.hist.unshift({ t, d, a, at: Date.now() }); saveState(); };
    function toast(msg) {
      const t = $('#toast'); if (!t) return;
      t.textContent = msg; t.classList.add('show');
      clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
    }
    const fmtLeft = ms => {
      const h = Math.floor(ms / H), m = Math.floor((ms % H) / 6e4);
      return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
    };

    // ===== НАВИГАЦИЯ =====
    const SCREENS = ['menu', 'edit', 'cases', 'detective', 'awards', 'profile'];
    function go(name) {
      SCREENS.forEach(s => { const el = $('#s-' + s); if (el) el.classList.toggle('on', s === name); });
      const backBtn = $('#backBtn'); if (backBtn) backBtn.classList.toggle('hidden', name === 'menu');
      try {
        if (name === 'edit') loadRealEdits();
        if (name === 'cases') renderCases();
        if (name === 'detective') renderDetective();
        if (name === 'awards') renderAwards();
        if (name === 'profile') renderProfile();
      } catch (e) { console.error(e); }
    }
    if ($('#backBtn')) $('#backBtn').addEventListener('click', () => go('menu'));

    // ===== ОБЩИЕ СЛУЖЕБНЫЕ =====
    function roll(o) {
      const t = Object.values(o).reduce((a, b) => a + b, 0);
      let r = Math.random() * t;
      for (const k in o) { r -= o[k]; if (r < 0) return k; }
      return Object.keys(o)[0];
    }
    function giveChar(rar) {
      let pool = CHARS.filter(c => c.r === rar && !c.story);
      if (!pool.length) pool = CHARS.filter(c => c.r === 'common');
      const c = pool[rnd(pool.length)];
      S.inv.unshift({ n: c.n, r: c.r, img: c.img, id: Date.now() + rnd(9999) });
      return c;
    }
    function giveNamed(name) {
      const c = CHARS.find(x => x.n === name); if (!c) return null;
      S.inv.unshift({ n: c.n, r: c.r, img: c.img, id: Date.now() + rnd(9999) });
      return c;
    }

    // ===== КЕЙСЫ =====
    let pendingCase = null;
    const caseLeft = k => Math.max(0, ((S.stat.caseAt || {})[k] || 0) + CASES[k].cd - Date.now());

    function renderCases() {
      const list = $('#caseList'); if (!list) return;
      let html = `<div class="cases-header"><button class="history-btn" id="btn-history">⏱ История выигрышей</button></div><div class="case-cards-list">`;
      Object.keys(CASES).forEach(k => {
        const c = CASES[k], left = caseLeft(k);
        const status = left > 0 ? `⏳ Через ${fmtLeft(left)}` : '✅ Готово к открытию';
        html += `
          <div class="case-card" data-case="${k}" style="background:${c.bg}">
            <div class="case-icon">${c.icon}</div>
            <div class="case-info">
              <div class="case-sub">${c.period}</div>
              <div class="case-title">${c.name}</div>
              <div class="case-price"><span>${status}</span></div>
            </div>
            <div class="case-chevron">›</div>
          </div>`;
      });
      html += `</div>`;
      list.innerHTML = html;
    }

    if ($('#caseList')) $('#caseList').addEventListener('click', e => {
      const b = e.target.closest('[data-case]');
      if (b) openCaseDetails(b.dataset.case);
    });

    function openCaseDetails(k) {
      const c = CASES[k], left = caseLeft(k);
      pendingCase = k;
      const rows = Object.keys(c.odds).map(r => `
        <div class="odds-item">
          <div class="odds-icon" style="background:${RAR[r][1]}33;">●</div>
          <div class="odds-info"><b style="color:${RAR[r][1]}">${RAR[r][0]}</b></div>
          <div class="odds-chance" style="background:${RAR[r][1]}22; color:${RAR[r][1]}">${c.odds[r]}%</div>
        </div>`).join('');
      $('#case-modal-content').innerHTML = `
        <div class="row" style="justify-content:flex-end"><button class="close-modal" style="color:#fff; font-size:22px">✕</button></div>
        <div style="text-align:center; margin-bottom:16px">
          <h2 style="font-size:28px">${c.name}</h2>
          <div class="sub">${c.period}</div>
        </div>
        <div class="odds-list">${rows}</div>
        <button class="btn w" id="confirm-open-case" style="margin-top:16px" ${left > 0 ? 'disabled' : ''}>${left > 0 ? 'Через ' + fmtLeft(left) : 'Открыть'}</button>
      `;
      $('#modal-case-details').classList.remove('hidden');
    }

    function openCase(k) {
      if (!k || caseLeft(k) > 0) return;
      const rar = roll(CASES[k].odds);
      const c = giveChar(rar);
      S.stat.cases = (S.stat.cases || 0) + 1;
      S.stat.caseAt = { ...(S.stat.caseAt || {}), [k]: Date.now() };
      addH('Кейс', `${CASES[k].name}: ${c.n}`, RAR[rar][0]);
      playSFX('win');
      $('#modal-case-details').classList.add('hidden');
      showWin(c, rar);
    }

    function showWin(c, rar) {
      $('#win-content').innerHTML = `
        <div class="win-result">
          <div class="cav" style="width:180px; height:180px; border-radius:50%; overflow:hidden; border:3px solid ${RAR[rar][1]}; box-shadow:0 0 30px ${RAR[rar][1]}">
            <img src="${c.img}" style="width:100%; height:100%; object-fit:cover">
          </div>
          <div class="lab" style="margin-top:14px; color:${RAR[rar][1]}">${RAR[rar][0]}</div>
          <div class="o" style="font-size:28px; margin-top:4px">${esc(c.n)}</div>
          <button class="btn close-win" style="margin-top:18px">Забрать</button>
        </div>`;
      $('#modal-win').classList.remove('hidden');
    }

    // ===== ИСТОРИЯ =====
    function renderHistory() {
      const list = $('#history-list');
      if (!S.hist.length) {
        list.innerHTML = '<div class="sub" style="text-align:center; padding:20px;">Тут пока пусто</div>';
        return;
      }
      
      list.innerHTML = S.hist.map(h => {
        const d = new Date(h.at);
        const dateStr = `${d.getDate()}.${d.getMonth()+1}, ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        let icon = '🎁'; let iconBg = 'rgba(255,255,255,0.1)';
        if (h.t.includes('Дневничок')) { icon = '🎒'; iconBg = 'rgba(157, 77, 255, 0.2)'; }
        else if (h.t.includes('Шпаргалка')) { icon = '📘'; iconBg = 'rgba(77, 163, 255, 0.2)'; }
        else if (h.t.includes('Палочка')) { icon = '🪄'; iconBg = 'rgba(74, 222, 128, 0.2)'; }

        return `
          <div class="hist-card">
            <div class="hist-icon" style="background:${iconBg}">${icon}</div>
            <div class="hist-info">
              <div class="hist-title">${esc(h.d)}</div>
              <div class="hist-sub">${esc(h.t)} · ${dateStr}</div>
            </div>
            <div class="hist-price" style="color:${h.a === 'Бесплатно' ? '#4ade80' : 'var(--star)'}">${esc(h.a)}</div>
          </div>
        `;
      }).join('');
    }



    // ===== ДЕТЕКТИВ =====
    let vnState = { active: false, season: 1, ep: 0, scene: 0 };
    let lastMusic = null;
    const seasonDone = n => Math.min(((S.stat.progress || {})[n]) || 0, SEASONS[n - 1].total);
    const curList = () => SEASONS[vnState.season - 1].story[vnState.ep];

    function renderDetective() {
      const body = $('#nvBody'); if (!body) return;
      if ($('#vn-screen')) $('#vn-screen').classList.add('hidden');

      let html = '';
      SEASONS.forEach((season, si) => {
        const n = si + 1, done = seasonDone(n), rel = season.released;
        html += `
          <div class="ep-header">
            <h1 class="ep-title-main">${season.title}</h1>
            <div class="ep-progress">пройдено ${done} из ${season.total}</div>
          </div>`;

        if (rel <= 0) {
          html += `
            <div class="card" style="text-align:center; padding:28px 16px;">
              <div class="o" style="font-size:34px; color:var(--star)">Скоро</div>
              <div class="sub" style="margin-top:8px">Второй сезон уже в разработке. Следи за обновлениями.</div>
            </div>`;
          return;
        }

        const cur = Math.min(done, rel - 1);
        const bg = (season.story[cur] && season.story[cur][0] && season.story[cur][0].bg) || BG.hall;
        const passed = done > cur;
        html += `
          <div class="ep-card-active" data-season="${n}" data-ep="${cur}">
            <div class="ep-card-bg" style="background-image:url('${bg}')"></div>
            <div class="ep-card-content">
              <div class="ep-card-sub">${passed ? 'Пройден' : 'Эпизод ' + (cur + 1) + ' · ты здесь'}</div>
              <div class="ep-card-title">${esc(season.names[cur])}</div>
              <button class="btn ep-btn-play w">${passed ? '▶ Пройти заново' : '▶ Продолжить'}</button>
            </div>
          </div>
          <div class="ep-list">`;

        for (let i = 0; i < season.total; i++) {
          if (i === cur) continue;
          const name = esc(season.names[i] || 'Скоро');
          if (i < done) {
            html += `<div class="ep-item" data-season="${n}" data-ep="${i}"><div class="ep-num">0${i + 1}</div><div class="ep-info"><div class="ep-name">${name}</div></div><div class="ep-lock" style="color:var(--ok); font-size:14px">✓</div></div>`;
          } else if (i < rel) {
            html += `<div class="ep-item locked"><div class="ep-num">0${i + 1}</div><div class="ep-info"><div class="ep-name">${name}</div></div><div class="ep-lock">🔒</div></div>`;
          } else {
            html += `<div class="ep-item future"><div class="ep-header-row">⏳ Эпизод ${i + 1} · скоро</div><div class="ep-name">${name}</div></div>`;
          }
        }
        html += `</div>`;
      });

      html += `
        <div style="display:flex; justify-content:center; gap:10px; margin-top:24px; flex-wrap:wrap;">
          <button class="btn sm g" id="btn-my-choices">♥ Твои выборы</button>
          <button class="btn sm g" id="btn-album">🖼 Фотоальбом</button>
        </div>`;
      body.innerHTML = html;

      body.querySelectorAll('[data-season][data-ep]').forEach(el => {
        el.addEventListener('click', () => startVN(+el.dataset.season, +el.dataset.ep));
      });
    }

    // Звуки по тексту сцены: машина, звонок, сообщение, дверь, шаги, выстрел
    function autoSfx(scene) {
      if (scene.sfx) return scene.sfx;
      const t = (scene.text || '').toLowerCase();
      const name = scene.name || '';
      if (/\(сообщение\)/.test(name) || /пришло сообщение|экран телефона загорается|телефон.*вибрир|сообщение от/.test(t)) return 'msg';
      if (/звонит|звонок|зазвонил|телефон звонит|мой телефон звонит/.test(t)) return 'phone';
      if (/машин.*(открыл|открыв|заве)|открыл.*машин|открылась машина|сигнализац/.test(t)) return 'car';
      if (/выстрел|стреля|пули|пуля|пистолет.*(выстрел|стреля)/.test(t)) return 'shot';
      if (/дверь|дверь.*(захлоп|распахн|открыв|открывается)|захлопыва/.test(t)) return 'door';
      if (/шаги|бегу|бежит|бежать|выбегаю|бросаюсь/.test(t)) return 'step';
      return null;
    }

    function preloadEpisode(list) {
      list.forEach(sc => [sc.bg, sc.char].forEach(url => {
        if (url) { const im = new Image(); im.src = url; }
      }));
    }

    function startVN(season, ep) {
      const s = SEASONS[season - 1];
      if (!s || ep >= s.released || ep > seasonDone(season)) return toast('Этот эпизод пока закрыт');
      const list = s.story[ep];
      if (!list || !list.length) return toast('Эпизод скоро');
      vnState = { active: true, season, ep, scene: 0 };
      $('#vn-screen').classList.remove('hidden');
      preloadEpisode(list);
      lastMusic = list[0].music || 'calm';
      playMusic(lastMusic);
      showScene();
    }

    // Размер персонажа зависит от высоты окна текста:
    // короткий текст - низкий персонаж, длинный текст - персонаж чуть выше текста
    function layoutChar() {
      const box = $('#vn-char-box'), ch = $('#vn-char');
      if (!box || !ch) return;
      // Персонаж одного размера во всех сценах: сверху под шапкой, ноги уходят за окно текста
      box.style.bottom = '';
      box.style.top = '11vh';
      ch.style.height = Math.round(window.innerHeight * 0.66) + 'px';
    }
    window.addEventListener('resize', () => { if (vnState.active) layoutChar(); });

    function showScene() {
      if (!vnState.active) return;
      const list = curList();
      const scene = list && list[vnState.scene];
      if (!scene) return endVN();

      const bgEl = $('#vn-bg'), charEl = $('#vn-char'), dialogEl = $('#vn-dialog');
      dialogEl.style.display = 'block';
      if (scene.music) { lastMusic = scene.music; playMusic(scene.music); } else if (lastMusic) playMusic(lastMusic);
      const sfxKey = autoSfx(scene); if (sfxKey) playSFX(sfxKey);

      if (scene.choice) {
        dialogEl.classList.add('choice-mode');
        const choiceHtml = scene.options.map((opt, i) =>
          `<button class="vn-choice" onclick="window.makeChoice(${i})">${i + 1}. ${esc(opt.text)}</button>`).join('');
        dialogEl.innerHTML = `
          <div class="vn-top-row"><div class="vn-speaker${(scene.name || '').length > 9 ? ' long' : ''}">${esc(scene.name)}</div></div>
          <div class="vn-text">${esc(scene.text)}</div>
          <div class="vn-choice-title">Твой выбор:</div>
          <div class="vn-choices">${choiceHtml}</div>`;
        requestAnimationFrame(layoutChar);
        return;
      }

      dialogEl.classList.remove('choice-mode');
      if (scene.bg) { bgEl.style.backgroundImage = `url('${scene.bg}')`; bgEl.className = 'vn-bg active'; }
      const speaking = !!scene.name && !/\(сообщение\)/.test(scene.name) && !/^Голос/.test(scene.name);
      if (scene.char && speaking) { charEl.style.backgroundImage = `url('${scene.char}')`; charEl.classList.add('active'); }
      else charEl.classList.remove('active');
      if ($('#vn-speaker')) {
        const isMsg = /\(сообщение\)/.test(scene.name || '') || (!scene.name && /сообщени|экран телефона загорается|пришло сообщение/.test((scene.text || '').toLowerCase()));
        const isCall = /\(звонок\)/.test(scene.name || '') || (!scene.name && /звонит|звонок|зазвонил/.test((scene.text || '').toLowerCase()));
        const plain = (scene.name || '').replace(/\s*\((сообщение|звонок)\)/, '');
        let label = plain;
        if (isMsg) label = 'СООБЩЕНИЕ' + (plain ? ' · ' + plain : '');
        else if (isCall) label = 'ЗВОНОК' + (plain ? ' · ' + plain : '');
        $('#vn-speaker').textContent = label;
        $('#vn-speaker').classList.toggle('long', label.length > 9);
      }
      if ($('#vn-text')) $('#vn-text').textContent = scene.text;
      if ($('#vn-ep-info')) $('#vn-ep-info').textContent = `С${vnState.season} · Э${vnState.ep + 1}`;
      requestAnimationFrame(layoutChar);
    }

    window.makeChoice = (idx) => {
      const list = curList();
      const scene = list && list[vnState.scene];
      if (!scene || !scene.options || !scene.options[idx]) return;
      const opt = scene.options[idx];
      S.choices.unshift({ ep: `Сезон ${vnState.season}, эпизод ${vnState.ep + 1}`, choice: opt.text });
      saveState();
      const dialogEl = $('#vn-dialog');
      dialogEl.classList.remove('choice-mode');
      dialogEl.innerHTML = `
        <div class="vn-top-row"><div class="vn-speaker" id="vn-speaker"></div><div class="vn-ep-info" id="vn-ep-info"></div></div>
        <div class="vn-text" id="vn-text"></div>
        <div class="vn-next-btn" id="vn-next-btn">➔</div>`;
      vnState.scene = opt.next !== undefined ? opt.next : vnState.scene + 1;
      showScene();
    };

    if ($('#vn-dialog')) $('#vn-dialog').addEventListener('click', (e) => {
      // Клик по кнопке выбора не должен листать сцену
      if (e.target.closest && e.target.closest('button')) return;
      if (!vnState.active || $('#vn-dialog').classList.contains('choice-mode')) return;
      const cur = curList()[vnState.scene];
      vnState.scene = (cur && cur.next !== undefined) ? cur.next : vnState.scene + 1;
      showScene();
    });

    function endVN() {
      const { season, ep } = vnState;
      vnState.active = false;
      $('#vn-screen').classList.add('hidden');
      stopMusic();
      if (seasonDone(season) <= ep) {
        S.stat.progress = { ...(S.stat.progress || {}), [season]: ep + 1 };
        addH('Детектив', `${SEASONS[season - 1].title}, эпизод ${ep + 1}`, 'Сюжет');
      }
      const key = `${season}-${ep + 1}`;
      if (EPISODE_REWARDS[key] && !S.stat.rewards[key]) {
        const c = giveNamed(EPISODE_REWARDS[key]);
        S.stat.rewards = { ...S.stat.rewards, [key]: true };
        if (c) {
          addH('Награда', `Новый персонаж: ${c.n}`, RAR[c.r][0]);
          toast(`Новый персонаж: ${c.n}!`);
        }
      } else {
        toast(`Эпизод ${ep + 1} пройден!`);
      }
      renderDetective();
      saveState();
    }

    if ($('#vn-pause-btn')) $('#vn-pause-btn').addEventListener('click', e => { e.stopPropagation(); $('#pause-modal').classList.remove('hidden'); });
    if ($('#pause-continue')) $('#pause-continue').addEventListener('click', () => $('#pause-modal').classList.add('hidden'));
    if ($('#pause-exit')) $('#pause-exit').addEventListener('click', () => {
      $('#pause-modal').classList.add('hidden'); $('#vn-screen').classList.add('hidden');
      stopMusic(); vnState.active = false; go('detective');
    });
    if ($('#pause-restart')) $('#pause-restart').addEventListener('click', () => {
      $('#pause-modal').classList.add('hidden'); vnState.scene = 0; showScene();
    });
    if ($('#vol-sfx')) $('#vol-sfx').addEventListener('input', e => { sfxVolume = e.target.value / 100; });
    if ($('#vol-music')) $('#vol-music').addEventListener('input', e => { musicPlayer.volume = (e.target.value / 100) * 0.20; });

    function openChoicesModal() {
      $('#choices-modal').classList.remove('hidden');
      const box = $('#choices-content');
      box.innerHTML = S.choices.length
        ? S.choices.map(c => `
            <div class="card" style="padding:12px; margin-bottom:8px; border-left:3px solid var(--star);">
              <div class="sub" style="font-size:10px; margin-bottom:4px; text-transform:uppercase">${esc(c.ep)}</div>
              <div style="font-size:14px">${esc(c.choice)}</div>
            </div>`).join('')
        : '<div class="sub" style="text-align:center; margin-top:20px">Ты пока не сделал ни одного выбора.</div>';
    }
    if ($('#pause-choices')) $('#pause-choices').addEventListener('click', openChoicesModal);
    if ($('#pause-album')) $('#pause-album').addEventListener('click', () => $('#album-modal').classList.remove('hidden'));

    // ===== НАГРАДЫ =====
    const ACHIEVEMENTS = [
      { id: 'start', icon: '👋', name: 'Новичок', desc: 'Зашёл в приложение', check: () => true },
      { id: 'case1', icon: '📦', name: 'Первак', desc: 'Открыл 1 кейс', check: () => S.stat.cases >= 1 },
      { id: 'case10', icon: '🎁', name: 'Лудоман', desc: 'Открыл 10 кейсов', check: () => S.stat.cases >= 10 },
      { id: 'ep1', icon: '🕵️', name: 'Сыщик', desc: 'Прошёл эпизод 1', check: () => seasonDone(1) >= 1 },
      { id: 'ep5', icon: '🔎', name: 'Детектив', desc: 'Прошёл 5 эпизодов', check: () => seasonDone(1) >= 5 },
      { id: 'season1', icon: '🏆', name: 'Финал', desc: 'Прошёл весь 1 сезон', check: () => seasonDone(1) >= SEASONS[0].total },
      { id: 'legend', icon: '🌟', name: 'Везунчик', desc: 'Выбил легендарного персонажа', check: () => S.inv.some(c => c.r === 'legend' || c.r === 'mythic') },
      { id: 'hero1', icon: '🦸', name: 'Коллекционер', desc: 'Собрал 1 персонажа', check: () => S.inv.length >= 1 },
      { id: 'hero5', icon: '🎭', name: 'Фанат', desc: 'Собрал 5 персонажей', check: () => S.inv.length >= 5 },
      { id: 'hero10', icon: '💎', name: 'Геймер', desc: 'Собрал 10 персонажей', check: () => S.inv.length >= 10 }
    ];

    function renderAwards() {
      const grid = $('#achGrid'), sub = $('#awSub'); if (!grid) return;
      const done = ACHIEVEMENTS.filter(a => a.check()).length;
      if (sub) sub.textContent = `${done} из ${ACHIEVEMENTS.length}`;
      grid.innerHTML = ACHIEVEMENTS.map(a => {
        const isDone = a.check(), isEquipped = S.activeBadge === a.id;
        return `
          <div class="ach-card ${isDone ? 'done' : 'locked'} ${isEquipped ? 'equipped' : ''}" data-ach="${a.id}">
            <div class="ach-card-icon">${isDone ? a.icon : '🔒'}</div>
            <div class="ach-card-title">${esc(a.name)}</div>
            <div class="ach-card-desc">${esc(a.desc)}</div>
            ${isDone ? `<button class="ach-card-btn">${isEquipped ? '✓ На аватарке' : 'Надеть'}</button>` : `<div class="ach-card-locked-text">Не получено</div>`}
          </div>`;
      }).join('');
    }

    if ($('#achGrid')) $('#achGrid').addEventListener('click', e => {
      const card = e.target.closest('.ach-card');
      if (!card || card.classList.contains('locked')) return;
      const achId = card.dataset.ach;
      S.activeBadge = S.activeBadge === achId ? null : achId;
      saveState(); renderAwards(); renderProfile();
      toast(S.activeBadge ? 'Награда надета!' : 'Награда снята');
    });

    // ===== ПРОФИЛЬ =====
    function renderProfile() {
      if (!$('#bC')) return;
      $('#bC').textContent = Array.isArray(S.inv) ? S.inv.length : 0;
      const act = ACHIEVEMENTS.find(a => a.id === S.activeBadge);
      ['#activeBadge', '#activeBadge2'].forEach(sel => {
        const el = $(sel); if (!el) return;
        el.textContent = act ? act.icon : '';
        el.classList.toggle('hidden', !act);
      });
      const ranks = { mythic: 5, legend: 4, epic: 3, rare: 2, common: 1 };
      const sorted = [...S.inv].sort((a, b) => (ranks[b.r] || 0) - (ranks[a.r] || 0));
      $('#inv').innerHTML = sorted.length ? sorted.map(i => `
        <div class="pc" style="--c:${RAR[i.r][1]}">
          <div class="cav" style="width:50px; height:50px; overflow:hidden; padding:0; border-radius:50%;">
            ${i.img ? `<img src="${i.img}" style="width:100%; height:100%; object-fit:cover;">` : ''}
          </div>
          <div style="font-size:11px; margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:100%; text-align:center;">${esc(i.n)}</div>
        </div>`).join('')
        : '<div class="sub" style="grid-column:1/-1; text-align:center;">У тебя пока нет персонажей. Открой кейс!</div>';
    }

    // ===== ОБРАБОТКА КЛИКОВ ПО ДОКУМЕНТУ =====
    document.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) return go(g.dataset.go);
      if (e.target.closest('#confirm-open-case')) return openCase(pendingCase);
      if (e.target.closest('#btn-my-choices')) return openChoicesModal();
      if (e.target.closest('#btn-album')) return $('#album-modal').classList.remove('hidden');
      if (e.target.closest('#btn-history')) { renderHistory(); return $('#modal-history').classList.remove('hidden'); }
      if (e.target.closest('.close-modal')) return e.target.closest('.modal').classList.add('hidden');
      if (e.target.closest('.close-win')) {
        e.target.closest('.modal').classList.add('hidden');
        if ($('#s-cases').classList.contains('on')) renderCases();
      }
    });

    // Обновляем таймеры кейсов раз в 30 секунд
    setInterval(() => { if ($('#s-cases') && $('#s-cases').classList.contains('on')) renderCases(); }, 30000);


    // ===== АВАТАРКА ИЗ TELEGRAM =====
    async function loadAvatar() {
      let src = U.photo_url || null;
      if (!src) {
        try {
          const r = await fetch('/api/avatar', { headers: authHeaders() });
          if (r.ok) src = URL.createObjectURL(await r.blob());
        } catch (e) {}
      }
      if (!src) return;
      ['#av', '#av2'].forEach(sel => {
        const el = $(sel);
        if (el) { el.style.backgroundImage = `url('${src}')`; el.textContent = ''; }
      });
    }

    // ===== СТАРТ =====
    if ($('#nick')) $('#nick').textContent = NAME;
    if ($('#nick2')) $('#nick2').textContent = NAME;
    if ($('#av')) $('#av').textContent = NAME[0].toUpperCase();
    if ($('#av2')) $('#av2').textContent = NAME[0].toUpperCase();

    // После загрузки данных сразу открываем детектив (заставка уходит на него)
    loadUserState().then(() => go('detective'));
    loadAvatar();

  } catch (error) { console.error('Критическая ошибка:', error); }
})();
