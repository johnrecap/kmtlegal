# Delivery Requirements Checklist: PLAN-36 Consultation Outcome Lifecycle

**Purpose**: Formal reviewer gate for completeness, clarity, consistency, measurability, and connected-impact coverage before task generation
**Created**: 2026-07-22
**Feature**: [spec.md](../spec.md)

## Scope and lifecycle completeness

- [x] CHK001 Are all six canonical outcomes defined with mutually exclusive business meanings? [Completeness, Spec §FR-001]
- [x] CHK002 Is the exact `endsAt` boundary and absence of a grace period specified? [Clarity, Spec §FR-002–FR-004, Edge Cases]
- [x] CHK003 Is the AND rule for missed versus the OR rule for awaiting result stated without ambiguity? [Clarity, Spec §FR-003–FR-004]
- [x] CHK004 Is automatic success explicitly prohibited and separated from manual facts? [Consistency, Spec §FR-005]
- [x] CHK005 Are final correction and missed recovery distinct flows with preserved history? [Completeness, Spec §FR-013–FR-018]
- [x] CHK006 Are Paymob, 2FA, Prisma upgrade, local DB, charts, analytics, second worker, and PLAN-35 closure explicitly excluded? [Scope, Spec §Out of Scope]

## Data, identity, and concurrency quality

- [x] CHK007 Is primary-booking identity deterministic and are case follow-ups excluded? [Clarity, Spec §FR-006–FR-007]
- [x] CHK008 Are outcome actor, time, reason, note, and version requirements defined with privacy boundaries? [Completeness, Spec §FR-012, FR-038]
- [x] CHK009 Are atomicity and stale-version behavior specified for every manual mutation? [Coverage, Spec §FR-011, FR-014]
- [x] CHK010 Are worker/manual race outcomes and duplicate-protection expectations measurable? [Coverage, Spec §FR-008, SC-002, SC-006]
- [x] CHK011 Are additive migration, indexing, reconciliation, compatibility rollback, and data-retention decisions documented? [Completeness, Spec §FR-031–FR-034]
- [x] CHK012 Is missing-primary behavior specified without falling back to a case appointment? [Edge Case, Spec §Edge Cases]

## Authorization, audit, and privacy quality

- [x] CHK013 Is manual authority defined as the intersection of two exact permissions and mapped to affected roles? [Clarity, Spec §FR-009, Affected Surfaces]
- [x] CHK014 Are lawyer and Marketing Staff denial requirements explicit at the server boundary? [Coverage, US2/AC6]
- [x] CHK015 Are automatic and manual audit actor semantics, separate correction/reopen history, and idempotency requirements covered? [Completeness, Spec §FR-008, FR-012–FR-018]
- [x] CHK016 Are prohibited PII, free-text, credentials, and sensitive payloads defined for logs/audits/evidence? [Security, Spec §FR-038, SC-010]

## Contract and connected-consumer consistency

- [x] CHK017 Are all seven outcome views, count semantics, primary appointment, and canonical outcome data required? [Completeness, Spec §FR-021–FR-023]
- [x] CHK018 Is one authorization/filter scope required across list, dashboard, calendar, and notifications? [Consistency, Spec §FR-024]
- [x] CHK019 Are stale review-alert resolution and duplicate outcome-alert prevention specified? [Coverage, Spec §FR-026]
- [x] CHK020 Are effective calendar states defined without changing generic appointment enums? [Clarity, Spec §FR-025]
- [x] CHK021 Are distinct recoveries specified for not-ready, stale-state, reopen-required, and appointment-conflict failures? [Error Recovery, Spec §FR-037]
- [x] CHK022 Are purpose-built data projections and sensitive-field exclusions captured as a contract obligation? [Privacy, Spec §Affected Surfaces, FR-038]

## UI, Arabic, RTL, and accessibility quality

- [x] CHK023 Is the exact RTL tab order and shareable navigation behavior specified? [Clarity, US4/AC1–AC2]
- [x] CHK024 Are search/filter preservation and first-page reset requirements unambiguous? [Consistency, Spec §FR-023]
- [x] CHK025 Are outcome actor, reason, start/end, and effective-state presentation requirements covered? [Completeness, Spec §UI/Routes impact, US4]
- [x] CHK026 Are confirmation, correction reason, conflict recovery, stale refresh, and input-preservation states defined? [Recovery, US2–US3, Edge Cases]
- [x] CHK027 Are keyboard focus, live announcements, 44px touch targets, mobile overflow, and RTL behavior measurable? [Accessibility, Spec §FR-030]
- [x] CHK028 Are empty, loading, error, denied, conflict, stale, and success states all named? [State Coverage, Spec §FR-030]
- [x] CHK029 Is Cairo formatting defined as one explicit business timezone with a zero-hydration-error outcome? [Clarity, Spec §FR-029, SC-007]
- [x] CHK030 Are central Arabic copy ownership and obsolete runtime roadmap-reference removal specified? [Localization, Spec §FR-028, FR-036]

## Operations, evidence, and release quality

- [x] CHK031 Is the 60-second maximum classification interval objectively measurable? [Acceptance Criteria, Spec §FR-003–FR-004, SC-001]
- [x] CHK032 Is reuse of the existing maintenance process and prohibition of a second process explicit? [Dependency, Spec §FR-033, Out of Scope]
- [x] CHK033 Are one-shot post-migration reconciliation and ongoing idempotent classification distinguished? [Clarity, Spec §FR-032–FR-034]
- [x] CHK034 Are post-restart health duration and restart-counter stability requirements measurable relative to an intentional restart? [Acceptance Criteria, Spec §SC-009]
- [x] CHK035 Are npm and Nginx warning remediations bounded to manual backup-first guidance rather than deploy mutation? [Risk Boundary, Spec §FR-035]
- [x] CHK036 Are local no-DB, disposable/staging DB, browser, deployment, and live evidence labeled separately? [Evidence Quality, Spec §SC-006–SC-010, Assumptions]
- [x] CHK037 Is production fixture creation prohibited without separate authorization and credential rotation deferred until accepted live handoff? [Security, Spec §Out of Scope, Assumptions]
- [x] CHK038 Is PLAN-35 preservation stated so PLAN-36 evidence cannot silently satisfy its open gates? [Consistency, Spec §Out of Scope, Existing Behavior]

## Task executability and conflict control

- [x] CHK039 Does the design name exact shared-file ownership lanes and sequential dependencies? [Executability, Plan §File Conflict Control]
- [x] CHK040 Are tests required before behavior changes for permission, contract, data, race, UI, and deployment risks? [Coverage, Plan §Delivery Phases]
- [x] CHK041 Are implementation stop conditions defined for incomplete checklists, unresolved analysis, unavailable DB evidence, and unapproved production mutation? [Governance, Quickstart §G36-0–G36-10L]
- [x] CHK042 Can every functional requirement be traced to a user story, design decision, contract, data rule, or acceptance gate? [Traceability, Spec §FR-001–FR-038]

## Notes

- Formal release-gate depth; intended for author and reviewer before implementation.
- All 42 requirement-quality items pass after reviewing `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/`, and `quickstart.md`.
- These items validate the written requirements, not the implementation. Runtime evidence is collected through `quickstart.md` and task checkpoints.
