# أدلة التشغيل

**وقت التنفيذ:** 2026-07-28، timezone `Africa/Cairo`  
**نسخة الكود:** `9c6821c2b9a052a97c332053c3d042dc49594caa`  
**الجهاز:** Windows، Node `v24.11.1`، Chromium عبر Playwright  
**مبدأ السلامة:** لا بيانات عملاء، لا mutations على الإنتاج، ولا أسرار حقيقية.

## جاهزية البيئة

| المتغير/الخدمة | النتيجة |
|---|---|
| `DATABASE_URL` | غير مضبوط |
| `KMT_LIVE_BASE_URL` | غير مضبوط |
| `KMT_LIVE_ADMIN_EMAIL` | غير مضبوط |
| `KMT_LIVE_ADMIN_PASSWORD` | غير مضبوط |
| `KMT_DB_E2E` | غير مضبوط |
| `UPLOADS_DIR` | غير مضبوط |
| Docker | غير متاح |
| هدف الإنتاج المفترض | `https://kmtlegal.org`؛ لم يمكن الوصول إليه من أدوات الجلسة |

هذه الحدود تمنع إثبات DB-backed flows، role matrix على حسابات فعلية، storage، الدفع وlive production. لم تُستبدل هذه الاختبارات بنتائج mocks.

## سجل الأوامر

### `npm run qa:local`

| المرحلة | النتيجة |
|---|---|
| `prisma validate` | PASS — schema valid |
| `prisma generate` | PASS — Prisma Client 7.8.0 |
| `tsc --noEmit` | PASS |
| `next lint` | PASS — لا warnings أو errors |
| `vitest run` | PASS — 60 files، 424 tests |
| `next build` | **FAIL** |

فشل build أثناء `Collecting page data`:

```text
Error: DATABASE_URL is required in production.
Failed to collect page data for
/api/admin/calendar/[appointmentId]/reschedule
```

**التفسير:** فشل release gate حقيقي في هذه البيئة. لا يثبت خطأً في query نفسه، لكنه يثبت أن build لا يكتمل دون إعداد قاعدة البيانات الإنتاجية.

### `npm run test:e2e:smoke`

**PASS — 48/48** خلال نحو 3.5 دقائق.

التغطية المثبتة:

- 14 وجهة عامة/خاصة تجريبية حملت بلا console errors.
- العربية الاختيارية `/ar`, `/ar/services`, `/ar/contact`, `/ar/book-consultation`.
- security headers على الاستجابة الرئيسية.
- رابط دخول العميل.
- privacy disclosures.
- mobile header وتبديل اللغة.
- 9 صفحات EN و5 صفحات AR على عرض 390px بلا horizontal overflow.
- dark/luxury surfaces على desktop/mobile.
- contact error + `requestId`.
- booking validation + analytics + `requestId`.
- favicon.
- عدم عرض روابط article/case-study قديمة دون DB.
- تحويل anonymous من admin/client/portal إلى login.
- رفض cross-origin mutation قبل تنفيذ handler.

أثبت التشغيل أيضًا:

- `/product-system` أعاد `200` للزائر.
- `/stitch-clone/home` أعاد `200` في بيئة التطوير، وهو السلوك المقصود قبل production gate.

### `npm run test:e2e:plan35`

**PARTIAL — 17 passed، 13 skipped**.

نجح:

- shell accessibility.
- عدم duplicate IDs أو broken label/help/error references.
- keyboard modal behavior، focus containment، Escape، focus restore.
- RTL inline-start.
- target size 44×44.
- region accessible names.
- breakpoint 1023/1024.
- no overflow وvisual baseline على 1440، 1024، 1023، 390، 320.

تخطى الاختبار:

- 5 أدوار × route/API discovery matrix.
- 5 أدوار × dashboard payload/drill-down.
- loader failure recovery.
- contact-to-triage.
- notification pagination.

سبب التخطي هو عدم وجود DB fixtures المجهزة، لا نجاح هذه الحالات.

### `public-luxury-visual.spec.ts`

الأمر:

```text
node scripts/run-playwright-with-server.mjs
tests/e2e/public-luxury-visual.spec.ts --workers=1
```

**FAIL overall — 80 passed، 1 failed بسبب timeout**.

- 16 hero asset/crop checks نجحت.
- 36 screenshot/no-overflow checks نجحت: 18 سطحًا × desktop/mobile.
- reduced-motion checks نجحت.
- hover/focus overflow checks نجحت.
- RTL arrow direction وعودة EN إلى LTR نجحا.
- اختبار internal links تجاوز 60 ثانية أثناء cold compilation. سجل الشبكة يوضح أن آخر طلب ظاهر `/ar/privacy` عاد `200 OK` قبل التخلص من request context. لذلك لا يوجد دليل على رابط 4xx/5xx، لكن الاختبار يظل FAIL ويحتاج تقسيمًا أو timeout محسوبًا.

