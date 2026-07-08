// ==== المسار المُبوّب: بوّابة لينة (بلا أقفال) — كل المنطق من TRACK_ORDER ====
// المرجع: docs/phase2-track-spec.md

const TRACK_ORDER = ["school", "rules", "openings", "tactics", "endgames", "play"];
const PASS_THRESHOLD = 70;

const STATIONS = {
  school:   { icon: "♟", group: "أساس",  ar: "المدرسة — حركة القطع", en: "School — how pieces move" },
  rules:    { icon: "♚", group: "أساس",  ar: "القواعد والمات",       en: "Rules & checkmate" },
  openings: { icon: "📖", group: "مهارة", ar: "مبادئ الافتتاح",       en: "Opening principles" },
  tactics:  { icon: "🎯", group: "مهارة", ar: "التكتيكات الأساسية",   en: "Basic tactics" },
  endgames: { icon: "🏁", group: "مهارة", ar: "النهايات الأساسية",    en: "Basic endgames" },
  play:     { icon: "⚔️", group: "تطبيق", ar: "اللعب ضدّ الحاسوب",    en: "Play the computer" },
};

// الموصى بها = أوّل محطة غير مكتملة (bestScore < العتبة)
function getRecommended(track) {
  return TRACK_ORDER.find((id) => ((track[id] && track[id].bestScore) || 0) < PASS_THRESHOLD) || null;
}

