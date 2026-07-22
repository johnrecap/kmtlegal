# PLAN-35 Spec Kit Analyze Report

**Date**: 2026-07-22
**Status**: `US6-LOCAL-VERIFIED`
**Implementation state**: T001–T015, T017–T027, T029–T041, T043–T051, T053–T067, T069–T080, T082–T090, T092–T100, and T102–T106 are implemented and locally verified. T057, T072, T083, and T094's browser/database scenarios are authored and collection-verified, but their authenticated PostgreSQL execution remains part of T068/T081/T091/T101. T016/G35-4D, T028, the database-backed portion of T039, T042's authenticated page/API cells, T052, T068, T081, T091, and T101 remain deferred evidence under FR-035.

## Gate Result

| Severity | Unresolved | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | Gate passes |
| `HIGH` | 0 | Gate passes |
| `MEDIUM` | 0 | One separate accepted residual is recorded below |

The constitution, specification, clarification decisions, plan, research, data model, contract,
quickstart, both checklists, task list, connected-impact map, and file-owner lanes are mutually
consistent. Implementation may start only after the user explicitly accepts concrete
`PLAN-35/T###` IDs.

## Artifact Inventory

| Artifact | Result |
|---|---|
| Functional requirements | 38 (`FR-001` through `FR-038`) |
| Success criteria | 13 (`SC-001` through `SC-013`) |
| Requirements checklist | 16/16 complete |
| Delivery checklist | 51/51 complete |
| Implementation tasks | 128 unique sequential IDs (`T001` through `T128`) |
| Affected API methods | 23 |
| Canonical admin destinations | 19 |
| Default role personas | 5 |
| Representative API probes | 19 |
| Final role/route cells | 95 |
| Master task registrations | One roll-up (`T289`) |

No unresolved clarification marker, template placeholder, duplicate task ID, missing task-path
contract, broken local Markdown link, or duplicated detailed master task was found.

## Final Execution Order

| Stage | Tasks | Acceptance boundary |
|---|---|---|
| Foundation and characterization | T001–T023 | G35-4L permits local work; T016/G35-4D remains open and T019 stays expected-red until UI convergence |
| Scope and appointment correctness | T024–T039 | T024–T027/T029–T038 local lane; T028/T039 DB evidence required before US1 acceptance |
| Existing permission-aware workspace | T040–T052 | T040–T051 local lane; authenticated T042/T052 acceptance remains open; contact/notification routes were later activated by T066 |
| Contact and notification queues | T053–T068 | T053–T067 local implementation is verified; authenticated/DB/browser acceptance remains open in T068 |
| Manual case create/edit | T069–T081 | T069–T080 locally verified; T072 authored/collection-only; T079 activated `cases.create` after service, API, and page; T081 remains DB/browser acceptance |
| Role/user governance | T082–T091 | T082–T090 local lane verified; T090 activated roles; T091 remains the complete DB/authenticated 19×5 gate |
| Command center and storage truth | T092–T106 | T092–T100/T102–T106 local lane verified; T094 is authored/collection-only and T101 remains authenticated end-to-end acceptance |
| UI/RTL/accessibility convergence | T107–T112 | Five exact viewports plus all shared-consumer dispositions |
| Release evidence and convergence | T113–T128 | Local, DB, browser, live, analyze/converge, commit/push handoff |

This ordering removes the former circular acceptance condition: T042/T052 test only the original
fifteen executable destinations. T066 activated `contacts.list` and `notifications.list`, and T079
activated `cases.create`, and T090 activated `roles.list`, so all nineteen destinations are
executable. T091 remains the first authenticated/database-backed nineteen-route gate. A `404`, `405`, or
skipped probe never satisfies an allowed cell.

## Coverage and Connected Impact

- **Authorization**: navigation discovery, page guards, API/service guards, object scope, exact
  Super Admin constraints, delegated permission ceilings, inactive principals, session revocation,
  and final-Super concurrency are traced to tests and file owners.
- **Data and concurrency**: PLAN-35 is no-schema/data-only unless formally reopened. Appointment
  overlap, mutable re-reads, retry modes, manual-case replay, optimistic updates, atomic audits,
  contact transitions, and role replacement have transaction and PostgreSQL evidence tasks.
- **Contracts and privacy**: all 23 affected methods have authorization and stable response rules;
  admin-user/dashboard/notification DTOs exclude credential, legal-content, and raw-error leakage.
