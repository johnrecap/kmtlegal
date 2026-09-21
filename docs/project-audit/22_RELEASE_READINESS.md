# 22 — Release Readiness

## Proven Green

Typecheck 0 errors; lint clean; unit 616/0/53; smoke 42/42; build 40/40;
public census all-200 + unknown-404; header lock closure file-verified;
server permission samples clean; upload 413/415 + download auth + delete
404 test-proven; webhook HMAC/idempotency/replay unit-proven.

## Works But Has Limitations

Booking→checkout→webhook→invoice→receipt chain (code-complete, sandbox
unproven); chat/notifications (polling, no realtime); tasks/calendar
(no recurrence/reminders); CMS (no delete/scheduler/SEO); reports
(no export); analytics (untested E2E).

## Environment-Gated / Could Not Be Proven

Live Paymob charge + webhook delivery; ClamAV-on uploads; live AI model;
SMTP; PM2 worker supervision; fresh install on clean VM; restore drill;
multi-user concurrency beyond unit TX proofs.

## Broken / Incomplete

BROKEN: 0 proven. Incomplete (NOT WIRED): client-create UI, manual attempt
field, settlement, social poster, scheduled publisher, content delete,
calendar cancel UI, WhatsApp API, assignment/trigger gaps.

## Security Concerns

No Critical/High. MEDIUM ×3 (2FA off, secret-dev-fallback ops risk,
admin-mediated resets). LOW ×5, INFO ×3 (file 14). Residual: permission
matrix sampled not exhaustive; headers/CSP not reviewed; no pentest.

## Operational Concerns

`UPLOADS_DIR` outside DB backup (P1); worker liveness unmonitored;
single-node storage assumption; monolithic deploy script without rollback;
installer vs panel path divergence; build hatch must stay out of prod.

## Missing Tests

Provider sandbox E2E; ClamAV staging; installer fresh run; restore drill;
permission matrix; a11y; load. (File 17.)

## Deferred Features

Self-service reset, 2FA enablement, refunds, settlement, recurrences,
reminders, realtime, auto-poster, bulk ops, exports, SEO/versioning.

## Ship-Blocking Findings

No P0. Five P1 items (file 20) to clear or formally accept: 2FA, hidden-API
leak decision, payment sandbox proof, uploads backup, ClamAV staging proof.

### RELEASE DECISION INPUT

If shipped today, known risks:
1. Password-only staff auth (2FA off).
2. Payments unproven against live provider (config/URL/keys risk).
3. Uploads fail closed if ClamAV misconfigured; files unrecoverable if
   only DB is restored.
4. Hidden article/study APIs readable to anyone guessing slugs.
5. No realtime/scale headroom (polling + single-node disk) — fine for
   office launch, not for traffic spikes.
6. Support load: no guest self-cancel/reschedule, no password self-reset.

Low-risk release first (address before deployment):
1. Enable + verify TOTP 2FA for staff.
2. Decide hidden-API posture (gate or document).
3. Paymob sandbox end-to-end on staging.
4. Add `UPLOADS_DIR` snapshot + restore drill.
5. Stage ClamAV upload test (incl. EICAR).
6. Turn on worker + backup monitoring/alerts.
