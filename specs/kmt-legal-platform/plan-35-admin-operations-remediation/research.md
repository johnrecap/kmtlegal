# PLAN-35 Research and Decisions

**Date**: 2026-07-22

**Status**: Complete — no unresolved planning decision

## Evidence inspected

- Admin dashboard service/page/API, destination task/calendar/case services, and related route
  handlers.
- Public consultation booking conflict checks and serializable transaction behavior.
- RBAC policy catalog, policy evaluation, page guards, seed/upsert behavior, and governance service.
- Contact-message and notification models, services, routes, and notification bell.
- Shared field, dialog, table, filter, search, state, toast, design-token, and Arabic UI-copy modules.
- Existing Vitest, Prisma-backed, Playwright, live smoke, route manifest, seed, and OpenAPI contract
  checks.
- Platform specification, data model, frontend/backend plans, master tasks, implementation status,
  release checklist, and server runbook.

## R1 — Delivery unit

**Decision**: Use one integrated PLAN-35 feature with eight independently acceptable user stories
and one canonical `tasks.md`.

**Rationale**: Scope, permission, DTO, error, and shell decisions are shared. Separate feature plans
would duplicate contracts and create ambiguous ownership of the same hot files.

**Alternatives rejected**:

- Separate dashboard, RBAC, notifications, and accessibility plans: rejected because the user asked
  for an executable remediation sequence and these slices share upstream contracts.
- One undifferentiated implementation batch: rejected because it cannot be accepted or rolled back
  story by story.

## R2 — Canonical visibility scopes

**Decision**: Export reusable scope builders from the authoritative destination services and make
the dashboard consume them. Task and appointment assignment includes visibility inherited from a
case assigned to the actor wherever the destination service already defines that relationship.

**Rationale**: The dashboard currently recreates narrower actor-only predicates, which can disagree
with task board and calendar results. Reusing one predicate prevents count/drill-down drift.

**Alternatives rejected**:

- Duplicate predicates in `dashboard-service.ts`: rejected because the existing defect is caused by
  duplicated policy logic.
- Broaden all staff to `*.any`: rejected because it violates least privilege.

## R3 — Appointment overlap and concurrency

**Decision**: Create `src/server/appointments/appointment-conflict-service.ts` with:

- one half-open overlap predicate (`existing.startAt < candidate.endAt` and
  `existing.endAt > candidate.startAt`),
- active-status membership defined in one place,
- optional current-appointment exclusion for reschedule,
- office-wide consultation scope for existing public consultation behavior,
- lawyer-specific scope for admin calendar operations plus protection of an overlapping active
  unassigned row with `consultationRequestId != null`, and
- a serializable transaction wrapper whose retry policy is explicit per writer.

The decisive conflict query and write occur in the same transaction. The extra unassigned-public
predicate makes public-first and admin-first ordering equivalent: an active public reservation
blocks a later overlapping admin appointment, while existing public office-wide behavior already
blocks the reverse order. Consultation assignment/reassignment excludes its own linked appointment
and validates the proposed lawyer against other active rows before changing it.

Retry policy is writer-specific. Database-only **create** and consultation-conversion callbacks may
use a bounded whole-transaction retry. Updates of an existing appointment (reschedule or linked
consultation assignment) use a single attempt so a serialization retry cannot overwrite a newer
update. The paid public
booking path currently invokes `createHostedCheckout` inside its callback, so it MUST use a
single-attempt policy: a `P2034` is mapped to the recoverable conflict response and the callback is
never replayed. Free/public paths may be retried only after a test proves the selected callback has
no external side effect. Public booking retains its existing post-commit best-effort audit;
admin create/reschedule and consultation conversion write their audit row in the same database
transaction as the appointment.

**Accepted residual (`MEDIUM`, payment plan deferred)**: the provider call still occurs inside the
existing paid-booking database transaction. If the provider succeeds and commit then fails, one
unreachable checkout may remain. PLAN-35 emits `payment.checkout_reconciliation_required` exactly
once through the existing redacting `safeLog` path, with request/provider correlation identifiers
only, but does not claim orphan-free behavior. Eliminating this requires provider idempotency,
outbox, or post-commit/two-phase orchestration and therefore a separate payment-contract
specification under the explicit no-payment-behavior-change boundary.

**Rationale**: A pre-check alone races. The public booking service already demonstrates a
serializable approach; extracting it preserves proven behavior and applies it consistently.

**Alternatives rejected**:

