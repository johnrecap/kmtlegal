# Implementation Plan: Production Lockfile Repair

**Branch**: `main` | **Date**: 2026-07-27 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/kmt-legal-platform/plan-38-production-lockfile-repair/spec.md`

## Summary

Regenerate npm's lockfile metadata with the repository-pinned npm 11.6.2 while leaving `package.json` unchanged, then prove a clean deterministic install and production build. Register evidence and hand off the existing aaPanel/PM2 deployment script so the live release can rebuild with `APP_ORIGIN=https://kmtlegal.org`.

## Technical Context

**Language/Version**: TypeScript/JavaScript on Node.js `>=20.19.0 <21 || >=22.12.0 <23 || >=24.0.0`

**Primary Dependencies**: npm 11.6.2, Next.js 15.5.20, React 18.2, Prisma 7.8

**Storage**: N/A; no database or application-data change

**Testing**: `npm ci`, lockfile cleanliness/diff review, `npm run typecheck`, `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build`

**Target Platform**: Local Windows verification and Linux aaPanel/PM2 production deployment

**Project Type**: Next.js web application with a deterministic npm release pipeline

**Performance Goals**: No runtime performance change

**Constraints**: Preserve `package.json`; change only npm-generated lock metadata plus planning/status evidence; do not modify live services until local gates pass

**Scale/Scope**: One lockfile repair and its deployment evidence; no application behavior change

## Constitution Check

### Pre-design gate

- **Spec Kit gate**: PASS. Constitution, specification, and clarification are complete; no unresolved questions remain.
- **Existing-system gate**: PASS. Evidence comes from the committed manifest/lockfile, the server's exact `npm ci` failure, and the existing aaPanel update script.
- **Connected-impact gate**: PASS. UI, API, data, authorization, messages, and application contracts are explicitly unaffected; tests/docs/deployment are mapped.
- **Correctness gate**: PASS. No scopes, DTOs, mutations, migrations, conflicts, or audit obligations are introduced.
- **Quality gate**: PASS. A clean install, lockfile stability, typecheck, production build, and live health/sitemap acceptance are proportional to the change.
- **Conflict-control gate**: PASS. One sequential ownership lane covers `package-lock.json` and the focused planning/status artifacts.

### Post-design gate

PASS with no exceptions. Research fixes the package-manager version, the data-model artifact records no data impact, the deployment evidence contract is explicit, and quickstart commands provide objective acceptance gates.

## Project Structure

### Documentation (this feature)

```text
specs/kmt-legal-platform/plan-38-production-lockfile-repair/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── deployment-evidence.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source and delivery artifacts (repository root)

```text
package.json
package-lock.json
deploy/install/aapanel-pm2-update.sh
specs/kmt-legal-platform/tasks.md
docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md
```

**Structure Decision**: Keep the application source untouched. Regenerate only `package-lock.json`; reference but do not change the established update script unless verification proves a separate defect.

## Reuse and Connected-Impact Decisions

- **Reuse**: Keep the repository-pinned npm release and current dependency declarations.
- **Reuse**: Keep the aaPanel/PM2 update script as the sole production entry point.
- **No application change**: Routes, services, auth, database, UI, localization, analytics, and payment behavior remain unchanged.
- **Deployment consequence**: A successful rebuild consumes the existing server `APP_ORIGIN` and refreshes generated sitemap output.
- **Protected rollback boundary**: If live verification fails, keep the current PM2 release and former domain available; do not treat the lockfile repair alone as live acceptance.

## File Conflict Control

All work is sequential in one ownership lane:

1. Planning artifacts and active-feature pointer.
2. `package-lock.json` regeneration.
3. Install/build verification.
4. Master task/status evidence.
5. Commit/push and server handoff.

No task is parallelized because the evidence and status updates depend on the exact generated lockfile.

## Complexity Tracking

No constitution violations or additional architectural complexity.
