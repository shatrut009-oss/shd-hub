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
      { n: 'Камран', r: 'rare', img: C.kamran }, { n: 'Софья Андреевна', r: 'rare', img: C.sofia }, { n: 'Руслан', r: 'rare', img: C.ruslan }, { n: 'Николай Андреевич', r: 'rare', img: C.nikolay }, { n: 'Мужчина из СТО', r: 'rare', img: C.sto },
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
        { bg: BG.hall, char: C.sofia, name: 'Софья Андреевна', music: 'tense', text: 'Что за балаган у десятых кабинетов?!' },
        { bg: BG.hall, char: C.sofia, name: '', music: 'tense', text: 'Учительница математики с ледяным взглядом и классным журналом, прижатым к груди, как щит. Ее очки угрожающе поблескивают.' },
        { bg: BG.hall, char: C.sofia, name: 'Софья Андреевна', music: 'tense', text: 'Я вам сейчас быстро найду полезное применение на дежурстве по столовой! Камран, марш на урок! А ты, Дима, задержишься после занятий. У нас с тобой будет серьезный разговор.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Камран бросает на меня победный взгляд и быстро уходит. Я открываю шкафчик, чтобы достать тетрадь, и замираю. На стопке учебников лежит белый конверт без подписи.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Внутри — фотография. На ней запечатлен директор школы, Алексей Евгеньевич, передающий какому-то мужчине в кожанке толстую пачку денег. А на обороте — короткая записка: «Ты следующий. Игра началась. 12:00, старый спортзал. Приходи один».' },
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
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Поэтому я звоню тебе. Приходи туда, но стой на стреме снаружи. Если я не выйду через двадцать минут — звони Вачику.' },
        { bg: BG.street, char: C.derz, name: 'Дерзкий', music: 'calm', text: 'Ладно, братуха. Но если тебя там прикончат, я твой компьютер заберу. И приставку.' },
        { bg: BG.street, char: C.dima, name: 'Дима', music: 'calm', text: 'Я вешаю трубку и направляюсь к старому корпусу. В любом случае, мне нужно туда попасть.', next: 40 },
        { bg: BG.gym, char: null, name: '', music: 'tense', text: '12:00. Старый школьный спортзал. Полутемно. Окна заколочены досками, повсюду штабеля досок, мешки с цементом и строительный мусор. В воздухе висит густая пыль.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я тихо прохожу мимо штабелей, стараясь не шуметь. Внутри пахнет сыростью и краской. В центре зала стоит Руслан. На нем оранжевая каска и рабочий комбинезон.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', music: 'tense', text: 'Ты что здесь забыл, парень? Здесь опасно, полы гнилые. Мы тут стену ломаем, того и гляди придавит.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Да я… ключи ищу. Обронил где-то вчера.' },
        { bg: BG.gym, char: C.ruslan, name: 'Руслан', music: 'tense', text: 'Ну, смотри под ноги. Если что, я на другом конце зала, буду сносить перегородку.' },
        { bg: BG.gym, char: C.vachik, name: 'Вачик', music: 'tense', text: 'Тише, Дима. Я знал, что ты придешь.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Вачик? Ты меня напугал. Ты знаешь, кто это сделал?' },
        { bg: BG.gym, char: C.vachik, name: 'Вачик', music: 'tense', text: 'Я видел его. Какой-то тип в темной одежде. Он прятал что-то в стене. Вон там, за матами. Но если хочешь найти правду — она там.' },
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Вачик кивает и растворяется в полумраке коридора. Я подхожу к матам, отодвигаю один. За ним в стене шатается кирпич. Я вытаскиваю его. В нише лежит старая тетрадь, диктофон и пачка фотографий.' },
        { choice: true, name: 'Дима', text: 'Что сделать первым?', music: 'tense', options: [ { text: 'Открыть тетрадь', next: 50 }, { text: 'Включить диктофон', next: 54 } ]},
        { bg: BG.gym, char: C.dima, name: 'Дима', music: 'tense', text: 'Я открываю тетрадь. На первой странице список фамилий: Директор, Софья Андреевна, Наталья Олеговна, и какой-то Андрей Андреев. Рядом с Андреем стоит жирный крестик.' },
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
        { bg: BG.math, char: C.sofia, name: '', music: 'sad', text: 'Кабинет математики. После уроков. Софья Андреевна пишет уравнения.' },
        { bg: BG.math, char: C.dima, name: 'Дима', music: 'sad', text: 'Софья Андреевна, а вы знали Андрея Андреева?' },
        { bg: BG.math, char: C.sofia, name: 'Софья Андреевна', music: 'sad', text: 'Кто тебе это сказал? Андрей был хорошим мальчиком. Но он сломался. А те, кто его сломал, сейчас сидят очень высоко. Забудь это имя, если не хочешь проблем.' },
        { bg: BG.aud, char: C.woman, name: 'Женщина на сцене', music: 'tense', text: 'Актовый зал. — Добро пожаловать. Я вижу новенького. Дима, верно? Поднимись к нам.' },
        { bg: BG.aud, char: C.dima, name: 'Дима', music: 'tense', text: 'Я медленно иду к сцене. Она кладет руку мне на плечо. Ее пальцы ледяные.' },
        { bg: BG.aud, char: C.woman, name: 'Женщина на сцене', music: 'tense', text: 'Расскажи нам, Дима. Ты когда-нибудь чувствовал, что тебя предали? Ищи Андрея в архиве. И передай своей бабушке, Наталье Олеговне, что долг платежом красен.' },
        { bg: BG.hall, char: C.mila, name: 'Мила', music: 'tense', text: 'Я сбегаю со сцены. В коридоре меня хватает за руку Мила. — Дима. Я знаю, кто запер тебя в спортзале. Это был директор. Он забрал ключи у Вачика.' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'tense', text: 'Зачем ему это?' },
        { bg: BG.hall, char: C.mila, name: 'Мила', music: 'tense', text: 'Он боится. И еще… я украла кое-что из его сейфа. Вот. (Она протягивает мне флешку). — Здесь видео. Как Камран передает деньги. И как директор шантажирует его.' },
        { choice: true, name: 'Дима', text: 'Что делать с флешкой?', music: 'tense', options: [ { text: 'Отдать флешку полиции', next: 77 }, { text: 'Найти Камрана', next: 78 } ]},
        { bg: BG.office, char: C.nikolay, name: 'Николай Андреевич', music: 'tense', text: 'Отделение полиции. — Это неполное видео, Дима. Нам нужно больше доказательств.', next: 80 },
        { bg: BG.street, char: C.kamran, name: 'Камран', music: 'sad', text: 'Школьный двор. — Зачем ты мне помогаешь? Директор заставил меня. Он сказал, что если я не передам деньги, он выгонит мою бабушку из школы.', next: 80 },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'climax', sfx: 'scream', text: 'Я иду по пустому коридору. Внезапно экран телефона загорается: «Ты думал, что нашел правду? Ты даже не представляешь, кто настоящий Кукольник. Оглянись».' },
        { bg: BG.hall, char: C.dima, name: 'Дима', music: 'climax', text: 'Я резко оборачиваюсь. В конце темного коридора мелькает тень. Сердце уходит в пятки. КОНЕЦ ЭПИЗОДА 1.' }
      ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 2 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 3 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 4 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 5 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 6 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 7 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 8 в разработке.' } ],
      [ { bg: BG.hall, char: C.dima, name: 'Система', music: 'calm', text: 'Эпизод 9 в разработке.' } ]
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
          <div class="vn-top-row"><div class="vn-speaker">${esc(scene.name)}</div></div>
          <div class="vn-text">${esc(scene.text)}</div>
          <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">${choiceHtml}</div>`;
        return;
      }

      dialogEl.classList.remove('choice-mode');
      bgEl.style.backgroundImage = `url('${scene.bg}')`;
      bgEl.className = 'vn-bg active';
      if (scene.char) { charEl.style.backgroundImage = `url('${scene.char}')`; charEl.classList.add('active'); }
      else charEl.classList.remove('active');
      if ($('#vn-speaker')) $('#vn-speaker').textContent = scene.name;
      if ($('#vn-text')) $('#vn-text').textContent = scene.text;
      if ($('#vn-ep-info')) $('#vn-ep-info').textContent = `Сезон ${vnState.season}, эпизод ${vnState.ep + 1}`;
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
