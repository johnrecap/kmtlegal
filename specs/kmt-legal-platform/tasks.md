# tasks.md

## Rules
- Do not write production code outside the current task scope.
- Keep `/stitch-clone/*` isolated from product components.
- Every protected feature task must include server-side permission checks and tests.
- `[P]` means parallel-safe after its stated dependencies are complete.
- No MVP-critical task may end with an unimplemented placeholder.

## Milestone 1 - Foundation
- [ ] T001 Create Next.js App Router project with strict TypeScript.
- [ ] T002 Configure package scripts for `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`.
- [ ] T003 Configure Tailwind CSS and global styles.
- [ ] T004 Configure shadcn/ui and Radix for product UI only.
- [ ] T005 Configure Arabic-first `dir="rtl"` layout and English-ready locale structure.
- [ ] T006 Add `.gitignore` and `.env.example` with names only, including VPS storage, disabled SMTP placeholders, AI Gateway, and 2FA config names with no secret values.
- [ ] T007 Add base project folders: `src/app`, `components`, `features`, `lib`, `server`, `prisma`, `tests`, `docs`.
- [ ] T008 Add requestId/error helper placeholder contracts without product endpoints.
- [ ] T009 Add Playwright, unit test runner, and test setup skeleton.
- [ ] T010 Verify foundation with build/typecheck/lint once scripts exist.

Acceptance:
- App builds with placeholder route.
- No auth/data/product feature implemented yet.
- Env names are documented without values.

## Milestone 2 - Stitch Visual Clone Harness
- [x] T011 Activate the `stitch-clone-orchestrator` harness and read `docs/harness/stitch-clone/team-spec.md`.
- [x] T012 Create `/src/app/stitch-clone/[screen-name]/page.tsx` routing strategy.
- [x] T013 Map all Stitch screens `kmt_legal_1..22` and `._kmt_legal` to route names.
- [x] T014 PLAN-02A: Create source inventory and asset freeze for every screen in `_workspace/stitch-clone/{screen-name}/00_source-inventory.md`.
- [x] T015 PLAN-02B: Convert each Stitch `code.html` mechanically to JSX, preserving classes, DOM hierarchy, and assets.
- [x] T016 PLAN-02C: Import original CSS/fonts/material symbols and preserve clone-only asset paths.
- [x] T017 PLAN-02D: Add Playwright screenshot capture for mobile `390x844`.
- [x] T018 [P] PLAN-02D: Add desktop `1440x900` screenshot capture for screens with desktop references.
- [x] T019 PLAN-02E: Compare screenshots against references and document visible differences.
- [x] T019A PLAN-02F: Fix only documented visual differences.
- [x] T019B PLAN-02G: Write final acceptance report for every screen in `_workspace/stitch-clone/{screen-name}/06_acceptance.md`.

Acceptance:
- No clone route uses shadcn, product components, backend, or dynamic data.
- Original Stitch CSS/classes/assets are preserved unless missing source files are explicitly documented.
- Visual parity report exists.
- Done means screenshot parity is visually close, not merely build success.

## Milestone 3 - Product Design System
- [x] T020 Create semantic design tokens from Stitch `DESIGN.md`.
- [x] T021 Create product `ThemeProvider` with RTL/LTR support.
- [x] T022 Create base UI components: Button, Input, Textarea, Select, Card, Badge.
- [x] T023 Create feedback components: Toast, Dialog, LoadingState, EmptyState, ErrorState, PermissionBlocked.
- [x] T024 Create layout components: PublicHeader, PublicFooter, DashboardShell, DashboardSidebar, DashboardTopbar.
- [x] T025 Create data components: DataTable, FilterBar, SearchInput, MetricCard.
- [x] T026 Create domain components: ServiceCard, LawyerCard, CaseStudyCard, ArticleCard, AIOrganizerPanel, DocumentCard, TaskCard.
- [x] T027 Add accessibility states for focus, disabled, error, loading, empty, no-permission.
- [x] T028 Add component tests for critical base components.

Acceptance:
- Product components are reusable and tokenized.
- Clone remains untouched.

