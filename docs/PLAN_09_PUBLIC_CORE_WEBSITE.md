# PLAN-09 Public Core Website

## Implemented

- Replaced the placeholder root page with a real Arabic public home page at `/`.
- Added responsive public navigation and footer through `PublicShell`.
- Added public services index/detail routes:
  - `/services`
  - `/services/[slug]`
- Added public team index/profile routes:
  - `/team`
  - `/team/[slug]`
- Added shared static public content in `src/content/public-content.ts`.
- Added directory search/filter UI for public listing pages.
- Added SEO metadata and canonical paths for public routes.

## Reuse Decisions

- Reused `PublicShell`, product tokens, `Button`, `ButtonLink`, `Badge`, `TextInput`, `Select`, `Textarea`, and Material Symbols.
- Kept `/stitch-clone/*` untouched and isolated.
- Used seed-compatible static public content so public pages build without a live PostgreSQL database.

## Tests

- `tests/server/public-content.test.ts`
- `tests/ui/public-pages.test.tsx`

## Still Open

- DB-backed public content can be connected later during admin content workflow.
- Full Playwright visual snapshots can be expanded after more feature routes land.
