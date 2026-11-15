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

    function playSFX(type) { 
      if (!audioCtx) return; 
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
        { bg: BG.math, char: C.dima, name: 'Дима', music: 'sad', text: 'Беда, а вы знали Андрея Андреева?' },
        { bg: BG.math, char: C.sofia, name: 'Беда', music: 'sad', text: 'Кто тебе это сказал? Андрей был хорошим мальчиком. Но он сломался. А те, кто его сломал, сейчас сидят очень высоко. Забудь это имя, если не хочешь проблем.' },
        { bg: BG.aud, char: C.woman, name: 'Секта', music: 'tense', text: 'Актовый зал. Добро пожаловать. Я вижу новенького. Дима, верно? Поднимись к нам.' },
        { bg: BG.aud, char: C.dima, name: 'Дима', music: 'tense', text: 'Я медленно иду к сцене. Она кладет руку мне на плечо. Ее пальцы ледяные.' },
        { bg: BG.aud, char: C.woman, name: 'Секта', music: 'tense', text: 'Расскажи нам, Дима. Ты когда-нибудь чувствовал, что тебя предали? Ищи Андрея в архиве. И передай своей бабушке, Наталье Олеговне, что долг платежом красен.' },
        { bg: BG.hall, char: C.mila, name: 'Мила', music: 'tense', text: 'Я сбегаю со сцены. В коридоре меня хватает за руку Мила. Дима. Я знаю, кто запер тебя в спортзале. Это был директор. Он забрал ключи у Вачика.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Зачем ему это?' },
        { bg: BG.hall, char: C.mila, name: 'Мила', music: 'tense', text: 'Он боится. И еще… я украла кое-что из его сейфа. Вот. (Она протягивает мне флешку). Здесь видео. Как Камран передает деньги. И как директор шантажирует его.' },
        { choice: true, name: 'Дима', text: 'Что делать с флешкой?', music: 'tense', options: [ { text: 'Отдать флешку полиции', next: 77 }, { text: 'Найти Камрана', next: 78 } ]},
        { bg: BG.police, char: C.nikolay, name: 'Николай Андреевич', music: 'tense', text: 'Отделение полиции. Это неполное видео, Дима. Нам нужно больше доказательств.', next: 80 },
        { bg: BG.street, char: C.kamran, name: 'Камран', music: 'sad', text: 'Школьный двор. Зачем ты мне помогаешь? Директор заставил меня. Он сказал, что если я не передам деньги, он выгонит мою бабушку из школы.', next: 80 },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'climax', sfx: 'scream', text: 'Я иду по пустому коридору. Внезапно экран телефона загорается: «Ты думал, что нашел правду? Ты даже не представляешь, кто настоящий Кукольник. Оглянись».' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'climax', text: 'Я резко оборачиваюсь. В конце темного коридора мелькает тень. Сердце уходит в пятки. КОНЕЦ ЭПИЗОДА 1.' }
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
        { bg: BG.math, char: C.dima, name: "Дима", music: 'tense', text: "Беда, я знаю про эксперимент. Про Андрея. И про то, что вы в этом участвовали." },
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

    // ===== СЕЗОНЫ ДЕТЕКТИВА =====
    // released — сколько эпизодов открыто для игроков.
    // Меняй цифру: 1 → открыт 1 эпизод, 2 → открыто 2, и так далее до total.
    // Сезон 2: released: 0 → показывается «СКОРО». Поставь 1 — откроется первый эпизод второго сезона.
    const SEASONS = [
      { title: 'Сезон 1', total: 9, released: 1, names: EP_NAMES, story: S1_EPISODES },
      { title: 'Сезон 2', total: 7, released: 0, names: ['Скоро', 'Скоро', 'Скоро', 'Скоро', 'Скоро', 'Скоро', 'Скоро'], story: [] }
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

    function startVN(season, ep) {
      const s = SEASONS[season - 1];
      if (!s || ep >= s.released || ep > seasonDone(season)) return toast('Этот эпизод пока закрыт');
      const list = s.story[ep];
      if (!list || !list.length) return toast('Эпизод скоро');
      vnState = { active: true, season, ep, scene: 0 };
      $('#vn-screen').classList.remove('hidden');
      playMusic(list[0].music || 'calm');
      showScene();
    }

    function showScene() {
      if (!vnState.active) return;
      const list = curList();
      const scene = list && list[vnState.scene];
      if (!scene) return endVN();

      const bgEl = $('#vn-bg'), charEl = $('#vn-char'), dialogEl = $('#vn-dialog');
      dialogEl.style.display = 'block';
      if (scene.music) playMusic(scene.music);
      if (scene.sfx) playSFX(scene.sfx);

      if (scene.choice) {
        dialogEl.classList.add('choice-mode');
        const choiceHtml = scene.options.map((opt, i) =>
          `<button class="btn w" onclick="window.makeChoice(${i})">${esc(opt.text)}</button>`).join('');
        dialogEl.innerHTML = `
          <div class="vn-top-row"><div class="vn-speaker${(scene.name || '').length > 9 ? ' long' : ''}">${esc(scene.name)}</div></div>
          <div class="vn-text">${esc(scene.text)}</div>
          <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">${choiceHtml}</div>`;
        return;
      }

      dialogEl.classList.remove('choice-mode');
      bgEl.style.backgroundImage = `url('${scene.bg}')`;
      bgEl.className = 'vn-bg active';
      if (scene.char) { charEl.style.backgroundImage = `url('${scene.char}')`; charEl.classList.add('active'); }
      else charEl.classList.remove('active');
      if ($('#vn-speaker')) { $('#vn-speaker').textContent = scene.name; $('#vn-speaker').classList.toggle('long', (scene.name || '').length > 9); }
      if ($('#vn-text')) $('#vn-text').textContent = scene.text;
      if ($('#vn-ep-info')) $('#vn-ep-info').textContent = `С${vnState.season} · Э${vnState.ep + 1}`;
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

    // ===== СТАРТ =====
    if ($('#nick')) $('#nick').textContent = NAME;
    if ($('#nick2')) $('#nick2').textContent = NAME;
    if ($('#av')) $('#av').textContent = NAME[0].toUpperCase();
    if ($('#av2')) $('#av2').textContent = NAME[0].toUpperCase();

    // После загрузки данных сразу открываем детектив (заставка уходит на него)
    loadUserState().then(() => go('detective'));

  } catch (error) { console.error('Критическая ошибка:', error); }
})();
