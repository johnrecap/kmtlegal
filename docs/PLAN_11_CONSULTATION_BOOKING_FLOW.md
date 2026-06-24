# PLAN-11 Consultation Booking Flow

## Implemented

- Booking page:
  - `/book-consultation`
- Client-side booking stepper with:
  - contact data step
  - request details step
  - review/consent step
  - recoverable error state
  - success/reference state
- Public consultation API:
  - `POST /api/public/consultations`
- Runtime validation via `publicConsultationRequestSchema`.
- Rate-limit hook for booking submissions.
- Duplicate request protection by phone, service category, and recent active status.
- AI Provider Gateway integration for:
  - consultation classification
  - intake summary
- Human-review AI disclaimer shown before and after submission.
- Consultation creation writes `ConsultationRequest` when PostgreSQL is available.
- Confirmation/staff notification email is deferred. The email helper currently returns disabled/skipped metadata without sending.
- Public creation audit log stores non-PII metadata only.

## Contract Rules

- UI never calls AI providers directly.
- AI output is organizer-only and not legal advice.
- The request is not converted into client/case during this plan.
- Admin review/assign/reject/convert starts in PLAN-12.

## Tests

- `tests/server/consultation-contract.test.ts`
- Existing AI/disabled-email/contract tests still pass.

## Still Open

- Runtime DB smoke requires a real migrated PostgreSQL database.
- E2E booking -> admin review -> convert is blocked until PLAN-12 is implemented.
