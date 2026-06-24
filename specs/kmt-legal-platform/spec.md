# spec.md

## Product Name
KMT Legal Platform

## Product Type
Responsive legal-tech web platform: public law firm website, AI-assisted consultation intake, client portal, internal dashboard, CRM, case management, document management, appointments, content/social workflow, and anonymous case studies workflow.

## One-Line Description
A secure Arabic-first legal platform that turns public visitors into organized consultation requests and gives clients, lawyers, admins, marketing staff, and super admins one governed workspace for cases, documents, appointments, content, permissions, and audit.

## Problem Statement
Law firm work is split across public website inquiries, calls, spreadsheets, document folders, calendars, and informal task tracking. This creates missed leads, unclear case ownership, weak document controls, and poor visibility for clients and office staff. KMT Legal Platform centralizes intake, client visibility, legal operations, and content publishing while protecting confidential legal data.

## Target Users
- Public visitors and potential clients in Egypt and Arabic-speaking markets.
- Existing clients tracking their own cases, appointments, documents, and payment records.
- Lawyers managing assigned cases, sessions, documents, notes, and tasks.
- Office admins managing clients, consultations, schedules, documents, finance basics, and content.
- Marketing staff managing articles, social drafts, and anonymous case studies.
- Super admins managing users, roles, permissions, settings, and audit logs.

## User Roles
- Guest
- Client
- Lawyer
- Office Admin
- Marketing Staff
- Super Admin

## Value Proposition
- Premium trust-building public website.
- Structured consultation intake with AI Provider Gateway outputs that require human review.
- Secure client portal with own-data-only access.
- Internal legal operations dashboard with case, document, session, CRM, task, content, finance, and audit workflows.
- Arabic RTL-first experience with English-ready architecture.

## Business Goals
- Increase qualified consultation requests.
- Reduce manual coordination between admins and lawyers.
- Improve case visibility and client trust.
- Reduce permission and document-handling risk.
- Establish a scalable foundation for future AI, payments, SMS, social publishing, and mobile expansion.

## User Goals
- Guest: understand services and submit a consultation request quickly.
- Client: see only their own cases, appointments, documents, and payment records.
- Lawyer: manage assigned legal work without seeing unrelated cases.
- Office Admin: coordinate clients, consultations, cases, documents, tasks, appointments, and finance basics.
- Marketing Staff: prepare compliant content and anonymous case studies without exposing client data.
- Super Admin: govern users, roles, permissions, settings, and audit trails.

## Success Metrics
- Consultation submission completion rate.
- Admin review-to-conversion rate.
- Time from consultation request to assigned lawyer.
- Percentage of protected actions with audit logs.
- Upload success/failure rate by validation reason.
- Permission-denied events that prevent unauthorized access.
- Public page SEO readiness and core page performance.
- E2E pass rate for booking, conversion, client portal, upload, and case study approval.

## In Scope
- Public website routes: `/`, `/services`, `/services/[slug]`, `/team`, `/team/[slug]`, `/book-consultation`, `/case-studies`, `/case-studies/[slug]`, `/media`, `/articles`, `/articles/[slug]`, `/contact`, `/login`, `/privacy`, `/terms`.
- Auth: login, logout, session protection, route protection, seeded roles and permissions.
- Client portal: dashboard, own case detail, documents/upload, appointments, payments read-only/manual, profile.
- Internal dashboard: dashboard, clients CRM, consultations, cases, case detail, calendar/sessions, tasks, documents, content/social, finance basics, reports basics, users, settings, audit log.
- Core backend models listed in `data-model.md`.
- AI Provider Gateway abstraction with configurable providers and deterministic mock provider support.
- Secure upload/download contract.
- Disabled SMTP/email template module retained for future notifications; no email sending or 2FA email fallback in this release.
- Staff 2FA/TOTP is deferred and disabled for the PLAN-25 installer release.
- No-code installer creates the first Super Admin and locks after setup.
- PLAN-26 adds a panel-aware installer selector for Terminal VPS, aaPanel-assisted VPS, and cPanel compatibility checks.
- Audit logs for sensitive admin/staff actions.
- Testing, DevOps, quickstart, and quality gates.

