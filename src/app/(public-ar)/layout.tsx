import { rootMetadata } from "../root-metadata";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { SmoothScrollProvider } from "@/components/motion-ui/smooth-scroll-provider";
import "../globals.css";

export const metadata = rootMetadata;

export default function PublicArabicRootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <ThemeProvider defaultTheme="dark">
          <SmoothScrollProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
