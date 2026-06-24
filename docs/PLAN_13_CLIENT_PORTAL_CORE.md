# PLAN-13 Client Portal Core

Status: Done

## Scope Delivered

- Replaced placeholder portal dashboard with real client-owned summary data.
- Added `/portal/cases` and `/portal/cases/[caseId]`.
- Added server-side ownership helpers that require `client.read.self` plus a linked `clientId`.
- Case detail intentionally selects client-safe fields and does not expose internal notes.
- Added tests for client portal access and ownership filters.

## Files

- `src/server/portal/client-portal-service.ts`
- `src/app/portal/page.tsx`
- `src/app/portal/cases/page.tsx`
- `src/app/portal/cases/[caseId]/page.tsx`
- `tests/server/portal-access.test.ts`

## Remaining Runtime Gate

DB-backed browser smoke is pending until PostgreSQL migrate/seed runs successfully.
