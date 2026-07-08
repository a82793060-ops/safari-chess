// ==== شطرنج السفاري — المنطق الرئيسي ====
/* global Chess, BOTS, botAvatar, botPhrase, pieceSVG, Sounds, Engine, Net, Meta, FX, Clock, Analysis, Puzzles, Share, t, applyLang, toggleLang, LANG */

const $ = (sel) => document.querySelector(sel);

// ---- الحالة ----
let game = new Chess();
let currentBot = BOTS[0];
let mode = "bot"; // bot | online | watch | puzzle
let playerColor = "w";
let colorSetting = "random";
let orientation = "w";
let selectedSq = null;
let legalTargets = [];
let gameOver = false;
let gameToken = 0;
let pendingPromotion = null;
let pieceEls = {};
let bubbleTimer = null;
let coachTimer = null;
let undoUsed = false;
let dailyActive = false;
let rewardsRecorded = false;
let hostPeerId = null;
let setupTab = "bot";
// وضع الألغاز
let puzzle = null, puzzleStep = 0, puzzleFailed = false;
// سلسلة الألغاز
let rush = null; // {queue: [...], count: 0}
// طور اللعب المتغير: standard | koth | 3check
let variant = "standard";
// وضع التحليل
let analysisEntries = null, analysisPly = 0, analysisCancel = false;

const boardEl = $("#board");
const FILES = "abcdefgh";

const FRIEND_AVATAR = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f2c94c"/>
  <circle cx="50" cy="42" r="20" fill="#f9e0c0" stroke="#8d6a45" stroke-width="3"/>
  <path d="M30 40 C30 26 40 20 50 20 C60 20 70 26 70 40 L64 38 C60 30 40 30 36 38 Z" fill="#5a4632" stroke="#3e2f20" stroke-width="2.5"/>
  <circle cx="43" cy="42" r="3" fill="#2b2118"/><circle cx="57" cy="42" r="3" fill="#2b2118"/>
  <path d="M44 51 Q50 56 56 51" fill="none" stroke="#8d6a45" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M25 95 C25 72 38 66 50 66 C62 66 75 72 75 95 Z" fill="#4f7fbf" stroke="#35597e" stroke-width="3"/>
</svg>`;

// ============ الشريط العلوي: العدادات ============
let _lastRankId = null;
function updateChips() {
  $("#chip-elo b").textContent = Meta.profile.elo;
  const rk = Meta.rank();
  const chip = $("#chip-bananas");
  chip.innerHTML = `${rk.icon} <b>${rk[LANG] || rk.ar}</b>`;
  chip.title = t("points", { n: Meta.profile.bananas });
  if (_lastRankId !== null && rk.id !== _lastRankId) notifyRankUp(rk);
  _lastRankId = rk.id;
}

// ============ شاشة الإعداد ============
function buildHero() {
  // البوت التالي غير المهزوم = وجهة الرحلة الحالية
  let nextIdx = BOTS.findIndex((b, i) => Meta.botUnlocked(i) && !(Meta.profile.stars[b.id] > 0));
  if (nextIdx === -1) nextIdx = BOTS.length - 1; // الرحلة مكتملة
  const nextBot = BOTS[nextIdx];
  const beaten = BOTS.filter((b) => (Meta.profile.stars[b.id] || 0) > 0).length;
  const totalStars = BOTS.reduce((s, b) => s + (Meta.profile.stars[b.id] || 0), 0);
  $("#hero-avatar").innerHTML = botAvatar(nextBot);
  $("#hero-next").textContent = beaten >= BOTS.length
    ? t("journeyDone")
    : t("nextFoe", { bot: nextBot.name[LANG], elo: nextBot.elo });
  $("#hero-bar-fill").style.width = Math.round((beaten / BOTS.length) * 100) + "%";
  $("#hero-stats").innerHTML = `<b>${beaten}</b>/${BOTS.length} · ⭐<b>${totalStars}</b>`;
  const btn = $("#btn-continue");
  btn.onclick = () => {
    currentBot = nextBot;
    mode = "bot";
    dailyActive = false;
    startGame();
  };
}

function buildSetup() {
  buildHero();
  buildJourney();
  buildDailyBanner();
  buildStats();
  buildTcPicker();
  buildPuzzlesScreen();
  $("#cp-white").innerHTML = pieceSVG("k", "w");
  $("#cp-black").innerHTML = pieceSVG("k", "b");
  updateChips();
}

function starsRow(botId) {
  const s = Meta.profile.stars[botId] || 0;
  return `<div class="bot-stars">${[1, 2, 3].map((i) => `<span class="${i <= s ? "" : "off"}">⭐</span>`).join("")}</div>`;
}

function buildJourney() {
  const grid = $("#bot-grid");
  grid.innerHTML = "";
  BOTS.forEach((bot, i) => {
    const unlocked = Meta.botUnlocked(i);
    const card = document.createElement("div");
    card.className = "bot-card" + (unlocked ? (bot === currentBot ? " selected" : "") : " locked");
    card.innerHTML = `
      ${unlocked ? "" : '<span class="lock-badge">🔒</span>'}
      <div class="bot-avatar-svg">${botAvatar(bot)}</div>
      <div class="bot-name">${bot.name[LANG]}</div>
      <div class="bot-elo-badge">${bot.elo}</div>
      ${starsRow(bot.id)}`;
    card.addEventListener("click", () => {
      if (!Meta.botUnlocked(i)) {
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        $("#engine-status").textContent = t("locked");
        setTimeout(() => { if ($("#engine-status").textContent === t("locked")) $("#engine-status").textContent = ""; }, 2500);
        return;
      }
      currentBot = bot;
      grid.querySelectorAll(".bot-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
    grid.appendChild(card);
  });
  // اختر أول بوت مفتوح إذا كان الحالي مقفلا
  const curIdx = BOTS.indexOf(currentBot);
  if (!Meta.botUnlocked(curIdx)) currentBot = BOTS[0];
}

function buildDailyBanner() {
  const d = Meta.dailyChallenge();
  const el = $("#daily-banner");
  el.classList.toggle("done", d.done);
  if (d.done) {
    el.innerHTML = `<span class="db-icon">✅</span><div class="db-text"><div class="db-title">${t("dailyTitle")}</div><div class="db-desc">${t("dailyDone")}</div></div>`;
  } else {
    el.innerHTML = `
      <span class="db-icon">🎯</span>
      <div class="db-text">
        <div class="db-title">${t("dailyTitle")}</div>
        <div class="db-desc">${t("dailyDesc", { bot: d.bot.name[LANG], color: t(d.color === "w" ? "white" : "black") })}</div>
      </div>
      <button class="db-btn">${t("dailyPlay")}</button>`;
    el.querySelector(".db-btn").addEventListener("click", () => {
      currentBot = d.bot;
      dailyActive = true;
      mode = "bot";
      startGame({ color: d.color });
    });
  }
}

function buildStats() {
  const s = Meta.profile.stats;
  const rows = [
    [t("statGames"), s.games], [t("statWins"), s.wins],
    [t("statStreak"), s.streak], [t("statBestStreak"), s.bestStreak],
    [t("statBestWin"), s.bestWinElo || "—"], [t("statFastestMate"), s.fastestMate ? s.fastestMate : "—"],
  ];
  const badgesRow = Meta.BADGES.map((b) => {
    const owned = Meta.profile.badges.includes(b.id);
    return `<span title="${b[LANG] || b.ar} — ${LANG === "ar" ? b.arD : b.enD}"
      style="font-size:1.5rem;cursor:help;${owned ? "" : "opacity:.22;filter:grayscale(1)"}">${b.icon}</span>`;
  }).join(" ");
  // سجل آخر المباريات
  const hist = Meta.profile.history || [];
  const histRows = hist.slice(0, 10).map((h) => {
    const icon = h.r === 1 ? "✅" : h.r === 0.5 ? "➖" : "❌";
    const opp = h.opp === "friend" ? t("friend") : (BOTS.find((b) => b.id === h.opp)?.name[LANG] || h.opp);
    const delta = h.opp !== "friend" && h.elo !== undefined
      ? ` <span style="color:${h.elo >= 0 ? "var(--success)" : "#e07060"};font-weight:700">${h.elo >= 0 ? "+" : ""}${h.elo}</span>` : "";
    const when = new Date(h.d).toLocaleDateString(LANG === "ar" ? "ar" : "en", { month: "short", day: "numeric" });
    return `<div class="hist-row"><span>${icon}</span><b>${opp}</b>${delta}<span class="hist-meta">${h.n} ${t("moves")} · ${when}</span></div>`;
  }).join("");
  $("#stats-box").innerHTML =
    `<div class="stat" style="grid-column:1/-1"><span>${t("stats")} — ${t("yourElo")}: </span><b style="display:inline">${Meta.profile.elo}</b></div>`
    + rows.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("")
    + `<div class="stat" style="grid-column:1/-1;margin-top:4px"><span>${t("badgesTitle")} (${Meta.profile.badges.length}/${Meta.BADGES.length})</span><div style="margin-top:6px;letter-spacing:6px">${badgesRow}</div></div>`
    + `<div class="stat" style="grid-column:1/-1;margin-top:4px"><span>${t("historyTitle")}</span><div class="hist-list">${
      histRows || `<div class="hist-row" style="color:var(--text-mute)">${t("historyEmpty")}</div>`}</div></div>`;
}

function buildTcPicker() {
  const box = $("#tc-picker");
  const cur = Clock.control.id;
  box.innerHTML = "";
  Clock.CONTROLS.forEach((c) => {
    const b = document.createElement("button");
    b.className = "tc-btn" + (c.id === cur ? " selected" : "") + (c.id === "none" ? " tc-inf" : "");
    b.textContent = c.label;
    if (c.id === "none") b.title = LANG === "ar" ? "بلا وقت" : "No clock";
    b.addEventListener("click", () => {
      Clock.setControl(c.id);
      box.querySelectorAll(".tc-btn").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    box.appendChild(b);
  });
  buildVariantPicker();
}

// اختيار طور اللعب (قياسي / ملك التلة / ثلاث كشات)
const VARIANTS = ["standard", "koth", "3check"];
function buildVariantPicker() {
  let box = $("#variant-picker");
  if (!box) {
    const h = document.createElement("h2");
    h.textContent = t("variantTitle");
    h.id = "variant-title";
    box = document.createElement("div");
    box.id = "variant-picker";
    box.style.cssText = "display:flex;justify-content:center;gap:8px;margin-bottom:24px;flex-wrap:wrap";
    $("#tc-picker").after(h, box);
  } else {
    box.innerHTML = "";
    $("#variant-title").textContent = t("variantTitle");
  }
  VARIANTS.forEach((v) => {
    const b = document.createElement("button");
    b.className = "tc-btn" + (v === variant ? " selected" : "");
    b.style.fontFamily = "inherit";
    b.textContent = t("variant_" + v);
    b.addEventListener("click", () => {
      variant = v;
      box.querySelectorAll(".tc-btn").forEach((x) => x.classList.remove("selected"));
      b.classList.add("selected");
    });
    box.appendChild(b);
  });
}

// ---- منطق الأطوار المتغيرة ----
function kingSquare(color, g = game) {
  let sq = null;
  g.board().forEach((row, ri) => row.forEach((p, fi) => {
    if (p && p.type === "k" && p.color === color) sq = FILES[fi] + (8 - ri);
  }));
  return sq;
}
function checksGivenBy(color) {
  // عدد الكشات من واقع سجل النقلات (الأبيض يلعب الفهارس الزوجية)
  return game.history().filter((san, i) =>
    (i % 2 === 0 ? "w" : "b") === color && (san.includes("+") || san.includes("#"))
  ).length;
}
// يعيد لون الفائز بالطور المتغير بعد النقلة، أو null
function variantWinner(mv) {
  if (variant === "koth") {
    const sq = kingSquare(mv.color);
    if (["d4", "d5", "e4", "e5"].includes(sq)) return mv.color;
  }
  if (variant === "3check" && checksGivenBy(mv.color) >= 3) return mv.color;
  return null;
}
function endByVariant(winnerColor) {
  if (gameOver) return;
  gameOver = true;
  Clock.halt();
  const playerWon = winnerColor === playerColor;
  const sub = variant === "koth" ? t(playerWon ? "winKoth" : "loseKoth") : t(playerWon ? "win3check" : "lose3check");
  if (mode === "online" && hostPeerId) Net.broadcast({ t: "wend", title: playerWon ? "⛰️" : "", sub });
  if (playerWon && variant === "koth") notifyBadges(Meta.award("hill-king"));
  showEndModal(playerWon ? t("youWin") : t("youLose"), sub, playerWon, true, playerWon ? 1 : 0, {});
}

// ============ الإعدادات (تجميلات مجانية) ============
function buildSettings() {
  const box = $("#settings-body");
  box.innerHTML = "";
  const sections = [
    ["back", t("secBackground")],
    ["board", t("secBoard")],
    ["piece", t("secPieces")],
  ];
  for (const [kind, title] of sections) {
    const h = document.createElement("div");
    h.className = "shop-section-title";
    h.textContent = title;
    const grid = document.createElement("div");
    grid.className = "shop-grid";
    Meta.SHOP[kind].forEach((item) => {
      const equipped = Meta.profile.equipped[kind] === item.id;
      const locked = !Meta.isUnlocked(kind, item.id);
      const cell = document.createElement("div");
      cell.className = "shop-item settings-item" + (equipped ? " equipped-item" : "") + (locked ? " locked-item" : "");
      let swatch = "";
      if (kind === "board") swatch = `<div class="swatch"><div style="background:${item.light}"></div><div style="background:${item.dark}"></div><div style="background:${item.light}"></div><div style="background:${item.dark}"></div></div>`;
      else if (kind === "back") swatch = `<div class="swatch"><div style="background:linear-gradient(135deg,${item.v1},${item.v2})"></div></div>`;
      else swatch = `<div class="swatch" style="justify-content:center;background:#26352b">${PIECE_SETS[item.id].wk}${PIECE_SETS[item.id].bq}</div>`;
      const label = locked
        ? `🔒 ${t("unlockedBy")}: ${(Meta.BADGES.find((b) => b.id === item.unlock) || {})[LANG] || ""}`
        : item.name[LANG];
      cell.innerHTML = `${swatch}<div class="si-name">${label}</div>`;
      if (!locked) cell.addEventListener("click", () => {
        Meta.equip(kind, item.id);
        buildSettings();
        $("#cp-white").innerHTML = pieceSVG("k", "w");
        $("#cp-black").innerHTML = pieceSVG("k", "b");
      });
      grid.appendChild(cell);
    });
    box.appendChild(h);
    box.appendChild(grid);
  }
}

// ============ غرفة الكؤوس (الرتبة + التقدّم + الأوسمة) ============
function buildTrophyRoom() {
  const box = $("#trophy-body");
  const pr = Meta.rankProgress();
  const rk = pr.rank;
  let html = `<div class="trophy-rank">
    <span class="tr-icon">${rk.icon}</span>
    <div class="tr-name">${rk[LANG] || rk.ar}</div>
    <div class="tr-points">${t("points", { n: pr.points })}</div>`;
  if (pr.next) {
    html += `<div class="rank-progress"><div class="rank-progress-fill" style="width:${pr.pct}%"></div></div>
      <div class="tr-next">${t("nextRank")}: ${pr.next.icon} ${pr.next[LANG] || pr.next.ar} — ${pr.points}/${pr.next.min}</div>`;
  } else {
    html += `<div class="tr-next">${t("maxRank")}</div>`;
  }
  html += `</div>`;
  html += `<div class="shop-section-title">${t("rankLabel")}</div><div class="rank-ladder">`;
  Meta.RANKS.forEach((x) => {
    const reached = pr.points >= x.min;
    html += `<div class="rank-row${reached ? " reached" : ""}${x.id === rk.id ? " current" : ""}">
      <span class="rr-icon">${x.icon}</span><b>${x[LANG] || x.ar}</b><span class="rr-min">${x.min}</span></div>`;
  });
  html += `</div>`;
  html += `<div class="shop-section-title">${t("badgesTitle")} (${Meta.profile.badges.length}/${Meta.BADGES.length})</div><div class="trophy-badges">`;
  Meta.BADGES.forEach((b) => {
    const owned = Meta.profile.badges.includes(b.id);
    html += `<div class="trophy-badge${owned ? "" : " locked"}" title="${LANG === "ar" ? b.arD : b.enD}">
      <span class="tb-icon">${b.icon}</span><span class="tb-name">${b[LANG] || b.ar}</span></div>`;
  });
  html += `</div>`;
  box.innerHTML = html;
}

// إشعار الترقية (يعيد استعمال عنصر badge-toast)
function notifyRankUp(rk) {
  let toast = $("#badge-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "badge-toast";
    toast.style.cssText = "position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:120;background:linear-gradient(180deg,var(--surface-3),var(--surface-1));border:1.5px solid var(--gold);border-radius:14px;padding:10px 22px;font-weight:800;box-shadow:var(--sh-pop);text-align:center";
    document.body.appendChild(toast);
  }
  toast.innerHTML = `${rk.icon} ${t("rankUp")}: <span style="color:var(--gold)">${rk[LANG] || rk.ar}</span>`;
  toast.hidden = false;
  Sounds.fanfare();
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => { toast.hidden = true; }, 3200);
}

// ============ التبويبات ============
document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach((b) => b.classList.remove("selected"));
    tab.classList.add("selected");
    setupTab = tab.dataset.mode;
    $("#bot-setup").hidden = setupTab !== "bot";
    $("#online-setup").hidden = setupTab !== "online";
    $("#puzzles-setup").hidden = setupTab !== "puzzles";
    $("#color-section").hidden = setupTab === "puzzles";
    $("#btn-start").hidden = setupTab !== "bot";
    $("#btn-create-link").hidden = setupTab !== "online" || !$("#invite-box").hidden;
    if (setupTab === "puzzles") buildPuzzlesScreen();
  });
});

