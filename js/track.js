// ==== المسار المُبوّب: بوّابة لينة (بلا أقفال) — كل المنطق من TRACK_ORDER ====
// المرجع: docs/phase2-track-spec.md + محتوى نقاط التحقّق التفاعلية (Phase 2).
// نقاط التحقّق تفاعلية: يلعب المتعلّم النقلة على رقعة مصغّرة، ويُتحقَّق منها بـchess.js.
// المفاتيح الداخلية (school…play) تبقى لتوافق الحفظ — النصوص المعروضة تُترجم في مكانها.

const TRACK_ORDER = ["school", "rules", "openings", "tactics", "endgames", "play"];
const PASS_RATIO = 0.7; // تُكمل المحطة عند اجتياز ≥70٪ من نقاطها (٤ من ٥)

const STATIONS = {
  school:   { icon: "♟", group: "أساس",  ar: "المدرسة — حركة القطع", en: "School — how pieces move",
    info: { ar: "البيدق يتقدّم للأمام ويأسر قطريًّا، الرخ يتحرّك مستقيمًا، الفيل قطريًّا، الحصان يقفز على شكل L، الوزير يجمع الرخ والفيل، والملك خطوة واحدة. نقلات خاصّة: الترقية (بيدق يبلغ النهاية يصير وزيرًا)، التبييت (تحصين الملك بالرخ)، والأخذ بالمرور «en passant» (إن تقدّم بيدق الخصم خطوتين وحاذى بيدقك، جاز أسره وكأنّه تقدّم خطوة واحدة، في النقلة التالية فقط).",
           en: "The pawn advances forward and captures diagonally, the rook moves straight, the bishop diagonally, the knight in an L, the queen combines rook and bishop, and the king one square. Special moves: promotion, castling, and en passant (if an enemy pawn advances two squares beside yours, you may capture it as if it moved one — only on the very next move)." } },
  rules:    { icon: "♚", group: "أساس",  ar: "القواعد والمات",       en: "Rules & checkmate",
    info: { ar: "الكِش: الملك مُهدَّد ويجب ردّ التهديد. الكِش مات: تهديد للملك لا مفرّ منه — تنتهي المباراة. الجمود «stalemate»: لا توجد نقلة قانونية والملك غير مُهدَّد — تعادل. أنماط مات شائعة: الصفّ الأخير، ومات الملك+الوزير، ومات الرخّين (السلّم).",
           en: "Check: the king is attacked and the threat must be answered. Checkmate: an attack on the king with no escape — the game ends. Stalemate: no legal move while the king is not in check — a draw. Common mates: back-rank, king+queen, and the two-rook ladder." } },
  openings: { icon: "📖", group: "مهارة", ar: "مبادئ الافتتاح",       en: "Opening principles",
    info: { ar: "ثلاثة مبادئ: سيطر على المركز (بيادق e/d)، طوّر الأحصنة والفيلة بسرعة نحو المركز، وبيّت مبكّرًا لتأمين الملك. لا تُخرج الوزير مبكّرًا، ولا تحرّك القطعة نفسها مرّتين قبل تطوير البقيّة.",
           en: "Three principles: control the center (e/d pawns), develop knights and bishops quickly toward the center, and castle early for king safety. Don't bring the queen out early, and don't move the same piece twice before developing the rest." } },
  tactics:  { icon: "🎯", group: "مهارة", ar: "التكتيكات الأساسية",   en: "Basic tactics",
    info: { ar: "الشوكة: قطعة تهاجم قطعتين معًا (الحصان بارع فيها). التثبيت «pin»: قطعة لا تستطيع التحرّك لأنّ خلفها قطعة أهمّ (أو الملك). السيخ «skewer»: كالتثبيت لكن الأهمّ في الأمام فيُجبَر على التحرّك فتكسب ما خلفه. الهجوم المزدوج: تهديد هدفين بنقلة واحدة. القطعة السائبة «hanging»: قطعة غير محميّة يمكن أسرها مجّانًا.",
           en: "Fork: one piece attacks two at once (the knight excels). Pin: a piece can't move because a more valuable one (or the king) is behind it. Skewer: like a pin but the valuable piece is in front and must move, so you win what's behind. Double attack: threatening two targets in one move. Hanging piece: an undefended piece you can capture for free." } },
  endgames: { icon: "🏁", group: "مهارة", ar: "النهايات الأساسية",    en: "Basic endgames",
    info: { ar: "رقِّ بيدقك إلى وزير لتفوز. للمات على الحافة استخدم الملك+الوزير أو الملك+الرخ (ملكك يمنع الهروب). «مربّع البيدق»: ارسم مربّعًا من البيدق إلى صفّ الترقية؛ إن دخله ملك الخصم أدرك البيدق، وإلّا تُوِّج. المعارضة: مواجهة ملك الخصم بمربّع فاصل لشقّ الطريق.",
           en: "Promote your pawn to a queen to win. To mate on the edge use king+queen or king+rook (your king blocks the escape). Square of the pawn: draw a box from the pawn to the promotion rank; if the enemy king steps inside it, it catches the pawn — otherwise it promotes. Opposition: face the enemy king with one square between to break through." } },
  play:     { icon: "⚔️", group: "تطبيق", ar: "اللعب ضدّ الحاسوب",    en: "Play the computer",
    info: { ar: "طبّق ما تعلّمت في مباراة كاملة: سيطر على المركز، طوّر قطعك، بيّت، ابحث عن التكتيكات، ولا تترك قطعك سائبة. أهداف المحطة تُرصد تلقائيًّا من نتائج مبارياتك.",
           en: "Apply what you learned in a full game: control the center, develop, castle, look for tactics, and don't leave pieces hanging. This station's goals are tracked automatically from your game results." } },
};

