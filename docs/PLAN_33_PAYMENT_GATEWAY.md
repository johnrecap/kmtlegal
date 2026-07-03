# PLAN 33: Payment Gateway For Consultation Booking

Last updated: 2026-07-03

## Goal

Clients pay a consultation booking fee/deposit before the selected appointment is confirmed.

## Implemented v1 Architecture

`Booking -> Review -> PricingService -> PaymentAttempt -> Hosted Checkout -> Verified Webhook/IPN -> Confirm Appointment`

## Data Model

- `ConsultationPricingRule`: service/mode pricing rules with active/effective/version fields.
- `PaymentAttempt`: provider-neutral checkout attempt, price snapshot, temporary slot hold, checkout URL, expiry.
- `PaymentTransaction`: provider transaction reference, raw/provider status, settlement field.
- `PaymentWebhookEvent`: event id, signature status, processing status, replay count, payload hash, safe normalized payload.
- `Payment`: internal paid invoice/receipt created after trusted paid webhook.

## API Surface

- `POST /api/public/consultations/checkout`
- `GET /api/public/payments/status?attemptId=...`
- `POST /api/webhooks/paytabs`
- `GET /api/admin/payments/pricing`
- `POST /api/admin/payments/pricing`
- `PATCH /api/admin/payments/pricing/[ruleId]`
- `GET /api/admin/payments/attempts`
- `GET /api/admin/payments/webhooks`
- `POST /api/admin/payments/webhooks/[eventId]/replay`

## Truth Sources

- Price: server-side `PricingService` only.
- Payment success: verified/idempotent webhook only.
- Appointment confirmation: `PaymentWebhookService` after paid provider state.
- AI: intake helper only; no price/payment/confirmation authority.

## Environment

- `PAYMENT_PROVIDER=paytabs`
- `PAYMENT_ATTEMPT_EXPIRY_MINUTES=15`
- `PAYMENT_REQUIRE_WEBHOOK_SIGNATURE=true` in production
- `PAYMENT_WEBHOOK_SECRET` / `PAYTABS_WEBHOOK_SECRET`
- `PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE`

## Not In v1

- Real provider SDK/API client until merchant comparison is complete.
- Refund/dispute operations UI.
- Manual payment verification UI.
- Settlement payout import/export.

## Required Before Live Launch

1. Finish provider merchant comparison and update ADR.
2. Enter sandbox credentials and replace URL-template bridge with provider API client if required.
3. Create at least one active consultation pricing rule in production.
4. Run provider sandbox tests for success/failure/duplicate/invalid-signature/replay.
5. Run DB-backed staging smoke and production deployment smoke.
