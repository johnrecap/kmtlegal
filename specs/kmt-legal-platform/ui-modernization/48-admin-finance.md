# 48 — Admin Finance

> Phase 4 · Depends on `00`, `01`, `40`. Largest admin page (814 lines) — includes structural rework.

## Route

`/admin/finance` — `src/app/(app-ar)/admin/finance/page.tsx`.

## Components

Invoices table, pricing rules, gateway settings, payment attempts, webhook events, CSV export, currency-mix warning.

## Issues (audit)

- [P2] Dead `bg-kmt-surface-muted` class — panels render transparent (`finance/page.tsx:463,468,553`).
- [P2] Three raw-amber warning boxes bypass tokens (`:500,574,680`).
- [P2] Dead duplicate panel `GatewayOperationsPanel` never rendered (`:242-338`).
- [P3] Raw enum leakage: `توقيع {event.signatureStatus} · replay {event.replayCount}` shows "VALID"/English (`:551`).
- [P3] "تصدير CSV" injected into count row (`:741-751`).

## Tasks

- [ ] T48.1 **Split the monolith** into feature components: `finance-invoices.tsx`, `finance-pricing.tsx`, `finance-gateways.tsx`, `finance-attempts.tsx`, `finance-webhooks.tsx` (files under `src/features/admin/finance/`); page composes them. No route/API changes.
- [ ] T48.2 Fix dead tokens → `bg-surface-muted` semantic token.
- [ ] T48.3 All warnings → warning-state InlineFeedback; localize enum values (`signatureStatus`, `processingStatus`, `attempt.status` via label maps in `ui-copy.ts` or `legal-format.ts`); "replay" → "إعادة تشغيل".
- [ ] T48.4 Delete `GatewayOperationsPanel` dead code.
- [ ] T48.5 Invoices/attempts/webhooks tables on retokenized DataTable; CSV export as proper secondary Button in header actions; shared pagination.
- [ ] T48.6 Money cells: per-currency formatting kept, `dir="ltr"` isolation, tabular numerals.
- [ ] T48.7 Gateway settings: secrets stay write-only (no read-back) — verify unchanged; forms on Field components.

## Verify

- [ ] Behavior parity checklist: invoices filter/sort, pricing edit, webhook replay action, CSV export all work post-split.
- [ ] Screenshots 375/1440 × themes; no raw enums in AR UI.
