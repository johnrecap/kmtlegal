# خطة الاستبدال الشامل لصفحة الـ Home بمكونات animate-ui (نسخة 2)

> الحالة: المرحلة 0 + 1 (نسخة خفيفة) منفذة محليًا (بدون push) — هذه النسخة تعيد التوجيه إلى **استبدال شامل وواضح** لكل مكونات الـ home.
> النطاق: صفحة الـ home فقط (`HomePageView` في `src/features/public-site/public-pages.tsx` — عربي `/ar` وإنجليزي `/`).
> المحفوظ دائمًا: النصوص (AR/EN)، الروابط ومنطق الحجز، الـ SEO/metadata، دعم RTL، احترام `prefers-reduced-motion`.
> خارج النطاق: الهيدر/الفوتر (مشتركان مع كل الصفحات — أي تغيير فيهما يؤثر على الموقع كله ويحتاج قرارًا منفصلًا).

## مبدأ الاستبدال الشامل

- كل قسم في الـ home يُعاد بناؤه بمكوّن animate-ui **يغيّر الشكل والتفاعل جذريًا**، لا تحسينات خفيفة.
- البيانات (نفس الحقول الحالية) والروابط تبقى كما هي — التغيير بصري وتفاعلي فقط.
- المكوّنات KMT القديمة التي تُستبدل (`PracticeAreaCard`، `RepresentativeMatterCard`، `IndustryGrid`، `TrustStrip`، `ProcessSteps`، `LuxuryFeaturePanel`) تُحذف صادراتها في مرحلة التنظيف **بعد** التأكد أنها غير مستخدمة في صفحات أخرى.

## القائمة النهائية: المكونات التي ستُحط بالكامل

