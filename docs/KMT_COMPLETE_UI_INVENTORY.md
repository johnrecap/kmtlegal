# KMT Legal — Complete UI Page & Component Inventory

> AUDIT ONLY — NO DESIGN CHANGES — NO CODE MODIFICATIONS.
> This file is a factual map of the CURRENT UI: what exists, where it is,
> what file renders it, what library it comes from. No replacement or
> redesign recommendations are included.
>
> - Audited: 2026-09-18, from working tree at `D:\kmt legal\kmt legal office`
> - Method: read every `src/app/**/page.tsx` + its layout + the view/feature
>   component it renders; grepped imports to distinguish INSTALLED vs
>   ACTUALLY RENDERED; checked `package.json`, `components.json`,
>   `tailwind.config.ts`, `src/app/globals.css`.
> - Counting convention: **72 URL patterns** served by **60 `page.tsx` files**
>   (the Arabic catch-all `ar/[[...path]]` serves 13 patterns from 1 file;
>   3 content sub-pages are redirect-only; `/login/2fa` renders `notFound()`).

---

# STEP 1 — ROUTE INVENTORY

Layouts referenced below (all verified on disk):

| Layout key | File |
|---|---|
| `ENRoot` | `src/app/(public-en)/layout.tsx` — `ThemeProvider defaultTheme="dark"` + `SmoothScrollProvider` |
| `ARRoot` | `src/app/(public-ar)/layout.tsx` — `<html lang="ar" dir="rtl">`, `ThemeProvider defaultTheme="dark"` + `SmoothScrollProvider` |
| `PublicShell` | `src/components/layout/public-shell.tsx` — `PublicHeader` + `<main>` + footer CTA + 4-col footer + legal bar + `PublicFloatingDock` |
| `LoginRoot` | `src/app/(login)/layout.tsx` — locale from `x-kmt-login-locale`, `ThemeProvider defaultTheme="dark"` |
| `AppRoot` | `src/app/(app-ar)/layout.tsx` — `<html lang="ar" dir="rtl">`, `ThemeProvider defaultTheme="light"`, readiness gate |
| `AdminShell` | `src/app/(app-ar)/admin/layout.tsx` (`requireAdminPage` + `AdminAccessProvider`) + `DashboardShell mode="admin"` |
| `ClientShell` | `src/app/(client)/layout.tsx` (`force-dynamic`, auth guard, `ThemeProvider defaultTheme="dark"`) + `ClientSiteShell` |
| `InstallRoot` | `src/app/(install-ar)/layout.tsx` — `<html lang="ar" dir="rtl">`, `ThemeProvider defaultTheme="dark"` |
| `PreviewRoot` | `src/app/preview/layout.tsx` — `<html lang="en" dir="ltr">`, robots noindex |
| `ReceiptStandalone` | no shared layout — standalone `main bg-[#f4efe6] dir=rtl` |

## 1A. Public English (15 files / 15 routes)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 01 | `/` | EN | Public | `HomePageView` (`src/features/public-site/public-pages.tsx:219`) | `ENRoot` + `PublicShell` |
| 02 | `/services` | EN | Public | `ServicesPageView` (`public-pages.tsx:366`) | `ENRoot` + `PublicShell` |
| 03 | `/services/[slug]` | EN | Public | `ServiceDetailPageView` (`public-pages.tsx:406`) | `ENRoot` + `PublicShell` |
| 04 | `/team` | EN | Public | `TeamPageView` (`public-pages.tsx:508`) | `ENRoot` + `PublicShell` |
| 05 | `/team/[slug]` | EN | Public | `TeamDetailPageView` (`public-pages.tsx:537`) | `ENRoot` + `PublicShell` |
| 06 | `/articles` | EN | Public | `ArticlesPageView` (`public-pages.tsx:633`) | `ENRoot` + `PublicShell` |
| 07 | `/articles/[slug]` | EN | Public | `ArticleDetailPageView` (`public-pages.tsx:660`) | `ENRoot` + `PublicShell` |
| 08 | `/case-studies` | EN | Public | `CaseStudiesPageView` (`public-pages.tsx:756`) | `ENRoot` + `PublicShell` |
| 09 | `/case-studies/[slug]` | EN | Public | `CaseStudyDetailPageView` (`public-pages.tsx:783`) | `ENRoot` + `PublicShell` |
| 10 | `/media` | EN | Public | `MediaPageView` (`public-pages.tsx:855`) | `ENRoot` + `PublicShell` |
| 11 | `/contact` | EN | Public | `ContactPageView` (`public-pages.tsx:880`) | `ENRoot` + `PublicShell` |
| 12 | `/book-consultation` | EN | Public | `BookConsultationPageView` (`public-pages.tsx:952`) | `ENRoot` + `PublicShell` (dock hidden) |
| 13 | `/privacy` | EN | Public | `PrivacyPageView` (`public-pages.tsx:982`) | `ENRoot` + `PublicShell` |
| 14 | `/terms` | EN | Public | `TermsPageView` (`public-pages.tsx:1061`) | `ENRoot` + `PublicShell` |
| 15 | `/client-account/setup` | EN | Public | `ClientAccountSetupPage` (`src/features/public-site/client-account-setup-page.tsx:22`) | `ENRoot` + `PublicShell` |

Entry files: `src/app/(public-en)/page.tsx`, `services/page.tsx`,
`services/[slug]/page.tsx`, `team/page.tsx`, `team/[slug]/page.tsx`,
`articles/page.tsx`, `articles/[slug]/page.tsx`, `case-studies/page.tsx`,
`case-studies/[slug]/page.tsx`, `media/page.tsx`, `contact/page.tsx`,
`book-consultation/page.tsx` (`force-dynamic`), `privacy/page.tsx`,
`terms/page.tsx`, `client-account/setup/page.tsx` (`force-dynamic`).

## 1B. Public Arabic (5 files / 17 URL patterns)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 16 | `/ar` | AR | Public | `HomePageView` (same view, `locale="ar"`) | `ARRoot` + `PublicShell` |
| 17 | `/ar/services` | AR | Public | `ServicesPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 18 | `/ar/services/[slug]` | AR | Public | `ServiceDetailPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 19 | `/ar/team` | AR | Public | `TeamPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 20 | `/ar/team/[slug]` | AR | Public | `TeamDetailPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 21 | `/ar/articles` | AR | Public | `ArticlesPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 22 | `/ar/articles/[slug]` | AR | Public | `ArticleDetailPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 23 | `/ar/case-studies` | AR | Public | `CaseStudiesPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 24 | `/ar/case-studies/[slug]` | AR | Public | `CaseStudyDetailPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 25 | `/ar/media` | AR | Public | `MediaPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 26 | `/ar/contact` | AR | Public | `ContactPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 27 | `/ar/privacy` | AR | Public | `PrivacyPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 28 | `/ar/terms` | AR | Public | `TermsPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 29 | `/ar/book-consultation` | AR | Public | `BookConsultationPageView` (`locale="ar"`) | `ARRoot` + `PublicShell` (dock hidden) |
| 30 | `/ar/client-account/setup` | AR | Public | `ClientAccountSetupPage` (`locale="ar"`) | `ARRoot` + `PublicShell` |
| 31 | `/payment/consultation/return` | AR/EN | Public | inline server view + `PaymentStatusPoller` | `ARRoot` + `PublicShell` |
| 32 | `/payment/consultation/receipt` | AR | Public | `ConsultationPaymentReceiptDocument` | `ReceiptStandalone` (no shell) |

Entry files: `src/app/(public-ar)/ar/[[...path]]/page.tsx` (rows 16–28,
`revalidate=900`, `generateStaticParams` + `renderPublicPath`),
`src/app/(public-ar)/ar/book-consultation/page.tsx` (`force-dynamic`),
`src/app/(public-ar)/ar/client-account/setup/page.tsx` (`force-dynamic`),
`src/app/(public-ar)/payment/consultation/return/page.tsx` (`force-dynamic`),
`src/app/(public-ar)/payment/consultation/receipt/page.tsx` (`force-dynamic`).

## 1C. Auth / install (3 files / 3 routes)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 33 | `/login` | AR/EN (`?locale=`) | Auth | inline view + `LoginForm` (`src/features/auth/login-form.tsx`) | `LoginRoot` |
| 34 | `/login/2fa` | — | Auth | none — `notFound()` only (`src/app/(app-ar)/login/2fa/page.tsx`) | `AppRoot` |
| 35 | `/install` | AR | Internal | `InstallWizard` (`src/features/install/install-wizard.tsx`) | `InstallRoot` |

## 1D. Client portal (8 files / 8 routes)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 36 | `/client` | user locale | Client | inline dashboard view | `ClientShell` |
| 37 | `/client/cases` | user locale | Client | inline list + `DataTable` | `ClientShell` |
| 38 | `/client/cases/[caseId]` | user locale | Client | inline detail view | `ClientShell` |
| 39 | `/client/assistant` | user locale | Client | `ClientAssistantPanel` (`src/features/client/client-assistant-panel.tsx`) + `ClientTeamChatPanel` | `ClientShell` |
| 40 | `/client/files` | user locale | Client | inline list + `DocumentUploadForm` | `ClientShell` |
| 41 | `/client/court-dates` | user locale | Client | inline list + `DataTable` | `ClientShell` |
| 42 | `/client/payments` | user locale | Client | inline metrics + attempt cards + `DataTable` | `ClientShell` |
| 43 | `/client/profile` | user locale | Client | `ProfileForm` (`src/features/portal/profile-form.tsx`) + account panel | `ClientShell` |

Entry files: `src/app/(client)/client/page.tsx`, `cases/page.tsx`,
`cases/[caseId]/page.tsx`, `assistant/page.tsx`, `files/page.tsx`,
`court-dates/page.tsx`, `payments/page.tsx`, `profile/page.tsx` (all
`force-dynamic` via layout guard). Nav source:
`src/app/(client)/client/client-navigation.ts` (7 items: home, cases,
appointments=`/client/court-dates`, files, payments, assistant, profile).

## 1E. Admin (27 files: 24 full UI + 3 redirect-only)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 44 | `/admin` | AR | Admin | `AdminCommandCenter` (`src/features/admin/dashboard/admin-command-center.tsx`) | `AppRoot` + `AdminShell` |
| 45 | `/admin/cases` | AR | Admin | inline list view | `AdminShell` |
| 46 | `/admin/cases/new` | AR | Admin | `ManualCaseCreateForm` | `AdminShell` |
| 47 | `/admin/cases/[caseId]` | AR | Admin | inline tabbed view + case/task/document forms | `AdminShell` |
| 48 | `/admin/clients` | AR | Admin | inline list + `ClientCreateForm` | `AdminShell` |
| 49 | `/admin/clients/[clientId]` | AR | Admin | inline detail + `ClientActionPanel` | `AdminShell` |
| 50 | `/admin/consultations` | AR | Admin | inline review list | `AdminShell` |
| 51 | `/admin/consultations/[consultationId]` | AR | Admin | inline detail + `ConsultationActionPanel` + sub-forms | `AdminShell` |
| 52 | `/admin/consultation-availability` | AR | Admin | `ConsultationAvailabilityForm` | `AdminShell` |
| 53 | `/admin/calendar` | AR | Admin | inline day-grouped view + appointment forms | `AdminShell` |
| 54 | `/admin/tasks` | AR | Admin | inline kanban + `TaskCreateForm`/`TaskUpdateForm` | `AdminShell` |
| 55 | `/admin/documents` | AR | Admin | inline list + `AdminDocumentUploadForm`/`DocumentActionForm`/`DocumentDeleteForm` | `AdminShell` |
| 56 | `/admin/finance` | AR | Admin | inline invoices + gateway ops + `PaymentForm`/`PaymentGatewaySettingsForm`/`ConsultationPricingRuleForm`/`WebhookReplayButton` | `AdminShell` |
| 57 | `/admin/messages` | AR | Admin | inline inbox list | `AdminShell` |
| 58 | `/admin/messages/[threadId]` | AR | Admin | `AdminMessageThreadPanel` | `AdminShell` |
| 59 | `/admin/contact-messages` | AR | Admin | `ContactMessageInbox` | `AdminShell` |
| 60 | `/admin/notifications` | AR | Admin | `AdminNotificationCenter` | `AdminShell` |
| 61 | `/admin/reports` | AR | Admin | inline metrics + status bars + recent-payments table | `AdminShell` |
| 62 | `/admin/settings` | AR | Admin | `OfficeProfileSettingForm` + deferred/readonly panels | `AdminShell` |
| 63 | `/admin/users` | AR | Admin | inline list + `AdminUserCreateForm` | `AdminShell` |
| 64 | `/admin/users/[userId]` | AR | Admin | inline detail + `AdminUserActionPanel` + `AdminUserPasswordForm` | `AdminShell` |
| 65 | `/admin/roles` | AR | Admin | `RolePermissionForm` | `AdminShell` |
| 66 | `/admin/content` | AR | Admin | inline hub + `ArticleForm`/`CaseStudyForm`/`SocialDraftForm`/`AiSocialDraftForm` | `AdminShell` |
| 67 | `/admin/content/articles` | AR | Admin | redirect-only → `/admin/content?tab=articles` | — |
| 68 | `/admin/content/case-studies` | AR | Admin | redirect-only → `/admin/content?tab=case-studies` | — |
| 69 | `/admin/content/social` | AR | Admin | redirect-only → `/admin/content?tab=social` | — |
| 70 | `/admin/audit-log` | AR | Admin | inline list view | `AdminShell` |

Entry files mirror the routes under `src/app/(app-ar)/admin/`.
Nav source: `src/app/(app-ar)/admin/admin-navigation.ts`.
Shell states: `error.tsx`, `loading.tsx`, `not-found.tsx` use
`AdminShellState` (`src/components/layout/admin-shell-state.tsx`).

## 1F. Preview (gated, 2 files / 2 routes)

| # | Route | Locale | Area | Page Component | Layout |
|---|---|---|---|---|---|
| 71 | `/preview/ui` | EN | Internal | `UiPreview` (`src/features/ui-preview/ui-preview.tsx`) | `PreviewRoot` (own dark `ThemeProvider`) |
| 72 | `/preview/components` | EN | Internal | `ComponentGallery` (`src/features/ui-preview/component-gallery.tsx`) + `gallery-islands.tsx` | `PreviewRoot` |

Gate: `NODE_ENV==="production" && KMT_ENABLE_UI_PREVIEW!=="true"` → `notFound()`.

## Non-routes observed (no `page.tsx`, render nothing)

- Empty placeholder dirs: `src/app/(app-ar)/admin/[...section]`,
  `src/app/(app-ar)/client/*`, `src/app/(app-ar)/portal/*`,
  `src/app/(app-ar)/product-system/*`, `src/app/(public-ar)/client-account/setup`,
  `src/app/payment/consultation/return` — directories exist, contain no files.
- Retired visual-clone input: `src/app/(install-ar)/stitch-clone/[screen-name]`
  — empty dir, no route (per repo rule runtime `/stitch-clone/*` is retired).
- API routes (`src/app/api/**`) and `sitemap.ts`, `global-error.tsx`,
  `global-not-found.tsx` are not UI pages and are excluded from the counts.

---

# STEP 2 — PAGE STRUCTURE (TOP TO BOTTOM)

Shared chrome: every `PublicShell` page renders `PublicHeader` → `<main>`
(view below) → footer CTA card (`BorderBeam` + `KmtGoldUnderline` +
`KmtUnderlinedText` + `ShimmerCtaLink` to `/book-consultation`) → 4-column
footer (brand plaque + practice links nav + offices + contact) → legal bar
(copyright + privacy/terms links) → `PublicFloatingDock` (all public routes
EXCEPT `/book-consultation` and `/ar/book-consultation`).

## PAGE: Home — `/`, `/ar`

Entry: `src/app/(public-en)/page.tsx` / `src/app/(public-ar)/ar/[[...path]]/page.tsx`
(pass-through to shared view).
Page component: `HomePageView` (`src/features/public-site/public-pages.tsx:219`).
Layout: `ENRoot`/`ARRoot` + `PublicShell`.

1. `HeroParallaxLayers` — eyebrow pill → `TextAnimate` h1 (`blurInUp`,
   by word) → `KmtGoldUnderline` medium → description with
   `KmtUnderlinedText` highlight → stats `dl` (`CountingNumber` + suffix,
   3 cols) → matter picker card (`radiogroup`, 6 practice-area radio
   buttons + browse link) → right photo (`next/image`
   `/stitch-assets/b392…png`) + docket card (`BorderBeam` +
   `ShimmerCtaLink` booking link).
