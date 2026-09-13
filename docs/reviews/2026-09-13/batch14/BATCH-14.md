# Batch 14: protected content lifecycle writes

## Result

Existing public or approved content can no longer be rewritten by a creator who lacks the matching approval permission. The protected source states are intentionally narrow: article `PUBLISHED`; case study `APPROVED` or `PUBLISHED`; and social draft `APPROVED`, `SCHEDULED`, or `PUBLISHED`. The existing create permission is still required for PATCH. Existing target-state approval checks remain in force, while creator rework from `REJECTED` and `ARCHIVED` to allowed draft/review states remains available.

Each update transaction now locks the target PostgreSQL row before reading its before snapshot, checking source protection, writing, and reading the response row. This makes the returned row and the best-effort success audit describe the same serialized write. A creator waiting behind an approver's publication sees the committed protected state and receives `403` without a write, audit, or cache revalidation. The existing public cache tags and public status filters remain unchanged.

The three admin forms retain the actual protected status, show a catalog-backed Arabic explanation, and disable every edit control for a non-approver. They use the shared hydration guard and a synchronous submit lock. Create success captures and resets the real form before refresh; rejected responses retain entered values. Duplicate slugs now show catalog-backed Arabic copy rather than exposing the service's English message.

## PostgreSQL evidence

The guarded integration suite ran on PostgreSQL 18 at `127.0.0.1:55441`, database/user `kmt_batch10`, `APP_ENV=local`, pool maximum 4, the exact authorized workspace data directory, and marker `synthetic-batch10-only`.

Seven Batch 14 cases cover every protected source state, guest denial, creator draft-to-review, approver publication, rejected/archived rework for every content type, target-state denial without partial effects, matching-type permission boundaries, a publication race, and two concurrent approver writers. An unrelated approval permission cannot approve an article, and approval alone does not bypass the retained create-permission requirement. The race tests inspect `pg_stat_activity` plus `pg_blocking_pids` and require distinct waiting backend PIDs before releasing their transaction gates. The two-writer case proves each HTTP response and actor-owned audit uses its own locked before snapshot (`DRAFT -> REVIEW`, then `REVIEW -> PUBLISHED`). Five retained service-contract tests also pass. Combined with five component tests, the final focused run is 17/17 in `evidence/focused-tests.log`.

## Browser evidence

One Chromium scenario exercises the actual `/admin/content` page over HTTP and PostgreSQL:

- desktop `1440x1000`: a creator sees the real `PUBLISHED` value, Arabic protection explanation, and disabled article controls;
- creator edit and approver publication persist, and the warmed public article endpoint changes from `404` to `200`;
- an actual duplicate-slug `409` keeps the typed title and slug in the create form;
- successful creation resets the form, remains visible after the resulting server refresh, and remains stored after an explicit full reload;
- mobile `390x844`: an approver publishes the case study, the warmed public endpoint changes from `404` to `200`, and the refreshed result card shows `منشور` plus the approver before capture;
- no page errors or unexpected console errors; only the exact deliberate 409 resource entry is excluded.

The final run passed in 1.4 minutes on a clean development cache. Screenshots are `evidence/protected-article-1440.png` and `evidence/published-study-390.png`; both were visually reviewed at full-page desktop/mobile dimensions. `caret: "initial"` prevents Playwright's screenshot caret styling from racing React hydration. The final log is `evidence/playwright-browser.log`. Earlier wrong-port, ambiguous-label, screenshot-style, and pre-card-refresh attempts are retained under `evidence/playwright-browser-attempt-*.log`; additional non-retained transcripts are identified in `evidence/attempt-notes.md`.

## Repository verification

- full Vitest suite: 544 passed, 53 opt-in tests skipped — `evidence/full-tests.log`
- previously slow provider boundary: 6/6 passed independently — `evidence/provider-boundary-retry.log`
- typecheck — `evidence/typecheck.log`
- warning-free lint — `evidence/lint.log`
- secret scan — `evidence/secret-scan.log`
- production build — `evidence/build.log`
- page inventory: 58 before and after accepted baseline `853b94a367d0b17600460638bfa98d867824ed55` — `evidence/page-inventory.json`

The first production build attempt lacked the required `DATABASE_URL`; it is retained in `evidence/build-attempt-missing-database-url.log`. The final source was rebuilt after database cleanup with the repository's explicit `ALLOW_BUILD_WITHOUT_DATABASE_URL=true` build mode and passed. The related UI/service recheck passed 10/10 in `evidence/post-cleanup-recheck.log`.

## Corrected inventory record and boundaries

The proposed report-count finding is withdrawn. Existing copy and Batch 6 intentionally define the unallocated review count as global across clients, currencies, and dates. No report or payment behavior changed.

There is no schema, migration, dependency, role-policy, API URL, report, payment, booking, provider, or external-social-publication change. No production database, external provider, push, or deployment was contacted. All 52 UI and motion tasks remain open in [`docs/KMT_UI_MOTION_TASKS.md`](../../../KMT_UI_MOTION_TASKS.md).

## Cleanup

Before teardown, the guarded database identity and marker matched the authorized lane, and queries found zero users, roles, sessions, content rows, social drafts, or audits. The disposable database and role were dropped, PostgreSQL stopped, ports `55441` and `3115` had zero listeners, and the verified workspace-only cluster directory was removed. Evidence is in `evidence/cleanup-preflight.log`, `evidence/cleanup-db.log`, `evidence/cleanup-stop.log`, and `evidence/cleanup-final-state.log`.
