import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { PublicSection, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | KMT Legal",
  description: "سياسة خصوصية KMT Legal للتعامل مع بيانات الاستشارات والتواصل والملفات.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <PublicShell navItems={navForPath("/privacy")}>
      <PublicSection eyebrow="الخصوصية" title="كيف نتعامل مع بياناتك" description="هذه الصفحة توضح حدود استخدام البيانات داخل خدمات التواصل والاستشارة، وتحتاج مراجعة قانونية دورية حسب سياسات المكتب.">
        <div className={cn(publicPanel, "space-y-8 p-6 text-sm leading-8")}>
          <PolicyBlock title="البيانات التي نستقبلها">
            قد نستقبل الاسم، رقم الهاتف، البريد الإلكتروني، المدينة، ملخص الطلب، وطريقة التواصل المفضلة عند إرسال نموذج استشارة أو تواصل.
          </PolicyBlock>
          <PolicyBlock title="الغرض من الاستخدام">
            نستخدم البيانات لمراجعة الطلب، التواصل معك، تنظيم الموعد، وتحسين سير العمل الداخلي. لا يتم نشر بيانات العملاء أو المستندات في الصفحات العامة.
          </PolicyBlock>
          <PolicyBlock title="الذكاء الاصطناعي">
            قد يستخدم النظام بوابة AI داخلية لتنظيم الطلب مبدئيا. المخرجات مساعدة فقط وتحتاج مراجعة محام، وليست استشارة قانونية نهائية.
          </PolicyBlock>
          <PolicyBlock title="الملفات القانونية">
            الملفات ترفع فقط عبر بوابة محمية لاحقا، وتخزن في مساحة خاصة على الخادم ولا تخدم مباشرة من Nginx أو مجلد public.
          </PolicyBlock>
        </div>
      </PublicSection>
    </PublicShell>
  );
}

function PolicyBlock({ title, children }: { title: string; children: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className={cn("mt-3", publicMutedText)}>{children}</p>
    </section>
  );
}
