# Implementation Plan: Admin Operations Remediation

**Branch**: `main` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: The accepted PLAN-35 feature specification and the 2026-07-21 dashboard,
backend, UI/UX, contract, test, and status-document audits.

**Delivery mode**: Implementation is active for explicitly accepted task IDs. The workstation has
no disposable PostgreSQL target and the user declined local database installation, so local code
and non-DB verification may continue while database-dependent evidence remains open and cannot
support a story, DB-verified, release, or production-complete claim.

## Summary

PLAN-35 closes the operational gaps in the protected Arabic admin workspace without redesigning
unrelated product areas. The implementation first establishes shared authorization scopes,
permission metadata, minimized DTOs, and transaction-safe appointment conflict handling. It then
adds permission-aware navigation, contact and notification queues, manual case create/edit,
role-permission governance, safe admin-user/session behavior, and a role-aware command center. The final phases consolidate
accessibility/localization states and require database-backed, role-based, responsive, contract,
and live evidence before any production-complete claim.

No new framework, charting library, persistent entity, or deployment platform is planned. The
existing Next.js, Prisma/PostgreSQL, RBAC, audit, Arabic copy, design-token, UI primitive, Vitest,
and Playwright systems remain authoritative.

## Technical Context

**Language/Version**: TypeScript 5.7, Node.js runtime supported by the repository, React 18.2

**Primary Dependencies**: Next.js 15.5.20 App Router, Prisma 7.8, Zod, Tailwind CSS 3.4

**Storage**: PostgreSQL through Prisma; existing `Role`, `Permission`, `RolePermission`, `User`,
`Session`, `Appointment`, `Task`, `LegalCase`, `ContactMessage`, `Notification`, `SystemSetting`, and `AuditLog`
models

**Testing**: Vitest 4.1.9, Testing Library, Playwright 1.51.1, and Prisma-backed integration fixtures;
DB-backed execution is deferred until an isolated PostgreSQL target exists

**Target Platform**: Responsive browsers at 390px and desktop widths; Linux aaPanel + PM2
production deployment

**Project Type**: Full-stack Next.js web application with server-rendered admin pages and Route
Handler APIs

**Performance Goals**: Keep each dashboard queue purpose-built and bounded; return at most six
priority rows per queue; render permitted useful content even if one optional widget fails; avoid
new client-side data or chart frameworks

**Constraints**: Arabic RTL admin, server-side authorization remains authoritative, no secrets or
server paths become editable UI settings, no public/client/payment/Stitch behavior changes, no
skipped check may satisfy an acceptance gate, and the production-connected database is never used
for migration, seed, mutation, or concurrency verification

**Scale/Scope**: Eight user stories, nineteen admin destination IDs, twenty-three affected API methods,
five staff-role acceptance personas, and the existing production PostgreSQL deployment; acceptance
verification requires a separate disposable PostgreSQL target

## Constitution Check

### Before Phase 0 research

- **PASS — Spec Kit gate**: `spec.md`, clarification review, and `checklists/requirements.md` are
  complete with no unresolved clarification marker.
- **PASS — Existing-system gate**: The plan cites inspected RBAC, dashboard, case/calendar,
  consultation booking, notification, contact-message, governance, UI primitive, and test code.
- **PASS — Connected-impact gate**: UI, API/service, data, auth, messages, tests, docs, and
  deployment impacts are mapped below; protected out-of-scope surfaces are explicit.
- **PASS — Correctness gate**: Shared scope helpers, route policy metadata, minimized DTOs,
  transaction isolation, stable error semantics, audit behavior, and idempotency are defined before
  consumer UI phases.
- **PASS — Quality gate**: Focused, contract, database, browser, responsive, RTL, accessibility,
  and live evidence are required in the quickstart and tasks. Local implementation may proceed
  without a disposable DB only because FR-035 keeps every DB-dependent task and acceptance boundary
  explicitly open rather than counting it as passed.
- **PASS — Conflict-control gate**: Shared-file lanes and sequential boundaries are explicit below.

### After Phase 1 design

- **PASS — Contract traceability**: [contracts/admin-operations-contract.md](./contracts/admin-operations-contract.md)
  identifies every affected method, permission, response family, consumer, and planned addition.
- **PASS — Data discipline**: [data-model.md](./data-model.md) reuses existing persistent entities;
  a Prisma schema change requires a specification change and a new migration review.
- **PASS — Decision closure**: [research.md](./research.md) resolves appointment serialization,
  notification counting, role immutability, storage truthfulness, route policy, and task registration.
