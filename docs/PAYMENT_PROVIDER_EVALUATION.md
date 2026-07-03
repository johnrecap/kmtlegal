# Payment Provider Evaluation

Last verified: 2026-07-03

## Position

PayTabs Egypt is the default v1 implementation provider, not the final commercial decision. Before production go-live, KMT Legal must compare real merchant offers from PayTabs, Paymob, Fawry, and Tap using the checklist below.

The v1 technical architecture is provider-neutral: `PricingService -> PaymentAttempt -> Hosted Checkout -> verified webhook -> appointment confirmation`.

## Provider Shortlist

| Provider | Why It Matters | Current Fit | Must Confirm With Merchant |
| --- | --- | --- | --- |
| PayTabs Egypt | Official Egypt page lists local currency settlement, merchant dashboard, onboarding, online payments, PayLinks, invoices, APIs, Direct API, Mobile SDK, and iFrame options. Docs list Hosted Payment among API integration types. | Strong default for v1 hosted checkout and quick integration. | Exact Egypt contract, fee tiers, EGP settlement schedule, webhook/IPN signing details, refund process, dashboard users, sandbox credentials. |
| Paymob | Strong Egyptian PSP candidate and should be evaluated seriously for local payment methods. Public developer docs were JS-gated during review, so contract verification is required. | Strong alternative, especially if local wallets/kiosk methods are a priority. | Cards, wallets, Meeza, Aman/Masary/kiosk support, HMAC/callback contract, refunds, settlement, dashboard, support SLA. |
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
