import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { PublicSection, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "الشروط والتنبيهات | KMT Legal",
  description: "شروط استخدام موقع KMT Legal والتنبيهات الخاصة بالمحتوى والاستشارات.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <PublicShell navItems={navForPath("/terms")}>
      <PublicSection eyebrow="الشروط" title="تنبيهات استخدام الموقع" description="هذه الصفحة توضح حدود المحتوى العام ونماذج التواصل، وما يمكن الاعتماد عليه قبل مراجعة فريق المكتب.">
        <div className={cn(publicPanel, "space-y-8 p-6 text-sm leading-8")}>
          <TermsBlock title="لا توجد استشارة نهائية عبر الموقع">
            المحتوى العام ونماذج الطلب لا تمثل استشارة قانونية نهائية ولا تنشئ علاقة محاماة قبل قبول المكتب للملف.
          </TermsBlock>
          <TermsBlock title="لا وعود بنتائج">
            أي أمثلة أو دراسات حالة منشورة هي لأغراض توعوية ومجهولة، ولا تعني ضمان نتيجة مماثلة.
          </TermsBlock>
          <TermsBlock title="دقة البيانات">
            يتحمل مرسل الطلب مسؤولية تقديم بيانات صحيحة ومحدثة تساعد على المراجعة الأولية.
          </TermsBlock>
          <TermsBlock title="المراجعة البشرية">
            أي تنظيم آلي للطلب أو ملخص مساعد يحتاج مراجعة بشرية قبل استخدامه في قرار قانوني.
          </TermsBlock>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

function TermsBlock({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className={cn("mt-3", publicMutedText)}>{children}</p>
    </section>
  );
}
