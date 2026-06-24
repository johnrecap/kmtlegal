import securityHeaderModule from "./security-headers.cjs";

const { securityHeaders } = securityHeaderModule;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders()
      }
    ];
  }
};

export default nextConfig;
