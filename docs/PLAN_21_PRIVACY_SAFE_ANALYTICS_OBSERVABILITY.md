# PLAN-21 Privacy-Safe Analytics & Observability Events

Last updated: 2026-06-24

Status: Done

## Scope Delivered

- Added a privacy-safe internal analytics event store:
  - Prisma model: `AnalyticsEvent`
  - Table: `analytics_events`
  - No direct user relation.
  - No IP address or user-agent storage.
  - Optional actor hash instead of raw actor id.
  - Environment, release, request id, source, outcome, and strict event properties.
- Added a typed analytics taxonomy for MVP events.
- Added a client-safe analytics endpoint:
  - `POST /api/analytics/events`
  - Accepts only allowlisted public client events.
  - Rate limited.
  - Rejects unknown properties and private values.
- Added safe logging helper:
  - `safeLog(level, event, metadata)`
  - Reuses audit redaction rules for logs.
- Instrumented source-of-truth flows:
  - Booking step view, submit attempt, and submit failure from the booking UI.
  - Consultation submitted after server creation succeeds.
  - Consultation converted to case.
  - Document upload succeeded.
  - Document upload failed with safe error dimensions.
  - Case status updated.
- Added env flags:
  - `APP_RELEASE`
  - `ANALYTICS_ENABLED`

## Data Model

New Prisma enum values:

- `AnalyticsEventSource`
  - `PUBLIC`
  - `PORTAL`
  - `ADMIN`
  - `SERVER`
- `AnalyticsEventOutcome`
  - `INFO`
  - `SUCCESS`
  - `FAILURE`

New Prisma model:

- `AnalyticsEvent`
  - `name`
  - `source`
  - `outcome`
  - `properties`
  - `requestId`
  - `actorHash`
  - `actorRole`
  - `environment`
  - `release`
  - `createdAt`

Indexes were added for event name, source, outcome, request id, actor hash, and created time.

Migration:

- `prisma/migrations/20260624011500_plan_21_analytics_events/migration.sql`

## Event Taxonomy

Allowed event names:

- `booking.step_viewed`
- `booking.submit_attempted`
- `booking.submit_failed`
- `consultation.submitted`
- `consultation.converted_to_case`
- `document.upload_succeeded`
- `document.upload_failed`
- `case.status_updated`
- `observability.error_captured`

Client-submittable events are restricted to:

- `booking.step_viewed`
- `booking.submit_attempted`
- `booking.submit_failed`

All other events must be emitted server-side from trusted services.

## Server Contracts

### `POST /api/analytics/events`

Purpose: capture public client events needed for the booking funnel.

Request body:

```json
{
  "name": "booking.step_viewed",
  "source": "PUBLIC",
  "properties": {
    "step": "contact",
    "stepIndex": 0,
    "serviceCategory": "corporate"
  }
}
```

Response:

```json
{
  "data": {
    "accepted": true
  },
  "requestId": "req_or_uuid"
}
```

The endpoint returns `202` on accepted events and uses the shared API error shape for validation/rate-limit failures.

## Allowed Properties

Examples of allowed properties:

- Booking step key and index.
- Service category slug.
- Urgency enum.
- Preferred mode enum.
- Error code and HTTP status.
- Organizer availability status.
- Email delivery status enum.
- File MIME type from the upload allowlist.
- File size bucket, not exact file name or contents.
- Case/document category/status/visibility enums.
- Actor scope such as `client`, `staff`, `lawyer`, or `admin`.

## Disallowed Properties

Analytics rejects or redacts payloads that contain:

- Names.
- Emails.
- Phone numbers.
- Addresses or city fields.
- Case summaries.
- Legal summaries.
- Document content.
- File names.
- Internal notes.
- AI prompts or raw provider responses.
- Passwords, tokens, cookies, API keys, OTP/TOTP, SMTP details, or secrets.
- Internal case-like identifiers such as `KMT-2026-ABCD`.

The server uses strict Zod schemas plus an additional privacy scan. Unknown properties are rejected.

## Observability Rules

- Product analytics and audit logs remain separate:
  - Audit logs record sensitive administrative accountability.
  - Analytics records aggregate-safe product/operational dimensions.
- Analytics failures are best-effort and must not break product flows.
- Request id is stored for correlation with API errors.
- Environment and release are tagged on each event.
- `safeLog` redacts metadata before writing structured console logs.
- External analytics, Sentry, or observability providers are not wired in PLAN-21.

## Instrumented Sources

- `src/features/public-site/booking-stepper.tsx`
- `src/app/api/analytics/events/route.ts`
- `src/server/consultations/consultation-service.ts`
- `src/server/admin/consultation-review-service.ts`
- `src/server/storage/document-service.ts`
- `src/app/api/files/upload/route.ts`
- `src/server/admin/case-operations-service.ts`

## Dashboard Notes

MVP dashboards can be built later from `analytics_events` with these safe dimensions:

- Booking funnel drop-off by `booking.step_viewed`.
- Booking API failure rate by `booking.submit_failed.errorCode`.
- Consultation submission volume by service category and urgency.
- Conversion count by `consultation.converted_to_case`.
- Upload failure rate by `document.upload_failed.errorCode`, MIME type, and size bucket.
- Case status change volume by previous/current status.

Do not build dashboards that expose raw user identities, names, client contact details, case summaries, document names, document contents, AI prompts, or full request bodies.

## Deferred From MVP

- External analytics provider integration.
- Sentry or hosted observability provider wiring.
- Alerting rules.
- Analytics dashboard UI.
- Automated retention/purge job.
- Cost/performance metrics beyond current safe event dimensions.

## Verification

- `cmd /c npm run db:generate`
- `cmd /c npx vitest run tests/server/analytics-observability.test.ts`
- `cmd /c npm run typecheck`
- `cmd /c npm run test`
- `cmd /c npm run lint`
- `cmd /c npm run build`
- `cmd /c npm run db:validate`

Focused tests:

- `tests/server/analytics-observability.test.ts`

## Remaining Runtime Gate

Applying the new migration still requires a running PostgreSQL database:

- `cmd /c npm run db:migrate:dev`
- `cmd /c npm run db:seed`

After migration, run a browser smoke for booking step events and one upload failure to confirm rows appear in `analytics_events`.
