# KMT Legal UI/UX Audit

Last updated: 2026-07-03

## Current Strengths

- Public site has a cohesive legal-luxury direction, strong brand presence, responsive shells, and Arabic RTL support.
- Booking chat is focused and avoids exposing a long public form.
- Client portal and admin surfaces are functional operational tools rather than marketing pages.
- Public booking now follows a safer payment journey: review price, pay through hosted checkout, then read status from server.

## Payment UX Changes Implemented

- Booking confirmation no longer creates a confirmed appointment directly.
- Confirmation now moves to a payment review step showing service, mode, appointment time, booking fee, and cancellation/payment policy.
- The payment button creates `PaymentAttempt` server-side and redirects to hosted checkout.
- Return page shows pending/paid/failed/expired states and explains that webhook/IPN is the source of truth.
- Client portal shows gateway attempts separately from invoices, avoiding confusion between pending checkout and paid receipt.
- Admin finance page shows quick visibility into pricing rules, attempts, and webhook events.

## UX Risks To Watch

- The hosted checkout URL is currently config-gated; final provider branding, language, and mobile behavior must be visually tested with real sandbox credentials.
- Retry behavior is intentionally conservative. Failed/expired attempts ask for a new slot unless provider-specific retry guarantees are confirmed.
- Manual fallback payment needs a dedicated admin verification screen before public launch.
- Return page currently defaults to Arabic; if English checkout grows, return URL should carry locale.

## Recommended Next UI Iteration

- Add a dedicated admin payments page with filters, webhook detail, replay button, and reconciliation table.
- Add pricing rule create/edit form to admin finance instead of read-only visibility.
- Add a first-class manual payment verification workflow for Instapay/bank transfer/office payment.
- Run Playwright visual QA against desktop/mobile for booking review, hosted checkout mock, return page, client portal payment attempts, and admin finance widgets.
