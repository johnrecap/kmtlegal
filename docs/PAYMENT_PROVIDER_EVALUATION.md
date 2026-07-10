# Payment Provider Evaluation

Last verified: 2026-07-10

## Position

Paymob is the primary/default provider for new payment attempts. PayTabs remains in the technical layer for historical signed webhook processing and as a future standby, but `PAYTABS_ENABLED=false` prevents admin activation and new PayTabs attempts. There is no automatic fallback. Before enabling paid booking, KMT Legal must complete the Paymob sandbox and merchant checks below.

The v1 technical architecture is provider-neutral: `PricingService -> active provider -> PaymentAttempt -> Hosted Checkout -> verified webhook -> appointment confirmation`. Existing attempts keep their original provider even after the admin switches the active provider for new bookings.

## Provider Shortlist

| Provider | Why It Matters | Current Fit | Must Confirm With Merchant |
| --- | --- | --- | --- |
| PayTabs Egypt | Official Egypt page lists local currency settlement, merchant dashboard, onboarding, online payments, PayLinks, invoices, APIs, Direct API, Mobile SDK, and iFrame options. Docs list Hosted Payment among API integration types. | Historical webhook support and disabled standby only; unavailable for new attempts while `PAYTABS_ENABLED=false`. | Re-evaluate only if KMT explicitly approves a future fallback release. Confirm contract, signing, refund, settlement, and direct API details first. |
| Paymob | Primary Egyptian PSP for this rollout. | Implemented as the default Hosted/Unified Checkout adapter with bounded request timeout, HMAC webhook verification, canonical `APP_ORIGIN` callbacks, and no retry/failover. | Cards, wallets, Meeza, Aman/Masary/kiosk support, HMAC/callback contract, refunds, settlement, dashboard, support SLA, payment-method IDs, and exact live/sandbox base URLs. |
| FawryPay | Official developer guide lists Pay By Link, Express Checkout, Fawry-hosted checkout link, REST APIs, cards, 3D Secure, e-wallet, reference number, ValU, and installments. | Strong if KMT wants cash/reference-number behavior for clients who avoid cards. | Whether hosted checkout is available for legal-service deposits, reference expiry, reconciliation exports, refund/manual verification operations. |
| Tap | Official developer docs mention local/regional/global methods across MENA including Fawry, Visa, Mastercard, and more. | Worth a fast merchant comparison; not selected by default. | Egypt onboarding, EGP settlement, payment-method availability in Egypt, hosted checkout/webhook signing, support and refund workflow. |
| Stripe | Official global availability does not list Egypt as a supported country/region for direct Stripe merchant accounts; UAE, UK, and US are listed. | Not default for an Egyptian entity. | Only viable if KMT has a legal entity and bank account in a Stripe-supported country/region. |

## Evaluation Checklist

- Fees: setup, monthly minimums, transaction fee, fixed fee, refund fee, chargeback fee, foreign card fee.
- Settlement: EGP support, payout delay, payout bank requirements, statement/export quality.
- Payment methods: Visa/Mastercard, Meeza, wallets, Fawry reference, PayLink, installments, Apple/Google Pay if relevant.
- Hosted checkout: redirect flow, Arabic support, mobile usability, timeout control, cancel URL, return URL.
- Webhooks/IPN: signature/HMAC, event idempotency, retry schedule, raw body rules, test replay.
- Refunds and disputes: supported in dashboard/API, staff permissions, audit trail.
- Sandbox/onboarding: demo merchant, test cards, go-live steps, support responsiveness.
- Compliance: no card storage in KMT app, PCI scope minimized through hosted payment page.
- Admin operations: dashboard users, exportable settlements, transaction search, reconciliation fields.

## Sources

- [PayTabs Egypt](https://site.paytabs.com/en/egypt/)
- [PayTabs technical portal](https://docs.paytabs.com/)
- [FawryPay developer guide](https://developer.fawrystaging.com/)
- [Tap developer documentation](https://developers.tap.company/)
- [Stripe global availability](https://stripe.com/global)
- [Stripe Checkout Sessions](https://docs.stripe.com/api/checkout/sessions)
- [Stripe webhooks](https://docs.stripe.com/webhooks)
