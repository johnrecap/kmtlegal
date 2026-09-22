# FIX-04–07,09: portal visibility and totals

Shared predicates hide DRAFT invoices and INTERNAL_MEETING appointments in portal lists,
dashboard previews, case details, payment-attempt history and assistant context. Only ISSUED/PENDING/OVERDUE
contribute to debt. Prisma decimal sums are grouped by currency without conversion.

Full case/upcoming-appointment counts and full due balances are independent of preview5.
The next action uses the full due-invoice query, including old invoices outside previews.
Missing/foreign case links render a localized safe state without exposing another client's
record. Existing paid/cancelled invoice history remains visible.

Evidence: `tests/server/portal-visibility.test.ts` plus existing portal and component tests.
The rollback-only PostgreSQL lane in `tests/integration/repair23-postgres.test.ts` is
prepared but not executed. See `../REPAIR_23_TRACKER.md` for exact acceptance limits.
