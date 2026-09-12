# Batch 6 — payment trust and local financial lifecycle

Baseline: `6be83e29f6a2418edf16d38d092a151c9c8c9264`, approved and pushed batch 5. User resumed work on 2026-09-12. This is an ordinary delivery batch, not Spec Kit. No later batch, design migration, new library or real provider payment is included. Supervisor must approve the exact final local commit before push.

## Proven findings and changes

1. **Critical local payment authenticity failure.** `before-trust.json` records two failing security expectations against the baseline. An independently constructed canonical SHA-512 Paymob signature continued to verify after an unsigned status override; normalization incorrectly returned PAID. A second test invoked the actual route handler with a Request and a disposable PostgreSQL database: substituting another same-value attempt returned 200, recorded its payment and scheduled its appointment. This is handler+DB evidence, not a network HTTP test and not evidence of production exploitation. The supervisor separately reported a verifier/normalizer reproduction with synthetic data; that is supplemental evidence, not part of the root test count.
2. Paymob checkout now requires and persists the authenticated intention response's `intention_order_id` as `PaymentAttempt.providerOrderId`, with unique `(provider, providerOrderId)`. Callback processing resolves the signed `order.id` against that stored binding. An inconsistent attempt hint or unknown order is rejected before consuming the event or touching reservations. Unsigned `status`, response text and nested totals cannot determine money state. Only the documented canonical signature is accepted for Paymob; former raw-body alternatives are removed.
3. Paymob transaction IDs are not unique lifecycle event IDs. Event identity and immutability now use the signed canonical observation fingerprint, allowing pending→capture observations for the same transaction while deduplicating exact repeats. Unsigned changes do not mint additional events. Invalid signatures are isolated under an `invalid:` raw-hash identity and cannot poison a genuine event. PayTabs explicit event IDs retain the different-payload conflict guard. Event upsert preserves stored payload and normalized evidence; attempt row locks serialize confirmation and replays. Unverified historic events cannot be replayed into money state.
4. Expiration now rechecks open state under UPDATE locks and only releases rows actually expired. A deterministic handler+DB race pauses after the old selection, commits trusted payment, then resumes expiration. The paid attempt, appointment and consultation remain intact. Late pending/failure observations cannot downgrade an already collected transaction or reopen a closed attempt.
5. Provider status interpretation distinguishes authorization from collection. Paymob uses signed flags; authorization remains pending until a capture/standalone payment. PayTabs has a separate A/H/P/V/E/D/X decoder and transaction type handling. In particular D is decline, not dispute; A/auth is not collection.
6. Signed refund/dispute/void signals require financial review. Attempt and transaction record the signal, preserve the historical Payment collection and appointment, and invalidate previously issued receipt access. No refund transfer, partial/full refund amount, net settlement or cancellation policy is invented. The client and staff payment rows show financial review; summaries expose review count and explain that paid totals are **historical gross collections**, not net funds. Failed/pending observations alone do not revoke a valid collection. A reversed paid attempt does not offer automatic rebooking.
7. Checkout requires the reviewed `expectedPrice` (amount, currency, rule ID/version, service and mode). The server compares it with current pricing inside the existing serializable transaction, and checks paid booking mode again there. A changed review returns a localized conflict. The chat keeps intake, refreshes its booking summary, and requires another explicit confirmation before presenting the new fee. The client cannot dictate the actual price.
8. Late trusted success is retained as a PAID provider transaction with its actual valid amount/currency and reference, while the unavailable reservation remains closed and no confirmed-booking invoice is invented. Valid but mismatched money is similarly retained for review; invalid/unsupported money remains in immutable normalized evidence and is not represented as a valid collection. The attempt's financial-review marker suppresses checkout/resume links and gives a review explanation in public/client/staff views. Reports expose a separately labelled all-dates count of unallocated review records, outside historical invoice totals. Paymob intention `expiration` is capped to the remaining reservation time; notification delivery can still be late.

