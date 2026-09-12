# Batch 10: conversation integrity and contact recovery

## Scope

- Conversation replies: client reply, staff reply, and the existing-active-thread path in client create-or-continue.
- Conversation panels: stale polling responses after a newer reply or administrative update, overlapping operations, and locale changes during a client reply.
- Public contact form: hydration, rejected network requests, retained values, retry, and duplicate-submit prevention.

## Defects fixed

1. A reply could read an active thread, then write after another request closed it. Each existing-thread write path now locks the active thread row with a UUID-cast, status-qualified PostgreSQL `FOR UPDATE` query before inserting a message. Losing the lock race returns `409 CONFLICT`; the transaction rolls back before a message or success audit is written.
2. Polling responses can no longer replace a newer local write. Each panel permits one local mutation and one in-flight poll, and invalidates a poll started before that write completes. The client panel also rejects results from an earlier locale context, clears only the draft that was actually sent, and reloads the current locale after a successful reply completes in an older context.
3. The public contact form now uses the shared hydration guard, retains input after a rejected request, surfaces the existing Arabic or English fallback, re-enables retry, and blocks duplicate submits with a request ref.

## Real PostgreSQL evidence

- Isolated PostgreSQL 18.6 ran at `127.0.0.1:55441`, database/user `kmt_batch10`, with the `synthetic-batch10-only` marker and no real records.
- `tests/integration/batch10-conversation-postgres.test.ts` passed 4 tests. Controlled row-lock races for client reply, staff reply, and existing-thread create-or-continue returned `409` with zero messages and zero success audits when close/archive won. The inverse ordering started both a reply and a later close while a fixture lock was held, verified both waits, then persisted the reply before closing.
- The route-handler lane used synthetic active sessions to verify unauthenticated `401`, owner access, other-client `404`, staff access, and unauthenticated/other-client reply rejection. This is in-process route-handler session evidence rather than network HTTP evidence.
- The PostgreSQL test logs a `pg` deprecation warning caused by the controlled test orchestration issuing a query while the same client has a pending query. The four assertions pass; product runtime code does not depend on that orchestration pattern.
- A first setup attempt exposed a seeded role-name uniqueness assumption. The fixture was corrected to upsert the standard roles and permissions, then the final isolated run passed.

## Browser and visual evidence

- Playwright passed 4/4 flows against the local app on port 3114. Contact recovery was checked in English at 390 px and Arabic at 768 px; client and staff conversation replies used the real local PostgreSQL fixture at 390 px and 1440 px.
- Only the contact API failure was deliberately aborted in the browser to exercise rejected-fetch recovery. Both chat flows used the real local Next.js handlers, synthetic sessions, and PostgreSQL state.
- The first chat run asserted the database before the reply response completed. The test was corrected to await that response before querying PostgreSQL. Contact screenshots were then recaptured from the top of the page so the sticky header did not obscure the evidence.
- Visual inspection confirmed retained contact values, locale-specific error and retry states, sent chat messages, cleared sent drafts, and no page-level horizontal overflow at the tested widths. The English 390 px public header remains visually crowded and is deferred as general responsive polish outside this batch.

Screenshots:

- `evidence/contact-en-failure-390.png`
- `evidence/contact-en-retry-390.png`
- `evidence/contact-ar-failure-768.png`
- `evidence/contact-ar-retry-768.png`
- `evidence/client-chat-390.png`
- `evidence/admin-chat-1440.png`

## Verification

- Focused contact and conversation component suite: 10/10 passed.
- Full Vitest suite: 71 files passed, 2 skipped; 533 tests passed, 26 skipped.
- Real PostgreSQL integration: 4/4 passed.
- Browser acceptance: 4/4 passed, with a 2/2 contact screenshot recapture.
- `npm run typecheck`, `npm run lint`, `npm run security:secrets`, and `npm run build` passed.
- A final build attempt without a database URL stopped at the project's production environment gate. The accepted rerun used `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`, the repository's documented build-only bypass, and completed all 44 static pages and the route manifest.
- Page inventory remained 58 `page.tsx` files against baseline commit `4e1fd9c559104b4f135947a9f7f6456828a737be`; no page was added or removed.
- Machine-readable results are in `verification.json`; raw logs and screenshots are under `evidence/`.

## Cleanup and boundaries

- Exact synthetic Batch 10 user, client, thread, and message counts were zero before shutdown.
- Ports 3114 and 55441 are closed. `_workspace/batch10-postgres` and `_workspace/batch10-storage` were removed after evidence capture. Failed Playwright trace/error artifacts were removed because they could contain synthetic session state.
- No role policy, notification policy, retention policy, migration, real account, SMTP, AI, payment, production database, or public page deletion changed.
- Simultaneous creation of two first active threads remains a separate contract/data-model decision. This batch deliberately adds no uniqueness constraint or migration.
