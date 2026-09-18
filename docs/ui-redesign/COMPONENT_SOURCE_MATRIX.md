# COMPONENT_SOURCE_MATRIX (Global Lock Register)

> Allowed statuses: `CURRENT` / `LOCKED REPLACEMENT` /
> `PENDING TECHNICAL VERIFICATION` / `BLOCKED` / `REMOVED`.
> 32 locked component decisions. Selection is owner-closed; phases obey
> this register verbatim.

| # | Component | Library | Official URL | Current Status | Current File | Planned Areas | Phase |
|---|---|---|---|---|---|---|---|
| 01 | Resizable Navbar | Aceternity UI | https://ui.aceternity.com/components/resizable-navbar | CURRENT | `src/components/ui/resizable-navbar.tsx` | Public header (desktop bar + mobile bar) | 02 |
| 02 | Navbar Menu | Aceternity UI | https://ui.aceternity.com/components/navbar-menu | CURRENT | `src/components/ui/navbar-menu.tsx` | Public header Services flyout | 02 |
| 03 | Sheet | Animate UI | https://animate-ui.com/docs/components/radix/sheet | CURRENT | `src/components/animate-ui/components/radix/sheet.tsx` | Public mobile drawer; client mobile nav + mobile filters; admin mobile nav + mobile forms/filters | 02, 07, 08, 09, 10, 11 |
| 04 | Tooltip | Animate UI | https://animate-ui.com/docs/components/radix/tooltip | CURRENT | `src/components/animate-ui/components/radix/tooltip.tsx` | Public header tips; client icon help; admin icon help + metric explanations | 02, 07, 08, 09, 10, 11 |
| 05 | Floating Dock | Aceternity UI | https://ui.aceternity.com/components/floating-dock | CURRENT | `src/components/ui/floating-dock.tsx` | Public floating actions (Consultation + WhatsApp) | 02 |
| 06 | Spotlight New | Aceternity UI | https://ui.aceternity.com/components/spotlight-new | CURRENT | `src/components/ui/spotlight-new.tsx` | Home hero | 03 |
| 07 | Text Animate | Magic UI | https://magicui.design/docs/components/text-animate | CURRENT | `src/components/ui/text-animate.tsx` | Home hero h1 | 03 |
| 08 | CountingNumber | Animate UI | (vendored; counting-number pattern) | CURRENT | `src/components/animate-ui/counting-number.tsx` | Home hero stats; admin dashboard + reports metrics | 03, 10 |
| 09 | Border Beam | Magic UI | https://magicui.design/docs/components/border-beam | CURRENT | `src/components/ui/border-beam.tsx` | Hero docket, booking shell, footer CTA | 02, 03, 04 |
| 10 | Highlighter (via KMT wrapper) | Magic UI | https://magicui.design/docs/components/highlighter | CURRENT | `src/components/ui/highlighter.tsx` via `src/components/ui/kmt-text-underline.tsx` | Hero/description emphasis, awareness statement, footer CTA title | 02, 03 |
| 11 | Marquee | Magic UI | https://magicui.design/docs/components/marquee | CURRENT | `src/components/ui/marquee.tsx` | Home trust strip | 03 |
| 12 | Glowing Effect | Aceternity UI | https://ui.aceternity.com/components/glowing-effect | CURRENT | `src/components/ui/glowing-effect.tsx` via `capability-glow-gate.tsx` | Home legal services; services index rows | 03, 05 |
| 13 | Sticky Scroll Reveal | Aceternity UI | https://ui.aceternity.com/components/sticky-scroll-reveal | CURRENT | `src/components/ui/sticky-scroll-reveal.tsx` | Home focus area | 03 |
| 14 | Timeline | Aceternity UI | https://ui.aceternity.com/components/timeline | CURRENT | `src/components/ui/timeline.tsx` via `process-steps.tsx` | Home process | 03 |
| 15 | Card Hover Effect | Aceternity UI | https://ui.aceternity.com/components/card-hover-effect | CURRENT | `src/components/ui/card-hover-effect.tsx` | Home representative matters | 03 |
| 16 | Focus Cards | Aceternity UI | https://ui.aceternity.com/components/focus-cards | CURRENT | `src/components/ui/focus-cards.tsx` | Home team showcase; team index | 03, 05 |
| 17 | Blur Fade | Magic UI | https://magicui.design/docs/components/blur-fade | CURRENT | `src/components/ui/blur-fade.tsx` | Home industries entrances; directory entrances; general public entrances | 03, 05 |
| 18 | Animated List | Magic UI | https://magicui.design/docs/components/animated-list | CURRENT | `src/components/ui/animated-list.tsx` | Booking chat log; client AI assistant log | 04, 08 |
| 19 | Placeholders And Vanish Input | Aceternity UI | https://ui.aceternity.com/components/placeholders-and-vanish-input | CURRENT | `src/components/ui/placeholders-and-vanish-input.tsx` | Booking composer; client AI assistant composer | 04, 08 |
| 20 | DataTable + DataRecordCard | Local (KEEP CURRENT) | — (local primitives) | CURRENT | `src/components/ui/data-table.tsx`, `src/components/ui/data-record-card.tsx` | Client lists; admin lists | 07, 08, 09, 10 |
| 21 | RippleLink | Animate UI | (vendored ripple pattern) | CURRENT | `src/components/animate-ui/ripple-link.tsx` | Locked header flyout CTA composition | 02 |
| 22 | Animated Theme Toggler | Magic UI | https://magicui.design/docs/components/animated-theme-toggler | PENDING TECHNICAL VERIFICATION | Not installed | Public + client + admin theme toggles (replaces `ThemeToggle` internals only if `next-themes` controlled mode integrates) | 02 |
| 23 | Scroll Progress | Magic UI | https://magicui.design/docs/components/scroll-progress | LOCKED REPLACEMENT | Not installed (Privacy + Terms do not render the local `ReadingProgress` today) | ADD to Privacy + Terms reading views | 06 |
| 24 | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion | LOCKED REPLACEMENT | Not installed | Service/team detail mobile sections; contact branches; policy mobile TOC; setup summary; install groups; client case detail/payments/profile mobile; admin collapsible sections + audit technical details + weekday groups + settings groups + roles groups + AI draft area | 05, 06, 08, 09, 11 |
| 25 | Stateful Button | Aceternity UI | https://ui.aceternity.com/components/stateful-button | LOCKED REPLACEMENT | Not installed | Contact submit; setup submit; payment-return async action; login submit; install async actions; client profile save; admin async buttons + webhook replay | 06, 08, 09, 11 |
| 26 | Sidebar | Aceternity UI | https://ui.aceternity.com/components/sidebar | LOCKED REPLACEMENT | Not installed | Client desktop navigation; admin desktop sidebar | 07, 09 |
| 27 | Tabs | Animate UI | https://animate-ui.com/docs/components/radix/tabs | LOCKED REPLACEMENT | Vendored but unused (`components/radix/tabs.tsx` + `primitives/radix/tabs.tsx`, zero page importers) | Admin case-detail tabs; consultations outcome nav; finance section tabs; content type nav | 09, 10, 11 |
| 28 | Dialog | Animate UI | https://animate-ui.com/docs/components/radix/dialog | LOCKED REPLACEMENT | Not installed | Admin destructive confirmations; calendar create/edit; content preview | 09, 11 |
| 29 | Menu | Animate UI | https://animate-ui.com/docs/components/base/menu | LOCKED REPLACEMENT | Not installed | Admin row actions; contact-message actions; users row actions | 09, 10, 11 |
| 30 | Popover | Animate UI | https://animate-ui.com/docs/components/base/popover | LOCKED REPLACEMENT | Not installed | Admin advanced desktop filters; notification bell (replaces native `details` popover) | 09, 10 |
| 31 | File Upload | Aceternity UI | https://ui.aceternity.com/components/file-upload | LOCKED REPLACEMENT | Not installed | Client files upload; admin documents upload | 08, 09, 11 |
| 32 | Pagination | shadcn/ui | https://ui.shadcn.com/docs/components/pagination | LOCKED REPLACEMENT | Local `ui/pagination.tsx` is gallery-only; prod uses hand-rolled links | Client + admin list pagination (replaces hand-rolled prev/next links) | 07, 09, 10 |

