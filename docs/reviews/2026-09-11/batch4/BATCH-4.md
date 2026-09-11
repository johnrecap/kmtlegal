# Batch 4: booking availability and real booking lifecycle

Date: 2026-09-11. Baseline: `194f6bebf36595d9d9c02146dd71b6308bc25640`, batch 3 approved and pushed. Batch 2 was approved/pushed as `ea186fd`. This batch requires supervisor review before push. No Spec Kit invocation or specs changes.

## Confirmed changes

- A displayed date-filtered slot beyond the first 500 generated slots could not be confirmed. Confirmation now scans the requested Cairo date from the requested wall-clock time and compares the exact instant, with limit 1. It preserves the grid, lead time, window, mode, existing conflict transactions and DST behavior; it does not increase an arbitrary cap.
- Impossible dates (month 13, February 31, non-leap February 29) and clocks (25:90, 24:01) previously passed shape validation. Shared schemas reject them in slot API filters, working-day settings and structured assistant preferences. Midnight 00:00 remains valid; 24:00 is allowed only as an end. Valid leap day and existing Cairo DST/day-boundary regressions remain covered.
- Stronger validation exposed an assistant regression: impossible ISO dates extracted from English/Arabic chat could poison the draft. Empty preference strings remain supported; surrounding whitespace is now normalized before validation (the baseline date/time regex did not accept it). Chat now requests a clear appointment day using existing localized copy, clears invalid scheduling preference, and retains contact/details. Structured invalid API fields still return 400. Date-only and time-only conversations remain supported. No new text catalog or copy was added.
- An actual browser click on the initially rendered language button was lost before hydration, leaving the composer disabled until timeout. Both language buttons now use the existing useHydrated hook. The same browser journey subsequently proceeds without forced clicks or artificial sleeps. Styling and libraries are unchanged.

## Connected flow and policy

| Layer | Sources / behavior |
|---|---|
| Public UI | consultation-booking-chat.tsx: language, composer, slot selection, explicit confirmation, conflict alternatives |
| Public API | slots/route.ts and assistant/route.ts; shared Zod validation; real HTTP, no route mocks |
| Scheduling | consultation-availability-service.ts generates Cairo slots; booking confirmation checks exact requested instant |
| Assistant | consultation-assistant-service.ts merges deterministic/local mock extraction, retains draft and requires explicit confirmation |
| Persistence | consultation-service and appointment transaction helpers retain serializable conflict checks and duplicate-contact protection |
| Reschedule | calendar-service.ts with real admin sessions; existing appointment permissions and active-state policy |
| Future cancellation | POST /api/admin/consultations/[id]/reject calls rejectConsultation, closes request REJECTED/outcome CANCELLED and cancels appointment, optimistic outcome version checked |
| Outcome recording | /outcome is a separate result-recording path with ended/eligible-state requirements; it is NOT the only cancellation path |
| Staff/client views | existing consultation detail and client court-dates pages, session ownership and persisted client linkage |

An initial inference that cancellation required a past appointment was incorrect: it considered only /outcome and missed the connected reject action used by the UI. The final test uses the actual future reject route, without changing appointment dates or policy. The discarded /outcome fixture attempt is not cancellation-release evidence.

## Verification interpretation

Original reports and exact totals are saved in verification.json and the associated JSON files. The initial availability regression run failed 12 of 15 cases before repair. The additional chat/whitespace run failed all three new cases before repair: two impossible-date regressions and one whitespace-normalization expectation. The whitespace expectation was not baseline behavior.

The seven final real HTTP/browser cases cover:
1. Day 40 within a 60-day, 15-minute schedule is displayed and confirmed; no records before explicit confirmation; two concurrent confirmations create one request/appointment.
2. Invalid filters and work settings return 400; 24:00 end remains accepted.
3. Rescheduling guest/client/marketing denials, authorized office update, old slot release and occupied target 409.
4. Reschedule versus public booking race leaves exactly one active appointment at the target.
5. Future rejection: guest 401; client/marketing/lawyer 403; wrong version 409; office admin success; closed version/status and appointment CANCELLED; repeat rejection and reschedule 409; released slot appears through HTTP and can be booked by another contact.
6. Arabic/English impossible chat date retains contact/name, clears invalid preference and accepts a valid follow-up; date-only/time-only and whitespace preferences are exercised without creating requests.
7. Actual browser free booking, stolen slot recovery, preserved draft, alternative selection, confirmation/retry without duplicate; persisted clientId matches the fixture client; staff shows the appointment time and outcome; client table row contains the specific appointment title, date/time and pending-review state.

AI_PROVIDER=mock is explicitly set. Normal intake uses local mock extraction plus deterministic parsing; selecting/confirming bypasses AI. This is real application HTTP, database and browser evidence, NOT real external AI quality/failure evidence. No real AI/payment keys or provider requests. Booking mode AI_CHAT_FREE is a disposable database fixture, not a product price/policy change.

## Isolation and cleanup

New cluster `_workspace/batch4-postgres/data`, PostgreSQL 18.6, loopback 55437, database/user kmt_batch4. Existing binaries reused; no system service. 17 migrations and seed succeeded. Every test setup checks host, port, database, APP_ENV, mock provider, upload root and SQL data_directory before writes. Original D: checkout, production, port 5432 and .env were not touched. See database-lifecycle.json for final stop/removal evidence.

## Fourteen-step coverage

| Step | Current evidence / remaining work |
|---|---|
| 1 Inventory | 58 page files, 100 API files, 119 operations, 364 source files preserved; live dynamic content crawl remains. |
| 2 Protection | Batches 2/3 sessions, files, local restore; all mutation permissions, real ClamAV, production restore remain. |
| 3 Booking | This batch proves bounded real lifecycle, conflict races, cancellation and strict date/time validation; broader assignment/review workflows remain. |
| 4 Assistant | Local mock/deterministic recovery and date parsing checked; broad bilingual understanding, ambiguity and external AI outage/quality remain. |
| 5 Payments | External sandbox/reconciliation remains. |
| 6 Office operations | Selected booking/files/auth flows only; full domain audits remain. |
| 7 Content | Existing localized copy reused; full editorial review remains. |
| 8 Design checkpoint | Interactive home/service/booking/client/admin light/dark prototypes await preparation and user review. |
| 9 Shared UI | Existing hydration helper reused; visual migration pending. |
| 10 Booking rollout | Functional journey evidence added; approved design rollout pending. |
| 11 Public pages | Preserved; redesign pending. |
| 12 Client/admin | Specific persisted booking visible to both; broader tools/themes pending. |
| 13 Tailwind removal | Not started; no new libraries or archive mixing. |
| 14 Release | Batch-local verification only; whole-product/provider/deployment gates remain open. |

## Final gate results

469 unit/contract tests passed, 0 failed, 5 existing optional DB tests skipped; seven separate real HTTP/browser cases passed without skips. Typecheck, lint, secret scan and source preservation passed. Guarded production build passed with 44 static pages, exit 0. PostgreSQL stopped successfully, no postmaster PID, pg_isready exit 2; exact temporary root removed. One initial full-suite backup resolver failure under concurrent dev compilation did not recur in the complete two-worker run after dev stopped; its cause is unproven and no backup source was modified.
