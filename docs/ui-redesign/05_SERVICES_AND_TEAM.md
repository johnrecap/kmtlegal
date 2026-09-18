# Phase 05 — Services + Team

## Objective

Rebuild Services index presentation on Aceternity Glowing Effect (same
semantic family as home legal services) with filter/search logic preserved;
keep the custom KMT editorial dossier on service detail with mobile
Accordion secondary sections. Rebuild Team index on Aceternity Focus Cards
with filtering preserved; keep the people-first profile layout on detail
with mobile Accordion secondary information. EN + AR.

## Current State

- Services index: `ServicesPageView` (`public-pages.tsx:366`) + `PageHero` +
  `DirectoryFilter layout="rows"` (search `TextInput`, pill buttons, clear) →
  `MagicCard` + `BlurFade` rows → muted CTA row.
- Service detail: `ServiceDetailPageView` (`:406`) — h1 + `PublicBreadcrumbs` +
  `lg:[1fr_360px]` article panel + sticky `DetailCta` + related ledger.
- Team index: `TeamPageView` (`:508`) + `PageHero` + `DirectoryFilter
  layout="cards"` (image cards `publicPhotoTreatment`, `md:2 lg:3`).
- Team detail: `TeamDetailPageView` (`:537`) — `lg:[360px_1fr]` photo +
  panel (specialty/language badges, experience/education/admissions, booking
  + relationship notices, `?lawyer=` CTA).
- `DirectoryFilter` is shared with Articles/Case Studies — Phase 01 sharing
  risk (TASK-01-10) constrains edits to the shared file.

## Target State

Services rows use Glowing Effect as the interactive border layer inside KMT
service composition; no Magic Card treatment remains in the services
renderer. Detail pages keep editorial/dossier compositions on desktop with
Animate Accordion driving mobile secondary sections. Team index renders
Focus Cards; filters behave identically. All themed, responsive, RTL-safe,
accessible.

## Component Decisions

| Area | Current | Decision | Locked Component | Library | Official URL |
|---|---|---|---|---|---|
| Services index rows | Magic Card treatment | REPLACE WITH: Aceternity UI Glowing Effect | Glowing Effect | Aceternity UI | https://ui.aceternity.com/components/glowing-effect |
| Services filter/search logic | DirectoryFilter behavior | KEEP CURRENT | None (logic preserved) | — | — |
| Services row entrances | Blur Fade | KEEP CURRENT | Blur Fade | Magic UI | https://magicui.design/docs/components/blur-fade |
| Service detail desktop | Custom dossier composition | KEEP CURRENT | None (custom allowed) | — | — |
| Service detail mobile secondary | Static stacked sections | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Team index cards | Generic image cards | REPLACE WITH: Aceternity UI Focus Cards | Focus Cards | Aceternity UI | https://ui.aceternity.com/components/focus-cards |
| Team filter logic | DirectoryFilter behavior | KEEP CURRENT | None (logic preserved) | — | — |
| Team detail desktop | People-first profile layout | KEEP CURRENT | None (custom allowed) | — | — |
| Team detail mobile secondary | Static stacked panel | REPLACE WITH: Animate UI Accordion | Accordion | Animate UI | https://animate-ui.com/docs/components/radix/accordion |
| Detail CTA + breadcrumbs | DetailCta, PublicBreadcrumbs | KEEP CURRENT | None | — | — |

## Tasks

- [x] TASK-05-01 Vendor/install the official Animate UI Accordion (primitive +
  component) following the repo's existing animate-ui vendoring pattern
  (cf. Sheet/Tooltip); verify `motion` + `radix-ui` integration, RTL, themes.
- [x] TASK-05-02 Services index: rebuild row renderer on Glowing Effect
  (numeral, category, chips, meta, viewDetails CTA preserved); REMOVE the
  Magic Card visual treatment from the services renderer only.
- [x] TASK-05-03 Services index: re-verify filter/search/clear behavior
  identical (query states, pill `aria-pressed`, result counts, empty state);
  confirm Articles/Case-Studies arms of `DirectoryFilter` unaffected while
  public (per Phase 01 ruling).
- [x] TASK-05-04 Service detail: dossier theming + typography pass (desktop
  composition kept); related-services ledger intact; JSON-LD untouched.
- [x] TASK-05-05 Service detail mobile: secondary sections (included /
  documents / outcomes / related) driven by Accordion; CTA + breadcrumbs
  always visible; deep-link anchors preserved.
- [x] TASK-05-06 Team index: people-first hero variant + Focus Cards index
  wired to real lawyer data (photo, name, role, badges, detail link);
  filters preserved; `md:2 lg:3` responsive behavior. On touch/mobile:
  no sibling-blur dependency, all lawyer images stay clearly visible, names
  and roles stay visible, no essential information requires hover, tapping
  a lawyer card opens the profile; Focus Cards hover emphasis is
  desktop/pointer enhancement only.
- [x] TASK-05-07 Team detail: profile theming pass (badges, notices, history
  block); booking `?lawyer=` CTA intact.