## Verification Notes (Planning-Run Source Checks)

- Rows 01–21: installed + rendered in production per
  `docs/KMT_COMPLETE_UI_INVENTORY.md` Step 6 (import-grep verified).
- Row 22: official Magic UI docs confirm a free Animated Theme Toggler with
  controlled `theme` + `onThemeChange` props for `next-themes` pairing; the
  repo uses a wrapped `next-themes` `ThemeProvider` with per-area storage
  keys, so in-repo integration is a Phase 02 verification task. On failure:
  `BLOCKED — OWNER DECISION REQUIRED`, no substitute toggle.
- Rows 23–32: official docs pages confirmed live and free during this
  planning run (Magic UI Scroll Progress; Animate UI Accordion/Tabs/Dialog/
  Menu/Popover; Aceternity Sidebar/Stateful Button/File Upload; shadcn
  Pagination canonical URL as locked).
- Row 27: local Animate-UI Tabs primitive files exist but render nowhere;
  Phase 09 verifies reuse of the vendored files vs fresh vendor install,
  then wires one shared Tabs primitive for all admin pages.
- Row 23 is an ADD to Privacy + Terms. The Article Detail local
  `ReadingProgress` belongs to the deferred Articles area and follows the
  Phase 01 ruling; it is not replaced by this row.
- Row 25 covers genuine async mutations only. The `/client/payments`
  checkout/follow/case/receipt navigation links are KEEP CURRENT semantic
  links (Phase 08) — never Stateful Buttons.
- Animate UI base Menu/Popover build on Base UI; repo has
  `@base-ui/react ^1.8.0`. Animate radix builds on `radix-ui` + `motion`;
  repo has `radix-ui ^1.6.7` and `motion ^13.3.0`. Aceternity builds need
  `motion` + Tailwind; present. Magic builds need `motion` (+ `next-themes`
  for the toggler); present. No new animation library is introduced.