// نقاط التحقّق المؤلَّفة (school/rules/openings). tactics حيّة، endgames من الدرِّيلات، play مباراة.
// quiz: choices مصفوفة {ar,en}، answer = فهرس الصحيح (يُخلَط عند العرض).
// position: fen + المطلوب مات في نقلة (أي نقلة تصنع المات تنجح).
const CHECKPOINTS = {
  school: [
    { id: "sch1", type: "quiz", prompt: { ar: "كيف يتحرّك الرخ (القلعة)؟", en: "How does the rook move?" },
      choices: [{ ar: "أفقيًّا وعموديًّا", en: "Horizontally & vertically" }, { ar: "قطريًّا", en: "Diagonally" }, { ar: "على شكل L", en: "In an L-shape" }, { ar: "خطوة واحدة", en: "One square" }], answer: 0,
      hint: { ar: "يتحرّك في خطوط مستقيمة.", en: "It moves in straight lines." } },
    { id: "sch2", type: "quiz", prompt: { ar: "أيّ قطعة تتحرّك على شكل L وتقفز فوق القطع؟", en: "Which piece moves in an L-shape and jumps over pieces?" },
      choices: [{ ar: "الحصان", en: "Knight" }, { ar: "الفيل", en: "Bishop" }, { ar: "الوزير", en: "Queen" }, { ar: "الملك", en: "King" }], answer: 0,
      hint: { ar: "القطعة الوحيدة التي تقفز.", en: "The only piece that jumps." } },
    { id: "sch3", type: "quiz", prompt: { ar: "الفيل يتحرّك...", en: "The bishop moves..." },
      choices: [{ ar: "قطريًّا فقط", en: "Diagonally only" }, { ar: "أفقيًّا فقط", en: "Horizontally only" }, { ar: "للأمام فقط", en: "Forward only" }, { ar: "بأيّ اتجاه", en: "Any direction" }], answer: 0,
      hint: { ar: "يبقى على لون واحد.", en: "It stays on one color." } },
    { id: "sch4", type: "quiz", prompt: { ar: "ما أقوى قطعة (أكثرها حركة)؟", en: "Which piece is the most powerful?" },
      choices: [{ ar: "الوزير", en: "Queen" }, { ar: "الرخ", en: "Rook" }, { ar: "الملك", en: "King" }, { ar: "البيدق", en: "Pawn" }], answer: 0,
      hint: { ar: "تجمع حركة الرخ والفيل.", en: "It combines rook and bishop." } },
    { id: "sch5", type: "quiz", prompt: { ar: "البيدق يأسر (يأكل)...", en: "A pawn captures..." },
      choices: [{ ar: "قطريًّا للأمام", en: "Diagonally forward" }, { ar: "للأمام مستقيمًا", en: "Straight forward" }, { ar: "أفقيًّا", en: "Sideways" }, { ar: "للخلف", en: "Backward" }], answer: 0,
      hint: { ar: "يمشي مستقيمًا لكن يأسر بزاوية.", en: "It moves straight but captures at an angle." } },
  ],
  rules: [
    { id: "rul1", type: "quiz", fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1",
      prompt: { ar: "أوجد الكش مات في نقلة (كش الصفّ الأخير).", en: "Find mate in one (back-rank)." },
      choices: [{ ar: "الرخ إلى a8", en: "Rook to a8" }, { ar: "الرخ إلى a7", en: "Rook to a7" }, { ar: "الملك إلى g1", en: "King to g1" }, { ar: "الرخ إلى a1", en: "Rook to a1" }], answer: 0,
      hint: { ar: "الرخ إلى الصفّ الثامن يحاصر الملك.", en: "Rook to the 8th rank traps the king." } },
    { id: "rul2", type: "quiz", fen: "7k/8/6K1/8/8/8/8/7Q w - - 0 1",
      prompt: { ar: "أوجد الكش مات في نقلة (الوزير يسنده الملك).", en: "Find mate in one (queen supported by king)." },
      choices: [{ ar: "الوزير إلى h7", en: "Queen to h7" }, { ar: "الوزير إلى h4", en: "Queen to h4" }, { ar: "الوزير إلى a1", en: "Queen to a1" }, { ar: "الملك إلى f6", en: "King to f6" }], answer: 0,
      hint: { ar: "الوزير بجوار الملك، محميًّا بملكك.", en: "Queen next to the king, defended by your king." } },
    { id: "rul3", type: "quiz", fen: "7k/R7/1R6/8/8/8/8/7K w - - 0 1",
      prompt: { ar: "أوجد الكش مات في نقلة (سُلّم الرخّين).", en: "Find mate in one (two-rook ladder)." },
      choices: [{ ar: "الرخ إلى b8", en: "Rook to b8" }, { ar: "الرخ إلى b7", en: "Rook to b7" }, { ar: "الرخ إلى a6", en: "Rook to a6" }, { ar: "الملك إلى g1", en: "King to g1" }], answer: 0,
      hint: { ar: "رخّ يغلق الصفّ الثامن والآخر يمنع الهروب.", en: "One rook seals the 8th rank, the other guards the 7th." } },
    { id: "rul4", type: "quiz", prompt: { ar: "ما «الكش مات»؟", en: "What is checkmate?" },
      choices: [{ ar: "الملك مُهدَّد ولا مفرّ له", en: "The king is attacked with no escape" }, { ar: "أسر الوزير", en: "Capturing the queen" }, { ar: "وصول بيدق للنهاية", en: "A pawn reaching the end" }, { ar: "تكرار النقلات", en: "Repeating moves" }], answer: 0,
      hint: { ar: "نهاية المباراة بحصار الملك.", en: "The game ends when the king is trapped." } },
  ],
  openings: [
    { id: "opn1", type: "quiz", prompt: { ar: "ما أهمّ مبدأ في الافتتاح؟", en: "What is the key opening principle?" },
      choices: [{ ar: "السيطرة على المركز وتطوير القطع", en: "Control the center & develop pieces" }, { ar: "إخراج الوزير مبكّرًا", en: "Bring the queen out early" }, { ar: "تحريك بيادق الأطراف", en: "Push the edge pawns" }, { ar: "أسر أيّ بيدق", en: "Grab any pawn" }], answer: 0,
      hint: { ar: "المركز والتطوير أوّلًا.", en: "Center and development first." } },
    { id: "opn2", type: "quiz", prompt: { ar: "أين يُفضَّل أن يكون الملك بعد الافتتاح؟", en: "Where should the king be after the opening?" },
      choices: [{ ar: "مُبيَّتًا في أمان", en: "Castled, safe" }, { ar: "في المركز", en: "In the center" }, { ar: "في صفّ الخصم", en: "In the enemy camp" }, { ar: "متقدّمًا للهجوم", en: "Advanced to attack" }], answer: 0,
      hint: { ar: "التبييت يحمي الملك.", en: "Castling keeps the king safe." } },
    { id: "opn3", type: "quiz", prompt: { ar: "أيّ نقلة افتتاح جيّدة تسيطر على المركز؟", en: "Which good opening move controls the center?" },
      choices: [{ ar: "e4 أو d4", en: "e4 or d4" }, { ar: "a4", en: "a4" }, { ar: "h4", en: "h4" }, { ar: "Na3", en: "Na3" }], answer: 0,
      hint: { ar: "بيدق المركز خطوتين.", en: "A central pawn two squares." } },
    { id: "opn4", type: "quiz", prompt: { ar: "متى تُطوّر قطعك؟", en: "When do you develop your pieces?" },
      choices: [{ ar: "مبكّرًا، الأحصنة والفيلة أوّلًا", en: "Early — knights and bishops first" }, { ar: "بعد تحريك كلّ البيادق", en: "After moving all pawns" }, { ar: "في النهاية فقط", en: "Only in the endgame" }, { ar: "لا تُطوّرها", en: "Don't develop them" }], answer: 0,
      hint: { ar: "القطع الصغيرة تخرج بسرعة.", en: "Minor pieces come out fast." } },
  ],
};

// محطة اللعب: الفوز على هذا المستوى (فهرس في BOTS) يجتاز
const PLAY_TARGET_INDEX = 2; // مستوى «مبتدئ»
