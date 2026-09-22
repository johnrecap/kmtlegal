# Admin and Staff Workspace Modernization

Date: 2026-09-22
Scope: `/admin` and all staff roles. Spec Kit was not activated.

## Accepted product decisions

- The admin area supports complete light and dark themes through semantic tokens; light remains the default and the existing admin theme storage key is preserved.
- Authorization remains server-side. UI action rights are derived from the same permission policy and never replace the API guard.
- The persistent layout owns the sidebar, mobile navigation, account context, theme control, and notification bell.
- Existing UI libraries and API contracts are reused. No role, dependency, or database schema was added.

## Implementation tracker

| ID | Delivery | State | Acceptance evidence |
| --- | --- | --- | --- |
| ADM-01 | Baseline and acceptance coverage | PARTIAL | Unit/source contracts and the existing five-persona fixture contract are present. Authenticated browser execution remains blocked until disposable PostgreSQL data and five safe storage-state files are supplied; skipped cases are not counted as success. |
| ADM-02 | Semantic theme and tokens | COMPLETE | Admin routes, components, and features use semantic neutral surfaces; a regression test rejects fixed white/slate/gray admin surfaces. Dialog, Sheet, menu, and popover tokens cover both themes. |
| ADM-03 | Persistent shell and header | COMPLETE | One route layout owns navigation and notifications; page loading/error/not-found states render inside the content frame. Skip link, sticky header, breadcrumbs, role, and access scope are available. |
| ADM-04 | Sidebar and mobile navigation | COMPLETE | Explicit persisted 280px/72px desktop states, six permission-filtered groups, no hover resize, RTL Sheet navigation, close-on-navigation, focus return, and reduced-motion styling. |
| ADM-05 | Shared components, filters, copy, and errors | COMPLETE | Shared Button/Card/DataTable/Field/Badge/StateBlock and admin filters/actions are retained; dense tables can switch at `lg`; the shared Arabic API-error parser preserves request IDs; touch targets and Arabic close labels are normalized. |
| ADM-06 | Tasks | COMPLETE | List is default; `display=board` is independent from `view`; status totals exclude only the status filter and are independent of pagination; each board lane is independently bounded; create/edit uses one Sheet; read-only rights and optimistic concurrency are preserved. |
| ADM-07 | Documents | COMPLETE | One desktop table and one mobile-card surface share a single selected-record Sheet. Update/delete controls are no longer duplicated and generated field IDs remain unique. |
| ADM-08 | Conversations and notifications | COMPLETE | Reply labeling/error announcements, newest-message behavior, new-message affordance, draft status/save/confirm flow, visibility-aware abortable polling with backoff, shared error parsing, and visible notification failures are implemented. |
| ADM-09 | Role-aware dashboard | COMPLETE | Modules, metrics, sections, and actions are permission-filtered and ordered for Lawyer, Secretary, Marketing Staff, Office Admin, and Super Admin. Metric scope/timeframe and destination-equivalent links remain explicit and unit-tested. |
| ADM-10 | Operational/admin pages | COMPLETE | Finance, reports, content, calendar, audit, cases, clients, consultations, users, roles, settings, contact, and detail/create routes were migrated to the shared visual system. Reports limit primary KPIs, separate currencies, and expose progress semantics; content has full-width editor/dirty guard; calendar supports agenda/week/day Cairo ranges; audit uses allowed entity selectors. |
| ADM-11 | Decomposition, tests, and documentation | PARTIAL | Shared shell, document list, error parser, and page frame were extracted; conventions and current status are updated. Typecheck, lint, the complete runnable unit suite, production build, and public smoke coverage pass. The authenticated visual/a11y matrix remains an external-environment gate. |

## Required verification and evidence policy

- Required before repository handoff: `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- Targeted contracts cover dashboard role ordering, task totals/read-only rights, unique document controls, persistent shell ownership, semantic admin surfaces, list filter URLs, and Radix mobile navigation.
- `npm run test:e2e:plan35` must be rerun with all five disposable persona storage states. Any skipped authenticated test leaves ADM-01 and ADM-11 open.
- The full visual matrix remains: 390px and 1440px in both themes for every allowed route and role, plus 320/768/1024/1536px shell/table/dialog/task checks, keyboard, 200% zoom, RTL, reduced motion, focus return, and contrast.

## Authenticated-browser inputs

The existing runner reads the following safe, disposable storage-state variables:

- `PLAN35_LAWYER_STORAGE_STATE`
- `PLAN35_SECRETARY_STORAGE_STATE`
- `PLAN35_OFFICE_ADMIN_STORAGE_STATE`
- `PLAN35_MARKETING_STAFF_STORAGE_STATE`
- `PLAN35_SUPER_ADMIN_STORAGE_STATE`

Database-writing scenarios additionally require the existing explicit isolated-fixture flags. Production accounts and production records must never be used.

## Verification executed on 2026-09-22

- TypeScript: passed with `tsc --noEmit`.
- Lint: passed with no warnings or errors.
- Vitest: 215/215 suites passed; 702 tests passed and 53 explicit opt-in/pending cases were not counted as success.
- Production build: passed, including route generation and Next.js type/lint validation.
- Public smoke coverage: all 42 assertions were covered. The 41 production-compatible assertions passed against the local production build; the development-only login-copy assertion passed separately against `next dev`.
- The booking smoke mock was aligned with the current server-owned legal-boundary contract, then passed together with privacy, contact, sitemap, and deferred-route regression checks.
- Authenticated Plan 35 browser suite: 30/30 scenarios remained skipped because no disposable persona storage states were supplied. This is the only acceptance gate keeping ADM-01 and ADM-11 partial.
