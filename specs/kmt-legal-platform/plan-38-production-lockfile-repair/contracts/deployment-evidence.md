# Deployment Evidence Contract

This repair changes no public API contract. The following operational evidence contract defines acceptance.

## Local gate

1. npm version is `11.6.2`.
2. `package.json` is unchanged.
3. `npm ci` exits 0.
4. `package-lock.json` remains unchanged after `npm ci`.
5. `npm run typecheck` exits 0.
6. `ALLOW_BUILD_WITHOUT_DATABASE_URL=true npm run build` exits 0.

## Production handoff

The only authorized update entry point is:

```bash
cd /www/wwwroot/kmtlegal
bash deploy/install/aapanel-pm2-update.sh
```

## Live acceptance

1. `https://kmtlegal.org/api/health` reports `data.status` as `ready`.
2. The reported deployment release matches the pushed revision.
3. `https://kmtlegal.org/sitemap.xml` contains `https://kmtlegal.org`.
4. The sitemap contains no `kmtlegal.saeeddev.com`.
5. The former domain is not removed or disabled until all four checks pass.
