# PLAN-36 Implementation and Acceptance Quickstart

**Feature**: Consultation Outcome Lifecycle

**Evidence rule**: Local, DB-backed, browser, staging, and live checks are recorded separately. A skipped or unavailable check is not PASS. PLAN-35 open DB/live evidence remains unchanged.

## 1. Preconditions (G36-0)

- Active feature path is `specs/kmt-legal-platform/plan-36-consultation-outcome-lifecycle`.
- `.specify/memory/constitution.md` remains valid.
- Requirements and delivery checklists have zero incomplete items.
- `analyze.md` has no unresolved CRITICAL/HIGH and no unaccepted MEDIUM finding.
- Worktree changes outside PLAN-36 are identified and preserved; `.playwright-mcp/` is not modified.
- No real credential or client data is copied into tests, fixtures, screenshots, logs, or docs.
- No local PostgreSQL installation or database creation is required.

## 2. Characterization gate (G36-1)

Before changing behavior, run the focused expected-red/compatibility tests created by T006–T008.

Required evidence:

- Existing PLAN-35 consultation permissions and contracts remain green.
- New assertions demonstrate the current stale scheduled/unreviewed behavior and fail for the intended outcome lifecycle.
- Boundary fixtures cover before, exact, and after `endsAt`.
- Primary-booking fixtures include a later case-linked follow-up.
- Race fixtures cover worker versus assign/review/outcome/reopen.
- Copy scan identifies obsolete runtime PLAN-17/PLAN-19 references without changing historical planning documents.

## 3. Schema gate without local DB (G36-2L)

Run:

```powershell
npm run db:validate
npm run db:generate
```

Expected:

- Prisma schema and generated client accept `ConsultationOutcomeStatus`, fields, relation, and indexes.
- No Prisma dependency version changes.
- No command attempts to create or connect to a local database.

Review migration SQL manually for:

- additions only;
- correct quoted enum/column/index/constraint names;
- nullable actor FK with `ON DELETE SET NULL`;
- no drop, rename, destructive status rewrite, or production data seed.

## 4. Shared lifecycle gate (G36-3)

Run focused service/contract tests after T012–T017.

Acceptance matrix:

| Scenario | Expected outcome |
|---|---|
| before end | `PENDING` |
| exactly at end, no assignment and no review | `MISSED` |
| after end, assignment only | `AWAITING_RESULT` |
| after end, review only | `AWAITING_RESULT` |
| after end, assignment and review | `AWAITING_RESULT` |
| worker repeats same row | no transition/audit/notification |
| authorized initial result | matching final consultation and appointment states |
| authorized correction | required reason, new version, distinct audit |
| stale version | `CONSULTATION_STATE_CHANGED`, no partial write |
| lawyer/Marketing Staff mutation | `PERMISSION_DENIED` |
| direct missed assign/review/convert | `CONSULTATION_REOPEN_REQUIRED` |
| valid missed reopen | `PENDING`, future `RESCHEDULED` primary, preserved audit |
| reopen conflict | `APPOINTMENT_CONFLICT`, no partial write |
| later case follow-up | never selected as primary |

Also confirm list/detail DTOs exclude raw Prisma records, AI fields, opposing-party data, and internal notes from list results.

## 5. Worker and connected-consumer gate (G36-4)

Run the maintenance helper tests with an injected fake client; no database is required.

Required evidence:

- One-shot reconciliation maps terminal/rejected/expired historical fixtures deterministically.
- Ongoing classification only targets pending ended rows.
- Conditional-update losers create no audit or notification.
- Structured output contains counts/status keys only and no PII/free text.
- Worker default/example interval is 60 seconds.
- Existing payment expiry and cleanup behavior remains covered.
- Notification review items disappear after transition; awaiting/missed alerts do not duplicate.
- Consultation list view counts equal dashboard and notification scopes for each tested role.

## 6. UI and formatting gate (G36-5)

Static/component checks must establish:

