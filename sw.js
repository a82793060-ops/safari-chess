// ==== عامل الخدمة: عمل اللعبة دون اتصال ====
const VERSION = "v43";
const CACHE = "safari-chess-" + VERSION;

const PRECACHE = [
  ".",
  "index.html",
  "style.css?v=43",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "js/lib/chess.js?v=43",
  "js/lib/stockfish.asm.js",
  "js/i18n.js?v=43",
  "js/track.js?v=43",
  "js/meta.js?v=43",
  "js/piece-sets.js?v=43",
  "js/pieces.js?v=43",
  "js/bots.js?v=43",
  "js/sounds.js?v=43",
  "js/fx.js?v=43",
  "js/clock.js?v=43",
  "js/engine.js?v=43",
  "js/analysis.js?v=43",
  "js/openings.js?v=43",
  "js/puzzles.js?v=43",
  "js/share.js?v=43",
  "js/net.js?v=43",
  "js/game.js?v=43",
  "js/icons.js?v=43",
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
