# حصر المسارات الحالي — KMT Legal

**تاريخ اللقطة:** 2026-07-28  
**نسخة الكود:** `9c6821c2b9a052a97c332053c3d042dc49594caa` (`main`)  
**هدف الإنتاج المفترض:** `https://kmtlegal.org`  
**نطاق الحصر:** كل ملفات `page.tsx` و`route.ts` تحت `src/app`. استُبعدت واجهات Stitch من تقييم المنتج بعد توثيقها، ولم تُستبعد من العد.

## النتيجة المختصرة

| العنصر | العدد | الحكم |
|---|---:|---|
| ملفات الصفحات الفعلية | 70 | مغطاة 100% في هذا الملف |
| ملفات API | 99 | مغطاة 100% في هذا الملف |
| عمليات HTTP المصدرة | 118 | `GET/POST/PATCH`؛ لا توجد عمليات `PUT/DELETE` مصدرة حاليًا |
| أدوار النظام | 7 | Guest, Client, Lawyer, Secretary, Office Admin, Marketing Staff, Super Admin |
| وجهات الداشبورد الأساسية | 19 | محكومة مركزيًا عبر `ADMIN_ROUTE_POLICIES` |

حالة `static verified` تعني أن الملف، الـhandler، الحماية والعقد موجودة وأن اختبارات الوحدة المحلية مرت. لا تعني أن العملية نُفذت على PostgreSQL. حالة `runtime blocked` تعني أن إثبات قاعدة البيانات أو الحسابات الحقيقية لم يكن ممكنًا لغياب بيئة staging في جلسة التدقيق.

## صفحات المنتج

### الإدارة — 27 ملف صفحة

كل المسارات التالية محمية في middleware ثم داخل layout/page؛ البيانات الفعلية تحتاج PostgreSQL. المسارات الديناميكية تتبع سياسة وجهتها الأب.

| المسار | الغرض | الحالة |
|---|---|---|
| `/admin` | مركز العمليات والـKPIs | static verified؛ DB runtime blocked |
| `/admin/consultation-availability` | إعداد توافر الاستشارات | static verified؛ DB runtime blocked |
| `/admin/consultations` | قائمة ومراجعة الاستشارات | static verified؛ DB runtime blocked |
| `/admin/consultations/{consultationId}` | تفاصيل وقرارات الاستشارة | static verified؛ DB runtime blocked |
| `/admin/clients` | CRM العملاء | static verified؛ DB runtime blocked |
| `/admin/clients/{clientId}` | ملف عميل | static verified؛ DB runtime blocked |
| `/admin/messages` | محادثات المكتب | static verified؛ DB runtime blocked |
| `/admin/messages/{threadId}` | تفاصيل محادثة | static verified؛ DB runtime blocked |
| `/admin/cases` | قائمة القضايا | static verified؛ DB runtime blocked |
| `/admin/cases/new` | إنشاء قضية يدويًا | static verified؛ DB runtime blocked |
| `/admin/cases/{caseId}` | تفاصيل وتحديث القضية | static verified؛ DB runtime blocked |
| `/admin/calendar` | الجلسات والمواعيد | static verified؛ DB runtime blocked |
| `/admin/tasks` | المهام | static verified؛ DB runtime blocked |
| `/admin/documents` | المستندات | static verified؛ DB runtime blocked |
| `/admin/finance` | المدفوعات والمالية | static verified؛ DB runtime blocked |
| `/admin/reports` | التقارير | static verified؛ DB runtime blocked |
| `/admin/content` | مركز المحتوى | static verified؛ DB runtime blocked |
| `/admin/content/articles` | المقالات | static verified؛ DB runtime blocked |
| `/admin/content/case-studies` | دراسات الحالة | static verified؛ DB runtime blocked |
| `/admin/content/social` | مسودات السوشيال | static verified؛ DB runtime blocked |
| `/admin/contact-messages` | رسائل التواصل | static verified؛ DB runtime blocked |
| `/admin/notifications` | مركز الإشعارات | static verified؛ DB runtime blocked |
| `/admin/users` | المستخدمون | static verified؛ Super Admin فقط |
| `/admin/users/{userId}` | تفاصيل المستخدم | static verified؛ Super Admin فقط |
| `/admin/roles` | الصلاحيات والأدوار | static verified؛ Super Admin فقط |
| `/admin/settings` | الإعدادات | static verified؛ Super Admin فقط |
| `/admin/audit-log` | سجل التدقيق | static verified؛ Super Admin فقط |

