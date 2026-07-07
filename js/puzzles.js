// ==== الألغاز: باقة محلية مُتحقق منها + لغز lichess اليومي ====
/* global Chess, t, LANG */

// ملاحظة: PUZZLE_PACK تُملأ ببيانات مولّدة ومُتحقق منها آليا (انظر أدوات التطوير)
// كل لغز: {id, fen, solution: [uci...], kind: 'mate1'|'mate2'|'tactic', reward}
const PUZZLE_PACK = [
  {
    "id": "m1-1",
    "kind": "mate1",
    "fen": "5b2/8/3k1B1p/p7/P1p4P/2N5/2PP1q2/R2K4 b - - 1 31",
    "solution": [
      "f2f1"
    ],
    "reward": 10
  },
  {
    "id": "m1-2",
    "kind": "mate1",
    "fen": "rn2kbr1/Bppb1ppp/8/8/6n1/2p4N/4PP1P/qN2KB1R b Kq - 0 13",
    "solution": [
      "a1b1"
    ],
    "reward": 10
  },
  {
    "id": "m1-3",
    "kind": "mate1",
    "fen": "3k2n1/1Q6/8/3P1R2/4N2P/1b6/1P4P1/4K3 w - - 3 30",
    "solution": [
      "f5f8"
    ],
    "reward": 10
  },
  {
    "id": "m1-4",
    "kind": "mate1",
    "fen": "7Q/8/k3P3/P2R4/8/4N3/4K1R1/8 w - - 3 41",
    "solution": [
      "h8a8"
    ],
    "reward": 10
  },
  {
    "id": "m1-5",
    "kind": "mate1",
    "fen": "8/3p2Q1/4p3/7p/N2Pk3/1P6/2P3PP/5KNR w - - 0 25",
    "solution": [
      "g7e5"
    ],
    "reward": 10
  },
  {
    "id": "m1-6",
    "kind": "mate1",
    "fen": "1nbq1bn1/3Qp1pr/6kp/5p2/3N3P/8/2pPPPP1/RN2KB1R b K - 2 14",
    "solution": [
      "c2c1q"
    ],
    "reward": 10
  },
  {
    "id": "m2-1",
    "kind": "mate2",
    "fen": "8/1k1N4/8/3R4/P1P2Q2/R2P4/4P1K1/8 w - - 5 36",
    "solution": [
      "f4b8",
      "b7c6",
      "b8c8"
    ],
    "reward": 20
  },
  {
    "id": "m2-2",
    "kind": "mate2",
    "fen": "2b1k3/3p4/8/7R/P3P3/4r1Q1/5KRP/5N2 w - - 1 31",
    "solution": [
      "g3e5",
      "e8f8",
      "h5f5"
    ],
    "reward": 20
  },
  {
    "id": "m2-3",
    "kind": "mate2",
    "fen": "2b5/3k4/8/3P3R/P7/4N1Q1/5KRP/8 w - - 1 33",
    "solution": [
      "h5h7",
      "d7d8",
      "g3g8"
    ],
    "reward": 20
  },
  {
    "id": "m2-4",
    "kind": "mate2",
    "fen": "2r5/5pk1/8/2r2n2/b3N3/8/3KPP2/5B2 b - - 11 31",
    "solution": [
      "c5d5",
      "d2e1",
      "c8c1"
    ],
    "reward": 20
  },
  {
    "id": "tc-1",
    "kind": "tactic",
    "fen": "1n6/6b1/8/6r1/2P1P3/3PkP2/N7/4KBN1 b - - 1 28",
    "solution": [
      "g5g1"
    ],
    "reward": 15
  },
  {
    "id": "tc-2",
    "kind": "tactic",
    "fen": "rnbqkb1r/p2p2pp/7B/1ppPp3/6p1/5P2/PPP1P2P/RN1QKBNR b KQkq - 0 7",
    "solution": [
      "g7h6"
    ],
    "reward": 15
  },
  {
    "id": "tc-3",
    "kind": "tactic",
    "fen": "5k2/7r/1r1R4/p3p1pp/8/2P2PPB/4NK1R/1b6 b - - 2 32",
    "solution": [
      "b6d6"
    ],
    "reward": 15
  },
  {
    "id": "tc-4",
    "kind": "tactic",
    "fen": "4k1r1/1rp3pp/3p3n/4pb2/1n6/1PPP1PPN/7P/2BQ1K1R b - - 0 16",
    "solution": [
      "f5h3"
    ],
    "reward": 15
  },
  {
    "id": "tc-5",
    "kind": "tactic",
    "fen": "1r3bnr/p1qk1ppp/n1pp4/1p1Np3/5PP1/P6N/1PPPP2P/1RB1QK1R b - - 1 12",
    "solution": [
      "c6d5"
    ],
    "reward": 15
  },
  {
    "id": "tc-6",
    "kind": "tactic",
    "fen": "rn2kbnr/ppp1pp2/8/5bpp/Pq2p3/5P1N/R1PPK1PP/1NBQ1B1R b kq - 1 9",
    "solution": [
      "b4b1"
    ],
    "reward": 15
  },
  {
    "id": "tc-7",
    "kind": "tactic",
    "fen": "rnbqk1n1/1ppN4/8/p5p1/2P1P3/P2P3B/P4P1r/RN1QK2R b KQq - 2 12",
    "solution": [
      "h2h1"
    ],
    "reward": 15
  },
  {
    "id": "tc-8",
    "kind": "tactic",
    "fen": "r1bqkbnr/pp1pp3/7p/2P5/P1P2pP1/2NP3P/4nP2/1R1QKBNR b Kkq - 1 10",
    "solution": [
      "e2c3"
    ],
    "reward": 15
  },
  {
    "id": "tc-9",
    "kind": "tactic",
    "fen": "rnbqkbnr/p3p1p1/2p4p/1N1p1p2/8/3PPPP1/PPP4P/R1BQKBNR b KQkq - 0 6",
    "solution": [
      "c6b5"
    ],
    "reward": 15
  },
  {
    "id": "tc-10",
    "kind": "tactic",
    "fen": "r3k2r/p2nn3/5pp1/1p1Pp3/7R/1P1BP3/P2K2P1/R5N1 b kq - 0 25",
    "solution": [
      "h8h4"
    ],
    "reward": 15
  },
  // دفعة موسعة: ألغاز lichess حقيقية مخبوزة للعمل دون اتصال (مُتحقق منها آليا:
  // شرعية النقلات، المات الفعلي لألغاز المات، ووترية الحل) — يوليو 2026
  { id: "lc-72UK6", kind: "mate1", fen: "5rk1/5p2/2b3pp/2p5/1p1b1Q2/1P1P3P/2r3PB/2R2R1K b - - 0 34", solution: ["c6g2"], reward: 10, rating: 909 },
  { id: "lc-Ig0uw", kind: "mate1", fen: "3r2k1/pp3p2/2qb1PpQ/8/1P2p3/2P5/P5K1/R7 w - - 2 40", solution: ["h6g7"], reward: 10, rating: 893 },
  { id: "lc-528mF", kind: "mate1", fen: "r2q2rk/1p1n1p1p/p1np1b2/4p2Q/P7/2NB4/1PP2P1P/R1B1K1R1 w Q - 4 16", solution: ["h5h7"], reward: 10, rating: 909 },
  { id: "lc-nh0PV", kind: "mate1", fen: "rnbqk1nr/ppppbppp/4p3/8/5PP1/8/PPPPP2P/RNBQKBNR b KQkq - 0 3", solution: ["e7h4"], reward: 10, rating: 779 },
  { id: "lc-DBj7q", kind: "mate1", fen: "8/6pk/2p3qp/p7/3Q4/P2PnR1P/1PP3PK/8 b - - 0 34", solution: ["g6g2"], reward: 10, rating: 993 },
  { id: "lc-cPsbX", kind: "mate1", fen: "4rr1k/pp4pp/3p1N2/5b1P/3Q1p2/1P3B2/P2P1Pq1/2RK3R b - - 0 28", solution: ["g2f3"], reward: 10, rating: 1230 },
  { id: "lc-KsuRW", kind: "mate2", fen: "4r1k1/p4p1p/1p3r2/3qp1B1/6Q1/P7/1PP5/2K5 w - - 0 32", solution: ["g5f6", "g8f8", "g4g7"], reward: 20, rating: 938 },
  { id: "lc-x0V5K", kind: "mate2", fen: "6k1/1p3pBp/1p6/3r1N2/4n3/1P4P1/r4P1P/2R3K1 w - - 0 26", solution: ["c1c8", "d5d8", "c8d8"], reward: 20, rating: 940 },
  { id: "lc-wfZ8V", kind: "mate2", fen: "r1b3k1/pp3ppp/2p5/4r3/2P5/4B2P/1P4P1/3RR1K1 w - - 0 22", solution: ["d1d8", "e5e8", "d8e8"], reward: 20, rating: 627 },
  { id: "lc-WwJ0l", kind: "mate2", fen: "7k/1p1R1Qp1/pb3p1p/8/P7/2B1r2P/1P1K1Pq1/2R5 b - - 1 31", solution: ["g2f2", "d2d1", "f2e2"], reward: 20, rating: 1480 },
  { id: "lc-gKN48", kind: "mate2", fen: "3r1k2/pp1B2bp/1qnN2r1/8/8/7P/P3QPP1/4R1K1 w - - 0 27", solution: ["e2e8", "d8e8", "e1e8"], reward: 20, rating: 1591 },
  { id: "lc-3Yg5p", kind: "tactic", fen: "r1kq4/pp1b2Qp/1nn3p1/4B3/8/5P2/P4P1P/RNR3K1 b - - 0 20", solution: ["d8g5", "e5g3", "g5c1"], reward: 15, rating: 861 },
  { id: "lc-T2Ktn", kind: "tactic", fen: "4k3/1p2b1p1/2r5/pK1N3p/P7/1P5P/4R1P1/8 b - - 1 39", solution: ["c6c5", "b5b6", "c5d5"], reward: 15, rating: 791 },
  { id: "lc-ffYnP", kind: "tactic", fen: "6k1/5p2/4pP1P/3p3B/2pP4/2Pn4/4K3/8 b - - 2 44", solution: ["d3f4", "e2d1", "f4h5"], reward: 15, rating: 846 },
  { id: "lc-rX6yO", kind: "tactic", fen: "r2q1r1k/pp4pp/3b1n2/5p1Q/2Bn1N2/7P/PP3PP1/R1B2RK1 w - - 4 17", solution: ["f4g6"], reward: 15, rating: 1007 },
  { id: "lc-DD0u3", kind: "tactic", fen: "7k/R5p1/7p/2p2q1n/3b4/3P3P/1r1B2BK/3Q4 w - - 0 32", solution: ["a7a8", "h8h7", "g2e4", "f5e4", "d3e4"], reward: 15, rating: 1054 },
  { id: "lc-TuGrJ", kind: "tactic", fen: "2Rr2k1/p4rpp/Qp3p2/3qp3/8/6PP/PPR2P1K/8 w - - 11 33", solution: ["c8d8", "d5d8", "c2c8", "d8c8", "a6c8"], reward: 15, rating: 1002 },
  { id: "lc-YAT1h", kind: "tactic", fen: "6R1/8/7P/8/5p1K/5k2/8/2r5 b - - 6 58", solution: ["c1h1", "h4g5", "h1g1", "g5f6", "g1g8"], reward: 15, rating: 933 },
  { id: "lc-V4Aku", kind: "tactic", fen: "2k5/5R1p/P5p1/4P3/5K2/1P4P1/r7/8 b - - 0 43", solution: ["a2f2", "f4e4", "f2f7"], reward: 15, rating: 948 },
  { id: "lc-2Ek4f", kind: "tactic", fen: "3r1r2/5pkp/p4np1/1pp5/3p4/P2P1qPP/BPP1QP2/4RK1R b - - 2 23", solution: ["f3h1"], reward: 15, rating: 845 },
  { id: "lc-gMaO3", kind: "tactic", fen: "3r2k1/5ppp/2p5/3pP1Q1/3P4/7q/5P2/3R2K1 w - - 0 30", solution: ["g5d8"], reward: 15, rating: 867 },
  { id: "lc-SC3nB", kind: "tactic", fen: "2R5/P1r5/8/5p2/2k3p1/3p2P1/3K2P1/8 b - - 1 52", solution: ["c7c8", "a7a8q", "c8a8"], reward: 15, rating: 720 },
  { id: "lc-wHaKD", kind: "tactic", fen: "1bk2r1r/p1q3p1/Ppp1Nn2/4n1Bp/2P1N3/3P4/1P3PPP/R2Q1RK1 b - - 0 17", solution: ["e5f3", "g2f3", "c7h2"], reward: 15, rating: 1214 },
  { id: "lc-nrM4R", kind: "tactic", fen: "1k5r/1p1b1ppp/1Q6/2qp4/8/4rN2/4N1PP/1R2RK2 b - - 0 28", solution: ["e3f3", "g2f3", "d7h3"], reward: 15, rating: 1294 },
  { id: "lc-JL3Ey", kind: "tactic", fen: "8/8/4k1pp/3npp2/2R5/4PKPP/1r3P2/2N5 b - - 16 50", solution: ["e5e4", "c4e4", "f5e4"], reward: 15, rating: 944 },
  { id: "lc-Pp3Ib", kind: "tactic", fen: "7r/p4kN1/1p6/3pR1P1/8/2P5/PP6/K7 b - - 0 41", solution: ["h8h1", "e5e1", "h1e1"], reward: 15, rating: 978 },
  { id: "lc-Np8VF", kind: "tactic", fen: "r4r1k/1p3P1p/p3Q1p1/3p2P1/4p3/8/P2q3P/R4R1K w - - 1 27", solution: ["e6f6"], reward: 15, rating: 918 },
];

