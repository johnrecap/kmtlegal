# Website, portal and admin repairs

Baseline: `9161eb5`. No Spec Kit, new dependencies or schema migrations.
Unexecuted database, browser and deployment checks remain open. Baseline typecheck
and lint passed; baseline Vitest: 97 files / 702 tests passed, 5 files / 53 tests skipped.
Baseline skips are not acceptance evidence. No local browser/server was launched.

## Work packages

- Public: FIX-01/02/03 implemented; source integration and automated regressions passed.
- Portal: FIX-04/05/06/07/09 implemented; source integration and automated regressions passed.
- Finance: FIX-13/14/15 implemented; focused server and draft/selector tests passed.
- Tasks: FIX-16/17/20 implemented; server and StrictMode/pagination tests passed.
- CRM: FIX-10/11/12 and calendar FIX-23 implemented; source integration and automated regressions passed.
- Conversations: FIX-08/18/21 implemented; source integration and automated regressions passed.
- UI: FIX-19 contrast and FIX-22 draft recovery implemented; browser acceptance open.

Package contracts and evidence: [public](repairs/PUBLIC_PAYMENT_CONSENT.md),
[portal](repairs/CLIENT_PORTAL.md), [admin](repairs/ADMIN_RECORDS.md),
[conversations](repairs/CONVERSATIONS_NOTIFICATIONS.md). Implementation is not a claim
that the unexecuted staging/deployment acceptance gates below are closed.

## Individual acceptance map

| ID | Repair | Primary regression evidence / required acceptance |
| --- | --- | --- |
| FIX-01 | Token-before-read payment status | Valid/missing/wrong/expired/swapped attempt tests; no mutation on denied lookup |
| FIX-02 | Explicit fresh consent | Unchecked UI, missing/false server rejection, audit in booking/payment transaction |
| FIX-03 | Public locale continuity | AR/EN setup, return, receipt and recovery consumers |
| FIX-04 | Hide draft invoices | `tests/server/portal-visibility.test.ts`; PostgreSQL acceptance below |
| FIX-05 | Separate currency balances | `tests/server/repair-finance.test.ts`, portal visibility tests; Decimal sums on PostgreSQL pending |
| FIX-06 | Full portal totals | Portal tests; preview5 versus full8 and old due invoice in PostgreSQL pending |
| FIX-07 | Hide internal meetings | Portal dashboard/list/case/assistant predicates and tests; PostgreSQL pending |
| FIX-08 | Client chat recovery | Initial-load retry, recovered refresh error and retained reply draft |
| FIX-09 | Safe case not-found | Invalid/missing/foreign case cannot expose another client's record |
| FIX-10 | Complete client related lists | Scoped clientId links, upcoming/history split, shown/total counts |
| FIX-11 | Independent account rights | Account manager without profile-update permission |
| FIX-12 | Dedicated archive confirmation | Reject ARCHIVED in ordinary update and reject unconfirmed archive |
| FIX-13 | Invoice record isolation | `tests/ui/repair-form-drafts.test.tsx`, `repair-finance-select.test.tsx`; record switch and failed-load handling |
| FIX-14 | Searchable finance choices | `tests/server/repair-finance.test.ts`; page9 and selected off-page record; finance-only permissions |
| FIX-15 | Gateway read-only rights | `tests/server/repair-finance.test.ts`; server rights and non-mutating detail |
| FIX-16 | Independent task/document access | `tests/server/admin-task-documents.test.ts` |
| FIX-17 | Read-only task actions | Same per-record rights in case/list/board; task-only client data redaction |
| FIX-18 | Versioned conversation drafts | Atomic updatedAt conflict, touched fields only, reply/poll sync untouched values |
| FIX-19 | Semantic theme contrast | Command-center transparent secondary buttons; finance/consultation warning tokens; visual QA pending |
| FIX-20 | Independent board pagination | `tests/ui/fix-task-board.test.tsx`; strict remount, page progression after dedup; server status filter/count tests |
| FIX-21 | Notification polling lifecycle | Serialized abortable polling, offline/hidden pause, terminal access errors, backoff60s |
| FIX-22 | Session-only content drafts | `tests/ui/repair-form-drafts.test.tsx`; user/record isolation, save/discard clear, beforeunload/link warning |
| FIX-23 | Calendar filter context | `tests/ui/repair-calendar-navigation.test.tsx` verifies actual day/week/Today links and Cairo midnight; GET filter contracts cover clientId/caseId persistence |

## Disposable PostgreSQL acceptance

