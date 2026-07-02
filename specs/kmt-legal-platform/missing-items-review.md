# missing-items-review.md

## Review Table

| Item | Included? Yes/No/N/A | Location | Notes |
| ---- | -------------------- | -------- | ----- |
| Product brief | Yes | `spec.md` | Product type, description, problem, value proposition |
| Scope | Yes | `spec.md` | MVP and deferred scope separated |
| Personas | Yes | `spec.md` | Guest, potential client, client, lawyer, admin, marketing, super admin |
| User stories | Yes | `spec.md` | Core stories with acceptance, edge, failure states |
| User journeys | Yes | `frontend-plan.md`, `test-plan.md` | Booking, conversion, portal, upload, staff 2FA, approval |
| Feature inventory | Yes | `spec.md`, `tasks.md` | Public, portal, admin, content, AI, security |
| Sitemap | Yes | `plan.md`, `frontend-plan.md` | Public, portal, admin, auth, errors |
| Stitch clone harness | Yes | `docs/harness/stitch-clone/team-spec.md`, `.agents/skills/stitch-clone-orchestrator/SKILL.md` | Strict visual parity workflow with per-screen handoff artifacts |
| Page inventory | Yes | `frontend-plan.md` | Route table with data/API/permissions/states |
| Frontend plan | Yes | `frontend-plan.md` | Tokens, components, pages, flows, responsive, accessibility |
| Backend plan | Yes | `backend-plan.md` | Modules, services, auth, authorization, jobs, logs |
| Database model | Yes | `data-model.md` | Entities, lifecycle, indexes, audit, retention |
| API contracts | Yes | `contracts/openapi-plan.md` | Endpoint groups, standards, errors, rate limits |
| Auth | Yes | `backend-plan.md`, `security-plan.md` | Session, login, logout, cookie posture |
| Permissions | Yes | `backend-plan.md`, `data-model.md` | RBAC plus object scope |
| File uploads | Yes | `data-model.md`, `contracts/openapi-plan.md`, `security-plan.md`, `tasks.md` | Private VPS storage, 5MB cap, PDF/DOC/DOCX/JPG/JPEG/PNG validation |
| Notifications | Yes | `data-model.md`, `backend-plan.md`, `contracts/openapi-plan.md` | In-app plus deferred SMTP placeholders; no email sending in this release |
| Search | Yes | `frontend-plan.md`, `contracts/openapi-plan.md`, `data-model.md` | Search/filter/sort for lists; advanced search deferred |
| AI | Yes | `spec.md`, `research.md`, `backend-plan.md`, `contracts/openapi-plan.md`, `tasks.md` | Provider-agnostic AI Gateway with mock/OpenRouter/OpenAI-compatible/local/custom adapters |
| Integrations | Yes | `plan.md`, `devops-plan.md` | VPS storage and AI Gateway in MVP; SMTP email/payments/social/SMS deferred |
| Security | Yes | `security-plan.md` | Threat model and controls |
| Privacy | Yes | `security-plan.md` | PII classification, retention, export/deletion notes |
| Tests | Yes | `test-plan.md` | Pyramid, matrix, critical flows |
| DevOps | Yes | `devops-plan.md` | Environments, CI/CD, hosting, monitoring, backup |
| Monitoring | Yes | `devops-plan.md`, `backend-plan.md` | Logs, metrics, alerts, error capture |
| Analytics | Yes | `test-plan.md`, `backend-plan.md`, `devops-plan.md` | Privacy-safe event taxonomy |
| Documentation | Yes | `quickstart.md`, all artifacts | Setup and handoff docs |
| Roadmap | Yes | `spec.md`, `plan.md`, `research.md` | Deferred features and revisit triggers |
| Tasks | Yes | `tasks.md` | T001-T140 dependency ordered |
| Quality gates | Yes | `quality-gates.md` | Product through release and legal protection gates |
| PLAN-24 remediation | Yes | `docs/PLAN_24_REMEDIATION_PRODUCTION_READINESS.md`, `tasks.md`, `quality-gates.md` | Tracks findings, release blockers, DB/E2E/security/VPS gates |
| PLAN-26 panel installer | Yes | `docs/PLAN_26_PANEL_INSTALLER.md`, `docs/harness/panel-installer/team-spec.md`, `tasks.md` | Defines Terminal VPS, aaPanel, and conditional cPanel setup modes with preflight and unsupported-hosting rejection |
| PLAN-27 live-site QA remediation | Yes | `docs/PLAN_27_LIVE_SITE_QA_REMEDIATION.md`, `tasks.md`, `quality-gates.md` | Tracks deployed-site QA remediation across public content links, deploy/admin chunks, CSP, favicon, auth/admin copy, booking/contact UX, admin mock AI/overflow cleanup, and live smoke evidence; local code fixes are partially implemented and deployed evidence remains required |