// ==== مدرسة السفاري: تعلم حركة كل قطعة بالتقاط البيادق (رقعة بلا ملوك، الدور يعود للاعب بعد كل نقلة) ====
const SCHOOL_LESSONS = [
  {
    id: "rook", icon: "🏰",
    name: { ar: "القلعة", en: "The Rook" },
    idea: { ar: "تتحرك في خطوط مستقيمة: أفقيا وعموديا", en: "Moves in straight lines: across and up-down" },
    stages: [
      { fen: "8/4p3/8/8/p3R2p/8/8/8 w - - 0 1", goal: "eat" },
      { fen: "8/1p6/8/8/2p5/8/6p1/R7 w - - 0 1", goal: "eat" },
    ],
  },
  {
    id: "bishop", icon: "⛪",
    name: { ar: "الفيل", en: "The Bishop" },
    idea: { ar: "ينزلق قطريا ويبقى على لونه دائما", en: "Slides diagonally and always keeps its color" },
    stages: [
      { fen: "8/1p6/2p5/3p4/4B3/8/8/8 w - - 0 1", goal: "eat" },
      { fen: "8/8/8/6p1/5p2/4p3/8/2B5 w - - 0 1", goal: "eat" },
    ],
  },
  {
    id: "queen", icon: "👑",
    name: { ar: "الوزير", en: "The Queen" },
    idea: { ar: "أقوى قطعة: قلعة وفيل معا", en: "The strongest piece: rook and bishop combined" },
    stages: [
      { fen: "8/3p4/8/8/p5p1/8/8/3Q4 w - - 0 1", goal: "eat" },
      { fen: "1p6/8/8/4Q2p/8/8/7p/8 w - - 0 1", goal: "eat" },
    ],
  },
  {
    id: "knight", icon: "🐴",
    name: { ar: "الحصان", en: "The Knight" },
    idea: { ar: "يقفز على شكل حرف L فوق أي قطعة", en: "Jumps in an L shape over anything" },
    stages: [
      { fen: "8/4p3/8/3p4/8/2p5/8/1N6 w - - 0 1", goal: "eat" },
      { fen: "8/3p4/8/4p3/8/5p2/8/6N1 w - - 0 1", goal: "eat" },
    ],
  },
  {
    id: "pawn", icon: "🌱",
    name: { ar: "البيدق", en: "The Pawn" },
    idea: { ar: "يتقدم للأمام ويلتقط قطريا... ويحلم بالترقية", en: "Marches forward, captures diagonally... and dreams of promotion" },
    stages: [
      { fen: "8/8/8/7p/6p1/5p2/4P3/8 w - - 0 1", goal: "eat" },
      { fen: "8/8/8/8/8/8/2P5/8 w - - 0 1", goal: "promote" },
    ],
  },
  {
    id: "king", icon: "🤴",
    name: { ar: "الملك", en: "The King" },
    idea: { ar: "خطوة واحدة في أي اتجاه — وبحذر شديد", en: "One careful step in any direction" },
    stages: [
      { fen: "8/8/8/8/2p3p1/4p3/8/4K3 w - - 0 1", goal: "eat" },
    ],
  },
  // الدروس المتقدمة: strict = النقلة التي لا تحقق الهدف تعيد المرحلة
  // (وإلا ضاعت حقوق التبييت أو فرصة الأخذ في المرور إلى الأبد)
  {
    id: "castle", icon: "🏯",
    name: { ar: "التبييت", en: "Castling" },
    idea: { ar: "الملك يحتمي والقلعة تستيقظ — في نقلة واحدة", en: "The king tucks in and the rook wakes up — in one move" },
    stages: [
      { fen: "8/8/8/8/8/8/8/4K2R w K - 0 1", goal: "castle", strict: true },
      { fen: "8/8/8/8/8/8/8/R3K3 w Q - 0 1", goal: "castle", strict: true },
    ],
  },
  {
    id: "enpassant", icon: "👻",
    name: { ar: "الأخذ في المرور", en: "En passant" },
    idea: { ar: "أغرب قاعدة في الشطرنج: التقط البيدق العابر", en: "The strangest rule in chess: capture the passing pawn" },
    stages: [
      { fen: "8/8/8/3pP3/8/8/8/8 w - d6 0 1", goal: "eat", strict: true, hint: "schoolGoalEp" },
      { fen: "8/8/8/1pP5/8/8/8/8 w - b6 0 1", goal: "eat", strict: true, hint: "schoolGoalEp" },
    ],
  },
  {
    id: "checkmate", icon: "⚔️",
    name: { ar: "الكش والمات", en: "Check & mate" },
    idea: { ar: "هدد الملك... ثم اقطع عليه كل طرق الهرب", en: "Threaten the king... then cut off every escape" },
    stages: [
      { fen: "4k3/8/8/8/8/8/8/3QK3 w - - 0 1", goal: "check", strict: true },
      { fen: "6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1", goal: "mate", strict: true },
      { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4", goal: "mate", strict: true },
    ],
  },
];

// ==== مدرب النهايات: وضعيات محسومة نظريا — المحرك يدافع بأقصى قوة واللاعب يتقن الحسم ====
const ENDGAME_DRILLS = [
  {
    id: "tworooks", icon: "🪜", fen: "4k3/8/8/8/8/8/8/R3K2R w - - 0 1",
    name: { ar: "سلم القلعتين", en: "Two-rook ladder" },
    idea: { ar: "قص الصفوف على الملك صفا بعد صف حتى المات", en: "Cut off ranks one after another until mate" },
  },
  {
    id: "queenmate", icon: "👑", fen: "3k4/8/8/8/8/8/8/3QK3 w - - 0 1",
    name: { ar: "مات الوزير", en: "Queen mate" },
    idea: { ar: "حاصر الملك بالوزير على بعد حصان ثم اقترب بملكك — واحذر التعادل!", en: "Box the king a knight's move away, bring your king — beware stalemate!" },
  },
  {
    id: "rookmate", icon: "🏰", fen: "4k3/8/8/8/8/8/8/4K2R w - - 0 1",
    name: { ar: "مات القلعة", en: "Rook mate" },
    idea: { ar: "ملكك وقلعتك معا يدفعان الملك إلى الحافة", en: "King and rook together push the king to the edge" },
  },
  {
    id: "pawnwin", icon: "🌱", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    name: { ar: "ترقية البيدق", en: "Promote the pawn" },
    idea: { ar: "ملكك أمام البيدق يفتح له طريق الترقية ثم المات", en: "Your king ahead of the pawn clears its path to promotion, then mate" },
  },
];

const Puzzles = (() => {
  // مواضيع التدريب — تُمرر كما هي إلى lichess (angle)
  const THEMES = [
    { id: "mix",          icon: "🎲" },
    { id: "mateIn1",      icon: "⚡" },
    { id: "mateIn2",      icon: "🎯" },
    { id: "fork",         icon: "🍴" },
    { id: "pin",          icon: "📌" },
    { id: "skewer",       icon: "🍢" },
    { id: "hangingPiece", icon: "🎁" },
    { id: "sacrifice",    icon: "💥" },
    { id: "endgame",      icon: "🏁" },
  ];

  // تحويل صيغة lichess الموحدة إلى صيغة اللعبة:
  // نعيد بناء الوضعية من PGN، واصطلاح lichess أن أول نقلة في الحل
  // نقلة الخصم التمهيدية (حين يكون الحل زوجي الطول) فتُطبق مسبقا
  function fromLichess(data, extra = {}) {
    const g = new Chess();
    const moves = data.game.pgn.trim().split(/\s+/);
    for (const m of moves) g.move(m);
    const solution = [...data.puzzle.solution];
    if (solution.length % 2 === 0) {
      const u = solution.shift();
      g.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined });
    }
    return {
      id: "lichess-" + data.puzzle.id,
      fen: g.fen(),
      solution,
      rating: data.puzzle.rating,
      ...extra,
    };
  }

  async function getJSON(url) {
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    if (!resp.ok) throw new Error("puzzle fetch failed");
    return resp.json();
  }

  // لغز اليوم
  async function fetchDaily() {
    const data = await getJSON("https://lichess.org/api/puzzle/daily");
    return fromLichess(data, { kind: "daily", reward: 25 });
  }

  // لغز جديد حسب الموضوع والصعوبة — ألغاز حقيقية بلا حدود
  // بعض مباريات lichess فيها ترقيات متعددة (أكثر من وزير للاعب الواحد) —
  // نرفض هذه الوضعيات الغريبة ونعيد المحاولة حفاظا على البساطة
  async function fetchNext(theme = "mix", difficulty = "normal") {
    let p = null;
    for (let i = 0; i < 3; i++) {
      const data = await getJSON(
        `https://lichess.org/api/puzzle/next?angle=${encodeURIComponent(theme)}&difficulty=${encodeURIComponent(difficulty)}`
      );
      p = fromLichess(data, { kind: "theme", theme, difficulty, reward: 15 });
      const placement = p.fen.split(" ")[0];
      const wq = (placement.match(/Q/g) || []).length;
      const bq = (placement.match(/q/g) || []).length;
      if (wq <= 1 && bq <= 1) return p;
    }
    return p;
  }

  function packByKind(kind) { return PUZZLE_PACK.filter((p) => p.kind === kind); }

  return { fetchDaily, fetchNext, THEMES, PACK: PUZZLE_PACK, packByKind };
})();
