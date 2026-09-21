# 20 — Gaps, Risks & Recommendations

## P0 — RELEASE BLOCKER

None proven. (Blocker #1 header lock was resolved in `8f1b3a6`; no new
P0 found. P1 items below should be cleared or explicitly accepted before
launch.)

## P1 — HIGH PRIORITY

1. **Enable staff 2FA (TOTP).** Problem: password-only staff auth.
   Evidence: file 05/14. Impact: account-takeover blast radius. Direction:
   `STAFF_2FA_MODE=totp`, exercise email+OTP+reset, re-gate. Effort: S.
2. **Close or accept hidden-API leak.** Problem: PUBLISHED articles/studies
   fetchable via public JSON while pages hidden. Evidence: file 02/13.
   Impact: content strategy bypass. Direction: gate APIs identically OR
   document as intentional. Effort: XS.
3. **Prove money movement on staging.** Problem: no live charge/webhook
   evidence. Impact: launch-day payment failure. Direction: Paymob sandbox
   end-to-end (checkout→webhook→invoice→receipt→account link). Effort: S.
4. **Back up `UPLOADS_DIR` with the DB.** Problem: DB-only restore orphans
   file rows. Evidence: file 18. Impact: data loss on restore. Direction:
   fs snapshot step in deploy script + restore drill. Effort: S.
5. **Prove ClamAV-on upload path in staging.** Problem: prod hard-fails
   closed (correct) but path unproven. Impact: uploads 503 at launch.
   Direction: staging scan test incl. EICAR. Effort: XS.

## P2 — IMPORTANT

6. Guest self-cancel/reschedule + SLA/overdue escalation (M).
7. Client-create UI vs service mismatch (XS).
8. Automated UI↔API permission-matrix test (S).
9. Settings typed forms + preflight secret assertions (S).
10. Payment-worker liveness monitoring + single-node storage note in ops
    runbook (XS).
11. Cookie/privacy consent + DSR runbook + retention schedule (S).
12. Fresh-install + backup-restore drills (S).
13. Content delete endpoints + resolve social SCHEDULED dead-end (S).
14. Security-headers/CSP ops review (XS).

## P3 — IMPROVEMENT

Duplicate-case warnings, retention purge job, CSRF tokens for admin
mutations, polling→realtime later, load test, a11y instrumentation
(skip-link, contrast, headings), SEO fields + version history for CMS,
AI prompt red-team before live model, Nginx/proxy review.

## P4 — OPTIONAL / FUTURE

Chat attachments/read receipts, calendar drag-drop, reports export/schedule,
multi-currency settlement, subscriptions, testimonials/FAQ public sections,
media library, analytics pipeline tests.
