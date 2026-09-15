# 00 — Foundation (tokens, theme, tooling)

> Phase 0 · Blocks every other file. No page edits here.

## Scope

| Area | Files |
|---|---|
| Tokens | `src/lib/design-system/tokens.ts`, `src/app/globals.css` |
| Tailwind | `tailwind.config.ts` |
| Class merge | `src/lib/cn.ts` |
| Theme system | new `src/components/theme/theme-provider.tsx`, `theme-toggle.tsx` |
| Motion | new `src/components/motion-ui/motion-tokens.ts`, `smooth-scroll-provider.tsx` |
| Dependencies | `package.json` |

## Issues (audit)

- [P0] `cn()` is a plain string join — conflicting utilities resolved by alphabetical CSS order, not intent. Root cause of the badge white-pill bug, dead error styling, dead CTA hierarchy (`src/lib/cn.ts:1-3`).
- [P1] Dark theme achieved via `!important` patches + descendant CSS remaps instead of semantic tokens (`src/app/globals.css:114-243`, `contact-form.tsx:32-39`, `directory-filter.tsx:34-38`).
- [P1] `rounded-full` compiles to `0.75rem` — every circle/pill is a 12px rounded square (`tailwind.config.ts:91`).
- [P1] Two golds coexist: `kmt-gold` #997b44 (`tokens.ts:4`) vs `--kmt-public-gold` #c79a52 (`globals.css:83`).
- [P2] Dead Stitch palette in `tailwind.config.ts:39-85` (unused `surface-container-highest`, `on-secondary-fixed-variant`, etc.).
- [P2] Raw hex duplicated across portal/public shells instead of `--kmt-public-*` variables (`client-site-shell.tsx:89,94,125`, `client-portal-components.tsx:5,8,10,15`).
- [P2] `font-serif` resolves to Georgia/system — no serif family defined (`tailwind.config.ts:102-109`).
- [P3] Both font families downloaded for both locales (`globals.css:5-66`).

## Tasks

### Tokens
- [ ] T0.1 Define semantic CSS variables twice in `globals.css`: `:root` (light) and `.dark` — `--background, --foreground, --surface, --surface-muted, --border, --primary, --primary-foreground, --muted-foreground, --accent, --ring` + state colors (info/success/warning/danger × fg/surface/border/strong). All values OKLCH/hex-audited for AA.
- [ ] T0.2 Consolidate to one gold ramp: `gold-50…gold-900` derived from #997b44, with `gold-400`/`gold-500` as the accessible text-on-dark accent and dark-on-gold text for primary buttons. Retire `--kmt-public-gold` #c79a52 and `clientPortalGoldText`.
- [ ] T0.3 Map semantic vars into `tailwind.config.ts` colors (`bg-background`, `text-foreground`, `bg-surface`, `border-border`, etc.) so components never use raw hex.
- [ ] T0.4 Fix radius scale: `DEFAULT 4px, lg 8px, xl 12px, 2xl 16px, 3xl 24px, full 9999px` (matches `tokens.ts:18-22`). Delete dead Stitch palette + unused font/size tokens from `tailwind.config.ts`.
- [ ] T0.5 Typography: remove `font-serif` usages plan-wide (hierarchy via IBM Plex Sans Arabic weights/sizes); keep direction-aware body stack (`globals.css:86-95`).
- [ ] T0.6 Define motion tokens as CSS vars + Tailwind transition timing/easing: `--kmt-duration-fast 150ms / normal 300ms / slow 600ms`, `--kmt-ease-out`, `--kmt-ease-expo`. Keep the existing reduced-motion kill-switch (`globals.css:746-789`) as the global fallback.

### Tooling
- [ ] T0.7 `cn()` → `tailwind-merge` (`cn(...)` keeps same signature; `twMerge` + class filter).
- [ ] T0.8 Theme system: install `next-themes`; `ThemeProvider` with `attribute="class"`, `defaultTheme` per surface (public: dark, portal: dark, admin: light), `enableSystem`, no-flash. Mount once per root layout group.
- [ ] T0.9 `ThemeToggle` component: sun/moon inline-SVG icon button, `aria-label` localized (EN "Toggle theme" / AR "تبديل المظهر"), 44px target, respects `prefers-reduced-motion` (no icon spin).
- [ ] T0.10 Smooth scroll: install `lenis`; `SmoothScrollProvider` client component — public site only, disabled when `prefers-reduced-motion`, disabled on admin/portal, RTL-verified.
- [ ] T0.11 Install `react-bits` (targeted imports only: CountUp, ShimmerButton, SpotlightCard, AnimatedHeading or equivalents).
- [ ] T0.12 Remove cascade-remap blocks in `globals.css:114-243` incrementally as surfaces migrate (final deletion tracked in `30-portal-shell.md` / `10-public-shell.md`).

## Verify

- [ ] `npm run build` green; compiled CSS contains `rounded-full { border-radius: 9999px }`.
- [ ] Before/after screenshots (375/1440px) of home, portal home, admin cases — cascade change must not regress visuals beyond intended fixes.
- [ ] Toggle works with no FOUC on `/`, `/client`, `/admin` (hard refresh in both themes).
- [ ] `npm run typecheck`, `npm run lint` green.