2. `TrustStrip` — `Marquee` (repeat 2, pause on hover) of trust icons.
3. `PublicSection` (center) → `CapabilityRows` — numbered `01…` service
   rows (`BlurFade` + `CapabilityGlowGate` + `Badge` + `Link`).
4. `StatementBreak` — `KmtGoldUnderline` short + `KmtTextUnderline` strong.
5. `PublicSection` (muted, roomy) → `StickyScroll` — 3 stages
   (included/documents/outcomes) with sticky visual panel (desktop) /
   stacked text (mobile), images `/stitch-assets/2484…png`.
6. `PublicSection` (center) → `ProcessSteps` — `Timeline` (scroll rail).
7. `PublicSection` (muted, roomy, center) → `MatterRows` — `HoverEffect`
   cards.
8. `PublicSection` → `IndustryLedger` — hairline `ul` ledger, 2-col.
9. `PublicSection` (muted) → `FocusCards` — image cards (`h-72 md:h-96`,
   `sm:2 md:3` grid) linking to team.
10. `PublicSection` → `InsightsLedger` (lead + rows) or empty
    `publicPanel` + `ButtonLink`.

## PAGE: Services — `/services`, `/ar/services`

Entry: `services/page.tsx` / catch-all. Component: `ServicesPageView`
(`public-pages.tsx:366`).

1. `PageHero` (compact, `texture=dots`, image
   `/stitch-assets/b8b47…png`, `min-h-[360px] md:420px`).
2. `PublicSection` → `DirectoryFilter layout="rows"` — search `TextInput`
   + category pill buttons (`aria-pressed`) + clear button → `ol` of
   `MagicCard` + `BlurFade` rows (numeral, category, chips, meta,
   `ButtonLink` viewDetails).
3. `PublicSection` (muted) → CTA row: `ButtonLink` book + `ButtonLink`
   secondary team.

## PAGE: Service detail — `/services/[slug]`, `/ar/services/[slug]`

Component: `ServiceDetailPageView` (`public-pages.tsx:406`).

1. `PublicSection` h1 + `PublicBreadcrumbs` (+ BreadcrumbList JSON-LD
   `script`).
2. Grid `lg:[1fr_360px]`: `article.publicPanel` (`MaterialSymbol` icon,
   content paragraphs, `h2` + gold `Badge` included, `h2` + `Badge`
   documents, outcomes checklist with `check_circle` icons, `ButtonLink`
   secondary back) + `DetailCta` aside (`lg:sticky`, `ButtonLink` with
   `?service=`).
3. Related-services ledger `nav > ul > Link` with `arrow_forward` icons.

## PAGE: Team — `/team`, `/ar/team`

Component: `TeamPageView` (`public-pages.tsx:508`).

1. `PageHero` (compact, image `/stitch-assets/bd64…png`,
   `object-[center_38%]`).
2. `PublicSection` → `DirectoryFilter layout="cards"` — search + pills →
   image cards (`h-56`, `next/image` `publicPhotoTreatment`, `Badge` +
   meta + `ButtonLink`), grid `md:2 lg:3`.

## PAGE: Team detail — `/team/[slug]`, `/ar/team/[slug]`

Component: `TeamDetailPageView` (`public-pages.tsx:537`).

1. `PublicSection` h1 + `PublicBreadcrumbs` (+ JSON-LD `script`).
2. Grid `lg:[360px_1fr]`: photo (`aspect-[4/5]`, `publicPhotoTreatment`)
   + `div.publicPanel` (specialties gold `Badge`s, languages neutral
   `Badge`s, experience / education (`history_edu` icon) / admissions,
   warning `bookingNotice` box, `relationshipNotice` paragraph,
   `ButtonLink` CTA to `/book-consultation?lawyer=`).

## PAGE: Articles — `/articles`, `/ar/articles`

Component: `ArticlesPageView` (`public-pages.tsx:633`, `revalidate 900`).

1. `PageHero` (compact, image `/stitch-assets/2c0d…png`).
2. `PublicSection` → `DirectoryFilter` cards (title/excerpt/category/
   readTime), grid `md:2 lg:3`.

## PAGE: Article detail — `/articles/[slug]`, `/ar/articles/[slug]`

Component: `ArticleDetailPageView` (`public-pages.tsx:660`).

1. `ReadingProgress` (fixed `scaleX` bar).
2. `PublicSection` h1 + breadcrumbs (+ JSON-LD) → grid `lg:[1fr_360px]`:
   `article.publicPanel` (category gold `Badge`, time neutral `Badge`,
   byline, `ArticleBody` rendering `##` headings/bullets/paragraphs,
   disclaimer warning box, `ButtonLink` secondary back) + `DetailCta`.
3. Related section (`md:3` `Link publicPanelHover` cards, same-category).

## PAGE: Case studies — `/case-studies`, `/ar/case-studies`

Component: `CaseStudiesPageView` (`public-pages.tsx:756`).

1. `PageHero` (compact, image `/stitch-assets/927e…png`).
2. `PublicSection` → `DirectoryFilter` cards (`meta=year`).

## PAGE: Case study detail — `/case-studies/[slug]`, `/ar/case-studies/[slug]`

Component: `CaseStudyDetailPageView` (`public-pages.tsx:783`).

1. `PublicSection` h1 + breadcrumbs → grid `lg:[1fr_360px]`:
   `article.publicPanel` (`Badge`s + `Reveal delay=index*60` →
   `CaseStudyBlock` numbered blocks
   challenge/approach/generalOutcome/lessons + disclaimer + `ButtonLink`
   back) + `DetailCta`.

## PAGE: Media — `/media`, `/ar/media`

Component: `MediaPageView` (`public-pages.tsx:855`).

1. `PageHero` (compact, image `/stitch-assets/f9ad…png`,
   `object-[center_52%]`).
2. `PublicSection` → grid `md:3` of `article.publicPanelHover` cards
   (`Badge` type + date `span` + `h2` + `p`).

## PAGE: Contact — `/contact`, `/ar/contact`

Component: `ContactPageView` (`public-pages.tsx:880`).

1. `PageHero` (compact, image `/stitch-assets/11c3…png`).
2. Grid `lg:[1fr_420px]`: left `ContactForm`
   (`src/features/public-site/contact-form.tsx:42`,
   `form[data-testid=contact-form]`: `TextInput` fullName/email/phone +
   `Select` topic (4 options) + `Textarea` message + hint + consent
   checkbox + success `div[role=status]` / error `p[role=alert]` +
   `ShimmerButton` submit + conditional `Button` secondary newMessage) →
   right `aside`: per-branch `section.publicPanel` rows
   (`location_on`/`call`/`schedule`/`mail` icons + `tel:`/`mailto:` links)
   + WhatsApp panel (`ButtonLink` external).

## PAGE: Book consultation — `/book-consultation`, `/ar/book-consultation`

Component: `BookConsultationPageView` (`public-pages.tsx:952`) →
`ConsultationBookingChatFromQuery`
(`src/features/public-site/booking-query-client.tsx:9`) →
`ConsultationBookingChat`
(`src/features/public-site/consultation-booking-chat.tsx:168`).

1. `BookingFlowHeader` (compact section, eyebrow, h1, description with
   `KmtUnderlinedText`).
2. Centered `max-w-[56rem]` → `Suspense` (fallback `publicPanel`) →
   assistant shell `section[data-testid=booking-stepper]` (`BorderBeam` +
   `MotionConfig`, `h-[min(72vh,38rem)] max-sm:[84svh]`): header
   (`KmtBrandLogo` mark + online dot + scope) → `div[role=log]`
   `AnimatedList`: `ChatBubble` (user gold / assistant / info-card `ol`),
   `LanguageChoicePanel` (2 `Button`s), `SlotChoicePanel` (day-grouped
   `Button` chips), confirm row (`Button` confirm + `Button` secondary
   back), `PaymentReviewPanel` (`dl` 5 `PaymentReviewItem`s + pay `Button`
   + back `Button`) → quick-action `Button` chips → composer
   `PlaceholdersAndVanishInput` (`input[name=chatMessage]` + round send
   `Button`) + privacy `p` (lock icon).
3. Legacy, NOT rendered by this view: `ConsultationAssistantPanel`
   (`consultation-assistant-panel.tsx`) and `BookingStepper`
   (`booking-stepper.tsx`).

## PAGE: Privacy / Terms — `/privacy`, `/terms`, `/ar/privacy`, `/ar/terms`

Components: `PrivacyPageView` (`public-pages.tsx:982`),
`TermsPageView` (`public-pages.tsx:1061`). Same skeleton.

1. `PublicSection` h1 → grid `lg:[260px_1fr]`: sticky aside
   `publicPanel` → `PolicyToc` (`src/features/public-site/policy-toc.tsx`,
   `nav > ol > a[href=#id]`, `IntersectionObserver` active gold edge) +
   `article` (`data-testid=privacy-policy|terms-policy`, sections
   `scroll-mt-28` with `h2`/`p`/`ul list-disc`; privacy adds summary card
   with `time` + `dl sm:2` summary items).

## PAGE: Client account setup — `/client-account/setup`, `/ar/client-account/setup`

Component: `ClientAccountSetupPage`
(`src/features/public-site/client-account-setup-page.tsx:22`).

1. `main max-w-[1060px]` grid `lg:[1fr_0.9fr]`: left gold-gradient card
   (eyebrow, h1 title/expiredTitle, description) → conditional: (a) no
   token → `Link` login + `Link` book-consultation; (b) `hasPortalAccount`
   → panel + login `Link`; (c) else `ClientAccountSetupForm`
   (`client-account-setup-form.tsx:40`: `form` → `Field`
   email/password/confirmPassword with hint + error `p` +
   `div[role=status]` + submit `button` with `account_circle` icon +
   spinner) → right (if context) `ConsultationSummary` aside (`dl` rows
   clientName/reference/summary/appointmentTime).

## PAGE: Payment return — `/payment/consultation/return`

Inline server view
(`src/app/(public-ar)/payment/consultation/return/page.tsx`).

1. `section max-w-[940px]` dark card: header (`MaterialSymbol` + tone
   icon class, eyebrow/h1/description via `statusTone()`) → conditional
   `PaidConfirmation` emerald panel (`check_circle` badge + `dl`
   client/phone/paidAmount/receiptNumber) / `safeLinkNotice` /
   `PaymentStatusPoller`
   (`src/features/public-site/payment-status-poller.tsx`, polls
   `/api/public/payments/status`, 4s poll + 1s `MM:SS` countdown) / `dl`
   `StatusItem` cards (attemptId/status/amount/appointment/invoiceNumber/
   expiresAt, `formatMoney`) / missing-status error → action row (`Button`
   pay with lock, receipt `Button`, setup/login `Button`, new-booking
   `Button`).

## PAGE: Payment receipt — `/payment/consultation/receipt`

Component: `ConsultationPaymentReceiptDocument`
(`src/features/payments/consultation-payment-receipt-document.tsx`) +
`ReceiptPrintButton`.

1. Top bar (`print:hidden`): back link (`arrow_back`, `/client/payments`)
   + `ReceiptPrintButton` (`window.print()`).
2. `article max-w-[980px]`: header (`KmtBrandLogo` lockup +
   sublabel + h1) → stats 3-col (`ReceiptStat` invoice/receipt/paid) →
   `ReceiptPanel` client + payment (provider `PayTabs`/`Paymob`,
   `dir=ltr` ids) → `ReceiptPanel` consultation
   (category/mode/appointment/reference) → total panel + `check_circle`
   confirmed → footer note. Print-only Tailwind variants.

## PAGE: Login — `/login`

Inline view (`src/app/(login)/login/page.tsx`) + `LoginForm`
(`src/features/auth/login-form.tsx`). Blocked variant
(`LoginReadinessBlocked`) when readiness fails.

1. `main bg-kmt-canvas` grid `[1fr_460px]`: left `section max-w-xl`
   (`KmtBrandLogo` full sm, language `Link /login?locale`, eyebrow/h1/
   description, `securityNote` box, `backHome` underline link) → right
   `Suspense` (`min-h-64` fallback) → `Card` (`CardHeader`/`CardTitle`/
   `CardDescription`): `2fa_expired` notice (`role=status`), `TextInput`
   email (`dir=ltr`) + `TextInput` password, error (`role=alert`),
   `Button` full-width loading with `arrow_forward` icon.

## PAGE: 2FA — `/login/2fa`

No UI: `notFound()` only. No components, forms, or animations.

## PAGE: Install — `/install`

Component: `InstallWizard` (`src/features/install/install-wizard.tsx:1`).

1. `div max-w-5xl` intro (title/description) → grid `[1fr_22rem]`: left
   `Card 1` hostingMode radios (`terminal-vps`/`aapanel`/`cpanel`) +
   `Card 2` token (`TextInput` + readiness-check button) + `Card 3`
   office+admin form (`TextInput` firmName/publicEmail/publicPhone/
   adminName/adminEmail/password/confirmPassword) + `Card 4` finish
   (lock toggle + `superAdminEmail` ltr) → aside `ModePanel` +
   `StatusPanel` + `ChecksPanel` + success/error `Notice`.

## PAGE: Client dashboard — `/client`

Inline view (`src/app/(client)/client/page.tsx`) in `ClientSiteShell`.

1. Metrics `md:4` grid (`ClientPortalMetric`: gavel/event/folder/
   payments icons, `formatMoney`/`formatDateTime`).
2. `nextStep` panel (`ButtonLink` secondary + `ClientPortalRow`).
3. Grid `xl:2`: cases panel (`Link` rows + `Badge`) + appointments panel
   (`Badge` pending/neutral).
4. Payments panel grid `md:2/xl:3` (`Badge` active/closed/pending).
5. `ClientPortalEmpty` dashed empty states.

## PAGE: Client cases — `/client/cases`

Inline view: single `DataTable` (columns case-link+fileNumber / status /
priority / lawyer / nextDate) with `MobileCard` (`DataRecordCard`:
title/description/badges/fields/open action).

## PAGE: Client case detail — `/client/cases/[caseId]`

Inline view, shell `action=back /client/cases`: overview
`ClientPortalPanel` (status/priority `Badge`s, `internalFileNumber`,
`sm:2/lg:4` `ClientPortalDetailItem` grid: lawyer/email/nextDate/created
+ summary) → grid `xl:2`: sessions panel + appointments panel → grid
`xl:2`: documents panel (download `a /api/files/[id]/download` +
`formatBytes`) + payments panel (invoiceNumber + `formatMoney`).

## PAGE: Client assistant — `/client/assistant`

`ClientAssistantPanel` + `ClientTeamChatPanel`
(`src/features/client/client-assistant-panel.tsx`,
`src/features/client/client-team-chat-panel.tsx`).

- Assistant surface (`ClientPortalPanel`): gradient shell header
  (`KmtBrandLogo` mark, name/status, scope pill) → quick-actions
  horizontal scroll (`overflow-x-auto scrollbar-hide`, incl. `forum`
  talk-to-team → `setSurface("team")`) → log `role=log max-h-[36rem]`
  (`ClientChatBubble` user gold / assistant + disclaimer +
  `AssistantData` cards via `ClientPortalRow`+`Badge`) + `TypingIndicator`
  → composer `form[data-testid=client-assistant-composer]` (`Textarea` +
  round send `Button`).
- Team surface: header (brand, conversation `Badge`, `arrow_back` back) →
  scope/closed bar → log `max-h-[34rem] min-h-[26rem]` (`TeamBubble` +
  `TeamTyping`) → composer (`Textarea maxLength=2000` + round send +
  lock privacy note).

## PAGE: Client files — `/client/files`

Grid `xl:[1fr_24rem]`: left `ClientPortalPanel` + `DataTable` (file
download link+size / case / category / status / created) + `MobileCard` →
right `DocumentUploadForm`
(`src/features/portal/document-upload-form.tsx`): `ClientPortalSelect`
caseId + category + `<input type=file accept=.pdf,.doc,.docx,.jpg,.jpeg,.png>`
(`client-portal-file-input`).

## PAGE: Client payments — `/client/payments`

Metrics `sm:3` (`pending_actions`/`account_balance_wallet`/`receipt_long`)
→ totals note → `GatewayAttemptCards` grid `md:2/xl:3` (amount + `Badge`,
appointment title/time, invoice, `continuePayment` checkout link +
`followStatus` return link) → `DataTable` (invoice / case link / amount /
status / issued / dueDate / receipt view|unavailable) + `MobileCard`.

## PAGE: Client court dates — `/client/court-dates`

