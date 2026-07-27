# Research: Production Lockfile Repair

## Decision 1: Use the repository-pinned npm release

- **Decision**: Regenerate and verify the lockfile with npm 11.6.2.
- **Rationale**: `package.json` declares `packageManager: npm@11.6.2`; using the same resolver locally and in production minimizes optional/transitive dependency drift.
- **Alternatives considered**:
  - Use the workstation's arbitrary global npm version: rejected because results would not be deterministic.
  - Downgrade npm on the server: rejected because the repository already declares a supported current version.

## Decision 2: Regenerate metadata without changing dependency intent

- **Decision**: Run `npm install --package-lock-only`, then review the diff and require `package.json` to remain byte-for-byte unchanged.
- **Rationale**: The server failure identifies lockfile/manifest synchronization, not a need to upgrade application dependencies.
- **Alternatives considered**:
  - Manually insert the two missing transitive records: rejected because npm owns lockfile integrity and may require related integrity/dependency metadata.
  - Run `npm update`: rejected because it expands scope into dependency upgrades.
  - Run `npm install` directly on production and leave the result uncommitted: rejected because future deployments would remain nondeterministic.

## Decision 3: Prove from a clean install

- **Decision**: Use `npm ci` as the acceptance gate and confirm it does not rewrite `package-lock.json`.
- **Rationale**: Existing `node_modules` can hide incomplete lock metadata; the production update script uses `npm ci`.
- **Alternatives considered**:
  - `npm install` success alone: rejected because it repairs instead of enforcing the lock.
  - Application unit tests alone: rejected because the failure occurs before application tests or build.

## Decision 4: Build before production handoff

- **Decision**: Run typecheck and a production build with `ALLOW_BUILD_WITHOUT_DATABASE_URL=true`.
- **Rationale**: The repair must show that the resolved tree still compiles and builds, while the documented flag avoids requiring a local PostgreSQL instance for static build verification.
- **Alternatives considered**:
  - Deploy immediately after `npm ci`: rejected because it moves build risk to production.
  - Require local database-backed release QA: rejected as disproportionate for a lockfile-only repair with no schema/runtime change.

## Decision 5: Keep domain cutover rollback available

- **Decision**: Do not stop the former domain until the new release has ready health and correct sitemap evidence.
- **Rationale**: The current site is healthy but built from an older release. Keeping the former entry point preserves recovery while the rebuilt release is validated.
- **Alternatives considered**:
  - Disable the former domain now: rejected because it removes a recovery path before the new build is accepted.
