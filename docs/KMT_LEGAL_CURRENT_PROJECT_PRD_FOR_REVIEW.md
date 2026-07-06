# KMT Legal Current Project PRD And External Review Brief

Generated from repository inspection on 2026-07-07 Africa/Cairo.

This document describes the current implemented state of the KMT Legal Platform so a second model, reviewer, or engineering team can review the full project and propose improvement work. It does not replace `specs/kmt-legal-platform/` as the planning source of truth, and it does not claim production readiness where runtime gates are still open.

## 1. Executive Summary

KMT Legal Platform is a legal office web platform for public legal-service discovery, AI-assisted consultation booking, client self-service, internal admin operations, document handling, payments, content management, audit logging, installer flow, and VPS deployment handoff.

The current implementation is a Next.js App Router application with Prisma/PostgreSQL, Tailwind, custom UI primitives, server-side RBAC, private VPS file storage, provider-neutral AI gateway, provider-neutral payment gateway abstraction, and aaPanel/PM2 deployment scripts.

The product has five major surfaces:

1. Public website, English by default, Arabic under `/ar`.
2. Public consultation booking chat with AI-style intake, secretary review, appointment slot selection, and optional payment checkout.
3. Protected client portal under `/client`, with legacy `/portal` compatibility.
4. Protected admin dashboard under `/admin`.
5. Installation, product system demo, and Stitch visual clone routes for setup and design/reference work.

## 2. Source Files And Evidence Checked

Main project and delivery docs:

- `AGENTS.md`
- `README.md`
- `PROJECT_GUIDE.md`
- `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`
- `docs/KMT_LEGAL_PLATFORM_PRD.md`
- `docs/KMT_LEGAL_BACKEND_AUDIT.md`
- `docs/KMT_LEGAL_UI_UX_AUDIT.md`
- `docs/PLAN_33_PAYMENT_GATEWAY.md`
- `docs/SERVER_COMMANDS.md`
- `specs/kmt-legal-platform/contracts/openapi-plan.md`
- `specs/kmt-legal-platform/data-model.md`

Main implementation surfaces:

- `package.json`
- `next.config.mjs`
- `security-headers.cjs`
- `src/middleware.ts`
- `prisma/schema.prisma`
- `src/app`
- `src/app/api`
- `src/server`
- `src/features`
- `src/components`
- `src/content`
- `src/lib`
- `tests/server`
- `tests/ui`
- `tests/e2e`
- `deploy`

Project scale observed from repository structure:

- `src/app/api`: 93 files.
- `src/app`: 174 files.
- `src/server`: 74 files.
- `src/features`: 28 files.
- `src/components`: 25 files.
- `tests/server`: 30 files.
- `tests/ui`: 2 files.
- `tests/e2e`: 7 files.
- `prisma/migrations`: 10 files.
- `docs`: 47 files.
- `specs/kmt-legal-platform`: 21 files.

## 3. Product Goal

Build a production-grade legal office platform for KMT Legal that:

- Presents legal services, team profiles, case studies, articles, media, contact, privacy, and terms pages.
- Lets visitors submit structured consultation requests through a chat-first intake flow.
- Keeps AI output as organization assistance only, never final legal advice.
- Lets office staff review, assign, reject, schedule, convert, and track consultations.
- Lets clients access their own cases, files, court dates, payments, profile, AI assistant, and human team chat.
- Lets admins manage clients, cases, sessions, calendar, tasks, documents, content, users, settings, audit logs, finance, reports, payment settings, pricing, payment attempts, webhooks, and notifications.
- Stores uploaded files outside public web roots and only streams them through authorized app routes.
- Supports VPS/aaPanel deployment with health checks, migration flow, and production readiness gates.

## 4. Current Status

The implementation status file reports 33 Spec Kit plans:

- 27 plans done.
- 6 plans partial, in progress, or release-blocked.
- 0 plans fully not started.

Important completed areas:

- Next.js foundation, TypeScript, Tailwind, ESLint, Playwright, Vitest, Prisma 7, PostgreSQL schema, migrations, seed contract tests.
- Stitch clone isolated and production-gated.
- Product UI tokens, shells, primitives, public/admin/client layouts.
- Auth, sessions, RBAC, portal ownership guards.
- Shared validation, API error envelope, request IDs, audit foundation.
- Private VPS file upload/download contract.
- AI gateway with mock/OpenAI-compatible providers and safety guardrails.
- Public website, content, booking, contact, privacy, terms.
- Admin consultations, CRM, cases, calendar, tasks, documents, users, settings, audit, finance, reports, content, notifications, messages.
- Client portal, client dashboard, files, cases, appointments/court dates, payments, profile, assistant, team chat.
- Analytics event store, safe logging, CSP/security headers, origin guard, production readiness endpoint.
- Payment gateway v1 architecture for consultation booking.
- aaPanel + PM2 deployment handoff.

Known release blockers and open gates:

- Real PostgreSQL `db:migrate` and `db:seed` runtime verification still needs to be completed on a running database.
- DB-backed E2E flows require migrated PostgreSQL, seed data, and private writable `UPLOADS_DIR`.
- Payment provider live launch requires merchant comparison, sandbox credentials, webhook signature verification, and provider-specific smoke tests.
- SMTP is intentionally disabled.
- Staff 2FA/TOTP is intentionally disabled and deferred.
- Manual payment fallback, refunds, disputes, settlement imports, and reconciliation workflows are not operationalized.
- External analytics/Sentry/alerting are deferred.
- Production readiness must be proven with `qa:db`, `qa:release`, VPS/aaPanel smoke, live public/admin smoke, and archived evidence.

## 5. Users And Roles

Visitor:

- Reads public content and service pages.
- Starts consultation booking.
- Sends general contact messages.
- Has no access to private data.

Potential client:

- Uses booking chat to submit name, phone, request area, summary, preferred appointment slot, and consent.
- May pay booking fee when paid mode is enabled.
- Can create a client account from a signed setup link after confirmed booking.

Client:

- Uses `/client`.
- Reads own dashboard, cases, files, court dates, consultation appointments, payment records, and profile.
- Uploads own documents.
- Uses client assistant for scoped inquiry.
- Uses saved human team chat.

Secretary:

- Reviews consultations.
- Manages consultation availability.
- Creates or links client accounts where permitted.
- Uses admin messages and notification review workflows.

Lawyer:

- Reads assigned clients/cases/consultations.
- Works on assigned cases, sessions, tasks, documents, and client communication where permitted.

Office Admin:

- Manages CRM, cases, consultations, calendar, tasks, documents, finance basics, reports, and operations.

Marketing Staff:

- Manages article, case study, and social draft workflows within approval rules.

Super Admin:

- Manages users, roles, settings, audit log, and broad system administration.

## 6. Route And Surface Map

Public English routes:

- `/`
- `/services`
- `/services/[slug]`
- `/team`
- `/team/[slug]`
- `/articles`
- `/articles/[slug]`
- `/case-studies`
- `/case-studies/[slug]`
- `/media`
- `/contact`
- `/book-consultation`
- `/privacy`
- `/terms`
- `/payment/consultation/return`
- `/payment/consultation/receipt`
- `/client-account/setup`

Public Arabic routes:

- `/ar`
- `/ar/[[...path]]`
- `/ar/book-consultation`

Protected client routes:

- `/client`
- `/client/cases`
- `/client/cases/[caseId]`
- `/client/files`
- `/client/court-dates`
- `/client/payments`
- `/client/profile`
- `/client/assistant`

Legacy portal compatibility routes:

- `/portal`
- `/portal/cases`
- `/portal/cases/[caseId]`
- `/portal/documents`
- `/portal/appointments`
- `/portal/payments`
- `/portal/profile`
- `/portal/[...section]`

Protected admin routes:

- `/admin`
- `/admin/clients`
- `/admin/clients/[clientId]`
- `/admin/cases`
- `/admin/cases/[caseId]`
- `/admin/calendar`
- `/admin/tasks`
- `/admin/documents`
- `/admin/consultations`
- `/admin/consultations/[consultationId]`
- `/admin/consultation-availability`
- `/admin/content`
- `/admin/content/articles`
- `/admin/content/case-studies`
- `/admin/content/social`
- `/admin/finance`
- `/admin/reports`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/settings`
- `/admin/audit-log`
- `/admin/messages`
- `/admin/messages/[threadId]`

Utility and setup routes:

- `/login`
- `/login/2fa`, disabled placeholder surface.
- `/install`
- `/product-system`
- `/product-system/cases`
- `/product-system/clients`
- `/product-system/documents`
- `/product-system/settings`
- `/stitch-clone/[screen-name]`, blocked in production unless `ENABLE_STITCH_CLONE=true`.

## 7. UI And UX PRD

### 7.1 Public Website Experience

Public site direction:

- Dark luxury legal visual direction.
- High-contrast black, near-black, gold, stone, and white palette.
- Legal trust tone: confidential, structured, human-reviewed, no result promises.
- English default with Arabic `/ar` support.
- Public pages use `PublicShell`, localized content dictionaries, public cards, hero sections, directory filters, and motion classes.

Public navigation:

- Home, Services, Team, Insights/Articles, Case Studies, Media, Contact.
- CTA: Request Consultation.
- Client login icon links to `/login?next=/client`.
- Language switch links between default English and Arabic route variants.

Public content sources:

- Static typed dictionaries in `src/content/public-content.en.ts` and `src/content/public-content.ar.ts`.
- Public services from `src/content/public-services.ts`.
- DB-backed article and case-study routes for published content where database is available.
- Public content service caching exists for published article/case-study reads.

Public page requirements:

- Every public article and case study must include no-legal-advice and anonymization constraints.
- Public service pages must lead to booking without promising final legal outcomes.
- Public content must not display real client data, private documents, case numbers, or guaranteed legal results.
- Public APIs must return only published/anonymized DTOs.

### 7.2 Public Booking UX

Booking is chat-first, not a long public form.

Core behavior:

- User chooses conversation language in the chat.
- Chat collects name, phone, request area, summary, preferred mode, and appointment slot.
- AI extraction can help structure intake but cannot decide pricing, payment, slot confirmation, or legal advice.
- The assistant refuses legal-advice requests and redirects to booking/review.
- The chat should not ask users to upload documents publicly.
- The chat requires consent before saving a booking request.

Booking modes:

- `AI_CHAT_PAID`: chat is enabled, paid booking is required before appointment confirmation.
- `AI_CHAT_FREE`: chat is enabled, no payment attempt is created, appointment is confirmed from assistant flow for secretary review.
- Legacy `PAID_CHAT` maps to `AI_CHAT_PAID`.
- Legacy `MANUAL_REVIEW` maps to `AI_CHAT_FREE`.

Paid booking UX:

- The selected appointment is reserved temporarily.
- User reviews service, mode, appointment time, booking fee, expiry, and cancellation policy.
- User is redirected to hosted checkout.
- Return page reads status from server.
- Webhook/IPN is the payment source of truth.
- Receipt page is available only with signed token and paid status.

Important UX constraints:

- Failed or expired attempts should ask for a new slot unless provider retry guarantees are finalized.
- Provider checkout branding, Arabic/English language, and mobile behavior need real sandbox visual QA.
- Return page currently defaults to Arabic in current docs and should be reviewed if English checkout grows.

### 7.3 Client Portal UX

Primary protected client surface is `/client`. `/portal` remains compatibility.

Design:

- Dark client portal shell matching public legal-luxury tone.
- Arabic RTL protected portal.
- Header includes KMT brand, protected nav, user identity, logout, and link back to public site.
- Pages use portal panels, metrics, rows, tables, and dark-safe form controls.

Client portal capabilities:

- Dashboard summary.
- Own cases and case detail.
- Own visible files and upload form.
- Own court dates and consultation appointments.
- Own payment records and gateway attempts.
- Profile edit.
- Scoped client assistant.
- Human team chat.

Security UX:

- Client must only see own linked `Client` data.
- Unlinked Client-role accounts should get recoverable guidance, not raw errors.
- Internal notes must never appear in client views.
- Document visibility must be respected.

### 7.4 Admin UX

Admin design:

- Operational dashboard style, not marketing.
- Light admin shell using `DashboardShell`.
- Sidebar groups, top header, user label, notification bell, logout, page actions.
- Tables have mobile card renderers in several high-value pages.
- Search, filters, sort, pagination, badges, and action forms are standard patterns.

Admin capabilities:

- Dashboard metrics and operational lists.
- Consultation queue, detail, assign, review, reject, convert.
- Consultation availability management.
- Client CRM list/detail/create/edit/archive/assign/account link/password reset.
- Cases list/detail/status/session/calendar integration.
- Calendar list/create/reschedule.
- Tasks board/list/create/update.
- Documents list/upload/status/category/visibility/delete.
- Content hub for articles, case studies, social drafts, AI social draft.
- Finance invoices, reports, pricing rules, gateway settings, attempts, webhook events.
- User management, settings, audit log.
- Admin messages and client team chat inbox.
- Notifications for consultation review.

Admin UX risks to review:

- Admin text is largely Arabic in components and helpers. Public text uses typed locale dictionaries more strongly than admin text.
- Some settings are intentionally disabled or read-only, especially SMTP and Staff 2FA.
- Admin payment UX exists inside finance surfaces, but a dedicated operational payments/reconciliation page is still recommended.
- Dense tables and filters need repeated mobile overflow checks after every new column/action.

### 7.5 Design System

Current stack:

- Tailwind.
- Custom UI primitives in `src/components/ui`.
- Custom brand component in `src/components/brand/kmt-brand-logo.tsx`.
- Layout shells in `src/components/layout`.
- Design tokens in `src/lib/design-system/tokens.ts`.
- Motion utilities in `src/features/public-site/public-motion.ts` and `src/app/globals.css`.

Core tokens:

- Navy: `#0f172a`.
- Gold: `#997b44`.
- Gold dark: `#755a26`.
- Canvas: `#f8fafc`.
- Paper: `#ffffff`.
- Ink: `#0f172a`.
- Muted: `#64748b`.
- Border: `#e2e8f0`.
- Success: `#166534`.
- Warning: `#92400e`.
- Danger: `#991b1b`.

Typography:

- Arabic: IBM Plex Sans Arabic.
- Latin and numbers: Inter.
- Font display uses `swap`.

Radius and surfaces:

- Controls: 4px.
- Panels: 8px.
- Pills only for badges.
- Public/client surfaces are dark and restrained.
- Admin/product surfaces are lighter, operational, and dense.

Motion:

- CSS-only public motion.
- Reduced-motion support exists in globals.
- No new runtime animation dependency is currently required.
- Client portal disables public card beam motion where inappropriate.

### 7.6 Accessibility And Localization Requirements

Current support:

- Public shell sets `dir` and `lang` per public locale.
- Client portal uses RTL Arabic.
- Focus-visible styles exist.
- Icon-only buttons have labels in key shell areas.
- Public content includes English and Arabic dictionaries.
- API error localization maps common server messages to Arabic and selected English responses.