9. A focused pre-fix handler+DB test (`before-extra-collection.json`) proved that two trusted PAID transactions with distinct provider transaction IDs for one order were retained without a review marker. Processing now checks other recorded collections under the attempt lock, retains both transactions, sets financial review and revokes ordinary receipt access, without creating another invoice/appointment or refund. Exact repeats of one transaction remain deduplicated; an authorization followed by a distinct capture transaction remains a normal first collection. This identifies evidence requiring review, not proof of two settled charges at the live provider.
10. The client attempt heading and card now reuse the existing client text/surface styles. Fresh 390px English and Arabic screenshots show readable status actions; the English link was opened with keyboard Enter and the Arabic link by click, reaching the corresponding order-verification result. The staff mobile review badge was visually inspected as well. These are focused payment-state fixes, not a design migration.

## Connected map

| Entry / dependency | Actual implementation and downstream effects |
|---|---|
| Free/paid setting | `consultation-booking-settings.ts`; assistant follows free confirmation or paid review. Checkout route and service enforce paid mode. |
| Public chat | `consultation-booking-chat.tsx` → assistant review → explicit confirmation → expectedPrice checkout contract. No price/confirmation authority is restored from language handoff. |
| Pricing | `pricing-service.ts` resolves existing active rule specificity/effective date/version. Snapshot stored on attempt. |
| Reservation/checkout | `createPublicConsultationCheckout` uses existing serializable single-attempt external-side-effect transaction; client, consultation, RESERVED appointment, attempt and audit are local writes. |
| Paymob | Real intention HTTP adapter exists. Tested against a loopback simulator only; server order binding captured from its response. No real provider credentials, network or sandbox settlement. |
| PayTabs | Explicitly disabled standby unless enabled, with hosted URL **template**, not a complete provider checkout API. Raw-body callback contract and provider codes tested locally; real activation remains unproven. |
| Trusted notification | Webhook routes → verifier/normalizer → immutable event → bound/locked attempt → transaction → Payment/invoice/receipt → appointment and consultation → office notification/audit. |
| Return/status/receipt | Browser return query does not mark paid. Status token is attempt-bound; receipt token binds attempt and payment, with current paid state required. |
| Client/staff/report | Portal ownership and finance/report permissions retained; collection rows carry attempt review state. Aggregates retain historical gross collection and expose review count. |
| Expiry/retry/replay | Existing maintenance job and status polling call bounded expiry. Finance management required for replay. Failed/expired unpaid bookings can be explicitly retried; paid reversals need office review. |

## Launch and legacy attempt runbook

The additive migration leaves existing `providerOrderId` null intentionally. An old open checkout cannot complete automatically after upgrade; its otherwise valid callback is rejected until its provider order is independently reconciled. Legacy unbound attempts with an existing checkout URL show a distinct order-verification hold in public and client views. Payment/resume links are suppressed without implying that money was received. Handler+DB and network/browser tests prove the hold and restored behavior after a simulated trusted binding; there is no self-service reconciliation tool. Existing historical PAID records are not reclassified solely because the new order field is null.

Before deployment, inventory open Paymob attempts and retain a protected operational export (IDs, session IDs, amount/currency and reservation expiry; no secrets). Schedule a controlled payment cutover. For each old open checkout, obtain its order ID from the office's authenticated Paymob intention/order records or documented inquiry API using the stored session/reference. Verify provider account, exact intention/order association, amount, currency and payment operation. Have the authorized operator record that evidence and bind the unique provider order to the exact attempt using a reviewed database operation. Never backfill from webhook `attemptId`, extras, merchant_order_id, same amount, or customer return URLs. This batch does not run production reconciliation.

If that verification is unavailable, retain the old attempt for manual financial review; do not claim payment failure merely because binding is missing, and do not invite another charge until the provider outcome is resolved. Expired/cancelled reservations are not automatically rescheduled even after binding; a late trusted success is accepted as financial-review evidence without confirming the appointment. Obtain a fresh authentic callback or a separately reviewed provider reconciliation action; never rewrite stored normalized events to create trusted evidence.

Apply the additive migration before new application code. Rolling application code back leaves the nullable column and index safely in place, but **restores the payment-authenticity vulnerability**; disable payment intake/confirmation during any emergency rollback and prefer a forward fix. Dropping the column destroys provenance and is not the rollback procedure. Real provider configuration and end-to-end sandbox approval remain launch gates.

## External side-effect limits

