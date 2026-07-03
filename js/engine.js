// ==== غلاف محرك Stockfish ====
// يُحمَّل محليا (للعمل دون اتصال ضمن PWA) مع بديل من CDN،
// ويوفر طابور مهام: أفضل نقلة + تقييم المواقع للتحليل والمدرب

const SF_LOCAL = "js/lib/stockfish.asm.js";
const SF_CDN = "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.asm.js";

const Engine = (() => {
  let worker = null;
  let readyPromise = null;
  let queue = Promise.resolve();
  let lineHandler = null;

  function send(cmd) { worker.postMessage(cmd); }

  async function fetchCode() {
    try {
      const r = await fetch(SF_LOCAL);
      if (r.ok) return await r.text();
    } catch { /* جرب الشبكة */ }
    const r = await fetch(SF_CDN);
    if (!r.ok) throw new Error("engine fetch failed");
    return await r.text();
  }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      const code = await fetchCode();
      const blob = new Blob([code], { type: "application/javascript" });
      worker = new Worker(URL.createObjectURL(blob));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("uci timeout")), 20000);
        worker.onmessage = (e) => {
          if (String(e.data) === "uciok") { clearTimeout(timer); resolve(); }
        };
        worker.onerror = (e) => { clearTimeout(timer); reject(e); };
        send("uci");
      });
      worker.onmessage = (e) => { if (lineHandler) lineHandler(String(e.data)); };
      send("setoption name Ponder value false");
      return true;
    })();
    readyPromise.catch(() => { readyPromise = null; worker = null; });
    return readyPromise;
  }

  // تنفيذ متسلسل: أمر go واحد في كل لحظة
  function enqueue(job) {
    const run = queue.then(job, job);
    queue = run.catch(() => {});
    return run;
  }

  // يعيد {best, cp, mate} — التقييم من منظور صاحب الدور
  function goAndCollect(fen, goCmd, skill) {
    return enqueue(async () => {
      await init();
      send(`setoption name Skill Level value ${skill}`);
      send(`position fen ${fen}`);
      return new Promise((resolve) => {
        let cp = null, mate = null;
        const timer = setTimeout(() => { lineHandler = null; resolve({ best: null, cp, mate }); }, 30000);
        lineHandler = (line) => {
          const sc = line.match(/score (cp|mate) (-?\d+)/);
          if (sc) { if (sc[1] === "cp") { cp = +sc[2]; mate = null; } else { mate = +sc[2]; cp = null; } }
          const bm = line.match(/^bestmove\s+(\S+)/);
          if (bm) {
            clearTimeout(timer);
            lineHandler = null;
            resolve({ best: bm[1] === "(none)" ? null : bm[1], cp, mate });
          }
        };
        send(goCmd);
      });
    });
  }

  async function bestMove(fen, { skill = 20, depth = 12 } = {}) {
    return (await goAndCollect(fen, `go depth ${depth}`, skill)).best;
  }

  // تقييم رقمي موحّد: بالسنتي-بيدق من منظور صاحب الدور (كش مات = ±10000)
  async function evaluate(fen, { depth = 10 } = {}) {
    const r = await goAndCollect(fen, `go depth ${depth}`, 20);
    let score = 0;
    if (r.mate !== null) score = r.mate > 0 ? 10000 - r.mate : -10000 - r.mate;
    else if (r.cp !== null) score = r.cp;
    return { score, best: r.best, mate: r.mate };
  }

  function stop() { if (worker) send("stop"); }

  return { init, bestMove, evaluate, stop, get ready() { return !!readyPromise; } };
})();