- Client-side overlap validation: rejected because it is bypassable and cannot handle concurrency.
- Database exclusion constraint now: rejected because the current Prisma/PostgreSQL model and mixed
  office-wide/lawyer-specific scopes require a migration design outside the accepted no-schema
  assumption. If serializable transactions prove insufficient under production load, that becomes
  a separately specified migration.
- Blindly retry every writer callback: rejected because a paid callback could create duplicate
  provider checkout sessions or orphaned external state.
- Retry reschedule/assignment after a serialization failure: rejected because the replay could
  overwrite a concurrent update without an accepted optimistic-version field.

## R4 — Admin route and capability policy

**Decision**: Add one isomorphic registry in `src/lib/admin-route-policy.ts` defining stable route
ID, Arabic label token, icon, group, href, active matcher, and an OR-of-permissions capability.
Navigation, quick actions, dashboard visibility, and route contract tests consume it. Page/API
guards remain authoritative and must agree with the registry.

Entries may additionally declare exact-role and required-all constraints for exceptional governance
routes. `roles.list` requires exact active Super Admin plus both `role.manage.any` and
`permission.manage.any`; this is declarative discovery metadata, not a replacement for service guards.

Matching is deterministic: exact static/action entries win first, then the longest registered path
prefix supplies child-route capability. Thus `/admin/cases/new` uses `case.create.any`, while
`/admin/cases/{caseId}` inherits case-read capability. Every current detail/content child route is
part of the contract inventory, not merely its top-level navigation entry.

The dashboard home is available to authenticated staff even when their only useful capability is a
single workstream; widgets and actions remain permission-filtered.

**Rationale**: The current static navigation advertises destinations that restricted staff cannot
open. A shared declarative registry makes discrepancies testable.

**Alternatives rejected**:

- Hide links with role-name conditionals: rejected because roles can change permissions.
- Treat hidden navigation as access control: rejected because server authorization is mandatory.

## R5 — Permission catalog and staff grants

**Decision**:

1. Add canonical `case.create.any`.
2. Grant it to Secretary and Office Admin; Super Admin keeps the exact-role wildcard.
3. Grant `notification.read.self` to Lawyer, Secretary, Office Admin, and Marketing Staff; it never
   permits reading another user's notifications.
4. Apply additions through idempotent production permission upsert/assignment behavior as well as
   development seed behavior.
5. Require positive and negative contract tests for every role.
6. Treat persisted `RolePermission` rows as authoritative after bootstrap. Remove the
   `principalFromUser` fallback that silently restores policy defaults when an editable role has
   zero rows. The data-only migration follows existing permission-migration precedent: it upserts
   PLAN-35 keys/grants when role rows already exist and writes an RBAC-bootstrap marker only when an
   existing assignment set is present. On a fresh database, migration sees no roles/assignments;
   the first seed installs current defaults and writes the marker. Once marked, repeat seeds upsert
   catalog rows only and must not recreate permissions intentionally removed through governance.
   Role status is bootstrap-owned only before the marker: a marked repeat seed must not reactivate
   an existing inactive role.

**Rationale**: Reusing `case.update.any` for creation makes the API contract misleading. Own-user
notification access is safe for all staff and makes the unified center usable without broad data
access.

**Alternatives rejected**:

- Implicit creation through update permission: rejected as contract drift.
- Office Admin-only notifications: rejected because generic notifications are user-owned and other
  staff roles also need their own delivery channel.
- Reapply all JSON defaults on every seed: rejected because it would make role-governance changes
  non-durable and make an intentionally empty role impossible.
- Write the bootstrap marker unconditionally in the migration: rejected because migrations run
  before the first seed on a fresh database and would suppress all initial default assignments.

## R6 — Unified notification semantics

**Decision**: Define the attention count as:

`unread generic notifications owned by the actor + unreviewed consultations visible to the actor`

Project both sources into a discriminated queue item and deduplicate by `(resourceType, resourceId)`
when a generic notification references the same consultation. A generic row is cleared by the
existing idempotent mark-read operation. A consultation row is cleared only by its review workflow;
opening or marking a generic notification never pretends to review a consultation.

Counts are computed from the complete permission-scoped unread/review sets before the response item
limit is applied; the per-source limit controls only the bounded item list. Generic `actionUrl`
values are normalized through an internal-admin-path allowlist. Absolute, protocol-relative,
`javascript:`, `data:`, control-character, or otherwise invalid values fall back to the canonical
route for the notification resource type and never become a browser link. A syntactically valid
internal URL is also resolved through the current principal's canonical admin route capability;
for a known dynamic resource route, its ID is checked through the canonical object-scope builder.
After permission removal or object reassignment it falls back to an authorized semantic list,
`/admin/notifications`, or no action, and never reveals an inaccessible resource path.

