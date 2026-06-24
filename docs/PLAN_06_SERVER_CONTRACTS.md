# PLAN-06 Server Contracts, Validation, Errors and Audit Foundation

Last updated: 2026-06-24

## Implemented

- Shared API error shape in `src/server/http/errors.ts` with `error.code`, `error.message`, `error.details`, and `error.requestId`.
- Zod validation helpers in `src/server/validation/schemas.ts`.
- Pagination and allowlisted sort utilities in `src/server/http/pagination.ts`.
- Audit primitive in `src/server/audit/audit-service.ts`.
- Recursive audit/log metadata redaction in `src/server/audit/redaction.ts`.
- In-memory rate-limit hooks for login, 2FA, booking, contact, upload, and AI in `src/server/rate-limit/memory-rate-limit.ts`.
- Auth login and 2FA API routes use shared validation, rate limits, no-store responses, and shared error handling.
- Email template/rendering abstraction exists in `src/server/email/*` for future SMTP activation.
- Current release behavior: SMTP runtime is disabled, `sendTemplatedEmail` returns safe `mode: "disabled"` metadata, and Email OTP routes return `FEATURE_DISABLED`.

## Contract Rules

- Route handlers validate request bodies/query params before calling services.
- Protected mutations must check auth and permission server-side.
- Services throw `ApiError`; routes translate with `errorToResponse`.
- Audit metadata must be minimized and redacted.
- SMTP secrets are never stored in `SystemSetting`.
- `SMTP_ENABLED` must remain `false` until a future SMTP activation plan re-enables UI/backend behavior and production smoke tests.

## Tests

- `tests/server/contracts-core.test.ts`
- `tests/server/email-service.test.ts`
- Existing auth tests still pass.

## Still Open

- Replace in-memory rate limiting with a distributed store before multi-process production.
- DB-backed route integration tests still require a real PostgreSQL `DATABASE_URL`.
- CSRF/origin hardening remains in PLAN-22.
- Future SMTP activation must add provider selection, production SMTP smoke, delivery retry policy, and Email OTP UX/tests before enabling the backend.
