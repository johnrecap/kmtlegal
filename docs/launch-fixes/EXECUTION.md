# Launch Fixes — Execution Tracker

Base: clean worktree on `origin/main` @ `a3b9391` (Phase 13 Blocker-1 resolution).
Primary owner worktree untouched. One task at a time. No merges to main, no deploys.

## TASK 01 — Connect Admin Client Creation

- Status: BLOCKED (runtime verification unavailable; see missing environment)
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
  assert detail/list, invalid-input error, Lawyer 403 + `!canManage`
  StateBlock, anonymous 401.
- Commit: (pending)

## TASK 02 — Close Hidden Public Content APIs

- Status: NOT STARTED
- Exact scope: public articles + case-studies list/detail endpoints return
  standard 404; models/rows/services/Admin CMS intact; Services/Team APIs
  untouched; no Media restore.
- Checklist:
  - [ ] Locate every public articles/case-studies list/detail route
  - [ ] Disable at route boundary before content fetch
  - [ ] Targeted public-route tests + narrow Admin content verification
- Files changed: —
- Tests run: —
- Runtime evidence: —
- Missing environment: —
- Commit: —

## TASK 03 — Database + Uploads Backup and Restore

- Status: NOT STARTED
- Exact scope: extend existing backup mechanism to pair DB + UPLOADS_DIR in
  one backup set (id, timestamps, manifest, checksums, restricted perms);
  restore into disposable DB + temp uploads dir; synthetic doc download +
  checksum + authz checks; document commands/env/failure handling.
- Checklist:
  - [ ] Inspect backup/deploy scripts + uploads path
  - [ ] Paired backup set implementation
  - [ ] Disposable-environment restore drill + verification
  - [ ] Documentation (commands, storage, env names, failures, off-server status)
- Files changed: —
- Tests run: —
- Runtime evidence: —
- Missing environment: —
- Commit: —

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
