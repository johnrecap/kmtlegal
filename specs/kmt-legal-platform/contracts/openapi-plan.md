# contracts/openapi-plan.md

## API Standards
All API Route Handlers and Server Actions must follow these standards:

- Method: explicit HTTP verb or Server Action name.
- Path: stable URL for Route Handlers; stable action export for Server Actions.
- Purpose: one business capability.
- Auth required: guest/client/lawyer/admin/super-admin.
- Permissions required: `resource.action.scope`.
- Request body: validated with Zod.
- Query params: validated and normalized.
- Response body: DTO, never raw Prisma record.
- Status codes: explicit.
- Error codes: from shared error enum.
- Rate limits: login, booking, contact, client-team conversation messages, upload, AI provider calls, expensive admin exports. 2FA/OTP routes are disabled placeholders in this release.
- Pagination: cursor or page/limit with max limit.
- Sorting: allowlisted fields only.
- Filtering: allowlisted filters only.
- Idempotency: required for conversion, upload finalize, invoice/payment-record creation, and email send retries.

## Error Format
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

## Error Codes
- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `TOKEN_EXPIRED`
- `PERMISSION_DENIED`
- `NOT_FOUND`
- `CONFLICT`
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
- `SERVER_ERROR`

## Endpoint Groups

### Runtime Health
| Method | Path | Purpose | Auth | Permission | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | Report production runtime readiness | Public status | N/A | Returns `200` only when env, database, seed, first Super Admin, and installer lock checks pass; returns `503` without secrets when blocked |

### Auth
| Method | Path/Action | Purpose | Auth | Permission | Notes |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` or Auth.js equivalent | Login | Guest | N/A | Rate limited; generic invalid credentials |
| POST | `/api/auth/2fa/totp/verify` | Disabled TOTP placeholder | N/A | N/A | Returns `FEATURE_DISABLED`; TOTP is deferred |
| POST | `/api/auth/2fa/email/send` | Disabled Email OTP fallback placeholder | N/A | N/A | Returns `FEATURE_DISABLED`; SMTP is deferred |
| POST | `/api/auth/2fa/email/verify` | Disabled Email OTP fallback placeholder | N/A | N/A | Returns `FEATURE_DISABLED`; SMTP is deferred |
| POST | `/api/auth/logout` or action | Logout | Authenticated | N/A | Invalidates session |
| GET | `/api/auth/me` or server helper | Current user | Authenticated | N/A | No cache, no sensitive tokens |

### Installer
| Method | Path | Purpose | Auth | Permission | Notes |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/install/status` | Read installer availability | Public status | N/A | No secrets returned |
| POST | `/api/install/preflight` | Validate hosting-mode readiness before bootstrap | `x-installer-token` or Bearer token | N/A | Requires `INSTALLER_SETUP_TOKEN`; accepts planned `hostingMode=terminal-vps\|aapanel\|cpanel` |
| POST | `/api/install/bootstrap-super-admin` | Create first active Super Admin and office profile | `x-installer-token` or Bearer token | N/A | Fails if active Super Admin exists; no TOTP fields |
| POST | `/api/install/finish` | Write installer lock and completion setting | `x-installer-token` or Bearer token | N/A | Requires an active Super Admin |

PLAN-26 installer preflight must reject unsupported panel environments before build, migration, or bootstrap. `terminal-vps` may use root-managed Nginx/systemd setup. `aapanel` and `cpanel` modes must not run root-only server mutations and must verify persistent Node.js, PostgreSQL, private uploads, env vars, disabled SMTP, and disabled TOTP.

