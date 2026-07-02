// ==== غلاف محرك Stockfish (يُحمَّل من CDN كـ Web Worker) ====
// نسخة asm.js: ملف واحد يعمل داخل Worker بلا ملفات مساعدة
const SF_URL = "https://cdn.jsdelivr.net/npm/stockfish@10.0.2/src/stockfish.asm.js";

const Engine = (() => {
  let worker = null;
  let readyPromise = null;
  let moveResolve = null;

  function send(cmd) { worker.postMessage(cmd); }

  function init() {
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      const resp = await fetch(SF_URL);
      if (!resp.ok) throw new Error("fetch failed: " + resp.status);
      const code = await resp.text();
      const blob = new Blob([code], { type: "application/javascript" });
      worker = new Worker(URL.createObjectURL(blob));
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("uci timeout")), 15000);
        worker.onmessage = (e) => {
          const line = String(e.data);
          if (line === "uciok") { clearTimeout(timer); resolve(); }
        };
        worker.onerror = (e) => { clearTimeout(timer); reject(e); };
        send("uci");
      });
      // مستمع دائم لاستخراج أفضل نقلة
      worker.onmessage = (e) => {
        const line = String(e.data);
        const m = line.match(/^bestmove\s+(\S+)/);
        if (m && moveResolve) {
          const r = moveResolve; moveResolve = null;
          r(m[1] === "(none)" ? null : m[1]);
        }
      };
      send("setoption name Ponder value false");
      send("isready");
      return true;
    })();
    readyPromise.catch(() => { readyPromise = null; worker = null; });
    return readyPromise;
  }

  async function bestMove(fen, { skill = 20, depth = 12 } = {}) {
    await init();
    send(`setoption name Skill Level value ${skill}`);
    send(`position fen ${fen}`);
    return new Promise((resolve) => {
      moveResolve = resolve;
      send(`go depth ${depth}`);
    });
  }

  function stop() { if (worker && moveResolve) send("stop"); }

  return { init, bestMove, stop, get ready() { return !!readyPromise; } };
})();
