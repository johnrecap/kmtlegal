# frontend-plan.md

## Design System

### Semantic Color Tokens
- `background.canvas`
- `background.surface`
- `background.elevated`
- `text.primary`
- `text.secondary`
- `text.muted`
- `border.default`
- `border.strong`
- `action.primary`
- `action.secondary`
- `status.success`
- `status.warning`
- `status.error`
- `status.info`
- `status.private`

Use Stitch `DESIGN.md` as the source for initial palette: calm light surfaces, midnight/navy authority, restrained gold accent, semantic statuses, low-shadow depth.

### Typography Scale
- Arabic primary: IBM Plex Sans Arabic or Cairo.
- Latin/numbers: Inter.
- Display: public hero and dashboard overview only.
- Headline: page titles and major sections.
- Body: dense legal content.
- Label: metadata, badges, table headers.
- Arabic line height must remain generous enough to avoid clipping.

### Spacing, Radius, Shadows, Motion
- Base-8 spacing.
- Container max around 1200px for public content.
- Radius: 4px controls, 8px cards, pill only for status badges.
- Shadows: subtle; prefer borders and tonal layering.
- Motion: subtle, fast, reduced-motion safe; no distracting legal dashboard animation.

### Breakpoints
- Mobile: single column, thumb-friendly controls, 44px targets.
- Tablet: two-column where useful.
- Desktop: dashboard shell with sidebar, dense tables, filters, metrics.

### RTL Rules
- Arabic is `dir="rtl"` by default.
- Sidebar appears on the right in Arabic.
- Directional icons mirror when meaning direction.
- Tables keep numeric columns readable.
- English route structure remains LTR-ready through locale layout.

### Dark Mode
N/A for MVP unless explicitly requested; legal platform prioritizes calm light-mode readability.

## Component Inventory

### Foundations
| Component | Purpose | Variants/States | Accessibility | Tests |
| --- | --- | --- | --- | --- |
| ThemeProvider | Tokens and direction | rtl/ltr | sets dir/lang | render smoke |
| LocaleSwitcher | Arabic/English structure | ar/en | button labels | interaction |
| Icon | Lucide wrapper | size/stroke | aria-hidden/label | snapshot |

### Base UI
| Component | Purpose | Variants/States | Accessibility | Tests |
| --- | --- | --- | --- | --- |
| Button | Actions | primary/secondary/ghost/destructive/loading/disabled | focus, label | component |
| Input | Text input | default/error/disabled | label + error id | form |
| Select | Controlled choices | default/error/disabled | keyboard | form |
| Textarea | Summaries/notes | default/error/disabled | label + error | form |
| Card | Content surface | default/interactive/private | semantic heading | snapshot |
| Badge | Status/priority | success/warning/error/info/private | no color-only | component |
| Dialog | Confirmation/forms | alert/form | focus trap | component |
| Toast | Feedback | success/error/info | live region | component |

### Forms
- BookingStepper
- LoginForm
- InstallWizard
- ContactForm
- ConsultationReviewForm
- ClientProfileForm
- DocumentUploadDropzone
- CaseStatusForm
- TaskForm
- ContentEditorForm

### Navigation
- PublicHeader
- PublicFooter
- DashboardShell
- DashboardSidebar
- DashboardTopbar
- Breadcrumbs
- Tabs
- Command/search entry later if needed.

### Data Display
- DataTable
- FilterBar
- SearchInput
- MetricCard
- Timeline
- DocumentCard
- CalendarEventCard
- TaskKanbanBoard
- AuditLogTable

### Feedback and States
- LoadingState
- EmptyState
- ErrorState
- PermissionBlocked
- ValidationSummary
- ConfirmationDialog

### Domain Components
- ServiceCard
- LawyerCard
- CaseStudyCard
- ArticleCard
- SocialPostCard
- AIOrganizerPanel
- CaseSummaryCard
- AppointmentCard
- PaymentRecordCard
- ConfidentialityBadge

