# security-plan.md

## Threat Model

### Assets
- Client identities and contact details.
- Case summaries, opposing party names, internal notes.
- Uploaded legal documents.
- Payment/invoice records.
- Staff accounts and sessions.
- Staff sessions. TOTP and Email OTP helpers are present but disabled in this release.
- Installer setup token and lock file.
- Role/permission configuration.
- Audit logs and system settings.
- AI Gateway inputs/outputs and provider metadata.
- Future SMTP credentials and email delivery metadata; SMTP is disabled in this release.

### Attack Surfaces
- Public consultation/contact forms.
- Login/session endpoints.
- Server Actions and Route Handlers.
- File upload/download.
- Admin and portal routes.
- Content publishing and rich text.
- Search/filter/sort query params.
- Environment variables and deployment config.
- Analytics/logging/error reporting.
- Deferred SMTP delivery path.
- AI provider gateway adapters.

### Trust Boundaries
- Browser to server.
- Guest public user to intake API.
- Authenticated client to portal data.
- Staff roles to admin data.
- App server to database.
- App server to private upload directory outside any public webroot.
- App server to SMTP provider only after a future activation plan.
- App server to configured AI provider adapter.

### Threats and Mitigations
| Threat | Mitigation |
| --- | --- |
| Horizontal privilege escalation | Object-level checks in services and repositories; negative tests |
| Staff privilege escalation | Permission matrix, super-admin-only role/user/password changes, audit logs; 2FA is deferred and tracked as a residual risk |
| Installer takeover | `INSTALLER_SETUP_TOKEN`, one-time Super Admin bootstrap, lock file, `installer.completed` setting, and production readiness failure while installer remains enabled |
| CSRF on cookie-auth mutations | SameSite cookies, Origin checks, CSRF token strategy where needed |
| XSS from content | Avoid raw HTML; sanitize rich text; CSP plan; safe markdown config |
| Public file exposure | Store outside `public/`/`public_html` under a private path, block direct web-server serving, generated keys, authorized app-streamed downloads |
| Unsupported panel install | PLAN-26 preflight rejects cPanel/aaPanel setups that lack persistent Node.js, PostgreSQL, private uploads, env var support, or safe process/proxy configuration |
| Upload abuse | 5MB cap, PDF/DOC/DOCX/JPG/JPEG/PNG allowlist, MIME/content validation, rate limits, attachment disposition |
| Secrets leak | Server-only env vars, no `NEXT_PUBLIC_*` secrets, `.env*` ignored |
| Spoofed client IP | In production trust Nginx-provided `X-Real-IP`; do not rely on client-supplied first `X-Forwarded-For` |
| SQL injection | Prisma query APIs, no raw string SQL with untrusted input, Zod validation |
| Open redirect | Same-origin relative redirect validation |
| SSRF | No user-controlled server fetch URLs in MVP; future allowlists |
| PII in logs/analytics | Redaction, event schema, no names/case summaries/document content |
| AI legal advice/provider leakage risk | Server-side AI Gateway, schema validation, review-required label, no final legal advice, no raw prompts/provider responses in logs |
| Email OTP abuse | Route returns `FEATURE_DISABLED` in this release; future activation must hash OTPs, use short expiry, max attempts, user+IP rate limits, and audit suspicious failures |
| Repeated staff 2FA guessing across IPs | Routes return `FEATURE_DISABLED` in this release; future activation must restore session-level failed-attempt count and temporary lockout |
| Cache data leak | No shared cache for private data; `no-store/private` for protected responses |

### Residual Risks
- VPS hardening, TLS renewal, Nginx headers, and OS patching require operational ownership.
- File scanning/AV is deferred unless required.
- AI provider privacy depends on the configured adapter and must be reviewed before using non-mock providers with real legal content.

## Security Controls

### Input Validation
- Zod schemas for all request bodies, query params, route params, Server Action args.
- Normalize phone, email, slugs, dates, and enums.
- Reject unknown sort/filter fields.

### Output Escaping and Content Safety
- Render strings through React interpolation.
- Avoid `dangerouslySetInnerHTML`.
- If rich text is needed, sanitize with a reviewed sanitizer and restricted schema.
- Case studies require anonymization and disclaimer.

### Auth
- Secure cookie sessions.
- `HttpOnly`, `SameSite=Lax`, production-only `Secure`.
- Login rate limiting and generic errors.
- Session expiration and logout invalidation.
- Staff password login is active while `STAFF_2FA_MODE=disabled`.
- TOTP, Email OTP, `/login/2fa`, and staff 2FA reset are disabled placeholders.
- Production readiness fails if `STAFF_2FA_MODE=totp`.
- Future Staff 2FA Rework must restore encrypted secrets, attempt tracking, reset audit, and recovery policy before activation.

