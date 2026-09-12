# Batch 8: portal appointment scope, office calendar pagination, and task concurrency

- Date: 2026-09-12
- State: local verified; awaiting supervisor review before push
- Database lane: disposable PostgreSQL 18 cluster at `_workspace/batch8-postgres/data`, `127.0.0.1:55439`, database/user `kmt_batch8`
- Browser lane: disposable Next.js dev server at `127.0.0.1:3112`

## Delivered behavior

- Client dashboard and court-date queries now use one ownership scope. They exclude appointments linked to soft-deleted cases while retaining case-less consultations and appointments linked to business-archived cases.
- The office calendar accepts `page`, returns additive `total`, `page`, and `pageSize` metadata, clamps out-of-range pages, and orders equal start times by `startsAt,id` before applying pagination.
- The calendar page reports displayed and total results, labels each day count as the count displayed on the current page, preserves Cairo date/filter query values in page links, and resets to page 1 when filters are submitted.
- Task PATCH requires the rendered `updatedAt` value. The server performs one atomic version-and-current-scope update, advances `updatedAt` monotonically, returns `409` for stale writes, and records a success audit only for the accepted write.
- Task access remains `direct assignee OR assigned lawyer on the linked case`. A direct assignee may retain the task's existing case after the case is reassigned, but cannot move it to another out-of-scope case.
- Task edit forms keep their draft and expected version across unrelated `router.refresh()` calls. A conflict keeps the draft in place and offers an explicit reload of the winning version.
- Current-case options are retained in edit and case-detail create forms when scope filtering or the 100-option cap omits that case. New case selections still pass the existing server authorization check.
- Task create and update controls render disabled until React hydration attaches their handlers. This prevents a slow or unavailable script from turning a task submit into an unintended native GET.
- A task-create success now resets the captured form element and refreshes the case page after the asynchronous POST.

## Connected surface inventory

| Surface | Contract or data path | Evidence |
| --- | --- | --- |
| `/client` | portal dashboard appointment query | English owner and Arabic second-client browser sessions; deleted/archived/case-less isolation |
| `/client/court-dates` | `listPortalAppointments` | before delete, after soft delete, second client, restore, 390/768/1440 distributed screenshots |
| `/client/files` | `listPortalDocuments` | historical client-visible document remains visible after its case is soft-deleted |
| `/client/payments` | portal payment query | historical issued invoice remains visible after its case is soft-deleted |
| `/admin/calendar` | `/api/admin/calendar` | office and lawyer scopes, Cairo query preservation, pagination, filtering, empty state, keyboard navigation |
| `/admin/tasks` | `/api/admin/tasks`, `/api/admin/tasks/[taskId]` | optimistic concurrency, audit count, permission transitions, retained case, script-blocked inert state, 409 recovery |
| `/admin/cases/[caseId]?tab=tasks` | `getCaseTaskDocumentTabs`, task POST/PATCH | current-version edit, keyboard order, retained default case beyond 100 options, successful POST and refreshed same-case record |

No Prisma schema or migration changed. No notification, session, appointment-to-task linkage, booking, pricing, payment, document, or invoice contract was added.

## Browser and database acceptance

`tests/e2e/batch8-office.spec.ts` verifies the exact database name, user, port, and absolute data directory before creating or cleaning synthetic records. Every actor is a disposable authenticated user with a numeric phone where applicable. Fixture cleanup is marker-based and also works when setup stops before returning a complete fixture object.

The stable-source full run passed **9/9** in 3.4 minutes. It covers:

