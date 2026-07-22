# data-model.md

## Entity List

### User
- Purpose: Authenticated account for clients, lawyers, staff, marketing, super admins.
- Fields: `id UUID`, `name`, `email unique`, `phone`, `passwordHash optional`, `roleId`, `status`, `locale`, `createdAt`, `updatedAt`, `deletedAt`.
- Relationships: belongs to Role; may own Client profile; may have LawyerProfile; authors content/audit/notes/tasks.
- Ownership: self plus super admin.
- Permissions: `user.read.self`, `user.manage.any`.
- Lifecycle: invited/active/suspended/deleted.
- Validation: unique email, phone normalized, active role required.
- Indexes: email, phone, roleId, status.
- Audit: login failures, role changes, status changes.
- Soft delete: yes.
- Retention: retain audit references with anonymized/deleted user display where required.

### Session
- Purpose: Server-side authenticated session. Pending staff 2FA state is dormant for a future rework.
- Fields: `id UUID`, `userId`, `tokenHash unique`, `status`, `twoFactorVerifiedAt`, `twoFactorAttemptCount`, `twoFactorLockedUntil`, `lastTwoFactorFailedAt`, `expiresAt`, `revokedAt`, `ipAddress`, `userAgent`, timestamps.
- Relationships: belongs to User.
- Ownership: user self; server-managed.
- Permissions: session helpers only.
- Lifecycle: active/revoked/expired in PLAN-25; pending_2fa remains in schema only for future compatibility.
- Validation: staff roles receive final `ACTIVE` sessions after password login while `STAFF_2FA_MODE=disabled`.
- Indexes: userId+status, expiresAt, twoFactorLockedUntil.
- Audit: login success/failure, logout/revocation, and future 2FA success/failure/lockout when re-enabled.
- Soft delete: no; revoke/expire.
- Retention: keep only as required for security audit and session expiry policy.

### Role
- Purpose: Named access bundle.
- Fields: `id`, `name unique`, `description`, `status`, `createdAt`, `updatedAt`.
- Relationships: has RolePermission, Users.
- Ownership: super admin.
- Permissions: `role.manage.any`.
- Lifecycle: active/disabled.
- Validation: `Guest`, `Client`, and exact `Super Admin` are protected; inactive roles are read-only;
  the final active exact Super Admin account cannot be removed from its governance path.
- Indexes: name.
- Audit: role create/update/delete.
- Soft delete: optional disabled state preferred.
- Retention: keep for audit history.

### Permission
- Purpose: Atomic permission key using `resource.action.scope`.
- Fields: `id`, `key unique`, `description`.
- Relationships: RolePermission.
- Ownership: system/super admin.
- Permissions: `permission.manage.any`.
- Lifecycle: seeded/active/deprecated.
- Validation: key matches naming convention.
- Indexes: key.
- Audit: permission assignment changes.
- Soft delete: no; deprecate instead.
- Retention: permanent.

### RolePermission
- Purpose: Join table for roles and permissions.
- Fields: `roleId`, `permissionId`.
- Relationships: Role, Permission.
- Ownership: super admin.
- Permissions: `role.manage.any`.
- Lifecycle: assigned/removed.
- Validation: unique roleId+permissionId; an editable role may intentionally have zero rows and that
  empty persisted assignment remains authoritative after RBAC bootstrap.
- Indexes: roleId, permissionId.
- Audit: assignment/removal.
- Soft delete: no.
- Retention: changes preserved in AuditLog.

### Client
- Purpose: Lead or active client record.
- Fields: `id`, `userId optional`, `fullName`, `phone`, `email`, `city`, `source`, `status`, `assignedLawyerId optional`, `createdAt`, `updatedAt`, `deletedAt`.
- Relationships: User optional, assigned Lawyer User, Cases, ConsultationRequests, Appointments, Documents, Payments.
- Ownership: client self for linked portal data; staff by permission.
- Permissions: `client.read.any`, `client.update.any`, `client.read.assigned`.
- Lifecycle: lead/active/inactive/archived/deleted.
- Validation: phone normalized, status enum, assigned lawyer must be lawyer role.
- Indexes: phone, email, status, assignedLawyerId, createdAt.
- Audit: archive, assignment, profile updates by staff.
- Soft delete: yes.
- Retention: legal retention policy required before hard delete.

