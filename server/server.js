// خادم وساطة PeerJS لخاصية «اللعب مع صديق» في بيدق.
// دوره الوحيد: أن يتبادل المتصفّحان عنوانَيهما مرّة واحدة في بداية الاتصال.
// كل حركات الشطرنج والدردشة تمرّ مباشرة بين الجهازين (P2P) ولا تمرّ بهذا الخادم.
const express = require("express");
const { ExpressPeerServer } = require("peer");

const PORT = process.env.PORT || 9000;
const app = express();

// فحص الصحّة (health check) لمنصّة الاستضافة.
app.get("/", (_req, res) => res.type("text").send("Baydaq PeerServer OK"));

const server = app.listen(PORT, () =>
  console.log("Baydaq PeerServer listening on :" + PORT + " (path /peerjs)"));

// path: "/" مع المفتاح الافتراضي "peerjs" ⇒ نقطة النهاية /peerjs/id — يطابق نمط الخوادم
// العامة العاملة (client path "/")، بلا مسار مزدوج. الجذر "/" يبقى لفحص صحّة Render.
const peerServer = ExpressPeerServer(server, {
  path: "/",
  proxied: true,       // خلف موجّه عكسي (Render / Koyeb)
  allow_discovery: false,
});
app.use("/", peerServer);

peerServer.on("connection", (c) => console.log("peer connected:", c.getId()));
peerServer.on("disconnect", (c) => console.log("peer disconnected:", c.getId()));