## Resolved Clarifications
- Final hosting target: VPS-class hosting. Terminal VPS is the supported default; aaPanel is supported as a VPS panel adapter; cPanel is conditional on Node.js App, PostgreSQL, command runner, env vars, persistent process, and private storage outside `public_html`.
- Storage: private VPS filesystem storage such as `/var/lib/kmt-legal/uploads`; Nginx must not serve uploads directly.
- Upload allowlist and size: PDF, DOC, DOCX, JPG/JPEG, PNG, max 5MB.
- Email sending: deferred; SMTP placeholders/templates exist but UI/backend sending is disabled.
- Staff 2FA: deferred by PLAN-25; `STAFF_2FA_MODE=disabled` is required and TOTP must not be enabled before a future Staff 2FA Rework.
- Installer: PLAN-25 adds no-code VPS setup, first Super Admin bootstrap, and installer lock requirements.
- Panel installer: PLAN-26 adds a hosting mode selector and preflight so unsupported cPanel/shared hosting fails before build, migration, or `/install` bootstrap.
- Live QA remediation: PLAN-27 must pass before production readiness is claimed. Local code now addresses the public content mismatch, CSP/favicon, auth copy, booking success, contact duplicate-submit, admin shell/settings copy, admin mock AI display, and admin overflow findings, but broader static/mobile coverage, atomic deploy, and deployed smoke evidence are still required.
- Manual finance: invoice/payment basics only with `invoiceNumber`, `clientId`, `caseId?`, `issueDate`, `dueDate?`, `amount`, `currency`, `status`, `paymentMethod?`, `receiptNumber?`, `paidAt?`, `notes?`, `createdById`, timestamps.
- AI: server-side provider gateway, model/provider agnostic for OpenRouter, OpenAI-compatible APIs, local/OpenCode/custom adapters, or future models.

## Clarifications Still Needed
- Whether full English content is part of MVP or only structure.
- Which package manager to standardize on.

## Scope Warnings
- Earlier planning artifacts were created before implementation. Current PLAN-24 artifacts are implementation/remediation tracking and must not be used to claim production readiness without gate evidence.
- Payment gateway, SMS, social publishing, OCR/RAG, court integration, mobile app, and SaaS billing are intentionally deferred.
- AI provider gateway is included; legal-advice generation remains out of scope.
- Stitch clone must remain separate from product UI implementation.
- Admin finance/reports are MVP basics only and must not become a full accounting system.

## Readiness Verdict
The product implementation is functionally broad but not production-clear. Dependency audit remediation is complete in this workspace, but before production launch the remaining gates still need real runtime evidence: close PLAN-24 open DB/VPS tasks, complete PLAN-26 hosting smoke for the chosen panel path, complete PLAN-27 live-site QA remediation, run DB-backed gates on PostgreSQL, run `qa:release`, verify broader public links/static assets/mobile behavior plus CSP/favicon/auth/admin/booking/contact behavior, atomically deploy the latest build, and archive deployed smoke evidence.
