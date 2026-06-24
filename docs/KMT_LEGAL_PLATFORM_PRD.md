# KMT Legal Platform PRD

تاريخ الإصدار: 2026-06-23

## 1. الهدف

بناء MVP إنتاجي لمنصة قانونية حديثة باسم `KMT Legal Platform` تخدم مكتب محاماة متعدد المحامين، مع فصل واضح بين مسارين:

1. **مسار Stitch Visual Clone**: نسخ شاشات Stitch كما هي بصريًا بدون تحسين أو إعادة تصميم أو ربط Backend.
2. **مسار المنتج الحقيقي**: بناء منصة متكاملة تشمل الموقع العام، الحجز، بوابة العميل، لوحة المكتب، CRM، إدارة القضايا، المستندات، المواعيد، المحتوى، الصلاحيات، والاختبارات.

القاعدة الحاكمة: لا يتم تحويل Stitch إلى Design System أو شاشات ديناميكية قبل اكتمال clone بصري قريب جدًا من المرجع.

## 2. مصادر الحقيقة التي تمت مراجعتها

- `C:\Users\SOUQ\.codex\attachments\e290c75e-6f9b-40da-abd8-0ec525575582\pasted-text.txt`
- `D:\kmt legal\kmt legal office\stitch_kmt_legal_platform_ui_system\kmt_legal_design_system\DESIGN.md`
- `D:\kmt legal\kmt legal office\stitch_kmt_legal_platform_ui_system\kmt_legal_1` إلى `kmt_legal_22`
- `D:\kmt legal\kmt legal office\stitch_kmt_legal_platform_ui_system\._kmt_legal`

ملاحظة مهمة: الموجود حاليًا في المشروع هو exports من Stitch فقط، ولا يوجد تطبيق Next.js فعلي داخل هذا المجلد حتى الآن.

## 3. ترتيب أولوية المتطلبات عند التعارض

1. **مطابقة Stitch المرئية** لشاشات clone تتغلب على أي قاعدة تصميم عامة.
2. داخل clone: ممنوع `shadcn/ui`، ممنوع مكونات التطبيق، ممنوع ترجمة التصميم للنظام الحالي، وممنوع التعديل على spacing/radius/colors/typography/layout/shadows/classes.
3. بعد clone: يسمح ببناء Design System حقيقي للمنتج، مع الاستفادة من tokens الموجودة في `DESIGN.md` وشكل Stitch، لكن بدون كسر شاشة clone.
4. أي AI output يجب أن يكون مساعدًا للتنظيم والفرز فقط، وليس نصيحة قانونية نهائية.
5. أي صفحة محمية أو Action محمي يجب أن يفرض auth/permission server-side، وليس فقط إخفاء زر في الواجهة.

## 4. نطاق المنتج

### داخل MVP

- موقع عام عربي RTL مع قابلية English لاحقًا.
- حجز استشارة بمساعدة AI Organizer mock.
- تسجيل دخول وحماية جلسات وصلاحيات.
- بوابة عميل لعرض القضايا والمستندات والمواعيد والمدفوعات الأساسية.
- لوحة مكتب داخلية للـCRM والقضايا والجلسات والمهام والمحتوى.
- إدارة مستندات آمنة مع رفع وفحص نوع/حجم الملفات.
- Workflow محتوى ومقالات ودراسات حالة مجهولة.
- Audit logs لكل إجراء إداري حساس.
- Prisma/PostgreSQL schema وقابلية seed.
- اختبارات للرحلات الحرجة وPlaywright للتطابق البصري.

### خارج MVP

- بوابة دفع حقيقية.
- تكامل نشر Facebook/TikTok حقيقي.
- OCR أو RAG حقيقي للمستندات.
- تكامل المحاكم.
- SMS provider حقيقي.
- Mobile app.
- SaaS multi-tenancy/billing.

## 5. المستخدمون

| المستخدم | الهدف الرئيسي | قيود/حماية |
|---|---|---|
| الزائر | فهم الخدمات، قراءة المحتوى، حجز استشارة | لا يرى بيانات خاصة |
| العميل المحتمل | إرسال طلب استشارة وملخص قضية | AI preliminary فقط |
| العميل الحالي | متابعة قضاياه ومستنداته ومواعيده ومدفوعاته | own data فقط |
| المحامي | إدارة القضايا والجلسات والملاحظات المخصصة له | assigned scope إلا إذا لديه صلاحية أوسع |
| Office Admin | إدارة العملاء والقضايا والمواعيد والوثائق والمهام | audit لكل إجراء |
| Marketing Staff | إدارة المقالات والسوشيال ودراسات الحالة | لا نشر بدون legal approval |
| Super Admin | إدارة المستخدمين والصلاحيات والإعدادات والسجلات | وصول كامل ومراقب |