document.querySelectorAll(".color-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    colorSetting = btn.dataset.color;
  });
});

// ============ الرقعة ============
function sqToXY(square) {
  const f = FILES.indexOf(square[0]);
  const r = parseInt(square[1], 10) - 1;
  return orientation === "w" ? [f, 7 - r] : [7 - f, r];
}
function xyToSq(x, y) {
  const f = orientation === "w" ? x : 7 - x;
  const r = orientation === "w" ? 7 - y : y;
  if (f < 0 || f > 7 || r < 0 || r > 7) return null;
  return FILES[f] + (r + 1);
}

function buildBoard() {
  boardEl.querySelectorAll(".square").forEach((s) => s.remove());
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = FILES[f] + (r + 1);
      const [x, y] = sqToXY(sq);
      const el = document.createElement("div");
      el.className = "square " + ((f + r) % 2 === 0 ? "dark" : "light");
      el.dataset.square = sq;
      el.style.left = x * 12.5 + "%";
      el.style.top = y * 12.5 + "%";
      if (y === 7) el.innerHTML += `<span class="coord file">${sq[0]}</span>`;
      if (x === 0) el.innerHTML += `<span class="coord rank">${sq[1]}</span>`;
      boardEl.appendChild(el);
    }
  }
}

function placePiece(square, type, color, spawn = false) {
  const el = document.createElement("div");
  el.className = "piece" + (spawn ? " spawn" : "");
  el.dataset.square = square;
  el.dataset.piece = color + type;
  el.innerHTML = pieceSVG(type, color);
  positionEl(el, square);
  boardEl.appendChild(el);
  pieceEls[square] = el;
  return el;
}
function positionEl(el, square) {
  const [x, y] = sqToXY(square);
  el.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
}
function renderAllPieces(g = game) {
  Object.values(pieceEls).forEach((el) => el.remove());
  pieceEls = {};
  g.board().forEach((row, ri) => {
    row.forEach((p, fi) => {
      if (p) placePiece(FILES[fi] + (8 - ri), p.type, p.color);
    });
  });
}
// رسم تفاضلي: يعيد استعمال العناصر ويحرّك المتغيّر فقط (انزلاق ناعم في التحليل/التراجع)
function renderPosition(g = game) {
  const target = {};
  g.board().forEach((row, ri) => row.forEach((p, fi) => {
    if (p) target[FILES[fi] + (8 - ri)] = p.color + p.type;
  }));
  const leftovers = {};
  for (const sq of Object.keys(pieceEls)) {
    const el = pieceEls[sq];
    if (target[sq] === el.dataset.piece) { delete target[sq]; }   // مطابق مكانه: يُترك
    else { (leftovers[el.dataset.piece] ||= []).push(el); delete pieceEls[sq]; }
  }
  for (const sq of Object.keys(target)) {
    const name = target[sq];
    const el = leftovers[name] && leftovers[name].pop();
    if (el) { el.dataset.square = sq; positionEl(el, sq); pieceEls[sq] = el; } // يحرّكه → ينزلق
    else placePiece(sq, name[1], name[0]);                                     // ناقص → يُنشأ
  }
  for (const name of Object.keys(leftovers)) leftovers[name].forEach((el) => el.remove());
}

function clearHighlights(...classes) {
  const cls = classes.length ? classes : ["selected", "hint-dot", "hint-ring", "last-move", "in-check", "hint-move"];
  cls.forEach((c) =>
    boardEl.querySelectorAll(".square." + c).forEach((s) => s.classList.remove(c))
  );
}
function sqEl(square) { return boardEl.querySelector(`.square[data-square="${square}"]`); }
function highlightLastMove(from, to) {
  clearHighlights("last-move");
  sqEl(from)?.classList.add("last-move");
  sqEl(to)?.classList.add("last-move");
}
function highlightCheck(g = game) {
  clearHighlights("in-check");
  if (g.in_check()) {
    const turn = g.turn();
    g.board().forEach((row, ri) => {
      row.forEach((p, fi) => {
        if (p && p.type === "k" && p.color === turn)
          sqEl(FILES[fi] + (8 - ri))?.classList.add("in-check");
      });
    });
  }
}

// أسهم فوق الرقعة (تلميح / تحليل)
function drawArrow(fromSq, toSq, color = "rgba(64,170,255,.75)") {
  const layer = $("#arrow-layer");
  const c = (sq) => { const [x, y] = sqToXY(sq); return [x * 12.5 + 6.25, y * 12.5 + 6.25]; };
  const [x1, y1] = c(fromSq), [x2, y2] = c(toSq);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 4.2, w = 2.4;
  const ex = x2 - Math.cos(ang) * head, ey = y2 - Math.sin(ang) * head;
  layer.innerHTML += `
    <line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>
    <polygon points="${x2},${y2} ${x2 - Math.cos(ang - 0.5) * head * 1.4},${y2 - Math.sin(ang - 0.5) * head * 1.4} ${x2 - Math.cos(ang + 0.5) * head * 1.4},${y2 - Math.sin(ang + 0.5) * head * 1.4}" fill="${color}"/>`;
}
function clearArrows() { $("#arrow-layer").innerHTML = ""; }

// ============ الإدخال ============
let dragEl = null, dragStartSq = null, dragMoved = false, dragReclick = false;
let boardRect = null, dragStartXY = null, userShapes = [], rightStartSq = null;
const DRAG_THRESH = 5;

// ---- أشكال المستخدم (زرّ أيمن): أسهم وتحديدات ----
const USER_SHAPE_COLOR = "rgba(21,180,120,.85)";
function toggleShape(s) {
  const i = userShapes.findIndex((x) => x.t === s.t && x.a === s.a && x.b === s.b);
  if (i >= 0) userShapes.splice(i, 1); else userShapes.push(s);
  redrawUserShapes();
}
function redrawUserShapes() {
  const c = (sq) => { const [x, y] = sqToXY(sq); return [x * 12.5 + 6.25, y * 12.5 + 6.25]; };
  let svg = "";
  for (const s of userShapes) {
    if (s.t === "circle") {
      const [cx, cy] = c(s.a);
      svg += `<circle cx="${cx}" cy="${cy}" r="5.6" fill="none" stroke="${USER_SHAPE_COLOR}" stroke-width="1.4"/>`;
    } else {
      const [x1, y1] = c(s.a), [x2, y2] = c(s.b);
      const ang = Math.atan2(y2 - y1, x2 - x1), head = 4.2, w = 2.4;
      const ex = x2 - Math.cos(ang) * head, ey = y2 - Math.sin(ang) * head;
      svg += `<line x1="${x1}" y1="${y1}" x2="${ex}" y2="${ey}" stroke="${USER_SHAPE_COLOR}" stroke-width="${w}" stroke-linecap="round"/>`
        + `<polygon points="${x2},${y2} ${x2 - Math.cos(ang - 0.5) * head * 1.4},${y2 - Math.sin(ang - 0.5) * head * 1.4} ${x2 - Math.cos(ang + 0.5) * head * 1.4},${y2 - Math.sin(ang + 0.5) * head * 1.4}" fill="${USER_SHAPE_COLOR}"/>`;
    }
  }
  $("#user-shapes").innerHTML = svg;
}
function clearUserShapes() { if (userShapes.length) { userShapes = []; redrawUserShapes(); } }
function spawnCaptureFlash(square) {
  const el = document.createElement("div");
  el.className = "capture-flash";
  positionEl(el, square);
  boardEl.appendChild(el);
  setTimeout(() => el.remove(), 420);
}

function inputAllowed() {
  if (gameOver || pendingPromotion) return false;
  if (mode === "watch" || analysisEntries) return false;
  if (mode === "puzzle") return puzzle && game.turn() === playerColor;
  return game.turn() === playerColor;
}

boardEl.addEventListener("contextmenu", (e) => e.preventDefault());
boardEl.addEventListener("pointerdown", (e) => {
  boardRect = boardEl.getBoundingClientRect();
  // الزرّ الأيمن: بدء شكل مستخدم (يعمل في أي دور)
  if (e.button === 2) { rightStartSq = eventSquare(e); return; }
  if (e.button === 0) clearUserShapes();
  if (!inputAllowed()) return;
  const sq = eventSquare(e);
  if (!sq) return;
  const piece = game.get(sq);
  if (piece && piece.color === playerColor) {
    // النقر المكرر على القطعة المحددة يلغي التحديد (يُنفذ عند الإفلات دون سحب)
    dragReclick = selectedSq === sq;
    selectSquare(sq);
    dragEl = pieceEls[sq];
    dragStartSq = sq;
    dragMoved = false;
    dragStartXY = { x: e.clientX, y: e.clientY };
    try { boardEl.setPointerCapture(e.pointerId); } catch { /* أحداث اصطناعية */ }
  } else if (selectedSq && legalTargets.includes(sq)) {
    tryPlayerMove(selectedSq, sq);
  } else {
    deselect();
  }
});
boardEl.addEventListener("pointermove", (e) => {
  if (!dragEl) return;
  // لا يبدأ السحب فعليًا إلا بعد تجاوز عتبة المسافة (تمييز النقر عن السحب)
  if (!dragMoved) {
    const dx = e.clientX - dragStartXY.x, dy = e.clientY - dragStartXY.y;
    if (dx * dx + dy * dy < DRAG_THRESH * DRAG_THRESH) return;
    dragMoved = true;
    dragEl.classList.add("dragging");
  }
  const rect = boardRect || boardEl.getBoundingClientRect();
  const cell = rect.width / 8;
  const x = e.clientX - rect.left - cell / 2;
  const y = e.clientY - rect.top - cell / 2;
  dragEl.style.transform = `translate(${(x / cell) * 100}%, ${(y / cell) * 100}%)`;
});
boardEl.addEventListener("pointerup", (e) => {
  // إنهاء شكل مستخدم بالزرّ الأيمن
  if (e.button === 2 && rightStartSq) {
    const end = eventSquare(e);
    if (end) toggleShape(end === rightStartSq ? { t: "circle", a: end } : { t: "arrow", a: rightStartSq, b: end });
    rightStartSq = null;
    return;
  }
  if (!dragEl) return;
  const el = dragEl, from = dragStartSq;
  dragEl = null;
  el.classList.remove("dragging");
  const drop = eventSquare(e);
  if (dragMoved && drop && drop !== from && legalTargets.includes(drop)) {
    tryPlayerMove(from, drop);
  } else {
    positionEl(el, from);
    if (dragMoved && drop && drop !== from) Sounds.illegal();
    if (!dragMoved && dragReclick) deselect();
  }
  dragReclick = false;
});
function eventSquare(e) {
  const rect = boardRect || boardEl.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
  return xyToSq(x, y);
}
function selectSquare(sq) {
  deselect();
  selectedSq = sq;
  sqEl(sq)?.classList.add("selected");
  const moves = game.moves({ square: sq, verbose: true });
  legalTargets = moves.map((m) => m.to);
  moves.forEach((m) => {
    sqEl(m.to)?.classList.add(game.get(m.to) || m.flags.includes("e") ? "hint-ring" : "hint-dot");
  });
}
function deselect() {
  selectedSq = null;
  legalTargets = [];
  clearHighlights("selected", "hint-dot", "hint-ring");
}

