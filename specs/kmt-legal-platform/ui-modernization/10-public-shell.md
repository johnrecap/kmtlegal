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

- [ ] T10.1 Mount `ThemeProvider` (default dark) + `SmoothScrollProvider` in both `(public-en)` and `(public-ar)` layouts.
- [ ] T10.2 Add `ThemeToggle` to header action cluster (after language switch), localized aria-label; header stays glass-sticky in both themes.
- [ ] T10.3 Retokenize header/footer: replace `#f8f3ea/#120d07/#c7a363/stone-500` with semantic tokens; footer legal bar contrast ≥ 4.5:1 in dark and light.
- [ ] T10.4 Fix language switch to preserve search params (`useSearchParams` or server path + search); verified on payment return page.
- [ ] T10.5 Modern header polish: backdrop-blur glass on scroll (transparent at top), animated underline kept, mega-dropdown opens with token motion (300ms ease-out, reduced-motion: instant), body scroll lock + focus trap on mobile menu (reuse Dialog pattern T1.8).
- [ ] T10.6 Delete `FinalCtaBand` dead code.
- [ ] T10.7 Dark/light parity: every header state (scrolled, menu open, dropdown open) verified in both themes and both directions.

## Verify

- [ ] Playwright: header sticky/hide-on-scroll, mobile menu open/close, theme toggle no-FOUC, `/` and `/ar` at 375/768/1440.
- [ ] Language switch round-trip keeps `?attemptId=&token=` on `/payment/consultation/return`.
- [ ] Keyboard: full header navigation without mouse; axe contrast pass.
