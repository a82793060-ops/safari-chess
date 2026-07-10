// ==== عامل الخدمة: عمل اللعبة دون اتصال ====
const VERSION = "v42";
const CACHE = "safari-chess-" + VERSION;

const PRECACHE = [
  ".",
  "index.html",
  "style.css?v=42",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/lib/chess.js?v=42",
  "js/lib/stockfish.asm.js",
  "js/i18n.js?v=42",
  "js/track.js?v=42",
  "js/meta.js?v=42",
  "js/piece-sets.js?v=42",
  "js/pieces.js?v=42",
  "js/bots.js?v=42",
  "js/sounds.js?v=42",
  "js/fx.js?v=42",
  "js/clock.js?v=42",
  "js/engine.js?v=42",
  "js/analysis.js?v=42",
  "js/openings.js?v=42",
  "js/puzzles.js?v=42",
  "js/share.js?v=42",
  "js/net.js?v=42",
  "js/game.js?v=42",
  "js/icons.js?v=42",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // لا نتدخل في اتصالات PeerJS و lichess API
  if (url.hostname.includes("peerjs") || url.hostname.includes("lichess")) return;

  const isLocal = url.origin === location.origin;
  // وثيقة HTML (تنقّل/جذر/‎.html): الشبكة أولا كي يصل التحديث فورا (لا يبقى المستخدم على نسخة قديمة)،
  // مع الرجوع للكاش عند انقطاع الاتصال.
  const isDoc = e.request.mode === "navigate"
    || url.pathname === "/" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  if (isLocal && isDoc) {
    e.respondWith(
      fetch(e.request).then((resp) => {
        const clone = resp.clone();
        if (resp.ok) caches.open(CACHE).then((c) => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match(e.request).then((hit) => hit || caches.match("index.html")))
    );
    return;
  }
  // الأصول المُرقّمة (?v=): من الذاكرة أولا (النسخة الجديدة = رابط جديد = جلب طازج تلقائيّ).
  // الموارد الخارجية (خطوط/أصوات/مكتبات): الشبكة أولا مع تخزين للعمل دون اتصال لاحقا.
  if (isLocal) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((resp) => {
        const clone = resp.clone();
        if (resp.ok) caches.open(CACHE).then((c) => c.put(e.request, clone));
        return resp;
      }))
    );
  } else {
    e.respondWith(
      fetch(e.request).then((resp) => {
        const clone = resp.clone();
        if (resp.ok) caches.open(CACHE).then((c) => c.put(e.request, clone));
        return resp;
      }).catch(() => caches.match(e.request))
    );
  }
});
