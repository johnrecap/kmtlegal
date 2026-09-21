# 13 — Database, API & Integrations

DB: PostgreSQL via Prisma (`prisma/schema.prisma`). All PKs `String uuid`.
36 models, 38 enums. Confidence HIGH for structure (schema read); MEDIUM
for runtime behavior (no live DB exercised here).

## Models (purpose / keys / relations / delete / used-by)

| Model | Purpose / key fields | Relations / delete | Used by |
|---|---|---|---|
| `Role` | RBAC role (`name` unique, `status`) | → users, permissions | auth, roles admin |
| `Permission` | catalog (`key` unique) | → roles | guards |
| `RolePermission` | join (`@@id`) | both Cascade | roles admin |
| `User` | staff identity (email unique, scrypt hash, `UserStatus`, locale, `deletedAt`) | role Restrict; 20+ relations | auth, users, everything staff |
| `Session` | cookie session (`tokenHash` unique, `SessionStatus`, 2FA fields) | user Cascade | auth |
| `Client` | CRM record (`userId?` unique, phones, `ClientStatus`) | user/lawyer SetNull; cases Restrict | CRM, portal, booking |
| `LawyerProfile` | public page + booking flag (`publicSlug` unique) | user Cascade | team pages, booking |
| `LegalService` | services CMS (`slug` unique, `isPublished`) | none | public services |
| `ConsultationRequest` | intake + review/outcome (`ConsultationStatus`, `ConsultationOutcomeStatus`, `outcomeVersion`) | client/lawyer SetNull; case link unique | booking, review, outcomes |
| `Appointment` | calendar event (type/mode/status, times) | client Restrict; others SetNull | calendar, booking, portal |
| `LegalCase` | matter (`internalFileNumber` unique, `CaseStatus/Priority`) | client/lawyer Restrict | cases, portal |
| `CaseParty` | parties roster | case Cascade | case detail |
| `CaseSession` | court log (`appointmentId?` unique) | case Cascade | cases, portal |
| `Document` | file metadata (`fileKey` unique, category/status/visibility, `deletedAt`) | owner/case SetNull | files, cases, portal |
| `Task` | staff tasks (status incl. OVERDUE, priority, due) | assignee/creator Restrict; case SetNull | tasks |
| `InternalNote` | case notes (visibility, `deletedAt`) | case Cascade | case detail |
| `Payment` | invoice (`invoiceNumber` unique, Decimal 12,2, `PaymentStatus`, receipt) | client Restrict; attempt SetNull | finance, portal |
| `ConsultationPricingRule` | price versions (category×mode, effectiveFrom, version) | updater SetNull | checkout, pricing admin |
| `PaymentAttempt` | checkout attempt (`idempotencyKey` unique, provider order unique, expiry) | consultation/appointment Cascade | checkout, webhooks |
| `PaymentTransaction` | provider tx (`@@unique(provider,txId)`, sticky PAID) | attempt Cascade | webhooks |
| `PaymentWebhookEvent` | inbox (`@@unique(provider,eventId)`, sig/proc status, replayCount, hashes) | attempt/tx SetNull | webhooks, replay |
| `StaffTwoFactorCredential` | TOTP secret (`userId` unique, encrypted) | user Cascade | 2FA (disabled) |
| `EmailOtpChallenge` | email OTP (purpose, hash, expiry) | user Cascade | 2FA (disabled) |
| `EmailMessage` | email audit (hashed recipient, no PII) | user SetNull | email (disabled) |
| `AiProviderRun` | AI audit (provider/model/task/review/latency/usage) | creator SetNull | AI tasks |
| `Article` | blog (`@@unique(locale,slug)`, `ContentStatus`) | author Restrict | CMS |
| `CaseStudy` | studies (anonymized, approval states) | approver SetNull | CMS |
| `SocialPostDraft` | social queue (platform/status/scheduledAt) | creator/approver | CMS |
| `Notification` | in-app (dedupe unique, `readAt`) | user Cascade | bell, center |
| `ContactMessage` | inbox (`ContactMessageStatus`) | reviewer SetNull | contact, inbox |
| `ConversationThread` | chat thread (status, assignee) | client Cascade | messages |
| `ConversationMessage` | message (TEXT body, sender type) | thread Cascade | messages |
| `AuditLog` | trail (actor SetNull, resource refs, Json meta) | none beyond actor | audit-log |
| `AnalyticsEvent` | first-party analytics (actor hashed, Json props) | none | analytics |
| `SystemSetting` | KV (`key` unique, Json value) | updater SetNull | settings, availability, gateway |
| `RateLimitCounter` | DB rate limit (`@@id(scope,keyHash,window)`) | none | rate limiting |

## API table (method / auth / input / DB-service / output / status)

Auth: `P`=public+rate-limit, `A`=session, `S`=staff, `C`=client-portal, `W`=HMAC webhook, `I`=installer-gated.