1. English and Arabic client ownership, dashboard and appointment pages, soft delete, archived case, case-less consultation, second client, historical document/invoice, and restore.
2. 105 same-time calendar appointments across 50/50/5 pages with no gaps or duplicates, deterministic repeat ordering, and out-of-range page clamping.
3. Calendar mode/date filters, a real empty result, and office-versus-assigned-lawyer scope.
4. Simultaneous task PATCH requests producing exactly one `200` and one `409`, monotonic version output, missing/invalid version `400`, unchanged rejected state, and no rejected-write success audit.
5. Direct-assignee and case-lawyer permission branches, reassignment loss, another hidden-case rejection, and a title-only browser PATCH that preserves the existing case.
6. A current case omitted by the 100-option cap remaining selected during task edit.
7. Script-blocked task forms remaining inert on both task-list and case-detail placements.
8. Draft/version preservation through another task refresh, localized `409`, no rejected audit, explicit latest-version reload, and recovered state.
9. Case-detail task edit current version and keyboard order at 390 px.

After the last connected create-form correction, a focused browser run passed **1/1** in 23.3 seconds. It proves the case-detail form retains the current case beyond the 100-option cap, sends a real `POST /api/admin/tasks` with `201`, stores the current `caseId`, refreshes the page with the new task in the same case, and removes the created task during teardown.

Primary logs:

- `playwright-final.log` — stable-source 9/9 run.
- `playwright-case-create-final.log` — final connected create-form 1/1 run.
- `failures/` — retained earlier selector, responsive-duplicate, combined-timeout, and trace evidence. These runs drove locator scoping, retained-option, hydration, and async-form fixes; they are not recorded as passing product evidence.

## Visual evidence

| Artifact | What it demonstrates |
| --- | --- |
| `screenshots/client-390.png` | English client court-date page at 390 px |
| `screenshots/client-768.png` | English client court-date page at 768 px |
| `screenshots/client-1440.png` | English client court-date page at 1440 px |
| `screenshots/client-ar-390.png` | Arabic/RTL second-client portal at 390 px |
| `screenshots/calendar-768.png` | Arabic/RTL calendar pagination and filter state at 768 px |
| `screenshots/task-recovery-1440.png` | task form after explicit latest-version reload at 1440 px; the screenshot is the recovered state, not the transient `409` message |
| `screenshots/case-task-390.png` | case task edit form and keyboard-accessible controls at 390 px |
| `screenshots/case-create-cap-390.png` | case-detail create form retaining the capped current case and showing successful creation at 390 px |

The viewport coverage is distributed by scenario; it does not claim that every scenario ran at every width. Visual review found the task status board narrow at 1440 px when synthetic UUID-heavy titles are used. That layout improvement belongs to the later UI phase and is not expanded into this backend/concurrency batch.

## Repository verification

- `npm run typecheck` — passed.
- `npm run lint` — passed with no warnings or errors; Next.js printed its existing `next lint` deprecation notice.
- `npm run test` — passed: 69 files passed, 1 skipped; 522 tests passed, 22 skipped. A parallel resource-contention run first timed out one unrelated 5-second PostgreSQL tool-resolution case; that file passed 6/6 alone and the complete suite then passed sequentially.
- `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build` — passed; 44 static pages generated. Webpack emitted non-fatal cache snapshot warnings already visible in the build output.
- `npm run security:secrets` — passed with no high-confidence secret patterns found in the final source and evidence tree.
- `git diff --check` — passed.

## Scope and remaining release gates

- Office/admin UI evidence is Arabic/RTL because the current administration surface is Arabic-only. Client evidence covers the supported English/LTR and Arabic/RTL locales.
- Documents and invoices were not filtered with deleted cases. The browser lane explicitly verifies that historical client-visible documents and issued invoices remain available after their linked case is soft-deleted.
- This batch does not close production deployment, provider sandbox, live aaPanel, backup/restore, malware scanner, or whole-project authorization gates.

## Cleanup record

- Before shutdown, the verified identity was `kmt_batch8|kmt_batch8|55439|.../_workspace/batch8-postgres/data` and the synthetic client/user/task/case counts were `0|0|0|0`.
- The Next.js server on `3112` and PostgreSQL cluster on `55439` were stopped, and both ports were confirmed closed.
- `_workspace/batch8-postgres`, including its disposable password and database files, and the Batch 8 trace-inspection scratch directories were removed after their required evidence had been copied under this review directory.
