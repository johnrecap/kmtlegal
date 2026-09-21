# 19 — Dead Code, Deferred, Mocks

## Categories

### INTENTIONAL DEFERRED (documented, keep)

- Legacy manual booking `POST /api/public/consultations` → always 409
  `FEATURE_DISABLED` (conversational flow replaced it).
- 2FA stack (credential/OTP models, email templates, verify routes →
  `503`, `/login/2fa` → notFound) behind `STAFF_2FA_MODE=disabled`.
- SMTP stack (`nodemailer` wired, `SMTP_FEATURE_AVAILABLE=false`).
- PayTabs provider (code-complete standby, `PAYTABS_ENABLED=false`).
- Mock AI provider (`src/server/ai/providers/mock.ts` — intentional
  default with review notes).
- Preview routes (`/preview/*`, prod-`notFound` unless flag).
- Stitch export dir (read-only historical input per AGENTS.md; runtime
  `/stitch-clone` retired → branded 404s, spec-covered).
- Empty stub dirs (no route): `src/app/payment/consultation/return/`,
  `src/app/api/portal/profile/` — harmless, P4 cleanup.

### ACCIDENTAL INCOMPLETE (fix or track)

- Client-create UI disabled while `createAdminClient` exists (NOT WIRED).
- `PaymentAttempt.manualMethod` column never written (dead field).
- Social `SCHEDULED`/`PUBLISHED` with no poster (dead-end states).
- Article/case-study metadata helpers + sitemap DB hook (uncalled /
  returns `[]`).
- `NotificationType` members with no triggers (`CASE|APPOINTMENT|
  DOCUMENT|PAYMENT|SECURITY`); reminder/recurrence/reminder templates
  with no scheduler.
- Calendar cancel/delete UI absent (states exist).

### MOCKS / STUBS / PLACEHOLDERS

- Runtime mock: AI mock provider only (intentional). No stub payment
  provider, no fake DB seeds in prod path.
- `placeholder=` attributes are input hints (guarded by
  `admin-list-phase10.test.tsx` no-placeholder assertions).
- Test-only mocks widespread (`vi.mock`, fetch mocks) — correct scope.
- TODO/FIXME: 3 hits, 0 in `src/` runtime.

### DISABLED BY FLAG (not dead)

`INSTALLER_ENABLED=false` (post-install), `PAYTABS_ENABLED=false`,
`SMTP_ENABLED=false`, `STAFF_2FA_MODE=disabled`, Sentry flags off,
`MALWARE_SCAN_MODE=disabled` locally / `required` prod,
`PAYMENT_REQUIRE_WEBHOOK_SIGNATURE` strict in prod,
`CSRF_STRICT_ORIGIN` strict in prod, `AI_PROVIDER=mock`.

### notFound-gated routes

`/login/2fa` (always), `/preview/*` (prod), unknown service/lawyer/
article/study slugs, disabled installer, receipt without PAID.