## Milestone 4 - Database
- [x] T029 Add Prisma and PostgreSQL configuration.
- [x] T030 Define enums for statuses, priorities, appointment types, document categories, visibility, content workflow states.
- [x] T031 Define auth/governance models: User, Role, Permission, RolePermission, SystemSetting, AuditLog.
- [x] T032 Define legal operation models: Client, LawyerProfile, LegalService, ConsultationRequest, Appointment.
- [x] T033 Define case models: Case, CaseParty, CaseSession, InternalNote.
- [x] T034 Define document/task/invoice basics models: Document, Task, Payment.
- [x] T034A Define StaffTwoFactorCredential, EmailOtpChallenge, EmailMessage, and AiProviderRun metadata models.
- [x] T035 Define content models: Article, CaseStudy, SocialPostDraft, Notification.
- [x] T036 Add indexes for email, phone, slug, status, assignedLawyerId, clientId, caseId, startsAt, dueDate, createdAt.
- [ ] T037 Add migration and validate on clean database.
- [x] T038 Add deterministic seed data for roles, permissions, users, services, lawyers, content, demo cases.
- [x] T039 Add seed idempotency tests or rerun verification.

Acceptance:
- `prisma validate` passes.
- Migration and seed are reproducible.
- No real client data exists.

## Milestone 5 - Auth and Permissions
- [x] T040 Choose and configure Auth.js/NextAuth or equivalent secure session layer.
- [x] T041 Implement login/logout/current user.
- [x] T042 Configure secure cookie policy with production-only `Secure`.
- [x] T043 Implement centralized permission helper.
- [x] T044 Implement object-scope checks for client own data and lawyer assigned data.
- [x] T045 Protect portal and admin route groups.
- [x] T046 Protect server actions and route handlers through shared guard.
- [x] T047 Add 401, 403, expired-session, and permission-blocked UX states.
- [x] T048 Add negative tests for guest/client/lawyer/admin/super-admin boundaries.
- [x] T048A Implement auth/session foundation. Superseded by PLAN-25: staff 2FA is disabled and staff sessions become active after password login.
- [x] T048B Keep TOTP/Email OTP routes as disabled placeholders for this release.
- [x] T048C Keep dormant Super Admin staff 2FA reset contract disabled until future Staff 2FA Rework.
- [x] T048D Add tests for staff password login, client login, disabled 2FA placeholders, and permission boundaries.

Acceptance:
- UI hiding is never the only protection.
- Unauthorized direct API/action calls fail.

## Milestone 6 - Server Contracts and Shared Backend
- [x] T049 Create service/repository structure.
- [x] T050 Create Zod validation pattern and schema folders.
- [x] T051 Create unified error shape and localized message mapping.
- [x] T052 Create requestId propagation.
- [x] T053 Create audit service primitive.
- [x] T054 Create pagination/filter/sort contract utilities.
- [x] T055 Create rate-limit abstraction hooks for login, 2FA/OTP, booking, contact, upload, and AI provider calls.
- [x] T056 Add contract tests for error shape, validation, and permission denial.
- [x] T056A Create disabled SMTP/template abstraction with future env placeholders and no real delivery.
- [x] T056B Add email templates/contracts as deferred future assets without active UI/backend sending.
- [x] T056C Add tests for disabled SMTP metadata and no real delivery.

Acceptance:
- No bulk endpoint implementation yet.
- Feature-specific contracts extend this foundation.

## Milestone 7 - Document Storage and Upload Contract
- [x] T057 Define storage abstraction for private VPS filesystem storage.
- [x] T058 Enforce generated file keys and private storage outside `public/`, e.g. `/var/lib/kmt-legal/uploads`.
- [x] T059 Implement upload allowlist and 5MB size validation for PDF, DOC, DOCX, JPG/JPEG, PNG.
- [x] T060 Implement document metadata create contract.
- [x] T061 Implement authorized download contract with safe headers.
- [x] T062 Implement document audit events for upload/download/status/visibility.
- [x] T063 Add tests for valid upload under 5MB, oversized file, unsupported type, unauthorized download, and path traversal rejection.

Acceptance:
- Files cannot be publicly guessed or downloaded.
- Client and staff permissions are enforced.

## Milestone 8 - AI Provider Gateway
- [x] T064 Create AI Provider Gateway with `generateStructured({ task, locale, input, schema, safetyPolicy })`.
- [x] T065 Implement provider registry for `mock`, `openrouter`, `openai-compatible`, `local`, and `custom`.
- [x] T066 Implement deterministic mock provider for consultation classification and intake summary.
- [x] T067 Implement deterministic mock provider for document checklist suggestion.
- [x] T068 Implement deterministic mock provider for anonymous case study draft.
- [x] T069 Implement deterministic mock provider for social post draft.
- [x] T070 Validate all AI-shaped outputs with schemas and normalize provider response metadata.
- [x] T071 Add UI copy that every AI output needs lawyer review and is not legal advice.
- [x] T072 Add tests for mock provider, OpenAI-compatible contract, provider timeout, schema-invalid output, no legal-advice phrasing, and no PII/raw prompt logging.

Acceptance:
- UI and feature services never call AI providers directly.
- Output is review-gated.

