# KMT Legal Implementation Plan

> تحديث 2026-06-23: ملف `docs/KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md` هو المصدر التفصيلي المعتمد لخطط Spec Kit، وعدده الحالي **24 خطة**. هذا الملف يظل خطة تشغيل عامة، بينما التنفيذ التفصيلي يتم من خلال خطط Spec Kit.

تاريخ الإصدار: 2026-06-23

هذه الخطة هي ترتيب التنفيذ العملي لمنصة `KMT Legal Platform` بناءً على ملفات Stitch والبرومبتات. الهدف هو منع العمل العشوائي: كل مرحلة لها مدخلات، مخرجات، اختبارات قبول، وما لا يجب عمله فيها.

## 0. قاعدة التشغيل العامة

- لا نبدأ المنتج الديناميكي قبل تثبيت مسار clone البصري.
- لا نخلط clone مع app components.
- لا نربط backend داخل `/stitch-clone/*`.
- كل مرحلة تغلق ببوابة تحقق قبل الانتقال للتي بعدها.
- أي تغيير في auth/data/API يجب أن يضاف له test أو QA check مناسب.
- أي شاشة محمية لا تعتمد على UI hiding فقط.

## 1. الخطة الكلية المختصرة

1. تثبيت source inventory وPRD وفهرس Spec Kit.
2. إنشاء مشروع Next.js/TypeScript إن لم يكن موجودًا.
3. تنفيذ Stitch clone routes ميكانيكيًا.
4. Playwright visual comparison وإصلاح الفروق.
5. بناء product foundation: routing, RTL, i18n, tokens, layout.
6. بناء core data/auth/permissions/API conventions.
7. تثبيت document storage/upload contract قبل أي upload UI.
8. تثبيت AI Organizer mock والـlegal guardrails.
9. بناء public website/content/contact/legal pages.
10. بناء consultation workflow.
11. بناء admin consultation review ثم convert to case.
12. بناء client portal.
13. بناء admin operations: clients/cases/sessions/calendar/tasks/documents.
14. بناء admin governance: users/settings/audit-log.
15. بناء finance/reports basics بدون payment gateway.
16. بناء content/social workflow.
17. بناء privacy-safe analytics/observability.
18. بناء security/privacy/upload hardening.
19. بناء tests/QA/release docs.

## 2. Phase 0 - تثبيت المصادر والملفات المرجعية

### المهام

- اعتماد `docs/KMT_LEGAL_PLATFORM_PRD.md` كمصدر المنتج.
- اعتماد هذا الملف كمصدر ترتيب التنفيذ.
- إنشاء جدول mapping للشاشات من source إلى route.
- نسخ أو إبقاء assets الأصلية في أماكن يمكن استيرادها منها.
- عدم تعديل `code.html` أو `screen.png` الأصليين إلا إذا طلب المستخدم ذلك صراحة.

### المخرجات

- PRD مكتمل.
- Implementation plan مكتمل.
- قائمة شاشات:
  - 22 شاشة مرقمة `kmt_legal_1..22`.
  - شاشة إضافية `._kmt_legal` لصفحة محامي.

### قبول المرحلة

- كل شاشة مذكورة في PRD.
- كل route clone مقترح موجود في الخطة.
- التعارض بين prompt العام وprompt Stitch clone موثق.

## 3. Phase 1 - Project Foundation

### الهدف

إنشاء تطبيق Next.js صالح للبناء بدون إدخال product logic بعد.

### المهام

- إنشاء Next.js App Router + TypeScript.
- إعداد Tailwind.
- إعداد ESLint/typecheck.
- إعداد structure:

```text
src/
  app/
  components/
  features/
  lib/
  server/
  styles/
  types/
  config/
prisma/
tests/
docs/
```

- إعداد `.gitignore` و`.env.example` بدون secrets.
- إعداد scripts:
  - `dev`
  - `build`
  - `lint`
  - `typecheck`
  - `test`
  - `test:e2e`

