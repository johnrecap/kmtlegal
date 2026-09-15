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

- [x] T17.1 Rebuild form on new Field components (T1.4) — no `!important`; all states (default/focus/error/disabled/loading/success) on semantic tokens in both themes.
- [x] T17.2 Modern submit: ShimmerButton-style primary (React Bits, reduced-motion: static), inline spinner + `aria-busy` kept, success panel with check animation (300ms) + "New message" reset.
- [x] T17.3 Content: real office address(es), phone number(s) with `dir="ltr"` isolation, unified email domain decision; add WhatsApp link (matches existing chat fallback).
- [x] T17.4 Branch cards → location cards with map-pin icon, address, phone, hours; tokenized surfaces.
- [x] T17.5 Field-level server error mapping: API error codes → per-field messages (reuse `clientErrorMessage` pattern); error box `role="alert"` kept.
- [x] T17.6 Verify AR: labels, validation messages, phone `bdi`, RTL focus order.

## Verify

- [x] Form submits successfully (e2e or manual against dev server); error + success paths render correctly in both themes/directions.
- [x] axe: labels, contrast, placeholder color AA.

## Completion notes (2026-09-15)

- Form rebuilt on the shared Field family (`TextInput`/`Select`/`Textarea` from `field.tsx`) inside a `publicPanel` token shell — zero `!important` classes, placeholder color now the AA `--muted-foreground` token (input bg `rgb(255,255,255)` light / `rgb(21,23,28)` dark verified).
- Submit is `ShimmerButton` (kmt-motion-cta) with inline spinner + `aria-busy`; success panel uses `success-*` state tokens with a `check_circle` icon on the new `kmt-motion-check-in` 300ms animation (`motion-reduce: none` verified).
- Field-level server error mapping: `error.details[].path` → localized `contactForm.fieldErrors.*` per field (EN+AR), `aria-invalid` + `aria-describedby` wiring through the Field shell, consent error rendered as a linked `role="alert"` paragraph; unmapped paths fall through to the alert box only.
- Location cards: map-pin address, `schedule` hours, `mail` mailto link; phone row renders only when `contactChannels.phoneHref` is set. Per office decision the Cairo address is published at area level ("New Cairo, Cairo, Egypt" / "القاهرة الجديدة، القاهرة، مصر") and phone/WhatsApp values are empty placeholder slots in `public-content.*.ts` (`contactChannels`) ready for the real number — the WhatsApp card and tel link light up automatically once filled.
- Email domain unified on `kmtlegal.com` (`careers@kmtlegal.org` → `.com` across EN/AR content, privacy links, tests, and the SMTP fallback was already `.com`).
- e2e `expectDarkLuxurySurface` now treats `contact-form` as `public-tokens` (with the services directory); RTL select-arrow and PLAN-28 contact hero/motion/overflow suites pass; 3 pre-existing home-page-only failures (`home hero crop`, `public internal links`, `home(-ar) cinematic motion`) were confirmed failing on clean HEAD before this change — unrelated to contact.
- Tests: +2 field-error mapping cases in `tests/ui/contact-form-recovery.test.tsx` (563 unit tests pass), privacy assertions updated to the unified domain, 46/46 smoke e2e.
