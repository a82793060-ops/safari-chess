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
  tactics: [
    { id: "tac1", type: "quiz", fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
      prompt: { ar: "الأبيض يلعب. أوجد نقلة الحصان التي تشوك الملك والرخ معًا.", en: "White to move. Find the knight move that forks the king and the rook." },
      choices: [{ ar: "الحصان إلى c7", en: "Knight to c7" }, { ar: "الحصان إلى f6", en: "Knight to f6" }, { ar: "الحصان إلى b6", en: "Knight to b6" }, { ar: "الحصان إلى c3", en: "Knight to c3" }], answer: 0,
      hint: { ar: "ابحث عن مربّع يهاجم منه الحصان القطعتين في آنٍ واحد.", en: "Find a square from which the knight hits both pieces at once." } },
    { id: "tac2", type: "quiz", fen: "3q1rk1/8/5n2/8/8/8/8/2B3K1 w - - 0 1",
      prompt: { ar: "أوجد النقلة التي تُثبّت حصان الأسود (يعجز عن الحركة لأنّ خلفه الوزير).", en: "Find the move that pins Black's knight (it can't move — the queen is behind it)." },
      choices: [{ ar: "الفيل إلى g5", en: "Bishop to g5" }, { ar: "الفيل إلى h6", en: "Bishop to h6" }, { ar: "الفيل إلى f4", en: "Bishop to f4" }, { ar: "الفيل إلى e3", en: "Bishop to e3" }], answer: 0,
      hint: { ar: "ضع الفيل على القطر الذي يصطفّ فيه الحصان مع الوزير.", en: "Put the bishop on the diagonal where the knight lines up with the queen." } },
    { id: "tac3", type: "quiz", fen: "R7/8/8/4k3/8/1K6/8/4r3 w - - 0 1",
      prompt: { ar: "أوجد السيخ: كِش الملك على العمود e فيهرب، ثم تكسب الرخ خلفه.", en: "Find the skewer: check the king down the e-file, it moves, then you win the rook behind it." },
      choices: [{ ar: "الرخ إلى e8 كِش", en: "Rook to e8, check" }, { ar: "الرخ إلى a5 كِش", en: "Rook to a5, check" }, { ar: "الرخ إلى a1", en: "Rook to a1" }, { ar: "الملك إلى c4", en: "King to c4" }], answer: 0,
      hint: { ar: "كِش الملك على نفس عمود الرخ الأسود.", en: "Check the king along the same file as the black rook." } },
    { id: "tac4", type: "quiz", fen: "3r3k/8/8/4N3/8/8/8/6K1 w - - 0 1",
      prompt: { ar: "أوجد نقلة الحصان التي تشوك الملك في الزاوية والرخ معًا.", en: "Find the knight move that forks the cornered king and the rook." },
      choices: [{ ar: "الحصان إلى f7 كِش", en: "Knight to f7, check" }, { ar: "الحصان إلى g6 كِش", en: "Knight to g6, check" }, { ar: "الحصان إلى c6", en: "Knight to c6" }, { ar: "الحصان إلى d7", en: "Knight to d7" }], answer: 0,
      hint: { ar: "مربّع واحد يهاجم الملك في الزاوية والرخ في آنٍ واحد.", en: "One square attacks both the cornered king and the rook." } },
    { id: "tac5", type: "quiz",
      prompt: { ar: "قطعة تهاجم قطعتين للخصم في آنٍ واحد — ماذا تُسمّى هذه الحيلة؟", en: "One piece attacks two enemy pieces at once — what is this tactic called?" },
      choices: [{ ar: "الشوكة", en: "Fork" }, { ar: "التثبيت", en: "Pin" }, { ar: "السيخ", en: "Skewer" }, { ar: "التبييت", en: "Castling" }], answer: 0,
      hint: { ar: "الحصان بارع فيها بخاصّة.", en: "The knight is especially good at it." } },
  ],
  endgames: [
    { id: "end1", type: "quiz", fen: "6k1/8/6K1/8/8/8/8/R7 w - - 0 1",
      prompt: { ar: "الملكان متقابلان. أوجد الكِش مات في نقلة بالرخ.", en: "The kings face off. Find mate in one with the rook." },
      choices: [{ ar: "الرخ إلى a8 مات", en: "Rook to a8, mate" }, { ar: "الرخ إلى a7", en: "Rook to a7" }, { ar: "الملك إلى f6", en: "King to f6" }, { ar: "الرخ إلى b1", en: "Rook to b1" }], answer: 0,
      hint: { ar: "الرخ يكِش على الصفّ الثامن، وملكك يمنع الهروب.", en: "The rook checks on the 8th rank; your king blocks the escape." } },
    { id: "end2", type: "quiz", fen: "4k3/8/8/7P/8/8/8/4K3 b - - 0 1",
      prompt: { ar: "البيدق الأبيض على h5 والدور للأسود. هل يلحق ملك الأسود بالبيدق قبل أن يتوّج؟", en: "White's pawn is on h5, Black to move. Can Black's king catch the pawn before it promotes?" },
      choices: [{ ar: "نعم، يدخل «مربّع البيدق» ويوقفه", en: "Yes — it steps into the pawn's square and stops it" }, { ar: "لا، يتوّج البيدق حتمًا", en: "No — the pawn promotes for sure" }, { ar: "فقط إذا ساعده الملك الأبيض", en: "Only if the white king helps" }, { ar: "البيدق لا يتوّج أبدًا", en: "A pawn never promotes" }], answer: 0,
      hint: { ar: "ارسم مربّعًا من البيدق إلى صفّ التتويج؛ إن دخله الملك أدركه.", en: "Draw a square from the pawn to the promotion rank; if the king is inside it, it catches the pawn." } },
    { id: "end3", type: "quiz",
      prompt: { ar: "في نهاية ملك وبيدق ضدّ ملك، ما المفهوم الذي يعتمده الملك القويّ ليشقّ طريق التتويج؟", en: "In a king-and-pawn versus king endgame, which idea does the stronger side use to clear the way to promote?" },
      choices: [{ ar: "المُعارضة (مواجهة ملك الخصم بمربّع فاصل)", en: "Opposition (facing the enemy king with one square between)" }, { ar: "دفع البيدق بأقصى سرعة", en: "Pushing the pawn as fast as possible" }, { ar: "التضحية بالبيدق", en: "Sacrificing the pawn" }, { ar: "إبقاء الملك في مكانه", en: "Keeping the king still" }], answer: 0,
      hint: { ar: "الأمر يتعلّق بمواجهة الملكين، لا بسرعة البيدق.", en: "It's about the two kings facing off, not pawn speed." } },
    { id: "end4", type: "quiz",
      prompt: { ar: "وصل بيدقك إلى الصفّ الأخير. إلى أيّ قطعة تُرقّيه عادةً لتفوز؟", en: "Your pawn reaches the last rank. Which piece do you usually promote it to?" },
      choices: [{ ar: "الوزير — أقوى قطعة", en: "Queen — the strongest piece" }, { ar: "الحصان دائمًا", en: "Always a knight" }, { ar: "الفيل", en: "A bishop" }, { ar: "يبقى بيدقًا", en: "It stays a pawn" }], answer: 0,
      hint: { ar: "اختر الأقوى إلّا في حالات نادرة جدًّا.", en: "Pick the strongest, except in very rare cases." } },
  ],
};

// محطة اللعب: الفوز على هذا المستوى (فهرس في BOTS) يجتاز
const PLAY_TARGET_INDEX = 2; // مستوى «مبتدئ»