// ============ تنفيذ النقلات ============
function tryPlayerMove(from, to) {
  const moves = game.moves({ square: from, verbose: true });
  const mv = moves.find((m) => m.to === to);
  if (!mv) return;
  if (mode === "puzzle") { puzzleTryMove(mv); return; }
  if (mv.flags.includes("p")) {
    pendingPromotion = { from, to };
    showPromoPicker();
    return;
  }
  deselect();
  commitPlayerMove({ from, to });
}

function showPromoPicker() {
  const picker = $("#promo-picker");
  picker.innerHTML = "";
  ["q", "r", "b", "n"].forEach((p) => {
    const b = document.createElement("button");
    b.innerHTML = pieceSVG(p, playerColor);
    b.addEventListener("click", () => {
      picker.hidden = true;
      const { from, to } = pendingPromotion;
      pendingPromotion = null;
      deselect();
      Sounds.promote();
      commitPlayerMove({ from, to, promotion: p });
    });
    picker.appendChild(b);
  });
  picker.hidden = false;
}

// نقلة اللاعب المحلي (بوت أو أونلاين)
function commitPlayerMove(desc) {
  const fenBefore = game.fen();
  const mv = makeMove(desc);
  if (!mv) return;
  if (mode === "online") {
    Net.send({ t: "move", from: mv.from, to: mv.to, promotion: mv.promotion, rem: Clock.remainingOf(playerColor) });
  }
  if (mode === "bot" && !gameOver) {
    clearTimeout(idleTimer);
    // ردود فعل + مدرب + دور البوت — الأندر أولا
    if (mv.flags.includes("e")) chatterOnce("enPassant", "shocked");
    else if (mv.promotion) chatterOnce("promote", "shocked");
    else if (mv.captured && Math.random() < 0.4) { speak(botPhrase(currentBot, "hurt")); FX.mood(Math.random() < 0.5 ? "shocked" : "worried"); }
    else if (game.in_check() && Math.random() < 0.5) { speak(botPhrase(currentBot, "hurt")); FX.mood("worried"); }
    else if (mv.flags.includes("k") || mv.flags.includes("q")) chatterOnce("castle");
    runCoach(fenBefore, game.fen(), mv.from + mv.to + (mv.promotion || ""));
    setTimeout(botTurn, 250);
  }
  if (mode === "drill" && !gameOver) setTimeout(drillReply, 250);
  if (mode === "school" && !gameOver) schoolAfterMove(mv);
}

// المدرب الفوري (مستويات ≤ 1000)
async function runCoach(fenBefore, fenAfter, uci) {
  if (mode !== "bot" || currentBot.elo > 1000) return;
  const token = gameToken;
  const ply = game.history().length;
  const res = await Analysis.coachCheck(fenBefore, fenAfter, uci, ply, playerColor);
  if (!res || token !== gameToken || gameOver) return;
  const bubble = $("#coach-bubble");
  bubble.textContent = "🦉 " + res.text;
  bubble.hidden = false;
  clearTimeout(coachTimer);
  coachTimer = setTimeout(() => { bubble.hidden = true; }, 4000);
}

// النقطة المركزية لتنفيذ أي نقلة
function makeMove(moveDesc) {
  const mv = game.move(moveDesc);
  if (!mv) return null;
  animateMove(mv);
  clearUserShapes();
  playMoveSound(mv);
  highlightLastMove(mv.from, mv.to);
  highlightCheck();
  updateMoveList();
  updateCaptured();
  // الساعة
  if (Clock.active() && !game.game_over()) Clock.switchTo(game.turn());
  // بث للمتفرجين (المضيف فقط) — مع رقم تسلسلي لمنع الانحراف
  if (mode === "online" && hostPeerId) {
    Net.broadcast({ t: "wmove", n: game.history().length, from: mv.from, to: mv.to, promotion: mv.promotion });
  }
  updateStatus();
  updateOpeningName();
  // فوز الطور المتغير له الأولوية على القواعد القياسية
  const vw = (mode === "bot" || mode === "online" || mode === "watch") && variant !== "standard"
    ? variantWinner(mv) : null;
  if (vw) { endByVariant(vw); return mv; }
  checkGameEnd();
  return mv;
}

// اسم الافتتاحية الحي تحت قائمة النقلات
function updateOpeningName() {
  if (mode === "puzzle") return;
  const el = $("#opening-name");
  if (!el) return;
  const name = game.history().length ? openingName(game.history(), LANG) : null;
  el.textContent = name || "";
  el.hidden = !name;
}

function animateMove(mv) {
  let capSq = null;
  if (mv.flags.includes("e")) capSq = mv.to[0] + mv.from[1];
  else if (mv.captured) capSq = mv.to;
  if (capSq && pieceEls[capSq]) {
    const capEl = pieceEls[capSq];
    delete pieceEls[capSq];
    capEl.classList.add("captured-anim");
    setTimeout(() => capEl.remove(), 240);
  }
  if (capSq) spawnCaptureFlash(capSq);
  const el = pieceEls[mv.from];
  if (el) {
    delete pieceEls[mv.from];
    pieceEls[mv.to] = el;
    el.dataset.square = mv.to;
    positionEl(el, mv.to);
    if (mv.flags.includes("p")) {
      el.dataset.piece = mv.color + mv.promotion;
      setTimeout(() => { el.innerHTML = pieceSVG(mv.promotion, mv.color); }, 180);
    }
  }
  if (mv.flags.includes("k") || mv.flags.includes("q")) {
    const rank = mv.from[1];
    const [rFrom, rTo] = mv.flags.includes("k") ? ["h" + rank, "f" + rank] : ["a" + rank, "d" + rank];
    const rookEl = pieceEls[rFrom];
    if (rookEl) {
      delete pieceEls[rFrom];
      pieceEls[rTo] = rookEl;
      rookEl.dataset.square = rTo;
      positionEl(rookEl, rTo);
    }
  }
}

function playMoveSound(mv) {
  if (mv.flags.includes("k") || mv.flags.includes("q")) Sounds.castle();
  else if (mv.captured) Sounds.capture();
  else Sounds.move();
  if (game.in_check() && !game.in_checkmate()) setTimeout(() => Sounds.check(), 120);
}

// ============ دور البوت ============
async function botTurn() {
  if (gameOver || mode !== "bot" || game.turn() === playerColor) return;
  const token = gameToken;
  const avatarEl = $("#bot-avatar");
  avatarEl.classList.add("thinking");
  updateStatus(true);

  const minWait = new Promise((r) => setTimeout(r, 500 + Math.random() * 700));
  let moveDesc = null;

  if (Math.random() < currentBot.randProb) {
    const all = game.moves({ verbose: true });
    const mv = all[Math.floor(Math.random() * all.length)];
    moveDesc = { from: mv.from, to: mv.to, promotion: mv.promotion || "q" };
  } else {
    try {
      const uci = await Engine.bestMove(game.fen(), { skill: currentBot.skill, depth: currentBot.depth });
      if (uci) moveDesc = { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined };
    } catch {
      const all = game.moves({ verbose: true });
      const mv = all[Math.floor(Math.random() * all.length)];
      if (mv) moveDesc = { from: mv.from, to: mv.to, promotion: mv.promotion || "q" };
      banner(t("engineError"), true);
    }
  }

  await minWait;
  if (token !== gameToken || gameOver) return;
  avatarEl.classList.remove("thinking");
  if (!moveDesc) return;
  const mv = makeMove(moveDesc);
  if (!mv) return;
  if (!gameOver) {
    if (game.in_check() && Math.random() < 0.6) { speak(botPhrase(currentBot, "check")); FX.mood("happy"); }
    else if (mv.flags.includes("e")) chatterOnce("enPassant", "happy");
    else if (mv.captured && Math.random() < 0.4) { speak(botPhrase(currentBot, "capture")); FX.mood("happy"); if (Math.random() < 0.3) FX.voice(currentBot.id); }
    else {
      // ثرثرة موقفية: اسم الافتتاحية ثم ميزان المادة
      const ply = game.history().length;
      const opening = ply >= 4 && ply <= 14 && !chatter.done.opening && variant === "standard"
        ? openingName(game.history(), LANG) : null;
      const diff = materialDiff();
      if (opening) chatterOnce("opening", null, opening);
      else if (diff >= 5) chatterOnce("winning", "happy");
      else if (diff <= -5) chatterOnce("losing", "worried");
    }
    scheduleIdle();
  }
}

// ============ نهاية اللعبة ============
function checkGameEnd() {
  if (!game.game_over()) return;
  // في الألغاز والتدريب: مسار اللغز يتولى الإنهاء — لا نافذة نهاية ولا مكافآت مباراة
  if (mode === "puzzle" || mode === "coords" || mode === "school") return;
  if (mode === "drill") return endDrill();
  gameOver = true;
  Clock.halt();
  const mate = game.in_checkmate();
  const playerWon = mate && game.turn() !== playerColor;
  let title, sub, result;
  if (mate) {
    title = playerWon ? t("youWin") : t("youLose");
    sub = playerWon ? t("winByCheckmate") : t("loseByCheckmate");
    result = playerWon ? 1 : 0;
  } else {
    title = t("draw"); result = 0.5;
    if (game.in_stalemate()) sub = t("drawStalemate");
    else if (game.in_threefold_repetition()) sub = t("drawRepetition");
    else if (game.insufficient_material()) sub = t("drawMaterial");
    else sub = t("draw50");
  }
  if (mode === "online" && hostPeerId) Net.broadcast({ t: "wend", title, sub });
  const token = gameToken;
  setTimeout(() => {
    if (token === gameToken) showEndModal(title, sub, playerWon, mate, result, { mate });
  }, 700);
}

function endByFlag(flaggedColor) {
  if (gameOver) return;
  gameOver = true;
  Clock.halt();
  const playerFlagged = flaggedColor === playerColor;
  if (mode === "online" && playerFlagged) Net.send({ t: "flag" });
  if (mode === "online" && hostPeerId) Net.broadcast({ t: "wend", title: "⏰", sub: "" });
  showEndModal(
    playerFlagged ? t("youLose") : t("youWin"),
    playerFlagged ? t("loseByFlag") : t("winByFlag"),
    !playerFlagged, true, playerFlagged ? 0 : 1, { mate: false }
  );
}

function showEndModal(title, sub, playerWon, decisive, result = null, extra = {}) {
  const modal = $("#end-modal");
  const avatar = $("#end-avatar");
  avatar.innerHTML = mode === "online" || mode === "watch" ? FRIEND_AVATAR : botAvatar(currentBot);
  avatar.classList.toggle("sad", !!playerWon);
  $("#end-title").textContent = title;
  const phrase = mode === "bot" ? botPhrase(currentBot, decisive ? (playerWon ? "lose" : "win") : "draw") : "";
  $("#end-sub").textContent = phrase ? `${sub} — "${phrase}"` : sub;

  // المكافآت (ضد البوتات فقط)
  let rewardsText = "";
  if (mode === "bot" && result !== null && !rewardsRecorded) {
    rewardsRecorded = true;
    const r = Meta.recordBotGame(currentBot, result, {
      mate: !!extra.mate, undoUsed,
      moves: Math.ceil(game.history().length / 2),
      dailyChallenge: dailyActive,
    });
    const deltaStr = (r.eloDelta >= 0 ? "+" : "") + r.eloDelta;
    rewardsText = t("eloChange", { elo: Meta.profile.elo, delta: deltaStr });
    if (r.bananas) rewardsText += " • " + t("earned", { n: r.bananas });
    if (r.stars) rewardsText += " • " + "⭐".repeat(r.stars);
    updateChips();
    // فحص الأوسمة بعد تسجيل النتيجة
    const fresh = Meta.autoBadges();
    if (result === 1 && r.stars === 3) fresh.push(...Meta.award("flawless"));
    if (result === 1 && Clock.control.id === "1+0") fresh.push(...Meta.award("bullet-win"));
    notifyBadges(fresh);
  }
  if (mode === "online" && result !== null) {
    Meta.addHistory({ opp: "friend", r: result, n: Math.ceil(game.history().length / 2) });
    notifyBadges(Meta.award("social"));
  }
  $("#end-rewards").textContent = rewardsText;
  $("#btn-analyze").hidden = mode === "watch" || game.history().length < 4 || variant !== "standard";
  $("#btn-rematch").hidden = mode === "watch";
  modal.hidden = false;

  if (playerWon) {
    Sounds.win(); launchConfetti();
    if (mode === "bot") FX.mood("worried", 5000);
    // فوز ثلاث النجوم: موجة قصاصات ثانية مع سلم البريق
    if (mode === "bot" && $("#end-rewards").textContent.includes("⭐⭐⭐")) {
      setTimeout(() => { Sounds.grandWin(); launchConfetti(); }, 900);
    }
  }
  else if (decisive && mode !== "watch") { Sounds.lose(); if (mode === "bot") { FX.mood("happy", 5000); FX.voice(currentBot.id); } }
  else Sounds.drawEnd();
  updateStatus();
}

// ============ الواجهة الجانبية ============
function opponentName() {
  return mode === "online" || mode === "watch" ? t("friend") : currentBot.name[LANG];
}
// لافتة الحالة: تظهر عند الحاجة فقط (ألغاز/مشاهدة/رسائل) — الدور تدل عليه شارة البطاقة
function banner(text, alert = false) {
  const b = $("#status-banner");
  b.textContent = text;
  b.classList.toggle("alert", !!alert);
  b.hidden = false;
}
function hideBanner() { $("#status-banner").hidden = true; }

function updateStatus() {
  // حلقة الدور وشارته على بطاقة صاحب الدور — بديل لافتة "دورك/دور صديقك"
  const myTurn = !gameOver && game.turn() === playerColor && mode !== "watch";
  const oppTurn = !gameOver && game.turn() !== playerColor && mode !== "watch";
  $("#human-card").classList.toggle("active", myTurn);
  $("#bot-card").classList.toggle("active", oppTurn);
  $("#human-card").dataset.turn = t("turnYou");
  $("#bot-card").dataset.turn = mode === "online" ? t("turnFriend") : t("turnThink");
  if (mode === "watch") { banner(t("watching")); return; }
  if (mode === "puzzle" || mode === "coords") return;
  if (gameOver) {
    if (game.in_checkmate()) banner(game.turn() !== playerColor ? t("youWin") : t("youLose"));
    else if (game.game_over()) banner(t("draw"));
    return;
  }
  hideBanner();
}