`tests/integration/repair23-postgres.test.ts` creates 152 synthetic clients, 160 cases,
13 tasks for each of six states, five staff roles, two distinct clients and custom
task-reader/account-manager principals. It includes eight appointments (one internal),
multiple invoice states/currencies and an old issued invoice outside the latest five.
All changes run inside one deliberately rolled-back transaction; no cleanup delete is used.
These fixtures exercise services using explicit principals, not authenticated browser sessions.
Provisioning staging login/storage states and the browser role matrix remains a separate open gate.

Prepare an **empty**, migrated disposable database named `kmt_repair23_test` using the
existing migrations (no schema change). Set `REPAIR23_DATABASE_URL` and
`RUN_REPAIR23_POSTGRES=true` only in the isolated test runner, then run:

```text
npx vitest run tests/integration/repair23-postgres.test.ts --maxWorkers=1
```

The test refuses production mode, another database name or existing application records.
It does not read DATABASE_URL as a fallback. This lane is currently **not executed**:
no disposable connection was provided. Its skipped result is not success. Existing
database-gated suites have separate opt-ins and must also run in their documented sandbox.

## Browser / deployment gates (open)

- AR/EN and both themes at 390/1440; critical shell/forms/board at 320/768/1024.
- Login for five roles plus custom permissions, keyboard focus, zoom200%, reduced motion.
- Invoice switch/failure, off-page selection, client archive, conversation race/recovery,
  browser back/forward content drafts and calendar filters.
- Public-site and client-portal smoke after shared changes.
- Post-deploy read-only smoke only; never create test payments/client data in production.

After the verified commits reach origin/main, the operator updates aaPanel/PM2 with:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

For a regression, revert the responsible package and redeploy only when the revert does
not restore a disclosure. Payment-token and internal-record visibility protections must
remain fail-closed; disable the affected route temporarily rather than restore exposure.
No deployment, production mutation or rollback was performed during this task.

Source/DOM review uses existing `surface-strong-foreground`, `warning-surface`,
`warning-border`, `warning-strong` tokens and existing 44px form controls. No visual
score is asserted without screenshots: contrast, RTL overflow and actual focus geometry
remain browser gates rather than inferred passes.

## Verification journal

- Baseline: typecheck/lint passed; 702 tests passed / 53 skipped.
- Focused foundation/finance tests: passed; later selector/draft tests cover off-page recovery,
  client-dependent case search, unavailable-association validity, save/discard and leave warning.
- Combined attempt: 4 stale contract/fixture failures and four OOM worker errors while build
  ran concurrently. **Not a pass.** Consent fixtures, component inventory and source contracts updated.
- Serialized build retry: compilation passed, then caught a missing required StateBlock description
  in the new client-document empty state. Corrected before final verification.
- Targeted run: 4 files / 9 tests passed (calendar links, finance selector, component
  inventory, all admin GET filter contracts).
- Serialized full run first caught one stale conflict-copy assertion. The UI now preserves
  the standard localized parser message and request ID; its focused 8-test suite passed.
- Final full rerun (including localized payment status and the payment-attempt appointment
  visibility filter): 107 files / 737 tests passed; 6 files / 55 tests skipped. No worker OOM errors.
  Vitest emitted its existing config-loader notice and jsdom unsupported scroll/canvas notices.
- Final typecheck and lint passed (no ESLint warnings/errors). Next's lint-command deprecation
  notice is tooling output, not a source violation.
- Secret scan exited 1 for `.env:5` (local database URL pattern). `.env` is ignored and
  untracked, not introduced by this repair and not included in the commits. No secret value
  was printed, and no other high-confidence finding was reported. This is not a clean scan pass.
- Final production build passed, including its lint/type checks and generation of all 39
  static pages. Command: `npm run build`, with process-only
  `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`, `NODE_OPTIONS=--max-old-space-size=1536` and
  `CIRCLE_NODE_TOTAL=2` (one Next worker). No repository build configuration was changed.
  This compile/build gate does not prove database connectivity or dynamic authenticated routes.
- `git diff --check` passed. Schema, migrations, dependency manifests and webhook contracts
  are unchanged. No real client data or credentials are included in the delivery; fixtures are synthetic.

## Ownership and verification

Root owns finance, shared UI, docs, integration and commits. Verified Sol workers own
public, portal and conversation packages; verified Terra owns tasks, CRM and calendar. Workers do not commit,
push, create descendants or overwrite others. Each package needs focused tests, integration
review and documentation before its commit. Skips are not successful acceptance.

PostgreSQL and browser acceptance require disposable/staging resources. Never create
production fixtures. Deployment and production smoke tests have not been performed.
