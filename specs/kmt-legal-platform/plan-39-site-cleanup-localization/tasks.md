# Tasks: Site Cleanup, Contact Alerts, and Client Localization

**Input**: Design documents from
`specs/kmt-legal-platform/plan-39-site-cleanup-localization/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/api.md`, `contracts/routes.md`, `quickstart.md`

**Tests**: Contract, permission, privacy, injected-failure, route, localization, responsive,
accessibility, and browser tests precede or accompany the implementation they protect.

**Organization**: Tasks are grouped by independently testable user story. Root owns all files and
task check-off; no worker sessions or parallel implementation lanes are used.

## File Conflict Control

- `.specify/**`, this feature directory, the master task list, implementation status, and project
  guide remain root-only and sequential.
- `src/lib/legal-format.ts`, `src/lib/auth-routing.ts`, `src/lib/public-locale.ts`,
  `src/lib/ui-copy.ts`, `package.json`, `next.config.mjs`, and `src/middleware.ts` each have one
  sequential owner.
- Client route moves complete before page localization edits.
- `.playwright-mcp/` and unrelated worktree content are excluded.

## Phase 1: Setup and Planning Registration

**Purpose**: Lock the accepted scope and active feature without changing application behavior.

- [x] T001 Register PLAN-39 in `specs/kmt-legal-platform/tasks.md` and preserve PLAN-38's open deployment evidence without marking it complete
- [x] T002 Validate constitution v1.1.0, both PLAN-39 requirement checklists, active feature pointer, and all design contracts in `.specify/feature.json` and `specs/kmt-legal-platform/plan-39-site-cleanup-localization/`

**Checkpoint**: Planning artifacts are complete and implementation scope is fixed.

---

## Phase 2: Foundational Tests and Locale Contracts

**Purpose**: Establish failing/guarding tests for shared contracts before implementation.

- [x] T003 Add locale normalization, catalog parity, locale-aware format, and client-copy guard tests in `tests/lib/client-localization.test.ts`
- [x] T004 Add retired route/auth/cache/manifest contract expectations in `tests/server/auth-routing.test.ts`, `tests/server/route-manifest.test.ts`, and `tests/server/public-locale.test.ts`
- [x] T005 Add canonical client profile and self-only preference endpoint contract tests in `tests/server/portal-access.test.ts`
- [x] T006 Add signed account-setup locale inheritance and conflicting-locale rejection tests in `tests/server/client-account-setup.test.ts`

**Checkpoint**: Shared localization, route, profile, preference, and setup contracts are protected.

---

## Phase 3: User Story 1 - Office Receives Contact Alerts (Priority: P1) MVP

**Goal**: Save every accepted inquiry and notify only active authorized staff without exposing
visitor data or coupling message success to notification delivery.

**Independent Test**: Submit a synthetic contact message, inspect inbox persistence and the
recipient matrix, inject alert failure, and advance timers for the open bell.

### Tests for User Story 1

- [x] T007 [US1] Add recipient, deduplication, privacy, wildcard, inactive-role, and zero-recipient tests in `tests/server/admin-notifications.test.ts`
- [x] T008 [US1] Add accepted-message and injected-alert-failure tests in `tests/server/contact-message-service.test.ts`
- [x] T009 [US1] Add open-refresh, visible 30-second polling, hidden-document, unchanged-count, and cleanup tests in `tests/ui/admin-notification-center.test.tsx`

### Implementation for User Story 1

- [x] T010 [US1] Add centralized contact-alert Arabic copy and contact notification writer in `src/lib/ui-copy.ts` and `src/server/admin/notification-service.ts`
- [x] T011 [US1] Add privacy-safe best-effort alert delivery after durable contact creation in `src/server/contact/contact-message-service.ts`
- [x] T012 [US1] Add open/visibility-aware bounded refresh behavior in `src/features/admin/notifications/admin-notification-popover.tsx`

**Checkpoint**: US1 tests pass and the existing contact response/inbox lifecycle is unchanged.

---

## Phase 4: User Story 2 - Retired Routes and Branded 404 (Priority: P1)

**Goal**: Remove obsolete runtime surfaces and recover from every invalid route with a branded
genuine 404 while preserving product-used assets.

**Independent Test**: Request root/nested paths from all retired families and an arbitrary
unknown URL while signed out; inspect status, location, content, and public hero assets.

### Tests for User Story 2

- [x] T013 [US2] Replace product-system and Stitch fallback coverage with retired-route and real-product coverage in `tests/e2e/mvp-smoke.spec.ts`, `tests/e2e/plan35-admin-operations.spec.ts`, `tests/e2e/select-rtl-spacing.spec.ts`, and `tests/ui/admin-ui-convergence.test.tsx`
- [x] T014 [US2] Add branded global 404 status, recovery-link, no-login-redirect, responsive, keyboard, and preserved-Stitch-asset browser coverage in `tests/e2e/retired-routes-and-404.spec.ts`

