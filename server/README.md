# خادم وساطة بيدق (Baydaq PeerServer)

خادم إشارات (signaling) صغير لخاصية «اللعب مع صديق». لا تمرّ به بيانات اللعبة —
فقط يتبادل المتصفّحان عنوانَيهما مرّة واحدة، ثم يتّصلان مباشرة (P2P).

## النشر على Render (مجاني)

1. ادفع المستودع إلى GitHub (يتضمّن `server/` و `render.yaml`).
2. https://dashboard.render.com ← سجّل الدخول (بحساب GitHub).
3. **New → Blueprint** ← اربط مستودع `safari-chess`.
4. سيقرأ Render ملف `render.yaml` ويعرض خدمة `baydaq-peerserver` (الطبقة المجانية) ← **Apply**.
5. انتظر ~٢–٣ دقائق. الرابط الناتج: `https://baydaq-peerserver.onrender.com`.
6. تحقّق: افتح الرابط في المتصفّح ← يجب أن يظهر `Baydaq PeerServer OK`.

> إن أعطى Render اسماً مختلفاً للخدمة، حدّث `BROKERS[1].host` في `js/net.js` بالرابط الجديد.

## تشغيل محلي

```bash
cd server && npm install && PORT=9010 npm start
```