- **PASS — Reproducibility**: [quickstart.md](./quickstart.md) separates local, DB-backed, browser,
  live, skipped, blocked, and user-approved local-only implementation evidence.
- **PASS — Parallel safety**: No task marked `[P]` may touch the same file or an upstream contract
  used by another simultaneous task.

## Project Structure

### Documentation for this feature

```text
specs/kmt-legal-platform/plan-35-admin-operations-remediation/
|-- spec.md
|-- plan.md
|-- analyze.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- admin-operations-contract.md
|-- checklists/
|   |-- requirements.md
|   `-- delivery.md
`-- tasks.md
```

### Source code affected during implementation

```text
prisma/
|-- schema.prisma                         # inspected; no change currently planned
|-- seed.mjs                              # bootstrap durability behavior
`-- migrations/*_plan_35_admin_operations/ # planned data-only permission migration

src/
|-- app/(app-ar)/admin/
|   |-- layout.tsx                        # planned nonvisual authenticated access context
|   |-- {loading,error,not-found}.tsx
|   |-- page.tsx
|   |-- admin-navigation.ts
|   |-- cases/page.tsx
|   |-- cases/[caseId]/page.tsx
|   |-- cases/new/page.tsx                # planned
|   |-- contact-messages/page.tsx         # planned
|   |-- notifications/page.tsx            # planned
|   |-- roles/page.tsx                    # planned
|   |-- settings/page.tsx
|   |-- users/page.tsx
|   `-- users/[userId]/page.tsx
|-- app/api/auth/{login,me}/route.ts
|-- app/api/admin/
|   |-- dashboard/route.ts
|   |-- cases/route.ts
|   |-- cases/[caseId]/route.ts
|   |-- consultations/[consultationId]/assign/route.ts
|   |-- contact-messages/route.ts
|   |-- contact-messages/[messageId]/route.ts
|   |-- notifications/route.ts
|   |-- notifications/[notificationId]/read/route.ts
|   |-- roles/route.ts                    # planned
|   |-- roles/[roleId]/permissions/route.ts # planned
|   |-- users/route.ts
|   |-- users/[userId]/route.ts
|   |-- settings/route.ts
|   `-- settings/[key]/route.ts
|-- components/
|   |-- layout/{dashboard-shell,dashboard-shell-view,dashboard-navigation,dashboard-mobile-nav,admin-shell-state}.tsx
|   `-- ui/{button,badge,data-table,field,filter-bar,inline-feedback,search-input,skeleton,state,toast}.tsx
|-- features/admin/
|   |-- dashboard/                        # planned bounded dashboard components
|   |-- cases/{case-action-forms,manual-case-form}.tsx
|   |-- contact-messages/contact-message-inbox.tsx # planned
|   |-- notifications/
|   |-- governance/
|   `-- shell/admin-access-context.tsx     # planned safe filtered access context
|-- lib/
|   |-- admin-route-policy.ts             # planned canonical route registry
|   |-- design-system/tokens.ts
|   `-- ui-copy.ts
`-- server/
    |-- admin/{dashboard,case-operations,contact-message,manual-case,notification,governance,role-permission}-service.ts
    |-- appointments/appointment-conflict-service.ts # planned shared helper
    |-- auth/{auth-service,policy,session-store}.ts
    |-- auth/policy-data.json
    |-- consultations/consultation-assistant-service.ts
    |-- storage/{runtime-diagnostic,upload-policy,vps-storage,malware-scan}.ts
    `-- http/errors.ts

tests/
|-- fixtures/plan35-*                     # deterministic role/DB/auth helpers
|-- server/                               # focused policy/service/contract/security tests
|-- ui/                                   # component and accessibility contracts
`-- e2e/                                  # DB-backed and role/responsive browser flows
```

**Structure Decision**: Preserve the existing full-stack Next.js layout. New files are feature or
policy modules inside current boundaries. No second frontend/backend package and no parallel design
system are introduced.

## Connected Impact Map

| Workstream | Changes | Direct consumers | Protected or downstream impact | Required evidence |
|---|---|---|---|---|
| Permission catalog | Add `case.create.any`; grant own-notification access; preserve empty assignments and inactive role status after bootstrap | Guards, handlers, navigation, role matrix | Migration/seed/session load/contracts | Double-seed, empty-role, inactive-role, allowed/denied matrix |
| Canonical scopes | Export and reuse case/task/appointment/consultation/document/contact scopes | Dashboard and destination services | KPI counts, queues, drill-down links | Cross-surface fixture assertions |
| Appointment conflicts | Shared overlap predicate, symmetric unassigned-public protection, and writer-specific serializable policy | Public booking, admin create/reschedule, consultation assignment/conversion | Concurrency, audits, payment-provider side effects, query contention | Boundary/order, transaction-local reread, exactly-one provider call, rollback, DB `EXPLAIN` |
| Admin route policy | One registry for label, icon, group, active matching, and permission predicate | Shell navigation, mobile menu, dashboard actions, route tests | Direct URL/API remains server guarded | Five-role route matrix |
| Contact workflow | Atomic conditional inbox transitions and exact audit plus page/API extensions | Dashboard queue, navigation, operator actions | Contact PII, concurrency, audit rollback | Search/filter/page, race/idempotency/audit tests |
| Notification workflow | Complete cursor projection over generic/review work with safe scoped hrefs | Bell, center, dashboard count | Dedupe beyond preview, permission/object reassignment | Count/page/link-scope/idempotency tests |
| Manual cases | POST/PATCH schemas, hash-bound replay, audited forms/edits | Case list/detail and client history | File reference, client/assignee scope, retries | Actor/token/hash replay, assigned-transfer denial, audit rollback |
| Role governance | Read/update matrix APIs and UI | Persisted authorization and audit | Protected/inactive roles, seed durability | Atomic/stale/inactive/fresh-session tests |
| Admin-user/session hardening | Explicit safe DTOs, protected target subset, active-principal login/session checks and revocation | User pages/APIs, auth login/me, every session-backed guard | Credential secrecy, escalation, final Super Admin | Secret absence, delegated denial, concurrent final-Super, revoked-session tests |
| Command center | Exact versioned DTO, Cairo cutoffs, deterministic queues and resilient widgets | Admin home and drill-down modules | Partial errors must not blank page | DTO union/order/href and widget-failure tests |
| Shared UI | Accessible primitive contract, safe shell context, native dialog mobile nav, domain composites | Every touched admin form/table/boundary | Keyboard, screen reader, RTL, overflow | UI contracts and five-viewport Playwright |
| Runtime diagnostics | One-shot root/scanner derivation and settings wrapper excluding legacy storage row | Settings API/page and readiness | No path/secret leak or environment mutation claim | Root/scanner matrix, bounded ping, full-JSON redaction |
| Release truth | Align contracts, master pointer, status labels, evidence report | Maintainers and deployment owner | No skip presented as pass | Full quickstart and docs drift checks |

## Delivery Phases and Dependencies

### Phase 0 — Planning and source-of-truth registration

Register this feature once in the master task list, align the status/index documents, and preserve
PLAN-35 as the only detailed task source. Dependency: none. Product code remains untouched.

### Phase 1 — Shared correctness foundations

Add characterization tests and then establish the permission catalog/bootstrap, route-policy
metadata, stable Arabic error/copy/audit contracts, accessible shared primitives, bidirectional
contract inventory, and deterministic role/DB/browser fixtures. All later product phases depend on
this phase's locally verified contracts; T019 stays expected-red until shell convergence. T016 is
an external DB-evidence task, remains open, and blocks DB verification/release rather than local
code execution. Production data is never an acceptable substitute.

### Phase 2 — Trusted operational scopes and scheduling (US1)

Make dashboard/task/calendar visibility consistent and move public/admin appointment writers onto
the shared serializable conflict mechanism, including consultation assignment/conversion and
symmetric unassigned public reservations. Depends on Phase 1. Public payment, consultation, and
admin calendar writers are edited sequentially with writer-specific retry rules. T024–T027 and
T029–T038 may be implemented and locally verified without a database; T028 and the DB portion of
T039 remain open, so the US1 checkpoint cannot be accepted until isolated PostgreSQL evidence exists.

### Phase 3 — Permission-aware workspace (US2)

Derive desktop/mobile navigation, page availability, dashboard composition, and recovery states
from the route policy while retaining direct server guards. This phase accepts the fifteen already
implemented route IDs and proves the four planned IDs remain absent. Contact/notification, case
create, and roles entries activate only after their later page/API lanes; T091 runs the complete
nineteen-by-five matrix before Phase 7. Depends on the permission and route registry work in Phase 1.

### Phase 4 — Contact and notification queues (US3)

Complete contact triage and unified notification workflows over existing models and APIs. Depends
on Phase 3 navigation and Phase 1 permission/count contracts. Contact and notification files form
separate implementation lanes and may proceed in parallel after their shared contract is frozen.
Under FR-035, T053–T056 and T058–T067 may be implemented and locally verified after the US2 local
shell/policy lane is green even while authenticated T042/T052 evidence is unavailable. T057 may be
authored collection-safe, but its authenticated journey and T068 remain open until a disposable
PostgreSQL target and safe persona storage states exist; US3 cannot be checkpoint-accepted before
those cells pass.

### Phase 5 — Manual case create/edit (US4)

Add atomic, audited case create/edit service and route behavior, then wire forms and connected
list/detail/client-history refresh. Depends on `case.create.any`, canonical case scope, and shared
message/form foundations. Replay is actor/token/request-hash bound; assigned-only actors cannot
transfer a case.

### Phase 6 — Role and permission governance (US5)

Add exact-Super-Admin-only role governance plus safe admin-user DTOs, delegated permission ceilings,
active-principal login/session enforcement, affected-session revocation, and concurrent final-Super
protection. Depends on the canonical permission catalog and Auth/RBAC handoff. Must complete before
final five-role browser acceptance because it changes authorization fixtures and consumers.

### Phase 7 — Role-aware command center (US6)

Compose bounded priority queues, direct authorized actions, metric definitions, and independent
widget fallbacks from the stabilized services, then expose exact one-shot storage diagnostics.
Depends on Phases 2–6 and the US5 governance-file handoff.

### Phase 8 — Accessibility, RTL, localization, and responsive convergence (US7)

Adopt the already-frozen shared field/table/filter/state behavior across every touched call site and
run the journeys at five desktop/breakpoint/mobile widths. T019 becomes green here; final
convergence depends on all user-facing phases.

### Phase 9 — Evidence-based release acceptance (US8)

Run focused, contract, full unit, type, lint, build, DB-backed, role-based Playwright, responsive,
accessibility, and live checks. Reconcile OpenAPI/status evidence. A missing environment is
`BLOCKED` or `SKIPPED`, never passing. Depends on every implementation phase.

## File Conflict Control

| Lane | Exclusive files | Tasks | Ordering rule |
|---|---|---|---|
| Root/Spec | `.specify/**`, `specs/**`, `docs/KMT_LEGAL_*`, `docs/RELEASE_QA_CHECKLIST.md`, `docs/evidence/**` | T116–T128 and check-off | Root only; detailed feature rows never move to master |
| Auth/RBAC foundation | `src/server/auth/policy-data.json`, `src/server/auth/session-store.ts`, `prisma/seed.mjs`, PLAN-35 migration | T003–T010 | Sole owner through G35-4, then hands `session-store.ts` to Governance |
| Route policy | `src/lib/admin-route-policy.ts`, `src/app/(app-ar)/admin/admin-navigation.ts`, `src/server/auth/page-guards.tsx` | T011, T040–T052, T066, T079, T090–T091 | Integrator sequence; baseline first, then only page/API-ready metadata requests |
| Appointment/operations | conflict helper, `consultation-assistant-service.ts`, `consultation-review-service.ts`, `case-operations-service.ts` | T025–T037, T073 | Helper, public writer, assignment/conversion, admin writer, then reference extraction |
| Dashboard | dashboard service/route/page/features/tests | T024, T038, T067, T092–T101 | Scope pass, queue pass, command center; never concurrent |
| Shell/UI | `src/components/layout/dashboard-shell.tsx`, `src/components/layout/dashboard-shell-view.tsx`, `src/components/layout/dashboard-navigation.tsx`, `src/components/layout/dashboard-mobile-nav.tsx`, `src/components/layout/admin-shell-state.tsx`, `src/components/layout/index.ts`, `src/features/admin/shell/admin-access-context.tsx`, `src/app/(app-ar)/admin/layout.tsx`, `src/app/(app-ar)/admin/loading.tsx`, `src/app/(app-ar)/admin/error.tsx`, `src/app/(app-ar)/admin/not-found.tsx`, `tests/ui/product-components.test.tsx` | T041, T046–T052 | One UI owner through US2 checkpoint |
| Contact | contact service/routes/feature/page/tests | T053, T055, T057–T061 | Atomic service before route/UI; may run beside Notification |
| Notification | notification service/routes/bell/popover/page/tests | T054, T056–T057, T062–T065 | Projection contract before preview/center; registry/dashboard integrate later |
| Cases | manual-case service/routes/form/pages/tests/client history | T069–T081 | Service/API before UI; appointment lane hands consultation service first |
| Governance | role service/routes/form/page/tests, governance service, auth service, handed session store, user routes/pages/forms | T082–T091 | Sole owner after Auth/RBAC; hands governance files to Storage after US5 |
| Storage settings | `src/server/storage/runtime-diagnostic.ts`, `src/server/storage/upload-policy.ts`, `src/server/storage/vps-storage.ts`, `src/server/storage/malware-scan.ts`, `src/server/admin/governance-service.ts`, `src/features/admin/governance/governance-forms.tsx`, `src/app/api/admin/settings/route.ts`, `src/app/api/admin/settings/[key]/route.ts`, `src/app/(app-ar)/admin/settings/page.tsx`, `tests/server/storage-contract.test.ts`, `tests/server/admin-governance.test.ts` | T102–T106 | Starts only after Governance handoff; one owner for shared files |
| Messages/errors | `src/lib/ui-copy.ts`, `src/server/http/errors.ts` | T006, T012–T013 | Freeze semantic codes/copy before consumers |
| Shared primitives | `src/components/ui/*`, tokens, Tailwind, globals | T017, T020–T023 | One Foundation owner; signatures freeze at G35-4 |
| Accessibility handoff | exact domain call sites in T107–T111 | T019, T107–T112 | Acquire each file after its domain checkpoint; never overlap domain owner |
| QA integration | fixtures, route manifest, QA script/package commands, live smoke | T001–T006, T018–T019, T113–T125 | One final integrator; separate story test files only before handoff |

Parallel tasks are allowed only across different lanes after their upstream contract is accepted.
Tests in separate files may run in parallel; tasks that update a shared snapshot, fixture, contract,
seed, or route registry are sequential even when their production files differ.

## Risk Controls

- **Authorization drift**: Every navigation entry and widget is checked against the route registry
  and independently against its service/API guard.
- **RBAC rollout**: Permission additions use idempotent production upsert/migration behavior, not a
  development-only seed assumption; marked runs preserve empty assignments and inactive roles.
- **Double booking/lost update**: Mutable scope/status reads, overlap check, write, and required audit
  occur in one serializable callback. Create/conversion may bounded-retry; existing-row updates and
  external-side-effect callbacks are single-attempt. Unassigned public reservations are symmetric.
- **Payment-side-effect residual**: Single-attempt paid booking prevents automatic duplicate hosted
  checkout calls, but one provider checkout may be orphaned if the database transaction later
  aborts. Provider idempotency/outbox/two-phase redesign changes payment behavior and is explicitly
  deferred to a separate specification; PLAN-35 emits the exact redacted
  `payment.checkout_reconciliation_required` error event once after provider success/database abort.
- **Partial dashboard failure**: Widget queries return discriminated success/unavailable results;
  no raw database exception or private record is serialized.
- **PII/credential exposure**: Contact/notification/dashboard DTOs minimize fields; admin-user DTOs
  explicitly exclude password, TOTP/recovery, token, and whole credential records.
- **Governance lockout/escalation**: Protected/inactive roles are read-only; delegated user managers
  obey current/target permission-subset ceilings inside a single-attempt serializable, optimistic
  user update; login/session checks live user/role state; updates revoke sessions and atomically
  preserve the final exact Super Admin.
- **Retry duplication**: Manual case create binds actor/token/canonical hash through audit
  resource/actor/hash fields; core edit is optimistic and audited in-transaction.
- **Unsafe notification links**: Stored hrefs pass syntax, current route capability, and dynamic
  object-scope checks before projection; otherwise they degrade to an authorized destination/no action.
- **Storage truthfulness**: The legacy storage row is absent from JSON; one-shot root/scanner
  diagnostics are redacted and bounded and never claim database edits change runtime policy.
- **UI regression**: Shared primitive changes are isolated, keyboard/RTL tested, and verified on
  desktop, both breakpoint sides, 390px RTL, and compact mobile before broad consumer adoption.
  Every `src/**` consumer is dispositioned as migrated, backward-compatible with a named test, or a
  stop/re-spec blocker; public, client, payment, and Stitch surfaces cannot be silently changed.
- **Evidence inflation**: `SKIPPED`, `BLOCKED`, local pass, DB pass, browser pass, and live pass are
  recorded as distinct states.
- **No disposable database**: Local implementation continues only under the FR-035 status split.
  T016, T028, T039 DB assertions, and all later DB acceptance remain open; no production database
  is mutated to compensate for the missing test environment.

## Complexity Tracking

No constitution violation or exceptional architecture is required. New shared modules are bounded
to the canonical route policy, appointment conflict helper, safe admin-access context, runtime
storage diagnostic, and the explicitly tested UI primitives/domain components named in tasks. They
replace duplicated policy/state logic and have exclusive owners and handoff gates above.
