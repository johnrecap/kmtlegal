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

- Status: BLOCKED — two separate outstanding items (implementation corrected,
  NOT production-ready):
  - A. Cross-store consistency prerequisite not yet proven (no real
    maintenance-window capture + no in-app drain control exists).
  - B. Real disposable-environment restore drill not yet run.
- (Same-server/off-server limitation recorded separately below; unchanged.)
- Correction applied (this run): the "newer rows → 404 + re-upload" outcome
  is REJECTED as a recovery story — a required DB row without file bytes is
  a failed/incomplete restore, enforced by restore `--verify-documents`.
  `--require-quiet` is now an explicitly diagnostic-only sanity check, never
  a consistency proof. Completion reports four separate facts
  (`artifactsVerified`, `checksumsVerified`, `verifiedConsistent`,
  `restoreDrillVerified`); live captures can no longer complete as
  verified-consistent (`--require-consistent` fails them).
- Consistency prerequisite (exact): maintenance-window capture with writers
  genuinely paused for the whole window — `pm2 stop kmtlegal
  kmtlegal-payment-maintenance`, bounded drain, zero-writer readings at
  capture-start AND pre-publish, `--pause-record`, resume + verify
  (runbook § pause/verify/capture/resume). Missing control: no in-app
  maintenance/drain mode exists — non-disruptive quiesce is impossible;
  downtime-window backups need separate owner authorization.
- Integration status (accurate): MANUAL command only. The deployment script
  does NOT call the paired backup (it still runs DB-only
  `create_verified_database_backup`). Unwired by design in this correction;
  scheduling + sign-off remain before operational use.
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
  - Consistency method (corrected): `--capture-mode=live|maintenance-window`
    + `--pause-record` + two-point writer diagnostics; manifest
    `consistency: { mode, verifiedConsistent, writerPauseEvidence }`.
    Restore `--verify-documents` checks the restored DB: required missing
    files / mismatches fail `verify` with safe samples; extras are a
    separate finding. Live maintenance/downtime needs separate owner
    authorization.
- Files changed:
  - `scripts/paired-backup-lib.mjs`, `scripts/paired-backup.mjs`,
    `scripts/paired-restore.mjs` (new)
  - `tests/ops/paired-backup-restore.test.ts` (new, MOCKED exec / real temp fs)
  - `docs/launch-fixes/paired-backup-restore.md` (new runbook)
- Automated checks (MOCKED / UNIT evidence, NOT restore proof): 14/14 passed —
  prior 9 plus maintenance-window two-reading success, missing pause-record
  refusal, active-writer refusal, require-consistent refusal of live capture,
  document-check missing failure / extra separation / no-table skip.
  `node --check` clean on all 3 scripts.
- Real restore drill: NOT RUN (10-step Client A/B + checksum + isolation
  procedure prepared in runbook § Verification).
- Missing requirement: a disposable PostgreSQL reachable from the runtime
  environment (CREATEDB or superuser) plus a disposable uploads dir — same
  sandbox limitation as TASK 01; no new PG troubleshooting performed.
- Off-server limitation: backups stay on the same server; NOT protection
  against total server loss; no external service configured (needs approval).
- Commit: `68dab93` correction on `launch/task-01-client-create` (pushed; NOT
  merged to main, no deploy, no package changes)

## TASK 04 — Staff TOTP Two-Factor Authentication

- Status: BLOCKED — RUNTIME VERIFICATION REQUIRED (implementation + unit
  tests complete; real enrollment/login/recovery drill NOT RUN — no
  disposable database in this sandbox)
