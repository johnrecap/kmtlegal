# Batch 2: route preservation and isolated security/booking checks

Date: 2026-09-11. Baseline: `7ad0010ffad2191bcada37ac45ba8a7ac8a973c4`.
Workspace: `C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office`.
Branch: `codex/kmt-batch1-hardening` (same execution task).
Status: verified and cleaned; local review candidate, no second push authorized.

## Confirmed defects repaired

1. **P1 — credentials in a pre-hydration login URL.** Actual browser login submitted the
   unhydrated form using the browser's default GET method. Both existing database-backed login
   tests failed with fixture credentials in the URL. `src/features/auth/login-form.tsx` now
   declares POST and disables credential inputs/submit until hydrated. The same two tests pass
   without weakening them. A JavaScript-disabled browser verifies the safe initial form state.
   Login still needs JavaScript; no new server-rendered login flow was introduced.
2. **P1 — winter consultation slots shifted one hour.** A regression test requested 10:00 Cairo
   on 2026-01-12 but received 07:00Z (09:00 Cairo). The availability service now resolves wall
   times using `Africa/Cairo` rules instead of a fixed +03:00 offset. Summer 10:00 remains 07:00Z;
   winter 10:00 becomes 08:00Z. This fixes the UTC instant, not office hours, price or booking policy.
3. **P2 — malformed-cookie logout throws.** `logoutByRequest` duplicated unsafe cookie decoding;
   `%FF` caused URIError. It now uses the batch-1 shared parser. The actual logout API returns
   200 and expires the cookie; valid session logout is checked against PostgreSQL.
4. **P1 — fresh development seed aborts.** After all 17 migrations succeeded on a fresh cluster,
   Article upsert failed because `slug` is no longer a unique selector. Article and CaseStudy
   seeds now use `locale_slug` and explicitly set `ar`, preserving the existing fixture content.
   A database test reruns seed and verifies stable counts and one record per localized key.

No schema migration, permission policy, booking status policy, fee, production credential,
historical Spec Kit plan or visual redesign was changed. Existing auth copy is reused unchanged.

## Connected coverage map

| Flow | Sources traced | Evidence in this batch | Not covered by that evidence |
|---|---|---|---|
| Login/logout/session | LoginForm → auth login/logout routes → auth-service/session-store → User/Role/Session | Actual Chromium staff/client login; API 401/200/403/logout; live session expiration, suspension, role disable, permission removal, revocation | Every staff role/action; production proxy/cookie configuration; dormant 2FA activation |
| Admin gate | middleware, page-guards.tsx, admin-route-policy, policy, admin clients route/service | Client session denied by actual `/api/admin/clients`; staff dashboard login | Complete admin endpoint matrix; every assignment/ownership mutation |
| Client case isolation | portal page guard → client-portal-service ownCaseWhere/getPortalCaseDetail | Actual PostgreSQL service call: owner succeeds; another client receives 404 | Every case endpoint/UI state; role administration concurrency |
| Private document access | files download route → getAuthorizedDocumentDownload → canReadDocument → private filesystem | Actual PostgreSQL + filesystem service calls: own bytes allowed; other client and INTERNAL_ONLY denied; foreign document omitted from list | Full HTTP download matrix; real upload/ClamAV, storage recovery or backup drill |
| Document upload policy | assertDocumentUploadPermission/Targets, upload policy, malware gate | Source review: owner and case must agree; self-upload limited to actor's client; permission checked before storage | No malware service or upload E2E was run |
| Booking conflict and duplicate | assistant confirmation → availability → duplicate check → serializable transaction → Appointment/ConsultationRequest/client/notifications | Real service calls against PostgreSQL: one committed booking for two contacts competing for a slot; one committed consultation for same contact on two slots | Full browser booking; paid reservation/provider race; all staff rescheduling paths |
| Cairo wall time | availability generator and confirmation availability lookup; date helper callers | Winter/summer and both clock transitions; duration, unique IDs, lead time, conflict exclusion | Changes to future IANA rules require runtime timezone-data updates |
| Arabic route preservation | renderPublicPath → inventory dispatcher evaluator → before/after comparison | Dispatcher executed with inert view markers; removal of privacy branch from in-memory sample detected | Actual page component rendering, database content publication and arbitrary future dispatcher syntax |

The five database tests are **service-level tests**. In particular, the case/document checks pass
a controlled Principal directly to the real service; they are not proof of all HTTP authorization.
The browser/API tests are recorded separately. No responses are mocked in either of these
two isolated lanes. Booking confirmation intentionally takes the existing deterministic bypass
of AI; the LLM and external payment provider were not called.