### LawyerProfile
- Purpose: Public and operational profile for lawyers.
- Fields: `id`, `userId`, `publicSlug unique`, `title`, `bio`, `specialties json/string[]`, `languages json/string[]`, `isPublic`, `bookingEnabled`.
- Relationships: User, assigned clients/cases/appointments.
- Ownership: lawyer self limited, admin any.
- Permissions: `lawyer.read.public`, `lawyer.manage.any`.
- Lifecycle: draft/public/hidden.
- Validation: slug unique, linked user has lawyer-compatible role.
- Indexes: publicSlug, isPublic, bookingEnabled.
- Audit: public visibility changes.
- Soft delete: via user/profile hidden.
- Retention: public content can be unpublished.

### LegalService
- Purpose: Public legal service catalog.
- Fields: `id`, `title`, `slug unique`, `category`, `description`, `content`, `requiredDocuments json/string[]`, `isPublished`.
- Relationships: ConsultationRequests by service category.
- Ownership: admin/marketing.
- Permissions: `service.manage.any`, public read if published.
- Lifecycle: draft/published/archived.
- Validation: slug unique, no legal outcome promises.
- Indexes: slug, category, isPublished.
- Audit: publish/unpublish/update.
- Soft delete: archive preferred.
- Retention: public content history optional.

### ConsultationRequest
- Purpose: Public intake record for AI-assisted booking, secretary review, assignment, and conversion.
- Fields: `id`, `clientId optional`, `fullName`, `phone`, `email`, `city`, `serviceCategory`, `summary`, `opposingPartyName optional`, `urgency`, `preferredMode`, `status`, `aiClassification json`, `aiSummary`, `assignedLawyerId optional`, `secretaryReviewedAt optional`, `secretaryReviewedById optional`, `secretaryReviewNote optional`, `createdAt`, `updatedAt`.
- Relationships: optional Client, optional assigned lawyer, optional secretary reviewer, optional converted Case/Appointment.
- Ownership: office staff; public submitter has no portal access until linked.
- Permissions: `consultation.create.public`, `consultation.review.any`, `consultation.review.assigned`.
- Lifecycle: new/reviewing/payment_pending/scheduled/rejected/converted. A scheduled request needs secretary attention until reviewed or assigned to a lawyer.
- Validation: required name/phone/service/summary/mode, status transition rules.
- Indexes: phone, status, assignedLawyerId, secretaryReviewedAt, secretaryReviewedById, createdAt, serviceCategory.
- Audit: assign, secretary review, reject, convert.
- Soft delete: no hard delete in MVP; status/archive later.
- Retention: legal intake retention policy.

### Appointment
- Purpose: Consultation, court session, internal meeting, call, online meeting.
- Fields: `id`, `clientId`, `lawyerId optional`, `consultationRequestId optional`, `caseId optional`, `title`, `type`, `mode`, `location`, `startsAt`, `endsAt`, `status`, `notes`, `createdAt`, `updatedAt`.
- Relationships: Client, lawyer User, optional ConsultationRequest, optional Case.
- Ownership: client own read, assigned lawyer, admin any.
- Permissions: `appointment.create.self`, `appointment.manage.any`, `appointment.read.own`, `appointment.read.assigned`.
- Lifecycle: scheduled/completed/cancelled/rescheduled/no_show.
- Validation: startsAt < endsAt, obvious lawyer conflict prevention.
- Indexes: clientId, lawyerId, caseId, startsAt, status.
- Audit: create/reschedule/cancel/complete.
- Soft delete: no; cancel status.
- Retention: retain for case history.

### Case
- Purpose: Internal legal case file.
- Fields: `id`, `internalFileNumber unique`, `clientId`, `assignedLawyerId`, `title`, `caseType`, `courtName`, `externalCaseNumber optional`, `status`, `priority`, `summary`, `nextSessionAt optional`, `createdAt`, `updatedAt`, `deletedAt`.
- Relationships: Client, assigned lawyer, CaseParties, CaseSessions, Documents, Tasks, InternalNotes, Payments.
- Ownership: client own simplified read, assigned lawyer, admin any.
- Permissions: `case.read.own`, `case.read.assigned`, `case.read.any`, `case.create.any`, `case.update.assigned`, `case.update.any`.
- Lifecycle: new/under_review/active/awaiting_judgment/completed/closed/archived.
- Validation: internal file number unique, valid status transitions.
- Indexes: internalFileNumber, clientId, assignedLawyerId, status, priority, nextSessionAt, createdAt.
- Audit: create/update/status/assignment/archive.
- Soft delete: yes/archive.
- Retention: legal retention required.