### Implementation for User Story 2

- [x] T015 [US2] Delete all `/portal` page aliases and dead navigation under `src/app/(app-ar)/portal/`
- [x] T016 [US2] Delete product-system routes/demo and clone runtime routes under `src/app/(app-ar)/product-system/` and `src/app/(install-ar)/stitch-clone/`
- [x] T017 [US2] Remove clone/product-only capture, generation, comparison commands and snapshots from `scripts/`, `tests/e2e/stitch-clone.spec.ts`, and `package.json` while preserving `scripts/localize-stitch-assets.mjs`
- [x] T018 [US2] Remove retired path and flag handling from `src/middleware.ts`, `src/lib/auth-routing.ts`, `src/lib/public-locale.ts`, `src/server/config/production-readiness.ts`, `next.config.mjs`, `scripts/start-local-server.mjs`, and `scripts/cloudflare-public-cache-rule.mjs`
- [x] T019 [US2] Enable global not-found handling and add the token-based bilingual KMT page in `next.config.mjs`, `src/app/global-not-found.tsx`, and `src/content/not-found-content.ts`
- [x] T020 [US2] Update route/cache/startup/server contract tests and delete obsolete snapshots in `tests/` without changing `/stitch-assets` availability

**Checkpoint**: US2 tests pass; all retired route families are absent and public imagery remains.

---

## Phase 5: User Story 3 - Client Chooses Arabic or English (Priority: P2)

**Goal**: Render every client/login surface in the account locale, persist self-owned language
changes, and inherit the signed booking locale for new accounts.

**Independent Test**: Use Arabic and English synthetic client sessions across every `/client`
destination, switch language, reload/re-authenticate, and verify own-data authorization.

### Tests for User Story 3

- [x] T021 [US3] Add profile-route rename, preference validation/ownership/audit, and old-API 404 tests in `tests/server/portal-access.test.ts`
- [x] T022 [US3] Add shell/navigation/profile/upload/assistant/team-chat Arabic/English and safe-error component tests in `tests/ui/product-components.test.tsx`
- [x] T023 [US3] Add authenticated Arabic/English client-route, document direction, persistence, 390px overflow, keyboard, and console/network browser scenarios in `tests/e2e/client-localization.spec.ts`

### Implementation for User Story 3

- [x] T024 [US3] Add the typed client Arabic/English catalog, locale normalizer, status maps, client-guard copy, error-code copy, and optional locale format parameters in `src/content/client-content.ts`, `src/server/auth/client-portal-guard.ts`, and `src/lib/legal-format.ts`
- [x] T025 [US3] Move the profile handler to `src/app/api/client/profile/route.ts`, add strict self-only preferences at `src/app/api/client/preferences/route.ts`, and extend `src/server/portal/client-portal-service.ts`
- [x] T026 [US3] Persist the confirmed booking locale with an additive guarded migration, sign and
  propagate it, and move setup into a locale-aware root through `prisma/schema.prisma`,
  `prisma/migrations/`, `src/server/portal/client-account-setup-service.ts`,
  `src/server/consultations/{consultation-service,consultation-assistant-service}.ts`,
  `src/server/payments/payment-service.ts`, `src/features/public-site/client-account-setup-form.tsx`,
  and the public account-setup route groups
- [x] T027 [US3] Move `/client` pages into `src/app/(client)/client/` and add `src/app/(client)/layout.tsx` with session-locale document semantics and existing readiness behavior
- [x] T028 [US3] Localize shell navigation and add the accessible preference switch in `src/app/(client)/client/client-navigation.ts`, `src/components/layout/client-site-shell.tsx`, and `src/features/client/client-language-switch.tsx`
- [x] T029 [US3] Localize profile and upload forms, canonical API/error handling, and locale-aware select copy in `src/features/portal/profile-form.tsx` and `src/features/portal/document-upload-form.tsx`
- [x] T030 [US3] Localize dashboard, cases list/detail, and their metadata/formatting in `src/app/(client)/client/page.tsx` and `src/app/(client)/client/cases/`
- [x] T031 [US3] Localize appointments, files, payments, and profile pages in `src/app/(client)/client/court-dates/page.tsx`, `src/app/(client)/client/files/page.tsx`, `src/app/(client)/client/payments/page.tsx`, and `src/app/(client)/client/profile/page.tsx`
- [x] T032 [US3] Localize assistant/team-chat requests, quick actions, result cards, polling errors, dates, and safe fallbacks in `src/features/client/client-assistant-panel.tsx`, `src/features/client/client-team-chat-panel.tsx`, and `src/app/(client)/client/assistant/page.tsx`
- [x] T033 [US3] Localize the shared login gateway and preserve `next` plus locale during switching in `src/app/(login)/login/page.tsx`, `src/features/auth/login-form.tsx`, and `src/content/auth-content.ts`

