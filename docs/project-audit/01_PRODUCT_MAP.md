# 01 — Product Map (code as authority, 2026-09-20)

Scope: complete high-level map of the KMT Legal platform as it exists in the
repository TODAY. Route inventory verified against `src/app`; models against
`prisma/schema.prisma`; APIs against `src/app/api`.

Conventions: `(public-en)` renders EN/LTR at `/…`; `(public-ar)` renders AR/RTL
at `/ar/…` plus payment return/receipt; `(client)` = `/client/*`; `(app-ar)` =
`/admin/*`. No `src/app/layout.tsx` — each group owns its root layout.

## PUBLIC SITE — Status: WORKING / Confidence: HIGH

- Routes (10 EN + AR mirror): `/`, `/services`, `/services/[slug]`, `/team`,
  `/team/[slug]`, `/contact`, `/book-consultation`, `/client-account/setup`,
  `/privacy`, `/terms`; AR via `src/app/(public-ar)/ar/[[...path]]/page.tsx`
  (static params only for those paths; everything else `notFound()`).
- Main components: `src/features/public-site/public-pages.tsx`
  (`HomePageView`, `ServicesPageView`, `ContactPageView`,
  `BookConsultationPageView`), `src/components/layout/public-header.tsx`
  (locked Resizable Navbar + Menu + Sheet/Tooltip), `public-shell.tsx`
  (footer), `public-floating-dock.tsx` (booking + WhatsApp).
- APIs: `src/app/api/public/services*`, `lawyers*`, `contact`, `consultations*`,
  `client-account/setup`, `payments/status`.
- Models: `LegalService`, `LawyerProfile`, `ContactMessage`,
  `ConsultationRequest`, `PaymentAttempt`.
- Dependencies: `LegalService`/`LawyerProfile` CMS data seeded via Prisma;
  WhatsApp deep-link env `NEXT_PUBLIC_KMT_WHATSAPP_URL`.
- Evidence: Phase 13 public census (all 200, unknown 404), smoke 42/42,
  build 40/40.

## CLIENT PORTAL — Status: PARTIAL / Confidence: MEDIUM

- Routes (7): `/client`, `/client/cases`, `/client/cases/[caseId]`,
  `/client/files`, `/client/court-dates`, `/client/payments`,
  `/client/assistant`, `/client/profile`.
- Main components: `src/features/client/*`, `src/features/portal/*`
  (`ClientAssistantPanel`, `ClientTeamChatPanel`, `DocumentUploadForm`,
  `ProfileForm`).
- APIs: `src/app/api/client/profile`, `preferences`, `messages*`, `assistant`;
  shared `src/app/api/files/upload`, `files/[documentId]/download`.
- Models: `Client`, `LegalCase`, `CaseSession`, `Appointment`, `Document`,
  `Payment`, `PaymentAttempt`, `ConversationThread`, `ConversationMessage`.
- Status rationale: read + upload + chat + deterministic assistant verified in
  code; no appointment booking/cancel, no in-portal payment creation, no
  standalone chat/notifications routes. Chat polls at 5s (no realtime).

## ADMIN PANEL — Status: PARTIAL / Confidence: MEDIUM

- Routes (27): `/admin`, `/cases`, `/cases/new`, `/cases/[caseId]`,
  `/calendar`, `/clients`, `/clients/[clientId]`, `/users`, `/users/[userId]`,
  `/roles`, `/tasks`, `/documents`, `/messages`, `/messages/[threadId]`,
  `/finance`, `/reports`, `/notifications`, `/settings`, `/audit-log`,
  `/consultations`, `/consultations/[consultationId]`,
  `/consultation-availability`, `/contact-messages`, `/content`,
  `/content/articles`, `/content/case-studies`, `/content/social`.
- Main components: `src/features/admin/*` (forms, inboxes, panels).
- APIs: 63 routes under `src/app/api/admin/*`.
- Models: all core models (see file 13).
- Status rationale: broad CRUD verified in code; gaps: client-create UI
  disabled despite service existing; calendar no cancel/delete UI; reports
  read-only without export; content no delete endpoints.

## AUTH — Status: WORKING (2FA DISABLED) / Confidence: HIGH

- Routes: `/login`, `/login/2fa` (always `notFound`), `/install`.
- APIs: `src/app/api/auth/login|logout|me`, `2fa/*` (all `503
  FEATURE_DISABLED`), `src/app/api/install/*`.
- Models: `User`, `Role`, `Permission`, `RolePermission`, `Session`,
  `StaffTwoFactorCredential`, `EmailOtpChallenge`.
- Core: custom DB sessions (`kmt_session`, sha256-stored), scrypt passwords,
  7 roles, ~64 permissions, server-side enforcement in services.
  2FA code exists but `STAFF_2FA_MODE=disabled`; no self-service reset.

## BOOKING — Status: PARTIAL / Confidence: MEDIUM

- Entry: `/book-consultation` → `consultation-booking-chat.tsx` (conversational
  wizard, no stepper) → `POST /api/public/consultations/assistant`
  → slots (`GET …/slots`) → checkout (`POST …/checkout`) → provider.
- Models: `ConsultationRequest`, `Appointment`, `Client`,
  `ConsultationPricingRule`, `PaymentAttempt`.
- Protections verified: serializable conflict TX, idempotent attempts,
  price re-validation, 24h duplicate guard, expiry sweeper.
- PARTIAL because live charge + webhook delivery need production env
  (Paymob keys, public webhook URL).

## CONSULTATIONS (review pipeline) — Status: PARTIAL / Confidence: MEDIUM

