# quality-gates.md

## Gate 0: Product Ready
Pass only if:
- Requirements are clear.
- Personas are clear.
- User journeys are clear.
- MVP and deferred scope are clear.
- Risks are listed.
- Acceptance criteria exist.
- AI is constrained to the server-side AI Provider Gateway, review-required outputs, and no legal advice.
- VPS-class hosting, private filesystem uploads, disabled/deferred SMTP, deferred staff TOTP 2FA, no-code installer, panel-aware setup modes, and invoice-basics decisions are locked.
- Legal disclaimers and no-outcome-promises are documented.

## Gate 1: UX Ready
Pass only if:
- Sitemap exists.
- Public, portal, admin, auth, and error routes exist.
- Critical flows exist: booking, conversion, client portal, upload, staff password login, installer bootstrap, case study approval, role governance.
- Loading, empty, error, success, validation, disabled, no-permission states exist.
- Arabic RTL and English-ready LTR are planned.
- Mobile, tablet, and desktop behavior is defined.

## Gate 2: Frontend Ready
Pass only if:
- Design system is defined with semantic tokens.
- Component inventory exists.
- Route/page inventory exists.
- Forms, tables, dialogs, dashboards, upload, and permission states are planned.
- Accessibility requirements are listed.
- No hardcoded repeated design decisions are required.
- Stitch clone remains isolated from product UI.
- Stitch clone has Harness evidence: source inventory, screenshot capture, visual diff report, targeted fix log, and final acceptance per screen.

## Gate 3: Backend Ready
Pass only if:
- Data model exists.
- API/server action plan exists.
- Auth/session plan exists.
- Staff 2FA deferral is documented; `STAFF_2FA_MODE=disabled` is the supported release mode.
- Permission matrix and object ownership rules exist.
- Service/repository boundaries exist.
- Validation and error handling exist.
- Audit logging plan exists.
- Disabled SMTP/template abstraction and background job extension points exist.
- AI Gateway provider contract exists and is model/provider-agnostic.

## Gate 4: Security Ready
Pass only if:
- Threat model exists.
- Authz checks are server-side.
- Client/lawyer/admin object-scope rules are tested.
- Upload validation is planned for PDF/DOC/DOCX/JPG/JPEG/PNG up to 5MB.
- Private VPS filesystem storage is planned outside public webroot and direct Nginx serving.
- Staff TOTP 2FA is deferred; TOTP and Email OTP routes are disabled placeholders.
- Installer setup token, first Super Admin bootstrap, and installer lock behavior are planned.
- AI Gateway no-raw-prompt/provider-response logging is planned.
- Secrets are server-only and env vars documented.
- CSRF strategy exists for cookie-auth mutations.
- XSS/content safety rules exist.
- Audit logs are planned.
- Security tests are listed.
- No PII telemetry rule exists.

## Gate 5: QA Ready
Pass only if:
- Unit tests are planned.
- Component tests are planned.
- Integration tests are planned.
- Contract tests are planned.
- E2E tests are planned.
- Visual regression checks are planned.
- Accessibility tests are planned.
- Security tests are planned.
- Smoke tests are planned.
- VPS/panel storage, disabled SMTP behavior, disabled TOTP routes, installer bootstrap, hosting preflight, AI Gateway, and invoice basics tests are planned.

## Gate 6: Release Ready
Pass only if:
- CI/CD plan exists.
- Environment variables are documented by name only.
- Hosting plan exists.
- Hosting target is VPS-class. Terminal VPS, aaPanel, and cPanel setup modes are documented with compatibility preflight and unsupported-hosting rejection.
- Migration plan exists.
- Monitoring/logging/alerting exist.
- PostgreSQL and uploads directory backups and restore are planned.
- Rollback strategy exists.
- Quickstart exists.
- Known deferred items are documented.
- `qa:local`, `qa:db`, `qa:release`, `security:secrets`, and `security:audit` have current recorded results.
- PostgreSQL migrate + seed + seed has run against a real DB, not only schema validation.
- DB-backed E2E covers staff password login and client portal login at minimum.
- `/stitch-clone/*` is disabled in production unless explicitly enabled for visual QA.

## Gate 6A: PLAN-26 Panel Installer Ready
Pass only if:
- User must choose `terminal-vps`, `aapanel`, or `cpanel` before setup commands run.
- Terminal VPS mode keeps the root/sudo installer path.
- aaPanel/cPanel modes do not run `apt-get`, `systemctl`, `certbot`, or direct `/etc/nginx` mutations.
- cPanel mode rejects missing Node.js App, PostgreSQL, SSH/command runner, env vars, persistent process, or private non-`public_html` uploads.
- All modes keep SMTP disabled, TOTP disabled, `/install` token-protected, and installer lock required after first Super Admin bootstrap.

