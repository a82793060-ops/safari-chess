// ==== مؤثّرات: مشهد الدخول ====
/* global Sounds */

const FX = (() => {
  // ---- علامات المزاج (تُحقن داخل SVG الصورة) ----
  const MOOD_MARKS = {
    happy: `<g class="mood-mark"><path d="M78 14 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="#ffd93b" stroke="#c98a00" stroke-width="1.5"/><circle cx="16" cy="20" r="3" fill="#ffd93b" opacity=".8"/></g>`,
    worried: `<g class="mood-mark"><path d="M80 12 C86 16 87 24 82 28 C77 24 76 16 80 12 Z" fill="#7ec8f0" stroke="#4a94c4" stroke-width="1.5"/></g>`,
    angry: `<g class="mood-mark"><g stroke="#e74c3c" stroke-width="3.5" stroke-linecap="round" fill="none"><path d="M76 12 L84 20 M84 12 L76 20"/><path d="M88 18 L93 23 M93 18 L88 23" stroke-width="2.5"/></g></g>`,
    shocked: `<g class="mood-mark"><text x="82" y="24" font-size="24" font-weight="bold" fill="#f4c430" stroke="#a8820a" stroke-width="1" text-anchor="middle">!</text></g>`,
    love: `<g class="mood-mark"><path d="M80 13 C77 9 71 11 71 16 C71 20 76 23 80 26 C84 23 89 20 89 16 C89 11 83 9 80 13 Z" fill="#ff6b81" stroke="#d64560" stroke-width="1.5"/></g>`,
  };

  let moodTimer = null;

  // منصّة تعليمية محايدة: بلا رموز مزاج للخصم
  function mood() {}

  // ---- مؤثّرات صوتية (Web Audio) ----
  function actx() {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    return FX._ctx || (FX._ctx = c);
  }
  function blip(t0, f1, f2, dur, type = "sine", gain = 0.14) {
    try {
      const c = actx(), t = c.currentTime + t0;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f1, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(f2, 1), t + dur);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* الصوت غير متاح */ }
  }
  function growl(t0, freq, dur, gain = 0.2) {
    try {
      const c = actx(), t = c.currentTime + t0;
      const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = "sawtooth"; o.frequency.value = freq;
      lfo.frequency.value = 28; lg.gain.value = gain * 0.7;
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 400;
      o.connect(lp).connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur); lfo.start(t); lfo.stop(t + dur);
    } catch { /* الصوت غير متاح */ }
  }

  const VOICES = {
    chick:  () => { blip(0, 1400, 1900, 0.09); blip(0.14, 1500, 2000, 0.09); blip(0.28, 1300, 1800, 0.12); },
    rabbit: () => { blip(0, 500, 1100, 0.12, "triangle"); blip(0.15, 600, 1300, 0.14, "triangle"); },
    panda:  () => { blip(0, 220, 150, 0.3, "sine", 0.2); blip(0.3, 190, 130, 0.35, "sine", 0.18); },
    lion:   () => { growl(0, 95, 0.9, 0.25); blip(0, 180, 90, 0.8, "sawtooth", 0.1); },
    fox:    () => { blip(0, 900, 1600, 0.1, "square", 0.08); blip(0.12, 1000, 1700, 0.1, "square", 0.08); blip(0.24, 850, 1500, 0.13, "square", 0.08); },
    owl:    () => { blip(0, 420, 380, 0.25, "sine", 0.18); blip(0.35, 420, 340, 0.4, "sine", 0.18); },
    wolf:   () => { blip(0, 300, 700, 0.5, "sine", 0.16); blip(0.5, 700, 350, 0.7, "sine", 0.14); },
    tiger:  () => { growl(0, 120, 0.7, 0.22); },
    dragon: () => { growl(0, 70, 1.1, 0.28); blip(0.15, 500, 100, 0.9, "sawtooth", 0.06); },
  };
  function voice() { /* منصّة تعليمية محايدة: بلا أصوات خصم */ }

  // ---- مشهد الدخول (VS) ----
  const ENTRY_ANIM = {
    chick: "entry-hop", rabbit: "entry-hop", panda: "entry-roll",
    lion: "entry-stomp", fox: "entry-slide", owl: "entry-drop",
    wolf: "entry-slide", tiger: "entry-stomp", dragon: "entry-drop",
  };

  function intro(botAvatarSVG, botName, botElo, humanLabel, botId, done) {
    const ov = document.getElementById("intro-overlay");
    ov.innerHTML = `
      <div class="intro-card intro-left">
        <div class="intro-avatar">🧑</div>
        <div class="intro-name">${humanLabel}</div>
      </div>
      <div class="intro-vs">VS</div>
      <div class="intro-card intro-right ${ENTRY_ANIM[botId] || "entry-drop"}">
        <div class="intro-avatar">${botAvatarSVG}</div>
        <div class="intro-name">${botName}</div>
        <div class="intro-elo">${botElo}</div>
      </div>`;
    ov.hidden = false;
    voice(botId);
    const finish = () => {
      ov.classList.add("intro-out");
      setTimeout(() => { ov.hidden = true; ov.classList.remove("intro-out"); done && done(); }, 300);
    };
    const timer = setTimeout(finish, 1900);
    ov.onclick = () => { clearTimeout(timer); finish(); };
  }

  return { mood, voice, intro };
})();
