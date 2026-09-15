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

- [ ] T1.1 **Button**: rebuild variants on semantic tokens — `primary` (gold bg + dark text, AA), `secondary` (surface + border), `outline`, `ghost`, `danger`; sizes sm/md/lg keep 44px min; loading spinner + `aria-busy` kept; hover/active/focus-visible/disabled states on tokens. Delete per-surface `!important` action classes after migration.
- [ ] T1.2 **ButtonLink** → `next/link` with same variant API (internal links only; keep `<a>` escape hatch for external).
- [ ] T1.3 **Badge**: tones `neutral/active/pending/closed/danger/info` on semantic tokens; verify correct rendering on light + dark surfaces (fixes P0). Add optional `size` sm.
- [ ] T1.4 **Field family**: one skin — `bg-surface`, `border-border`, `text-foreground`, `placeholder:text-muted-foreground`; keep existing label/hint/error wiring (`aria-describedby`, `aria-invalid`) and `dir="ltr"` date inputs. Align `SearchInput` to same skin (delete `slate-*`).
- [ ] T1.5 **Toast + InlineFeedback**: add `info` icon to the SVG set (or map info → neutral "i" glyph); tones info/success/warning/danger on state tokens; auto-dismiss toast with pause-on-hover; `role=alert` for errors, `role=status` otherwise.
- [ ] T1.6 **Tabs**: one link-based implementation (URL-driven, `aria-current`, counts slot) replacing case-detail tabs (`cases/[caseId]/page.tsx:131-149`), content-hub tabs (`content/page.tsx:333-350`), consultation view-pills (`consultations/page.tsx:291-312`).
- [ ] T1.7 **Pagination**: one component — count text, prev/next, optional page-size, optional "clear filters" slot; replaces 3 divergent styles (see `47-admin-calendar.md`, `45-admin-messages.md`).
- [ ] T1.8 **Dialog**: complete primitive on native `<dialog>` — focus trap, Escape, `aria-labelledby`, focus return, scroll lock (mirror `dashboard-mobile-nav.tsx` pattern and preview's dialog usage).
- [ ] T1.9 **Skeleton**: token-based shimmer (reduced-motion: static); used by every async list/detail (wire-up happens in page files).
- [ ] T1.10 **DataTable**: semantic-token skin, sticky header opt-in, `hover:bg-surface-muted`, mobile-card pattern kept; empty slot renders plain (no nested bordered box — fixes `documents/page.tsx:334` double-border).
- [ ] T1.11 **Icons**: delete Material Symbols font usage + `@font-face` (`globals.css:61-67,799-815`); single inline-SVG system.
- [ ] T1.12 Shared `formatBytes` in `src/lib/legal-format.ts`; delete 2 duplicates (`cases/[caseId]/page.tsx:112-120`, `documents/page.tsx:75-83`).
- [ ] T1.13 Rebuild `/preview/ui` as living gallery: every component × every variant × light/dark — stays env-gated (`KMT_ENABLE_UI_PREVIEW`).

## Verify

- [ ] Gallery renders all components in both themes, both directions.
- [ ] Storybook-style checks: focus-visible ring on every interactive element; keyboard cycle works.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` green; no `slate-*`/raw hex left in `src/components/ui/`.
