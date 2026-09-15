# 62 — Global States, Preview Gallery, Release QA

> Phase 5 · Depends on all other files.

## Scope

| Area | Files |
|---|---|
| 404 | `src/app/global-not-found.tsx` |
| Global error | `src/app/global-error.tsx` |
| Public group states | new `(public-en)/loading.tsx`, `error.tsx`, group `not-found.tsx` |
| Preview gallery | `src/app/preview/ui/page.tsx` |
| Status doc | `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md` |

## Issues (audit)

- [P1] No `loading.tsx`/`error.tsx` under `(public-en)`; DB errors masked as empty lists (`public-pages.tsx:849-895`).
- [P2] Global 404 is Arabic-first (`lang="ar" dir="rtl"`) even for English URLs (`global-not-found.tsx:15`).
- [P2] Global error page is light-themed — jarring against dark portal.
- [P3] Preview page uses deprecated `unstable_noStore` (`preview/ui/page.tsx:6`).

## Tasks

- [ ] T62.1 Public group states: `(public-en)/loading.tsx` (hero + section skeletons), `error.tsx` (retry + contact fallback, both themes), group `not-found.tsx` matching public shell.
- [ ] T62.2 DB loaders stop masking errors: list loaders return distinguishable error state (retry UI) vs genuine empty (`public-pages.tsx:849-895`) — behavior change, flagged in commit.
- [ ] T62.3 Global 404: locale-aware (detect `/ar` prefix → AR-first; otherwise EN-first with AR secondary), theme-aware, both directions tested.
- [ ] T62.4 Global error: theme-aware token skin, retry + request-id display kept.
- [ ] T62.5 Preview gallery final: all Phase-1 components × variants × themes × directions; replace `unstable_noStore` with `connection()` or force-dynamic; stays env-gated.
- [ ] T62.6 **Release QA gate** (from README): visual regression 375/768/1440 × light/dark × EN/AR on home, booking, portal home, admin cases; keyboard + axe pass on all shells; `npm run build`, `npm run test`, `test:e2e:smoke`, plan35/36/37 suites green.
- [ ] T62.7 Update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md` with modernization summary; update spec README checkboxes.

## Verify

- [ ] Unknown EN URL → EN-first 404; unknown AR URL → AR-first 404.
- [ ] All release-gate items pass; status doc merged.
