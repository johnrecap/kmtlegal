const READINESS_BYPASS_PREFIXES = [
  "/api/health",
  "/api/install",
  "/install",
  "/_next",
  "/stitch-assets",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml"
];

export function shouldBypassReadinessGate(pathname: string) {
  if (!pathname || pathname === "/api/health") {
    return true;
  }

  if (pathname.includes(".")) {
    return true;
  }

  return READINESS_BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
