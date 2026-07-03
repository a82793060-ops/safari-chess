// ==== تحليل ما بعد المباراة + المدرب الفوري ====
/* global Chess, Engine, t, LANG */

const Analysis = (() => {
  // تصنيف النقلة حسب الخسارة بالسنتي-بيدق
  function classify(cpLoss, wasBest) {
    if (wasBest || cpLoss <= 15) return "best";     // ✨ ممتازة
    if (cpLoss <= 60) return "good";                 // 👍 جيدة
    if (cpLoss <= 150) return "ok";                  // ◻️ مقبولة
    if (cpLoss <= 300) return "mistake";             // ❓ خطأ
    return "blunder";                                // ⁉️ فادح
  }
  const BADGE = { best: "✨", good: "👍", ok: "▫️", mistake: "❓", blunder: "⁉️" };

  // تحليل مباراة كاملة: يصنف نقلات playerColor فقط
  // onProgress(i, total, entry) يُستدعى لكل نقلة مُحللة
  async function analyzeGame(history, playerColor, { depth = 10, onProgress, isCancelled } = {}) {
    const replay = new Chess();
    const entries = [];
    const playerPlies = history.filter((m) => m.color === playerColor).length;
    let done = 0;

    // تقييم من منظور اللاعب
    const evalFor = async (fen) => {
      const turn = fen.split(" ")[1];
      const r = await Engine.evaluate(fen, { depth });
      return { score: turn === playerColor ? r.score : -r.score, best: r.best };
    };

    let before = await evalFor(replay.fen()); // تقييم البداية
    for (const mv of history) {
      if (isCancelled && isCancelled()) return entries;
      const fenBefore = replay.fen();
      replay.move(mv.san);
      const after = await evalFor(replay.fen());
      if (mv.color === playerColor) {
        const uci = mv.from + mv.to + (mv.promotion || "");
        const cpLoss = Math.max(0, before.score - after.score);
        const entry = {
          san: mv.san, uci, fenBefore,
          cls: classify(cpLoss, before.best === uci),
          badge: BADGE[classify(cpLoss, before.best === uci)],
          cpLoss: Math.round(cpLoss),
          bestUci: before.best,
          evalAfter: after.score,
        };
        entries.push(entry);
        done++;
        onProgress && onProgress(done, playerPlies, entry);
      } else {
        entries.push({ san: mv.san, cls: "opp", evalAfter: after.score });
      }
      before = after;
    }
    return entries;
  }

  // ---- المدرب الفوري (للمستويات المنخفضة) ----
  const COACH = {
    ar: {
      blunder: ["انتبه! هذه النقلة أضعفت موقعك كثيرا 😟", "أوه! يبدو أنك تركت شيئا مهما بلا حماية", "نقلة خطرة... راقب قطعك جيدا في المرة القادمة"],
      praise: ["نقلة ممتازة! أحسنت 👏", "رائع! هذا بالضبط ما كان سيلعبه الأستاذ", "عبقري! استمر هكذا 🌟"],
    },
    en: {
      blunder: ["Careful! That move weakened your position a lot 😟", "Oops! Looks like you left something unprotected", "Risky move... watch your pieces next time"],
      praise: ["Excellent move! Well done 👏", "Brilliant! Exactly what a master would play", "Genius! Keep it up 🌟"],
    },
  };
  let lastCoachPly = -10;

  // فحص سريع بعد نقلة اللاعب — يعيد رسالة أو null
  async function coachCheck(fenBefore, fenAfter, playerUci, plyIndex, playerColor) {
    if (plyIndex - lastCoachPly < 4) return null; // لا نزعج اللاعب كثيرا
    const evalFor = async (fen) => {
      const turn = fen.split(" ")[1];
      const r = await Engine.evaluate(fen, { depth: 8 });
      return { score: turn === playerColor ? r.score : -r.score, best: r.best };
    };
    try {
      const before = await evalFor(fenBefore);
      const after = await evalFor(fenAfter);
      const loss = before.score - after.score;
      const msgs = COACH[LANG] || COACH.ar;
      if (loss > 280) {
        lastCoachPly = plyIndex;
        return { kind: "blunder", text: msgs.blunder[Math.floor(Math.random() * msgs.blunder.length)] };
      }
      if (before.best === playerUci && before.score > -200 && Math.random() < 0.4) {
        lastCoachPly = plyIndex;
        return { kind: "praise", text: msgs.praise[Math.floor(Math.random() * msgs.praise.length)] };
      }
    } catch { /* المحرك غير متاح */ }
    return null;
  }
  function resetCoach() { lastCoachPly = -10; }

  return { analyzeGame, coachCheck, resetCoach, BADGE };
})();
