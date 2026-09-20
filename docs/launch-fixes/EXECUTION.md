# Launch Fixes — Execution Tracker

Base: clean worktree on `origin/main` @ `a3b9391` (Phase 13 Blocker-1 resolution).
Primary owner worktree untouched. One task at a time. No merges to main, no deploys.

## TASK 01 — Connect Admin Client Creation

- Status: BLOCKED — runtime environment only (audit correction recorded)
- Audit correction: the prior audit's client-create finding is NOT supported
  by current source inspection.
  - Client creation implementation: ALREADY PRESENT (`ClientCreateForm` +
    `POST /api/admin/clients` → `createAdminClient`, since Phase 11 `ce6bced`).
  - Permission-denied UI ("إضافة العملاء غير متاحة"): intentional
    `!canManage` branch, not a missing-feature placeholder.
  - Targeted code/tests: verified (contract test 6/6, neighbors 18/18,
    typecheck + lint clean; commit `fe57331` + test preserved, implementation
    unchanged).
  - Authenticated database-backed browser flow: NOT VERIFIED (no
    disposable PostgreSQL in this sandbox; no further PG/credential
    troubleshooting per instruction).
  - Existing client-management actions were not modified.
- Exact scope: replace the "creation unavailable" placeholder on the Admin
  Clients page with a working form reusing existing service/endpoint/schema/
  permissions/components; no new required fields; no auto portal login.
- Finding (verified against current source @ `a3b9391`): the audit
  description is stale. The working form ALREADY exists — `ClientCreateForm`
  (`src/features/admin/clients/client-crm-forms.tsx:98-183`, landed in
  Phase 11 `ce6bced`) renders on `/admin/clients` whenever `canManage`
  (`client.update.any`, held by Office Admin + Secretary + Super Admin);
  `POST /api/admin/clients` → `createAdminClient` (permission assert +
  `adminClientWriteSchema` + lawyer check + `prisma.client.create` + audit
  `client.create`) is complete. The "إضافة العملاء غير متاحة" StateBlock is
  the CORRECT `!canManage` branch (unauthorized roles), not a missing
  feature. No source change was needed or made: no new fields, no new
  route, no portal-login side effect (service creates only the CRM row).
- Checklist:
  - [x] Inspect page, `createAdminClient`, API route, schema, permissions
  - [x] Confirm placeholder is the authorized-only branch; form uses
        existing Field/Input/Select + error + Stateful Button (`disabled`
        + `isBusy` guard against parallel submits; `disabled` passes
        through to `motion.button`)
  - [x] Confirm endpoint exists with existing auth (401) / authz (403) /
        validation (400) / error conventions; normalization
        (`phoneCanonical`, `""` → null) + audit preserved; success
        navigates to detail via existing `router.push` convention
  - [x] Narrow tests (new contract test, 6/6 green)
  - [ ] Authenticated test-database browser flow — BLOCKED (environment)
- Files changed:
  - `tests/server/admin-client-create.test.ts` (new: success+normalization+
    audit, Secretary allowed, Lawyer 403 without DB touch, invalid input
    400s, unknown lawyer 400, schema strictness)
  - `docs/launch-fixes/EXECUTION.md` (this tracker)
- Tests run and results:
  - `tests/server/admin-client-create.test.ts`: 6/6 passed
  - Regression neighbors (`admin-list-phase10`, `admin-detail-phase11`,
    `admin-ui-convergence`, `route-manifest-contract`): 18/18 passed
  - `npm run typecheck`: 0 errors; `next lint` on changed test: clean
