import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/lib/public-site-origin";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/client", "/login", "/install", "/payment/", "/ar/payment/", "/ar/client-account/"] },
    sitemap: `${publicSiteOrigin()}/sitemap.xml`
  };
}
