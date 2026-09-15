# 47 — Admin Calendar

> Phase 4 · Depends on `00`, `01`, `40`.

## Route

`/admin/calendar` — `src/app/(app-ar)/admin/calendar/page.tsx`.

## Components

Date navigation, appointments/sessions listing per day, filters, pagination (own style).

## Issues (audit)

- [P3] Third pagination style: plain text links + "إعادة الضبط" copy diverges from shared pattern (`calendar/page.tsx:180-182,266-280`).

## Tasks

- [ ] T47.1 Shared Pagination component (T1.7) with standard "مسح الفلاتر" copy.
- [ ] T47.2 Calendar layout on tokens: day cards with status badges, current-day highlight (gold surface), month grid on desktop / list on mobile.
- [ ] T47.3 Date navigation prev/next with token motion + RTL-correct arrow mirroring.
- [ ] T47.4 Both themes verified; appointment type badges consistent with portal court-dates vocabulary.

## Verify

- [ ] Screenshots 375/1440 × themes; pagination round-trip with filters.
