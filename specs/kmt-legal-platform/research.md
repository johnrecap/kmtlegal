# research.md

## Decision: Next.js App Router
- Context: The platform combines SEO public pages and protected dashboards.
- Options considered: Next.js App Router, separate React SPA + API, NestJS + SPA.
- Chosen option: Next.js App Router for MVP.
- Reason: One TypeScript codebase, strong routing, server-side rendering for public pages, Server Actions/Route Handlers for MVP backend.
- Tradeoffs: Requires discipline around server/client boundaries and caching.
- Risks: Sensitive data leakage through shared caching or server-only imports into client code.
- When to revisit: If backend complexity outgrows Next.js route handlers or if external clients need a stable standalone API.

## Decision: TypeScript Strict Mode
- Context: Legal platform has sensitive roles, permissions, and data flows.
- Options considered: TypeScript strict, loose TypeScript, JavaScript.
- Chosen option: TypeScript strict.
- Reason: Better model contracts and safer refactors.
- Tradeoffs: Higher upfront typing cost.
- Risks: TypeScript is not runtime validation.
- When to revisit: Never for MVP; runtime validation remains mandatory.

## Decision: Tailwind + shadcn/ui + Radix for Product UI
- Context: Need reusable accessible UI and premium legal dashboard density.
- Options considered: shadcn/Radix, Material UI, custom-only components.
- Chosen option: Tailwind + shadcn/ui + Radix, using Stitch tokens.
- Reason: Good accessibility primitives and fast component assembly.
- Tradeoffs: Must govern variants to avoid inconsistent styling.
- Risks: Must not be used in `/stitch-clone/*`.
- When to revisit: If visual parity or accessibility requirements conflict with generated components.

## Decision: PostgreSQL + Prisma
- Context: Data is relational: clients, users, roles, cases, sessions, tasks, documents, audit logs.
- Options considered: PostgreSQL + Prisma, MySQL, SQLite, Firestore-like NoSQL.
- Chosen option: PostgreSQL + Prisma.
- Reason: Relational integrity, migrations, indexes, JSON metadata where needed, future pgvector readiness.
- Tradeoffs: Requires migration discipline.
- Risks: Over-modeling future features too early.
- When to revisit: If multi-tenant SaaS or high-volume analytics requires dedicated stores.

## Decision: Auth.js/NextAuth or Equivalent Secure Cookie Sessions
- Context: Protected portal/admin and server actions need centralized auth.
- Options considered: Auth.js, custom credentials, external IdP.
- Chosen option: Auth.js/NextAuth or equivalent secure server-side session strategy.
- Reason: Mature session handling and provider extensibility.
- Tradeoffs: Credentials/password policy must still be implemented carefully if using credentials.
- Risks: Misconfigured cookies, CSRF, weak session lifetimes.
- When to revisit: If enterprise SSO or an external identity provider becomes mandatory.

## Decision: Required Staff 2FA
- Status: superseded by PLAN-25 for the current release.
- Context: Lawyer, Office Admin, Marketing Staff, and Super Admin accounts can access sensitive legal operations.
- Options considered: 2FA-ready only, optional staff 2FA, required staff 2FA.
- Chosen option: required staff 2FA before MVP release.
- Reason: Staff accounts have broad access and must have a second factor.
- Tradeoffs: Adds onboarding, reset, and support complexity.
- Risks: lockouts, weak fallback email security, OTP brute force without rate limits.
- When to revisit: If adding hardware keys, SSO, or passkeys.

## Decision: Defer Staff 2FA For No-Code Installer Release
- Context: The required TOTP setup flow was not usable enough for the immediate VPS installer release, and SMTP/Email OTP is intentionally disabled.
- Options considered: keep TOTP and block setup, enable SMTP/Email OTP, or defer staff 2FA with password-only staff login.
- Chosen option: `STAFF_2FA_MODE=disabled`; staff and Super Admin login use email/password only until a future Staff 2FA Rework plan.
- Reason: Avoids shipping a broken or hidden TOTP requirement that blocks non-technical setup and first Super Admin access.
- Tradeoffs: Lower account security until 2FA returns; mitigated by strong passwords, Super Admin-only user/password governance, audit logs, rate-limited login, installer setup token, and installer lock.
- Risks: Staff account compromise impact is higher than with 2FA.
- When to revisit: Before production use in a higher-risk environment or when the Staff 2FA Rework plan is scheduled.

## Decision: Permission-Based RBAC
- Context: Roles overlap and object ownership matters.
- Options considered: Role-only checks, permission keys, policy engine.
- Chosen option: Role-based permissions using `resource.action.scope`, plus object-level policy helpers.
- Reason: Clear, seedable, testable, flexible enough for MVP.
- Tradeoffs: Requires good naming and central helper.
- Risks: Permission drift or missing object-scope checks.
- When to revisit: If policies become too complex for static permission keys.

## Decision: VPS Private Filesystem Storage
- Context: Legal documents must not be publicly accessible.
- Options considered: public folder, private VPS filesystem storage, external object storage.
- Chosen option: private VPS filesystem storage for production and development, rooted outside the app such as `/var/lib/kmt-legal/uploads`.
- Reason: Matches VPS-class hosting, avoids public file serving, keeps legal documents under app-controlled authorization.
- Tradeoffs: Requires server disk capacity planning, directory permissions, app-streamed downloads, and backup discipline.
- Risks: Misconfigured Nginx serving uploads directly, path traversal, filename leakage, missed upload-directory backups.
- When to revisit: If storage volume, compliance, or multi-server deployment requires external object storage.

