# Admin UI Kit — Current conventions

Single home: `src/components/admin/*`. No per-page duplication: Phases 10–11
must consume these primitives and conventions only. No NEW one-off overlay
may be introduced (native `<dialog>`, `details/summary` disclosures,
hand-rolled tab/pagination links migrate to the kit on their locked phase).

All neutral surfaces must use semantic tokens (`background`, `surface`,
`surface-muted`, `surface-strong`, `foreground`, `muted-foreground`,
`border`, `card`, `popover`). Fixed white/slate/gray admin surfaces are a
regression. Identity gold and semantic success/warning/danger tokens are
allowed for meaning and emphasis. Every primitive must render in light and
dark mode; light remains the admin default.

## Filter conventions

Observed standard (e.g. `/admin/users`): one GET `<form>` wrapping a
`FilterBar` with `SearchInput` + native `Select`s + an apply `Button`
(`type="submit"`). The URL is the filter state (shareable, back-button safe).

- Primary filters: ALWAYS visible in the `FilterBar` (search + the 2–4 most
  used selects + apply). Never hide behind an overlay.
- Advanced desktop filters: Animate UI Popover (`components/base/popover`,
  Phase 09 CURRENT — owner-approved namespace adaptation). Wire in
  Phase 10; same GET form fields, no invented filters.
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

`AdminRowActions` (`admin-menu.tsx`, Animate UI Base Menu — Phase 09
CURRENT, owner-approved namespace adaptation; no page wiring yet, that is
Phase 10/11 scope):

- Primary action: may remain a visible one-click control (link/button)
  where the existing workflow requires it. Do NOT hide working actions
  during intermediate phases. Links needing native affordances
  (open-in-new-tab) also stay visible — menu `href` entries navigate via
  the app router (uniform mouse/keyboard/touch activation), so they
  cannot offer new-tab.
- Secondary actions: menu items + separators + shortcuts; destructive
  item styling for dangerous entries.
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
from the persistent admin layout), `AdminMobileNav` (Sheet), notification bell
(Animate UI Popover since Phase 09 completion — `AdminNotificationPopover`
keeps its 30s poll + unread + mark-read + links; the full center page is
untouched until Phase 10).
`aria-current="page"` on active items in both navs; tooltips on collapsed
rail icons with existing translated labels.

The route layout mounts this chrome once. Page-level `DashboardShell`
instances render only `DashboardPageFrame` (breadcrumbs, title, optional
description and primary action). Loading/error/not-found states replace the
content frame and must not remove navigation. Desktop sidebar width changes
only through the persisted explicit toggle (280px expanded, 72px collapsed);
hover must never resize the workspace.

## Responsive table convention

`DataTable` owns one desktop table and one `mobileRender` record surface.
Use `mobileBreakpoint="lg"` for dense operational tables that must remain
cards through 1024px. Record forms and destructive confirmations live once
outside the table/card renderers and target the selected record, preventing
duplicate IDs and duplicate dialog trees.

## API error convention

Admin client actions use `features/admin/shared/admin-api-error.ts`. It maps
the established API error shape to safe Arabic copy, preserves error codes
for domain-specific recovery, and includes the request ID when available.
Raw server messages are never rendered directly.

## Gallery-ready examples (Phase 12)

Each primitive ships with props designed for direct gallery demo:
`AdminTabs` (static `tabs` + `active`), `AdminDialog` (all four variants via
`trigger`), `AdminPagination` (static `total`/`hrefForPage`), Sheet shells,
Sidebar (static items). Phase 12 wires the gallery; no example files are
added here.
