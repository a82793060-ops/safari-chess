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
function updateChips() {
  $("#chip-elo b").textContent = Meta.profile.elo;
  $("#chip-bananas b").textContent = Meta.profile.bananas;
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
  buildShop();
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
  $("#stats-box").innerHTML =
    `<div class="stat" style="grid-column:1/-1"><span>${t("stats")} — ${t("yourElo")}: </span><b style="display:inline">${Meta.profile.elo}</b></div>`
    + rows.map(([k, v]) => `<div class="stat"><b>${v}</b><span>${k}</span></div>`).join("")
    + `<div class="stat" style="grid-column:1/-1;margin-top:4px"><span>${t("badgesTitle")} (${Meta.profile.badges.length}/${Meta.BADGES.length})</span><div style="margin-top:6px;letter-spacing:6px">${badgesRow}</div></div>`;
}

function buildTcPicker() {
  const box = $("#tc-picker");
  const cur = Clock.control.id;
  box.innerHTML = "";
  Clock.CONTROLS.forEach((c) => {
    const b = document.createElement("button");
    b.className = "tc-btn" + (c.id === cur ? " selected" : "");
    b.textContent = c.label;
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

// ============ المتجر ============
function buildShop() {
  const box = $("#shop-sections");
  box.innerHTML = "";
  const sections = [
    ["board", t("shopBoards")],
    ["piece", t("shopPieces")],
    ["back", t("shopBacks")],
  ];
  for (const [kind, title] of sections) {
    const h = document.createElement("div");
    h.className = "shop-section-title";
    h.textContent = title;
    const grid = document.createElement("div");
    grid.className = "shop-grid";
    Meta.SHOP[kind].forEach((item) => {
      const owned = Meta.profile.owned[kind].includes(item.id);
      const equipped = Meta.profile.equipped[kind] === item.id;
      const cell = document.createElement("div");
      cell.className = "shop-item" + (equipped ? " equipped-item" : "");
      let swatch = "";
      if (kind === "board") swatch = `<div class="swatch"><div style="background:${item.light}"></div><div style="background:${item.dark}"></div><div style="background:${item.light}"></div><div style="background:${item.dark}"></div></div>`;
      else if (kind === "back") swatch = `<div class="swatch"><div style="background:linear-gradient(135deg,${item.v1},${item.v2})"></div></div>`;
      else swatch = `<div class="swatch" style="justify-content:center;background:#26352b">
        <svg viewBox="0 0 45 45">${PIECE_SET.wk.replaceAll("#f9f0dc", item.w)}</svg>
        <svg viewBox="0 0 45 45">${PIECE_SET.bq.replaceAll("#312b27", item.b)}</svg></div>`;
      cell.innerHTML = `${swatch}
        <div class="si-name">${item.name[LANG]}</div>
        <div class="si-price">${item.price ? item.price + " 🍌" : "—"}</div>`;
      const btn = document.createElement("button");
      if (equipped) { btn.textContent = t("equipped"); btn.disabled = true; btn.className = "own-btn"; }
      else if (owned) {
        btn.textContent = t("use"); btn.className = "own-btn";
        btn.addEventListener("click", () => { Meta.equip(kind, item.id); buildShop(); buildSetup(); });
      } else {
        btn.textContent = t("buy");
        btn.disabled = Meta.profile.bananas < item.price;
        btn.addEventListener("click", () => {
          if (Meta.buy(kind, item.id)) { Meta.equip(kind, item.id); Sounds.promote(); }
          buildShop(); updateChips(); buildSetup();
        });
      }
      cell.appendChild(btn);
      grid.appendChild(cell);
    });
    box.appendChild(h);
    box.appendChild(grid);
  }
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
    $("#shop-setup").hidden = setupTab !== "shop";
    $("#color-section").hidden = setupTab === "puzzles" || setupTab === "shop";
    $("#btn-start").hidden = setupTab !== "bot";
    $("#btn-create-link").hidden = setupTab !== "online" || !$("#invite-box").hidden;
    if (setupTab === "puzzles") buildPuzzlesScreen();
    if (setupTab === "shop") buildShop();
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
let dragEl = null, dragStartSq = null, dragMoved = false;

function inputAllowed() {
  if (gameOver || pendingPromotion) return false;
  if (mode === "watch" || analysisEntries) return false;
  if (mode === "puzzle") return puzzle && game.turn() === playerColor;
  return game.turn() === playerColor;
}

boardEl.addEventListener("pointerdown", (e) => {
  if (!inputAllowed()) return;
  const sq = eventSquare(e);
  if (!sq) return;
  const piece = game.get(sq);
  if (piece && piece.color === playerColor) {
    selectSquare(sq);
    dragEl = pieceEls[sq];
    dragStartSq = sq;
    dragMoved = false;
    try { boardEl.setPointerCapture(e.pointerId); } catch { /* أحداث اصطناعية */ }
  } else if (selectedSq && legalTargets.includes(sq)) {
    tryPlayerMove(selectedSq, sq);
  } else {
    deselect();
  }
});
boardEl.addEventListener("pointermove", (e) => {
  if (!dragEl) return;
  dragMoved = true;
  const rect = boardEl.getBoundingClientRect();
  const cell = rect.width / 8;
  const x = e.clientX - rect.left - cell / 2;
  const y = e.clientY - rect.top - cell / 2;
  dragEl.classList.add("dragging");
  dragEl.style.transform = `translate(${(x / cell) * 100}%, ${(y / cell) * 100}%)`;
});
boardEl.addEventListener("pointerup", (e) => {
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
  }
});
function eventSquare(e) {
  const rect = boardEl.getBoundingClientRect();
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
    // ردود فعل + مدرب + دور البوت
    if (mv.captured && Math.random() < 0.4) { speak(botPhrase(currentBot, "hurt")); FX.mood(Math.random() < 0.5 ? "shocked" : "worried"); }
    else if (game.in_check() && Math.random() < 0.5) { speak(botPhrase(currentBot, "hurt")); FX.mood("worried"); }
    runCoach(fenBefore, game.fen(), mv.from + mv.to + (mv.promotion || ""));
    setTimeout(botTurn, 250);
  }
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
  const el = pieceEls[mv.from];
  if (el) {
    delete pieceEls[mv.from];
    pieceEls[mv.to] = el;
    el.dataset.square = mv.to;
    positionEl(el, mv.to);
    if (mv.flags.includes("p")) {
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
      $("#status-banner").textContent = t("engineError");
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
    else if (mv.captured && Math.random() < 0.4) { speak(botPhrase(currentBot, "capture")); FX.mood("happy"); if (Math.random() < 0.3) FX.voice(currentBot.id); }
  }
}

// ============ نهاية اللعبة ============
function checkGameEnd() {
  if (!game.game_over()) return;
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
  const phrase = decisive && mode === "bot" ? botPhrase(currentBot, playerWon ? "lose" : "win") : "";
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
  if (mode === "online" && result !== null) notifyBadges(Meta.award("social"));
  $("#end-rewards").textContent = rewardsText;
  $("#btn-analyze").hidden = mode === "watch" || game.history().length < 4 || variant !== "standard";
  $("#btn-rematch").hidden = mode === "watch";
  modal.hidden = false;

  if (playerWon) { Sounds.win(); launchConfetti(); if (mode === "bot") FX.mood("worried", 5000); }
  else if (decisive && mode !== "watch") { Sounds.lose(); if (mode === "bot") { FX.mood("happy", 5000); FX.voice(currentBot.id); } }
  else Sounds.drawEnd();
  updateStatus();
}

// ============ الواجهة الجانبية ============
function opponentName() {
  return mode === "online" || mode === "watch" ? t("friend") : currentBot.name[LANG];
}
function updateStatus(thinking = false) {
  const banner = $("#status-banner");
  banner.classList.remove("alert");
  // حلقة الدور النشط على بطاقة صاحب الدور
  const myTurn = !gameOver && game.turn() === playerColor && mode !== "watch";
  const oppTurn = !gameOver && game.turn() !== playerColor && mode !== "watch";
  $("#human-card").classList.toggle("active", myTurn);
  $("#bot-card").classList.toggle("active", oppTurn);
  if (mode === "watch") { banner.textContent = t("watching"); return; }
  if (mode === "puzzle") return;
  if (gameOver) {
    banner.textContent = game.in_checkmate()
      ? (game.turn() !== playerColor ? t("youWin") : t("youLose"))
      : t("draw");
    return;
  }
  if (thinking || game.turn() !== playerColor) {
    banner.textContent = mode === "online" ? t("friendTurn") : `${currentBot.name[LANG]} ${t("botThinking")}`;
  } else if (game.in_check()) {
    banner.textContent = t("check");
    banner.classList.add("alert");
  } else {
    banner.textContent = t("yourTurn");
  }
}

function updateMoveList() {
  const ol = $("#move-list");
  const hist = game.history();
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
  toast.innerHTML = `${b.icon} ${t("newBadge")}: <span style="color:var(--gold)">${b[LANG] || b.ar}</span> <span style="color:var(--text-dim);font-size:.85em">+50 🍌</span>`;
  toast.hidden = false;
  Sounds.promote();
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
  } catch { $("#status-banner").textContent = t("engineError"); }
  btn.disabled = false;
});

$("#btn-undo").addEventListener("click", () => {
  if (gameOver || mode !== "bot" || game.turn() !== playerColor || game.history().length < 2) return;
  game.undo(); game.undo();
  undoUsed = true;
  deselect(); clearHighlights(); clearArrows();
  renderAllPieces();
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
    bananasText: `🍌 ${Meta.profile.bananas}`,
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
    $("#bot-name").textContent = puzzle ? t(puzzle.kind === "daily" ? "puzzleDaily" : puzzle.kind) : "";
    $("#bot-elo").textContent = puzzle && puzzle.rating ? `${t("level")} ${puzzle.rating}` : "";
  } else {
    $("#bot-avatar").innerHTML = botAvatar(currentBot);
    $("#bot-name").textContent = currentBot.name[LANG] + (dailyActive ? " 🎯" : "");
    $("#bot-elo").textContent = `${t("level")} ${currentBot.elo}`;
  }
  $("#bot-avatar").classList.remove("thinking");
  $("#human-status").textContent = mode === "watch" ? t("watching") : t(playerColor === "w" ? "playingAs_w" : "playingAs_b");
  $("#bot-bubble").hidden = true;

  // الأزرار حسب الطور
  $("#game-btns").hidden = mode === "puzzle";
  $("#puzzle-btns").hidden = mode !== "puzzle";
  $("#btn-hint").hidden = mode !== "bot";
  $("#btn-undo").hidden = mode !== "bot";
  $("#btn-resign").hidden = mode === "watch";
  $("#btn-watchlink").hidden = !(mode === "online" && hostPeerId);
  $("#chat-wrap").hidden = mode !== "online";
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
    if (text) { addChatMsg(text, "them"); Sounds.notify(); }
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
    $("#status-banner").textContent = t("spectateEnded");
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
  if (mode === "watch") { $("#status-banner").textContent = t("friendLeft"); return; }
  if (mode !== "online") return;
  if (!gameOver) {
    gameOver = true;
    gameToken++;
    Clock.halt();
    showEndModal(t("friendLeft"), t("friendLeftSub"), false, false, null, {});
  }
  $("#status-banner").textContent = t("friendLeft");
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
  $("#shop-setup").hidden = true;
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
  // المجموعات
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

function enterPuzzle(p) {
  puzzle = p;
  puzzleStep = 0;
  puzzleFailed = false;
  mode = "puzzle";
  const fenTurn = p.fen.split(" ")[1];
  startGame({ fen: p.fen, color: fenTurn, orientation: fenTurn, skipIntro: true });
  const label = rush ? t("rushProgress", { n: rush.count }) + " — " : "";
  $("#status-banner").textContent = label + t("puzzleYourTurn", { goal: t(PUZZLE_GOALS[p.kind] || "tactic") });
  // في السلسلة: لا تلميح ولا حل
  $("#btn-puzzle-hint").hidden = !!rush;
  $("#btn-puzzle-solution").hidden = !!rush;
  $("#btn-puzzle-next").hidden = !!rush;
}

// ---- سلسلة السفاري ----
function startRush() {
  const queue = [...Puzzles.PACK].sort(() => Math.random() - 0.5);
  rush = { queue, count: 0 };
  enterPuzzle(queue.shift());
}
function rushNext() {
  if (!rush) return;
  rush.count++;
  if (!rush.queue.length) return endRush(true);
  setTimeout(() => { if (rush) enterPuzzle(rush.queue.shift()); }, 900);
}
function endRush(cleared = false) {
  if (!rush) return;
  const score = rush.count;
  const reward = score * 5;
  if (score > Meta.profile.bestRush) { Meta.profile.bestRush = score; Meta.save(); }
  if (reward) { Meta.profile.bananas += reward; Meta.save(); updateChips(); }
  notifyBadges(Meta.autoBadges());
  gameOver = true;
  $("#status-banner").textContent =
    (cleared ? "🏆 " : "") + t("rushEnd", { n: score }) + (reward ? " — " + t("earned", { n: reward }) : "");
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
    $("#status-banner").textContent = t("puzzleWrong");
    setTimeout(() => { if (mode === "puzzle" && !gameOver) $("#status-banner").textContent = t("puzzleYourTurn", { goal: t(PUZZLE_GOALS[puzzle.kind] || "tactic") }); }, 1600);
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
    else $("#status-banner").textContent = t("puzzleYourTurn", { goal: t(PUZZLE_GOALS[puzzle.kind] || "tactic") });
  }, 450);
}

