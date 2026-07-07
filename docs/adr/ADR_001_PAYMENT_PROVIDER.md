# ADR 001: Consultation Booking Payment Provider

## Status

Accepted for v1 implementation, pending final merchant comparison.

## Decision

Implement a provider-neutral payment layer with PayTabs Egypt as the default fallback and Paymob as a selectable v1 Hosted/Unified Checkout provider. The final live provider must be confirmed only after merchant comparison with PayTabs, Paymob, Fawry, and Tap.

As of 2026-07-07, the operating decision is:

- Keep PayTabs as the technical default/fallback for new environments.
- Keep Paymob available as a selectable provider once its required env values are configured.
- Do not treat either provider as commercially final until KMT archives sandbox evidence and merchant terms for fees, EGP settlement, webhook signing, refunds, dashboard users, and support SLA.
- Do not enable paid public booking before the selected provider passes sandbox success, failure, duplicate webhook, invalid signature, replay, expiry, and mismatch tests.

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
- The active provider for new bookings is stored as a non-secret `SystemSetting` and can be switched from admin after env readiness validation.
- Existing payment attempts remain tied to the provider used when they were created.
- `PaymentAttempt`, `PaymentTransaction`, and `PaymentWebhookEvent` support reconciliation and replay.
- Existing `Payment` remains the internal invoice/statement layer and is created after successful trusted payment.

## Revisit Triggers

- Paymob offers materially better local methods or settlement terms.
- Fawry reference-number payment becomes a hard requirement for v1.
- Tap offers better Egypt method coverage or onboarding.
- PayTabs merchant contract lacks required webhook signing, sandbox, EGP settlement, or support.
- KMT creates a legal/banking entity in a Stripe-supported country and wants Stripe as a global alternative.
