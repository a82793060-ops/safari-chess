# بيدق — منصّة تعليم الشطرنج (Baydaq)

**الرؤية:** منصّة ويب مجانية ثنائية اللغة (عربي/إنجليزي) لتعليم الشطرنج من الصفر حتى الاحتراف —
رحلة متدرّجة: أساسيات → تكتيكات → افتتاحيات → نهايات → استراتيجية، تُفتح المراحل باجتياز الاختبارات.
الأسلوب مبسّط جميل احترافي بلا حشو. (تحوّل من لعبة أطفال «شطرنج السفاري» — 2026-07-08؛ المستودع
والمجلد ما زالا باسم safari-chess.)

**التحوّل بالمراحل:** ✅ م١ الهوية وإزالة الحيوانات (v26) + مستويات مصمّمة للمتعلّمين (v27).
⏳ م٢: تحويل مركز التعلّم إلى **مسار مُبوّب ببوّابات اختبار**. ⏳ م٣: تأليف دروس غنيّة (بمساعدة AI).

**الموجود (لبنات تعليمية جاهزة):** لعب تدريبي ضد Stockfish بتسعة مستويات **مصمّمة للمتعلّمين**
(المستوى ١ «عشوائي» يهزمه المبتدئ، تدرّج لطيف بأسماء وصفية لا أرقام ELO)، مدرسة حركة القطع
(SCHOOL_LESSONS، 9 دروس/18 مرحلة)، ألغاز lichess حية بالمواضيع (/api/puzzle/next، 9×3)، مدرّب
افتتاحيات (OPENINGS، 16 خطًّا)، مدرّب نهايات، مدرّب إحداثيات، تحليل بمنحنى تقييم ودقّة%، نظام نقاط
ورتب (أيقونات شطرنج) وأوسمة وغرفة كؤوس، لعب P2P مع صديق، PWA يعمل دون اتصال.
HTML/CSS/JS خالص بلا خطوة بناء. chess.js 0.13 (واجهة الشرطة السفلية) + Stockfish asm.js في Worker + PeerJS.

**قواعد الهوية:** لا حيوانات/سفاري في الواجهة (كُنست v26)؛ المفاتيح الداخلية (localStorage `safari-*`،
مُعرّفات cosmetic/bot) تبقى لتوافق الحفظ — غيّر النصوص لا المُعرّفات. الرتب أيقونات شطرنج، النقاط لا أناناس.

- الموقع الحي: https://a82793060-ops.github.io/safari-chess/ — مستودع a82793060-ops/safari-chess
- النشر: مهارة `ship` (رفع ?v= في index.html و sw.js معا ← push ← تحقق بالبصمات). بيانات git في keychain.
- التشغيل محليا: `python3 -m http.server 4173` من جذر المشروع.
- تحذيرات مجربة: متصفح المعاينة يخزن JS بشراسة — ارفع ?v= قبل أي اختبار لتعديل؛
  نافذة المعاينة تنكمش أحيانا لعرض 7px — أصلحها بـ preview_resize؛ فضّل الفحص النصي على لقطات الشاشة؛
  خاصية hidden في JS لا تعمل على عناصر SVG — استخدم setAttribute/removeAttribute("hidden")؛
  iOS يتجاهل user-scalable=no — منع التكبير عبر أحداث gesture مع صمام visualViewport.scale (game.js)؛
  شريط العنوان العائم يغطي المحتوى في كل متصفحات الجوال — مسافة علوية بشرط display-mode: browser.

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
- معادلة التقشف (standing rule): delegation costs a cold start and bills the same
  budget; Fable's warm context is cached. Fable does small/medium tasks itself;
  delegate only large mechanical batches, context-polluting sweeps/logs, or when
  a different perspective is needed.

## قواعد المشروع
- الواجهة ثنائية اللغة (عربي/إنجليزي) — كل نص جديد يضاف في js/i18n.js باللغتين.
- المحتوى العربي بالفصحى، والمصطلحات التقنية الإنجليزية تُعزل في أسطر مستقلة.
- الأصوات عبر Web Audio أو ملفات lichess المفتوحة — لا ملفات صوتية ضمن المستودع.
- كل الرسومات SVG مضمنة في الكود — لا صور نقطية إلا أيقونات PWA.
- بعد أي تعديل على ملفات js/css: ارفع رقم `?v=` في index.html و sw.js معا.