Single `DataTable` (appointment title+type / case|consultation / time /
mode / lawyer / status `Badge`) + `MobileCard`.

## PAGE: Client profile — `/client/profile`

Grid `xl:[1fr_24rem]`: `ProfileForm`
(`src/features/portal/profile-form.tsx`: `TextInput`
fullName/phone/email/city + status `role=status`) +
`ClientPortalPanel` account card (`DetailItem`
loginEmail/responsibleLawyer/fileCreated).

## PAGE: Admin dashboard — `/admin`

`AdminCommandCenter`
(`src/features/admin/dashboard/admin-command-center.tsx` +
`dashboard-metric-link.tsx` + `dashboard-priority-list.tsx`).

1. Navy hero `header` (eyebrow/title/description/generatedAt +
   quick-action `nav` of `ButtonLink`s).
2. `ClientSearch` form (`GET /admin/clients`, `SearchInput q` + submit).
3. Priority section (`SectionHeading` + `xl:2` `DashboardPriorityList`
   cards: `CardHeader`/`Content ol PriorityItem Link+Badge`/`Footer`, or
   `StateBlock`).
4. Metrics `sm:2 2xl:4` (`DashboardMetricLink` cards).
5. `RecentActivity ol` rows (`Link` title+badge+meta).

## PAGE: Admin cases — `/admin/cases`

Inline view. `DashboardShell action=ButtonLink /admin/cases/new`.
Filter `form GET` (`FilterBar`: `SearchInput q` + `Select`
status(7)/priority(4)/caseType/assignedLawyerId/sortBy(6)/sortDirection +
`Button` apply) → count row → `DataTable` (desktop) / `DataRecordCard`
(mobile) → pagination row → `StateBlock`.

## PAGE: Admin case detail — `/admin/cases/[caseId]` (`?tab=`)

Inline view + `ManualCaseEditForm` (`manual-case-form.tsx`),
`CaseStatusForm`/`CaseSessionForm`/`AppointmentRescheduleForm`
(`case-action-forms.tsx`), `TaskCreateForm`/`TaskUpdateForm`/
`AdminDocumentUploadForm`/`DocumentActionForm`/`DocumentDeleteForm`
(`task-document-forms.tsx`).

1. Header `Card` (title/description + status `Badge` + anchor
   `ButtonLink #case-core-edit`).
2. `MetricCard` ×4 (sessions/appointments/tasks/documents).
3. `CaseTabs nav` (active tab `border-b-2 border-kmt-gold` links).
4. Tab body: Overview (`Card` data grid `DetailItem` ×9 + summary box +
   `ManualCaseEditForm` + parties `Card`) / Sessions (`Card` list) /
   Appointments (`Card` list + inline reschedule form) / Tasks (grid:
   list `article[data-task-id]` + `details>summary` edit →
   `TaskUpdateForm` + new-task `Card` → `TaskCreateForm`) / Documents
   (grid: list `details>summary` with download `Link` +
   `DocumentActionForm` + `DocumentDeleteForm` + upload `Card`).
5. Sidebar `25rem`: `CaseStatusForm` card (`Select` + `Textarea` +
   checkbox) + `CaseSessionForm` card + calendar `Card` (`ButtonLink`
   `/admin/calendar?caseId=`). Disclosures are native
   `<details><summary>` (no dialog library).

## PAGE: Admin case new — `/admin/cases/new` (`?clientId=`)

`ManualCaseCreateForm` (`manual-case-form.tsx`), `max-w-5xl`: client
`Card` (search `TextInput` + `Select` clientId/lawyer + `StateBlock`) →
case `Card` (`CaseCoreFields`) → parties `Card` (`PartyFields` rows +
addParty `Button`) → `InlineFeedback` region → footer (`ButtonLink`
cancel + `Button` create).

## PAGE: Admin clients — `/admin/clients`

Inline list + `ClientCreateForm` (`client-crm-forms.tsx`), grid
`1fr_25rem`: left filter `form GET` + count + `DataTable`/`DataRecordCard`
+ pagination; right create `Card` (fullName/phone/email/city/source/
status/assignedLawyer) or permission `StateBlock`.

## PAGE: Admin client detail — `/admin/clients/[clientId]`

Inline detail + `ClientActionPanel`, grid `1fr_25rem`: data `Card`
(`Badge` + `DetailItem` grid) → `MetricCard` ×4 → linked-cases `Card`
(`Link` rows + conditional `ButtonLink …/cases/new?clientId=`) → 2-col
consultations/appointments cards → sidebar action stack (edit / assign /
portal-account create+reset / archive cards + `InlineFeedback`).

## PAGE: Admin consultations — `/admin/consultations`

Inline review list: outcome-view tab `nav` (`buttonClasses`
primary/secondary + count `Badge`s) → definition `p` → filter `form GET`
(hidden view + `SearchInput` + `Select` status/assigned/review + apply) →
quick chips + count → `DataTable` → pagination.

## PAGE: Admin consultation detail — `/admin/consultations/[consultationId]`

Inline detail + `ConsultationActionPanel`
(`consultation-action-panel.tsx`) + `consultation-schedule-form.tsx` /
`consultation-outcome-form.tsx` / `consultation-reopen-form.tsx`, grid
`1fr_24rem`: left outcome `Card` (grid status/changedAt/changedBy/reason/
version/primaryStart/End + note + `InlineFeedback`) + request-data `Card`
+ client-message `Card` (`pre-wrap` + opposing-party amber box) + AI
summary `Card` → right action stack (schedule / outcome+correction /
reopen / secretary review `Textarea`+`Button` / assign `Select` / convert
form / reject form + `InlineFeedback`).

## PAGE: Admin availability — `/admin/consultation-availability`

`ConsultationAvailabilityForm`: explainer `StateBlock` → rules `Card`
(number `TextInput`s slotDuration/minLead/bookingWindow + timezone/
enabledCount) → weekly-hours `Card` (per-weekday: enabled checkbox +
start/end time + ONLINE/PHONE/OFFICE checkboxes) → `InlineFeedback` →
save `Button` with `save` icon.

## PAGE: Admin calendar — `/admin/calendar`

Inline view, grid `1fr_25rem`: left filter `form GET` (date `TextInput`s +
`Select` status/mode/lawyer + apply) → summary row → per-day `section`
(h2 + count `Badge` + appointment `Card`s: header/content grid +
inline `AppointmentRescheduleForm` or blocked note) or `StateBlock` →
pagination → right `CalendarAppointmentForm` card + limits `StateBlock`.

## PAGE: Admin tasks — `/admin/tasks`

Inline kanban, grid `1fr_25rem`: left filter `form` (`SearchInput` +
`Select` view/status/priority/assignee/sortBy/sortDirection) → count →
`xl:3 2xl:6` status columns (`TaskCard article`: title/assignee/due/
priority `Badge`/desc/case `Link` + `details` → `TaskUpdateForm`) or
`StateBlock` → pagination → right new-task `Card` → `TaskCreateForm`.

## PAGE: Admin documents — `/admin/documents`

Inline view, grid `1fr_25rem`: left filter `form` (`SearchInput` +
`Select` status/category/visibility/ownerClient/sortBy/sortDirection) →
count → desktop `DataTable` + `mobileRender DocumentCard` + stacked
`DocumentCard details` (meta grid + `DocumentActionForm` +
`DocumentDeleteForm`) → pagination → right upload `Card` →
`AdminDocumentUploadForm` (case/owner/category/visibility/file, 5MB hint).

## PAGE: Admin finance — `/admin/finance`

Inline view + `finance-forms.tsx` (`PaymentForm`,
`PaymentGatewaySettingsForm`, `ConsultationPricingRuleForm`,
`WebhookReplayButton`) + `finance-page-helpers.ts`.

1. `MetricCard` ×4 (total/paid/open/overdue + review counts + amber
   mixed-currency warning).
2. Grid `1fr_25rem`: left invoice filter `form` + count + CSV export `Link`
   + `DataTable` + `PaymentMobileCard` + pagination; right invoice `Card`
   → `PaymentForm` (create/edit) or `StateBlock`.
3. `PaymentGatewayOperationsPanel`: ops filter `Card` (`FilterBar`) →
   consultation-value `Card` (pricing list + gateway settings + pricing
   rule form) → 2-col payment-attempt + webhook-event cards (each with
   own pagination; `WebhookReplayButton`).

## PAGE: Admin messages — `/admin/messages`

Inline inbox: filter `form` (`SearchInput` + `Select` status/assignee +
apply) → count → `DataTable` (+ `ConversationMobileCard`) → pagination.

## PAGE: Admin thread — `/admin/messages/[threadId]`

`AdminMessageThreadPanel`: grid `1fr_22rem`: chat `section` (header
`Badge` + subject + scroll `max-h-36rem` bubbles — staff navy right /
client white left, avatar `MaterialSymbol`s + reply `form`: `textarea`
maxLength 2000 + send `Button` + error `p`) + aside client `dl` + manage
card (`select` assignee + `select` status). Polls thread every 5s.

## PAGE: Admin contact messages — `/admin/contact-messages`

`ContactMessageInbox`: filter `form` (`SearchInput` + `Select`
status/topic/sortBy/sortDirection) → reader-only `StateBlock` (no
permission) → `aria-live` feedback → count → `DataTable` (message cell
uses `details>summary` openDetails) + mobile `DataRecordCard` → footer
(clear + prev/next). Row actions: markReviewed/archive `Button`s.

## PAGE: Admin notifications — `/admin/notifications`

`AdminNotificationCenter`: stat grid ×3 → `ul NotificationItemView`
(`Link` title/description/dates + unread `Badge` + markRead ghost
`Button`) or empty `StateBlock` → `aria-live` feedback → loadMore `Button`
/ exhausted note / error `StateBlock` retry. Header bell variant uses
native `<details><summary>` popover (30s poll).

## PAGE: Admin reports — `/admin/reports`

Inline view: filter `form` (date `TextInput`s + currency `Select` + apply)
→ currency warning `InlineFeedback` → review counts `p` →
finance `MetricCard` ×4 → ops `MetricCard` ×4 → 2-col `StatusBars` ×4
(`Badge` + count + gold `div h-2 bg-kmt-gold` width bar, static) →
recent-invoices `Card` (`DataTable` + open-invoices `Link`).

## PAGE: Admin settings — `/admin/settings`

Governance forms (`governance-forms.tsx`), grid `xl:2`: storage-diagnostic
`Card` (`xl:col-span-2`: `StateBlock` + `dl`
driver/maxUpload/path/root/scanner/allowedTypes/checkedAt) → per-setting
cards (`OfficeProfileSettingForm` editable; `SecurityStaff2faSettingForm`
and `EmailPolicySettingForm` deferred/disabled `StateBlock`s).

## PAGE: Admin users — `/admin/users`

Inline list + `AdminUserCreateForm`: create `Card` (name/email/phone/role/
status/locale/password/confirm + `InlineFeedback`) if permitted → filter
`form` → count → `DataTable` (+ `UserMobileCard`) → pagination.

## PAGE: Admin user detail — `/admin/users/[userId]`

Inline detail + `AdminUserActionPanel`/`AdminUserPasswordForm`, grid
`1fr_25rem`: left 3 status cards + permissions `Card` (`Badge` wrap) +
sessions `DataTable` + audit `DataTable` + links `Card` → right action
stack (manage card + CRM link/create card + password card with
revoke-sessions checkbox + `InlineFeedback`).

## PAGE: Admin roles — `/admin/roles`

`RolePermissionForm`: grid `20rem_1fr`: left role-list `Card` (per-role
`button`: label + active `Badge` + userCount; selected
`border-kmt-gold bg-gold/10`) → right `form`: permission-matrix `Card`
(`fieldset` per group + 2-col checkbox cards) → footer save `Button` +
stale reload + `aria-live InlineFeedback`.

## PAGE: Admin content — `/admin/content` (`?tab=&editType&editId`)

Inline hub + `content-forms.tsx` (`ArticleForm`, `CaseStudyForm`,
`SocialDraftForm`, `AiSocialDraftForm`): `MetricCard` ×5 → tab `nav`
(active `border-b-2` gold) → grid `1fr_26rem`: left filter `form` + count
+ `DataTable` + `ContentMobileCard` + pagination; right edit/create `Card`
(article/case-study with `anonymized` checkbox / social draft fields +
permission `StateBlock`) + AI panel `Card` → `AiSocialDraftForm` if
permitted. Redirect-only sub-pages render no UI.

## PAGE: Admin audit log — `/admin/audit-log`

Inline list: filter `form` (`SearchInput` + `Select`
actor/action/resourceType + ltr `TextInput` id filters + date range +
sort) → count → `DataTable` (event cell: label + category/severity
`Badge` + summary + occurredAt; details cell: `DetailList dl` +
`TechnicalDetails details>summary`) + `AuditMobileCard` → pagination.

## PAGE: Preview UI — `/preview/ui`

`UiPreview` (`ui-preview.tsx` + `ui-preview.module.css`): skip link →
`header` (brand button→home, `nav`, language toggle) → warning `label` →
`#preview-main`: `Home` mock (hero `Image` + shade + eyebrow/h1/lead/
actions + trust, `0N` service rows, process `ol`, peopleRail lawyer
images, sectors 4) / `Service` mock (intro + scope + outcomes +
documents + otherServices 3) / `Booking` mock
(`section[aria-labelledby]`: stages service>method>details>slot>review
with quickChoices/userMessage/edit + `reviewPanel`
confirmed/success|conflict/error + formActions confirm/conflict/retry/
simulateError + `desktopSummary aside` + `summaryOpener button` + native
`<dialog drawer data-preview-summary=mobile>`) → `footer`. Simulated
`BookingForm` only (service/method buttons, `textarea` details, slot
chips, review `dl` + per-stage edit). Animations: smooth/auto scroll,
per-stage `autoFocus`, CSS modules.

## PAGE: Preview components — `/preview/components`

`ComponentGallery` + `gallery-islands.tsx`: sticky `header`
(eyebrow/h1 + `ThemeToggle`) → `main max-w-6xl space-y-10`
`GallerySection`s: Buttons (5 variants + sm/md/lg/disabled/loading +
`ButtonLink` + icons) → Badges (6 tones + sm) → Fields
(`TextInput`/`Select`/`Textarea`/`SearchInput`) → Feedback
(`InlineFeedback` ×4 + `Toast` info/error) → States (`StateBlock`
empty/loading/permission/error) → Tabs (pressed group + `LinkTabs` with
counts) → Pagination (`?page=` + summary + reset) → Dialog (`DialogDemo`)
→ Skeletons (`Skeleton`/Card/Table) → Data (`DataTable` demo sticky
header + `DataRecordCard`) → Cards (`Card` set + `CountUpDemo`) → Filter
bar + icons (`FilterBar` + `MaterialSymbol` set) → Animate UI
(`RippleButton`, `Tilt`, `SplittingText`) → Motion (`ShimmerDemo`,
`CountUpDemo`).

---

# STEP 3 — COMPONENT INVENTORY PER PAGE

TYPE: Layout | Navigation | Section | Card | Form | Input | Button | Overlay |
Data display | Motion | Background | Utility | Custom.
SOURCE: Local custom | shadcn-style local | Aceternity | Magic UI |
Animate UI | Radix (`radix-ui` via Animate-UI primitives) | Motion
(`motion/react`) | GSAP | Lenis | `next/*` | CSS.