- Admin review queue with states `NEW|REVIEWING|PAYMENT_PENDING|SCHEDULED|
  REJECTED|CONVERTED` + outcome `PENDING|AWAITING_RESULT|MISSED|SUCCESSFUL|
  NO_SHOW|CANCELLED`; actions assign/review/reject/schedule/convert/outcome/
  reopen with optimistic locking.
- DB-complete, service-tested; runtime scheduling/use is operational process.

## CLIENT CRM — Status: PARTIAL / Confidence: MEDIUM

- List/detail/assign/archive/account-link/password-reset via
  `client-crm-service.ts`; `Client` model with `LEAD|ACTIVE|INACTIVE|
  ARCHIVED|DELETED`.
- Gap: create-client UI disabled (`createAdminClient` unreachable from UI).

## CASES — Status: PARTIAL / Confidence: MEDIUM

- Manual create (`/admin/cases/new`), detail with sessions/appointments/tasks/
  documents/notes tabs, status transitions, `internalFileNumber` unique.
- Models: `LegalCase`, `CaseParty`, `CaseSession`, `InternalNote`.

## APPOINTMENTS (calendar) — Status: PARTIAL / Confidence: MEDIUM

- List/create/reschedule with serializable overlap guard; types/modes/status
  enums; no cancel/delete UI, no reminders scheduler.

## COURT DATES — Status: PARTIAL / Confidence: MEDIUM

- `CaseSession` log per case (admin create); client sees sessions in case
  detail + `/client/court-dates` list. No hearing-reminder automation.

## TASKS — Status: WORKING (static) / Confidence: MEDIUM

- CRUD + filters + overdue view + optimistic concurrency; statuses incl.
  `OVERDUE`; no recurring tasks, no notifications on assignment.

## DOCUMENTS — Status: PARTIAL / Confidence: MEDIUM

- Shared upload API with server allowlist + magic bytes + ClamAV gate;
  visibility `CLIENT_VISIBLE|STAFF_ONLY|INTERNAL_ONLY`; soft-delete only
  (bytes retained); download authorization server-side.
- PARTIAL: ClamAV required in prod (env-gated), no versioning, no client
  delete/rename.

## PAYMENTS — Status: PARTIAL / Confidence: MEDIUM

- Paymob live path (Intention API + HMAC-SHA512 webhook + idempotent inbox +
  replay); PayTabs standby (template checkout, webhook verify coded).
- Models: `Payment`, `PaymentAttempt`, `PaymentTransaction`,
  `PaymentWebhookEvent`, `ConsultationPricingRule`.
- PARTIAL: needs prod keys/URLs; no refund API (record-only reversals).

## FINANCE (manual invoices) — Status: PARTIAL / Confidence: MEDIUM

- Manual invoice CRUD + CSV export + attempts/webhooks/pricing admin tabs;
  no taxes/line-items; gateway methods blocked from manual PAID.

## MESSAGES — Status: PARTIAL / Confidence: MEDIUM

- Contact inbox (`NEW→REVIEWED→ARCHIVED`); admin↔client threads with 5s
  polling; no attachments, no read receipts, no realtime.

## NOTIFICATIONS — Status: PARTIAL / Confidence: MEDIUM

- In-app only; triggers for consultation review/outcome + contact messages;
  30s bell poll; no client push/email/SMS; several `NotificationType`s have
  no triggers (NOT WIRED).

## AI — Status: PARTIAL (default MOCK) / Confidence: MEDIUM

- Gateway supports `mock|openrouter|openai-compatible|local|custom`
  (default mock); strict-JSON + zod + no-legal-advice guard + `AiProviderRun`
  audit; outputs never auto-publish.
- Client assistant is deterministic (no LLM); public booking uses
  `booking_intake_extraction` with deterministic fallback.

## CONTENT MANAGEMENT — Status: ADMIN ONLY (public hidden) / Confidence: HIGH

- Articles / case studies / social drafts CRUD + AI draft + publish states;
  public pages hidden (`notFound`) but public JSON APIs still serve
  PUBLISHED rows (leak, see file 20 P1).
- No delete endpoints; no scheduled publishing (no cron); no SEO fields.

## SETTINGS — Status: ADMIN ONLY / Confidence: MEDIUM

- Generic `SystemSetting` KV via `GET|PATCH /api/admin/settings`;
  opaque key-value UI.

## USERS — Status: ADMIN ONLY / Confidence: MEDIUM

- Invite/status/role/password/2FA-reset/link-client; Super-Admin-only
  password changes with live session revalidation.

## ROLES — Status: ADMIN ONLY / Confidence: HIGH

- Role/permission editor, exact-Super-Admin + dual-permission server gate.

## AUDIT LOG — Status: ADMIN ONLY / Confidence: MEDIUM

- Append-heavy `AuditLog` with filters; PII redaction in metadata.

## INSTALL — Status: WORKING (gated) / Confidence: MEDIUM

- Token-gated installer (preflight → bootstrap Super Admin → finish lock);
  `notFound` when disabled; blocks readiness until completed.

## PAYMENT RETURN — Status: WORKING (static) / Confidence: MEDIUM

- `/payment/consultation/return` (token-gated status + poller + retry +
  receipt/account links); live PAID confirmation needs provider round-trip.

## RECEIPTS — Status: WORKING (static) / Confidence: MEDIUM

- `/payment/consultation/receipt` (HMAC v2 token, PAID-only, reversals
  excluded); printable document component.

## DEPLOYMENT — Status: PARTIAL / Confidence: MEDIUM

- aaPanel + PM2 scripts, Nginx example, systemd example, pg_dump backup,
  health-gated deploy, no rollback script, no cron in repo (maintenance via
  PM2 `jobs:payments:watch`).