## Cairo transition behavior

The formatter is reused at module scope. Candidate offsets are checked on both sides of a
transition and round-tripped through the Cairo wall clock. Nonexistent spring-forward times
are omitted. The repeated fall-back wall time is offered once at its **first occurrence**,
preserving the old +03:00 choice for that ambiguous Cairo hour. This does not introduce an
extra appointment in the repeated hour. If the first occurrence fails the lead-time check,
the later occurrence is not substituted silently.

Tests cover 2026-04-24's missing hour and 2026-10-29's repeated hour. Each generated appointment
retains the configured elapsed duration; the displayed end wall time can repeat during fall-back.
Tests verify Cairo start labels, exact UTC instants, 60-minute elapsed durations, no repeated
IDs, minLeadHours and overlap exclusion around that transition.

## Route inventory gate

`scripts/lib/public-route-inventory.mjs` extracts the trusted `renderPublicPath` function and
evaluates it with inert view identifiers, discovering section literals from its conditions and
trying the current root/section/section-plus-slug shapes. The comparison now includes Arabic
patterns. `tests/server/arabic-route-preservation.test.ts` retains accepted routes and demonstrates
that removing the privacy branch from an in-memory source sample is detected.

This is designed for the current dispatcher structure. It does not enumerate live database
content or discover every possible future route composition (for example, three-segment dynamic
routes or a rewritten lookup-table dispatcher). Changes to that structure require updating the
extractor and its behavioral tests. **Node vm is not a security sandbox**; this tool executes
trusted repository code only. Unsupported dependencies fail instead of silently producing a
successful inventory. No production page component bodies are executed by this tool.

Before/after files preserve 58 page files, 100 API route files and 119 operations; 14 dispatcher
patterns are now derived, including the dedicated booking path that the dispatcher also supports.
No captured source routes or content links were removed. Historical batch-1 snapshots are retained.

## Disposable database and storage lifecycle

- Installed tooling found: PostgreSQL 18.6 under `C:/Program Files/PostgreSQL/18/bin`.
- New cluster: `_workspace/batch2-postgres/data`, created with initdb; not a system service.
- Listener: `127.0.0.1:55437`; database/user `kmt_batch2`; SCRAM host auth and known disposable
  fixture password. Port 5432 and the original D: checkout were not used or modified.
- Storage: exactly `_workspace/batch2-postgres/uploads` under this worktree. Tests reject any
  other resolved UPLOADS_DIR before writes. SQL checks verify the database's data_directory and port.
- initdb completed inside the sandbox with restricted-token warnings. pg_ctl start needed the
  approved execution boundary because restricted-token startup failed inside the sandbox.
- All 17 migrations applied. Initial seed failure above was fixed; repeated seeds and stable
  counts were then tested. No production data or credentials were copied into the cluster.
- Browser server: `http://127.0.0.1:3109`, `APP_ENV=local`. The batch-2 security suite and the
  batch-2 lane of existing DB login tests assert both this origin and the isolated database target.
- Final shutdown/removal: pg_ctl fast stop succeeded; postmaster.pid was absent and pg_isready on 55437 returned no response (exit 2). The exact verified worktree directory, including uploads and temporary credentials, was removed. See database-lifecycle.json.

Reproduction uses the existing `npm run db:migrate`, `npm run db:seed`, Vitest and Playwright
commands with the above isolated DATABASE_URL, APP_ENV, UPLOADS_DIR and BATCH2_ISOLATED_DB=true.
`KMT_PORT=3109` must match Playwright's local base URL. Never point this opt-in lane at a real
database. The tests deliberately restrict the database name/port/path to this disposable setup.

## Verification results

- Pre-fix regressions failed for malformed logout and winter time; passed after repairs.
- Seven independent regression/route tests passed, including the safe deletion sample and DST.
- Five isolated database service tests passed; seed, session, isolation and booking races are real.
- Eight local browser/API tests passed, including a valid account-setup invitation and four authenticated admin form surfaces; one additional staff browser test passed all four real JSON create/reset operations and subsequent login with both new passwords (9 browser tests total).
- Ordinary Vitest: 451 passed, 5 opt-in database tests skipped. Typecheck and lint passed. The final guarded build after all credential-form changes passed (44 static pages); generation, typecheck and build lint passed. Webpack cache warnings were non-fatal.
- DB-backed tests are skipped in the ordinary lane unless explicitly opted in; a skipped test is
  not counted as a pass. The independent isolated lane results are retained separately.
- No external payment Sandbox, AI understanding, production release, migration of real data,
  ClamAV, aaPanel backup/restore, full admin matrix or physical-device QA was performed.

