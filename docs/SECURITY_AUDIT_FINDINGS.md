# Security Audit Findings

Date: 2026-06-24

Command run:

```bash
npm run security:audit
```

Result: failed release gate.

## Findings

| Package | Severity | Source | Release impact |
| --- | --- | --- | --- |
| `next` | High | npm audit advisories for DoS/cache poisoning/XSS/SSRF classes in the installed Next.js range | Blocks production release until upgraded and regression-tested. |
| `postcss` nested under `next` | Moderate | npm audit advisory for CSS stringify escaping | Tied to the Next.js upgrade path. |
| `@hono/node-server` through `@prisma/dev` / `prisma` | Moderate | npm audit advisory for repeated-slash static middleware bypass | Blocks release review for Prisma toolchain until a safe Prisma upgrade/downgrade path is selected. |

## Decision

Do not run `npm audit fix --force` blindly.

The audit output proposes breaking dependency changes:

- `next@16.2.9`
- `prisma@6.19.3`

Those changes need a dedicated dependency-upgrade branch with:

- Next.js upgrade notes reviewed.
- Prisma migration/generate behavior verified.
- Full `npm run qa:local`.
- `npm run test:e2e:smoke`.
- DB-backed migration/seed smoke.
- Manual browser smoke for public, login, portal, and admin routes.

## Current Status

The repository has PLAN-23 handoff artifacts and local quality gates, but it is not release-clear until this audit blocker is resolved.

PLAN-24 update:
- `npm run security:secrets` now exists and passed locally with no high-confidence secret patterns.
- `npm run qa:release` includes dependency audit and secret scan, but remains blocked until dependency upgrade work is completed and a real DB/VPS gate is available.
- The dependency audit result above still blocks production release; this file must be updated after the controlled Next/Prisma upgrade pass.