- RTL tab order: current, awaiting result, missed, successful, no-show, cancelled, all.
- Tabs are links with shareable `view` values; view changes reset `page=1` and preserve compatible filters.
- Desktop table and mobile cards show primary start/end, outcome badge, actor/reason when available, and effective calendar state.
- Manual result form provides confirmation, disabled/loading, success, error, stale refresh, and correction-reason states.
- Reopen form preserves fields after conflict and validates lawyer, future time, duration, mode, and reason.
- Async feedback uses an `aria-live` region; controls have visible focus and at least 44px touch targets.
- Empty, loading, error, denied, and mobile horizontal-overflow states are explicit.
- `legal-format.ts` pins `Africa/Cairo`; server/client formatting tests match.
- Runtime admin UI contains no `PLAN-17` or `PLAN-19` text; historical docs may still contain those identifiers.

## 7. Local no-database verification (G36-6)

Run in order:

```powershell
npm run test -- tests/server/consultation-outcome-characterization.test.ts tests/server/consultation-outcome-service.test.ts tests/server/consultation-outcome-contract.test.ts tests/server/consultation-outcome-maintenance.test.ts
npm run test
npm run typecheck
npm run lint
$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'; npm run build
npm run security:secrets
```

Record the exact command, exit code, and meaningful totals. If build uses the approved no-DB flag, label it `Local build without DATABASE_URL`.

## 8. Database-backed staging/disposable gate (G36-7D)

Run only when an authorized staging/disposable PostgreSQL `DATABASE_URL` is available. Do not create fixtures in production.

1. Capture a disposable snapshot or resettable fixture baseline.
2. Apply migrations through `npm run db:migrate`.
3. Run the one-shot maintenance command.
4. Validate enum, columns, FK, indexes, and default/version values.
5. Validate backfill for:
   - completed appointment;
   - no-show appointment;
   - cancelled appointment;
   - rejected consultation;
   - ended unassigned and unreviewed;
   - ended assigned only;
   - ended reviewed only;
   - future pending;
   - missing primary;
   - later case follow-up.
6. Repeat reconciliation and confirm zero new transitions/audits/notifications.
7. Exercise concurrent worker/manual operations and stale versions.
8. Start the previous application release against the migrated disposable database and confirm it reads existing records without data loss.

If unavailable, record `SKIPPED — no staging/disposable DATABASE_URL supplied`.

## 9. Playwright desktop/mobile RTL gate (G36-8B)

Use the existing local server harness and non-sensitive test personas/fixtures. Required viewports:

- desktop Arabic RTL;
- mobile Arabic RTL at a narrow phone width.

Critical flows:

1. Navigate all seven tabs and verify query URLs/count badges/page reset.
2. Open awaiting result, confirm each final outcome, and observe matching badge/appointment status.
3. Correct a final outcome with required reason.
4. Trigger stale version, refresh, and recover.
5. Open missed request, submit conflict, retain form input, correct time, and reopen.
6. Verify keyboard focus order, tab overflow, 44px actions, and `aria-live` feedback.
7. Verify dashboard cards link to matching views and calendar shows effective state.
8. Capture console and page errors; expected result is zero hydration/console errors.

If no DB-backed browser fixtures are available locally, run all non-mutating/static browser checks and record mutation flows as `SKIPPED`, not PASS.

## 10. Deployment and PM2 gate (G36-9)

Production handoff uses only:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

The script must enforce this sequence:

1. Refuse dirty tracked server files and fetch/pull `origin/main`.
2. Load production environment and verify database configuration.
3. Require `pg_dump`, create a timestamped custom-format backup outside the Git checkout, and verify the file is non-empty before migration.
4. Install/build and run existing predeploy checks.
5. Apply additive migration.
6. Run maintenance reconciliation once before application/worker restart.
7. Restart the app and existing `kmtlegal-payment-maintenance` process.
8. Capture maintenance restart count after the intentional restart.
9. Wait more than 60 seconds and confirm status remains online and restart count is unchanged.
10. Complete existing local/public health, release, asset, cache, and no-store checks.
11. Save PM2 state only after stability succeeds.