The bell keeps a bounded recent preview. The protected center uses opaque cursor pagination over the
deduplicated projection, ordered by `createdAt desc`, then `kind asc`, then `id asc`. Its cursor
encodes that last projected tuple; pages must have neither gaps nor repeats even when the duplicate
counterpart lies beyond one source's first fetch. A legacy `limit` remains a preview-only alias;
the complete center uses `pageSize` (1–50) and `nextCursor` until exhaustion.

**Rationale**: The existing bell returns both sources but renders only consultations. Separate
semantics preserve audit and workflow truth while providing one understandable badge.

**Alternatives rejected**:

- Mark consultations read: rejected because review is a business transition, not a view event.
- Sum both lists without dedupe: rejected because it can overstate attention work.

## R7 — Role-governance safety

**Decision**: `Guest`, `Client`, and `Super Admin` are immutable system roles. `Lawyer`,
`Secretary`, `Office Admin`, and `Marketing Staff` are editable. Only an exact active Super Admin
with both `role.manage.any` and `permission.manage.any` may access the matrix or update assignments.
Updates accept canonical permission keys only, run atomically with an audit event, and reject stale
or concurrent writes through a version/updated-at precondition.

Because exact Super Admin is a policy bypass rather than a stored assignment, the UI displays its
effective wildcard as read-only. At least one active exact Super Admin account must remain.
An inactive role remains visible for governance context but is read-only and cannot be a permission
mutation target. Runtime role status is authoritative after bootstrap; marked seed runs preserve it.

**Rationale**: Editing system-role assignments creates false expectations and can remove the only
governance path. The current policy explicitly bypasses stored permissions for exact Super Admin.

**Alternatives rejected**:

- Editable Super Admin permission rows: rejected because they do not control the exact-role bypass.
- Client-side lockout prevention: rejected because concurrent or direct API calls can bypass it.

## R8 — Manual case creation and replay safety

**Decision**: Add `POST /api/admin/cases` and `PATCH /api/admin/cases/{caseId}` over service-owned
Zod schemas. Validate active existing client, eligible assignee, file-number uniqueness, approved
editable fields, and role/object scope before a transaction. Use the required client-generated UUID
`requestToken` as the new case UUID. Normalize the accepted create payload (stable field ordering,
trimmed strings, canonical null/omitted handling, and parties in submitted order), hash it with
SHA-256. Match the token through `AuditLog.resourceId = LegalCase.id`, the actor through
`AuditLog.actorId`, and store only `requestHash` in the direct creation audit metadata so existing
audit redaction cannot mask replay identity. The
existing `LegalCase.id` primary key is the atomic replay/concurrency guard: only the same actor,
token, and request hash returns the original audited case; a different actor or payload returns
`409`. Case, optional parties, and the direct transactional audit row commit or roll back together;
the best-effort audit helper is not used for this write. PLAN-35 does not claim a semantic duplicate
rule across different request tokens; existing `internalFileNumber` uniqueness still applies.

Core edit preserves existing object scope, but `assignedLawyerId` is stricter: only
`case.update.any` may change it. An actor with `case.update.assigned` may edit the other approved
fields while the case remains assigned, but cannot transfer the case to self or another lawyer.
The optimistic update and a redacted before/after core-change audit row commit in one transaction;
stale version or audit failure rolls back the edit.

**Rationale**: The current routes are read-only for these operations even though the documented
workflow promises a manual path. Network retries are an explicit edge case.

**Alternatives rejected**:

- Convert a placeholder consultation: rejected because it corrupts consultation analytics and
  audit meaning.
- UI-only duplicate prevention: rejected because retries and direct API calls bypass it.
- Audit-metadata lookup as the only replay lock: rejected because JSON metadata has no uniqueness
constraint and cannot by itself prevent two concurrent inserts.
- A pre-check for a fuzzy title/client duplicate: rejected because no accepted unique key or schema
  constraint can make it concurrency-safe without reopening the specification.

The existing human file reference may rarely collide because it uses a shortened UUID fragment.
The unique database constraint remains authoritative. A collision returns stable
`CASE_REFERENCE_CONFLICT`; no case/audit/party commits. The form preserves entered values,
generates a fresh request UUID only for the explicit retry action, and resubmits. Widening the
reference format is deferred because it changes a shared consultation/manual business identifier.

## R9 — Dashboard response and failure isolation

**Decision**: Replace broad Prisma record serialization with a purpose-built versioned snapshot:
`generatedAt`, permission-filtered metric definitions, bounded priority items, authorized action
IDs, and per-widget `ready | unavailable` states. Keep compatibility fields only until all internal
consumers migrate and contract tests approve removal.

