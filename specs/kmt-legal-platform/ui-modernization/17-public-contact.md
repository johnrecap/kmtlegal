# 17 — Public Contact

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URLs | Source |
|---|---|---|
| EN | `/contact` | `contact/page.tsx` → `ContactPageView` + `contact-form.tsx` |
| AR | `/ar/contact` | catch-all → same view |

## Components

PageHero, ContactForm (name/email/phone/topic/message + consent checkbox), branch cards aside.

## Issues (audit)

- [P1] Form theme relies on `!important` cascade patches (`contact-form.tsx:32-39`) — dies with token migration.
- [P2] Trust gap: no physical addresses, no phone numbers; branch "addresses" are procedural sentences (`public-content.en.ts:168-181`); inconsistent email domains (`.com` vs `.org`).
- [P3] Placeholder contrast `placeholder:!text-amber-100/45` below AA (`contact-form.tsx:35`).
- [P3] Native validation only; no field-level server error mapping.

## Tasks

- [ ] T17.1 Rebuild form on new Field components (T1.4) — no `!important`; all states (default/focus/error/disabled/loading/success) on semantic tokens in both themes.
- [ ] T17.2 Modern submit: ShimmerButton-style primary (React Bits, reduced-motion: static), inline spinner + `aria-busy` kept, success panel with check animation (300ms) + "New message" reset.
- [ ] T17.3 Content: real office address(es), phone number(s) with `dir="ltr"` isolation, unified email domain decision; add WhatsApp link (matches existing chat fallback).
- [ ] T17.4 Branch cards → location cards with map-pin icon, address, phone, hours; tokenized surfaces.
- [ ] T17.5 Field-level server error mapping: API error codes → per-field messages (reuse `clientErrorMessage` pattern); error box `role="alert"` kept.
- [ ] T17.6 Verify AR: labels, validation messages, phone `bdi`, RTL focus order.

## Verify

- [ ] Form submits successfully (e2e or manual against dev server); error + success paths render correctly in both themes/directions.
- [ ] axe: labels, contrast, placeholder color AA.