## 6. نموذج الصلاحيات

نمط التسمية:

```text
resource.action.scope
```

أمثلة:

- `case.read.assigned`
- `case.read.any`
- `case.update.assigned`
- `case.update.any`
- `document.upload.self`
- `document.read.own`
- `document.read.assigned`
- `client.read.any`
- `appointment.create.self`
- `appointment.manage.any`
- `content.create.any`
- `content.approve.any`
- `audit.read.any`
- `settings.manage.any`

كل Route محمي وكل Server Action/Route Handler محمي يجب أن ينفذ:

- Authentication check.
- Permission check.
- Ownership/resource-scope check.
- Audit log عند الإجراء الحساس.
- Error response موحد عند الرفض.

## 7. بنية المعلومات والRoutes

### Public

- `/`
- `/services`
- `/services/[slug]`
- `/team`
- `/team/[slug]`
- `/book-consultation`
- `/case-studies`
- `/case-studies/[slug]`
- `/media`
- `/articles`
- `/articles/[slug]`
- `/contact`
- `/login`
- `/privacy`
- `/terms`

### Client Portal

- `/portal`
- `/portal/cases/[id]`
- `/portal/documents`
- `/portal/appointments`
- `/portal/payments`
- `/portal/profile`

### Internal Dashboard

- `/admin`
- `/admin/clients`
- `/admin/clients/[id]`
- `/admin/cases`
- `/admin/cases/[id]`
- `/admin/calendar`
- `/admin/tasks`
- `/admin/documents`
- `/admin/consultations`
- `/admin/content`
- `/admin/content/articles`
- `/admin/content/case-studies`
- `/admin/finance`
- `/admin/reports`
- `/admin/users`
- `/admin/settings`
- `/admin/audit-log`

### Error Pages

- `401`
- `403`
- `404`
- `500`

## 8. Stitch Clone Route Contract

Harness: Stitch clone execution is governed by `.agents/skills/stitch-clone-orchestrator/SKILL.md` and `docs/harness/stitch-clone/team-spec.md`.

PLAN-02 sub-plans:

- `PLAN-02A` Stitch Source Inventory & Asset Freeze.
- `PLAN-02B` Raw JSX Mechanical Conversion.
- `PLAN-02C` CSS/Font/Icon/Asset Preservation.
- `PLAN-02D` Playwright Screenshot Capture.
- `PLAN-02E` Visual Difference Review.
- `PLAN-02F` Targeted Parity Fix Loop.
- `PLAN-02G` Final Acceptance Report.

كل شاشة Stitch يتم تحويلها إلى route خام:

```text
/src/app/stitch-clone/[screen-name]/page.tsx
```

قواعد التنفيذ:

- تحويل `code.html` إلى JSX ميكانيكيًا.
- استيراد CSS/Tailwind config الأصلي كما هو.
- الحفاظ على Google fonts وMaterial Symbols أو assets الموجودة.
- عدم استخدام `shadcn/ui`.
- عدم استخدام مكونات التطبيق.
- عدم ربط backend.
- عدم جعل البيانات dynamic.
- عدم حذف classes أو تبسيطها.
- عدم تعديل spacing/radius/shadows/colors/layout إلا لإصلاح فرق مرئي مثبت بالسكرينشوت.

بوابات القبول:

- تشغيل الشاشة على viewport المرجع.
- التقاط screenshots بــPlaywright.
- مقارنة implementation screenshot مع `screen.png`.
- تسجيل الفروق في font/spacing/card size/radius/shadow/background/icon/alignment/overflow.
- إصلاح الفروق فقط، ثم إعادة المقارنة.

## 9. Inventory الشاشات ومطابقة Routes

