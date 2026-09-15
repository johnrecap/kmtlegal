# 52 — Admin Settings + Audit Log

> Phase 4 · Depends on `00`, `01`, `40`.

## Routes

`/admin/settings`, `/admin/audit-log` — `src/app/(app-ar)/admin/settings/page.tsx`, `admin/audit-log/page.tsx`.

## Components

Settings (office profile, localization, security options), audit log (FilterBar + table + pagination with clear-filters).

## Issues (audit)

- [P2] **Audit-log filters expect raw UUIDs** — six text inputs for client/case/lawyer/appointment/document/payment IDs (`audit-log/page.tsx:235-240`).

## Tasks

- [ ] T52.1 Audit-log: replace ID inputs with searchable entity pickers (client/lawyer autocomplete by name; case by file number) — falls back to raw-ID input when lookup APIs unavailable; filter chips show chosen entity.
- [ ] T52.2 Log table: token skin; timestamps `ar-EG` + Cairo kept; actor/action/object columns with `bdi` isolation for IDs; diff/summary expandable row on tokens.
- [ ] T52.3 Settings: sectioned cards on tokens; Field/Button components; secret fields write-only; save feedback via InlineFeedback.
- [ ] T52.4 Both themes verified.

## Verify

- [ ] Filter by client name (not UUID) produces correct log subset (manual with fixture data).
- [ ] Screenshots 375/1440 × themes.
