# Panel Installer Harness Team Spec

## Goal

Keep PLAN-26 installer work honest and portable across Terminal VPS, aaPanel, and cPanel without pretending unsupported shared hosting can run the app.

## Roles

- Installer Orchestrator: owns the hosting mode selector, Spec Kit sync, and final acceptance.
- DevOps Reviewer: checks service ownership boundaries, reverse proxy assumptions, process manager behavior, and upload paths.
- cPanel Reviewer: verifies cPanel hard requirements and fail-fast messages.
- aaPanel Reviewer: verifies aaPanel-assisted setup avoids root-only service mutation and maps to panel fields.
- Security Reviewer: checks setup token, private uploads, no SMTP, no TOTP, no public secrets, and installer lock.
- QA Reviewer: defines preflight, smoke, and static command-safety tests.

## Source Files

- `docs/PLAN_26_PANEL_INSTALLER.md`
- `specs/kmt-legal-platform/devops-plan.md`
- `specs/kmt-legal-platform/quickstart.md`
- `specs/kmt-legal-platform/tasks.md`
- `deploy/install/install.sh`
- Panel script: `deploy/install/panel-install.sh`

## Non-Negotiables

- Do not claim generic shared cPanel support.
- Do not use MySQL as a hidden substitute for PostgreSQL.
- Do not place uploads under `public_html` or any public webroot.
- Do not enable SMTP.
- Do not re-enable TOTP.
- Do not run `apt-get`, `systemctl`, Certbot, or direct Nginx file writes in aaPanel/cPanel mode.
- Do not run migrations or `/install` bootstrap until preflight passes.

## Handoff Artifacts

Use `_workspace/panel-installer/` for future evidence:

- `00_environment-inventory.md`
- `01_preflight-results.md`
- `02_panel-setup-notes.md`
- `03_smoke-results.md`
- `04_release-decision.md`

## Acceptance

- Terminal VPS smoke proves root installer path.
- aaPanel smoke proves panel-assisted path.
- cPanel smoke proves only compatible cPanel accounts pass.
- Unsupported cPanel produces a clear rejection reason before build/migration/bootstrap.
