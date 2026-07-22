# Quickstart and Acceptance Gates: PLAN-37

## Safety boundary

- Do not install, create, seed, or connect a local database.
- Do not create test consultations or appointments in production.
- Do not store credentials or real client data in commands, fixtures, screenshots, logs, or this plan.
- Do not modify Prisma schema/migrations for PLAN-37.
- Preserve untracked `.playwright-mcp/` and unrelated user files.

## G37-0 — Spec Kit gate

Required before code:

- Constitution checked at v1.0.0.
- `spec.md`, clarification record, `research.md`, `plan.md`, `data-model.md`, contract, and this quickstart complete.
- Requirements and delivery checklists fully checked.
- `analyze.md` reports zero unresolved CRITICAL/HIGH and zero unaccepted MEDIUM findings.

## G37-1 — Expected-red characterization

Add focused tests first for:

- before/exact/after 72 hours;
- June no-primary absent from current;
- June with future primary still current;
- one `asOf` across records/counts;
- legacy converted/rejected no-primary behavior;
- schedule authorization, conflict, stale version, and input-preserving contract.

Record that the new assertions fail for the intended missing behavior before implementation; existing PLAN-36 tests must remain green.

## G37-2 — Focused local verification (no DB)

Run the exact focused Vitest files created/changed by PLAN-37, including consultation outcome policy/service, review/schedule contract, maintenance, dashboard, notifications, formatting/copy, and static deployment contracts.

The tests must use dependency injection/mocks and must not require `DATABASE_URL`.

## G37-3 — Full local verification (no DB)

Run:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm test
npm run typecheck
npm run lint
npm run build
npm run security:secrets
```

If build tooling requires generated Prisma client already present in dependencies, use the existing generated client only; do not connect a database. Any unavailable command is recorded honestly and not marked PASS.

## G37-4 — Browser QA

Use the existing Playwright configuration and safe non-production data only.

Desktop and mobile RTL checks:

1. Eight tabs in the approved order, shareable URL, filter preservation, and page reset.
2. Creation-date label and Cairo overdue display.
3. Scheduling happy path in a disposable/staging fixture.
4. Invalid future time, conflict, stale version, and preserved inputs.
5. Keyboard focus, accessible labels/live feedback, 44px targets, mobile overflow.
6. Loading, empty, denied, error, retry, and success states.
7. No unexpected console, network, hydration, or horizontal-overflow error.

If safe fixtures or a disposable environment are unavailable, record this gate as Deferred/SKIPPED, never PASS.

## G37-5 — Staging/server database acceptance

Only after an operator-created and verified backup:

1. Pull the committed code.
2. Confirm PLAN-37 has no migration.
3. Run the existing one-shot consultation reconciliation.
4. Inspect representative existing data without creating production fixtures:
   - old active no-primary remains `PENDING` and appears overdue;
   - converted pending no-primary transitions once to awaiting result;
   - rejected pending no-primary transitions once to cancelled;
   - repeat reconciliation creates no duplicate audit/notification;
   - authorized scheduling is tested only on staging/disposable data or approved real operational work.
5. Compare list/dashboard/notification counts at a captured time.

## G37-6 — Deployment and PM2 stability

Use the existing supported command:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Confirm app and existing maintenance process are online and restart counters remain stable for longer than one maintenance cycle. Do not add a PLAN-37 PM2 process.

## G37-7 — Documentation and release truth

Update implementation status, plan index, feature inventory, server commands, release QA checklist, PLAN-37 evidence, and task checkboxes. Keep local, DB, browser, staging, and live results separate.

## G37-8 — Converge

Run Spec Kit converge after implementation. Append and execute every discovered task, then rerun until a pass adds zero tasks. Inspect the final diff for secrets, unrelated files, accidental Prisma changes, and `.playwright-mcp/` staging.

## G37-9 — Git handoff

After required local checks pass:

1. Stage only PLAN-37 files.
2. Commit on `main`.
3. Push to `origin/main`.
4. Deliver the aaPanel/PM2 update commands and clearly list any deferred DB/browser/live evidence.

## Recorded implementation evidence — 2026-07-22

### Spec Kit and expected-red

- G37-0: **PASS** — all artifacts exist; requirements checklist 16/16, delivery checklist 30/30,
  and pre-implementation analysis reported no CRITICAL/HIGH/MEDIUM finding.
- G37-1: **PASS** — the initial PLAN-37 characterization failed 5/5 for the missing queue, schedule,
  reconciliation, alert/dashboard, and copy/UI contracts. Boundary/view, scheduling service, and
  converted-legacy assertions also failed for the intended pre-change reasons before implementation.

### Local no-database verification

- G37-2: **PASS** — 75/75 focused tests passed across the nine affected server suites.
- G37-3: **PASS** — with `DATABASE_URL` removed from each command environment:
  - full Vitest: 424/424 across 60 files;
  - `npm run typecheck`: PASS;
  - `npm run lint`: PASS with no warning/error;
  - `npm run security:secrets`: PASS, no high-confidence secret pattern;
  - `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build`: PASS, 72/72 static pages and the new
    `/api/admin/consultations/[consultationId]/schedule` route included. The first invocation reached
    72/72 but hit the 240-second shell timeout before finalization; the required rerun completed with
    exit code 0 and is the recorded result.
- PLAN-35 shared-UI impact ledger was updated for the new schedule form and detail feedback consumer;
  its focused convergence/disposition tests pass 5/5.

### Browser, database, and deployment truth

- G37-4: **SKIPPED (safe/environmental)** — `npm run test:e2e:plan37` started the built app and
  collected all three desktop/mobile/mutation scenarios, then skipped all three because no
  authenticated disposable Office Admin state or opted-in fixtures were supplied. The two PLAN-36
  and PLAN-37 files also compile/list seven scenarios together. This is not Browser-Verified evidence.
- G37-5: **Deferred** — no local, staging, or production PostgreSQL database was connected and no
  fixture was created.
- G37-6: **Deferred** — deployment/PM2 stability requires the authorized server update after push.
- G37-7: **PASS (local documentation)** — status, plan index, feature inventory, server commands,
  release checklist, tasks, and this evidence distinguish local success from external gates.
- G37-8: **PASS** — Converge pass 1 appended and completed T019/T020; pass 2 found no new task or
  unresolved CRITICAL/HIGH/MEDIUM issue. The detailed disposition is recorded in `analyze.md`.
- G37-9: **PASS at handoff** — final diff/secret/Prisma scope review passed, explicit staging excludes
  `.playwright-mcp/`, and the committed `origin/main` change is handed off through the documented
  aaPanel/PM2 command.
