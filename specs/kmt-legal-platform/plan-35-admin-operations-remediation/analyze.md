# PLAN-35 Spec Kit Analyze Report

**Date**: 2026-07-22
**Status**: `FOUNDATION-IN-PROGRESS`
**Implementation state**: T001–T015 and T017–T023 implemented; G35-4 remains open on T016 live PostgreSQL evidence. T019 is the planned expected-red exception.

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
| Foundation and characterization | T001–T023 | G35-4; T019 alone remains recorded expected-red until UI convergence |
| Scope and appointment correctness | T024–T039 | US1 service/DB checkpoint |
| Existing permission-aware workspace | T040–T052 | Fifteen implemented routes × five roles; four planned routes remain absent |
| Contact and notification queues | T053–T068 | T066 activates only page/API-ready contact and notification entries |
| Manual case create/edit | T069–T081 | T079 activates `cases.create` only after service, API, and page exist |
| Role/user governance | T082–T091 | T090 activates roles; T091 passes the complete 19×5 matrix |
| Command center and storage truth | T092–T106 | Deterministic dashboard contract and read-only runtime diagnostic |
| UI/RTL/accessibility convergence | T107–T112 | Five exact viewports plus all shared-consumer dispositions |
| Release evidence and convergence | T113–T128 | Local, DB, browser, live, analyze/converge, commit/push handoff |

This ordering removes the former circular acceptance condition: T042/T052 test only the fifteen
already executable destinations. `contacts.list`, `notifications.list`, `cases.create`, and
`roles.list` are contract-planned until T066/T079/T090, and T091 is the first complete executable
nineteen-route gate. A `404`, `405`, or skipped probe never satisfies an allowed cell.

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
mandatory at their named gates in `quickstart.md` and T122–T125.

## Foundation Implementation Convergence — 2026-07-22

| Severity | Open | Disposition |
|---|---:|---|
| `CRITICAL` | 0 | None |
| `HIGH` | 1 | Live migration plus repeat-seed durability is blocked because this workspace has no `DATABASE_URL`, Docker, `psql`, or PostgreSQL service. T016 stays open and no later phase may start. |
| `MEDIUM` | 0 | Storage-time PLAN-35 audit redaction, stable code-driven error messages, exact-role/all-permission evaluator coverage, semantic-token projection, and ARIA passthrough findings were fixed. |

The remaining route-policy versus page/API guard parity observation is explicitly accepted only for
Foundation: T042/T052 prove the fifteen executable destinations and T091 proves the final nineteen
routes before planned destinations are activated. No new convergence task is appended because those
accepted task IDs already own the evidence.

Local evidence is recorded in `test-results/plan35/g35-4-foundation.json` and
`test-results/plan35/g35-4-ui.json`. Focused tests, all 262 unit/contract tests, typecheck, lint,
Prisma validate/generate, production build, and diff hygiene pass. The T019 browser characterization
collected twelve unskipped tests and produced the intentional result: seven pass and five shell/dialog
tests fail. This expected-red result does not close the live-database blocker.

## Conclusion

PLAN-35 remains internally consistent and conflict-controlled. Foundation implementation is present,
but the next permitted action is only to provide a disposable PostgreSQL target and complete T016.
T024 or any later phase must not start until G35-4 has no unresolved `HIGH` finding.
