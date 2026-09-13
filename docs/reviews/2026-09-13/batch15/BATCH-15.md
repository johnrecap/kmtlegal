# Batch 15: UI and motion rollout inventory

## Result

This batch records the existing surface and the decisions needed before interactive previews. It changes no product code, styling, package, dependency, schema, role, price, booking rule, provider, or deployment setting. The 52 checkboxes in [KMT_UI_MOTION_TASKS.md](../../../KMT_UI_MOTION_TASKS.md) remain open for supervisor acceptance.

The machine-readable inventory is [ui-inventory.json](ui-inventory.json). Its `routePageIndex` records the route pattern for each of the 58 page files; `componentUsageIndex` records every current component/feature `.tsx` source file, runtime exports, ownership, native-control tags, direct module consumers and reverse module paths to its transitive page/layout entries. This includes asynchronous public views such as `HomePageView`, `ArticlesPageView`, `ArticleDetailPageView`, `CaseStudiesPageView`, `CaseStudyDetailPageView` and `BookConsultationPageView`.

[generate-ui-inventory.mjs](generate-ui-inventory.mjs) is the reproducible TypeScript-AST and module-resolution generator/validator. It resolves relative imports, the `@/` alias, index modules, `export *` and named runtime re-exports, while excluding type-only imports. `directRuntimeModuleConsumers` describes one resolved module edge; `connectedPageOrLayoutModules` describes transitive page/layout reachability and labels the complete module path, so it never claims a symbol-level render relationship. The generator asserts the known barrel/relative cases for `KmtBrandLogo`, `ReceiptPrintButton`, `Button`, the two public async views and `PublicShell` before writing the artifact.

Static inspection finds **58 current `page.tsx` files**, exactly matching the historical 58-page baseline in `docs/reviews/2026-09-11/surface-before.json`; no page file or resolved route pattern was added or removed. `arabicCatchAllResolution` resolves the finite patterns handled by `/ar/[[...path]]` from `renderPublicPath`, and names its service, lawyer and database-backed article/case-study slug sources. That is source evidence only: dynamic database content and browser behavior were not exercised.

## Existing system checked

The inventory reads `src/app/**/page.tsx`, layouts, `src/components/ui/index.ts`, every exported component under `src/components` and `src/features`, public/client/auth content modules, the shared shells, `src/app/globals.css`, `tailwind.config.ts`, `src/lib/design-system/tokens.ts`, `src/features/public-site/public-motion.ts`, `package.json`, and the historical 2026-09-11 surface inventories.

### Page and layout map

| Surface | Route patterns and language | Reused layout / dynamic behavior |
|---|---|---|
| Administration | `/admin/**`, `/login/2fa`; Arabic RTL | `(app-ar)/layout.tsx`; admin uses `admin/layout.tsx`, dashboard shells and permission filtering. Details retain `[caseId]`, `[clientId]`, `[consultationId]`, `[threadId]`, `[userId]`. |
| Client portal | `/client/**`; session-selected Arabic or English | `(client)/layout.tsx`, `ClientSiteShell`; case detail retains `[caseId]`. |
| Public English | `/`, articles, case studies, services, team, contact, media, privacy, terms, booking, setup; English LTR | `(public-en)/layout.tsx`, `PublicShell`; article/case/service/team retain `[slug]`. |
| Public Arabic and payments | `/ar/**`, Arabic booking/setup, payment receipt/return; Arabic RTL | `(public-ar)/layout.tsx`; `[[...path]]` remains the catch-all public resolver. |
| Setup and authentication | `/install`, `/login` | Their route-group layouts and existing `InstallWizard` / `LoginForm` remain the only product entry components. |

`ProductThemeProvider` only renders a locale-aware wrapper. It does not implement a theme switch, class persistence, `localStorage`, or system-theme handling. Tailwind’s `darkMode: "class"` exists in configuration, but no current source implementation was found that gives administration a persistent light/dark control. KMT-UI-042 is therefore pending implementation and browser verification.

## Component decision matrix

All source/use pointers below are static; the full groups and their route consumers are in `ui-inventory.json`.