## Decision: AI Provider Gateway
- Context: Prompt requests AI-ready workflow but legal advice is sensitive.
- Options considered: feature-specific provider calls, deterministic-only organizer, no AI service, provider gateway.
- Chosen option: server-side AI Provider Gateway with adapters for `mock`, `openrouter`, `openai-compatible`, `local`, and `custom`.
- Reason: Keeps UI and feature services provider-agnostic while allowing OpenRouter, OpenAI-compatible APIs, local/OpenCode adapters, or future models behind one contract.
- Tradeoffs: More upfront contract/test work than a single provider integration.
- Risks: Prompt/content leakage, schema-invalid output, provider timeout, accidental treatment as legal advice.
- When to revisit: When adding OCR/RAG/legal-advice-adjacent flows or changing safety/privacy policy.

## Decision: Background Job Abstraction, No Worker Stack Yet
- Context: Email is deferred, while reminders, document processing, and scheduling need future-ready boundaries.
- Options considered: no abstraction, simple abstraction, BullMQ + Redis now.
- Chosen option: simple job abstraction for MVP.
- Reason: Keeps dependencies low while preserving architecture.
- Tradeoffs: Jobs may run inline or be manually triggered in MVP.
- Risks: Forgetting idempotency/retry design.
- When to revisit: When high-volume email, SMS, reminders, or social sync require retries and queues.

## Decision: SMTP Deferred, Templates Retained
- Context: The product may later need consultation confirmations, staff notifications, security notices, appointment reminders, and optional Email OTP fallback.
- Options considered: no email code, provider SDK now, SMTP abstraction now but disabled.
- Chosen option: keep the template/config abstraction and env names, but disable SMTP UI/backend sending for this release.
- Reason: Prevents accidental mail delivery or reliance on Email OTP before provider, DNS, retry, and security operations are ready.
- Tradeoffs: MVP users must receive credentials manually from Super Admin; staff 2FA and Email OTP remain deferred.
- Risks: Future activation must revisit deliverability, OTP leakage, blocked SMTP ports, retry behavior, and release smoke tests.
- When to revisit: Open a dedicated SMTP activation plan after provider and DNS decisions are ready.

## Decision: Privacy-Safe Analytics
- Context: Product needs measurement without legal data leakage.
- Options considered: no analytics, full analytics provider, minimal event taxonomy.
- Chosen option: minimal privacy-safe event taxonomy and structured logs.
- Reason: Measures critical funnels while avoiding PII.
- Tradeoffs: Less behavioral insight.
- Risks: Accidental inclusion of names, case summaries, document names, prompts.
- When to revisit: After privacy review and analytics provider selection.

## Decision: Playwright for Critical E2E
- Context: Critical flows cross public, admin, portal, and permissions.
- Options considered: manual QA only, Playwright, Cypress.
- Chosen option: Playwright.
- Reason: Strong browser automation, screenshots, auth state setup, responsive checks.
- Tradeoffs: Requires stable test data.
- Risks: Flaky tests if selectors and seed data are not deterministic.
- When to revisit: If team standardizes on another E2E tool.

## Decision: VPS-Class Panel-Aware Deployment
- Context: Production target started as VPS, then PLAN-26 added a requirement for Terminal VPS, aaPanel, and cPanel setup paths.
- Options considered: Terminal VPS only, generic shared-hosting support, or VPS-class panel-aware setup.
- Chosen option: VPS-class panel-aware setup. Terminal VPS is the supported default; aaPanel is treated as a VPS panel adapter; cPanel is conditional on hard preflight requirements.
- Reason: The app requires persistent Node.js, PostgreSQL, private uploads, env secrets, build/migration commands, and a reverse proxy/process manager. Generic shared cPanel cannot be promised safely.
- Tradeoffs: More documentation and preflight logic, but fewer failed installs and fewer insecure hosting workarounds.
- Risks: Panel providers vary widely. Unsupported cPanel must fail preflight rather than silently using insecure storage, wrong databases, or static hosting.
- When to revisit: After smoke tests on a real aaPanel VPS and at least one compatible cPanel account.

## Decision: Arabic RTL First, English Ready
- Context: Market is Egypt and Arabic-speaking legal clients.
- Options considered: Arabic-only, English-only, bilingual now.
- Chosen option: Arabic-first with English-ready structure.
- Reason: Meets market needs while avoiding hardcoded direction/text.
- Tradeoffs: Full English translation can be deferred.
- Risks: Mixed Arabic/English table data and numbers can break layout.
- When to revisit: Before public English launch.

## Decision: Accessibility as Build Gate
- Context: Legal users include stressed clients and staff doing repeated work.
- Options considered: later audit, component-level rules, strict gate.
- Chosen option: accessibility included in component/page acceptance.
- Reason: Prevents inaccessible forms, dialogs, tables, and admin workflows.
- Tradeoffs: Extra design/test work.
- Risks: shadcn customizations can break Radix accessibility if not reviewed.
- When to revisit: Before release and after major UI changes.
