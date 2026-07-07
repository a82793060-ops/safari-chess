// ==== عامل الخدمة: عمل اللعبة دون اتصال ====
const VERSION = "v18";
const CACHE = "safari-chess-" + VERSION;

const PRECACHE = [
  ".",
  "index.html",
  "style.css?v=18",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/lib/chess.js?v=18",
  "js/lib/stockfish.asm.js",
  "js/i18n.js?v=18",
  "js/meta.js?v=18",
  "js/pieces.js?v=18",
  "js/bots.js?v=18",
  "js/sounds.js?v=18",
  "js/fx.js?v=18",
  "js/clock.js?v=18",
  "js/engine.js?v=18",
  "js/analysis.js?v=18",
  "js/openings.js?v=18",
  "js/puzzles.js?v=18",
  "js/share.js?v=18",
  "js/net.js?v=18",
  "js/game.js?v=18",
  "js/icons.js?v=18",
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

  // ملفات اللعبة: من الذاكرة أولا ثم الشبكة
  // الموارد الخارجية (خطوط/أصوات/مكتبات): الشبكة أولا مع تخزين للعمل دون اتصال لاحقا
  const isLocal = url.origin === location.origin;
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
