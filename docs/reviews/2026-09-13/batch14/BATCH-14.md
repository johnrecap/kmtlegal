# Batch 14 — protected content lifecycle writes

## Result

Content creators still need their existing per-type create permission to PATCH an article, case study, or social draft. A creator without the matching approval permission can now edit only a row whose state is not protected at the instant of the database write. The protected existing states are deliberately narrow: article `PUBLISHED`; case study `APPROVED`/`PUBLISHED`; and social draft `APPROVED`/`SCHEDULED`/`PUBLISHED`. Rejected and archived records remain available for creator rework.

The write predicate is conditional in PostgreSQL (`updateMany` with the protected-state exclusion), so a creator cannot overwrite an approver's intervening publication between an earlier read and the write. A no-row protected result returns `403`; a non-protected concurrent disappearance/change returns `409`. Neither path writes the success audit or revalidates public cache. Current target-state approval checks, public filters, validation, URLs, and external-social boundary remain unchanged.

The content forms retain the actual protected status as an option, show catalog-sourced Arabic explanation, and disable editing/saving for a non-approver. Draft/review forms remain editable. The existing response path preserves entered values on a `409` because it does not reset or refresh after a non-success response.

## Corrected inventory record

The Batch 14 inventory's proposed report-count P2 is withdrawn. `paymentReviewCopy` explicitly labels the unallocated review count as global across clients, currencies, and dates, and Batch 6 intentionally records the same behaviour. This batch does not alter reports, payments, or that copy.

## Evidence

- Baseline PostgreSQL HTTP regression on accepted commit `853b94a367d0b17600460638bfa98d867824ed55` failed as expected: a creator could change a case study and social draft from protected states (`200`, where protection expected `403`). The article fixture first returned `400` because its content was below the existing schema minimum; it was corrected before the product patch. No baseline success claim is made.
- Final focused run: `tests/integration/batch14-content-lifecycle-postgres.test.ts` plus `tests/server/admin-content-social.test.ts` — 7 passed. It uses real cookie sessions and the PATCH handlers against the isolated database; it proves guest `401`, protected-source `403`, unchanged stored status/approval markers, no creator success audit, creator draft/review success, and approver publication success.
- `npm run typecheck`, `npm run lint`, and `npm run security:secrets` passed. `npm run build` was started after a successful Prisma generate; the captured command output did not reach a final completion line and is therefore not recorded as passed.
- Full `npm run test` is not green: unrelated `tests/server/batch5-provider-boundaries.test.ts` exceeded its configured slow-provider timeout. Focused Batch 14 checks passed.

No controlled database gate that pauses immediately before the conditional write, browser fixture flow at 390/1440, or warmed public-cache browser proof was completed in this execution; these required checks remain unverified. No production database, external provider, push, or deployment was contacted.

## Disposable cleanup

The database identity, loopback port, exact workspace data directory, and marker were verified before fixtures. After tests, the test cleanup left one synthetic case-study row because its successful creator rework cleared `approvedById`, outside the initial cleanup predicate. It was contained in the disposable database, which was then dropped with the disposable role; PostgreSQL was stopped, port `55441` was closed, and the verified workspace-only cluster directory was removed. This retained-residue cleanup gap is documented here rather than represented as zero residue.

## Scope and follow-up

No schema, migration, role definition, API URL, payment/report/booking/AI-provider behaviour, or external social publication was changed. The 52 unchecked tasks in [`docs/KMT_UI_MOTION_TASKS.md`](../../../KMT_UI_MOTION_TASKS.md) remain open.
