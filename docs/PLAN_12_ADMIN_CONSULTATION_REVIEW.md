# PLAN-12 Admin Consultation Review & Convert To Case

Status: Done

## Scope Delivered

- Added `/admin/consultations` queue with search, status filter, pagination, status/urgency labels, and protected staff access.
- Added `/admin/consultations/[consultationId]` detail review screen.
- Added admin APIs for list, detail, assign, reject, and convert.
- Added service contract for assign/reject/convert with role-scoped review permissions.
- Convert creates or updates the client, creates a case, optionally creates an appointment, updates consultation status, and writes an audit log.
- Lawyers can review only assigned consultations; office admin/super admin can review any consultation by permission.

## Files

- `src/server/admin/consultation-review-service.ts`
- `src/app/admin/consultations/page.tsx`
- `src/app/admin/consultations/[consultationId]/page.tsx`
- `src/app/api/admin/consultations/**/route.ts`
- `src/features/admin/consultations/consultation-action-panel.tsx`
- `tests/server/admin-consultations.test.ts`

## Remaining Runtime Gate

The DB-backed E2E flow `booking -> admin review -> convert` still needs a running PostgreSQL database from PLAN-04.