## 3.1 Home (`/`, `/ar`)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Shell | `PublicHeader` | `src/components/layout/public-header.tsx` | Navigation | Local + Aceternity + Animate UI | Yes | Yes | Yes |
| Hero | `HeroParallaxLayers` | `src/components/motion-ui/hero-parallax-layers.tsx` | Section | Local + GSAP + Motion | Home only | Yes (picker) | Yes |
| Hero | `Spotlight` | `src/components/ui/spotlight-new.tsx` | Background | Aceternity | Yes (hero only prod) | No | Yes (Motion) |
| Hero | `TextAnimate` | `src/components/ui/text-animate.tsx` | Motion | Magic UI | Yes | No | Yes (Motion) |
| Hero | `CountingNumber` | `src/components/animate-ui/counting-number.tsx` | Data display | Animate UI | Yes (hero stats) | No | Yes (Motion) |
| Hero | `KmtGoldUnderline` | `src/components/ui/kmt-gold-underline.tsx` | Utility | Local custom | Yes | No | Yes (CSS) |
| Hero | `KmtUnderlinedText` | `src/components/ui/kmt-text-underline.tsx` | Utility | Local + Magic UI `Highlighter` | Yes | No | Yes |
| Hero | `BorderBeam` | `src/components/ui/border-beam.tsx` | Motion | Magic UI | Yes | No | Yes (Motion) |
| Hero | `ShimmerCtaLink` | `src/components/ui/shimmer-cta-link.tsx` | Button | Magic UI adaptation | Yes | Yes (link) | Yes (CSS) |
| Trust | `TrustStrip` + `Marquee` | `public-components.tsx:172`, `src/components/ui/marquee.tsx` | Section | Local + Magic UI | Home only | No (hover-pause) | Yes (CSS) |
| Services | `CapabilityRows` + `BlurFade` + `CapabilityGlowGate` + `GlowingEffect` | `public-components.tsx:382`, `ui/blur-fade.tsx`, `capability-glow-gate.tsx`, `ui/glowing-effect.tsx` | Section/Card | Local + Magic UI | Home only | Yes (links) | Yes |
| Statement | `StatementBreak` | `public-components.tsx:532` | Section | Local custom | Home only | No | No |
| Focus | `StickyScroll` | `src/components/ui/sticky-scroll-reveal.tsx` | Section | Aceternity | Home only (prod) | No (scroll) | Yes (Motion) |
| Process | `ProcessSteps` + `Timeline` | `process-steps.tsx`, `ui/timeline.tsx` | Section | Local + Aceternity | Home only | No (scroll) | Yes (Motion) |
| Matters | `MatterRows` + `HoverEffect` | `public-components.tsx:443`, `ui/card-hover-effect.tsx` | Card | Local + Aceternity | Home only | Yes (links) | Yes (Motion) |
| Industries | `IndustryLedger` | `public-components.tsx:459` | Data display | Local custom | Home only | No | No |
| Team | `FocusCards` | `src/components/ui/focus-cards.tsx` | Card | Aceternity | Yes (home + gallery ref) | Yes (links/hover) | Yes (CSS) |
| Insights | `InsightsLedger` | `public-components.tsx:487` | Section | Local custom | Home only | Yes (links) | No |
| Footer | `PublicShell` footer + `PublicFloatingDock` + `FloatingDock` | `public-shell.tsx`, `public-floating-dock.tsx`, `ui/floating-dock.tsx` | Layout/Navigation | Local + Aceternity | Yes | Yes | Yes |

## 3.2 Directory pages (services/team/articles/case-studies + media)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Top | `PageHero` | `public-components.tsx:115` | Section | Local custom | Yes (all directory pages) | No | No (static image) |
| Listing | `DirectoryFilter` | `directory-filter.tsx` | Form+Data display | Local custom | Yes (4 page groups ×2 locales) | Yes (search + pills + clear) | Yes (`BlurFade`) |
| Listing | `TextInput` (search) | `ui/field.tsx` | Input | shadcn-style local | Yes | Yes | No |
| Listing | `MagicCard` (rows) | `ui/magic-card.tsx` | Card | Magic UI | Yes (rows layout) | Yes (hover spotlight) | Yes (Motion) |
| Listing | `Badge` | `ui/badge.tsx` | Data display | Local custom | Yes | No | No |
| Listing | `ButtonLink` | `ui/button.tsx` | Button | shadcn-style local | Yes | Yes | No |
| Media | media card grid | `public-pages.tsx:855` | Card | Local custom | Media only | No | No |

## 3.3 Detail pages (service/team/article/case-study)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Top | `PublicBreadcrumbs` | `public-components.tsx` | Navigation | Local custom | Yes (all detail pages) | Yes (links) | No |
| Side | `DetailCta` | `public-components.tsx:240` | Card | Local custom | Yes (service/article/case-study) | Yes (CTA link) | No |
| Article | `ReadingProgress` | `motion-ui/reading-progress.tsx` | Motion | Local custom | Article only (prod) | No (scroll) | Yes (scroll) |
| Article | `ArticleBody` | `public-pages.tsx:1194` | Section | Local custom | Article only | No | No |
| Case study | `CaseStudyBlock` + `Reveal` | `public-pages.tsx:1171`, `motion-ui/reveal.tsx` | Section | Local + local IO | Case-study only | No | Yes (IO+CSS) |
| Team | photo panel + notice boxes | `public-pages.tsx:537` | Card | Local custom | Team only | Yes (CTA link) | No |

## 3.4 Contact (`/contact`, `/ar/contact`)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Left | `ContactForm` | `contact-form.tsx:42` | Form | Local custom | Contact only | Yes (submit/reset) | Yes (tokens) |
| Left | `TextInput` ×3, `Select`, `Textarea`, checkbox | `ui/field.tsx` + native `input[type=checkbox]` | Input | shadcn-style local | Yes | Yes | No |
| Left | `ShimmerButton` (submit) | `motion-ui/shimmer-button.tsx` | Button | Magic-inspired local | Yes (contact + gallery) | Yes | Yes (CSS) |
| Left | status `div[role=status]` / `p[role=alert]` | `contact-form.tsx` | Data display | Local custom | Contact only | No | Yes (tokens) |
| Right | branch panels + WhatsApp panel | `public-pages.tsx:880` | Card | Local custom | Contact only | Yes (`tel:`/`mailto:`/external links) | No |

## 3.5 Booking (`/book-consultation`, `/ar/book-consultation`)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Top | `BookingFlowHeader` | `public-components.tsx:561` | Section | Local custom | Booking only | No | No |
| Shell | `ConsultationBookingChat` | `consultation-booking-chat.tsx:168` | Custom | Local + Motion + Magic UI + Aceternity | Booking only | Yes (full chat) | Yes |
| Shell | `AnimatedList` (log) | `ui/animated-list.tsx` | Motion | Magic UI | Booking only (prod) | No (sequenced) | Yes (Motion) |
| Shell | `PlaceholdersAndVanishInput` (composer) | `ui/placeholders-and-vanish-input.tsx` | Input | Aceternity | Booking only (prod) | Yes (text input + send) | Yes (Motion) |
| Panels | `LanguageChoicePanel`/`SlotChoicePanel`/`PaymentReviewPanel`/`ChatBubble`/`TypingIndicator` | `consultation-booking-chat.tsx` | Card/Button | Local custom | Booking only | Yes (chips/confirm/pay/back) | Yes (CSS enter/pulse) |
| Legacy | `BookingStepper`, `ConsultationAssistantPanel` | `booking-stepper.tsx`, `consultation-assistant-panel.tsx` | Form | Local custom | NOT rendered anywhere | — | — |

## 3.6 Policy (privacy/terms ×2 locales), account setup, payment, auth, install

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Policy | `PolicyToc` | `policy-toc.tsx` | Navigation | Local + IO | Yes (privacy + terms ×2) | Yes (anchors) | Yes (IO active edge) |
| Setup | `ClientAccountSetupForm` | `client-account-setup-form.tsx:40` | Form | Local custom | Setup only (×2 locales) | Yes | CSS spinner only |
| Setup | `ConsultationSummary` | `client-account-setup-page.tsx` | Card | Local custom | Setup only | No | No |
| Return | `PaymentStatusPoller` | `payment-status-poller.tsx` | Custom | Local custom | Return only | No (poll + countdown) | No (text countdown) |
| Receipt | `ConsultationPaymentReceiptDocument` + `ReceiptPrintButton` | `features/payments/` | Data display/Button | Local custom | Receipt only | Yes (print/back links) | No (print CSS) |
| Login | `LoginForm` + `Card` set | `features/auth/login-form.tsx`, `ui/card.tsx` | Form/Card | Local custom | Login only | Yes | Loading state only |
| Install | `InstallWizard` + `Card`/`TextInput`/`Button` | `features/install/install-wizard.tsx` | Form | Local custom | Install only | Yes (3 POST forms) | No |

## 3.7 Client portal (all 8 pages)

| Location | Component | File | Type | Source | Shared? | Interactive? | Animation? |
|---|---|---|---|---|---|---|---|
| Shell | `ClientSiteShell` + `ClientPortalNav` (desktop + compact) | `client-site-shell.tsx` | Layout/Navigation | Local custom | Yes (all 8) | Yes (links, logout POST) | No |
| Shell | `ClientLanguageSwitch` | `features/client/client-language-switch.tsx` | Utility | Local custom | Yes (all 8) | Yes | No |
| Dashboard | `ClientPortalMetric`/`ClientPortalPanel`/`ClientPortalRow`/`ClientPortalEmpty` | `client-portal-components.tsx` | Card/Data display | Local custom | Yes (portal-wide) | Yes (links) | No (hover transitions) |
| Lists | `DataTable` + `DataRecordCard` MobileCard | `ui/data-table.tsx`, `ui/data-record-card.tsx` | Data display | shadcn-style local | Yes (cases/court-dates/files/payments) | Yes (links) | No |
| Assistant | `ClientAssistantPanel`/`ClientTeamChatPanel`/`ClientChatBubble`/`TeamBubble`/`TypingIndicator` | `features/client/` | Custom/Form | Local custom | Assistant only | Yes (2 composers) | CSS pulse only |
| Files | `DocumentUploadForm` + `ClientPortalSelect` + file `input` | `features/portal/document-upload-form.tsx`, `client-portal-select.tsx` | Form/Input | Local custom | Files only | Yes (upload) | No |
| Profile | `ProfileForm` | `features/portal/profile-form.tsx` | Form | Local custom | Profile only | Yes (PATCH) | No |

## 3.8 Admin (representative pattern + per-page extras)

Every admin page: `DashboardShell` (`dashboard-shell.tsx` →
`DashboardShellView`: desktop `aside` + `DashboardNavigationLinks` +
`header` (mobile trigger + eyebrow/title + `AdminNotificationBell` +
`ThemeToggle` + userLabel + logout form + `action`) + `main`) +
`DashboardMobileNav` (native `<dialog>`, `lg:hidden` trigger).

| Page | Key components | File(s) | Interactive? | Animation? |
|---|---|---|---|---|
| Dashboard | `AdminCommandCenter`, `DashboardMetricLink`, `DashboardPriorityList`, `ClientSearch` (`SearchInput`), hero quick-action `nav` | `features/admin/dashboard/` | Yes (links + search GET) | hover transitions only |
| Cases | `FilterBar` + `SearchInput` + `Select`s + `DataTable` + `DataRecordCard` + pagination links | `cases/page.tsx`, `ui/*` | Yes (filter GET, row links) | No |
| Case detail | `CaseTabs nav`, `MetricCard` ×4, `ManualCaseEditForm`, `CaseStatusForm`, `CaseSessionForm`, `AppointmentRescheduleForm`, `TaskCreateForm`, `TaskUpdateForm`, `AdminDocumentUploadForm`, `DocumentActionForm`, `DocumentDeleteForm`, native `details/summary` | `cases/[caseId]/page.tsx`, `features/admin/cases/`, `features/admin/task-documents/` | Yes (all forms inline) | No |
| Cases new | `ManualCaseCreateForm` (`CaseCoreFields`, `PartyFields`), `InlineFeedback` | `manual-case-form.tsx` | Yes | No |
| Clients | `ClientCreateForm`, filter `form`, `DataTable` + mobile card | `clients/page.tsx`, `client-crm-forms.tsx` | Yes | No |
| Client detail | `ClientActionPanel` (edit/assign/account/archive cards) | `client-crm-forms.tsx` | Yes | No |
| Consultations | outcome-view tab `nav`, filter `form`, quick chips, `DataTable` | `consultations/page.tsx` | Yes | No |
| Consultation detail | `ConsultationActionPanel` + schedule/outcome/reopen forms, secretary review, assign `Select`, convert + reject forms | `features/admin/consultations/` | Yes | No |
| Availability | `ConsultationAvailabilityForm` (numbers, times, weekday/mode checkboxes) | `consultation-availability-form.tsx` | Yes | No |
| Calendar | day-grouped `Card`s, filter `form`, `CalendarAppointmentForm`, `AppointmentRescheduleForm` | `calendar/page.tsx`, `case-action-forms.tsx` | Yes | No |
| Tasks | status-column kanban `section`s, `TaskCard`, filter `form`, `TaskCreateForm`, `TaskUpdateForm` in `details` | `tasks/page.tsx`, `task-document-forms.tsx` | Yes | No |
| Documents | `DataTable` + stacked `DocumentCard details`, filter `form`, upload/action/delete forms | `documents/page.tsx`, `task-document-forms.tsx` | Yes (incl. file input) | No |
| Finance | `PaymentForm`, `PaymentGatewaySettingsForm`, `ConsultationPricingRuleForm`, `WebhookReplayButton`, 3 `DataTable`s (invoices/attempts/webhooks), CSV export `Link` | `finance/page.tsx`, `finance-forms.tsx` | Yes (edit via query params, not modal) | No |
| Messages | filter `form`, `DataTable` + mobile card | `messages/page.tsx` | Yes | No |
| Thread | `AdminMessageThreadPanel` (bubbles, reply `textarea` form, assignee/status `select`s) | `admin-message-thread-panel.tsx` | Yes (5s poll) | No |
| Contact msgs | `ContactMessageInbox` (`DataTable` with `details>summary` body, action `Button`s) | `contact-message-inbox.tsx` | Yes | No |
| Notifications | `AdminNotificationCenter`/`NotificationItemView` (stat grid, `ul`, load-more `Button`) | `admin-notification-popover.tsx` | Yes (mark-read, load-more) | No |
| Reports | `MetricCard` ×8, `StatusBars` (static gold width bars), recent-payments `DataTable` | `reports/page.tsx` | Yes (filter) | No (static bars) |
| Settings | `OfficeProfileSettingForm`, deferred `StateBlock`s, storage diagnostic `dl` | `governance-forms.tsx` | Partially (1 editable form) | No |
| Users | `AdminUserCreateForm`, filter `form`, `DataTable` | `users/page.tsx`, `governance-forms.tsx` | Yes | No |
| User detail | `AdminUserActionPanel`, `AdminUserPasswordForm`, sessions + audit `DataTable`s | `users/[userId]/page.tsx`, `governance-forms.tsx` | Yes | No |
| Roles | `RolePermissionForm` (role-list buttons + checkbox matrix `fieldset`s) | `role-permission-form.tsx` | Yes | role-button `transition-colors` |
| Content | `ArticleForm`/`CaseStudyForm`/`SocialDraftForm`/`AiSocialDraftForm`, tab `nav`, filter `form`, `DataTable` | `content/page.tsx`, `content-forms.tsx` | Yes (edit via query params) | No |
| Audit log | filter `form`, `DataTable` (`DetailList`, `TechnicalDetails details>summary`) | `audit-log/page.tsx` | Yes | No |

No admin page imports `Dialog`, Animate-UI `Sheet`, or any `motion/*`
component (verified by grep: zero `motion/react` importers under
`src/features/admin` and `src/app/(app-ar)/admin`).

## 3.9 Preview

| Location | Component | File | Type | Source | Interactive? | Animation? |
|---|---|---|---|---|---|---|
| `/preview/ui` | `UiPreview` mock sections + simulated `BookingForm` + native `<dialog data-preview-summary>` | `ui-preview.tsx` | Custom | Local custom | Demo only | smooth scroll, autofocus, CSS modules |
| `/preview/components` | `ComponentGallery` sections | `component-gallery.tsx` | Data display | Local custom | Demo inputs | Demo-only |
| Gallery | `DialogDemo` + shared `Dialog` | `gallery-islands.tsx`, `ui/dialog.tsx` | Overlay | Local (native `<dialog>`) | Yes (trap, Esc, backdrop) | No |
| Gallery | `RippleButton`, `Tilt`, `SplittingText` | `animate-ui/*` | Motion | Animate UI | Demo hover | Yes (Motion) |
| Gallery | `CountUp` (+`CountUpDemo`), `ShimmerButton` demo | `motion-ui/count-up.tsx`, `motion-ui/shimmer-button.tsx` | Motion/Button | Local (GSAP) / Magic-inspired | Demo | Yes |

---

# STEP 4 — SECTION DETAILS

## Hero (`HeroParallaxLayers`, home only)

Current visual structure: full-bleed section (`lg:min-h-[92svh]`) with
radial gold wash + Aceternity `Spotlight` (gold gradients) + faint SVG
arabesque pattern layer (`data-drift=motif`) over deep canvas; left
column: eyebrow pill, `TextAnimate` h1 (word-split blur-up), gold
underline, description with underlined highlight phrase, 3-col stats
(`CountingNumber`), matter-picker card (6 radio buttons + browse link);
right column: photo (`/stitch-assets/b392…png`, `data-drift=photo`,
scrim + bottom gradient + top gold hairline) overlapped by docket card
(`BorderBeam`, status icon, matter/next rows, `ShimmerCtaLink`).
Rendered: `HeroParallaxLayers`, `Spotlight`, `TextAnimate`,
`CountingNumber`, `KmtGoldUnderline`, `KmtUnderlinedText`, `BorderBeam`,
`ShimmerCtaLink`, `MaterialSymbol`.

