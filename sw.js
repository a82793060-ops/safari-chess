// ==== عامل الخدمة: عمل اللعبة دون اتصال ====
const VERSION = "v13";
const CACHE = "safari-chess-" + VERSION;

const PRECACHE = [
  ".",
  "index.html",
  "style.css?v=13",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/lib/chess.js?v=13",
  "js/lib/stockfish.asm.js",
  "js/i18n.js?v=13",
  "js/meta.js?v=13",
  "js/pieces.js?v=13",
  "js/bots.js?v=13",
  "js/sounds.js?v=13",
  "js/fx.js?v=13",
  "js/clock.js?v=13",
  "js/engine.js?v=13",
  "js/analysis.js?v=13",
  "js/openings.js?v=13",
  "js/puzzles.js?v=13",
  "js/share.js?v=13",
  "js/net.js?v=13",
  "js/game.js?v=13",
  "js/icons.js?v=13",
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