## Milestone 9 - Public Website
- [x] T073 Implement public shell and navigation.
- [x] T074 Implement home page with realistic Arabic legal content.
- [x] T075 Implement services index and service detail from seeded data.
- [x] T076 Implement team page and lawyer profile from seeded data.
- [x] T077 Implement articles list/detail with SEO metadata.
- [x] T078 Implement anonymous case studies list/detail with disclaimer.
- [x] T079 Implement media/social wall read-only page.
- [x] T080 Implement contact/branches page and contact form contract.
- [x] T081 Implement privacy and terms pages.
- [x] T082 Add public page render tests and SEO checks.

Acceptance:
- Public pages do not expose private data.
- Content does not promise legal outcomes.

## Milestone 10 - Consultation Workflow
- [x] T083 Implement booking stepper form.
- [x] T084 Integrate AI Provider Gateway organizer output into booking flow.
- [x] T085 Implement create consultation server action/API.
- [x] T086 Add duplicate/rate-limit handling for consultation submit.
- [x] T087 Implement admin consultations queue.
- [x] T088 Implement consultation detail and assign/reject actions.
- [x] T089 Implement convert consultation to client/case/appointment.
- [x] T090 Add audit logs for assign/reject/convert.
- [ ] T091 Add E2E: booking -> admin review -> convert.

Acceptance:
- Converted consultation produces linked operational records.
- Status transitions are enforced.

## Milestone 11 - Client Portal
- [x] T092 Implement portal dashboard.
- [x] T093 Implement own case detail with simplified client-safe content.
- [x] T094 Implement own documents list and upload flow using storage contract.
- [x] T095 Implement own appointments page.
- [x] T096 Implement own payments read-only page.
- [x] T097 Implement profile edit basics.
- [x] T098 Add tests for own-data-only access and internal-note hiding.

Acceptance:
- Client cannot access another client's data.
- Internal notes never render in portal.

## Milestone 12 - Admin Operations
- [x] T099 Implement admin dashboard metrics.
- [x] T100 Implement clients CRM list/detail/search/filter.
- [x] T101 Implement cases list/search/filter/sort/pagination.
- [x] T102 Implement internal case detail tabs.
- [x] T103 Implement case status update with confirmation and audit.
- [x] T104 Implement sessions/calendar create/reschedule flows.
- [x] T105 Implement tasks Kanban and list filters.
- [x] T106 Implement admin documents list/upload/status workflow.
- [x] T107 Add role-based tests for lawyer assigned cases vs admin any cases.

Acceptance:
- Admin/lawyer operations are permissioned and audited.

## Milestone 13 - Admin Governance, Finance, Content
- [x] T108 Implement users and roles pages.
- [ ] T109 Implement role permission assignment with super-admin guard.
- [x] T110 Implement settings page with schema validation.
- [x] T111 Implement audit log search/filter/pagination.
- [x] T112 Implement finance basics and manual invoice/payment records with `invoiceNumber`, `clientId`, `caseId?`, `issueDate`, `dueDate?`, `amount`, `currency`, `status`, `paymentMethod?`, `receiptNumber?`, `paidAt?`, `notes?`, `createdById`, timestamps.
- [x] T113 Implement reports overview.
- [x] T114 Implement content hub overview.
- [x] T115 Implement article CRUD and publish workflow.
- [x] T116 Implement case study draft/legal review/approve/publish workflow.
- [x] T117 Implement social post draft workflow without external publishing.
- [x] T118 Add tests for approval gates and privilege escalation prevention.

Acceptance:
- Governance pages are super-admin protected.
- Case studies cannot publish before approval/anonymization.

## Milestone 14 - Analytics and Observability
- [x] T119 Define privacy-safe event taxonomy.
- [x] T120 Implement telemetry service with allowed property schemas.
- [x] T121 Add events for booking, conversion, upload, case status, content approval, permission denial.
- [x] T122 Add structured logging with requestId and redaction.
- [x] T123 Add error boundary and server error capture plan.
- [x] T124 Add tests/static checks preventing PII in analytics events.

Acceptance:
- No names, phone numbers, case summaries, document contents, raw AI prompts, provider raw responses, API keys, or OTPs are emitted.

## Milestone 15 - Security Hardening
- [x] T125 Add security headers/CSP plan.
- [x] T126 Finalize CSRF strategy for cookie-auth mutations.
- [x] T127 Add open redirect validation.
- [x] T128 Add no-store/private caching rules for protected responses.
- [ ] T129 Add dependency audit and secret scan to CI. Current status: dependency audit and `security:secrets` scripts exist; CI wiring remains open.
- [x] T130 Review upload path, content disposition, and storage permissions.
- [x] T130A Review disabled SMTP handling, TOTP 2FA rate limits, and 2FA reset audit.
- [x] T130B Review AI Gateway no-raw-prompt/no-provider-response logging and provider timeout limits.
- [x] T131 Add PostgreSQL plus VPS uploads backup/restore notes and incident runbooks.

