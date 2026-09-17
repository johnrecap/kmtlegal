# خطة تحديث صفحة الـ Home بمكونات animate-ui

> الحالة: خطة معتمدة — لم يبدأ التنفيذ.
> النطاق: صفحة الـ home فقط (`HomePageView` في `src/features/public-site/public-pages.tsx` — عربي `/ar` وإنجليزي `/`).
> خارج النطاق: النصوص، منطق الحجز، الـ SEO/metadata، الهيدر/الفوتر، نظام ألوان KMT.

## القواعد الذهبية (تسري على كل المراحل)

1. **معاينة أولًا**: كل تثبيت يبدأ بـ `shadcn view` ثم `--dry-run` قبل الكتابة على القرص.
2. **ممنوع `--overwrite`** على أي ملف قائم في `src/components/ui/*` أو ملفات الثيم — ملفات KMT لها الأولوية دائمًا.
3. **الأسماء الدقيقة للمكونات** تُعتمد لحظة التنفيذ عبر `npx shadcn@latest search @animate-ui` (لا تخمين).
4. **الثيم**: كل مكون جديد يُربط بتوكن KMT (ذهبي/كحلي) لا ألوان shadcn الافتراضية.
5. **الفحص الإلزامي لكل مرحلة**: عربي (RTL) + إنجليزي + دارك + موبايل + `prefers-reduced-motion`.
6. **المعاينة قبل التركيب**: كل مكون يُعرض أولًا في `/preview/components` ثم يُركّب في الـ home.
7. **commit مستقل لكل مرحلة** لتسهيل التراجع (`git revert`).

## الخلفية: الموجود حاليًا في الـ home

| القسم | المكوّن الحالي | مستخدم من animate-ui بالفعل؟ |
|---|---|---|
| Hero (عنوان/إحصائيات/أزرار) | `HeroParallaxLayers` | نعم: SplittingText + CountingNumber + RippleLink |
| شريط الثقة | `TrustStrip` | لا |
| مجالات الممارسة | `PracticeAreaCard` + Tilt + Reveal | نعم: Tilt |
| الخدمة المميزة | `LuxuryFeaturePanel` | لا |
| خطوات العمل | `ProcessSteps` | لا |
| القضايا النموذجية | `RepresentativeMatterCard` (شبكة ×3) | لا |
| الصناعات | `IndustryGrid` | لا |
| الفريق | كروت المحامين + Tilt + Reveal | نعم: Tilt |
| المقالات/دراسات الحالة | كروت روابط ثابتة | لا |
| FAQ | غير موجود (قسم جديد) | — |

## المرحلة 0 — التأسيس (مرة واحدة)

- [ ] `npx shadcn@latest search @animate-ui` لاعتماد أسماء العناصر الدقيقة.
- [ ] تجربة `--dry-run` على أول مكون للتأكد أن الملفات تنزل في `src/components/animate-ui/*` ولا تلمس `ui/*` أو `globals.css`.
- [ ] تثبيت الاعتماديات الناقصة مع أول مكون يحتاجها (مثال: `embla-carousel-react` للكاروسيل).
- [ ] التحقق من عمل MCP (`opencode mcp list` → `✓ shadcn connected`).

## المرحلة 1 — الـ Hero (أعلى تأثير، يُنفذ أولًا)

- [ ] تثبيت [Gradient Background](https://animate-ui.com/docs/components/backgrounds/gradient) (بديل: [Stars](https://animate-ui.com/docs/components/backgrounds/stars)) خلف `HeroParallaxLayers` — الصورة والنصوص كما هي.
- [ ] تثبيت [Gradient Text](https://animate-ui.com/docs/primitives/texts/gradient) للعنوان بألوان KMT الذهبية.
- [ ] تثبيت [Liquid Button](https://animate-ui.com/docs/components/buttons/liquid) (بديل: [Flip](https://animate-ui.com/docs/components/buttons/flip)) لزرار "احجز استشارة" مع بقاء نفس الـ href.
- [ ] تحقق: typecheck + معاينة AR/EN + commit.

## المرحلة 2 — مجالات الممارسة

- [ ] تثبيت [Flip Card](https://animate-ui.com/docs/components/community/flip-card): الواجهة الأمامية = الكارت الحالي، الخلفية = الملخص + رابط التفاصيل.
- [ ] (اختياري) [Tabs](https://animate-ui.com/docs/components/radix/tabs) لفلترة المجالات، أو [Magnetic](https://animate-ui.com/docs/primitives/effects/magnetic) بدل Tilt.
- [ ] تحقق + commit.

## المرحلة 3 — الخدمة المميزة

- [ ] [Image Zoom](https://animate-ui.com/docs/primitives/effects/image-zoom) على صورة `LuxuryFeaturePanel`.
- [ ] [Highlight Text](https://animate-ui.com/docs/primitives/texts/highlight) للعبارات المفتاحية.
- [ ] تحقق + commit.

## المرحلة 4 — القضايا النموذجية

- [ ] تثبيت [Motion Carousel](https://animate-ui.com/docs/components/community/motion-carousel) (+ Embla) وتحويل الشبكة لسلايدر مع دعم RTL.
- [ ] تحقق + commit.

## المرحلة 5 — الفريق

- [ ] [Avatar Group](https://animate-ui.com/docs/components/animate/avatar-group) كشريط "قابل الفريق".
- [ ] [User Presence Avatar](https://animate-ui.com/docs/components/community/user-presence-avatar) مربوط بحقل `bookingEnabled` (متاح للحجز / قيد المراجعة).
- [ ] [Image Zoom](https://animate-ui.com/docs/primitives/effects/image-zoom) على صور المحامين.
- [ ] تحقق + commit.

## المرحلة 6 — المقالات والثقة

- [ ] [Preview Link Card](https://animate-ui.com/docs/components/radix/preview-link-card) لمعاينة المقالات + [Share Button](https://animate-ui.com/docs/components/community/share-button).
- [ ] [Avatar Group](https://animate-ui.com/docs/components/animate/avatar-group) في `TrustStrip`.
- [ ] تحقق + commit.

## المرحلة 7 — قسم FAQ جديد

- [ ] إضافة محتوى أسئلة شائعة (عربي + إنجليزي) في ملفات المحتوى.
- [ ] تثبيت [Accordion](https://animate-ui.com/docs/components/radix/accordion) وتركيب القسم بعد Insights.
- [ ] تحقق + commit.

## المرحلة 8 — الاعتماد النهائي

- [ ] `npm run typecheck` + `npm run lint` + `npm run build`.
- [ ] مراجعة بصرية `/` و`/ar` (فاتح/دارك/موبايل/تقليل الحركة).
- [ ] push على `origin/main` ثم:
  ```bash
  cd /www/wwwroot/kmtlegal
  bash deploy/install/aapanel-pm2-update.sh
  ```