### CaseParty
- Purpose: Parties connected to a case.
- Fields: `id`, `caseId`, `name`, `partyType`, `notes`.
- Relationships: Case.
- Ownership: same as Case.
- Permissions: case read/update permissions.
- Lifecycle: active/removed.
- Validation: partyType enum; avoid exposing opposing party publicly.
- Indexes: caseId, name.
- Audit: create/update/remove.
- Soft delete: optional.
- Retention: follows case retention.

### CaseSession
- Purpose: Court session record and next action.
- Fields: `id`, `caseId`, `appointmentId optional`, `courtName`, `sessionDate`, `decision`, `nextAction`, `nextSessionDate optional`, `createdById`, `createdAt`.
- Relationships: Case, optional Appointment, creator User.
- Ownership: assigned lawyer/admin.
- Permissions: `session.manage.assigned`, `session.manage.any`.
- Lifecycle: recorded/updated.
- Validation: session date required, nextSessionDate cannot precede sessionDate.
- Indexes: caseId, sessionDate, createdById.
- Audit: create/update.
- Soft delete: no; corrections via audit trail.
- Retention: follows case.

### Document
- Purpose: Private file metadata and workflow status.
- Fields: `id`, `ownerClientId optional`, `caseId optional`, `uploadedById`, `fileName`, `fileKey`, `fileType`, `fileSize`, `category`, `status`, `visibility`, `createdAt`, `updatedAt`.
- Relationships: Client, Case, uploader User.
- Ownership: client own where visible, assigned lawyer, admin.
- Permissions: `document.upload.self`, `document.read.own`, `document.read.assigned`, `document.manage.any`.
- Lifecycle: new/under_review/needs_clarification/accepted/rejected/deleted.
- Validation: PDF/DOC/DOCX/JPG/JPEG/PNG only, max 5MB, server-side MIME/content validation, private key generated, no public path.
- Indexes: ownerClientId, caseId, uploadedById, status, category, createdAt.
- Audit: upload/download/status/delete/visibility.
- Soft delete: yes metadata; object deletion policy documented.
- Retention: legal retention and deletion request policy.

### Task
- Purpose: Operational tasks linked to cases or general admin work.
- Fields: `id`, `title`, `description`, `status`, `priority`, `assignedToId`, `caseId optional`, `dueDate`, `createdById`, `createdAt`, `updatedAt`.
- Relationships: assigned User, creator User, optional Case.
- Ownership: assignee, case assigned lawyer, admin.
- Permissions: `task.read.assigned`, `task.manage.assigned`, `task.manage.any`.
- Lifecycle: new/in_progress/review/completed/overdue.
- Validation: dueDate optional, assigned user active.
- Indexes: assignedToId, caseId, status, priority, dueDate, createdAt.
- Audit: create/update/assign/status.
- Soft delete: archive preferred.
- Retention: follows case if case-linked.

### InternalNote
- Purpose: Staff-only case note.
- Fields: `id`, `caseId`, `authorId`, `content`, `visibility internal_only`, `createdAt`, `updatedAt`.
- Relationships: Case, author User.
- Ownership: assigned lawyer/admin only.
- Permissions: `note.read.assigned`, `note.create.assigned`, `note.read.any`.
- Lifecycle: active/corrected.
- Validation: never client-visible.
- Indexes: caseId, authorId, createdAt.
- Audit: create/update/delete if allowed.
- Soft delete: yes or correction trail.
- Retention: follows case.

### Payment
- Purpose: Manual invoice/payment basics record.
- Fields: `id`, `invoiceNumber unique`, `clientId`, `caseId optional`, `issueDate`, `dueDate optional`, `amount decimal`, `currency`, `status`, `paymentMethod optional`, `receiptNumber optional`, `paidAt optional`, `notes optional`, `createdById`, `createdAt`, `updatedAt`.
- Relationships: Client, optional Case, creator User.
- Ownership: client own read, office admin/super admin.
- Permissions: `payment.read.own`, `finance.read.any`, `finance.manage.any`.
- Lifecycle: draft/issued/pending/paid/overdue/cancelled.
- Validation: positive amount, currency enum, unique invoiceNumber, paidAt required when paid, no tax/discount/gateway/refund/ledger fields in MVP.
- Indexes: invoiceNumber, clientId, caseId, status, issueDate, dueDate, createdAt.
- Audit: create/update/cancel.
- Soft delete: no; cancel status.
- Retention: financial/legal retention.