| Source | Clone route المقترح | Product route لاحقًا | المهمة الأساسية |
|---|---|---|---|
| `kmt_legal_21` | `/stitch-clone/home` | `/` | Home/public landing |
| `kmt_legal_20` | `/stitch-clone/services` | `/services` | قائمة الخدمات والفلاتر |
| `kmt_legal_18` | `/stitch-clone/service-corporate-contracts` | `/services/[slug]` | تفاصيل خدمة الشركات والعقود |
| `kmt_legal_1` | `/stitch-clone/team` | `/team` | قائمة الفريق |
| `._kmt_legal` | `/stitch-clone/lawyer-profile-karim` | `/team/[slug]` | صفحة محامي وحجز موعد |
| `kmt_legal_22` | `/stitch-clone/book-consultation` | `/book-consultation` | اختيار نوع الاستشارة |
| `kmt_legal_19` | `/stitch-clone/case-studies` | `/case-studies` | قائمة دراسات حالة مجهولة |
| `kmt_legal_17` | `/stitch-clone/case-study-commercial-dispute` | `/case-studies/[slug]` | تفاصيل دراسة حالة |
| `kmt_legal_16` | `/stitch-clone/media` | `/media` | المركز الإعلامي |
| `kmt_legal_15` | `/stitch-clone/articles` | `/articles` | قائمة المقالات |
| `kmt_legal_14` | `/stitch-clone/contact` | `/contact` | بيانات الفروع ونموذج التواصل |
| `kmt_legal_6` | `/stitch-clone/login` | `/login` | تسجيل الدخول |
| `kmt_legal_13` | `/stitch-clone/portal-dashboard` | `/portal` | Dashboard العميل |
| `kmt_legal_10` | `/stitch-clone/portal-case-detail` | `/portal/cases/[id]` | تفاصيل قضية للعميل |
| `kmt_legal_11` | `/stitch-clone/portal-documents` | `/portal/documents` | مستندات العميل |
| `kmt_legal_12` | `/stitch-clone/portal-appointments` | `/portal/appointments` | مواعيد العميل |
| `kmt_legal_9` | `/stitch-clone/admin-dashboard` | `/admin` | لوحة المكتب |
| `kmt_legal_5` | `/stitch-clone/admin-clients` | `/admin/clients` | CRM العملاء |
| `kmt_legal_8` | `/stitch-clone/admin-cases` | `/admin/cases` | إدارة القضايا |
| `kmt_legal_7` | `/stitch-clone/admin-case-detail` | `/admin/cases/[id]` | تفاصيل قضية داخلية |
| `kmt_legal_2` | `/stitch-clone/admin-calendar` | `/admin/calendar` | المواعيد والجلسات |
| `kmt_legal_4` | `/stitch-clone/admin-tasks` | `/admin/tasks` | Kanban المهام |
| `kmt_legal_3` | `/stitch-clone/admin-content-social` | `/admin/content` | المحتوى والسوشيال |

## 10. المتطلبات التفصيلية لكل شاشة

### 10.1 Home - `kmt_legal_21`

الهدف: تقديم المكتب كمنصة قانونية حديثة وبناء ثقة أولية وتحريك المستخدم إلى الحجز أو معرفة الفريق.

العناصر:

- Header: `Practice Areas`, `Our Team`, `Insights`, `Contact`, search, notifications, `EN`, `Book Consultation`.
- Hero: اسم/وصف المنصة، زر `احجز استشارة`, زر `تعرف على فريقنا`.
- AI assistant panel بعنوان `المساعد القانوني الذكي`.
- مجالات التخصص: قضايا الشركات، الأسرة، الجنائي، العقارات، صياغة العقود، التحصيل التجاري.
- روابط سريعة وفوتر.

التفاعلات:

- Search icon يفتح بحث عام لاحقًا.
- Notifications تظهر icon فقط في clone، وتتحول لاحقًا لمدخل تنبيهات للمستخدمين المسجلين.
- `EN` يبدل اللغة لاحقًا.
- `Book Consultation` و`احجز استشارة` يوجهان إلى `/book-consultation`.
- `تعرف على فريقنا` يوجه إلى `/team`.
- كروت التخصص توجه إلى `/services/[slug]`.

### 10.2 Services - `kmt_legal_20`

الهدف: تمكين الزائر من العثور على خدمة قانونية مناسبة.

العناصر:

- Search field: `ابحث عن خدمة قانونية...`.
- Filters: `الكل`, `أفراد`, `شركات`, `عقارات`, `أسرة`, `جنائي`, `تجاري`.
- Cards: القانون الجنائي، تأسيس الشركات، قانون الأسرة، القانون العقاري، صياغة العقود، التقاضي وفض المنازعات.
- CTA: `غير متأكد من الخدمة المناسبة؟` مع زر `ابدأ بتحديد نوع الاستشارة`.

التفاعلات:

- الفلاتر تغير القائمة لاحقًا بدون فقد search.
- `اعرف التفاصيل` يفتح service detail.
- AI helper CTA يفتح booking flow.
- No results state يعرض `ابدأ بتحديد نوع الاستشارة` كمسار إنقاذ.

### 10.3 Service Detail - `kmt_legal_18`

الهدف: شرح خدمة `قضايا الشركات والعقود التجارية` وتحويل المستخدم للحجز.

