// ==== الاتصال المباشر بين اللاعبين عبر WebRTC — بلا خادم وساطة ====
// المضيف والضيف يتبادلان رمزين نصّيين (عرض/رد) يدويا، ثم تنفتح قناة بيانات مباشرة.
// لا يمرّ أي شيء بخادم؛ فقط خوادم STUN عامة مجانية لعبور الشبكات (NAT).

const Net = (() => {
  let pc = null;            // RTCPeerConnection
  let chan = null;          // قناة البيانات
  const handlers = {};

  const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }];

  function on(evt, fn) { handlers[evt] = fn; }
  function emit(evt, ...args) { handlers[evt]?.(...args); }

  // ---- ترميز/فكّ الأوصاف إلى رمز نصّي مضغوط ----
  function b64urlEncode(bytes) {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(str);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }
  async function encode(desc) {
    const json = JSON.stringify({ t: desc.type, s: desc.sdp });
    try {
      if (window.CompressionStream) {
        const stream = new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"));
        const buf = new Uint8Array(await new Response(stream).arrayBuffer());
        return "g" + b64urlEncode(buf);
      }
    } catch { /* بلا ضغط */ }
    return "j" + b64urlEncode(new TextEncoder().encode(json));
  }
  async function decode(code) {
    code = (code || "").trim();
    const tag = code[0];
    const bytes = b64urlDecode(code.slice(1));
    let json;
    if (tag === "g" && window.DecompressionStream) {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      json = await new Response(stream).text();
    } else {
      json = new TextDecoder().decode(bytes);
    }
    const o = JSON.parse(json);
    return { type: o.t, sdp: o.s };
  }

  // انتظار اكتمال تجميع مرشّحات ICE ليحوي الرمز كل العناوين (بلا trickle)
  function waitIce() {
    return new Promise((resolve) => {
      if (pc.iceGatheringState === "complete") return resolve();
      const check = () => {
        if (pc.iceGatheringState === "complete") {
          pc.removeEventListener("icegatheringstatechange", check);
          resolve();
        }
      };
      pc.addEventListener("icegatheringstatechange", check);
      setTimeout(resolve, 2800); // مهلة أمان
    });
  }

  function newPeer() {
    pc = new RTCPeerConnection({ iceServers: ICE });
    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) emit("closed");
    };
  }
  function bindChannel(c) {
    chan = c;
    c.onopen = () => emit("connected");
    c.onmessage = (e) => { try { emit("data", JSON.parse(e.data)); } catch { /* تجاهل */ } };
    c.onclose = () => emit("closed");
    c.onerror = () => emit("error", { type: "channel" });
  }

  // المضيف: ينشئ رمز الدعوة (عرض)
  async function hostOffer() {
    cleanup();
    newPeer();
    bindChannel(pc.createDataChannel("game", { ordered: true }));
    await pc.setLocalDescription(await pc.createOffer());
    await waitIce();
    return encode(pc.localDescription);
  }
  // المضيف: يستقبل رمز الرد فتكتمل الوصلة
  async function hostAccept(answerCode) {
    if (!pc) throw new Error("no-offer");
    await pc.setRemoteDescription(await decode(answerCode));
  }
  // الضيف: يستقبل رمز الدعوة ويعيد رمز الرد
  async function guestAnswer(offerCode) {
    cleanup();
    newPeer();
    pc.ondatachannel = (e) => bindChannel(e.channel);
    await pc.setRemoteDescription(await decode(offerCode));
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce();
    return encode(pc.localDescription);
  }

  function send(obj) { if (chan && chan.readyState === "open") chan.send(JSON.stringify(obj)); }

  function cleanup() {
    try { chan?.close(); } catch { /* تجاهل */ }
    try { pc?.close(); } catch { /* تجاهل */ }
    chan = null; pc = null;
  }

  return {
    hostOffer, hostAccept, guestAnswer, send, cleanup, on,
    // توافق مع الشيفرة القائمة (وضع المتفرّجين غير مدعوم في الاتصال المباشر)
    broadcast() {}, sendTo() {},
    get connected() { return !!(chan && chan.readyState === "open"); },
    get watcherCount() { return 0; },
  };
})();