Acceptance:
- Security gate passes before release.

## Milestone 16 - QA and Deployment
- [x] T132 Complete unit/integration/contract tests for critical services.
- [ ] T133 Complete Playwright E2E critical flows. Current status: non-DB smoke exists; DB-backed critical journeys require PostgreSQL and seed data.
- [ ] T134 Complete accessibility checks for forms/dialogs/tables. Current status: checklist documented; automated axe/manual release pass still required.
- [ ] T135 Complete visual checks for Stitch clone and product shells. Current status: Stitch clone evidence exists; product shell release visual pass still required.
- [x] T136 Add VPS Docker or systemd production setup behind Nginx.
- [x] T137 Add deployment docs for original Terminal VPS hosting, private uploads, PostgreSQL, disabled SMTP placeholders, and AI Gateway env.
- [x] T138 Add migration, seed, smoke, rollback runbooks.
- [ ] T139 Run staging release checklist. Current status: documented; requires staging VPS.
- [x] T140 Record deferred items and roadmap.

Acceptance:
- Quality gates pass.
- New developer can run project from quickstart.

## Milestone 17 - PLAN-24 Remediation & Production Readiness
- [x] T141 Add PLAN-24 status/documentation and keep PLAN-04/PLAN-23 partial until DB/E2E/audit/VPS gates pass.
- [x] T142 Add git hygiene for `_workspace/` and `debug.log`.
- [x] T143 Fix false release-readiness by adding `qa:db`, `qa:release`, and `security:secrets`.
- [x] T144 Add `Cache-Control: no-store` to `/api/auth/me`.
- [x] T145 Superseded by PLAN-25: staff 2FA reset route now returns `FEATURE_DISABLED`.
- [x] T146 Disable Email OTP UI/routes and, under PLAN-25, disable TOTP UI/routes as well.
- [x] T147 Require confirmation checkboxes for case status changes and document deletes.
- [x] T148 Separate success/error UI state in high-risk admin case/document forms.
- [x] T149 Make Playwright respect `KMT_PORT` through `PLAYWRIGHT_BASE_URL`.
- [x] T150 Add Stitch screenshot route/status assertions.
- [x] T151 Remove production `DATABASE_URL` fallback and add readiness error.
- [x] T152 Split production bootstrap from local demo seed and add seeded document backing file.
- [x] T153 Harden trusted IP handling, session-level 2FA lockout, AI limiter, upload early reject, and production Stitch clone block.
- [x] T154 Align OpenAPI route plan with implemented finance/calendar/files/portal routes and add route-manifest contract test.
- [x] T155 Add DB-backed E2E entrypoint for staff password login and client portal login.
- [ ] T156 Run `npm run qa:db` against real PostgreSQL and verify seeded upload backing files.
- [x] T157 Complete dependency upgrade/audit remediation without `npm audit fix --force`.
- [ ] T158 Run `npm run qa:release` and archive evidence.
- [ ] T159 Run VPS smoke for Nginx/TLS/systemd/private uploads/backups with `SMTP_ENABLED=false`.
- [ ] T160 Close PLAN-04, PLAN-23, and PLAN-24 only after all release gates pass.

Acceptance:
- Every PLAN-24 task closes a named finding or release gate.
- No production release is claimed until DB, audit, E2E, and VPS evidence exists.

## Milestone 18 - PLAN-25 No-Code VPS Installer Without TOTP
- [x] T161 Update Spec Kit artifacts for `STAFF_2FA_MODE=disabled`, deferred TOTP, disabled SMTP, and installer bootstrap.
- [x] T162 Disable `/login/2fa`, TOTP verify, Email OTP, and staff 2FA reset as active user flows.
- [x] T163 Ensure staff and Super Admin login create active sessions without 2FA while `STAFF_2FA_MODE=disabled`.
- [x] T164 Ensure Super Admin only can create user email accounts and change user passwords.
- [x] T165 Add token-protected installer API routes: status, preflight, bootstrap first Super Admin, finish.
- [x] T166 Add `/install` wizard with no TOTP setup fields.
- [x] T167 Add one-command VPS install script and installer disable helper.
- [x] T168 Add production readiness errors for enabled TOTP mode and installer left enabled.
- [x] T169 Add installer/auth/security contract tests.
- [ ] T170 Run full `qa:release` on a real VPS/staging PostgreSQL target after dependency audit remediation.