العناصر:

- Breadcrumb: `الرئيسية` / `خدماتنا`.
- Sections: تأسيس وهيكلة الشركات، صياغة ومراجعة العقود، النزاعات التجارية، الحوكمة والامتثال.
- Process: الاستشارة المبدئية، جمع المستندات والتحليل، التنفيذ والمتابعة.
- CTA: `احجز استشارة في قضايا الشركات`, زر `احجز الآن`.

التفاعلات:

- `Book Consultation` و`احجز الآن` يفتحان booking flow مع preselected service.
- الخدمات ذات الصلة تظهر لاحقًا من data seeded.

### 10.4 Team - `kmt_legal_1`

الهدف: عرض الفريق وتصفيته حسب التخصص.

العناصر:

- Filter chips: `الكل`, `قانون الشركات`, `شؤون الأسرة`, `القانون الجنائي`, `العقارات`.
- Lawyer cards: كريم محمود، ليلى أحمد، طارق حسن.
- Card actions: `عرض الملف`, `حجز استشارة`.
- Process section: تقييم الحالة، مطابقة الخبرات، الاستشارة الأولية.

التفاعلات:

- Filter يغير الكروت.
- `عرض الملف` يفتح `/team/[slug]`.
- `حجز استشارة` يفتح booking مع المحامي selected.
- Hover الصورة يكبرها كما في Stitch.

### 10.5 Lawyer Profile - `._kmt_legal`

الهدف: عرض خبرة محام محدد وحجز موعد معه.

العناصر:

- Profile hero: صورة، الاسم `أ. كريم محمود`, badges، مؤشرات `+15`, `450+`, `98%`.
- تخصصات: القانون التجاري والشركات، التقاضي، القطاع المصرفي.
- منهجية العمل: التحليل الدقيق، الشفافية، السرية.
- Sidebar booking: أيام أكتوبر، أوقات، رسوم `1,500 ر.س`, `تأكيد الحجز`, `دفع إلكتروني آمن`.

التفاعلات:

- اختيار يوم يغير أوقات المتاحة.
- اختيار وقت يحدث selected state.
- الوقت disabled مثل `03:00 م` لا يقبل click.
- `تأكيد الحجز` لاحقًا ينقل إلى review/confirm step أو يطلب تسجيل/بيانات العميل.
- في clone: كل ذلك static visually فقط.

### 10.6 Book Consultation - `kmt_legal_22`

الهدف: بداية Flow حجز استشارة بمساعدة فرز ذكي.

العناصر:

- Header مختصر مع `EN`.
- Link `إلغاء`.
- Step content: `ما هو نوع الاستشارة التي تحتاجها؟`
- Service type radio cards: قضايا الشركات، الأسرة، الجنائي، العقارات، عمالية، أخرى/غير متأكد.
- AI panel: `المساعد الذكي للفرز`.
- Navigation: `السابق`, `التالي`.

التفاعلات:

- `إلغاء` يرجع للموقع العام.
- اختيار radio يفعّل `التالي`.
- `التالي` ينتقل لخطوة بيانات العميل ثم ملخص القضية ثم الموعد ثم تأكيد.
- `السابق` disabled في الخطوة الأولى ثم يرجع خطوة.
- يجب حفظ المدخلات عند الرجوع أو فشل الإرسال.

الحقول المطلوبة للمنتج لاحقًا:

- نوع الخدمة.
- الاسم.
- الهاتف.
- البريد الإلكتروني اختياري.
- المدينة.
- ملخص القضية.
- الطرف المقابل اختياري ومهم لفحص التعارض.
- درجة الاستعجال.
- طريقة الاستشارة: مكتب، أونلاين، هاتف.
- موعد مفضل.
- موافقة الخصوصية.

### 10.7 Case Studies Listing - `kmt_legal_19`

الهدف: عرض خبرات سابقة مجهولة بدون كشف بيانات العملاء.

العناصر:

- Filter buttons: الكل، الشركات والتجاري، الملكية الفكرية، العقارات والمقاولات، تسوية المنازعات.
- Cards تشمل: التحدي، النهج، النتيجة العامة.
- Legal disclaimer أن النتائج السابقة لا تضمن نتائج مستقبلية.

التفاعلات:

- Filters تغير القائمة.
- الضغط على card يفتح detail.
- أي content يجب أن يمر anonymization approval قبل النشر.

### 10.8 Case Study Detail - `kmt_legal_17`

الهدف: قراءة دراسة حالة مجهولة بتسلسل واضح.

العناصر:

