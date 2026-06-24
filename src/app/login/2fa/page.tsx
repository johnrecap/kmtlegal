import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "التحقق الثنائي غير مفعل | KMT Legal",
  description: "التحقق الثنائي للموظفين مؤجل ومعطل في هذا الإصدار."
};

export default function DisabledTwoFactorPage() {
  notFound();
}
