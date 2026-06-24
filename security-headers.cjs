const isProduction = process.env.NODE_ENV === "production";

function contentSecurityPolicy() {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
    `connect-src 'self'${isProduction ? "" : " ws: wss:"}`,
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'"
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
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