Acceptance:
- First Super Admin can be created from `/install` without TOTP.
- `/install` is protected by setup token and locks after first setup.
- `INSTALLER_ENABLED=false` is required before release-ready status.
- TOTP remains deferred to a future Staff 2FA Rework plan.

## Milestone 19 - PLAN-26 Panel-Aware Installer Compatibility
- [x] T171 Add PLAN-26 Spec Kit scope for Terminal VPS, aaPanel, and cPanel setup paths.
- [x] T172 Add hosting mode selector contract: `terminal-vps`, `aapanel`, `cpanel`.
- [x] T173 Add compatibility preflight contract for Node >= 20, npm, PostgreSQL `DATABASE_URL`, private writable `UPLOADS_DIR`, app origin, process manager/port availability, disabled SMTP, disabled TOTP, and installer token/lock state.
- [x] T174 Add cPanel unsupported-hosting rejection rules for missing persistent Node.js app, missing PostgreSQL, missing SSH/command runner, missing env var support, or no private path outside `public_html`.
- [x] T175 Add aaPanel-assisted setup plan that reuses aaPanel-managed domain, SSL, database, and reverse proxy without running `apt-get`, `systemctl`, or editing `/etc/nginx` directly.
- [x] T176 Add Terminal VPS path that keeps the current root `deploy/install/install.sh` flow for fresh Ubuntu/Debian VPS targets.
- [x] T177 Add panel install script plan, e.g. `deploy/install/panel-install.sh --panel=aapanel|cpanel`, for non-root build/migrate/seed/env generation.
- [x] T177A Add panel database setup choice: `existing` panel-created database or `auto` script-created PostgreSQL database with a panel-visibility warning.
- [x] T178 Add panel docs: `docs/INSTALL_TERMINAL_VPS.md`, `docs/INSTALL_AAPANEL.md`, and `docs/INSTALL_CPANEL.md`.
- [x] T179 Add tests/static checks that panel mode never executes root-only commands and rejects unsupported cPanel before bootstrap.
- [ ] T180 Run at least one smoke per supported hosting class before marking PLAN-26 done.

Acceptance:
- User chooses the panel before setup starts.
- Each panel path shows only compatible steps and commands.
- Unsupported shared cPanel fails fast with a clear Arabic/English reason.
- `/install` first Super Admin bootstrap remains token-protected, no-TOTP, and locked after setup.
- SMTP remains disabled in every setup mode.

## Milestone 20 - PLAN-27 Live Site QA Remediation
- [x] T181 Freeze live QA evidence and convert defects into `docs/PLAN_27_LIVE_SITE_QA_REMEDIATION.md`.
- [x] T182 Decide public content source of truth for homepage, articles, and case studies.
- [x] T183 Refactor homepage featured content to use DB-backed published articles/case studies or an empty-safe no-link state.
- [ ] T184 Add production content bootstrap/runbook that does not rely on local demo seed data.
- [ ] T185 Add public link-crawl coverage for homepage cards, nav links, footer links, article links, case-study links, and service/team detail links. Current status: homepage rendered article/case-study detail links are covered; full nav/footer/services/team crawl remains open.
- [ ] T186 Add release static asset integrity smoke for `/login`, anonymous `/admin` and `/portal` redirects, `_next/static` JS/CSS status, and MIME types. Current status: `/admin` and `/portal` redirect smoke covers console `ChunkLoadError`; full static MIME crawl remains open.
- [x] T187 Resolve Cloudflare Insights CSP mismatch by either disabling the beacon or adding reviewed minimal CSP origins.
- [x] T188 Add favicon/app icon asset and assert `/favicon.ico` does not 404.
- [x] T189 Remove or production-gate login page development seed/local PostgreSQL guidance.
- [x] T190 Localize login validation and bad-credential errors while keeping generic security wording.
- [x] T191 Clean booking success output: Arabic labels, no raw enum labels, no internal AI/mock placeholder text.
- [x] T192 Prevent accidental duplicate contact form submission after success.
- [ ] T193 Add mobile smoke for `/`, `/services`, `/contact`, and `/book-consultation`.
- [x] T194 Update release checklist with PLAN-27 live smoke evidence requirements.
- [x] T195 Run local verification: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, and relevant Playwright smoke.
- [ ] T196 Run DB-backed staging verification for published public content links.
- [ ] T197 Run live smoke against the active deployed URL and archive screenshots/network/console evidence.
- [ ] T198 Close PLAN-27 status only after public links, CSP, favicon, login, booking/contact UX, chunk integrity, and live smoke all pass.
- [x] T199 Audit authenticated live admin routes, static chunks, CSP, API checks, copy, production mock data exposure, content emptiness, and mobile/desktop overflow.
- [x] T200 Localize admin shell/settings copy without enabling staff 2FA.
- [x] T201 Hide legacy mock AI classification notes from admin consultation review and render structured Arabic labels instead of raw JSON.
- [x] T202 Add admin responsive overflow constraints for dashboard shell/cards/tables/grids.
- [x] T203 Add opt-in authenticated live admin smoke for admin routes, APIs, `_next/static` status/MIME, CSP, dev login copy, and 390px overflow.
- [ ] T204 Atomically deploy the latest production build to the live target, purge bad `_next/static` cache if needed, and archive fresh live admin evidence.

