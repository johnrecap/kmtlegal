# 49 — Admin Documents

> Phase 4 · Depends on `00`, `01`, `40`.

## Route

`/admin/documents` — `src/app/(app-ar)/admin/documents/page.tsx` + task-document forms.

## Components

Documents table + separate expandable card list containing actions (upload/change-category/delete forms).

## Issues (audit)

- [P2] **Desktop renders the list twice** — read-only table + expandable cards with the actions; double scroll, actions divorced from rows (`documents/page.tsx:269-343`).
- [P2] Empty state nests StateBlock inside DataTable's bordered empty box — double border (`:334` + `data-table.tsx:30-36`).
- [P3] `formatBytes` local duplicate (`:75-83`).

## Tasks

- [ ] T49.1 **Single list**: DataTable with row actions — actions in an overflow menu or inline buttons (upload/change/delete); expandable card list removed; mobile keeps card pattern with actions.
- [ ] T49.2 Delete form: keep reason + confirm (reference standard); move into Dialog (T1.8) instead of expanded card.
- [ ] T49.3 Empty state: plain slot (no nested borders) with upload CTA.
- [ ] T49.4 Delete local `formatBytes` (T1.12); file names `bdi`; status badges on tokens.

## Verify

- [ ] All document actions reachable from the table row (manual matrix: upload/change/delete on desktop + mobile).
- [ ] Screenshots 375/1440 × themes.