- Breadcrumb: الرئيسية، دراسات حالة.
- Sections: الخلفية والسياق، التحدي القانوني، غموض العقود، التقادم، المنهجية، التسلسل الزمني.
- CTA: `هل تواجه نزاعاً تجارياً مشابهاً؟`
- Related services.

التفاعلات:

- CTA `Book Consultation` يفتح booking مع case category.
- Related service links تفتح صفحات الخدمات.

### 10.9 Media - `kmt_legal_16`

الهدف: مركز إعلامي وسوشيال.

العناصر:

- Filters: `All`, `Videos`, `Facebook`, `Articles`, `News`.
- Cards لمحتوى فيديو/فيسبوك/مقال/خبر.
- Actions: `share`, `thumb_up`, `chat_bubble`, `تحميل المزيد`.

التفاعلات:

- Filters تغير feed.
- `تحميل المزيد` يجلب دفعة إضافية.
- Social counters read-only في MVP.
- لا نشر خارجي حقيقي في MVP.

### 10.10 Articles - `kmt_legal_15`

الهدف: قائمة مقالات قانونية مبسطة مع بحث وتصنيفات.

العناصر:

- Search: `ابحث في المقالات...`.
- Filters: الكل، تأسيس الشركات، العقود التجارية، الملكية الفكرية، العمل والعمال.
- Featured article.
- Cards وقائمة الأكثر قراءة والتصنيفات.
- Pagination: chevrons و`1`, `2`, `3`.
- CTA: `احجز استشارة الآن`.

التفاعلات:

- Search + filter + pagination يجب أن تعمل معًا.
- Article card يفتح `/articles/[slug]`.
- CTA يفتح booking.

### 10.11 Contact - `kmt_legal_14`

الهدف: تمكين التواصل دون تكوين علاقة محام-موكل تلقائيًا.

العناصر:

- معلومات: الهاتف، واتساب، البريد الإلكتروني، ساعات العمل.
- فروع: القاهرة، الإسكندرية.
- Form: الاسم الكامل، رقم الهاتف، البريد، نوع الاستفسار، الرسالة، موافقة الخصوصية.
- Buttons: `الاتجاهات`, `إرسال الطلب`.

التفاعلات:

- `الاتجاهات` يفتح location/map لاحقًا.
- `إرسال الطلب` validates ثم يرسل ContactSubmission.
- Checkbox مطلوب.
- بعد الإرسال: success state مع تنبيه أن الرد لا يعني قبول القضية أو علاقة موكل.

### 10.12 Login - `kmt_legal_6`

الهدف: دخول العملاء والموظفين بأمان.

العناصر:

- Email field.
- Password field.
- Remember me checkbox.
- Link: `نسيت كلمة المرور؟`.
- Button: `تسجيل الدخول`.
- Security note في الجانب المرئي.

التفاعلات:

- submit يتحقق من credentials.
- نجاح الدخول يوجه حسب الدور: client إلى `/portal`، staff إلى `/admin`.
- فشل الدخول يعرض `INVALID_CREDENTIALS`.
- Remember me يغير lifetime ضمن سياسة آمنة.
- Forgot password يفتح flow reset لاحقًا.

### 10.13 Portal Dashboard - `kmt_legal_13`

الهدف: ملخص سريع للعميل عن القضايا والموعد القادم.

العناصر:

- Sidebar client/admin-style.
- Buttons: `New Filing`, menu, search, notifications.
- Case summaries: نزاع تجاري، مراجعة عقد.
- Actions: `تفاصيل القضية`, `إرفاق مستند`.
- Appointment actions: `تأكيد الحضور`, `إعادة جدولة`.
- Link: `عرض الكل`.

التفاعلات:

- العميل يرى own cases فقط.
- `تفاصيل القضية` يفتح case detail.
- `إرفاق مستند` يفتح upload.
- تأكيد الحضور يحدث appointment status.
- إعادة جدولة تفتح reschedule flow.

### 10.14 Portal Case Detail - `kmt_legal_10`

الهدف: عرض ملف قضية مبسط للعميل.

العناصر:

- Title: `ملف استشارة عقارية`.
- Tabs/buttons: الملخص، المواعيد، المستندات، الرسائل، المدفوعات.
- CTA: `إرسال مستند جديد`.
- Timeline: تم استلام الدفعة الأولى، اجتماع تمهيدي، فتح الملف.

التفاعلات:

- Tabs تغير panel.
- `إرسال مستند جديد` يفتح upload.
- `عرض التفاصيل` يفتح تفاصيل item.
- لا تعرض internal notes أو privileged staff comments.

### 10.15 Portal Documents - `kmt_legal_11`