Widget queries execute through independent guarded loaders so one optional source failure does not
blank the page. Raw errors, permission keys, client PII, case notes, and unused relational fields
never reach the browser.

**Rationale**: Current `Promise.all` behavior is all-or-nothing and broad records increase privacy
and compatibility risk.

**Alternatives rejected**:

- Client fetch per widget: rejected because it adds waterfalls and duplicates authorization/error
  handling.
- Cache now: rejected because correctness and scope consistency precede caching, and no measured
  bottleneck justifies it.

## R10 — UI, responsive navigation, and design-system reuse

**Decision**: Keep the existing Arabic shell and component system. Desktop retains grouped
navigation; below `lg`, replace the horizontal overflow strip with a native modal `<dialog>`
anchored to logical `inline-start`. It uses modal focus containment/inert background, body scroll
lock, Escape and explicit close, focus restoration, close-on-navigation, `aria-expanded`,
`aria-controls`, `aria-current`, and 44px targets. Reuse `Card`, `Badge`, `ButtonLink`, `MaterialSymbol`,
`StateBlock`, `DataTable`, `DataRecordCard`, `FilterBar`, `SearchInput`, and existing tokens.

Because the current visual shell is owned by individual pages, add a nonvisual server
`admin/layout.tsx` that authenticates staff and passes only filtered navigation plus the safe user
label through an admin access context. Loading/error/not-found boundaries consume that context and
render `DashboardShell`; raw permission arrays are not serialized. Page-level domain guards remain
independent and render the same shell-preserving state.

New command-center composites are domain components, not new primitives. No chart, drawer,
animation, state, or localization dependency is introduced. Shared primitive changes are made
once, tested, then adopted by call sites.

**Rationale**: The current design language is coherent; the problems are hierarchy, incomplete
states, and mobile discoverability rather than missing libraries.

**Alternatives rejected**:

- Full admin redesign: rejected as unnecessary regression risk.
- New UI/chart framework: rejected by scope and because the required operational queues are better
  represented as accessible lists.
- Move every existing page shell into one visual layout: rejected because it would require a broad
  page-header migration unrelated to the remediation; the safe context layout solves boundary
  continuity with a smaller, testable change.

## R11 — Arabic copy and stable error behavior

**Decision**: Extend `src/lib/ui-copy.ts` with semantic PLAN-35 message keys and extend
`src/server/http/errors.ts` only where a stable machine code is required (including planned
`APPOINTMENT_CONFLICT`). UI consumes Arabic display helpers and maps code/status to recovery text;
it never renders raw server exceptions or permission keys. Mixed Arabic/English identifiers use
existing formatters and direction isolation.

**Rationale**: The repository already has a copy/message system; localized ad-hoc strings would
reintroduce inconsistency.

**Alternatives rejected**:

- Add a new i18n framework: rejected because the protected admin remains Arabic-first in this plan.
- Use English service messages as UI copy: rejected for usability and information-leak reasons.

## R12 — Storage settings truthfulness

**Decision**: Filesystem paths, malware scanner status, limits, and other environment-owned storage
configuration are read-only effective runtime diagnostics. Add one server-only
`src/server/storage/runtime-diagnostic.ts` derivation that runs on settings load, never polls, and:

- validates that the effective private upload root is configured, accessible, and writable without
  returning the path;
- reports scanner mode plus `disabled | reachable | unreachable`, using the existing bounded
  `pingClamAv` check (maximum two seconds) only when scanning is required;
- derives `configured` only when the root is valid/writable and every required scanner is reachable,
  `degraded` when the nonproduction policy explicitly permits a disabled scanner, and `unavailable`
  for an invalid/unwritable root or unreachable required scanner; and
- returns environment-owned limits/source/readiness only, omitting the legacy database row's
  `value`, `updatedAt`, and `updatedBy` as well as every path or secret.

The generic settings array excludes `storage.policy` completely because its stored JSON may contain
an absolute `uploadsDir`; the runtime diagnostic is the only storage-policy response member.

The settings UI may edit only values whose runtime readers actually consume the database setting.
The response includes this exact diagnostic rather than making it optional.

**Rationale**: The current storage policy UI can imply that saving changes runtime behavior while
the runtime reads environment configuration.

**Alternatives rejected**:

- Make server paths editable in the database: rejected as a security and deployment-boundary risk.
- Hide all diagnostics: rejected because operators still need truthful readiness information.

## R13 — Contract and task source of truth

