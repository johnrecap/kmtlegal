import { rootMetadata } from "../root-metadata";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "../globals.css";

export const metadata = rootMetadata;

export default function InstallArabicRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
      </body>
    </html>
  );
}