## Out of Scope
- Real payment gateway, refunds, settlement, or accounting integration.
- Real Facebook/TikTok/Instagram publishing APIs.
- AI OCR, RAG, document search, or legal advice generation.
- Court-system integration.
- Real SMS/WhatsApp provider.
- Advanced analytics beyond privacy-safe MVP telemetry.
- Mobile app.
- SaaS multi-tenancy and billing.

## Assumptions
- MVP is a single law firm deployment, not multi-tenant SaaS.
- Arabic is the primary locale and default direction is RTL.
- English structure is prepared but full English content can be completed later.
- Auth will use Auth.js/NextAuth or an equivalent secure server-side session strategy.
- PostgreSQL + Prisma are the primary persistence layer.
- Production hosting target is VPS-class hosting. Terminal VPS is the supported default; aaPanel is supported as a VPS panel adapter; cPanel is supported only when it provides a persistent Node.js app, PostgreSQL, SSH/terminal or equivalent command runner, environment variables, and private writable storage outside `public_html`.
- Storage is private VPS filesystem storage, for example `/var/lib/kmt-legal/uploads`, never `public/`.
- Upload limit is 5MB.
- Allowed upload types are PDF, DOC, DOCX, JPG/JPEG, and PNG.
- Payments are read-only/manual records in MVP.
- Email sending is deferred. SMTP env placeholders exist, but `SMTP_ENABLED=false` and UI/backend sending are disabled in this release.
- Staff login is email/password only in this release. TOTP and Email OTP are deferred; `STAFF_2FA_MODE=disabled` is required.
- AI is provider-gateway based with `mock`, `openrouter`, `openai-compatible`, `local`, or `custom` adapters, and all outputs are marked as needing lawyer review.
- Finance MVP is invoice basics only; no tax, discounts, settlement, gateway, refunds, or accounting ledger.

## Constraints
- Do not write production code during planning.
- Do not connect payment, SMS, social, court, OCR, RAG, or legal-advice providers in MVP.
- Do not call AI providers directly from UI or feature services; route all AI tasks through the server-side AI Provider Gateway.
- Do not expose real client data in seeds, screenshots, logs, analytics, or examples.
- Do not store uploads in a publicly served directory.
- Do not let Nginx serve uploaded files directly; the app must stream downloads only after authorization.
- Do not rely on frontend-only auth or hidden buttons for security.
- Do not use AI-generated content as final legal advice.
- Do not log raw prompts, legal summaries, document contents, API keys, or provider raw responses.
- Every protected route and server mutation must enforce server-side permissions.

## Risks
- Scope creep from full law-office ERP expectations.
- Privacy breach from documents, case details, analytics, or logs.
- Horizontal privilege escalation between clients or lawyer assignments.
- AI output or provider responses misunderstood as legal advice.
- Upload handling mistakes exposing private files.
- Email/2FA misconfiguration blocking staff login or leaking OTPs.
- Arabic RTL broken by LTR-first components.
- Backend-first or frontend-first execution creating disconnected work.

## User Personas

### Public Visitor
- Role: Guest
- Goal: Understand services and decide whether to book.
- Pain points: Legal uncertainty, low trust, unclear service fit.
- Technical level: Low to medium.
- Main device: Mobile.
- Frequency: One-off or occasional.
- Main journey: Landing page -> service detail -> book consultation.

### Potential Client
- Role: Guest submitting consultation.
- Goal: Send a case summary and preferred consultation mode.
- Pain points: Anxiety, privacy concerns, unclear required documents.
- Technical level: Low.
- Main device: Mobile.
- Frequency: Occasional.
- Main journey: Booking form -> AI organizer summary -> submit -> confirmation.

### Existing Client
- Role: Client
- Goal: Track own case, documents, appointments, and payments.
- Pain points: Calling office for updates, document uncertainty.
- Technical level: Low to medium.
- Main device: Mobile and desktop.
- Frequency: Weekly or around sessions.
- Main journey: Login -> portal dashboard -> case detail/documents/appointments.

