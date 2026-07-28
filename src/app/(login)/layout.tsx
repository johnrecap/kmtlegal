import { headers } from "next/headers";
import { normalizeClientLocale } from "@/content/client-content";
import { rootMetadata } from "../root-metadata";
import "../globals.css";

export const metadata = rootMetadata;

export default async function LoginRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = normalizeClientLocale(requestHeaders.get("x-kmt-login-locale"));

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