- **Dashboard**: seven canonical metric keys and five quick-action route IDs have fixed relative
  order, capability, scope, timeframe, token, href, partial-failure, and bounded-queue behavior.
- **UI/UX**: Arabic RTL, shell-preserving loading/error/denial, native-dialog mobile navigation,
  semantic forms/tables/search, deterministic screenshots, responsive breakpoints, and cross-surface
  shared-primitive compatibility are explicit acceptance tasks.
- **Localization and messages**: user-facing copy reuses typed Arabic semantic tokens; raw
  permission keys and English server exceptions are forbidden at UI boundaries.
- **Observability**: reconciliation uses the existing redacting `safeLog` path and the stable
  `payment.checkout_reconciliation_required` event with an exact metadata allowlist.
- **Conflict control**: root/spec, route policy, appointments, dashboard, shell, contacts,
  notifications, cases, governance, storage, shared primitives, accessibility handoff, and QA have
  exclusive owners and explicit handoff tasks in `plan.md` and `tasks.md`.

## Resolved Analyze Findings

| Finding | Resolution |
|---|---|
| Dashboard example key/href differed from the canonical queue | Unified on `documents.under-review` and the exact sorted href |
| Metric/action arrays lacked a complete deterministic inventory | Added seven-metric and five-action tables with order, capability, scope, copy tokens, and hrefs |
| The 19×5 matrix lacked representative API probes | Added one non-mutating probe and exact outcome class per route ID |
| Shell/storage ownership was not path-exhaustive | Matched exact paths and handoffs in plan and tasks |
| Shared primitive changes could affect non-admin consumers silently | Added an all-`src/**` disposition manifest and named compatibility/stop rules |
| Full route acceptance preceded four planned consumers | Split the green fifteen-route baseline from T091's complete executable 19×5 gate |
| Audit wording could imply storing a redacted request token | Restricted metadata to `requestHash`; the token remains the case UUID/resource identity |
| One task lacked an exact implementation file | T074 now creates `src/server/admin/manual-case-service.ts` explicitly |
| Payment reconciliation logging was underspecified | Fixed event name, level, source, allowlisted fields, redaction, and exactly-once tests |

## Accepted Residual

`MEDIUM — payment checkout orphan reconciliation`: the current paid-booking provider call remains
inside a single-attempt database transaction. Provider success followed by database abort may leave
one unreachable checkout. PLAN-35 does not claim orphan-free behavior. It emits exactly one
privacy-safe `payment.checkout_reconciliation_required` error and tests that the hosted-checkout
provider is called once. Provider idempotency, outbox, or two-phase/post-commit orchestration changes
the payment contract and is intentionally deferred to a separate specification.

## Validation Evidence

- Spec Kit prerequisite check: pass.
- Task sequence/count/path checks: pass.
- Requirement, success-criterion, checklist, API, route, role, and probe counts: pass.
- Placeholder and legacy-conflict scans: pass.
- Local Markdown link scan: pass.
- `git diff --check`: pass.
- Independent backend/transaction, UI/UX, and final Spec Kit consistency reviews: clean after the
  documented fixes.

Planning validation does not substitute for implementation verification. Foundation local checks are
recorded below; PostgreSQL, authenticated final-role, responsive convergence, and live checks remain
mandatory at their named acceptance gates in `quickstart.md` and T122–T125. FR-035 now permits
local implementation to continue while those environment-dependent tasks remain explicitly open.

## Foundation Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. The missing disposable database is an explicit deferred evidence state under FR-035, not an unresolved implementation decision. |
| `MEDIUM` | 0 | Storage-time PLAN-35 audit redaction, stable code-driven error messages, exact-role/all-permission evaluator coverage, semantic-token projection, and ARIA passthrough findings were fixed. |

The remaining route-policy versus page/API guard parity observation is explicitly accepted only for
Foundation: T042/T052 prove the fifteen executable destinations and T091 proves the final nineteen
routes before planned destinations are activated. No new convergence task is appended because those
accepted task IDs already own the evidence.

Local evidence is recorded in `test-results/plan35/g35-4-foundation.json` and
`test-results/plan35/g35-4-ui.json`. Focused tests, all 262 unit/contract tests, typecheck, lint,
Prisma validate/generate, production build, and diff hygiene pass. The T019 browser characterization
collected twelve unskipped tests and produced the intentional result: seven pass and five shell/dialog
tests fail. T016 remains `BLOCKED` for database/story/release acceptance, but G35-4L permits the
accepted US1 local implementation lane. The production-connected database is explicitly excluded.

