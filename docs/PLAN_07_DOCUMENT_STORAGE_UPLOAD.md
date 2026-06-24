# PLAN-07 Document Storage and Upload Contract

## Implemented

- Private VPS filesystem storage helpers in `src/server/storage/vps-storage.ts`.
- Upload allowlist and 5MB size policy in `src/server/storage/upload-policy.ts`.
- Server-side MIME, extension, and magic-byte validation for PDF, DOC, DOCX, JPG/JPEG, and PNG.
- Opaque document file key generation in `src/server/storage/file-keys.ts`.
- Safe attachment download headers in `src/server/storage/download-headers.ts`.
- Document service contract in `src/server/storage/document-service.ts`.
- Generic protected upload route at `src/app/api/files/upload/route.ts`.
- Authorized download route at `src/app/api/files/[documentId]/download/route.ts`.
- Upload and download audit events use redacted metadata.

## Contract Rules

- Files are stored under `UPLOADS_DIR`, defaulting to `/var/lib/kmt-legal/uploads`.
- `UPLOADS_DIR` must never be inside `public/`.
- Nginx must not serve upload paths directly.
- Downloads go through the app route after auth/object-scope checks.
- File names are not trusted for storage paths.
- Responses use `Content-Disposition: attachment`, `Cache-Control: private, no-store`, and `X-Content-Type-Options: nosniff`.

## Tests

- `tests/server/storage-contract.test.ts`

## Still Open

- Full upload/download route smoke needs a migrated PostgreSQL database and writable private uploads directory.
- Virus scanning is deferred unless required by deployment policy.
- UI upload flows are connected in PLAN-14 and PLAN-17.