الهدف: إدارة مستندات العميل ورفع ملفات جديدة.

العناصر:

- Security badge: `اتصال آمن ومشفر`.
- Upload area: `رفع مستند جديد`.
- File input.
- Search: `بحث في المستندات...`.
- Uploaded document list.
- More menu.

التفاعلات:

- drag/drop أو file picker.
- validate type/size server-side.
- status لكل مستند: new, under_review, needs_clarification, accepted, rejected.
- `more_vert` يفتح actions مثل download/delete request إذا مسموح.

### 10.16 Portal Appointments - `kmt_legal_12`

الهدف: عرض مواعيد العميل وإدارة الحضور/إعادة الجدولة.

العناصر:

- Appointment cards: مراجعة عقود، جلسة استماع، تأسيس شركة، استشارة عمالية.
- Buttons: `Book Consultation`, `حجز موعد جديد`, `إضافة مستندات`, `إعادة جدولة`, `عرض التفاصيل`.

التفاعلات:

- `حجز موعد جديد` يفتح booking.
- `إضافة مستندات` يربط upload بالموعد/القضية.
- `إعادة جدولة` يطلب سبب واختيار موعد.
- `عرض التفاصيل` يفتح تفاصيل الموعد.

### 10.17 Admin Dashboard - `kmt_legal_9`

الهدف: نظرة تشغيلية للمكتب.

العناصر:

- Sidebar: Dashboard, Cases, Documents, Calendar, Clients, Settings, Support, Logout.
- Search.
- Notifications.
- KPI cards: 12, 48, 8, 3, 15.
- Upcoming Court Sessions.
- Recent Activity.
- Link: `View All`.

التفاعلات:

- Dashboard links تنقل للأقسام.
- Search يبحث في القضايا/العملاء/المستندات حسب الصلاحية.
- Notifications تعرض تنبيهات staff.
- KPIs لا تكون مضللة: كل رقم له تعريف ووقت حساب.

### 10.18 Admin Clients - `kmt_legal_5`

الهدف: CRM للعملاء والleads.

العناصر:

- Search field: `Name or Phone`.
- Filters: Source, Status, Assigned Lawyer.
- Buttons: `Add Client`, `Apply Filters`, more menu, pagination.

التفاعلات:

- Add Client يفتح form.
- Apply Filters يطبق query.
- More menu يفتح view/edit/archive/assign.
- Pagination يحافظ على الفلاتر.
- كل عملية archive/assign audit logged.

### 10.19 Admin Cases - `kmt_legal_8`

الهدف: إدارة قائمة القضايا.

العناصر:

- Search: `البحث برقم القضية، العميل، أو المحامي...`.
- Buttons: `إضافة قضية`, date filter, `مزيد من الفلاتر`, `مسح الفلاتر`, more menu, pagination.
- Language `EN`.

التفاعلات:

- Search يدعم case number/client/lawyer.
- Date filter للجلسة القادمة.
- More filters: status, priority, lawyer, court, case type.
- Add case يتطلب permission.
- Clear filters يعيد default.

### 10.20 Admin Case Detail - `kmt_legal_7`

الهدف: ملف القضية الداخلي الكامل.

العناصر:

- Title: `Al-Futtaim Commercial Dispute`.
- AI Summary panel.
- Tabs: Summary, Parties, Sessions, Documents, Tasks, Notes, Finance, Activity Log.
- Buttons: `Update Status`, `Quick Action`, `Add Session`, `Upload Document`, `Create Task`, `View All`.
- Key Details وUpcoming Sessions.

التفاعلات:

- Tabs تغير المحتوى دون فقد context.
- Update status يطلب confirmation ويكتب audit.
- Quick action تظهر قائمة actions.
- Add Session ينشئ appointment/session.
- Upload Document يتحقق من نوع/حجم/visibility.
- Notes داخلية فقط ولا تظهر للعميل.
- AI Summary marked as needs lawyer review.

### 10.21 Admin Calendar - `kmt_legal_2`

الهدف: إدارة الجلسات والمواعيد ومنع التعارضات.

العناصر:

- Calendar views: شهر، أسبوع، يوم.
- Buttons: New Filing, تصفية, chevrons.
- Daily agenda.
- Conflict alert: `تنبيه تعارض مواعيد`.
- Actions: `إعادة جدولة الاستشارة`, `عرض التفاصيل`.

التفاعلات:

- Month/week/day changes calendar density.
- Chevrons يتحركان بين الفترات.
- Conflict alert يظهر عند نفس المحامي/نفس الوقت.
- Reschedule يحافظ على audit trail.

