# 21 — Payment Return + Receipt

> Phase 2 · Depends on `00`, `01`, `10`. Money-critical: behavior preserved exactly; only presentation/locale fixes.

## Routes

| Locale | URL | Source |
|---|---|---|
| Bilingual | `/payment/consultation/return?attemptId=&token=&locale=` | `src/app/(public-ar)/payment/consultation/return/page.tsx` |
| AR | `/payment/consultation/receipt?token=` | `src/app/(public-ar)/payment/consultation/receipt/page.tsx` + `consultation-payment-receipt-document.tsx` |

## Components

Status hero (tiered disclosure: public status vs token-verified details), details `dl` grid, payment-status-poller (pending state), re-booking resume link, receipt document (print-friendly).

## Issues (audit)

- [P1] Language switch drops `attemptId`/`token` → "incomplete link" error (`return/page.tsx:35` + shell switch).
- [P1] `formatMoney` without locale → Arabic-Indic currency in EN flow (`return/page.tsx:76,174`; `legal-format.ts:136-143`).
- [P2] No `robots: noindex`, no own metadata; EN content under `lang="ar" dir="rtl"` document.
- [P3] Raw status enum "PAID/PENDING" in AR grid (`return/page.tsx:75`); `"N/A"` instead of Arabic label (`:78`).
- [P3] Receipt Arabic-only even for EN buyers; back arrow not mirrored (`receipt-document.tsx:24`); `md:border-l` physical (`:114`); back link → `/client/payments` login-traps logged-out payers.

## Tasks

- [ ] T21.1 Locale-correct money: pass `locale` to `formatMoney` everywhere on this page; localize `paymentStatusLabels` usage for status value.
- [ ] T21.2 Query preservation in language switch (depends on T10.4) — verify `attemptId`, `token`, `resumeAttemptId` survive.
- [ ] T21.3 Page metadata: title per locale, `robots: noindex`; document-level lang/dir correct per locale (move page to a shared locale-aware shell or set via layout param).
- [ ] T21.4 `"N/A"` → `copy.labels.unavailable` per locale.
- [ ] T21.5 Receipt: locale support (EN + AR labels, `dir` per locale), mirrored back arrow (`rtl:rotate-180`), `border-s` logical property; back link → smart (logged-in client: `/client/payments`; logged-out: localized "check your email" note instead of login trap).
- [ ] T21.6 Status hero states (success/pending/failed/expired/financial-review) on state tokens + icons; pending poller countdown kept LTR; subtle success animation (check draw 300ms, reduced-motion: static).
- [ ] T21.7 Verify HMAC token-gating behavior unchanged; tiered disclosure intact.

## Verify

- [ ] e2e/manual: return page in EN + AR with valid/expired/missing tokens; money format matches locale; poller works.
- [ ] `view-source`: `noindex` present; correct `lang`/`dir` per locale.
- [ ] Receipt print preview both locales.
