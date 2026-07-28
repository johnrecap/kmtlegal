# النتائج المرتبة وخطة الإصلاح

**لقطة:** 2026-07-28 — commit `9c6821c2`  
**قاعدة الشدة:** P0 اختراق/فقد بيانات جارٍ، P1 مانع إصدار أو خطر وصول/بيانات مرتفع، P2 خلل مهم أو دين حوكمة، P3 تحسين منخفض المخاطر.

## الخلاصة التنفيذية

- لا يوجد P0 مثبت من الأدلة المحلية.
- يوجد P1 واحد: لا يمكن اعتماد الإصدار أو الادعاء أن العمليات الأساسية تعمل end-to-end لأن build/DB/live gates لم تمر.
- بنية الصلاحيات أقوى من مجرد إخفاء الأزرار: route policy + API permission + object scope.
- أكبر قرار حوكمة مطلوب هو مساواة Secretary وOffice Admin في كل الصلاحيات الافتراضية.
- `/product-system` showcase ببيانات mock لكنه متاح للعامة في الكود والتشغيل المحلي.
- 2FA مؤجل عمدًا، وليس endpoint مكسورًا؛ يظل residual security risk للموظفين.
- أربع وحدات فقط ظهرت ككود غير مستدعى بدليل قوي؛ لم يُصنف أي API كغير مستخدم بلا دليل خارجي.

## P0 — حرج

**لا نتائج مثبتة.**

لم يظهر تجاوز صلاحيات، تسريب بيانات حقيقية أو mutation على الإنتاج. هذا لا يساوي شهادة أمان؛ اختبارات DB/staging والإنتاج لم تُنفذ.

## P1 — قبل أي إصدار

### F-01 — بوابة الإصدار والتشغيل الفعلي غير مكتملة

**الأثر:** كل المستخدمين وكل العمليات DB-backed.  
**الدليل:**

- `npm run qa:local` مر حتى 424 اختبارًا، ثم فشل `next build` لأن `DATABASE_URL` غير موجود.
- `npm run qa:db` توقف قبل التنفيذ.
- 13 اختبار admin/role/dashboard و2 live-admin tests تم تخطيها.
- لا production read-only evidence ولا حسابات staging.

**الخطر:** يمكن أن تكون migrations، seed، القيود، الاستعلامات، الأذونات الفعلية، storage، webhooks أو dashboard counts مختلفة عن السلوك الساكن.

**الإصلاح المطلوب:**

1. تجهيز PostgreSQL staging منفصل وبيانات وهمية لكل الأدوار السبعة.
2. تشغيل migrations ثم seed ثم `qa:db`.
3. تشغيل role/action matrix: allow + deny + object scope لكل عملية حساسة.
4. تشغيل payment sandbox وstorage tests.
5. تشغيل `qa:release` ببيئة build مماثلة للإنتاج.
6. تشغيل live read-only smoke على `kmtlegal.org` بحسابات اختبار غير حقيقية.

**القبول:** build + DB E2E + live smoke تمر؛ كل صف runtime في CSV يتحول من `RUNTIME_BLOCKED` إلى نتيجة فعلية مع request/data/audit evidence.

## P2 — مهم

### F-02 — Secretary وOffice Admin متطابقان افتراضيًا

**الدليل:** كلاهما 23 permission و14 admin destinations، والقائمتان متطابقتان حرفيًا في `policy-data.json`.

**الخطر:** أسماء الأدوار توحي بفصل مسؤوليات غير موجود؛ السكرتير يستطيع إدارة finance، archive clients، إدارة documents/tasks/conversations مثل مدير المكتب.

**القرار المطلوب:** إما توثيق أن التساوي مقصود، أو إنشاء مصفوفة business-approved تفصل العمليات الحساسة. يجب فحص DB الحالية لأن permissions runtime ديناميكية.

**القبول:** owner لكل permission، مبرر scope، seed محدث، migration/role update آمن، allow/deny E2E.

### F-03 — showcase داخلي متاح للعامة

**الدليل:** `/product-system` وأربع صفحات فرعية ليست ضمن protected paths؛ smoke أعاد `200` للزائر؛ البيانات mock ولا توجد backend calls.

**الخطر:** التباس مع المنتج الحقيقي، كشف UI داخلي وخيارات إعدادات وهمية، واتساع سطح الإنتاج.

**الإصلاح:** production gate مماثل لـStitch، أو نقله لبيئة review، أو حذف الصفحات من build الإنتاجي. لا يكفي حذفها من navigation.

**القبول:** anonymous production request يعيد 404 أو redirect مع بقاء visual tests في بيئة مخصصة.

### F-04 — 2FA للموظفين معطل عمدًا

**الدليل:** صفحة `/login/2fa` تستخدم `notFound()`، وثلاثة auth APIs وadmin reset يعيدون `503 FEATURE_DISABLED`.

**الخطر:** سرقة كلمة مرور موظف تمنح وصولًا بعامل واحد، خصوصًا Super Admin.

**الإصلاح:** تنفيذ TOTP أولًا، recovery codes، enforced enrollment للأدوار الحساسة، session elevation وaudit؛ أو اعتماد المخاطر رسميًا مع compensating controls.

**القبول:** enroll/challenge/recovery/reset allow/deny tests وrate limiting وsecret storage آمن.

### F-05 — تجربة العميل غير داخلة في نظام رسائل متعدد اللغات

**الدليل:** تنقل وshell العميل يحتويان نصوصًا عربية hardcoded، بينما admin يستخدم `ui-copy.ts` والعام يستخدم content catalogs AR/EN.

