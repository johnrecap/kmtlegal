import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "مدفوعاتي | KMT Legal"
};

export default function PortalPaymentsPage() {
  redirect("/client/payments");
}
