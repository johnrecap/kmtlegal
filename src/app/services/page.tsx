import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { legalServices, navForPath, serviceCategories } from "@/content/public-content";
import { DirectoryFilter } from "@/features/public-site/directory-filter";
import { PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "الخدمات القانونية | KMT Legal",
  description: "خدمات قانونية في العقود والشركات والعقارات والعمل والمنازعات التجارية.",
  alternates: { canonical: "/services" }
};

export default function ServicesPage() {
  return (
    <PublicShell navItems={navForPath("/services")}>
      <PublicSection eyebrow="الخدمات" title="اختر المسار الأقرب لطلبك" description="استخدم البحث أو التصنيف للوصول للخدمة المناسبة، ثم ابدأ طلب استشارة منظم.">
        <DirectoryFilter
          emptyTitle="لا توجد خدمات مطابقة"
          items={legalServices.map((service) => ({
            title: service.title,
            description: service.description,
            href: `/services/${service.slug}`,
            category: service.category,
            categoryLabel: serviceCategories[service.category] ?? service.category
          }))}
          searchLabel="ابحث في الخدمات"
        />
      </PublicSection>
    </PublicShell>
  );
}
