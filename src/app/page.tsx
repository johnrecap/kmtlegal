import type { Metadata } from "next";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { PublicShell } from "@/components/layout";
import { Badge, ButtonLink, MaterialSymbol } from "@/components/ui";
import {
  legalServices,
  lawyers,
  navForPath,
  practiceAreaMatrix,
  publicIndustries,
  representativeMatters
} from "@/content/public-content";
import {
  FinalCtaBand,
  IndustryGrid,
  LuxuryFeaturePanel,
  PageHero,
  PracticeAreaCard,
  ProcessSteps,
  PublicSection,
  RepresentativeMatterCard,
  TrustStrip,
  publicGoldText,
  publicMutedText,
  publicPanel,
  publicPanelHover
} from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";
import { listPublishedArticles, listPublishedCaseStudies } from "@/server/public/content-service";

export const metadata: Metadata = {
  title: "KMT Legal | خبرة قانونية شاملة للقطاعات الحرجة",
  description: "موقع KMT Legal للاستشارات القانونية المنظمة وخدمات الشركات والعقود والعقارات والمنازعات وحجز الاستشارات بأمان.",
  alternates: { canonical: "/" }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type FeaturedArticle = Awaited<ReturnType<typeof listPublishedArticles>>[number];
type FeaturedCaseStudy = Awaited<ReturnType<typeof listPublishedCaseStudies>>[number];

const approachSteps = [
  {
    number: "01",
    title: "استشارة",
    summary: "نستمع للوقائع ونحدد الهدف والبيانات المطلوبة قبل أي توصية.",
    icon: "groups"
  },
  {
    number: "02",
    title: "استراتيجية",
    summary: "نرتب الخيارات القانونية في مسار عملي يتناسب مع أهداف العمل.",
    icon: "strategy"
  },
  {
    number: "03",
    title: "تنفيذ",
    summary: "نراجع المستندات والخطوات مع تقليل المخاطر وسد النواقص.",
    icon: "contract_edit"
  },
  {
    number: "04",
    title: "حل",
    summary: "نقود الملف نحو نتيجة عملية مع متابعة واضحة للخطوات التالية.",
    icon: "target"
  }
];

async function loadFeaturedContent(): Promise<{
  articles: FeaturedArticle[];
  caseStudies: FeaturedCaseStudy[];
}> {
  noStore();

  if (!shouldLoadDatabaseContent()) {
    return { articles: [], caseStudies: [] };
  }

  try {
    const [articles, caseStudies] = await Promise.all([listPublishedArticles(), listPublishedCaseStudies()]);
    return {
      articles: articles.slice(0, 2),
      caseStudies: caseStudies.slice(0, 1)
    };
  } catch {
    return { articles: [], caseStudies: [] };
  }
}

function shouldLoadDatabaseContent() {
  return Boolean(process.env.DATABASE_URL) || process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
}

export default async function HomePage() {
  const featuredContent = await loadFeaturedContent();
  const hasFeaturedContent = featuredContent.articles.length > 0 || featuredContent.caseStudies.length > 0;
  const focusService = legalServices.find((service) => service.slug === "corporate-law") ?? legalServices[0];

  return (
    <PublicShell navItems={navForPath("/")}>
      <PageHero
        eyebrow="مجالات الخبرة"
        image="/stitch-assets/b8b47a1dd8d5ce08.png"
        title="خبرة قانونية شاملة للقطاعات الحرجة"
        description="نقدم دعما قانونيا استراتيجيا وعمليا للشركات والمستثمرين والأفراد، من تنظيم الوقائع والمستندات إلى وضع مسار واضح للمراجعة القانونية."
        actions={
          <>
            <ButtonLink href="/book-consultation" size="lg" trailingIcon={<MaterialSymbol className="rtl:rotate-180" name="arrow_forward" />}>
              احجز استشارة
            </ButtonLink>
            <ButtonLink className="!border-white/35 !text-white hover:!bg-white hover:!text-kmt-navy" href="/services" size="lg" variant="secondary">
              تصفح مجالات الخبرة
            </ButtonLink>
          </>
        }
      />
      <TrustStrip />

      <PublicSection align="center" eyebrow="Our Practice Areas" title="مجالات الخبرة القانونية" description="هيكل خدمات واضح يساعدك على اختيار المسار الأقرب لطلبك، مع الحفاظ على الخصوصية وعدم نشر بيانات العملاء.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {practiceAreaMatrix.map((area) => (
            <PracticeAreaCard key={area.key} href={area.href} icon={area.icon} summary={area.summary} title={area.title} />
          ))}
        </div>
      </PublicSection>

      <PublicSection surface="muted" eyebrow="Focus Area" title={focusService.title} description={focusService.description}>
        <LuxuryFeaturePanel
          image="/stitch-assets/2484f68d86633ca8.png"
          eyebrow={focusService.category}
          title={focusService.title}
          description={focusService.content}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {focusService.outcomes.concat(focusService.requiredDocuments).slice(0, 8).map((item) => (
              <div key={item} className="flex gap-2 text-sm leading-7 text-slate-300">
                <MaterialSymbol className={cn("mt-1 text-base", publicGoldText)} name="check_circle" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </LuxuryFeaturePanel>
      </PublicSection>

      <PublicSection align="center" eyebrow="Our Approach" title="منهج العمل من أول طلب حتى الحل" description="الموقع لا يقدم وعدا بنتيجة، لكنه ينظم البداية ويجعل التواصل مع الفريق أكثر وضوحا.">
        <ProcessSteps steps={approachSteps} />
      </PublicSection>

      <PublicSection surface="muted" align="center" eyebrow="Representative Matters" title="أمثلة تمثيلية حديثة" description="نماذج مجهولة ومبسطة توضح نوع الملفات التي يتعامل معها المكتب دون كشف بيانات عملاء أو نتائج مضمونة.">
        <div className="grid gap-4 md:grid-cols-3">
          {representativeMatters.map((matter) => (
            <RepresentativeMatterCard key={matter.title} {...matter} />
          ))}
        </div>
      </PublicSection>

      <PublicSection eyebrow="Industries" title="قطاعات نخدمها" description="لغة التصميم الداكنة هنا لا تغير طبيعة المنتج: المحتوى يظل قانونيا، واضحا، وموجها لقرارات عمل عملية.">
        <IndustryGrid industries={publicIndustries} />
      </PublicSection>

      <PublicSection surface="muted" eyebrow="Team" title="فريق قانوني بتخصصات عملية" description="تعرف على مسارات الخبرة المتاحة للحجز أو المراجعة الأولية.">
        <div className="grid gap-4 md:grid-cols-3">
          {lawyers.map((lawyer) => (
            <Link key={lawyer.slug} className={cn(publicPanel, publicPanelHover, "block overflow-hidden")} href={`/team/${lawyer.slug}`}>
              <img alt={lawyer.name} className="h-56 w-full object-cover opacity-90" src={lawyer.image} />
              <div className="p-5">
                <h3 className="text-xl font-semibold text-white">{lawyer.name}</h3>
                <p className={cn("mt-1 text-sm", publicMutedText)}>{lawyer.title}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {lawyer.specialties.slice(0, 2).map((specialty) => (
                    <Badge key={specialty} className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </PublicSection>

      {hasFeaturedContent ? (
        <PublicSection eyebrow="Insights" title="توعية قانونية بدون وعود" description="محتوى منشور من النظام الإداري فقط، ولا يظهر كرابط تفصيلي ثابت إذا لم يكن منشورا في قاعدة البيانات.">
          <div className="grid gap-4 lg:grid-cols-2">
            {featuredContent.articles.map((article) => (
              <Link key={article.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={`/articles/${article.slug}`}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>{article.readTime}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{article.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{article.excerpt}</p>
              </Link>
            ))}
            {featuredContent.caseStudies.map((study) => (
              <Link key={study.slug} className={cn(publicPanel, publicPanelHover, "block p-5")} href={`/case-studies/${study.slug}`}>
                <p className={cn("text-sm font-semibold", publicGoldText)}>دراسة حالة مجهولة</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{study.title}</h3>
                <p className={cn("mt-3 text-sm leading-7", publicMutedText)}>{study.summary}</p>
              </Link>
            ))}
          </div>
        </PublicSection>
      ) : null}

      <FinalCtaBand title="هل تحتاج إلى دعم قانوني لعملك؟" description="فريقنا جاهز لاستلام طلب منظم ومراجعة البيانات الأولية قبل تحديد الموعد أو الخطوة التالية." />
    </PublicShell>
  );
}