function updateMoveList() {
  const hist = game.history();
  // شريط النقلات المضغوط (أثناء اللعب)
  const tk = $("#move-ticker");
  tk.innerHTML = hist.length
    ? hist.map((san, i) =>
        (i % 2 === 0 ? `<span class="tk-num">${i / 2 + 1}.</span>` : "")
        + `<span class="tk${i === hist.length - 1 ? " latest" : ""}">${san}</span>`
      ).join("")
    : `<span class="tk-empty">${t("emptyMoves")}</span>`;
  tk.scrollLeft = tk.scrollWidth;
  // القائمة الكاملة (تُعرض في وضع التحليل)
  const ol = $("#move-list");
  ol.innerHTML = "";
  if (!hist.length) {
    ol.innerHTML = `<li class="empty-state">${t("emptyMoves")}</li>`;
    return;
  }
  for (let i = 0; i < hist.length; i += 2) {
    const li = document.createElement("li");
    const isLastPair = i + 2 >= hist.length;
    li.innerHTML = `<span class="mv-num">${i / 2 + 1}.</span>
      <span class="mv ${isLastPair && hist.length % 2 === 1 ? "latest" : ""}">${hist[i]}</span>
      <span class="mv ${isLastPair && hist.length % 2 === 0 ? "latest" : ""}">${hist[i + 1] || ""}</span>`;
    ol.appendChild(li);
  }
  ol.scrollTop = ol.scrollHeight;
}

const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9 };
function updateCaptured() {
  const capturedBy = { w: [], b: [] };
  game.history({ verbose: true }).forEach((m) => {
    if (m.captured) capturedBy[m.color].push(m.captured);
  });
  const order = (a, b) => PIECE_VALUE[a] - PIECE_VALUE[b];
  const val = (arr) => arr.reduce((s, p) => s + PIECE_VALUE[p], 0);
  const myColor = mode === "watch" ? "w" : playerColor;
  const oppColor = myColor === "w" ? "b" : "w";
  const diff = val(capturedBy[myColor]) - val(capturedBy[oppColor]);
  const humanEl = $("#captured-by-human"), botEl = $("#captured-by-bot");
  humanEl.innerHTML = capturedBy[myColor].sort(order).map((p) => pieceSVG(p, oppColor)).join("");
  botEl.innerHTML = capturedBy[oppColor].sort(order).map((p) => pieceSVG(p, myColor)).join("");
  if (diff > 0) humanEl.innerHTML += `<span class="mat-diff">+${diff}</span>`;
  if (diff < 0) botEl.innerHTML += `<span class="mat-diff">+${-diff}</span>`;
}

// إشعار الأوسمة الجديدة
let badgeTimer = null;
function notifyBadges(list) {
  if (!list || !list.length) return;
  let toast = $("#badge-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "badge-toast";
    toast.style.cssText = "position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:120;background:linear-gradient(180deg,var(--surface-3),var(--surface-1));border:1.5px solid var(--gold);border-radius:14px;padding:10px 22px;font-weight:800;box-shadow:var(--sh-pop);text-align:center";
    document.body.appendChild(toast);
  }
  const b = list[0];
  toast.innerHTML = `${b.icon} ${t("newBadge")}: <span style="color:var(--gold)">${b[LANG] || b.ar}</span> <span style="color:var(--text-dim);font-size:.85em">+50 🍍</span>`;
  toast.hidden = false;
  Sounds.fanfare();
  updateChips();
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => {
    toast.hidden = true;
    if (list.length > 1) notifyBadges(list.slice(1));
  }, 3200);
}

function speak(text, dur = 3000) {
  if (!text) return;
  const bubble = $("#bot-bubble");
  bubble.textContent = text;
  bubble.hidden = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => { bubble.hidden = true; }, dur);
}

// ============ ثرثرة البوت: تعليقات موقفية بشخصية كل حيوان ============
// كل مناسبة (افتتاحية/تبييت/ترقية/أخذ في المرور/تفوق/تأخر) تقال مرة واحدة في المباراة
const chatter = { done: {}, idleCount: 0 };
let idleTimer = null;

function resetChatter() {
  chatter.done = {};
  chatter.idleCount = 0;
  clearTimeout(idleTimer);
}

function chatterOnce(kind, mood, sub) {
  if (chatter.done[kind]) return;
  chatter.done[kind] = true;
  speak(botPhrase(currentBot, kind, sub), 3500);
  if (mood) FX.mood(mood);
}

// إن أطال اللاعب التفكير علّق البوت (مرتين كحد أقصى في المباراة)
function scheduleIdle() {
  clearTimeout(idleTimer);
  if (mode !== "bot" || gameOver || chatter.idleCount >= 2) return;
  const token = gameToken;
  idleTimer = setTimeout(() => {
    if (token !== gameToken || gameOver || mode !== "bot" || game.turn() !== playerColor) return;
    chatter.idleCount++;
    speak(botPhrase(currentBot, "idle"), 3500);
  }, 18000 + Math.random() * 8000);
}

// فارق المادة من منظور البوت (بيدق 1، حصان/فيل 3، قلعة 5، وزير 9)
function materialDiff() {
  const V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let d = 0;
  for (const row of game.board()) for (const sq of row) {
    if (sq) d += sq.color === playerColor ? -V[sq.type] : V[sq.type];
  }
  return d;
}

// ============ أزرار اللعب ============
$("#btn-hint").addEventListener("click", async () => {
  if (gameOver || game.turn() !== playerColor) return;
  const btn = $("#btn-hint");
  btn.disabled = true;
  try {
    const uci = await Engine.bestMove(game.fen(), { skill: 20, depth: 12 });
    if (uci && game.turn() === playerColor && !gameOver) {
      drawArrow(uci.slice(0, 2), uci.slice(2, 4));
      setTimeout(clearArrows, 2200);
    }
  } catch { banner(t("engineError"), true); }
  btn.disabled = false;
});

$("#btn-undo").addEventListener("click", () => {
  if (gameOver || mode !== "bot" || game.turn() !== playerColor || game.history().length < 2) return;
  game.undo(); game.undo();
  undoUsed = true;
  deselect(); clearHighlights(); clearArrows();
  renderPosition();
  const last = game.history({ verbose: true }).slice(-1)[0];
  if (last) highlightLastMove(last.from, last.to);
  highlightCheck();
  updateMoveList(); updateCaptured(); updateStatus();
  Sounds.move();
});

$("#btn-resign").addEventListener("click", () => {
  if (gameOver) return;
  if (!confirm(t("confirmResign"))) return;
  gameOver = true;
  gameToken++;
  Clock.halt();
  if (mode === "online") {
    Net.send({ t: "resign" });
    if (hostPeerId) Net.broadcast({ t: "wend", title: "🏳️", sub: t("loseByResign") });
  }
  showEndModal(t("youLose"), t("loseByResign"), false, true, 0, {});
});

$("#btn-newgame").addEventListener("click", goHome);
$("#btn-end-home").addEventListener("click", () => { $("#end-modal").hidden = true; goHome(); });
$("#btn-rematch").addEventListener("click", () => {
  $("#end-modal").hidden = true;
  if (mode === "online") {
    const myNew = playerColor === "w" ? "b" : "w";
    Net.send({ t: "rematch", yourColor: myNew === "w" ? "b" : "w" });
    startGame({ color: myNew, skipIntro: true });
  } else {
    startGame({ skipIntro: true });
  }
});

// مشاركة النتيجة و PGN
$("#btn-share").addEventListener("click", async () => {
  const title = $("#end-title").textContent;
  const sub = $("#end-sub").textContent.split("—")[0].trim();
  await Share.shareResult({
    title, sub,
    botSVG: mode === "bot" ? botAvatar(currentBot) : FRIEND_AVATAR,
    eloText: mode === "bot" ? `${t("yourElo")}: ${Meta.profile.elo} 📈` : "",
    bananasText: `🍍 ${Meta.profile.bananas}`,
  });
});
$("#btn-pgn").addEventListener("click", async () => {
  const white = playerColor === "w" ? t("you") : opponentName();
  const black = playerColor === "b" ? t("you") : opponentName();
  let res = "*";
  if (game.in_checkmate()) res = game.turn() === "b" ? "1-0" : "0-1";
  else if (game.in_draw()) res = "1/2-1/2";
  const ok = await Share.copyPGN(Share.buildPGN(game, white, black, res));
  if (ok) { $("#btn-pgn").innerHTML = "📋 " + t("pgnCopied"); setTimeout(() => { $("#btn-pgn").innerHTML = `📋 <span>${t("copyPGN")}</span>`; }, 1800); }
});

// رابط المشاهدة (المضيف)
$("#btn-watchlink").addEventListener("click", async () => {
  if (!hostPeerId) return;
  const link = `${location.origin}${location.pathname}?watch=${encodeURIComponent(hostPeerId)}`;
  try { await navigator.clipboard.writeText(link); } catch { /* تجاهل */ }
  $("#btn-watchlink").innerHTML = "👁️ " + t("copied");
  setTimeout(() => { $("#btn-watchlink").innerHTML = `👁️ <span>${t("watchLink")}</span>`; }, 1800);
});

function goHome() {
  gameToken++;
  gameOver = true;
  analysisCancel = true;
  analysisEntries = null;
  puzzle = null;
  rush = null;
  dailyActive = false;
  if (coords) { clearInterval(coords.timer); coords = null; }
  drill = null;
  school = null;
  lab = null;
  $("#lab-btns").hidden = true;
  $("#coords-target").hidden = true;
  hideBanner();
  Clock.halt();
  Engine.stop();
  clearArrows();
  if (mode === "online" || mode === "watch") {
    Net.cleanup();
    hostPeerId = null;
    $("#chat-messages").innerHTML = "";
    $("#emoji-panel").hidden = true;
    if (location.search.includes("join=") || location.search.includes("watch="))
      history.replaceState(null, "", location.pathname);
    $("#guest-connect").hidden = true;
    $("#invite-box").hidden = true;
    $("#btn-create-link").disabled = false;
    $("#mode-tabs").hidden = false;
  }
  mode = "bot";
  exitAnalysisUI();
  $("#game-screen").hidden = true;
  $("#setup-screen").hidden = false;
  document.querySelector('.mode-tab[data-mode="bot"]').click();
  buildSetup();
}

// ============ بدء اللعبة ============
function startGame(opts = {}) {
  gameToken++;
  game = new Chess(opts.fen || undefined);
  gameOver = false;
  pendingPromotion = null;
  undoUsed = false;
  rewardsRecorded = false;
  analysisEntries = null;
  analysisCancel = false;
  Analysis.resetCoach();
  clearArrows();
  exitAnalysisUI();
  $("#promo-picker").hidden = true;
  $("#coach-bubble").hidden = true;
  playerColor = opts.color
    || (colorSetting === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorSetting);
  orientation = opts.orientation || playerColor;

  $("#setup-screen").hidden = true;
  $("#game-screen").hidden = false;

  if (mode === "online" || mode === "watch") {
    $("#bot-avatar").innerHTML = FRIEND_AVATAR;
    $("#bot-name").textContent = t("friend");
    $("#bot-elo").textContent = t("connected");
  } else if (mode === "puzzle") {
    $("#bot-avatar").innerHTML = "🧩";
    $("#bot-name").textContent = puzzle
      ? (puzzle.theme ? t("th_" + puzzle.theme) : t(puzzle.kind === "daily" ? "puzzleDaily" : puzzle.kind))
      : "";
    $("#bot-elo").textContent = puzzle && puzzle.rating ? `${t("puzzleRating")} ${puzzle.rating}` : "";
  } else {
    $("#bot-avatar").innerHTML = botAvatar(currentBot);
    $("#bot-name").textContent = currentBot.name[LANG] + (dailyActive ? " 🎯" : "");
    $("#bot-elo").textContent = `${t("level")} ${currentBot.elo}`;
  }
  $("#bot-avatar").classList.remove("thinking");
  $("#human-status").textContent = mode === "watch" ? t("watching") : t(playerColor === "w" ? "playingAs_w" : "playingAs_b");
  $("#bot-bubble").hidden = true;
  resetChatter();

  // الأزرار حسب الطور
  lab = null;
  $("#lab-btns").hidden = true;
  $("#game-btns").hidden = mode === "puzzle";
  $("#puzzle-btns").hidden = mode !== "puzzle";
  $("#btn-hint").hidden = mode !== "bot";
  $("#btn-undo").hidden = mode !== "bot";
  $("#btn-resign").hidden = mode === "watch";
  $("#btn-watchlink").hidden = !(mode === "online" && hostPeerId);
  $("#chat-wrap").hidden = mode !== "online";
  $("#move-ticker").hidden = false;
  $("#move-list-wrap").hidden = true;
  $("#coords-target").hidden = true;
  hideBanner();
  if (mode === "online" && !$("#emoji-panel").children.length) {
    buildEmojiPanel();
    $("#chat-input").placeholder = t("typeMessage");
  }
  if (mode === "online" && !$("#chat-messages").children.length) {
    $("#chat-messages").innerHTML = `<div class="empty-state">${t("emptyChat")}</div>`;
  }

  buildBoard();
  renderAllPieces();
  deselect();
  updateMoveList(); updateCaptured(); updateStatus(); updateOpeningName();
  // شارة الطور المتغير على بطاقة الخصم
  if (variant !== "standard" && (mode === "bot" || mode === "online" || mode === "watch")) {
    $("#bot-elo").textContent += ` · ${t("variant_" + variant)}`;
  }

  // الساعة
  if (mode === "bot" || mode === "online") {
    Clock.start(
      playerColor === "w" ? $("#clock-human") : $("#clock-bot"),
      playerColor === "b" ? $("#clock-human") : $("#clock-bot"),
      (flagged) => endByFlag(flagged)
    );
    if (Clock.active()) Clock.switchTo("w");
  } else {
    $("#clock-bot").hidden = true;
    $("#clock-human").hidden = true;
  }

  if (mode === "bot") {
    Engine.init().catch(() => {});
    const begin = () => {
      speak(botPhrase(currentBot, "greet"), 3500);
      if (playerColor === "b") setTimeout(botTurn, 700);
      else scheduleIdle();
    };
    if (opts.skipIntro) begin();
    else FX.intro(botAvatar(currentBot), currentBot.name[LANG], currentBot.elo, t("you"), currentBot.id, begin);
  }
}