### Public Content
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/public/services` | Published services list | Guest | public |
| GET | `/api/public/services/{slug}` | Service detail | Guest | public |
| GET | `/api/public/lawyers` | Public lawyers list | Guest | public |
| GET | `/api/public/lawyers/{slug}` | Lawyer profile | Guest | public |
| GET | `/api/public/articles` | Published articles | Guest | public |
| GET | `/api/public/articles/{slug}` | Article detail | Guest | public |
| GET | `/api/public/case-studies` | Published anonymized studies | Guest | public |
| GET | `/api/public/case-studies/{slug}` | Case study detail | Guest | public |
| POST | `/api/public/contact` | Persist contact form submission and return `201 { data: { id, reference, status }, requestId }` | Guest | contact.create.public |
| POST | `/api/public/consultations` | Create consultation request | Guest | consultation.create.public |
| POST | `/api/public/consultations/assistant` | AI-assisted consultation booking and verified appointment inquiry | Guest | consultation.create.public |
| GET | `/api/public/consultations/slots` | Public consultation slots generated from secretary availability without exposing internal calendar data | Guest | public |
| POST | `/api/public/consultations/checkout` | Create a paid consultation booking checkout after server-side review and pricing | Guest | consultation.create.public |
| GET | `/api/public/payments/status` | Read payment attempt status for a return/status page without confirming from redirect | Guest | public |
| POST | `/api/webhooks/paytabs` | Process PayTabs-compatible payment webhook/IPN with signature verification and idempotency | Provider | internal |
| POST | `/api/webhooks/paymob` | Process Paymob payment webhook/callback with provider-owned route, signature verification, and idempotency | Provider | internal |

### Email
| Method | Path/Action | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| Internal | `sendTemplatedEmail` | Render future email templates and return safe disabled metadata | System | internal |

SMTP is a deferred feature in this release. Keep `SMTP_ENABLED=false`; SMTP env placeholders remain documented as future configuration names: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_SECURE`. There is no active SMTP settings UI, no production email transport, and no Email OTP fallback until a future SMTP activation plan re-enables and tests the backend.

### Consultation Workflow
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/consultations` | Review queue | Staff | consultation.review.any / assigned |
| GET | `/api/admin/consultations/{id}` | Consultation detail | Staff | consultation.review.any / assigned |
| PATCH | `/api/admin/consultations/{id}/assign` | Assign lawyer | Admin | consultation.assign.any |
| PATCH | `/api/admin/consultations/{id}/reject` | Reject request | Admin | consultation.review.any |
| POST | `/api/admin/consultations/{id}/convert` | Convert to client/case | Admin | consultation.convert.any |
| GET | `/api/admin/consultation-availability` | Read weekly public consultation booking availability | Secretary/Admin | appointment.manage.any |
| PATCH | `/api/admin/consultation-availability` | Update weekly public consultation booking availability | Secretary/Admin | appointment.manage.any |

### Client Portal
`/client` is the primary protected client surface. `/portal` remains as a compatible legacy surface. Portal MVP is server-rendered except implemented JSON routes. Current portal pages read data server-side through authenticated service helpers. JSON routes are added only when the product needs client-side mutation or async refresh.

| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| Server-rendered | `/client` | Client summary | Client | client.read.self |
| Server-rendered | `/client/cases` | Own cases list | Client | case.read.own |
| Server-rendered | `/client/cases/{id}` | Own case detail | Client | case.read.own |
| Server-rendered | `/client/files` | Own visible files and upload form | Client | document.read.own / document.upload.self |
| Server-rendered | `/client/court-dates` | Own case and consultation appointments | Client | appointment.read.own |
| Server-rendered | `/client/payments` | Own payment records and dues | Client | payment.read.own |
| Server-rendered | `/client/assistant` | Client assistant appointment inquiry | Client | appointment.read.own |
| Server-rendered | `/client/profile` | Client profile | Client | client.read.self |
| POST | `/api/client/assistant` | Authenticated client appointment assistant | Client | appointment.read.own |
| GET | `/api/client/messages` | List current client's team conversations | Client | conversation.read.own |
| POST | `/api/client/messages` | Create or continue current client's team conversation | Client | conversation.create.own / conversation.reply.own |
| GET | `/api/client/messages/{threadId}` | Read one own team conversation | Client | conversation.read.own |
| POST | `/api/client/messages/{threadId}/messages` | Add a client message to one own open conversation | Client | conversation.reply.own |
| Server-rendered | `/portal` | Client summary | Client | portal.read.self |
| Server-rendered | `/portal/cases` | Own cases list | Client | case.read.own |
| Server-rendered | `/portal/cases/{id}` | Own case detail | Client | case.read.own |
| Server-rendered | `/portal/documents` | Compatibility redirect to `/client/files` | Client | document.read.own / document.upload.self |
| Server-rendered | `/portal/appointments` | Own appointments | Client | appointment.read.own |
| Server-rendered | `/portal/payments` | Own payment records | Client | payment.read.own |
| PATCH | `/api/portal/profile` | Update profile | Client | user.update.self |

### Admin Clients and Cases
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/dashboard` | Dashboard metrics | Staff | dashboard.read.any |
| GET | `/api/admin/clients` | CRM list | Staff | client.read.any / assigned |
| POST | `/api/admin/clients` | Create client | Admin | client.create.any |
| GET | `/api/admin/clients/{id}` | Client detail | Staff | client.read.any / assigned |
| PATCH | `/api/admin/clients/{id}` | Update client | Admin | client.update.any |
| POST | `/api/admin/clients/{id}/account` | Create or link a Client role portal account | Secretary/Admin | client.account.manage |
| POST | `/api/admin/clients/{id}/account/password` | Reset linked Client role account password | Secretary/Admin | client.account.manage |
| GET | `/api/admin/cases` | Cases list | Staff | case.read.any / assigned |
| POST | `/api/admin/cases` | Create case | Admin | case.create.any |
| GET | `/api/admin/cases/{id}` | Case detail | Staff | case.read.any / assigned |
| PATCH | `/api/admin/cases/{id}` | Update case | Staff | case.update.any / assigned |
| POST | `/api/admin/cases/{id}/sessions` | Add session | Lawyer/Admin | session.manage.assigned / any |
| POST | `/api/admin/cases/{id}/documents` | Upload case document | Staff | document.manage.any / assigned |
| POST | `/api/admin/cases/{id}/tasks` | Create case task | Staff | task.manage.any / assigned |