### Lawyer
- Role: Lawyer
- Goal: Manage assigned cases, sessions, notes, documents, and tasks.
- Pain points: Scattered case context, unclear next actions.
- Technical level: Medium.
- Main device: Desktop.
- Frequency: Daily.
- Main journey: Admin dashboard -> assigned cases -> case detail -> tasks/sessions/documents.

### Office Admin
- Role: Office Admin
- Goal: Coordinate clients, consultations, cases, appointments, documents, tasks, and finance basics.
- Pain points: Manual intake, duplicated work, no audit trail.
- Technical level: Medium.
- Main device: Desktop.
- Frequency: Daily.
- Main journey: Dashboard -> consultation queue -> convert to case -> assign -> schedule.

### Marketing Staff
- Role: Marketing Staff
- Goal: Publish compliant articles, social drafts, and anonymized case studies.
- Pain points: Legal review bottleneck and privacy risk.
- Technical level: Medium.
- Main device: Desktop.
- Frequency: Weekly.
- Main journey: Content hub -> draft -> legal review -> approve/publish.

### Super Admin
- Role: Super Admin
- Goal: Govern access, settings, and audit logs.
- Pain points: Permission drift, no accountability.
- Technical level: High.
- Main device: Desktop.
- Frequency: Weekly or on incident.
- Main journey: Users/settings/audit -> inspect -> adjust roles -> review logs.

## User Stories

### Consultation Intake
As a guest, I want to submit a consultation request, so that the office can review my issue and contact me.
- Priority: Must
- Acceptance criteria: Required fields validate; request is saved as `new`; AI classification is preliminary; confirmation is shown.
- Edge cases: Duplicate phone/email in short window; missing required fields; invalid phone.
- Failure states: Validation error, rate limited, server error with requestId.

As an office admin, I want to review consultation requests, so that I can assign lawyers or reject unsuitable requests.
- Priority: Must
- Acceptance criteria: Queue supports filtering; detail shows intake data and AI summary; assign/reject writes audit log.
- Edge cases: Already converted request; lawyer unavailable; missing conflict-check info.
- Failure states: Permission denied, stale update conflict, validation error.

As an office admin, I want to convert an approved consultation into a client/case, so that legal work starts from structured intake.
- Priority: Must
- Acceptance criteria: Client and case records created or linked; status becomes `converted`; audit log records actor and resources.
- Edge cases: Existing client by phone/email; duplicate opposing party name; missing assigned lawyer.
- Failure states: Conflict, permission denied, server error.

### Client Portal
As a client, I want to see my own case summaries, so that I know status and next sessions.
- Priority: Must
- Acceptance criteria: Client can only access own cases; internal notes are hidden; empty state appears if no cases.
- Edge cases: Archived case; no next session.
- Failure states: 401, 403/404 safe response, loading/error states.

As a client, I want to upload documents securely, so that the office receives required files.
- Priority: Must
- Acceptance criteria: Only PDF/DOC/DOCX/JPG/JPEG/PNG files up to 5MB are accepted; server-side MIME/content validation passes; private VPS storage key generated; document status starts `new`; upload audit event recorded.
- Edge cases: Duplicate filename; large file; unsupported type; lost connection.
- Failure states: FILE_TOO_LARGE, UNSUPPORTED_FILE_TYPE, AUTH_REQUIRED.

### Internal Operations
As a lawyer, I want to manage sessions for assigned cases, so that hearing outcomes and next actions are tracked.
- Priority: Must
- Acceptance criteria: Lawyer sees assigned cases only; session create/update writes audit; next session can update case summary.
- Edge cases: Lawyer reassignment; rescheduled session.
- Failure states: Permission denied, validation error.

As an office admin, I want a clients CRM, so that leads and active clients are searchable and assignable.
- Priority: Must
- Acceptance criteria: Search/filter by name/phone/status/source; assignment writes audit; archived clients hidden by default.
- Edge cases: Duplicate phone; archived client reactivation.
- Failure states: Permission denied, conflict.

As marketing staff, I want to create anonymous case studies, so that the firm can publish learning-based content safely.
- Priority: Must
- Acceptance criteria: Draft cannot publish until approved; anonymization checklist required; disclaimer displayed publicly.
- Edge cases: Rejected legal review; missing anonymization flag.
- Failure states: Approval required, permission denied.