## Trust strip (home only)

Single `Marquee` row of trust items, duplicated loop, pause-on-hover.
Rendered: `TrustStrip`, `Marquee`.

## Legal services / Capability rows (home only)

Centered `PublicSection`: heading + description, 2-col rows; each row has
numeral, icon, title, description, link CTA; pointer glow gated by
`CapabilityGlowGate`. Rendered: `CapabilityRows`, `BlurFade`,
`CapabilityGlowGate`, `GlowingEffect`, `Badge`, `Link`.

## Awareness statement (home only)

Centered break: short gold underline + strong underlined statement line.
Rendered: `StatementBreak`, `KmtGoldUnderline`, `KmtTextUnderline`.

## Focus area / StickyScroll (home only)

Muted roomy section: sticky visual panel (desktop, `hidden lg:block`)
with 3 scrolling text stages (included/documents/outcomes) + images;
stacked on mobile. Rendered: `StickyScroll`.

## Process (home only)

Centered section rendering vertical `Timeline` with scroll progress rail.
Rendered: `ProcessSteps`, `Timeline`.

## Representative matters (home only)

Muted section of hover-effect cards. Rendered: `MatterRows`,
`HoverEffect`.

## Industries (home only)

Hairline ledger list, 2-col on desktop. Rendered: `IndustryLedger`.

## Team showcase (home only)

Muted section: `FocusCards` image cards linking to team profiles.
Rendered: `FocusCards`.

## Insights (home only)

Lead + ledger rows, or empty panel + `ButtonLink` fallback. Rendered:
`InsightsLedger`, `ButtonLink`.

## Directory listings (services/team/articles/case-studies)

`PageHero` (compact, per-page stitch image + dots texture) + filter block
(search input, category pills, clear) + result rows (`MagicCard`) or
image cards (`publicPhotoTreatment`) + muted CTA row (services only).
Rendered: `PageHero`, `DirectoryFilter`, `TextInput`, `MagicCard`,
`BlurFade`, `Badge`, `ButtonLink`.

## Detail articles (service/team/article/case-study)

H1 + breadcrumbs + 2-col grid (content `publicPanel` + sticky `DetailCta`
aside) + related ledger/nav; article adds `ReadingProgress`; case study
adds per-block `Reveal`; team adds photo panel + notice boxes.
Rendered: `PublicBreadcrumbs`, `DetailCta`, `ArticleBody`,
`CaseStudyBlock`, `ReadingProgress`, `Reveal`, `Badge`, `ButtonLink`.

## Media

`PageHero` + 3-col card grid (type badge, date, title, description).
Rendered: `MediaPageView` grid, `Badge`.

## Contact

`PageHero` + 2-col grid: `ContactForm` (inputs, select, textarea,
consent checkbox, status/error regions, shimmer submit) + branch info
panels + WhatsApp panel. Rendered: `ContactForm`, `TextInput`, `Select`,
`Textarea`, `ShimmerButton`, `Button`, `ButtonLink`, `MaterialSymbol`.

## Booking chat

Compact `BookingFlowHeader` + centered assistant shell: brand header,
`AnimatedList` message log (bubbles, language/slot/confirm/payment
panels), quick-action chips, vanish-input composer, privacy note.
Rendered: `BookingFlowHeader`, `ConsultationBookingChat`,
`AnimatedList`, `PlaceholdersAndVanishInput`, `BorderBeam`, `Button`,
`KmtBrandLogo`.

## Policy (privacy/terms)

H1 + 2-col grid: sticky TOC aside (`PolicyToc`) + long-form article.
Rendered: `PolicyToc`, article sections.

## Account setup

2-col card: status-aware left panel (links / existing-account notice /
`ClientAccountSetupForm`) + consultation summary aside. Rendered:
`ClientAccountSetupPage`, `ClientAccountSetupForm`,
`ConsultationSummary`, `Field`, `Button`.

## Payment return / receipt

Return: status-toned dark card (icon header, paid-confirmation panel,
poller, `StatusItem` definition cards, action buttons). Receipt:
standalone light document (print bar, header lockup, 3 stats, client +
payment + consultation panels, total panel, footer). Rendered:
`PaymentStatusPoller`, `ConsultationPaymentReceiptDocument`,
`ReceiptPrintButton`, `MaterialSymbol`, `KmtBrandLogo`.

## Login

2-col split: brand/info column + `Card` login form (email/password,
status notice, alert, loading submit). Blocked variant: checks list.
Rendered: `LoginForm`, `Card` set, `TextInput`, `Button`, `KmtBrandLogo`.

## Install

Intro + 2-col grid: 4 numbered `Card`s (hosting radios, token + preflight
button, office/admin fields, finish lock) + status/mode/checks/notice
aside. Rendered: `InstallWizard`, `Card` set, `TextInput`, `Button`.

## Client portal

Dark shell: sticky header (brand, back-to-site, language switch, theme
toggle, user chip, logout) + dual nav rows + gradient title band + light?
dark content section + minimal footer. Pages: metric cards, next-step
panel, list/detail panels, `DataTable` + mobile cards, two chat surfaces,
upload + profile forms. Rendered: `ClientSiteShell`,
`ClientPortal*` set, `DataTable`, `DataRecordCard`, `Badge`,
`ClientAssistantPanel`, `ClientTeamChatPanel`, `DocumentUploadForm`,
`ProfileForm`.

## Admin

Light shell (`bg-kmt-canvas`): desktop `aside` (brand + badge + grouped
nav) + white header (mobile trigger, eyebrow/title, bell, theme toggle,
user, logout, page action) + content. Pages: hero (dashboard), filter
bars, `DataTable` + mobile cards, tab navs, inline action-form cards,
kanban columns, day-grouped cards, checkbox matrix, details disclosures,
static status bars, diagnostic lists. Rendered: `DashboardShell`,
`DashboardShellView`, `DashboardNavigationLinks`, `DashboardMobileNav`,
`AdminNotificationBell`, `Card` set, `Badge`, `Button`, `DataTable`,
`DataRecordCard`, `FilterBar`, `SearchInput`, `StateBlock`,
`InlineFeedback`, `MaterialSymbol`, page/form feature modules.

## Footer + floating dock (public chrome)

Footer CTA card (underline, title with highlight, description, shimmer
CTA) + 4-col grid (dark brand plaque, practice nav, offices, contact
rows with icon halos) + legal bar. Fixed bottom dock (2 actions:
consultation link + WhatsApp external) with click-through wrapper,
hidden on booking routes. Rendered: `PublicShell` footer,
`PublicFloatingDock`, `FloatingDock`, `BorderBeam`, `ShimmerCtaLink`,
`KmtGoldUnderline`, `KmtUnderlinedText`, `KmtBrandLogo`.

---

# STEP 5 — SHARED GLOBAL COMPONENTS

| # | Component | File | Used On | Source | Current Purpose |
|---|---|---|---|---|---|
| 1 | `PublicShell` | `src/components/layout/public-shell.tsx` | All 32 public patterns | Local custom | Header + main + footer CTA + footer + legal bar + dock switch |
| 2 | `PublicHeader` | `src/components/layout/public-header.tsx` | Via `PublicShell` (32) | Local + Aceternity + Animate UI | Sticky desktop/mobile nav, flyouts, actions |
| 3 | `ConsultationLink` | `public-header.tsx:21` | Header desktop + mobile drawer + flyout | Local (`ShimmerCtaLink` wrapper) | Book-consultation CTA |
| 4 | `ClientLoginLink` | `public-header.tsx:40` | Header desktop + mobile | Local + Animate-UI `Tooltip` | `/login?next=/client` icon button |
| 5 | `PublicFloatingDock` | `src/components/layout/public-floating-dock.tsx` | Via `PublicShell` except booking routes | Local + Aceternity | Fixed consultation + WhatsApp actions |
| 6 | `DashboardShell` | `src/components/layout/dashboard-shell.tsx` | All 24 admin UI pages | Local custom | Guard snapshot → `DashboardShellView` |
| 7 | `DashboardShellView` | `src/components/layout/dashboard-shell-view.tsx` | Via `DashboardShell` (24) | Local custom | Aside + header + main admin chrome |
| 8 | `DashboardNavigationLinks` | `src/components/layout/dashboard-navigation.tsx` | Shell desktop + mobile nav | Local custom | Grouped nav links |
| 9 | `DashboardMobileNav` | `src/components/layout/dashboard-mobile-nav.tsx` | Shell header (all admin) | Local (native `<dialog>`) | Mobile drawer, focus trap |
| 10 | `AdminNotificationBell` + popover/center | `src/features/admin/notifications/admin-notification-bell.tsx`, `admin-notification-popover.tsx` | Shell header + `/admin/notifications` | Local custom | 30s-poll bell + full center list |
| 11 | `AdminShellState` | `src/components/layout/admin-shell-state.tsx` | `admin/error|loading|not-found` | Local custom | Shell error/loading/empty states |
| 12 | `ClientSiteShell` | `src/components/layout/client-site-shell.tsx` | All 8 client pages | Local custom | Dark portal header/nav/title/footer chrome |
| 13 | `ClientPortalNav` | `client-site-shell.tsx:24` | All 8 client pages (desktop + compact) | Local custom | Portal tab navigation |
| 14 | `ClientPortalPanel` | `src/components/layout/client-portal-components.tsx` | Client pages + features | Local custom | Titled content panel |
| 15 | `ClientPortalMetric` | `client-portal-components.tsx` | `/client`, `/client/payments` | Local custom | Icon metric card |
| 16 | `ClientPortalRow` + `ClientPortalDetailItem` | `client-portal-components.tsx` | Portal detail/activity rows | Local custom | Icon row / label-value item |
| 17 | `ClientPortalEmpty` | `client-portal-components.tsx` | Portal empty states | Local custom | Dashed empty block |
| 18 | `ClientPortalSelect` | `src/components/layout/client-portal-select.tsx` | `DocumentUploadForm` | Local custom | Dark-styled select |
| 19 | `ClientLanguageSwitch` | `src/features/client/client-language-switch.tsx` | `ClientSiteShell` (8) | Local custom | Portal locale toggle |
| 20 | `KmtBrandLogo` | `src/components/brand/kmt-brand-logo.tsx` | Shells, hero chat, login, receipt | Local custom | Brand lockup/mark/full variants |
| 21 | `ThemeProvider` | `src/components/theme/theme-provider.tsx` | All 6 route-group roots + preview | `next-themes` wrapper | Class-based theming, per-area defaults |
| 22 | `ThemeToggle` | `src/components/theme/theme-toggle.tsx` | Public header, admin shell, client shell, gallery | Local custom | Dark/light switch |
| 23 | `Button` / `ButtonLink` / `buttonClasses` | `src/components/ui/button.tsx` | Pervasive (public/client/admin/auth/install) | shadcn-style local | 5 variants + sizes + loading |
| 24 | `ShimmerCtaLink` | `src/components/ui/shimmer-cta-link.tsx` | Header, hero, footer CTA | Magic UI adaptation | Shimmer CTA link |
| 25 | `ShimmerButton` | `src/components/motion-ui/shimmer-button.tsx` | `ContactForm`, gallery | Magic-inspired local | Shimmer submit button |
| 26 | `RippleLink` | `src/components/animate-ui/ripple-link.tsx` | Header services flyout CTA | Animate UI | Ripple-press link |
| 27 | `Card` set + `MetricCard` | `src/components/ui/card.tsx` | Admin, install, login, gallery | shadcn-style local | Content + metric cards |
| 28 | `Badge` | `src/components/ui/badge.tsx` | Pervasive (listings, tables, chats) | Local custom | Status/category tones |
| 29 | `Field` (`TextInput`/`Textarea`/`Select`) | `src/components/ui/field.tsx` | All forms + filters + gallery | shadcn-style local | Label/hint/error controls |
| 30 | `SearchInput` | `src/components/ui/search-input.tsx` | Admin filters + dashboard search | Local custom | Search field |
| 31 | `FilterBar` | `src/components/ui/filter-bar.tsx` | Admin list filters | Local custom | Filter form shell |
| 32 | `DataTable` | `src/components/ui/data-table.tsx` | 16 prod routes + gallery | Local custom | Desktop table (mobile via render prop) |
| 33 | `DataRecordCard` | `src/components/ui/data-record-card.tsx` | Table mobile cards + gallery | Local custom | Mobile record card |
| 34 | `Pagination` | `src/components/ui/pagination.tsx` | Gallery only (see note) | Local custom | Page links + summary |
| 35 | `Dialog` | `src/components/ui/dialog.tsx` | Gallery `DialogDemo` only | Local (native `<dialog>`) | Modal with focus trap |
| 36 | `Tabs` / `LinkTabs` | `src/components/ui/tabs.tsx` | Gallery only | Local custom | Pressed tabs + counted link tabs |
| 37 | `Toast` | `src/components/ui/toast.tsx` | Gallery only | Local custom | Info/error toast |
| 38 | `Skeleton` set | `src/components/ui/skeleton.tsx` | Gallery only | Local custom | Loading placeholders |
| 39 | `StateBlock` | `src/components/ui/state.tsx` | Admin, install, availability, gallery | Local custom | Empty/loading/permission/error |
| 40 | `InlineFeedback` | `src/components/ui/inline-feedback.tsx` | All admin forms + gallery | Local custom | 4-tone form feedback |
| 41 | `MaterialSymbol` | `src/components/ui/material-symbol.tsx` | Pervasive (all areas) | Local custom (inline SVG map) | Icon set |
| 42 | `PublicSection` | `public-components.tsx` | Public content sections | Local custom | Spacing/mute/center variants |
| 43 | `PageHero` | `public-components.tsx:115` | Directory + detail-adjacent pages | Local custom | Compact image hero |
| 44 | `DetailCta` | `public-components.tsx:240` | Service/article/case-study details | Local custom | Sticky CTA aside |
| 45 | `PublicBreadcrumbs` | `public-components.tsx` | All detail pages | Local custom | Breadcrumb nav |
| 46 | `PolicyToc` | `src/features/public-site/policy-toc.tsx` | Privacy + terms (×2 locales) | Local + IO | Scroll-spy TOC |
| 47 | `DirectoryFilter` | `src/features/public-site/directory-filter.tsx` | Services/team/articles/case-studies (×2) | Local + Magic UI | Search + pills + cards/rows |
| 48 | `KmtGoldUnderline` | `src/components/ui/kmt-gold-underline.tsx` | Hero, shell, sections | Local custom | Animated gold rule |
| 49 | `KmtTextUnderline` / `KmtUnderlinedText` | `src/components/ui/kmt-text-underline.tsx` | Hero, footer CTA, headers | Local + Magic UI `Highlighter` | Highlight underline |
| 50 | `FloatingDock` | `src/components/ui/floating-dock.tsx` | Via `PublicFloatingDock` | Aceternity | Expandable dock primitive |

Note: `Pagination`, `Dialog`, `Tabs`, `Toast`, `Skeleton` exist as shared
primitives but their only renderers are `/preview/components` (see Step 6);
admin/client pagination is hand-rolled prev/next links, not the shared
`Pagination` component. `ProductThemeProvider`
(`src/components/layout/product-theme-provider.tsx`) is barrel-exported
only with no page importer found.

---

# STEP 6 — THIRD-PARTY UI COMPONENTS

Stack evidence: `package.json` — `motion ^13.3.0`, `gsap ^3.15.0`,
`@gsap/react ^2.1.2`, `lenis ^1.3.26`, `rough-notation ^0.5.1`,
`radix-ui ^1.6.7`, `@base-ui/react ^1.8.0`, `next-themes ^0.4.6`,
`lucide-react ^1.47.0`, `tw-animate-css ^1.4.0`; `framer-motion` absent
(uses `motion/react`). `components.json` registers `@animate-ui` and
`@aceternity` registries; `shadcn ^4.21.0` is a devDependency (CLI/config
only, `style:base-nova`, `rtl:true`).

## Aceternity UI