ملفات الصور المحلية موجودة تحت:

```text
.playwright/test-results/**/plan28-*-desktop.png
.playwright/test-results/**/plan28-*-mobile.png
```

أمثلة:

- `plan28-home-desktop.png`
- `plan28-home-mobile.png`
- `plan28-home-ar-desktop.png`
- `plan28-home-ar-mobile.png`
- `plan28-book-consultation-desktop.png`
- `plan28-book-consultation-ar-mobile.png`

المجلد `.playwright/` مستبعد من Git؛ الصور أدلة تشغيل محلية قابلة لإعادة التوليد وليست assets للمنتج.

أثر الفشل محفوظ في:

```text
.playwright/test-results/public-luxury-visual-PLAN--342eb-signed-entry-points-resolve-chromium/
  error-context.md
  trace.zip
```

### `npm run test:e2e:live-admin`

**2 skipped**. لا توجد `KMT_LIVE_BASE_URL` وبيانات حساب admin وهمي. لم يُفحص production authenticated.

### `npm run qa:db`

**BLOCKED قبل التنفيذ**:

```text
qa:db/qa:release requires DATABASE_URL to point at a real PostgreSQL database.
```

لا migrations/seed/DB E2E نُفذت.

### `npm run security:secrets`

**PASS**:

```text
No high-confidence secret patterns found.
```

## Console وNetwork

| الدليل | النتيجة |
|---|---|
| console errors للصفحات العامة في smoke | لا أخطاء |
| root security headers | موجودة |
| cross-origin mutation | rejected |
| contact/booking failure response | safe message + requestId |
| internal-link HTTP | كل الطلبات الظاهرة < 400؛ suite timeout قبل اكتمال assertion loop |
| production network | غير متاح من الجلسة |

الرؤوس المرصودة تشمل CSP، `X-Content-Type-Options: nosniff`، `X-Frame-Options: DENY`، `Referrer-Policy` و`Permissions-Policy`.

## أدلة المطابقة الساكنة

| المجال | الاختبارات/المصادر |
|---|---|
| 99 route files والعقود | `route-manifest-contract.test.ts`, `plan35-contract-inventory.test.ts` |
| 19 admin routes | `admin-route-policy.ts`, admin route policy tests |
| dashboard counts/scopes/links | `admin-dashboard.test.ts`, `admin-command-center.test.tsx` |
| client ownership | `portal-access.test.ts`, client portal service |
| cases/clients/tasks/docs | admin domain service tests |
| roles/users/settings/audit | admin governance and role-permission tests |
| consultations | consultation contract/review/outcome tests |
| payment | payment service/settings/pricing/webhook tests |
| auth/session/security | auth core/routing/security hardening tests |

## استعلامات المطابقة المطلوبة على staging

لم تُنفذ الاستعلامات التالية. عند تجهيز staging يجب تشغيلها عند `generatedAt` واحد وبنفس actor:

1. عدد مواعيد اليوم بحدود Cairo ومقارنته ببطاقة `appointments.today`.
2. المهام قبل cutoff وبنطاق actor/case-assigned ومقارنتها بـ`tasks.overdue`.
3. حالات consultations الستة ومقارنة كل count مع filter href.
4. `contacts.new`, `documents.under-review`, `cases.active`, `clients.active`.
5. التأكد أن أول 6 عناصر في كل priority queue هي نفس نتائج صفحة drill-down بنفس sort.
6. صف owned وصف foreign لكل Client.
7. صف assigned وصف unassigned لكل Lawyer.
8. allow/deny لكل operation حساسة في `03-role-action-matrix.csv`.
9. audit row وnotification side effect بعد كل mutation ناجحة.
10. payment attempt/webhook/status/receipt reconciliation على sandbox provider.

## حكم معايير القبول

| المعيار | النتيجة |
|---|---|
| 100% ملفات الصفحات والـAPI | PASS static inventory |
| الأدوار السبعة و19 وجهة | PASS static matrix |
| Desktop/Mobile/RTL public | PASS |
| successful + denied path لكل عملية حساسة | BLOCKED — DB/staging |
| UI + API + data effect قبل وصف “يعمل” | مطبق في الأحكام؛ لا ادعاء runtime غير مثبت |
| “غير مستخدم” بدليل | PASS للمرشحين الأربعة |
| production read-only audit | BLOCKED — access/live env |

