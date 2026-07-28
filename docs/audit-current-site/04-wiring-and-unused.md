# الترابط، العناصر غير المربوطة، والكود غير المستخدم

**لقطة:** 2026-07-28 — commit `9c6821c2`  
**قاعدة الحكم:** لا يوصف ملف بأنه غير مستخدم إلا بعد فحص import graph والبحث النصي في `src`, `tests`, `docs` وملفات الإعداد. Next.js conventions مثل `global-error.tsx` و`instrumentation-client.ts` لا تحتاج import صريحًا.

## تتبع العمليات الرئيسية

### 1. رسالة تواصل عامة

```text
ContactForm
→ POST /api/public/contact
→ validation + phone normalization + in-memory rate limit
→ createPublicContactMessage
→ Prisma
→ audit/notification
→ 201 + requestId
→ inline success/error
```

| الطبقة | المصدر | الحكم |
|---|---|---|
| UI | `src/features/public-site/contact-form.tsx` | مستدعى؛ error path verified |
| API | `src/app/api/public/contact/route.ts` | مربوط؛ CSRF/rate limit/validation |
| Service | `src/server/contact/contact-message-service.ts` | مربوط |
| Data/effects | Prisma + audit/notification | source/unit verified؛ runtime blocked |
| Admin consumer | `/admin/contact-messages` | مربوط؛ authenticated runtime blocked |

**الحكم:** يعمل جزئيًا مثبتًا؛ مسار النجاح من form إلى صف DB ثم triage لم يُنفذ.

### 2. الحجز والمساعد والدفع

```text
ConsultationBookingChat / BookingStepper
→ /api/public/consultations/assistant أو /api/public/consultations
→ consultation-service / assistant-service
→ Prisma + availability
→ /checkout
→ Paymob أو PayTabs
→ webhook
→ payment status
→ return / receipt
```

- المكوّن الفعلي للمساعد هو `consultation-booking-chat.tsx`.
- `/api/public/consultations/assistant` له consumer فعلي واختبارات contract وE2E.
- booking mode يُقرأ من الإعدادات وقت التشغيل.
- checkout/webhook/reconciliation موجودة في الخدمات، لكن لا يمكن وصفها بأنها تعمل إنتاجيًا دون DB وgateway secrets وwebhook test.

**الحكم:** UI/error path يعمل؛ الكتابة والدفع end-to-end غير مثبتين.

### 3. تسجيل الدخول والجلسة

```text
Login form
→ POST /api/auth/login
→ session-store + password verification
→ active user + active role + DB role.permissions
→ secure session cookie
→ middleware
→ page guard
→ API guard
```

- المستخدم المحذوف/غير النشط أو الدور غير النشط لا يحصل على session.
- الجلسة المنتهية أو الملغاة تُرفض.
- الصلاحيات تُحمّل من علاقة الدور في DB، لا تُثق من cookie أو UI.
- 2FA endpoint/page موجودة كحدود واضحة لكنها تعيد `FEATURE_DISABLED`/404 عمدًا.

**الحكم:** contract/unit verified؛ login حقيقي runtime blocked.

### 4. قضية وملف العميل

```text
/client/cases أو /client/files
→ client portal page guard
→ client-portal-service
→ clientId/owner/case visibility filter
→ Prisma
→ scoped DTO
→ client UI states
```

- العميل يحتاج دور Client و`clientId` مرتبطًا.
- المستند يحتاج ملكية أو قضية خاصة بالعميل، ومعيار `CLIENT_VISIBLE`.
- تنزيل/رفع الملفات يضيف storage policy وfile safety فوق صلاحية السجل.

**الحكم:** source/unit scope verified؛ success/deny مع صفوف PostgreSQL فعلية غير منفذ.

### 5. إنشاء/تعديل قضية من الإدارة

```text
ManualCaseForm
→ POST /api/admin/cases أو PATCH /api/admin/cases/{caseId}
→ request/session/permission guard
→ case-operations-service
→ idempotency + validation + object scope
→ Prisma transaction
→ audit event
→ safe DTO + UI feedback
```

- الإنشاء يتطلب `case.create.any`.
- التعديل يتطلب `case.update.any` أو `case.update.assigned` مع التحقق من السجل.
- تغيير الحالة والجلسات endpoints منفصلة.

**الحكم:** UI/API/service/audit موصلة واختبارات الوحدة ناجحة؛ أثر DB runtime blocked.

### 6. dashboard والأرقام

```text
/admin
→ requireAdminRoutePage
→ getAdminDashboard(principal)
→ role-filtered independent loaders
→ Prisma scoped counts/queues
→ metric definitions + Cairo cutoff + drill-down href
→ AdminCommandCenter
```

- الصفحة server-rendered وتستدعي الخدمة مباشرة؛ `/api/admin/dashboard` يقدّم نفس snapshot للمستهلكات الخارجية/الاختبارات.
- كل loader يستخدم صلاحية ونطاق المجال نفسه، ويُرجع `unavailable` منفصلًا عند فشله.
- البطاقة تُحذف عند غياب الصلاحية، ولا تصل كقيمة `null` إلى المتصفح.
- الروابط والفلاتر والـDTO bounds مغطاة بالاختبارات.

**الحكم:** wiring قوي؛ مطابقة count فعلي مع SQL/DB غير منفذة.

