# PLAN-17 Admin Tasks & Document Management

Status: Done

## Scope Delivered

- Added `/admin/tasks` with task board columns, search, all/mine/overdue filters, status/priority/assignee filters, sort controls, pagination, and empty states.
- Added `/admin/documents` with document search, status/category/visibility/client filters, sort controls, private download links, upload form, status/visibility update, and confirmed soft delete.
- Added task and document tabs to `/admin/cases/[caseId]`.
- Added protected admin task APIs:
  - `GET /api/admin/tasks`
  - `POST /api/admin/tasks`
  - `PATCH /api/admin/tasks/[taskId]`
- Added protected admin document APIs:
  - `GET /api/admin/documents`
  - `PATCH /api/admin/documents/[documentId]`
  - `POST /api/admin/documents/[documentId]/delete`
- Reused the PLAN-07 protected file routes for upload and download:
  - `POST /api/files/upload`
  - `GET /api/files/[documentId]/download`
- Added audit events for task create/update and document update/delete; upload/download audit remains in PLAN-07 service.
- Tightened upload target validation so document uploads cannot attach a file to another client's case or mismatch owner client and case client.

## Files

- `src/server/admin/task-document-service.ts`
- `src/features/admin/task-documents/task-document-forms.tsx`
- `src/app/admin/tasks/page.tsx`
- `src/app/admin/documents/page.tsx`
- `src/app/admin/cases/[caseId]/page.tsx`
- `src/app/api/admin/tasks/route.ts`
- `src/app/api/admin/tasks/[taskId]/route.ts`
- `src/app/api/admin/documents/route.ts`
- `src/app/api/admin/documents/[documentId]/route.ts`
- `src/app/api/admin/documents/[documentId]/delete/route.ts`
- `src/server/storage/document-service.ts`
- `src/app/admin/admin-navigation.ts`
- `src/lib/legal-format.ts`
- `tests/server/admin-task-documents.test.ts`

## Permission Contract

- Office Admin and Super Admin can manage all tasks and documents through `task.manage.any` and `document.manage.any`.
- Lawyer can read/manage assigned tasks through `task.read.assigned` and `task.manage.assigned`.
- Lawyer can read assigned documents through `document.read.assigned`, but cannot mutate document status/visibility unless granted document management permission.
- Marketing Staff has no task/document operational access by default.
- Server services enforce the same boundaries as the UI; hidden buttons are not the security boundary.

## Data And Storage Contract

- No schema change was needed; PLAN-04 already defined `Task` and `Document`.
- Task writes validate title, description, status, priority, assignee, case, and due date.
- Document admin writes validate status, category, visibility, and delete confirmation.
- Admin document upload still uses private VPS storage, 5MB file limit, MIME/content validation, generated file keys, and authorized app-streamed downloads from PLAN-07.
- Deleted documents are soft-deleted with `status = DELETED` and `deletedAt` set.

## Verification

- `cmd /c npx vitest run tests/server/admin-task-documents.test.ts`
- `cmd /c npm run test`
- `cmd /c npm run typecheck`
- `cmd /c npm run lint`
- `cmd /c npm run db:validate`
- `cmd /c npm run db:generate`
- `cmd /c npm run build`
- Local unauthenticated smoke:
  - `GET /api/admin/tasks` returns 401.
  - `GET /api/admin/documents` returns 401.
  - `/admin/tasks` redirects to `/login?next=%2Fadmin%2Ftasks`.
  - `/admin/documents` redirects to `/login?next=%2Fadmin%2Fdocuments`.

## Remaining Runtime Gate

DB-backed authenticated browser smoke waits for a running PostgreSQL database from PLAN-04 and a writable private `UPLOADS_DIR`.
