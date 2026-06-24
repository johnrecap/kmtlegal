# PLAN-19 Admin Finance & Reports Basics

Last updated: 2026-06-24

Status: Done

## Scope Delivered

- Added `/admin/finance` for MVP manual invoice/payment records:
  - Search by invoice, receipt, payment method, notes, client, case.
  - Filters for status, currency, client, case, issue date range, sorting, and pagination.
  - Summary cards for total, paid, open, and overdue invoices.
  - Create and edit form for the agreed MVP invoice fields.
- Added `/admin/reports` for basic operational reporting:
  - Date range and currency filters.
  - Finance snapshot by payment status.
  - Consultation, case, and task status breakdowns.
  - Client total/active counts.
  - Recent invoices inside the report range.
- Added sidebar navigation entries for finance and reports.

## Server Contracts

- `GET /api/admin/finance`
- `POST /api/admin/finance`
- `GET /api/admin/finance/{paymentId}`
- `PATCH /api/admin/finance/{paymentId}`
- `GET /api/admin/reports`

All contracts reuse the existing session lookup, RBAC policy helpers, Zod validation, request id, standard error response shape, and no-store response headers.

## Data Model

No Prisma migration was required. PLAN-19 reuses the existing `Payment` model from PLAN-04:

- `invoiceNumber`
- `clientId`
- `caseId?`
- `issueDate`
- `dueDate?`
- `amount`
- `currency`
- `status`
- `paymentMethod?`
- `receiptNumber?`
- `paidAt?`
- `notes?`
- `createdById`
- timestamps

The service validates that selected cases belong to the selected client before writes.

## Permissions

- Finance list/detail requires `finance.read.any` or `finance.manage.any`.
- Finance create/update requires `finance.manage.any`.
- Reports require `report.read.any`.
- Client portal payment read remains separate through `payment.read.own`.
- UI gating is not the security boundary; all finance/report services and APIs enforce permissions server-side.

## Audit Events

- Creating a manual invoice appends `finance.payment_create`.
- Updating a manual invoice appends `finance.payment_update`.
- Audit metadata includes invoice number, client/case references, status, amount, and currency. It does not include payment gateway data because there is no gateway in MVP.

## Guardrails

- Write schemas are strict and reject non-MVP accounting fields such as tax, line items, gateway payloads, settlement, refunds, and ledger details.
- `paidAt` can only be saved when status is `PAID`; if status is `PAID` and no paid date is provided, the server records the current time.
- Aggregated amount cards warn when the view mixes currencies. Use the currency filter for comparable financial totals.
- Reports are operational dashboards, not accounting, tax, or legally binding financial statements.

## Deferred From MVP

- Payment gateway integration.
- Tax, discounts, line items, refunds, chargebacks, settlement, and accounting ledger.
- Export policy and downloadable financial reports.
- Accounting software integration.
- Advanced revenue attribution by lawyer/service beyond current MVP status summaries.

## Verification

- `cmd /c npx vitest run tests/server/admin-finance-reports.test.ts`
- `cmd /c npm run typecheck`
- `cmd /c npm run test`
- `cmd /c npm run lint`
- `cmd /c npm run build`
- `cmd /c npm run db:validate`
- Controlled local dev smoke:
  - `/login` returns 200.
  - `GET /api/admin/finance` returns 401 without a session.
  - `GET /api/admin/reports` returns 401 without a session.

Focused tests:

- `tests/server/admin-finance-reports.test.ts`

## Remaining Runtime Gate

DB-backed authenticated browser smoke waits for a running PostgreSQL database from PLAN-04. The pages and APIs are implemented, but live invoice create/update should be smoke-tested after `DATABASE_URL` points to a migrated database.