- Runtime evidence: none (blocked). Static + mocked-service evidence only.
- Missing environment: a disposable PostgreSQL reachable from this sandbox
  with CREATEDB (or superuser) for `kmt_launch_task01`. What was tried:
  local PG18 `initdb` cluster on :5544 (forked backends crash with
  `0xC0000142`/err 487 in this sandbox; `autovacuum=off` did not help);
  system PG on :5432 rejects the only known local dev credentials
  (they belong to another environment). No shared/production DB was
  touched; throwaway cluster artifacts removed. With a working disposable
  DB, the remaining 30-minute verification is: migrate + seed, login as
  seeded `office.admin@kmt.local`, submit the form in Chromium (available),
  assert detail/list, invalid-input error, Lawyer 403 +   `!canManage`
  StateBlock, anonymous 401.
- Commit: `9d80487` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy)

## TASK 02 — Close Hidden Public Content APIs

- Status: COMPLETE
- Exact scope: public articles + case-studies list/detail endpoints return
  the standard 404; models/rows/services/Admin CMS intact; Services/Team
  APIs untouched; no Media restore.
- Endpoints handled (all verified live before the change, now closed at the
  route boundary before any service/DB read):
  - `GET /api/public/articles` → 404 `NOT_FOUND`
  - `GET /api/public/articles/[slug]` → 404 `NOT_FOUND` (any slug)
  - `GET /api/public/case-studies` → 404 `NOT_FOUND`
  - `GET /api/public/case-studies/[slug]` → 404 `NOT_FOUND` (any slug)
- Consumer check: zero `src` fetchers of these endpoints (no Admin
  component depends on them); Admin uses `/api/admin/content/*` +
  `content-social-service` (untouched). Shared `content-service` NOT
  deleted; models/rows untouched; Services/Team routes untouched.
- Checklist:
  - [x] Located + verified the 4 live endpoints and their (lack of) consumers
  - [x] Standard `jsonError(404, "NOT_FOUND", …)` at route boundary
        (locale-aware, same shape as existing detail-404s)
  - [x] Narrow route tests (real handlers; only the service mocked to
        prove it is never called)
  - [x] Directly-affected e2e expectations updated (published→404)
  - [x] Existing Admin content tests re-run (shared service unchanged)
- Files changed:
  - `src/app/api/public/articles/route.ts`
  - `src/app/api/public/articles/[slug]/route.ts`
  - `src/app/api/public/case-studies/route.ts`
  - `src/app/api/public/case-studies/[slug]/route.ts`
  - `tests/server/public-content-closure.test.ts` (new)
  - `tests/e2e/batch14-content-lifecycle.spec.ts` (2 expectations 200→404)
- Tests run and results:
  - `tests/server/public-content-closure.test.ts`: 4/4 passed (404 status,
    `NOT_FOUND`, no `data`, no content strings, service spies uncalled)
  - Neighbors: `admin-content-social` + `public-articles` + `public-case-
    studies` page tests + TASK 01 contract test: 17/17 passed
  - `npm run typecheck`: 0 errors; `next lint` on all changed files: clean
- Runtime evidence / limitation: unconditional-404 unit proof via real
  route handlers (no DB needed by design); Admin live CRUD NOT re-tested
  (only unit coverage) — recorded honestly, not a failure of the closure.
  Full E2E / build not run per fast-verification policy.
- Missing environment: none for this task.
- Commit: `cb4ab03` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy)

## TASK 03 — Database + Uploads Backup and Restore

- Status: BLOCKED — REAL RESTORE VERIFICATION REQUIRED
- Implementation: READY. Paired backup/restore scripts + mocked
  orchestration tests + runbook (`docs/launch-fixes/paired-backup-restore.md`).
