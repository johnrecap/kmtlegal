# KMT Legal Spec Kit Plan Index

## PLAN-26 Update

The active Spec Kit set now contains 27 plans: PLAN-00 through PLAN-26. PLAN-24 covers remediation/production readiness, PLAN-25 covers the no-code VPS installer, first Super Admin bootstrap, disabled TOTP, disabled SMTP, and installer lock, and PLAN-26 covers panel-aware installer compatibility for Terminal VPS, aaPanel, and conditional cPanel hosting.

تاريخ الإصدار: 2026-06-23

هذا الملف يحدد خطط الـSpec Kit المعتمدة لمنصة `KMT Legal Platform`: كل خطة هدفها إيه، هتمسك أي نطاق، ما لا يجب أن تلمسه، ومين يعتمد على مين. الغرض أن التنفيذ لا يتحول إلى برومبتات متفرقة أو UI منفصل عن الـdata/auth/API.

## القرار المختصر

سنقسم المشروع إلى **24 خطة Spec Kit**:

- **خطة حوكمة واحدة** تضبط طريقة استخدام Spec Kit ومصادر الحقيقة.
- **23 خطة تنفيذ** تغطي foundation، Stitch clone، عقود data/auth/API، ثم feature slices رأسية.

الترتيب الأفضل **ليس** أن ننفذ كل الفرونت ثم كل الباك. الاستثناء الوحيد هو `Stitch Visual Clone` لأنه مطلوب static visual parity بدون backend. بعد ذلك التنفيذ يكون hybrid:

1. App/tooling foundation.
2. Isolated frontend static clone.
3. Product design foundation.
4. Thin data/auth/API contracts.
5. Feature slices رأسية: كل ميزة تشمل UI + state + API/server actions + DB + permissions + tests حسب الحاجة.

سبب القرار: تنفيذ كل الواجهة أولًا سيكرر مشكلة "fake UI" بدون عقود بيانات وصلاحيات. وتنفيذ كل الباك أولًا سيؤخر التحقق من تجربة المستخدم وRTL وStitch parity. المسار الصحيح هنا foundation خفيف، clone بصري معزول، contracts، ثم slices متكاملة.

## مصادر الحقيقة

- `docs/KMT_LEGAL_PLATFORM_PRD.md`
- `docs/KMT_LEGAL_IMPLEMENTATION_PLAN.md`
- `stitch_kmt_legal_platform_ui_system/kmt_legal_design_system/DESIGN.md`
- `stitch_kmt_legal_platform_ui_system/kmt_legal_1..22/code.html`
- `stitch_kmt_legal_platform_ui_system/._kmt_legal/code.html`

ملاحظة: المشروع يحتوي الآن على وثائق وStitch exports. لا يوجد تطبيق Next.js منفذ بعد داخل الملفات الحالية.

## شكل كل خطة داخل Spec Kit

لكل خطة نطلب مخرجات موحدة:

- `spec.md`: المتطلبات، user stories، acceptance criteria بصيغة قابلة للاختبار.
- `plan.md`: التصميم الفني، القرارات، الاعتماديات، المخاطر.
- `tasks.md`: مهام تنفيذ مرتبة، كل مهمة لها scope واضح وDoD.
- `contracts/`: عقود API/server actions أو DTOs عند وجود backend.
- `data-model.md`: فقط للخطط التي تغير schema أو persistence.
- `quickstart.md`: طريقة تشغيل/اختبار الخطة.
- `checklists/`: QA، accessibility، security، visual parity حسب الخطة.

## تغطية الـPRD