// بنية نقطة التحقّق: { id, prompt:{ar,en}, fen, solution:"from-to[=Q]", accept:[...], hint:{ar,en} }
// solution/accept بأحرف لاتينية صغيرة؛ ترقية "=Q"، تبييت قصير "e1-g1".
const CHECKPOINTS = {
  school: [
    { id: "sch1", fen: "k7/8/8/8/8/8/4P3/K7 w - - 0 1", solution: "e2-e4", accept: ["e2-e3"],
      prompt: { ar: "حرّك البيدق خطوة أو خطوتين للأمام.", en: "Move the pawn one or two squares forward." },
      hint: { ar: "البيدق يتقدّم للأمام فقط.", en: "A pawn only advances forward." } },
    { id: "sch2", fen: "k7/3p4/8/8/3R4/8/8/K7 w - - 0 1", solution: "d4-d7", accept: [],
      prompt: { ar: "الرخ يتحرّك أفقيًّا ورأسيًّا — التقط البيدق الأسود.", en: "The rook moves in straight lines — capture the black pawn." },
      hint: { ar: "خطوط مستقيمة على نفس العمود.", en: "Straight up the same file." } },
    { id: "sch3", fen: "k7/8/7p/8/8/8/8/K1B5 w - - 0 1", solution: "c1-h6", accept: [],
      prompt: { ar: "الفيل يتحرّك قطريًّا — التقط البيدق.", en: "The bishop moves diagonally — capture the pawn." },
      hint: { ar: "تتبّع القطر حتى الهدف.", en: "Follow the diagonal to the target." } },
    { id: "sch4", fen: "k7/8/5p2/8/4N3/8/8/K7 w - - 0 1", solution: "e4-f6", accept: [],
      prompt: { ar: "الحصان يقفز على شكل L — التقط البيدق.", en: "The knight jumps in an L-shape — capture the pawn." },
      hint: { ar: "خطوتان ثمّ خطوة جانبية.", en: "Two squares then one to the side." } },
    { id: "sch5", fen: "k7/6p1/8/8/3Q4/8/8/K7 w - - 0 1", solution: "d4-g7", accept: [],
      prompt: { ar: "الوزير يجمع حركة الرخ والفيل — التقط البيدق قطريًّا.", en: "The queen combines rook and bishop — capture the pawn diagonally." },
      hint: { ar: "الوزير أقوى قطعة حركةً.", en: "The queen is the most mobile piece." } },
  ],
  rules: [
    { id: "rul1", fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1", solution: "a1-a8", accept: [],
      prompt: { ar: "مات الصفّ الأخير: أعطِ المات بالرخ.", en: "Back-rank mate: deliver mate with the rook." },
      hint: { ar: "الملك محاصَر ببيادقه.", en: "The king is trapped by its own pawns." } },
    { id: "rul2", fen: "k7/8/1K6/8/8/8/8/7Q w - - 0 1", solution: "h1-h8", accept: [],
      prompt: { ar: "مات في الزاوية بالوزير مع دعم الملك.", en: "Corner mate with the queen, supported by the king." },
      hint: { ar: "ملكك يغطّي مربّعات الهروب.", en: "Your king covers the escape squares." } },
    { id: "rul3", fen: "7k/8/6KQ/8/8/8/8/8 w - - 0 1", solution: "h6-h7", accept: [],
      prompt: { ar: "مات الوزير المدعوم بجوار الملك.", en: "Supported-queen mate right next to the king." },
      hint: { ar: "الوزير بجانب الملك مباشرةً.", en: "The queen goes right beside the king." } },
    { id: "rul4", fen: "4k3/R7/8/8/8/8/8/1R2K3 w - - 0 1", solution: "b1-b8", accept: [],
      prompt: { ar: "مات الرخّين (السلّم).", en: "Two-rook (ladder) mate." },
      hint: { ar: "رخٌّ يقصّ الصفّ، وآخر يعطي المات.", en: "One rook seals a rank, the other mates." } },
    { id: "rul5", fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1", solution: "h1-h8", accept: [],
      prompt: { ar: "مات الملك والرخ في الزاوية.", en: "King-and-rook mate in the corner." },
      hint: { ar: "ملكك يمنع الهروب.", en: "Your king blocks the escape." } },
  ],
  openings: [
    { id: "opn1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e2-e4", accept: ["d2-d4"],
      prompt: { ar: "افتح بالسيطرة على المركز — حرّك بيدق المركز خطوتين.", en: "Open by controlling the center — push a central pawn two squares." },
      hint: { ar: "المركز أهمّ رقعة.", en: "The center is the key ground." } },
    { id: "opn2", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", solution: "g1-f3", accept: ["b1-c3"],
      prompt: { ar: "طوّر حصانًا نحو المركز.", en: "Develop a knight toward the center." },
      hint: { ar: "الحصان على f3 يهاجم e5.", en: "A knight on f3 hits e5." } },
    { id: "opn3", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", solution: "f1-c4", accept: ["f1-b5"],
      prompt: { ar: "طوّر الفيل إلى مربّع نشط.", en: "Develop the bishop to an active square." },
      hint: { ar: "صوّب الفيل نحو المركز/الملك.", en: "Aim the bishop at the center/king." } },
    { id: "opn4", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5", solution: "e1-g1", accept: [],
      prompt: { ar: "حصّن ملكك — قم بالتبييت القصير.", en: "Safeguard your king — castle kingside." },
      hint: { ar: "أمان الملك أولوية مبكّرة.", en: "King safety is an early priority." } },
    { id: "opn5", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5", solution: "b1-c3", accept: [],
      prompt: { ar: "أكمل تطوير قطعك — طوّر الحصان الآخر.", en: "Finish developing — bring out the other knight." },
      hint: { ar: "لا تحرّك القطعة نفسها مرّتين قبل تطوير البقيّة.", en: "Don't move the same piece twice before the rest are out." } },
  ],
  tactics: [
    { id: "tac1", fen: "4k3/8/8/5q2/4N3/8/8/4K3 w - - 0 1", solution: "e4-d6", accept: [],
      prompt: { ar: "شوكة الحصان: هاجم الملك والوزير معًا.", en: "Knight fork: attack the king and queen at once." },
      hint: { ar: "مربّع يهاجم القطعتين.", en: "A square that hits both pieces." } },
    { id: "tac2", fen: "4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1", solution: "d4-d5", accept: [],
      prompt: { ar: "القطعة مربوطة (تثبيت) — هاجمها لتكسبها.", en: "The piece is pinned — attack it to win it." },
      hint: { ar: "الحصان لا يستطيع الفرار.", en: "The knight cannot run away." } },
    { id: "tac3", fen: "q6k/8/8/8/8/8/8/1R4K1 w - - 0 1", solution: "b1-b8", accept: [],
      prompt: { ar: "سيخ: كِشّ الملك ليتحرّك فتكسب الوزير خلفه.", en: "Skewer: check the king so it moves, then win the queen behind it." },
      hint: { ar: "الملك أمام الوزير على نفس الصفّ.", en: "The king is in front of the queen on the same file." } },
    { id: "tac4", fen: "r5k1/4n3/8/8/8/8/8/4Q1K1 w - - 0 1", solution: "e1-e4", accept: [],
      prompt: { ar: "هجوم مزدوج: حرّك الوزير ليهدّد قطعتين.", en: "Double attack: move the queen to threaten two pieces." },
      hint: { ar: "قطر يهدّد الرخ، وعمود يهدّد الحصان.", en: "A diagonal hits the rook, a file hits the knight." } },
    { id: "tac5", fen: "4k3/8/8/7q/4N3/8/4R3/4K3 w - - 0 1", solution: "e4-f6", accept: [],
      prompt: { ar: "كشف: حرّك الحصان ليكشف كِشّ الرخ ويهاجم الوزير.", en: "Discovered attack: move the knight to unveil the rook's check and hit the queen." },
      hint: { ar: "الحصان يفتح خطّ الرخ ويضرب الوزير.", en: "The knight opens the rook's line and strikes the queen." } },
  ],
  endgames: [
    { id: "end1", fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1", solution: "e7-e8=Q", accept: [],
      prompt: { ar: "رقِّ البيدق إلى وزير.", en: "Promote the pawn to a queen." },
      hint: { ar: "لا شيء يمنع الترقية.", en: "Nothing stops the promotion." } },
    { id: "end2", fen: "5k2/8/5K2/8/8/8/8/1Q6 w - - 0 1", solution: "b1-b8", accept: [],
      prompt: { ar: "مات الملك والوزير — استخدم دعم ملكك.", en: "King-and-queen mate — use your king's support." },
      hint: { ar: "ملكك يغطّي صفّ الهروب.", en: "Your king covers the escape rank." } },
    { id: "end3", fen: "5k2/8/5K2/8/8/8/8/1R6 w - - 0 1", solution: "b1-b8", accept: [],
      prompt: { ar: "مات الملك والرخ.", en: "King-and-rook mate." },
      hint: { ar: "نفس فكرة الوزير لكن بالرخ.", en: "Same idea as the queen, but with the rook." } },
    { id: "end4", fen: "k7/2P5/1K6/8/8/8/8/8 w - - 0 1", solution: "c7-c8=Q", accept: [],
      prompt: { ar: "رقِّ البيدق وأعطِ المات في آنٍ واحد.", en: "Promote and deliver mate at the same time." },
      hint: { ar: "الترقية تصنع المات فورًا بدعم ملكك.", en: "The new queen mates at once, backed by your king." } },
    { id: "end5", fen: "6k1/P7/8/8/8/8/8/6K1 w - - 0 1", solution: "a7-a8=Q", accept: [],
      prompt: { ar: "سابق الملك الأسود — رقِّ بيدقك الحرّ.", en: "Outrun the black king — promote your passed pawn." },
      hint: { ar: "الملك الأسود بعيد جدًّا.", en: "The black king is too far away." } },
  ],
};