### ممنوع في المرحلة

- لا auth حقيقي.
- لا database.
- لا shadcn داخل clone.
- لا تعديل تصميم Stitch.

### قبول المرحلة

- `npm run build` يعمل.
- `npm run lint` يعمل أو blocker موثق.
- صفحة root مؤقتة أو redirect آمن.

## 4. Phase 2 - Stitch Clone Raw Routes

Harness: before starting this phase, use `.agents/skills/stitch-clone-orchestrator/SKILL.md` and `docs/harness/stitch-clone/team-spec.md`.

This phase is split into:

- `PLAN-02A` Stitch Source Inventory & Asset Freeze.
- `PLAN-02B` Raw JSX Mechanical Conversion.
- `PLAN-02C` CSS/Font/Icon/Asset Preservation.
- `PLAN-02D` Playwright Screenshot Capture.
- `PLAN-02E` Visual Difference Review.
- `PLAN-02F` Targeted Parity Fix Loop.
- `PLAN-02G` Final Acceptance Report.

### الهدف

تحويل كل `code.html` إلى JSX route خام بدون dynamic behavior.

### المهام

- إنشاء:

```text
src/app/stitch-clone/[screen-name]/page.tsx
```

- تحويل كل HTML إلى JSX:
  - `class` إلى `className`.
  - `for` إلى `htmlFor`.
  - style objects عند الحاجة فقط.
  - الحفاظ على كل Tailwind classes.
  - الحفاظ على CDN/fonts/material symbols أو استبدالها بطريقة لا تغير الشكل.

- إنشاء routes:
  - `/stitch-clone/home`
  - `/stitch-clone/services`
  - `/stitch-clone/service-corporate-contracts`
  - `/stitch-clone/team`
  - `/stitch-clone/lawyer-profile-karim`
  - `/stitch-clone/book-consultation`
  - `/stitch-clone/case-studies`
  - `/stitch-clone/case-study-commercial-dispute`
  - `/stitch-clone/media`
  - `/stitch-clone/articles`
  - `/stitch-clone/contact`
  - `/stitch-clone/login`
  - `/stitch-clone/portal-dashboard`
  - `/stitch-clone/portal-case-detail`
  - `/stitch-clone/portal-documents`
  - `/stitch-clone/portal-appointments`
  - `/stitch-clone/admin-dashboard`
  - `/stitch-clone/admin-clients`
  - `/stitch-clone/admin-cases`
  - `/stitch-clone/admin-case-detail`
  - `/stitch-clone/admin-calendar`
  - `/stitch-clone/admin-tasks`
  - `/stitch-clone/admin-content-social`

### قبول المرحلة

- كل clone route يفتح بدون runtime error.
- لا route يستخدم backend.
- لا route يستخدم app design components.
- لا route يستخدم shadcn.
- كل clone route يحتفظ بالشكل الأولي للـHTML.

## 5. Phase 3 - Visual QA للـStitch Clone

### الهدف

إثبات أن clone قريب بصريًا من `screen.png` وليس فقط build ناجح.

### المهام

- إعداد Playwright.
- لكل route:
  - افتح route.
  - viewport mobile: `390x844`.
  - viewport desktop: `1440x900` عند وجود reference desktop.
  - التقط screenshot.
  - قارن مع source screenshot.

- وثق الفروق تحت:
  - font.
  - spacing.
  - card size.
  - radius.
  - shadow.
  - background.
  - icon size.
  - alignment.
  - overflow.

- أصلح فقط الفروق المثبتة.

### قبول المرحلة

- ملف/تقرير visual differences موجود.
- كل فرق مرئي جوهري له fix أو سبب واضح.
- لا توجد تغييرات redesign.

## 6. Phase 4 - Product Architecture Foundation

### الهدف

تأسيس بنية المنتج الحقيقي بعد انتهاء clone.

### المهام

- إعداد route groups:

