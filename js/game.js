// ==== شطرنج السفاري — المنطق الرئيسي ====
/* global Chess, BOTS, botAvatar, botPhrase, pieceSVG, Sounds, Engine, t, applyLang, toggleLang, LANG */

const $ = (sel) => document.querySelector(sel);

// ---- الحالة ----
let game = new Chess();
let currentBot = BOTS[2];
let mode = "bot"; // "bot" أو "online"
let playerColor = "w";
let colorSetting = "random";

// صورة عامة للصديق في طور الأونلاين
const FRIEND_AVATAR = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#f2c94c"/>
  <circle cx="50" cy="42" r="20" fill="#f9e0c0" stroke="#8d6a45" stroke-width="3"/>
  <path d="M30 40 C30 26 40 20 50 20 C60 20 70 26 70 40 L64 38 C60 30 40 30 36 38 Z" fill="#5a4632" stroke="#3e2f20" stroke-width="2.5"/>
  <circle cx="43" cy="42" r="3" fill="#2b2118"/><circle cx="57" cy="42" r="3" fill="#2b2118"/>
  <path d="M44 51 Q50 56 56 51" fill="none" stroke="#8d6a45" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M25 95 C25 72 38 66 50 66 C62 66 75 72 75 95 Z" fill="#4f7fbf" stroke="#35597e" stroke-width="3"/>