| مجال الـPRD | الخطط المالكة |
| --- | --- |
| Project setup وtooling | PLAN-01 |
| Stitch clone وvisual parity | PLAN-02 |
| Product UI system وRTL/LTR | PLAN-03 |
| Core data model وseeds | PLAN-04 |
| Auth/RBAC/session security | PLAN-05 وPLAN-18 |
| API conventions وvalidation/errors/audit primitive | PLAN-06 |
| Document upload/download/storage safety | PLAN-07 وPLAN-14 وPLAN-17 وPLAN-22 |
| AI Organizer mock وlegal guardrails | PLAN-08 وPLAN-11 وPLAN-20 |
| Public website/content/contact/legal pages | PLAN-09 وPLAN-10 |
| Consultation booking ثم admin conversion | PLAN-11 وPLAN-12 |
| Client portal | PLAN-13 وPLAN-14 |
| Admin dashboard/CRM/cases/calendar/tasks | PLAN-15 وPLAN-16 وPLAN-17 |
| Admin users/settings/audit-log | PLAN-18 |
| Admin finance/reports | PLAN-19 |
| Content/social hub | PLAN-20 |
| Analytics/observability بدون PII | PLAN-21 |
| Security/privacy/release hardening | PLAN-22 وPLAN-23 |

## ترتيب الخطط

### PLAN-00 - Spec Governance & Source of Truth

**الغرض:** ضبط طريقة العمل بالـSpec Kit قبل أي تنفيذ.

**هتمسك:**

- تعريف مصدر الحقيقة بين PRD وStitch exports وخطط Spec Kit.
- Naming convention للخطط والفروع والملفات.
- Definition of Done العام.
- قاعدة عدم خلط `/stitch-clone/*` مع المنتج الحقيقي.
- قاعدة أن أي feature slice لا تكتمل بدون UI + API/data + auth عند الحاجة + tests.
- Coverage matrix بين PRD وكل خطة.
- Deferred log واضح لأي شيء خارج MVP.

**لا تمسك:**

- لا كود إنتاجي.
- لا تصميم جديد.

**تعتمد على:** الوثائق الحالية فقط.

**تفتح الطريق لـ:** كل الخطط.

### PLAN-01 - Next.js App Foundation

**الغرض:** إنشاء أساس تطبيق Next.js قابل للبناء والاختبار.

**هتمسك:**

- Next.js App Router + TypeScript.
- Tailwind setup.
- ESLint/typecheck/build scripts.
- folder structure.
- `.env.example` و`.gitignore`.
- test runner skeleton.
- Playwright setup الأساسي.

**لا تمسك:**

- لا auth حقيقي.
- لا schema.
- لا صفحات منتج dynamic.

**تعتمد على:** PLAN-00.

**تفتح الطريق لـ:** PLAN-02 وPLAN-03 وPLAN-04.

### PLAN-02 - Stitch Visual Clone

**Harness update:** PLAN-02 is governed by `docs/harness/stitch-clone/team-spec.md` and `.agents/skills/stitch-clone-orchestrator/SKILL.md`.

**Sub-plans:**

- `PLAN-02A` Stitch Source Inventory & Asset Freeze.
- `PLAN-02B` Raw JSX Mechanical Conversion.
- `PLAN-02C` CSS/Font/Icon/Asset Preservation.
- `PLAN-02D` Playwright Screenshot Capture.
- `PLAN-02E` Visual Difference Review.
- `PLAN-02F` Targeted Parity Fix Loop.
- `PLAN-02G` Final Acceptance Report.

**Done means:** the implemented screenshot is visually close to the Stitch screenshot at the required viewport, with documented diffs and targeted fixes. Build success alone is not enough.

**الغرض:** نسخ شاشات Stitch كما هي بصريًا.

**هتمسك:**

- إنشاء routes تحت `/stitch-clone/[screen-name]`.
- تحويل `code.html` إلى JSX ميكانيكيًا.
- الحفاظ على Tailwind classes وCSS وfonts وMaterial Symbols.
- إنشاء mapping لكل شاشة من `kmt_legal_1..22` و`._kmt_legal`.
- Playwright screenshots على `390x844` و`1440x900` عند الحاجة.
- تقرير فروق visual parity وإصلاح الفروق المثبتة فقط.

**لا تمسك:**

- لا backend.
- لا dynamic data.
- لا shadcn/ui.
- لا app components.
- لا إعادة تصميم.

**تعتمد على:** PLAN-01 إذا كان التنفيذ داخل Next.js. يمكن تنفيذها static خارج Next.js بعد PLAN-00 فقط، لكن المسار المعتمد هنا هو clone داخل التطبيق.