### StaffTwoFactorCredential
- Purpose: Dormant staff TOTP enrollment/reset tracking for a future Staff 2FA Rework plan.
- Fields: `id`, `userId unique`, `totpSecretEncrypted`, `enabledAt`, `lastVerifiedAt optional`, `recoveryState`, `createdAt`, `updatedAt`.
- Relationships: User.
- Ownership: user self for verification, Super Admin for reset.
- Permissions: `twoFactor.manage.self`, `twoFactor.reset.staff`.
- Lifecycle: pending_setup/enabled/reset_required/disabled_by_admin.
- Validation: no new records are created by current admin or installer flows. Future activation must limit records to staff roles and encrypt secrets at rest.
- Indexes: userId, recoveryState, enabledAt.
- Audit: future setup, verify failure threshold, reset, disable. Current reset route is disabled.
- Soft delete: no; reset state preferred.
- Retention: retain audit references; rotate secret on reset.

### EmailOtpChallenge
- Purpose: Deferred Email OTP fallback challenge for future staff 2FA/security flows. Routes are disabled in this release.
- Fields: `id`, `userId`, `purpose`, `otpHash`, `expiresAt`, `consumedAt optional`, `attemptCount`, `createdAt`.
- Relationships: User.
- Ownership: challenged user; system validates.
- Permissions: internal auth service only.
- Lifecycle: active/consumed/expired/locked.
- Validation: short expiry, hashed OTP only, max attempts, rate limited by user/IP.
- Indexes: userId, purpose, expiresAt, consumedAt.
- Audit: create, failed verify threshold, consumed, expired.
- Soft delete: no; purge by retention job after audit-safe window.
- Retention: short retention for challenge rows; audit retains event metadata.

### EmailMessage
- Purpose: Deferred email delivery record for future SMTP use cases. SMTP sending is disabled in this release.
- Fields: `id`, `toUserId optional`, `toEmailHash`, `templateKey`, `purpose`, `status`, `providerMessageId optional`, `errorCode optional`, `sentAt optional`, `createdAt`, `updatedAt`.
- Relationships: optional User.
- Ownership: system/admin audit.
- Permissions: `email.read.audit` for Super Admin only if surfaced.
- Lifecycle: queued/sent/failed/suppressed.
- Validation: do not store raw sensitive bodies, OTP values, or SMTP credentials.
- Indexes: toUserId, templateKey, purpose, status, createdAt.
- Audit: security-critical emails and failures.
- Soft delete: no; retention window configurable.
- Retention: retain metadata only.

### AiProviderRun
- Purpose: Provider-agnostic AI Gateway run metadata without raw prompt or raw provider response.
- Fields: `id`, `provider`, `model`, `task`, `requestId`, `reviewRequired`, `latencyMs`, `usageJson optional`, `status`, `errorCode optional`, `createdById optional`, `createdAt`.
- Relationships: optional creator User.
- Ownership: system/admin audit.
- Permissions: `ai.audit.read.any` if exposed.
- Lifecycle: started/succeeded/schema_invalid/provider_error/timeout.
- Validation: no raw prompts, legal summaries, document contents, API keys, or provider raw responses.
- Indexes: provider, model, task, status, requestId, createdAt.
- Audit: failures, schema invalid outputs, provider changes.
- Soft delete: no; metadata only.
- Retention: short operational retention unless policy requires longer.

### Article
- Purpose: Public legal content.
- Fields: `id`, `title`, `slug unique`, `excerpt`, `content`, `authorId`, `category`, `status`, `publishedAt`, `createdAt`, `updatedAt`.
- Relationships: author User.
- Ownership: marketing/admin.
- Permissions: `content.create.any`, `content.approve.any`.
- Lifecycle: draft/review/published/archived.
- Validation: no legal outcome promises, safe rich text.
- Indexes: slug, status, category, publishedAt.
- Audit: create/update/publish/archive.
- Soft delete: archive preferred.
- Retention: content history optional.

### CaseStudy
- Purpose: Anonymous public case study.
- Fields: `id`, `title`, `slug unique`, `category`, `challenge`, `approach`, `generalOutcome`, `lessons`, `status`, `isAnonymized`, `approvedById optional`, `publishedAt optional`, `createdAt`, `updatedAt`.
- Relationships: approver User.
- Ownership: marketing/admin/legal approver.
- Permissions: `caseStudy.create.any`, `caseStudy.approve.any`.
- Lifecycle: draft/legal_review/approved/published/rejected.
- Validation: anonymization required before approval/publish; disclaimer required.
- Indexes: slug, status, category, publishedAt, approvedById.
- Audit: approve/reject/publish.
- Soft delete: archive preferred.
- Retention: published content history.