## Gate 6B: PLAN-27 Live Site QA Remediation Ready
Pass only if:
- The live QA evidence from `https://kmtlegal.saeeddev.com/` is archived and mapped to remediation tasks.
- Homepage featured article/case-study cards use the same published-content source as `/articles`, `/articles/[slug]`, `/case-studies`, and `/case-studies/[slug]`, or render an empty-safe state with no broken links.
- A public link-crawl smoke proves rendered internal links from the homepage, public navigation, footer, services, team, articles, and case studies return status `< 400`.
- Anonymous `/admin` and `/portal` redirects to `/login?next=...` do not produce `ChunkLoadError`.
- Release smoke proves requested `_next/static` JS/CSS assets return status `< 400` with the expected MIME type.
- Cloudflare Insights is either disabled at the hosting layer or explicitly allowed through a reviewed minimal CSP rule; no blocked beacon console error remains.
- `/favicon.ico` returns a successful static response.
- `/login` in production contains no local seed, demo, or PostgreSQL setup guidance.
- Login required-field and bad-credential messages are visible, accessible, Arabic, and security-generic.
- Booking success output contains a reference and safe next steps only; no internal AI/mock placeholder text or raw enum labels render publicly.
- Contact success cannot be accidentally submitted again without a deliberate reset/new-message action.
- Authenticated admin routes `/admin`, `/admin/consultations`, `/admin/cases`, `/admin/reports`, `/admin/audit-log`, and `/admin/settings` load after login without `ChunkLoadError`, `Application error`, or `_next/static` JS/CSS status/MIME failures.
- Admin shell/settings copy is Arabic and does not render `Management`, `Admin`, or `Staff 2FA is deferred`; staff 2FA remains disabled/deferred.
- Admin consultation review does not render legacy English mock AI placeholders or raw AI JSON to staff.
- `/admin`, `/admin/clients`, and `/admin/content` have no page-level horizontal scroll at 390px; tables may scroll internally only.
- Mobile smoke passes for `/`, `/services`, `/contact`, and `/book-consultation`.
- PLAN-27 staging/live screenshots, console logs, and network evidence are archived before any production-ready claim.

## Gate 6C: PLAN-28 Public Luxury Redesign Ready
Pass only if:
- PLAN-28 is tracked in `specs/kmt-legal-platform/public-luxury-redesign-plan.md` and `tasks.md`.
- The redesign is scoped to public routes and public-site components only.
- `/admin`, `/portal`, `/product-system`, shared `src/components/ui/*` defaults, and `/stitch-clone/*` do not inherit PLAN-28 styling through global mutations.
- Public labels are Arabic-first; `/services` may remain the route while the public label uses `مجالات الخبرة`.
- No visible `EN` toggle is shown until complete English localization exists.
- Public header, footer, hero, section, CTA, listing, booking, and contact surfaces follow one dark luxury legal visual language.
- Public practice-area content covers corporate, litigation, arbitration, real estate, tax advisory, criminal defense, labor law, commercial contracts, foreign investment, and debt recovery, or any omitted item is explicitly deferred with reason.
- All public route metadata, headings, CTAs, filters, empty states, form labels, errors, success states, and image alt text are reviewed as user-facing text.
- Public copy does not promise legal outcomes and does not expose client-identifying details.
- Booking and contact flows preserve existing API contracts, analytics events, validation, requestId, loading, disabled, error, and success behavior.
- Public internal link crawl proves rendered links from homepage, nav, footer, services, team, articles, case studies, contact, booking, privacy, and terms return status `< 400`.
- Desktop `1440x900` and mobile `390x844` screenshots are archived for `/`, `/services`, `/contact`, and `/book-consultation`.
- Mobile public pages have no page-level horizontal overflow at `390px`.
- Keyboard focus, contrast, RTL icon direction, touch targets, and reduced-motion behavior are checked on dark surfaces.
- `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and relevant Playwright smoke pass or blocked checks are documented before PLAN-28 is marked done.

## Gate 7: Legal Data Protection Ready
Pass only if:
- Internal notes cannot be exposed to clients.
- Anonymous case studies require anonymization and approval.
- Document downloads require authorization.
- AI output cannot be presented as final legal advice.
- AI raw prompts, legal summaries, document contents, API keys, and provider raw responses are never logged.
- Staff 2FA is not enforced in PLAN-25; production readiness fails if TOTP is enabled.
- Logs and analytics exclude legal sensitive content.
- Audit log covers sensitive admin/staff mutations.

## Gate 8: Spec Kit Execution Ready
Pass only if:
- `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/openapi-plan.md`, `frontend-plan.md`, `backend-plan.md`, `security-plan.md`, `test-plan.md`, `devops-plan.md`, `quickstart.md`, `tasks.md`, `quality-gates.md`, and `missing-items-review.md` exist.
- Tasks are dependency ordered.
- Parallel-safe tasks are marked `[P]`.
- Each major task maps to a requirement or risk.
- Production code has not been written during planning.

## Gate 9: PLAN-24 Remediation Ready
Pass only if:
- Each remediation task maps to a finding or release gate.
- PLAN-04 remains partial until DB migration/seed/idempotency and seeded document backing-file checks pass.
- PLAN-23 remains release-blocked until E2E, dependency audit, secret scan, and VPS smoke pass.
- Production Prisma config has no dev `DATABASE_URL` fallback.
- Production seed cannot create demo users or require demo credentials.
- Staff 2FA attempt lockout is dormant until the future Staff 2FA Rework; active routes return `FEATURE_DISABLED`.
- `INSTALLER_ENABLED=false` is required after first setup before release-ready status.
- Uploads reject oversized `Content-Length` before multipart parsing and still validate MIME/magic bytes.
- Route manifest tests keep `contracts/openapi-plan.md` aligned with implemented route families.
