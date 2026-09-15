# 34 — Portal Files (documents + upload)

> Phase 3 · Depends on `00`, `01`, `30`.

## Route

`/client/files` — `src/app/(client)/client/files/page.tsx` + `src/features/portal/document-upload-form.tsx`.

## Components

Documents table (file, case, category, status, upload date, download), DocumentUploadForm (case select, category select, file input, submit) using `ClientPortalSelect` (custom ARIA listbox — keep).

## Issues (audit)

- [P1] Document status badges unreadable on dark (`files/page.tsx:39,55`).
- [P2] Success and error feedback indistinguishable — same blue `role="status"` box (`document-upload-form.tsx:34,64,69,100-104`).
- [P3] No file-size hint, no upload progress (`document-upload-form.tsx:87-95`).

## Tasks

- [ ] T34.1 Table + badges on tokens (both themes); file names `bdi` isolation kept.
- [ ] T34.2 Feedback split: success = success-state InlineFeedback + icon; error = `role="alert"` danger state with localized code mapping (match login-form pattern).
- [ ] T34.3 Upload UX: accepted-types + max-size hint under input; submit shows inline progress (spinner + "uploading…"); disabled state during upload.
- [ ] T34.4 `ClientPortalSelect` restyled to token skin only — ARIA/keyboard behavior untouched.
- [ ] T34.5 Category/status filter chips (optional enhancement) on Badge pattern; empty state with upload CTA.

## Verify

- [ ] Upload success + failure (oversize/rejected type) paths render distinct feedback; e2e or manual.
- [ ] Screenshots 375/1440 × EN/AR × themes.
