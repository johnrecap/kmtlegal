import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { lawyers, navForPath } from "@/content/public-content";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "فريق KMT Legal",
  description: "تعرف على فريق KMT Legal وتخصصات المحامين المتاحة للمراجعة والحجز.",
  alternates: { canonical: "/team" }
};

export default function TeamPage() {
  return (
    <PublicShell navItems={navForPath("/team")}>
      <PublicSection eyebrow="الفريق" title="اختصاصات واضحة قبل الحجز" description="اختر محاميًا بحسب مجال الطلب أو راجع كل التخصصات المتاحة.">
        <DirectoryFilter
          emptyTitle="لا توجد ملفات مطابقة"
          items={lawyers.map((lawyer) => ({
            title: lawyer.name,
            description: `${lawyer.title}. ${lawyer.bio}`,
            href: `/team/${lawyer.slug}`,
            category: lawyer.specialties[0] ?? "team",
            categoryLabel: lawyer.specialties[0] ?? "الفريق",
            meta: lawyer.bookingEnabled ? "متاح للحجز" : "مراجعة مكتبية"
          }))}
          searchLabel="ابحث في الفريق"
        />
      </PublicSection>
    </PublicShell>
  );
}
