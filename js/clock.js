// ==== ساعة الشطرنج ====
// أطوار زمنية اختيارية، مع مزامنة عبر رسائل النقلات في طور الأونلاين

const Clock = (() => {
  const CONTROLS = [
    { id: "none", initial: 0,   inc: 0, label: "∞" },
    { id: "1+0",  initial: 60,  inc: 0, label: "1+0 ⚡" },
    { id: "3+2",  initial: 180, inc: 2, label: "3+2" },
    { id: "5+0",  initial: 300, inc: 0, label: "5+0" },
    { id: "10+0", initial: 600, inc: 0, label: "10+0" },
  ];

  let tc = CONTROLS[0];
  let remaining = { w: 0, b: 0 };  // بالمللي ثانية
  let running = null;              // اللون الذي تعد ساعته
  let lastTick = 0;
  let interval = null;
  let onFlag = null;               // نداء عند سقوط الراية
  let els = { w: null, b: null };

  function setControl(id) { tc = CONTROLS.find((c) => c.id === id) || CONTROLS[0]; }
  function active() { return tc.initial > 0; }

  function start(whiteEl, blackEl, flagCb) {
    els = { w: whiteEl, b: blackEl };
    onFlag = flagCb;
    remaining = { w: tc.initial * 1000, b: tc.initial * 1000 };
    running = null;
    stopTicking();
    render();
  }

  function switchTo(color) {
    if (!active()) return;
    if (running && running !== color) remaining[running] += tc.inc * 1000;
    running = color;
    lastTick = performance.now();
    if (!interval) interval = setInterval(tick, 100);
    render();
  }

  function tick() {
    if (!running) return;
    const now = performance.now();
    remaining[running] = Math.max(0, remaining[running] - (now - lastTick));
    lastTick = now;
    render();
    if (remaining[running] <= 0) {
      const flagged = running;
      halt();
      onFlag && onFlag(flagged);
    }
  }

  function halt() { running = null; stopTicking(); render(); }
  function stopTicking() { clearInterval(interval); interval = null; }

  // مزامنة أونلاين: الطرف الآخر يرسل وقته المتبقي مع كل نقلة
  function syncRemote(color, ms) {
    if (active() && typeof ms === "number") remaining[color] = Math.max(0, ms);
    render();
  }
  function remainingOf(color) { return Math.round(remaining[color]); }

  function fmt(ms) {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  function render() {
    for (const c of ["w", "b"]) {
      const el = els[c];
      if (!el) continue;
      el.hidden = !active();
      if (!active()) continue;
      el.textContent = fmt(remaining[c]);
      el.classList.toggle("clock-low", remaining[c] < 20000);
      el.classList.toggle("clock-running", running === c);
    }
  }

  return { CONTROLS, setControl, active, start, switchTo, halt, syncRemote, remainingOf, get control() { return tc; } };
})();
