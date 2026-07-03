# PLAN 33: Payment Gateway For Consultation Booking

Last updated: 2026-07-03

## Goal

Clients pay a consultation booking fee/deposit before the selected appointment is confirmed.

## Implemented v1 Architecture

`Booking -> Review -> PricingService -> active provider -> PaymentAttempt -> Hosted Checkout -> Verified Webhook/IPN -> Confirm Appointment`

## Data Model

- `ConsultationPricingRule`: service/mode pricing rules with active/effective/version fields.
- `PaymentAttempt`: provider-neutral checkout attempt, selected provider, price snapshot, temporary slot hold, checkout URL, expiry.
- `PaymentTransaction`: provider transaction reference, raw/provider status, settlement field.
- `PaymentWebhookEvent`: event id, signature status, processing status, replay count, payload hash, safe normalized payload.
- `Payment`: internal paid invoice/receipt created after trusted paid webhook.

## API Surface

- `POST /api/public/consultations/checkout`
- `GET /api/public/payments/status?attemptId=...`
- `POST /api/webhooks/paytabs`
- `POST /api/webhooks/paymob`
- `GET /api/admin/payments/pricing`
- `POST /api/admin/payments/pricing`
- `PATCH /api/admin/payments/pricing/[ruleId]`
- `GET /api/admin/payments/settings`
- `PATCH /api/admin/payments/settings`
- `GET /api/admin/payments/attempts`
- `GET /api/admin/payments/webhooks`
- `POST /api/admin/payments/webhooks/[eventId]/replay`

## Truth Sources

- Price: server-side `PricingService` only.
- Active gateway for new attempts: `SystemSetting` key `payment.gateway`, falling back to `PAYMENT_PROVIDER`.
- Payment success: verified/idempotent webhook only.
- Appointment confirmation: `PaymentWebhookService` after paid provider state.
- AI: intake helper only; no price/payment/confirmation authority.

## Environment

- `PAYMENT_PROVIDER=paytabs`
- `PAYMENT_ATTEMPT_EXPIRY_MINUTES=15`
- `PAYMENT_REQUIRE_WEBHOOK_SIGNATURE=true` in production
- `PAYMENT_WEBHOOK_SECRET` / `PAYTABS_WEBHOOK_SECRET`
- `PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE` or `PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE`
- `PAYMOB_SECRET_KEY`
- `PAYMOB_PUBLIC_KEY`
- `PAYMOB_HMAC_SECRET`
- `PAYMOB_PAYMENT_METHOD_IDS`
- `PAYMOB_API_BASE_URL`
- `PAYMOB_CHECKOUT_BASE_URL`

## Not In v1

- Final commercial provider decision before merchant comparison is complete.
- PayTabs direct API client beyond the URL-template bridge.
- Refund/dispute operations UI.
- Manual payment verification UI.
- Settlement payout import/export.

## Required Before Live Launch

1. Finish provider merchant comparison and update ADR.
2. Enter sandbox credentials for the selected provider; Paymob uses Hosted/Unified Checkout, while PayTabs can keep the template bridge until merchant API details are finalized.
3. Create at least one active consultation pricing rule in production.
4. Run provider sandbox tests for success/failure/duplicate/invalid-signature/replay.
5. Run DB-backed staging smoke and production deployment smoke.
