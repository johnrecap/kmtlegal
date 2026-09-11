# Batch 1: dependency, session and booking recovery review

Date: 2026-09-11. Baseline: `ff6d9c6a21547e2b29cfb154c8a81a61ab4157cd`.
Branch: `codex/kmt-batch1-hardening`.
Workspace: `C:/Users/SOUQ/.codex/worktrees/a701/kmt legal office`.
Status: local verification complete; submitted for supervisor review. No push authorized before acceptance.

## Scope and provenance

Reviewed and imported only the prior `package.json`, `package-lock.json`, session cookie fix,
`auth-core.test.ts`, booking chat recovery changes and `booking-recovery.spec.ts` from
`D:/kmt legal/kmt legal office`. That source checkout was read only. Its Git metadata was not
accessible through `git -C` in this sandbox, so file-to-file diffs against this clean baseline
were used. Prior `.playwright-mcp` work was not touched. Prior review inventory was inspected;
old preview/screenshots were not imported or treated as an approved design.

This is a bounded first batch, not a completed whole-project security or visual audit.
No pages, policies, prices, permissions or historical Spec Kit artifacts were changed.

## Changes and connected effects

| Surface | Evidence and behavior | Reach and boundary |
|---|---|---|
| Session cookie parsing | `src/server/auth/session-store.ts`: malformed percent encoding returns null | Request auth callers, including `/api/auth/me`, reject authentication instead of throwing before the route can return 401. Valid decoding is preserved. |
| Stale booking slot | `src/features/public-site/consultation-booking-chat.tsx`: selected slot follows normalized server draft | `/api/public/consultations/assistant` can explicitly clear a rejected slot; the next message does not resend it. |
| Payment restoration | Same component; DTO checked against `paymentAttemptDto` in `src/server/payments/payment-service.ts` | HTTP failure, invalid JSON/shape and missing eligible draft show existing localized error plus contact link. Effect cancellation is silent. Verified FAILED/EXPIRED/CANCELLED attempts can restore; other statuses or unverified access legitimately withhold drafts. |
| Checkout handoff | Same component: require `paymentAttempt.checkoutUrl` before success message | Missing handoff URL leaves payment action available and reports a recoverable error. Existing checkout endpoint/pricing remain authoritative. |
| Dependencies | `package.json`, lockfile | Next/ESLint config 15.5.25, Nodemailer 9.1.1, PostCSS 8.5.28; compatible prior lock updates retained. Narrow Prisma mysql2 override 3.24.4 removes the remaining advisories. |

Message system checked: `src/content/public-content.ts`, `.ar.ts`, `.en.ts`.
Reused `bookingChat.fallbackError` and `whatsappFallbackLabel` ("Contact the office") for
localized `/contact` or `/ar/contact`. No parallel translation system or new display strings.

## Prisma verification

The inherited lock resolved CLI 7.10.0 while installed `@prisma/client` was 7.8.0; generation
reported 7.10.0. Passing audit alone was not accepted as compatibility evidence. Client and
PostgreSQL adapter were upgraded to 7.10.0 so all three installed packages now match.
`npm ls prisma @prisma/client @prisma/adapter-pg --depth=0`, generation and schema validation
confirm 7.10.0. The runtime is PostgreSQL via `@prisma/adapter-pg`; source search found no
application `mysql2` imports. mysql2 remains a CLI dependency, pinned by Prisma upstream and
overridden narrowly here. No MySQL connection, Prisma Studio database session or migration was run.

