import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ComponentGallery } from "@/features/ui-preview/component-gallery";

export const metadata = {
  title: "KMT Legal · Component Gallery",
  description: "Living component gallery for the KMT Legal design system.",
  robots: { index: false, follow: false }
};

export default async function ComponentsPreviewPage() {
  await connection();
  if (process.env.NODE_ENV === "production" && process.env.KMT_ENABLE_UI_PREVIEW !== "true") notFound();
  return <ComponentGallery />;
}