// محطة اللعب: أهداف داخل المباراة (تُرصد من نتيجة المباراة، لا ألغاز رقعة).
// test(r): r = { ended, result:'win'|'loss'|'draw', reason, easy, medium, queenHangedFree }
const PLAY_OBJECTIVES = [
  { id: "play1", test: (r) => r.easy && r.ended,
    prompt: { ar: "أنهِ مباراة كاملة ضدّ البوت (مستوى سهل).", en: "Finish a full game against the bot (easy level)." } },
  { id: "play2", test: (r) => r.easy && r.result === "win",
    prompt: { ar: "اربح مباراة ضدّ البوت السهل.", en: "Win a game against the easy bot." } },
  { id: "play3", test: (r) => r.ended && r.queenHangedFree,
    prompt: { ar: "العب مباراة دون أن تخسر وزيرك مجّانًا.", en: "Play a game without hanging your queen for free." } },
  { id: "play4", test: (r) => r.result === "win" && r.reason === "checkmate",
    prompt: { ar: "أعطِ المات للبوت.", en: "Checkmate the bot." } },
  { id: "play5", test: (r) => r.medium && r.result === "win",
    prompt: { ar: "اربح ضدّ البوت المتوسّط.", en: "Win against the medium bot." } },
];

// ---- منطق الإكمال (مصدر حقيقة واحد) ----
function cpCount(id) { return id === "play" ? PLAY_OBJECTIVES.length : (CHECKPOINTS[id] || []).length; }
function passNeeded(id) { return Math.ceil(cpCount(id) * PASS_RATIO); }
function stationDoneCount(track, id) {
  const cps = (track[id] && track[id].cps) || {};
  return Object.keys(cps).filter((k) => cps[k]).length;
}
function stationComplete(track, id) {
  if (((track[id] && track[id].bestScore) || 0) >= 70) return true; // توافق خلفي مع v28-v32
  return stationDoneCount(track, id) >= passNeeded(id);
}
// الموصى بها = أوّل محطة غير مكتملة بالترتيب الخطّي
function getRecommended(track) {
  return TRACK_ORDER.find((id) => !stationComplete(track, id)) || null;
}
