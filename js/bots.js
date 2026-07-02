// ==== بوتات السفاري: 9 حيوانات من 400 إلى 2000 ====
// لكل بوت: صورة SVG، شخصية، إعدادات قوة المحرك، وجُمل حوارية

function av(bg, inner) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bg}"/>${inner}</svg>`;
}

const AVATARS = {
  // 400 — كتكوت
  chick: av("#bfe3f2", `
    <ellipse cx="50" cy="88" rx="26" ry="6" fill="rgba(0,0,0,.12)"/>
    <circle cx="50" cy="55" r="30" fill="#ffd93b" stroke="#c98a00" stroke-width="3"/>
    <path d="M46 27 Q47 18 54 20 M51 26 Q57 19 62 24" fill="none" stroke="#c98a00" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 60 Q14 55 20 48 Q26 52 28 58 Z" fill="#ffca08" stroke="#c98a00" stroke-width="2.5"/>
    <path d="M78 60 Q86 55 80 48 Q74 52 72 58 Z" fill="#ffca08" stroke="#c98a00" stroke-width="2.5"/>
    <circle cx="40" cy="50" r="4.5" fill="#2b2118"/><circle cx="41.5" cy="48.5" r="1.5" fill="#fff"/>
    <circle cx="60" cy="50" r="4.5" fill="#2b2118"/><circle cx="61.5" cy="48.5" r="1.5" fill="#fff"/>
    <path d="M44 60 L50 68 L56 60 Z" fill="#ff9f1c" stroke="#d97706" stroke-width="2.5" stroke-linejoin="round"/>
    <ellipse cx="33" cy="60" rx="4.5" ry="3" fill="#ffb3a0" opacity=".8"/>
    <ellipse cx="67" cy="60" rx="4.5" ry="3" fill="#ffb3a0" opacity=".8"/>
  `),
  // 600 — أرنب
  rabbit: av("#d8ecd0", `
    <ellipse cx="50" cy="90" rx="26" ry="5" fill="rgba(0,0,0,.12)"/>
    <ellipse cx="38" cy="24" rx="9" ry="20" fill="#f4f1ec" stroke="#8d8378" stroke-width="3"/>
    <ellipse cx="38" cy="26" rx="4" ry="13" fill="#ffb9c8"/>
    <ellipse cx="62" cy="24" rx="9" ry="20" fill="#f4f1ec" stroke="#8d8378" stroke-width="3" transform="rotate(8 62 24)"/>
    <ellipse cx="62" cy="26" rx="4" ry="13" fill="#ffb9c8" transform="rotate(8 62 26)"/>
    <circle cx="50" cy="60" r="28" fill="#f4f1ec" stroke="#8d8378" stroke-width="3"/>
    <circle cx="40" cy="55" r="4.5" fill="#2b2118"/><circle cx="41.5" cy="53.5" r="1.5" fill="#fff"/>
    <circle cx="60" cy="55" r="4.5" fill="#2b2118"/><circle cx="61.5" cy="53.5" r="1.5" fill="#fff"/>
    <path d="M46 64 L50 68 L54 64 Z" fill="#ff8fa3" stroke="#d96580" stroke-width="2"/>
    <rect x="45" y="69" width="10" height="9" rx="2.5" fill="#fff" stroke="#8d8378" stroke-width="2"/>
    <line x1="50" y1="69" x2="50" y2="78" stroke="#8d8378" stroke-width="2"/>
    <path d="M28 62 L16 60 M28 67 L17 69 M72 62 L84 60 M72 67 L83 69" stroke="#8d8378" stroke-width="2" stroke-linecap="round"/>
  `),
  // 800 — باندا
  panda: av("#cde6c3", `
    <ellipse cx="50" cy="90" rx="27" ry="5" fill="rgba(0,0,0,.12)"/>
    <circle cx="26" cy="30" r="12" fill="#2e2a28" stroke="#171412" stroke-width="3"/>
    <circle cx="74" cy="30" r="12" fill="#2e2a28" stroke="#171412" stroke-width="3"/>
    <circle cx="50" cy="56" r="31" fill="#f7f3ec" stroke="#4b443f" stroke-width="3"/>
    <ellipse cx="38" cy="50" rx="10" ry="12" fill="#2e2a28" transform="rotate(-15 38 50)"/>
    <ellipse cx="62" cy="50" rx="10" ry="12" fill="#2e2a28" transform="rotate(15 62 50)"/>
    <circle cx="39" cy="50" r="4" fill="#fff"/><circle cx="40" cy="50" r="2.2" fill="#2b2118"/>
    <circle cx="61" cy="50" r="4" fill="#fff"/><circle cx="60" cy="50" r="2.2" fill="#2b2118"/>
    <ellipse cx="50" cy="66" rx="6" ry="4.5" fill="#2e2a28"/>
    <path d="M50 70 Q50 75 44 76 M50 70 Q50 75 56 76" fill="none" stroke="#4b443f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M40 30 Q45 26 50 30" fill="none" stroke="#4b443f" stroke-width="2" opacity=".3"/>
  `),
  // 1000 — أسد
  lion: av("#ffe0b3", `
    <ellipse cx="50" cy="91" rx="28" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M50 15 L57 25 L68 19 L69 32 L82 31 L77 43 L88 49 L77 55 L82 67 L69 66 L68 79 L57 73 L50 83 L43 73 L32 79 L31 66 L18 67 L23 55 L12 49 L23 43 L18 31 L31 32 L32 19 L43 25 Z"
      fill="#e67e22" stroke="#b35c0e" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="50" cy="50" r="24" fill="#f6c453" stroke="#c8912a" stroke-width="3"/>
    <circle cx="41" cy="44" r="4" fill="#2b2118"/><circle cx="42.3" cy="42.7" r="1.4" fill="#fff"/>
    <circle cx="59" cy="44" r="4" fill="#2b2118"/><circle cx="60.3" cy="42.7" r="1.4" fill="#fff"/>
    <path d="M34 37 L44 39 M66 37 L56 39" stroke="#a9741d" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="50" cy="60" rx="12" ry="9" fill="#fde9c0"/>
    <path d="M46 54 L50 58 L54 54 Z" fill="#8d5524" stroke="#6e401a" stroke-width="2"/>
    <path d="M50 58 L50 62 M50 62 Q46 66 42 64 M50 62 Q54 66 58 64" fill="none" stroke="#6e401a" stroke-width="2.2" stroke-linecap="round"/>
  `),
  // 1200 — ثعلب
  fox: av("#f9d5a7", `
    <ellipse cx="50" cy="90" rx="26" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M22 20 L38 32 L26 44 Z" fill="#e8702a" stroke="#b0501a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M78 20 L62 32 L74 44 Z" fill="#e8702a" stroke="#b0501a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M26 24 L35 31 L29 38 Z" fill="#5a3018"/>
    <path d="M74 24 L65 31 L71 38 Z" fill="#5a3018"/>
    <path d="M50 84 C30 84 20 68 22 50 C24 38 34 30 50 30 C66 30 76 38 78 50 C80 68 70 84 50 84 Z"
      fill="#e8702a" stroke="#b0501a" stroke-width="3"/>
    <path d="M50 84 C38 84 30 74 32 62 L50 56 L68 62 C70 74 62 84 50 84 Z" fill="#fbf1e3"/>
    <path d="M34 48 Q40 44 45 49" fill="none" stroke="#2b2118" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M66 48 Q60 44 55 49" fill="none" stroke="#2b2118" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="50" cy="68" rx="5.5" ry="4.5" fill="#2b2118"/>
    <path d="M43 76 Q50 80 57 76" fill="none" stroke="#b0501a" stroke-width="2.5" stroke-linecap="round"/>
  `),
  // 1400 — بومة
  owl: av("#cfd8ee", `
    <ellipse cx="50" cy="91" rx="27" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M25 30 L33 15 L40 28 M75 30 L67 15 L60 28" fill="#8a6b4f" stroke="#5f4632" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="50" cy="55" rx="31" ry="33" fill="#a5825f" stroke="#5f4632" stroke-width="3"/>
    <path d="M38 74 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="#5f4632" stroke-width="2.5"/>
    <path d="M35 82 q7 -6 15 -1 q8 -5 15 1" fill="none" stroke="#5f4632" stroke-width="2.5" opacity=".6"/>
    <circle cx="38" cy="46" r="13" fill="#fff" stroke="#5f4632" stroke-width="3"/>
    <circle cx="62" cy="46" r="13" fill="#fff" stroke="#5f4632" stroke-width="3"/>
    <circle cx="38" cy="46" r="6" fill="#e8a33d"/><circle cx="38" cy="46" r="3" fill="#2b2118"/>
    <circle cx="62" cy="46" r="6" fill="#e8a33d"/><circle cx="62" cy="46" r="3" fill="#2b2118"/>
    <circle cx="39.5" cy="44" r="1.4" fill="#fff"/><circle cx="63.5" cy="44" r="1.4" fill="#fff"/>
    <path d="M46 58 L50 66 L54 58 Z" fill="#e8a33d" stroke="#b57718" stroke-width="2.5" stroke-linejoin="round"/>
  `),
  // 1600 — ذئب
  wolf: av("#b9c7cf", `
    <ellipse cx="50" cy="90" rx="26" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M24 16 L40 30 L27 42 Z" fill="#6b7b85" stroke="#42525c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M76 16 L60 30 L73 42 Z" fill="#6b7b85" stroke="#42525c" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 86 C31 86 21 70 23 51 C25 39 36 30 50 30 C64 30 75 39 77 51 C79 70 69 86 50 86 Z"
      fill="#8fa2ad" stroke="#42525c" stroke-width="3"/>
    <path d="M50 86 C40 86 33 77 34 65 L50 58 L66 65 C67 77 60 86 50 86 Z" fill="#e9edf0"/>
    <path d="M31 44 L45 50 M69 44 L55 50" stroke="#42525c" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 52 Q41 48 46 52 L44 55 Q40 53 38 55 Z" fill="#f4c430" stroke="#2b2118" stroke-width="1.5"/>
    <path d="M64 52 Q59 48 54 52 L56 55 Q60 53 62 55 Z" fill="#f4c430" stroke="#2b2118" stroke-width="1.5"/>
    <circle cx="41" cy="52.5" r="2" fill="#2b2118"/><circle cx="59" cy="52.5" r="2" fill="#2b2118"/>
    <ellipse cx="50" cy="68" rx="5.5" ry="4.5" fill="#2b2118"/>
    <path d="M44 77 L47 73 L50 77 L53 73 L56 77" fill="none" stroke="#42525c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  // 1800 — نمر
  tiger: av("#ffd9a0", `
    <ellipse cx="50" cy="90" rx="27" ry="5" fill="rgba(0,0,0,.12)"/>
    <circle cx="27" cy="30" r="10" fill="#f28c28" stroke="#b35c0e" stroke-width="3"/>
    <circle cx="27" cy="30" r="4.5" fill="#fde9c0"/>
    <circle cx="73" cy="30" r="10" fill="#f28c28" stroke="#b35c0e" stroke-width="3"/>
    <circle cx="73" cy="30" r="4.5" fill="#fde9c0"/>
    <circle cx="50" cy="56" r="30" fill="#f28c28" stroke="#b35c0e" stroke-width="3"/>
    <path d="M50 27 L50 36 M38 29 L41 38 M62 29 L59 38" stroke="#26201a" stroke-width="4" stroke-linecap="round"/>
    <path d="M21 50 L30 52 M22 60 L30 60 M79 50 L70 52 M78 60 L70 60" stroke="#26201a" stroke-width="4" stroke-linecap="round"/>
    <path d="M34 47 L44 50 M66 47 L56 50" stroke="#7a4a10" stroke-width="3" stroke-linecap="round"/>
    <circle cx="40" cy="53" r="3.8" fill="#2f9e44"/><circle cx="40" cy="53" r="1.8" fill="#2b2118"/>
    <circle cx="60" cy="53" r="3.8" fill="#2f9e44"/><circle cx="60" cy="53" r="1.8" fill="#2b2118"/>
    <ellipse cx="50" cy="68" rx="11" ry="8" fill="#fde9c0"/>
    <path d="M46 64 L50 68 L54 64 Z" fill="#d16a86" stroke="#a34860" stroke-width="2"/>
    <path d="M50 68 L50 71 M50 71 Q45 75 41 72 M50 71 Q55 75 59 72" fill="none" stroke="#7a4a10" stroke-width="2.2" stroke-linecap="round"/>
  `),
  // 2000 — تنين
  dragon: av("#c9b8e8", `
    <ellipse cx="50" cy="91" rx="28" ry="5" fill="rgba(0,0,0,.12)"/>
    <path d="M30 26 C24 14 30 8 36 10 C34 16 36 20 40 24 Z" fill="#f4c430" stroke="#b8860b" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M70 26 C76 14 70 8 64 10 C66 16 64 20 60 24 Z" fill="#f4c430" stroke="#b8860b" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M50 84 C30 84 20 70 22 52 C24 36 35 26 50 26 C65 26 76 36 78 52 C80 70 70 84 50 84 Z"
      fill="#3ea660" stroke="#1f6b3a" stroke-width="3"/>
    <path d="M50 26 L46 18 L50 22 L54 16 L56 24 Z" fill="#2c8a4b" stroke="#1f6b3a" stroke-width="2" stroke-linejoin="round"/>
    <path d="M32 44 L45 48 M68 44 L55 48" stroke="#1f6b3a" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="40" cy="52" rx="5" ry="6" fill="#ffdd57"/><ellipse cx="40" cy="52" rx="1.8" ry="5" fill="#2b2118"/>
    <ellipse cx="60" cy="52" rx="5" ry="6" fill="#ffdd57"/><ellipse cx="60" cy="52" rx="1.8" ry="5" fill="#2b2118"/>
    <ellipse cx="50" cy="70" rx="14" ry="10" fill="#8fd19e"/>
    <circle cx="45" cy="67" r="2.2" fill="#1f6b3a"/><circle cx="55" cy="67" r="2.2" fill="#1f6b3a"/>
    <path d="M42 76 L45 72 L48 76 M52 76 L55 72 L58 76" fill="none" stroke="#1f6b3a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M26 64 Q20 62 22 57 M74 64 Q80 62 78 57" fill="none" stroke="#9db9c9" stroke-width="3" stroke-linecap="round" opacity=".8"/>
  `),
};

// إعدادات القوة: skill = مهارة Stockfish (0-20)، depth = عمق البحث،
// randProb = احتمال نقلة عشوائية (أخطاء متعمدة للمستويات الضعيفة)
const BOTS = [
  {
    id: "chick", elo: 400, skill: 0, depth: 1, randProb: 0.35,
    name: { ar: "الكتكوت الصغير", en: "Peep the Chick" },
    phrases: {
      ar: {
        greet: ["بيب بيب! ما زلت أتعلم!", "أول مرة ألعب... كن لطيفا معي!"],
        capture: ["بيب! أخذت قطعة!", "هل فعلتها صح؟"],
        hurt: ["بيييب! هذا مؤلم!", "ماما دجاجة ساعديني!"],
        check: ["كش! ولا أصدق نفسي!"],
        win: ["بيب بيب! فزت؟! مستحيل!"],
        lose: ["حسنا... سأعود إلى البيضة", "أحسنت! سأتدرب أكثر"],
      },
      en: {
        greet: ["Peep peep! I'm still learning!", "My first game ever... be gentle!"],
        capture: ["Peep! I got a piece!", "Did I do that right?"],
        hurt: ["Peeeep! That hurt!", "Mama hen, help!"],
        check: ["Check! I can't believe it!"],
        win: ["Peep peep! I won?! No way!"],
        lose: ["Okay... back to my egg", "Well played! I'll practice more"],
      },
    },
  },
  {
    id: "rabbit", elo: 600, skill: 0, depth: 2, randProb: 0.2,
    name: { ar: "الأرنب القافز", en: "Hopper the Rabbit" },
    phrases: {
      ar: {
        greet: ["أحب القفز فوق الرقعة!", "هيا نلعب بسرعة بسرعة!"],
        capture: ["قفزة وخطفتها!", "جزرة لذيذة... أقصد قطعة!"],
        hurt: ["آاو! أذناي ترتجفان!", "هذا ليس عدلا!"],
        check: ["كش! قفزت عليك!"],
        win: ["قفزت إلى النصر!"],
        lose: ["سأقفز بعيدا الآن...", "لعبت بذكاء، أعترف!"],
      },
      en: {
        greet: ["I love hopping across the board!", "Let's play fast fast fast!"],
        capture: ["Hop and snatch!", "Yummy carrot... I mean, piece!"],
        hurt: ["Ouch! My ears are shaking!", "That's not fair!"],
        check: ["Check! Hopped right onto you!"],
        win: ["I hopped my way to victory!"],
        lose: ["I'll hop away now...", "Clever play, I admit!"],
      },
    },
  },
  {
    id: "panda", elo: 800, skill: 1, depth: 2, randProb: 0.1,
    name: { ar: "الباندا الهادئ", en: "Bamboo the Panda" },
    phrases: {
      ar: {
        greet: ["الشطرنج مثل الخيزران... يحتاج صبرا", "سألعب بهدوء تام"],
        capture: ["بهدوء... أخذتها", "قضمة صغيرة من جيشك"],
        hurt: ["همم... سأتظاهر أن هذا لم يحدث", "حتى الباندا تتألم أحيانا"],
        check: ["كش... بكل هدوء"],
        win: ["الهدوء ينتصر دائما"],
        lose: ["سأعود إلى قيلولتي...", "خسرت بهدوء أيضا"],
      },
      en: {
        greet: ["Chess is like bamboo... it takes patience", "I shall play calmly"],
        capture: ["Calmly... taken", "A little nibble of your army"],
        hurt: ["Hmm... I'll pretend that didn't happen", "Even pandas feel pain"],
        check: ["Check... ever so calmly"],
        win: ["Calm always wins"],
        lose: ["Back to my nap...", "I lose calmly too"],
      },
    },
  },
  {
    id: "lion", elo: 1000, skill: 3, depth: 3, randProb: 0.05,
    name: { ar: "الأسد ملك الغابة", en: "Roar the Lion King" },
    phrases: {
      ar: {
        greet: ["أنا ملك الغابة وملك الرقعة!", "اركع أمام الملك... أو العب!"],
        capture: ["فريسة سهلة!", "الأسد لا يرحم!"],
        hurt: ["من يجرؤ على مس الملك؟!", "زئييير!"],
        check: ["كش! اسمع زئيري!"],
        win: ["الملك ينتصر كالعادة!"],
        lose: ["حتى الملوك يخسرون... أحيانا", "لقد استحققت اللقب اليوم"],
      },
      en: {
        greet: ["King of the jungle, king of the board!", "Bow before the king... or play!"],
        capture: ["Easy prey!", "The lion shows no mercy!"],
        hurt: ["Who dares touch the king?!", "ROAAAR!"],
        check: ["Check! Hear my roar!"],
        win: ["The king wins, as always!"],
        lose: ["Even kings lose... sometimes", "You've earned the crown today"],
      },
    },
  },
  {
    id: "fox", elo: 1200, skill: 5, depth: 5, randProb: 0,
    name: { ar: "الثعلب المكار", en: "Sly the Fox" },
    phrases: {
      ar: {
        greet: ["لدي خطة ماكرة... كالعادة", "احذر... كل نقلة لها هدف خفي"],
        capture: ["وقعت في الفخ!", "خدعة ثعلبية كلاسيكية"],
        hurt: ["ذكي... لكن ليس بما يكفي", "لم أتوقع هذه!"],
        check: ["كش! ألم تر ذلك قادما؟"],
        win: ["الدهاء يفوز على القوة"],
        lose: ["خدعتني... أنا الثعلب!", "مكر يفوق مكري!"],
      },
      en: {
        greet: ["I have a cunning plan... as always", "Careful... every move has a hidden motive"],
        capture: ["You fell for it!", "A classic fox trick"],
        hurt: ["Clever... but not clever enough", "Didn't see that one!"],
        check: ["Check! Didn't see it coming?"],
        win: ["Cunning beats strength"],
        lose: ["You outfoxed the fox!", "Trickery beyond my own!"],
      },
    },
  },
  {
    id: "owl", elo: 1400, skill: 7, depth: 7, randProb: 0,
    name: { ar: "البومة الحكيمة", en: "Sage the Owl" },
    phrases: {
      ar: {
        greet: ["درست هذه اللعبة ثلاثمئة عام", "الحكمة تسبق النقلة"],
        capture: ["كما هو مكتوب في كتبي", "نتيجة حتمية للحسابات"],
        hurt: ["مثير للاهتمام... سأدون هذا", "لم تذكر الكتب هذه النقلة!"],
        check: ["كش. تأمل وضعك جيدا"],
        win: ["المعرفة قوة، كما ترى"],
        lose: ["سأضيف مباراتك إلى مكتبتي", "تعلمت منك درسا جديدا"],
      },
      en: {
        greet: ["I've studied this game for three hundred years", "Wisdom precedes the move"],
        capture: ["Just as my books foretold", "An inevitable calculation"],
        hurt: ["Fascinating... I shall take notes", "The books never mentioned that move!"],
        check: ["Check. Contemplate your position"],
        win: ["Knowledge is power, you see"],
        lose: ["Your game goes into my library", "You've taught me a new lesson"],
      },
    },
  },
  {
    id: "wolf", elo: 1600, skill: 10, depth: 9, randProb: 0,
    name: { ar: "الذئب الشرس", en: "Storm the Wolf" },
    phrases: {
      ar: {
        greet: ["القطيع كله يشاهدك الآن", "أصطاد الأخطاء... لا القطع"],
        capture: ["انقضاض!", "هكذا يصطاد الذئب"],
        hurt: ["عواء! ضربة موجعة", "القطيع لن يسمع بهذا"],
        check: ["كش! لا مهرب من الذئب"],
        win: ["الصيد انتهى"],
        lose: ["سأعود مع القطيع كله!", "صياد أفضل مني... نادر"],
      },
      en: {
        greet: ["The whole pack is watching you", "I hunt mistakes... not pieces"],
        capture: ["Pounce!", "That's how a wolf hunts"],
        hurt: ["Awooo! That stung", "The pack must never hear of this"],
        check: ["Check! No escaping the wolf"],
        win: ["The hunt is over"],
        lose: ["I'll return with the whole pack!", "A better hunter than me... rare"],
      },
    },
  },
  {
    id: "tiger", elo: 1800, skill: 13, depth: 11, randProb: 0,
    name: { ar: "النمر المخطط", en: "Stripes the Tiger" },
    phrases: {
      ar: {
        greet: ["كل خط في فروي يمثل خصما هزمته", "أتحرك في صمت... وأضرب بدقة"],
        capture: ["ضربة مخلب واحدة تكفي", "دقة النمر لا تخطئ"],
        hurt: ["جرح سطحي... لا أكثر", "أول من يجرحني منذ زمن"],
        check: ["كش! المخالب اقتربت"],
        win: ["خط جديد يضاف إلى فروي"],
        lose: ["اليوم... أنت النمر", "سأتذكر هذه الرقعة جيدا"],
      },
      en: {
        greet: ["Every stripe is an opponent I've beaten", "I move in silence... and strike with precision"],
        capture: ["One claw strike is enough", "Tiger precision never misses"],
        hurt: ["A surface scratch... nothing more", "First to wound me in ages"],
        check: ["Check! The claws are closing in"],
        win: ["A new stripe for my fur"],
        lose: ["Today... you are the tiger", "I shall remember this board"],
      },
    },
  },
  {
    id: "dragon", elo: 2000, skill: 16, depth: 13, randProb: 0,
    name: { ar: "التنين الناري", en: "Blaze the Dragon" },
    phrases: {
      ar: {
        greet: ["قلة من وصلوا إلى عريني... وأقل من غادروه منتصرين", "النار في انتظار نقلتك الأولى"],
        capture: ["رماد!", "النيران لا تبقي شيئا"],
        hurt: ["شرارة جريئة منك!", "أخيرا... خصم يستحق ناري"],
        check: ["كش! اشعر بحرارة اللهب"],
        win: ["عد عندما تحترف اللعب مع التنانين"],
        lose: ["أسطورة جديدة تولد اليوم...", "أنحني لك... وهذا نادر جدا"],
      },
      en: {
        greet: ["Few reach my lair... fewer leave victorious", "The fire awaits your first move"],
        capture: ["Ashes!", "Flames leave nothing behind"],
        hurt: ["A bold spark from you!", "At last... a foe worthy of my fire"],
        check: ["Check! Feel the heat of the flame"],
        win: ["Return when you've mastered dragon chess"],
        lose: ["A new legend is born today...", "I bow to you... a very rare sight"],
      },
    },
  },
];

function botAvatar(bot) { return AVATARS[bot.id]; }
function botPhrase(bot, kind) {
  const list = bot.phrases[LANG]?.[kind] || bot.phrases.ar[kind] || [];
  return list[Math.floor(Math.random() * list.length)] || "";
}
