# Payment Operations Playbook

Last updated: 2026-07-07

## Current Live Decision

- Technical default remains PayTabs because the code already supports it as the fallback hosted-checkout path.
- Paymob remains selectable from admin only after its server-side environment values are complete.
- The final commercial live provider is not considered approved until KMT has merchant/sandbox evidence for fees, EGP settlement, webhook signing, refunds, dashboard access, and support response time.
- Paid booking must stay off for public launch until sandbox success, failure, duplicate webhook, invalid signature, replay, and expiry evidence is archived.

## Public Payment Status Privacy

- A public status request without a valid status token returns only safe payment and appointment state.
- Signed public status links expire. After expiry, the same attempt falls back to safe public status without client details, receipt links, checkout links, or account setup links.
- Client name, phone, checkout URL, receipt URL, account setup link, legal request summary, city, urgency, service category, and preferred mode require the signed return/status token.
- The return page is still not payment truth. Appointment confirmation requires a trusted webhook or an approved internal finance action.

## Admin Finance Operations

- `/admin/finance` remains the single operations center for manual invoices, gateway attempts, pricing rules, gateway settings, webhook events, replay, and CSV export.
- Manual paid records must not use gateway-managed payment methods such as PayTabs, Paymob, hosted checkout, gateway, or webhook.
- A repeated receipt number on any paid manual record is rejected to reduce accidental double-recording.
- Gateway-confirmed payments are not edited through the manual invoice form. If a gateway record is wrong, investigate the linked attempt, transaction, and webhook event.

## Late Or Problem Payment Playbook

1. Open `/admin/finance` and filter payment attempts by `FAILED`, `EXPIRED`, `DISPUTED`, or the client's phone/name.
2. If the issue says amount or currency mismatch, do not confirm the appointment. Compare the provider dashboard record against the reserved amount/currency.
3. If the attempt expired, the maintenance job should have cancelled the temporary appointment and returned the consultation to review. Ask the client to choose a new slot.
4. If a webhook failed because of signature or processing, fix the provider/env issue first, then use the replay button only when the stored normalized event is safe to retry.
5. If a webhook failed because the same provider event id arrived with a different payload hash, treat the original webhook event as the audit source of truth and compare the provider dashboard before any manual action.
6. If the client paid by Instapay or bank transfer, create a manual finance payment with the real receipt/reference. Do not label it as PayTabs or Paymob.
7. If there is any doubt, keep the consultation in manual review and contact the client from the office channel.

## Maintenance Monitoring

- Run once after deploy: `npm run jobs:payments`.
- Run continuously under PM2: `npm run jobs:payments:watch`.
- The aaPanel deploy script starts or restarts `kmtlegal-payment-maintenance` automatically unless `PAYMENT_MAINTENANCE_PM2_ENABLED=false`.
- The watch process skips overlapping cycles when a previous maintenance run is still in progress.
- Optional alerting: set `PAYMENT_MAINTENANCE_ALERT_WEBHOOK_URL` to an internal webhook endpoint. Failure alerts include service name, time, error name/code/message only, not stack traces or secrets.
- Keep PM2 logs under review after deploy:
  - `pm2 logs kmtlegal-payment-maintenance --lines 80 --nostream`

## Sandbox And Mobile QA

- Sandbox provider QA must cover successful payment, failed payment, duplicate webhook, invalid signature, replay, expiry after reservation timeout, and mismatched amount/currency.
- Mobile QA must cover 390px width for booking review, provider return page pending/paid/failed/expired, resume-after-failure, receipt link, client payments, and admin finance filters.
- Archive screenshots/logs for the selected provider before enabling `AI_CHAT_PAID` in production.
