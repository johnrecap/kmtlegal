# 10 — Public Shell (header + footer, all public pages)

> Phase 2 · Depends on `00`, `01`. Applies to EN (`(public-en)`) and AR (`(public-ar)`) routes.

## Scope

| Area | Files |
|---|---|
| Shell | `src/components/layout/public-shell.tsx` |
| Header | `src/components/layout/public-header.tsx` |
| Motion | `src/app/globals.css` (`kmt-motion-*` system) |
| Smooth scroll | `src/components/motion-ui/smooth-scroll-provider.tsx` (from T0.10) |

## Components

PublicShell (header/main/footer), PublicHeader (sticky hide-on-scroll, services mega-dropdown, mobile accordion menu, language switch, ConsultationLink, ClientLoginLink), FinalCtaBand (dead code), footer link grid + legal bar.

## Issues (audit)

- [P2] Language switch drops query strings — breaks payment return (`public-shell.tsx:35-36` computes href via `stripPublicLocalePrefix(currentPath)` without search params).
- [P2] Footer legal bar `text-xs text-stone-500` ≈ 4.2:1 — AA fail (`public-shell.tsx:123`).
- [P2] Hardcoded hex `#f8f3ea`, `#120d07`, `#c7a363` bypass tokens (`public-shell.tsx:51,74,84,92,104`, `public-header.tsx:17,229`).
- [P3] Mobile menu doesn't lock body scroll (`public-header.tsx:260`); focus handling otherwise good.
- [P3] Dead code: `FinalCtaBand` (`public-components.tsx:275-301`).

## Tasks

- [x] T10.1 Mount `ThemeProvider` (default dark) + `SmoothScrollProvider` in both `(public-en)` and `(public-ar)` layouts. *(done in Phase 0 — verified here)*
- [x] T10.2 Add `ThemeToggle` to header action cluster (after language switch), localized aria-label; header stays glass-sticky in both themes. *(mounted in Phase 0; header glass verified both themes this phase)*
- [x] T10.3 Retokenize header/footer: replace `#f8f3ea/#120d07/#c7a363/stone-500` with semantic tokens; footer legal bar contrast ≥ 4.5:1 in dark and light. *(all stone-*/white/#hex → `--kmt-public-*` vars; legal bar now `--kmt-public-muted` = #cbd5e1 dark ≈ 10:1 / #57503f light ≈ 7:1; ConsultationLink → semantic primary tokens, AA both themes)*
- [x] T10.4 Fix language switch to preserve search params. *(new `languageSearch` prop on PublicShell; payment return passes explicit `languageHref` preserving ALL params + flipping `locale` — verified round-trip; account setup keeps `?token=`)*
- [x] T10.5 Modern header polish: glass-on-scroll kept (blur 24px verified), animated underline kept, mega-dropdown + mobile menu + chevrons on token motion (`duration-kmt-normal ease-kmt-out motion-reduce:transition-none`), body scroll lock + Tab focus trap on mobile menu with focus return to trigger.
- [x] T10.6 Delete `FinalCtaBand` dead code.
- [x] T10.7 Dark/light parity: every header state (scrolled, menu open, dropdown open) verified in both themes and both directions. *(screenshots + DOM probes; zero console errors)*

### Shared-surface groundwork done here (needed for header parity in light mode)

- `--kmt-public-*` vars are now **theme-aware**: `:root` = light values (warm paper canvas #f6f3ec, ink text, gold-700), `.dark` = previous dark values. New vars: `--kmt-public-line`, `--kmt-public-hover`, `--kmt-public-scrim` (RGB channels), `--kmt-public-header-shadow`, `--kmt-public-dropdown-shadow`, `--kmt-public-panel-shadow`, `--kmt-public-text-shadow`.
- Shared tokens in `public-components.tsx` (`publicSectionSurface`, `publicPanel`, `publicBorder`, …) now flip with the theme — this makes all public pages theme-ready for files 11–21.
- **Fixed latent scrim bug**: `bg-[#020403]/42` compiled to `rgba(0,0,0,0)` (transparent) and `via-[#050607]/76` never rendered — PageHero's ambient overlay and via-stop were silently missing site-wide. Replaced with `rgb(var(--kmt-public-scrim)/α)` utilities (verified: full 3-stop gradient + ambient render). Heroes now show their designed scrims (better text contrast over images). NOTE: `consultation-booking-chat.tsx` still contains broken `[#hex]/NN` patterns — fixed in file 18.

## Verify

- [x] Playwright: header sticky/hide-on-scroll, mobile menu open/close, theme toggle no-FOUC, `/` and `/ar` at 375/768/1440. *(scroll lock, Escape close, focus-trap wrap, glass blur, dropdown visibility — all DOM-probed; screenshots 375/1440 EN+AR dark + light)*
- [x] Language switch round-trip keeps `?attemptId=&token=` on `/payment/consultation/return`. *(verified: href = same path + full query + flipped locale)*
- [x] Keyboard: full header navigation without mouse; axe contrast pass. *(focus trap verified: last link ↔ trigger wraps; footer legal bar 7:1 light / 10:1 dark)*
- [x] typecheck, lint, 544 unit tests, 46 smoke e2e green. Pixel-diff vs Phase-1 baseline: home 1.18–1.84% (intended CTA gold change); services/contact 19–27% = latent scrim-bug fix (deterministic double-shot verified 0.00%). 2 test assertions updated to var-based equivalents.