$("#btn-start").addEventListener("click", () => { mode = "bot"; dailyActive = false; startGame(); });

// ============ طور اللعب مع صديق ============
$("#btn-create-link").addEventListener("click", async () => {
  if (location.protocol === "file:") {
    $("#engine-status").textContent = t("needServer");
    return;
  }
  const btn = $("#btn-create-link");
  btn.disabled = true;
  $("#invite-box").hidden = false;
  $("#invite-status").textContent = t("creatingLink");
  try {
    const id = await Net.createHost();
    mode = "online";
    hostPeerId = id;
    $("#invite-link").value = `${location.origin}${location.pathname}?join=${encodeURIComponent(id)}`;
    $("#invite-status").textContent = t("waitingFriend");
  } catch {
    $("#invite-status").textContent = t("connFailed");
    btn.disabled = false;
  }
});

$("#btn-copy-link").addEventListener("click", async () => {
  const link = $("#invite-link").value;
  try { await navigator.clipboard.writeText(link); }
  catch { $("#invite-link").select(); document.execCommand("copy"); }
  $("#btn-copy-link").textContent = t("copied");
  setTimeout(() => { $("#btn-copy-link").textContent = t("copy"); }, 1600);
});

Net.on("connected", () => {
  if (mode !== "online" || !$("#game-screen").hidden) return;
  const myColor = colorSetting === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorSetting;
  Net.send({ t: "init", color: myColor === "w" ? "b" : "w", tc: Clock.control.id, variant });
  Sounds.notify();
  startGame({ color: myColor });
});

Net.on("data", (d) => {
  if (!d || typeof d !== "object") return;
  if (d.t === "init") {
    // تُقبل فقط عندما نكون ضيفا بانتظار البدء
    if (mode !== "online" || !$("#game-screen").hidden) return;
    Clock.setControl(String(d.tc || "none"));
    variant = VARIANTS.includes(d.variant) ? d.variant : "standard";
    startGame({ color: d.color === "b" ? "b" : "w" });
  } else if (d.t === "move") {
    if (mode !== "online") return;
    if (gameOver || game.turn() === playerColor) return;
    const opp = playerColor === "w" ? "b" : "w";
    makeMove({ from: String(d.from), to: String(d.to), promotion: d.promotion ? String(d.promotion) : undefined });
    Clock.syncRemote(opp, d.rem);
  } else if (d.t === "resign") {
    if (mode !== "online" || gameOver) return;
    gameOver = true; Clock.halt();
    if (hostPeerId) Net.broadcast({ t: "wend", title: t("youWin"), sub: t("friendResigned") });
    showEndModal(t("youWin"), t("friendResigned"), true, true, null, {});
  } else if (d.t === "flag") {
    if (gameOver) return;
    endByFlag(playerColor === "w" ? "b" : "w");
  } else if (d.t === "rematch") {
    $("#end-modal").hidden = true;
    startGame({ color: d.yourColor === "b" ? "b" : "w", skipIntro: true });
  } else if (d.t === "chat") {
    const text = String(d.text || "").slice(0, 200).trim();
    if (text) {
      addChatMsg(text, "them");
      // الرسالة تظهر أيضا في فقاعة كلام الصديق فوق بطاقته — دردشة دون مغادرة الرقعة
      speak(text.length > 90 ? text.slice(0, 90) + "…" : text, 4000);
      Sounds.notify();
    }
  } else if (d.t === "winit" && mode === "watch") {
    // بيانات المشاهدة الأولية
    Clock.setControl(String(d.tc || "none"));
    variant = VARIANTS.includes(d.variant) ? d.variant : "standard";
    mode = "watch";
    startGame({ color: "w", orientation: "w" });
    (d.history || []).forEach((san) => { game.move(String(san)); });
    renderAllPieces();
    updateMoveList(); updateCaptured(); highlightCheck(); updateStatus();
  } else if (d.t === "wmove" && mode === "watch") {
    // الرقم التسلسلي يضمن التطابق مع رقعة المضيف
    if (typeof d.n === "number" && d.n !== game.history().length + 1) return;
    makeMove({ from: String(d.from), to: String(d.to), promotion: d.promotion ? String(d.promotion) : undefined });
  } else if (d.t === "wend" && mode === "watch") {
    gameOver = true;
    banner(t("spectateEnded"));
  }
});

Net.on("watcherJoined", (c) => {
  // متفرج جديد: أرسل له الوضع الحالي
  Net.sendTo(c, {
    t: "winit",
    history: game.history(),
    tc: Clock.control.id,
    variant,
  });
});

Net.on("closed", () => {
  if (mode === "watch") { banner(t("friendLeft")); return; }
  if (mode !== "online") return;
  if (!gameOver) {
    gameOver = true;
    gameToken++;
    Clock.halt();
    showEndModal(t("friendLeft"), t("friendLeftSub"), false, false, null, {});
  }
  banner(t("friendLeft"));
});

Net.on("error", () => {
  if ($("#game-screen").hidden) {
    $("#invite-status").textContent = t("connFailed");
    $("#guest-status").textContent = t("connFailed");
    $("#btn-create-link").disabled = false;
  }
});

// الانضمام التلقائي (ضيف أو متفرج)
(function autoJoin() {
  const params = new URLSearchParams(location.search);
  const joinId = params.get("join");
  const watchId = params.get("watch");
  if (!joinId && !watchId) return;
  mode = watchId ? "watch" : "online";
  $("#mode-tabs").hidden = true;
  $("#bot-setup").hidden = true;
  $("#online-setup").hidden = true;
  $("#puzzles-setup").hidden = true;
  $("#btn-start").hidden = true;
  $("#color-section").hidden = true;
  $("#guest-connect").hidden = false;
  $("#guest-status").textContent = t("connectingToFriend");
  Net.join(joinId || watchId, watchId ? "watch" : "play").catch(() => {
    $("#guest-status").textContent = t("connFailed");
  });
})();

// ============ الدردشة ============
const CHAT_EMOJIS = ["😀","😂","🤣","😊","😍","😎","🤔","😮",
                     "😱","😢","😡","🥳","👍","👎","👏","🙏",
                     "💪","🔥","🎉","❤️","♟️","👑","🐔","🦁"];
function buildEmojiPanel() {
  const panel = $("#emoji-panel");
  panel.innerHTML = "";
  CHAT_EMOJIS.forEach((e) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = e;
    b.addEventListener("click", () => {
      const input = $("#chat-input");
      input.value += e;
      input.focus();
    });
    panel.appendChild(b);
  });
}
function addChatMsg(text, who) {
  const box = $("#chat-messages");
  box.querySelector(".empty-state")?.remove();
  const div = document.createElement("div");
  div.className = "chat-msg " + who;
  div.textContent = text;
  box.appendChild(div);
  while (box.children.length > 80) box.firstChild.remove();
  box.scrollTop = box.scrollHeight;
}
function sendChat() {
  const input = $("#chat-input");
  const text = input.value.trim().slice(0, 200);
  if (!text || mode !== "online" || !Net.connected) return;
  Net.send({ t: "chat", text });
  addChatMsg(text, "me");
  input.value = "";
  input.focus();
}
$("#btn-chat-send").addEventListener("click", sendChat);
$("#chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); sendChat(); }
});
$("#btn-emoji").addEventListener("click", () => {
  $("#emoji-panel").hidden = !$("#emoji-panel").hidden;
});

// ============ الألغاز ============
const PUZZLE_GOALS = { mate1: "mate1", mate2: "mate2", tactic: "tactic", daily: "tactic" };

function buildPuzzlesScreen() {
  $("#puzzles-sub").textContent = t("puzzlesSub", { streak: Meta.profile.puzzles.streak });
  // بطاقة سلسلة السفاري (على طريقة Puzzle Streak)
  let rushCard = $("#rush-card");
  if (!rushCard) {
    rushCard = document.createElement("div");
    rushCard.id = "rush-card";
    rushCard.className = "daily-banner";
    $("#daily-puzzle-card").before(rushCard);
  }
  rushCard.innerHTML = `
    <span class="db-icon">🔥</span>
    <div class="db-text">
      <div class="db-title">${t("rushTitle")}</div>
      <div class="db-desc">${t("rushDesc", { best: Meta.profile.bestRush })}</div>
    </div>
    <button class="db-btn">${t("rushStart")}</button>`;
  rushCard.querySelector(".db-btn").addEventListener("click", startRush);
  // لغز اليوم
  const dc = $("#daily-puzzle-card");
  dc.innerHTML = `
    <span class="db-icon">🌍</span>
    <div class="db-text">
      <div class="db-title">${t("puzzleDaily")}</div>
      <div class="db-desc">lichess.org</div>
    </div>
    <button class="db-btn">${t("dailyPlay")}</button>`;
  dc.querySelector(".db-btn").addEventListener("click", async (e) => {
    e.target.disabled = true;
    e.target.textContent = "...";
    try {
      const p = await Puzzles.fetchDaily();
      enterPuzzle(p);
    } catch {
      dc.querySelector(".db-desc").textContent = t("puzzleDailyErr");
      e.target.disabled = false;
      e.target.textContent = t("dailyPlay");
    }
  });
  // مدرسة السفاري — دروس حركة القطع للمبتدئين (أول ما يظهر)
  let schoolSec = $("#school-section");
  if (!schoolSec) {
    schoolSec = document.createElement("div");
    schoolSec.id = "school-section";
    schoolSec.style.cssText = "max-width:880px;margin:0 auto;text-align:start";
    $("#puzzle-groups").before(schoolSec);
  }
  schoolSec.innerHTML = `
    <div class="puzzle-group-title">🎓 ${t("schoolTitle")}
      <div style="font-weight:400;font-size:.78em;color:var(--text-mute);font-family:var(--font-body)">${t("schoolSub")}</div></div>
    <div id="school-grid">${SCHOOL_LESSONS.map((l) => {
      const done = Meta.profile.puzzles.solved.includes("sc-" + l.id);
      return `<div class="opening-card${done ? " done" : ""}" data-school="${l.id}">
        <div class="op-head"><span>${done ? "✅" : l.icon}</span><span>${l.name[LANG]}</span></div>
        <div class="op-idea">${l.idea[LANG]}</div></div>`;
    }).join("")}</div>`;
  schoolSec.querySelectorAll("[data-school]").forEach((card) => card.addEventListener("click", () =>
    enterSchool(card.dataset.school)));

  // تدريب المواضيع — ألغاز lichess حقيقية بلا حدود
  let themeSec = $("#theme-section");
  if (!themeSec) {
    themeSec = document.createElement("div");
    themeSec.id = "theme-section";
    themeSec.style.cssText = "max-width:880px;margin:0 auto;text-align:start";
    $("#puzzle-groups").before(themeSec);
  }
  const diff = Meta.profile.puzzleDiff || "normal";
  themeSec.innerHTML = `
    <div class="puzzle-group-title">🎯 ${t("themesTitle")}
      <div style="font-weight:400;font-size:.78em;color:var(--text-mute);font-family:var(--font-body)">${t("themesSub")}</div></div>
    <div id="difficulty-picker">${["easier", "normal", "harder"].map((d) =>
      `<button class="tc-btn${d === diff ? " selected" : ""}" data-diff="${d}" style="font-family:inherit">${t("diff_" + d)}</button>`).join("")}</div>
    <div id="theme-grid">${Puzzles.THEMES.map((th) =>
      `<div class="theme-card" data-theme="${th.id}"><span class="th-icon">${th.icon}</span><span class="th-name">${t("th_" + th.id)}</span></div>`).join("")}</div>`;
  themeSec.querySelectorAll("[data-diff]").forEach((b) => b.addEventListener("click", () => {
    Meta.profile.puzzleDiff = b.dataset.diff;
    Meta.save();
    themeSec.querySelectorAll("[data-diff]").forEach((x) => x.classList.toggle("selected", x === b));
  }));
  themeSec.querySelectorAll(".theme-card").forEach((card) => card.addEventListener("click", async () => {
    card.classList.add("loading");
    try {
      const p = await Puzzles.fetchNext(card.dataset.theme, Meta.profile.puzzleDiff || "normal");
      enterPuzzle(p);
    } catch {
      $("#puzzles-sub").textContent = t("puzzleFetchErr");
    } finally { card.classList.remove("loading"); }
  }));

  // مدرب الافتتاحيات — تعلم الخطوط الرئيسية نقلة نقلة
  let opSec = $("#opening-section");
  if (!opSec) {
    opSec = document.createElement("div");
    opSec.id = "opening-section";
    opSec.style.cssText = "max-width:880px;margin:0 auto;text-align:start";
    $("#puzzle-groups").before(opSec);
  }
  opSec.innerHTML = `
    <div class="puzzle-group-title">📖 ${t("openingsTitle")}
      <div style="font-weight:400;font-size:.78em;color:var(--text-mute);font-family:var(--font-body)">${t("openingsSub")}</div></div>
    <div id="opening-grid">${OPENING_LINES.map((o) => {
      const done = Meta.profile.puzzles.solved.includes("op-" + o.id);
      return `<div class="opening-card${done ? " done" : ""}" data-op="${o.id}">
        <div class="op-head"><span>${done ? "✅" : o.icon}</span><span>${o.name[LANG]}</span>
          <span class="op-side">${o.side === "w" ? "♔ " + t("asWhite") : "♚ " + t("asBlack")}</span></div>
        <div class="op-idea">${o.idea[LANG]}</div></div>`;
    }).join("")}</div>`;
  opSec.querySelectorAll(".opening-card").forEach((card) => card.addEventListener("click", () =>
    enterOpening(OPENING_LINES.find((o) => o.id === card.dataset.op))));

  // مدرب النهايات — المحرك يدافع واللاعب يحسم
  let egSec = $("#endgame-section");
  if (!egSec) {
    egSec = document.createElement("div");
    egSec.id = "endgame-section";
    egSec.style.cssText = "max-width:880px;margin:0 auto;text-align:start";
    $("#puzzle-groups").before(egSec);
  }
  egSec.innerHTML = `
    <div class="puzzle-group-title">🏁 ${t("egTitle")}
      <div style="font-weight:400;font-size:.78em;color:var(--text-mute);font-family:var(--font-body)">${t("egSub")}</div></div>
    <div id="endgame-grid">${ENDGAME_DRILLS.map((d) => {
      const done = Meta.profile.puzzles.solved.includes("eg-" + d.id);
      return `<div class="opening-card${done ? " done" : ""}" data-eg="${d.id}">
        <div class="op-head"><span>${done ? "✅" : d.icon}</span><span>${d.name[LANG]}</span></div>
        <div class="op-idea">${d.idea[LANG]}</div></div>`;
    }).join("")}</div>`;
  egSec.querySelectorAll("[data-eg]").forEach((card) => card.addEventListener("click", () =>
    enterDrill(ENDGAME_DRILLS.find((d) => d.id === card.dataset.eg))));

  // تدريب الإحداثيات
  let coordsCard = $("#coords-card");
  if (!coordsCard) {
    coordsCard = document.createElement("div");
    coordsCard.id = "coords-card";
    coordsCard.className = "daily-banner";
    $("#puzzle-groups").before(coordsCard);
  }
  coordsCard.innerHTML = `
    <span class="db-icon">🧭</span>
    <div class="db-text">
      <div class="db-title">${t("coordsTitle")}</div>
      <div class="db-desc">${t("coordsDesc", { best: Meta.profile.coordsBest })}</div>
    </div>
    <button class="db-btn">${t("coordsStart")}</button>`;
  coordsCard.querySelector(".db-btn").addEventListener("click", startCoords);

  // لوحة التحليل الحرة
  let labCard = $("#lab-card");
  if (!labCard) {
    labCard = document.createElement("div");
    labCard.id = "lab-card";
    labCard.className = "daily-banner";
    $("#puzzle-groups").before(labCard);
  }
  labCard.innerHTML = `
    <span class="db-icon">🔬</span>
    <div class="db-text">
      <div class="db-title">${t("labTitle")}</div>
      <div class="db-desc">${t("labDesc")}</div>
    </div>
    <button class="db-btn">${t("labStart")}</button>`;
  labCard.querySelector(".db-btn").addEventListener("click", () => startLab());

  // المجموعات المحلية (تعمل دون اتصال)
  const box = $("#puzzle-groups");
  box.innerHTML = "";
  const icons = { mate1: "⚡", mate2: "🎯", tactic: "🗡️" };
  for (const kind of ["mate1", "mate2", "tactic"]) {
    const list = Puzzles.packByKind(kind);
    if (!list.length) continue;
    const h = document.createElement("div");
    h.className = "puzzle-group-title";
    h.textContent = `${icons[kind]} ${t(kind)}`;
    const grid = document.createElement("div");
    grid.className = "puzzle-grid";
    list.forEach((p, i) => {
      const solved = Meta.profile.puzzles.solved.includes(p.id);
      const cell = document.createElement("div");
      cell.className = "puzzle-cell" + (solved ? " done" : "");
      cell.innerHTML = `<span class="pz-icon">${solved ? "✅" : icons[kind]}</span>${i + 1}`;
      cell.addEventListener("click", () => enterPuzzle(p));
      grid.appendChild(cell);
    });
    box.appendChild(h);
    box.appendChild(grid);
  }
}

