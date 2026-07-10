# PLAN 34: Audit Remediation And Paymob-First Hardening

Last updated: 2026-07-10

Status: implementation complete locally; DB/provider/VPS deployment evidence remains open.

## Goal

Close the audit findings that affect payment safety, privacy, resilience, release evidence, and the live user experience without enabling paid consultation booking in production.

## Locked Decisions

- Paymob is the default and only activatable provider for new payment attempts in this release.
- PayTabs remains implemented for historical webhook processing and future manual activation, but `PAYTABS_ENABLED=false` keeps it unavailable for new attempts.
- There is no automatic provider failover.
- `consultation.booking` is not changed by this plan; paid booking remains disabled until a separate Paymob sandbox and go-live approval.
- ClamAV scanning is required for production uploads.
- Sentry integration ships disabled until production project credentials are supplied.
- Product-growth opportunities are recorded in the deferred backlog only.

## Delivery Slices

1. Paymob-first configuration, canonical callback origins, provider readiness, and safe provider switching.
2. Expiring minimized payment receipts, provider timeouts, and deterministic error classification.
3. Shared rate limiting, asynchronous password hashing, malware scanning, and privacy-safe error monitoring.
4. Locale-aware metadata, mobile language switching, protected Arabic copy, error recovery, CSP, accessibility, and image performance.
5. Behavior-preserving decomposition of oversized booking and payment modules after characterization coverage exists.
6. Local, database-backed, browser, live-site, deployment, and documentation gates.

## Release Boundary

The code and infrastructure hardening may deploy to `https://kmtlegal.saeeddev.com/`, but the deployment must not switch the production booking mode to `AI_CHAT_PAID` and must not perform a real customer charge.

## Acceptance

- New payment attempts resolve to Paymob; PayTabs cannot be activated while disabled.
- Existing PayTabs webhook records remain verifiable when their historical secret is retained.
- Payment callback and webhook URLs always use canonical `APP_ORIGIN` in production.
- Public receipt links expire and do not expose contact details or legal summaries.
- Production uploads fail closed when ClamAV is unavailable and reject the EICAR test signature.
- Shared throttling works across app processes without storing raw identifiers.
- The full unit, build, browser, database, security, and live-site gates pass before deployment is marked complete.
- Deferred product opportunities remain documentation-only.

## Local Verification

- `npm run db:generate`: passed.
- `npm run db:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no warnings.
- `npm run test`: passed, 35 files and 233 tests.
- `npm run build` with a local placeholder `DATABASE_URL`: passed; the local database was unreachable and DB-backed public content safely fell back during static generation.
- `npm run security:secrets`: passed.
- `npm run security:audit` and `npm run security:audit:all`: passed with zero known vulnerabilities after the controlled `@sentry/nextjs@10.64.0` update.
- Full non-DB smoke: passed, 42 Playwright scenarios. The final focused 390px mobile-language-switch scenario also passed after its last test update.
- Generated HTML contains SHA-256 SRI attributes for Next core assets. Production CSP retains `unsafe-inline` for Next bootstrap compatibility, adds `script-src-attr 'none'`, and scopes Sentry `connect-src` to the configured ingest origin only.

## Remaining Release Gates

- Apply both PLAN-34 migrations on a backed-up production PostgreSQL database and run DB-backed E2E.
- Install/start ClamAV on the VPS and run a controlled EICAR upload verification.
- Complete Paymob sandbox success/failure/signature/replay/expiry/mismatch/mobile-return scenarios.
- Deploy without enabling `AI_CHAT_PAID`, then archive public/admin/mobile/health evidence.
- Keep Sentry disabled until production credentials and privacy verification are approved.
