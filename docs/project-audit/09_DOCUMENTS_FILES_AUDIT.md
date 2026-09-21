# 09 — Documents & Files Audit

Lifecycle: upload (client/admin same API) → server validation → private
disk → metadata row → visibility-gated download → status workflow →
soft-delete. Status: PARTIAL (MEDIUM).

## Per-question answers

1. Client upload: YES — `DocumentUploadForm` → `POST /api/files/upload`
   (`multipart file+caseId+category`, `visibility=CLIENT_VISIBLE` forced).
2. Admin upload: YES — `AdminDocumentUploadForm`, same endpoint.
3. Download: YES — `GET /api/files/[documentId]/download` with
   `Content-Disposition: attachment`, sanitized filename, `nosniff`,
   `private,no-store`.
4. Visibility: `CLIENT_VISIBLE|STAFF_ONLY|INTERNAL_ONLY`; client portal
   query restricts to `CLIENT_VISIBLE` + ownership/case link.
5. Ownership: `ownerClientId` + `uploadedById` (Restrict) + optional
   `caseId`.
6. Case relationship: optional; cross-client upload → 403; owner≠case.client
   → 400 (`document-service.ts:134-167`).
7. Category: `DocumentCategory` enum; Status: `NEW|UNDER_REVIEW|
   NEEDS_CLARIFICATION|ACCEPTED|REJECTED` (+`DELETED` marker).
8. Deletion: soft only (`status=DELETED + deletedAt`), `confirmDelete
   literal(true)` + dialog; bytes retained on disk; post-delete download
   404 (test-proven).
9. Approval/review: status workflow exists; no multi-step approval chain.

## Validation (UI vs SERVER)

| Check | UI | Server | Verdict |
|---|---|---|---|
| Extensions (pdf/doc/docx/jpg/png) | `accept` attr (bypassable) | allowlist + ext↔MIME match → 415 | SERVER enforced |
| Max size 5MB (+512KB overhead → 413) | none | `assertMultipartContentLengthAllowed` + `assertUploadAllowed` | SERVER enforced |
| MIME spoofing | none | magic bytes (PDF/JPEG/PNG/DOC/DOCX) → 415 | SERVER enforced |
| Path traversal | n/a | `resolvePrivateFilePath` rejects `..`/absolute/NUL | SERVER enforced |
| Filename injection | n/a | `sanitizeDownloadFileName` + RFC attachment headers | SERVER enforced |
| Malware | n/a | ClamAV `zINSTREAM`; prod `required`, local `disabled` | SERVER enforced (env-gated) |
| Auth on upload/download | n/a | session required + `canReadDocument` branches | SERVER enforced |

## Storage

- Driver: `vps-filesystem` only (`UPLOADS_DIR ?? /var/lib/kmt-legal/uploads`);
  no S3/R2 SDK anywhere. Keys `documents/YYYY/MM/DD/uuid.ext` (user
  filename never touches disk). Uploads root cannot be inside `*/public/*`;
  Nginx `location ^~ /uploads/ {return 404;}` — bytes never web-served.
- Deletion gap: no byte cleanup, no retention policy, no quota per client
  (P3). No versioning (P3). No antivirus fallback if ClamAV down in prod
  (hard 503 — correct fail-closed, ops must ensure ClamAV).