function puzzleGoalText() {
  if (puzzle && puzzle.title) return puzzle.title;
  if (puzzle && puzzle.theme) return t("th_" + puzzle.theme);
  return t(PUZZLE_GOALS[(puzzle && puzzle.kind) || "tactic"] || "tactic");
}

// ---- مدرسة السفاري: تعلم حركة القطع بالتقاط البيادق ----
let school = null;

function enterSchool(lessonId, stageIdx = 0) {
  const lesson = SCHOOL_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return;
  const stage = lesson.stages[stageIdx];
  school = { lesson, stageIdx };
  mode = "school";
  puzzle = null; rush = null; dailyActive = false; drill = null;
  startGame({ fen: stage.fen, color: "w", orientation: "w", skipIntro: true });
  $("#bot-avatar").innerHTML = lesson.icon;
  $("#bot-name").textContent = t("schoolTitle");
  $("#bot-elo").textContent = lesson.name[LANG] + " — " + t("schoolStage", { a: stageIdx + 1, b: lesson.stages.length });
  $("#game-btns").hidden = true;
  $("#puzzle-btns").hidden = false;
  $("#btn-puzzle-hint").hidden = true;
  $("#btn-puzzle-solution").hidden = true;
  $("#btn-puzzle-next").hidden = true;
  schoolBanner();
}

function blackPawnsLeft() {
  let n = 0;
  game.board().forEach((row) => row.forEach((p) => { if (p && p.color === "b" && p.type === "p") n++; }));
  return n;
}

function schoolBanner() {
  const stage = school.lesson.stages[school.stageIdx];
  if (stage.hint) return banner(t(stage.hint));
  const texts = {
    promote: () => t("schoolGoalPromote"),
    castle: () => t("schoolGoalCastle"),
    check: () => t("schoolGoalCheck"),
    mate: () => t("schoolGoalMate"),
    eat: () => t("schoolGoalEat", { n: blackPawnsLeft() }),
  };
  banner((texts[stage.goal] || texts.eat)());
}

function schoolAfterMove(mv) {
  const stage = school.lesson.stages[school.stageIdx];
  let done;
  if (stage.goal === "promote") done = !!mv.promotion;
  else if (stage.goal === "castle") done = mv.flags.includes("k") || mv.flags.includes("q");
  else if (stage.goal === "check") done = game.in_check();
  else if (stage.goal === "mate") done = game.in_checkmate();
  else done = blackPawnsLeft() === 0;
  if (!done) {
    // مرحلة صارمة: النقلة الخاطئة تعيد الوضعية (وإلا ضاع الحق إلى الأبد)
    if (stage.strict || mv.captured === "k") {
      Sounds.illegal();
      banner(t("schoolTryAgain"), true);
      const token = gameToken;
      setTimeout(() => {
        if (token === gameToken && mode === "school" && school) enterSchool(school.lesson.id, school.stageIdx);
      }, 900);
      return;
    }
    // البيادق السوداء طعام ساكن — الدور يعود للاعب فورا
    const parts = game.fen().split(" ");
    parts[1] = "w"; parts[3] = "-";
    game.load(parts.join(" "));
    schoolBanner();
    return;
  }
  gameOver = true;
  if (school.stageIdx < school.lesson.stages.length - 1) {
    Sounds.streak(school.stageIdx + 1);
    banner(t("schoolStageDone"));
    const token = gameToken;
    setTimeout(() => {
      if (token === gameToken && mode === "school" && school) enterSchool(school.lesson.id, school.stageIdx + 1);
    }, 1200);
    return;
  }
  const earned = Meta.recordPuzzleSolved("sc-" + school.lesson.id, 15);
  banner(t("schoolDone", { name: school.lesson.name[LANG] }) + (earned ? " — " + t("earned", { n: earned }) : ""));
  if (earned) updateChips();
  Sounds.win();
  launchConfetti();
  const span = $("#btn-puzzle-next").querySelector("span");
  if (span) span.textContent = t("schoolNext");
  $("#btn-puzzle-next").hidden = false;
}

// ---- مدرب النهايات: المحرك يدافع بأقصى قوة واللاعب يحسم ----
let drill = null;

function enterDrill(d) {
  drill = { ...d, success: false };
  mode = "drill";
  puzzle = null; rush = null; dailyActive = false;
  startGame({ fen: d.fen, color: "w", orientation: "w", skipIntro: true });
  $("#bot-avatar").innerHTML = d.icon;
  $("#bot-name").textContent = t("egTitle");
  $("#bot-elo").textContent = d.name[LANG];
  $("#game-btns").hidden = true;
  $("#puzzle-btns").hidden = false;
  $("#btn-puzzle-hint").hidden = true;
  $("#btn-puzzle-solution").hidden = true;
  $("#btn-puzzle-next").hidden = true;
  banner(t("drillGoal", { name: d.name[LANG] }));
  Engine.init().catch(() => {});
}

async function drillReply() {
  if (gameOver || mode !== "drill" || game.turn() === playerColor) return;
  const token = gameToken;
  $("#bot-avatar").classList.add("thinking");
  let mv = null;
  try {
    const uci = await Engine.bestMove(game.fen(), { skill: 20, depth: 12 });
    if (uci) mv = { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined };
  } catch {
    const all = game.moves({ verbose: true });
    if (all.length) mv = { from: all[0].from, to: all[0].to, promotion: all[0].promotion };
  }
  if (token !== gameToken || gameOver || mode !== "drill") return;
  $("#bot-avatar").classList.remove("thinking");
  if (mv) makeMove(mv);
}

function endDrill() {
  gameOver = true;
  const won = game.in_checkmate() && game.turn() !== playerColor;
  const nextBtn = $("#btn-puzzle-next");
  if (won) {
    drill.success = true;
    const earned = Meta.recordPuzzleSolved("eg-" + drill.id, 30);
    banner(t("drillDone") + (earned ? " — " + t("earned", { n: earned }) : ""));
    if (earned) updateChips();
    notifyBadges(Meta.autoBadges());
    Sounds.win();
    launchConfetti();
  } else {
    banner(t("drillFail"), true);
    Sounds.drawEnd();
  }
  const span = nextBtn.querySelector("span");
  if (span) span.textContent = t(won ? "egNext" : "drillRetry");
  nextBtn.hidden = false;
}

// ---- مدرب الافتتاحيات: الخط الرئيسي يصبح لغزا متسلسلا ----
function lineToUci(sanLine) {
  const c = new Chess();
  const out = [];
  for (const san of sanLine.split(" ")) {
    const mv = c.move(san);
    if (!mv) return null;
    out.push(mv.from + mv.to + (mv.promotion || ""));
  }
  return out;
}

function enterOpening(line) {
  const ucis = lineToUci(line.moves);
  if (!ucis) return;
  let fen, solution = ucis;
  if (line.side === "b") {
    // اللاعب أسود: نقلة الأبيض الأولى تطبق مسبقا في الوضعية
    const c = new Chess();
    c.move(line.moves.split(" ")[0]);
    fen = c.fen();
    solution = ucis.slice(1);
  } else {
    fen = new Chess().fen();
  }
  enterPuzzle({ id: "op-" + line.id, kind: "opening", fen, solution, reward: 20, title: line.name[LANG] });
}

function enterPuzzle(p) {
  puzzle = p;
  puzzleStep = 0;
  puzzleFailed = false;
  mode = "puzzle";
  const fenTurn = p.fen.split(" ")[1];
  startGame({ fen: p.fen, color: fenTurn, orientation: fenTurn, skipIntro: true });
  const label = rush ? t("rushProgress", { n: rush.count }) + " — " : "";
  banner(label + t("puzzleYourTurn", { goal: puzzleGoalText() }));
  // التلميح والحل متاحان في كل الألغاز بلا استثناء
  $("#btn-puzzle-hint").hidden = false;
  $("#btn-puzzle-solution").hidden = false;
  $("#btn-puzzle-next").hidden = !!rush;
  const nextSpan = $("#btn-puzzle-next").querySelector("span");
  if (nextSpan) nextSpan.textContent = t("puzzleNext"); // استعادة التسمية بعد مدرب النهايات
}

// ---- سلسلة السفاري: ألغاز lichess حية تتصاعد صعوبتها، والباقة المحلية احتياط ----
function rushDifficulty(n) {
  return n < 5 ? "easiest" : n < 10 ? "easier" : n < 15 ? "normal" : n < 20 ? "harder" : "hardest";
}
async function rushFetchNext() {
  if (!rush) return;
  const my = rush;
  banner(t("puzzleFetching"));
  try {
    const p = await Puzzles.fetchNext("mix", rushDifficulty(my.count));
    if (rush !== my) return;
    enterPuzzle(p);
  } catch {
    if (rush !== my) return;
    const p = my.fallback.shift();
    if (!p) return endRush(true);
    enterPuzzle(p);
  }
}
function startRush() {
  rush = { count: 0, fallback: [...Puzzles.PACK].sort(() => Math.random() - 0.5) };
  rushFetchNext();
}
function rushNext() {
  if (!rush) return;
  rush.count++;
  setTimeout(() => { if (rush) rushFetchNext(); }, 700);
}
function endRush(cleared = false) {
  if (!rush) return;
  const score = rush.count;
  const reward = score * 5;
  if (score > Meta.profile.bestRush) { Meta.profile.bestRush = score; Meta.save(); }
  if (reward) { Meta.profile.bananas += reward; Meta.save(); updateChips(); }
  notifyBadges(Meta.autoBadges());
  gameOver = true;
  banner((cleared ? "🏆 " : "") + t("rushEnd", { n: score }) + (reward ? " — " + t("earned", { n: reward }) : ""));
  rush = null;
  if (cleared) { Sounds.win(); launchConfetti(); }
  else Sounds.drawEnd();
}

function puzzleTryMove(mv) {
  const expected = puzzle.solution[puzzleStep];
  const uci = mv.from + mv.to + (mv.promotion || "");
  // نقبل نقلة الحل، أو أي نقلة كش مات في الخطوة الأخيرة
  const isLast = puzzleStep === puzzle.solution.length - 1;
  let ok = uci === expected;
  if (!ok && isLast) {
    const test = new Chess(game.fen());
    test.move({ from: mv.from, to: mv.to, promotion: mv.promotion });
    ok = test.in_checkmate();
  }
  deselect();
  if (!ok) {
    puzzleFailed = true;
    Sounds.illegal();
    if (rush) return endRush(false); // خطأ واحد ينهي السلسلة
    banner(t("puzzleWrong"), true);
    setTimeout(() => { if (mode === "puzzle" && !gameOver) banner(t("puzzleYourTurn", { goal: puzzleGoalText() })); }, 1600);
    return;
  }
  makeMove({ from: mv.from, to: mv.to, promotion: mv.promotion });
  puzzleStep++;
  if (puzzleStep >= puzzle.solution.length) return puzzleSolved();
  // رد الخصم من الحل (محمي من الخروج أثناء المهلة)
  const token = gameToken;
  setTimeout(() => {
    if (token !== gameToken || mode !== "puzzle" || !puzzle) return;
    const reply = puzzle.solution[puzzleStep];
    makeMove({ from: reply.slice(0, 2), to: reply.slice(2, 4), promotion: reply[4] || undefined });
    puzzleStep++;
    if (puzzleStep >= puzzle.solution.length) puzzleSolved();
    else banner(t("puzzleYourTurn", { goal: puzzleGoalText() }));
  }, 450);
}

