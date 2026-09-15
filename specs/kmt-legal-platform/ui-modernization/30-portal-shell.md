# 30 — Portal Shell (ClientSiteShell + group states)

> Phase 3 · Depends on `00`, `01`. Applies to all `src/app/(client)/` routes.

## Scope

| Area | Files |
|---|---|
| Shell | `src/components/layout/client-site-shell.tsx` |
| Nav | `src/components/layout/client-navigation.ts`, `client-language-switch.tsx` |
| Feedback components | `src/components/layout/client-portal-components.tsx` |
| Group states | new `src/app/(client)/loading.tsx`, `error.tsx`, `not-found.tsx` |
| Legacy CSS | `src/app/globals.css:114-243` (dark cascade remaps) |

## Components

Sticky header (brand, back-to-site, language switch, user chip, logout form), desktop + scrollable mobile nav, footer.

## Issues (audit)

- [P1] Portal dark theme = `!important` helper classes + CSS remaps of light primitives (`client-portal-components.tsx:12-15`, `globals.css:114-243`) — fragile; dies with token migration.
- [P1] Permission-blocked pages render bare light StateBlock — no chrome, no logout (`src/server/auth/page-guards.tsx:100-124`).
- [P2] Untokenized hex: `#060504`, `#070604`, `#111827`, `#c79a52`, `#c7a363`, `#120d07` (`client-site-shell.tsx:89,94,125`, `client-portal-components.tsx:5,8,10,15`).
- [P2] No `loading.tsx`/`error.tsx`/`not-found.tsx` for the group — errors escape to light global page.
- [P3] Hardcoded Arabic `"غير محدد"` in `ClientPortalDetailItem` breaks EN (`client-portal-components.tsx:123`); `clientPortalGoldText` dead export.
- [P3] Empty route skeletons: `src/app/(app-ar)/client/**`, `(app-ar)/portal/**` (leftover dirs).

## Tasks

- [ ] T30.1 Mount `ThemeProvider` (default dark) in `(client)/layout.tsx`; add `ThemeToggle` to header.
- [ ] T30.2 Retokenize shell: all hex → semantic tokens; header glass-sticky in both themes; nav active gold underline kept; mobile scrollable nav on tokens.
- [ ] T30.3 Delete `clientPortalPrimaryActionClass`/`Secondary...` `!important` helpers — Button/Badge variants (T1.1/T1.3) replace them; sweep all usages.
- [ ] T30.4 Delete `globals.css:114-243` dark remaps once no page depends on them (final step of Phase 3 — after files 31–37 done).
- [ ] T30.5 Group states: `loading.tsx` (skeleton layout), `error.tsx` (dark shell, retry, localized), `not-found.tsx` (dark shell, portal chrome kept).
- [ ] T30.6 `PermissionBlocked` in-portal variant: keeps shell (header + logout), body shows blocked State with "back to public site" + "sign out".
- [ ] T30.7 `ClientPortalDetailItem`: value fallback → localized copy (`copy.common.unknown`); delete dead export; DataTable default empty label localized.
- [ ] T30.8 Delete leftover empty route dirs `(app-ar)/client/**`, `(app-ar)/portal/**`.
- [ ] T30.9 Language switch: keep `PATCH preferences` + `router.refresh`; verify token/query preservation patterns on portal links.

## Verify

- [ ] Theme toggle + reload no-FOUC on `/client`; both themes pass axe contrast on shell.
- [ ] Error boundary test (throw in dev): dark in-portal error page, not global light one.
- [ ] Screenshots 375/1440 × EN/AR × themes.
