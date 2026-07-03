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

Returns payment attempt, appointment, consultation status, and internal payment receipt if available. Paid receipts include a signed `receiptUrl`; pending, failed, cancelled, and expired attempts do not expose a receipt URL.

## Public Receipt Page

`GET /payment/consultation/receipt?attemptId=...&token=...`

Server-rendered printable receipt page. The token is signed server-side, the attempt and payment must both be `PAID`, and the page does not expose card details or raw provider webhook payloads.

## Webhooks

`POST /api/webhooks/paytabs`

`POST /api/webhooks/paymob`

Each provider has its own route. The route determines the provider, accepts the raw provider payload, verifies HMAC when configured, stores event metadata, processes idempotently, and confirms the appointment only for trusted paid state.

## Admin

- `GET /api/admin/payments/pricing`
- `POST /api/admin/payments/pricing`
- `PATCH /api/admin/payments/pricing/[ruleId]`
- `GET /api/admin/payments/settings`
- `PATCH /api/admin/payments/settings`
- `GET /api/admin/payments/attempts`
- `GET /api/admin/payments/webhooks`
- `POST /api/admin/payments/webhooks/[eventId]/replay`

Payment settings store only `activeProvider` (`paytabs` or `paymob`) in `SystemSetting`. Provider secrets remain in server env and are returned only as non-secret readiness booleans/missing key names.

All admin routes require authenticated finance read/manage permissions through existing RBAC. Payment settings also allow `settings.manage.any` for super-admin settings operators.