| Component | Installed file | Rendered where | Actually rendered? |
|---|---|---|---|
| `HoverEffect` (+Card parts) | `ui/card-hover-effect.tsx:10` (header: adapted) | `public-components.tsx:6` → `MatterRows` (home) | Yes |
| `FloatingDock` | `ui/floating-dock.tsx:17` (header: vendored+adapted) | `public-floating-dock.tsx:5` → all public except booking | Yes |
| `FocusCards` | `ui/focus-cards.tsx:19` (header: adapted) | `public-pages.tsx:9` → home team showcase | Yes |
| `Menu`/`MenuItem` (+ProductItem/HoveredLink) | `ui/navbar-menu.tsx` (Motion spring) | `public-header.tsx:13` → desktop Services flyout | Yes |
| `PlaceholdersAndVanishInput` | `ui/placeholders-and-vanish-input.tsx:16` (header: vendored+adapted) | `consultation-booking-chat.tsx:10` → chat composer | Yes |
| `Navbar`/`NavBody`/`MobileNav`/`MobileNavHeader`/… | `ui/resizable-navbar.tsx` (Motion + lucide) | `public-header.tsx:14` → desktop bar + mobile bar | Yes |
| `Spotlight` | `ui/spotlight-new.tsx` (gold params at call site) | `hero-parallax-layers.tsx:14` → home hero | Yes |
| `StickyScroll` | `ui/sticky-scroll-reveal.tsx:8` (header: adapted) | `public-pages.tsx:27` → home focus section | Yes |
| `Timeline` | `ui/timeline.tsx:17` (header: adapted) | `process-steps.tsx:4` → home process | Yes |

Installed Aceternity files: 9. Actually rendered: **9**.

## Magic UI

| Component | Installed file | Rendered where | Actually rendered? |
|---|---|---|---|
| `AnimatedList` | `ui/animated-list.tsx:9` (header: vendored) | `consultation-booking-chat.tsx:8` → chat log | Yes |
| `BlurFade` | `ui/blur-fade.tsx` | `public-components.tsx:4`, `directory-filter.tsx:7` | Yes |
| `BorderBeam` | `ui/border-beam.tsx` | hero docket, chat shell, footer CTA (`hero:16`, `chat:9`, `shell:7`) | Yes |
| `GlowingEffect` | `ui/glowing-effect.tsx:13` (kmt-gold adaptation) | `capability-glow-gate.tsx:4` → home capability rows | Yes |
| `Highlighter` | `ui/highlighter.tsx` (`rough-notation` + Motion) | Indirect via `kmt-text-underline.tsx:4` → hero/footer/headers | Yes (wrapped) |
| `MagicCard` | `ui/magic-card.tsx` (`next-themes` aware) | `directory-filter.tsx:8` → rows layout | Yes |
| `Marquee` | `ui/marquee.tsx` (CSS) | `public-components.tsx:9` → `TrustStrip` | Yes |
| `TextAnimate` | `ui/text-animate.tsx` | `hero-parallax-layers.tsx:15` → hero h1 | Yes |
| `ShimmerCtaLink` | `ui/shimmer-cta-link.tsx:17` (Link-rooted adaptation) | header, hero, footer CTA | Yes |
| `NumberTicker` | `ui/number-ticker.tsx` | No importers; explicitly rejected in `hero-parallax-layers.tsx:87-91` (SSR/hydration + en-US-only) | No (installed-only) |
| `ShimmerButton` (ui) | `ui/shimmer-button.tsx` | No importers; all `ShimmerButton` imports resolve to `motion-ui/shimmer-button` | No (installed-only) |

Installed Magic-UI files: 11. Actually rendered: **9** (+1 local
Magic-inspired `motion-ui/shimmer-button` rendered in `ContactForm` and
gallery; 2 installed-only as noted).

## Animate UI

| Component | Installed file | Rendered where | Actually rendered? |
|---|---|---|---|
| `CountingNumber` | `animate-ui/counting-number.tsx:109` (header: vendored) | `hero-parallax-layers.tsx:11` (hero stats, `initiallyStable`) | Yes |
| `RippleLink` | `animate-ui/ripple-link.tsx:68` | `public-header.tsx:9` (flyout CTA) | Yes |
| `Sheet` set | `animate-ui/components/radix/sheet.tsx` (wraps primitive) | `public-header.tsx:7` (mobile drawer) | Yes |
| `Tooltip` set | `animate-ui/components/radix/tooltip.tsx` (wraps primitive) | `public-header.tsx:8` (language/theme/login tips) | Yes |
| `RippleButton` | `animate-ui/ripple-button.tsx` | Gallery only (`gallery-islands.tsx:7`) | Preview-only |
| `Tilt` | `animate-ui/tilt.tsx` | Gallery only | Preview-only |
| `SplittingText` | `animate-ui/splitting-text.tsx` | Gallery only | Preview-only |
| `LiquidButton` (component + primitive) | `components/buttons/liquid.tsx`, `primitives/buttons/liquid.tsx` | No importers outside self | No (installed-only) |
| `GradientBackground` + `GradientText` | `components/backgrounds/gradient.tsx`, `primitives/texts/gradient.tsx` | No importers outside self | No (installed-only) |
| `Tabs` (component + primitive) | `components/radix/tabs.tsx`, `primitives/radix/tabs.tsx` | No page importers | No (installed-only) |
| `useIsInView` / `getStrictContext` / `Slot` | `use-is-in-view.tsx`, `get-strict-context.tsx`, `primitives/animate/slot.tsx` | Transitive (used by other animate-ui internals) | Transitive-only |

Installed Animate-UI files: 19. Actually rendered in production: **4**
(+3 preview-only; remainder installed-only/transitive).

## shadcn/ui

No vendored shadcn component files: `ui/*` headers cite Magic UI /
Aceternity / Animate UI / local; `shadcn` appears only as devDependency +
`components.json` installer config. The shadcn-style local primitives
below follow shadcn patterns (variants, `buttonClasses`, barrel export in
`ui/index.ts`) but are local implementations.

| Primitive | File | Rendered where | Actually rendered? |
|---|---|---|---|
| `Button`/`ButtonLink` | `ui/button.tsx` | Pervasive (all areas) | Yes |
| `Card` set + `MetricCard` | `ui/card.tsx` | Admin, install, login, gallery | Yes |
| `Badge` | `ui/badge.tsx` | Pervasive | Yes (local, not shadcn) |
| `Field` | `ui/field.tsx` | All forms/filters/gallery | Yes |
| `DataTable` / `DataRecordCard` | `ui/data-table.tsx`, `ui/data-record-card.tsx` | 16 prod routes + gallery | Yes |
| `FilterBar` | `ui/filter-bar.tsx` | Admin lists | Yes |
| `SearchInput` | `ui/search-input.tsx` | Admin + gallery | Yes |
| `StateBlock` | `ui/state.tsx` | Admin + gallery | Yes |
| `InlineFeedback` | `ui/inline-feedback.tsx` | Admin forms + gallery | Yes |
| `MaterialSymbol` | `ui/material-symbol.tsx` | Pervasive | Yes (local icon map) |
| `Pagination` | `ui/pagination.tsx` | Gallery only | Preview-only |
| `Dialog` | `ui/dialog.tsx` | Gallery `DialogDemo` only | Preview-only |
| `Tabs`/`LinkTabs` | `ui/tabs.tsx` | Gallery only | Preview-only |
| `Toast` | `ui/toast.tsx` | Gallery only | Preview-only |
| `Skeleton` set | `ui/skeleton.tsx` | Gallery only | Preview-only |

shadcn-vendored components actually rendered: **0**. shadcn-style local
primitives rendered in production: **10** (+5 preview-only).

---

# STEP 7 — MOTION / ANIMATION INVENTORY

| Page/Area | Component | Animation Library | Trigger | What Moves |
|---|---|---|---|---|
| Public chrome | `NavBody`/`MobileNav` (`resizable-navbar`) | Motion | scroll (`visible` prop) | Header compresses to floating pill |
| Public chrome | `Menu`/`MenuItem` (`navbar-menu`) | Motion (spring) | hover/click | Services flyout panel |
| Public chrome | Mobile `Sheet` drawer | Animate UI (Motion + Radix) | click | Drawer slides (side flips EN/AR) |
| Public chrome | `Tooltip`s | Animate UI (Motion + Radix) | hover/focus | Language/theme/login tips |
| Public chrome | `RippleLink` | Animate UI (Motion) | press | Ripple in flyout CTA |
| Public chrome | `FloatingDock` | Motion | hover/tap | Dock expands, icon magnification |
| Public chrome | `ThemeToggle`, links, buttons | CSS (`kmt-motion-*`, `duration-kmt-*`) | hover/focus | Color/underline/icon-halo transitions |
| Public chrome | Footer `BorderBeam` + `ShimmerCtaLink` | Magic UI (Motion/CSS) | continuous | Beam border loop, shimmer sweep |
| Home hero | Parallax (`data-drift`) | GSAP + `ScrollTrigger` (`useGSAP`, scrub 1, reduced-motion gated) | scroll | Arabesque motif `yPercent:12`, photo `yPercent:8` |
| Home hero | `Spotlight` | Motion (rAF loops; unmounted off-screen via IO) | continuous | Gold radial light drift |
| Home hero | `TextAnimate` h1 | Motion (`blurInUp`, by word) | mount (once) | Words blur/slide up |
| Home hero | `CountingNumber` stats | Animate UI (Motion springs, `initiallyStable` SSR) | mount | Numbers spring to final value |
| Home hero | `kmt-hero-enter` / `kmt-hero-enter-blur` | CSS keyframes (staggered delays) | mount | Eyebrow/desc/stats/picker/photo fade-rise |
| Home hero | Picker radio buttons | CSS transitions | click/hover | Border/glow/active fill, lift |
| Home hero | Docket `BorderBeam` | Magic UI (Motion) | continuous | Beam border loop |
| Home | `Marquee` (trust) | CSS (`--duration:36s`) | continuous / hover-pause | Horizontal loop |
| Home | `CapabilityRows` (`BlurFade` + `GlowingEffect`) | Magic UI (Motion + pointer tracking) | in-view / pointer | Fade-blur enter, gold pointer glow |
| Home | `StickyScroll` | Motion (`useScroll`/`useMotionValueEvent`) | scroll | Active stage + panel crossfade |
| Home | `Timeline` rail | Motion | scroll | Progress line + step reveals |
| Home | `HoverEffect` (matters) | Motion (`AnimatePresence`) | hover | Hover background/cards |
| Home | `FocusCards` (team) | CSS | hover | Focus blur/dim siblings |
| Directories | `BlurFade` rows/cards | Magic UI (Motion) | in-view | Staggered fade-blur |
| Directories | `MagicCard` spotlight | Motion (pointer) | pointer | Cursor spotlight + border beam |
| Article | `ReadingProgress` | scroll listener (`scaleX`, no layout shift) | scroll | Top progress bar |
| Case study | `Reveal` (`delay=index*60`) | IntersectionObserver + CSS | in-view | Rise/fade/blur per block |
| Policy | `PolicyToc` active edge | IntersectionObserver | scroll | Gold active indicator |
| Contact | `ShimmerButton`, form/status tokens | CSS (`kmt-motion-form/status/button`) | mount/submit | Shimmer sweep, status enter |
| Booking | `AnimatedList` log | Magic UI (Motion, `delay=160`) | message append | Sequenced message enter |
| Booking | `PlaceholdersAndVanishInput` | Aceternity (Motion `AnimatePresence`) | continuous/submit | Placeholder rotate + vanish particles |
| Booking | `BorderBeam` shell, `kmt-chat-enter`, typing dots | Magic UI / CSS (`animate-pulse` 120/240ms) | continuous/message | Beam loop, bubble enter, typing pulse |
| Booking | Auto-scroll pins (320/780ms + rAF) | imperative scroll | message append | Log scroll position |
| Account setup | Submit spinner | CSS (`animate-spin`) | submit | Spinner |
| Client assistant | `TypingIndicator`/`TeamTyping` | CSS (`animate-pulse`) | waiting | Typing dots |
| Client assistant | `scrollIntoView({block:end})` | imperative scroll | message append | Log scroll |
| Global | `SmoothScrollProvider` | Lenis (`anchors:true`) + GSAP ticker + `ScrollTrigger` | scroll | Smooth wheel/anchor scrolling (both public roots; reduced-motion disabled) |
| Admin | Hover/focus transitions (`transition-colors`, `hover:*`) | CSS | hover/focus | Row/card/button states |
| Admin | Role buttons, tab underlines | CSS (`transition-colors`, `border-kmt-gold`) | click | Selection states |
| Reports | Status width bars | static inline width (no transition) | none | None (static) |
| Receipt | Print variants (`print:`) | CSS | print | Print layout only |
| Preview | `RippleButton`, `Tilt` (spring), `SplittingText` (`y:24`, 0.6s) | Animate UI (Motion) | hover/in-view | Demo motion |
| Preview | `CountUp` | GSAP (`gsap.to`) | scroll (reduced-motion safe) | Demo count |
| Preview | `Skeleton` shimmer | CSS (static under reduced-motion) | continuous | Shimmer |

Motion-reduction coverage observed: `MotionConfig reducedMotion="user"`
(hero, header, chat, dock), `gsap.matchMedia("(prefers-reduced-motion:
no-preference)")`, `motion-reduce:` Tailwind variants, `useHydrated`
gates on interactive forms.

---

# STEP 8 — FORM UI INVENTORY

Conventions observed: `Field` controls carry label + `hint` + inline
`error` (`aria-describedby`); submit uses `Button`/`ShimmerButton` with
loading state; errors surface via `p[role=alert]` + `InlineFeedback`;
success via `div[role=status]`; no modal-based forms in production
(admin edits use inline cards / query-param edit state, not dialogs).