```text
src/app/[locale]/
  (public)/
  portal/
  admin/
```

- إعداد `next-intl` أو i18n structure مشابه.
- Arabic RTL default.
- English LTR ready.
- إعداد semantic tokens من `DESIGN.md`.
- إنشاء product components خارج clone:
  - public layout.
  - dashboard shell.
  - form controls.
  - states.
  - cards/tables/badges.

### قبول المرحلة

- public/admin/portal layouts موجودة.
- RTL يعمل على مستوى document/layout.
- tokens مركزية.
- لا كسر لمسار `/stitch-clone/*`.

## 7. Phase 5 - Database Schema

### الهدف

إنشاء Prisma/PostgreSQL schema لبيانات MVP.

### المهام

- إعداد Prisma.
- إنشاء models:
  - User, Role, Permission, RolePermission.
  - Client, LawyerProfile.
  - LegalService.
  - ConsultationRequest.
  - Appointment.
  - Case, CaseParty, CaseSession.
  - Document.
  - Task.
  - InternalNote.
  - Payment.
  - Article.
  - CaseStudy.
  - SocialPostDraft.
  - Notification.
  - AuditLog.
  - SystemSetting.

- إضافة indexes المذكورة في PRD.
- إضافة soft delete حيث مناسب.
- إعداد seed:
  - roles.
  - permissions.
  - users.
  - lawyers.
  - services.
  - articles.
  - case studies.
  - demo clients/cases/appointments/documents/tasks.

### قبول المرحلة

- `prisma validate` يعمل.
- migration clean database يعمل.
- seed قابل لإعادة التشغيل دون كسر.
- لا توجد بيانات عميل حقيقية.

## 8. Phase 6 - Auth, Roles, Permissions

### الهدف

تأمين كل مسارات portal/admin/actions.

### المهام

- اختيار Auth.js/NextAuth أو secure custom auth.
- تنفيذ login/logout/current user.
- session strategy آمنة.
- permission helper مركزي.
- route protection.
- server action protection.
- denied states:
  - 401 auth required.
  - 403 permission denied.
  - expired session.

### قبول المرحلة

- Client لا يدخل `/admin`.
- Lawyer لا يرى غير assigned cases.
- Client لا يرى case لعميل آخر.
- Admin actions ترفض عند غياب permission.
- negative tests موثقة.

## 9. Phase 7 - API / Server Actions Contracts

### الهدف

تحديد وتنفيذ contract موحد بدل raw fetch/action عشوائي.

ملاحظة مهمة: هذه المرحلة لا تعني تنفيذ كل endpoints دفعة واحدة. المطلوب هنا هو conventions وhelpers وعقود أساسية، ثم يتم توسيع عقود كل feature داخل خطة Spec Kit المالكة لها. هذا يمنع الرجوع إلى نمط "backend كبير أولًا" قبل اختبار الـvertical slices.

### المهام

- إنشاء error helper موحد.
- إنشاء validators بـZod.
- إنشاء service/repository layers.
- تعريف contract skeletons للـpublic queries التي ستكتمل داخل خطط public/booking المالكة لها:
  - services.
  - lawyers.
  - articles.
  - case studies.
  - contact.
  - consultation.
- تعريف contract skeletons للـportal queries/actions التي ستكتمل داخل خطط portal المالكة لها:
  - dashboard.
  - own cases.
  - own documents.
  - upload.
  - own appointments.
  - profile.
- تعريف contract skeletons للـadmin actions التي ستكتمل داخل خطط admin المالكة لها:
  - clients.
  - consultations.
  - cases.
  - sessions.
  - documents.
  - tasks.
  - content.
  - users/roles.
  - audit logs.

### قبول المرحلة

- request/response shape موثق.
- validation errors localized.
- auth/permission checks موجودة في server.
- tests للcontracts الحرجة.

## 10. Phase 8 - Public Website

### الهدف

تحويل الشاشات العامة إلى صفحات منتج حقيقية مبنية على data.

