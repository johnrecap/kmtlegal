function contentSecurityPolicy() {
  const isProduction = process.env.NODE_ENV === "production";
  const sentryOrigin = getSentryOrigin();
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isProduction ? " https://static.cloudflareinsights.com" : " 'unsafe-eval'"}`,
    "script-src-attr 'none'",
    `connect-src 'self'${isProduction ? " https://cloudflareinsights.com" : " ws: wss:"}${sentryOrigin ? ` ${sentryOrigin}` : ""}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "manifest-src 'self'"
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function getSentryOrigin() {
  if (process.env.NEXT_PUBLIC_SENTRY_ENABLED !== "true" || !process.env.NEXT_PUBLIC_SENTRY_DSN) return "";
  try {
    return new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin;
  } catch {
    return "";
  }
}

function securityHeaders() {
  return [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy()
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff"
    },
    {
      key: "X-Frame-Options",
      value: "DENY"
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin"
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    },
    {
      key: "Cross-Origin-Opener-Policy",
      value: "same-origin"
    },
    {
      key: "Cross-Origin-Resource-Policy",
      value: "same-origin"
    },
    {
      key: "X-DNS-Prefetch-Control",
      value: "off"
    }
  ];
}

module.exports = {
  contentSecurityPolicy,
  securityHeaders
};
