import securityHeaderModule from "./security-headers.cjs";
import { withSentryConfig } from "@sentry/nextjs";

const { securityHeaders } = securityHeaderModule;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    sri: { algorithm: "sha256" }
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/site-assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/stitch-assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/client/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/portal/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/login/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/install/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }]
      },
      {
        source: "/:path*",
        headers: securityHeaders()
      }
    ];
  }
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  sourcemaps: {
    disable: process.env.SENTRY_ENABLED !== "true" || !process.env.SENTRY_AUTH_TOKEN
  }
});