**تفتح الطريق لـ:** PLAN-03 لأن product design system لا يبدأ قبل عزل clone.

### PLAN-03 - Product Design System & Layout Shells

**الغرض:** بناء نظام واجهة المنتج الحقيقي خارج clone.

**هتمسك:**

- tokens من `DESIGN.md`.
- Arabic RTL + English LTR readiness.
- Public layout.
- Portal/admin dashboard shell.
- UI primitives: buttons, inputs, cards, badges, tables, tabs, dialogs, states.
- accessibility basics: labels, focus, icon labels, touch targets.

**لا تمسك:**

- لا تستخدم داخل `/stitch-clone/*`.
- لا تربط data.
- لا تضيف UI library جديدة بدون قرار واضح.

**تعتمد على:** PLAN-01 وPLAN-02.

**تفتح الطريق لـ:** كل صفحات public/portal/admin.

### PLAN-04 - Database Schema, Prisma & Seeds

**الغرض:** تثبيت data model قبل بناء feature slices الديناميكية.

**هتمسك:**

- Prisma setup.
- PostgreSQL schema.
- core models: User, Role, Permission, Client, LawyerProfile, LegalService, ConsultationRequest, Appointment, Case, CaseSession, Document, Task, Article, CaseStudy, SocialPostDraft, Payment, Notification, AuditLog, SystemSetting.
- indexes وsoft delete حيث يلزم.
- seed roles/permissions/users/services/lawyers/articles/cases/demo data.
- migration validation.
- عدم over-modeling للمستقبل: ابدأ بـcore schema الكافي لتدفقات MVP، وأضف migrations لاحقة مع feature slices عند ظهور حاجة حقيقية.

**لا تمسك:**

- لا UI.
- لا auth flow كامل.
- لا payment gateway.

**تعتمد على:** PLAN-01.

**تفتح الطريق لـ:** PLAN-05 وPLAN-06 وكل feature slice.

### PLAN-05 - Auth, Sessions, Roles & Permissions

**الغرض:** حماية portal/admin/actions من البداية.

**هتمسك:**

- اختيار وتنفيذ auth layer.
- login/logout/current user.
- session policy.
- CSRF decision للـcookie-auth mutations.
- route guards.
- permission helpers.
- role/permission seed wiring.
- denied states 401/403.
- log redaction rule للأحداث الأمنية.
- tests للـclient/lawyer/admin access boundaries.

**لا تمسك:**

- لا business CRUD واسع.
- لا public content.

**تعتمد على:** PLAN-04.

**تفتح الطريق لـ:** PLAN-06 وportal/admin plans وPLAN-18.

### PLAN-06 - Server Contracts, Validation, Errors & Audit Foundation

**الغرض:** منع raw actions/fetch العشوائي وتوحيد عقود السيرفر.

**هتمسك:**

- service/repository structure.
- Zod validation pattern.
- unified error shape.
- requestId.
- audit log service primitive.
- server action/route handler conventions.
- pagination/filter/sort contract pattern.
- rate-limit hooks أو abstraction لاحق.
- baseline security conventions: safe redirects, no raw sensitive logs, server-only secrets boundary.

هذه الخطة تضع conventions فقط؛ عقود كل feature تتوسع داخل خطة الـfeature نفسها.

**لا تمسك:**

- لا تنفيذ كل endpoints.
- لا bulk backend قبل الواجهة.
- لا UI.

**تعتمد على:** PLAN-04 وPLAN-05.

**تفتح الطريق لـ:** كل الخطط التي فيها API أو server actions.

### PLAN-07 - Document Storage & Upload Contract

**الغرض:** تثبيت عقد آمن للملفات قبل أي upload UI في portal أو admin.

**هتمسك:**

- storage abstraction للملفات الخاصة.
- منع التخزين داخل `public/`.
- generated storage keys لا تكشف أسماء العملاء أو القضايا.
- file type allowlist وsize limits.
- MIME/content validation strategy.
- document visibility rules: client, lawyer, admin, internal.
- download authorization contract.
- delete/request-delete behavior.
- document audit events.
- fixtures/tests للـvalid/invalid uploads.