## Page Inventory

| Route | Role | Purpose | Components | Data/API | Permissions | States | SEO/Analytics | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Guest | Trust homepage | PublicHeader, Hero, ServiceCard, CTA | services/lawyers/articles | public | loading/error | SEO, page_view | render |
| `/services` | Guest | Browse services | ServiceCard, FilterBar | public services | public | empty/error | SEO, service_filter_used | render/filter |
| `/services/[slug]` | Guest | Service detail | Service detail, CTA | service by slug | public | not-found | SEO | render |
| `/team` | Guest | Lawyer list | LawyerCard, FilterBar | public lawyers | public | empty/error | SEO | render |
| `/team/[slug]` | Guest | Lawyer profile | Lawyer profile, CTA | lawyer by slug | public | not-found | SEO | render |
| `/book-consultation` | Guest | Intake | BookingStepper, AIOrganizerPanel | create consultation | public submit | validation/error/success | consultation_started/submitted | E2E |
| `/case-studies` | Guest | Published studies | CaseStudyCard | published anonymized studies | public | empty/error | SEO | render |
| `/case-studies/[slug]` | Guest | Study detail | disclaimer, content | study by slug | public | not-found | SEO | render |
| `/media` | Guest | Social wall/media | SocialPostCard | media entries | public | empty | SEO | render |
| `/articles` | Guest | Articles list | ArticleCard, filters | published articles | public | empty/error | SEO | render |
| `/articles/[slug]` | Guest | Article detail | article body | article by slug | public | not-found | SEO | render |
| `/contact` | Guest | Contact/branches | ContactForm, branch cards | submit contact | public submit | validation/success | contact_submitted | form |
| `/login` | Guest | Login | LoginForm | auth login | guest/authenticated | invalid/loading | login_attempted | auth E2E |
| `/install` | Installer operator | Hosting selector and first setup wizard | InstallWizard, HostingModeSelector | installer APIs | setup token | disabled/locked/preflight/error/success/unsupported-hosting | installer_bootstrap | installer + panel preflight contract |
| `/portal` | Client | Dashboard | DashboardShell, MetricCard | portal summary | portal.read.self | empty/error/no-permission | portal_viewed | E2E |
| `/portal/cases/[id]` | Client | Own case detail | CaseSummary, Timeline | own case | case.read.own | 403/404 safe | case_viewed | E2E |
| `/portal/documents` | Client | Upload/list docs | UploadDropzone, DocumentCard | own docs/upload | document.read/upload.self | upload errors | upload_success/failed | E2E |
| `/portal/appointments` | Client | Own appointments | AppointmentCard | own appointments | appointment.read.own | empty/error | appointment_viewed | render |
| `/portal/payments` | Client | Invoice/payment records | PaymentRecordCard | own payments | payment.read.own | empty | payment_viewed | render |
| `/portal/profile` | Client | Profile | ClientProfileForm | profile update | user.update.self | validation | profile_updated | form |
| `/admin` | Staff | Operations overview | metrics/tables | admin summary | dashboard.read.any | empty/error | admin_dashboard_viewed | E2E |
| `/admin/consultations` | Staff | Review queue | DataTable, filters | consultations | consultation.review | empty/error | consultation_queue_viewed | E2E |
| `/admin/clients` | Admin | CRM | DataTable, filters | clients | client.read.any | empty/error | client_filter_used | integration |
| `/admin/clients/[id]` | Admin | Client detail | profile/tabs | client detail | client.read.any | not-found | client_viewed | render |
| `/admin/cases` | Staff | Case list | DataTable | cases | case.read.any/assigned | empty/error | case_filter_used | integration |
| `/admin/cases/[id]` | Staff | Internal case | tabs, timeline, docs, tasks | case detail | case.read/update | 403/404 | case_updated | E2E |
| `/admin/calendar` | Staff | Sessions | calendar/list | appointments | appointment.read/manage | empty/error | calendar_viewed | render |
| `/admin/tasks` | Staff | Kanban | TaskKanbanBoard | tasks | task.read/manage | empty/error | task_updated | E2E |
| `/admin/documents` | Staff | Documents | table/upload | documents | document.manage | upload errors | document_status_changed | E2E |
| `/admin/content` | Marketing | Content hub | cards/tables | content summary | content.read | empty | content_viewed | render |
| `/admin/content/articles` | Marketing | Articles admin | table/editor | article CRUD | content.create/update | validation | article_published | integration |
| `/admin/content/case-studies` | Marketing | Case studies admin | table/review | caseStudy CRUD | caseStudy.create/approve | approval required | case_study_approved | E2E |
| `/admin/finance` | Admin | Invoice basics | table/cards | invoices/payments | finance.read | empty | finance_viewed | render |
| `/admin/reports` | Admin | Reports | charts/tables | report summary | reports.read | empty | report_viewed | render |
| `/admin/users` | Super Admin | Users/roles | table/forms | users/roles | user.manage | denied | user_role_changed | integration |
| `/admin/settings` | Super Admin | Settings | forms | settings | settings.manage | validation | setting_updated | integration |
| `/admin/audit-log` | Super Admin | Audit search | AuditLogTable | audit logs | audit.read.any | empty | audit_searched | render |

