# PLAN-14 Client Documents, Appointments, Payments & Profile

Status: Done

## Scope Delivered

- Added `/portal/documents` with visible document list and client upload form using the PLAN-07 upload contract.
- Added authorized download links through `/api/files/[documentId]/download`.
- Added `/portal/appointments` and `/portal/payments` read-only pages.
- Added `/portal/profile` with editable client profile basics.
- Updated portal navigation and layout grid to include profile without mobile overflow.
- Reused private VPS storage, 5MB upload limit, allowlisted file types, authz, and audit contracts.

## Files

- `src/app/portal/documents/page.tsx`
- `src/app/portal/appointments/page.tsx`
- `src/app/portal/payments/page.tsx`
- `src/app/portal/profile/page.tsx`
- `src/features/portal/document-upload-form.tsx`
- `src/features/portal/profile-form.tsx`
- `src/app/api/portal/profile/route.ts`
- `tests/server/portal-access.test.ts`

## Remaining Runtime Gate

Upload/download smoke needs PostgreSQL plus a writable private `UPLOADS_DIR`.
