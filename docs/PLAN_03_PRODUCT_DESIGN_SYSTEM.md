# PLAN-03 Product Design System & Layout Shells

Status: implemented as a frontend foundation.

## Scope Completed

- Product tokens extended in `tailwind.config.ts` without changing Stitch source routes.
- Product font loading is defined in `src/app/globals.css` with blocking local font faces to avoid first-paint fallback font flashes on Arabic public pages.
- Shared utility `cn()` added in `src/lib/cn.ts`.
- Product token map added in `src/lib/design-system/tokens.ts`.
- UI primitives added under `src/components/ui/`:
  - `Button`
  - `Badge`
  - `Card`
  - `MetricCard`
  - `TextInput`
  - `Textarea`
  - `Select`
  - `Tabs`
  - `DataTable`
  - `FilterBar`
  - `SearchInput`
  - `DialogFrame`
  - `StateBlock`
  - `Toast`
  - `MaterialSymbol`
- Layout shells added under `src/components/layout/`:
  - `ProductThemeProvider`
  - `PublicShell`
  - `DashboardShell`
- Domain components added under `src/components/domain/`:
  - `ServiceCard`
  - `LawyerCard`
  - `CaseStudyCard`
  - `ArticleCard`
  - `AIOrganizerPanel`
  - `DocumentCard`
  - `TaskCard`
- Routed product showcase screens added:
  - `/product-system`
  - `/product-system/clients`
  - `/product-system/cases`
  - `/product-system/documents`
  - `/product-system/settings`
- Component render tests added in `tests/ui/product-components.test.tsx`.

## Governance

- `/stitch-clone/*` remains isolated and does not import product components.
- Product components do not call backend APIs.
- No `shadcn/ui` or Radix dependency was introduced.
- No new UI library was added.

## Token Policy

- Use semantic KMT tokens for product UI:
  - `kmt-navy`
  - `kmt-gold`
  - `kmt-paper`
  - `kmt-canvas`
  - `kmt-ink`
  - `kmt-muted`
  - `kmt-border`
  - `kmt-success`
  - `kmt-warning`
  - `kmt-danger`
- Keep Stitch clone classes and generated output separate from product design-system decisions.

## States Covered

- Button: default, hover, active, disabled, loading.
- Field controls: label, hint, error, disabled, focus, visible RTL-safe select arrow spacing, and native date/time picker spacing for Arabic layouts.
- Badge: neutral, active, pending, closed, danger.
- DataTable: populated and empty.
- StateBlock: empty, loading, error, permission.
- DialogFrame: accessible dialog structure for future interactive modal wiring.

## RTL And Accessibility Notes

- Root layout remains Arabic-first with `dir="rtl"`.
- Dashboard shell uses natural document direction so the sidebar appears on the right in Arabic.
- Inputs connect labels, hints, and errors with `aria-describedby`.
- Icon-only support is centralized through `MaterialSymbol`; future icon-only buttons must provide accessible names.
- Focus-visible states are defined globally and reinforced in controls.
- Reduced-motion users get minimized transition/animation duration.

## Verification

- `npm run test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run product:screenshots`

Screenshot evidence:

- `test-results/product-system/product-system-dashboard-desktop.png`
- `test-results/product-system/product-system-dashboard-mobile.png`
- `test-results/product-system/product-system-clients-desktop.png`
- `test-results/product-system/product-system-clients-mobile.png`
- `test-results/product-system/product-system-cases-desktop.png`
- `test-results/product-system/product-system-cases-mobile.png`
- `test-results/product-system/product-system-documents-desktop.png`
- `test-results/product-system/product-system-documents-mobile.png`
- `test-results/product-system/product-system-settings-desktop.png`
- `test-results/product-system/product-system-settings-mobile.png`