| # | Form experience | Routes | Inputs | Submit | Validation presentation | Error presentation | Success presentation | Dialog? | Loading state |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `ContactForm` | `/contact`, `/ar/contact` | `TextInput`×3, `Select` (4 topics), `Textarea`+hint, consent checkbox | `ShimmerButton` + `Button` newMessage | `fieldErrors` inline under fields | `p[role=alert]` + `InlineFeedback` | `div[role=status]` + `check_circle` panel | No | `fieldsDisabled` + button loading |
| 2 | Booking chat composer + panels | booking ×2 | vanish `input[name=chatMessage]`, language/slot chips, confirm/pay/back `Button`s | round send `Button`; pay `Button` (lock) | slot/choice gating (no free-submit until valid) | error-tone `ChatBubble` + inline text | confirmation + `PaymentReviewPanel` | No | typing dots, disabled chips, `useHydrated` gate |
| 3 | `BookingStepper` (legacy) | none (unrendered) | `TextInput`×5, `Select`×3, `Textarea` | `Button` | `errors.*` inline | `InlineFeedback` | review step panel | No | `aria-busy=submitting` |
| 4 | `ConsultationAssistantPanel` (legacy) | none (unrendered) | `Textarea` message/summary, `TextInput`×5, `Select`×3, datetime-local | `Button`s (book/inquire) | `required` attrs | text error | result panel | No | busy flag |
| 5 | `ClientAccountSetupForm` | setup ×2 | email (`dir=ltr`)+hint, password+hint, confirm | `Button` (`account_circle` + spinner) | email regex, min-length 10, match; inline hint/error | `aria-describedby` errors + `role=status` message | `router.replace(redirectTo ?? /client)` | No | `animate-spin` spinner |
| 6 | `LoginForm` | `/login` | email (`dir=ltr`), password | full-width `Button` (`arrow_forward`) | email regex + required | `role=alert` | redirect via `signedInRedirectPath` + `router.refresh()` | No | button loading, `useHydrated` gate |
| 7 | Install: token + preflight | `/install` | hostingMode radios, token `TextInput` | check button | enabled/locked gating | `Notice` error | `ChecksPanel` per-check rows | No | `isBusy` |
| 8 | Install: bootstrap | `/install` | firmName/publicEmail/publicPhone/adminName/adminEmail/password/confirm | submit | min-length 10 + match | `Notice` error (`localizeApiMessage`) | status refresh | No | `isBusy`, `blockedReason` |
| 9 | Install: finish | `/install` | lock toggle, `superAdminEmail` (ltr) | finish button | installer-enabled gate | `Notice` | locked state | No | `isBusy` |
| 10 | Client assistant composer | `/client/assistant` | `Textarea` + quick-action chips | round send `Button` | non-empty message | inline error text | `ClientChatBubble` + data cards | No | `TypingIndicator` pulse |
| 11 | Team chat composer | `/client/assistant` (team surface) | `Textarea` maxLength 2000 | round send `Button` | maxLength + non-empty | inline error | `TeamBubble` (5s poll refresh) | No | `TeamTyping` |
| 12 | `DocumentUploadForm` | `/client/files` | `ClientPortalSelect` caseId + category, file `input` (pdf/doc/jpg/png) | upload `Button` | required case + file | inline error | list refresh | No | `isUploading`, `useHydrated` gate |
| 13 | `ProfileForm` | `/client/profile` | `TextInput` fullName/phone/email/city | save `Button` | required name/phone | inline error | `role=status` + `router.refresh()` | No | saving flag |
| 14 | Dashboard `ClientSearch` | `/admin` | `SearchInput q` | submit (GET `/admin/clients`) | none (free text) | — | results page | No | No |
| 15 | List filter bars | cases/clients/consultations/calendar/tasks/documents/finance/messages/contact-messages/content/users/audit-log/reports | `SearchInput` + `Select`s + date `TextInput`s (GET forms) | `Button` apply + clear/reset links | none (server filters) | — | count row + table | No | No |
| 16 | `CaseStatusForm` | case detail | `Select` status + `Textarea` reason + confirm checkbox | save | confirm required | `InlineFeedback` | refresh | No | busy |
| 17 | `CaseSessionForm` | case detail | court/sessionDate/nextSessionDate/decision/nextAction | save | date ordering | `InlineFeedback` | refresh | No | busy |
| 18 | `AppointmentRescheduleForm` + `CalendarAppointmentForm` | case detail, calendar | case/title/type/mode/startsAt/duration/location/notes | save | required slot fields | `InlineFeedback` | refresh | No | busy |
| 19 | `TaskCreateForm` / `TaskUpdateForm` | case detail, tasks | title/desc/status/priority/assignee/dueDate/case | save | required title | `InlineFeedback` | refresh | No (`details` disclosure) | busy |
| 20 | `AdminDocumentUploadForm` / `DocumentActionForm` / `DocumentDeleteForm` | case detail, documents | case/owner/category/visibility/file (+action selects) | upload/apply/delete | 5MB hint, required file | `InlineFeedback` | refresh | No | busy |
| 21 | `ManualCaseCreateForm` / `ManualCaseEditForm` (+`PartyFields`) | cases/new, case detail | client search + selects, `CaseCoreFields`, party rows + addParty | create/save | required client + core fields; collision retry | `InlineFeedback` + collision panel | redirect/refresh | No | busy |
| 22 | `ClientCreateForm` / `ClientActionPanel` | clients, client detail | fullName/phone/email/city/source/status/lawyer; edit/assign/account/archive cards | save per card | required name/phone | `InlineFeedback` per card | refresh | No | busy |
| 23 | `ConsultationActionPanel` group | consultation detail | schedule/outcome/reopen/review-`Textarea`/assign-`Select`/convert/reject fields | save per card | per-action requireds | `InlineFeedback` per card | refresh | No | busy |
| 24 | `ConsultationAvailabilityForm` | availability | number inputs, weekday times, weekday/mode checkboxes | save (`save` icon) | time ordering | `InlineFeedback` | refresh | No | busy |
| 25 | Thread reply + manage | thread | `textarea` 2000 + assignee/status `select`s | send / apply | non-empty reply | inline `p` error | bubble append (5s poll) | No | sending flag |
| 26 | `ContactMessageInbox` actions | contact-messages | row action `Button`s (reviewed/archive) | per-row buttons | permission gate (`StateBlock`) | `aria-live` feedback | row state change | No (`details` body) | busy |
| 27 | `RolePermissionForm` | roles | role-list buttons + permission checkbox matrix | save + stale reload | at least selection | `aria-live InlineFeedback` | refresh | No | busy/stale |
| 28 | `ArticleForm` / `CaseStudyForm` | content | title/slug/locale/category/excerpt/content/status/publishedAt (+`anonymized`) | save | required title/content; protected notice | `InlineFeedback` | refresh | No (query-param edit) | busy |
| 29 | `SocialDraftForm` / `AiSocialDraftForm` | content | title/platform/status/content/source/scheduledAt; AI title/platform/locale/sourceText | save / generate | permission gate | `InlineFeedback` | refresh | No | busy |
| 30 | `PaymentForm` / `PaymentGatewaySettingsForm` / `ConsultationPricingRuleForm` | finance | invoice/client/case/dates/amount/currency/status/method/receipt/notes; gateway + pricing fields | save per card | amount/currency requireds | `InlineFeedback` | refresh | No (query-param edit) | busy |
| 31 | `WebhookReplayButton` | finance | replay `Button` per event | replay | none | amber error box | result grid refresh | No | busy |
| 32 | `AdminUserCreateForm` / `AdminUserActionPanel` / `AdminUserPasswordForm` | users, user detail | name/email/phone/role/status/locale/password/confirm/revoke-sessions | save per card | requireds + match; stale reload | `InlineFeedback` | refresh | No | busy |
| 33 | `OfficeProfileSettingForm` | settings | firmName/phone/email/locale | save | requireds | `InlineFeedback` | updatedAt/by line | No | busy |
| 34 | Gallery demo fields | `/preview/components` | `TextInput`/`Select`/`Textarea`/`SearchInput`/`FilterBar` demos | none (no submit) | demo error/hint text | demo | — | `DialogDemo` only | `Skeleton` demos |

---

# STEP 9 — RESPONSIVE-SPECIFIC UI

| Area | Desktop UI | Mobile UI | Component Files |
|---|---|---|---|
| Public header | `NavBody` bar + `Menu` Services flyout + inline actions (language/theme/login/CTA) | `MobileNav` bar + Animate-UI `Sheet` drawer (`w-[min(22rem,90vw)]`, side flips `left` EN / `right` AR), accordion groups | `public-header.tsx`, `ui/resizable-navbar.tsx`, `ui/navbar-menu.tsx`, `animate-ui/components/radix/sheet.tsx` |
| Public header conceal | Sticky, hides on scroll-down past 320px (`-translate-y-full`) | Same behavior; drawer keeps header visible while open | `public-header.tsx:112-134,172` |
| Hero | 2-col (`lg:[1.02fr_0.98fr]`), stats 3-col, picker `sm:2` | Stacked; photo aspect changes; docket overlaps (`mx-4 -mt-24`); picker 1-col | `hero-parallax-layers.tsx:188-273` |
| Home sections | `CapabilityRows md:2`, `IndustryLedger md:2`, `FocusCards sm:2 md:3`, sticky panel `hidden lg:block` | Single col; sticky panel becomes stacked text | `public-components.tsx`, `ui/sticky-scroll-reveal.tsx`, `ui/focus-cards.tsx` |
| Detail grids | `lg:[1fr_360px]` / `lg:[360px_1fr]` + sticky aside | Single col; aside stacks | `public-pages.tsx` detail views |
| Policy | `lg:[260px_1fr]` + `lg:sticky top-28` TOC | TOC stacks above article | `public-pages.tsx:982-1061`, `policy-toc.tsx` |
| Booking shell | `h-[min(72vh,38rem)]`, bubbles `max-w-72%`, payment panel `ms-auto max-w-36rem`, review `sm:2` | `max-sm:[84svh]`, bubbles to `85%`, full-width panels | `consultation-booking-chat.tsx` |
| Footer | 4-col (`lg:[1.1fr_0.8fr_0.8fr_0.9fr]`), legal bar row | 1–2 col (`md:2`), legal bar stacked | `public-shell.tsx:102-186` |
| Floating dock | Centered floating dock | Same dock + `mobileMenuLabel` handling; `safe-area-inset-bottom` | `public-floating-dock.tsx`, `ui/floating-dock.tsx` |
| Tables (admin+client) | `DataTable` | `DataRecordCard` mobile cards (via `mobileRender`/separate stack) | `ui/data-table.tsx`, `ui/data-record-card.tsx`, page files |
| Admin shell | Fixed `aside w-72` sidebar | `lg:hidden` trigger + native `<dialog>` drawer (`w-[min(22rem,90vw)]`, hard `dir=rtl`) | `dashboard-shell-view.tsx:38-46`, `dashboard-mobile-nav.tsx` |
| Client shell | Inline tab nav row (`hidden lg:block`) | Compact scrollable nav row (`lg:hidden`, `overflow-x-auto`, hidden scrollbars) | `client-site-shell.tsx:24-66` |
| Client header | Back-to-site link + user chip visible (`md:`/`sm:`) | Icon-only actions; labels hidden | `client-site-shell.tsx:95-127` |
| Metrics/panels | `md:2/4`, `xl:2/3`, `2xl:4/6` grids | Single col stacks | admin + client pages |
| Finance ops | 2-col attempt/webhook cards | Single col | `finance/page.tsx` |
| Roles | `20rem_1fr` matrix grid | Stacked (list above form) | `role-permission-form.tsx` |
| Receipt | `max-w-[980px]`, 3-col stats | Stacked; `print:` variants for paper | `consultation-payment-receipt-document.tsx` |
| Preview booking mock | `desktopSummary aside` | `summaryOpener button` + native `<dialog drawer>` | `ui-preview.tsx` |
| Images | `sizes` 33–45vw desktop | `100vw` fallback; `fill` + aspect boxes | `public-pages.tsx`, `directory-filter.tsx` |

---

# STEP 10 — THEME-SPECIFIC UI

Theming system: `next-themes` class strategy (`darkMode:"class"`),
`ThemeProvider` per root (`dark` default everywhere except
`(app-ar)`/`login-2fa` area which defaults `light`), public surfaces use
CSS vars `--kmt-public-*` with `:root` (light: paper `#f6f3ec`, gold
`#755a26`) vs `.dark` (canvas `#050505`, gold `#d0a048`) in
`src/app/globals.css:69-130`; Tailwind maps `kmt-*`, `gold` ramp,
`state-*` tokens to vars (`tailwind.config.ts:22-83`); motion speeds via
`duration-kmt-*/ease-kmt-*` tokens.

| Component | Dark | Light | Tokenized? | Hard-coded values? |
|---|---|---|---|---|
| `PublicShell` + public sections | `--kmt-public-canvas/text/muted/line/panel` | Same vars, light values | Yes (vars) | Brand plaque `bg-black` deliberate in both themes (`public-shell.tsx:108`) |
| `PublicHeader` (`NavBody`, drawer) | `--kmt-public-header` (near-black 92%) | `--kmt-public-header` (paper 90%) + `header-shadow` | Yes | `SheetContent` uses `bg-[color:var(--kmt-public-header)]` (token) |
| Hero | Gold spotlight gradients, dark scrims (`--kmt-public-scrim: 6 5 4`) | Same vars resolve to light scrim (`246 241 230`) | Yes | `SPOTLIGHT_GOLD_*` rgba constants are theme-agnostic gold |
| Footer CTA/muted surfaces | `--kmt-public-surface-muted` (`#100e0c`) | `--kmt-public-surface-muted` (`#ede8dc`) | Yes | `border-kmt-gold/25` accents both themes |
| `KmtBrandLogo` | `surface="dark"` / `theme` variants | `surface="light"` (admin), `theme` (public) | Partial (surface prop) | Variant chosen per shell at call site |
| `ClientSiteShell` | Hard dark: `bg-[#060504]`, `bg-[#090806]`, `text-[#f8f3ea]`, gradient band | No light styling (dark-only shell) | No (hex literals) | Yes — `#060504/#070604/#07090b/#111827`, `white/10` borders |
| `DashboardShellView` (admin) | `ThemeToggle` present; surfaces `bg-white`, `text-kmt-ink` | Light-first (`bg-kmt-canvas`, white cards) | Partial (`kmt-*` tokens) | `bg-white`, `backdrop:bg-slate-950/55` dialog scrim |
| `ClientPortalMetric`/panels | Dark cards (`bg-white/[0.05]`, gold text) | No light variant | No | `bg-kmt-gold`, `text-white`, `border-white/15` literals |
| Chat bubbles (booking/client) | User gold `bg-kmt-gold`; assistant `bg-white/[0.05]`; staff navy | Same (no light variant) | Partial | `bg-kmt-gold`, `bg-kmt-gold/15`, `bg-white/[0.05]` |
| `Badge` tones | `active/pending/neutral/closed/danger` classes | Same classes both themes | Partial (tone map) | Tone color literals in `badge.tsx` |
| `Button` variants | `primary/secondary/outline/ghost/danger` + `primary-foreground` | Same | Partial (CSS vars `primary/accent/ring`) | `border-kmt-gold/60`, `bg-kmt-gold/10-15` accents |
| Admin `Card`s / tables | White cards, `border-kmt-border`, `hover:bg-slate-50` | Same (light-first) | Partial | `bg-white`, `text-kmt-ink`, `bg-slate-50` |
| Status/notice boxes | `emerald` paid panel; `amber` warnings; `slate` notes | Same | Partial (`state-*` vars exist in config) | `emerald`/`amber`/`slate` literals at call sites |
| Receipt document | Standalone `bg-[#f4efe6]` paper (both themes) | Same (print-first) | No | Hex literal + `print:` variants |
| Install / login | `bg-kmt-canvas`, dark cards | `Card` whites in login form | Partial | Mixed token + literal |
| `FocusCards`, `Marquee`, `Skeleton` | Dark-tuned defaults | Inherit context (no explicit light rules) | No | Component-internal literals |

---

# STEP 11 — CURRENT UI COMPONENT TREE (MAJOR ROUTES)

## HOME (`/` and `/ar` — same tree, `locale` differs)

```text
HOME
├─ PublicHeader
│  ├─ NavBody (desktop)
│  │  ├─ KmtBrandLogo
│  │  ├─ Menu > MenuItem (Services flyout) + nav Links
│  │  ├─ Tooltip > language switch
│  │  ├─ Tooltip > ThemeToggle
│  │  ├─ Tooltip > ClientLoginLink
│  │  └─ ConsultationLink (ShimmerCtaLink)
│  └─ MobileNav > MobileNavHeader
│     ├─ Sheet > SheetContent (drawer) > ConsultationLink + accordion Links
│     └─ language + theme + login actions
├─ HeroParallaxLayers
│  ├─ Spotlight
│  ├─ TextAnimate (h1)
│  ├─ KmtGoldUnderline
│  ├─ KmtUnderlinedText (+ Highlighter)
│  ├─ CountingNumber (stats)
│  └─ docket card > BorderBeam + ShimmerCtaLink
├─ TrustStrip > Marquee
├─ CapabilityRows > BlurFade + CapabilityGlowGate > GlowingEffect
├─ StatementBreak (KmtGoldUnderline + KmtUnderlinedText)
├─ StickyScroll
├─ ProcessSteps > Timeline
├─ MatterRows > HoverEffect
├─ IndustryLedger
├─ FocusCards
├─ InsightsLedger (or empty panel + ButtonLink)
└─ PublicShell footer
   ├─ BorderBeam + KmtGoldUnderline + KmtUnderlinedText + ShimmerCtaLink
   ├─ 4-col grid (brand plaque, practice nav, offices, contact)
   ├─ legal bar
   └─ PublicFloatingDock > FloatingDock
```

## SERVICES (`/services`, `/ar/services`)

```text
SERVICES
├─ PublicHeader
├─ PageHero
├─ DirectoryFilter (TextInput + pill Buttons + clear)
│  └─ MagicCard rows > BlurFade + Badge + ButtonLink
├─ CTA row (ButtonLink ×2)
└─ footer + dock
```

## BOOKING (`/book-consultation`, `/ar/book-consultation`)

```text
BOOKING
├─ PublicHeader
├─ BookingFlowHeader (KmtUnderlinedText)
├─ ConsultationBookingChatFromQuery
│  └─ ConsultationBookingChat
│     ├─ BorderBeam shell
│     ├─ header (KmtBrandLogo + online dot)
│     ├─ AnimatedList log
│     │  ├─ ChatBubble (+ info cards)
│     │  ├─ LanguageChoicePanel (Button ×2)
│     │  ├─ SlotChoicePanel (Button chips)
│     │  └─ PaymentReviewPanel (dl + pay/back Buttons)
│     ├─ quick-action Buttons
│     └─ PlaceholdersAndVanishInput + send Button
└─ footer (no dock on this route)
```

## CONTACT (`/contact`, `/ar/contact`)

```text
CONTACT
├─ PublicHeader
├─ PageHero
├─ ContactForm (TextInput ×3 + Select + Textarea + checkbox
│  + ShimmerButton + status/alert regions)
├─ branch panels (MaterialSymbol rows + tel/mailto Links)
├─ WhatsApp panel (ButtonLink external)
└─ footer + dock
```

## ARTICLE DETAIL (`/articles/[slug]`, `/ar/articles/[slug]`)

```text
ARTICLE DETAIL
├─ PublicHeader
├─ ReadingProgress
├─ PublicBreadcrumbs
├─ article.publicPanel (Badge ×2 + byline + ArticleBody + disclaimer
│  + ButtonLink back)
├─ DetailCta (ButtonLink ?service=)
├─ related Links (publicPanelHover)
└─ footer + dock
```

