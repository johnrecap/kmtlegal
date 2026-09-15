# 33 — Portal Court Dates

> Phase 3 · Depends on `00`, `01`, `30`.

## Route

`/client/court-dates` — `src/app/(client)/client/court-dates/page.tsx`.

## Components

DataTable + mobile cards: appointment type, linked case, date/time, mode, lawyer, status; "pending office review" pseudo-status for unassigned consultations.

## Issues (audit)

- [P2] No loading skeleton; badges depend on old cascade (neutral tone unreadable on dark).
- [P3] None page-specific beyond shell/library items.

## Tasks

- [ ] T33.1 Migrate to retokenized DataTable/DataRecordCard + Badge; both themes verified.
- [ ] T33.2 Date/time cells: keep `ar-EG`/`en-GB` formatting + Cairo timezone; ensure numerals `dir="ltr"` isolated in AR.
- [ ] T33.3 Upcoming-vs-past grouping with sticky month separators (token motion, reduced-motion: static); "pending office review" chip on warning tokens.
- [ ] T33.4 Empty state via State component with booking CTA.

## Verify

- [ ] Screenshots 375/1440 × EN/AR × themes; grouping correct across month boundary fixture.