## US1 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. PostgreSQL concurrency/query-plan evidence remains an explicit deferred acceptance state, not a hidden implementation claim. |
| `MEDIUM` | 0 | Canonical scope drift, dashboard over-selection, stale mutable pre-reads, non-atomic required audits, unsafe callback replay, and reconciliation metadata handling were fixed. |

T024–T027 were observed expected-red before implementation: the shared appointment service and
scope exports were absent, dashboard queries used duplicated predicates and broad `include` reads,
and calendar/consultation writers kept mutable checks or required audits outside their transaction.
T029–T038 now converge on one half-open conflict service with active-status filtering, symmetric
unassigned public reservations, self-exclusion, bounded retries for database-only creates, and
single-attempt handling for existing updates and paid-provider work.

The dashboard consumes the canonical client, case, consultation, appointment, and task predicates
and uses explicit minimized selections. Calendar create/reschedule, consultation assignment, and
conversion re-read mutable authorization/status/assignee inputs and persist required audits inside
their serializable callback. Paid checkout is never automatically replayed; a provider-success then
`P2034` abort emits exactly one redacted `payment.checkout_reconciliation_required` event with the
contract allowlist. Stable appointment conflicts use `APPOINTMENT_CONFLICT`, and error envelopes are
also `Cache-Control: no-store`.

Local evidence is recorded in `test-results/plan35/us1-operations.json`: the five focused files pass
57/57, the repository suite passes 277/277, and typecheck, lint, Prisma validate/generate, and the
production build without a database URL pass. No production database was contacted. T028 and T039
remain open because same-row/contention behavior and bounded `EXPLAIN` evidence cannot be claimed
without disposable PostgreSQL. No new convergence task is appended because T016/T028/T039 already
own every deferred database assertion.

## US1 Local Conclusion

PLAN-35 remains internally consistent and conflict-controlled with zero unresolved `CRITICAL` or
`HIGH` findings. The user explicitly accepted local-only progress without installing a database;
therefore T024–T027 and T029–T038 are locally complete. T016, T028, and the DB-backed portion of T039
stay open, US1 cannot be checkpoint-accepted or described as DB-verified, and no production database
may be used for verification.

## US2 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. Direct page authorization remains server-side and the client context contains only filtered navigation metadata plus the user label. |
| `MEDIUM` | 0 | Registry/navigation drift, inherited child-route authorization, shell-loss on denied/boundary states, raw permission copy, and mobile-dialog accessibility findings were fixed. |

T040, T041, and T043–T051 now provide a canonical fifteen-route registry, deterministic role
filtering, matching page guards, shell-preserving denial/loading/error/not-found states, and one RTL
desktop/mobile navigation source. The native mobile dialog traps keyboard and programmatic focus,
locks document scrolling, handles Escape and navigation close, restores focus, uses logical inline
positioning, and keeps controls at least 44 CSS pixels. The server-side policy filter, reusable
presentation shell, shared navigation renderer, and client dialog have separate explicitly owned
files so raw permissions do not enter the client access context and later phases cannot overlap them.

The deterministic server/UI suite passes locally, and the browser shell suite passes at `1440x900`,
`1023x768`, `1024x768`, `390x844`, and the additional compact `320x568` viewport. The five
authenticated role-matrix cases are collected but intentionally skipped because no disposable
PostgreSQL or five safe authenticated storage states exist. Therefore T042's authenticated cells and
T052 remain open; no `404`, `405`, skip, mock principal, or production database is counted as an
authorization pass. The truthful partial evidence is recorded in
`test-results/plan35/us2-baseline-route-matrix.json`. No new convergence task is appended because
T042/T052 already own the remaining evidence.

## US3 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. Database-backed and authenticated browser acceptance remains explicitly owned by T068. |
| `MEDIUM` | 0 | Contact transition races/audits, notification count completeness/dedupe/cursors, safe navigation, live read state, retry behavior, responsive RTL presentation, contiguous navigation grouping, and route/dashboard integration findings were fixed. |

T053–T067 now implement the local Contact and Notifications lane without a schema change or database
connection. Contact messages use a bounded minimized projection and a conditional state machine:
`NEW` can become `REVIEWED` or `ARCHIVED`, `REVIEWED` can become `ARCHIVED`, repeated target states
are idempotent, conflicting races return a conflict, and the one required audit is written inside
the same transaction. The protected inbox supplies permission-scoped reader/manager behavior,
search, status filtering, pagination, responsive cards/table presentation, keyboard-accessible long
content, mixed-direction isolation, and recoverable action feedback.

