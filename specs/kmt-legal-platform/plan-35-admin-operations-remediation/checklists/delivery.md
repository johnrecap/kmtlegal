# Delivery Readiness Checklist: PLAN-35 Admin Operations Remediation

**Purpose**: Validate that the specification, design, contracts, tasks, connected impacts, and
conflict controls are complete enough for accepted task execution.

**Created**: 2026-07-22

**Validated against**: [spec.md](../spec.md), [plan.md](../plan.md),
[research.md](../research.md), [data-model.md](../data-model.md),
[contract](../contracts/admin-operations-contract.md), [quickstart.md](../quickstart.md), and
[tasks.md](../tasks.md)

## Scope and outcome quality

- [x] CHK001 All eight user stories state an actor, operational outcome, priority, independent test, and acceptance scenarios.
- [x] CHK002 In-scope admin remediation and protected public/client/payment/Stitch/outbound-channel exclusions are explicit.
- [x] CHK003 Existing behaviors to preserve are named so remediation cannot silently redesign unrelated flows.
- [x] CHK004 Success criteria distinguish correctness, authorization, operability, accessibility, and evidence outcomes.
- [x] CHK005 No unresolved clarification marker, framework choice, role choice, or business-state ambiguity remains; the paid-provider orphan residual is explicitly accepted/deferred with observability.

## Authorization and governance requirements

- [x] CHK006 `case.create.any` is a planned canonical key with default Secretary/Office Admin grants and exact-Super-Admin wildcard behavior.
- [x] CHK007 `notification.read.self` is planned for all editable staff roles and remains owner-scoped.
- [x] CHK008 Dashboard access deliberately uses authenticated staff plus per-widget domain capabilities; no fictitious `dashboard.read.any` is introduced.
- [x] CHK009 Guest, Client, and exact Super Admin are protected; only four operational staff roles are editable.
- [x] CHK010 Persisted `RolePermission` rows, including an empty set, remain authoritative after bootstrap and repeat seed.
- [x] CHK011 Role updates require exact Super Admin, canonical unique keys, optimistic concurrency, atomic audit, active/inactive target rules, and an active governance path.
- [x] CHK012 Navigation discovery is explicitly nonauthoritative; equivalent page/API service guards remain mandatory.

## Data, transaction, and state requirements

- [x] CHK013 The no-Prisma-structure assumption and data-only permission migration are explicit, with a stop/replan condition for schema change.
- [x] CHK014 Appointment intervals, symmetric public/admin scope, transaction-local rereads, writer-specific retry/single-attempt behavior, audits, and residual payment risk are defined.
- [x] CHK015 Manual case eligibility, canonical enums, assignment ceiling, actor/token/hash replay, reference recovery, edit concurrency, transaction, and audit behavior are defined.
- [x] CHK016 Contact-message transitions use conditional concurrency control, same-state idempotency, and same-transaction exact audit.
- [x] CHK017 Notification projection, complete-set counts, cursor pagination, dedupe, safe capability/object-scoped hrefs, owner-read semantics, and review separation are defined.
- [x] CHK018 Dashboard ready/unavailable unions, Cairo cutoffs, scope/timeframe mappings, deterministic order/hrefs, DTO field minimization, and source isolation are unambiguous.
- [x] CHK019 Environment-owned storage uses an exact settings wrapper, excludes the legacy row, derives bounded root/scanner readiness, and cannot imply database-driven runtime change.

## Contract and localization quality

- [x] CHK020 Every affected current or planned API row is labeled with method, path, status, authorization, and intended behavior.
- [x] CHK021 Planned case and role routes are not described as already implemented.
- [x] CHK022 Stable response envelopes, auth/permission/not-found/validation/conflict outcomes, and new semantic codes are defined.
- [x] CHK023 The `report.read.any` canonical spelling and the affected contract typo remediation are captured.
- [x] CHK024 All nineteen route IDs, exact child precedence, any/all/exact-role constraints, default five-role acceptance, direct-denial expectations, fifteen-route baseline, and page/API-ready activation order are tabulated.
- [x] CHK025 User-facing labels, errors, validation, status, accessibility names, and partial states reuse the Arabic token/copy system.
- [x] CHK026 Raw exceptions, permission keys as sole labels, credential material, absolute storage paths, forbidden dynamic hrefs, and unused legal/contact fields are forbidden at UI boundaries.

## UI, responsive, and accessibility quality