### 7. تعديل صلاحيات دور

```text
/admin/roles
→ exact Super Admin page policy
→ RolePermissionForm
→ PATCH /api/admin/roles/{roleId}/permissions
→ exact-role + two permission checks
→ role-permission-service
→ serializable transaction + optimistic concurrency
→ audit
→ refreshed matrix
```

- Guest, Client وSuper Admin protected.
- Lawyer, Secretary, Office Admin وMarketing Staff فقط editable.
- final-Super-Admin/user governance حراس منفصلة في user service.

**الحكم:** source/unit verified؛ DB runtime blocked.

## العناصر غير المستخدمة أو غير القابلة للوصول

### كود مرشح للحذف أو الدمج — دليل قوي

| العنصر | الدليل | الحكم | الإجراء المقترح |
|---|---|---|---|
| `src/app/(app-ar)/portal/portal-navigation.ts` | لا import ولا reference خارج الملف؛ صفحات portal تحوّل إلى client | كود ميت مرجح | احذف بعد تأكيد عدم وجود consumer خارجي؛ احتفظ بالredirect pages |
| `src/features/public-site/consultation-assistant-panel.tsx` | لا يُرسم في المنتج؛ اختبار `product-components` يؤكد غياب `<ConsultationAssistantPanel`؛ البديل `consultation-booking-chat.tsx` | UI قديم غير مستخدم | احذف أو وثقه كprototype؛ لا تحذف assistant API |
| `src/lib/readiness-routing.ts` | لا import أو reference خارج الملف | helper غير مربوط | احذف أو أعد ربطه فقط إذا عاد readiness middleware |
| `src/server/auth/index.ts` | لا يوجد import مطابق لـ`@/server/auth`؛ كل المستهلكين يستوردون submodules | barrel غير مستخدم | احذف إن لم يكن public module مقصودًا |

هذه القائمة لا تتضمن `global-error.tsx` أو `instrumentation-client.ts` لأن Next.js يكتشفهما بالاسم. ولا تتضمن `src/lib/design-system/tokens.ts` لأنه مستورد من `tailwind.config.ts`.

### مسارات موجودة لكنها ليست “ميزة مكسورة”

| العنصر | الوصول | التصنيف |
|---|---|---|
| `/portal/*` | redirects إلى `/client/*` | aliases مقصودة |
| `/login/2fa` و4 APIs مرتبطة | 404/503 | مؤجل رسميًا/معطل عمدًا |
| `/install` وinstaller APIs | env/token/lock gated | سطح تشغيلي مقصود |
| `/stitch-clone/*` | متاح في dev، مغلق في production افتراضيًا | مرجع بصري خارج المنتج |
| SMTP | configuration-dependent | معطل بإعداد، لا يُصنف bug |
| Paymob/PayTabs | configuration-dependent | تنفيذ موجود؛ readiness غير مثبت |

### سطح تجريبي مكشوف

`/product-system` وأربع صفحات فرعية تستخدم `ProductSystemDemo` وبيانات mock ثابتة. لا يوجد fetch أو DB wiring، وهي خارج `isProtectedAppPath`. اختبار smoke أكد `200` محليًا للزائر.

**الحكم:** ليست كودًا ميتًا لأنها مستدعاة ومختبرة، وليست منتجًا حقيقيًا لأنها showcase. بقاؤها عامة في production يحتاج قرارًا صريحًا؛ الوضع الحالي يعرض UI داخليًا يمكن أن يُفهم خطأ على أنه بيانات/نظام حقيقي.

## عناصر تعمل جزئيًا أو لم تُثبت

| العنصر | الحالة | السبب |
|---|---|---|
| Production build في بيئة التدقيق | مكسور بيئيًا | `DATABASE_URL is required in production` أثناء page-data collection |
| كل DB-backed success paths | غير مثبتة | لا `DATABASE_URL` ولا PostgreSQL/Docker |
| role/action browser matrix | static/unit فقط | 13 اختبار PLAN-35 تخطت نفسها لغياب DB fixtures |
| live admin smoke | غير منفذ | لا `KMT_LIVE_BASE_URL` أو حسابات وهمية |
| الإنتاج `kmtlegal.org` | غير مفحوص | الوصول المنشور لم يتوفر من أدوات الجلسة ولا توجد live credentials |
| visual internal-link test | يعمل وظيفيًا لكن test flaky/slow | انتهت مهلة 60s بعد استجابة `200` لآخر رابط |
| 2FA | معطل عمدًا | `FEATURE_DISABLED` |
| payment/SMTP | configuration-dependent | secrets وprovider callbacks غير متاحة |

## حدود تحليل “غير مستخدم”

- import graph شمل 368 ملف TypeScript/TSX داخل `src`.
- استُبعدت Next conventions والـroute/page entrypoints من شرط inbound import.
- جرى بحث follow-up في source/tests/docs/config لكل مرشح.
- لا يثبت التحليل غياب استهلاك خارجي مباشر لـAPI؛ لذلك لم تُسم أي API “غير مستخدمة” لمجرد عدم وجود fetch داخلي.
- حذف أي مرشح يجب أن يكون change منفصلًا مع typecheck/test؛ هذا التدقيق لم يغير السلوك.