Acceptance:
- Homepage, `/articles`, `/articles/[slug]`, `/case-studies`, and `/case-studies/[slug]` no longer contradict each other.
- No rendered public internal link from the homepage or public lists returns 404.
- Anonymous protected-route redirects do not emit `ChunkLoadError`.
- Production CSP has no blocked Cloudflare beacon error, either because the beacon is disabled or the reviewed domains are allowed.
- `/favicon.ico` resolves successfully.
- `/login` contains no development seed instructions and shows Arabic generic auth errors.
- Booking success does not expose internal placeholders or raw enums.
- Contact success avoids accidental duplicate sends.
- Authenticated admin pages do not expose English shell/settings copy, raw legacy mock AI text, or page-level horizontal overflow.
- PLAN-27 evidence is archived before any production-ready claim.

## Milestone 21 - PLAN-28 Public Luxury Redesign
- [x] T205 Create PLAN-28 Spec Kit plan artifact at `specs/kmt-legal-platform/public-luxury-redesign-plan.md`.
- [x] T206 Freeze PLAN-28 boundary: public routes only; exclude admin, portal, product-system, Stitch clone, and shared UI primitive restyling.
- [x] T207 Inventory current public routes, public components, content arrays, local assets, public tests, and screenshot commands before implementation.
- [x] T208 Define public-only dark luxury visual contract with scoped colors, typography, border, depth, image, motion, RTL, and accessibility rules.
- [x] T209 Choose or add approved public imagery for hero, focus area, representative matters, articles, team, and footer without real client data.
- [x] T210 Redesign `PublicShell` header with dark transparent treatment, Arabic-first navigation labels, active underline, mobile nav, and primary consultation CTA.
- [x] T211 Redesign `PublicShell` footer with KMT brand block, practice areas, offices, contact, newsletter/lead capture if approved, privacy/terms links, and responsive layout.
- [x] T212 Redesign `PageHero`, `PublicSection`, `TrustStrip`, and `DetailCta` as public-only luxury components without changing shared `src/components/ui/*` defaults.
- [x] T213 Recompose homepage into hero, trust strip, practice-area matrix, featured focus area, process, industries, representative matters, insights, and final CTA.
- [x] T214 Expand public practice-area content to the full matrix: corporate, litigation, arbitration, real estate, tax advisory, criminal defense, labor law, commercial contracts, foreign investment, and debt recovery.
- [x] T215 Add Arabic display labels and stable category mappings so public labels do not expose raw DB/category values.
- [x] T216 Redesign `/services` and `/services/[slug]` with the new practice-area listing/detail language while preserving existing slugs and booking entry points.
- [x] T217 Redesign `/team` and `/team/[slug]` with premium portrait cards, specialties, booking availability, and accessible image alt text.
- [x] T218 Redesign `/articles`, `/articles/[slug]`, `/case-studies`, `/case-studies/[slug]`, and `/media` as editorial legal insight surfaces with DB-empty safe states.
- [x] T219 Redesign `/book-consultation` and `BookingStepper` surfaces while preserving API payload, validation, analytics events, loading, disabled, error, and success states.
- [x] T220 Redesign `/contact` and `ContactForm` surfaces while preserving contact API payload, duplicate-submit protection, errors, success reset, and branch data.
- [x] T221 Restyle `/privacy` and `/terms` to match the public visual language without changing legal meaning unless approved.
- [x] T222 Remove or hide any visible English language toggle from the public shell until full English localization exists.
- [x] T223 Update Arabic public metadata, CTAs, headings, labels, alt text, and no-outcome legal disclaimers for all redesigned public surfaces.
- [x] T224 Add or update public render/link tests for redesigned public pages, including homepage links, nav links, footer links, service/team detail links, and DB-empty article/case-study states.
- [x] T225 Add focused Playwright public visual smoke for `/`, `/services`, `/contact`, and `/book-consultation` at desktop `1440x900` and mobile `390x844`.
- [x] T226 Run design polish review and fix public UI issues: contrast, hierarchy, text overflow, RTL icon direction, focus states, touch targets, and non-generic legal brand feel.
- [x] T227 Run verification: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:smoke`, public link crawl, and screenshot review.
- [x] T228 Update PLAN-28 status/docs, commit, push to `origin/main`, and hand off aaPanel PM2 update commands.

Acceptance:
- Every in-scope public route uses the new dark luxury legal visual language.
- Dashboard, admin, portal, product-system, shared UI primitives, and Stitch clone are not redesigned by PLAN-28.
- Public header/footer/navigation are Arabic-first and route-stable.
- `/services` may keep its route path but public labels use `مجالات الخبرة`.
- No visible `EN` toggle exists until complete English localization is delivered.
- Booking and contact forms preserve existing API contracts, validation, analytics, requestId, loading, disabled, error, and success behavior.
- Public copy remains privacy-safe, does not expose client data, and does not promise legal outcomes.
- All public internal links return status `< 400`.
- Desktop and mobile screenshots show no page-level horizontal overflow, unreadable text, clipped CTAs, or broken dark-surface focus states.
- Verification results and screenshot/link-crawl evidence are archived before marking PLAN-28 done.

## Milestone 22 - PLAN-29 Public Localization
- [x] T229 Create PLAN-29 Spec Kit plan artifact at `specs/kmt-legal-platform/public-localization-plan.md`.
- [x] T230 Update PLAN-29 tracking in `tasks.md`, `frontend-plan.md`, `quality-gates.md`, `test-plan.md`, and implementation status.
- [x] T231 Freeze PLAN-29 boundary: public website routes only; exclude admin, portal, install, login, product-system, Stitch clone, emails, notifications, AI, invoices, PDFs, and protected staff/client workflows.
- [x] T232 Make English the default public locale on existing public routes and keep Arabic optional under `/ar`.
- [x] T233 Preserve all existing public slug strings; do not translate route segments or Article/CaseStudy slugs.
- [x] T234 Reuse or narrowly extend the lightweight public locale helper pattern; do not add `next-intl` or another i18n framework.
- [x] T235 Add required `locale` support for `Article` and `CaseStudy`, backfill existing Arabic rows as `ar`, and allow `(locale, slug)` uniqueness.
- [x] T236 Filter public Article/CaseStudy list and detail queries by locale while preserving published/anonymized safety rules.
- [x] T237 Localize public navigation, footer, CTAs, labels, form states, metadata, alt text, and empty/error/success states for English default and approved `/ar` content.
- [x] T238 Add public locale tests for English default routes, `/ar` routes, slug stability, Article/CaseStudy locale filtering, missing localized content, and protected-surface drift.
- [x] T239 Verify no `next-intl` dependency/config/import exists and run typecheck, lint, tests, build, public link crawl, and accessibility/RTL checks.
- [x] T240 Update PLAN-29 status/docs after implementation and archive verification evidence before marking done.

Acceptance:
- English is the primary public experience at the existing public routes.
- Arabic public pages are optional and live under `/ar`.
- PLAN-29 does not localize admin, portal, install, login, product-system, Stitch clone, or internal workflows.
- No `next-intl` or new i18n framework is introduced.
- Article and CaseStudy have explicit locale-aware storage and queries.
- Existing slug strings remain unchanged across locales.
- Public metadata, language alternates, canonical URLs, accessibility labels, and route links are locale-aware.

## Milestone 23 - PLAN-30 KMT Signature Motion System
- [x] T241 Create PLAN-30 Spec Kit plan artifact at `specs/kmt-legal-platform/public-motion-plan.md`.
- [x] T242 Freeze PLAN-30 boundary: public website only; exclude admin, portal, install, login, product-system, and Stitch clone surfaces.
- [x] T243 Add CSS/Tailwind-first public motion utilities without adding a new animation dependency.
- [x] T244 Apply Gold Legal Thread motion to public navigation, footer links, consultation CTAs, hero reveal, public cards, icons, image cards, filters, contact form, and booking stepper.
- [x] T245 Preserve RTL arrow direction and reduced-motion fallbacks while preventing disabled/loading controls from lifting on hover.
- [x] T246 Add focused Playwright coverage for reduced motion and no horizontal overflow after hover/focus interactions.
- [x] T247 Run verification: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e:smoke`, and focused public visual smoke.
- [x] T248 Update PLAN-30 status/docs, commit, push to `origin/main`, and hand off aaPanel PM2 update commands.