### خلفيات (Backgrounds)
1. [Gradient Background](https://animate-ui.com/docs/components/backgrounds/gradient) — خلفية الـ hero بقوة واضحة (تدرج KMT ذهبي/كحلي، سرعة أعلى من النسخة الخفيفة).
2. [Stars Background](https://animate-ui.com/docs/components/backgrounds/stars) — بديل معتمد للـ hero يُحسم لحظة التنفيذ.

### نصوص (Texts)
3. [Gradient Text](https://animate-ui.com/docs/primitives/texts/gradient) — عنوان الـ hero (مُركّب — يُقوّى: لمعان أسرع وأوسع).
4. [Sliding Number](https://animate-ui.com/docs/primitives/texts/sliding-number) — **يستبدل** `CountingNumber` في إحصائيات الـ hero (أرقام تنزلق خانةً بخانة).
5. [Highlight Text](https://animate-ui.com/docs/primitives/texts/highlight) — تمييز العبارات المفتاحية في لوحة الخدمة المميزة.

### أزرار (Buttons)
6. [Liquid Button](https://animate-ui.com/docs/components/buttons/liquid) — كل أزرار الحجز الرئيسية (مُركّب في الـ hero — يُعمم على CTA قسم Insights الفارغ ولوحة الخدمة).
7. [Flip Button](https://animate-ui.com/docs/components/buttons/flip) — **يستبدل** روابط "تصفح الخدمات/المجالات" النصية.

### مجتمع (Community)
8. [Flip Card](https://animate-ui.com/docs/components/community/flip-card) — **يستبدل** `PracticeAreaCard` (الوجه: الأيقونة والعنوان — الظهر: الملخص ورابط التفاصيل) **ويستبدل** كروت المحامين (الوجه: الصورة والاسم — الظهر: التخصصات وزر الملف).
9. [Motion Carousel](https://animate-ui.com/docs/components/community/motion-carousel) — **يستبدل** شبكة `RepresentativeMatterCard` (+ اعتماد Embla، مع دعم RTL).
10. [Share Button](https://animate-ui.com/docs/components/community/share-button) — يُضاف لكروت المقالات/دراسات الحالة.
11. [User Presence Avatar](https://animate-ui.com/docs/components/community/user-presence-avatar) — مؤشر حالة الحجز على صور المحامين (مربوط بحقل `bookingEnabled`).

### متحركة جاهزة (Animate)
12. [Avatar Group](https://animate-ui.com/docs/components/animate/avatar-group) — شريط "قابل الفريق" + تجديد `TrustStrip` (وجوه/أحرف أولى + عناصر الثقة).

### بريميتفز متحركة (Radix)
13. [Tabs](https://animate-ui.com/docs/components/radix/tabs) — **تستبدل** `ProcessSteps` (كل خطوة تبويب بمحتواها: الرقم + الأيقونة + العنوان + الملخص).
14. [Accordion](https://animate-ui.com/docs/components/radix/accordion) — قسم FAQ **جديد** (يتطلب محتوى عربي + إنجليزي في ملفات المحتوى).
15. [Preview Link Card](https://animate-ui.com/docs/components/radix/preview-link-card) — **يستبدل** كروت المقالات/دراسات الحالة (معاينة منبثقة عند hover).
16. [Tooltip](https://animate-ui.com/docs/components/radix/tooltip) — تلميحات أيقونات الـ docket وشارات الحالة.

### تأثيرات (Effects)
17. [Image Zoom](https://animate-ui.com/docs/primitives/effects/image-zoom) — صورة لوحة الخدمة + صور المحامين.
18. [Magnetic](https://animate-ui.com/docs/primitives/effects/magnetic) — أزرار CTA وكروت الصناعات (بدل Tilt الحالي حيث يُستبدل).
19. [Shine](https://animate-ui.com/docs/primitives/effects/shine) — لمعة تمر على بطاقة الـ docket وشريط الثقة.

### مستبعد عمدًا
- [Cursor](https://animate-ui.com/docs/components/animate/cursor) — مرح ولايناسب مكتب محاماة.
- Scroll Progress — موجود مخصص (`ReadingProgress`).

## المراحل المحدثة

### المرحلة 0 — التأسيس — ✅ تمت
- [x] اعتماد الأسماء عبر `search` + معاينة `view` + تثبيت بـ `--dry-run` أولًا.
- [x] `@animate-ui` مسجل في `components.json`. الـ MCP متصل.

### المرحلة 1 — تقوية الـ Hero (على ما تم) — ⏳ التالية
- [ ] رفع وضوح `GradientBackground` (شفافية أعلى وسرعة أسرع) أو التبديل لـ `Stars`.
- [ ] تسريع لمعان `GradientText` وتوسيع مداه.
- [ ] `CountingNumber` ← `SlidingNumber` في الإحصائيات الثلاث.
- [ ] روابط "تصفح المجالات" ← `FlipButton`.
- [ ] `Magnetic` على زرار الحجز + `Shine` على بطاقة الـ docket + `Tooltip` على أيقونة الحالة.
- [ ] تحقق: typecheck + eslint + e2e بصرية (EN/AR × فاتح/دارك) + commit محلي.

### المرحلة 2 — مجالات الممارسة (استبدال كامل)
- [ ] تثبيت `FlipCard` وبناء وجه/ظهر `PracticeAreaCard` بنفس الحقول (`icon/title/summary/href`) مع إبقاء تمييز البطاقة الأولى الممتدة.
- [ ] حذف استخدام `Tilt` هنا (يبقى متاحًا لأقسام أخرى إن لزم).
- [ ] تحقق + commit محلي.

### المرحلة 3 — الخدمة المميزة (استبدال كامل)
- [ ] صورة اللوحة ← `Image Zoom`، الوصف ← `Highlight Text`، زر التفاصيل ← `LiquidButton` asChild لنفس رابط الخدمة.
- [ ] تحقق + commit محلي.

### المرحلة 4 — خطوات العمل (استبدال كامل)
- [ ] `ProcessSteps` (شبكة + GSAP) ← `Tabs` متحركة (4 تبويبات بنفس الحقول `number/icon/title/summary`)، أول تبويب مفتوح افتراضيًا.
- [ ] تحقق + commit محلي.

### المرحلة 5 — القضايا النموذجية (استبدال كامل)
- [ ] شبكة `RepresentativeMatterCard` ← `MotionCarousel` (+ Embla) يعرض نفس البطاقات، مع دعم RTL.
- [ ] تحقق + commit محلي.

### المرحلة 6 — الصناعات (استبدال كامل)
- [ ] `IndustryGrid` ← كروت تفاعلية جديدة (`Magnetic` + توهج hover + ترقيم كبير) بنفس الحقول (`title/summary` — لا روابط في البيانات).
- [ ] تحقق + commit محلي.

### المرحلة 7 — الفريق (استبدال كامل)
- [ ] شريط `Avatar Group` فوق الكروت + كروت المحامين ← `FlipCard` (وجه: صورة `Image Zoom` + اسم — ظهر: تخصصات + زر الملف) + `User Presence Avatar` لحالة الحجز.
- [ ] تحقق + commit محلي.

### المرحلة 8 — المقالات والثقة (استبدال كامل)
- [ ] كروت Insights ← `Preview Link Card` + `Share Button`.
- [ ] `TrustStrip` ← شريط متحرك (`Avatar Group` + `Shine` + نفس عناصر `icon/label`).
- [ ] CTA الفارغ ← `LiquidButton`.
- [ ] تحقق + commit محلي.

### المرحلة 9 — FAQ جديد + التنظيف
- [ ] محتوى FAQ (AR + EN) + قسم `Accordion` بعد Insights.
- [ ] حذف صادرات KMT المستبدلة غير المستخدمة في أي صفحة أخرى + فحص `grep` شامل.
- [ ] تحقق + commit محلي.

### المرحلة 10 — الاعتماد النهائي
- [ ] `npm run typecheck` + `npm run lint` + `npm run build` + مراجعة بصرية `/` و`/ar` (فاتح/دارك/موبايل/تقليل الحركة).
- [ ] push على `origin/main` **فقط بعد إذن صريح** (التعليق الحالي: بدون رفع) ثم:
  ```bash
  cd /www/wwwroot/kmtlegal
  bash deploy/install/aapanel-pm2-update.sh
  ```

## القواعد الذهبية (تسري على كل المراحل)

1. **معاينة أولًا**: `shadcn view` ثم `--dry-run` قبل أي كتابة.
2. **ممنوع `--overwrite`** على ملفات KMT القائمة.
3. **الثيم**: توكن KMT فقط، لا ألوان shadcn الافتراضية.
4. **الفحص الإلزامي**: AR(RTL) + EN + دارك + موبايل + `prefers-reduced-motion` (نسخة ثابتة عند تقليل الحركة).
5. **المعاينة قبل التركيب** في `/preview/components`.
6. **commit محلي مستقل لكل مرحلة** — ولا push إلا بإذن صريح.
