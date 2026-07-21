<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Added principles:
  - I. Spec Kit Before Code
  - II. Existing-System and End-to-End Integrity
  - III. Authorization, Contract, and Data Correctness
  - IV. Evidence-Backed Quality and Release Truth
  - V. Arabic-First Accessible Product Design
- Added sections:
  - Platform Constraints
  - Delivery Workflow and Conflict Control
- Removed sections: none; template placeholders were replaced.
- Templates requiring updates:
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/tasks-template.md
  - ✅ .specify/templates/checklist-template.md (compatible without changes)
- Runtime guidance reviewed:
  - ✅ AGENTS.md
  - ✅ README.md
- Follow-up TODOs: none.
-->
# KMT Legal Platform Constitution

## Core Principles

### I. Spec Kit Before Code (NON-NEGOTIABLE)

Every code-bearing change MUST complete the active Spec Kit lifecycle in this order:
constitution check, specification, clarification, implementation plan, requirements
checklist, executable tasks, and cross-artifact analysis. Implementation MUST NOT begin
while a checklist item is incomplete, a clarification is unresolved, or analysis contains
an unresolved CRITICAL or HIGH finding. MEDIUM findings MUST be fixed or explicitly
accepted in the feature artifacts before implementation.

Planning-only requests MUST stop after tasks and analysis. If scope changes later, the
specification and all affected downstream artifacts MUST be regenerated before code work
resumes. This keeps intent, execution, and acceptance evidence aligned.

### II. Existing-System and End-to-End Integrity

Plans and changes MUST be grounded in inspected repository behavior. Existing components,
services, schemas, contracts, helpers, messages, and tests MUST be reused or extended before
new parallel structures are introduced. Every feature slice MUST map the complete connected
impact across UI, state, API/service, data, authorization, user-facing messages, analytics,
tests, documentation, deployment, and downstream consumers.

A slice is not complete when only one layer is delivered. The specification and tasks MUST
cover loading, empty, error, denied, retry, success, and responsive states where relevant,
and MUST name preserved behavior and explicit out-of-scope boundaries.

### III. Authorization, Contract, and Data Correctness

Protected behavior MUST enforce permissions server-side and MUST use one canonical scope
definition per domain so dashboard counts, list pages, APIs, and exports cannot disagree.
Navigation visibility is a usability aid and MUST mirror, but never replace, server-side
authorization. Contract methods, paths, permission keys, DTOs, errors, and status codes MUST
match implementation and tests.

Sensitive admin and legal data MUST use purpose-built field selections and DTOs; raw database
records MUST NOT be serialized when the consumer needs only a subset. State-changing work
MUST define validation, conflict handling, audit behavior, idempotency or duplicate protection
where applicable, and rollback or recovery expectations. Schema changes MUST include migration,
backfill, index, compatibility, and rollback decisions before implementation.

### IV. Evidence-Backed Quality and Release Truth

Risk-based automated tests are mandatory. Contract, permission, scope, and conflict behavior
MUST be covered before the corresponding implementation is accepted. Critical user journeys
MUST have database-backed integration and browser evidence; a skipped test is recorded as
SKIPPED, never PASS. Live smoke checks MUST require the expected success or redirect outcome,
not merely the absence of a server error.

No plan may be marked Done without recorded evidence for the checks required by its quickstart
and release gate. Status reporting MUST distinguish Implemented, Verified Locally, DB-Verified,
Live-Accepted, Blocked, and Deferred. Typecheck, lint, focused tests, full tests, build, database
validation, accessibility/RTL review, and browser verification are required in proportion to
the affected surfaces.

### V. Arabic-First Accessible Product Design

Protected product UI is Arabic-first and RTL by default. Plans MUST reuse the existing design
system and define hierarchy, responsive behavior, keyboard access, focus, screen-reader labels,
and all interaction states. User-facing enums, permission keys, provider errors, and internal
exceptions MUST NOT leak into the UI.

Existing message catalogs and localization helpers MUST be inspected before adding text.
Backend/API failures consumed by UI SHOULD expose stable machine-readable codes and parameters,
with display text localized at the owning surface. New UI libraries or animation dependencies
MUST NOT be added without explicit approval and a documented gap in existing primitives.

## Platform Constraints

- The platform remains a Next.js App Router, TypeScript, Prisma, PostgreSQL, and Tailwind web
  application unless an approved specification changes that decision.
- Product planning remains under `specs/kmt-legal-platform/`. Feature-specific Spec Kit folders
  MAY live beneath it, while the master `tasks.md` and implementation status link to the active
  feature instead of duplicating its task list.
- `src/app/stitch-clone/*` and `stitch_kmt_legal_platform_ui_system/` remain isolated,
  read-only visual inputs. Product components, dynamic data, and backend calls MUST NOT be wired
  into the clone.
- Existing design tokens, components, API helpers, audit utilities, permission helpers, and
  message/localization utilities MUST be reused before adding equivalents.
- Real secrets and real client data MUST NOT be committed, copied into fixtures, logged, or
  included in screenshots and planning artifacts.
- Admin, client, authentication, payment, and API responses remain dynamic and non-shared-cache
  unless an approved plan proves a safe alternative.

## Delivery Workflow and Conflict Control

1. The root agent owns `.specify/**`, `specs/**`, master task registration, task check-off,
   integration, verification, commits, and final handoff.
2. Each active feature MUST have a single `spec.md`, `plan.md`, `research.md`, `data-model.md`,
   `contracts/`, `quickstart.md`, `checklists/`, and `tasks.md` set. The active path MUST be
   recorded in `.specify/feature.json`.
3. Tasks MUST contain exact file paths, explicit dependencies, independent acceptance criteria,
   and a file-conflict control section. Tasks touching the same file or shared schema/policy/
   token/message source MUST be sequential and assigned to one ownership lane. `[P]` is allowed
   only when files and unfinished dependencies do not overlap.
4. Each implementation phase MUST end with its focused tests and a documented checkpoint before
   a dependent phase begins. Shared contracts and guards precede consumer UI.
5. Planning documents MUST state reuse, extension, adapter, refactor, or new-code decisions and
   identify affected roles, routes, APIs, data, tests, docs, and deployment behavior.
6. After repository modifications, relevant checks MUST run, documentation MUST reflect actual
   behavior, and the change MUST be committed and pushed to `origin/main` unless the user
   explicitly opts out. Production handoff MUST use the documented aaPanel/PM2 update process.

## Governance

This constitution governs all Spec Kit artifacts and implementation work in this repository.
System, developer, and explicit user instructions remain higher authority; otherwise a conflict
MUST be resolved in favor of this constitution.

Amendments require an explicit constitution update, a Sync Impact Report, semantic version bump,
and propagation to affected templates and guidance. MAJOR versions remove or redefine governance,
MINOR versions add or materially expand principles, and PATCH versions clarify wording without
changing obligations. Every specification, plan, checklist, task set, review, and pull request
MUST include a constitution compliance check.

**Version**: 1.0.0 | **Ratified**: 2026-07-22 | **Last Amended**: 2026-07-22
