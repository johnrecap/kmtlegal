# 20 — Public Client Account Setup (EN + AR)

> Phase 2 · Depends on `00`, `01`, `10`.

## Routes

| Locale | URL | Source |
|---|---|---|
| EN | `/client-account/setup` | `client-account/setup/page.tsx` → `ClientAccountSetupPage` + `client-account-setup-form.tsx` |
| AR | `/ar/client-account/setup` | `ar/client-account/setup/page.tsx` → same, `force-dynamic`, token-gated |

## Components

Gold-gradient hero/form panel, consultation summary aside (`dl` cards), states: expired/invalid token, existing account, valid → setup form.

## Issues (audit)

- [P2] Nested `<main>` — PublicShell already renders one (`client-account-setup-page.tsx:45` + `public-shell.tsx:46`).
- [P2] Off-system: `max-w-[1060px]` container, `rounded-full` pill CTAs, `font-serif` h1 (`client-account-setup-page.tsx:46,50,52`).
- [P2] Header language switch drops `?token=` (component-internal redirect preserves it, `:32-37`; shell switch does not).
- [P3] Error box `role="status"` should be `role="alert"` (`client-account-setup-form.tsx:146-150`); nav marks "Home" active (`client-account-setup-page.tsx:43`).

## Tasks

- [ ] T20.1 Fix semantics: single `<main>` (change inner to `<section>`); error `role="alert"`; nav active state neutral.
- [ ] T20.2 On-system styling: site container width, new radius ramp, display font (no `font-serif`), Button/ButtonLink migration — page joins the site skin while keeping its distinct gradient hero.
- [ ] T20.3 Token preservation: ensure header language switch keeps `?token=` (depends on T10.4); verify round-trip EN↔AR.
- [ ] T20.4 Form on new Field components; field-level validation UX kept (email regex, password length/mismatch, `aria-invalid`/`aria-describedby`); both themes.
- [ ] T20.5 States (expired/invalid/existing/valid) on State component tokens with icons; success → redirect to `/client` kept.

## Verify

- [ ] Full flow e2e with fresh token: form validation, success redirect; expired-token state renders.
- [ ] Screenshots 375/1440 × EN/AR × themes.
