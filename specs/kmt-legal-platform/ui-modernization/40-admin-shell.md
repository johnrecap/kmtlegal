# 40 — Admin Shell (DashboardShell + notification popover)

> Phase 4 · Depends on `00`, `01`. Applies to all `src/app/(app-ar)/admin/` routes.

## Scope

| Area | Files |
|---|---|
| Shell | `src/components/layout/dashboard-shell-view.tsx`, `dashboard-shell.tsx`, `dashboard-navigation.tsx`, `dashboard-mobile-nav.tsx` |
| States | `src/components/layout/admin-shell-state.tsx`, `admin/loading.tsx`, `admin/error.tsx` |
| Popover | `src/features/admin/notifications/admin-notification-popover.tsx` |

## Components

Sidebar (grouped permission-filtered nav, brand, mode badge), topbar (eyebrow + h1 + actions + bell + user + logout), mobile drawer (native dialog + focus trap — keep).

## Issues (audit)

- [P2] Gold eyebrow `#997b44` on white ≈ 4.0:1 — AA fail on every page (`dashboard-shell-view.tsx:52`).
- [P2] Notification popover: no Escape/focus containment, 36px trigger, raw `shadow-xl`, physical `left-0` (`admin-notification-popover.tsx:188-207`).
- [P3] Eyebrow pseudo-breadcrumbs inconsistent between list/detail pages (see per-page files).
- [P3] Physical `border-l` sidebar (`dashboard-shell-view.tsx:37`).

## Tasks

- [ ] T40.1 Mount `ThemeProvider` (default **light**) in `(app-ar)/layout.tsx` (or admin layout); `ThemeToggle` in topbar; dark theme = tuned dark tokens (not inversion) — sidebar, tables, forms verified.
- [ ] T40.2 Retokenize shell: sidebar/topbar/nav on semantic tokens; eyebrow uses `gold-700` (light) / `gold-400` (dark) for AA; logical `border-s` on sidebar.
- [ ] T40.3 Notification popover → Dialog primitive (T1.8): Escape, focus containment/return, 44px trigger, `shadow-kmt-popover` token, logical positioning.
- [ ] T40.4 Nav polish: active state gold surface + `aria-current` kept; hover token motion 150ms; collapse-to-icons option (desktop, optional stretch).
- [ ] T40.5 Loading/error/not-found shells on tokens (both themes); `AdminShellState` kept as pattern.
- [ ] T40.6 Eyebrow consistency contract: `<section label> / <page>` — list and detail pages of the same entity use the same root (enforced in per-page tasks).

## Verify

- [ ] Toggle across representative pages (dashboard, cases list, finance) — no FOUC, AA in both themes.
- [ ] Popover keyboard cycle + Escape; screenshots 375/1440 × themes.
