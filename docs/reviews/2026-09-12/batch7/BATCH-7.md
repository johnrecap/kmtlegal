# Batch 7 — consultation, client and case operations

Baseline: batch 6 accepted and pushed by the supervisor as `ff988e8bbaf2b3ca7e82612071270819a4a5265e`. This batch runs in the existing worktree, without Spec Kit, delegation, design migration or live-provider calls. Local commit only until exact-commit supervisor approval. The original D: checkout is not an execution target.

## Office operations map

| Area | Evidence before this batch | Current review scope |
|---|---|---|
| Consultations | Batches 4/5 exercised booking lifecycle and bilingual intake; batch 6 exercised local paid reservations | Assignment, result/correction, conversion, stale editors and resource boundaries |
| Clients | Existing CRM and portal implementation/tests; broad workflow claims are not new execution evidence | Linked identity, profile access, assignment/archive consequences and related-record visibility |
| Cases | Existing manual creation/idempotency/core-update services and tests | Manual creation, repeated requests, changes/conflicts, scoped lists/details/options |
| Sessions/calendar | Bounded scheduling evidence in batch 4 | Only appointments connected to consultation/case conversion; full office calendar review deferred |
| Tasks | Existing implementation | Full workflow untested in this batch; later scope |
| Documents | Batch 2 access checks and batch 3 bounded upload/restore evidence | Only connected visibility boundary inspection; full document workflow not repeated |
| Messages | Existing implementation | Deferred, no sending to real users |
| Notifications | Existing implementation; earlier booking/payment side effects | Inspect connected writes only; broad notification review deferred |
| Staff/permissions | Existing role/permission policy | Exercise existing roles against scoped resources, without changing policy |
| Settings | Existing implementation | Local fixture configuration only; broad review deferred |
| Finance/reports | Batch 6 local payment trust/lifecycle evidence | No repeat; live sandbox, old-attempt reconciliation and orphan intention recovery remain open |

## Connected operations under review

| Operation | Actor and enforcement | Reads/writes | Expected observable result |
|---|---|---|---|
| Consultation list/detail/review | Office-wide or assigned consultation reviewer | Scoped requests, review state and note/audit | Authorized employee sees assigned intake; other lawyer/client cannot read it through staff routes |
| Assign consultation | `consultation.review.any` | Eligible lawyer, consultation, primary appointment, linked client and audit | Responsible lawyer agrees across linked records; former reviewer loses assigned access |
| Record/correct result | Existing secretary/office/super-admin role and review+appointment permissions | Past primary appointment, outcome/version, appointment status and audit | Final outcome and correction history; stale edit rejected; future cancellation uses reject route |
| Convert consultation | Authorized reviewer; existing awaiting-result/successful policy | Consultation/client, one case, optional follow-up appointment and audit | One linked case, no duplicate client or case on repeated/concurrent request |
| Client CRM read/search/options | Existing global/assigned client policy | Client and connected case/appointment/request summaries | No unrelated resource disclosure through nested summaries or counts |
| Manual case create | Existing case-create permission | Active client/lawyer, request token/hash, case/parties/audit | Same request token reuses one case; changed payload conflicts |
| Case core/status update | Existing global/assigned case update policy | Case version, eligible reassignment and audit | Fresh update visible to correct client/staff; stale or unauthorized edit rejected |
| Client case list/detail | Authenticated own-client scope | Own non-deleted cases and client-visible related records | No other client's details or internal notes |

## Confirmed findings and fixes