- Existing auth-path map (verified in current source @ `3aede1b`):
  - Staff predicate: existing `isStaffRole` policy (Client never pending).
  - Login: `POST /api/auth/login` → `loginWithPassword` (already returns
    `two_factor_required` + sets pending cookie for staff when
    `STAFF_2FA_MODE=totp`).
  - Mode: `staffTwoFactorMode/two-factor.ts` (`totp|disabled`, default
    disabled; production default unchanged).
  - TOTP: `totp.ts` (RFC6238 SHA1/base32/±1 window/timing-safe,
    deterministic `now`; existing RFC vector test in `auth-core`).
  - Pending enforcement: server-side — `session-store.ts:177` denies
    pending sessions everywhere unless `allowPendingTwoFactor`; all page
    guards use the default; only 2FA services opt in.
  - Storage: AES-256-GCM `sealSecret/openSealedSecret` (`secret.ts`);
    `StaffTwoFactorCredential` states `PENDING_SETUP|ENABLED|
    RESET_REQUIRED|DISABLED_BY_ADMIN` (no migration needed).
  - Verify: `verifyPendingTotp` (lock check, ENABLED-credential check,
    atomic activate TX + audit). Same-session replay structurally
    impossible (status flips ACTIVE atomically); cross-session same-window
    reuse requires fresh password authentication.
  - Reset: `resetStaffTwoFactor` (Super-Admin-only `twoFactor.reset.staff`,
    audited, clears secret → RESET_REQUIRED). No role besides Super Admin
    holds the permission.
  - Rate limits: existing `rateLimiters.twoFactor` (8/10m) + 5-attempt
    session lockout (10min), reused on all TOTP routes.
  - Missing before this task: NO enrollment flow existed (secret
    generation, setup-key/QR presentation, enrollment confirmation); TOTP
    verify + reset routes were 503 stubs; `/login/2fa` was a notFound stub;
    login form showed "unavailable" instead of redirecting.
- Reused vs new: reused totp/two-factor/session-store/secret/rate-limit/
  audit/kit components/login-status shape; new `totp-enrollment-service.ts`
  (sealed-secret start, code-confirmed activation that also finalizes the
  session, RESET_REQUIRED re-enrollment; ENABLED→409 so replacement
  requires admin reset = reauthentication; DISABLED_BY_ADMIN→403; secrets
  never logged/audited), 4 TOTP routes (enroll/enroll-confirm/status/
  verify — pending-session-only, rate-limited, mode-gated to 503 when
  disabled, no-store), wired admin reset route (active session +
  `resetStaffTwoFactor` → 401/403 mapping), real `/login/2fa` page (server
  redirects for non-pending/already-active/mode-disabled; kit Card form
  with verify + enroll states, one-time-code text field preserving leading
  zeros, no QR image / no external service), login-form redirect to
  `/login/2fa`, ar+en copy. Email OTP routes untouched (still 503, no SMTP).
  Production readiness still blocks `totp` mode (unchanged — activation
  needs explicit owner approval later).
- Files changed:
  - `src/server/auth/totp-enrollment-service.ts` (new)
  - `src/server/auth/auth-service.ts` (export failure recorder only)
  - `src/app/api/auth/2fa/totp/enroll/route.ts`,
    `.../enroll/confirm/route.ts`, `.../status/route.ts` (new)
  - `src/app/api/auth/2fa/totp/verify/route.ts` (wired, keeps 503 default)
  - `src/app/api/admin/users/[userId]/2fa/reset/route.ts` (wired)
  - `src/app/(app-ar)/login/2fa/page.tsx` (real page, was notFound stub)
  - `src/features/auth/two-factor-form.tsx` (new), `login-form.tsx`
    (redirect on `two_factor_required`), `src/content/auth-content.ts`
    (ar+en `twoFactor` copy)
  - `tests/server/staff-totp-flow.test.ts`, `tests/ui/two-factor-form.test.tsx`
  - `tests/server/security-hardening.test.ts` (reset-route assertion updated
    to the wired hardened contract)
- Tests run and results:
  - `staff-totp-flow`: 15/15 (window edges/malformed, role×mode matrix,
    pending denial, staff-pending vs Client-authenticated login, sealed
    enrollment start with no plaintext in audit, 409-when-enabled,
    confirm-activate with atomic ACTIVE, invalid-code 401 + attempt count,
    ACTIVE-session confirm/verify rejection = replay, secret-free status,
    Super-Admin-only reset + Client-target refusal, route contract incl.
    rate-limit/mode/no-store, base32 vector)
  - `two-factor-form`: 2/2 (shell render without external assets,
    code-field + kit + endpoint contract)
  - Neighbors (`auth-core`, `admin-governance`, `portal-access`,
    `security-hardening`, `auth-audit-contract`): 63/63 with the new files
  - `npm run typecheck`: 0 errors; `next lint` on all changed files: clean
- Real drill: NOT RUN. Missing: disposable database for the synthetic
  enroll → logout → password → pending-denied → TOTP → access → reset →
  re-enroll → Client-login flow. No mocked harness presented as proof.
- Rollout boundary: production flags/defaults unchanged
  (`STAFF_2FA_MODE=disabled`, readiness still rejects `totp`); no
  password-only fallback added; activation prerequisites — drill passed,
  owner/admin enrollment + recovery plan verified, `AUTH_SECRET` supplied
  securely, pre-existing-session behavior verified, explicit owner
  approval. Explicit risk: a SOLE locked-out Super Admin has no in-app
  self-recovery (reset requires another Super Admin) — narrow owner
  decision required before enforcement.
