# 46 — Admin Tasks

> Phase 4 · Depends on `00`, `01`, `40`.

## Route

`/admin/tasks` — `src/app/(app-ar)/admin/tasks/page.tsx`.

## Components

FilterBar (assignee/status/priority/due) + DataTable/mobile cards + pagination with clear-filters, task forms (create/complete) via InlineFeedback.

## Issues (audit)

- [P3] Standard pattern page — main debt is component-library adoption, nothing page-specific beyond convention alignment.

## Tasks

- [ ] T46.1 Migrate to retokenized FilterBar/DataTable/mobile cards/Badge; shared pagination (already has clear-filters — keep).
- [ ] T46.2 Task status transitions: subtle motion on complete (check draw 200ms, reduced-motion: static); due-soon/overdue badges on warning/danger tokens.
- [ ] T46.3 Forms on Field/Button + InlineFeedback; both themes verified.

## Verify

- [ ] Screenshots 375/1440 × themes; filters + pagination round-trip.
