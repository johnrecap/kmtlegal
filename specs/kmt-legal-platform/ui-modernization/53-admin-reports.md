# 53 — Admin Reports

> Phase 4 · Depends on `00`, `01`, `40`.

## Route

`/admin/reports` — `src/app/(app-ar)/admin/reports/page.tsx`.

## Components

Report period filters, metric summaries, `StatusBars` distribution visualizations, currency-mix warning.

## Issues (audit)

- [P3] Progress bars have no `role="progressbar"`/`aria-valuenow`; raw `bg-slate-100` track (`reports/page.tsx:119-121`).
- [P3] Currency-mix warning rendered as InlineFeedback here but raw amber box in finance (`:230-232` vs `finance/page.tsx:680`) — unify after T48.3.

## Tasks

- [ ] T53.1 StatusBars: accessible (`role="progressbar"`, `aria-valuenow`, `aria-label`), token track/fill colors, count-up fill animation (300ms, reduced-motion: static); RTL bars fill from right.
- [ ] T53.2 Report cards on tokens; period filter on shared components; export actions as proper Buttons.
- [ ] T53.3 Warning unification: single currency-mix InlineFeedback component shared with finance.
- [ ] T53.4 Both themes; numbers tabular with `dir="ltr"` isolation.

## Verify

- [ ] Screen-reader pass on bars; screenshots 375/1440 × themes.