### بوابة العميل — 8 صفحات أساسية و7 aliases

| المسار | الغرض | الحالة |
|---|---|---|
| `/client` | ملخص حساب العميل | canonical؛ own-scope؛ runtime blocked |
| `/client/cases` | قضايا العميل | canonical؛ own-scope؛ runtime blocked |
| `/client/cases/{caseId}` | تفاصيل قضية العميل | canonical؛ own-scope؛ runtime blocked |
| `/client/court-dates` | مواعيد وجلسات العميل | canonical؛ own-scope؛ runtime blocked |
| `/client/files` | ملفات العميل | canonical؛ own/client-visible scope؛ runtime blocked |
| `/client/payments` | مدفوعات العميل | canonical؛ own-scope؛ runtime blocked |
| `/client/assistant` | مساعد العميل ومحادثاته | canonical؛ own-scope؛ runtime blocked |
| `/client/profile` | الملف الشخصي | canonical؛ self-scope؛ runtime blocked |
| `/portal` | توافق قديم | alias → `/client` |
| `/portal/cases` | توافق قديم | alias → `/client/cases` |
| `/portal/cases/{caseId}` | توافق قديم | alias → `/client/cases/{caseId}` |
| `/portal/appointments` | توافق قديم | alias → `/client/court-dates` |
| `/portal/documents` | توافق قديم | alias → `/client/files` |
| `/portal/payments` | توافق قديم | alias → `/client/payments` |
| `/portal/profile` | توافق قديم | alias → `/client/profile` |

### الدخول والتثبيت والواجهات التجريبية — 9 صفحات

| المسار | التصنيف | الحالة |
|---|---|---|
| `/login` | دخول | يعمل محليًا؛ المصادقة الفعلية تحتاج DB |
| `/login/2fa` | ميزة مؤجلة | `notFound()` عمدًا؛ 2FA disabled |
| `/install` | تثبيت | gated بواسطة `INSTALLER_ENABLED` وحالة القفل |
| `/stitch-clone/{screen-name}` | مرجع بصري | تطوير فقط افتراضيًا؛ ليس من منتج التشغيل |
| `/product-system` | showcase داخلي | يعمل ببيانات mock؛ مكشوف للعامة في الكود الحالي |
| `/product-system/cases` | showcase داخلي | mock؛ مكشوف للعامة |
| `/product-system/clients` | showcase داخلي | mock؛ مكشوف للعامة |
| `/product-system/documents` | showcase داخلي | mock؛ مكشوف للعامة |
| `/product-system/settings` | showcase داخلي | mock؛ مكشوف للعامة |

### الموقع العام — 19 ملف صفحة

| المسار | الغرض | الحالة |
|---|---|---|
| `/` | الرئيسية EN | browser verified |
| `/services` | الخدمات EN | browser verified |
| `/services/{slug}` | تفاصيل خدمة EN | browser verified لعينة الروابط |
| `/team` | المحامون EN | browser verified |
| `/team/{slug}` | تفاصيل محامٍ EN | browser verified لعينة الروابط |
| `/articles` | المقالات EN | browser verified؛ المحتوى الديناميكي يحتاج DB |
| `/articles/{slug}` | مقال EN | static verified؛ DB content blocked |
| `/case-studies` | دراسات الحالة EN | browser verified؛ المحتوى الديناميكي يحتاج DB |
| `/case-studies/{slug}` | دراسة حالة EN | static verified؛ DB content blocked |
| `/media` | المركز الإعلامي EN | browser verified |
| `/contact` | التواصل EN | UI/error path browser verified؛ نجاح DB blocked |
| `/book-consultation` | الحجز EN | UI/error path browser verified؛ نجاح DB/payment blocked |
| `/privacy` | الخصوصية EN | browser verified |
| `/terms` | الشروط EN | browser verified |
| `/ar/{path...?}` | catch-all عربي | يقدّم الرئيسية، الخدمات، الفريق، المقالات، دراسات الحالة، الإعلام، التواصل، الحجز، الخصوصية والشروط وتفاصيلها؛ browser verified للوجهات الأساسية |
| `/ar/book-consultation` | الحجز AR الصريح | browser verified |
| `/client-account/setup` | إعداد حساب العميل | static verified؛ token/DB runtime blocked |
| `/payment/consultation/return` | عودة بوابة الدفع | static verified؛ gateway runtime blocked |
| `/payment/consultation/receipt` | إيصال الاستشارة | static verified؛ payment runtime blocked |