**Checkpoint**: US3 static, component, server, and browser tests pass for Arabic and English.

---

## Phase 6: User Story 4 - Consistent Arabic Staff Copy (Priority: P3)

**Goal**: Keep touched staff messaging centralized and prevent raw internal values from appearing.

**Independent Test**: Render contact alerts, bell/center failure states, and touched protected
recovery states with approved Arabic copy and no raw permission/provider/database messages.

- [x] T034 [US4] Centralize touched staff notification/contact/recovery labels and accessible names in `src/lib/ui-copy.ts` and `src/features/admin/notifications/admin-notification-popover.tsx`
- [x] T035 [US4] Add touched-admin copy and raw-value regression assertions in `tests/ui/admin-notification-center.test.tsx`, `tests/ui/admin-contact-message-inbox.test.tsx`, and `tests/server/admin-notifications.test.ts`

**Checkpoint**: US4 tests pass; staff remains Arabic and protected errors remain safe.

---

## Phase 7: Polish, Documentation, and Release Evidence

**Purpose**: Remove stale references, prove the complete slice, and leave durable handoff truth.

- [x] T036 Audit public Arabic/English text and image alternatives touched by this change in `src/content/public-content.*.ts`, `src/features/public-site/`, and focused locale tests; fix only verified PLAN-39 regressions
- [x] T037 Remove active `/portal`, `/product-system`, `/stitch-clone`, obsolete command, and `ENABLE_STITCH_CLONE` references from current contracts/runbooks/config examples while marking historical plan docs superseded in `docs/` and `specs/kmt-legal-platform/`
- [x] T038 Update `docs/PROJECT_GUIDE.md`, `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, master `specs/kmt-legal-platform/tasks.md`, and `AGENTS.md` with actual PLAN-39 behavior and verification
- [x] T039 Run focused tests, `db:validate`, `db:generate`, typecheck, lint, full tests, production build, browser flows, route/asset checks, secret scan, and `git diff --check` per `quickstart.md`
- [x] T040 Run available synthetic DB-backed/staging checks and record any unavailable external gate as BLOCKED or DEFERRED rather than PASS in `specs/kmt-legal-platform/plan-39-site-cleanup-localization/tasks.md`
- [x] T041 Run Spec Kit analyze after implementation drift review, execute Converge, complete any appended tasks, and repeat until `tasks.md` remains unchanged
- [ ] T042 Review final diff, preserve `.playwright-mcp/`, commit, push `main`, hand off aaPanel/PM2 commands, and perform read-only live health/404/client-redirect/asset smoke

---

## Dependencies & Execution Order

- T001 → T002 → T003–T006 → user-story phases.
- US1 and US2 are both P1 but execute sequentially in this task: T007–T012 → T013–T020.
- US3 depends on route retirement and locale foundation: T021–T033 after T020.
- US4 depends on shared copy and notification work: T034–T035 after T012 and T024.
- T036–T042 depend on all selected user stories.
- Test tasks in each story precede the corresponding implementation tasks.

## Implementation Strategy

1. Register and analyze accepted artifacts.
2. Deliver durable permission-based contact alerts first.
3. Retire obsolete routes/tooling and establish branded 404 behavior.
4. Establish locale/storage/contracts, then move and localize client pages.
5. Centralize touched staff copy and audit public regressions.
6. Run full local and available DB/browser gates.
7. Converge to zero new tasks, update durable docs, commit/push, deploy, and read-only smoke.

## Implementation Evidence

Evidence is appended here as each phase completes. A skipped or unavailable DB/staging/live check
is never recorded as PASS.

- 2026-07-28 — US1 focused evidence: `vitest` passed the contact recipient/privacy,
  durable-save-on-alert-failure, and notification bell refresh suites (14 tests).

### Planning gate

- Constitution: v1.1.0, validated with no unresolved placeholders.
- Requirements checklist: 15/15 PASS.
- Delivery checklist: 20/20 PASS.
- Analyze: 19 functional requirements, 9 success criteria, and 42 tasks with 100% mapped
  coverage; zero unresolved CRITICAL, HIGH, or MEDIUM findings.
- Scope-change re-analysis: the discovered delayed-payment locale durability gap is resolved by
  T026's additive migration; FR-014, the data model, research, checklist, and plan are aligned.
  Coverage remains 100% with zero unresolved CRITICAL, HIGH, or MEDIUM findings.

### Local implementation and verification

- 2026-07-28 — Prisma schema validation and client generation passed.
- 2026-07-28 — Typecheck, warning-free lint, secret scan, and `git diff --check` passed.
- 2026-07-28 — Full Vitest passed: 61 files and 437 tests.
- 2026-07-28 — The guarded production build passed with
  `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`. The first unguarded attempt stopped during page-data
  collection because this workspace has no `DATABASE_URL`; it was not reclassified as an
  application failure.
- 2026-07-28 — Browser smoke passed 46 checks. The focused retired-route/global-404 suite passed
  9 checks, including nested retired paths, mobile keyboard/overflow, and a preserved product-used
  Stitch asset. The public bilingual login browser scenario passed.
- 2026-07-28 — The authenticated client locale-persistence scenario is authored but safely skipped
  unless both `DATABASE_URL` and `PLAN39_ALLOW_DB_FIXTURES=true` are present.
- 2026-07-28 — The aaPanel/PM2 deployment verifier now checks representative retired-route 404s
  and a product-used `/stitch-assets` image. Its embedded JavaScript syntax check passed; a local
  POSIX shell parser was unavailable because Windows Subsystem for Linux access is disabled.

### External evidence state

- `DEFERRED` — No authorized disposable/staging PostgreSQL `DATABASE_URL` was available, so the
  additive consultation-locale migration, synthetic contact recipient matrix, saved client-locale
  reload/new-session flow, and upload/download runtime were not executed against a database.
- `DEFERRED` — No server control channel was available in this workspace. Deployment and
  post-deploy PM2 stability remain open until the pushed revision is pulled by aaPanel.
- `DEFERRED` — Read-only production acceptance remains separate from local evidence and does not
  become `PASS` until the pushed revision is deployed.

### Post-implementation analysis and convergence

- Analyze rechecked 19 functional requirements, 9 success criteria, 42 implementation tasks, the
  four user stories, and constitution obligations. Coverage remains 100%; there are zero unresolved
  CRITICAL, HIGH, or MEDIUM findings.
- Converge found zero missing, partial, contradictory, or unrequested implementation gaps in the
  accepted scope. It appended no task, and the task file hash remained unchanged during the
  convergence assessment.

---

## Phase 8: Production Backup Client Compatibility Remediation

**Purpose**: Remove the observed PostgreSQL 18 server / PostgreSQL 16 dump-client deployment
blocker without weakening the mandatory pre-migration backup.

- [x] T043 Add deterministic PostgreSQL server/client-major selection, explicit override,
  older-only failure, and matching restore-pair tests in
  `tests/server/postgres-backup-tool-resolution.test.ts`
- [x] T044 Implement fail-closed compatible `pg_dump`/`pg_restore` discovery and use the selected
  pair for archive creation/validation in `deploy/install/postgres-backup-tools.sh` and
  `deploy/install/aapanel-pm2-update.sh`
- [x] T045 Update `docs/SERVER_COMMANDS.md`, `docs/PROJECT_GUIDE.md`,
  `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, and release checks with the PostgreSQL client
  prerequisite and recovery command
