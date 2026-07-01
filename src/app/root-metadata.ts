import type { Metadata } from "next";

export const rootMetadata: Metadata = {
  title: "KMT Legal Platform",
  description: "KMT Legal planning and Stitch clone foundation",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/png" },
      { url: "/brand/kmt-logo-icon.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/brand/kmt-logo-icon.png", sizes: "512x512", type: "image/png" }]
  }
};