### Admin Calendar and Tasks
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/calendar` | Calendar events | Staff | appointment.read.any / assigned |
| POST | `/api/admin/calendar` | Create appointment | Staff | appointment.manage.any |
| POST | `/api/admin/calendar/{appointmentId}/reschedule` | Reschedule/update appointment | Staff | appointment.manage.any / assigned |
| GET | `/api/admin/tasks` | Task board/list | Staff | task.read.any / assigned |
| POST | `/api/admin/tasks` | Create task | Staff | task.manage.any / assigned |
| PATCH | `/api/admin/tasks/{id}` | Update task | Staff | task.manage.any / assigned |

### Admin Content and Social
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/content/articles` | Article admin list | Marketing/Admin | content.read.any |
| POST | `/api/admin/content/articles` | Create article | Marketing/Admin | content.create.any |
| PATCH | `/api/admin/content/articles/{id}` | Update article | Marketing/Admin | content.update.any |
| PATCH | `/api/admin/content/articles/{id}/publish` | Publish article | Admin/Approver | content.approve.any |
| GET | `/api/admin/content/case-studies` | Case study admin list | Marketing/Admin | caseStudy.read.any |
| POST | `/api/admin/content/case-studies` | Create case study | Marketing/Admin | caseStudy.create.any |
| PATCH | `/api/admin/content/case-studies/{id}/approve` | Approve anonymized study | Admin/Approver | caseStudy.approve.any |
| GET | `/api/admin/content/social-drafts` | Social drafts | Marketing/Admin | socialDraft.read.any |
| POST | `/api/admin/content/social-drafts` | Create draft | Marketing/Admin | socialDraft.create.any |
| PATCH | `/api/admin/content/social-drafts/{id}/approve` | Approve draft | Admin/Approver | socialDraft.approve.any |

