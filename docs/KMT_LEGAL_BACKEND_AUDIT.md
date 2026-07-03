# KMT Legal Backend Audit

Last updated: 2026-07-03

## Current Backend Strengths

- Next.js API routes consistently use request IDs, Zod validation, structured errors, and no-store responses.
- Prisma data model has clear ownership relations for clients, cases, appointments, documents, finance, audit, analytics, and conversations.
- Auth, RBAC, portal ownership, and admin page guards are established.
- AI provider integration is server-side and already has legal-scope guardrails.

## Payment Backend Implemented

- Provider-neutral services under `src/server/payments/`.
- Server-only `PricingService` resolves booking fee from active `ConsultationPricingRule`.
- Public checkout endpoint creates a `PaymentAttempt` only after re-validating client data, slot availability, duplicate protection, and price.
- Appointment is created as `RESERVED` and consultation as `PAYMENT_PENDING`; `SCHEDULED` is set only after trusted paid webhook.
- Webhook route stores signature status, processing status, payload hash, safe normalized payload, replay count, and provider references.
- Idempotency is enforced by webhook event id and payment transaction reference.
- Expired attempts release the reserved appointment and return the consultation to review.
- `Payment` remains the internal invoice/receipt record and is created after successful provider confirmation.

## Backend Risks And Follow-Ups

- Provider live API integration is intentionally not hardcoded yet. `PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE` is a safe bridge until the selected provider API credentials and contract are finalized.
- PayTabs-specific signature/header rules must be finalized against merchant docs and sandbox payloads.
- Replay now reprocesses safe normalized payload, not raw provider payload. If a provider requires richer replay data, add allowlisted normalized fields only.
- Refunds/disputes are modeled but not operationalized in v1 UI.
- Manual payment fallback needs separate models or workflow fields for admin verification, proof attachment, and audit logs.
- Production should move rate limiting from in-memory to shared storage if multiple instances are used.

## Verification Targets

- `npm run db:validate`
- `npm run db:generate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- DB-backed smoke on migrated PostgreSQL.
- Provider sandbox smoke for checkout creation, webhook success, duplicate webhook, invalid signature, failure, expiry, and reconciliation.
