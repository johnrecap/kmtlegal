# 17 — Testing & QA Audit

Inventory (counts from repo scan): ~96 vitest files (58 server, 32 UI, 2
lib, 4 integration-postgres) + 29 Playwright specs. Frameworks: vitest
4.1.9 + jsdom + Testing Library; Playwright 1.51.1 (chromium).

## Coverage table

| Area | Present | Covers | Does NOT cover | Confidence |
|---|---|---|---|---|
| Auth/sessions/guards | server tests | login, scoping, governance | live 2FA (disabled), spray attacks | MEDIUM |
| Booking/availability/conflicts | server + e2e batch4 | slots, validation, conflict TX, duplicate guard | live provider round-trip | MEDIUM |
| Payments/webhooks | server + e2e batch6 | HMAC verify, idempotency, replay, mismatch codes | real Paymob charge, settlement | MEDIUM |
| Files/storage/malware | contract + e2e batch3/9 | 413/415/404, soft-delete, ClamAV unit | live ClamAV daemon, 5MB UX | MEDIUM |
| Chat/conversation | integration batch10 + e2e | thread lifecycle, recovery | realtime, attachments (absent) | MEDIUM |
| Admin ops/outcomes | e2e plan35/36/37 + server | password ceremony, outcomes, overdue views | bulk ops (absent) | MEDIUM |
| Content lifecycle | integration batch14 + e2e | CRUD, publish gates, anonymization | delete (absent), scheduler (absent) | MEDIUM |
| Public UI/smoke | ui tests + smoke specs | pages, nav indicator, footer, theme, lab | contrast ratios, headings order | MEDIUM |
| Security/sensitive forms | e2e batch2 | IDOR samples, download auth | full matrix, headers/CSP | LOW |
| DB-backed integration | 4 files, PG-gated | conversation, governance, office, content | require live PG (skipped w/o DB) | LOW here |
| Visual/RTL | luxury-visual, hero-hydration, localization | EN/AR snapshots, hydration | cross-browser (chromium only) | MEDIUM |
| Accessibility | none dedicated | — | axe/pa11y, keyboard map, contrast | LOW (gap) |
| Load/perf | none | — | k6/Lighthouse CI | LOW (gap) |

## Phase 13 results (used as evidence, not repeated)

Typecheck GREEN, lint GREEN, unit 616/0/53 (91 files), smoke 42/42, build
40/40, DB suites skipped (P1000 no live PG), public census all-200.

## Insufficient coverage (workflows)

1. Full UI↔API permission matrix (sampled only) — P2.
2. Webhook↔checkout end-to-end against provider sandbox — P1 (pre-launch).
3. ClamAV-on upload path in staging — P1 (pre-launch).
4. Installer fresh-bootstrap on clean VM — P2.
5. Backup/restore drill (`pg_restore --list` only verifies format) — P2.
6. Accessibility + visual regression CI — P3.
7. Analytics pipeline (send → row) — P4.
