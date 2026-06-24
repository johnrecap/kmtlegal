import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "2FA Disabled | KMT Legal",
  description: "Staff 2FA is deferred and disabled in this release."
};

export default function DisabledTwoFactorPage() {
  notFound();
}
