# ADR 001: Consultation Booking Payment Provider

## Status

Accepted for v1 implementation; Paymob-first rollout is staged and paid booking remains disabled pending sandbox approval.

## Decision

Keep the provider-neutral payment layer, but use Paymob Hosted/Unified Checkout as the only provider available for new payment attempts in this release. PayTabs remains implemented only as a disabled standby and for verification of historical signed webhooks.

As of 2026-07-10, the operating decision is:

- Set `PAYMENT_PROVIDER=paymob` for new environments and seed `payment.gateway` to Paymob.
- Keep `PAYTABS_ENABLED=false`; admin cannot activate PayTabs for new attempts while this flag is false.
- Do not add automatic failover. A failed Paymob checkout must not create a second attempt through another provider.
- Keep `consultation.booking` in free mode during this rollout.
- Do not enable paid public booking before Paymob passes sandbox success, failure, duplicate webhook, invalid signature, replay, expiry, amount/currency mismatch, and mobile return tests.

## Context

KMT Legal needs clients to pay a consultation booking fee/deposit before a selected appointment becomes confirmed. The legal service context favors low PCI exposure, clear auditability, reliable confirmation, and Arabic-friendly recovery states.

## Chosen Flow

`Booking -> Review -> PricingService -> PaymentAttempt -> Hosted Checkout -> verified Webhook/IPN -> Confirm Appointment`

The redirect return page is never the source of truth. Appointment confirmation happens only when a trusted webhook/IPN is processed idempotently.

## Consequences

- The frontend never sends or calculates the amount.
- AI never decides price, payment state, or appointment confirmation.
- No card data is collected or stored by KMT Legal.
- Provider secrets remain server-only through environment variables.
- The active provider for new bookings is stored as a non-secret `SystemSetting`; this release allows Paymob activation only, while PayTabs remains visibly disabled standby.
- Existing payment attempts remain tied to the provider used when they were created.
- `PaymentAttempt`, `PaymentTransaction`, and `PaymentWebhookEvent` support reconciliation and replay.
- Existing `Payment` remains the internal invoice/statement layer and is created after successful trusted payment.

## Revisit Triggers

- Paymob fails sandbox, settlement, support, or merchant onboarding requirements.
- Fawry reference-number payment becomes a hard requirement for v1.
- Tap offers better Egypt method coverage or onboarding.
- PayTabs merchant contract lacks required webhook signing, sandbox, EGP settlement, or support.
- KMT explicitly approves manual PayTabs activation in a future release after its own sandbox and readiness pass.
- KMT creates a legal/banking entity in a Stripe-supported country and wants Stripe as a global alternative.