</svg>`;
let orientation = "w";        // الجهة السفلية من الرقعة
let selectedSq = null;
let legalTargets = [];
let gameOver = false;
let gameToken = 0;            // لتجاهل ردود المحرك القديمة
let pendingPromotion = null;
let pieceEls = {};            // square -> element
let bubbleTimer = null;

const boardEl = $("#board");
const FILES = "abcdefgh";

// ============ بناء شاشة الإعداد ============
function buildSetup() {
  const grid = $("#bot-grid");
  grid.innerHTML = "";
  BOTS.forEach((bot) => {
    const card = document.createElement("div");
    card.className = "bot-card" + (bot === currentBot ? " selected" : "");
    card.innerHTML = `
      <div class="bot-avatar-svg">${botAvatar(bot)}</div>
      <div class="bot-name">${bot.name[LANG]}</div>
      <div class="bot-elo-badge">${bot.elo}</div>`;
    card.addEventListener("click", () => {
      currentBot = bot;
      grid.querySelectorAll(".bot-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
    });
    grid.appendChild(card);
  });
  $("#cp-white").innerHTML = pieceSVG("k", "w");
  $("#cp-black").innerHTML = pieceSVG("k", "b");
}

document.querySelectorAll(".color-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".color-btn").forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
    colorSetting = btn.dataset.color;
  });
});

// ---- تبويبات الطور: ضد الحيوانات / مع صديق ----
document.querySelectorAll(".mode-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach((b) => b.classList.remove("selected"));
    tab.classList.add("selected");
    const online = tab.dataset.mode === "online";
    $("#bot-setup").hidden = online;
    $("#online-setup").hidden = !online;
    $("#btn-start").hidden = online;
    $("#btn-create-link").hidden = !online || !$("#invite-box").hidden;
  });
});

// ============ بناء الرقعة ============
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

function renderAllPieces() {
  Object.values(pieceEls).forEach((el) => el.remove());
  pieceEls = {};
  game.board().forEach((row, ri) => {
    row.forEach((p, fi) => {
      if (p) placePiece(FILES[fi] + (8 - ri), p.type, p.color);
    });
  });
}

// ---- تظليلات ----
function clearHighlights(...classes) {
  const cls = classes.length ? classes : ["selected", "hint-dot", "hint-ring", "last-move", "in-check", "hint-move"];
  cls.forEach((c) =>
    boardEl.querySelectorAll(".square." + c).forEach((s) => s.classList.remove(c))
  );
}
function sqEl(square) {
  return boardEl.querySelector(`.square[data-square="${square}"]`);
}
function highlightLastMove(from, to) {
  clearHighlights("last-move");
  sqEl(from)?.classList.add("last-move");
  sqEl(to)?.classList.add("last-move");
}
function highlightCheck() {
  clearHighlights("in-check");
  if (game.in_check()) {
    const turn = game.turn();
    game.board().forEach((row, ri) => {
      row.forEach((p, fi) => {
        if (p && p.type === "k" && p.color === turn)
          sqEl(FILES[fi] + (8 - ri))?.classList.add("in-check");
      });
    });
  }
}

// ============ الإدخال: نقر وسحب ============
let dragEl = null, dragStartSq = null, dragMoved = false;

boardEl.addEventListener("pointerdown", (e) => {
  if (gameOver || pendingPromotion || game.turn() !== playerColor) return;
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
    positionEl(el, from); // رجوع القطعة لمكانها
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
  if (mv.flags.includes("p")) {
    pendingPromotion = { from, to };
    showPromoPicker(to);
    return;
  }
  deselect();
  const played = makeMove({ from, to });
  if (mode === "online" && played) Net.send({ t: "move", from: played.from, to: played.to });
  afterPlayerMove();
}

function showPromoPicker(toSq) {
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
      const played = makeMove({ from, to, promotion: p });
      if (mode === "online" && played) Net.send({ t: "move", from, to, promotion: p });
      Sounds.promote();
      afterPlayerMove();
    });
    picker.appendChild(b);
  });
  picker.hidden = false;
}

// النقطة المركزية لتنفيذ أي نقلة (لاعب أو بوت)
function makeMove(moveDesc) {
  const mv = game.move(moveDesc);
  if (!mv) return null;
  animateMove(mv);
  playMoveSound(mv);
  highlightLastMove(mv.from, mv.to);
  highlightCheck();
  updateMoveList();
  updateCaptured();
  updateStatus();
  checkGameEnd(mv);
  return mv;
}

function animateMove(mv) {
  // أسر قطعة (مع مراعاة الأخذ بالتجاوز)
  let capSq = null;
  if (mv.flags.includes("e")) capSq = mv.to[0] + mv.from[1];
  else if (mv.captured) capSq = mv.to;
  if (capSq && pieceEls[capSq]) {
    const capEl = pieceEls[capSq];
    delete pieceEls[capSq];
    capEl.classList.add("captured-anim");
    setTimeout(() => capEl.remove(), 240);
  }
  // تحريك القطعة
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
  // التبييت: تحريك القلعة أيضا
  if (mv.flags.includes("k") || mv.flags.includes("q")) {
    const rank = mv.from[1];
    const [rFrom, rTo] = mv.flags.includes("k")
      ? ["h" + rank, "f" + rank] : ["a" + rank, "d" + rank];
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
  if (game.in_checkmate()) { /* صوت النهاية لاحقا */ }
  if (mv.flags.includes("k") || mv.flags.includes("q")) Sounds.castle();
  else if (mv.captured) Sounds.capture();
  else Sounds.move();
  if (game.in_check() && !game.in_checkmate()) setTimeout(() => Sounds.check(), 120);
}

function afterPlayerMove() {
  if (gameOver || mode !== "bot") return;
  // ردود فعل البوت على نقلات اللاعب
  const last = game.history({ verbose: true }).slice(-1)[0];
  if (last?.captured && Math.random() < 0.3) speak(botPhrase(currentBot, "hurt"));
  else if (game.in_check() && Math.random() < 0.5) speak(botPhrase(currentBot, "hurt"));
  setTimeout(botTurn, 250);
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
    // خطأ متعمد للمستويات الضعيفة: نقلة عشوائية
    const all = game.moves({ verbose: true });
    const mv = all[Math.floor(Math.random() * all.length)];
    moveDesc = { from: mv.from, to: mv.to, promotion: mv.promotion || "q" };
  } else {
    try {
      const uci = await Engine.bestMove(game.fen(), {
        skill: currentBot.skill, depth: currentBot.depth,
      });
      if (uci) moveDesc = { from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] || undefined };
    } catch {
      const all = game.moves({ verbose: true });
      const mv = all[Math.floor(Math.random() * all.length)];
      if (mv) moveDesc = { from: mv.from, to: mv.to, promotion: mv.promotion || "q" };
      $("#status-banner").textContent = t("engineError");
    }
  }

  await minWait;
  if (token !== gameToken || gameOver) return; // اللعبة تغيرت أثناء التفكير
  avatarEl.classList.remove("thinking");
  if (!moveDesc) return;
  const mv = makeMove(moveDesc);
  if (!mv) return;
  if (!gameOver) {
    if (game.in_check() && Math.random() < 0.6) speak(botPhrase(currentBot, "check"));
    else if (mv.captured && Math.random() < 0.35) speak(botPhrase(currentBot, "capture"));
  }
}

// ============ نهاية اللعبة ============
function checkGameEnd() {
  if (!game.game_over()) return;
  gameOver = true;
  const mate = game.in_checkmate();
  const playerWon = mate && game.turn() !== playerColor;
  let title, sub;
  if (mate) {
    title = playerWon ? t("youWin") : t("youLose");
    sub = playerWon ? t("winByCheckmate") : t("loseByCheckmate");
  } else {
    title = t("draw");
    if (game.in_stalemate()) sub = t("drawStalemate");
    else if (game.in_threefold_repetition()) sub = t("drawRepetition");
    else if (game.insufficient_material()) sub = t("drawMaterial");
    else sub = t("draw50");
  }
  setTimeout(() => showEndModal(title, sub, playerWon, mate), 700);
}

function showEndModal(title, sub, playerWon, decisive) {
  const modal = $("#end-modal");
  const avatar = $("#end-avatar");
  avatar.innerHTML = mode === "online" ? FRIEND_AVATAR : botAvatar(currentBot);
  avatar.classList.toggle("sad", !!playerWon);
  $("#end-title").textContent = title;
  const phrase = decisive && mode === "bot"
    ? botPhrase(currentBot, playerWon ? "lose" : "win")
    : "";
  $("#end-sub").textContent = phrase ? `${sub} — "${phrase}"` : sub;
  modal.hidden = false;
  if (playerWon) { Sounds.win(); launchConfetti(); }
  else if (decisive) Sounds.lose();
  else Sounds.drawEnd();
  updateStatus();
}

// ============ واجهة جانبية ============
function updateStatus(thinking = false) {
  const banner = $("#status-banner");
  banner.classList.remove("alert");
  if (gameOver) {
    banner.textContent = game.in_checkmate()
      ? (game.turn() !== playerColor ? t("youWin") : t("youLose"))
      : t("draw");
    return;
  }
  if (thinking || game.turn() !== playerColor) {
    banner.textContent = mode === "online"
      ? t("friendTurn")
      : `${currentBot.name[LANG]} ${t("botThinking")}`;
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
  const capturedBy = { w: [], b: [] }; // ما أسره كل لون
  game.history({ verbose: true }).forEach((m) => {
    if (m.captured) capturedBy[m.color].push(m.captured);
  });
  const order = (a, b) => PIECE_VALUE[a] - PIECE_VALUE[b];
  const val = (arr) => arr.reduce((s, p) => s + PIECE_VALUE[p], 0);
  const diff = val(capturedBy[playerColor]) - val(capturedBy[playerColor === "w" ? "b" : "w"]);
  const humanEl = $("#captured-by-human"), botEl = $("#captured-by-bot");
  const botColor = playerColor === "w" ? "b" : "w";
  humanEl.innerHTML = capturedBy[playerColor].sort(order).map((p) => pieceSVG(p, botColor)).join("");
  botEl.innerHTML = capturedBy[botColor].sort(order).map((p) => pieceSVG(p, playerColor)).join("");
  if (diff > 0) humanEl.innerHTML += `<span class="mat-diff">+${diff}</span>`;
  if (diff < 0) botEl.innerHTML += `<span class="mat-diff">+${-diff}</span>`;
}

// فقاعة كلام البوت
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
      const from = uci.slice(0, 2), to = uci.slice(2, 4);
      sqEl(from)?.classList.add("hint-move");
      sqEl(to)?.classList.add("hint-move");
      setTimeout(() => clearHighlights("hint-move"), 2000);
    }
  } catch { $("#status-banner").textContent = t("engineError"); }
  btn.disabled = false;
});

$("#btn-undo").addEventListener("click", () => {
  if (gameOver || game.turn() !== playerColor || game.history().length < 2) return;
  game.undo(); game.undo();
  deselect();
  clearHighlights();
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
  if (mode === "online") Net.send({ t: "resign" });
  showEndModal(t("youLose"), t("loseByResign"), false, true);
});

$("#btn-newgame").addEventListener("click", goHome);
$("#btn-end-home").addEventListener("click", () => { $("#end-modal").hidden = true; goHome(); });
$("#btn-rematch").addEventListener("click", () => {
  $("#end-modal").hidden = true;
  if (mode === "online") {
    // تبديل الألوان في المباراة الجديدة
    const myNew = playerColor === "w" ? "b" : "w";
    Net.send({ t: "rematch", yourColor: myNew === "w" ? "b" : "w" });
    startGame({ color: myNew });
  } else {
    startGame();
  }
});

function goHome() {
  gameToken++;
  gameOver = true;
  Engine.stop();
  if (mode === "online") {
    Net.cleanup();
    mode = "bot";
    // إزالة معلمة الانضمام من الرابط إن وُجدت
    if (location.search.includes("join=")) history.replaceState(null, "", location.pathname);
    $("#guest-connect").hidden = true;
    $("#invite-box").hidden = true;
    $("#btn-create-link").disabled = false;
    // إعادة شاشة الإعداد لوضعها الافتراضي
    $("#mode-tabs").hidden = false;
    document.querySelector(".color-section").hidden = false;
    document.querySelector('.mode-tab[data-mode="bot"]').click();
  }
  $("#game-screen").hidden = true;
  $("#setup-screen").hidden = false;
  buildSetup();
}

// ============ بدء اللعبة ============
function startGame(opts = {}) {
  gameToken++;
  game = new Chess();
  gameOver = false;
  pendingPromotion = null;
  $("#promo-picker").hidden = true;
  playerColor = opts.color
    || (colorSetting === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorSetting);
  orientation = playerColor;

  $("#setup-screen").hidden = true;
  $("#game-screen").hidden = false;

  if (mode === "online") {
    $("#bot-avatar").innerHTML = FRIEND_AVATAR;
    $("#bot-name").textContent = t("friend");
    $("#bot-elo").textContent = t("connected");
  } else {
    $("#bot-avatar").innerHTML = botAvatar(currentBot);
    $("#bot-name").textContent = currentBot.name[LANG];
    $("#bot-elo").textContent = `${t("level")} ${currentBot.elo}`;
  }
  $("#bot-avatar").classList.remove("thinking");
  $("#human-status").textContent = t(playerColor === "w" ? "playingAs_w" : "playingAs_b");
  $("#bot-bubble").hidden = true;
  // التلميح والتراجع غير متاحين ضد صديق
  $("#btn-hint").hidden = mode === "online";
  $("#btn-undo").hidden = mode === "online";

  buildBoard();
  renderAllPieces();
  deselect();
  updateMoveList(); updateCaptured(); updateStatus();

  if (mode === "bot") {
    Engine.init().catch(() => {});
    setTimeout(() => speak(botPhrase(currentBot, "greet"), 3500), 600);
    if (playerColor === "b") setTimeout(botTurn, 900);
  }
}

$("#btn-start").addEventListener("click", () => { mode = "bot"; startGame(); });

// ============ طور اللعب مع صديق ============
function inviteLink(id) {
  return `${location.origin}${location.pathname}?join=${encodeURIComponent(id)}`;
}

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
    $("#invite-link").value = inviteLink(id);
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

// أحداث الشبكة
Net.on("connected", () => {
  if (mode !== "online" || !$("#game-screen").hidden) return;
  // المضيف: حدد الألوان وأرسلها للضيف ثم ابدأ
  const myColor = colorSetting === "random" ? (Math.random() < 0.5 ? "w" : "b") : colorSetting;
  Net.send({ t: "init", color: myColor === "w" ? "b" : "w" });
  Sounds.notify();
  startGame({ color: myColor });
});

Net.on("data", (d) => {
  if (!d || typeof d !== "object") return;
  if (d.t === "init") {
    mode = "online";
    startGame({ color: d.color === "b" ? "b" : "w" });
  } else if (d.t === "move") {
    if (gameOver || game.turn() === playerColor) return;
    makeMove({ from: String(d.from), to: String(d.to), promotion: d.promotion ? String(d.promotion) : undefined });
  } else if (d.t === "resign") {
    if (gameOver) return;
    gameOver = true;
    showEndModal(t("youWin"), t("friendResigned"), true, true);
  } else if (d.t === "rematch") {
    $("#end-modal").hidden = true;
    startGame({ color: d.yourColor === "b" ? "b" : "w" });
  }
});

Net.on("closed", () => {
  if (mode !== "online") return;
  if (!gameOver) {
    gameOver = true;
    gameToken++;
    showEndModal(t("friendLeft"), t("friendLeftSub"), false, false);
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

// الضيف: انضمام تلقائي عبر معلمة الرابط
(function guestAutoJoin() {
  const id = new URLSearchParams(location.search).get("join");
  if (!id) return;
  mode = "online";
  $("#mode-tabs").hidden = true;
  $("#bot-setup").hidden = true;
  $("#online-setup").hidden = true;
  $("#btn-start").hidden = true;
  document.querySelector(".color-section").hidden = true;
  $("#guest-connect").hidden = false;
  $("#guest-status").textContent = t("connectingToFriend");
  Net.join(id).catch(() => {
    $("#guest-status").textContent = t("connFailed");
  });
})();

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

// ============ أزرار الشريط العلوي ============
$("#btn-lang").addEventListener("click", toggleLang);
$("#btn-sound").addEventListener("click", () => {
  $("#btn-sound").textContent = Sounds.toggle() ? "🔊" : "🔇";
});

document.addEventListener("langchange", () => {
  buildSetup();
  if (!$("#game-screen").hidden) {
    $("#bot-name").textContent = currentBot.name[LANG];
    $("#bot-elo").textContent = `${t("level")} ${currentBot.elo}`;
    $("#human-status").textContent = t(playerColor === "w" ? "playingAs_w" : "playingAs_b");
    updateStatus();
  }
});

// ============ تهيئة ============
applyLang();
$("#btn-sound").textContent = Sounds.enabled ? "🔊" : "🔇";
buildSetup();

// تحميل المحرك مسبقا مع عرض الحالة
(async () => {
  const st = $("#engine-status");
  st.textContent = t("engineLoading");
  try {
    await Engine.init();
    st.textContent = t("engineReady");
    setTimeout(() => { st.textContent = ""; }, 2500);
  } catch {
    st.textContent = t("engineError");
  }
})();