## واجهات API — 99 ملفًا / 118 عملية

### Admin — 63 ملف API

كل الصفوف التالية محمية بالمصادقة والصلاحية داخل الـAPI، ولا تعتمد على إخفاء الزر فقط. الحكم المشترك: **static/unit verified؛ DB runtime blocked**، باستثناء reset 2FA المعطل عمدًا.

| المسار | الطرق | المجال |
|---|---|---|
| `/api/admin/audit-log` | GET | audit |
| `/api/admin/calendar` | GET, POST | calendar/session |
| `/api/admin/calendar/{appointmentId}/reschedule` | POST | calendar/session |
| `/api/admin/cases` | GET, POST | cases |
| `/api/admin/cases/{caseId}` | GET, PATCH | cases |
| `/api/admin/cases/{caseId}/sessions` | POST | cases/session |
| `/api/admin/cases/{caseId}/status` | POST | cases |
| `/api/admin/clients` | GET, POST | CRM |
| `/api/admin/clients/{clientId}` | GET, PATCH | CRM |
| `/api/admin/clients/{clientId}/account` | POST | CRM/account |
| `/api/admin/clients/{clientId}/account/password` | POST | CRM/account |
| `/api/admin/clients/{clientId}/archive` | POST | CRM |
| `/api/admin/clients/{clientId}/assign` | POST | CRM |
| `/api/admin/consultation-availability` | GET, PATCH | consultations |
| `/api/admin/consultations` | GET | consultations |
| `/api/admin/consultations/{consultationId}` | GET | consultations |
| `/api/admin/consultations/{consultationId}/assign` | POST | consultations |
| `/api/admin/consultations/{consultationId}/convert` | POST | consultations/case |
| `/api/admin/consultations/{consultationId}/outcome` | POST | consultations |
| `/api/admin/consultations/{consultationId}/reject` | POST | consultations |
| `/api/admin/consultations/{consultationId}/reopen` | POST | consultations |
| `/api/admin/consultations/{consultationId}/review` | POST | consultations |
| `/api/admin/consultations/{consultationId}/schedule` | POST | consultations/calendar |
| `/api/admin/contact-messages` | GET | contacts |
| `/api/admin/contact-messages/{messageId}` | PATCH | contacts |
| `/api/admin/content` | GET | content |
| `/api/admin/content/articles` | POST | content |
| `/api/admin/content/articles/{articleId}` | GET, PATCH | content |
| `/api/admin/content/case-studies` | POST | content |
| `/api/admin/content/case-studies/{caseStudyId}` | GET, PATCH | content |
| `/api/admin/content/social-drafts` | POST | content |
| `/api/admin/content/social-drafts/{draftId}` | GET, PATCH | content |
| `/api/admin/content/social-drafts/ai` | POST | content/AI |
| `/api/admin/dashboard` | GET | command center |
| `/api/admin/documents` | GET | documents |
| `/api/admin/documents/{documentId}` | PATCH | documents |
| `/api/admin/documents/{documentId}/delete` | POST | documents |
| `/api/admin/finance` | GET, POST | finance |
| `/api/admin/finance/{paymentId}` | GET, PATCH | finance |
| `/api/admin/finance/export` | GET | finance/export |
| `/api/admin/messages` | GET | conversations |
| `/api/admin/messages/{threadId}` | GET, PATCH | conversations |
| `/api/admin/messages/{threadId}/messages` | POST | conversations |
| `/api/admin/notifications` | GET | notifications |
| `/api/admin/notifications/{notificationId}/read` | POST | notifications |
| `/api/admin/payments/attempts` | GET | payments |
| `/api/admin/payments/pricing` | GET, POST | payments |
| `/api/admin/payments/pricing/{ruleId}` | PATCH | payments |
| `/api/admin/payments/settings` | GET, PATCH | payments |
| `/api/admin/payments/webhooks` | GET | payments |
| `/api/admin/payments/webhooks/{eventId}/replay` | POST | payments |
| `/api/admin/reports` | GET | reports |
| `/api/admin/roles` | GET | roles |
| `/api/admin/roles/{roleId}/permissions` | PATCH | roles |
| `/api/admin/settings` | GET | settings |
| `/api/admin/settings/{key}` | PATCH | settings |
| `/api/admin/tasks` | GET, POST | tasks |
| `/api/admin/tasks/{taskId}` | PATCH | tasks |
| `/api/admin/users` | GET, POST | users |
| `/api/admin/users/{userId}` | GET, PATCH | users |
| `/api/admin/users/{userId}/client-profile` | POST | users/client |
| `/api/admin/users/{userId}/password` | POST | users |
| `/api/admin/users/{userId}/2fa/reset` | POST | **503 FEATURE_DISABLED عمدًا** |