Security references: [mysql2 advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3),
[mysql2 3.24.4 release](https://github.com/sidorares/node-mysql2/releases/tag/v3.24.4).
Both original advisories were returned by npm audit; no forced audit fix or Prisma downgrade used.

## Inventory and preservation

Run `node scripts/review-surface-inventory.mjs` to regenerate source inventory.
The saved `surface-before.json` is the baseline snapshot; `surface-inventory.json` is after
this patch; `surface-comparison.json` compares file, route, link-expression and content-slug sets.
The generator's optional `--baseline` reads the current HEAD, so do not overwrite the historical
before snapshot after committing without intentionally choosing a new comparison baseline.

Before and after: 58 page files, 100 API route files, 119 HTTP operations, 363 TypeScript/TSX
source files. No source files, routes, captured link expressions or content slugs were removed.
One localized contact action expression was added. Inventory includes source locations for
imports, link expressions, controls, event handlers, selected API/auth calls and content slugs.
It captures 24 concrete source-content URLs, 511 control occurrences and 199 event/action
attributes. These are source occurrences, not counts of unique rendered controls or tested journeys.

`/ar/[[...path]]` expands to home, eight section pages and four detail patterns through
`renderPublicPath`. Dedicated Arabic booking and account setup routes are separate.
The generator's Arabic pattern list is currently manual and is not part of its set comparison.
It was checked against the source for this batch only; deriving it from routing source or adding
a behavior-based route comparison is required before the visual rollout. This is not yet an
automated guard against deleting a catch-all Arabic page.
`[slug]`, `[caseId]` and similar values are patterns, not actual live records. Literal source
content slugs and their collection-derived concrete URLs are stored separately from patterns.
These source-content URLs have not been verified against a live content database. Database-published articles/case studies,
client IDs and case IDs were not enumerated. JSX expressions are discovery evidence, not proof
that every runtime link resolves or that every action is authorized.

## Security/booking evidence map for the next batch

| Area inspected | Existing enforcement seen | Remaining verification |
|---|---|---|
| Sessions and role policy | Active user/role, expiration/revocation, persisted permissions in session-store and policy | Real login/logout/revocation and role downgrade with disposable seeded database |
| Client isolation | `ownClientWhere`, `ownCaseWhere`, `clientVisibleDocumentWhere` in client-portal-service | Two-client API/browser negative tests backed by PostgreSQL |
| Documents | Upload permission/target checks, malware gate, `canReadDocument` ownership/visibility/assignment | Real private-file download denial, ClamAV availability, storage behavior |
| Appointment conflicts | Interval overlap, active statuses, serializable transactions and bounded create retry in appointment-conflict-service | Concurrent real booking, office timezone/DST, rescheduling and payment races |
| Backup tooling | Existing PostgreSQL tool resolver and deterministic tests | Actual backup, restore drill, permissions and deployment on disposable/server environment |

These are source and local test observations; they do not close the complete access/security audit.

## Verification

Node 24.11.1, npm 11.6.2, Windows local worktree.

- Clean `npm ci --ignore-scripts` passed; Prisma generation was run explicitly afterward.
- `npm audit --audit-level=moderate`: zero vulnerabilities after targeted update and Prisma alignment.
- `npm ci --ignore-scripts --dry-run --offline`: final manifest/lock consistency passed.
- Prisma generate and validate passed with matching installed 7.10.0 packages.
- `npm test`: 62 files, 444 tests passed after Prisma alignment; unit/contract/source/mocked evidence.
- Typecheck and lint passed. Guarded production build passed after Prisma alignment and restore changes
  (`ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build`; set the variable using the host shell).
- Final browser run: 31 passed, zero failures/skips/flaky tests, with an explicit reduced-motion
  assertion and error screenshots. Saved summary: `browser-results.json`; raw local reporter
  output: `.playwright/batch1-results.json` (ignored).
- `npm run security:secrets` and `git diff --check` passed.
- Browser suite uses actual Chromium and Next routes, with assistant/checkout/status responses
  intercepted for recovery scenarios. Cookie test calls the actual auth route without mocking.
  Matrix: Arabic/English, 390/768/1440px, reduced-motion context; extra restore-contract cases
  at 390px in both languages. Does not exercise the LLM, payment provider or actual slot reservation.

The initial development server and build overlapped and interfered with `.next`; that browser
attempt was stopped, excluded and repeated sequentially. Typecheck caught an invalid Playwright
reduced-motion fixture option; corrected to `contextOptions.reducedMotion` before final checks.
Build tooling emitted non-fatal webpack cache/deprecation notices; no suppression was added.

Mobile screenshots inspected: `screenshots/resume-error-ar.png` and `screenshots/resume-error-en.png`
(390px, local Chromium, HTTP 500 fixture). The localized error and contact button are readable
inside the existing chat in both languages. Existing English mobile header utility/wordmark
crowding and truncated assistant heading remain a P2 visual follow-up for the design checkpoint.
This focused error-state inspection is not a whole-page accessibility or design sign-off.

## Open gates and next step

- No supplied DATABASE_URL: database-backed integration, concurrent booking, migration, seed,
  cross-client live isolation and backup/restore remain unverified.
- No payment sandbox or provider credentials: paid/free operational payment lifecycle,
  webhook reconciliation and receipt validation remain unverified here.
- Authenticated admin/client browser QA, light/dark persistence, keyboard/accessibility audit,
  full-screen visual coverage, physical devices and visual redesign are later gates, not completed by this batch.
- Continue with focused authorization/document/backup and real appointment lifecycle review;
  use disposable infrastructure. Retain the requested design checkpoint before visual rollout.
- Supervisor reviews this local diff/commit before any push. No deployment performed.