- [x] CHK027 Existing design tokens/primitives are the required reuse path; no new UI/chart/motion/i18n/state dependency is planned, and every shared-UI consumer must be dispositioned as migrated, named-test-compatible, or a stop/re-spec blocker before acceptance.
- [x] CHK028 Desktop, both `lg` breakpoint sides, 390px RTL, and compact mobile viewports have explicit acceptance coverage.
- [x] CHK029 Mobile navigation requires keyboard open/close, Escape, focus return, logical RTL direction, current route, touch targets, and no overflow.
- [x] CHK030 Forms/tables/filters/search/feedback specify unique relationships, captions/scopes, named regions, and alert/status semantics.
- [x] CHK031 Loading, empty, denied, partial, conflict, success, and server-error states preserve shell context and offer a safe next action.

## Test and evidence quality

- [x] CHK032 Every user-story phase places focused expected-red tests before implementation tasks.
- [x] CHK033 Allowed and denied roles, canonical scopes, concurrency, idempotency, replay, stale writes, rollback, DTO minimization, and localization have named tests.
- [x] CHK034 PostgreSQL-backed checks cover double seed/inactive role, empty role, appointment order/retry/contention, case replay/audit, queue states, user/session/final-Super governance, and five roles.
- [x] CHK035 Browser checks cover nineteen-route/five-role parity, mobile navigation, responsive/RTL, keyboard/semantics, console/network errors, timed journeys, and deterministic screenshots.
- [x] CHK036 Local, DB, browser, live, skipped, blocked, and deferred states are distinct; skipped evidence never satisfies a release gate.
- [x] CHK037 Production live smoke is read-only and requires exact successful outcomes; mutation acceptance uses staging/disposable data.

## Task executability and conflict control

- [x] CHK038 All tasks use sequential unique IDs, optional `[P]`, a story label where applicable, an action, exact paths, and a connected impact.
- [x] CHK039 Task dependencies and story checkpoints prevent UI consumers from preceding policy/service/contracts; the fifteen-route US2 baseline precedes T066/T079/T090 activation and T091 alone gates the final 19×5 matrix.
- [x] CHK040 Shared-file lanes cover RBAC, route policy, appointments, dashboard, shell, contact, notifications, cases, governance, storage, primitives, specs, and QA.
- [x] CHK041 No adjacent `[P]` tasks name the same file or an unfinished shared upstream contract.
- [x] CHK042 Root-only ownership is explicit for `.specify/**`, `specs/**`, status/release docs, check-off, evidence integration, and commit/push.
- [x] CHK043 Master task registration is one roll-up and external feature references use `PLAN-35/T###`, avoiding duplicate IDs/status.
- [x] CHK044 Stop conditions require re-specification for schema/dependency/out-of-scope expansion and serialize any shared-file collision.
- [x] CHK045 Admin-user list/create/detail/update DTOs exclude every named credential secret; login/session active-principal rules, revocation, delegated subset ceilings, and concurrent final-Super protection are executable.
- [x] CHK046 Appointment tasks cover every writer including consultation assignment, payment-call single attempt, stale-pre-read races, audit rollback, query-plan evidence, and the accepted orphan residual.
- [x] CHK047 Dashboard contract/tasks pin the seven canonical metric keys/order/token stems, five canonical quick-action route IDs/order/primary rule, every discriminated union, Cairo boundary, copy mapping, section order/tie-breaker, maximum, and destination href.
- [x] CHK048 Notification center tasks guarantee complete cursor reachability, count-before-limit dedupe, safe permission/object-scoped links, and contact transition concurrency.
- [x] CHK049 Storage tasks derive the exact root/scanner matrix through a bounded existing ping and inspect the whole response for legacy row/path/metadata exclusion.
- [x] CHK050 Manual-case tasks use existing `PartyType`, resource/actor/hash replay after redaction, no fuzzy duplicate promise, explicit reference-collision recovery, assignment rules, and transactional edit audit.
- [x] CHK051 G35-4L explicitly permits T019's recorded expected-red state and local-only story implementation while G35-4D/T016 remains open; the requirements forbid production DB substitution, keep DB/story/release acceptance blocked, place shared fixtures before consumers, preserve exclusive file handoffs, require every global UI consumer disposition, protect public/client/payment/Stitch surfaces, and name evidence paths.

## Notes

- Validation pass 1 completed on 2026-07-22 after resolving permission persistence, dashboard
  access, notification count, protected-role, and appointment-concurrency findings.
- Checklist result: 51/51 complete. The final [Spec Kit analyze](../analyze.md) is clean with zero
  unresolved `CRITICAL`/`HIGH`/`MEDIUM`; one payment residual is explicitly accepted. Implementation
  may begin only for explicitly accepted task IDs. The 2026-07-22 FR-035 clarification permits
  local-only execution while database evidence remains open and forbids production DB testing.
