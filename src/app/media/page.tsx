import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { Badge } from "@/components/ui";
import { mediaItems, navForPath } from "@/content/public-content";
import { PageHero, PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "الإعلام والمحتوى | KMT Legal",
  description: "حائط إعلامي للقراءة فقط للمحتوى التوعوي والندوات والمنشورات.",
  alternates: { canonical: "/media" }
};

export default function MediaPage() {
  return (
    <PublicShell navItems={navForPath("/media")}>
      <PageHero
        eyebrow="الإعلام"
        image="/stitch-assets/f9addb2d07ebf63d.png"
        size="compact"
        title="محتوى توعوي للقراءة فقط"
        description="متابعة منظمة للندوات والمنشورات العامة بدون تكامل نشر خارجي في هذه المرحلة."
      />
      <PublicSection eyebrow="الإعلام" title="محتوى توعوي منظم" description="صفحة قراءة فقط للمحتوى الإعلامي العام، بدون نشر خارجي أو تكامل اجتماعي في هذه المرحلة.">
        <div className="grid gap-4 md:grid-cols-3">
          {mediaItems.map((item) => (
            <article key={item.title} className="rounded-lg border border-kmt-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge>{item.type}</Badge>
                <span className="text-xs text-kmt-muted">{item.date}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-kmt-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-kmt-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </PublicSection>
    </PublicShell>
  );
}
