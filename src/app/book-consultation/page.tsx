import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { BookingStepper } from "@/features/public-site/booking-stepper";
import { PageHero, PublicSection, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "حجز استشارة | KMT Legal",
  description: "نموذج حجز استشارة قانونية منظم مع مراجعة بشرية ومساعد AI داخلي.",
  alternates: { canonical: "/book-consultation" }
};

export default function BookConsultationPage({ searchParams }: { searchParams: { service?: string; lawyer?: string } }) {
  return (
    <PublicShell navItems={navForPath("/book-consultation")}>
      <PageHero
        eyebrow="طلب استشارة"
        image="/stitch-assets/b8b47a1dd8d5ce08.png"
        size="compact"
        title="اكتب طلبك في خطوات قليلة"
        description="النموذج يرتب بياناتك للمراجعة البشرية، ولا يقدم استشارة قانونية نهائية قبل تواصل الفريق."
      />
      <PublicSection
        eyebrow="طلب استشارة"
        title="اكتب طلبك في خطوات قليلة"
        description="النموذج يحفظ البيانات بشكل منظم، ويستخدم مساعدا داخليا لترتيب الطلب للمراجعة البشرية. لا ترسل مستندات في هذه المرحلة."
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <BookingStepper initialService={searchParams.service} />
          <aside className={cn(publicPanel, "p-5")}>
            <h2 className="text-xl font-semibold text-white">ما الذي يحدث بعد الإرسال؟</h2>
            <ol className={cn("mt-4 space-y-4 text-sm leading-7", publicMutedText)}>
              <li>1. يتم حفظ الطلب كطلب جديد للمراجعة.</li>
              <li>2. يجهز المساعد ملخصا مبدئيا يحتاج مراجعة محام.</li>
              <li>3. يتواصل الفريق لتأكيد الملاءمة والموعد.</li>
              <li>4. عند قبول الملف، يتم تحويله لاحقا إلى عميل وقضية داخل لوحة الإدارة.</li>
            </ol>
            {searchParams.lawyer ? <p className="mt-5 rounded border border-kmt-gold/25 bg-kmt-gold/10 p-3 text-sm text-amber-100">المحامي المطلوب: {searchParams.lawyer}</p> : null}
          </aside>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
