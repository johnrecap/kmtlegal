# 44 — Admin Consultations (list + detail + availability)

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/consultations`, `/admin/consultations/[consultationId]`, `/admin/consultation-availability` — `src/app/(app-ar)/admin/consultations/*` + `src/features/admin/consultations/*`.

## Components

View tabs with counts, operational badges (overdue, secretary-review), FilterBar, action panel (assign/schedule/convert/reject/reopen with state-machine-aware actions), availability form (weekly slots).

## Issues (audit)

- [P2] Reject action has no confirm — inconsistent with other destructive/consequential actions (`consultation-action-panel.tsx:308-317`).
- [P2] Raw amber warning box on detail (`consultations/[consultationId]/page.tsx:334`).
- [P3] "جديد" badge tone=`active` (green) contradicts global NEW=pending convention; same row mixes green "new" + amber "needs review" (`consultations/page.tsx:74-79`).
- [P3] Pagination `justify-end` without clear-filters (`consultations/page.tsx:368`); view-pills custom tabs (`:291-312`).
- [P3] Physical `pr-5` on AI reasons list (`consultations/[consultationId]/page.tsx:123`).
- [P3] Detail pages have no 404 try/catch (falls to generic error boundary).

## Tasks

- [ ] T44.1 View tabs → Tabs component (T1.6) with counts; "جديد" → pending tone.
- [ ] T44.2 Pagination → shared component with clear-filters slot.
- [ ] T44.3 **Reject confirm**: checkbox + reason (optional) matching case-status pattern; state-machine actions otherwise unchanged.
- [ ] T44.4 Action panel: InlineFeedback (T1.5) for pending/success/error; localized API error mapping kept.
- [ ] T44.5 Raw amber boxes → warning-state InlineFeedback; `pr-5` → `ps-5`.
- [ ] T44.6 Detail: 404 catch → in-shell not-found; overdue/secretary-review badges on tokens.
- [ ] T44.7 Availability form: Field components; slot grid on tokens; both themes.

## Verify

- [ ] plan36/plan37 e2e suites green; reject requires confirm.
- [ ] Screenshots 375/1440 × themes.