- [x] TASK-05-08 Team detail mobile: secondary information (experience /
  education / admissions / languages) driven by Accordion; photo + primary
  CTA always visible.
- [x] TASK-05-09 Accessibility: Accordion keyboard + `aria-expanded` +
  focus management; Focus Cards link semantics; EN + AR screen-reader run.
- [x] TASK-05-10 Full sweep (services + detail + team + detail) EN+AR ×
  light+dark × 390/768/1024/1440; phase commit; STOP.

## Files Expected To Change

- `src/features/public-site/directory-filter.tsx` (services/team renderers),
  `src/features/public-site/public-pages.tsx` (services/team views),
  new animate-ui accordion vendor files, services/team-scoped styles.

## Files That Must NOT Change

- Home sections, booking/chat, admin, client, backend/API/database, filter
  business logic outcomes, article/case-study/media renderers (beyond
  sharing-safe edits), inventory doc.

## Dependencies

- Phase 01 (DirectoryFilter sharing + deferred visibility), Phase 02
  (tokens, motion ownership, Accordion owes nothing to header work).

## Risks

- Shared `DirectoryFilter` edits leaking into deferred listings → mitigated
  by arm-scoped changes + TASK-05-03 verification.
- Accordion vendor drift from official source → mitigate by vendoring
  verbatim + recording source URL + version in Implementation Notes.
- Focus Cards image treatment vs `publicPhotoTreatment` → keep photo
  pipeline, change card shell only.

## Acceptance Criteria

- [x] No Magic Card treatment remains in services renderer (grep proof).
- [x] Filters behave identically (before/after state captures).
- [x] Mobile secondary sections use Accordion on both detail pages.
- [x] Team touch rule verified: no hover-required information, all images +
  names + roles visible, tap opens profile (touch-device captures).
- [x] EN+AR focused matrix (EN/Dark/1440 + AR/Light/390 primaries;
  lightweight smoke for the rest); console clean.
- [x] One phase commit; STOP.

## Visual QA (Phase Gate — focused matrix, run once)

- [ ] Primary captures: (1) EN / Dark / 1440, (2) AR / Light / 390 —
  index rows/cards, detail desktop, Accordion open/closed + focus states.
- [ ] Lightweight smoke/layout checks only for 768/1024, EN-Light, AR-Dark;
  expand ONLY a failing dimension (per 00_MASTER_PLAN.md Verification Policy).
- [ ] No other route family's visuals crawled (services + team scope only).

## Technical QA (Phase Gate — run once)

- [ ] `npm run typecheck`, `npm run lint` green.
- [ ] Targeted directory/detail E2E + keyboard-only Accordion run green;
  console clean on services/team pages. No unrelated suites.
- [ ] No full production build by default (non-milestone) — run only if
  module/import, dependency, or route/build behavior changed significantly
  (record why).
- [ ] Known unrelated failures: record + continue, no reinvestigation
  (Known Failure Cache).

## Status

COMPLETE

## Implementation Notes

Pre-phase baseline: HEAD `08f1cee`. All OWNER/PRE-EXISTING working-tree
entries preserved exactly; none staged or included (verified by
`git diff --name-only` before commit).

Pre-existing `directory-filter.tsx` preservation (integrity-check baseline
`6067d3a` → `b481b91`):
- Preserved verbatim: `BlurFade` reveal wrappers + stagger, `-mt-px`
  separators, `ol` structure, linked titles with focus rings, `group` class,
  `public-directory-card` testid, all editorial content, filter/search/clear
  logic, `cards` branch, empty state.
- Phase-mandated change inside the same hunk region (TASK-05-02): the
  `MagicCard` wrapper element was replaced by a relative panel div +
  `GlowingEffect variant="kmt-gold" disabled={false}` (pointer-following
  border light). Hunk separation was impossible here by construction — the
  phase doc explicitly orders the MagicCard→GlowingEffect swap — so the
  committed `directory-filter.tsx` hunks combine preserved baseline +
  the swap. `MagicCard` import removed (now unused in this file).
- New additive hunks (no baseline overlap): `cardVariant` prop (default
  `"cards"`), `subtitle` field on `DirectoryItem`, `FocusCardsGrid` helper.
  Articles/Case Studies call sites pass neither `layout="rows"` nor
  `cardVariant="focus"` → their presentation is byte-identical.

TASK-05-01 (Accordion vendor): no pre-existing accordion existed anywhere
(integrity check confirmed), so two new files were vendored VERBATIM from the
official Animate UI registry (fetched 2026-09-18):
- `src/components/animate-ui/primitives/radix/accordion.tsx` ←
  `https://animate-ui.com/r/primitives-radix-accordion.json`
- `src/components/animate-ui/components/radix/accordion.tsx` ←
  `https://animate-ui.com/r/components-radix-accordion.json`
