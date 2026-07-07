// ==== نظام التقدم: الملف الشخصي، التقييم، العملة، المتجر، تحدي اليوم ====
/* global BOTS, LANG, t */

const Meta = (() => {
  const KEY = "safari-profile-v1";

  const DEFAULTS = {
    elo: 600,
    bananas: 0,
    stars: {},                 // botId -> 0..3
    stats: { games: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0, bestWinElo: 0, fastestMate: null },
    owned: { board: ["classic"], piece: ["classic"], back: ["safari"] },
    equipped: { board: "classic", piece: "classic", back: "safari" },
    daily: { date: "", done: false },
    puzzles: { solved: [], streak: 0, lastDay: "" },
    badges: [],
    bestRush: 0,
    coordsBest: 0,
    puzzleDiff: "normal",
    history: [],           // آخر المباريات: {d, opp, r, elo?, n}
  };

  let p = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
      const merged = JSON.parse(JSON.stringify(DEFAULTS));
      for (const k of Object.keys(merged)) {
        if (raw[k] !== undefined) {
          if (typeof merged[k] === "object" && !Array.isArray(merged[k])) Object.assign(merged[k], raw[k]);
          else merged[k] = raw[k];
        }
      }
      return merged;
    } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(p)); }

  // ---- التقييم (ELO) ----
  function eloChange(botElo, result /* 1 فوز، 0.5 تعادل، 0 خسارة */) {
    const expected = 1 / (1 + Math.pow(10, (botElo - p.elo) / 400));
    return Math.round(32 * (result - expected));
  }

  // ---- نتيجة مباراة ضد بوت ----
  // تعيد {eloDelta, bananas, stars, newBest}
  function recordBotGame(bot, result, { mate = false, undoUsed = false, moves = 0, dailyChallenge = false } = {}) {
    const delta = eloChange(bot.elo, result);
    p.elo = Math.max(100, p.elo + delta);
    p.stats.games++;
    let bananas = 0;
    let stars = 0;
    if (result === 1) {
      p.stats.wins++;
      p.stats.streak++;
      p.stats.bestStreak = Math.max(p.stats.bestStreak, p.stats.streak);
      p.stats.bestWinElo = Math.max(p.stats.bestWinElo, bot.elo);
      if (mate && (p.stats.fastestMate === null || moves < p.stats.fastestMate)) p.stats.fastestMate = moves;
      bananas = Math.round(bot.elo / 20);
      stars = 1 + (undoUsed ? 0 : 1) + (mate ? 1 : 0);
      if (stars > (p.stars[bot.id] || 0)) p.stars[bot.id] = stars;
    } else if (result === 0.5) {
      p.stats.draws++;
      p.stats.streak = 0;
      bananas = Math.round(bot.elo / 40);
    } else {
      p.stats.losses++;
      p.stats.streak = 0;
    }
    if (dailyChallenge && result === 1) {
      bananas *= 2;
      p.daily.done = true;
    }
    p.bananas += bananas;
    addHistory({ opp: bot.id, r: result, elo: delta, n: moves });
    save();
    return { eloDelta: delta, bananas, stars };
  }

  // ---- سجل المباريات (آخر 30) ----
  function addHistory(entry) {
    p.history.unshift({ d: Date.now(), ...entry });
    if (p.history.length > 30) p.history.length = 30;
    save();
  }

  function botUnlocked(index) {
    if (index <= 0) return true;
    return (p.stars[BOTS[index - 1].id] || 0) >= 1;
  }

  // ---- تحدي اليوم (مبذور بالتاريخ) ----
  function today() { return new Date().toISOString().slice(0, 10); }
  function seededRand(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
    return ((h >>> 0) % 10000) / 10000;
  }
  function dailyChallenge() {
    const d = today();
    if (p.daily.date !== d) { p.daily = { date: d, done: false }; save(); }
    const r1 = seededRand(d + "-bot"), r2 = seededRand(d + "-color");
    return {
      bot: BOTS[Math.floor(r1 * BOTS.length)],
      color: r2 < 0.5 ? "w" : "b",
      done: p.daily.done,
    };
  }

  // ---- الألغاز ----
  function recordPuzzleSolved(id, reward) {
    if (p.puzzles.solved.includes(id)) return 0;
    p.puzzles.solved.push(id);
    // ألغاز lichess بلا حدود — نحد نمو القائمة في التخزين المحلي
    if (p.puzzles.solved.length > 800) p.puzzles.solved = p.puzzles.solved.slice(-400);
    const d = today();
    if (p.puzzles.lastDay !== d) {
      const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
      p.puzzles.streak = p.puzzles.lastDay === yesterday ? p.puzzles.streak + 1 : 1;
      p.puzzles.lastDay = d;
    }
    p.bananas += reward;
    save();
    return reward;
  }

  // ---- المتجر ----
  const SHOP = {
    board: [
      { id: "classic", price: 0,   name: { ar: "خشب السفاري", en: "Safari wood" },   light: "#f3dfae", dark: "#cf9455", frame1: "#8a5c33", frame2: "#7a4f2a" },
      { id: "forest",  price: 120, name: { ar: "غابة خضراء", en: "Green forest" },    light: "#eaefce", dark: "#739552", frame1: "#4c6b38", frame2: "#3d5a2c" },
      { id: "ocean",   price: 180, name: { ar: "محيط أزرق", en: "Blue ocean" },       light: "#dee3e6", dark: "#7a9db2", frame1: "#4a6f85", frame2: "#3a5a6e" },
      { id: "rose",    price: 220, name: { ar: "زهري وردي", en: "Rosy pink" },        light: "#f7e6ea", dark: "#c98aa0", frame1: "#a05e77", frame2: "#8a4c63" },
      { id: "night",   price: 300, name: { ar: "ليل صحراوي", en: "Desert night" },    light: "#b8b4c8", dark: "#5e5878", frame1: "#3e3a52", frame2: "#302c42" },
      { id: "marble",  price: 400, name: { ar: "رخام ملكي", en: "Royal marble" },     light: "#f2efe9", dark: "#a8a29a", frame1: "#6e6862", frame2: "#585450" },
      { id: "ice",     price: 450, name: { ar: "جليد قطبي", en: "Polar ice" },        light: "#e8f4fa", dark: "#8fb8d4", frame1: "#4f7a99", frame2: "#3d6280" },
      { id: "lava",    price: 500, name: { ar: "حمم بركانية", en: "Volcanic lava" },  light: "#f5d7c0", dark: "#b3502e", frame1: "#77301a", frame2: "#5e2413" },
    ],
    piece: [
      { id: "classic", price: 0,   name: { ar: "كلاسيكي", en: "Classic" },       w: "#f9f0dc", b: "#312b27" },
      { id: "golden",  price: 250, name: { ar: "ذهب وفضة", en: "Gold & silver" }, w: "#f0c85a", b: "#8c93a8" },
      { id: "candy",   price: 300, name: { ar: "حلوى", en: "Candy" },            w: "#ffd9e8", b: "#7e4fc4" },
      { id: "jungle",  price: 350, name: { ar: "أدغال", en: "Jungle" },          w: "#d9e8b8", b: "#2e5d3f" },
      { id: "fire",    price: 450, name: { ar: "نار وجليد", en: "Fire & ice" },  w: "#bfe8f5", b: "#c0392b" },
      { id: "royal",   price: 550, name: { ar: "أرجوان ملكي", en: "Royal purple" }, w: "#e8d9f5", b: "#5b2a86" },
    ],
    back: [
      { id: "safari",  price: 0,   name: { ar: "سفاري", en: "Safari" },          v1: "#3d5a45", v2: "#2f4436" },
      { id: "sunset",  price: 150, name: { ar: "غروب", en: "Sunset" },           v1: "#8a4b3a", v2: "#5e2f38" },
      { id: "nightsky",price: 200, name: { ar: "سماء الليل", en: "Night sky" },  v1: "#2c3e63", v2: "#1a2440" },
      { id: "lagoon",  price: 250, name: { ar: "بحيرة", en: "Lagoon" },          v1: "#2b6777", v2: "#1a4451" },
      { id: "savanna", price: 300, name: { ar: "سهول الظهيرة", en: "Noon savanna" }, v1: "#7a6a3a", v2: "#54491f" },
      { id: "volcano", price: 350, name: { ar: "بركان", en: "Volcano" },         v1: "#6e3436", v2: "#471f22" },
    ],
  };

  function buy(kind, id) {
    const item = SHOP[kind].find((i) => i.id === id);
    if (!item || p.owned[kind].includes(id) || p.bananas < item.price) return false;
    p.bananas -= item.price;
    p.owned[kind].push(id);
    save();
    return true;
  }
  function equip(kind, id) {
    if (!p.owned[kind].includes(id)) return false;
    p.equipped[kind] = id;
    save();
    applyCosmetics();
    return true;
  }

  // تطبيق التجميلات على الصفحة
  function applyCosmetics() {
    const b = SHOP.board.find((i) => i.id === p.equipped.board) || SHOP.board[0];
    const bg = SHOP.back.find((i) => i.id === p.equipped.back) || SHOP.back[0];
    const root = document.documentElement.style;
    root.setProperty("--sq-light", b.light);
    root.setProperty("--sq-dark", b.dark);
    root.setProperty("--frame1", b.frame1);
    root.setProperty("--frame2", b.frame2);
    root.setProperty("--bg-mid", bg.v1);
    root.setProperty("--bg-deep", bg.v2);
    // شريط عنوان المتصفح على الجوال يطابق خلفية اللعبة
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", bg.v2);
    document.dispatchEvent(new CustomEvent("cosmetics"));
  }

  function pieceTheme() {
    return SHOP.piece.find((i) => i.id === p.equipped.piece) || SHOP.piece[0];
  }

  // ---- الأوسمة ----
  const BADGES = [
    { id: "first-win",    icon: "🏆", ar: "النصر الأول",     en: "First victory",   arD: "افز بأول مباراة ضد حيوان", enD: "Win your first bot game" },
    { id: "flawless",     icon: "💎", ar: "مثالي",            en: "Flawless",        arD: "افز بثلاث نجوم كاملة", enD: "Win with all 3 stars" },
    { id: "streak-5",     icon: "🔥", ar: "لا يُهزم",         en: "Unstoppable",     arD: "سلسلة 5 انتصارات متتالية", enD: "5-game win streak" },
    { id: "dragon-slayer",icon: "🐲", ar: "قاهر التنين",      en: "Dragon slayer",   arD: "اهزم التنين الناري (2000)", enD: "Beat the fire dragon (2000)" },
    { id: "journey-done", icon: "👑", ar: "أسطورة السفاري",   en: "Safari legend",   arD: "اهزم الحيوانات التسعة كلها", enD: "Beat all nine animals" },
    { id: "puzzle-10",    icon: "🧩", ar: "حلّال الألغاز",    en: "Puzzle solver",   arD: "حل 10 ألغاز", enD: "Solve 10 puzzles" },
    { id: "rush-5",       icon: "⚡", ar: "عدّاء الألغاز",    en: "Puzzle runner",   arD: "سلسلة 5 ألغاز دون خطأ", enD: "Streak of 5 puzzles" },
    { id: "bullet-win",   icon: "🚀", ar: "أسرع من البرق",    en: "Bullet master",   arD: "افز بمباراة برق 1+0", enD: "Win a 1+0 bullet game" },
    { id: "social",       icon: "🤝", ar: "روح اجتماعية",     en: "Social spirit",   arD: "أنهِ مباراة مع صديق عبر رابط", enD: "Finish an online game" },
    { id: "hill-king",    icon: "⛰️", ar: "ملك التلة",        en: "King of the hill",arD: "افز بطور ملك التلة", enD: "Win a King-of-the-Hill game" },
    { id: "banker",       icon: "💰", ar: "ثري السفاري",      en: "Safari tycoon",   arD: "اجمع 500 أناناسة في رصيدك", enD: "Hold 500 pineapples" },
  ];

  // منح وسام إن استحق — يعيد قائمة الأوسمة الجديدة
  function award(ids) {
    const fresh = [];
    for (const id of [].concat(ids)) {
      if (!p.badges.includes(id) && BADGES.some((b) => b.id === id)) {
        p.badges.push(id);
        p.bananas += 50;
        fresh.push(BADGES.find((b) => b.id === id));
      }
    }
    if (fresh.length) save();
    return fresh;
  }
  // فحوص عامة تُستدعى بعد كل حدث
  function autoBadges() {
    const ids = [];
    if (p.stats.wins >= 1) ids.push("first-win");
    if (p.stats.streak >= 5) ids.push("streak-5");
    if ((p.stars["dragon"] || 0) > 0) ids.push("dragon-slayer");
    if (BOTS.every((b) => (p.stars[b.id] || 0) > 0)) ids.push("journey-done");
    if (p.puzzles.solved.length >= 10) ids.push("puzzle-10");
    if (p.bestRush >= 5) ids.push("rush-5");
    if (p.bananas >= 500) ids.push("banker");
    return award(ids);
  }

  return {
    get profile() { return p; },
    save, eloChange, recordBotGame, addHistory, botUnlocked, dailyChallenge,
    recordPuzzleSolved, SHOP, buy, equip, applyCosmetics, pieceTheme,
    BADGES, award, autoBadges,
  };
})();