### الصفحات

- Home.
- Services.
- Service detail.
- Team.
- Lawyer profile.
- Case studies.
- Case study detail.
- Media.
- Articles.
- Article detail.
- Contact.
- Privacy.
- Terms.

### قبول المرحلة

- كل صفحة تعرض seeded data.
- search/filter في services/articles/case studies يعمل.
- CTA booking يعمل.
- legal disclaimers موجودة.
- Arabic content واقعي ولا يعد بنتائج قانونية.

## 11. Phase 9 - Consultation Workflow

### الهدف

بناء رحلة حجز استشارة قابلة للاستخدام والتوسع.

### الخطوات

1. اختيار نوع الاستشارة.
2. بيانات التواصل.
3. ملخص القضية والطرف المقابل.
4. اختيار mode/موعد مفضل.
5. Review.
6. Submit.
7. Confirmation.

### AI Organizer

- mock classification.
- mock intake summary.
- mock document checklist.
- label `needs lawyer review`.

### قبول المرحلة

- required fields تعمل.
- المستخدم لا يفقد المدخلات عند الرجوع.
- validation errors مفهومة.
- request يحفظ في DB.
- admin queue يستقبل الطلب.
- لا AI legal advice.

## 12. Phase 10 - Admin Consultation Review

### الهدف

تحويل طلبات الاستشارة إلى عمل مكتبي.

### المهام

- Queue للطلبات.
- عرض AI classification/summary.
- assign lawyer.
- change status: new, reviewing, scheduled, rejected, converted.
- convert to client/case.
- audit log.

### قبول المرحلة

- لا conversion بدون permission.
- لا case بدون client.
- audit log لكل assign/convert/reject.
- conflict check placeholder للطرف المقابل.

## 13. Phase 11 - Client Portal

### الصفحات

- `/portal`
- `/portal/cases/[id]`
- `/portal/documents`
- `/portal/appointments`
- `/portal/payments`
- `/portal/profile`

### المهام

- Dashboard summary.
- Own cases فقط.
- Simplified case detail.
- Documents upload/list/search.
- Appointments list/reschedule/request.
- Basic payments read-only.
- Profile update.

### قبول المرحلة

- كل query scoped بـclientId.
- internal notes غير ظاهرة.
- upload validates size/type.
- invalid access returns 403/404 safe.

## 14. Phase 12 - Admin Dashboard & Operations

### الصفحات

- `/admin`
- `/admin/clients`
- `/admin/cases`
- `/admin/cases/[id]`
- `/admin/calendar`
- `/admin/tasks`
- `/admin/documents`
- `/admin/finance`
- `/admin/reports`
- `/admin/users`
- `/admin/settings`
- `/admin/audit-log`

### المهام

- KPI cards بتعريف واضح.
- Clients CRM search/filter.
- Cases list search/filter/sort/pagination.
- Internal case detail tabs.
- Calendar month/week/day.
- Tasks Kanban.
- Document management.
- Finance basics.
- Users/roles/settings basics.
- Audit log search/filter.

### قبول المرحلة

- كل admin action محمي ومؤرشف.
- search/filter states تعمل.
- empty/loading/error states موجودة.
- لا تسريب بيانات بين roles.

## 15. Phase 13 - Content & Social Hub

### الصفحات

- `/admin/content`
- `/admin/content/articles`
- `/admin/content/case-studies`

### المهام

- Article CRUD workflow.
- Case study anonymization workflow.
- Social post draft workflow.
- AI draft mock.
- legal review approval.
- published content يظهر في public pages.

### قبول المرحلة

- لا case study published بدون approval.
- لا real client names/case numbers.
- social publishing external deferred.
- AI draft marked review required.

## 16. Phase 14 - File Upload & Document Security

### المهام

- object storage abstraction.
- local dev fallback خارج `public/`.
- allowlist types.
- file size limits.
- generated file keys.
- document visibility:
  - client_visible.
  - internal_only.
