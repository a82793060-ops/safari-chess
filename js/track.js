// ==== المسار المُبوّب: بوّابة لينة (بلا أقفال) — كل المنطق من TRACK_ORDER ====
// المرجع: docs/phase2-track-spec.md + محتوى نقاط التحقّق التفاعلية (Phase 2).
// نقاط التحقّق تفاعلية: يلعب المتعلّم النقلة على رقعة مصغّرة، ويُتحقَّق منها بـchess.js.
// المفاتيح الداخلية (school…play) تبقى لتوافق الحفظ — النصوص المعروضة تُترجم في مكانها.

// Phase 3: التوسعة من 6 إلى 8 محطات. المفاتيح الست القديمة تبقى كما هي (قرار ثابت: لا نغيّر
// مفاتيح محفوظة في localStorage)؛ المحطتان الجديدتان بمفاتيح جديدة آمنة (لا بيانات قديمة تحتها).
// المرجع: docs/baydaq-phase3-spec.md — هذه الخطوة تنفّذ البندين ١-٢ فقط (الهيكل + محتوى مبدئي
// بمحرّك النقلة الحالي)؛ اللوح التعليمي المتحرك (LessonViewer) ومحرّك exercises[]/lesson{}
// الكامل مؤجّلان لخطوة لاحقة منفصلة.
const TRACK_ORDER = ["board_setup", "school", "special_moves", "rules", "openings", "tactics", "endgames", "play"];
const PASS_RATIO = 0.7; // تُكمل المحطة عند اجتياز ≥70٪ من نقاطها (تُقرَّب للأعلى)

