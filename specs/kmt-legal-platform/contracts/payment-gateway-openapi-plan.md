# Payment Gateway API Contract Plan

## Public Checkout

`POST /api/public/consultations/checkout`

Creates a payment attempt after server-side validation and pricing.

Request:

```json
{
  "locale": "ar",
  "message": "دفع رسوم الحجز",
  "draft": {},
  "selectedSlot": "2026-07-10T09:00:00.000Z",
  "consent": true,
  "confirmPayment": true
}
```

Response includes `paymentAttempt.id`, `status`, `amount`, `currency`, `checkoutUrl`, and `expiresAt`.

## Public Status

`GET /api/public/payments/status?attemptId=...`

Returns payment attempt, appointment, consultation status, and internal payment receipt if available.

## Webhook

`POST /api/webhooks/paytabs`

Accepts raw provider payload, verifies HMAC when configured, stores event metadata, processes idempotently, and confirms the appointment only for trusted paid state.

## Admin

- `GET /api/admin/payments/pricing`
- `POST /api/admin/payments/pricing`
- `PATCH /api/admin/payments/pricing/[ruleId]`
- `GET /api/admin/payments/attempts`
- `GET /api/admin/payments/webhooks`
- `POST /api/admin/payments/webhooks/[eventId]/replay`

All admin routes require authenticated finance read/manage permissions through existing RBAC.