The notification service now exposes distinct preview and opaque-cursor center contracts, computes
complete-set generic-unread plus visible-consultation attention before preview limits, deduplicates
linked records, enforces strict owner reads, keeps consultation review state separate, and rechecks
both current route capability and dynamic resource scope before returning an internal action link.
The bell and full center render both item kinds, preserve truthful live counts after marking a
generic notification read, paginate without repeats, and retain a retry path after load failures.
T066 activates only the now-backed contact and notification destinations, bringing the executable
route registry from fifteen to seventeen; `cases.create` and `roles.list` remain planned.

Verification passed without installing or contacting PostgreSQL: 39 focused server/UI tests, all
304 unit/contract tests, typecheck, lint, the production build with
`ALLOW_BUILD_WITHOUT_DATABASE_URL=true`, Playwright collection of all 19 PLAN-35 admin-operation
scenarios, and diff hygiene. A normal production build compiled but correctly stopped during page
data collection because production requires `DATABASE_URL`; the documented no-database build guard
then completed all 72 static pages. This is not database or authenticated-browser evidence.

T057 is implemented as explicitly gated contact-to-triage and full-notification-pagination browser
scenarios and is collection-verified. Its authenticated execution, database state/idempotency checks,
and mobile queue journey remain open under T068. No new convergence task is appended because T068
already owns every missing US3 acceptance artifact.

## US4 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. PostgreSQL replay/rollback, authenticated role, connected-history, and SC-006 timing evidence remains explicitly owned by T081. |
| `MEDIUM` | 0 | Route-contract status drift, authorization-before-validation, Arabic error projection, inactive assignee filtering, collision recovery layout, and fixture cleanup coverage were fixed. |

T069–T080 now implement the local manual-case lane without a schema change or database connection.
The create service accepts only an active existing client and active Lawyer-role assignee, uses the
client UUID request token as the case primary key, hashes the normalized accepted payload with
SHA-256, and binds replay to the exact case ID, actor, creation audit, and `requestHash`. Case,
ordered optional parties, and the direct redacted audit share one transaction. A same-token actor or
body mismatch returns conflict, different request tokens are not fuzzy-deduplicated, and the shared
human reference generator maps its rare unique collision to `CASE_REFERENCE_CONFLICT`.

Core edits accept only the approved fields and an optimistic `updatedAt` claim. Assigned-only
lawyers may edit a case still assigned to them but cannot transfer it; reassignment requires
`case.update.any`. The conditional update and redaction-safe changed-field audit are in the same
transaction, so stale writes and audit failures cannot leave a partial mutation. POST/PATCH preserve
existing GET behavior, authorize before validating request bodies, return no-store envelopes, and
use localized semantic recovery copy.

The protected `/admin/cases/new` route reuses existing fields, cards, buttons, feedback states, legal
labels, colors, and responsive grids. It provides client filtering, active-lawyer selection,
canonical optional parties, duplicate-submit prevention, Arabic validation, unique control IDs,
keyboard-native controls, RTL-safe mixed values, and explicit value-preserving collision retry that
generates a new UUID only on the user's action. List/detail/client-history surfaces expose only
authorized create/edit actions; the existing client relation remains the single history source.
T079 activates the exact `cases.create` policy after the page and API exist, taking the executable
registry from seventeen to eighteen destinations.

Local verification passed without installing or contacting PostgreSQL: 64 focused server/UI tests,
all 316 unit/contract tests across 46 files, typecheck, lint, the guarded production build across 72
static pages, collection of 21 PLAN-35 browser scenarios including both T072 cases, and diff hygiene.
The T072 DB/browser cases require explicit `PLAN35_DATABASE_CLASS=disposable` and fixture opt-in;
their execution and T081 remain open. No new convergence task is appended because T081 already owns
all missing PostgreSQL/authenticated-browser assertions.

## US5 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. PostgreSQL durability/concurrency, fresh-session behavior, and authenticated 19×5 execution remain explicitly owned by T091. |
| `MEDIUM` | 0 | Broad user scalar/credential projection, delegated amplification, self-only Super protection, stale writes, inactive principal/session reuse, raw permission labels, route-contract status, and fixture cleanup findings were fixed. |

