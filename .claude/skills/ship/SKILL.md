---
name: ship
description: نشر شطرنج السفاري - فحص ورفع نسخة ونشر وتحقق. Deploy Safari Chess after any change - version bump, push, live hash verification.
---

# نشر شطرنج السفاري

خطوات النشر الإلزامية بالترتيب، من جذر المشروع /Users/najlamohomed/safari-chess:

1. **رفع رقم النسخة** (إن تغيّر أي ملف js/css): استبدل `?v=N` بـ `?v=N+1` في `index.html` **و** `sw.js` معا، وحدّث `const VERSION = "vN+1"` في sw.js. عدم تطابقهما = المستخدمون يستلمون ملفات قديمة.
2. **فحص سريع بلا لقطات شاشة**: افتح المعاينة على `http://localhost:4173/?x=<timestamp>` وتحقق نصيا عبر preview_eval: لا أخطاء كونسول، 9 بطاقات في `#bot-grid`، `typeof Chess !== 'undefined'`.
3. **الرفع**: `git add -A && git commit -m "..." && git push` — بيانات الدخول محفوظة في keychain باسم a82793060-ops.
4. **التحقق من الموقع الحي** (GitHub Pages يتأخر 1-3 دقائق): قارن بصمة `shasum -a 256` لكل ملف معدل بين المحلي و `https://a82793060-ops.github.io/safari-chess/<path>` في حلقة until حتى التطابق.
5. رسائل commit بالعربية مع سطر `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

ملاحظات: chess.js 0.13 بواجهة الشرطة السفلية (in_check). كل نص واجهة جديد يضاف في js/i18n.js باللغتين. المتغيرات العليا في game.js متاحة من preview_eval مباشرة.
