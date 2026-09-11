# Batch 5: bilingual booking conversation and recovery

Date: 2026-09-11. Baseline `cf1b835fb6fdd8191889bca5dcca91c81bbd1afd` was approved and pushed to origin/main after verifying the remote was exactly `194f6be`. This batch remains local for supervisor review. No Spec Kit, subagents, provider keys, price/permission changes or design migration.

## Findings and bounded repairs

The initial service matrix produced 18 failures / 3 passes. Fixtures cover Egyptian Arabic, formal Arabic and English. Explicit corrections of existing name/phone/email were ignored; requesting a different service or appointment day retained old choices; the word phone next to a contact number incorrectly selected a phone consultation over an explicit online request; historical matter dates were treated as appointment preferences; the assistant asked about scheduling before a missing contact number.

Repairs reuse the existing parser, catalog, normalized draft and confirmation flow:
- Explicit name/contact corrections update the review. Existing contact values are protected against unrelated numbers; ISO/numeric dates are removed from phone extraction. A contact-number label does not imply phone consultation, including Arabic-script digits. Existing names are replaced only by explicit name statements; an “I am…” availability/need statement cannot overwrite them.
- Explicit requests to change service use the existing service categories. A change of service/mode or an actual change in validated availability preference/alternative request clears the prior slot and ready state, including mixed contact-correction/scheduling messages. A fresh choice and confirmation is required; the existing authoritative slot/price resolution remains the source.
- Missing contact/matter fields are requested before slot selection. Existing localized follow-up and review text are reused.
- Explicitly historical clauses (signed/occurred/dated and Arabic equivalents) are excluded from preference extraction unless that clause also asks to book. Separate comma/sentence booking clauses remain eligible; natural Egyptian “ميعاد بتاريخ…” is retained. This is a limited deterministic safeguard, not a claim of general semantic date understanding. Ambiguous clauses still need broader model-quality evaluation.
- Two unrelated-question fixtures were mistaken for names. Name-only detection now rejects question punctuation and generic request/interrogative openings, rather than adding example-specific names/topics.
- A high-confidence provider result with an impossible calendar date passed the extraction schema. The scheduling preference now also passes the same real date/time schema before entering the draft.

## Browser recovery and temporary language transfer

Four initial browser cases failed: the unprocessed message disappeared from the composer on network failure, and full-page language navigation lost the draft and unsent text. The failed message is now returned to the composer for retry while previously collected data remains.

The existing language link performs full-page navigation between separate public layouts. A one-use same-tab sessionStorage handoff carries the current draft, unsent text, active flow, selected appointment and latest structured result (booking reference/appointment or inquiry result). It never contains conversation history, a price, payment/setup tokens or confirmation authority. Both writer and reader use the same destination/time/shape/size validator. The writer refuses more than 20,000 serialized characters before navigation and shows a new bilingual catalog message asking to shorten the unsent text; the current page/input remains. Shortened text below the bound can be transferred.

The handoff is consumed and removed on the destination booking page and accepted only for that exact path within five minutes. Malformed/expired handoffs are removed. Five minutes is a restoration-validity limit, not a physical erasure timer: an abandoned handoff can remain until another booking mount or the tab session ends. Blocked storage prevents navigation and preserves the draft; busy requests also hold navigation.

A selected appointment remains an answer. Restoring an active booking re-enters the existing review API with that selection and current draft, without confirmBooking/consent. Confirmation flags and price are recomputed through the normal flow; explicit confirmation still runs the existing authoritative availability/conflict/price checks before a booking/payment review. Restoration itself does not create a booking or price. Completed booking reference/result stays a completed result with no new request; inquiry mode/result stays inquiry and is not converted into booking. This preserves the current result, not a full transcript. A retained inquiry message is the last server result in its original language; its full retranslation remains outside this bounded change.

The previous blanket source-token test was narrowed to protect no transcript/no price/no confirmation storage; client/team storage remains prohibited. Browser behavior verifies selected-slot review, completed reference, inquiry, consume/delete, malformed/expired payloads, oversized/shortened text and blocked storage. Only one error message was added to both existing public content catalogs; no visual component or new dependency was added.

## Evidence matrix

| Scenario | Evidence boundary and result |
|---|---|
| Multi-field message: Egyptian/formal Arabic/English | Service entry with local mock provider; name/contact/online mode collected; no reference |
| Name, phone, email corrections in both languages | Service entry; changed value appears in current review, no automatic booking |
| Alternate day/time, Arabic alternatives, changed service/mode | Service entry; old slot cleared and slots queried with current mode |
| Missing phone / ambiguous next week | New service case plus existing consultation contract tests; only missing detail requested / clarification reused |
| Matter date versus booking preference | Two historical-clause fixtures; date not used as appointment date; limited heuristic documented |
| Legal prediction questions | Existing legal handoff response, no confirmation/reference |
| Unrelated questions / unrecognized service | No invented service category, amount, reference or ready confirmation; no question accepted as a name |
| Latest price after changed terms | Real preparation function with spies at availability, duplicate/conflict and price source boundaries; resolver receives current category/mode and returned amount/version are used only after explicit confirmation |
| Provider 503 / 429 / bad JSON / wrong schema | Actual adapter/gateway with fetch stub; one request, fallback preserves draft |
| Slow provider | Actual AbortController timeout with fake clock and abort-aware fetch stub; timeout falls back without losing contact |
| Impossible high-confidence AI date | Rejected from draft scheduling preference, contact preserved |
| Language change / network / service 503 | Eleven real Chromium cases with controlled assistant HTTP responses; requests inspected after navigation/retry |

