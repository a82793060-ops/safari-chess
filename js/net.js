// ==== الاتصال بين اللاعبين عبر WebRTC (مكتبة PeerJS) ====
// المضيف = محور الاتصال: لاعب ضيف واحد + أي عدد من المتفرجين

const Net = (() => {
  let peer = null;
  let conn = null;          // اتصال اللاعب الضيف
  let watchers = [];        // اتصالات المتفرجين
  const handlers = {};

  function on(evt, fn) { handlers[evt] = fn; }
  function emit(evt, ...args) { handlers[evt]?.(...args); }

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

  // المضيف: ينشئ معرّفا وينتظر لاعبا ومتفرجين
  function createHost() {
    cleanup();
    return new Promise((resolve, reject) => {
      peer = new Peer("safari-" + Math.random().toString(36).slice(2, 10));
      peer.on("open", (id) => resolve(id));
      peer.on("error", (e) => { emit("error", e); reject(e); });
      peer.on("connection", (c) => {
        if (c.metadata && c.metadata.role === "watch") { bindWatcher(c); return; }
        if (conn) { c.close(); return; } // مقعد لاعب واحد
        bindPlayer(c);
        if (c.open) emit("connected");
        else c.on("open", () => emit("connected"));
      });
    });
  }

  // الضيف أو المتفرج: يتصل بمعرّف المضيف
  function join(hostId, role = "play") {
    cleanup();
    return new Promise((resolve, reject) => {
      peer = new Peer();
      peer.on("error", (e) => { emit("error", e); reject(e); });
      peer.on("open", () => {
        const c = peer.connect(hostId, { reliable: true, metadata: { role } });
        bindPlayer(c);
        c.on("open", () => { emit("connected"); resolve(); });
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