### Authorization
- Central permission helper.
- Server-side checks for every protected route/action.
- Object ownership checks for Client and assigned Lawyer scopes.
- Super Admin required for roles/settings/audit governance.

### File Upload Validation
- Allowlist extensions and MIME/content checks for PDF, DOC, DOCX, JPG/JPEG, PNG.
- Max size 5MB enforced at Nginx/app boundary and server validation.
- Reject oversize `Content-Length` before reading multipart form data.
- Generate storage keys; do not trust filenames.
- Store outside public webroot in private storage such as `/var/lib/kmt-legal/uploads` on VPS/aaPanel or a non-`public_html` private path on cPanel.
- Nginx must not serve upload directories directly.
- Download via authorized route with safe headers.

### Secrets Handling
- Secrets only in server env/secret store.
- `NEXT_PUBLIC_*` only for public config.
- `.env.example` names only.
- Rotate if any secret is exposed.
- Treat `SMTP_PASSWORD`, `AUTH_SECRET`, `DATABASE_URL`, and `AI_API_KEY` as server-only secrets.

### CSRF
- If using cookie auth, protect state-changing Route Handlers with CSRF tokens or strict Origin/Referer validation plus SameSite.
- Do not weaken Server Actions allowed origins.
- Never use GET for state-changing operations.

### XSS
- No raw HTML from user/CMS without sanitizer.
- CSP plan with report-only to enforce later.
- No untrusted URLs in `href`, `src`, redirects without validation.

### SSRF
- No server-side user-provided URL fetch features in MVP.
- Future URL integrations must allowlist protocol and host, block private IPs, set timeouts, restrict redirects.

### SQL Injection
- Prisma ORM query APIs.
- Raw SQL only with parameterization and review.

### Rate Limiting
- Login.
- Staff 2FA/TOTP and Email OTP routes return `FEATURE_DISABLED`.
- Installer mutations require setup token and same-origin request protections.
- Contact.
- Consultation submit.
- Upload.
- AI provider gateway calls.
- Admin reports/exports.

### Audit Logs
- Required for sensitive admin/staff mutations.
- Append-only.
- Metadata redacted.
- Searchable by actor/action/resource/date.

### Secure Errors
- Shared error shape.
- requestId included.
- Stack traces never returned in production.

### Dependency and Secret Scanning
- Lockfile required.
- CI uses reproducible install.
- Dependency audit on PR/merge/release.
- Secret scan on PR.
- Production seed must bootstrap only roles/permissions/settings and must never create local demo users.

## Privacy Plan

### PII Classification
- Direct PII: names, phone, email, city, user IDs.
- Legal sensitive data: case summaries, opposing party names, court data, internal notes, documents.
- Financial data: payment records, amounts, due/paid dates.
- Operational metadata: audit logs, IP/user agent.

### Consent and Notices
- Consultation form states how data is used.
- Privacy policy explains portal, uploads, deferred SMTP email, deferred 2FA, AI Provider Gateway, audit logs, and retention basics.
- AI organizer copy states it is not legal advice and requires lawyer review.

### Data Retention
- Legal records retained according to law firm policy.
- Notifications can have shorter retention.
- Audit logs retained for security/legal review.
- Hard delete requires policy approval; archive/soft delete by default.

### Data Export and Deletion
- Admin-only export with scope checks and audit.
- Client deletion requests handled as workflow, not immediate destructive deletion.
- Public content anonymization before publication.

### Logging Restrictions
- No passwords, tokens, cookies, 2FA secrets, OTPs, SMTP credentials, document contents, case summaries, client names, AI prompt bodies, provider raw responses, API keys, or file contents.
- Pseudonymous IDs preferred in telemetry.

## Security Tests
- Unauthenticated protected route returns 401 or redirects.
- Client cannot access another client's case, document, appointment, or payment.
- Lawyer cannot access unassigned case unless permission exists.
- Marketing cannot publish case study without approval permission.
- Staff cannot change roles/settings without super-admin permission.
- Staff login reaches admin without TOTP while `STAFF_2FA_MODE=disabled`.
- TOTP and staff 2FA reset routes return `FEATURE_DISABLED`.
- Installer preflight/bootstrap/finish require setup token; installer locks after first Super Admin.
- Panel-aware preflight rejects unsupported hosting before migration or bootstrap.
- Upload rejects unsupported type and files over 5MB.
- Upload rejects oversized `Content-Length` before multipart parsing.
- Download endpoint denies unauthorized file.
- Login is rate limited.
- AI Gateway calls are rate limited. TOTP and Email OTP are disabled.
- AI Gateway rejects schema-invalid output and logs only safe metadata.
- CSRF/origin test for state-changing cookie-auth endpoints.
- Rich text/content rendering does not execute HTML/script.
- Protected private responses are not shared-cacheable.
- `/stitch-clone/*` is unavailable in production unless explicitly enabled for visual QA.