1. **High — staff case detail exposed to its client.** The HTTP baseline returned 200 from `/api/admin/cases/:id` to the owning client, including staff case-party notes. `canReadAdminCase` reused the broader own-case policy without requiring a staff case-read capability. The helper now also requires the existing any/assigned admin case-read capability. The client's separate own-case page remains readable and excludes internal case/party notes. No role or permission assignment was changed.
2. **High — staff CRM detail exposed to its client.** `/api/admin/clients/:id` similarly accepted the profile owner through the shared self-read helper, despite staff list and page gates. `canReadAdminClient` now requires the existing any/assigned CRM-read capability before the resource check. Both own-client staff bypasses are captured as pre-fix HTTP failures in `before-access.json` and pass after remediation.
3. **High — related case data bypassed lawyer scope.** A lawyer denied direct case access still received its ID/title/type in the assigned client's nested CRM cases, with an unscoped count. CRM now reuses each independent case, appointment, consultation and document scope for nested records/counts, including the client list counts. A synthetic role with only `client.read.any` sees the client but receives no unauthorized related records or counts, instead of the entire request failing. Production roles were not edited.

`after-access.json` records the three original regression scenarios passing. `http-related-scopes.json` separately exercises appointment/request inclusion and exclusion against standalone HTTP lists and document counts, plus the temporary client-only reader. Supervisor read-only checks corroborated the original fixes but are not added to suite totals.

4. **High — valid manual-create retries could conflict.** Generic audit redaction mistook 10–15 digit runs inside a SHA-256 request hash for phone numbers. The stored replay identity then differed from the same submitted body. The observed concurrent responses were 201/409 with one case, not duplicate creation. `auditLogCreateData` now preserves only the catalog-validated 64-hex `requestHash` for `case.manual_create`; other metadata still passes through redaction. A deterministic digest regression failed before and passed after, and actual simultaneous HTTP requests with a deliberately affected digest now return 200/201, followed by a 200 replay. A changed payload still returns 409. **Already-corrupted historical audit hashes are not repaired automatically**; their retries may still require operator review.
5. **UI clarity — neutral client case badges.** Portal text overrides rendered NEW/NORMAL badges pale on white. List and detail pages now apply the existing muted token directly to neutral badges only. Active/high-priority semantic colors and global components remain unchanged. An initial utility-class attempt did not visibly resolve the override and was replaced before final verification. Browser checks inspect computed foreground/background as well as screenshots.

## Existing policies preserved

- Outcome management remains limited to the established secretary/office/super-admin roles with consultation and appointment permissions. Assigned lawyers can review/convert eligible consultations but cannot record/correct final outcomes.
- Assignment updates the linked client and primary consultation appointment. Reassignment removes the old lawyer's assigned-resource access; it does not rewrite every existing case's independent assignment.
- Final outcome recording requires an ended primary appointment and an eligible outcome state/version. A future appointment is cancelled through the existing rejection operation.
- Conversion uses its existing awaiting-result/successful eligibility and bounded database retry transaction. Manual case creation uses the existing request token and request hash; core editing uses `updatedAt` conflicts.
- `ARCHIVED` is a business status, not deletion or revocation of the client's login. Historical case reads remain available. Manual creation requires an ACTIVE client; soft-deleted cases are excluded. These distinctions are exercised rather than altered to fit tests.
- InternalNote relations are not selected by the client case service. Staff case-party notes are protected by the corrected staff detail gate; client pages are checked for the synthetic note markers.

## Verification status

The main network file contains **14 unique scenarios** using actual Next HTTP routes and a disposable PostgreSQL 18 database. Six baseline actors are an office admin, two lawyers, two clients and an unauthorized marketing employee; one additional temporary role has only `client.read.any`. All fixtures are synthetic. No HTTP responses, repositories or database writes are mocked in these Playwright scenarios. There is no separate handler/DB suite claim for this batch.

Evidence must be read by scenario, not by summing reruns:

