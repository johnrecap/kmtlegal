# 31 — Portal Home (dashboard)

> Phase 3 · Depends on `00`, `01`, `30`.

## Route

`/client` — `src/app/(client)/client/page.tsx` (force-dynamic, `requirePortalPage`).

## Components

4 metric cards (cases/appointments/files/dues with amber due tone), "next step" smart panel, cases/appointments/payments panels, `ClientPortalEmpty` states.

## Issues (audit)

- [P1] Neutral/closed badges unreadable on dark (~1.5:1): `bg-white text-kmt-muted` + remapped muted (`badge.tsx:7,10` + `globals.css:172-174`) — affects `client/page.tsx:166,194`.
- [P1] Due-total sums mixed currencies labeled EGP (`client/page.tsx:30-34,125`).
- [P3] No loading skeleton (all data awaited inline).

## Tasks

- [ ] T31.1 Metric cards on token surfaces with count-up animation (React Bits, reduced-motion: static); due tone uses warning state tokens.
- [ ] T31.2 **Currency-safe totals**: group dues by currency, render per-currency amounts (or "multiple currencies" summary); same fix on payments page (T35.1).
- [ ] T31.3 Badges → new Badge component (T1.3), readable in both themes.
- [ ] T31.4 Next-step panel: tokenized card with icon + CTA (Button); logic (due → appointment → upload → assistant) unchanged.
- [ ] T31.5 Skeleton loading via `loading.tsx` (from T30.5) matching panel layout.
- [ ] T31.6 Empty states on State component with icons + action links.

## Verify

- [ ] Multi-currency fixture shows correct per-currency totals (unit or e2e).
- [ ] Screenshots 375/1440 × EN/AR × themes.