- Outstanding verification, distinguished (no implementation reopened):
  - A. Real enrollment/login/recovery drill: NOT RUN — disposable database
    unavailable (same sandbox limitation; unit proof only).
  - B. Readiness: production readiness still rejects `STAFF_2FA_MODE=totp`
    (`STAFF_2FA_MODE_UNSUPPORTED`) — an unresolved activation prerequisite,
    not merely a missing database. Readiness checks were NOT bypassed or
    removed; lifting the block needs explicit owner approval with the
    drill + recovery plan above.
  - C. Owner recovery: no safe owner-approved procedure exists for a
    locked-out sole Super Admin — no bypass invented, no production
    enforcement enabled.
  - D. Replay evidence: rejecting verify from an already-ACTIVE session is
    unit-proven, but credential-level replay prevention across separate
    pending sessions is NOT YET PROVEN. Remaining scenario: accept a code
    in pending session A, reject reuse of that accepted time-step/code in
    pending session B, with no two concurrent acceptances. No confirmed
    vulnerability is claimed — the atomic status-flip + password-per-login
    is the inspected enforcement; the cross-session scenario awaits the
    real drill.
- Commit: `694eea8` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy, no package changes, no prod flag changes, no real
  accounts touched)

## TASK 05 — Paymob Sandbox End-to-End Verification

- Status: BLOCKED — SANDBOX ENVIRONMENT REQUIRED (stopped early per
  protocol; no checkout attempted, no code written, no payment tests
  repeated as substitute)
- Prerequisite check (presence only, names from current
  `src/server/payments/*`; no values inspected or recorded):

| Requirement | Available? | Exact missing setup | Blocks which verification |
|---|---|---|---|
| A. Disposable PostgreSQL (synthetic-only, designated, migratable) | NO | No reachable disposable instance; prior local setup failed and is not retried; no shared/prod DB may be used | Sandbox flow; also TASK 01 runtime, TASK 03 drill, TASK 04 drill |
| B. Paymob TEST keys (`PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET` or `PAYMENT_WEBHOOK_SECRET`, `PAYMOB_PAYMENT_METHOD_IDS`) | NO | All missing-or-empty in this environment; local dev env file carries them empty | Checkout creation, hosted TEST payment, signed callback verify |
| C. Approved HTTPS staging endpoint (Paymob-reachable callback + return URL, app bound to disposable DB) | NO | No staging endpoint designated or approved; no tunnel started (needs approval) | Real callback delivery, return/receipt pages |
| D. Synthetic booking prerequisites (slot, pricing rule, `PAYMENT_RECEIPT_SIGNING_SECRET`/`PAYMENT_STATUS_SIGNING_SECRET`/`AUTH_SECRET`, signing config) | CODE-READY, UNPROVISIONED | Secrets missing-or-empty; pricing/slots need the disposable DB from A | Price review, receipt/status links, account-setup link |
| TEST-mode proof | NOT ESTABLISHED | Cannot be inferred from base URL (`PAYMOB_API_BASE_URL` defaults to accept.paymob.com regardless of mode); needs key/integration config | Entire flow — no payment initiated while TEST mode is uncertain |

- Real sandbox flow: NOT RUN. Edge cases (replay, fail/cancel, expiry,
  late-review): NOT RUN against provider (existing UNIT-ONLY coverage in
  `batch6-payment-trust` stands as designed, not as sandbox proof).
- Exact owner action needed (via secure configuration, never secrets in
  chat): supply (1) disposable PostgreSQL connection designation,
  (2) Paymob TEST key set + integration IDs with TEST mode confirmed in
  the Paymob dashboard, (3) approved staging HTTPS endpoint + callback URL
  registration. Then the 10-step synthetic flow in the task brief can run.
- Files changed: `docs/launch-fixes/EXECUTION.md` only.
- Commit: `e9dadcb` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy, no code written)

## TASK 06 — ClamAV Upload Verification

- Status: BLOCKED — no test scanner available (runtime attempts stopped
  per protocol; no code written)
- Implementation inspected (current source, no changes): `src/server/
  storage/malware-scan.ts` — zINSTREAM scan via Unix socket
  (`CLAMAV_SOCKET_PATH`, default `/run/clamav/clamd.ctl`) or TCP
  (`CLAMAV_HOST`/`CLAMAV_PORT`, default 3310); mode `MALWARE_SCAN_MODE`
  (`required|disabled`; required in prod, disabled otherwise); fail-closed
  503 `MALWARE_SCANNER_UNAVAILABLE` on transport failure, 422
  `MALWARE_DETECTED` on `FOUND`; existing `pingClamAv` zPING used by
  deploy preflight.