Acceptance:
- Public motion uses the Judicial Precision direction and Gold Legal Thread pattern.
- No new animation library or runtime dependency is introduced.
- Public motion is opt-in through public-site classes and does not restyle protected/admin/product/stitch surfaces.
- Reduced-motion users get no reveal/lift/zoom/shift motion while static RTL direction remains correct.
- Public pages have no page-level horizontal overflow after hover/focus motion at mobile width.

## Milestone 24 - PLAN-31 Public Motion V2 - Cinematic Legal
- [x] T249 Create PLAN-31 Spec Kit plan artifact at `specs/kmt-legal-platform/public-motion-v2-plan.md`.
- [x] T250 Remove `kmt-motion-thread`, `kmt-motion-trust-strip`, `publicMotionThread`, and `publicMotionTrustStrip` from runtime source and CSS.
- [x] T251 Add CSS-only Cinematic Legal motion utilities for CTA shine, card border beams, icon halo, arrow trail, panel enter, and hero spotlight.
- [x] T252 Apply V2 motion hooks to public shell CTAs/icons/nav, hero actions, trust icons, practice cards, directory cards, contact cards, booking panels, and public forms.
- [x] T253 Preserve RTL inline-forward arrow movement, reduced-motion fallbacks, and disabled/loading no-lift behavior.
- [x] T254 Add contract and Playwright coverage for no thread DOM/CSS, V2 classes, reduced motion, RTL arrow direction, and hover/focus overflow at 390px.
- [x] T255 Run verification: `npm run typecheck`, `npm run lint`, `npm run test`, `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build`, and focused public visual smoke.
- [x] T256 Update PLAN-31 status/docs, commit, push to `origin/main`, and hand off aaPanel PM2 update commands.