### SocialPostDraft
- Purpose: Social content drafts without external publishing in MVP.
- Fields: `id`, `title`, `platform`, `content`, `sourceType`, `sourceId optional`, `status`, `scheduledAt optional`, `createdById`, `approvedById optional`, `createdAt`, `updatedAt`.
- Relationships: creator/approver User, optional Article/CaseStudy source.
- Ownership: marketing/admin.
- Permissions: `socialDraft.create.any`, `socialDraft.approve.any`.
- Lifecycle: draft/legal_review/approved/scheduled/published/rejected.
- Validation: legal review before scheduled/published; no external API.
- Indexes: platform, status, scheduledAt, createdById.
- Audit: create/approve/reject/schedule.
- Soft delete: archive.
- Retention: content retention policy.

### Notification
- Purpose: In-app notification record, including secretary consultation-review alerts.
- Fields: `id`, `userId`, `title`, `body`, `type`, `resourceType optional`, `resourceId optional`, `actionUrl optional`, `readAt`, `createdAt`.
- Relationships: User; optional typed link to a business resource such as `ConsultationRequest`.
- Ownership: recipient.
- Permissions: `notification.read.self`, system create.
- Lifecycle: unread/read/deleted. Consultation notifications are resolved for all recipients once the consultation is secretary-reviewed, rejected, converted, or assigned.
- Validation: no sensitive document/case content in body unless protected.
- Indexes: userId, readAt, createdAt, type, resourceType+resourceId, unique userId+type+resourceType+resourceId for idempotent consultation alerts.
- Audit: not required for read; creation for sensitive notifications optional.
- Soft delete: optional.
- Retention: short-term configurable.

### AuditLog
- Purpose: Immutable security and business action record.
- Fields: `id`, `actorId`, `action`, `resourceType`, `resourceId`, `metadata json`, `ipAddress optional`, `userAgent optional`, `createdAt`.
- Relationships: actor User.
- Ownership: system.
- Permissions: `audit.read.any`.
- Lifecycle: append-only.
- Validation: metadata redacted; no secrets or document contents.
- Indexes: actorId, action, resourceType, resourceId, createdAt.
- Audit: audit log itself should not be edited.
- Soft delete: no.
- Retention: defined by legal/security policy.

### SystemSetting
- Purpose: Runtime configuration visible/editable to super admin.
- Fields: `id`, `key unique`, `value json/string`, `updatedById`, `updatedAt`.
- Relationships: updater User.
- Ownership: super admin.
- Permissions: `settings.manage.any`.
- Lifecycle: active.
- Validation: schema per setting key; secrets must not be stored here. Environment-owned
  `storage.policy` is excluded from editable setting responses and is represented only by a safe
  read-only runtime diagnostic.
- Indexes: key.
- Audit: every update.
- Installer: `installer.completed` records first-setup completion metadata; `/var/lib/kmt-legal/install.lock` is the filesystem lock that prevents rerun.
- Soft delete: no.
- Retention: setting history via audit.

## PLAN-35 Admin Operations Reconciliation

PLAN-35 reuses the persistent entities above plus the existing `ContactMessage`; it adds no Prisma
model, field, enum, or relationship. `prisma/schema.prisma` therefore has no PLAN-35 structural
change. Migration `20260722120000_plan_35_admin_operations` is data-only: it upserts
`case.create.any`, the own-notification grants, and the conditional RBAC bootstrap marker. A marked
repeat seed updates the catalog but does not restore removed/empty role assignments or reactivate an
inactive role.

- **User/Session**: admin list/create/detail/update responses use explicit safe DTOs. Password hashes,
  encrypted TOTP/recovery material, session token hashes, and whole credential records are forbidden.
  Login and session resolution require an active, nondeleted user, an active role, and a live
  session. Role/access-status changes revoke affected sessions atomically and preserve the final
  active exact Super Admin.
- **Appointment**: blocking states are `RESERVED`, `SCHEDULED`, and `RESCHEDULED`; time ranges are
  half-open. Conflict lookup, mutable scope reread, write, and required admin/conversion audit share
  one serializable transaction. Database-only create/conversion callbacks may use bounded replay;
  existing-row updates and paid provider work are single-attempt.
