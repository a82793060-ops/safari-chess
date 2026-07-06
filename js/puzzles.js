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
  }
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
  async function fetchNext(theme = "mix", difficulty = "normal") {
    const data = await getJSON(
      `https://lichess.org/api/puzzle/next?angle=${encodeURIComponent(theme)}&difficulty=${encodeURIComponent(difficulty)}`
    );
    return fromLichess(data, { kind: "theme", theme, difficulty, reward: 15 });
  }

  function packByKind(kind) { return PUZZLE_PACK.filter((p) => p.kind === kind); }

  return { fetchDaily, fetchNext, THEMES, PACK: PUZZLE_PACK, packByKind };
})();
