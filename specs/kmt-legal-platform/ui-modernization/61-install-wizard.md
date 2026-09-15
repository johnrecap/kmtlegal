# 61 — Install Wizard

> Phase 4 (low priority) · Depends on `00`, `01`. Env-gated (`INSTALLER_ENABLED=true`) + installer token.

## Route

`/install` — `src/app/(install-ar)/install/page.tsx` + `src/features/install/install-wizard.tsx`.

## Components

4-step wizard: hosting mode radio cards, installer token, office + super-admin bootstrap, lock installer; side panels (selected mode, installer status, preflight checks); role="alert"/"status" notices.

## Issues (audit)

- [P3] Unstyled browser-default radio inputs (`install-wizard.tsx:213-220`).
- [P3] No autofocus into first field per step; feedback panels below all cards on mobile (`lg:grid-cols-[minmax(0,1fr)_22rem]`).

## Tasks

- [ ] T61.1 Radio cards: custom styled radios (token ring on checked, 44px hit area) keeping native input semantics; keyboard `arrows` work.
- [ ] T61.2 Step transitions: token motion (300ms slide/fade, reduced-motion: instant); autofocus first field per step; step indicator with progress.
- [ ] T61.3 Components on tokens (Card/Field/Button/InlineFeedback); both themes.
- [ ] T61.4 Mobile: status/feedback panel collapses into an expandable summary above the cards.
- [ ] T61.5 Security behavior unchanged: token checks, `timingSafeEqual`, lock flow.

## Verify

- [ ] Manual run with `INSTALLER_ENABLED=true` in dev: all 4 steps, validation errors, lock step.