### Auth, client, files, health, installer — 19 ملف API

| المسار | الطرق | الحالة |
|---|---|---|
| `/api/auth/login` | POST | static/unit verified؛ DB runtime blocked |
| `/api/auth/logout` | POST | static/unit verified؛ DB runtime blocked |
| `/api/auth/me` | GET | static/unit verified؛ DB runtime blocked |
| `/api/auth/2fa/email/send` | POST | 503 `FEATURE_DISABLED` عمدًا |
| `/api/auth/2fa/email/verify` | POST | 503 `FEATURE_DISABLED` عمدًا |
| `/api/auth/2fa/totp/verify` | POST | 503 `FEATURE_DISABLED` عمدًا |
| `/api/client/assistant` | POST | authenticated client/own scope؛ runtime blocked |
| `/api/client/messages` | GET, POST | authenticated client/own scope؛ runtime blocked |
| `/api/client/messages/{threadId}` | GET | authenticated client/own scope؛ runtime blocked |
| `/api/client/messages/{threadId}/messages` | POST | authenticated client/own scope؛ runtime blocked |
| `/api/files/{documentId}/download` | GET | permission + object scope؛ runtime blocked |
| `/api/files/upload` | POST | permission + ownership/assignment؛ storage runtime blocked |
| `/api/health` | GET | implemented؛ local source/unit verified |
| `/api/install/status` | GET | installer-gated |
| `/api/install/preflight` | POST | installer token/lock-gated |
| `/api/install/bootstrap-super-admin` | POST | installer token/lock-gated |
| `/api/install/finish` | POST | installer token/lock-gated |
| `/api/portal/profile` | GET, PATCH | Client self-scope؛ runtime blocked |
| `/api/analytics/events` | POST | public telemetry contract؛ local tests verified |

### Public and webhooks — 17 ملف API

| المسار | الطرق | الحالة |
|---|---|---|
| `/api/public/services` | GET | static data؛ local verified |
| `/api/public/services/{slug}` | GET | static data؛ local verified |
| `/api/public/lawyers` | GET | static data؛ local verified |
| `/api/public/lawyers/{slug}` | GET | static data؛ local verified |
| `/api/public/articles` | GET | DB-backed؛ runtime blocked |
| `/api/public/articles/{slug}` | GET | DB-backed؛ runtime blocked |
| `/api/public/case-studies` | GET | DB-backed؛ runtime blocked |
| `/api/public/case-studies/{slug}` | GET | DB-backed؛ runtime blocked |
| `/api/public/contact` | POST | validation/error path browser verified؛ success DB blocked |
| `/api/public/consultations` | POST | validation/error path browser verified؛ success DB blocked |
| `/api/public/consultations/assistant` | POST | UI consumer موجود؛ tests verified؛ success DB/AI blocked |
| `/api/public/consultations/checkout` | POST | payment config/DB runtime blocked |
| `/api/public/consultations/slots` | GET | DB-backed؛ runtime blocked |
| `/api/public/client-account/setup` | POST | token/DB runtime blocked |
| `/api/public/payments/status` | GET | DB/payment runtime blocked |
| `/api/webhooks/paymob` و`/api/webhooks/paytabs` | POST لكل منهما | signature/config/DB runtime blocked |

## ملاحظات اتساق الحصر

- عمليتا `GET` في `/api/public/services` و`/api/public/lawyers` متزامنتان وليستا `async`؛ لذلك أي scanner يبحث عن `export async function` فقط سيعطي 116 بدل العدد الصحيح 118.
- `/portal` مسار توافق وليس بوابة مستقلة؛ مصدر الحقيقة الحالي هو `/client`.
- catch-all العربي يوسع ملف صفحة واحدًا إلى عدة وجهات منطقية. نسبة 100% هنا تخص ملفات الصفحات ووجهات المنتج المعروفة معًا.
- عقود `route-manifest-contract` وPLAN-35 تطابق مجموعة العمليات الموثقة مع ملفات handlers، لكن لا تغني عن تشغيل قاعدة البيانات.