- Probes performed (2, timed, read-only): (1) env presence — `MALWARE_
  SCAN_MODE`, `CLAMAV_HOST`, `CLAMAV_PORT`, `CLAMAV_SOCKET_PATH`,
  `CLAMAV_TIMEOUT_MS`, `UPLOADS_DIR` all unset in this environment;
  (2) TCP `127.0.0.1:3310` — REFUSED. No daemon, no socket path on this
  Windows host (socket default is Linux-only). Nothing installed,
  no services touched, no ports exposed.
- Checks performed: none beyond probes — no scanner to exercise, so no
  clean/EICAR/type/size/downtime evidence exists. No EICAR fixture was
  created (nothing to send it to; kept out of Git/storage by design).
  SCANNER-ADAPTER and full-endpoint verification both NOT RUN. Existing
  unit coverage (`malware-scan`, storage-contract, batch3/9 file specs)
  stands as UNIT-ONLY, not real-scanner proof.
- Missing prerequisites: designated TEST `clamd` (socket or TCP) with
  loaded signatures + `MALWARE_SCAN_MODE`/`CLAMAV_*` test configuration +
  disposable DB/uploads from the shared table below.
- Files changed: `docs/launch-fixes/EXECUTION.md` only.
- Commit: `0436a05` on `launch/task-01-client-create` (pushed; NOT merged
  to main, no deploy, no code written)

---

## SHARED TEST ENVIRONMENT — OWNER SETUP REQUIRED

Consolidated requirement table for all blocked runtime verification
(TASK 01 browser flow, TASK 03 restore drill, TASK 04 TOTP drill,
TASK 05 sandbox flow, TASK 06 scanner checks). Variable NAMES only.

| Requirement | Already available? | Exact setup needed | Tasks unblocked |
|---|---|---|---|
| Isolated test application instance (own port, test env, no prod data) | NO | Test instance bound to the disposable DB/uploads below; `APP_ORIGIN` pointing at it | 01, 03, 04, 05, 06 |
| Disposable PostgreSQL source database (synthetic-only, migratable/seedable) | NO | Pre-created empty database + connection designation (`DATABASE_URL`); CREATE on its own schema + normal DML; superuser NOT required | 01, 03, 04, 05, 06 |
| Separate empty database for restore testing | NO | Second pre-created empty database (`PAIRED_RESTORE_DATABASE_URL`); same privilege level | 03 |
| Synthetic staff/client accounts | CODE-READY | Existing `prisma db seed` demo users once DB exists | 01, 04, 05, 06 |
| Separate test uploads + restore directories | NO | Writable temp dirs for `UPLOADS_DIR` (test) and restore target; outside web roots | 01, 03, 06 |
| Designated ClamAV test scanner | NO | TEST `clamd` with loaded signatures via `CLAMAV_SOCKET_PATH` or `CLAMAV_HOST`/`CLAMAV_PORT`; `MALWARE_SCAN_MODE=required` + `CLAMAV_TIMEOUT_MS` for the test instance | 06 |
| Paymob TEST configuration | NO | TEST `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET` (or `PAYMENT_WEBHOOK_SECRET`), `PAYMOB_PAYMENT_METHOD_IDS`, TEST mode confirmed in Paymob dashboard | 05 |
| Approved HTTPS staging/callback endpoint | NO | Staging URL + Paymob callback registration + return-URL config; no tunnel without approval | 05 |
| Application signing/encryption configuration | NO | Test values for `AUTH_SECRET`, `PAYMENT_RECEIPT_SIGNING_SECRET`, `PAYMENT_STATUS_SIGNING_SECRET`, `CLIENT_ACCOUNT_SETUP_SIGNING_SECRET` supplied securely, never in chat | 01, 04, 05 |

Database privileges requested: CREATE + DML inside the two pre-created
disposable databases only. Pre-created databases are acceptable; superuser
is NOT required. No paid services, DNS changes, or tunnels without approval.

Non-environment decisions NOT resolved by supplying the above:
- TASK 03 consistency procedure evidence + manual invocation / off-server-copy limitation
- TASK 04 readiness rejection of TOTP mode + owner recovery procedure + cross-session replay evidence
- TASK 01/02/04 completion statuses beyond their runtime drills