const STATIONS = {
  board_setup: { icon: "🏁", group: "أساس", ar: "البداية والرقعة", en: "Getting started — the board",
    info: { ar: "الرقعة ٨×٨: الأعمدة أحرف (a-h) والصفوف أرقام (1-8) — كلّ مربّع له إحداثية فريدة (مثل e4). الأبيض يبدأ اللعب دائمًا، ثمّ يتناوب اللاعبان. هدف اللعبة ليس أسر الملك بل الكِش مات: تهديد له بلا أيّ مفرّ.",
           en: "The 8×8 board: files are letters (a-h), ranks are numbers (1-8) — every square has a unique coordinate (like e4). White always moves first, then players alternate. The goal isn't capturing the king but checkmate: an inescapable threat to it." } },
  school:   { icon: "♟", group: "أساس",  ar: "المدرسة — حركة القطع", en: "School — how pieces move",
    info: { ar: "البيدق يتقدّم للأمام ويأسر قطريًّا، الرخ يتحرّك مستقيمًا، الفيل قطريًّا، الحصان يقفز على شكل L، الوزير يجمع الرخ والفيل، والملك خطوة واحدة. نقلات خاصّة: الترقية (بيدق يبلغ النهاية يصير وزيرًا)، التبييت (تحصين الملك بالرخ)، والأخذ بالمرور «en passant» (إن تقدّم بيدق الخصم خطوتين وحاذى بيدقك، جاز أسره وكأنّه تقدّم خطوة واحدة، في النقلة التالية فقط).",
           en: "The pawn advances forward and captures diagonally, the rook moves straight, the bishop diagonally, the knight in an L, the queen combines rook and bishop, and the king one square. Special moves: promotion, castling, and en passant (if an enemy pawn advances two squares beside yours, you may capture it as if it moved one — only on the very next move)." } },
  special_moves: { icon: "✨", group: "أساس", ar: "النقلات الخاصّة", en: "Special moves",
    info: { ar: "التبييت: نقلة مزدوجة (الملك خطوتان نحو الرخ، والرخ يقفز فوقه) تشترط ألّا يكون الملك أو الرخ قد تحرّك من قبل، ولا كِش، ولا مربّع مهدَّد في الطريق. الأخذ بالمرور «en passant»: فرصة تزول فورًا. الترقية: أيّ بيدق يبلغ الصفّ الأخير يتحوّل لأيّ قطعة (غالبًا وزير). قيمة القطع (بيدق١، حصان/فيل٣، رخ٥، وزير٩) تُرشدك متى يكون التبادل رابحًا.",
           en: "Castling: a double move (king two squares toward the rook, which hops over it) requiring neither piece has moved before, no check, and no attacked square in between. En passant: the chance vanishes immediately. Promotion: any pawn reaching the last rank becomes any piece (usually a queen). Piece values (pawn 1, knight/bishop 3, rook 5, queen 9) guide you on profitable trades." } },
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
  board_setup: [
    { id: "bs1", passRule: "all",
      lesson: { title: { ar: "الإحداثيات", en: "Coordinates" }, steps: [
        { fen: "4k3/8/8/8/8/8/4K3/R7 w - - 0 1", text: { ar: "كلّ مربّع له إحداثية فريدة: حرف العمود (a-h) ثمّ رقم الصفّ (1-8). الرخ هنا على a1.", en: "Every square has a unique coordinate: file letter (a-h) then rank number (1-8). The rook here is on a1." }, highlight: ["a1"] },
        { fen: "4k3/8/8/8/8/8/4K3/R7 w - - 0 1", text: { ar: "تتبّع الحروف a-b-c...حتى h على نفس الرقم 1 لتصل إلى h1.", en: "Follow the letters a-b-c...to h on the same number 1 to reach h1." }, highlight: ["a1", "h1"], arrow: ["a1", "h1"] },
      ] },
      exercises: [
        { id: "bs1_ex1", fen: "4k3/8/8/8/8/8/4K3/R7 w - - 0 1", solution: "a1-h1", accept: [],
          feedbackWrong: { ar: "الحرف يتغيّر من a إلى h، والرقم يبقى 1.", en: "The letter changes from a to h; the number stays 1." },
          hint: { ar: "حرّك الرخ أفقيًّا على الصفّ الأوّل.", en: "Move the rook horizontally along the first rank." } },
        { id: "bs1_ex2", fen: "4k3/8/8/8/8/8/4K3/7R w - - 0 1", solution: "h1-h8", accept: [],
          feedbackWrong: { ar: "هذه المرّة الرقم يتغيّر من 1 إلى 8، والحرف h يبقى.", en: "This time the number changes from 1 to 8; the letter h stays." },
          hint: { ar: "حرّك الرخ رأسيًّا على العمود h.", en: "Move the rook vertically along the h-file." } },
      ] },
    { id: "bs2", passRule: "all",
      lesson: { title: { ar: "من يبدأ ويتناوب اللعب", en: "Who starts, and turn order" }, steps: [
        { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", text: { ar: "الأبيض يبدأ اللعب دائمًا في الشطرنج — لا استثناء.", en: "White always moves first in chess — no exceptions." }, highlight: ["e1", "e8"] },
        { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", text: { ar: "بعد نقلة الأبيض، يتناوب الدور فورًا للأسود، وهكذا بالتبادل حتى نهاية المباراة.", en: "After White's move, it's Black's turn immediately, alternating until the game ends." }, highlight: ["e4"] },
      ] },
      exercises: [
        { id: "bs2_ex1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e2-e4",
          accept: ["d2-d4", "g1-f3", "b1-c3", "c2-c4", "e2-e3", "d2-d3"],
          feedbackWrong: { ar: "أيّ نقلة قانونية تصلح؛ المهمّ أنّ الأبيض يبدأ.", en: "Any legal move works — the point is White starts." },
          hint: { ar: "حرّك أيّ بيدق أو حصان.", en: "Move any pawn or knight." } },
        { id: "bs2_ex2", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "g1-f3", accept: ["b1-c3"],
          feedbackWrong: { ar: "جرّب تطوير حصان هذه المرّة بدل بيدق.", en: "This time try developing a knight instead of a pawn." },
          hint: { ar: "الحصان القريب من الملك يخرج إلى f3.", en: "The knight near the king comes out to f3." } },
      ] },
    { id: "bs3", passRule: "all",
      lesson: { title: { ar: "رصّ القطع الابتدائي", en: "Initial setup" }, steps: [
        { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", text: { ar: "في البداية، الفيلة محشورة خلف صفّ البيادق — لا يمكنها الحركة بعد.", en: "At the start, the bishops are boxed in behind the pawn row — they can't move yet." }, highlight: ["c1", "f1"] },
        { fen: "rnbqkbnr/pppppppp/8/8/8/6P1/PPPPPP1P/RNBQKBNR b KQkq - 0 1", text: { ar: "خطوة واحدة لبيدق مجاور تفتح للفيل طريقًا للخروج.", en: "One step by a neighboring pawn opens a path for the bishop to come out." }, highlight: ["f1"], arrow: ["g2", "g3"] },
      ] },
      exercises: [
        { id: "bs3_ex1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "g2-g3", accept: ["b2-b3"],
          feedbackWrong: { ar: "حرّك بيدق الحصان القريب من الزاوية خطوة واحدة.", en: "Move the knight-side pawn near the corner one square." },
          hint: { ar: "g2 إلى g3 يفتح فيل f1.", en: "g2 to g3 opens the f1 bishop." } },
        { id: "bs3_ex2", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e2-e4", accept: ["d2-d4"],
          feedbackWrong: { ar: "هذه المرّة افتح طريق الفيل الآخر (f1) بدل c1.", en: "This time open a path for the other bishop (f1) instead of c1." },
          hint: { ar: "بيدق المركز خطوتين يفتح فيل f1.", en: "A central pawn two squares opens the f1 bishop." } },
      ] },
    { id: "bs4", passRule: "all",
      lesson: { title: { ar: "هدف اللعبة", en: "The goal of the game" }, steps: [
        { fen: "2k5/8/2K5/8/8/8/8/R7 w - - 0 1", text: { ar: "هدف اللعبة ليس أسر الملك أبدًا، بل الكِش مات: تهديد له بلا أيّ مفرّ.", en: "The goal is never to capture the king, but checkmate: an inescapable threat to it." }, highlight: ["c8", "c6"] },
        { fen: "R1k5/8/2K5/8/8/8/8/8 b - - 1 1", text: { ar: "هكذا تنتهي المباراة فورًا عند تحقّق المات — لا نقلة بعده.", en: "The game ends immediately once checkmate is delivered — no move follows it." }, highlight: ["a8", "c8"] },
      ] },
      exercises: [
        { id: "bs4_ex1", fen: "2k5/8/2K5/8/8/8/8/R7 w - - 0 1", solution: "a1-a8", accept: [],
          feedbackWrong: { ar: "ملكك يمنع الهروب، والرخ يقطع الصفّ الأخير.", en: "Your king blocks the escape; the rook seals the last rank." },
          hint: { ar: "الرخ من a1 إلى a8.", en: "Rook from a1 to a8." } },
        { id: "bs4_ex2", fen: "2k5/8/2K5/8/8/8/8/7R w - - 0 1", solution: "h1-h8", accept: [],
          feedbackWrong: { ar: "نفس الفكرة من الجهة الأخرى — الرخ يقطع الصفّ الأخير.", en: "Same idea from the other side — the rook seals the last rank." },
          hint: { ar: "الرخ من h1 إلى h8.", en: "Rook from h1 to h8." } },
      ] },
  ],
  school: [
    { id: "sch1", passRule: "all",
      lesson: { title: { ar: "حركة البيدق", en: "How the pawn moves" }, steps: [
        { fen: "k7/8/8/8/8/8/4P3/K7 w - - 0 1", text: { ar: "من مربّعه الأصليّ، يتقدّم البيدق خطوة أو خطوتين — لكن ليس بعد ذلك.", en: "From its starting square, a pawn advances one or two squares — but never again after that." }, highlight: ["e2"], arrow: ["e2", "e4"] },
        { fen: "k7/8/8/8/4P3/8/8/K7 b - e3 0 1", text: { ar: "الآن وبعد أن تقدّم، لا يتحرّك إلّا خطوة واحدة في كلّ نقلة قادمة.", en: "Now that it has moved, it advances only one square on every future move." }, highlight: ["e4"] },
      ] },
      exercises: [
        { id: "sch1_ex1", fen: "k7/8/8/8/8/8/4P3/K7 w - - 0 1", solution: "e2-e4", accept: ["e2-e3"],
          feedbackWrong: { ar: "البيدق يتقدّم للأمام فقط.", en: "A pawn only advances forward." },
          hint: { ar: "e2 إلى e4 (خطوتان) أو e3 (خطوة).", en: "e2 to e4 (two squares) or e3 (one)." } },
        { id: "sch1_ex2", fen: "k7/8/8/8/4P3/8/8/K7 w - - 0 1", solution: "e4-e5", accept: [],
          feedbackWrong: { ar: "بعد أن تحرّك البيدق مرّة، يتقدّم خطوة واحدة فقط بعدها.", en: "Once a pawn has moved, it advances only one square from then on." },
          hint: { ar: "e4 إلى e5 — خطوة واحدة لا خطوتين.", en: "e4 to e5 — one square, not two." } },
      ] },
    { id: "sch2", passRule: "all",
      lesson: { title: { ar: "حركة الرخ", en: "How the rook moves" }, steps: [
        { fen: "k7/3p4/8/8/3R4/8/8/K7 w - - 0 1", text: { ar: "الرخ يتحرّك بخطوط مستقيمة: أفقيًّا أو رأسيًّا، بأيّ عدد من المربّعات الخالية.", en: "The rook moves in straight lines: horizontally or vertically, across any number of empty squares." }, highlight: ["d4"], arrow: ["d4", "d7"] },
        { fen: "k7/3R4/8/8/8/8/8/K7 b - - 0 1", text: { ar: "وهو يأسر بنفس الطريقة — بالوصول لمربّع القطعة المعادية مباشرةً.", en: "It captures the same way — by landing directly on the enemy piece's square." }, highlight: ["d7"] },
      ] },
      exercises: [
        { id: "sch2_ex1", fen: "k7/3p4/8/8/3R4/8/8/K7 w - - 0 1", solution: "d4-d7", accept: [],
          feedbackWrong: { ar: "خطوط مستقيمة على نفس العمود.", en: "Straight up the same file." },
          hint: { ar: "الرخ رأسيًّا من d4 إلى d7.", en: "The rook vertically from d4 to d7." } },
        { id: "sch2_ex2", fen: "7k/8/8/8/8/8/8/R3p2K w - - 0 1", solution: "a1-e1", accept: [],
          feedbackWrong: { ar: "هذه المرّة الأسر أفقيّ، على نفس الصفّ.", en: "This time the capture is horizontal, along the same rank." },
          hint: { ar: "الرخ أفقيًّا من a1 إلى e1.", en: "The rook horizontally from a1 to e1." } },
      ] },
    { id: "sch3", passRule: "all",
      lesson: { title: { ar: "حركة الفيل", en: "How the bishop moves" }, steps: [
        { fen: "k7/8/7p/8/8/8/8/K1B5 w - - 0 1", text: { ar: "الفيل يتحرّك قطريًّا فقط، ويبقى طوال المباراة على مربّعات لون واحد.", en: "The bishop moves diagonally only, and stays on one square color for the whole game." }, highlight: ["c1"], arrow: ["c1", "h6"] },
        { fen: "k7/8/7B/8/8/8/8/K7 b - - 0 1", text: { ar: "كل الفيلة السوداء التي مرّ بها كانت على نفس لون قطره.", en: "Every square it passed through along the way shared that same diagonal color." }, highlight: ["h6"] },
      ] },
      exercises: [
        { id: "sch3_ex1", fen: "k7/8/7p/8/8/8/8/K1B5 w - - 0 1", solution: "c1-h6", accept: [],
          feedbackWrong: { ar: "تتبّع القطر حتى الهدف.", en: "Follow the diagonal to the target." },
          hint: { ar: "من c1 إلى h6 عبر القطر.", en: "From c1 to h6 along the diagonal." } },
        { id: "sch3_ex2", fen: "k7/8/8/3p4/8/8/8/K6B w - - 0 1", solution: "h1-d5", accept: [],
          feedbackWrong: { ar: "هذه المرّة القطر مختلف الاتجاه — لكنّه ما زال قطرًا مستقيمًا.", en: "This time the diagonal runs the other way — but it's still a straight diagonal." },
          hint: { ar: "من h1 إلى d5.", en: "From h1 to d5." } },
      ] },
    { id: "sch4", passRule: "all",
      lesson: { title: { ar: "حركة الحصان", en: "How the knight moves" }, steps: [
        { fen: "k7/8/5p2/8/4N3/8/8/K7 w - - 0 1", text: { ar: "الحصان الوحيد الذي يقفز فوق القطع — يتحرّك خطوتين ثمّ خطوة جانبية (شكل L).", en: "The only piece that jumps over others — it moves two squares then one to the side (an L-shape)." }, highlight: ["e4"], arrow: ["e4", "f6"] },
        { fen: "k7/8/5N2/8/8/8/8/K7 b - - 0 1", text: { ar: "ثماني وجهات ممكنة من كلّ مربّع — لهذا الحصان قويّ في الزحام.", en: "Eight possible destinations from every square — that's why the knight thrives in crowded positions." }, highlight: ["f6"] },
      ] },
      exercises: [
        { id: "sch4_ex1", fen: "k7/8/5p2/8/4N3/8/8/K7 w - - 0 1", solution: "e4-f6", accept: [],
          feedbackWrong: { ar: "خطوتان ثمّ خطوة جانبية.", en: "Two squares then one to the side." },
          hint: { ar: "من e4 إلى f6.", en: "From e4 to f6." } },
        { id: "sch4_ex2", fen: "k7/8/8/8/8/8/2p5/K3N3 w - - 0 1", solution: "e1-c2", accept: [],
          feedbackWrong: { ar: "الشكل نفسه، لكن باتّجاه آخر هذه المرّة.", en: "Same L-shape, just a different direction this time." },
          hint: { ar: "من e1 إلى c2.", en: "From e1 to c2." } },
      ] },
    { id: "sch5", passRule: "all",
      lesson: { title: { ar: "حركة الوزير", en: "How the queen moves" }, steps: [
        { fen: "k7/6p1/8/8/3Q4/8/8/K7 w - - 0 1", text: { ar: "الوزير يجمع حركة الرخ والفيل معًا: خطوط مستقيمة وقطرية، أقوى قطعة حركةً.", en: "The queen combines the rook and bishop: straight and diagonal lines — the most mobile piece." }, highlight: ["d4"], arrow: ["d4", "g7"] },
        { fen: "k7/6Q1/8/8/8/8/8/K7 b - - 0 1", text: { ar: "هذا التنوّع في الحركة يجعلها الأخطر على رقعة الشطرنج.", en: "This range of movement makes it the most dangerous piece on the board." }, highlight: ["g7"] },
      ] },
      exercises: [
        { id: "sch5_ex1", fen: "k7/6p1/8/8/3Q4/8/8/K7 w - - 0 1", solution: "d4-g7", accept: [],
          feedbackWrong: { ar: "الوزير أقوى قطعة حركةً.", en: "The queen is the most mobile piece." },
          hint: { ar: "من d4 إلى g7 قطريًّا.", en: "From d4 to g7 diagonally." } },
        { id: "sch5_ex2", fen: "k2p4/8/8/8/3Q4/8/8/K7 w - - 0 1", solution: "d4-d8", accept: [],
          feedbackWrong: { ar: "هذه المرّة الأسر مستقيم على العمود، لا قطريّ.", en: "This time the capture is a straight line up the file, not diagonal." },
          hint: { ar: "من d4 إلى d8.", en: "From d4 to d8." } },
      ] },
  ],
  // Phase 3 (تجربة مصغّرة — محتوى غنيّ): كل نقطة = درس متعدّد الخطوات + سلسلة تمارين متدرّجة.
  // بنية موسّعة: { id, lesson:{title,steps:[{fen,text,highlight,arrow}]}, exercises:[{id,fen,solution,accept,feedbackWrong,hint}], passRule:"all" }
  special_moves: [
    { id: "spm1", passRule: "all",
      lesson: { title: { ar: "التبييت", en: "Castling" }, steps: [
        { fen: "r3k2r/pppq1ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPPQ1PPP/R3K2R w KQkq - 0 1",
          text: { ar: "شروط التبييت: لم يتحرك الملك ولا الرخ من قبل، ولا كِش حاليًّا، ولا مربّع مهدَّد في طريق الملك.",
                  en: "Castling requires: neither king nor rook has moved before, no current check, and no attacked square along the king's path." },
          highlight: ["e1", "h1"], arrow: ["e1", "g1"] },
        { fen: "r3k2r/pppq1ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPPQ1PPP/R4RK1 b kq - 1 1",
          text: { ar: "بعد التبييت القصير: الملك في الزاوية بأمان، والرخ يقفز إلى العمود f.",
                  en: "After castling kingside: the king is tucked safely away, and the rook hops to the f-file." },
          highlight: ["g1", "f1"] },
      ] },
      exercises: [
        { id: "spm1_ex1", fen: "r3k2r/pppq1ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPPQ1PPP/R3K2R w KQkq - 0 1", solution: "e1-g1", accept: [],
          feedbackWrong: { ar: "جرّب تحريك الملك خطوتين نحو الرخ القريب.", en: "Try moving the king two squares toward the nearby rook." },
          hint: { ar: "الملك من e1 إلى g1.", en: "King from e1 to g1." } },
        { id: "spm1_ex2", fen: "r3k2r/pppq1ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPPQ1PPP/R3K2R w KQkq - 0 1", solution: "e1-c1", accept: [],
          feedbackWrong: { ar: "هذه المرّة بيّت طويلًا — نحو رخّ الوزير.", en: "This time castle queenside — toward the queen's rook." },
          hint: { ar: "الملك من e1 إلى c1.", en: "King from e1 to c1." } },
      ] },
    { id: "spm2", passRule: "all",
      lesson: { title: { ar: "الأخذ بالتجاوز", en: "En passant" }, steps: [
        { fen: "4k3/8/8/4P3/8/8/8/4K3 w - - 0 1",
          text: { ar: "بيدقك الأبيض على e5. إذا تقدّم بيدق أسود مجاور خطوتين من نقطة انطلاقه الآن...",
                  en: "Your white pawn is on e5. If a neighboring black pawn now advances two squares from its start..." },
          highlight: ["e5"] },
        { fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1",
          text: { ar: "...يحقّ لك أخذه بالتجاوز فورًا وكأنّه تقدّم خطوة واحدة — لكن في نقلتك التالية مباشرة، وإلّا سقط الحقّ.",
                  en: "...you may capture it en passant at once, as if it moved one square — but only on your very next move, or the right is lost." },
          highlight: ["d5", "d6"], arrow: ["e5", "d6"] },
      ] },
      exercises: [
        { id: "spm2_ex1", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", solution: "e5-d6", accept: [],
          feedbackWrong: { ar: "الأخذ بالتجاوز يتم قطريًّا خلف البيدق مباشرة، لا أمامه.", en: "En passant lands diagonally right behind the pawn, not in front of it." },
          hint: { ar: "من e5 إلى d6.", en: "From e5 to d6." } },
        { id: "spm2_ex2", fen: "4k3/8/8/3pP3/8/8/8/4K3 w - - 0 1", solution: "e5-e6", accept: [],
          feedbackWrong: { ar: "لا يوجد حقّ أخذ بالتجاوز هنا بعد الآن — النافذة أُغلقت.", en: "En passant isn't available here anymore — the window has closed." },
          hint: { ar: "تابع تقدّم بيدقك بشكل طبيعي.", en: "Just push your pawn forward normally." } },
      ] },
    { id: "spm3", passRule: "all",
      lesson: { title: { ar: "الترقية", en: "Promotion" }, steps: [
        { fen: "8/1P4k1/8/8/8/8/8/4K3 w - - 0 1",
          text: { ar: "أيّ بيدق يبلغ الصفّ الأخير يترقّى فورًا — عادة إلى وزير لأنّه الأقوى.",
                  en: "Any pawn reaching the last rank promotes immediately — usually to a queen, the strongest piece." },
          highlight: ["b7", "b8"], arrow: ["b7", "b8"] },
        { fen: "8/4k1P1/8/8/8/8/8/4K3 w - - 0 1",
          text: { ar: "أحيانًا تختار قطعة أخرى (ترقية ناقصة) — هنا حصان يعطي كِشًّا فوريًّا، بينما الوزير من نفس المربّع لا يعطي كِشًّا!",
                  en: "Sometimes you pick a different piece (underpromotion) — here a knight gives immediate check, while a queen from the same square wouldn't!" },
          highlight: ["g8", "e7"] },
      ] },
      exercises: [
        { id: "spm3_ex1", fen: "8/1P4k1/8/8/8/8/8/4K3 w - - 0 1", solution: "b7-b8=Q", accept: [],
          feedbackWrong: { ar: "رقِّ البيدق إلى وزير هنا — الأقوى.", en: "Promote to a queen here — the strongest piece." },
          hint: { ar: "b7 إلى b8، ثمّ اختر الوزير.", en: "b7 to b8, then pick the queen." } },
        { id: "spm3_ex2", fen: "8/4k1P1/8/8/8/8/8/4K3 w - - 0 1", solution: "g7-g8=N", accept: [],
          feedbackWrong: { ar: "الوزير هنا لا يعطي كِشًّا — جرّب قطعة تقفز.", en: "A queen here gives no check — try a piece that jumps." },
          hint: { ar: "رقِّ إلى حصان بدل الوزير.", en: "Promote to a knight instead of a queen." } },
      ] },
    { id: "spm4", passRule: "all",
      lesson: { title: { ar: "قيمة القطع والتبادل", en: "Piece values & trades" }, steps: [
        { fen: "4k3/8/8/8/8/3r4/8/3QK3 w - - 0 1",
          text: { ar: "قيم القطع التقريبية: بيدق=1، حصان/فيل=3، رخ=5، وزير=9. وزيرك (٩) مهدَّد برخّ (٥) بلا حماية — لا تُقايض الأثمن بالأرخص.",
                  en: "Approximate values: pawn=1, knight/bishop=3, rook=5, queen=9. Your queen (9) is attacked by an undefended rook (5) — don't trade the pricier piece for the cheaper one." },
          highlight: ["d1", "d3"], arrow: ["d3", "d1"] },
      ] },
      exercises: [
        { id: "spm4_ex1", fen: "4k3/8/8/8/8/3r4/8/3QK3 w - - 0 1", solution: "d1-h5", accept: [],
          feedbackWrong: { ar: "وزيرك ما زال على مسار الرخ — انقله لمربّع آمن تمامًا.", en: "Your queen is still on the rook's line — move it to a fully safe square." },
          hint: { ar: "ابحث عن مربّع آمن خارج مسار الرخ.", en: "Find a safe square off the rook's line." } },
        { id: "spm4_ex2", fen: "r3k3/p7/8/8/3Q4/8/8/4K3 w - - 0 1", solution: "e1-e2", accept: ["e1-d2"],
          feedbackWrong: { ar: "لا تلتهم الطعم! البيدق محميّ بالرخ، وستخسر وزيرك مقابل بيدق فقط.", en: "Don't take the bait! The pawn is defended by the rook — you'd lose your queen for just a pawn." },
          hint: { ar: "قارن: وزير ٩ مقابل بيدق ١ محميّ — خسارة صافية.", en: "Compare: a 9-point queen for a defended 1-point pawn — a clear loss." } },
      ] },
  ],
  rules: [
    { id: "rul1", passRule: "all",
      lesson: { title: { ar: "مات الصفّ الأخير", en: "Back-rank mate" }, steps: [
        { fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1", text: { ar: "بيادق الأسود نفسها تحاصر ملكه على الصفّ الأخير — لا مربّع هروب.", en: "Black's own pawns trap its king on the back rank — no escape square." }, highlight: ["g8"], arrow: ["a1", "a8"] },
        { fen: "R5k1/5ppp/8/8/8/8/8/7K b - - 1 1", text: { ar: "الرخ يصل الصفّ الثامن كِشًّا، والملك لا مفرّ له — مات.", en: "The rook arrives on the 8th rank with check, and the king has no escape — mate." }, highlight: ["a8", "g8"] },
      ] },
      exercises: [
        { id: "rul1_ex1", fen: "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1", solution: "a1-a8", accept: [],
          feedbackWrong: { ar: "الملك محاصَر ببيادقه.", en: "The king is trapped by its own pawns." },
          hint: { ar: "الرخ من a1 إلى a8.", en: "Rook from a1 to a8." } },
        { id: "rul1_ex2", fen: "7k/6pp/8/8/8/8/8/R6K w - - 0 1", solution: "a1-a8", accept: [],
          feedbackWrong: { ar: "نفس الفكرة تمامًا — الملك محاصَر ببيادقه على الحافّة.", en: "Exact same idea — the king is trapped by its own pawns on the edge." },
          hint: { ar: "الرخ من a1 إلى a8.", en: "Rook from a1 to a8." } },
      ] },
    { id: "rul2", passRule: "all",
      lesson: { title: { ar: "مات الزاوية بالوزير", en: "Corner mate with the queen" }, steps: [
        { fen: "k7/8/1K6/8/8/8/8/7Q w - - 0 1", text: { ar: "ملكك على b6 يغطّي مربّعات هروب الملك الأسود المجاورة لزاويته.", en: "Your king on b6 covers the escape squares next to Black's cornered king." }, highlight: ["b6", "a8"], arrow: ["h1", "h8"] },
        { fen: "k6Q/8/1K6/8/8/8/8/8 b - - 1 1", text: { ar: "الوزير يصل زاوية الملك كِشًّا، وكل مربّعات الهروب مغطّاة — مات.", en: "The queen arrives at the king's corner with check, and every escape square is covered — mate." }, highlight: ["h8", "a8"] },
      ] },
      exercises: [
        { id: "rul2_ex1", fen: "k7/8/1K6/8/8/8/8/7Q w - - 0 1", solution: "h1-h8", accept: [],
          feedbackWrong: { ar: "ملكك يغطّي مربّعات الهروب.", en: "Your king covers the escape squares." },
          hint: { ar: "الوزير من h1 إلى h8.", en: "Queen from h1 to h8." } },
        { id: "rul2_ex2", fen: "3k4/8/3K4/8/8/8/8/1Q6 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "نفس الفكرة على عمود مختلف — ملكك يغطّي مربّعات هروب الملك.", en: "Same idea on a different file — your king covers the enemy king's escape squares." },
          hint: { ar: "الوزير من b1 إلى b8.", en: "Queen from b1 to b8." } },
      ] },
    { id: "rul3", passRule: "all",
      lesson: { title: { ar: "مات الوزير المدعوم", en: "Supported-queen mate" }, steps: [
        { fen: "7k/8/6KQ/8/8/8/8/8 w - - 0 1", text: { ar: "الوزير يقف بجانب الملك الأسود مباشرةً، مدعومًا بملكك المجاور.", en: "The queen stands right beside the black king, backed up by your adjacent king." }, highlight: ["g6", "h6"], arrow: ["h6", "h7"] },
        { fen: "7k/7Q/6K1/8/8/8/8/8 b - - 1 1", text: { ar: "الدعم المباشر من الملك يمنع أسر الوزير، فيتحقّق المات.", en: "The king's direct support prevents capturing the queen, and mate follows." }, highlight: ["h7", "h8"] },
      ] },
      exercises: [
        { id: "rul3_ex1", fen: "7k/8/6KQ/8/8/8/8/8 w - - 0 1", solution: "h6-h7", accept: [],
          feedbackWrong: { ar: "الوزير بجانب الملك مباشرةً.", en: "The queen goes right beside the king." },
          hint: { ar: "الوزير من h6 إلى h7.", en: "Queen from h6 to h7." } },
        { id: "rul3_ex2", fen: "k7/8/QK6/8/8/8/8/8 w - - 0 1", solution: "a6-a7", accept: [],
          feedbackWrong: { ar: "نفس فكرة الدعم المباشر، لكن في الزاوية المقابلة.", en: "Same direct-support idea, but in the opposite corner." },
          hint: { ar: "الوزير من a6 إلى a7.", en: "Queen from a6 to a7." } },
      ] },
    { id: "rul4", passRule: "all",
      lesson: { title: { ar: "مات الرخّين (السلّم)", en: "Two-rook (ladder) mate" }, steps: [
        { fen: "4k3/R7/8/8/8/8/8/1R2K3 w - - 0 1", text: { ar: "رخّ يقصّ صفًّا فيحاصر الملك، ورخّ آخر يهدّد الصفّ التالي — بالتناوب كسلّم.", en: "One rook seals a rank to trap the king, the other threatens the next rank — alternating like a ladder." }, highlight: ["a7", "e8"], arrow: ["b1", "b8"] },
        { fen: "1R2k3/R7/8/8/8/8/8/4K3 b - - 1 1", text: { ar: "الرخّ الثاني يصل صفّ الملك مباشرةً، والصفّ التالي مغلق مسبقًا — مات.", en: "The second rook arrives right on the king's rank, and the next rank is already sealed — mate." }, highlight: ["b8", "e8"] },
      ] },
      exercises: [
        { id: "rul4_ex1", fen: "4k3/R7/8/8/8/8/8/1R2K3 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "رخٌّ يقصّ الصفّ، وآخر يعطي المات.", en: "One rook seals a rank, the other mates." },
          hint: { ar: "الرخ من b1 إلى b8.", en: "Rook from b1 to b8." } },
        { id: "rul4_ex2", fen: "4k3/1R6/8/8/8/8/8/R3K3 w - - 0 1", solution: "a1-a8", accept: [],
          feedbackWrong: { ar: "نفس فكرة السلّم، بترتيب معكوس هذه المرّة.", en: "Same ladder idea, just in reverse order this time." },
          hint: { ar: "الرخ من a1 إلى a8.", en: "Rook from a1 to a8." } },
      ] },
    { id: "rul5", passRule: "all",
      lesson: { title: { ar: "مات الملك والرخ", en: "King-and-rook mate" }, steps: [
        { fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1", text: { ar: "ملكك يمنع هروب الملك الأسود من زاويته، والرخ ينهي الأمر.", en: "Your king blocks the black king's escape from its corner, and the rook finishes it." }, highlight: ["b6", "a8"], arrow: ["h1", "h8"] },
        { fen: "k6R/8/1K6/8/8/8/8/8 b - - 1 1", text: { ar: "الرخ يصل الصفّ الأخير كِشًّا، وملكك يغطّي كلّ مربّعات الهروب — مات.", en: "The rook arrives on the last rank with check, and your king covers every escape square — mate." }, highlight: ["h8", "a8"] },
      ] },
      exercises: [
        { id: "rul5_ex1", fen: "k7/8/1K6/8/8/8/8/7R w - - 0 1", solution: "h1-h8", accept: [],
          feedbackWrong: { ar: "ملكك يمنع الهروب.", en: "Your king blocks the escape." },
          hint: { ar: "الرخ من h1 إلى h8.", en: "Rook from h1 to h8." } },
        { id: "rul5_ex2", fen: "3k4/8/3K4/8/8/8/8/1R6 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "نفس فكرة الرخ والملك، على عمود مختلف.", en: "Same king-and-rook idea, on a different file." },
          hint: { ar: "الرخ من b1 إلى b8.", en: "Rook from b1 to b8." } },
      ] },
  ],
  openings: [
    { id: "opn1", passRule: "all",
      lesson: { title: { ar: "سيطر على المركز", en: "Control the center" }, steps: [
        { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", text: { ar: "المركز أهمّ رقعة في الافتتاح — من يسيطر عليه يتحكّم بحركة كل القطع.", en: "The center is the most important ground in the opening — controlling it controls every piece's mobility." }, highlight: ["d4", "e4"] },
        { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1", text: { ar: "بيدق واحد بخطوتين يفتح خطوطًا للفيل والوزير فورًا.", en: "One pawn advancing two squares immediately opens lines for the bishop and queen." }, highlight: ["e4"] },
      ] },
      exercises: [
        { id: "opn1_ex1", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "e2-e4", accept: ["d2-d4"],
          feedbackWrong: { ar: "المركز أهمّ رقعة.", en: "The center is the key ground." },
          hint: { ar: "بيدق e أو d خطوتين.", en: "The e or d pawn, two squares." } },
        { id: "opn1_ex2", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", solution: "d2-d4", accept: ["e2-e4"],
          feedbackWrong: { ar: "أيّ بيدق مركزيّ يصلح — d أو e.", en: "Either central pawn works — d or e." },
          hint: { ar: "بيدق d خطوتين هذه المرّة.", en: "The d-pawn two squares this time." } },
      ] },
    { id: "opn2", passRule: "all",
      lesson: { title: { ar: "طوّر قطعك الصغيرة", en: "Develop your minor pieces" }, steps: [
        { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", text: { ar: "بعد تأمين المركز، أخرج الأحصنة والفيلة بسرعة نحوه.", en: "After securing the center, bring your knights and bishops out toward it quickly." }, highlight: ["g1"], arrow: ["g1", "f3"] },
        { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", text: { ar: "الحصان على f3 يهاجم e5 فورًا ويشارك في السيطرة على المركز.", en: "The knight on f3 immediately attacks e5 and joins the fight for the center." }, highlight: ["f3"] },
      ] },
      exercises: [
        { id: "opn2_ex1", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", solution: "g1-f3", accept: ["b1-c3"],
          feedbackWrong: { ar: "الحصان على f3 يهاجم e5.", en: "A knight on f3 hits e5." },
          hint: { ar: "الحصان من g1 إلى f3.", en: "Knight from g1 to f3." } },
        { id: "opn2_ex2", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", solution: "b1-c3", accept: [],
          feedbackWrong: { ar: "هذه المرّة طوّر الحصان الآخر بدلًا منه.", en: "This time develop the other knight instead." },
          hint: { ar: "الحصان من b1 إلى c3.", en: "Knight from b1 to c3." } },
      ] },
    { id: "opn3", passRule: "all",
      lesson: { title: { ar: "طوّر الفيل بنشاط", en: "Develop the bishop actively" }, steps: [
        { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", text: { ar: "صوّب الفيل نحو المركز أو ناحية الملك الأسود — لا تُبقِه خاملًا.", en: "Aim the bishop at the center or toward the black king — don't leave it idle." }, highlight: ["f1"], arrow: ["f1", "c4"] },
        { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 1 3", text: { ar: "من c4، الفيل يراقب f7 — مربّع حسّاس قرب الملك الأسود.", en: "From c4, the bishop eyes f7 — a sensitive square near the black king." }, highlight: ["c4"] },
      ] },
      exercises: [
        { id: "opn3_ex1", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", solution: "f1-c4", accept: ["f1-b5"],
          feedbackWrong: { ar: "صوّب الفيل نحو المركز/الملك.", en: "Aim the bishop at the center/king." },
          hint: { ar: "الفيل من f1 إلى c4.", en: "Bishop from f1 to c4." } },
        { id: "opn3_ex2", fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3", solution: "f1-b5", accept: [],
          feedbackWrong: { ar: "هذه المرّة صوّبه نحو الحصان المدافع عن الملك.", en: "This time aim it at the knight defending the king." },
          hint: { ar: "الفيل من f1 إلى b5.", en: "Bishop from f1 to b5." } },
      ] },
    { id: "opn4", passRule: "all",
      lesson: { title: { ar: "حصّن ملكك بالتبييت", en: "Safeguard your king by castling" }, steps: [
        { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5", text: { ar: "بعد التطوير الأوّليّ، أمان الملك أولوية — بيّت قبل أن تنشغل بأمور أخرى.", en: "After initial development, king safety is a priority — castle before getting distracted by other plans." }, highlight: ["e1"], arrow: ["e1", "g1"] },
        { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 1 5", text: { ar: "الملك الآن في الزاوية بأمان، جاهز لبقيّة المباراة.", en: "The king is now safely in the corner, ready for the rest of the game." }, highlight: ["g1"] },
      ] },
      exercises: [
        { id: "opn4_ex1", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 5", solution: "e1-g1", accept: [],
          feedbackWrong: { ar: "أمان الملك أولوية مبكّرة.", en: "King safety is an early priority." },
          hint: { ar: "بيّت قصيرًا (e1 إلى g1).", en: "Castle kingside (e1 to g1)." } },
        { id: "opn4_ex2", fen: "r3k2r/pppq1ppp/2n2n2/2bpp3/2BPP3/2N2N2/PPPQ1PPP/R3K2R w KQkq - 0 1", solution: "e1-c1", accept: [],
          feedbackWrong: { ar: "هذه المرّة بيّت طويلًا — نفس مبدأ أمان الملك.", en: "This time castle queenside — same king-safety principle." },
          hint: { ar: "بيّت طويلًا (e1 إلى c1).", en: "Castle queenside (e1 to c1)." } },
      ] },
    { id: "opn5", passRule: "all",
      lesson: { title: { ar: "أكمل تطوير قطعك", en: "Finish developing your pieces" }, steps: [
        { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5", text: { ar: "لا تحرّك القطعة نفسها مرّتين قبل إخراج بقيّة قطعك.", en: "Don't move the same piece twice before the rest of your pieces are out." }, highlight: ["b1"], arrow: ["b1", "c3"] },
        { fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQ1RK1 b kq - 1 5", text: { ar: "الآن كلّ القطع الصغيرة خارج بيتها ومشاركة في اللعب.", en: "Now every minor piece is out of its home square and taking part in the game." }, highlight: ["c3"] },
      ] },
      exercises: [
        { id: "opn5_ex1", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5", solution: "b1-c3", accept: [],
          feedbackWrong: { ar: "لا تحرّك القطعة نفسها مرّتين قبل تطوير البقيّة.", en: "Don't move the same piece twice before the rest are out." },
          hint: { ar: "الحصان من b1 إلى c3.", en: "Knight from b1 to c3." } },
        { id: "opn5_ex2", fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 5", solution: "d2-d4", accept: [],
          feedbackWrong: { ar: "هذه المرّة اضرب مركزًا آخر بدل التطوير.", en: "This time strike at the center again instead of developing." },
          hint: { ar: "بيدق d خطوتين.", en: "The d-pawn, two squares." } },
      ] },
  ],
  tactics: [
    { id: "tac1", passRule: "all",
      lesson: { title: { ar: "الشوكة", en: "The fork" }, steps: [
        { fen: "4k3/8/8/5q2/4N3/8/8/4K3 w - - 0 1", text: { ar: "الشوكة: قطعة واحدة تهاجم قطعتين معًا — الحصان بارع فيها لغرابة زواياه.", en: "A fork: one piece attacks two at once — the knight excels at it thanks to its odd angles." }, highlight: ["e4"], arrow: ["e4", "d6"] },
        { fen: "4k3/8/3N4/5q2/8/8/8/4K3 b - - 1 1", text: { ar: "من d6، الحصان يهدّد الملك والوزير معًا — لا مفرّ من خسارة إحداهما.", en: "From d6, the knight threatens the king and queen together — one of them will be lost." }, highlight: ["d6"] },
      ] },
      exercises: [
        { id: "tac1_ex1", fen: "4k3/8/8/5q2/4N3/8/8/4K3 w - - 0 1", solution: "e4-d6", accept: [],
          feedbackWrong: { ar: "مربّع يهاجم القطعتين.", en: "A square that hits both pieces." },
          hint: { ar: "الحصان من e4 إلى d6 بكِشّ.", en: "Knight from e4 to d6 with check." } },
        { id: "tac1_ex2", fen: "4k3/8/8/2q5/4N3/8/8/4K3 w - - 0 1", solution: "e4-d6", accept: [],
          feedbackWrong: { ar: "نفس فكرة الشوكة، بموقع مختلف للوزير هذه المرّة.", en: "Same fork idea, just a different queen position this time." },
          hint: { ar: "نفس النقلة: e4 إلى d6.", en: "Same move: e4 to d6." } },
      ] },
    { id: "tac2", passRule: "all",
      lesson: { title: { ar: "التثبيت", en: "The pin" }, steps: [
        { fen: "4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1", text: { ar: "التثبيت: قطعة لا تستطيع التحرّك لأنّ خلفها قطعة أهمّ (هنا الملك).", en: "A pin: a piece can't move because something more valuable stands behind it (here, the king)." }, highlight: ["c6", "e8"], arrow: ["d4", "d5"] },
        { fen: "4k3/8/2n5/1B1P4/8/8/8/4K3 b - - 0 1", text: { ar: "الحصان مربوط تمامًا — أيّ محاولة لتحريكه تكشف ملكه للكِش.", en: "The knight is completely pinned — moving it would expose its own king to check." }, highlight: ["c6"] },
      ] },
      exercises: [
        { id: "tac2_ex1", fen: "4k3/8/2n5/1B6/3P4/8/8/4K3 w - - 0 1", solution: "d4-d5", accept: [],
          feedbackWrong: { ar: "الحصان لا يستطيع الفرار.", en: "The knight cannot run away." },
          hint: { ar: "البيدق من d4 إلى d5.", en: "Pawn from d4 to d5." } },
        { id: "tac2_ex2", fen: "4k3/2n5/8/1B6/8/8/8/4K3 w - - 0 1", solution: "b5-a4", accept: [],
          feedbackWrong: { ar: "الفيل يبتعد قليلًا لكنّه يبقي التثبيت على نفس القطر.", en: "The bishop steps back slightly but keeps the pin on the same diagonal." },
          hint: { ar: "الفيل من b5 إلى a4.", en: "Bishop from b5 to a4." } },
      ] },
    { id: "tac3", passRule: "all",
      lesson: { title: { ar: "السيخ", en: "The skewer" }, steps: [
        { fen: "q6k/8/8/8/8/8/8/1R4K1 w - - 0 1", text: { ar: "السيخ يشبه التثبيت، لكن القطعة الأهمّ في الأمام — تُجبَر على التحرّك فتكسب ما خلفها.", en: "A skewer is like a pin, but the valuable piece is in front — it's forced to move, letting you win what's behind it." }, highlight: ["h8", "a8"], arrow: ["b1", "b8"] },
        { fen: "qR5k/8/8/8/8/8/8/6K1 b - - 1 1", text: { ar: "الرخ الآن يكِشّ الملك، وسيضطرّ للتحرّك بعيدًا — فيصير الوزير خلفه صيدًا سهلًا في النقلة التالية.", en: "The rook now checks the king, forcing it to move away — leaving the queen behind it easy prey next move." }, highlight: ["b8", "a8"] },
      ] },
      exercises: [
        { id: "tac3_ex1", fen: "q6k/8/8/8/8/8/8/1R4K1 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "الملك أمام الوزير على نفس الصفّ.", en: "The king is in front of the queen on the same file." },
          hint: { ar: "الرخ من b1 إلى b8 بكِشّ.", en: "Rook from b1 to b8 with check." } },
        { id: "tac3_ex2", fen: "q6k/8/8/8/8/8/8/1K4R1 w - - 0 1", solution: "g1-g8", accept: [],
          feedbackWrong: { ar: "نفس فكرة السيخ، لكن الرخ هذه المرّة على العمود g.", en: "Same skewer idea, but the rook is on the g-file this time." },
          hint: { ar: "الرخ من g1 إلى g8 بكِشّ.", en: "Rook from g1 to g8 with check." } },
      ] },
    { id: "tac4", passRule: "all",
      lesson: { title: { ar: "الهجوم المزدوج", en: "The double attack" }, steps: [
        { fen: "r5k1/4n3/8/8/8/8/8/4Q1K1 w - - 0 1", text: { ar: "الهجوم المزدوج: نقلة واحدة تهدّد هدفين مختلفين في آنٍ واحد.", en: "A double attack: one move threatens two different targets at once." }, highlight: ["a8", "e7"], arrow: ["e1", "e4"] },
        { fen: "r5k1/4n3/8/8/4Q3/8/8/6K1 b - - 1 1", text: { ar: "من e4، الوزير يهدّد الرخ قطريًّا والحصان عموديًّا معًا.", en: "From e4, the queen threatens the rook diagonally and the knight vertically at once." }, highlight: ["e4"] },
      ] },
      exercises: [
        { id: "tac4_ex1", fen: "r5k1/4n3/8/8/8/8/8/4Q1K1 w - - 0 1", solution: "e1-e4", accept: [],
          feedbackWrong: { ar: "قطر يهدّد الرخ، وعمود يهدّد الحصان.", en: "A diagonal hits the rook, a file hits the knight." },
          hint: { ar: "الوزير من e1 إلى e4.", en: "Queen from e1 to e4." } },
        { id: "tac4_ex2", fen: "4r1k1/8/4n3/8/8/8/8/4Q1K1 w - - 0 1", solution: "e1-e4", accept: [],
          feedbackWrong: { ar: "نفس فكرة الهجوم المزدوج، بموقع مختلف قليلًا للرخ.", en: "Same double-attack idea, just a slightly different rook position." },
          hint: { ar: "نفس النقلة: e1 إلى e4.", en: "Same move: e1 to e4." } },
      ] },
    { id: "tac5", passRule: "all",
      lesson: { title: { ar: "الكشف", en: "The discovered attack" }, steps: [
        { fen: "4k3/8/8/7q/4N3/8/4R3/4K3 w - - 0 1", text: { ar: "الكشف: تحريك قطعة يفتح خطّ هجوم لقطعة أخرى خلفها.", en: "A discovered attack: moving one piece unveils an attack from another piece behind it." }, highlight: ["e2", "e4"], arrow: ["e4", "f6"] },
        { fen: "4k3/8/5N2/7q/8/8/4R3/4K3 b - - 1 1", text: { ar: "بتحرّك الحصان، انكشف كِشّ الرخ على الملك، والحصان نفسه هاجم الوزير.", en: "As the knight moved, the rook's check on the king was revealed, and the knight itself attacked the queen." }, highlight: ["f6"] },
      ] },
      exercises: [
        { id: "tac5_ex1", fen: "4k3/8/8/7q/4N3/8/4R3/4K3 w - - 0 1", solution: "e4-f6", accept: [],
          feedbackWrong: { ar: "الحصان يفتح خطّ الرخ ويضرب الوزير.", en: "The knight opens the rook's line and strikes the queen." },
          hint: { ar: "الحصان من e4 إلى f6.", en: "Knight from e4 to f6." } },
        { id: "tac5_ex2", fen: "4k3/8/8/6q1/4N3/8/4R3/4K3 w - - 0 1", solution: "e4-f6", accept: [],
          feedbackWrong: { ar: "نفس فكرة الكشف، بموقع مختلف قليلًا للوزير.", en: "Same discovered-attack idea, just a slightly different queen position." },
          hint: { ar: "نفس النقلة: e4 إلى f6.", en: "Same move: e4 to f6." } },
      ] },
  ],
  endgames: [
    { id: "end1", passRule: "all",
      lesson: { title: { ar: "الترقية", en: "Promotion" }, steps: [
        { fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1", text: { ar: "لا شيء يمنع بيدقك من بلوغ الصفّ الأخير والترقّي إلى وزير.", en: "Nothing stops your pawn from reaching the last rank and promoting to a queen." }, highlight: ["e7"], arrow: ["e7", "e8"] },
        { fen: "4Q3/6k1/8/8/8/8/8/4K3 b - - 0 1", text: { ar: "الآن معك وزير إضافيّ — تفوّق مادّيّ حاسم غالبًا.", en: "Now you have an extra queen — usually a decisive material advantage." }, highlight: ["e8"] },
      ] },
      exercises: [
        { id: "end1_ex1", fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1", solution: "e7-e8=Q", accept: [],
          feedbackWrong: { ar: "لا شيء يمنع الترقية.", en: "Nothing stops the promotion." },
          hint: { ar: "e7 إلى e8، ثمّ اختر الوزير.", en: "e7 to e8, then choose the queen." } },
        { id: "end1_ex2", fen: "8/8/8/8/8/4Pk2/8/4K3 w - - 0 1", solution: "e3-e4", accept: [],
          feedbackWrong: { ar: "قبل الترقية، تابع تقدّم البيدق خطوة بخطوة.", en: "Before promoting, keep pushing the pawn step by step." },
          hint: { ar: "بيدق e3 إلى e4.", en: "Pawn e3 to e4." } },
      ] },
    { id: "end2", passRule: "all",
      lesson: { title: { ar: "مات الملك والوزير", en: "King-and-queen mate" }, steps: [
        { fen: "5k2/8/5K2/8/8/8/8/1Q6 w - - 0 1", text: { ar: "ملكك يغطّي صفّ هروب الملك الأسود؛ الوزير يُنهي المهمّة على نفس الصفّ.", en: "Your king covers Black's escape rank; the queen finishes the job on that same rank." }, highlight: ["f6", "f8"], arrow: ["b1", "b8"] },
        { fen: "1Q3k2/8/5K2/8/8/8/8/8 b - - 1 1", text: { ar: "كلّ مربّعات الهروب مغطّاة بين الوزير وملكك — مات.", en: "Every escape square is covered between the queen and your king — mate." }, highlight: ["b8", "f8"] },
      ] },
      exercises: [
        { id: "end2_ex1", fen: "5k2/8/5K2/8/8/8/8/1Q6 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "ملكك يغطّي صفّ الهروب.", en: "Your king covers the escape rank." },
          hint: { ar: "الوزير من b1 إلى b8.", en: "Queen from b1 to b8." } },
        { id: "end2_ex2", fen: "6k1/8/6K1/8/8/8/8/2Q5 w - - 0 1", solution: "c1-c8", accept: [],
          feedbackWrong: { ar: "نفس فكرة الوزير والملك، على عمود مختلف.", en: "Same king-and-queen idea, on a different file." },
          hint: { ar: "الوزير من c1 إلى c8.", en: "Queen from c1 to c8." } },
      ] },
    { id: "end3", passRule: "all",
      lesson: { title: { ar: "مات الملك والرخ", en: "King-and-rook mate" }, steps: [
        { fen: "5k2/8/5K2/8/8/8/8/1R6 w - - 0 1", text: { ar: "نفس فكرة الوزير، لكن بالرخ هذه المرّة — ملكك يمنع الهروب.", en: "Same idea as the queen, but with the rook this time — your king blocks the escape." }, highlight: ["f6", "f8"], arrow: ["b1", "b8"] },
        { fen: "1R3k2/8/5K2/8/8/8/8/8 b - - 1 1", text: { ar: "الرخ يصل صفّ الملك، وملكك يغطّي البقيّة — مات.", en: "The rook arrives on the king's rank, your king covers the rest — mate." }, highlight: ["b8", "f8"] },
      ] },
      exercises: [
        { id: "end3_ex1", fen: "5k2/8/5K2/8/8/8/8/1R6 w - - 0 1", solution: "b1-b8", accept: [],
          feedbackWrong: { ar: "نفس فكرة الوزير لكن بالرخ.", en: "Same idea as the queen, but with the rook." },
          hint: { ar: "الرخ من b1 إلى b8.", en: "Rook from b1 to b8." } },
        { id: "end3_ex2", fen: "6k1/8/6K1/8/8/8/8/2R5 w - - 0 1", solution: "c1-c8", accept: [],
          feedbackWrong: { ar: "نفس فكرة الرخ والملك، على عمود مختلف.", en: "Same king-and-rook idea, on a different file." },
          hint: { ar: "الرخ من c1 إلى c8.", en: "Rook from c1 to c8." } },
      ] },
    { id: "end4", passRule: "all",
      lesson: { title: { ar: "ترقية بمات فوريّ", en: "Promotion delivering immediate mate" }, steps: [
        { fen: "k7/2P5/1K6/8/8/8/8/8 w - - 0 1", text: { ar: "أحيانًا تصنع الترقية المات فورًا، بدعم مباشر من ملكك.", en: "Sometimes promotion delivers checkmate on the spot, directly backed by your king." }, highlight: ["c7", "b6"], arrow: ["c7", "c8"] },
        { fen: "k1Q5/8/1K6/8/8/8/8/8 b - - 0 1", text: { ar: "الوزير الجديد يكِشّ، وملكك يمنع أيّ هروب — مات في نقلة واحدة.", en: "The new queen checks, and your king blocks any escape — mate in a single move." }, highlight: ["c8", "a8"] },
      ] },
      exercises: [
        { id: "end4_ex1", fen: "k7/2P5/1K6/8/8/8/8/8 w - - 0 1", solution: "c7-c8=Q", accept: [],
          feedbackWrong: { ar: "الترقية تصنع المات فورًا بدعم ملكك.", en: "The new queen mates at once, backed by your king." },
          hint: { ar: "c7 إلى c8، ثمّ اختر الوزير.", en: "c7 to c8, then choose the queen." } },
        { id: "end4_ex2", fen: "k7/1PK5/8/8/8/8/8/8 w - - 0 1", solution: "b7-b8=Q", accept: [],
          feedbackWrong: { ar: "نفس فكرة الترقية بمات فوريّ، بموقع ملك مختلف قليلًا.", en: "Same instant-mate promotion idea, just a slightly different king position." },
          hint: { ar: "b7 إلى b8، ثمّ اختر الوزير.", en: "b7 to b8, then choose the queen." } },
      ] },
    { id: "end5", passRule: "all",
      lesson: { title: { ar: "سباق الترقية", en: "The promotion race" }, steps: [
        { fen: "6k1/P7/8/8/8/8/8/6K1 w - - 0 1", text: { ar: "ملك الأسود بعيد جدًّا عن بيدقك — لا يستطيع اللحاق به قبل التتويج.", en: "Black's king is far too distant from your pawn — it can't catch it before it crowns." }, highlight: ["a7", "g8"], arrow: ["a7", "a8"] },
        { fen: "Q5k1/8/8/8/8/8/8/6K1 b - - 0 1", text: { ar: "الترقية تمّت، وسباق الملك خسره الأسود.", en: "The promotion is complete, and Black lost the race." }, highlight: ["a8"] },
      ] },
      exercises: [
        { id: "end5_ex1", fen: "6k1/P7/8/8/8/8/8/6K1 w - - 0 1", solution: "a7-a8=Q", accept: [],
          feedbackWrong: { ar: "الملك الأسود بعيد جدًّا.", en: "The black king is too far away." },
          hint: { ar: "a7 إلى a8، ثمّ اختر الوزير.", en: "a7 to a8, then choose the queen." } },
        { id: "end5_ex2", fen: "8/8/8/8/8/7k/P7/7K w - - 0 1", solution: "a2-a4", accept: [],
          feedbackWrong: { ar: "قبل الترقية، ادفع البيدق بأقصى سرعة ممكنة.", en: "Before promoting, push the pawn as fast as possible." },
          hint: { ar: "بيدق a2 إلى a4 (خطوتان دفعة واحدة).", en: "Pawn a2 to a4 (two squares at once)." } },
      ] },
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
