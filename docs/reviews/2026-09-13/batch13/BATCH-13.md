# Batch 13: office-profile save consistency and live authorization

## Result

Office-profile writes now require the exact `SystemSetting.updatedAt` version observed by the
settings page, including explicit `null` when no row exists. Creation and update run in a
serializable transaction. Two first saves or two saves from one observed version produce one
winner and one localized `409 CONFLICT`; the losing request does not change the row or create a
success audit. A successful update advances the version by at least one millisecond even when the
application clock equals or trails the observed value, and returns that safe version to the form.

The write transaction revalidates the actual session plus the actor's current user, role, and
effective `settings.manage.any` permission. This preserves delegated Office Admin access when that
permission is live while rejecting a revoked session or removed permission after the route's auth
snapshot. Guest/default Office Admin denial, read-only storage, disabled email policy, and the
existing disabled staff-2FA transformations remain unchanged.

The office form retains entered values after conflicts and network failures. A conflict disables
editing and saving until the administrator explicitly reloads current database values, reviews
them, and retries. A successful response becomes the form's next expected version; an unrelated
server rerender cannot replace it or reset a newly entered draft. A synchronous lock prevents
rapid duplicate submissions. The form also remains disabled until hydration, closing the fast
keyboard path that the third browser attempt proved could otherwise trigger a native navigation.

## Controlled PostgreSQL evidence

The dedicated integration suite ran against PostgreSQL 18 on `127.0.0.1:55441`, database/user
`kmt_batch10`, with `APP_ENV=local`, pool maximum 4, the exact authorized data directory, and marker
`synthetic-batch10-only`. Ten in-process Next.js route/service cases use real cookie sessions and
database rows. They cover absent-row listing, concurrent first creation, concurrent same-version
updates, stale/null claims, successful reviewed retry, clock-safe version advancement, missing and
malformed versions, guest/default/delegated authorization, live session revocation, live permission
removal, and email/storage/staff-2FA regression behavior.

The live-authorization tests wrap the real `getAuthContextFromRequest` only in the test module. The
gate pauses after the real snapshot and releases only after the competing revocation or permission
removal commits. Every gated request is released and settled in `finally`; no production hook or
test delay exists in runtime code. The final run passes 10/10 in
`evidence/postgres-integration.log`. Baseline runtime was not exercised; the pre-Batch-13 behavior
is established from the accepted source at `7aee178290ce39d3bd08a5d597bc00a21d7a8dfc`, so no
before-fix runtime claim is made.

## Browser and component evidence

The actual `/admin/settings` page passed two Chromium cases over real network HTTP and PostgreSQL:

- desktop `1440x1000`: hydrated keyboard submission, persisted save, observed post-save server
  metadata refresh, and success feedback that remains visible after that refresh;
- mobile `390x844`: an external database update causes a real `409`, while the draft remains
  visible and disabled; explicit keyboard reload loads the external values, and the reviewed retry
  succeeds;
- a separately labeled browser-injected network abort preserves the draft and creates no audit;
- no page errors or unexpected console errors; only the exact deliberate `409` console entry is
  excluded in the real conflict case.

Screenshots are `evidence/office-profile-success-1440.png` and
`evidence/office-profile-conflict-390.png`. The final log is `evidence/browser.log`. The two port
configuration mistakes and the captured pre-hydration product failure are retained in
`browser-attempt1.log`, `browser-attempt2.log`, and `browser-attempt3.log`.

The component and focused contract suite proves initial-version payloads, returned-version reuse,
draft/message persistence across a server rerender, stale disable/reload behavior, network recovery,
rapid-submit suppression, schema requirements, and existing governance contracts. The combined
focused run passes 34/34 in `evidence/focused-tests.log`.

## Repository verification

- full Vitest suite: 539 passed, 46 opt-in tests skipped — `evidence/full-tests.log`
- typecheck — `evidence/typecheck.log`
- warning-free lint — `evidence/lint.log`
- secret scan — `evidence/secret-scan.log`
- production build — `evidence/build.log`
- page inventory: 58 before and after — `evidence/page-inventory.json`

The unrelated timeout-only full-suite attempt and corrected test-typing attempt are preserved in
`evidence/full-tests-attempt1.log` and `evidence/typecheck-attempt1.log`.

## Cleanup

Before teardown, the guarded database identity and marker matched the authorized lane. Queries
found zero Batch-13 users, sessions, setting-update audits, or office/staff-2FA setting rows. The
disposable database and role were dropped, PostgreSQL stopped, ports `55441` and `3115` have zero
listeners, and the exact cluster directory was removed. The test upload directory was absent.
Evidence is in `evidence/cleanup.log`, `evidence/cleanup-db.log`, and
`evidence/cleanup-final-state.log`; `evidence/cleanup-attempt1.log` retains the corrected initial
camel-case column-name mistake.

## Boundaries

There is no schema, migration, dependency, public route, payment, consultation, installer, role
definition, SMTP activation, staff-2FA activation, or page-count change. No production database,
external provider, push, deployment, or live environment was contacted. The broader UI and motion
redesign remains open in [`docs/KMT_UI_MOTION_TASKS.md`](../../../KMT_UI_MOTION_TASKS.md); this batch
does not mark any of its 52 tasks complete.
