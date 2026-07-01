import { rootMetadata } from "../root-metadata";
import "../globals.css";

export const metadata = rootMetadata;

export default function PublicEnglishRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