**لا تمسك:**

- لا Portal Documents UI.
- لا Admin document management UI.
- لا cloud provider نهائي إذا لم يكن مطلوبًا في MVP.

**تعتمد على:** PLAN-04 وPLAN-05 وPLAN-06.

**تفتح الطريق لـ:** PLAN-14 وPLAN-17 وPLAN-22.

### PLAN-08 - AI Organizer Mock Contracts & Legal Guardrails

**الغرض:** ضبط AI Organizer كـmock آمن وقابل للاختبار قبل استخدامه في booking أو content.

**هتمسك:**

- deterministic mock outputs.
- schemas للـconsultation triage وcontent draft suggestions.
- validation لأي AI-shaped output.
- legal guardrails: لا نصيحة قانونية، لا وعود بنتائج، لا إرسال مستندات أو بيانات عملاء لخدمة خارجية في MVP.
- fallback behavior عند فشل mock أو validation.
- review-required state لأي محتوى مولد.
- tests تمنع تسريب PII أو legal advice phrasing.

**لا تمسك:**

- لا OpenAI/Gemini/LLM integration حقيقي.
- لا prompt production secrets.
- لا automatic publishing.

**تعتمد على:** PLAN-06.

**تفتح الطريق لـ:** PLAN-11 وPLAN-20.

### PLAN-09 - Public Core Website: Home, Services, Team

**الغرض:** بناء الصفحات العامة الأساسية التي تبيع الثقة وتوجه للحجز.

**هتمسك:**

- `/`
- `/services`
- `/services/[slug]`
- `/team`
- `/team/[slug]`
- service cards.
- lawyer cards/profile.
- search/filter للخدمات والفريق.
- CTA إلى booking.
- seeded data rendering.

**لا تمسك:**

- لا articles/media/case studies.
- لا booking submission.

**تعتمد على:** PLAN-03 وPLAN-04 وPLAN-06.

**تفتح الطريق لـ:** PLAN-11.

### PLAN-10 - Public Content, Media, Contact & Legal Pages

**الغرض:** بناء المحتوى العام والثقة القانونية.

**هتمسك:**

- `/articles`
- `/articles/[slug]`
- `/media`
- `/case-studies`
- `/case-studies/[slug]`
- `/contact`
- `/privacy`
- `/terms`
- article/category filters.
- anonymous case study disclaimer.
- contact form validation.
- no legal outcome promises.

**لا تمسك:**

- لا admin content editor.
- لا social external publishing.
- لا AI draft generation.

**تعتمد على:** PLAN-03 وPLAN-04 وPLAN-06.

**تفتح الطريق لـ:** PLAN-20.

### PLAN-11 - Consultation Booking Flow

**الغرض:** بناء مسار حجز استشارة قابل للتحويل لاحقًا إلى case.

**هتمسك:**

- multi-step booking form.
- اختيار service/lawyer/slot.
- client contact details.
- AI Organizer mock من PLAN-08.
- validation + duplicate submission protection.
- server action لإنشاء ConsultationRequest.
- success/error/loading states.
- rate-limit hook على submission.
- E2E submit happy path وvalidation failures.

**لا تمسك:**

- لا admin review.
- لا case creation.
- لا real payment.

**تعتمد على:** PLAN-03 وPLAN-04 وPLAN-06 وPLAN-08 وPLAN-09.

**تفتح الطريق لـ:** PLAN-12.

### PLAN-12 - Admin Consultation Review & Convert To Case

**الغرض:** تحويل طلبات الاستشارة من public intake إلى عمل إداري حقيقي.

**هتمسك:**

- consultations queue.
- consultation detail.
- assign lawyer.
- approve/reject.
- convert to client/case/appointment.
- conflict check placeholder للطرف المقابل.
- audit log لكل assign/convert/reject.
- permission checks.
- tests لمسار booking -> review -> convert.

**لا تمسك:**

- لا case lifecycle كامل.
- لا portal كامل.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-11.

**تفتح الطريق لـ:** PLAN-13 وPLAN-15 وPLAN-16.

### PLAN-13 - Client Portal Core

