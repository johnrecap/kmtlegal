# 06 — Booking & Consultation Audit

## End-to-end lifecycle (as coded)

1. User opens `/book-consultation` → `consultation-booking-chat.tsx`.
2. Language → intent (book/inquire) → matter chips → free-text turns via
   `POST /api/public/consultations/assistant`
   (`consultation-assistant-service.ts:239-400`). Modes:
   `AI_CHAT_PAID` (default) / `AI_CHAT_FREE`
   (`consultation-booking-settings.ts:8-18`).
3. Validation: fullName + canonical phone + informative summary (≥20 chars,
   ≥8 meaningful tokens) + future slot + `consent===true`.
4. Slots: `GET …/slots` → `listPublicConsultationSlots` (settings-driven
   grid Africa/Cairo minus `Appointment CONSULTATION ×
   RESERVED|SCHEDULED|RESCHEDULED`).
5. Review: `prepareConsultationPaymentReview` returns price DTO.
6. Paid: `POST …/checkout` → conflict pre-check → serializable TX creates
   `Client` (upsert) + `ConsultationRequest PAYMENT_PENDING` + `Appointment
   RESERVED` + `PaymentAttempt` (idempotent key) → returns
   `{reference CONS-<8>, checkoutUrl}` → browser redirects to Paymob.
   Webhook PAID → `SCHEDULED/SCHEDULED` + invoice `CONS-<year>-<8>`.
   Free (`AI_CHAT_FREE`): directly `SCHEDULED/SCHEDULED`.
7. Confirmation: `/payment/consultation/return?attemptId&token` (poller) +
   receipt `/payment/consultation/receipt` (HMAC v2, 7d) + account-setup
   link (HMAC, 30min) → `/client-account/setup` → portal user linked
   (requires `SCHEDULED`).
8. Follow-up: admin review queue, outcome workflow, convert-to-case.

Overall: **PARTIAL** (MEDIUM) — complete in code + unit/integration-tested;
live money movement needs production env.

## Exact states (no assumptions)

- `ConsultationStatus`: `NEW|REVIEWING|PAYMENT_PENDING|SCHEDULED|REJECTED|CONVERTED`.
- `ConsultationOutcomeStatus`: `PENDING|AWAITING_RESULT|MISSED|SUCCESSFUL|NO_SHOW|CANCELLED`.
- `AppointmentStatus`: `RESERVED|SCHEDULED|COMPLETED|CANCELLED|RESCHEDULED|NO_SHOW`.
- `PaymentAttemptStatus`: `CREATED|PENDING|PAID|FAILED|EXPIRED|REFUNDED|DISPUTED|CANCELLED`.
- Expire path: `PAYMENT_PENDING→REVIEWING`, `RESERVED→CANCELLED`
  (`expireOpenConsultationPaymentAttempts`, called on every slot list).
- Reversal path: attempt marked `REFUNDED|DISPUTED|CANCELLED` +
  `failureCode=PAYMENT_REVERSAL_REVIEW_REQUIRED`; historic invoice kept;
  receipt revoked. No money moves back automatically.

## Safety properties (verified in code)

| Concern | Verdict | Evidence |
|---|---|---|
| Double booking | Guarded | Pre-check + `runAppointmentConflictTransaction` Serializable; P2034 retry |
| Slot race | Guarded | Single-attempt checkout TX; free path bounded retry (3) |
| Payment race | Guarded | Idempotency key reuse; `provider+providerOrderId` unique; tx `FOR UPDATE` |
| Payment timeout | Handled | `expiresAt` (default 15m) + sweeper |
| Return URL safety | Guarded | HMAC status tokens, short TTL; `next=` sanitizer on login |
| Duplicate submission | Guarded | 24h duplicate guard (same phone/email + live attempt) |
| Retry behavior | Handled | `checkoutUrl` retry on return page; webhook replay in admin |
| Price tampering | Guarded | `expectedPrice` equality check vs live pricing rule (409 on drift) |
| Manual form bypass | Disabled | Legacy `POST /api/public/consultations` always 409 `FEATURE_DISABLED` |

## Admin intervention

Full review arsenal: assign / review note / reject (typed reasons) /
schedule (conflict-checked) / convert-to-case / outcome (version-locked) /
reopen. Availability editor controls the public grid.

## Missing / risky

- No guest self-cancel/reschedule (must contact office) → P2.
- No SLA/overdue escalation automation (`overdue_unbooked` is a view, not
  a trigger) → P2.
- PayTabs checkout is template-based standby, not a live Intent API → if
  Paymob is down there is no tested fallback path → P1.
- No-show/fee policy enforcement is manual (outcome codes only).