function puzzleSolved() {
  if (rush) {
    $("#status-banner").textContent = t("puzzleCorrect") + " 🔥 " + t("rushProgress", { n: rush.count + 1 });
    Sounds.capture();
    rushNext();
    return;
  }
  gameOver = true;
  $("#status-banner").textContent = t("puzzleSolved");
  Sounds.win();
  launchConfetti();
  if (!puzzleFailed) {
    const earned = Meta.recordPuzzleSolved(puzzle.id, puzzle.reward || 15);
    if (earned) {
      $("#status-banner").textContent = t("puzzleSolved") + " " + t("earned", { n: earned });
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
  $("#status-banner").textContent = t("puzzleSolved");
});
$("#btn-puzzle-next").addEventListener("click", () => {
  if (!puzzle) return goHome();
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

// ============ التحليل ============
$("#btn-analyze").addEventListener("click", async () => {
  $("#end-modal").hidden = true;
  enterAnalysis();
});

function exitAnalysisUI() {
  $("#analysis-nav").hidden = true;
  $("#analysis-box").hidden = true;
  $("#btn-exit-analysis").hidden = true;
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
  renderAnalysisPly();
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
  renderAllPieces(replay);
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
  // تمييز النقلة في القائمة
  $("#move-list").querySelectorAll("li").forEach((li, i) => {
    li.classList.toggle("an-current", i === Math.floor((analysisPly - 1) / 2) && analysisPly > 0);
  });
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
