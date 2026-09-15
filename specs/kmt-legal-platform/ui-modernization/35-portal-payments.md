# 35 — Portal Payments

> Phase 3 · Depends on `00`, `01`, `30`. Money-critical: fix math + hierarchy; flows unchanged.

## Route

`/client/payments` — `src/app/(client)/client/payments/page.tsx`.

## Components

3 metric cards (dues count, due total, total records), booking payment attempts card grid (amount, status, appointment, invoice, continue/follow actions), invoice table (invoice + receipt numbers, case, amount, status, dates, receipt link).

## Issues (audit)

- [P1] **Due total sums mixed currencies as EGP** (`payments/page.tsx:193,200`; dashboard twin `client/page.tsx:30-34`).
- [P1] CTA hierarchy dead — "View invoice"/"Continue payment" declared `primary` but forced secondary look by `!important` class (`payments/page.tsx:123,164` vs `client-portal-components.tsx:12-13`).
- [P1] Locale dropped when linking to payment return page (`payments/page.tsx:168` — no `locale` param).
- [P2] Cancelled/failed badges unreadable on dark (`payments/page.tsx:75,103`).
- [P3] Receipt link → Arabic-only receipt + `/client/payments` back-trap (see T21.5).

## Tasks

- [ ] T35.1 **Per-currency due totals**: group by currency, render each with its own formatted amount; metrics show primary currency + "+N currencies" when mixed.
- [ ] T35.2 CTA hierarchy: "Continue payment" = primary Button (gold, AA); "View invoice"/"Follow status" = secondary; attempts card layout on tokens.
- [ ] T35.3 Locale hand-off: pass current locale to return/receipt links (`&locale=`); verified with T21.
- [ ] T35.4 Badges → new Badge (both themes); financial-review "do not pay again" copy kept verbatim on danger state tokens.
- [ ] T35.5 Invoice table on retokenized DataTable + mobile cards; receipt links keep signed-token URLs.
- [ ] T35.6 Attempt status cards: subtle status animation on change (poller), reduced-motion: static.

## Verify

- [ ] Multi-currency fixture: totals correct per currency; EN locale → EN payment return page.
- [ ] Screenshots 375/1440 × EN/AR × themes; financial-review warning visible.
