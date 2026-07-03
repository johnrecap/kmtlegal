# Payment Gateway Plan

## Scope

PLAN-33 adds paid consultation booking without collecting card data inside KMT Legal.

## User Flow

1. Client completes public booking chat.
2. Server validates slot and pricing.
3. Client reviews service, mode, time, and booking fee.
4. Server creates `PaymentAttempt` and reserves appointment for the configured expiry window.
5. Client pays through hosted checkout.
6. Webhook/IPN confirms payment and schedules appointment.
7. Client return/status page reads server-side payment state.

## Admin Flow

1. Finance/admin users review pricing rules.
2. Finance/admin users inspect attempts and webhook events.
3. Admin replay is available for failed normalized webhook processing.
4. Reconciliation links provider transaction, attempt, payment, appointment, and consultation request.

## Acceptance Criteria

- Frontend never sends a price.
- Slot is blocked while attempt is pending and released on expiry/failure.
- Duplicate paid webhooks do not duplicate internal payments.
- Invalid signatures are stored and rejected.
- Redirect success does not confirm appointments.
