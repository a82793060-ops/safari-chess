# Safari Chess — شطرنج السفاري

لعبة شطرنج كرتونية احترافية (v7): بوتات حيوانات (400-2000) برحلة تقدم ونجوم وELO،
لعب عبر رابط P2P مع دردشة ومتفرجين وساعة، أطوار متغيرة (ملك التلة/ثلاث كشات)،
ألغاز + سلسلة سفاري + لغز lichess اليومي، تحليل بالمحرك مع دقة%، متجر وأوسمة، PWA.
HTML/CSS/JS خالص بلا خطوة بناء. chess.js 0.13 (واجهة الشرطة السفلية) + Stockfish asm.js في Worker + PeerJS.

- الموقع الحي: https://a82793060-ops.github.io/safari-chess/ — مستودع a82793060-ops/safari-chess
- النشر: مهارة `ship` (رفع ?v= في index.html و sw.js معا ← push ← تحقق بالبصمات). بيانات git في keychain.
- التشغيل محليا: `python3 -m http.server 4173` من جذر المشروع.
- تحذيرات مجربة: متصفح المعاينة يخزن JS بشراسة — ارفع ?v= قبل أي اختبار لتعديل؛
  نافذة المعاينة تنكمش أحيانا لعرض 7px — أصلحها بـ preview_resize؛ فضّل الفحص النصي على لقطات الشاشة.

## Orchestration Workflow
You (Fable 5) are the orchestrator. Plan, decompose, synthesize.
- Reasoning-heavy phases → deep-reasoner (Opus): architecture, complex debugging, algorithms.
- Mechanical work → fast-worker (Sonnet): boilerplate, tests, formatting, simple edits.
- Codex is a senior engineer on par with deep-reasoner, looking from a different
  perspective. Treat as a peer. Invoke non-interactively via Bash:
  `/Applications/Codex.app/Contents/Resources/codex exec --sandbox read-only "<task>"`
  (run from the project directory; the user is signed in with free credits — use sparingly).
- High-stakes decisions: task Opus and Codex on the same problem in parallel.
  Synthesize the best of both worlds without showing either the other's answer.
  Keep your own context lean: agents return summaries, not raw dumps.
- In-session equivalents: Agent(subagent_type: general-purpose, model: opus|sonnet)
  behaves identically to the named agents above if they are not yet registered.

## قواعد المشروع
- الواجهة ثنائية اللغة (عربي/إنجليزي) — كل نص جديد يضاف في js/i18n.js باللغتين.
- المحتوى العربي بالفصحى، والمصطلحات التقنية الإنجليزية تُعزل في أسطر مستقلة.
- الأصوات عبر Web Audio أو ملفات lichess المفتوحة — لا ملفات صوتية ضمن المستودع.
- كل الرسومات SVG مضمنة في الكود — لا صور نقطية إلا أيقونات PWA.
- بعد أي تعديل على ملفات js/css: ارفع رقم `?v=` في index.html و sw.js معا.