| Current group and source/use pointers | Decision | KMT appearance and behavior | Motion, input and connected risk |
|---|---|---|---|
| Buttons, icon buttons and links — `src/components/ui/button.tsx`; public/client/admin shells | Retain and improve | Keep native `button`/`a`, gold primary, ink secondary and semantic danger. Replace generic repeated shadows with context-specific public, portal and admin treatments. | 120–180ms press/focus confirmation; no motion with reduced motion. Preserve submit/loading/disabled behavior and form endpoints. |
| Fields and native date/file controls — `src/components/ui/field.tsx`; admin feature forms, booking, portal upload/profile | Retain and compose | Keep native text, textarea, select and picker controls for basic inputs; give labels, help, errors and selected states a shared CSS contract. | Border/focus only, 120–160ms. RTL labels; LTR date/time values; preserve `aria-describedby`, validation, drafts and API error recovery. |
| Dialog frame and destructive confirmations — `src/components/ui/dialog.tsx`; feature action flows | Replace behavior with Base UI when implemented | Preserve KMT panel styling but use Base UI Dialog / Alert Dialog for focus trap, dismissal and return focus. | 180–260ms opacity/scale or edge slide; instant reduced-motion alternative. Validate nested confirmation, escape, touch reader escape and action-state ownership. |
| Menus, popovers, notification center and mobile drawer — `admin-notification-popover.tsx`, dashboard mobile nav, shells | Replace behavior with Base UI selectively | Use Base UI Popover/Menu/Drawer only where current interaction needs roving focus, portal positioning or modal mobile behavior; ordinary links remain native. | Open/close 180–220ms, interruptible. RTL placement, keyboard arrows/Esc, outside press, notification reads and navigation URLs must remain intact. |
| Tabs and navigation — `src/components/ui/tabs.tsx`, `public-shell.tsx`, dashboard/client navigation | Compose existing elements first; Base UI Tabs only for true client-side panels | Route navigation stays links. Upgrade in-page panels to a semantic tab pattern only where focus and panel relationships are real. | Underline/selection 150–190ms; no sliding text in Arabic. Keep URL/query state, active route, browser back and mobile horizontal scroll. |
| Tables, filters, search, pagination and record cards — `data-table.tsx`, `filter-bar.tsx`, `search-input.tsx`, `data-record-card.tsx`; admin/client list pages | Retain and improve | Keep data table + mobile record-card fallback; create dense operations styling rather than public card styling. | Filter-result/status transition 180–220ms only after real data change. Preserve server filters, pagination, sorting, long IDs, permissions and screen-reader captions. |
| Editorial public layouts — `public-components.tsx`, `public-pages.tsx`, `legal-cards.tsx`; public routes | Compose existing elements | Separate service index, people profiles, long-form articles, case studies and media into distinct editorial compositions using existing facts/assets. | Hero 600–800ms once, section reveals 300–450ms once, hover only on hover-capable devices. No hidden primary content, infinite effects or universal card template. |
| Feedback, loading, empty/error/success — `inline-feedback.tsx`, `state.tsx`, `toast.tsx`, `skeleton.tsx` | Retain and improve | Reuse tones from current state tokens; ensure action/retry remains specific to the source contract. | Status entry 180–220ms, true loading only. Preserve `role`, live region, no motion when reduced. Text continues to come from content modules and `localizeApiMessage`. |
| Booking chat, stepper, slot and summary — `consultation-booking-chat.tsx`, `booking-stepper.tsx`, `consultation-assistant-panel.tsx` | Compose existing elements; Motion only after preview acceptance | Desktop should pair conversation and live summary; mobile should expose a persistent summary affordance, not duplicate booking state. | Message/summary 180–240ms, booking success max 450ms after confirmed write. Preserve locale, service/method changes, availability, conflict/retry and no-parallel-booking contract. |
| Upload, dates, payments and receipts — task/document forms, payment return/receipt | Retain and improve | Keep browser-native upload/date capabilities until a concrete accessibility gap is demonstrated. Receipt stays print document. | No decorative motion for financial figures or long tables. Preserve upload scanning, payment polling, print and all API boundaries. |
| Dashboard, portal and administration shell | Compose existing elements | Public stays architectural/dark brand; client portal remains task-focused; administration gains a measured light/dark token layer, not a public-site reskin. | Navigation state should not animate whole pages. Theme transition should be optional and reduced-motion safe. Preserve role-filtered navigation and server page guards. |
| Images, brand mark and icons — `kmt-brand-logo.tsx`, `material-symbol.tsx`, public media/content | Retain and improve | Preserve current logo, localized assets and SVG icon semantics. Use visual media as evidence-led editorial anchors rather than decoration. | Image scale/fade only on deliberate card interaction; no automatic carousel. Honor `alt`, RTL arrow direction and reduced motion. |

## Tokens, style ownership and migration order

Current durable administration tokens are in `src/lib/design-system/tokens.ts` and `globals.css`: navy `#0f172a`, gold `#997b44`, dark gold `#755a26`, paper `#ffffff`, canvas `#f8fafc`, ink `#0f172a`, muted `#64748b`, border `#e2e8f0`; state foreground/surface/border values; and control/panel/pill radii `4px/8px/9999px`. The separate public CSS token set in `src/app/globals.css` must also be preserved: canvas `#060504`, surface `#07090b`, muted surface `#0c1116`, header `#070604`, panel `rgb(255 255 255 / 3.5%)`, text `#f8f3ea`, muted text `#cbd5e1`, and public gold `#c79a52`. Public gold is intentionally distinct from administration gold `#997b44`.