- [x] T046 Run focused/full tests, Git Bash syntax validation, secret/diff checks, re-run Analyze
  and Converge, preserve `.playwright-mcp/`, commit, and push `main`

### Scope-change planning gate

- 2026-07-28 — Production evidence showed PostgreSQL server 18.0 and default `pg_dump` 16.14.
- Constitution v1.1.0 remains applicable and unchanged.
- Clarify found no blocking ambiguity: backup remains mandatory, the script may discover but not
  install tools, and a bad explicit override fails closed.
- FR-020, SC-010, Decision 12, the deployment contract, quickstart, and CHK021–CHK023 define the
  accepted remediation before implementation.

### Remediation evidence

- Focused deployment/security characterization passed 25 tests across 3 files; the full suite
  passed 443 tests across 62 files.
- Typecheck, lint, the guarded production build, both Git Bash syntax checks, secret scan, and
  `git diff --check` passed.
- Analyze rechecked 20 functional requirements, 10 success criteria, 46 tasks, the four user
  stories, and all five constitution principles with zero unresolved CRITICAL, HIGH, or MEDIUM
  findings.
- Converge found zero missing, partial, contradictory, or unrequested gaps for the accepted
  remediation and left the task file byte-for-byte unchanged during assessment.
- The existing `.playwright-mcp/` directory remained untracked and untouched. Server runtime
  deployment evidence remains deferred until the fixed revision is pulled and executed.