**الغرض:** بناء أساس بوابة العميل بعد وجود case قابل للعرض.

**هتمسك:**

- portal shell.
- `/portal`
- `/portal/cases`
- `/portal/cases/[id]`
- own case summary.
- assigned lawyer info.
- recent activity.
- secure empty/error states.
- ownership checks.

**لا تمسك:**

- لا document upload.
- لا appointments management.
- لا payments details.
- لا profile advanced.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-12.

**تفتح الطريق لـ:** PLAN-14.

### PLAN-14 - Client Documents, Appointments, Payments & Profile

**الغرض:** إكمال بوابة العميل حول الملفات والمواعيد والبيانات الشخصية.

**هتمسك:**

- `/portal/documents`
- `/portal/appointments`
- `/portal/payments`
- `/portal/profile`
- document list/search/upload using PLAN-07.
- appointment list/detail.
- profile edit basics.
- payments read-only/manual records.
- upload errors: size/type/permission.
- tests لملكية المستندات والمواعيد.

**لا تمسك:**

- لا payment gateway.
- لا refunds/settlement.
- لا admin document management.

**تعتمد على:** PLAN-07 وPLAN-13 وPLAN-06.

**تفتح الطريق لـ:** PLAN-19 وPLAN-23.

### PLAN-15 - Admin Dashboard & Clients CRM

**الغرض:** بناء مركز عمليات admin الأساسي وإدارة العملاء.

**هتمسك:**

- `/admin`
- `/admin/clients`
- client list/search/filter.
- client detail.
- dashboard metrics الأساسية.
- archive/assign actions.
- permission checks.
- audit logs.
- responsive admin table states.

**لا تمسك:**

- لا case lifecycle كامل.
- لا finance/reports.
- لا users/settings/audit-log.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-12.

**تفتح الطريق لـ:** PLAN-16 وPLAN-19.

### PLAN-16 - Admin Cases, Sessions & Calendar

**الغرض:** إدارة القضايا والجلسات والتقويم.

**هتمسك:**

- `/admin/cases`
- `/admin/cases/[id]`
- `/admin/calendar`
- case list search/filter/sort/pagination.
- status update with confirmation.
- add session/reschedule.
- calendar views.
- audit لكل status/session mutation.
- lawyer visibility حسب الصلاحية.

**لا تمسك:**

- لا tasks board.
- لا document management.
- لا finance/reporting.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-15.

**تفتح الطريق لـ:** PLAN-17 وPLAN-19.

### PLAN-17 - Admin Tasks & Document Management

**الغرض:** إكمال أدوات التشغيل اليومية حول المهام والمستندات.

**هتمسك:**

- `/admin/tasks`
- case detail document/task tabs.
- create/update/assign task.
- task filters: all/mine/overdue.
- document upload/list/download using PLAN-07.
- document visibility and ownership checks.
- audit لكل task/document mutation.
- no-results/error states.

**لا تمسك:**

- لا users/settings.
- لا reports.
- لا security hardening النهائي.

**تعتمد على:** PLAN-07 وPLAN-16.

**تفتح الطريق لـ:** PLAN-22.

### PLAN-18 - Admin Users, Settings & Audit Log

**الغرض:** تغطية صفحات الحوكمة الإدارية المذكورة في الـPRD بدل تركها ضمن hardening.

**هتمسك:**

- `/admin/users`
- `/admin/settings`
- `/admin/audit-log`
- users list/detail basics.
- role/permission assignment UI.
- system settings read/update مع audit.
- audit log search/filter/pagination.
- permission boundaries للـsuper-admin/admin/lawyer.
- tests تمنع privilege escalation.

**لا تمسك:**

- لا business CRM.
- لا finance reports.
- لا تغيير auth strategy من PLAN-05 إلا عند وجود bug موثق.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-15.

**تفتح الطريق لـ:** PLAN-22 وPLAN-23.

### PLAN-19 - Admin Finance & Reports Basics

**الغرض:** تغطية `/admin/finance` و`/admin/reports` كـMVP basics بدون بناء payment system كامل.

**هتمسك:**

