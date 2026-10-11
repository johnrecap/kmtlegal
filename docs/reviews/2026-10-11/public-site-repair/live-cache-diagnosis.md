# Live HTML cache diagnosis — 2026-10-11

Scope: read-only checks of `https://kmtlegal.org` after the owner ran the aaPanel update, compared with the repository at `9361a3914dcb859edfa5b408c367fe07771f456e`. The owner supplied the redacted deployment and Nginx command output. No server configuration was changed from this local workspace.

## What was observed

- Public `/api/health` and `/` report release `9361a3914dcb859edfa5b408c367fe07771f456e`. The application process therefore serves the new release on at least those routes.
- Ordinary GET requests covered all 82 HTML paths from the public sitemap plus the public account/payment entry paths. All returned HTTP 200; 26 lacked the release meta. These were `/services`, all 21 English `/services/{slug}` pages, `/team`, `/contact`, `/privacy`, and `/terms`. All Arabic sitemap paths carried the current release.
- Four stale pages (`/services`, `/team`, `/contact`, `/services/claims-collections`) still had the former logo/header. The other 22 had the official logo but older HTML. A fresh query parameter on representatives from both groups returned the current release; `Cache-Control: no-cache` on the canonical path still returned the old HTML.
- The stale and fresh `/services` HTML referred to different JS/CSS asset sets: 16 paths appeared only in the stale response and 18 only in the fresh response. The old assets remain reachable. This is a page/build mismatch, not just a browser image or stylesheet issue.
- 81 of the 82 inspected HTML entry paths returned `Cache-Control: public, max-age=60, s-maxage=900, stale-while-revalidate=86400` and `X-Kmt-Proxy: kmt-public-cache-policy`. `/login` returned `no-store`; public account verification/setup and payment-return entry pages still returned the public cache header. No private-data leak was established; these cache headers nevertheless violate the intended policy.
- The sampled HTML returned `CF-Cache-Status: DYNAMIC`. [Cloudflare documents](https://developers.cloudflare.com/cache/concepts/cache-responses/#dynamic) that value as a request not eligible for its cache, so it does not explain a Cloudflare edge hit for these samples. The active Nginx/proxy and Next cache layers still require direct-origin comparison to assign the stale object to an exact cache zone.

## Deployment evidence and cause

The owner's first deploy log matches the prior version of `deploy/install/aapanel-pm2-update.sh`: it printed `Installing public cache policy include` and `public origin matches local build`. That process pulled the new application release after loading its older script functions. The older reload function selected `nginx` from `PATH` and ignored failure. The system binary tested `/etc/nginx/nginx.conf` and failed because its interpretation of the aaPanel vhost sought `/etc/nginx/enable-php-00.conf`. The subsequent public/local comparison failed on `/services`, and the attempted purge of `/www/wwwroot/kmtlegal.org/proxy_cache_dir` did not fix it.

The owner's process list identifies the website's Nginx master as `/www/server/nginx/sbin/nginx -c /www/server/nginx/conf/nginx.conf`; that binary's `-t` passed. The local deploy-script correction now selects that executable first and fails closed if its validation or reload fails. This fixes the proven wrong-binary selection, but the corrected script has not yet run on the server; active no-store headers and fresh canonical HTML remain **NOT_VERIFIED**.

## Next operational check

Pull `origin/main` before launching the script so the newly edited script is loaded, then run `bash deploy/install/aapanel-pm2-update.sh` from `/www/wwwroot/kmtlegal`. The script must activate the aaPanel Nginx include and pass its ordinary-request release/asset/header checks for every sitemap path. A current health endpoint alone is insufficient. If it still fails, inspect the loaded aaPanel configuration with `/www/server/nginx/sbin/nginx -T` for the actual matching vhost, `location`, `proxy_cache_path`, `proxy_cache_bypass`, `proxy_no_cache`, and inherited/overriding `add_header` directives. Do not infer a cache directory from the hostname or purge a shared zone.
