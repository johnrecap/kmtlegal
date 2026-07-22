# PLAN-35 Implementation and Acceptance Quickstart

**Purpose**: Reproduce implementation gates and record truthful evidence for PLAN-35.

**Important**: Implementation is active. Local implementation evidence and database acceptance are
separate: missing disposable PostgreSQL may leave DB tasks `BLOCKED`, but it is never converted to a
pass and the production-connected database is never used as a substitute.

## 1. Preconditions

- Node.js matches `package.json` (`>=20.19 <21`, `>=22.12 <23`, or `>=24 <25`).
- npm 10 or newer; repository package manager is npm 11.6.2.
- Dependencies installed with `npm install`.
- For DB gates, `DATABASE_URL` points to a disposable PostgreSQL database, never production.
- If no disposable DB exists and local installation is not authorized, continue only the accepted
  non-DB tasks; keep T016, T028, T039 DB assertions, and later DB gates open.
- For browser gates, all five staff personas exist: Lawyer, Secretary, Office Admin, Marketing
  Staff, and exact Super Admin.
- Never commit real credentials, database URLs, contact content, or client/case evidence.

Record the starting commit and the accepted task IDs. Only tasks in
[tasks.md](./tasks.md) may be implemented, in dependency order.

## 2. Planning gate (G35-0 to G35-2)

