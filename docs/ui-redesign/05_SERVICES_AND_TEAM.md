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

- [ ] TASK-05-01 Vendor/install the official Animate UI Accordion (primitive +
  component) following the repo's existing animate-ui vendoring pattern
  (cf. Sheet/Tooltip); verify `motion` + `radix-ui` integration, RTL, themes.
- [ ] TASK-05-02 Services index: rebuild row renderer on Glowing Effect
  (numeral, category, chips, meta, viewDetails CTA preserved); REMOVE the
  Magic Card visual treatment from the services renderer only.
- [ ] TASK-05-03 Services index: re-verify filter/search/clear behavior
  identical (query states, pill `aria-pressed`, result counts, empty state);
  confirm Articles/Case-Studies arms of `DirectoryFilter` unaffected while
  public (per Phase 01 ruling).
- [ ] TASK-05-04 Service detail: dossier theming + typography pass (desktop
  composition kept); related-services ledger intact; JSON-LD untouched.
- [ ] TASK-05-05 Service detail mobile: secondary sections (included /
  documents / outcomes / related) driven by Accordion; CTA + breadcrumbs
  always visible; deep-link anchors preserved.
- [ ] TASK-05-06 Team index: people-first hero variant + Focus Cards index
  wired to real lawyer data (photo, name, role, badges, detail link);
  filters preserved; `md:2 lg:3` responsive behavior. On touch/mobile:
  no sibling-blur dependency, all lawyer images stay clearly visible, names
  and roles stay visible, no essential information requires hover, tapping
  a lawyer card opens the profile; Focus Cards hover emphasis is
  desktop/pointer enhancement only.
- [ ] TASK-05-07 Team detail: profile theming pass (badges, notices, history
  block); booking `?lawyer=` CTA intact.
- [ ] TASK-05-08 Team detail mobile: secondary information (experience /
  education / admissions / languages) driven by Accordion; photo + primary
  CTA always visible.
- [ ] TASK-05-09 Accessibility: Accordion keyboard + `aria-expanded` +
  focus management; Focus Cards link semantics; EN + AR screen-reader run.
- [ ] TASK-05-10 Full sweep (services + detail + team + detail) EN+AR ×
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

- [ ] No Magic Card treatment remains in services renderer (grep proof).
- [ ] Filters behave identically (before/after state captures).
- [ ] Mobile secondary sections use Accordion on both detail pages.
- [ ] Team touch rule verified: no hover-required information, all images +
  names + roles visible, tap opens profile (touch-device captures).
- [ ] EN+AR focused matrix (EN/Dark/1440 + AR/Light/390 primaries;
  lightweight smoke for the rest); console clean.
- [ ] One phase commit; STOP.

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

NOT STARTED

## Implementation Notes

Leave blank.

## Files Actually Changed

Leave blank.

## QA Results

Leave blank.

## Blockers

Leave blank.
