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
- [x] `00-foundation.md` — design tokens, dark/light theme, cn(), Tailwind config, motion tokens, dependencies *(done 2026-09-15; T0.12 cascade-remap deletion deferred to Phase 2/3)*
- [x] `01-component-library.md` — shared UI components (`src/components/ui/`) *(done 2026-09-15: Button/ButtonLink/Badge/Field/SearchInput/Toast/InlineFeedback/Tabs+LinkTabs/Pagination/Dialog/Skeleton×3/DataTable/Card/State/FilterBar/DataRecordCard on semantic tokens; Material Symbols font removed; formatBytes deduped; gallery at `/preview/components`)*

### Public site (Phase 2)
- [x] `10-public-shell.md` — header, footer, PublicShell (all public pages) *(done 2026-09-15: theme-aware `--kmt-public-*` vars, retokenized header/footer, language-switch query preservation, mobile scroll lock + focus trap, FinalCtaBand deleted, latent scrim bug fixed)*
- [x] `11-public-home.md` — home page EN + AR *(done 2026-09-15: word-level EN / line-level AR animated hero heading, RTL arrow + tracking fixes, SSR-safe Reveal, bento practice grid, count-up stats row, scroll-linked process storytelling, split focus checklist, insights empty state; addendum: glow removed site-wide + animate-ui primitives adopted — SplittingText/CountingNumber/RippleLink/Tilt under `src/components/animate-ui/` with `motion`)*
- [x] `12-public-services.md` — services list + detail *(done 2026-09-15: compact PageHeroes eager + `fetchPriority="high"` (LCP), service detail h1 + breadcrumbs + BreadcrumbList JSON-LD + sticky glass DetailCta, tokenized gold chips + fully retokenized DirectoryFilter (theme-aware, both EN/AR, light+dark), hover depth via `hover:[box-shadow:var(--kmt-public-panel-shadow)]`, shared `normalizeText` in src/lib fixing Arabic search, `<bdi>` count isolation, chevron icons added to MaterialSymbol set)*
- [x] `13-public-team.md` — team list + detail *(done 2026-09-15: DirectoryFilter photo cards (optional image/imageAlt/imageSizes — grayscale→color + scale hover), shared `publicPhotoTreatment`/`publicNeutralChip` tokens, detail h1 + breadcrumbs (Team › name, JSON-LD) + `aspect-[4/5]` portrait, credentials section (education/admissions/experience EN+AR), booking notice → kmt-warning state tokens, lawyer `?lawyer=` prefill verified end-to-end; token infra fix: `--kmt-state-*` vars now swap in `.dark` — duplicate `:root` tailwind plugin removed)*
- [x] `14-public-case-studies.md` — case studies list + detail *(done 2026-09-15: distinct hero image (previously-unused scales-of-justice abstract), card meta = category gold chip + locale year (`2026`/`٢٠٢٦`, bdi) instead of repeated "Anonymous", detail h1 + breadcrumbs (Case Studies › title, JSON-LD) + numbered 01–04 gold scroll-reveal blocks (60ms stagger, reduced-motion static, delays verified 180ms on 04) + published-date chip + kmt-warning disclaimer tokens + retokenized back button; cross-locale slug-mapped alternates verified; DB-backed pages verified against a scratch Postgres 5433 + seed + EN/AR twin study, torn down before smoke)*
- [x] `15-public-articles.md` — articles list + detail *(done 2026-09-15: nav/page titles aligned (EN "Insights" / AR "المقالات"), `ArticleBody` minimal rich-text renderer (double-newline paragraphs, `## ` h2, `- ` ul/li with gold markers, `max-w-[65ch]` reading width), detail h1 + 3-level breadcrumbs (Insights › category › title, JSON-LD) + DB author byline with office fallback + `<time>` published date + read-time eyebrow + related same-category cards, new `ReadingProgress` gold scroll hairline (fixed top, token motion, rtl origin-right, `motion-reduce:hidden`), amber disclaimer → kmt-warning tokens; share omitted deliberately; teardown lesson: `.next/cache` must be cleared when removing a scratch DB or stale cached DB content leaks into the no-DB smoke run)*
- [ ] `16-public-media.md` — media page
- [x] `17-public-contact.md` — contact page *(done 2026-09-15: form rebuilt on shared Field components inside a publicPanel token shell (no `!important`, AA placeholder), ShimmerButton submit + 300ms `kmt-motion-check-in` success icon (motion-reduce static), field-level server error mapping (`details[].path` → localized `contactForm.fieldErrors` EN+AR with aria wiring), location cards (map-pin/hours/mailto), area-level Cairo address + `contactChannels` phone/WhatsApp placeholder slots, email domain unified on kmtlegal.com; contact-form e2e surface branch → public-tokens; 3 home-only PLAN-28 failures pre-exist on clean HEAD)*
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