### 10.22 Admin Tasks - `kmt_legal_4`

الهدف: Kanban لإدارة مهام المكتب.

العناصر:

- Search: `بحث في المهام...`.
- Buttons: close, New Filing, menu, notifications, `إضافة مهمة`, `الكل`, `مهامي`, `متأخرة`, more menu, `إضافة بطاقة`.
- Columns: جديد، قيد التنفيذ، بانتظار المراجعة، متأخرة، مكتملة.

التفاعلات:

- Add task/card يفتح form.
- Filter buttons تغير board.
- Drag/drop لاحقًا يغير status مع audit.
- Overdue state واضح وغير معتمد على اللون فقط.

### 10.23 Admin Content & Social - `kmt_legal_3`

الهدف: إدارة المحتوى والسوشيال ودراسات الحالة ومراجعتها.

العناصر:

- Search: `البحث في المحتوى...`.
- Links/tabs: Articles, Case Studies, Social Posts, Pending Approval.
- AI Draft Panel.
- Fields: Source, Platform, LinkedIn, X/Twitter.
- Button: `إنشاء محتوى جديد`, `توليد المسودة`.
- Monthly overview.

التفاعلات:

- Create content opens editor.
- Generate draft يستخدم AI Provider Gateway في MVP.
- كل مسودة AI تظهر `needs legal review`.
- لا نشر تلقائي خارجي.
- Approval workflow: draft -> legal_review -> approved -> scheduled -> published/rejected.

## 11. المكونات المطلوبة لاحقًا بعد clone

- PublicHeader
- PublicFooter
- LanguageSwitcher
- HeroSection
- SectionHeader
- ServiceCard
- LawyerCard
- CaseStudyCard
- ArticleCard
- SocialPostCard
- CTASection
- BookingStepper
- AIOrganizerPanel
- FileUploadDropzone
- StatusBadge
- PriorityBadge
- DashboardShell
- DashboardSidebar
- DashboardTopbar
- MetricCard
- DataTable
- FilterBar
- SearchInput
- CalendarEventCard
- TaskKanbanBoard
- TaskCard
- DocumentCard
- Timeline
- EmptyState
- LoadingState
- ErrorState
- PermissionBlocked
- ConfirmationDialog
- Toast

قرار مهم: هذه المكونات لا تستخدم داخل `/stitch-clone/*`. تستخدم فقط في المنتج الحقيقي بعد اكتمال clone.

## 12. Design System

الهوية:

- Corporate Modern.
- قانونية، هادئة، موثوقة، عالية السرية.
- RTL عربي أولًا، LTR جاهز لاحقًا.
- Typography: `IBM Plex Sans Arabic` للعربية و`Inter` للأرقام/اللاتينية.

Tokens أساسية من `DESIGN.md`:

- Surface: `#f7f9fb`
- Surface lowest: `#ffffff`
- Primary: `#000000`
- Primary container: `#131b2e`
- Secondary/Gold: `#755a26`
- Outline variant: `#c6c6cd`
- Error: `#ba1a1a`

قواعد:

- لا hardcoded random colors خارج tokens.
- radius محافظ: 4px للأزرار/الحقول، 8px للكروت الرئيسية، badges فقط يمكن أن تكون pill.
- لا heavy shadows؛ استخدم borders/tonal layering.
- كل icon-only button له accessible name.
- Arabic labels يجب ألا تنضغط على mobile.

## 13. Data Model

الكيانات الأساسية:

- User
- Role
- Permission
- RolePermission
- Client
- LawyerProfile
- LegalService
- ConsultationRequest
- Appointment
- Case
- CaseParty
- CaseSession
- Document
- Task
- InternalNote
- Payment
- Article
- CaseStudy
- SocialPostDraft
- Notification
- AuditLog
- SystemSetting

متطلبات عامة:

- استخدام UUID أو IDs غير قابلة للتخمين للموارد المكشوفة خارجيًا.
- timestamps لكل الكيانات.
- soft delete حيث يلزم: User, Case, Client, Document, Content.
- indexes على: email, phone, slug, status, assignedLawyerId, clientId, caseId, startsAt, dueDate, createdAt.
- عدم تسريب internal DB fields في responses.

## 14. API / Server Actions