Review requirements:

- Audit all icon-only controls for accessible names.
- Audit long Arabic labels in buttons, filters, nav, tables, mobile cards, and forms.
- Audit mixed RTL/LTR values using `bdi` where needed.
- Audit public/admin/client text tokenization strategy. Public is dictionary-driven; admin is partly component-embedded.
- Verify all modals/dialogs/forms have labels, validation, disabled, loading, success, and error states.

## 8. Backend And Architecture PRD

### 8.1 Tech Stack

- Next.js `15.5.20`, App Router.
- React `18.2.0`.
- TypeScript `5.7.2`.
- Prisma `7.8.0`.
- PostgreSQL via Prisma adapter `@prisma/adapter-pg`.
- Tailwind `3.4.17`.
- Zod `4.4.3`.
- Nodemailer dependency present, but SMTP feature is disabled.
- Vitest, Testing Library, Playwright.
- Node engine: `>=20.19.0 <21 || >=22.12.0 <23 || >=24.0.0`.

### 8.2 Backend Structure

Backend code is split by domain under `src/server`:

- `auth`: session, password, RBAC, page guards, policy, TOTP placeholders.
- `http`: errors and pagination.
- `validation`: shared Zod parse helpers.
- `db`: Prisma client and database URL policy.
- `security`: origin guard.
- `rate-limit`: memory rate limiters.
- `audit`: audit service, redaction, audit presentation catalog.
- `observability`: analytics events and safe logging.
- `storage`: upload policy, private VPS file storage, document service, download headers.
- `public`: public content service.
- `contact`: contact message service.
- `consultations`: public booking, assistant, availability, booking mode settings.
- `admin`: dashboard, CRM, consultations, cases, calendar, tasks/documents, content/social, finance/reports, governance, contact messages, notifications.
- `portal`: client portal data and client account setup.
- `conversations`: client team chat and admin message inbox.
- `payments`: pricing, gateway settings, payment attempts, transactions, webhooks, providers, receipts.
- `ai`: provider gateway, config, schemas, safety, mock and OpenAI-compatible adapters.
- `email`: disabled email abstraction and templates.
- `install`: installer env, panel preflight, installer service.
- `health`: runtime readiness.
- `phone`: phone normalization.
- `config`: production readiness.

### 8.3 API Standards

API routes use:

- Explicit route handlers.
- Request IDs via `getRequestId`.
- Zod parsing for request bodies and query params.
- `jsonOk` and `jsonError` response helpers.
- `errorToResponse` with safe logging for unexpected errors.
- `Cache-Control: no-store` for API and protected responses.
- Auth context helpers for protected routes.
- Server-side permission and object-scope checks in services.