- `/admin/finance`
- `/admin/reports`
- read-only/manual payment records.
- revenue/outstanding summaries من بيانات MVP.
- consultation/case/task/report metrics الأساسية.
- filters by date/status/lawyer/service.
- export policy إن وجدت export بسيطة.
- finance/report permissions.
- no PII beyond what the role can view.

**لا تمسك:**

- لا payment gateway.
- لا refunds/settlement/ledger كامل.
- لا accounting integration.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-14 وPLAN-15 وPLAN-16.

**تفتح الطريق لـ:** PLAN-21 وPLAN-23.

### PLAN-20 - Content & Social Hub

**الغرض:** بناء إدارة المحتوى والسوشيال داخل لوحة الإدارة.

**هتمسك:**

- `/admin/content`
- articles CRUD.
- case studies CRUD مع anonymization.
- media entries.
- social post drafts.
- approval/publish state داخليًا.
- AI draft mock من PLAN-08.
- social counters read-only.
- content permissions.

**لا تمسك:**

- لا نشر خارجي حقيقي.
- لا AI integration حقيقي.
- لا وعود بنتائج قانونية داخل المحتوى.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-08 وPLAN-10.

**تفتح الطريق لـ:** PLAN-21 وPLAN-23.

### PLAN-21 - Privacy-Safe Analytics & Observability Events

**الغرض:** تعريف القياس والتتبع بدون تسريب PII أو بيانات قانونية حساسة.

**هتمسك:**

- event taxonomy للـMVP.
- أحداث مثل consultation submitted, booking failed, upload succeeded/failed, admin convert, case status update.
- allowed/disallowed event properties.
- environment/release tags.
- requestId correlation.
- privacy-safe logging conventions.
- observability dashboard notes.
- tests أو static checks تمنع أسماء العملاء/ملخصات القضايا/محتوى المستندات في analytics.

**لا تمسك:**

- لا product features جديدة.
- لا إرسال بيانات لخدمة خارجية قبل اعتماد privacy/security.
- لا أرقام أداء غير قابلة للتحقق.

**تعتمد على:** PLAN-06 والخطط المالكة للأحداث التي سيتم قياسها.

**تفتح الطريق لـ:** PLAN-22 وPLAN-23.

### PLAN-22 - Security, Privacy, Upload & Observability Hardening

**الغرض:** مراجعة وتقوية النظام قبل اعتباره MVP صالحًا. هذه ليست أول مرة ندخل فيها الأمن؛ baseline الأمن موجود مبكرًا في PLAN-05 وPLAN-06، وupload contract موجود في PLAN-07.

**هتمسك:**

- security headers plan.
- CSRF/rate-limit review.
- upload storage review ضد PLAN-07.
- RBAC/ownership review.
- audit trail completeness review.
- log redaction and no PII checks.
- privacy pages consistency.
- dependency audit process.
- backup/restore note.
- Sentry/observability wiring إن تم اعتماده بدون PII.

**لا تمسك:**

- لا features جديدة.
- لا إعادة تصميم.
- لا payment gateway.

**تعتمد على:** PLAN-05 وPLAN-06 وPLAN-07 وPLAN-18 وPLAN-21.

**تفتح الطريق لـ:** PLAN-23.

### PLAN-23 - Testing, QA, Deployment & Handoff

**الغرض:** إغلاق MVP ببوابات تحقق وتشغيل وتسليم واضحة.

**هتمسك:**

- unit tests للvalidators/permissions/services.
- integration tests للauth/API contracts.
- مراجعة أن كل feature slice أضاف اختباراته أثناء التنفيذ، وليس تأجيل كل الاختبارات لهذه الخطة.
- E2E:
  - consultation submit.
  - admin review/convert.
  - client sees own data.
  - upload document.
  - unauthorized denied.
  - case study approval.
  - admin user permission denial.
  - finance/report read-only access.
- Playwright visual checks للclone.
- build/lint/typecheck.
- README/PROJECT_GUIDE.
- deployment docs.
- seed instructions.
- smoke checklist.

**لا تمسك:**

- لا features جديدة إلا fixes مطلوبة لاجتياز QA.

