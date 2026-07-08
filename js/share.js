// ==== مشاركة النتيجة وتصدير المباراة ====
/* global t, LANG */

const Share = (() => {
  // رسم صورة نتيجة جاهزة للمشاركة
  async function resultImage({ title, sub, botSVG, eloText, bananasText }) {
    const W = 700, H = 500;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    // خلفية
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#3d5a45"); grad.addColorStop(1, "#2f4436");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // زخرفة مربعات شفافة
    ctx.fillStyle = "rgba(255,255,255,.04)";
    for (let i = 0; i < 8; i++) for (let j = 0; j < 6; j++)
      if ((i + j) % 2) ctx.fillRect(i * 90, j * 90, 90, 90);

    // شعار
    ctx.textAlign = "center";
    ctx.fillStyle = "#f7f3e8";
    ctx.font = "bold 34px 'Baloo Bhaijaan 2', sans-serif";
    ctx.fillText("♟ " + (LANG === "ar" ? "بيدق" : "Baydaq"), W / 2, 60);

    // صورة البوت
    if (botSVG) {
      try {
        const img = new Image();
        const url = URL.createObjectURL(new Blob([botSVG], { type: "image/svg+xml" }));
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
        ctx.save();
        ctx.beginPath(); ctx.arc(W / 2, 175, 75, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(img, W / 2 - 75, 100, 150, 150);
        ctx.restore();
        ctx.beginPath(); ctx.arc(W / 2, 175, 75, 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = "#ffc93c"; ctx.stroke();
        URL.revokeObjectURL(url);
      } catch { /* بلا صورة */ }
    }

    // النتيجة
    ctx.fillStyle = "#ffc93c";
    ctx.font = "bold 44px 'Baloo Bhaijaan 2', sans-serif";
    ctx.fillText(title, W / 2, 310);
    ctx.fillStyle = "#e9e4d5";
    ctx.font = "600 26px 'Baloo Bhaijaan 2', sans-serif";
    ctx.fillText(sub, W / 2, 352);
    ctx.fillStyle = "#b9c4b4";
    ctx.font = "600 22px 'Baloo Bhaijaan 2', sans-serif";
    if (eloText) ctx.fillText(eloText, W / 2, 400);
    if (bananasText) ctx.fillText(bananasText, W / 2, 434);
    ctx.font = "600 18px sans-serif";
    ctx.fillStyle = "rgba(247,243,232,.55)";
    ctx.fillText("a82793060-ops.github.io/safari-chess", W / 2, 476);

    return new Promise((res) => canvas.toBlob(res, "image/png"));
  }

  async function shareResult(data) {
    const blob = await resultImage(data);
    const file = new File([blob], "safari-chess.png", { type: "image/png" });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: "Baydaq" }); return "shared"; }
      catch { /* المستخدم ألغى */ }
    }
    // تنزيل مباشر كبديل
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "safari-chess-result.png";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    return "downloaded";
  }

  // تصدير المباراة بصيغة PGN القياسية
  function buildPGN(gameObj, whiteName, blackName, resultStr) {
    gameObj.header("Event", "Baydaq", "Site", "a82793060-ops.github.io/safari-chess",
      "Date", new Date().toISOString().slice(0, 10).replaceAll("-", "."),
      "White", whiteName, "Black", blackName, "Result", resultStr);
    return gameObj.pgn();
  }

  async function copyPGN(pgn) {
    try { await navigator.clipboard.writeText(pgn); return true; }
    catch { return false; }
  }

  return { shareResult, buildPGN, copyPGN };
})();
