# Batch 10: conversation integrity and contact recovery

## Scope

- Conversation replies: client reply, staff reply, and the existing-active-thread path in client create-or-continue.
- Conversation panels: stale polling responses after a newer reply or administrative update.
- Public contact form: rejected network requests and duplicate submits.

## Defects fixed

1. A reply could read an active thread, then write after another request closed it. Each reply path now locks the active thread row with a UUID-cast, status-qualified PostgreSQL `FOR UPDATE` query before inserting a message. Losing the lock race returns `409 CONFLICT`; the transaction rolls back before a message or success audit is written.
2. Polling responses can no longer replace a newer local write. Each panel permits one local mutation and one in-flight poll, invalidating a poll started before that write completes. The client panel also rejects a response from a previous locale context.
3. Public contact now uses the shared hydration guard, retains input after rejected requests, surfaces the existing locale fallback, re-enables retry, and blocks duplicate submits with a request ref.

## Real PostgreSQL evidence

- Isolated PostgreSQL 18.6 ran at `127.0.0.1:55441`, database/user `kmt_batch10`, with a synthetic-only marker.
- `tests/integration/batch10-conversation-postgres.test.ts` passed 3 tests: controlled row-lock races for client reply, staff reply, and existing-thread create-or-continue each returned `409` with zero messages and zero success audits; the inverse ordering persisted one reply and then closed the thread; client ownership and staff access remained separated.
- The possible simultaneous creation of two active threads remains a separate follow-up. This batch deliberately adds no uniqueness constraint or migration because the intended product behavior needs an explicit decision.

## Focused verification

- 31 focused baseline and new server/UI tests passed.
- `npm run typecheck`, `npm run lint`, and `npm run security:secrets` passed.
- `npm run build` reached Next's optimized production-build phase; its completion output was not captured before this handoff, so it is not recorded as passed.
- Browser screenshots at 390/768/1440 and the 58-page comparison were not completed in this executor turn and remain required supervisor follow-up evidence.

## Boundaries

- No role policy, notification policy, retention policy, migration, real account, SMTP, AI, payment, production database, or public page deletion changed.
- The synthetic database and its data directory must be stopped and removed after review; no database URL or test password is included in this report.
