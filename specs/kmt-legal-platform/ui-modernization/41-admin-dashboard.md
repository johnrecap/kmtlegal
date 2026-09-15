# 41 — Admin Dashboard (home)

> Phase 4 · Depends on `00`, `01`, `40`.

## Route

`/admin` — `src/app/(app-ar)/admin/page.tsx` + `src/features/admin/dashboard/*`.

## Components

Hero with permission-filtered quick actions, client quick-search, metric cards (linked, timeframe/scope meta), priority lists with per-section StateBlocks, recent activity.

## Issues (audit)

- [P2] Dead token `text-kmt-goldLight` — renders plain white, loses gold accent (`admin-command-center.tsx:42`).
- [P3] Metric card uses Material Symbols font — only font-based icon in admin (`dashboard-metric-link.tsx:24-26`).
- [P3] No skeletons on slow sections.

## Tasks

- [ ] T41.1 Replace `kmt-goldLight` with token gold (AA in both themes).
- [ ] T41.2 Metric cards → inline-SVG icon system (font usage deleted); count-up animation (reduced-motion: static); link hover depth on tokens.
- [ ] T41.3 Quick actions: Card grid on tokens, primary/secondary hierarchy clear; permission fallback cards kept.
- [ ] T41.4 Priority lists: skeletons while pending; error recovery blocks (existing pattern) retokenized.
- [ ] T41.5 Client quick-search: SearchInput skin unified (T1.4), results dropdown keyboard-navigable.

## Verify

- [ ] Screenshots 375/1440 × themes; reduced-motion check; permission-restricted account shows fallbacks.
