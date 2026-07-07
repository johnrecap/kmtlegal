# PLAN 33: Payment Gateway For Consultation Booking

Last updated: 2026-07-07

## Goal

Clients pay a consultation booking fee/deposit before the selected appointment is confirmed.

## Implemented v1 Architecture

`Booking -> Review -> PricingService -> active provider -> PaymentAttempt -> Hosted Checkout -> Verified Webhook/IPN -> Confirm Appointment`

The public consultation entry point is controlled by a non-secret `SystemSetting` key named `consultation.booking`:

- `AI_CHAT_PAID`: booking chat is enabled, AI-style intake is enabled for the public booking surface, and payment is mandatory before appointment confirmation.
- `AI_CHAT_FREE`: booking chat is enabled without a booking fee; no `PaymentAttempt` is created, and the appointment is confirmed directly from the assistant for secretary review.
- Legacy stored values are normalized: `PAID_CHAT` maps to `AI_CHAT_PAID`, and `MANUAL_REVIEW` maps to `AI_CHAT_FREE`.

## Data Model

- `ConsultationPricingRule`: service/mode pricing rules with active/effective/version fields.
- `PaymentAttempt`: provider-neutral checkout attempt, selected provider, price snapshot, temporary slot hold, checkout URL, expiry.
- `PaymentTransaction`: provider transaction reference, raw/provider status, settlement field.
- `PaymentWebhookEvent`: event id, signature status, processing status, replay count, payload hash, safe normalized payload.
- `Payment`: internal paid invoice/receipt created after trusted paid webhook, with a signed public printable receipt link after `PAID`.
- Client account setup: after a confirmed free booking or trusted paid webhook, the success surface can show a signed `/client-account/setup` link. The client chooses email/password and the booked consultation stays linked to the same `Client` profile in `/client`.

## API Surface

- `POST /api/public/consultations/checkout`
- `GET /api/public/payments/status?attemptId=...`
- `POST /api/webhooks/paytabs`
- `POST /api/webhooks/paymob`
- `GET /payment/consultation/receipt?attemptId=...&token=...`
- `GET /api/admin/payments/pricing`
- `POST /api/admin/payments/pricing`
- `PATCH /api/admin/payments/pricing/[ruleId]`
- `GET /api/admin/payments/settings`
- `PATCH /api/admin/payments/settings`
- `GET /api/admin/payments/attempts`
- `GET /api/admin/payments/webhooks`
- `POST /api/admin/payments/webhooks/[eventId]/replay`

## Truth Sources

- Booking mode for new public consultation requests: `SystemSetting` key `consultation.booking`, defaulting to `AI_CHAT_PAID`.
- Price: server-side `PricingService` only.
- Active gateway for new attempts: `SystemSetting` key `payment.gateway`, falling back to `PAYMENT_PROVIDER`.
- Payment success: verified/idempotent webhook only.
- Receipt display: signed receipt token plus a paid `PaymentAttempt` and paid `Payment`.
- Appointment confirmation: `PaymentWebhookService` after paid provider state.
- AI: structured intake extraction helper only; no price/payment/appointment-slot/payment-status/confirmation authority.

## Booking Mode Guards

- `/api/public/consultations/assistant` is available in both `AI_CHAT_PAID` and `AI_CHAT_FREE`.
- `/api/public/consultations/checkout` is available only in `AI_CHAT_PAID`.
- `/api/public/consultations` remains disabled for the public booking page so the old form cannot bypass assistant review.
- Switching to `AI_CHAT_PAID` from admin requires an active consultation pricing rule and a configured active payment provider.
- Switching to `AI_CHAT_FREE` does not require pricing or gateway credentials.

## Environment

- `PAYMENT_PROVIDER=paytabs`
- `PAYMENT_ATTEMPT_EXPIRY_MINUTES=15`
- `PAYMENT_REQUIRE_WEBHOOK_SIGNATURE=true` in production
- `PAYMENT_RECEIPT_SIGNING_SECRET` for signed public receipt links; `AUTH_SECRET` is the server-side fallback.
- `PAYMENT_STATUS_SIGNING_SECRET` for signed payment return/status links; `PAYMENT_RECEIPT_SIGNING_SECRET` and then `AUTH_SECRET` are server-side fallbacks.
- `CLIENT_ACCOUNT_SETUP_SIGNING_SECRET` for post-consultation account setup links; `AUTH_SECRET` is the server-side fallback.
- `PAYMENT_WEBHOOK_SECRET` / `PAYTABS_WEBHOOK_SECRET`
- `PAYMENT_HOSTED_CHECKOUT_URL_TEMPLATE` or `PAYTABS_HOSTED_CHECKOUT_URL_TEMPLATE`
- `PAYMOB_SECRET_KEY`
- `PAYMOB_PUBLIC_KEY`
- `PAYMOB_HMAC_SECRET`
- `PAYMOB_PAYMENT_METHOD_IDS`
- `PAYMOB_API_BASE_URL`
- `PAYMOB_CHECKOUT_BASE_URL`

Payment status links without a valid status token return only a safe public status. Client name, phone, checkout URL, receipt URL, account setup links, legal request summary, city, urgency, service category, and preferred mode require the signed return link.

Optional maintenance alerting:

- `PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL`

When set, `npm run jobs:payments:watch` sends a compact failure alert with service name, time, and safe error name/code/message. It does not send stack traces, database URLs, tokens, raw webhook payloads, legal summaries, emails, or phone numbers.

## Admin Operations Hardening

- `/admin/finance` is the single payment operations center for manual invoices, pricing rules, gateway settings, payment attempts, webhook events, replay, and CSV export.
- Payment attempts and webhook events can be filtered by status and search text from the finance page.
- Amount/currency mismatches, expired attempts, invalid signatures, and failed webhook processing are shown as manual-review issues in finance.
- Manual paid records cannot be labeled as gateway-managed methods such as PayTabs, Paymob, hosted checkout, gateway, or webhook.
- A repeated manual receipt number for the same client is rejected.
- Gateway-confirmed `Payment` rows remain tied to their `PaymentAttempt` and are not edited through the manual invoice form.

## Not In v1

- Final commercial provider decision before merchant comparison is complete.
- PayTabs direct API client beyond the URL-template bridge.
- Refund/dispute operations UI.
- Full manual payment verification against a pending `PaymentAttempt`.
- Settlement payout import/export.

## Required Before Live Launch

1. Finish provider merchant comparison and update ADR.
2. Enter sandbox credentials for the selected provider; Paymob uses Hosted/Unified Checkout, while PayTabs can keep the template bridge until merchant API details are finalized.
3. Create at least one active consultation pricing rule in production.
4. Run provider sandbox tests for success/failure/duplicate/invalid-signature/replay.
5. Run the late-payment playbook and mobile 390px booking/payment return QA from `docs/PAYMENT_OPERATIONS_PLAYBOOK.md`.
6. Run DB-backed staging smoke and production deployment smoke.
