#!/usr/bin/env node

const DEFAULT_ZONE_NAME = "saeeddev.com";
const DEFAULT_HOST = "kmtlegal.saeeddev.com";
const DEFAULT_EDGE_TTL_SECONDS = 900;
const PHASE = "http_request_cache_settings";

const MANAGED_REFS = new Set([
  "kmt_sensitive_bypass_v1",
  "kmt_public_html_cache_v1",
]);

function parseArgs(argv) {
  const args = {
    apply: false,
    dryRun: false,
    print: false,
    host: process.env.CLOUDFLARE_PUBLIC_HOST || DEFAULT_HOST,
    zoneName: process.env.CLOUDFLARE_ZONE_NAME || DEFAULT_ZONE_NAME,
    zoneId: process.env.CLOUDFLARE_ZONE_ID || "",
    edgeTtl: Number(process.env.CLOUDFLARE_PUBLIC_EDGE_TTL_SECONDS || DEFAULT_EDGE_TTL_SECONDS),
  };

  for (const arg of argv) {
    if (arg === "--apply") args.apply = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--print") args.print = true;
    else if (arg.startsWith("--host=")) args.host = arg.slice("--host=".length);
    else if (arg.startsWith("--zone=")) args.zoneName = arg.slice("--zone=".length);
    else if (arg.startsWith("--zone-id=")) args.zoneId = arg.slice("--zone-id=".length);
    else if (arg.startsWith("--edge-ttl=")) args.edgeTtl = Number(arg.slice("--edge-ttl=".length));
    else if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!Number.isInteger(args.edgeTtl) || args.edgeTtl < 60) {
    throw new Error("edge TTL must be an integer of at least 60 seconds.");
  }

  if (!args.apply && !args.dryRun) args.print = true;
  return args;
}

function printUsage() {
  console.log(`Usage:
  node scripts/cloudflare-public-cache-rule.mjs --print
  CLOUDFLARE_API_TOKEN=... node scripts/cloudflare-public-cache-rule.mjs --dry-run
  CLOUDFLARE_API_TOKEN=... node scripts/cloudflare-public-cache-rule.mjs --apply

Options:
  --host=kmtlegal.saeeddev.com
  --zone=saeeddev.com
  --zone-id=<zone id>
  --edge-ttl=900

Required Cloudflare token permissions for --dry-run/--apply:
  Zone: Read
  Cache Rules or Zone Rulesets: Edit
`);
}

function pathExact(path) {
  return `http.request.uri.path eq "${path}"`;
}

function pathPrefix(path) {
  return `(${pathExact(path)} or starts_with(http.request.uri.path, "${path}/"))`;
}

function buildRules({ host, edgeTtl }) {
  const hostAndMethod = `(http.host eq "${host}" and http.request.method in {"GET" "HEAD"})`;

  const sensitivePaths = [
    "/api",
    "/admin",
    "/client",
    "/portal",
    "/login",
    "/install",
    "/product-system",
    "/stitch-clone",
  ];

  const publicPaths = [
    "/",
    "/ar",
    "/services",
    "/practice-areas",
    "/team",
    "/articles",
    "/case-studies",
    "/media",
    "/contact",
    "/book-consultation",
    "/privacy",
    "/terms",
  ];

  const sensitiveExpression = sensitivePaths.map(pathPrefix).join(" or ");
  const publicExpression = publicPaths
    .map((path) => (path === "/" ? pathExact("/") : pathPrefix(path)))
    .join(" or ");

  return [
    {
      ref: "kmt_sensitive_bypass_v1",
      description: `KMT Legal: bypass cache for private/API paths on ${host}`,
      expression: `${hostAndMethod} and (${sensitiveExpression})`,
      action: "set_cache_settings",
      action_parameters: {
        cache: false,
      },
      enabled: true,
    },
    {
      ref: "kmt_public_html_cache_v1",
      description: `KMT Legal: cache public HTML paths on ${host}`,
      expression: `${hostAndMethod} and not (${sensitiveExpression}) and (${publicExpression})`,
      action: "set_cache_settings",
      action_parameters: {
        cache: true,
        edge_ttl: {
          mode: "override_origin",
          default: edgeTtl,
        },
        browser_ttl: {
          mode: "respect_origin",
        },
      },
      enabled: true,
    },
  ];
}

async function cloudflareRequest(path, { method = "GET", body } = {}) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error("CLOUDFLARE_API_TOKEN is required for Cloudflare API calls.");
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok || json.success === false) {
    const errors = Array.isArray(json.errors) ? json.errors : [];
    const message = errors.map((error) => `${error.code || "ERR"}: ${error.message}`).join("; ");
    throw new Error(`Cloudflare API ${method} ${path} failed: ${message || response.status}`);
  }

  return json;
}

async function resolveZoneId({ zoneId, zoneName }) {
  if (zoneId) return zoneId;

  const result = await cloudflareRequest(`/zones?name=${encodeURIComponent(zoneName)}&per_page=1`);
  const zone = result.result?.[0];
  if (!zone?.id) {
    throw new Error(`Cloudflare zone not found: ${zoneName}`);
  }
  return zone.id;
}

async function getEntrypoint(zoneId) {
  try {
    return await cloudflareRequest(`/zones/${zoneId}/rulesets/phases/${PHASE}/entrypoint`);
  } catch (error) {
    if (String(error.message).includes("404")) return null;
    throw error;
  }
}

function buildRulesetPayload(existingRuleset, newRules) {
  const preservedRules = (existingRuleset?.result?.rules || []).filter((rule) => {
    return !MANAGED_REFS.has(rule.ref);
  });

  return {
    name: existingRuleset?.result?.name || "KMT Legal cache settings",
    description: "Public HTML cache and private path bypass rules for KMT Legal.",
    kind: "zone",
    phase: PHASE,
    rules: [...preservedRules, ...newRules],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const newRules = buildRules(args);

  if (args.print) {
    console.log(JSON.stringify({ mode: "print", host: args.host, zone: args.zoneName, edgeTtl: args.edgeTtl, rules: newRules }, null, 2));
    return;
  }

  const zoneId = await resolveZoneId(args);
  const existing = await getEntrypoint(zoneId);
  const payload = buildRulesetPayload(existing, newRules);

  if (args.dryRun && !args.apply) {
    console.log(JSON.stringify({
      mode: "dry-run",
      zoneId,
      existingRules: existing?.result?.rules?.length || 0,
      managedRulesToApply: newRules.map((rule) => ({ ref: rule.ref, expression: rule.expression })),
      resultingRules: payload.rules.length,
    }, null, 2));
    return;
  }

  if (!args.apply) {
    throw new Error("Refusing to mutate Cloudflare without --apply.");
  }

  const result = await cloudflareRequest(`/zones/${zoneId}/rulesets/phases/${PHASE}/entrypoint`, {
    method: "PUT",
    body: payload,
  });

  console.log(JSON.stringify({
    mode: "applied",
    zoneId,
    rulesetId: result.result?.id,
    version: result.result?.version,
    managedRules: newRules.map((rule) => rule.ref),
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
