# 01 — Component Library (`src/components/ui/`)

> Phase 1 · Depends on `00-foundation.md`. Consumed by every page file.

## Scope

| Component | File |
|---|---|
| Button, ButtonLink | `src/components/ui/button.tsx` |
| Badge | `src/components/ui/badge.tsx` |
| Field (TextInput/Textarea/Select), SearchInput | `src/components/ui/field.tsx`, `search-input.tsx` |
| Tabs | `src/components/ui/tabs.tsx` |
| Dialog | `src/components/ui/dialog.tsx` |
| Toast, InlineFeedback | `src/components/ui/toast.tsx`, `inline-feedback.tsx` |
| Skeleton | `src/components/ui/skeleton.tsx` |
| DataTable, DataRecordCard | `src/components/ui/data-table.tsx`, `data-record-card.tsx` |
| FilterBar, Card, State | `src/components/ui/filter-bar.tsx`, `card.tsx`, `state.tsx` |
| Icons | `src/components/ui/material-symbol.tsx` |
| Gallery | `src/app/preview/ui/page.tsx` |

## Issues (audit)

- [P0] Badge neutral tone `bg-white text-kmt-muted` defeats gold overrides — white pills with gray text on dark panels (`badge.tsx:7` + `cn` bug).
- [P1] Primary button `bg-kmt-gold text-white` = 3.97:1, fails AA (`button.tsx:17`). Dark-on-gold recipe passes (4.8:1) and already exists in `clientPortalPrimaryActionClass`.
- [P1] `ButtonLink` renders raw `<a>` — full page reloads on all major CTAs (`button.tsx:91`).
- [P1] Info feedback renders error icon — `info` name missing from icon set, fallback is `icons.error` (`toast.tsx:18`, `inline-feedback.tsx:15`, `material-symbol.tsx:380`).
- [P2] `Skeleton` exists but is never used; loading states absent.
- [P2] `DialogFrame` incomplete: no focus trap, no Escape, no `aria-labelledby` (`dialog.tsx:17-30`).
- [P3] `Tabs` component is dead code — 3 ad-hoc implementations exist across admin.
- [P3] Two icon systems: Material Symbols font used once (`dashboard-metric-link.tsx:24`) vs inline-SVG everywhere else.
- [P3] Input skin split: `search-input.tsx:16` uses `slate-*`, `field.tsx:37` uses `kmt-*`.
- [P3] DataTable: no sticky header, no header sorting, `hover:bg-slate-50` vs `kmt-canvas` split (`data-table.tsx:43,54`).

## Tasks

- [x] T1.1 **Button**: rebuild variants on semantic tokens — `primary` (gold bg + dark text, AA 4.75:1 light / 7.7:1 dark), `secondary` (surface + border), `outline`, `ghost`, `danger`; sizes sm/md/lg keep 44px min; loading spinner + `aria-busy` kept; hover/active/focus-visible/disabled states on tokens + motion tokens. *Per-surface `!important` action classes deleted in Phase 2/3 page migrations.*
- [x] T1.2 **ButtonLink** → `next/link` with same variant API; `external` prop renders `<a rel="noopener noreferrer" target="_blank">` escape hatch.
- [x] T1.3 **Badge**: tones `neutral/active/pending/closed/danger/info` on semantic tokens (correct on light + dark — P0 fixed); optional `size` sm.
- [x] T1.4 **Field family**: one skin — `bg-surface`, `border-border`, `text-foreground`, `placeholder:text-muted-foreground`, focus `ring` token; existing label/hint/error wiring and `dir="ltr"` date inputs kept. `SearchInput` aligned to same skin (slate deleted).
- [x] T1.5 **Toast + InlineFeedback**: `info` glyph added to the SVG set (no more error-icon fallback); tones on state tokens (flip in dark mode); `role=alert` for errors, `role=status` otherwise kept.
- [x] T1.6 **Tabs**: button-tabs retokenized (pressed-group API kept — covered by product-components test); **new `LinkTabs`** (URL-driven, `aria-current`, counts slot) ready to replace the 3 ad-hoc implementations in Phase 4.
- [x] T1.7 **Pagination**: new shared component — count summary, prev/next with localized labels + RTL arrow mirroring, optional page-size, `resetHref` clear-filters slot. Server-friendly (link-based). Adoption in Phase 4.
- [x] T1.8 **Dialog**: complete primitive on native `<dialog>` — showModal, focus trap (Tab cycling), Escape via cancel event, backdrop-click close, focus return to opener, scroll lock, `aria-labelledby`. `DialogFrame` (unused) removed.
- [x] T1.9 **Skeleton**: token shimmer + new `SkeletonCard` / `SkeletonTable` variants (reduced-motion: static). Wire-up in page files.
- [x] T1.10 **DataTable**: semantic-token skin, `stickyHeader` opt-in, `hover:bg-surface-muted`, mobile-card pattern kept; empty slot renders plain (no border — fixes documents double-border). Card/StateBlock/FilterBar/DataRecordCard swept to tokens too.
- [x] T1.11 **Icons**: Material Symbols font-face + `.material-symbols-outlined` class deleted; `dashboard-metric-link.tsx` converted to inline SVG; `material-symbols` package uninstalled. Single icon system.
- [x] T1.12 Shared `formatBytes` — already existed in `legal-format.ts:145`; two local duplicates in admin cases/documents pages deleted, imports switched.
- [x] T1.13 Component gallery at **`/preview/components`** (new env-gated route; existing `/preview/ui` product preview kept — batch16 e2e still green): every component × variants × light/dark, motion primitives, dialog demo. Stays behind `KMT_ENABLE_UI_PREVIEW` in production.

## Verify

- [x] Gallery renders all components in both themes, both directions. *(DOM-probed: dark gold-400 primary + light gold-600 primary both AA; dialog open/Escape/focus; zero console errors; no mobile overflow)*
- [x] Storybook-style checks: focus-visible ring on every interactive element; keyboard cycle works. *(gallery dialog Tab-cycle verified; unit tests cover control wiring)*
- [x] `npm run typecheck`, `npm run lint` green; no `slate-*`/raw hex left in `src/components/ui/`. *(+ 544 unit tests, 46 smoke e2e, batch16 preview e2e, public pages pixel-diff 0.00–1.68% = intended changes only)*
- Notes: 3 test assertions updated to the modernized contracts (Badge class name, Material Symbols absence in globals.css, +2 disposition artifact entries); disposition regex requires barrel import first in a file (gallery-islands import order).
