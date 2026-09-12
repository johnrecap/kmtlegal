# Batch 9: document case retention and confirmed deletion

## Delivered behavior

- A case-tab upload retains the already-authorized current case even when its old `updatedAt` places it outside the capped 100-case option list. The successful upload remains on the tab through `router.refresh()` without a browser reload.
- General-library upload uses an option actually present in the form. Mismatched owner/case targets and a client's foreign case are rejected before a database row or private file is created.
- `PATCH /api/admin/documents/:id` excludes `DELETED`. Soft deletion remains a confirmed operation at `POST /api/admin/documents/:id/delete`.
- Update and delete writes atomically require `deletedAt: null`. Controlled row-lock races prove update-then-delete succeeds in that order, delete-then-update returns 404 for the losing update, and concurrent double delete returns 200/404. Each successful operation creates one matching audit row.
- Document actions are available at tablet widths. The supporting detail cards now appear from `md`, matching the table breakpoint instead of leaving 768px users with a read-only table and no update/delete controls.

## Acceptance coverage

The final isolated Chromium suite contains five serial scenarios and passed in 1.9 minutes. Its raw output is in `playwright-final.stdout.log`.

1. An intentionally old current case is absent from the first 100 fetched options, appears once as `مرتبطة حاليًا`, uploads with HTTP 201, keeps the correct `caseId`, leaves `ownerClientId` null, and appears after the component's router refresh.
2. The general library uploads against a real visible option. Office owner/case mismatch returns 400 and client foreign-case upload returns 403, with database and private-file counts unchanged.
3. Independent sessions cover office admin, assigned lawyer, other lawyer, owning client, other client, and guest. Admin lists, `CLIENT_VISIBLE` and `STAFF_ONLY` downloads, and valid update/delete requests match the expected 200/403/401 boundaries. A case-linked document with no owner uses the case client fallback, while the soft-deleted case keeps its historical client-visible document available.
4. Row locks coordinate both update/delete orders without timing sleeps. Success payloads, final deleted state, losing 404 responses, and update/delete audit counts are asserted. Double delete creates one delete audit.
5. The delete UI sends no request when required confirmation is absent, permits Space-key confirmation, allows the user to close the action without sending or changing the row, then sends one confirmed POST. The row disappears, private bytes remain, and download returns 404.

## Visual evidence

- `screenshots/case-upload-1440.png`: targeted upload form with the retained case selection and visible success feedback.
- `screenshots/delete-confirmation-390.png`: focused mobile delete form with keyboard-selected confirmation.
- `screenshots/delete-confirmation-768.png`: focused tablet delete form after the breakpoint fix.

All three screenshots were inspected at original resolution. The controls, Arabic RTL text, confirmation state, danger action, and upload feedback are readable. The 1440 artifact is intentionally cropped to the form rather than the full page.

## Verification

- `typecheck.stdout.log`: `tsc --noEmit` passed after the final source and test changes.
- `lint.stdout.log`: Next lint passed with no warnings or errors; only the framework's deprecation notice was printed.
- `vitest-full.stdout.log`: 69 test files passed, one file skipped; 523 tests passed and 22 opt-in tests skipped in 55.73 seconds.
- Supervisor review independently ran five connected test files with 32 passing tests at 23:49 local time. This is separate review evidence and is not added to the 523-test repository count.
- `build.stdout.log`: the guarded production build passed and generated 44 static pages. Webpack printed non-fatal cache snapshot warnings.
- `security-secrets.stdout.log`: no high-confidence secret patterns were found.
- `page-comparison.txt` and the before/after inventories: baseline `e68ac5d` and the final tree both contain 58 `src/app/**/page.tsx` files, with zero additions and zero deletions.
- `cleanup-verification.stdout.log`: the isolated database identity matched `kmt_batch9` on 55440 and the exact workspace data directory; Batch 9 user/client/case/document counts were zero before removal. The final check records both disposable directories absent and ports 3113/55440 closed.

## Failure evidence and redaction

- `failures/attempt-3-tablet-visibility.stdout.log` and its error context preserve the run that exposed the real 768px action gap (four passed, one failed).
- `failures/attempt-4-responsive-card-state.stdout.log` and its error context preserve the next run where the test retained the hidden mobile card after changing breakpoints (four passed, one failed). The test now locates and opens the currently visible card.
- The saved text artifacts were scanned for session cookies, the disposable password, and database URLs; none are present. Playwright trace ZIP files were excluded because binary traces can embed session material that cannot be reliably redacted. Synthetic UUIDs and `example.invalid` fixture identities remain as useful correlation data.

## Environment and cleanup

Acceptance used PostgreSQL 18 at `127.0.0.1:55440`, database/user `kmt_batch9`, a workspace-only data directory, and workspace-only private uploads. All 18 migrations and the seed completed before the suite. The local lane used mock AI, disabled SMTP, and disabled malware scanning. Test coordination used `PRISMA_POOL_MAX=5` only in the disposable test environment so the lock owner, lock observer, and concurrent HTTP requests had independent connections.

The suite removed its synthetic rows and files. A final database query verified zero Batch 9 fixtures, then PostgreSQL was stopped and the exact Batch 9 database and storage directories were removed. No process remains on either test port.

## Boundaries

- No migration, role, permission policy, owner-client policy, historical case visibility policy, or physical byte-deletion policy changed.
- No production database, real client data, external provider, live ClamAV service, push, or deployment was used.
- Production deployment and live environment verification remain separate release gates.