**الأثر:** صعوبة تقديم EN، تفاوت error/empty/accessibility copy، وزيادة النصوص غير القابلة للمراجعة.

**الإصلاح:** نقل كل protected client copy إلى catalog/token مشترك مع Arabic default وEnglish fallback، دون تغيير RTL.

**القبول:** zero hardcoded user-facing strings في protected client surfaces، locale tests وscreen reader labels.

### F-06 — اختبار الروابط المرئي غير موثوق على cold dev server

**الدليل:** 80/81 نجح؛ اختبار الروابط الوحيد تجاوز 60 ثانية رغم أن آخر network response المسجل كان `200`.

**الخطر:** CI failure غير دال أو إخفاء رابط حقيقي داخل timeout جماعي.

**الإصلاح:** تقسيم الروابط إلى shards/tests، warm routes قبل العد، أو استخدام build server في release lane مع timeout مبرر.

**القبول:** نفس قائمة الروابط تمر بثبات في 3 تشغيلات متتالية وتعرض URL الفاشل منفردًا.

### F-07 — مصدر حالة الخطط والتدقيقات السابقة به drift

**الدليل:** UI/UX وBackend audits بتاريخ 2026-07-03 أقدم من المزايا الحالية؛ status يذكر 38 خطة مع وجود PLAN-38، ويقر بوجود 11 خطة partial.

**الخطر:** قرارات الإصدار تبنى على عد/حالة قديمة.

**الإصلاح:** توليد عدد الخطط من directories/tasks، تحديث implementation status بعد قبول هذا التدقيق، وإضافة تاريخ/commit لكل audit.

**القبول:** status counts قابلة لإعادة التوليد وتطابق specs/tasks دون تعارض.

## P3 — تحسينات وتنظيف

### F-08 — أربع وحدات غير مستدعاة

- `portal/portal-navigation.ts`
- `consultation-assistant-panel.tsx`
- `readiness-routing.ts`
- `server/auth/index.ts`

**الإصلاح:** حذف focused change بعد مراجعة تاريخية، ثم typecheck/unit/build. لا تحذف `/api/public/consultations/assistant` لأنه مستخدم من booking chat.

### F-09 — aliases قديمة تزيد مساحة الصيانة

`/portal/*` redirects صحيحة ومقصودة، لكن وجود navigation قديم معها سبب بالفعل كودًا ميتًا.

**الإصلاح:** الاحتفاظ بالredirects مدة توافق محددة، إضافة telemetry للزيارات، ثم قرار deprecation قائم على الدليل.

### F-10 — عد عمليات API يحتاج scanner صحيحًا

الـscanner الذي يلتقط `export async function` فقط يفوّت `GET` المتزامنة في services/lawyers ويعطي 116 بدل 118.

**الإصلاح:** contract inventory script واحد يلتقط synchronous وasync methods ويخرج artifact قابل للمقارنة.

### F-11 — `next lint` deprecated

الـlint يمر، لكن Next.js يحذر من إزالة `next lint` في Next 16.

**الإصلاح:** الانتقال إلى ESLint CLI قبل ترقية Next، مع الحفاظ على نفس القواعد.

## نقاط قوة يجب الحفاظ عليها

- سياسة مركزية للـ19 admin routes.
- الصلاحيات runtime تأتي من DB role لا من client state.
- client ownership وlawyer assignment مطبقان في الخدمات.
- roles endpoint يتطلب exact Super Admin وصلاحيتين معًا.
- optimistic concurrency وtransactions وaudit في العمليات الحساسة.
- dashboard يحذف غير المصرح، يحد queues، ويعزل loader failures.
- رسائل الأخطاء آمنة وتحتوي `requestId`.
- security headers، cross-origin rejection وsecret scan ناجحة.
- 48/48 public smoke و424/424 unit tests ناجحة.

## خطة الإصلاح المرحلية

### المرحلة A — بوابة الإثبات، بلا تغيير منتج

1. تجهيز staging وfixtures وهمية.
2. تشغيل build/DB/release/live suites.
3. تعبئة `actual/evidence/verdict` runtime في المصفوفة.
4. مطابقة dashboard counts مع drill-down queries.

### المرحلة B — قرارات الحوكمة

1. اعتماد فرق Secretary/Office Admin.
2. اعتماد سياسة 2FA.
3. اعتماد مصير `/product-system`.
4. اعتماد مدة توافق `/portal`.

### المرحلة C — إصلاحات مركزة

1. حماية showcase.
2. تطبيق مصفوفة الصلاحيات المعتمدة.
3. تنفيذ 2FA أو توثيق الضوابط البديلة.
4. توحيد client copy.
5. إزالة الملفات الأربعة بعد إثبات عدم الاعتماد الخارجي.

### المرحلة D — صلابة الاختبار والتوثيق

1. تثبيت visual link test.
2. تحديث generated route/API inventory.
3. تحديث implementation status والأعداد.
4. تكرار audit على production قراءة فقط.

## ما لم يثبت

- لا يوجد دليل أن API DB-backed “مكسور” منطقيًا؛ يوجد غياب لإثبات التشغيل.
- لا يوجد دليل أن Paymob/PayTabs يعملان أو لا يعملان في production.
- لا يوجد دليل أن صلاحيات DB الحالية مساوية للـdefaults.
- لا يوجد دليل أن `kmtlegal.org` يشغّل نفس commit.
- لا توجد بيانات حقيقية استُخدمت أو تغيرت أثناء التدقيق.

