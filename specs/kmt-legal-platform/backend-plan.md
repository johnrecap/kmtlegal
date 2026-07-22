# backend-plan.md

## Backend Modules

| Module | Responsibilities | Entities | Endpoints/Actions | Validation | Permissions | Events/Jobs | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Auth | login/logout/session/current user/staff password login; 2FA disabled placeholders | User, Role, dormant StaffTwoFactorCredential, dormant EmailOtpChallenge | auth actions/routes | credentials/session; TOTP and Email OTP disabled | N/A/session | login audit | auth unit/integration |
| Permissions | role/permission checks | Role, Permission | helpers | permission key schema | all protected ops | denied audit optional | matrix tests |
| Public Content | published services/lawyers/articles/studies | LegalService, LawyerProfile, Article, CaseStudy | public GETs | slug/filter | public published only | page_view events | route tests |
| Consultation | intake/review/convert | ConsultationRequest, Client, Case, Appointment, AiProviderRun | public create/admin review | intake schemas | consultation.* | AI Gateway, email, audit | E2E/integration |
| Clients CRM | client records | Client, User | admin clients | client schemas | client.* | audit | service tests |
| Cases | case lifecycle | Case, CaseParty, CaseSession | admin cases/sessions | status/session schemas | case.*, session.* | audit | service/E2E |
| Documents | upload/download/status | Document | upload/download/status | 5MB file metadata and MIME/content validation | document.* | upload/download audit, scan hook later | upload tests |
| Appointments | schedule/calendar | Appointment | calendar/appointments | date/conflict | appointment.* | reminder job later | conflict tests |
| Tasks | task board | Task | tasks CRUD | task schemas | task.* | overdue job later | service tests |
| Content/Social | articles/studies/drafts | Article, CaseStudy, SocialPostDraft, AiProviderRun | content CRUD/approval | content schemas | content.*, caseStudy.*, socialDraft.* | AI Gateway, audit | workflow tests |
| Finance | invoice basics/reports | Payment | finance/reports | invoice schemas | finance.*, report.* | audit | service tests |
| Email | Deferred SMTP/templates | EmailMessage | internal helper | email template schemas | internal/system | disabled metadata | service tests |
| Users/Settings/Audit | governance | User, Role, SystemSetting, AuditLog | users/settings/audit | role/settings schemas | user.*, settings.*, audit.* | audit | privilege tests |
| Telemetry | events/logging | AuditLog plus event sink | internal service | event schemas | system | no PII checks | unit/static |

## Auth Plan
- Login: credentials or Auth.js provider, rate-limited, generic invalid credentials.
- Logout: invalidates session.
- Session strategy: server-side secure cookie session; `HttpOnly`, `SameSite=Lax`, `Secure` only in production/TLS.
- Password strategy: hash with modern password hashing if credentials are used; no plaintext or reversible storage.
- Token strategy: avoid localStorage tokens; keep secrets server-side.
- Staff 2FA/TOTP is deferred and disabled for PLAN-25. `STAFF_2FA_MODE=disabled` is the only supported production mode.
- Staff login flow: password/session start -> `ACTIVE` session. `/login/2fa` and `/api/auth/2fa/*` are disabled placeholders.
- Email OTP fallback and SMTP delivery are disabled until a future activation plan.
- Super Admin only can create user email accounts and change any user password.
- Rate limiting: login, password reset later, consultation, contact, upload, AI provider calls.
- Dormant 2FA attempt fields remain in schema for a future Staff 2FA Rework but are not active in this release.

## Authorization Plan
- Roles: Guest, Client, Lawyer, Secretary, Office Admin, Marketing Staff, Super Admin.
- Permission keys: `resource.action.scope`.
- Enforcement points: route layout guard, server action guard, route handler guard, repository scoping.
- Object-level checks:
  - Client: `clientId` from session-linked Client only.
  - Lawyer: `assignedLawyerId` must match actor unless `*.any`.
  - Admin: permission key required for operation.
  - Marketing: content scopes only; approval permission required for publish/approve.
  - Super Admin: user/role/settings/audit permission.
- UI guards are convenience only and never replace server authorization.

## Business Services
- `consultationService`: create, request AI Gateway classification/summary, assign, reject, convert.
- `clientService`: create/update/archive/search.
- `caseService`: create/update/status/session/summary.
- `documentService`: validate, create metadata, authorize download, update status.
- `appointmentService`: create/update/reschedule/conflict check.
- `taskService`: create/update/assign/status.
- `contentService`: article/case study/social draft workflow.
- `financeService`: manual invoice/payment basics and reports.
- `twoFactorService`: dormant helper only; public TOTP, Email OTP, and reset routes return `FEATURE_DISABLED`.
- `installerService`: token-protected hosting preflight, first Super Admin bootstrap, office profile setup, and installer lock.
- `panelInstallPreflightService`: PLAN-26 compatibility checks for `terminal-vps`, `aapanel`, and `cpanel` before build/migration/bootstrap.
- `emailService`: disabled SMTP/template abstraction for future activation.
- `aiGateway`: provider registry and `generateStructured({ task, locale, input, schema, safetyPolicy })`.
- `settingsService`: validate and update safe settings.
- `auditService`: append immutable audit entries with redacted metadata.
- `telemetryService`: privacy-safe events.

## Background Jobs