Error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable localized message",
    "details": [],
    "requestId": "req_xxx"
  }
}
```

Implemented error codes include:

- `BAD_REQUEST`
- `AUTH_REQUIRED`
- `UNAUTHENTICATED`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `FORBIDDEN`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `VALIDATION_ERROR`
- `CONFLICT`
- `TOO_MANY_REQUESTS`
- `RATE_LIMITED`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `FEATURE_DISABLED`
- `TWO_FACTOR_REQUIRED`
- `TWO_FACTOR_INVALID`
- `TWO_FACTOR_EXPIRED`
- `EMAIL_DELIVERY_FAILED`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_PROVIDER_TIMEOUT`
- `AI_OUTPUT_INVALID`
- `APPROVAL_REQUIRED`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_ERROR`

### 8.4 API Groups

Auth:

- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- Disabled 2FA placeholders under `/api/auth/2fa/*`

Public:

- `/api/public/services`
- `/api/public/services/[slug]`
- `/api/public/lawyers`
- `/api/public/lawyers/[slug]`
- `/api/public/articles`
- `/api/public/articles/[slug]`
- `/api/public/case-studies`
- `/api/public/case-studies/[slug]`
- `/api/public/contact`
- `/api/public/consultations`
- `/api/public/consultations/assistant`
- `/api/public/consultations/slots`
- `/api/public/consultations/checkout`
- `/api/public/payments/status`
- `/api/public/client-account/setup`

Client:

- `/api/client/assistant`
- `/api/client/messages`
- `/api/client/messages/[threadId]`
- `/api/client/messages/[threadId]/messages`
- `/api/portal/profile`

Admin:

- `/api/admin/dashboard`
- `/api/admin/clients`
- `/api/admin/clients/[clientId]`
- `/api/admin/clients/[clientId]/assign`
- `/api/admin/clients/[clientId]/archive`
- `/api/admin/clients/[clientId]/account`
- `/api/admin/clients/[clientId]/account/password`
- `/api/admin/cases`
- `/api/admin/cases/[caseId]`
- `/api/admin/cases/[caseId]/sessions`
- `/api/admin/cases/[caseId]/status`
- `/api/admin/calendar`
- `/api/admin/calendar/[appointmentId]/reschedule`
- `/api/admin/tasks`
- `/api/admin/tasks/[taskId]`
- `/api/admin/documents`
- `/api/admin/documents/[documentId]`
- `/api/admin/documents/[documentId]/delete`
- `/api/admin/consultations`
- `/api/admin/consultations/[consultationId]`
- `/api/admin/consultations/[consultationId]/assign`
- `/api/admin/consultations/[consultationId]/review`
- `/api/admin/consultations/[consultationId]/reject`
- `/api/admin/consultations/[consultationId]/convert`
- `/api/admin/consultation-availability`
- `/api/admin/content`
- `/api/admin/content/articles`
- `/api/admin/content/articles/[articleId]`
- `/api/admin/content/case-studies`
- `/api/admin/content/case-studies/[caseStudyId]`
- `/api/admin/content/social-drafts`
- `/api/admin/content/social-drafts/[draftId]`
- `/api/admin/content/social-drafts/ai`
- `/api/admin/finance`
- `/api/admin/finance/[paymentId]`
- `/api/admin/payments/pricing`
- `/api/admin/payments/pricing/[ruleId]`
- `/api/admin/payments/settings`
- `/api/admin/payments/attempts`
- `/api/admin/payments/webhooks`
- `/api/admin/payments/webhooks/[eventId]/replay`
- `/api/admin/reports`
- `/api/admin/users`
- `/api/admin/users/[userId]`
- `/api/admin/users/[userId]/password`
- `/api/admin/users/[userId]/client-profile`
- `/api/admin/users/[userId]/2fa/reset`
- `/api/admin/settings`
- `/api/admin/settings/[key]`
- `/api/admin/audit-log`
- `/api/admin/contact-messages`
- `/api/admin/contact-messages/[messageId]`
- `/api/admin/messages`
- `/api/admin/messages/[threadId]`
- `/api/admin/messages/[threadId]/messages`
- `/api/admin/notifications`
- `/api/admin/notifications/[notificationId]/read`

Files, install, health, analytics, webhooks:

- `/api/files/upload`
- `/api/files/[documentId]/download`
- `/api/install/status`
- `/api/install/preflight`
- `/api/install/bootstrap-super-admin`
- `/api/install/finish`
- `/api/health`
- `/api/analytics/events`
- `/api/webhooks/paytabs`
- `/api/webhooks/paymob`

### 8.5 Auth, Sessions, Roles, And Permissions

Auth model:

- Server-managed sessions with hashed session tokens.
- Session cookie name is centralized.
- Login issues an active session when staff 2FA is disabled.
- Logout clears/revokes session.
- `/api/auth/me` returns safe user data and permissions.

RBAC:

- Roles and permissions are in `src/server/auth/policy-data.json`.
- Policy helpers live in `src/server/auth/policy.ts`.
- Super Admin has global access.
- Permission format follows `resource.action.scope`.
- Service functions check permissions and object ownership/assignment.

Current 2FA state:

- TOTP/Email OTP support exists as schema/helpers/placeholders.
- Active staff 2FA is disabled in this release.
- Production readiness fails if `STAFF_2FA_MODE=totp`.
- `/login/2fa` and related 2FA routes are disabled placeholders.

Security review focus:

- Verify every protected API route uses `requireAuthContext` or equivalent guard.
- Verify every service checks object scope, not only page visibility.
- Verify client role users cannot open admin paths.
- Verify staff users cannot read unrelated assigned-only resources.
- Verify disabled 2FA cannot be accidentally enabled in production without full rework.

### 8.6 Data Model

Prisma schema currently contains these main domain models:

- Role
- Permission
- RolePermission
- User
- Session
- Client
- LawyerProfile
- LegalService
- ConsultationRequest
- Appointment
- LegalCase
- CaseParty
- CaseSession
- Document
- Task
- InternalNote
- Payment
- ConsultationPricingRule
- PaymentAttempt
- PaymentTransaction
- PaymentWebhookEvent
- StaffTwoFactorCredential
- EmailOtpChallenge
- EmailMessage
- AiProviderRun
- Article
- CaseStudy
- SocialPostDraft
- Notification
- ContactMessage
- ConversationThread
- ConversationMessage
- AuditLog
- AnalyticsEvent
- SystemSetting

Core data ownership rules:

- Client users can only read own linked Client data.
- Lawyers can read assigned client/case data.
- Office Admin can manage operational office data by permission.
- Marketing Staff can manage content drafts within approval constraints.
- Super Admin can manage users, roles, permissions, settings, audit, and all data.
- InternalNote is never client-visible.
- Document download requires both metadata permission and storage authorization.
- AI run metadata must not store raw prompts, document content, API keys, or raw provider responses.
- Email metadata must not store OTP values or sensitive bodies.

Database open gates:

- Clean migration and seed need runtime verification on a running PostgreSQL database.
- Seed idempotency needs real DB proof.
- Document download smoke needs real private `UPLOADS_DIR`.

### 8.7 Consultation Workflow

Public paid booking flow:

1. Visitor opens `/book-consultation`.
2. Chat collects language, contact, request area, summary, preferred mode, and slot.
3. AI extraction may populate draft fields with confidence checks.
4. Server validates appointment slot and duplicate rules.
5. Server resolves price through `ConsultationPricingRule`.
6. Server creates Client/ConsultationRequest as needed.
7. Server creates `Appointment` as `RESERVED`.
8. Server creates `PaymentAttempt`.
9. Hosted checkout URL is returned.
10. Provider webhook confirms payment.
11. Webhook creates/updates `PaymentTransaction`, marks attempt paid, creates `Payment`, confirms appointment, and creates secretary review notification.
12. Client may receive signed account setup link after successful confirmation.

Public free booking flow:

1. Same chat intake and slot selection.
2. No `PaymentAttempt`.
3. Appointment is scheduled directly from assistant flow.
4. Secretary review notification is created.

Admin consultation flow:

1. Staff opens `/admin/consultations`.
2. Staff reviews consultation detail.
3. Staff can assign lawyer, mark secretary review complete, reject, or convert to case.
4. Conversion can create/link Client, LegalCase, and optional appointment context.
5. Sensitive actions emit audit logs.

### 8.8 Payments

Payment v1 architecture:

`Booking -> Review -> PricingService -> active provider -> PaymentAttempt -> Hosted Checkout -> Verified Webhook/IPN -> Confirm Appointment`

Implemented payment concepts:

- `ConsultationPricingRule` for booking fee by service/mode.
- `PaymentAttempt` for provider-neutral checkout attempt and temporary slot hold.
- `PaymentTransaction` for provider transaction status.
- `PaymentWebhookEvent` for signature status, processing status, replay count, payload hash, and safe normalized payload.
- `Payment` for internal invoice/receipt record after trusted confirmation.
- Signed receipt URL for paid attempts.

Supported providers:

- PayTabs-compatible path.
- Paymob Hosted/Unified Checkout adapter.

Payment truth sources:

- Price comes from server-side pricing service only.
- Active provider comes from `payment.gateway` setting or `PAYMENT_PROVIDER`.
- Payment success comes from verified/idempotent webhook only.
- Receipt display requires signed token plus paid attempt and paid payment.
- AI cannot confirm payment, price, slot, or appointment.

Payment open work:

- Final provider decision and ADR update.
- PayTabs direct API details if template bridge is not enough.
- Sandbox credentials and live provider smoke.
- Invalid signature, duplicate webhook, failure, expiry, replay, reconciliation tests against provider sandbox.
- Manual payment verification workflow.
- Refund/dispute operations UI.
- Settlement import/export.
- Dedicated admin payments/reconciliation page.

### 8.9 Documents And File Storage

Current storage model:

- Private VPS filesystem storage.
- Default upload root: `/var/lib/kmt-legal/uploads`.
- `UPLOADS_DIR` must not be inside a public web directory.
- File keys are opaque/generated.
- Downloads stream through authorized app routes only.
- Nginx must not serve upload paths directly.

Upload policy:

- Default `MAX_UPLOAD_MB=5`.
- Allowlisted MIME types:
  - PDF
  - DOC
  - DOCX
  - JPEG
  - PNG
- Content length is rejected early for large multipart bodies.
- MIME/content magic bytes are validated.
- Download headers force attachment and safe filename handling.

Document workflow:

- Client upload through `/client/files` or compatibility portal.
- Admin upload through documents/tasks/case surfaces.
- Status: new, under review, needs clarification, accepted, rejected, deleted.
- Visibility: client visible, staff only, internal only.
- Upload/download/status/delete actions are audited.

### 8.10 AI Gateway

AI gateway characteristics:

- Server-side only.
- Provider-agnostic `generateStructured` flow.
- Mock provider for local/default development.
- OpenAI-compatible adapter for OpenRouter/OpenAI-compatible/local/custom providers.
- Output schemas are validated.
- Legal-review disclaimer is applied.
- Failures return safe API errors.
- Metadata is stored in `AiProviderRun` without raw prompts or raw provider responses.

Current AI uses:

- Public booking intake extraction.
- Consultation classification.
- Intake summary.
- Client assistant scoped inquiry.
- Admin social draft generation.
- Content/case study support in service layer.

AI constraints:

- No final legal advice.
- No document interpretation as final legal opinion.
- No payment/price/slot/payment-status authority.
- No raw sensitive body logging.
- Low-confidence extraction falls back to recovery prompts.

### 8.11 Analytics And Observability

Current implementation:

- Internal `AnalyticsEvent` table.
- Client-side analytics endpoint.
- Event taxonomy in `src/lib/analytics-events.ts`.
- Safe logging helper.
- Request IDs.
- Runtime readiness endpoint at `/api/health`.
- Production headers include release metadata.

Privacy constraints:

- Do not send names, case summaries, private document contents, raw prompts, payment data, tokens, or secrets to analytics.
- Actor identifiers are hashed.
- Properties are allowlisted.

Open work:

- External observability provider.
- Alerts.
- Dashboards.
- Retention jobs.
- Release tracking and error aggregation.

### 8.12 Installer, Deployment, And Runtime Readiness

Installer:

- Token-protected `/install`.
- Hosting mode preflight for Terminal VPS, aaPanel, and conditional cPanel.
- First Super Admin bootstrap.
- Installer completion setting and filesystem lock.
- Installer must be disabled and locked before production opens.

Deployment:

- Current default target is aaPanel + PM2.
- Default server command:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

Runtime readiness:

- `/api/health` returns `200` only when required env, database, schema, seed, first Super Admin, and installer lock checks pass.
- Production app/admin/client entry routes are readiness-gated.
- Public pages are split into public route groups so they avoid protected readiness gate where safe.

Open deployment gates:

- Run DB-backed staging smoke.
- Run live public/admin smoke.
- Verify private uploads path and backups.
- Verify Nginx/TLS/PM2/Cloudflare cache behavior.
- Archive deploy evidence before claiming production readiness.

## 9. Security And Privacy Requirements

Must keep:

- No real secrets committed.
- No real client data in seeds.
- No direct serving of uploads.
- No internal notes in client portal.
- No raw AI prompts/provider payloads in logs.
- No raw provider webhook payload storage unless allowlisted and safe.
- No wildcard CORS.
- No client-side secrets.
- No `NEXT_PUBLIC_*` for private config.
- No production SMTP or Staff TOTP activation until explicitly reworked and tested.
- State-changing API routes must pass origin guard.
- API/protected routes must be no-store.
- Public pages may be cacheable only when no private data is embedded.

Security headers:

- CSP.
- X-Content-Type-Options.
- X-Frame-Options.
- Referrer-Policy.
- Permissions-Policy.
- COOP/CORP.
- DNS prefetch off.

Middleware:

- Blocks Stitch clone in production unless enabled.
- Enforces origin/referer checks for `/api/*` mutations.
- Redirects protected app paths to login when no session cookie exists.

## 10. Testing And QA

Current test surfaces:

- Server tests for auth, audit, contracts, storage, seed, consultations, portal access, client account setup, admin domains, AI gateway, analytics, security hardening, health, installer, payment gateway, conversations, public content/localization.
- UI tests for public pages and product components.
- E2E tests for MVP smoke, DB-backed smoke, public luxury visual, booking chat validation, live admin smoke, Stitch clone, RTL/select spacing.

Core commands:

```bash
npm run db:validate
npm run db:generate
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e:smoke
npm run qa:db
npm run qa:release
npm run security:secrets
npm run security:audit
npm run security:audit:all
```

Required QA before production-ready claim:

- Real PostgreSQL migrate/seed twice.
- DB-backed login/admin/client/booking/upload/download smoke.
- Provider sandbox checkout/webhook smoke.
- Public desktop/mobile visual QA.
- Protected admin/client mobile overflow QA.
- Live deployed public/admin smoke.
- Health endpoint release verification.
- Private upload and backup verification.
- Cloudflare/aaPanel cache behavior verification.

## 11. Important Current Gaps To Ask The Reviewer About

Highest-impact review questions:

1. Is the current backend authorization coverage complete across all admin/client/API services?
2. Are there any API routes with weak object-scope checks, especially documents, cases, clients, conversations, payments, and admin messages?
3. Is the paid booking state machine safe around expiry, duplicate bookings, webhook replay, invalid signature, failure, and already-paid attempts?
4. Does the admin finance/payment UX need a dedicated operational page before launch?
5. Is the public booking chat UX clear enough for non-technical users in Arabic and English?
6. Is the Arabic/English localization architecture sufficient, or should admin/client text move to structured dictionaries too?
7. Are the Prisma indexes sufficient for list/search/filter paths at expected office scale?
8. Does analytics avoid PII and legal-sensitive text in every event path?
9. Does the installer/deploy flow have enough protection against stale builds, wrong DB URL, exposed uploads, and unlocked installer?
10. Are SMTP and Staff 2FA disabled states clear enough for production, or should the UI hide/label them more strongly?

Backend improvements likely worth considering:

- Dedicated permission/route manifest audit tool.
- Contract tests for every route family, including denied object-scope paths.
- Shared-storage rate limiting for multi-instance deployment.
- Background job or scheduled cleanup for expired payment attempts, old sessions, analytics retention, OTP/email deferred rows, and stale upload files.
- Dedicated admin payment operations page.
- Manual payment workflow with proof attachment, verification, and audit trail.
- Refund/dispute/settlement workflow.
- Provider-specific webhook signature and payload contract tests from real sandbox samples.
- Formal data retention policy.
- External observability integration.

UI/UX improvements likely worth considering:

- Dedicated visual QA screenshots for booking payment review, return page, client payments, admin finance, admin messages, and mobile admin tables.
- Admin/client text localization/tokenization cleanup.
- Information architecture review of admin nav groups as features grow.
- More explicit empty/loading/error/success states in dense admin forms.
- Better English return/payment surfaces if English paid checkout becomes important.
- Dedicated reconciliation UX for finance staff.
- Accessibility audit for icon-only buttons, tables, form errors, focus order, and chat behavior.

## 12. Definition Of Done For Future Recommendations

Any proposed update should include:

- User or business outcome.
- Affected surfaces and routes.
- Exact files or modules likely affected.
- Backend impact.
- Data model or migration impact.
- Auth/permission impact.
- API contract impact.
- UI/UX impact.
- Localization/text impact.
- Security/privacy impact.
- Tests to add or update.
- Verification commands.
- Deployment and rollback notes if production-affecting.
- Whether the change is P0/P1/P2/P3.

## 13. Prompt To Give The Other Model

Copy this prompt to the second model:

```text
أنت المراجع الثاني لمشروع KMT Legal Platform. راجع الريبو بالكامل كأنك Principal Engineer + Product Designer + Security Reviewer.

هدفك: اقترح علينا أنا وصاحب المشروع تعديلات كاملة ومترتبة بالأولوية على المنتج الحالي، وتشمل UI/UX والBackend والDB والAuth والAPI والPayments والAI والDeployment والTesting والSecurity والLocalization.

ابدأ بقراءة هذه الملفات:
- docs/KMT_LEGAL_CURRENT_PROJECT_PRD_FOR_REVIEW.md
- PROJECT_GUIDE.md
- docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md
- docs/KMT_LEGAL_BACKEND_AUDIT.md
- docs/KMT_LEGAL_UI_UX_AUDIT.md
- docs/PLAN_33_PAYMENT_GATEWAY.md
- specs/kmt-legal-platform/contracts/openapi-plan.md
- specs/kmt-legal-platform/data-model.md
- prisma/schema.prisma
- package.json
- src/middleware.ts
- src/server/**
- src/app/api/**
- src/app/**
- src/features/**
- src/components/**
- src/content/**
- tests/**

مهم جدا:
- لا تراجع من أسماء الملفات فقط. افتح الملفات الحقيقية.
- لا تفترض أن المشروع production-ready إلا إذا وجدت verification حقيقي.
- افصل بين المطبق فعلا، والمخطط فقط، والمفتوح أو المتعطل.
- اذكر كل finding بمستوى أولوية P0/P1/P2/P3، ومعه path أو evidence واضح.
- ركز على المشاكل التي قد تكسر الثقة، الأمان، الدفع، بيانات العملاء، الصلاحيات، أو تجربة الحجز.
- لا تقترح rewrite كامل إلا لو عندك دليل قوي.
- لا تقترح إضافة مكتبات UI جديدة إلا لو لا يوجد بديل عملي داخل النظام الحالي.
- عند اقتراح تعديل، اذكر الملفات المتأثرة، الاختبارات المطلوبة، ومخاطر التنفيذ.

المخرجات المطلوبة:
1. Executive summary.
2. أهم 10 مشاكل أو فرص تحسين مرتبة بالأولوية.
3. Backend/API/Auth/Data audit findings.
4. Payment gateway and booking state-machine audit.
5. UI/UX audit for public, booking, client portal, and admin.
6. Security/privacy/localization/accessibility findings.
7. Missing tests and verification gaps.
8. Recommended roadmap:
   - Phase 1: release blockers.
   - Phase 2: high-confidence improvements.
   - Phase 3: polish and scale.
9. Specific questions you need us to answer before implementation.
10. A practical implementation plan for the first 3 improvements.
```

## 14. Reviewer Output Format We Should Ask For

Ask the second model to return findings in this format:

```markdown
## Finding <number>: <short title>
Priority: P0/P1/P2/P3
Area: UI/UX | Backend | DB | Auth | API | Payment | AI | Deployment | Tests | Localization | Security
Evidence:
- <file path>: <what was observed>
Impact:
- <why it matters>
Recommendation:
- <what to change>
Implementation notes:
- <likely files/modules>
Verification:
- <tests/commands/manual QA>
Risk:
- <what could break>
```

## 15. Recommended First Review Passes

If the other model has limited time, ask it to review in this order:

1. Payment booking state machine: checkout, reserved appointment, webhook confirmation, expiry, duplicate booking, replay, receipt.
2. Authorization and object ownership: client portal, documents, cases, conversations, admin messages, payments.
3. Public booking UX: Arabic/English chat clarity, consent, no legal advice, error recovery, payment review.
4. Admin finance/payment operations: pricing, attempts, webhooks, manual fallback, reconciliation.
5. Deployment readiness: health endpoint, install lock, DB URL, uploads path, aaPanel cache, PM2 release verification.
6. Localization and text architecture: public dictionaries versus admin/client hardcoded text.
7. Test gaps: DB-backed E2E, provider sandbox, denied-path contract tests, responsive visual QA.

## 16. Suggested Decision Criteria For Us

When we receive the second model's recommendations, we should approve work using these criteria:

- Fix P0/P1 security, auth, payment, data loss, or production release blockers first.
- Prefer shared service or contract fixes over one-off page fixes.
- Do not change public API contracts without updating tests and consumers.
- Do not expand payment live scope until sandbox evidence exists.
- Do not enable SMTP or Staff 2FA as small toggles. They need separate implementation plans.
- Keep `/stitch-clone/*` isolated and production-disabled unless explicitly needed for visual QA.
- Keep public site cacheable only when pages remain private-data-free.
- Keep every AI output clearly review-gated and non-advisory.