T082–T090 now implement the local role/user governance lane without a schema, migration, seed, or
database connection. The isolated role service rechecks an active exact Super Admin, publishes the
canonical grouped catalog, presents protected/inactive roles as read-only, accepts strict unique
canonical assignments including an empty set, claims `Role.updatedAt`, and replaces rows plus the
redacted audit in one serializable transaction. T090 activated `roles.list` only after the guarded
page and both APIs existed, taking the executable registry from eighteen to nineteen destinations.

Admin-user list/create/detail/update now use purpose-built safe selectors and DTO mappers that omit
password hashes, encrypted TOTP/recovery material, token hashes, and whole credential rows. A
single-attempt serializable update re-reads the active actor, target, and next role, enforces current
and next permission-subset ceilings for delegates, hides protected targets, claims `User.updatedAt`,
revokes affected sessions, writes one audit, and preserves the final active exact Super Admin in the
same transaction. Password login and session loading reject suspended/deleted users, non-null
`deletedAt`, and inactive roles.

The Arabic RTL matrix reuses existing tokens/components, provides grouped localized permission
labels, native labelled checkboxes, wildcard/protected/inactive states, dirty-state preservation,
and explicit stale recovery. Admin-user consumers use only `counts`, `rolePermissionKeys`,
`safeSessions`, and `safeAuditRows`. No raw permission key is the visible label and no new UI library
was added.

Local verification passed without installing or contacting PostgreSQL: 80 focused tests, all 337
unit/contract tests across 48 files, typecheck, warning-free lint, a guarded production build across
72 static pages, collection of 24 PLAN-35 Playwright scenarios, complete canonical Arabic permission
label coverage, and diff hygiene. T083's three disposable DB/browser scenarios are authored and
collection-verified only. T091 remains open for repeat-seed durability, persisted empty roles,
concurrent role/user/final-Super outcomes, fresh/revoked sessions, and all 95 authenticated route
cells. Converge found no new local remediation task; existing T091 owns every deferred assertion.

## US6 Local Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 0 | None. Authenticated five-role payload/drill-down/partial-failure execution remains explicitly owned by T101. |
| `MEDIUM` | 0 | Dashboard DTO over-selection, loader coupling, ambiguous metric semantics, Cairo-day drift, forbidden quick actions, editable storage claims, stale database policy authority, read-only status/authorization-order drift, path/secret exposure, and unbounded scanner probing were fixed. |

T092–T100 now implement the local role-aware command-center lane. `DashboardSnapshotV1` fixes the
seven metric keys, five priority queues, five route-registry quick actions, purpose-built item and
activity unions, maximum-six bounds, canonical scope predicates, semantic timeframe/scope labels,
exact filtered destinations, deterministic tie-breakers, and `Africa/Cairo` day cutoffs. Every
domain loader is guarded independently, so one unavailable source does not erase or disable ready
sections. The Arabic RTL UI prioritizes permitted work and the first useful action, exposes no
forbidden placeholders, supports retry and empty states, and marks dynamic values for deterministic
visual evidence.

T102–T106 remove `storage.policy` from generic settings authority and reject its mutation. The new
one-shot diagnostic derives only safe facts from the effective environment, filesystem writability,
upload allowlist/limit, and bounded ClamAV reachability. It returns configured/degraded/unavailable
truth without root paths, hostnames, secrets, database values, polling, or write controls. Existing
private upload, traversal, MIME, size, scanner, and readiness enforcement remains covered.

Local verification passed without a database connection: 13 focused dashboard tests, 45 focused
storage/governance/security tests, 95 combined focused tests across 10 files, all 353 unit/contract
tests across 50 files, typecheck, warning-free lint, a guarded production build across 72 static
pages, collection of 30 PLAN-35 Playwright scenarios, and diff hygiene. T094's six authenticated
command-center cases are authored and collection-verified only; T101 remains open for their real
execution. Converge found no new local remediation task because T101 already owns the remaining
authenticated end-to-end evidence.

## Conclusion

PLAN-35 remains internally consistent and conflict-controlled with zero unresolved `CRITICAL`,
`HIGH`, or `MEDIUM` findings in the completed local lanes. US1, the US2 shell/policy work, US3
T053–T067, US4 T069–T080, US5 T082–T090, and US6 T092–T100/T102–T106 are locally complete, while
T016, T028, the database-backed part of T039, T042's authenticated cells, T052, T068, T081, T091,
and T101 remain explicitly open. Neither collected-only authentication cells nor the
production-connected database are used as acceptance evidence.
