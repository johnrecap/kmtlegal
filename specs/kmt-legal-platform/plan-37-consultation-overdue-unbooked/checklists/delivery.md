# Delivery Requirements Checklist: PLAN-37 Consultation Overdue-Unbooked Recovery

**Purpose**: Formal connected-impact and implementation-readiness gate before task execution
**Created**: 2026-07-22
**Feature**: [spec.md](../spec.md)

## Operational timing and view quality

- [x] CHK001 Is 72 hours defined as exact elapsed time from `createdAt`, with equality included in overdue? [Clarity, FR-001]
- [x] CHK002 Are current and overdue predicates mutually exclusive and complete for active no-primary requests? [Consistency, FR-001–FR-006]
- [x] CHK003 Is a future primary booking current regardless of creation month, while an ended booking is excluded pending PLAN-36 classification? [Coverage, FR-003–FR-004]
- [x] CHK004 Is primary booking identity preserved and case follow-up exclusion explicit? [Correctness, Edge Cases]
- [x] CHK005 Is one `asOf` required across records/counts and exposed in the contract? [Consistency, FR-007–FR-008]
- [x] CHK006 Is overdue-unbooked explicitly derived rather than persisted or classified as missed? [Data, FR-005]

## Scheduling and concurrency quality

- [x] CHK007 Are schedule eligibility and all required fields/limits testable? [Completeness, FR-010–FR-011]
- [x] CHK008 Is the exact permission intersection enforced server-side and mapped to roles? [Authorization, FR-012]
- [x] CHK009 Are active-lawyer and lawyer/client conflict checks required through existing policy? [Correctness, FR-013]
- [x] CHK010 Are client link, appointment, assignment, review, version, audit, and notifications one transaction? [Atomicity, FR-014]
- [x] CHK011 Are stale version, newly existing appointment, incompatible state, serialization race, and resource conflict recoveries distinct? [Recovery, FR-015–FR-016]
- [x] CHK012 Is exactly-one-primary duplicate protection covered without schema changes? [Concurrency, SC-003]

## Legacy reconciliation, audit, and privacy quality

- [x] CHK013 Is converted no-primary mapping deterministic, reasoned, idempotent, and free of fake appointments? [Data, FR-017]
- [x] CHK014 Is the manual no-primary result exception restricted to the explicit converted legacy marker? [Safety, FR-018]
- [x] CHK015 Is rejected no-primary cancellation evaluated before generic missing-primary skip? [Coverage, FR-019]
- [x] CHK016 Are repeated-run and race duplicate protections required for audit and notification? [Idempotency, FR-020]
- [x] CHK017 Is derived overdue detection prohibited from creating a transition audit? [Audit semantics, FR-026]
- [x] CHK018 Are names, contacts, notes, credentials, raw records, and internal errors excluded from logs/audits/evidence? [Privacy, FR-024, FR-026]

## Connected consumer and UI quality

- [x] CHK019 Are eight views, order, count, URL, compatible filters, and page reset defined? [Contract/UI, FR-008–FR-009]
- [x] CHK020 Are overdue notification creation, dedupe, persistence after review/assignment, and resolution after booking/closure explicit? [Notifications, FR-021]
- [x] CHK021 Is the dashboard card role-scoped, linked, defined, and chart-free? [Dashboard, FR-022]
- [x] CHK022 Is the creation-date label and Cairo overdue presentation unambiguous? [Localization, FR-023]
- [x] CHK023 Is central copy ownership required so internal enums/reasons/errors do not leak? [Localization, FR-024]
- [x] CHK024 Are loading/empty/denied/validation/conflict/stale/success/retry states and input preservation covered? [State quality, FR-016, FR-025]
- [x] CHK025 Are RTL, mobile overflow, keyboard focus, live regions, labels, and 44px touch targets measurable? [Accessibility, FR-025]

## Evidence, operations, and conflict control

- [x] CHK026 Are characterization tests required before implementation for boundary, legacy, contract, permission, and race risks? [Quality, SC-001–SC-006]
- [x] CHK027 Are local no-DB, safe browser, staging DB, server deploy, and live evidence separated? [Release truth, FR-028]
- [x] CHK028 Are Prisma/schema/migration/local DB/production fixtures/new worker/new UI library explicitly excluded? [Scope]
- [x] CHK029 Are exact sequential file ownership lanes and no-subagent/no-`[P]` constraints recorded? [Conflict control, Plan]
- [x] CHK030 Can every FR and SC be traced to an executable task and a stop condition? [Traceability, Tasks]

## Notes

- All 30 written-requirement checks pass.
- Runtime evidence remains pending until the corresponding task and quickstart gate execute.
