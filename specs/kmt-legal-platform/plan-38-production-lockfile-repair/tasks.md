# Tasks: Production Lockfile Repair

**Input**: Design documents from `specs/kmt-legal-platform/plan-38-production-lockfile-repair/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/deployment-evidence.md`, `quickstart.md`

**Tests**: The risk-based gate is a clean `npm ci`, followed by typecheck and production build. Live acceptance remains a post-push server operation.

**Organization**: One P1 operator story and one sequential file-ownership lane.

## File Conflict Control

- Root owns all planning/status artifacts and task check-off.
- `package-lock.json` has one sequential owner.
- No task is marked `[P]`; later tasks consume evidence from earlier tasks.
- `.playwright-mcp/` and any unrelated worktree changes are excluded.

## Phase 1: Setup and Baseline

**Purpose**: Lock the resolver version and pre-change boundaries.

- [x] T001 Record npm 11.6.2, supported Node.js, current manifest/lock status, and the production `npm ci` failure evidence in `specs/kmt-legal-platform/plan-38-production-lockfile-repair/tasks.md`
- [x] T002 Confirm `package.json` dependency intent and `deploy/install/aapanel-pm2-update.sh` remain unchanged before editing `package-lock.json`

**Checkpoint**: The repair boundary and authoritative resolver are fixed.

---

## Phase 2: User Story 1 - Deterministic production install (Priority: P1) MVP

**Goal**: Produce an npm-owned synchronized lockfile that passes clean install and build without changing application behavior.

**Independent Test**: npm 11.6.2 accepts `npm ci`, does not rewrite the repaired lockfile, and the production build completes.

- [x] T003 [US1] Regenerate npm resolution metadata with `npm.cmd install --package-lock-only` in `package-lock.json`
- [x] T004 [US1] Review `package.json` and `package-lock.json` diffs, rejecting direct dependency/version/script/override changes outside `package-lock.json`
- [x] T005 [US1] Run `npm.cmd ci` and prove it leaves `package-lock.json` unchanged
- [x] T006 [US1] Run `npm.cmd run typecheck` and a database-independent `npm.cmd run build`, recording results in `specs/kmt-legal-platform/plan-38-production-lockfile-repair/tasks.md`

**Checkpoint**: The production install/build blocker is locally verified as repaired.

---

## Phase 3: Delivery Evidence and Handoff

**Purpose**: Register the focused repair without claiming live acceptance prematurely.

- [x] T007 Register PLAN-38 and its local verification state in `specs/kmt-legal-platform/tasks.md`
- [x] T008 Record PLAN-38 scope, verification, and pending live health/sitemap gate in `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`
- [x] T009 Run `git diff --check`, review the final scoped diff, and record the clean result in `specs/kmt-legal-platform/plan-38-production-lockfile-repair/tasks.md`

**Checkpoint**: Repository work is ready to commit/push; server deployment and live acceptance follow the deployment evidence contract.

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009
- No parallel work is permitted because each task depends on the exact state/evidence from the preceding task.

## Implementation Strategy

1. Establish the pre-change evidence and protected boundaries.
2. Regenerate only npm-owned lock metadata.
3. Prove clean install, lock stability, typecheck, and build.
4. Register truthful `Local-Verified` status.
5. Commit and push through the repository rule.
6. Deploy with the existing aaPanel/PM2 script.
7. Advance to live accepted only after release, health, and sitemap checks pass.

## Implementation Evidence

### Baseline

- npm: `11.6.2` (matches `packageManager`)
- Node.js: `v24.11.1` (within the declared supported range)
- Production failure: `npm ci` rejected the committed lock as missing `@emnapi/core@1.11.3` and `@emnapi/wasi-threads@1.2.3`.
- `package.json`: clean before repair.
- `deploy/install/aapanel-pm2-update.sh`: unchanged and confirmed to use `npm ci --include=dev` plus the existing PM2/public verification workflow.

### Lockfile repair and local verification

- `npm.cmd install --package-lock-only`: PASS.
- Generated diff: 23 inserted lines in `package-lock.json` only, adding the exact missing optional records `@emnapi/core@1.11.3` and nested `@emnapi/wasi-threads@1.2.3`.
- `package.json` diff: none.
- `npm.cmd ci`: PASS; 675 packages installed and no additional lockfile change was introduced.
- `npm.cmd run typecheck`: PASS.
- `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm.cmd run build`: PASS; Next.js compiled and generated all 72 static pages.
- npm audit warnings were observed but intentionally not auto-fixed because dependency upgrades are outside PLAN-38 and `npm audit fix` would change the accepted dependency scope.

### Final repository review

- `git diff --check`: PASS.
- `package.json`: unchanged.
- `deploy/install/aapanel-pm2-update.sh`: unchanged.
- Scoped implementation change: `package-lock.json` only; remaining tracked changes are Spec Kit/status evidence.
- Unrelated `.playwright-mcp/` content remains untracked and excluded.