### Users, Roles, Settings, Audit
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/users` | Users list | Super Admin | user.manage.any |
| POST | `/api/admin/users` | Create user email account with Super Admin-set password | Exact Super Admin | user.manage.any |
| PATCH | `/api/admin/users/{id}` | Update user/status/role | Super Admin | user.manage.any |
| POST | `/api/admin/users/{id}/password` | Change any user password | Exact Super Admin | user.manage.any |
| POST | `/api/admin/users/{id}/client-profile` | Create or link a CRM client profile for an unlinked Client-role account | Staff | client.account.manage |
| POST | `/api/admin/users/{id}/2fa/reset` | Disabled staff 2FA reset placeholder | Super Admin | N/A |
| GET | `/api/admin/roles` | Roles and permissions | Super Admin | role.manage.any |
| PATCH | `/api/admin/roles/{id}/permissions` | Update role permissions | Super Admin | role.manage.any |
| GET | `/api/admin/settings` | Settings | Super Admin | settings.manage.any |
| PATCH | `/api/admin/settings/{key}` | Update setting | Super Admin | settings.manage.any |
| GET | `/api/admin/audit-log` | Audit search with client-friendly presentation DTO | Super Admin | audit.read.any |
| GET | `/api/admin/contact-messages` | Contact message review queue | Staff | contact.read.any |
| PATCH | `/api/admin/contact-messages/{messageId}` | Mark contact message reviewed or archived | Staff | contact.manage.any |
| GET | `/api/admin/messages` | Client team-message inbox | Secretary/Admin | conversation.read.any |
| GET | `/api/admin/messages/{threadId}` | Client team-message detail | Secretary/Admin | conversation.read.any |
| POST | `/api/admin/messages/{threadId}/messages` | Reply to a client team-message thread | Secretary/Admin | conversation.reply.any |
| PATCH | `/api/admin/messages/{threadId}` | Assign, close, reopen, or archive a client team-message thread | Secretary/Admin | conversation.assign.any / conversation.manage.any |

### Finance and Reports
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| GET | `/api/admin/finance` | Invoice/payment basics overview | Admin | finance.read.any |
| POST | `/api/admin/finance` | Create manual invoice/payment record | Admin | finance.manage.any |
| PATCH | `/api/admin/finance/{paymentId}` | Update invoice/payment status | Admin | finance.manage.any |
| GET | `/api/admin/payments/pricing` | List consultation pricing rules used by checkout | Admin | finance.read.any |
| POST | `/api/admin/payments/pricing` | Create consultation pricing rule | Admin | finance.manage.any |
| PATCH | `/api/admin/payments/pricing/{ruleId}` | Update consultation pricing rule | Admin | finance.manage.any |
| GET | `/api/admin/payments/settings` | Read active payment provider and non-secret readiness state | Admin | finance.read.any / settings.manage.any |
| PATCH | `/api/admin/payments/settings` | Switch active provider for new checkout attempts after env readiness validation | Admin | finance.manage.any / settings.manage.any |
| GET | `/api/admin/payments/attempts` | List gateway payment attempts and slot reservations | Admin | finance.read.any |
| GET | `/api/admin/payments/webhooks` | List payment webhook events and processing status | Admin | finance.read.any |
| POST | `/api/admin/payments/webhooks/{eventId}/replay` | Replay safe normalized webhook processing | Admin | finance.manage.any |
| GET | `/api/admin/reports` | MVP reports summary | Admin | reports.read.any |

Manual invoice/payment DTO fields: `invoiceNumber`, `clientId`, `caseId?`, `issueDate`, `dueDate?`, `amount`, `currency`, `status`, `paymentMethod?`, `receiptNumber?`, `paidAt?`, `notes?`, `createdById`, timestamps. Gateway v1 adds `ConsultationPricingRule`, `PaymentAttempt`, `PaymentTransaction`, and `PaymentWebhookEvent`; refunds/disputes are modeled but not operationalized in v1.

### Files
| Method | Path | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| POST | `/api/files/upload` | Generic protected upload | Authenticated | context-specific |
| GET | `/api/files/{documentId}/download` | Authorized download | Authenticated | context-specific |
| GET | `/api/admin/documents` | Admin document list | Staff | document.read.any / assigned |
| PATCH | `/api/admin/documents/{documentId}` | Document status/category/visibility update | Staff | document.manage.any / assigned |
| POST | `/api/admin/documents/{documentId}/delete` | Soft-delete document from active lists | Staff | document.manage.any / assigned |

Upload contract: `MAX_UPLOAD_MB=5`; `ALLOWED_UPLOAD_TYPES=application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png`. The server validates MIME/content, generates opaque file keys, stores files under private VPS storage such as `/var/lib/kmt-legal/uploads`, sets attachment download headers, rejects path traversal, and emits upload/download audit logs. Nginx must not serve upload paths directly.

### AI Provider Gateway
| Method | Path/Action | Purpose | Auth | Permission |
| --- | --- | --- | --- | --- |
| POST | server action `generateConsultationClassification` | Consultation classification | Guest/Staff | consultation.create.public or review |
| POST | server action `generateIntakeSummary` | Intake summary | Guest/Staff | consultation.create.public or review |
| POST | server action `suggestDocumentChecklist` | Document checklist suggestion | Staff | consultation.review.any |
| POST | server action `draftAnonymousCaseStudy` | Anonymous case study draft | Marketing/Admin | caseStudy.create.any |
| POST | server action `draftSocialPost` | Social post draft | Marketing/Admin | socialDraft.create.any |

AI provider calls are server-side only. UI and feature services must call the internal gateway, never a provider directly.

Config:
```text
AI_PROVIDER=mock | openrouter | openai-compatible | local | custom
AI_BASE_URL= # optional for openrouter; defaults to https://openrouter.ai/api/v1
AI_API_KEY=
AI_MODEL= # optional for openrouter; defaults to google/gemini-2.5-flash
AI_TIMEOUT_MS=
AI_MAX_TOKENS=
AI_TEMPERATURE=
```

Internal method:
```ts
generateStructured({
  task,
  locale,
  input,
  schema,
  safetyPolicy
})
```

Normalized provider response:
```json
{
  "provider": "openrouter",
  "model": "provider/model-name",
  "task": "consultation_classification",
  "output": {},
  "usage": {
    "inputTokens": 100,
    "outputTokens": 80
  },
  "latencyMs": 850,
  "reviewRequired": true,
  "requestId": "req_xxx"
}
```

Supported tasks: consultation classification, intake summary, document checklist suggestion, anonymous case study draft, social post draft. If a provider does not support OpenAI-compatible HTTP, implement it as a `local` or `custom` adapter behind the same gateway. OpenCode is treated as `local`/`custom` unless it exposes an OpenAI-compatible HTTP API.

## Request and Response Rules
- Do not return password hashes, session tokens, full internal notes to clients, private file keys to unauthorized users, raw AI prompts, provider raw responses, API keys, legal summaries, or document contents.
- Public DTOs must include only published/anonymized data.
- Portal DTOs must be scoped by current client user.
- Admin DTOs must be scoped by role and permission.
- Pagination must default to 20 and cap at 100 unless documented.
- Sorting/filtering fields must be allowlisted.

## Rate Limits
- Login: strict IP+identifier throttling.
- Staff 2FA/TOTP/Email OTP routes return `FEATURE_DISABLED` in this release. Future activation must add strict user+IP throttling, max attempts, short expiry, and audit evidence before enabling.
- Contact and consultation submit: IP+phone/email throttling.
- Client team-message conversations: authenticated user throttling. Human messages are saved as part of live chat; public AI booking chat transcripts are not saved as conversation archives.
- Upload: user+IP throttling, 5MB cap, allowlisted MIME/content validation.
- AI provider calls: user+IP throttling, timeout, token cap, schema validation, provider error handling.
- Admin exports/reports: admin-user throttling.

## API Acceptance Criteria
- All request inputs validated at runtime.
- Every protected endpoint checks session, permission, and object scope.
- State-changing cookie-auth endpoints have CSRF strategy.
- Sensitive responses set `Cache-Control: no-store/private`.
- Error shape is consistent.
- Audit logs emitted for sensitive mutations.
- Staff sessions are final after password login while `STAFF_2FA_MODE=disabled`; production readiness fails if `STAFF_2FA_MODE=totp`.
- Installer routes are token-protected and lock after first Super Admin setup.
- SMTP is deferred and disabled; email templates must not send real mail in this release.
- AI Gateway provider outputs are schema-validated, normalized, review-gated, and privacy-safe in logs.
- Contract tests cover allowed, denied, validation, not found, and conflict paths.
