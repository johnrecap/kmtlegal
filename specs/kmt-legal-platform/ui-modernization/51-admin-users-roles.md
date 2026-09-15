# 51 — Admin Users + Roles

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/users`, `/admin/users/[userId]`, `/admin/roles` — `src/app/(app-ar)/admin/users/*`, `admin/roles/*` + `role-permission-form.tsx`.

## Components

Users list (FilterBar + table), user detail (account + client profile), roles master-detail permission matrix.

## Issues (audit)

- [P3] Back link rendered in body instead of shell `action` slot (`users/[userId]/page.tsx:120-124`).
- [P3] Raw enum `clientProfile.status` (`:196`).
- [P3] Title/nav mismatch: shell "المستخدمون والأدوار" vs nav "المستخدمون" (`users/page.tsx:137` vs `ui-copy.ts:69`).
- [P3] User detail has no 404 try/catch.

## Tasks

- [ ] T51.1 Users list: tokens + shared pagination; title unified to "المستخدمون".
- [ ] T51.2 Detail: back link → shell `action` slot; 404 catch → in-shell not-found; `clientProfile.status` → localized label map.
- [ ] T51.3 Roles matrix: keep master-detail + dirty tracking + 409 stale warning (excellent); retokenize matrix (grouped fieldsets, `aria-pressed` role buttons); permission cells readable in both themes.
- [ ] T51.4 Role form feedback via InlineFeedback; live region kept.

## Verify

- [ ] Role edit → save → 409 stale path renders warning (manual or existing test).
- [ ] Screenshots 375/1440 × themes.