- **LegalCase/CaseParty**: manual create uses the client UUID `requestToken` as `LegalCase.id` and
  binds replay to actor plus a canonical SHA-256 request hash in the direct creation audit. Case,
  ordered initial parties, and audit commit together. Core edit conditionally claims `updatedAt`;
  only `case.update.any` may change the assignee.
- **ContactMessage**: states remain `NEW`, `REVIEWED`, and `ARCHIVED`. Conditional transition and
  one redacted audit share a transaction; same-state replay is idempotent, while invalid reopen,
  conflicting target, stale claim, or audit failure changes nothing.
- **Notification/ConsultationRequest**: records remain separate and are projected into one bounded,
  deduplicated notification center. Counts use complete permission-scoped sets before pagination;
  generic reads are recipient-only, and consultation review remains a separate business transition.
- **Derived models**: `AdminRoutePolicy`, `DashboardSnapshotV1`, and
  `StorageRuntimeDiagnostic` are application DTOs, not tables. Storage diagnostics are derived once
  from effective environment/filesystem/scanner state and never expose a path or secret.

Canonical scope ownership is shared with destination services: dashboard task, appointment, case,
consultation, client, document, and contact counts must reuse the same predicates as their lists.
Database-backed proof remains open until a disposable PostgreSQL target is available; production
data is never migration, seed, mutation, or contention test data.

## ERD Description
- User has one Role and many authored records.
- Role has many Permissions through RolePermission.
- Client may link to a User and has many Cases, Documents, Appointments, Payments, and ConsultationRequests.
- Staff users may have dormant StaffTwoFactorCredential and EmailOtpChallenge rows from older/local seed data, but PLAN-25 flows do not require or create them.
- LawyerProfile belongs to a User; cases and appointments can be assigned to that user.
- ConsultationRequest may link to Client and can be converted into Case and Appointment.
- Case belongs to Client and assigned Lawyer; it has CaseParty, CaseSession, Document, Task, InternalNote, Payment.
- Document can belong to a Client, Case, or both, and is always uploaded by a User.
- EmailMessage and AiProviderRun store metadata only and may optionally reference a User.
- Content entities are authored/approved by Users.
- AuditLog references actor and resource by type/id.

## Entity Relationship Rules
- Client users can only read their own Client-linked records.
- Lawyers can read assigned cases and related case documents/tasks/sessions.
- Office Admin can manage operational data but not necessarily system settings.
- Marketing Staff can manage content drafts but cannot publish case studies without approval.
- Super Admin can manage users, roles, permissions, settings, and all data.
- Lawyer, Office Admin, Marketing Staff, and Super Admin do not require completed 2FA in PLAN-25; TOTP is deferred.
- InternalNote is never client-visible.
- Document download requires both metadata permission and storage authorization.
- AI Gateway metadata must not include raw prompt, legal summary, document content, API key, or raw provider response.
- Email records must not include OTP values or full sensitive message bodies.

## Data Lifecycle
- Create: validated by Zod and service rules; sensitive creates audited.
- Read: scoped by role, permission, ownership, assignment, and publication status.
- Update: service-level status transition checks; sensitive updates audited.
- Delete: soft delete/archive preferred for legal records.
- Archive: clients, cases, tasks, content can be archived.
- Export: admin-only, privacy-safe scope, audit required.
- Anonymize: required for case studies before public approval.
- Restore: soft-deleted records restored only by authorized admins with audit.

## Seed Data Plan
- Roles: Guest, Client, Lawyer, Secretary, Office Admin, Marketing Staff, Super Admin.
- Permissions: seeded from `resource.action.scope`.
- Users: one safe demo account per protected role, with non-real names and credentials documented only in quickstart.
- Staff seed accounts may include legacy local/dev 2FA data, but production bootstrap and installer never create demo users or TOTP setup.
- Public data: services, lawyers, articles, case studies, media entries.
- Operational demo: clients, consultations, cases, sessions, documents metadata, tasks, payments.
- Seeds must be deterministic and safe to rerun.

## Migration Plan
- Start additive: create enums/tables, indexes, constraints, seed roles.
- Validate clean database migration.
- Validate seed idempotency.
- Do not drop or rename production columns without a compatibility/backfill plan.
- Keep audit and permission tables stable early.
- Add future indexes only when feature query patterns justify them.

## Database Acceptance Criteria
- Prisma schema validates.
- Migrations apply on clean database.
- Seed runs multiple times safely.
- Role/permission matrix is populated.
- Indexes exist for list/search/filter paths.
- Soft delete or archive strategy exists for sensitive business entities.
- No real client data exists in seeds.