شكل الخطأ الموحد:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable localized message",
    "details": [],
    "requestId": "req_xxx"
  }
}
```

الأكواد:

- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `CONFLICT`
- `RATE_LIMITED`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `SERVER_ERROR`

المجموعات:

- Auth: login, logout, current user, route protection, permission checks.
- Public: services, lawyers, consultation request, articles, case studies, contact.
- Portal: dashboard, own cases, own documents, upload, appointments, profile.
- Admin: dashboard metrics, clients, consultation review, cases, sessions, documents, tasks, appointments, content, users, audit logs.

## 15. AI Organizer

داخل MVP:

- لا API حقيقي إلا إذا طلب المستخدم لاحقًا.
- service abstraction: `aiOrganizer`.
- Mock outputs:
  - consultation classification.
  - intake summary.
  - document checklist.
  - anonymous case study draft.
  - social post draft.

قواعد:

- AI output غير موثوق ويتم validate له schema.
- لا يظهر كنصيحة قانونية نهائية.
- يظهر دائمًا label: `يحتاج مراجعة محام`.
- لا يتم حفظ prompt/raw sensitive content في logs.

## 16. Security & Privacy

متطلبات أمان MVP:

- Secrets لا تدخل client bundle.
- لا استخدام `NEXT_PUBLIC_*` لأي secret.
- Auth/session cookies تكون `HttpOnly`, `SameSite`, و`Secure` فقط في production HTTPS.
- CSRF حماية للـcookie-auth state-changing endpoints.
- runtime validation لكل input بـZod أو ما يعادله.
- server-side authorization لكل action.
- منع horizontal privilege escalation.
- عدم تخزين/عرض internal notes للعميل.
- رفع الملفات خارج `public/`.
- file validation: type allowlist, size limit, generated file key.
- لا تسجيل request bodies حساسة أو Authorization/cookies.
- CSP/security headers في production.
- Rate limiting على login, booking, contact, upload.

## 17. Analytics & Observability

قياس المنتج يجب أن يجيب أسئلة حقيقية فقط:

- كم زائر بدأ booking؟
- أين يتوقف المستخدم في booking؟
- كم consultation request تم تحويله إلى case؟
- كم مستند upload فشل بسبب type/size؟
- كم case study ينتظر legal review؟
- وقت معالجة consultation من `new` إلى `scheduled/converted`.

قواعد:

- لا ترسل أسماء عملاء أو ملخصات قضايا أو محتوى مستندات في analytics.
- استخدم IDs داخلية أو counters.
- errors structured مع requestId.
- logs redacted.
- Sentry/observability لاحقًا must tag environment/release بدون PII.

## 18. States المطلوبة

لكل شاشة رئيسية:

- Loading.
- Empty.
- Error.
- Permission denied.
- Validation errors.
- Saving/submitting.
- Success.
- Disabled.
- Active/selected.
- Offline/degraded عند upload/forms.

## 19. Accessibility

- Semantic HTML.
- RTL structural mirroring.
- Labels لكل input.
- Errors مرتبطة بالحقول.
- Focus visible.
- Dialog focus trap.
- Tables headers.
- لا reliance على اللون فقط للstatus.
- Touch target لا يقل عن 44px.
- Icon-only buttons لها labels.
- احترام reduced motion.

## 20. Testing & QA

Critical tests:

- Public visitor submits consultation request.
- Admin reviews consultation request.
- Admin assigns lawyer.
- Admin converts consultation to case.
- Client login sees own data only.
- Client cannot access other client case.
- Client uploads document and invalid upload fails.
- Lawyer sees assigned cases only.
- Unauthorized user gets permission denied.
- Case study cannot publish before approval.

Visual clone QA:

- Playwright screenshots لكل clone route.
- Viewports:
  - Mobile: `390x844`.
  - Desktop: `1440x900` عند وجود desktop reference.
  - Reference image native dimensions مسجلة في source، لكن viewport المطلوب من البرومبت هو بوابة المقارنة التنفيذية.
- Pixel/visual diff review manually documented.

## 21. Definition of Done

### Stitch Clone Done

- كل شاشة لها route تحت `/stitch-clone`.
- JSX ناتج من HTML ميكانيكيًا.
- CSS/classes/assets محفوظة.
- Screenshot مأخوذ بPlaywright.
- الفروق المرئية موثقة ومصلحة فقط بقدر الحاجة.

### Product MVP Done

- Routes الأساسية موجودة.
- Auth/permissions server-side.
- Prisma schema وseed يعملان.
- Public pages تعرض seeded data.
- Booking يحفظ ConsultationRequest.
- Admin review queue تعمل.
- Conversion to case يعمل.
- Client portal يعرض own data فقط.
- Upload validation يعمل.
- Admin dashboard/cases/clients/calendar/tasks/content تعمل على بيانات حقيقية أو seed.
- Tests الحرجة وtypecheck/lint/build تعمل أو أي blocker موثق.
