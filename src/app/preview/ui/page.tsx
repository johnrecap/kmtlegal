import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { UiPreview } from "@/features/ui-preview/ui-preview";

export default function UiPreviewPage() {
  noStore();
  if (process.env.NODE_ENV === "production" && process.env.KMT_ENABLE_UI_PREVIEW !== "true") notFound();
  return <UiPreview />;
}
