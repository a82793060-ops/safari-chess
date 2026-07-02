// ==== الاتصال بين اللاعبين عبر WebRTC (مكتبة PeerJS) ====
// المضيف ينشئ معرّفا ويشاركه في الرابط، والضيف يتصل به مباشرة

const Net = (() => {
  let peer = null;
  let conn = null;
  const handlers = {};

  function on(evt, fn) { handlers[evt] = fn; }
  function emit(evt, ...args) { handlers[evt]?.(...args); }

  function bind(c) {
    conn = c;
    c.on("data", (d) => emit("data", d));
    c.on("close", () => { conn = null; emit("closed"); });
    c.on("error", (e) => emit("error", e));
  }

  // المضيف: ينشئ معرّفا وينتظر اتصال الضيف
  function createHost() {
    cleanup();
    return new Promise((resolve, reject) => {
      peer = new Peer("safari-" + Math.random().toString(36).slice(2, 10));
      peer.on("open", (id) => resolve(id));
      peer.on("error", (e) => { emit("error", e); reject(e); });
      peer.on("connection", (c) => {
        if (conn) { c.close(); return; } // مقعد واحد فقط للضيف
        bind(c);
        if (c.open) emit("connected");
        else c.on("open", () => emit("connected"));
      });
    });
  }

  // الضيف: يتصل بمعرّف المضيف
  function join(hostId) {
    cleanup();
    return new Promise((resolve, reject) => {
      peer = new Peer();
      peer.on("error", (e) => { emit("error", e); reject(e); });
      peer.on("open", () => {
        const c = peer.connect(hostId, { reliable: true });
        bind(c);
        c.on("open", () => { emit("connected"); resolve(); });
      });
    });
  }

  function send(obj) { if (conn && conn.open) conn.send(obj); }

  function cleanup() {
    try { conn?.close(); } catch { /* تجاهل */ }
    try { peer?.destroy(); } catch { /* تجاهل */ }
    conn = null; peer = null;
  }

  return {
    createHost, join, send, on, cleanup,
    get connected() { return !!(conn && conn.open); },
  };
})();
