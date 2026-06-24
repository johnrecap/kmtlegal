# PLAN-16 Admin Cases, Sessions & Calendar

Status: Done

## Scope Delivered

- Added `/admin/cases` with case search, status/priority/type/lawyer filters, sort controls, pagination, and no-results recovery.
- Added `/admin/cases/[caseId]` with internal tabs for overview, sessions, and appointments.
- Added case status updates with required confirmation and audit logging.
- Added case session creation with court/date/decision/next-action fields and `nextSessionAt` updates.
- Added `/admin/calendar` with date/status/mode/lawyer filters, appointment creation for open cases, and appointment reschedule flow.
- Added protected API contracts for case list/detail/status/session routes and calendar list/create/reschedule routes.
- Added role-scope tests for Office Admin any-case access versus assigned-lawyer access.
- Updated admin navigation and existing dashboard/client links to point at real case detail routes.

## Files

- `src/server/admin/case-operations-service.ts`
- `src/app/admin/cases/page.tsx`
- `src/app/admin/cases/[caseId]/page.tsx`
- `src/app/admin/calendar/page.tsx`
- `src/app/api/admin/cases/**/route.ts`
- `src/app/api/admin/calendar/**/route.ts`
- `src/features/admin/cases/case-action-forms.tsx`
- `tests/server/admin-cases.test.ts`
- `src/app/admin/admin-navigation.ts`
- `src/lib/legal-format.ts`

## Permission Contract

- Office Admin and Super Admin can read/update any case, manage sessions, and manage calendar appointments.
- Lawyer can read/update only assigned cases and can create sessions/reschedule appointments for assigned cases.
- Marketing Staff can enter admin shell but cannot read cases or calendar data unless permissions expand later.
- Server services enforce permissions again; UI visibility is not the security boundary.

## API Contract

- `GET /api/admin/cases`
- `GET /api/admin/cases/[caseId]`
- `POST /api/admin/cases/[caseId]/status`
- `POST /api/admin/cases/[caseId]/sessions`
- `GET /api/admin/calendar`
- `POST /api/admin/calendar`
- `POST /api/admin/calendar/[appointmentId]/reschedule`

All routes use existing session lookup, shared error shape, Zod validation, no-store responses, and audit events for mutations.

## Out Of Scope

- Task Kanban/list management is delivered in PLAN-17.
- Admin document upload/status workflow is delivered in PLAN-17.
- Finance records and reports remain in PLAN-19.
- Users/settings/audit-log search remains in PLAN-18.

## Verification

- `npm run test`
- `npm run db:validate`
- `npm run lint`
- `npm run typecheck`
- `npm run db:generate`
- `npm run build`
- Local unauthenticated smoke:
  - `/login` returns 200.
  - `/admin/cases` redirects to `/login?next=%2Fadmin%2Fcases`.
  - `/admin/calendar` redirects to `/login?next=%2Fadmin%2Fcalendar`.
  - `/api/admin/cases` returns 401.
  - `/api/admin/calendar` returns 401.

## Remaining Runtime Gate

DB-backed authenticated browser smoke waits for a running PostgreSQL database from PLAN-04.
