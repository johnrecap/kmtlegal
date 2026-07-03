# Payment Gateway Data Model

## Entities

### ConsultationPricingRule

Controls booking fee resolution.

- `serviceCategory`
- `mode`
- `amount`
- `currency`
- `active`
- `effectiveFrom`
- `version`

### PaymentAttempt

Represents a checkout attempt and price snapshot.

- `provider`
- `status`
- `clientId`
- `consultationRequestId`
- `appointmentId`
- `pricingRuleId`
- `priceVersion`
- `amount`
- `currency`
- `startsAt`
- `endsAt`
- `expiresAt`
- `checkoutUrl`
- `providerSessionId`
- `providerPaymentId`

### PaymentTransaction

Represents provider-level transaction/reconciliation details.

### PaymentWebhookEvent

Stores event idempotency, signature status, processing status, replay count, hash, and safe normalized payload.

### Payment

Internal invoice/receipt layer. Created only after trusted payment confirmation.

## State Separation

Payment attempt states: `CREATED`, `PENDING`, `PAID`, `FAILED`, `EXPIRED`, `REFUNDED`, `DISPUTED`, `CANCELLED`.

Appointment states: `RESERVED`, `SCHEDULED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`, `NO_SHOW`.
