# Admin UI Kit — Conventions (Phase 09)

Single home: `src/components/admin/*`. No per-page duplication: Phases 10–11
must consume these primitives and conventions only. No NEW one-off overlay
may be introduced (native `<dialog>`, `details/summary` disclosures,
hand-rolled tab/pagination links migrate to the kit on their locked phase).

## Filter conventions

Observed standard (e.g. `/admin/users`): one GET `<form>` wrapping a
`FilterBar` with `SearchInput` + native `Select`s + an apply `Button`
(`type="submit"`). The URL is the filter state (shareable, back-button safe).

- Primary filters: ALWAYS visible in the `FilterBar` (search + the 2–4 most
  used selects + apply). Never hide behind an overlay.
- Advanced desktop filters: Animate UI Popover — BLOCKED (see below).
- Mobile filters: Animate UI Sheet (filter-sheet shell pattern; same GET
  form fields, no invented filters).
- Active filters: visible summary line (count within current filters, e.g.
  "N مستخدم داخل الفلاتر الحالية") + a reset link ("مسح الفلاتر" → bare
  list href).
- Result count: always visible (`صفحة X من Y` + total line).
- Do NOT invent filters: only wire filters the page's service already reads.

## Pagination convention

`AdminPagination` (`admin-pagination.tsx`, shadcn primitive): props
`{ page, pageSize, total, hrefForPage, summary?, resetHref?, resetLabel?,
previousLabel?, nextLabel? }`. `hrefForPage` MUST preserve active filter
params (existing `listHref(filters, page)` shape) and set `page`. Prev/next
render only when a previous/next page exists. Arabic defaults
(السابق/التالي) match production strings — pass `previousLabel`/`nextLabel`
only for a verified locale need.

## Row-action conventions

> BLOCKED PRIMITIVE STATUS (pre-Phase-10 owner verification 2026-09-19):
> Animate UI Base Menu and Base Popover currently require
> `@base-ui-components/react` (registry evidence:
> `https://animate-ui.com/r/primitives-base-menu.json` and
> `.../primitives-base-popover.json`, deps
> `['motion', '@base-ui-components/react']`, verified twice). The repo
> provides `@base-ui/react@1.8.0` instead; installs are forbidden and radix
> substitution was rejected by the owner. Menu/Popover wiring (row actions,
> advanced filters, notification bell) waits on the owner decision. The
> conventions below stand so Phase 10 can wire immediately once resolved.
> Native `details` bell and per-row buttons stay untouched until then.

- Primary action: may remain a visible one-click control (link/button)
  where the existing workflow requires it. Do NOT hide working actions
  during intermediate phases.
- Secondary actions: Animate UI Menu (items + separators + shortcuts;
  destructive item styling for dangerous entries).
- Destructive actions: Menu entry + Animate UI Dialog confirmation in
  Phase 11. No destructive action executes without confirmation once its
  page migrates.

## Tabs convention

`AdminTabs` (`admin-tabs.tsx`): the page (server) reads the active value
from `searchParams` and passes `active`; `onValueChange` navigates to the
tab's canonical `href` (same `?tab=`/`?view=` URLs as today's hand-rolled
links). `activationMode="manual"`: arrow keys move focus WITHOUT navigating
(each arrow otherwise fired a server navigation and stole focus); Enter/Space
on a focused trigger navigates. Unknown values resolve to the default
server-side (existing `activeTab` pattern). Never a client-only panel swap
that desyncs the URL.

## Dialog convention

`AdminDialog` (`admin-dialog.tsx`): `confirm` (cancel/confirm footer),
`destructive` (danger-toned confirm), `form` (caller-owned body + footer),
`preview` (scrollable body, no actions). All copy via props. Destructive
executions require the dialog once migrated (Phase 11).

## Accordion convention

Reuse the Phase 05 Animate UI Accordion directly. `single` + `collapsible`
for detail groups; `multiple` where independent groups coexist. Keyboard and
RTL come from the primitive. Phase 11 error-group auto-open: control via
`value`/`defaultValue` from server-validated error state (no new primitive).

## Shell chrome

`AdminSidebarNav` (desktop rail, grouped, permission-filtered items flow in
from `DashboardShell`), `AdminMobileNav` (Sheet), notification bell
(pending Popover primitive decision — native `details` stays until then).
`aria-current="page"` on active items in both navs; tooltips on collapsed
rail icons with existing translated labels.

## Gallery-ready examples (Phase 12)

Each primitive ships with props designed for direct gallery demo:
`AdminTabs` (static `tabs` + `active`), `AdminDialog` (all four variants via
`trigger`), `AdminPagination` (static `total`/`hrefForPage`), Sheet shells,
Sidebar (static items). Phase 12 wires the gallery; no example files are
added here.