| API | Method | Auth | DB/Service | Status |
|---|---|---|---|---|
| `/api/auth/login` | POST | P | `loginWithPassword`, Session | WORKING/HIGH |
| `/api/auth/logout` | POST | A | session revoke | WORKING/HIGH |
| `/api/auth/me` | GET | A | `safeUser` | WORKING/HIGH |
| `/api/auth/2fa/*` (3) | POST | A | 2FA service | DISABLED/HIGH |
| `/api/public/contact` | POST | P | `ContactMessage` | PARTIAL/MED |
| `/api/public/consultations` | POST | P | legacy, always 409 | DISABLED/HIGH |
| `/api/public/consultations/slots` | GET | P | availability + sweeper | PARTIAL/MED |
| `/api/public/consultations/checkout` | POST | P | checkout TX + Paymob | PARTIAL/MED |
| `/api/public/consultations/assistant` | POST | P | booking convo + AI extract | PARTIAL/MED |
| `/api/public/client-account/setup` | POST | P | HMAC token → user link | PARTIAL/MED |
| `/api/public/payments/status` | GET | P(token) | attempt DTO | PARTIAL/MED |
| `/api/public/services(+/[slug])` | GET | P | `LegalService` | WORKING/MED |
| `/api/public/lawyers(+/[slug])` | GET | P | `LawyerProfile` | WORKING/MED |
| `/api/public/articles(+/[slug])` | GET | P | `Article` PUBLISHED | PUBLIC HIDDEN (leak)/HIGH |
| `/api/public/case-studies(+/[slug])` | GET | P | `CaseStudy` PUBLISHED+anon | PUBLIC HIDDEN (leak)/HIGH |
| `/api/client/profile` | GET,PATCH | C | scoped client/user | PARTIAL/MED |
| `/api/client/preferences` | PATCH | C | locale | PARTIAL/MED |
| `/api/client/messages(+/[threadId]+/messages)` | GET,POST | C | threads | PARTIAL/MED |
| `/api/client/assistant` | POST | C | deterministic organizer | PARTIAL/MED |
| `/api/files/upload` | POST | A/C | `uploadDocument` | PARTIAL/MED |
| `/api/files/[documentId]/download` | GET | A/C | authorized download | PARTIAL/MED |
| `/api/webhooks/paymob` | POST | W | `handlePaymentWebhook` | PARTIAL/MED |
| `/api/webhooks/paytabs` | POST | W | `handlePaymentWebhook` | PARTIAL/MED |
| `/api/admin/dashboard` | GET | S | aggregates | PARTIAL/MED |
| `/api/admin/cases(+/[caseId]+/status+/sessions)` | GET,POST,PATCH | S | case ops | PARTIAL/MED |
| `/api/admin/calendar(+/[id]/reschedule)` | GET,POST | S | appointments + guard | PARTIAL/MED |
| `/api/admin/clients(+/[id]+/assign|archive|account|account/password)` | GET,POST,PATCH | S | CRM service | PARTIAL/MED |
| `/api/admin/users(+/[id]+/password|client-profile|2fa/reset)` | GET,POST,PATCH | S | governance (super-gated) | ADMIN ONLY/MED |
| `/api/admin/roles(+/[roleId]/permissions)` | GET,POST,PATCH | S | role service (super-gated) | ADMIN ONLY/HIGH |
| `/api/admin/tasks(+/[taskId])` | GET,POST,PATCH,DELETE | S | task service | PARTIAL/MED |
| `/api/admin/documents(+/[id]+/delete)` | GET,PATCH,POST | S | doc service | PARTIAL/MED |
| `/api/admin/messages(+/[threadId]+/messages)` | GET,POST,PATCH | S | conversations | PARTIAL/MED |
| `/api/admin/finance(+/[paymentId]|/export)` | GET,POST,PATCH | S | finance service | PARTIAL/MED |
| `/api/admin/payments/attempts|pricing(+/[ruleId])|settings|webhooks(+/[eventId]/replay)` | GET,POST,PATCH | S | payment ops | PARTIAL/MED |
| `/api/admin/consultations(+/[id]+7 actions)` | GET,POST | S | review + outcome svcs | PARTIAL/MED |
| `/api/admin/consultation-availability` | GET,PUT | S | availability settings | PARTIAL/MED |
| `/api/admin/contact-messages(+/[messageId])` | GET,PATCH | S | inbox | PARTIAL/MED |
| `/api/admin/content(+articles/case-studies/social-drafts(+ai))` | GET,POST,PATCH | S | content service + AI | ADMIN ONLY/MED |
| `/api/admin/settings(+/[key])` | GET,PATCH | S | `SystemSetting` | ADMIN ONLY/MED |
| `/api/admin/reports` | GET | S | aggregates | PARTIAL/MED |
| `/api/admin/audit-log` | GET | S | `AuditLog` | ADMIN ONLY/MED |
| `/api/admin/notifications(+/[id]/read)` | GET,POST | S | notifications | PARTIAL/MED |
| `/api/analytics/events` | POST | mixed | `AnalyticsEvent` | PARTIAL/LOW |
| `/api/health` | GET | open | readiness | WORKING/MED |
| `/api/install/*` (4) | — | I | installer service | WORKING/MED |

## External integrations (only what is imported)

| Integration | Mechanism | Status |
|---|---|---|
| Paymob | custom `fetch` Intention API + HMAC-SHA512 webhooks; keys `PAYMOB_*` | PARTIAL (env-gated) |
| Paytabs | template checkout + HMAC-SHA256 webhooks; `PAYTABS_ENABLED=false` | DISABLED/standby |
| Email (SMTP) | `nodemailer`, `SMTP_FEATURE_AVAILABLE=false` | DISABLED |
| WhatsApp | frontend deep-link only, no API | NOT WIRED (link only) |
| AI | OpenAI-compatible `fetch`, default mock | MOCK default; live env-gated |
| Storage | local VPS fs; no S3/R2 | WORKING (single-node assumption) |
| Analytics | first-party DB + Sentry SDK (flag-gated) | PARTIAL |
| ClamAV | TCP/socket scan, prod-required | UNKNOWN (env-gated) |
| Cron | none in repo (PM2 worker external) | NOT WIRED in repo |
