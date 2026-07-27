# Feature Specification: Production Lockfile Repair

**Feature Branch**: `main`

**Created**: 2026-07-27

**Status**: Draft

**Input**: Restore the aaPanel/PM2 production update after `npm ci` rejected the committed lockfile as out of sync while moving the live site to `kmtlegal.org`.

## Clarifications

### Session 2026-07-27

- Q: Is this a dependency upgrade or a lockfile synchronization repair? → A: Lockfile synchronization only; `package.json` dependency declarations remain unchanged.
- Q: Which package-manager release defines the deterministic result? → A: npm 11.6.2, as pinned by `packageManager`.
- Q: What proves the domain migration advanced after the build repair? → A: A ready live health response plus a sitemap that uses `https://kmtlegal.org` and contains no former-domain URLs.
- Q: May the former domain be stopped as part of this repair? → A: No; it remains available until the repaired release passes the live acceptance checks.

## User Scenarios & Testing

### User Story 1 - Deterministic production install (Priority: P1)

As the production operator, I can run the documented aaPanel update script from a clean checkout and have dependency installation complete without changing the declared application dependencies.

**Why this priority**: The current deployment stops before build and restart, leaving the live site on an older release whose generated sitemap still uses the former domain.

**Independent Test**: A clean `npm ci` using the repository-pinned npm release completes successfully, after which the production build completes with the documented database-independent build flag.

**Acceptance Scenarios**:

1. **Given** the committed `package.json` and regenerated `package-lock.json`, **When** `npm ci` runs with npm 11.6.2 on a supported Node.js release, **Then** installation exits successfully without rewriting the lockfile.
2. **Given** the clean installed dependency tree, **When** the production build runs with `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`, **Then** the build exits successfully.
3. **Given** the repaired revision is deployed with `APP_ORIGIN=https://kmtlegal.org`, **When** the public sitemap and health endpoint are checked, **Then** health is ready and generated canonical URLs use `https://kmtlegal.org`.

### Edge Cases

- A different npm release may resolve optional WASM transitive dependencies differently; verification therefore uses the `packageManager` release declared by the repository.
- A registry or network failure is operationally distinct from lockfile drift and must not be reported as a successful repair.
- Existing `node_modules` content must not be treated as evidence; the acceptance check must use `npm ci`.
- A successful build without the production `APP_ORIGIN` does not prove the live-domain migration; the post-deploy sitemap check remains required.

## Scope & Connected Impact

### In Scope

- Synchronize `package-lock.json` with the unchanged dependency manifest using npm 11.6.2.
- Prove clean dependency installation and a production build.
- Register the focused repair and its verification evidence in the project planning/status artifacts.
- Hand off the existing aaPanel/PM2 update command and live checks.

### Out of Scope

- Dependency upgrades, downgrades, vulnerability remediation, or package substitutions.
- Nginx, Cloudflare, TLS certificate, DNS, database, Prisma schema, payment, authentication, API, or UI changes.
- Disabling or deleting the former domain before the new release passes live checks.

### Existing Behavior to Preserve

- The application remains on the dependency versions and npm override policy declared in `package.json`.
- The live `kmtlegal.org` site and `/api/health` remain available while the repair is prepared.
- Paid booking remains disabled and all existing database, authorization, payment, storage, and malware-scan behavior remains unchanged.
- The existing update entry point remains `bash deploy/install/aapanel-pm2-update.sh`.

### Affected Surfaces

- **Actors/Roles**: Production operator only; no application permission changes.
- **UI/Routes**: No implementation changes; `/sitemap.xml` and `/api/health` are post-deploy evidence surfaces only.
- **API/Services**: No contract changes.
- **Data**: No schema, migration, seed, or stored-data changes.
- **Messages/Localization**: No user-facing text or localization changes.
- **Tests/Docs/Deployment**: `npm ci`, production build, lockfile diff review, master task/status registration, and live health/sitemap checks.

## Requirements

### Functional Requirements

- **FR-001**: The committed lockfile MUST be accepted by `npm ci` with npm 11.6.2 and a Node.js version allowed by `package.json`.
- **FR-002**: The repair MUST NOT change the direct dependencies, dev dependencies, overrides, engines, scripts, name, or version declared in `package.json`.
- **FR-003**: Lockfile changes MUST be limited to npm-generated dependency-resolution metadata needed to synchronize the existing manifest.
- **FR-004**: The clean installed tree MUST produce a successful production build with the repository's documented database-independent build flag.
- **FR-005**: Deployment MUST continue through the documented aaPanel/PM2 update script rather than an ad hoc production install sequence.
- **FR-006**: Live acceptance MUST require a ready health response and `kmtlegal.org` canonical sitemap URLs after deployment.
- **FR-007**: The former domain MUST remain untouched until FR-006 passes.

### Key Entities

No application or database entities are introduced. The only mutable implementation artifact is npm's dependency lockfile.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A clean `npm ci` exits with code 0 and leaves `package-lock.json` unchanged.
- **SC-002**: The production build exits with code 0 after the clean install.
- **SC-003**: The implementation diff contains no application source, schema, API contract, UI, or dependency-manifest change.
- **SC-004**: After server deployment, `/api/health` reports `ready` and `/sitemap.xml` contains `https://kmtlegal.org` with no `kmtlegal.saeeddev.com` URLs.

## Assumptions

- The server uses the repository-declared npm 11.6.2 and a supported Node.js release.
- The existing production `.env.production.local` continues to contain `APP_ORIGIN=https://kmtlegal.org`.
- The already-configured Cloudflare, Nginx reverse proxy, TLS origin certificate, PM2 service, PostgreSQL, and ClamAV remain healthy.
