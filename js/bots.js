// ==== مستويات التدريب: 9 مستويات مصمّمة للمتعلّمين ====
// من «عشوائي» تمامًا (يهزمه أي مبتدئ) صعودًا بلطف حتى «متمرّس».
// randProb = احتمال نقلة عشوائية تمامًا (game.js يلعبها مباشرة). المستويات الدنيا
// عشوائية بالكامل تقريبًا كي يستطيع من يتعلّم القواعد للتوّ الفوز والتقدّم.
// skill/depth = قوّة Stockfish حين لا يلعب عشوائيًّا. المُعرّفات (id) تبقى لتوافق الحفظ.
// elo داخلي (لحساب تغيّر تقييم اللاعب وعتبة المدرب فقط) — لا يُعرض؛ نعرض رقم المستوى ووصفه.

const BOT_DEFS = [
  { id: "chick",  elo: 250,  skill: 0,  depth: 1,  randProb: 1.0,  ar: "عشوائي",       en: "Random" },
  { id: "rabbit", elo: 400,  skill: 0,  depth: 1,  randProb: 0.9,  ar: "مبتدئ جدًّا",   en: "Very easy" },
  { id: "panda",  elo: 550,  skill: 0,  depth: 1,  randProb: 0.75, ar: "مبتدئ",         en: "Beginner" },
  { id: "lion",   elo: 700,  skill: 0,  depth: 2,  randProb: 0.55, ar: "سهل",           en: "Easy" },
  { id: "fox",    elo: 900,  skill: 1,  depth: 2,  randProb: 0.4,  ar: "متوسط",         en: "Medium" },
  { id: "owl",    elo: 1100, skill: 2,  depth: 3,  randProb: 0.25, ar: "فوق المتوسط",   en: "Above medium" },
  { id: "wolf",   elo: 1400, skill: 4,  depth: 5,  randProb: 0.12, ar: "صعب",           en: "Hard" },
  { id: "tiger",  elo: 1700, skill: 8,  depth: 8,  randProb: 0.04, ar: "قويّ",          en: "Strong" },
  { id: "dragon", elo: 2000, skill: 14, depth: 12, randProb: 0,    ar: "متمرّس",        en: "Expert" },
];

// ثلاث فئات لونية للميدالية (كل ٣ مستويات فئة)
const TIERS = [
  { bg: "#3f7d5a", glyph: "♟" }, // مستويات سهلة
  { bg: "#3a6ea5", glyph: "♞" }, // متوسطة
  { bg: "#b04a3a", glyph: "♛" }, // متقدّمة
];

const BOTS = BOT_DEFS.map((b, i) => ({ ...b, lvl: i + 1, name: { ar: b.ar, en: b.en } }));

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