The script must not edit npm global config or Nginx HTTP/2 directives.

## 11. Live acceptance (G36-10L)

Live testing requires explicit authorization and existing safe records; never create a fake client/consultation in production merely for acceptance.

Minimum non-mutating smoke:

- authenticated consultation list loads each view with no server error;
- dashboard links/counts render under the admin scope;
- calendar and notification center load without stale scheduled/hydration error;
- app and worker remain healthy beyond one cycle;
- deployed release matches the pushed commit.

Only if authorized safe records already exist, perform one manual result/reopen flow and record the consultation reference without client identity.

After acceptance, rotate the previously shared admin credential and revoke older sessions through the approved operational path. Never place the credential in command history, docs, screenshots, or the repository.

## 12. Evidence record

| Gate | Status | Command/environment | Evidence |
|---|---|---|---|
| G36-0 planning | PASS | local | requirements 16/16; delivery 42/42; analyze 0 blocking findings |
| G36-1 characterization | PASS (expected-red) | local/no DB | 2026-07-22: 4 suites failed only on missing PLAN-36 module/surfaces, stale runtime copy, and unpinned timezone as intended |
| G36-2L schema | PASS | local/no DB | `prisma validate` and `prisma generate` succeeded with Prisma 7.8.0; migration inspected as additive |
| G36-3 lifecycle | PASS | local/no DB | 2026-07-22: focused PLAN-36 run passed 72/72 tests across 11 files, including boundaries, permissions, transactions, serialization/stale races, reopen client conflicts, primary appointment, DTO parity, Cairo conversion/calendar boundaries, and safe localized fallbacks |
| G36-4 worker/consumers | PASS | local/no DB | 2026-07-22: maintenance, notification, dashboard, list, audit, idempotency, lost-race, batch-progression, and route-contract coverage passed in the focused run; `node --check scripts/consultation-outcome-maintenance.mjs` passed |
| G36-5 UI/format | PASS (static/component) | local/no DB | Outcome/reopen forms are included in shared UI convergence; seven-tab/copy/calendar/format characterization passed; four desktop/mobile/mutation Playwright scenarios collect successfully |
| G36-6 local suite | PASS | local/no DB | Prisma validate/generate PASS; Vitest 59 files and 404 tests PASS; typecheck PASS; lint PASS with zero warnings/errors; secret scan PASS; guarded Next production build PASS with 72 static pages; Git Bash `bash -n` PASS |
| G36-7D DB | SKIPPED | staging/disposable only | No authorized staging/disposable `DATABASE_URL` supplied; no local or production database was contacted or created |
| G36-8B browser | SKIPPED (collection PASS) | local/staging | Four PLAN-36 Playwright flows collected; authenticated execution and screenshots require disposable outcome fixtures/storage state and were not run against production |
| G36-9 deploy | DEFERRED (local syntax PASS) | aaPanel/PM2 | Deploy script syntax and static contract passed locally; backup/migration/reconcile/health/65-second PM2 stability require the server handoff |
| G36-10L live | SKIPPED | temporary domain | No post-deploy live acceptance was claimed; credential rotation/session revocation remains a required post-live operational action |
| G36-11 converge | PASS | local/no DB | Final converge after T034–T038 checked 38 FRs, 10 SCs, 23 acceptance scenarios, 13 technical decisions, and 5 constitution principles; zero missing, partial, contradicting, or unrequested findings remained, `tasks.md` stayed byte-for-byte unchanged, and no further tasks were appended |

## 13. Converge and handoff (G36-11)

- Mark tasks complete only with evidence from their required gate.
- Run Spec Kit converge after implementation.
- If converge appends tasks, execute them in dependency order and rerun all affected gates.
- PLAN-36 closes only when converge appends zero tasks.
- PLAN-35 remains `Local-Verified` with its existing deferred DB/live tasks.

Current local disposition (2026-07-22): PLAN-36 is `Local-Verified`. Database, authenticated
browser, deploy, and live evidence remain explicitly deferred and are not counted as PASS.
