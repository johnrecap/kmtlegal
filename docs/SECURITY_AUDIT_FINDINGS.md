# Security Audit Findings

Date: 2026-07-10

Command run:

```bash
npm run security:audit
```

Result: passed release gate after controlled dependency remediation.

## Remediated Findings

| Package | Severity | Source | Release impact |
| --- | --- | --- | --- |
| `next` | High | npm audit advisories in the previously installed Next.js range | Remediated by upgrading to `next@15.5.20` and `eslint-config-next@15.5.20`. |
| `postcss` nested under `next` | Moderate | npm audit advisory for CSS stringify escaping | Remediated by pinning `postcss@8.5.10` and applying a matching npm override. |
| `@hono/node-server` through `@prisma/dev` / `prisma` | Moderate | npm audit advisory for repeated-slash static middleware bypass | Remediated with npm override `@hono/node-server@1.19.13`. |
| `vitest` / `vite` / `esbuild` | Moderate to critical in dev tooling | npm audit advisories affecting the development server toolchain | Remediated by upgrading `vitest` to `^4.1.9`. |
| `@opentelemetry/core` through `@sentry/nextjs` | Moderate | W3C Baggage propagation could allocate unbounded memory in the previously installed Sentry dependency tree. | Remediated by the controlled upgrade from `@sentry/nextjs@10.42.0` to `10.64.0`; no forced audit rewrite was used. |

## Decision

Do not run `npm audit fix --force` blindly.

This pass intentionally stayed on the Next.js 15 line instead of jumping to Next.js 16. The compatibility updates required by Next 15 were applied to async `cookies()`, App Router `params`, page `searchParams`, and Vitest 4 JSX transform configuration.

## Current Status

The dependency audit blocker is resolved in this workspace:

- `npm run security:audit` passes with `found 0 vulnerabilities`.
- `npm run security:audit:all` passes with `found 0 vulnerabilities`.
- `npm run security:secrets` passes with no high-confidence secret patterns.

Production release is still not fully clear until `qa:db`, `qa:release`, and live VPS smoke run against a real PostgreSQL/VPS target.