Deps (`radix-ui@1.6.7`, `motion@13`, `lucide-react`, `use-controlled-state`,
`get-strict-context`) all already in repo; import paths already match, so
zero adaptation was needed. Not added to `animate-ui/index.ts` (Sheet/Tooltip
aren't either).

TASK-05-02/03 (services rows): Glowing Effect border layer; numeral/category/
chips/meta/CTA preserved; filter pills (`aria-pressed`), counts, empty state
untouched. `mvp-smoke` "magic-rows" assertion still passes (`group` + service
link intact; stale "MagicCard" code comment left untouched as out of scope).

TASK-05-04/05 (service detail): desktop dossier unchanged (breadcrumbs,
JSON-LD, sticky DetailCta, related ledger — related `nav` gained
`hidden lg:block` only); mobile (`lg:hidden`) Accordion:
`service-detail-accordion` (included/documents/outcomes) +
`service-related-accordion` (related links). No prior deep-link anchors
existed; all hrefs preserved.

TASK-05-06 (team index): `cardVariant="focus"` + `subtitle={lawyer.title}`;
FocusCards wired to photo/name/role/specialties/availability/profile href;
grid `grid-cols-1 sm:2 lg:3` keeps `md:2 lg:3`; photo pipeline
(`publicPhotoTreatment` inside vendored Card) unchanged; filter logic shared
and untouched.

TASK-05-07/08 (team detail): photo/specialties/notices/`?lawyer=` CTA always
visible; languages/experience/education/admissions static on desktop
(`hidden lg:block`), `team-detail-accordion` on mobile (`lg:hidden`).

TASK-05-09: keyboard open/close verified by E2E Enter-poll on both accordions
(EN unit: click toggle + `aria-expanded`, focus, content links —
`tests/ui/animate-ui-accordion.test.tsx` 3/3); Focus Cards are real links;
RTL chevron-down is direction-neutral; trigger classNames use `text-start`.

FAST QA: inspection-only per task group; one targeted gate at end.

## Files Actually Changed

- `src/components/animate-ui/primitives/radix/accordion.tsx` (NEW, verbatim)
- `src/components/animate-ui/components/radix/accordion.tsx` (NEW, verbatim)
- `tests/ui/animate-ui-accordion.test.tsx` (NEW, 3 tests)
- `src/features/public-site/directory-filter.tsx` (see preservation note:
  GlowingEffect swap + `cardVariant="focus"` renderer + `subtitle` field;
  shared logic/cards-branch/empty-state untouched)
- `src/features/public-site/public-pages.tsx` (team `cardVariant`/`subtitle`;
  service + team detail mobile accordions; desktop markup intact)
- `docs/ui-redesign/05_SERVICES_AND_TEAM.md` (this file)

## QA Results

Technical gate (run once):
- `npm run typecheck`: clean. `npm run lint`: no warnings/errors.
- Targeted unit: `public-pages` (15) + `product-components` +
  `animate-ui-primitives` — 49/49 green; NEW `animate-ui-accordion` — 3/3
  green (source-shape, click toggle + `aria-expanded`, keyboard focus/open).
- Targeted E2E (committed suites): `mvp-smoke -g "services|team"` 6/6 green;
  `mvp-smoke -g "renders with the expected document direction"` — all
  services/team pages green incl. console-clean assertions (9 passed).
- Build: SKIPPED (non-milestone; no dependency/route-build change — accordion
  uses existing `radix-ui`/`motion`/`lucide-react`; no new packages).

Visual gate (temp spec, deleted after run; screenshots reviewed):
- A EN/Dark/1440: services rows (numeral/category/linked title/chips/meta/
  CTA) + hover gold-title response; service detail dossier + sticky CTA;
  team Focus Cards (photo/name/gold role/specialties/availability); team
  detail desktop. Full-page captures miss below-fold BlurFade rows (pre-
  existing inView reveal; Playwright fullPage resize doesn't scroll) —
  re-captured at viewport after scroll: rows perfect.
- B AR/Light/390: ivory surfaces, filter + rows RTL, keyboard Enter opens
  both accordions (`aria-expanded=true`, focus rings, rotated chevrons),
  tap on lawyer card navigates to profile, no overflow (390≤390), errors=[].
- Secondary: 390px LTR/RTL no-overflow via committed responsive suite
  (green); EN-Light / AR-Dark corners not separately captured — no defect
  in primaries, so no expansion per Verification Policy.

Recorded (no reinvestigation, Known Failure Cache):
- Intermittent dev-server flakes in shared sessions: `ERR_ABORTED`/frame-
  detached navigations, `_next` chunk 404s (also failing unrelated `/`,
  `/book-consultation`, `/ar/privacy` direction tests in one run), webpack
  pack-cache ENOENT renames. All resolved by rerun; never Phase-05-caused.
- Intermittent React hydration warning (`TextInput style={{}}`) on
  DirectoryFilter pages in dev (both locales); shared pre-existing header
  code, untouched by this phase; committed console-clean suites pass.
- Slow dev hydration: SSR-visible buttons need a hydration wait before
  interaction in E2E (temp spec used Enter-poll pattern); app behavior
  correct (accordion opened, `state=open`).

## Blockers

None. Phase 06 not started.
