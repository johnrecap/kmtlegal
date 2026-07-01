import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الملف الشخصي | KMT Legal"
};

export default function PortalProfilePage() {
  redirect("/client/profile");
}
