import { rootMetadata } from "../root-metadata";
import "../globals.css";

export const metadata = rootMetadata;

export default function InstallArabicRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
