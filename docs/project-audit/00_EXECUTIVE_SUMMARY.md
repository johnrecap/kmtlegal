# 00 — Executive Summary (read-only audit, 2026-09-20)

Code is the authority. 111 features rated: WORKING 24 · PARTIAL 41 ·
ADMIN ONLY 11 · DISABLED 5 · DEFERRED 14 · PUBLIC HIDDEN 3 · NOT WIRED 9 ·
MOCK/STUB 1 · UNKNOWN 3 · BROKEN 0. Security: 0 Critical, 0 High,
3 Medium, 5 Low. Full evidence in files 01–22.

## What KMT Legal currently is

Bilingual (EN/AR, RTL-correct) law-office platform: luxury public site +
client portal + full staff admin + conversational booking with Paymob
checkout + case/CRM/calendar/tasks/documents/finance/messages/
notifications + governed AI helpers + CMS (public-hidden) — on Next.js 15,
PostgreSQL/Prisma (36 models), custom session auth, VPS-local files.

## What users (public) can do

Browse home/services/team/contact, book consultations via chat wizard
(slots → review → Paymob → return/receipt pages), contact the office
(`MSG-` reference), set up portal accounts via secure link, toggle theme/
language, reach WhatsApp. Articles/case-studies/media stay hidden.

## What clients can do

Dashboard, cases + sessions + appointments + payments + receipts,
`CLIENT_VISIBLE` downloads, uploads (5MB, scanned), team chat (5s poll),
deterministic AI organizer, profile/locale edit. Cannot: self-serve
appointments, pay in-portal, manage files, change passwords.

## What staff/admin can do

Command-center dashboard; case/CRM/consultation pipelines (assign, review,
schedule, convert, version-locked outcomes); calendar + reschedule with
overlap guard; tasks; document review + soft-delete; manual invoices +
pricing + gateway/attempt/webhook ops + replay; messages + contact inbox;
notifications; reports; users/roles (Super-gated); content + AI drafts;
settings; audit log.

## Major technical systems

Custom session auth (scrypt, 7 roles, ~64 permissions, server-enforced);
serializable booking/payment TXs; HMAC webhooks + idempotent inbox;
magic-byte uploads + ClamAV gate; OpenAI-compatible AI gateway (default
mock) with no-advice guard; first-party analytics; PM2/aaPanel deploy
with health-gated releases.

## Strongest parts

Locked UI kit + RTL/motion discipline; server-side permission + scoping
(no UI-only holes in samples); payment safety engineering (idempotency,
sticky PAID, strict money checks, replay); upload validation depth;
consultation state machine + optimistic locking; audit trails.

## Weakest parts

Env-gated unknowns (live charge, ClamAV, AI, SMTP); polling instead of
realtime; single-node storage; CMS dead-ends (no delete/poster);
settings opacity; support gaps (no self-cancel/reset).

## Fully working (proven)

Public pages/nav/footer/theme/RTL/404s, login/logout/sessions/guards,
sitemap, conflict/price/expiry guards, tasks core, health-gated build
(typecheck/lint/unit/smoke/build green).

## Partially proven

All DB-backed flows (code + tests, no live session here): booking,
payments, portal, admin CRUD, chat, notifications, CMS, analytics.

## Disabled / deferred

Disabled: 2FA, SMTP, PayTabs-live, legacy manual booking, preview.
Deferred: self-reset, refunds/settlement, recurrences, reminders,
realtime, auto-poster, bulk ops, exports, SEO/versioning.

## Most important risks

1. 2FA off (MEDIUM). 2. Payments unproven live. 3. Files outside DB
   backup. 4. Hidden-API slug leak. 5. ClamAV path unproven.

## Summaries

- Security: 0 Critical/High; harden via P1/P2 (file 14).
- Payments: Paymob live-path coded + guarded; PayTabs standby; no refunds;
  needs sandbox proof + worker monitoring.
- AI: default mock; deterministic client helper; guarded gateway; needs
  keys + red-team before live.
- Tests: ~96 vitest + 29 specs, strong service coverage, gaps in sandbox/
  staging/a11y/load (file 17).
- Deploy: solid panel script + health gates + verified dumps; missing fs
  backup, rollback script, monitoring (file 18).

## Top 10 findings

1. Zero broken features; 41 partials are env-gated, not defective.
2. Permission enforcement is server-side (sampled clean).
3. Payment safety design is production-grade on paper.
4. Hidden content APIs leak PUBLISHED rows (P1 decision).
5. 2FA exists but ships off (P1).
6. Uploads combine 4 server-side gates (allowlist/magic/ClamAV/auth).
7. Booking has serializable anti-double-book + idempotency + sweeper.
8. Client portal is read-mostly; self-service gaps drive support load.
9. CMS publishes to nowhere (public hidden, no poster).
10. Ops backup omits file bytes (P1).

## Top 10 next actions

1. Enable TOTP 2FA (S). 2. Gate/document hidden APIs (XS).
3. Paymob sandbox E2E (S). 4. FS backup + restore drill (S).
5. ClamAV staging test (XS). 6. Monitoring for worker/backups (XS).
7. Guest self-cancel/reschedule (M). 8. Client-create UI fix (XS).
9. Permission-matrix test (S). 10. Privacy pack: banner + DSR + retention (S).

Details + effort sizes: file 20. Counts: file 21. Release input: file 22.
