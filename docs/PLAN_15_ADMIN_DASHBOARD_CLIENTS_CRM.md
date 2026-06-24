# PLAN-15 Admin Dashboard & Clients CRM

Status: Done

## Scope Delivered

- Replaced `/admin` placeholder with real permission-scoped dashboard metrics.
- Added dashboard operational lists for latest clients, upcoming appointments, recent consultations, and recently updated cases.
- Added `/admin/clients` CRM list with search, status/source/lawyer filters, sorting, pagination, and no-results recovery.
- Added `/admin/clients/[clientId]` detail view with profile, linked cases, consultations, appointments, and counts.
- Added client create, edit, assign, and archive actions with server-side validation and audit logs.
- Added protected API contracts for dashboard and client CRM routes.
- Added contract tests for CRM read/write permissions, scoped filters, and schemas.

## Files

- `src/server/admin/dashboard-service.ts`
- `src/server/admin/client-crm-service.ts`
- `src/app/admin/page.tsx`
- `src/app/admin/clients/page.tsx`
- `src/app/admin/clients/[clientId]/page.tsx`
- `src/app/api/admin/dashboard/route.ts`
- `src/app/api/admin/clients/**/route.ts`
- `src/features/admin/clients/client-crm-forms.tsx`
- `tests/server/admin-client-crm.test.ts`

## Permission Contract

- Office Admin and Super Admin can read and update client CRM records.
- Lawyer can read only assigned client records.
- Marketing Staff can enter admin shell but cannot read client CRM data unless permissions are expanded later.
- Client CRM actions never rely on hidden UI only; server routes enforce permissions again.

## Out Of Scope

- Full case lifecycle, sessions, and calendar management were intentionally outside PLAN-15 and are delivered in PLAN-16.
- Document management is delivered in PLAN-17.
- Finance records and reports remain in PLAN-19.
- Audit log search remains in PLAN-18.

## Remaining Runtime Gate

DB-backed browser smoke waits for a running PostgreSQL database from PLAN-04.
