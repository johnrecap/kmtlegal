# PLAN-24 Remediation & Production Readiness

## PLAN-25 / PLAN-26 Superseding Note

PLAN-25 changes the auth release decision: TOTP is no longer active for this release. Earlier PLAN-24 items that mention TOTP-only staff 2FA or reset hardening are historical remediation context; the active production gate is now `STAFF_2FA_MODE=disabled`, disabled 2FA routes, and token-protected installer bootstrap.

PLAN-26 changes the hosting wording from VPS-only to VPS-class panel-aware setup. Earlier PLAN-24 rows that say VPS smoke remain valid for Terminal VPS, but aaPanel/cPanel compatibility requires PLAN-26 preflight and panel-specific smoke evidence.

## Purpose
PLAN-24 converts review findings into release-blocking tasks. It does not replace PLAN-04 or PLAN-23; it closes the gaps that prevent those plans from being marked production-ready.

## Decision Rule
Only work that closes a known finding or a release gate belongs here. Feature expansion, visual redesign, payment gateway work, social publishing, and real AI provider enablement are out of scope.

## Findings Converted To Tasks

| Task | Status | Closure Evidence |
| --- | --- | --- |
| P24-01 Spec/status hygiene | In progress | `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`, this document, Spec Kit gate updates |
| P24-02 Git/log hygiene | Done | `_workspace/` and `debug.log` ignored |
| P24-03 No false release-ready script | Done | `qa:local:release` labels itself local-only; `qa:release` added |
| P24-04 `/api/auth/me` no-store | Done | Route response sets `Cache-Control: no-store`; source contract test |
| P24-05 Super Admin 2FA reset UUID validation | Done | Route parses `userId` with `uuidSchema`; source contract test |
| P24-06 Disable Email OTP fallback | Done | 2FA form is TOTP-only and `/api/auth/2fa/email/*` returns `FEATURE_DISABLED` |
| P24-07 Confirmation checkboxes required | Done | Case status and document delete checkboxes are browser-required |
| P24-08 Admin form success/error split | Partial | Case and task/document admin forms now separate success/error states |
| P24-09 Playwright `KMT_PORT` baseURL | Done | Runner sets `PLAYWRIGHT_BASE_URL`; config reads it |
| P24-10 Stitch screenshot assertions | Done | Screenshot tests assert route status and visible body |
| P24-11 Production DB fallback removed | Done | Prisma runtime/config throw in production without `DATABASE_URL` |
| P24-12 Production readiness requires DB URL | Done | `DATABASE_URL_REQUIRED` production issue added |
| P24-13 Production bootstrap split from demo seed | Done | Production seed returns after roles/permissions/settings |
| P24-14 Seeded document backing file | Done | Demo seed writes a private upload PDF under `UPLOADS_DIR` or `_workspace/uploads` |
| P24-15 Trusted IP handling | Done | Production uses `X-Real-IP` and ignores client-supplied `X-Forwarded-For` |
| P24-16 Session-level 2FA attempt lockout | Done | Session attempt count/lock fields, migration, tests |
| P24-17 AI limiter before public booking AI calls | Done | Public consultation organizer uses `rateLimiters.ai` before provider calls |
| P24-18 Upload early `Content-Length` rejection | Done | Upload route rejects oversize requests before `formData()` |
| P24-19 Disable Stitch clone in production | Done | Middleware blocks `/stitch-clone/*` unless `ENABLE_STITCH_CLONE=true` |
| P24-20 API manifest cleanup | Done | Finance/calendar/files/portal contracts aligned with implemented routes |
| P24-21 Route manifest contract test | Done | `tests/server/route-manifest-contract.test.ts` |
| P24-22 DB-backed E2E entrypoint | In progress | `test:e2e:db` added; requires real PostgreSQL seed |
| P24-23 Secret scan | Done | `security:secrets` script added |
| P24-24 Dependency audit remediation | Open | Needs controlled Next/Prisma upgrade pass |
| P24-25 VPS production smoke | Open | Needs staging/VPS execution |

## Release Gates
PLAN-04 can close only after:
- `DATABASE_URL` points at PostgreSQL.
- `npm run qa:db` runs migrate + seed + seed + DB E2E.
- Seeded document download is verified against a private `UPLOADS_DIR`.

PLAN-23 can close only after:
- `npm run qa:local`
- `npm run qa:db`
- `npm run qa:release`
- dependency audit findings are resolved or accepted with documented risk
- VPS smoke passes behind Nginx/TLS/systemd

PLAN-24 can close only after:
- all `Partial` and `Open` rows above are done
- `docs/SECURITY_AUDIT_FINDINGS.md` reflects the final dependency audit state
- `docs/RELEASE_QA_CHECKLIST.md` contains the final VPS evidence

## Commands
```bash
npm run qa:local
npm run qa:db
npm run qa:release
npm run security:secrets
npm run security:audit
```

## Production Notes
- Production target is VPS-class hosting. Terminal VPS remains the default; aaPanel/cPanel require PLAN-26 compatibility preflight.
- Uploads remain under private filesystem storage, never `public/`.
- Nginx must pass `X-Real-IP $remote_addr`.
- Production must not expose demo users, demo password env, demo TOTP env, or `/stitch-clone/*`.
- AI real provider remains guarded until limiter, timeout, schema validation, and cost controls pass release QA.
