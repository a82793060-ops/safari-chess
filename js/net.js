// ==== الاتصال بين اللاعبين عبر WebRTC (مكتبة PeerJS) ====
// المضيف = محور الاتصال: لاعب ضيف واحد + أي عدد من المتفرجين

const Net = (() => {
  let peer = null;
  let conn = null;          // اتصال اللاعب الضيف
  let watchers = [];        // اتصالات المتفرجين
  const handlers = {};

  function on(evt, fn) { handlers[evt] = fn; }
  function emit(evt, ...args) { handlers[evt]?.(...args); }

  // قائمة خوادم الوساطة العامة المجانية، مرتّبة حسب الأولوية (لا حساب ولا استضافة):
  //  0 = خادم PeerJS السحابي الرسمي (بلا إعدادات) — سريع حين يعمل.
  //  1 = خادم PeerJS عام بديل — يُستدعى تلقائيا حين يسقط الرسمي.
  // ملاحظة: على المضيف والضيف استخدام الخادم نفسه، لذا يُشفَّر رقمه في الرابط (المعامل b).
  const BROKERS = [
    null,                                                    // 0: خادم PeerJS السحابي الرسمي (سريع حين يعمل)
    { host: "peerjs.92k.de", port: 443, secure: true, path: "/" }, // 1: خادم عام بديل سريع
    // 2: خادمك الخاصّ الموثوق على Render — مهلة أطول لأنّ الطبقة المجانية تستيقظ ببطء بعد الخمول.
    { host: "baydaq-peerserver.onrender.com", port: 443, secure: true, path: "/", timeout: 60000 },
  ];
  // أخطاء تُعدّ فادحة فتستدعي التحوّل للخادم التالي.
  const FATAL = new Set(["network", "server-error", "socket-error", "socket-closed", "unavailable-id"]);
  // مهلة فتح الاتصال الافتراضية: إن لم يُفتح خلالها (خادم معلَّق) نعدّه ساقطًا ونحوّل للتالي.
  const OPEN_TIMEOUT = 8000;
  const brokerTimeout = (bi) => (BROKERS[bi] && BROKERS[bi].timeout) || OPEN_TIMEOUT;

  function makePeer(id, bi) {
    const opts = BROKERS[bi];
    return opts ? new Peer(id, opts) : new Peer(id);
  }
  function attachHostConn(p) {
    p.on("connection", (c) => {
      if (c.metadata && c.metadata.role === "watch") { bindWatcher(c); return; }
      if (conn) { c.close(); return; } // مقعد لاعب واحد
      bindPlayer(c);
      if (c.open) emit("connected");
      else c.on("open", () => emit("connected"));
    });
  }

  function bindPlayer(c) {
    conn = c;
    c.on("data", (d) => emit("data", d));
    c.on("close", () => { conn = null; emit("closed"); });
    c.on("error", (e) => emit("error", e));
  }
  function bindWatcher(c) {
    watchers.push(c);
    c.on("close", () => { watchers = watchers.filter((w) => w !== c); emit("watchers", watchers.length); });
    const ready = () => emit("watcherJoined", c);
    if (c.open) ready(); else c.on("open", ready);
  }

  // المضيف: ينشئ معرّفا وينتظر لاعبا ومتفرجين.
  // يعيد { id, broker } — رقم الخادم الذي نجح الاتصال عليه (لتضمينه في الرابط).
  function createHost() {
    cleanup();
    const hostId = "safari-" + Math.random().toString(36).slice(2, 10);
    return hostOnBroker(hostId, 0);
  }
  function hostOnBroker(hostId, bi) {
    return new Promise((resolve, reject) => {
      peer = makePeer(hostId, bi);
      attachHostConn(peer);
      let done = false, opened = false;
      // التحوّل للخادم التالي (أو الفشل النهائي) عند سقوط الحالي أو تعليقه
      const advance = (e) => {
        if (done) return; done = true; clearTimeout(timer);
        try { peer.destroy(); } catch { /* تجاهل */ }
        if (bi + 1 < BROKERS.length) resolve(hostOnBroker(hostId, bi + 1));
        else { emit("error", e); reject(e); }
      };
      const timer = setTimeout(() => advance({ type: "timeout" }), brokerTimeout(bi));
      peer.on("open", (id) => { if (done) return; done = true; opened = true; clearTimeout(timer); resolve({ id, broker: bi }); });
      peer.on("error", (e) => {
        if (opened) { emit("error", e); return; }             // خطأ بعد نجاح الاتصال: مرّره فقط
        if (!done && FATAL.has(e.type)) advance(e);            // الخادم ساقط: جرّب التالي
      });
    });
  }

  // الضيف أو المتفرج: يتصل بمعرّف المضيف عبر الخادم نفسه (bi من الرابط)
  function join(hostId, role = "play", bi = 0) {
    cleanup();
    return new Promise((resolve, reject) => {
      peer = makePeer(undefined, bi);
      let done = false;
      const fail = (e) => { if (done) return; done = true; clearTimeout(timer); emit("error", e); reject(e); };
      const timer = setTimeout(() => fail({ type: "timeout" }), brokerTimeout(bi));
      peer.on("error", (e) => fail(e));
      peer.on("open", () => {
        const c = peer.connect(hostId, { reliable: true, metadata: { role } });
        bindPlayer(c);
        c.on("open", () => { if (done) return; done = true; clearTimeout(timer); emit("connected"); resolve(); });
      });
    });
  }

  function send(obj) { if (conn && conn.open) conn.send(obj); }
  // بث للمتفرجين (يستخدمه المضيف)
  function broadcast(obj) {
    watchers.forEach((w) => { if (w.open) try { w.send(obj); } catch { /* تجاهل */ } });
  }
  function sendTo(c, obj) { if (c && c.open) try { c.send(obj); } catch { /* تجاهل */ } }

  function cleanup() {
    try { conn?.close(); } catch { /* تجاهل */ }
    watchers.forEach((w) => { try { w.close(); } catch { /* تجاهل */ } });
    try { peer?.destroy(); } catch { /* تجاهل */ }
    conn = null; peer = null; watchers = [];
  }

  return {
    createHost, join, send, broadcast, sendTo, on, cleanup,
    get connected() { return !!(conn && conn.open); },
    get watcherCount() { return watchers.length; },
  };
})();
