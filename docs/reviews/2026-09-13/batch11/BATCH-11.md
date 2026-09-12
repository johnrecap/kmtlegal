# Batch 11: client first-message concurrency

## Result

`createOrContinueClientConversation` now locks the existing `Client` row as the first operation in its Prisma transaction. This serializes the active-thread lookup and first-thread creation for one client. The lock query is parameterized with Prisma SQL and casts the supplied identifier to `uuid`. If the client row is absent, it returns the existing `404 NOT_FOUND` API contract instead of creating a conversation.

For an existing active thread, the prior `ConversationThread` `FOR UPDATE` remains before inserting the message. The lock order is therefore `Client` then `ConversationThread`. The change adds no migration, index, dependency, UI/API contract, or status/reopen-policy change.

## PostgreSQL evidence

The controlled integration suite in `tests/integration/batch10-conversation-postgres.test.ts` passed all seven cases against a temporary PostgreSQL 18.6 server on `127.0.0.1:55441`, database/user `kmt_batch10`, with `APP_ENV=local` and the `synthetic-batch10-only` marker table. The final result is in [`evidence/postgres-integration.log`](evidence/postgres-integration.log).

- An **in-test reproduction of the previous unlocked decision sequence** uses two transactions and a deterministic barrier. It creates two thread IDs. It is not execution of a historical product revision and does not claim a failed baseline product test.
- Two real production-service first-message calls were started while an external transaction held the target client row. PostgreSQL reported two lock waiters; after release both calls returned the same thread ID, leaving one thread, two distinct messages, and two `conversation.client_message` audits.
- A different synthetic client completed its first conversation while the target client row remained locked, proving the scope is per client rather than global.
- A principal with a missing client ID receives `404 NOT_FOUND` and leaves no conversation row.
- The existing close/archive loser races, reply-before-close ordering, session/ownership checks, and in-process `POST /api/client/messages` first-message route coverage remain in the same suite.

`PRISMA_POOL_MAX=4` was supplied only to this local controlled test process so two interactive Prisma transactions could be started. It is not a production configuration change. The temporary test role received `pg_read_all_settings` to let the test guard inspect `data_directory` and `SELECT` on the marker table; the role and cluster were destroyed during cleanup.

Intermediate evidence is retained rather than hidden: the initial identity guard lacked that local-only grant, the default one-connection pool could not start both controlled transactions, and the first lock observer counted only an immediate blocker in PostgreSQL's lock queue, and the final explicit missing-client rerun granted local read access to the marker table. The final observer counts actual lock waiters. The final log also records a `pg` client deprecation warning from the existing controlled test orchestration; all seven tests passed.

## Repository verification

- Full suite: 533 passed, 29 skipped — [`evidence/full-tests.log`](evidence/full-tests.log)
- Typecheck — [`evidence/typecheck.log`](evidence/typecheck.log)
- Lint — [`evidence/lint.log`](evidence/lint.log)
- Production build — [`evidence/build.log`](evidence/build.log)
- Page inventory: 58 before and after, no route-page change — [`evidence/page-inventory.json`](evidence/page-inventory.json)
- Setup, migration/seed, and PostgreSQL server output are retained under [`evidence/`](evidence/).

## Boundary and cleanup

This change removes the automatic client-first-message race only. Staff `updateAdminConversation` still permits reopening `CLOSED` or `ARCHIVED` threads, so it can still produce multiple active threads; that policy is outside Batch 11.

Batch 10's contact-form browser check mocked both the rejected request and the subsequent `201` retry. It demonstrates UI recovery only; it does not demonstrate a persisted contact record or email delivery.

Cleanup confirmation, the secret scan, and final structural checks are recorded in [`verification.json`](verification.json). The temporary PostgreSQL server, its database and role, and its workspace directory were removed after the synthetic-record count reached zero.
