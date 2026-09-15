# 43 — Admin Cases (list + detail + new)

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/cases`, `/admin/cases/[caseId]`, `/admin/cases/new` — `src/app/(app-ar)/admin/cases/*` + `src/features/admin/cases/*`.

## Components

FilterBar (status/priority/type/lawyer/sort) + table/mobile cards, URL-driven tabs on detail (overview/sessions/appointments/tasks/documents), side rail (status change with confirm + reason, session form), manual creation form, optimistic locking (409), idempotency token.

## Issues (audit)

- [P3] Custom link-tabs duplicated implementation (`cases/[caseId]/page.tsx:131-149`) — replace with Tabs (T1.6).
- [P3] Eyebrow inconsistency: list "لوحة المكتب" vs detail "إدارة القضايا" (`cases/page.tsx:207` vs `[caseId]/page.tsx:523`).
- [P3] `formatBytes` local duplicate (`cases/[caseId]/page.tsx:112-120`).
- [P3] Status-change confirm pattern is good — keep as reference standard.

## Tasks

- [ ] T43.1 List: tokens + shared pagination; scope explainer StateBlock kept.
- [ ] T43.2 Detail: Tabs component (T1.6) with counts; permission-gated tabs + `PermissionBlocked` kept; side rail forms on Field/Button/InlineFeedback.
- [ ] T43.3 Eyebrow unified "إدارة القضايا" list + detail.
- [ ] T43.4 Status change: keep confirm + reason + 409 stale warning; retokenize feedback.
- [ ] T43.5 `/cases/new`: manual creation form on new components; idempotency behavior unchanged; section grouping for long form.
- [ ] T43.6 Delete local `formatBytes` (T1.12); sessions timeline on tokens.

## Verify

- [ ] Tab navigation via URL works (deep-link); status change e2e green (existing plan35 coverage).
- [ ] Screenshots 375/1440 × themes.
