# Batch 9: document case retention and confirmed deletion

## Scope

- Case-tab uploads retain the already-authorized current case when it falls outside the 100-case option list.
- `PATCH /api/admin/documents/:id` no longer accepts `DELETED`; confirmed soft deletion remains only at `POST /api/admin/documents/:id/delete`.
- Document update and delete writes require `deletedAt: null` atomically. A losing concurrent write returns 404 and creates no success audit event.

## Evidence

- `npm run typecheck` passed.
- Focused Vitest: 2 files, 10 tests passed.
- Isolated PostgreSQL 18 lane: `127.0.0.1:55440`, database/user `kmt_batch9`, workspace-only data and private uploads paths. Migrations and seed passed.
- Focused Chromium acceptance passed for retained case upload (201, correct `caseId`, null owner, refreshed case tab) and confirmed deletion lifecycle (PATCH DELETED 400, unconfirmed delete 400, ordinary PATCH 200, concurrent deletes 200/404, download 404, bytes retained).

## Boundaries

- No migration, role, owner-client policy, case-history policy, byte deletion, production service, or push/deploy changed.
- A prior general-library upload fixture returned 400 because its test selected a case absent from that capped form; this was a harness failure and is retained in Playwright output. The library form was not changed.
- Full role matrix, update-versus-delete ordering, visual confirmation/cancel screenshots, full suite, lint/build, and 58-page comparison remain pending supervisor-directed completion.