The browser cases are real UI interactions and navigation with mocked assistant HTTP responses. The service matrix calls handlePublicConsultationAssistant with stubbed availability/settings and local mock AI. The price case stubs database/conflict/price boundaries; it is not a paid booking, payment-provider call or database concurrency test. Provider failure tests exercise the adapter and gateway with fetch replaced; no network or real model is called. Existing batch 4 remains the separate real database/HTTP/free-booking lifecycle evidence. The tests do not prove external model understanding or payment sandbox readiness.

## Connected impact map

Public header language anchor -> booking component draft/composer -> assistant endpoint contract -> base/fallback/AI draft merge -> required-field questions and confirmation -> current availability/conflict/price source -> existing booking/payment services. Public copy stays in existing content and assistant message functions. No change to persistent booking schema, policies, auth roles, office service catalog, amounts, payment state machine or checkout integration. The existing source-shape expectation in consultation-contract was updated to reflect contact-before-slot ordering; behavioral tests cover the result.

## Discussion items for the agreed product/design checkpoint

- Broader out-of-scope/ambiguous conversational style and model-quality evaluation remain. A safe deterministic fallback may still ask an intake question for unrelated text; passing the non-invention cases does not prove topic understanding.
- Richer correction phrasing and separation of several matter/appointment dates in one ambiguous clause should be evaluated with a real configured model before promising semantic coverage.
- Keep the current generic legal-review boundaries and existing office facts; no new office claims, prices or services were authored.
- The existing full-page language architecture is preserved; the narrowly scoped handoff above is reviewable separately from future design/component migration.

## Fourteen-step coverage

| Step | Current state / remaining work |
|---|---|
| 1 Inventory | Source preservation comparison; live dynamic content crawl remains. |
| 2 Protection | Earlier session/file/local restore evidence; production scan/restore and all mutations remain. |
| 3 Booking | Batch 4 real lifecycle plus current correction/revalidation service checks; broader office scheduling remains. |
| 4 Assistant | This bounded bilingual/parser/provider-failure/browser-recovery batch; actual model-quality evaluation remains. |
| 5 Payments | Next planned batch: provider sandbox, reconciliation and financial edge cases. No live payment proven here. |
| 6 Office | Broader operational domain audits remain after payment review. |
| 7 Content | Existing messages reused; conversation/editorial choices above remain for discussion. |
| 8 Design checkpoint | Concrete home/service/booking/client/admin light/dark previews await user review. |
| 9 Shared UI | Existing controls/styles retained; no new libraries. |
| 10 Booking rollout | Functional recovery improved; approved design rollout pending. |
| 11 Public pages | Preserved; redesign pending. |
| 12 Client/admin | Earlier specific booking/file/auth evidence; complete tools/theme review pending. |
| 13 Tailwind removal | Not started; requires agreed migration. |
| 14 Release | Batch-local checks only; whole-product/provider/deployment gates remain. |

## Environment

No new PostgreSQL cluster or private upload directory was necessary. No database was contacted by this batch's tests. `_workspace/batch5-postgres` was not created. Browser server used worktree-local Next dev on loopback 3109 and was stopped by the runner; the production build runs separately. Original D: checkout and port 5432 were untouched. Original JSON evidence is stored beside this report; final verification totals are in verification.json.

## Supervisor review regressions

Six additional service expectations initially failed: mixed-language contact/date edits, Arabic digits with online mode, Egyptian appointment-date wording and two I-am statements overwriting an existing name. Four state-transfer browser cases failed before the revised state handoff (reviewed slot and inquiry, both directions). A separate oversized-input run proved actual unwanted navigation before the writer limit. A preliminary direct Playwright invocation encountered a stopped dev server and is not counted as product failure evidence; the saved size-before.json comes from a successful server startup and the actual wrong-URL failure. The final fixtures separately preserve real name corrections and historical matter dates.

## Stop checkpoint requested by the user

Finish this batch only, then stop. No payment review or later batch has started. Pending next action is supervisor review of this local batch, and push only after approval and checking origin/main still equals cf1b835fb6fdd8191889bca5dcca91c81bbd1afd. If the remote changed, reconcile explicitly; never force-push. After approval, the next agreed work is the payment review (step 5), followed by remaining office domains, then concrete design previews for user discussion. Do not start those automatically.

Resume commands (from this worktree):
```powershell
git status --short
git log -1 --oneline
git ls-remote origin refs/heads/main
```
Read this report and verification.json before deciding whether any checks need repeating. Latest browser evidence is 11 unique cases plus 2 strengthened repetitions for valid-but-expired payload and oversize/shortened input. No PostgreSQL cluster was created. The test runner stops its own server. No automation or polling continuation was created.

## Final verification at stop

506 unit/contract tests passed, 0 failed, 5 existing optional DB skips. Eleven unique browser cases passed; two strengthened boundary repetitions also passed. Typecheck, lint, secret scan, source-preservation comparison and guarded production build passed (exit 0, 44 generated static pages). The supervisor separately reported 37/37 new conversation/provider tests passed; this is supplemental supervisor evidence, not an additional root test count. No active listener on 3109 or 55437 after tests; no batch5 PostgreSQL/private file environment was created. Work stops here with a local commit for final review.