**Decision**: This feature directory owns all PLAN-35 task detail with IDs referenced as
`PLAN-35/T###`. The platform master task list receives one next-ID roll-up pointer only. Planned
routes/permissions are labeled planned until implemented. Status distinguishes planned,
implemented, locally verified, DB-verified, browser-verified, live-accepted, skipped, blocked, and
deferred.

**Rationale**: Duplicating tasks or documenting planned routes as present creates drift and merge
conflicts.

**Alternatives rejected**:

- Copy every task into the master file: rejected because completion state would diverge.
- Count a skipped environment test as passed: rejected because it provides no evidence.

## R14 — Admin-user DTO and live-session safety

**Decision**: Treat the existing `GET/POST /api/admin/users` and
`GET/PATCH /api/admin/users/{userId}` operations as affected PLAN-35 contracts. Replace broad
`include` return values with explicit `select`-based list/detail DTO mappers. The DTO may expose
safe 2FA state/timestamps but never `passwordHash`, `secretEncrypted`, recovery-code material, or a
whole credential record.

Password login and session resolution are valid only when the user is `ACTIVE` with
`deletedAt = null` and the role is `ACTIVE`; session resolution also requires a live session.
Rejected login uses the existing generic invalid-credentials outcome and creates no session/cookie.
`updateAdminUser` runs its role/status change,
final-active-exact-Super-Admin count/lock, affected-session revocation, and redacted audit in one
transaction. Role or access-status changes revoke all target sessions, including the actor's
current session when applicable; the response completes, then the next request requires login.
The last active exact Super Admin cannot be suspended, deleted, or moved to another role, whether
the target is the actor or a different account.

Granting `user.manage.any` to an editable role never permits privilege escalation. A delegated
manager may target and assign only active editable operational roles whose effective permission sets
are subsets of the actor's current effective permissions; both the target's current role and the
requested next role must pass that ceiling inside a single-attempt serializable transaction. The
PATCH carries observed `User.updatedAt`; a conditional version claim prevents lost user updates, and
a concurrent role-permission change produces a stale/serialization `409` rather than replaying the
assignment. Exact Super Admin is required to
read protected-account detail, target a `Super Admin`/`Client`/`Guest` account, cross that ceiling,
or assign `Super Admin`/`Client`; `Guest` remains unavailable as a direct admin assignment. Role
options and per-row actions are filtered by the same server rule, but route/service enforcement is
authoritative.

**Rationale**: Current broad admin-user reads can serialize credential fields, and current session
loading can preserve access after the backing user or role becomes inactive. Self-only protection
does not protect a different final Super Admin account.

**Alternatives rejected**:

- UI redaction after broad serialization: rejected because secrets have already crossed the server
  boundary.
- Checking only the session row: rejected because authorization depends on live user and role state.
- Protecting only the acting account: rejected because another administrator can mutate the final
  exact Super Admin.

## R15 — Contact transition concurrency and audit

**Decision**: A contact state transition conditionally claims the observed allowed source status and
writes its redacted audit row in the same transaction. A same-state request is an idempotent success
with no audit. If two requests race from `NEW` to the same next state, exactly one transition/audit
commits and the loser rereads the final state as idempotent success. A conflicting different target,
invalid reopen, stale conditional update, or audit failure leaves state/audit unchanged.

**Rationale**: A read followed by an unconditional update and best-effort audit can emit duplicate
audit rows or leave an unaudited business transition under concurrency.

**Alternatives rejected**:

- UI debouncing: rejected because direct/concurrent API callers bypass it.
- Post-commit best-effort audit: rejected because the contract requires exact transition evidence.

## R16 — Local implementation without a disposable database

**Decision**: When the workstation has no disposable PostgreSQL target and local database
installation is not authorized, accepted product tasks may continue through code, contract, unit,
type, lint, build, and non-DB browser verification. Database-dependent tasks remain unchecked and
`BLOCKED`; they cannot close a story checkpoint, produce `DB-Verified`, or support release or
production-complete status. The production-connected database is never used for migrations, seed
repetition, mutation fixtures, contention, or concurrency tests.

**Rationale**: This preserves development progress without fabricating database evidence or risking
real legal/client data. It also keeps the exact missing proof visible for later execution against an
isolated target.

**Alternatives rejected**:

- Install PostgreSQL locally: rejected by explicit user instruction.
- Run verification against the live production database: rejected because migration, seed, and
  concurrency scenarios are mutation-heavy and unsafe for production data.
- Treat mocked/unit transaction tests as DB acceptance: rejected because they do not prove actual
  PostgreSQL isolation, migration, query-plan, or contention behavior.