### Governance
As a super admin, I want to manage users, roles, permissions, settings, and audit logs, so that the system remains governed.
- Priority: Must
- Acceptance criteria: Role changes require permission; audit log searchable; privilege escalation is blocked.
- Edge cases: Editing own role; disabling last super admin.
- Failure states: Permission denied, invariant violation.

## Functional Requirements

### Public Website
- Render all public routes with realistic Arabic legal content.
- Support SEO metadata for public pages.
- Provide search/filter for services, lawyers, articles, and case studies where applicable.
- Display disclaimers on case studies and AI-assisted flows.

### Auth and Permissions
- Login, logout, current user, session expiration, protected route guards.
- Staff login flow: password/session start -> active session. No `/login/2fa` step is shown in the PLAN-25 release.
- TOTP setup, TOTP verification, Email OTP fallback, and staff 2FA reset are disabled placeholders until a future Staff 2FA Rework plan.
- Super Admin is the only role allowed to create user email accounts or change any user password.
- Central permission helper using `resource.action.scope`.
- Server-side object ownership checks for clients and assigned lawyers.
- Denied states: 401, 403, expired session.

### Consultation Workflow
- Public booking form with validation and AI Provider Gateway organizer output.
- Admin queue, detail, assign, reject, convert to case.
- Conflict-check placeholder for opposing party name.

### Client Portal
- Dashboard, own case detail, documents/upload, appointments, payments read-only/manual, profile.
- No access to internal notes or other clients' data.

### Internal Dashboard
- Dashboard metrics, clients CRM, consultations, cases, case detail, calendar, tasks, documents, content/social, finance basics, reports, users, settings, audit log.

### Documents
- Upload validation, private VPS filesystem storage, metadata persistence, visibility controls, download authorization.
- Enforce `MAX_UPLOAD_MB=5`.
- Enforce `ALLOWED_UPLOAD_TYPES=application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png`.
- Validate MIME/content server-side, generate opaque file keys, set attachment download headers, and audit upload/download.

### Content and Social
- Articles, anonymous case studies, media entries, social drafts, review/approval workflow.
- No automatic external publishing in MVP.

### AI Organizer
- Server-side AI Provider Gateway only; UI and feature services never call providers directly.
- Configurable providers: `AI_PROVIDER=mock | openrouter | openai-compatible | local | custom`.
- Configurable env: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `AI_TIMEOUT_MS`, `AI_MAX_TOKENS`, `AI_TEMPERATURE`.
- Normalize all provider calls into `generateStructured({ task, locale, input, schema, safetyPolicy })`.
- Supported tasks: consultation classification, intake summary, document checklist suggestion, anonymous case study draft, social post draft.
- Provider responses normalize to `provider`, `model`, `task`, `output`, `usage?`, `latencyMs`, `reviewRequired`, `requestId`.
- If a provider does not support OpenAI-compatible HTTP, implement it as an adapter behind the gateway, not feature-specific code.
- Output always marked `reviewRequired`.