`tailwind.config.ts` preserves IBM Plex Sans Arabic for body/display/headline and Inter for labels. Its main scale is display `48px/60px` (mobile `32px/40px`), headline `24px/32px`, body `16px/24px` and `18px/28px`, label `12px/16px`; the KMT scale is display `40px/52px`, title `24px/34px`, body `16px/26px`, label `13px/18px`. Spacing is stack `8px/16px/32px`, 1200px container, 16px mobile margin, 24px gutter and 40px desktop margin. `darkMode: "class"` remains configuration only until the administration control is implemented.

`src/app/globals.css` owns global variables, resets, public variables and motion classes. `public-motion.ts` owns the names that public components consume. Shared UI owns basic controls; public/client/admin shells currently own many route-specific utility strings. The CSS already has a global `prefers-reduced-motion` override. It also has many overlapping hover, card-beam, spotlight and reveal effects; the next implementation should reduce those to purpose-specific effects instead of transferring them wholesale.

Migration order: first introduce plain CSS token files alongside existing utilities; then move shared primitives and their states; then public editorial/booking surfaces; then client portal; then administrative light/dark tokens and dense operations components; only after route-by-route visual and interaction evidence, remove remaining Tailwind utilities and its packages. No Tailwind removal belongs in this inventory batch.

## Content and localization map

Public facts and Arabic/English structure come from `src/content/public-content.en.ts`, `src/content/public-content.ar.ts`, `src/content/public-content.ts` and `src/content/public-services.ts`. Client portal copy is `src/content/client-content.ts`; authentication and installation copy is `src/content/auth-content.ts`; empty/not-found content is `src/content/not-found-content.ts`. Product labels, display mappings, status text and API message localization live in `src/lib/ui-copy.ts`, `src/lib/legal-content.ts` and `src/lib/legal-format.ts`.

The later reorganization should only change how these existing sources are grouped per page: public editorial page data stays in the public content modules; portal labels stay in client content; operational labels and error localization stay in their maps. This batch does not rewrite text or create new product claims.

## Library verification — 2026-09-13

The source currently has React `18.2.0`, Next `15.5.25`, and neither planned package in `package.json` or `package-lock.json`.

| Proposed package | Exact published version verified | Compatibility and use decision |
|---|---|---|
| `motion` | `13.1.1`, npm latest tag at review time — [npm](https://www.npmjs.com/package/motion?activeTab=versions) | Motion’s installation guide says React 18.2+ is supported and gives `motion/react` for client components; its Next guidance also offers `motion/react-client` to reduce client JavaScript. Its SSR docs say initial state is server-rendered. Use only in deliberate client islands, keep simple hover/color changes in CSS, and set `MotionConfig reducedMotion="user"` if adopted. Sources: [installation](https://motion.dev/docs/react-installation), [SSR/component guidance](https://motion.dev/docs/react-motion-component), [reduced motion](https://www.motion.dev/docs/react-motion-config). |
| `@base-ui/react` | `1.8.0`, published Sep 4, 2026 — [npm](https://www.npmjs.com/package/%40base-ui/react), [release](https://base-ui.com/react/overview/releases/v1-8-0) | It is an unstyled React component library, suitable for KMT CSS rather than a component-pack visual import. Its npm peer range accepts React 17/18/19; `date-fns`, `@date-fns/tz` and `@types/react` are optional peers. Use deep component imports such as `@base-ui/react/dialog`; apply its `DirectionProvider` inside the existing Arabic/English shell when complex components need RTL behavior. It handles core ARIA, keyboard and focus mechanics but does not remove the need to test KMT CSS and labels. Sources: [accessibility](https://base-ui.com/react/overview/accessibility), [direction](https://base-ui.com/react/utils/direction-provider), [dialog](https://base-ui.com/react/components/dialog). |

The Motion quick-start's 2.3 KB statement applies to its mini HTML/SVG API, not to a future React bundle. Therefore the 25 KB compressed initial motion budget is an unmeasured project target, not a verified size claim. Do not install either package until a preview batch has a measured import boundary and a bundle report.

## Next preview batch proposal

Build six review-only previews at 390, 768 and 1440px: public home, service detail, booking, client dashboard, administration light, and administration dark. The home uses `public-content.*` hero/office/service facts and existing localized assets; service detail uses `public-services.ts`; booking uses its existing question/slot/summary model; client uses `client-content.ts` plus existing portal components; admin uses existing `DashboardShell` and operational data shapes. Each preview must retain its current route and function, demonstrate RTL/LTR where relevant, reduced motion, keyboard focus and real empty/loading/error states. It must not yet claim KMT-UI-007 through KMT-UI-013, KMT-UI-014 onward, or KMT-UI-042 complete.

## Verification and remaining scope

Validated: JSON parsing, current 58-page count, historical baseline comparison, file/source pointer existence, package manifest absence of the proposed dependencies, official source links, secret scan, and `git diff --check`.

Not run: browser rendering, visual screenshots, keyboard/touch behavior, motion performance, bundle measurement, dark-mode interaction, database/provider flows, build and broad tests. Those omissions are intentional for a documentation-only inventory and keep KMT-UI-001 through KMT-UI-006 open pending supervisor review and their broader stated evidence.
