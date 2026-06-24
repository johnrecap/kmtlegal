import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import { articles, caseStudies, legalServices, lawyers, navForPath } from "@/content/public-content";
import { PageHero, PublicSection, TrustStrip } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "KMT Legal | مكتب محاماة عربي منظم",
  description: "موقع KMT Legal للاستشارات القانونية المنظمة، خدمات الشركات والعقود والعقارات، وطلب استشارة آمن.",
  alternates: { canonical: "/" }
};

export default function HomePage() {
  return (
    <PublicShell navItems={navForPath("/")}>
      <PageHero
        eyebrow="KMT Legal"
        image="/stitch-assets/bd64f8e89da8f4f6.png"
        title="استشارات قانونية منظمة من أول رسالة"
        description="نساعدك على تحويل الوقائع والمستندات إلى طلب واضح يمكن مراجعته من فريق قانوني، مع حماية البيانات وعدم تقديم وعود بنتائج."
        actions={
          <>
            <ButtonLink href="/book-consultation" size="lg" trailingIcon={<MaterialSymbol className="rtl:rotate-180" name="arrow_forward" />}>
              احجز استشارة
            </ButtonLink>
            <ButtonLink href="/services" size="lg" variant="secondary">
              تصفح الخدمات
            </ButtonLink>
          </>
        }
      />
      <TrustStrip />

      <PublicSection
        eyebrow="خدمات أساسية"
        title="مسارات قانونية واضحة قبل اتخاذ القرار"
        description="الخدمات العامة لا تعرض بيانات خاصة ولا تستبدل مراجعة المحامي. كل طلب يبدأ بتنظيم الوقائع والمستندات."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {legalServices.slice(0, 4).map((service) => (
            <Link key={service.slug} className="rounded-lg border border-kmt-border bg-white p-5 transition-colors hover:border-kmt-gold" href={`/services/${service.slug}`}>
              <MaterialSymbol className="text-3xl text-kmt-gold" name={service.icon} />
              <h3 className="mt-4 text-xl font-semibold text-kmt-ink">{service.title}</h3>
              <p className="mt-3 text-sm leading-7 text-kmt-muted">{service.description}</p>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection className="bg-white" eyebrow="الفريق" title="محامون بتخصصات عملية" description="تعرف على مسارات الخبرة المتاحة للحجز أو المراجعة الأولية.">
        <div className="grid gap-4 md:grid-cols-3">
          {lawyers.map((lawyer) => (
            <Link key={lawyer.slug} className="rounded-lg border border-kmt-border bg-kmt-canvas p-5 hover:border-kmt-gold" href={`/team/${lawyer.slug}`}>
              <img alt={lawyer.name} className="h-48 w-full rounded-lg object-cover" src={lawyer.image} />
              <h3 className="mt-4 text-xl font-semibold text-kmt-ink">{lawyer.name}</h3>
              <p className="mt-1 text-sm text-kmt-muted">{lawyer.title}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lawyer.specialties.slice(0, 2).map((specialty) => (
                  <Badge key={specialty}>{specialty}</Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow="محتوى قانوني" title="توعية بدون وعود قانونية" description="مقالات ودراسات حالة مجهولة تساعدك على تجهيز الأسئلة والمستندات قبل التواصل.">
        <div className="grid gap-4 lg:grid-cols-2">
          {articles.slice(0, 2).map((article) => (
            <Link key={article.slug} className="rounded-lg border border-kmt-border bg-white p-5 hover:border-kmt-gold" href={`/articles/${article.slug}`}>
              <p className="text-sm font-semibold text-kmt-gold">{article.readTime}</p>
              <h3 className="mt-2 text-xl font-semibold text-kmt-ink">{article.title}</h3>
              <p className="mt-3 text-sm leading-7 text-kmt-muted">{article.excerpt}</p>
            </Link>
          ))}
          {caseStudies.slice(0, 1).map((study) => (
            <Link key={study.slug} className="rounded-lg border border-amber-200 bg-amber-50 p-5 hover:border-kmt-gold" href={`/case-studies/${study.slug}`}>
              <p className="text-sm font-semibold text-amber-800">دراسة حالة مجهولة</p>
              <h3 className="mt-2 text-xl font-semibold text-kmt-ink">{study.title}</h3>
              <p className="mt-3 text-sm leading-7 text-kmt-muted">{study.summary}</p>
            </Link>
          ))}
        </div>
      </PublicSection>
    </PublicShell>
  );
}