Creating an intention is an external operation inside the caller's database transaction. The existing transaction is single-attempt: no automatic retry of the provider request. A timeout, malformed successful response, or provider success followed by database failure can leave an orphan provider intention despite no local reservation. An explicit customer retry may create another provider intention; no claim of provider-wide idempotency or automatic refund is made. Unknown/uncommitted order callbacks cannot confirm a local booking. The local simulator checks rollback and explicit retry; live provider reconciliation and durable orphan-intention recovery remain open. Do not treat the local success suite as production payment certification.

Known limitation: financial-review markers are not an implemented reconciliation-resolution workflow. They stop misleading receipt/payment-resume affordances and identify records for authorized office review. Provider inquiry, evidential binding and settlement decisions require separate operational verification; no automatic clearance, net refund arithmetic or refund transfer was added. Existing gross dashboards outside the detailed finance/report pages are not a net-settlement ledger.

## Official sources checked 2026-09-12

- [Paymob intention response and order association](https://developers.paymob.com/paymob-docs/intention-apis/create-intention): `intention_order_id` and response provenance.
- [Paymob transaction callbacks](https://developers.paymob.com/paymob-docs/manage-callback/transaction-callbacks): transaction ID, signed order association and lifecycle flags.
- [Paymob HMAC](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac): SHA-512 callback verification; unsigned fields are not authority.
- [Paymob exact transaction HMAC fields](https://developers.paymob.com/paymob-docs/developers/webhook-callbacks-and-hmac/hmac/hmac-transaction-callback): independently checked the ordered 20-field fixture against this provider list.
- [PayTabs status table](https://paytabshelp.freshdesk.com/en/support/solutions/articles/60000711358-what-is-response-code-vs-the-response-status-): A/H/P/V/E/D/X meanings.
- [PayTabs transaction types](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Request-Response-Parameters/Request-Response-transaction-type/): sale/auth/capture/refund/void distinction.
- [PayTabs server callback](https://docs.paytabs.com/manuals/PT-API-Endpoints/Integration-Types-Manuals/Request-Response-Parameters/Request-Response-Callback/): server notification separate from browser return.

## Verification and environment

Final checks passed: typecheck, lint, 520 unit tests (22 opt-in database skips), 31 focused trust tests including 17 actual handler+DB cases, 8 unique network/browser scenarios, and the production build (44 static pages). One browser scenario was strengthened and repeated for bilingual keyboard/click contrast acceptance; it is not counted twice. The final distinct-collection guard has handler+DB evidence. Pristine/upgrade migration evidence, source comparison, intermediate failures and cleanup are recorded in `verification.json`. Raw synthetic Vitest and Playwright JSON lives beside this report. Handler+DB, network HTTP/browser and provider-contract evidence are separate counts; repeated runs are not summed. No real client records, provider keys, SMTP messages or production database were used.

Disposable PG18 cluster: worktree `_workspace/batch6-postgres/data`, loopback 55437, database/user `kmt_batch6`; SQL data-directory/port identity checked before application writes. Browser app loopback 3109, provider simulator 3110. Port 5432 and original D: checkout untouched. Production build must run only after the browser server is stopped. The cluster and password were removed after a successful controlled shutdown; all three task ports refused connections. See verification.json.

## Fourteen-step program

| Step | State after this bounded batch |
|---|---|
| 1 Inventory | Preserve source routes/links/content; dynamic production content still separate. |
| 2 Protection | Prior session/file/restore evidence plus payment trust checks; production drills remain. |
| 3 Booking | Prior real scheduling lifecycle plus payment reservation/expiry evidence. |
| 4 Assistant | Batch 5 accepted; paid review freshness/recovery extended here; real model assessment remains. |
| 5 Payments | Local trust/lifecycle remediation; real provider sandbox, cutover reconciliation and net settlement remain. |
| 6 Office | Broad remaining domain audit awaits supervisor batch approval. |
| 7 Content | Existing catalogs extended for specific payment errors/review notes. |
| 8 Design checkpoint | Home/service/booking/client/admin light/dark interactive previews still await user review. |
| 9 Shared UI | Existing badges/tokens reused; no new library. |
| 10 Booking rollout | Functional fee recovery only; approved design migration pending. |
| 11 Public pages | Preserved; redesign pending. |
| 12 Client/admin | Specific finance review state tested; complete domain/theme review remains. |
| 13 Tailwind removal | Not started; only after approved migration. |
| 14 Release | Batch-local evidence only; whole-product/provider/deployment gates remain open. |
