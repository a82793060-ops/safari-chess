// ==== مستويات التدريب: 9 مستويات من 400 إلى 2000 ====
// إعدادات القوة: skill = مهارة Stockfish (0-20)، depth = عمق البحث،
// randProb = احتمال نقلة عشوائية (أخطاء متعمدة للمستويات الضعيفة).
// المُعرّفات (id) تبقى ثابتة لتوافق الحفظ؛ الأسماء والصور محايدة.

const BOT_DEFS = [
  { id: "chick",  elo: 400,  skill: 0,  depth: 1,  randProb: 0.35 },
  { id: "rabbit", elo: 600,  skill: 0,  depth: 2,  randProb: 0.2  },
  { id: "panda",  elo: 800,  skill: 1,  depth: 2,  randProb: 0.1  },
  { id: "lion",   elo: 1000, skill: 3,  depth: 3,  randProb: 0.05 },
  { id: "fox",    elo: 1200, skill: 5,  depth: 5,  randProb: 0    },
  { id: "owl",    elo: 1400, skill: 7,  depth: 7,  randProb: 0    },
  { id: "wolf",   elo: 1600, skill: 10, depth: 9,  randProb: 0    },
  { id: "tiger",  elo: 1800, skill: 13, depth: 11, randProb: 0    },
  { id: "dragon", elo: 2000, skill: 16, depth: 13, randProb: 0    },
];

// ثلاث فئات (كل ٣ مستويات فئة): مبتدئ / متوسط / متقدّم
const TIERS = [
  { ar: "مبتدئ",  en: "Beginner",     bg: "#3f7d5a", glyph: "♟" }, // ♟
  { ar: "متوسط",  en: "Intermediate", bg: "#3a6ea5", glyph: "♞" }, // ♞
  { ar: "متقدّم", en: "Advanced",     bg: "#b04a3a", glyph: "♛" }, // ♛
];

const BOTS = BOT_DEFS.map((b, i) => {
  const tier = TIERS[Math.floor(i / 3)];
  const n = (i % 3) + 1;
  return { ...b, name: { ar: `${tier.ar} ${n}`, en: `${tier.en} ${n}` } };
});

// ميدالية مستوى محايدة: قرص بلون الفئة + قطعة شطرنج بيضاء
function levelMedallion(bot) {
  const i = Math.max(0, BOTS.indexOf(bot));
  const tier = TIERS[Math.floor(i / 3)] || TIERS[0];
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="22" fill="${tier.bg}"/>
    <text x="50" y="53" font-size="58" text-anchor="middle" dominant-baseline="central" fill="#fff">${tier.glyph}</text>
  </svg>`;
}
function botAvatar(bot) { return levelMedallion(bot); }
// منصّة تعليمية محايدة: لا حوار للخصم
function botPhrase() { return ""; }