| Job | Trigger | Payload | Retry | Idempotency | Failure Handling | Monitoring |
| --- | --- | --- | --- | --- | --- | --- |
| appointmentReminderEmail | scheduled/manual | appointmentId | limited retry | appointmentId+type | mark failed and alert if repeated | delivery logs |
| emailNotification | domain event | userId/type | limited retry | eventId | mark failed and expose operational error | delivery logs |
| documentProcessingPlaceholder | upload later | documentId | N/A MVP | documentId | mark processing skipped | future |
| contentSchedulePlaceholder | approved scheduled draft | draftId | N/A MVP | draftId | no external publish | future |

## PLAN-35 Admin Operations Reconciliation

| Boundary | Authoritative module | Contract |
| --- | --- | --- |
| Route discovery | `src/lib/admin-route-policy.ts` | Nineteen typed destinations; desktop, mobile, quick actions, and page guards share metadata while API/service authorization remains authoritative |
| Canonical work scopes | Existing admin destination services | Dashboard list/count loaders import task, case/appointment, consultation, client, document, and contact predicates instead of recreating them |
| Appointment conflicts | `src/server/appointments/appointment-conflict-service.ts` | Half-open overlap, active status set, public-unassigned symmetry, self-exclusion, serializable callback, and writer-specific retry policy |
| Contact queue | `src/server/admin/contact-message-service.ts` | Bounded minimized reads and conditional audited `NEW -> REVIEWED/ARCHIVED -> ARCHIVED` transitions |
| Notification center | `src/server/admin/notification-service.ts` | Complete-set counts, cross-source dedupe, opaque cursor, safe capability/object-scope href, owner-only generic read |
| Manual cases | `src/server/admin/manual-case-service.ts` | `case.create.any`, UUID/hash/actor replay, atomic case/party/audit create, optimistic audited core edit |
| Role governance | `src/server/admin/role-permission-service.ts` | Exact active Super Admin plus both governance permissions, protected/inactive roles, empty assignments, optimistic atomic replacement |
| User/session governance | `src/server/admin/governance-service.ts`, auth/session services | Safe DTOs, delegated permission ceilings, active-principal checks, affected-session revocation, final-Super protection |
| Command center | `src/server/admin/dashboard-service.ts` | Versioned purpose-built DTO, Cairo boundaries, fixed bounded queues/actions, independent ready/unavailable loaders |
| Storage truth | `src/server/storage/runtime-diagnostic.ts` | One-shot redacted environment-owned diagnostic; `storage.policy` database row is neither returned nor writable |

PLAN-35 is a no-schema change. Its sole migration is data-only permission/bootstrap work. Required
audits are written inside the same transaction as contact, role, manual-case, admin appointment, and
consultation conversion mutations. External checkout work is never automatically replayed. Stable
domain errors are `APPOINTMENT_CONFLICT`, `CASE_REFERENCE_CONFLICT`, and `SETTING_READ_ONLY`, mapped
to localized UI copy without exposing raw exceptions or permission keys.

Local unit/contract/type/lint/build verification does not prove PostgreSQL isolation or persistence.
Migration, double seed, concurrency, role/session, and query-plan checks require a disposable
PostgreSQL database; missing infrastructure is `BLOCKED`, never a pass, and production data is
excluded.

## Error Handling
- Throw domain errors from services and translate at boundary.
- Return shared error format with localized message and requestId.
- Do not expose stack traces or internal exception details to clients.
- Distinguish 401, 403, 404-safe, 409, 422, 429, 500.
- Keep validation details user-readable but not schema-internal.

## Logging
- Structured logs with requestId, actorId when safe, route/action, status, duration.
- Redact Authorization, cookies, password, session, 2FA secrets, OTPs, SMTP credentials, document names if sensitive, case summaries, raw AI prompts, provider raw responses, and AI outputs where sensitive.
- No `process.env` dumps.
- Error logs include release/environment tags.

## Audit Logging
Audit required for:
- Login failures/security events where useful.
- Consultation assign/reject/convert.
- Client archive/assignment.
- Case create/update/status/assignment.
- Session create/update/reschedule.
- Document upload/download/status/visibility/delete.
- Task create/update/assign/status.
- Content approve/publish/reject.
- Invoice/payment basics create/update/cancel.
- Installer bootstrap/lock and future staff 2FA setup/reset/failure threshold when re-enabled.
- Email delivery failure for security-critical messages.
- AI Gateway provider failure/schema invalid output.
- User/role/permission/settings changes.

Audit metadata must be minimized and redacted.

## Backend Acceptance Criteria
- Every protected operation uses centralized auth + permission + object scope helper.
- Every input is runtime validated.
- Repositories do not expose unscoped private data.
- Sensitive mutations emit audit logs.
- Uploads are stored privately and downloads are authorized.
- Staff roles reach final authenticated session after password login while `STAFF_2FA_MODE=disabled`; production readiness fails if TOTP is enabled.
- SMTP email transport is not enabled in this release; tests assert disabled metadata and no real delivery.
- AI Gateway calls are provider-normalized, schema-validated, rate-limited, and logged without raw prompts/responses.
- Public booking AI calls use the AI-specific limiter before provider calls and fall back to review-required unavailable organizer output on provider/limit failure.
- Error responses use shared shape.
- No secrets or PII appear in logs/telemetry.
- Critical service and contract tests pass.
