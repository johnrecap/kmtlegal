import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "KMT Legal · UI preview",
  description: "Local, simulated UI preview for KMT Legal.",
  robots: { index: false, follow: false }
};

export default function PreviewLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" dir="ltr"><body>{children}</body></html>;
}