- What was implemented (extends existing `create_verified_database_backup`
  + `postgres-backup-tools.sh` conventions; no deploy script rewritten):
  - `scripts/paired-backup-lib.mjs`: redaction, path-safety, manifest
    schema/verify, sha256, symlink-refusing inventory, lock helpers.
  - `scripts/paired-backup.mjs`: atomic `<dest>/<setId>/` publish only
    after pg_dump + `pg_restore --list` + tar + manifest + checksums verify;
    umask-style `0700/0600` perms; concurrent-run lock; unsafe destinations
    refused (inside UPLOADS_DIR/checkout, public-looking); previous backups
    never touched; staged tool errors; no secrets in manifest/logs.
  - `scripts/paired-restore.mjs`: dry-run inspect by default; apply needs
    `--apply --set --target-uploads --confirm=<setId>` + separate
    `PAIRED_RESTORE_DATABASE_URL`; checksum/manifest/archive validation;
    new-EMPTY target DB and empty target uploads required; no `--create`
    (archive DB name never overrides target); `--no-owner` restore
    (ownership vs app permissions documented).
  - Consistency method: single-transaction pg_dump snapshot + immediate
    uploads capture; optional `--require-quiet` writer check via
    `pg_stat_activity`; residual skew documented (orphan files harmless,
    newer rows → 404 + re-upload). Live maintenance/downtime needs
    separate owner authorization.
- Files changed:
  - `scripts/paired-backup-lib.mjs`, `scripts/paired-backup.mjs`,
    `scripts/paired-restore.mjs` (new)
  - `tests/ops/paired-backup-restore.test.ts` (new, MOCKED exec / real temp fs)
  - `docs/launch-fixes/paired-backup-restore.md` (new runbook)
- Automated checks (MOCKED / UNIT evidence, NOT restore proof): 9/9 passed —
  success + previous-backup preservation, dump failure, archive failure,
  unsafe destinations, incomplete set, corrupted checksum, dry-run +
  traversal refusal, apply guards + file verification, non-empty DB refusal,
  redaction. `node --check` clean on all 3 scripts.
- Real restore drill: NOT RUN (10-step Client A/B + checksum + isolation
  procedure prepared in runbook § Verification).
- Missing requirement: a disposable PostgreSQL reachable from the runtime
  environment (CREATEDB or superuser) plus a disposable uploads dir — same
  sandbox limitation as TASK 01; no new PG troubleshooting performed.
- Off-server limitation: backups stay on the same server; NOT protection
  against total server loss; no external service configured (needs approval).
- Commit: `64b4732` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy, no package changes)

## TASK 04 — Staff TOTP Two-Factor Authentication

- Status: NOT STARTED
- Exact scope: functioning staff TOTP (enrollment + verification +
  recovery) in test env reusing existing implementation; pending-2FA
  sessions denied protected access; rate limits preserved; no SMTP; no
  production flag changes.
- Checklist:
  - [ ] Inspect TOTP/enrollment/guards/pending-session/storage/recovery code
  - [ ] Wire missing portions of existing design
  - [ ] Targeted auth/2FA tests + test-DB login/enrollment/recovery flow
- Files changed: —
- Tests run: —
- Runtime evidence: —
- Missing environment: —
- Commit: —

## TASK 05 — Paymob Sandbox End-to-End Verification

- Status: NOT STARTED
- Exact scope: VERIFICATION primarily — one real sandbox payment through
  the full lifecycle (booking → receipt → account link) + edge cases
  (replay, failure, expiry, late payment); no code rewrite unless a defect
  is proven; TEST credentials only.
- Checklist:
  - [ ] Check current Paymob docs for the used integration
  - [ ] Sandbox journey with signed callbacks
  - [ ] Edge-case evidence (automated where unsafe live)
- Files changed: —
- Tests run: —
- Runtime evidence: —
- Missing environment: —
- Commit: —

## TASK 06 — ClamAV Upload Verification

- Status: NOT STARTED
- Exact scope: real ClamAV scan through the authenticated upload endpoint
  in test/staging env (clean doc, EICAR, bad type, oversize, scanner-down);
  prove scanner verdict (not file-type rejection); rejected content not
  downloadable; fail-closed on downtime.
- Checklist:
  - [ ] Inspect malware-scan config + upload validation
  - [ ] Endpoint tests against real test ClamAV instance
  - [ ] Cleanup synthetic artifacts, restore settings
- Files changed: —
- Tests run: —
- Runtime evidence: —
- Missing environment: —
- Commit: —