function puzzleSolved() {
  if (rush) {
    banner(t("puzzleCorrect") + " 🔥 " + t("rushProgress", { n: rush.count + 1 }));
    Sounds.streak(rush.count + 1); // النغمة ترتفع مع طول السلسلة
    rushNext();
    return;
  }
  gameOver = true;
  const doneText = puzzle.kind === "opening" ? t("openingLearned") : t("puzzleSolved");
  banner(doneText);
  Sounds.win();
  launchConfetti();
  if (!puzzleFailed) {
    const earned = Meta.recordPuzzleSolved(puzzle.id, puzzle.reward || 15);
    if (earned) {
      banner(doneText + " " + t("earned", { n: earned }));
      updateChips();
    }
    notifyBadges(Meta.autoBadges());
  }
}

$("#btn-puzzle-hint").addEventListener("click", () => {
  if (!puzzle || gameOver || puzzleStep >= puzzle.solution.length) return;
  puzzleFailed = true; // التلميح يلغي المكافأة الكاملة؟ لا — يبقيها لكن لا يعيد استخدامها
  const next = puzzle.solution[puzzleStep];
  sqEl(next.slice(0, 2))?.classList.add("hint-move");
  setTimeout(() => clearHighlights("hint-move"), 1800);
});
$("#btn-puzzle-solution").addEventListener("click", async () => {
  if (!puzzle || gameOver) return;
  puzzleFailed = true;
  while (puzzleStep < puzzle.solution.length) {
    const u = puzzle.solution[puzzleStep];
    makeMove({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || undefined });
    puzzleStep++;
    await new Promise((r) => setTimeout(r, 550));
  }
  gameOver = true;
  banner(t("puzzleSolved"));
});
$("#btn-puzzle-next").addEventListener("click", async () => {
  // مدرسة السفاري: الدرس التالي غير المتقن
  if (mode === "school" && school) {
    const cur = SCHOOL_LESSONS.findIndex((l) => l.id === school.lesson.id);
    const next = SCHOOL_LESSONS.slice(cur + 1).find((l) => !Meta.profile.puzzles.solved.includes("sc-" + l.id))
      || SCHOOL_LESSONS.find((l) => !Meta.profile.puzzles.solved.includes("sc-" + l.id));
    if (next) return enterSchool(next.id);
    goHome();
    document.querySelector('.mode-tab[data-mode="puzzles"]').click();
    return;
  }
  // مدرب النهايات: إعادة عند الإخفاق، والتالي غير المتقن عند النجاح
  if (mode === "drill" && drill) {
    if (!drill.success) return enterDrill(drill);
    const cur = ENDGAME_DRILLS.findIndex((d) => d.id === drill.id);
    const next = ENDGAME_DRILLS.slice(cur + 1).find((d) => !Meta.profile.puzzles.solved.includes("eg-" + d.id))
      || ENDGAME_DRILLS.find((d) => !Meta.profile.puzzles.solved.includes("eg-" + d.id));
    if (next) return enterDrill(next);
    goHome();
    document.querySelector('.mode-tab[data-mode="puzzles"]').click();
    return;
  }
  if (!puzzle) return goHome();
  // مدرب الافتتاحيات: الخط التالي غير المتقن
  if (puzzle.kind === "opening") {
    const cur = OPENING_LINES.findIndex((o) => "op-" + o.id === puzzle.id);
    const next = OPENING_LINES.slice(cur + 1).find((o) => !Meta.profile.puzzles.solved.includes("op-" + o.id))
      || OPENING_LINES.find((o) => !Meta.profile.puzzles.solved.includes("op-" + o.id));
    if (next) return enterOpening(next);
    goHome();
    document.querySelector('.mode-tab[data-mode="puzzles"]').click();
    return;
  }
  // ألغاز lichess (موضوع/يومي): نجلب لغزا جديدا من الموضوع نفسه
  if (puzzle.theme || puzzle.kind === "daily") {
    const btn = $("#btn-puzzle-next");
    btn.disabled = true;
    banner(t("puzzleFetching"));
    try {
      const p = await Puzzles.fetchNext(puzzle.theme || "mix", puzzle.difficulty || Meta.profile.puzzleDiff || "normal");
      enterPuzzle(p);
    } catch { banner(t("puzzleFetchErr"), true); }
    btn.disabled = false;
    return;
  }
  const list = Puzzles.packByKind(puzzle.kind);
  const idx = list.indexOf(puzzle);
  const next = list.slice(idx + 1).find((p) => !Meta.profile.puzzles.solved.includes(p.id))
    || list.find((p) => !Meta.profile.puzzles.solved.includes(p.id));
  if (next) enterPuzzle(next);
  else goHome();
});
$("#btn-puzzle-back").addEventListener("click", () => {
  goHome();
  document.querySelector('.mode-tab[data-mode="puzzles"]').click();
});

// ============ تدريب الإحداثيات ============
let coords = null;

function startCoords() {
  gameToken++;
  gameOver = true; // يعطل إدخال قطع الشطرنج — للتدريب معالجه الخاص أدناه
  puzzle = null; rush = null; dailyActive = false;
  mode = "coords";
  analysisEntries = null;
  Clock.halt(); Engine.stop(); clearArrows(); exitAnalysisUI();
  $("#setup-screen").hidden = true;
  $("#game-screen").hidden = false;
  $("#end-modal").hidden = true;
  orientation = "w";
  buildBoard();
  Object.values(pieceEls).forEach((el) => el.remove());
  pieceEls = {};
  clearHighlights();
  // بطاقات وأزرار الوضع
  $("#bot-avatar").innerHTML = "🧭";
  $("#bot-avatar").classList.remove("thinking");
  $("#bot-name").textContent = t("coordsTitle");
  $("#bot-elo").textContent = `⭐ ${Meta.profile.coordsBest}`;
  $("#bot-bubble").hidden = true;
  $("#coach-bubble").hidden = true;
  resetChatter();
  $("#human-status").textContent = "";
  $("#human-card").classList.remove("active");
  $("#bot-card").classList.remove("active");
  $("#captured-by-bot").innerHTML = "";
  $("#captured-by-human").innerHTML = "";
  $("#clock-bot").hidden = true;
  $("#clock-human").hidden = true;
  $("#game-btns").hidden = true;
  $("#puzzle-btns").hidden = false;
  $("#lab-btns").hidden = true;
  lab = null;
  $("#btn-puzzle-hint").hidden = true;
  $("#btn-puzzle-solution").hidden = true;
  $("#btn-puzzle-next").hidden = true;
  $("#chat-wrap").hidden = true;
  $("#move-ticker").hidden = true;
  $("#move-list-wrap").hidden = true;
  $("#opening-name").hidden = true;
  // انطلاق الجولة: 30 ثانية
  coords = { score: 0, left: 30, target: null, timer: null };
  nextCoordTarget();
  banner(t("coordsScore", { n: 0, s: 30 }));
  coords.timer = setInterval(() => {
    if (!coords) return;
    coords.left--;
    if (coords.left <= 0) return endCoords();
    banner(t("coordsScore", { n: coords.score, s: coords.left }));
  }, 1000);
}

function nextCoordTarget() {
  let sq;
  do { sq = FILES[Math.floor(Math.random() * 8)] + (1 + Math.floor(Math.random() * 8)); }
  while (coords.target === sq);
  coords.target = sq;
  const el = $("#coords-target");
  el.textContent = sq;
  el.hidden = false;
}

function endCoords() {
  if (!coords) return;
  clearInterval(coords.timer);
  const score = coords.score;
  coords = null;
  $("#coords-target").hidden = true;
  const isBest = score > Meta.profile.coordsBest;
  if (isBest) Meta.profile.coordsBest = score;
  if (score) { Meta.profile.bananas += score; updateChips(); }
  Meta.save();
  banner(t("coordsEnd", { n: score })
    + (score ? " — " + t("earned", { n: score }) : "")
    + (isBest && score > 0 ? " " + t("coordsBest") : ""));
  if (isBest && score > 0) { Sounds.win(); launchConfetti(); }
  else Sounds.drawEnd();
}

boardEl.addEventListener("pointerdown", (e) => {
  if (mode !== "coords" || !coords) return;
  const sq = eventSquare(e);
  if (!sq) return;
  const el = sqEl(sq);
  if (sq === coords.target) {
    coords.score++;
    Sounds.capture();
    if (el) { el.classList.remove("coord-good"); void el.offsetWidth; el.classList.add("coord-good"); }
    banner(t("coordsScore", { n: coords.score, s: coords.left }));
    nextCoordTarget();
  } else {
    Sounds.illegal();
    if (el) { el.classList.remove("coord-bad"); void el.offsetWidth; el.classList.add("coord-bad"); }
  }
});

// ============ لوحة التحليل الحرة ============
let lab = null;

function startLab() {
  gameToken++;
  gameOver = true; // يعطل إدخال قطع الشطرنج — للوحة معالجها الخاص أدناه
  puzzle = null; rush = null; dailyActive = false;
  if (coords) { clearInterval(coords.timer); coords = null; }
  mode = "lab";
  analysisEntries = null;
  Clock.halt(); Engine.stop(); clearArrows(); exitAnalysisUI();
  $("#setup-screen").hidden = true;
  $("#game-screen").hidden = false;
  $("#end-modal").hidden = true;
  orientation = "w";
  buildBoard();
  clearHighlights();
  lab = { board: new Chess(), sel: null, turn: "w", busy: false };
  renderAllPieces(lab.board);
  // بطاقات وأزرار الوضع
  $("#bot-avatar").innerHTML = "🔬";
  $("#bot-avatar").classList.remove("thinking");
  $("#bot-name").textContent = t("labTitle");
  $("#bot-elo").textContent = "";
  $("#bot-bubble").hidden = true;
  $("#coach-bubble").hidden = true;
  resetChatter();
  $("#human-status").textContent = "";
  $("#human-card").classList.remove("active");
  $("#bot-card").classList.remove("active");
  $("#captured-by-bot").innerHTML = "";
  $("#captured-by-human").innerHTML = "";
  $("#clock-bot").hidden = true;
  $("#clock-human").hidden = true;
  $("#game-btns").hidden = true;
  $("#puzzle-btns").hidden = true;
  $("#lab-btns").hidden = false;
  $("#chat-wrap").hidden = true;
  $("#move-ticker").hidden = true;
  $("#move-list-wrap").hidden = true;
  $("#opening-name").hidden = true;
  $("#coords-target").hidden = true;
  buildLabPalette();
  updateLabTurnBtn();
  banner(t("labHint"));
  Engine.init().catch(() => {});
}

function buildLabPalette() {
  const pal = $("#lab-palette");
  pal.innerHTML = "";
  for (const color of ["w", "b"]) for (const type of ["k", "q", "r", "b", "n", "p"]) {
    const b = document.createElement("button");
    b.className = "lab-pc";
    b.dataset.p = color + type;
    b.innerHTML = pieceSVG(type, color);
    pal.appendChild(b);
  }
  const er = document.createElement("button");
  er.className = "lab-pc";
  er.dataset.p = "erase";
  er.textContent = "🧽";
  pal.appendChild(er);
  pal.querySelectorAll(".lab-pc").forEach((b) => b.addEventListener("click", () => {
    if (!lab) return;
    lab.sel = lab.sel === b.dataset.p ? null : b.dataset.p;
    pal.querySelectorAll(".lab-pc").forEach((x) => x.classList.toggle("selected", x.dataset.p === lab.sel));
  }));
}

function updateLabTurnBtn() {
  if (!lab) return;
  $("#btn-lab-turn").textContent =
    (lab.turn === "w" ? "⚪ " : "⚫ ") + t("labTurn", { side: t(lab.turn === "w" ? "white" : "black") });
}

// وضع القطع ومسحها باللمس
boardEl.addEventListener("pointerdown", (e) => {
  if (mode !== "lab" || !lab || !lab.sel) return;
  const sq = eventSquare(e);
  if (!sq) return;
  if (lab.sel === "erase") {
    if (lab.board.get(sq)) { lab.board.remove(sq); Sounds.capture(); }
  } else {
    const color = lab.sel[0], type = lab.sel[1];
    if (type === "p" && (sq[1] === "1" || sq[1] === "8")) { Sounds.illegal(); banner(t("labPawns"), true); return; }
    if (type === "k") {
      // ملك واحد لكل جانب: الوضع الجديد يزيح القديم
      lab.board.board().forEach((row, ri) => row.forEach((p, fi) => {
        if (p && p.type === "k" && p.color === color) lab.board.remove(FILES[fi] + (8 - ri));
      }));
    }
    lab.board.remove(sq);
    lab.board.put({ type, color }, sq);
    Sounds.move();
  }
  clearArrows();
  hideBanner();
  renderAllPieces(lab.board);
});

// حقوق التبييت تستنتج من المواقع الأصلية للملك والقلاع
function labFen() {
  const at = (s) => lab.board.get(s);
  let cast = "";
  if (at("e1")?.type === "k" && at("e1")?.color === "w") {
    if (at("h1")?.type === "r" && at("h1")?.color === "w") cast += "K";
    if (at("a1")?.type === "r" && at("a1")?.color === "w") cast += "Q";
  }
  if (at("e8")?.type === "k" && at("e8")?.color === "b") {
    if (at("h8")?.type === "r" && at("h8")?.color === "b") cast += "k";
    if (at("a8")?.type === "r" && at("a8")?.color === "b") cast += "q";
  }
  return `${lab.board.fen().split(" ")[0]} ${lab.turn} ${cast || "-"} - 0 1`;
}

function labValidate() {
  let wk = 0, bk = 0, badPawn = false;
  lab.board.board().forEach((row, ri) => row.forEach((p) => {
    if (!p) return;
    if (p.type === "k") { if (p.color === "w") wk++; else bk++; }
    if (p.type === "p" && (ri === 0 || ri === 7)) badPawn = true;
  }));
  if (wk !== 1 || bk !== 1) return t("labKings");
  if (badPawn) return t("labPawns");
  // من ليس دوره لا يجوز أن يكون ملكه مهددا
  const flipped = new Chess(labFen().replace(` ${lab.turn} `, ` ${lab.turn === "w" ? "b" : "w"} `));
  if (flipped.in_check()) return t("labCheckTurn");
  return null;
}