- download endpoint permission check.

### قبول المرحلة

- invalid type returns `UNSUPPORTED_FILE_TYPE`.
- large file returns `FILE_TOO_LARGE`.
- client لا يفتح internal-only file.
- direct public URLs غير متاحة للملفات الحساسة.

## 17. Phase 15 - Error, Observability, Audit

### المهام

- requestId لكل error.
- structured logs مع redaction.
- audit log service.
- error boundaries.
- production-safe error pages.
- optional Sentry setup لاحقًا.

### قبول المرحلة

- لا stack trace للمستخدم في production.
- لا logging لtokens/cookies/case summaries/document content.
- audit قابل للبحث by actor/resource/action.

## 18. Phase 16 - Analytics

### Events مبدئية

- `consultation_started`
- `consultation_step_completed`
- `consultation_submitted`
- `consultation_converted_to_case`
- `document_upload_succeeded`
- `document_upload_failed`
- `case_study_submitted_for_review`
- `case_study_approved`
- `case_study_published`

### قواعد

- لا PII.
- لا raw legal summary.
- event source واضح: public/portal/admin.
- عدم duplicate events على rerender.

### قبول المرحلة

- events موثقة.
- properties privacy-safe.
- QA يتحقق من عدم تكرار emission.

## 19. Phase 17 - Tests

### Unit/Service

- permission helpers.
- validators.
- consultation service.
- convert consultation to case.
- upload validation.
- content approval rules.

### Integration/API

- auth required.
- permission denied.
- owner scoping.
- validation error shape.

### E2E

- consultation submit.
- admin review/convert.
- client own case/document.
- unauthorized access denied.
- case study approval.

### Visual

- Stitch clone screenshots.
- responsive checks mobile/desktop.

### قبول المرحلة

- typecheck.
- lint.
- build.
- test suite.
- Playwright critical flows.

## 20. Phase 18 - Release Readiness

### المهام

- `.env.example`.
- deployment docs.
- seed instructions.
- smoke checklist.
- security headers plan.
- backup/restore note.
- production start command.
- dependency audit process.

### قبول المرحلة

- مشروع جديد يمكن تشغيله من README/PROJECT_GUIDE.
- لا secrets committed.
- production build موثق.
- known deferred items موثقة.

## 21. قوائم QA لكل نوع شاشة

### Public Pages

- Header links تعمل.
- CTA يفتح booking.
- RTL صحيح.
- mobile لا يكسر النص.
- footer links موجودة.
- no legal outcome promises.

### Forms

- labels لكل input.
- required validation.
- server validation.
- submit loading.
- success state.
- failure state مع retry.
- input preserved on error.

### Dashboards

- loading skeleton.
- empty state.
- permission state.
- search/filter/pagination.
- audit for mutations.
- metrics definitions.

### Files

- drag/drop.
- picker.
- type validation.
- size validation.
- progress.
- failure recovery.
- restricted download.

### AI

- mock deterministic in tests.
- schema validated.
- marked needs review.
- no direct final legal advice.
- no sensitive prompt logs.

## 22. مخاطر يجب مراقبتها

- تحويل Stitch إلى تصميم جديد بدل clone.
- استخدام `shadcn/ui` داخل clone بالخطأ.
- بناء UI فقط بدون data/auth.
- صلاحيات frontend-only.
- file upload داخل `public/`.
- AI output يظهر كنصيحة قانونية.
- case studies تحتوي أسماء أو أرقام حقيقية.
- analytics أو logs تحتوي PII.
- filters/search بدون no-results recovery.
- dashboard metrics بدون تعريف.

## 23. Definition of Done لكل Feature Slice

أي feature لا يعتبر منتهيًا إلا إذا شمل:

- UI.
- state.
- validation.
- API/server action.
- database read/write عند الحاجة.
- auth/permission.
- loading/empty/error/success states.
- tests مناسبة.
- docs أو handoff note.
- QA manual path.
