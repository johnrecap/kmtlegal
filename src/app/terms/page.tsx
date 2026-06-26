import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "الشروط والتنبيهات | KMT Legal",
  description: "شروط استخدام موقع KMT Legal والتنبيهات الخاصة بالمحتوى والاستشارات.",
  alternates: { canonical: "/terms" }
};

export default function TermsPage() {
  return (
    <PublicShell navItems={navForPath("/terms")}>
      <PublicSection eyebrow="الشروط" title="تنبيهات استخدام الموقع" description="هذه الصفحة توضح حدود المحتوى العام ونماذج التواصل، وما يمكن الاعتماد عليه قبل مراجعة فريق المكتب.">
        <div className="rounded-lg border border-kmt-border bg-white p-6 text-sm leading-8 text-kmt-muted">
          <h2 className="text-xl font-semibold text-kmt-ink">لا توجد استشارة نهائية عبر الموقع</h2>
          <p className="mt-3">المحتوى العام ونماذج الطلب لا تمثل استشارة قانونية نهائية ولا تنشئ علاقة محاماة قبل قبول المكتب للملف.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">لا وعود بنتائج</h2>
          <p className="mt-3">أي أمثلة أو دراسات حالة منشورة هي لأغراض توعوية ومجهولة، ولا تعني ضمان نتيجة مماثلة.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">دقة البيانات</h2>
          <p className="mt-3">يتحمل مرسل الطلب مسؤولية تقديم بيانات صحيحة ومحدثة تساعد على المراجعة الأولية.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">المراجعة البشرية</h2>
          <p className="mt-3">أي تنظيم آلي للطلب أو ملخص مساعد يحتاج مراجعة بشرية قبل استخدامه في قرار قانوني.</p>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