## UX Flows

### Consultation Happy Path
Home -> service detail -> book consultation -> fill contact/case summary -> AI Provider Gateway organizer output -> submit -> reference confirmation -> admin queue. Email delivery is deferred.

### Consultation Admin Path
Admin queue -> detail -> assign lawyer -> review conflict placeholder -> convert -> client/case/appointment created -> audit log.

### Client Upload Path
Login -> portal documents -> select PDF/DOC/DOCX/JPG/JPEG/PNG under 5MB -> client validation -> server validation -> private VPS storage -> document metadata -> status `new` -> success toast.

### Case Study Approval Path
Marketing draft -> AI Provider Gateway suggestion optional -> anonymization checklist -> legal review -> approve -> publish -> public detail with disclaimer.

### Error Paths
- Validation error stays on form and preserves input.
- Permission denied shows `PermissionBlocked`.
- Unauthorized redirects to login or returns 401 depending route/API.
- Upload errors explain size/type/permission without exposing storage details.
- Staff 2FA UI is hidden in this release. `/login/2fa` is disabled, and TOTP/Email OTP prompts must not appear until a future Staff 2FA Rework plan.
- Installer errors explain disabled, locked, invalid token, failed preflight, unsupported hosting, duplicate Super Admin, and completion states without exposing secrets.
- PLAN-26 install UI starts with a hosting choice: Terminal VPS, aaPanel, or cPanel. cPanel copy must say clearly that unsupported shared hosting will be rejected if Node.js App, PostgreSQL, command runner, env vars, persistent process, or private non-`public_html` storage are missing.

## Responsive Plan
- Desktop: dashboard sidebar, tables, filters, split panels.
- Tablet: collapsible sidebar, two-column summaries.
- Mobile: stacked cards, bottom-friendly actions, no horizontal table overflow without responsive cards.

## Accessibility Plan
- Semantic headings and landmarks.
- Field labels and `aria-describedby` errors.
- Dialog focus trap and escape behavior.
- Keyboard-accessible tabs, menus, tables, and kanban actions.
- Visible focus states.
- Status badges include text, not color only.
- 44px touch targets.
- Reduced motion support.

## Frontend Testing Plan
- Component tests for Button, Input, Dialog, DataTable, UploadDropzone, BookingStepper, PermissionBlocked.
- Page smoke tests for all public, portal, and admin routes.
- E2E for booking, admin conversion, staff password login without 2FA, client portal, upload, unauthorized access, installer bootstrap, panel-aware preflight states, and case study approval.
- Visual checks for Stitch clone and key product shells.
- Accessibility checks on core forms, dialogs, dashboard tables, and public pages.