- `http-browser-main.json`: earlier 12-scenario run passed; it predates later strengthening and is historical evidence.
- `http-browser-intermediate.json` (also retained as `http-browser.json`): 11 passed, 2 failed. The failures were the digest/replay defect and a 390px navigation wait. Neither failure is hidden or counted as a pass.
- `focused-final.json`: three passed: deterministic pathological-digest concurrency/replay/core editing, the added lawyer search/filter scope case, and the corrected 390px navigation check.
- `http-related-scopes.json`: one passed, including nested scopes and the client-only role; this scenario also passed in the intermediate run.
- `visual-final.json`: all three final viewport journeys passed, including computed neutral colors `rgb(100, 116, 139)` on `rgb(255, 255, 255)` (about 4.76:1 contrast). Fresh list and true detail screenshots for every width accompany the report.
- `legacy-browser.json`: all seven existing plan36/plan37 browser cases passed without skips against real synthetic fixtures. Their filenames are existing test assets, not Spec Kit activation. The initial 4-pass/3-fail report remains as `legacy-browser-initial.json`. Corrections scope selectors to the relevant form and suppress only the exact expected 409 console response for the exercised endpoint; other browser errors still fail.
- `before-request-hash.json` / `after-request-hash.json`: deterministic pure regression changed from 1 pass/1 fail to 2 passes. These are not additional network scenarios.

The navigation failure was inspected before changing the test: POST creation returned 201; detail requests returned 200, with the first taking about eight seconds during development compilation. No JavaScript error was observed. The test now waits for the specific successful detail response and then asserts the actual created-case URL and rendered content. No production navigation code or global assertion timeout was changed. See `failure-diagnostics.json` for the extracted trace observations.

Browser journeys use the actual Arabic office/client UI at 390/768/1440px, keyboard movement, validation input preservation, search/open and horizontal-overflow checks. The client detail screenshot is taken only after its actual detail URL is asserted. This does not claim English coverage for this batch or a comprehensive design review.

`scenario-results.json` maps the 14 unique main cases to their latest passing report; reruns are not added to that total. Final unit verification passed **522/544**, with **22 opt-in DB cases skipped** (5 batch 2 and 17 batch 6 cases, intentionally not repeated). The initial unit run found one stale consumer-disposition record after the two pages began importing existing design tokens; the record was updated and the full suite passed. `unit-initial.json` preserves the original 521-pass/1-fail/22-skip result. Typecheck and lint passed. Production build passed with `ALLOW_BUILD_WITHOUT_DATABASE_URL=true` and generated 44 static pages; persistent-cache snapshot warnings did not fail the build. Final evidence is recorded in `verification.json` and `build.log`.

The verified disposable database had 18 applied migrations and no other connections before shutdown. It was stopped normally through `pg_ctl`; its exact guarded directory, credentials, cookie storage and logs were removed. TCP checks confirm ports 3111 and 55438 closed. See `database-final.json` and `cleanup.json`. The pre-existing default PostgreSQL service was not used or stopped.

## Reproduction and isolation

The committed network test requires `BATCH7_ISOLATED_DB=true`, `APP_ENV=local` and a database URL pointing to `127.0.0.1:55438/kmt_batch7`. Its pre-write guard also checks SQL `data_directory` against this worktree's `_workspace/batch7-postgres/data` and SQL server port 55438. Provision a fresh PG18 cluster there, apply existing migrations and seed synthetic data. Credentials must stay in ignored local files. Set `KMT_PORT=3111`, `APP_ORIGIN=http://127.0.0.1:3111`, local upload storage, mock AI and disabled email, then run `node scripts/run-playwright-with-server.mjs tests/e2e/batch7-office.spec.ts --workers=1 --reporter=json`. The existing legacy tests additionally require their documented PLAN36/PLAN37 fixture environment and authenticated storage state; the local guarded setup created these from synthetic records, not real accounts.

## Remaining gates

This is bounded Step 6 evidence, not whole-office or production readiness. Full calendar, task, message, staff, settings and reporting workflows remain later scope. Real payment-provider sandbox/cutover, old-attempt reconciliation, orphan intention recovery, broad design work and server deployment are not closed by these tests. No live emails, external payment calls, schema migrations, production role edits, original-checkout edits or push were performed in this batch.
