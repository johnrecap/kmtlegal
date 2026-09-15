# UI Modernization — Per-Page Task Files

Full-site modernization: modern components, GSAP/Lenis/React-Bits motion, consolidated colors, and light/dark mode on every surface.

- Design direction, phase order, and dependency graph live here.
- One file per page/surface. Each file lists routes, source files, components, audit issues (evidence: `file:line`), and checkbox tasks.
- Audit source: 2026-09-15 full UI/UX audit (all four surfaces + compiled CSS verification).

## Phase order (strict dependencies)

| Phase | Scope | Files |
|---|---|---|
| **Phase 0 — Foundation** | tokens, theme system, `cn()` fix, radius, motion tokens, deps | `00-foundation.md` |
| **Phase 1 — Component library** | rebuild `src/components/ui/*` on semantic tokens + dark/light | `01-component-library.md` |
| **Phase 2 — Public site (EN+AR)** | shell, all public pages, booking, payment pages | `10`–`21` |
| **Phase 3 — Client portal** | shell + all portal pages | `30`–`37` |
| **Phase 4 — Admin** | shell + all admin pages | `40`–`54` |
| **Phase 5 — QA & release** | visual regression, a11y, e2e, docs | `62-global-states.md` + this file |

## File index

### Infrastructure
- [ ] `00-foundation.md` — design tokens, dark/light theme, cn(), Tailwind config, motion tokens, dependencies
- [ ] `01-component-library.md` — shared UI components (`src/components/ui/`)

### Public site (Phase 2)
- [ ] `10-public-shell.md` — header, footer, PublicShell (all public pages)
- [ ] `11-public-home.md` — home page EN + AR
- [ ] `12-public-services.md` — services list + detail
- [ ] `13-public-team.md` — team list + detail
- [ ] `14-public-case-studies.md` — case studies list + detail
- [ ] `15-public-articles.md` — articles list + detail
- [ ] `16-public-media.md` — media page
- [ ] `17-public-contact.md` — contact page
- [ ] `18-public-book-consultation.md` — booking chat flow (EN + AR)
- [ ] `19-public-terms-privacy.md` — terms + privacy pages
- [ ] `20-public-account-setup.md` — client account setup (EN + AR)
- [ ] `21-payment-return-receipt.md` — payment return + receipt pages

### Client portal (Phase 3)
- [ ] `30-portal-shell.md` — ClientSiteShell, nav, group error/loading/not-found
- [ ] `31-portal-home.md` — portal dashboard
- [ ] `32-portal-cases.md` — cases list + detail
- [ ] `33-portal-court-dates.md` — court dates
- [ ] `34-portal-files.md` — files + upload
- [ ] `35-portal-payments.md` — payments page
- [ ] `36-portal-assistant.md` — assistant + team chat
- [ ] `37-portal-profile.md` — profile page

### Admin (Phase 4)
- [ ] `40-admin-shell.md` — DashboardShell, sidebar, topbar, notification popover
- [ ] `41-admin-dashboard.md` — admin home
- [ ] `42-admin-clients.md` — clients list + detail
- [ ] `43-admin-cases.md` — cases list + detail + new
- [ ] `44-admin-consultations.md` — consultations list + detail + availability
- [ ] `45-admin-messages.md` — messages list + thread
- [ ] `46-admin-tasks.md` — tasks page
- [ ] `47-admin-calendar.md` — calendar page
- [ ] `48-admin-finance.md` — finance page
- [ ] `49-admin-documents.md` — documents page
- [ ] `50-admin-content.md` — content hub (articles/case-studies/social)
- [ ] `51-admin-users-roles.md` — users list + detail, roles
- [ ] `52-admin-settings-audit.md` — settings + audit log
- [ ] `53-admin-reports.md` — reports page
- [ ] `54-admin-notifications-contact.md` — notifications + contact-messages inbox

### Auth & system (Phase 3/5)
- [ ] `60-auth-login.md` — login + 2FA stub
- [ ] `61-install-wizard.md` — install wizard
- [ ] `62-global-states.md` — 404/error boundaries, preview gallery, release QA

## Rules

1. Do not start a page file's tasks until Phase 0 + Phase 1 for the components that page consumes are complete.
2. Every task keeps existing behavior: API contracts, routes, permissions, and data flow are untouched unless a task explicitly says otherwise.
3. Every motion task must state reduced-motion + RTL behavior before it is considered done.
4. After each file is completed: `npm run typecheck`, `npm run lint`, relevant e2e suite, update the checkbox here and in the page file, commit, push.
5. Severity tags `[P0]–[P3]` reference the 2026-09-15 audit; fix them in severity order within each file.

## Release gate (Phase 5)

- [ ] Visual regression: 375/768/1440px × light/dark × EN/AR — home, booking, portal home, admin cases
- [ ] Keyboard + axe contrast pass on all shells
- [ ] `npm run build`, `npm run test`, `test:e2e:smoke`, plan35–37 suites green
- [ ] Update `docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md`