Acceptance:
- No `kmt-motion-thread` or `kmt-motion-trust-strip` runtime CSS/DOM remains.
- Public motion follows the Cinematic Legal direction with visible CTA shine, card beams, icon halos, arrow trails, and hero spotlight.
- No new animation dependency is introduced.
- Public motion remains opt-in and does not restyle admin, portal, install, login, product-system, or Stitch clone surfaces.
- Reduced-motion users get no sweep/beam/lift/zoom/tilt/shift motion.
- English and Arabic public pages preserve correct direction and no page-level horizontal overflow after hover/focus motion.

## Milestone 25 - PLAN-32 AI Booking, Secretary Role & Client Portal
- [x] T257 Add `Secretary` role and `client.account.manage` without granting user/role/permission/settings management.
- [x] T258 Add client-only portal account create/password-reset APIs under `/api/admin/clients/{id}/account`.
- [x] T259 Add indexed audit context fields for client/case/lawyer/appointment/document/payment and wire operational audit filters.
- [x] T260 Add AI consultation assistant schema/task, public booking/inquiry endpoint, authenticated client assistant endpoint, and mock gateway coverage.
- [x] T261 Add `/client` protected portal routes for files, court dates, payments/dues, cases, assistant, and profile while keeping `/portal` compatible.
- [x] T262 Add public booking assistant panel to `/book-consultation`.
- [x] T263 Update route/auth/localization/server tests and run verification: `db:generate`, `typecheck`, `lint`, `test`, local `build`, `db:validate`, and smoke E2E.
- [x] T264 Add a public website header entry point for client login that opens `/login?next=/client`.
- [x] T265 Add a recoverable portal guard for Client-role accounts that are not linked to a CRM client profile.
- [x] T266 Add an admin user-detail repair action that creates or links a CRM client profile for an unlinked Client-role account.
- [x] T267 Treat exact Super Admin as a full-permission actor even if persisted role permissions are stale.

Acceptance:
- Client users default to `/client`; `/portal` remains accessible for compatibility.
- Public website visitors can reach the client login from the header without knowing the `/client` URL.
- Client-role accounts without a linked CRM profile see a clear activation message instead of a server application error.
- Client-role accounts created from user governance can be repaired from the user detail screen so they appear in CRM clients.
- Super Admin can see and use client account linking actions even when older database role permissions are missing `client.account.manage`.
- Secretary can operate clients/cases/appointments/documents/payments/tasks/reports but cannot manage users, roles, permissions, or settings.
- CRM account creation creates or links only `Client` role accounts.
- Public AI assistant can book consultation appointments only after server-side field, consent, office-hours, duplicate, and conflict checks.
- Visitor appointment inquiry requires reference plus matching phone or email.
- Client assistant reads appointments from authenticated `clientId` only.
- Client portal pages reuse scoped portal services and do not issue unscoped client data queries.
- DB-backed secretary/client login and AI booking smoke remains required on a migrated PostgreSQL target before release sign-off.
