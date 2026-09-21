# 10 — Finance & Payments Audit

Configured providers (code authority, NOT old docs): **Paymob (live path)**
+ **Paytabs (standby)**. No Stripe/PayPal SDK. Status: PARTIAL (MEDIUM).

## Trace (paid consultation)

Client chat → `POST /api/public/consultations/checkout` (mode must be
`AI_CHAT_PAID`) → `createPublicConsultationCheckout` (conflict check, price
equality, idempotent attempt, `expiresAt` now+15m) → `createPaymobHostedCheckout`
(`POST {base}/v1/intention/`, `PAYMOB_SECRET_KEY`, minor units, method IDs,
`notification_url=/api/webhooks/paymob`,
`redirection_url=/payment/consultation/return?…`) → `{checkoutUrl}` →
browser redirect → provider → webhook `POST /api/webhooks/paymob`
(raw body, HMAC-SHA512 over 22 canonical fields, `timingSafeEqual`) →
`handlePaymentWebhook` (event upsert by `@@unique(provider,eventId)`,
order binding check, tx `FOR UPDATE` + Serializable, transaction upsert by
`@@unique(provider,providerTransactionId)`, PAID sticky) →
`confirmPaidAttempt` (blockers: status, expiry, `RESERVED`, `PAYMENT_PENDING`)
→ `Consultation+Appointment SCHEDULED`, invoice `Payment PAID`
(`CONS-<year>-<8>`, receipt = provider tx id) → return page + receipt +
account-setup link.

## Control checklist

| Check | Verdict | Evidence |
|---|---|---|
| Webhook verification | YES | Paymob SHA512 canonical / PayTabs SHA256 raw; invalid → store + 400 |
| Idempotency | YES | Event unique key; `PROCESSED` replay → `{idempotent:true}` |
| Replay protection | YES | `replayCount++`, admin replay requires `VERIFIED` + linked attempt |
| Duplicate payment | Handled | Late/extra PAID → `FAILED/LATE|ADDITIONAL_PAYMENT_REVIEW_REQUIRED`, manual triage |
| Amount verification | Strict | Checkout equality + webhook `Decimal.equals`; mismatch → FAILED + review |
| Currency verification | Strict | Mismatch → `PAYMENT_CURRENCY_MISMATCH` + review |
| Failed payments | Handled | `releaseFailedAttempt` frees slot; return page shows failed + retry |
| Expired attempts | Handled | Sweeper on slot list; `EXPIRED`, slot cancelled |
| Abandoned checkout | Handled | Same as expired; idempotency key reuses live attempt on re-pay |
| Reconciliation | PARTIAL | `moneyStatus` (MATCHED/MISMATCH/…) in admin; no auto-reconcile job beyond maintenance script |
| Refund | NOT SUPPORTED | Record-only `REFUNDED/DISPUTED` + review; no payout API |
| Settlement | NOT SUPPORTED | `settlementStatus` column stored, no settlement flow |
| Currency set | `EGP\|USD\|EUR\|SAR\|AED` (default EGP); minor-units conversion paymob-side |

## Invoices / pricing / manual

- Manual invoices: CRUD + CSV export; `amount>0`, default `DRAFT/EGP`;
  `paidAt` only if `PAID`; gateway methods rejected as manual PAID;
  duplicate PAID `receiptNumber` rejected.
- Pricing rules: versioned (`serviceCategory×mode`), effective-dated;
  paid mode requires an active rule; checkout pins `priceVersion`.
- Gateway settings + attempts + webhook inbox: admin-operated, audited.

## Unsupported (explicit)

Refunds/voids, settlement, taxes/line-items/discounts, subscriptions,
installments, multi-currency settlement, payout reports, automatic
dunning. `PaymentAttempt.manualMethod` column is dead (never written).

## Risks

- Single live charge path (Paymob); PayTabs is template-standby → P1.
- Receipt/status token secrets fall back to dev constants outside prod;
  prod throws if missing (fail-closed but ops-sensitive) → P2.
- Maintenance worker (`jobs:payments`) is PM2-managed, not repo cron;
  if the worker is down, expiry sweeps only run on slot-list hits → P2.
