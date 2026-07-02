// ==== الأصوات ====
// الأصوات الكلاسيكية من مجموعة lichess المفتوحة المصدر (lichess.org, AGPL)
// مع بديل مولّد عبر Web Audio في حال تعذر تحميلها

const Sounds = (() => {
  let ctx = null;
  let enabled = localStorage.getItem("safari-sound") !== "off";
  const buffers = {};

  const CDN = "https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/sound/standard/";
  const FILES = {
    move: "Move.mp3",
    capture: "Capture.mp3",
    illegal: "Error.mp3",
    notify: "GenericNotify.mp3",
    win: "Victory.mp3",
    lose: "Defeat.mp3",
    draw: "Draw.mp3",
  };

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // تحميل مسبق للملفات الصوتية
  async function preload() {
    const c = ac();
    await Promise.allSettled(
      Object.entries(FILES).map(async ([key, file]) => {
        const resp = await fetch(CDN + file);
        const data = await resp.arrayBuffer();
        buffers[key] = await c.decodeAudioData(data);
      })
    );
  }
  // نبدأ التحميل عند أول تفاعل (سياسة المتصفحات لتشغيل الصوت)
  let preloadStarted = false;
  function ensurePreload() {
    if (!preloadStarted) { preloadStarted = true; preload().catch(() => {}); }
  }
  window.addEventListener("pointerdown", ensurePreload, { once: true });

  function play(key, gain = 1) {
    if (!enabled) return false;
    const buf = buffers[key];
    if (!buf) return false;
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(g).connect(c.destination);
    src.start();
    return true;
  }

  // ---- بديل مولّد في حال عدم توفر الملفات ----
  function knock(when = 0, { freq = 1700, thump = 150, gain = 0.5, dur = 0.07 } = {}) {
    const c = ac(), t = c.currentTime + when;
    const noise = c.createBufferSource();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 2;
    noise.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 1.2;
    const ng = c.createGain();
    ng.gain.setValueAtTime(gain, t);
    ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    noise.connect(bp).connect(ng).connect(c.destination);
    noise.start(t);
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(thump, t);
    osc.frequency.exponentialRampToValueAtTime(thump * 0.6, t + 0.08);
    const og = c.createGain();
    og.gain.setValueAtTime(gain * 0.9, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(og).connect(c.destination);
    osc.start(t); osc.stop(t + 0.1);
  }

  function tone(when, freq, dur = 0.12, gain = 0.18, type = "triangle") {
    const c = ac(), t = c.currentTime + when;
    const osc = c.createOscillator();
    osc.type = type; osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t); osc.stop(t + dur);
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      localStorage.setItem("safari-sound", enabled ? "on" : "off");
      if (enabled) ensurePreload();
      return enabled;
    },
    move()    { if (enabled && !play("move")) knock(0); },
    capture() { if (enabled && !play("capture")) { knock(0, { freq: 1100, thump: 120, gain: 0.6 }); knock(0.045, { freq: 2000, gain: 0.3, dur: 0.05 }); } },
    castle()  { if (enabled && !play("move")) { knock(0); knock(0.11, { freq: 1400 }); } },
    check()   { if (enabled && !play("notify", 0.6)) { tone(0.02, 880, 0.15, 0.14); tone(0.1, 1174, 0.18, 0.12); } },
    promote() { if (enabled) { tone(0, 784, 0.1); tone(0.08, 988, 0.1); tone(0.16, 1319, 0.2); } },
    illegal() { if (enabled && !play("illegal", 0.5)) tone(0, 180, 0.12, 0.2, "square"); },
    win()     { if (enabled && !play("win")) [523, 659, 784, 1047].forEach((f, i) => tone(i * 0.13, f, 0.28, 0.2)); },
    lose()    { if (enabled && !play("lose")) [392, 330, 262, 196].forEach((f, i) => tone(i * 0.16, f, 0.3, 0.18, "sine")); },
    drawEnd() { if (enabled && !play("draw")) { tone(0, 440, 0.2); tone(0.18, 440, 0.3); } },
    notify()  { if (enabled && !play("notify")) tone(0, 660, 0.2, 0.15); },
  };
})();