Run from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .specify\scripts\powershell\check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks
git diff --check
```

Acceptance:

- `spec.md`, `plan.md`, `analyze.md`, `research.md`, `data-model.md`, this quickstart, contract,
  checklist, and task list exist.
- No template placeholder or unresolved planning marker remains.
- Requirements and delivery checklists are complete.
- Spec Kit analyze reports zero `CRITICAL`/`HIGH`; each `MEDIUM` is fixed or explicitly accepted.
- PLAN-35 detailed tasks exist only in this feature directory; master tasks contains one roll-up.

## 3. Characterization gate (G35-3)

Before product changes, add and run the failing/high-risk tests named in `tasks.md`. Expected
failures must demonstrate the audited defect and be saved in the implementation evidence; unrelated
baseline tests must remain green.

Focused planned test surfaces include:

```text
tests/server/admin-dashboard.test.ts
tests/server/admin-route-policy.test.ts
tests/server/appointment-conflict-service.test.ts
tests/server/admin-notifications.test.ts
tests/server/admin-manual-cases.test.ts
tests/server/admin-role-permissions.test.ts
tests/server/admin-governance.test.ts
tests/server/auth-core.test.ts
tests/server/storage-contract.test.ts
tests/ui/admin-command-center.test.tsx
tests/ui/admin-accessibility.test.tsx
tests/e2e/plan35-db-backed.spec.ts
tests/e2e/plan35-admin-operations.spec.ts
```

Do not convert an expected-red characterization run into a general pass claim.
T019's shell/dialog/responsive assertions remain deliberately red through Foundation and become
green only after US2/US7. G35-4L requires T001–T015 and T017–T023 green plus the recorded T019
failure before local story implementation; T016 remains the separate G35-4D database gate.

## 4. Foundation local and data gates (G35-4L / G35-4D)

`G35-4L` permits local story implementation after the focused Foundation, type, lint, build,
contract, and schema validate/generate checks pass. It does not grant DB verification.

`G35-4D` remains open until a disposable PostgreSQL database is available. Run only against that
isolated target:

After accepted foundation tasks are implemented:

```powershell
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:seed
```

Required database assertions:

- `case.create.any` exists once and default grants are correct.
- `notification.read.self` exists for all editable staff roles.
- Change an editable role's permissions, run seed again, and confirm the change persists.
- An editable role with zero permission rows remains at zero after session load and repeat seed.
- An inactive role remains inactive after a marked repeat seed and is read-only in governance.
- Protected system roles remain immutable.
- Admin-user list/create/detail/update DTOs contain no password hash, encrypted TOTP secret,
  recovery-code secret, token hash, or whole credential record.
- Login/session resolution rejects suspended/deleted users and inactive roles; a role/access-status
  change revokes target sessions; concurrent mutations cannot remove the final active exact Super
  Admin or let a delegated manager target/assign a protected role.
- `prisma/schema.prisma` has no PLAN-35 structural diff unless the specification was formally
  reopened.

When `G35-4D` is unavailable, record `BLOCKED` with the missing environment and continue only local
implementation allowed by FR-035. Do not run these commands against production and do not check off
T016.

## 5. Independent story checkpoints

### US1 — scopes and calendar

Local lane: implement and run T024–T027 and T029–T038 with deterministic service/contract tests.
T028 and the database-backed portion of T039 remain open without disposable PostgreSQL, so US1 may
be reported as locally implemented but not checkpoint-accepted or DB-verified.

- Create cross-assignment fixtures and compare dashboard metrics/IDs to task and calendar results.
- Run exact-boundary, partial-overlap, full-overlap, different-lawyer, closed-status, and
  reschedule-self tests.
- Execute two concurrent same-lawyer creates; exactly one commits and the other returns the stable
  409 outcome.
- Run public-first/admin-first reservation ordering, linked-consultation reassignment, stale-pre-read
  concurrent reschedule, and audit-failure rollback cases.
- Inject `P2034` into paid public booking and assert exactly one hosted-checkout provider call;
  reschedule/assignment callbacks are single-attempt, while only database-only create/conversion
  callbacks may use bounded retries with transaction-local rereads.
- Record bounded PostgreSQL `EXPLAIN`/contention evidence; reopen the no-schema plan if current
  indexes fail the accepted feasibility gate.

### US2 — permission-aware workspace

- Local lane: implement T040–T051 and verify the deterministic policy matrix, filtered shell,
  boundary states, native mobile dialog, types, lint, and build without opening a database
  connection. Author T042 with explicit storage-state prerequisites; do not replace authenticated
  direct-page/direct-API cells with mocks or production credentials.
- When all five disposable persona storage states are unavailable, record T042's authenticated cells
  and T052 as `BLOCKED`, keep the US2 checkpoint open, and report only the local verification that
  actually ran.
- For all five staff personas, compare registry entries, visible desktop/mobile navigation, direct
  page result, and direct API result for the fifteen already implemented destination IDs.
- Confirm `contacts.list`, `notifications.list`, `cases.create`, and `roles.list` are absent at the
  US2 baseline rather than accepting 404/405 for an advertised destination.
- A hidden destination must still be denied server-side.
- A denied state keeps authorized shell navigation and offers a valid recovery action.

### US3 — contact and notifications

- Local lane status (2026-07-22): T053–T067 are implemented and locally verified without a database
  connection using deterministic service/contract/component tests, source checks, typecheck, lint,
  and the documented no-database build flag. T057 is authored and collection-verified but skips its
  authenticated cells unless safe disposable persona storage states exist; T068 stays open until
  isolated PostgreSQL and browser evidence are available.
- Do not mock a passing authenticated journey, use production credentials/data, or count a skipped
  contact/notification cell as US3 acceptance.
- Submit a public contact fixture, find it through search/status/topic/pagination, and exercise
  reader-versus-manager transitions.
- Create generic and consultation-linked notifications, verify dedupe and the attention formula,
  mark the generic item read, and confirm consultation review remains pending.
- Cross-user notification mutation returns 404 and changes nothing.
- Page the full notification center to exhaustion with no gaps/repeats; place a duplicate beyond the
  first source fetch and confirm complete-set counts remain correct.
- Verify external/script URLs plus a dynamic internal URL made unauthorized by a later permission
  change or object reassignment fall back to an authorized destination or no action.
- Race identical and different contact transitions; assert one atomic audit for the identical pair
  and full rollback when audit insertion fails.
- Local evidence: 39 focused tests and all 304 unit/contract tests pass; typecheck and lint pass;
  `$env:ALLOW_BUILD_WITHOUT_DATABASE_URL='true'; npm run build` completes all 72 static pages; and
  `npx playwright test tests/e2e/plan35-admin-operations.spec.ts --list` collects 19 scenarios.
  These results do not constitute T068 database or authenticated-browser acceptance.

### US4 — manual cases

- Create for an active client, verify list/detail/client history, edit allowed core fields, and
  confirm audit data.
- Replay the same actor/token/canonical request hash and confirm one case only; same token with a
  different normalized body conflicts, while different tokens are not treated as fuzzy duplicates.
- Use only `CLIENT | OPPOSING_PARTY | WITNESS | EXPERT | OTHER`; reject assigned-scope lawyer
  transfer, and verify create/edit audit rollback plus redacted before/after metadata.
- Force a rare file-reference collision and verify values are preserved and a new request UUID is
  created only for the explicit retry action.
- Invalid client/lawyer, stale edit, and denied role leave no partial case or party.

### US5 — role governance

- Exact Super Admin reads and updates an editable role.
- Office Admin remains denied even if granted governance-looking keys.
- Protected role, unknown/duplicate key, stale version, concurrent update, and failed audit paths
  leave assignments unchanged.
- A fresh request/session reflects the successful update; repeat seed does not undo it.
- Inspect every admin-user list/create/detail/update envelope for zero credential secrets and verify
  existing user pages consume the named safe DTO.
- Verify login and `/api/auth/me` reject non-active/deleted users and inactive roles, affected
  sessions are revoked atomically, delegated managers cannot target/assign protected roles or an
  editable role outside their effective-permission subset ceiling, and two concurrent mutations
  cannot remove the final exact Super Admin.
- Race a role-permission change against a user reassignment and submit a stale `User.updatedAt`;
  each returns one accepted success plus a non-replayed `409`, never a lost update or amplified role.
- After T066/T079/T090 have activated only page/API-ready entries, execute all nineteen route IDs
  by five roles against navigation, direct page, and the contract's representative API probe;
  allowed cells cannot pass with 404/405 or skip.

### US6 — command center

- Verify role-allowed priority order, maximum-six queues, metric definitions, authorized drill-down
  filters, and primary action.
- Force one loader to fail and confirm unaffected sections remain interactive.
- Inspect the network payload for DTO minimization and absence of raw errors/unused legal fields.
- Assert exact `Africa/Cairo` boundaries, ready/unavailable metric unions, enum-to-copy mappings,
  deterministic tie-breakers, item/activity unions, and contract hrefs.
- Exercise valid/unwritable roots and required/disabled/reachable/unreachable scanner states; the
  wrapper retains safe settings under `data.settings`, omits legacy storage value/update metadata,
  and performs at most one bounded scanner ping per load.

### US7 — accessibility and responsive UI

- Test desktop `1440x900`, both sides of `lg` (`1023x768` and `1024x768`), mobile RTL `390x844`,
  and compact `320x568`.
- Use keyboard only: open/close mobile menu, Escape, restored focus, logical RTL direction, current
  route, and all actions.
- Assert unique IDs, correct label/error/help relationships, named search regions, table captions,
  `scope="col"`, alert/status semantics, 44px targets, and no document horizontal overflow.
- Use Playwright `toHaveScreenshot` with animations disabled, stable
  `[data-visual-dynamic]` masks, and `maxDiffPixelRatio: 0.01`.

## 6. Local verification gate (G35-6)

```powershell
npm run db:validate
npm run db:generate
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
git diff --check
```

If the build is intentionally performed without a database in a nonproduction validation
environment, use the repository's existing documented guard only and label that evidence
accordingly; it does not satisfy DB acceptance.

Expected result: every command exits 0. A skipped PLAN-35 test is not a passing result.

## 7. DB-backed release gate (G35-7)

Use a disposable migrated PostgreSQL database:

```powershell
npm run qa:db
npm run test:e2e:db
```

PLAN-35 implementation must wire its dedicated DB-backed spec into the DB/release QA harness; the
existing login-only DB spec is insufficient. Evidence must include:

- clean migration and double-seed durability,
- five-role authorization matrix,
- concurrent appointment writer outcome,
- manual-case replay/rollback,
- contact/notification state changes,
- role update persistence,
- safe admin-user DTO/session/final-Super-Admin invariants,
- appointment query-plan/contention evidence.

If `DATABASE_URL` is missing, record `BLOCKED: DB environment unavailable`; do not record pass.

## 8. Browser and visual gate (G35-8)

Run the dedicated planned specs through the existing server harness:

```powershell
node scripts/run-playwright-with-server.mjs tests/e2e/plan35-admin-operations.spec.ts
node scripts/run-playwright-with-server.mjs tests/e2e/plan35-db-backed.spec.ts
```

Capture sanitized artifacts for all five viewports and the full nineteen-route/five-role matrix.
Required assertions include no
console error, no unexpected failed request, deterministic outcomes, valid drill-down links, mobile
menu semantics, and no horizontal overflow.

## 9. Live acceptance gate (G35-8 live)

Live smoke is read-only in production. Full mutations run only against staging or a disposable DB.
Set credentials outside the repository:

```text
KMT_LIVE_BASE_URL
KMT_LIVE_ADMIN_EMAIL
KMT_LIVE_ADMIN_PASSWORD
```

Run the repository live-admin spec after it has been hardened by the accepted tasks. Every visit
must assert `200` or a documented redirect/outcome; merely receiving a status below 500 is not
acceptance.

Missing credentials means `SKIPPED` for an informational run and `BLOCKED` for release acceptance.
Neither is `LIVE-ACCEPTED`.

## 10. Evidence record

For every gate record:

| Field | Required value |
|---|---|
| Commit | Exact tested commit SHA |
| Environment | local, disposable DB, staging, or production read-only |
| Command | Exact command without secrets |
| Result | PASS, FAIL, BLOCKED, or SKIPPED |
| Scope | Task IDs and user stories covered |
| Artifact | Sanitized log/screenshot/report path |
| Time | Cairo timestamp |

Allowed feature states progress only as evidence exists:

```text
Planned -> Implemented -> Local-Verified -> DB-Verified -> Browser-Verified -> Live-Accepted
```

`Blocked`, `Skipped`, and `Deferred` are annotations, never substitutes for the next verified state.

## 11. Converge and handoff (G35-9)

- Rerun Spec Kit analyze against the implemented artifacts.
- Run converge until it produces no additional task.
- Update the affected platform OpenAPI/data/test plans and release checklist to match implementation.
- Update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md` only to the highest evidenced state.
- Keep the master platform task as one PLAN-35 roll-up; check feature tasks only here.
- Commit and push only after all claimed gates pass.

Production deployment remains the repository aaPanel + PM2 update workflow documented in
`docs/SERVER_COMMANDS.md`; never use `npm run dev` as a production process.