$("#btn-lab-turn").addEventListener("click", () => {
  if (!lab) return;
  lab.turn = lab.turn === "w" ? "b" : "w";
  clearArrows();
  updateLabTurnBtn();
});
$("#btn-lab-startpos").addEventListener("click", () => {
  if (!lab) return;
  lab.board = new Chess();
  lab.turn = "w";
  clearArrows(); hideBanner();
  renderAllPieces(lab.board);
  updateLabTurnBtn();
});
$("#btn-lab-clear").addEventListener("click", () => {
  if (!lab) return;
  lab.board.clear();
  clearArrows(); hideBanner();
  renderAllPieces(lab.board);
});
$("#btn-lab-analyze").addEventListener("click", async () => {
  if (mode !== "lab" || !lab || lab.busy) return;
  const err = labValidate();
  if (err) { Sounds.illegal(); banner(err, true); return; }
  lab.busy = true;
  $("#btn-lab-analyze").disabled = true;
  banner(t("labAnalyzing"));
  const token = gameToken;
  try {
    const fen = labFen();
    const r = await Engine.evaluate(fen, { depth: 12 });
    if (token !== gameToken || mode !== "lab" || !lab) return;
    clearArrows();
    if (!r.best) { banner(t("labNoMoves")); return; }
    drawArrow(r.best.slice(0, 2), r.best.slice(2, 4));
    if (r.mate !== null) {
      const mateSide = (r.mate > 0) === (lab.turn === "w") ? "white" : "black";
      banner(t("labMate", { n: Math.abs(r.mate), side: t(mateSide) }));
    } else {
      const ws = lab.turn === "w" ? r.score : -r.score;
      banner(t("labEval", { s: (ws >= 0 ? "+" : "") + (ws / 100).toFixed(1) }));
    }
  } catch { banner(t("engineError"), true); }
  finally {
    lab.busy = false;
    $("#btn-lab-analyze").disabled = false;
  }
});
$("#btn-lab-play").addEventListener("click", () => {
  if (mode !== "lab" || !lab) return;
  const err = labValidate();
  if (err) { Sounds.illegal(); banner(err, true); return; }
  const fen = labFen();
  if (new Chess(fen).game_over()) { banner(t("labNoMoves"), true); return; }
  mode = "bot";
  startGame({ fen, color: fen.split(" ")[1], skipIntro: true });
  rewardsRecorded = true; // وضعيات مرتبة يدويا: بلا مكافآت ولا ELO
});
$("#btn-lab-home").addEventListener("click", () => {
  goHome();
  document.querySelector('.mode-tab[data-mode="puzzles"]').click();
});

// ============ التحليل ============
$("#btn-analyze").addEventListener("click", async () => {
  $("#end-modal").hidden = true;
  enterAnalysis();
});

function exitAnalysisUI() {
  $("#analysis-nav").hidden = true;
  $("#analysis-box").hidden = true;
  $("#btn-exit-analysis").hidden = true;
  // عنصر SVG لا يستجيب لخاصية hidden — نستخدم السمة مباشرة
  $("#eval-graph").setAttribute("hidden", "");
  $("#an-summary").innerHTML = "";
  $("#move-list-wrap").hidden = true;
  $("#move-ticker").hidden = false;
}

async function enterAnalysis() {
  analysisCancel = false;
  analysisPly = game.history().length;
  const history = game.history({ verbose: true });
  const myColor = mode === "watch" ? "w" : playerColor;

  $("#analysis-nav").hidden = false;
  $("#analysis-box").hidden = false;
  $("#btn-exit-analysis").hidden = false;
  $("#game-btns").querySelectorAll(".side-btn").forEach((b) => { if (b.id !== "btn-exit-analysis" && b.id !== "btn-newgame") b.hidden = true; });
  $("#analysis-progress").textContent = t("analyzing", { p: 0 });
  $("#analysis-detail").textContent = "";
  // في التحليل: القائمة الكاملة بدل الشريط المضغوط
  $("#move-ticker").hidden = true;
  $("#move-list-wrap").hidden = false;
  $("#eval-graph").setAttribute("hidden", "");
  $("#an-summary").innerHTML = "";
  hideBanner();

  analysisEntries = new Array(history.length).fill(null);
  renderAnalysisPly();

  const entries = await Analysis.analyzeGame(history, myColor, {
    depth: 10,
    isCancelled: () => analysisCancel,
    onProgress: (done, total) => {
      $("#analysis-progress").textContent = t("analyzing", { p: Math.round((done / total) * 100) });
    },
  });
  if (analysisCancel) return;
  analysisEntries = entries;
  // نسبة الدقة من متوسط الخسارة بالسنتي-بيدق
  const mine = entries.filter((e) => e && e.badge);
  const acc = mine.length
    ? Math.round(mine.reduce((s, e) => s + 100 * Math.exp(-e.cpLoss / 320), 0) / mine.length)
    : null;
  $("#analysis-progress").textContent = t("analysisDone") + " ✓" + (acc !== null ? ` — ${t("accuracy")}: ${acc}%` : "");
  decorateMoveList();
  renderEvalGraph();
  renderAnalysisSummary();
  renderAnalysisPly();
}

// منحنى تقييم المباراة (من منظور اللاعب) — انقر للانتقال إلى أي نقلة
function renderEvalGraph() {
  const svg = $("#eval-graph");
  if (!analysisEntries || analysisEntries.length < 2) { svg.setAttribute("hidden", ""); return; }
  const n = analysisEntries.length;
  const clamp = (v) => Math.max(-450, Math.min(450, v || 0));
  const X = (i) => (((i + 1) / n) * 100).toFixed(2);
  const Y = (v) => (20 - (clamp(v) / 450) * 18).toFixed(2);
  let d = `M0,${Y(0)}`;
  analysisEntries.forEach((e, i) => { d += ` L${X(i)},${Y(e ? e.evalAfter : 0)}`; });
  svg.innerHTML = `
    <path d="${d} L100,20 L0,20 Z" fill="rgba(255,203,69,.22)"/>
    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,.25)" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <path d="${d}" fill="none" stroke="var(--gold)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    <line id="eval-cursor" x1="0" y1="0" x2="0" y2="40" stroke="var(--brand)" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
  svg.removeAttribute("hidden");
  updateEvalCursor();
}
function updateEvalCursor() {
  const cur = $("#eval-cursor");
  if (!cur || !analysisEntries || !analysisEntries.length) return;
  const x = (analysisPly / analysisEntries.length) * 100;
  cur.setAttribute("x1", x);
  cur.setAttribute("x2", x);
}
$("#eval-graph").addEventListener("click", (e) => {
  if (!analysisEntries || !analysisEntries.length) return;
  const r = e.currentTarget.getBoundingClientRect();
  if (!r.width) return;
  const frac = (e.clientX - r.left) / r.width;
  if (!isFinite(frac)) return;
  analysisPly = Math.max(0, Math.min(analysisEntries.length, Math.round(frac * analysisEntries.length)));
  renderAnalysisPly();
});

// ملخص جودة النقلات (ممتازة/جيدة/خطأ/فادح)
function renderAnalysisSummary() {
  const counts = { best: 0, good: 0, ok: 0, mistake: 0, blunder: 0 };
  (analysisEntries || []).forEach((e) => { if (e && e.badge) counts[e.cls]++; });
  $("#an-summary").innerHTML = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `<span class="an-chip cls-${k}">${Analysis.BADGE[k]} ${t(CLS_LABEL[k])} ×${v}</span>`)
    .join("");
}

const CLS_LABEL = { best: "clsBest", good: "clsGood", ok: "clsOk", mistake: "clsMistake", blunder: "clsBlunder" };

function decorateMoveList() {
  const ol = $("#move-list");
  const hist = game.history();
  ol.innerHTML = "";
  for (let i = 0; i < hist.length; i += 2) {
    const li = document.createElement("li");
    const badge = (idx) => {
      const e = analysisEntries && analysisEntries[idx];
      return e && e.badge ? `<span class="an-badge">${e.badge}</span>` : "";
    };
    li.innerHTML = `<span class="mv-num">${i / 2 + 1}.</span>
      <span class="mv" data-ply="${i + 1}">${hist[i]}${badge(i)}</span>
      <span class="mv" data-ply="${i + 2}">${hist[i + 1] || ""}${hist[i + 1] ? badge(i + 1) : ""}</span>`;
    ol.appendChild(li);
  }
  ol.querySelectorAll(".mv[data-ply]").forEach((el) => {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => { analysisPly = +el.dataset.ply; renderAnalysisPly(); });
  });
}

function renderAnalysisPly() {
  const history = game.history({ verbose: true });
  analysisPly = Math.max(0, Math.min(analysisPly, history.length));
  const replay = new Chess();
  for (let i = 0; i < analysisPly; i++) replay.move(history[i].san);
  renderPosition(replay);
  clearHighlights(); clearArrows();
  if (analysisPly > 0) {
    const last = history[analysisPly - 1];
    highlightLastMove(last.from, last.to);
  }
  highlightCheck(replay);
  $("#an-label").textContent = `${analysisPly} / ${history.length}`;
  // تفاصيل النقلة الحالية
  const e = analysisEntries && analysisEntries[analysisPly - 1];
  const detail = $("#analysis-detail");
  if (e && e.badge) {
    let html = `<span class="cls-${e.cls}">${e.badge} ${e.san} — ${t(CLS_LABEL[e.cls])}</span>`;
    if ((e.cls === "mistake" || e.cls === "blunder") && e.bestUci) {
      html += ` <span style="color:var(--text-dim)">• ${t("bestWas")}: ${e.bestUci}</span>`;
      drawArrow(e.bestUci.slice(0, 2), e.bestUci.slice(2, 4), "rgba(122,199,79,.8)");
    }
    detail.innerHTML = html;
  } else {
    detail.textContent = "";
  }
  // تمييز النقلة في القائمة + مؤشر المنحنى
  $("#move-list").querySelectorAll("li").forEach((li, i) => {
    li.classList.toggle("an-current", i === Math.floor((analysisPly - 1) / 2) && analysisPly > 0);
  });
  updateEvalCursor();
}

$("#an-first").addEventListener("click", () => { analysisPly = 0; renderAnalysisPly(); });
$("#an-prev").addEventListener("click", () => { analysisPly--; renderAnalysisPly(); });
$("#an-next").addEventListener("click", () => { analysisPly++; renderAnalysisPly(); });
$("#an-last").addEventListener("click", () => { analysisPly = game.history().length; renderAnalysisPly(); });
$("#btn-exit-analysis").addEventListener("click", goHome);

// ============ كونفيتي ============
function launchConfetti() {
  const canvas = $("#confetti");
  const ctx = canvas.getContext("2d");
  canvas.width = innerWidth; canvas.height = innerHeight;
  const colors = ["#ffc93c", "#7ac74f", "#e8702a", "#4fb3e8", "#e85a8a", "#f4f1ec"];
  const parts = Array.from({ length: 140 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    w: 6 + Math.random() * 7, h: 8 + Math.random() * 8,
    vy: 2.5 + Math.random() * 3.5, vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI, vr: -0.15 + Math.random() * 0.3,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  (function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach((p) => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (now - start < 3200) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  })(start);
}

// ============ الشريط العلوي ============
$("#btn-logo").addEventListener("click", () => {
  if ($("#game-screen").hidden) return;
  const inPlay = !gameOver && game.history().length > 0 && mode !== "watch" && mode !== "puzzle" && !analysisEntries;
  if (inPlay && !confirm(t("confirmLeave"))) return;
  if (mode === "online" && !gameOver) Net.send({ t: "resign" });
  $("#end-modal").hidden = true;
  goHome();
});
$("#btn-lang").addEventListener("click", toggleLang);
$("#btn-sound").addEventListener("click", () => {
  $("#btn-sound").textContent = Sounds.toggle() ? "🔊" : "🔇";
});
$("#btn-settings").addEventListener("click", () => { buildSettings(); $("#settings-modal").hidden = false; });
$("#btn-settings-close").addEventListener("click", () => { $("#settings-modal").hidden = true; });
$("#settings-modal").addEventListener("click", (e) => { if (e.target.id === "settings-modal") $("#settings-modal").hidden = true; });
$("#chip-bananas").addEventListener("click", () => { buildTrophyRoom(); $("#trophy-modal").hidden = false; });
$("#btn-trophy-close").addEventListener("click", () => { $("#trophy-modal").hidden = true; });
$("#trophy-modal").addEventListener("click", (e) => { if (e.target.id === "trophy-modal") $("#trophy-modal").hidden = true; });

document.addEventListener("langchange", () => {
  buildSetup();
  $("#chat-input").placeholder = t("typeMessage");
  if (!$("#game-screen").hidden) {
    $("#bot-name").textContent = opponentName();
    if (mode === "bot") $("#bot-elo").textContent = `${t("level")} ${currentBot.elo}`;
    $("#human-status").textContent = t(playerColor === "w" ? "playingAs_w" : "playingAs_b");
    updateStatus();
  }
});
document.addEventListener("cosmetics", () => {
  // إعادة رسم القطع عند تغيير الطقم
  if (!$("#game-screen").hidden) renderAllPieces();
});

// ============ التهيئة ============
applyLang();
Meta.applyCosmetics();
$("#btn-sound").textContent = Sounds.enabled ? "🔊" : "🔇";
buildSetup();

// منع تكبير القرص في iOS (يتجاهل user-scalable فيعلق اللاعب في تكبير لا فكاك منه):
// نمنع بدء التكبير، وإن كانت الصفحة مكبرة بالفعل نسمح بالإيماءة ليتمكن من التصغير فقط
(() => {
  const guardZoom = (e) => {
    const vv = window.visualViewport;
    if (!vv || vv.scale <= 1.001) e.preventDefault();
  };
  ["gesturestart", "gesturechange", "gestureend"].forEach((ev) =>
    document.addEventListener(ev, guardZoom, { passive: false })
  );
})();

// تسجيل عامل الخدمة (PWA)
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

// تحميل المحرك مسبقا
(async () => {
  const st = $("#engine-status");
  st.textContent = t("engineLoading");
  try {
    await Engine.init();
    st.textContent = t("engineReady");
    setTimeout(() => { if (st.textContent === t("engineReady")) st.textContent = ""; }, 2500);
  } catch {
    st.textContent = t("engineError");
  }
})();
