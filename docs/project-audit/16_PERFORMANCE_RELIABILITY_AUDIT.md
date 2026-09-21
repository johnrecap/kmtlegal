# 16 — Performance & Reliability Audit (code-based)

## Findings

- Build: 40/40 static pages, ~95–119s compile; prod `start` verified on
  :3100 in Phase 13. No build-time data leaks (sitemap DB hook returns
  `[]`, public AR paths static-limited).
- Animations: Lenis smooth scroll + GSAP/Motion scoped to public views;
  reduced-motion respected; no global rAF loops found; header uses single
  rAF-throttled scroll listener. Risk LOW.
- Polling load: client chat 5s, admin threads 5s, bell 30s — per-session
  `cache:no-store` queries; fine at office scale, wasteful at consumer
  scale → P3 (consider SSE/Realtime later).
- DB queries: scoped listers with `take` limits (queues limit 6, feeds
  paginated, sessions take 20); conflict paths use Serializable TX with
  bounded retries (P2034 handled). N+1: listers select explicitly; no
  obvious unbounded `include` chains found in sampled services → residual
  LOW, recommend query-log sampling in prod (P3).
- Payloads: uploads capped 5MB + magic bytes; analytics props Json
  unvalidated-shape (rate-limited 60/min) → LOW.
- Images: Next Image usage on public views (Phase 13 visuals clean);
  no remote-image optimization config reviewed → P4.
- Client components: portal/admin are client-heavy by nature (polling,
  forms); no memoization audit performed → P4.
- Payment reliability: expiry sweeper runs on slot-list hits even if PM2
  worker is down (degraded but safe); webhook handler idempotent with
  replay → design is sound; needs prod key/URL config.
- Error recovery: fail-soft notifications, deterministic AI fallbacks,
  webhook `FAILED` states with review codes, 404/500 boundaries per group.
  No retry storms (bounded retries only).
- Timeouts: AI `TIMEOUT_MS` env; Paymob `REQUEST_TIMEOUT_MS`; ClamAV
  timeout; no global API timeout audit → P3.

## Risks (ranked)

1. Single-node local disk storage (no shared volume) — scale-out breaks
   file access → P2 (document in ops; R2/S3 later).
2. PM2 worker (`jobs:payments`) outside repo cron — silent stop degrades
   sweeps → P2 (monitor the process).
3. Polling architecture — cost/latency at scale → P3.
4. No load test evidence → P3 before marketing push.