## Remaining fourteen-step plan

| Step | Current evidence and remaining work |
|---|---|
| 1. Inventory/stabilization | Two batches of fixes; source before/after and Arabic deletion guard. Runtime dynamic content/link crawl remains. |
| 2. Auth/isolation/files/backup | Bounded real service/API evidence above. Remaining staff matrix, uploads/malware, backup/restore and deployment conditions. |
| 3. Appointment lifecycle | Cairo and free-booking concurrency checked. Staff reschedule/cancel, status semantics and full scheduling matrix remain. |
| 4. Arabic/English assistant | Batch-1 recovery is browser-tested with mocked responses. Understanding, ambiguity/corrections and AI outages remain. |
| 5. Payment | Dependency/recovery fixes only. Provider Sandbox, reconciliation, receipts and timing/race evidence remain. |
| 6. Operational domains | Partial login/case/document evidence. Full consultations, assignments, clients, cases, tasks, messages, reports and settings audit remains. |
| 7. Content/copy | Not started; preserve facts/policies and use existing translation sources. |
| 8. Design checkpoint | Pending interactive home/service/booking/client/admin light-dark prototypes for user review. Include known mobile header/heading fixes here. |
| 9. Shared UI foundation | Not started; safety patch reuses existing form primitives. |
| 10. Booking rollout | Existing free service path and recovery checked; new approved design and full UI journey remain. |
| 11. Public pages | Redesign not started; no pages removed. |
| 12. Client/admin | Login safety fixed; visual rollout, full tools, theme persistence and remaining flows pending. |
| 13. Tailwind removal | Not started; preserve archive isolation and migrate only after approved UI work. |
| 14. Final verification/release | Batch evidence only. Whole-product sign-off, production deployment and rollback drill remain. |

Next: supervisor review of this local diff, then approved push; continue remaining security and
scheduling coverage before the user-facing design checkpoint. No second push without review.

## Extended credential-form review

Supervisor review extended the login fix to initially rendered credential forms. The shared
`src/lib/use-hydrated.ts` hook keeps inputs and submit buttons disabled until effects run;
all affected forms declare POST and retain their existing JSON submit handlers and localized copy.

| Source | First-render evidence | Change |
|---|---|---|
| login-form.tsx | Original actual login navigated with fixture credentials in query | POST and hydration guard, shared hook |
| client-account-setup-form.tsx | A real SCHEDULED consultation and signed invitation display the form without JavaScript | POST and guard on email, password, confirmation and submit |
| install-wizard.tsx | Enabled /install displays password form before status fetch; blockedReason starts null | POST and hydration guard; later installation policy still applies |
| governance-forms.tsx | Super Admin session displays create-user and user-password forms without JavaScript | POST and hydration guard on both forms |
| client-crm-forms.tsx | Super Admin session displays create-account or reset-password based on persisted client account | POST and hydration guard on both forms |

These admin forms are permission/data-conditional first-render content, not interaction-opened
modals. The pre-fix browser check confirmed create-user form had no method. Initial setup test
fixture was NEW and correctly showed no form; changing only the fixture to SCHEDULED made the
valid-invitation path testable. Do not count that initial fixture failure as evidence of the bug.
Source inspection confirms the original setup form had named password fields and no method;
post-fix browser tests verify the actual valid form and successful JSON account creation/session.

The installer token input is outside the form (browser input.form === null). It is not submitted
by the password form. No claim is made that this token leaked through that path. Existing signed
invitation links and installer link query contracts are unchanged. Source search found no active
OTP/code input form; /login/2fa deliberately returns notFound. Search/filter GET forms are untouched.
Installer bootstrap was not run against the seeded database. JavaScript remains required for these
interactive credential workflows. No new no-JavaScript login or installation flow was introduced.

The eight-test dev-server run logged an aborted ECONNRESET during navigation after account setup;
all assertions passed. This is retained as a dev-run observation, not a proven production defect.

## Next booking batch: source hypotheses, not confirmed defects

- Prove whether a date-filtered slot after the first 500 slots in a 60-day / 15-minute window can
  also be confirmed by assertPublicConsultationSlotAvailable.
- Exercise impossible date/time values (month 13, February 31, 25:90) in public date/time filters
  and working-day configuration. Current source validation appears shape-based.

Both require failing behavioral tests before fixes; they are deliberately outside this batch.

Final evidence files: `verification.json` contains counts, case names and sanitized commands;
`database-lifecycle.json` records the isolated target, migrations, stop and deletion checks.
The staff submission fixture initially used a nonexistent role label; it now takes the seeded
office-admin role ID. That fixture failure is not classified as an application defect.