## CASE-STUDY DETAIL (`/case-studies/[slug]`, `/ar/case-studies/[slug]`)

```text
CASE-STUDY DETAIL
├─ PublicHeader
├─ PublicBreadcrumbs
├─ article.publicPanel
│  └─ Reveal ×N > CaseStudyBlock (challenge/approach/outcome/lessons)
├─ DetailCta
└─ footer + dock
```

## POLICY (`/privacy`, `/terms` + AR)

```text
POLICY
├─ PublicHeader
├─ grid: aside.publicPanel > PolicyToc (nav anchors)
├─ article (summary card on privacy + scroll-mt sections)
└─ footer + dock
```

## ACCOUNT SETUP (`/client-account/setup`, `/ar/client-account/setup`)

```text
SETUP
├─ PublicHeader
├─ status card (Links | existing-account panel | ClientAccountSetupForm)
├─ ConsultationSummary aside (dl)
└─ footer + dock
```

## PAYMENT RETURN / RECEIPT

```text
RETURN                       RECEIPT (standalone)
├─ PublicHeader              ├─ print bar (back Link + ReceiptPrintButton)
├─ status card               ├─ header (KmtBrandLogo lockup)
│  ├─ PaidConfirmation       ├─ ReceiptStat ×3
│  ├─ PaymentStatusPoller    ├─ ReceiptPanel client+payment
│  └─ StatusItem dl +        ├─ ReceiptPanel consultation
│     action Buttons          ├─ total panel
└─ footer + dock              └─ footer note
```

## LOGIN (`/login`)

```text
LOGIN
├─ brand/info column (KmtBrandLogo + locale Link + securityNote + backHome)
└─ Card (CardHeader/Title/Description + LoginForm:
   TextInput ×2 + role=status/alert + Button loading)
```

## INSTALL (`/install`)

```text
INSTALL
├─ intro
├─ Card 1 hostingMode radios
├─ Card 2 token TextInput + preflight Button
├─ Card 3 office/admin form (TextInput ×7)
├─ Card 4 finish (lock + superAdminEmail)
└─ aside (ModePanel + StatusPanel + ChecksPanel + Notice)
```

## CLIENT DASHBOARD (`/client`)

```text
CLIENT DASHBOARD
├─ ClientSiteShell header (brand, back-to-site, ClientLanguageSwitch,
│  ThemeToggle, user chip, logout form)
├─ ClientPortalNav (desktop + compact)
├─ title band + action
├─ ClientPortalMetric ×4
├─ nextStep panel (ButtonLink + ClientPortalRow)
├─ cases panel + appointments panel (Links + Badges)
├─ payments panel
└─ portal footer
```

## CLIENT ASSISTANT (`/client/assistant`)

```text
CLIENT ASSISTANT
├─ ClientSiteShell
├─ ClientAssistantPanel
│  ├─ header (KmtBrandLogo + status + scope)
│  ├─ quick-action chips
│  ├─ log (ClientChatBubble + AssistantData cards + TypingIndicator)
│  └─ composer form (Textarea + send Button)
└─ ClientTeamChatPanel (brand header + TeamBubble log + composer)
```

## CLIENT CASE DETAIL (`/client/cases/[caseId]`)

```text
CLIENT CASE DETAIL
├─ ClientSiteShell (action=back)
├─ overview ClientPortalPanel (Badges + DetailItems + summary)
├─ sessions panel + appointments panel
└─ documents panel (download Links) + payments panel
```

## ADMIN DASHBOARD (`/admin`)

```text
ADMIN DASHBOARD
├─ DashboardShell (AdminAccessProvider)
│  ├─ aside (KmtBrandLogo + Badge + DashboardNavigationLinks)
│  └─ header (DashboardMobileNav dialog + title + AdminNotificationBell
│     + ThemeToggle + user + logout + action)
├─ hero header (quick-action ButtonLinks)
├─ ClientSearch form (SearchInput)
├─ DashboardPriorityList ×N (Card + PriorityItem Links + Badges)
├─ DashboardMetricLink ×N
└─ RecentActivity ol
```

## ADMIN CASE DETAIL (`/admin/cases/[caseId]`)

```text
ADMIN CASE DETAIL
├─ DashboardShell
├─ header Card (Badge + anchor ButtonLink)
├─ MetricCard ×4
├─ CaseTabs nav
├─ tab body (Overview/Sessions/Appointments/Tasks/Documents Cards
│  + details/summary disclosures + inline forms)
└─ sidebar (CaseStatusForm + CaseSessionForm + calendar Card)
```

## ADMIN FINANCE (`/admin/finance`)

```text
ADMIN FINANCE
├─ DashboardShell
├─ MetricCard ×4 (+ review note + currency warning)
├─ invoices grid (filter form + export Link + DataTable +
│  PaymentMobileCard + PaymentForm Card)
└─ gateway ops (FilterBar + pricing/gateway/pricing-rule Cards
   + attempt cards + webhook cards + WebhookReplayButton)
```

## ADMIN CONTENT (`/admin/content`)

```text
ADMIN CONTENT
├─ DashboardShell
├─ MetricCard ×5
├─ tab nav
├─ filter form + DataTable + ContentMobileCard + pagination
└─ edit Card (ArticleForm | CaseStudyForm | SocialDraftForm)
   + AI Card (AiSocialDraftForm)
```

## PREVIEW COMPONENTS (`/preview/components`)

```text
PREVIEW COMPONENTS
├─ header (ThemeToggle)
├─ Buttons / Badges / Fields / Feedback / States / Tabs /
│  Pagination / Dialog(DialogDemo) / Skeletons / Data /
│  Cards / FilterBar+icons galleries
├─ RippleButton + Tilt + SplittingText (Animate UI)
└─ CountUp + ShimmerButton (motion-ui)
```

(Total trees: 19. Remaining routes reuse the same shell patterns shown
above: directory/detail/policy/client-list/admin-list skeletons.)

---

# STEP 12 — COMPONENT REUSE MAP

| Component | Pages (URL patterns) | Routes |
|---|---:|---|
| `PublicHeader` (+ flyout, drawer, actions) | 32 | All public EN+AR |
| `PublicShell` footer + `PublicFloatingDock` | 30 (dock hidden on 2 booking) | All public except booking ×2 |
| `PageHero` | 10 | services/team/articles/case-studies/media ×2 locales |
| `DirectoryFilter` (+`MagicCard`/`BlurFade`) | 8 | services/team/articles/case-studies ×2 |
| `PublicBreadcrumbs` | 8 | service/team/article/case-study details ×2 |
| `DetailCta` | 6 | service/article/case-study details ×2 |
| `PolicyToc` | 4 | privacy/terms ×2 |
| `HeroParallaxLayers` + hero set | 2 | `/`, `/ar` |
| `ContactForm` + branch panels | 2 | `/contact`, `/ar/contact` |
| `ConsultationBookingChat` set | 2 | booking ×2 |
| `ClientAccountSetupPage/Form` | 2 | setup ×2 |
| `KmtBrandLogo` | 40+ | Shells, hero chat, login, receipt, admin, preview |
| `MaterialSymbol` | 60+ | All areas (icons) |
| `Badge` | 50+ | Listings, details, tables, chats, dashboards |
| `Button`/`ButtonLink` | 60+ | All areas |
| `Card` set / `MetricCard` | 30+ | Admin (24), install, login, gallery |
| `Field` controls | 40+ | All forms + all admin filter bars |
| `DataTable` + `DataRecordCard` | 16 + gallery | 12 admin + 4 client + preview |
| `FilterBar` + `SearchInput` | 14+ | Admin lists + dashboard search |
| `StateBlock` | 12+ | Admin guards/empty, install, availability, gallery |
| `InlineFeedback` | 20+ | Every admin action form + gallery |
| `ThemeToggle` | 34+ | Public header, admin shell, client shell, gallery |
| `DashboardShell` set | 24 | All admin UI pages |
| `ClientSiteShell` set | 8 | All client pages |
| `ClientPortal*` set | 8 | All client pages |
| `BorderBeam` | 6+ | Hero docket, chat shell, footer CTA ×2 locales |
| `ShimmerCtaLink` | 34+ | Header/hero/footer ×32 + flyout |
| `TextAnimate` / `CountingNumber` | 2 | Home hero ×2 |
| `Reveal` | 4+ | Case-study blocks ×2, shared section reveals |
| `AdminNotificationBell`/popover | 25 | Shell header (24) + notifications page |
| `ThemeProvider` | 72 | All route-group roots |

---

# STEP 13 — PAGE-SPECIFIC COMPONENTS (SINGLE-ROUTE, 34)

| # | Component | Only on | File |
|---|---|---|---|
| 1 | `TrustStrip` | Home (`/`, `/ar`) | `public-components.tsx:172` |
| 2 | `CapabilityRows` | Home | `public-components.tsx:382` |
| 3 | `CapabilityGlowGate` | Home | `capability-glow-gate.tsx` |
| 4 | `StatementBreak` | Home | `public-components.tsx:532` |
| 5 | `StickyScroll` usage | Home (prod) | `public-pages.tsx:27` + `ui/sticky-scroll-reveal.tsx` |
| 6 | `ProcessSteps` | Home | `process-steps.tsx` |
| 7 | `MatterRows` | Home | `public-components.tsx:443` |
| 8 | `IndustryLedger` | Home | `public-components.tsx:459` |
| 9 | `InsightsLedger` | Home | `public-components.tsx:487` |
| 10 | `BookingFlowHeader` | Booking | `public-components.tsx:561` |
| 11 | `ConsultationBookingChat` + chat panels | Booking | `consultation-booking-chat.tsx` |
| 12 | `ConsultationBookingChatFromQuery` | Booking | `booking-query-client.tsx` |
| 13 | `ContactForm` + branch aside | Contact | `contact-form.tsx`, `public-pages.tsx:880` |
| 14 | `ArticleBody` | Article detail | `public-pages.tsx:1194` |
| 15 | `ReadingProgress` usage | Article detail (prod) | `public-pages.tsx:696` + `motion-ui/reading-progress.tsx` |
| 16 | `CaseStudyBlock` | Case-study detail | `public-pages.tsx:1171` |
| 17 | `ConsultationSummary` (setup aside) | Account setup | `client-account-setup-page.tsx` |
| 18 | `PaymentStatusPoller` | Payment return | `payment-status-poller.tsx` |
| 19 | `ConsultationPaymentReceiptDocument` | Receipt | `features/payments/consultation-payment-receipt-document.tsx` |
| 20 | `ReceiptPrintButton` | Receipt | `features/payments/receipt-print-button.tsx` |
| 21 | `LoginForm` (+ blocked variant) | Login | `features/auth/login-form.tsx`, `(login)/login/page.tsx` |
| 22 | `InstallWizard` (+ panels) | Install | `features/install/install-wizard.tsx` |
| 23 | `ClientAssistantPanel` | Client assistant | `features/client/client-assistant-panel.tsx` |
| 24 | `ClientTeamChatPanel` | Client assistant | `features/client/client-team-chat-panel.tsx` |
| 25 | `DocumentUploadForm` | Client files | `features/portal/document-upload-form.tsx` |
| 26 | `ProfileForm` | Client profile | `features/portal/profile-form.tsx` |
| 27 | `AdminCommandCenter` (+ metric/priority parts) | Admin dashboard | `features/admin/dashboard/` (3 files) |
| 28 | `AdminMessageThreadPanel` | Admin thread | `features/admin/messages/admin-message-thread-panel.tsx` |
| 29 | `ContactMessageInbox` | Admin contact-messages | `features/admin/contact-messages/contact-message-inbox.tsx` |
| 30 | `AdminNotificationCenter` | Admin notifications | `features/admin/notifications/admin-notification-popover.tsx` |
| 31 | `RolePermissionForm` | Admin roles | `features/admin/governance/role-permission-form.tsx` |
| 32 | `ConsultationAvailabilityForm` | Admin availability | `features/admin/consultations/consultation-availability-form.tsx` |
| 33 | `UiPreview` (+ mock `BookingForm`) | Preview UI | `features/ui-preview/ui-preview.tsx` |
| 34 | `ComponentGallery` (+ islands/demos) | Preview components | `features/ui-preview/component-gallery.tsx`, `gallery-islands.tsx` |

Multi-route feature modules (in reuse map, not listed here):
`DirectoryFilter`, `PolicyToc`, `DetailCta`, `PageHero`, `PublicSection`,
`PublicBreadcrumbs`, case/task/document/consultation/content/finance/
governance form modules, `ClientLanguageSwitch`, notification bell.

---

# SUMMARY (COUNTED FROM THIS AUDIT)

| Metric | Count | Basis |
|---|---|---|
| Total routes audited | 72 URL patterns (60 `page.tsx` files) | Step 1 tables 1A–1F |
| Public pages | 32 (15 EN + 17 AR) | 1A + 1B |
| Admin pages | 27 files (24 full UI + 3 redirect-only) | 1E |
| Client pages | 8 | 1D |
| Auth / install / preview | 5 (login, 2fa-disabled, install, 2 preview) | 1C + 1F |
| Shared UI components | 50 | Step 5 rows |
| Page-specific UI components | 34 | Step 13 rows |
| Aceternity components actually rendered | 9 of 9 installed | Step 6 (HoverEffect, FloatingDock, FocusCards, Menu, PlaceholdersAndVanishInput, ResizableNavbar, Spotlight, StickyScroll, Timeline) |
| Magic UI components actually rendered | 9 of 11 installed (+1 local Magic-inspired `motion-ui/shimmer-button`) | Step 6 (AnimatedList, BlurFade, BorderBeam, GlowingEffect, Highlighter-wrapped, MagicCard, Marquee, TextAnimate, ShimmerCtaLink; installed-only: NumberTicker, ui/ShimmerButton) |
| Animate UI components actually rendered | 4 in prod (+3 preview-only; 19 files installed) | Step 6 (CountingNumber, RippleLink, Sheet, Tooltip) |
| shadcn components actually rendered | 0 vendored (CLI/config only); 10 shadcn-style local primitives in prod (+5 preview-only) | Step 6 |
| Animated components (motion-library-driven, rendered) | 19 (15 `ui/*` + 4 Animate UI) + GSAP/Lenis hero + smooth-scroll + CSS/IO-only set | Step 7 |
| Forms | 34 documented experiences (incl. filter/search bars; rows 3–4 legacy unrendered) | Step 8 |
| Tables | 17 `DataTable` surfaces (12 admin routes — finance renders 3, user-detail 2 — + 4 client + 1 preview demo) | Steps 3.7–3.9 |
| Dialogs / Sheets / Popovers | 12 overlay experiences from 8 component types (Animate-UI Sheet, admin native dialog, 2 preview dialogs, notification `details` popover, header Tooltips, 5 native `details/summary` disclosure surfaces) | Steps 3.8, 5, 9 |

## Routes / components that could not be confidently identified

1. **Empty placeholder directories with no files** (no route, nothing
   rendered — listed as non-routes in Step 1): `(app-ar)/admin/[...section]`,
   `(app-ar)/client/*`, `(app-ar)/portal/*`, `(app-ar)/product-system/*`,
   `(public-ar)/client-account/setup`, `payment/consultation/return`
   (root-level), `(install-ar)/stitch-clone/[screen-name]`. Intent unknown;
   assumed reserved/retired scaffolding.
2. **Legacy booking components** (`BookingStepper`,
   `ConsultationAssistantPanel`): present and internally complete but have
   zero importers — flagged unrendered, not deleted per audit-only scope.
3. **`domain/legal-cards.tsx`** (ServiceCard, LawyerCard, CaseStudyCard,
   ArticleCard, AIOrganizerPanel, DocumentCard, TaskCard): no importers
   found — installed-only, purpose unconfirmed.
4. **Animate-UI `LiquidButton`, `GradientBackground/Text`, `Tabs`** and
   **`ui/number-ticker`, `ui/shimmer-button`**: installed, zero page
   importers — confirmed installed-only by import grep.
5. **`ProductThemeProvider`**: barrel-exported, no page importer — role
   unconfirmed.
6. **Per-locale content differences** (exact Arabic copy, slug coverage of
   `generateStaticParams`) were not enumerated — route patterns, not copy,
   were audited.
7. **API routes, email templates, and server-only modules** were excluded
   by scope (UI only).

## Confirmations

- No source code or design was changed (read-only audit; this document is
  the only artifact created).
- No replacement components were selected; no redesign recommendations
  are contained in this file.