### Email and 2FA
- Production VPS keeps SMTP disabled until a future SMTP activation plan.
- Current runtime returns disabled email metadata without sending. A future SMTP activation plan must define dev/staging transports.
- Future email use cases: consultation confirmation, staff notification, password/security notifications, optional appointment reminders, and optional 2FA fallback after approval.
- Deferred env placeholders: `SMTP_ENABLED=false`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURE`.
- PLAN-25 disables 2FA challenges entirely. Future 2FA challenges must be rate limited, expire quickly, and produce audit events for reset and suspicious failures before activation.
- Installer env: `STAFF_2FA_MODE=disabled`, `INSTALLER_ENABLED`, `INSTALLER_SETUP_TOKEN`, and `INSTALLER_LOCK_PATH`.

### Finance Basics
- Manual invoice/payment fields: `invoiceNumber`, `clientId`, `caseId?`, `issueDate`, `dueDate?`, `amount`, `currency`, `status`, `paymentMethod?`, `receiptNumber?`, `paidAt?`, `notes?`, `createdById`, timestamps.
- MVP excludes tax, discounts, settlement, gateway payments, refunds, and accounting ledger.

## Non-Functional Requirements
- Performance: Public pages should be cache-friendly; protected pages must not leak through shared cache.
- Security: Server-side authz, CSRF strategy for cookie auth, secure uploads, no secrets in client bundle.
- Privacy: No PII in logs, analytics, seed data, screenshots, or public content.
- Accessibility: Semantic HTML, keyboard navigation, labels, focus states, 44px touch targets, no color-only statuses.
- SEO: Public pages need metadata, slugs, canonical paths, and Arabic content quality.
- Scalability: Feature modules, service/repository layers, private VPS filesystem storage abstraction, queue abstraction.
- Maintainability: TypeScript strictness, Zod validation, clear boundaries, reusable components.
- Localization: Arabic RTL-first, English LTR-ready, date/number formatting.
- Observability: Structured logs, requestId, release/environment tags, privacy-safe events.
- Reliability: Validation errors, retries for jobs later, safe failure states.

## Compliance and Policy Notes
- Legal confidentiality requires strict object-level access and private document storage.
- Anonymous case studies must remove real client names, case numbers, documents, and identifying facts.
- AI output must be organizational assistance only, not legal advice.
- Privacy policy and terms must cover data handling, upload rules, deferred SMTP notifications, deferred staff 2FA, AI provider gateway role, and no legal outcome guarantees.

## Resolved Decisions
- Production hosting target: VPS-class hosting with panel-aware setup paths. Terminal VPS remains the safest default; aaPanel and cPanel require explicit compatibility preflight.
- Storage: private VPS filesystem storage, not external object or platform storage.
- Upload allowlist: PDF, DOC, DOCX, JPG/JPEG, PNG.
- Upload max size: 5MB.
- Email sending: deferred; SMTP placeholders remain documented but disabled.
- Staff 2FA: deferred; TOTP is disabled in this release and must be rebuilt in a later plan before activation.
- Installer: one-command Terminal VPS setup plus panel-assisted aaPanel/cPanel setup paths create the first Super Admin through `/install` and must lock after setup.
- Finance: invoice basics only using the fields listed in this spec.
- AI: provider-agnostic gateway for mock, OpenRouter, OpenAI-compatible, local/OpenCode, or custom adapters.

## MVP Definition
The smallest useful MVP includes public website, consultation intake with AI Provider Gateway organizer output, auth/RBAC with staff password login, a no-code panel-aware installer and first Super Admin bootstrap, client portal with own cases/documents/appointments/payments, admin dashboard with consultation conversion, CRM, cases, sessions, tasks, documents, content/social workflow, invoice basics, users/settings/audit, secure private VPS-class uploads, audit logs, seed data, critical tests, and Terminal VPS / aaPanel / cPanel deployment handoff. SMTP/email delivery and staff 2FA/TOTP are deferred.

## Deferred Features
- Payment gateway.
- Social network publishing APIs.
- OCR, RAG, vector search, and legal-advice generation.
- SMS/WhatsApp provider.
- Court integration.
- Native mobile app.
- Advanced analytics and forecasting.
- Multi-tenant SaaS billing.

## Acceptance Criteria for Product Readiness
- All MVP routes exist in the routing plan.
- Every protected route/action has server-side auth and permission checks.
- Client/lawyer/admin object-level access is tested.
- Upload validation and private download authorization are tested.
- AI output is provider-normalized, labeled, schema-validated, and review-gated.
- Staff 2FA is not enforced in this release; production readiness fails if `STAFF_2FA_MODE=totp`.
- `/install` is protected by setup token and locks after first Super Admin bootstrap.
- SMTP/email delivery is disabled and documented as a future activation plan.
- Private upload storage is excluded from direct web-server serving and included in backups. On cPanel this must be outside `public_html`; on VPS/aaPanel it must be outside the served webroot.
- Audit logs exist for sensitive admin/staff actions.
- Public case studies are anonymized and carry disclaimers.
- Arabic RTL works across public, portal, and admin screens.
- Critical E2E flows pass.
- DevOps quickstart, env vars, seed, migration, and rollback notes exist.
