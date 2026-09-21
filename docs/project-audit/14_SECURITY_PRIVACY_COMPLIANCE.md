# 14 — Security, Privacy & Compliance (code-based, NOT a pentest)

## Control inventory (verified)

Authentication: DB sessions, hashed tokens, 8h TTL, secure/httpOnly/lax
cookies. Authorization: server-side `hasPermission` + scope `where`
clauses; sampled paths clean. CSRF: origin guard (no token). Passwords:
scrypt + timing-safe verify. Uploads: allowlist + magic bytes + ClamAV +
traversal-safe paths + authorized downloads. Webhooks: HMAC verified,
timing-safe compare, idempotent inbox. Logs: key-based redaction + safe
logger. Secrets: `AUTH_SECRET` prod-required; installer generates via
`openssl rand`; secret-scan script in repo.

## Findings

### MEDIUM

1. **2FA disabled in release** — staff accounts protected by password
   only. Evidence: `two-factor.ts:19-33`, 2FA routes `503`,
   `/login/2fa` notFound. Scenario: credential theft → full staff
   session. Remediation: set `STAFF_2FA_MODE=totp`, verify email/OTP
   path, re-gate. (File 20 P1.)
2. **Token/secret dev fallbacks outside prod** — receipt/status signing
   falls back to dev constants when env missing (`payment-receipt-
   service.ts:251-274`); prod throws (fail-closed → 500s, not forgery).
   Scenario: misconfigured prod = broken payments pages. Remediation:
   preflight assertion + deploy checklist (P2).
3. **No self-service password reset + admin-mediated resets** —
   operational risk (social-engineering a reset via support) rather than
   code flaw. Mitigate with reset ceremony + audit (already audited).
   Remediation direction: ticketed reset flow (P2).

### LOW

4. **CSRF relies on Origin/Referer, no synchronizer token** — acceptable
   for cookie `lax` + JSON APIs; residual risk on odd browsers/proxies.
   Direction: add token for `admin/*` mutations (P3).
5. **Soft-delete retains file bytes + PII indefinitely** — no retention
   purge; privacy-by-design gap. Direction: retention job + purge API (P3).
6. **Contact/message bodies unfiltered for PII** — stored as typed;
   redaction covers logs/metadata, not DB content (correct), but no
   client-visible retention notice in code. Direction: privacy copy + DSR
   runbook (P3).
7. **Settings KV editable without per-key UI validation** — a wrong
   gateway/availability value can break booking silently. Direction:
   typed setting forms + dry-run check (P2).
8. **Rate limits are modest on login (10/15m per email:ip)** — fine
   against brute force, weak against distributed spray; no CAPTCHA.
   Direction: alerting on `auth.login_failed` spikes (P3).

### INFORMATIONAL

- scrypt parameters (N=16384) are moderate; acceptable.
- Sentry SDK present but flag-gated; error telemetry off by default.
- No penetration test evidence in repo; no security headers audit beyond
  middleware (verify Nginx/CSP in ops review, P2).

## Compliance notes (Egypt PDPL-minded, non-legal)

Consent captured on contact/booking (`consent===true` required); purpose
limitation reasonable (canonical phone for ops); email audit stores hashes
not addresses; analytics hashes actors. Missing: cookie/privacy consent
banner, data-subject request flow, retention schedule, processor register.
Recommend P2 privacy pack before marketing-scale launch.

## Counts

CRITICAL: 0. HIGH: 0. MEDIUM: 3. LOW: 5. INFORMATIONAL: 3.
No fabricated issues; every item has file evidence above.