**تعتمد على:** كل الخطط السابقة.

**تفتح الطريق لـ:** release أو next milestone.

## الاعتمادية المختصرة

```text
PLAN-00
  -> PLAN-01
      -> PLAN-02
      -> PLAN-03
      -> PLAN-04
          -> PLAN-05
              -> PLAN-06
                  -> PLAN-07
                  -> PLAN-08
                  -> PLAN-09 -> PLAN-11 -> PLAN-12 -> PLAN-13 -> PLAN-14
                  -> PLAN-10 -> PLAN-20
                  -> PLAN-15 -> PLAN-16 -> PLAN-17
                  -> PLAN-18
                  -> PLAN-19
                  -> PLAN-21 -> PLAN-22 -> PLAN-23
```

## هل نبدأ Front ولا Back؟

القرار العملي:

1. **نبدأ بـApp Foundation** لأن clone هيعيش داخل Next.js.
2. **نعمل Front فقط في Stitch clone** لأن المطلوب visual clone static حرفيًا ومعزول.
3. **بعد clone لا نكمل Front منفصل.** نعمل data/auth/API contracts خفيفة.
4. **بعد العقود ننفذ slices رأسية.** مثال: booking لا يكتمل إلا بواجهة stepper، validators، server action، ConsultationRequest DB write، AI Provider Gateway contract، error states، واختبار E2E.

بهذا الشكل كل خطة تخرج قابلة للاختبار، ولا نراكم صفحات جميلة لكنها غير قابلة للتشغيل.

## خطط يمكن تشغيلها بالتوازي

بعد اكتمال PLAN-01:

- PLAN-02 يمكن أن يعمل بالتوازي مع PLAN-04 إذا الفريق منفصل، لأن clone لا يلمس DB.
- PLAN-03 يمكن أن يبدأ بعد عزل clone، لكن لا يدخل في `/stitch-clone/*`.

بعد اكتمال PLAN-06:

- PLAN-07 وPLAN-08 يمكن أن يبدأا كعقود مشتركة قبل slices.
- PLAN-09 وPLAN-10 يمكن تقسيمهما بين agents مختلفين بعد PLAN-03.
- PLAN-15 يمكن أن يبدأ بعد PLAN-12 حتى لو PLAN-14 لم يكتمل، طالما لا يلمس payments/doc upload.
- PLAN-20 يمكن أن يبدأ بعد PLAN-10 وPLAN-08.

لا تشغل بالتوازي:

- PLAN-05 وPLAN-06 إذا نفس الشخص يغير auth/server helpers.
- PLAN-07 وPLAN-14 أو PLAN-17 في upload permissions بدون تنسيق.
- PLAN-16 وPLAN-17 إذا كلاهما يغير case detail document/task tabs.
- PLAN-18 وأي تعديل permissions واسع بدون owner واحد واضح.
- PLAN-21 وPLAN-22 إذا كلاهما يغير logging/observability boundaries.

## مخاطر التقسيم

- خطة Stitch clone لو دخلت design system ستكسر شرط المستخدم.
- خطة public pages لو بدأت قبل data contracts ستنتج content hardcoded.
- خطة admin لو بدأت قبل auth ستنتج protected UI غير محمي فعليًا.
- خطة upload لو بدأت قبل PLAN-07 قد تضع الملفات في `public/` أو تكشف أسماء العملاء.
- خطة AI لو بدأت بدون PLAN-08 قد تنتج legal advice أو تسرب PII.
- خطة analytics لو بدأت بدون PLAN-21 قد ترسل بيانات قانونية حساسة.
- خطة reports/finance لو توسعت خارج PLAN-19 قد تتحول إلى payment/ledger system غير مطلوب في MVP.
- خطة content لو بدأت قبل anonymization rules قد تنشر بيانات حساسة.

## ملخص عدد الخطط

العدد المعتمد: **24 خطة**.

هذا العدد كبير عمدًا لأن المنصة واسعة وحساسة، ولأن Spec Kit يكون أقوى عندما تكون كل خطة قابلة للقبول والاختبار بدل خطة واحدة ضخمة تفقد التفاصيل.
