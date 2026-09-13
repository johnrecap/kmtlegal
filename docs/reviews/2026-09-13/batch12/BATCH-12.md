# Batch 12: live admin authorization and password-write concurrency

## Result

Sensitive staff-account creation and password-reset writes now revalidate the authenticated session and the actor's current account, role, and effective user-management policy after password hashing and inside the serializable write transaction. A session must still belong to the actor, be active, unrevoked, and unexpired; the actor must still be an active, nondeleted exact Super Admin. Account creation also rechecks the destination role inside that transaction.

Password reset now requires the target `User.updatedAt` observed by the detail page. The password update claims that version atomically before any target-session revocation or success audit. A stale form or a competing reset returns the existing `409 CONFLICT` contract with no password, session, or audit side effect. Successful responses return only the new safe `updatedAt` version alongside the existing result fields; no password or hash enters the response, audit metadata, log, or browser storage.

The password form keeps the submitted draft visible on conflict, disables resubmission, and offers an explicit full-page reload. Reloading clears the password fields and loads the current target version before the administrator enters the password again. The existing `revokeSessions` choice, the current-session exception for a Super Admin changing their own password, and authorized reset of an already inactive target are unchanged.

## Controlled PostgreSQL evidence

The dedicated integration suite ran against PostgreSQL 18 on `127.0.0.1:55441`, database/user `kmt_batch10`, with `APP_ENV=local`, the exact authorized data directory, and marker `synthetic-batch10-only`.

The pre-fix run in `evidence/baseline-postgres-before-fix.log` recorded five independent product failures and two preserved-policy passes: account creation continued after actor suspension/session revocation; password reset continued after actor-session revocation; creation accepted a destination role disabled during hashing; a target edit did not make the reset stale; and two resets for one observed version both returned success. The live exact-Super/delegate boundary and existing self-session/inactive-target policies already passed.

The corrected `evidence/postgres-integration.log` passes seven cases. These route-contract tests invoke the Next.js handlers in-process with real authenticated sessions and PostgreSQL; they do not traverse a network listener. Test-only barriers pause calls after the real `scrypt` hash completes, then commit the competing local transaction before releasing the production service call. The multi-request barrier fails immediately if either request settles before both real hashes arrive, and its `finally` path always releases the gate and settles both requests. Rejected operations preserve the exact seeded target-session rows and leave no created user, changed password, or success audit. Two resets using the same target version produce one `200`, one `409`, one surviving password, and only the winner's audit/session effects.

The supervised-review correction on top of commit `33d6783771545cfc71e91b71377aac5b473c1c61` changed only the integration harness and this evidence documentation. `evidence/postgres-integration-correction.log` passes the same seven cases after adding exact before/after assertions for two active target sessions in each rejected password-write case and unconditional release/settlement for the two-request barrier. The logged serialization error is the expected losing request that the route converts to `409`. `evidence/typecheck-correction.log` records the passing typecheck, and `evidence/postgres-correction-cleanup.log` records zero synthetic users, sessions, and audits before the disposable database, role, process, and directory were removed.

## Browser evidence

The actual `/admin/users/:userId` page passed one synthetic Chromium flow over real network HTTP through local Next.js at `http://127.0.0.1:3115`:

- desktop `1440x1000`: keyboard submission, successful reset, safe version refresh, and visible success feedback;
- mobile `390x844`: real stale `409`, retained but disabled password draft, explicit keyboard-triggered reload, empty password fields after reload, and successful reviewed retry;
- no page errors and no unexpected console errors; Chromium's expected failed-resource console entry for the deliberate `409` is asserted separately.

Screenshots are `evidence/password-success-1440.png` and `evidence/password-conflict-390.png`. `browser-attempt1.log` records refinement of the expected-409 console assertion; `browser-attempt2.log` and `browser-attempt3.log` retain two test-syntax corrections. The earlier cascading seven-failure PostgreSQL attempt was observed during development but its log was not retained; `evidence/baseline-postgres-before-fix.log` is the preserved clean baseline with five independent failures and two policy passes. The final passing browser run is `evidence/browser.log`.

## Repository verification

- focused contracts/components: 22 passed — `evidence/focused-tests.log`
- full Vitest suite: 535 passed, 36 opt-in tests skipped — `evidence/full-tests.log`
- typecheck — `evidence/typecheck.log`
- warning-free lint — `evidence/lint.log`
- production build — `evidence/build.log`
- secret scan — `evidence/secret-scan.log`
- page inventory: 58 before and after — `evidence/page-inventory.json`

## Boundaries and cleanup

There is no schema migration, dependency, role-policy, target-eligibility, email/SMTP, 2FA, office-profile, public-content, or page-count change. The guaranteed ordering is the tested case where loss of authority or session revocation commits before the post-hash live authorization check; this batch does not claim stronger semantics for every overlapping transaction schedule.

Cleanup verified zero users, sessions, and audits in the disposable database before dropping its database and role. PostgreSQL port `55441` and Next.js port `3115` are closed, and the disposable cluster directory was removed. Details are in `evidence/cleanup.log`.
