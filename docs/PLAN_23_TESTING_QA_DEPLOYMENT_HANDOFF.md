# PLAN-23 Testing, QA, Deployment & Handoff

Date: 2026-06-24

## Scope

PLAN-23 closes the MVP with repeatable quality gates, browser smoke coverage, deployment handoff artifacts, and a clear remaining-runtime checklist. It does not add product features.

## Implemented

- Added non-DB Playwright smoke coverage in `tests/e2e/mvp-smoke.spec.ts`.
- Added local QA runner in `scripts/plan23-local-qa.mjs`.
- Added npm scripts:
  - `npm run qa:local`
  - `npm run qa:local:e2e`
  - `npm run qa:local:release`
- Added production handoff examples:
  - `deploy/env.production.example`
  - `deploy/nginx/kmt-legal.conf.example`
  - `deploy/systemd/kmt-legal.service.example`
- Added root onboarding guide: `PROJECT_GUIDE.md`.
- Added VPS runbook: `docs/VPS_DEPLOYMENT_RUNBOOK.md`.
- Added release QA checklist: `docs/RELEASE_QA_CHECKLIST.md`.
- Added security audit findings: `docs/SECURITY_AUDIT_FINDINGS.md`.

## Local Verification Covered

The local gates cover:

- Prisma schema validation.
- TypeScript.
- ESLint.
- Vitest server/UI contract tests.
- Next production build.
- Dependency audit was remediated and now passes; see `docs/SECURITY_AUDIT_FINDINGS.md`.
- Non-DB Playwright browser smoke:
  - public/static routes render;
  - RTL shell exists;
  - root response has security headers;
  - anonymous admin access redirects to login;
  - cross-origin API mutation is rejected before handler execution.

## Blocked Runtime Verification

Docker CLI is not installed in this workspace, so PostgreSQL could not be started from `docker-compose.yml`.

Still required in an environment with PostgreSQL:

- `npm run db:migrate:dev` or production `npm run db:migrate`.
- `npm run db:seed`.
- Seed idempotency by running seed twice.
- Login -> staff 2FA -> `/admin`.
- Booking -> admin review -> convert to case -> client portal.
- Client/admin upload -> authorized download.
- `npm run security:audit` and `npm run security:audit:all` with npm registry access.

## Release Blockers

- `npm run qa:db`, `npm run qa:release`, and live VPS smoke still require a real PostgreSQL/VPS target and archived evidence.
- Dependency audit is no longer a current blocker, but future dependency updates must remain controlled and must not use `npm audit fix --force` blindly.

## Definition Of Done

PLAN-23 is complete for repository handoff when:

- local non-DB quality gates pass;
- browser smoke exists and passes;
- deployment docs and examples are present;
- blocked DB/staging gates are explicit and runnable by the next operator;
- implementation status is updated.

It is not production-release-clear until DB-backed QA, release QA, and live VPS smoke are complete.
