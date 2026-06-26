import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { navForPath } from "@/content/public-content";
import { PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | KMT Legal",
  description: "سياسة خصوصية KMT Legal للتعامل مع بيانات الاستشارات والتواصل والملفات.",
  alternates: { canonical: "/privacy" }
};

export default function PrivacyPage() {
  return (
    <PublicShell navItems={navForPath("/privacy")}>
      <PublicSection eyebrow="الخصوصية" title="كيف نتعامل مع بياناتك" description="هذه الصفحة توضح حدود استخدام البيانات داخل خدمات التواصل والاستشارة، وتحتاج مراجعة قانونية دورية حسب سياسات المكتب.">
        <div className="rounded-lg border border-kmt-border bg-white p-6 text-sm leading-8 text-kmt-muted">
          <h2 className="text-xl font-semibold text-kmt-ink">البيانات التي نستقبلها</h2>
          <p className="mt-3">قد نستقبل الاسم، رقم الهاتف، البريد الإلكتروني، المدينة، ملخص الطلب، وطريقة التواصل المفضلة عند إرسال نموذج استشارة أو تواصل.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">الغرض من الاستخدام</h2>
          <p className="mt-3">نستخدم البيانات لمراجعة الطلب، التواصل معك، تنظيم الموعد، وتحسين سير العمل الداخلي. لا يتم نشر بيانات العملاء أو المستندات في الصفحات العامة.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">الذكاء الاصطناعي</h2>
          <p className="mt-3">قد يستخدم النظام بوابة AI داخلية لتنظيم الطلب مبدئيًا. المخرجات مساعدة فقط وتحتاج مراجعة محام، وليست استشارة قانونية نهائية.</p>
          <h2 className="mt-8 text-xl font-semibold text-kmt-ink">الملفات القانونية</h2>
          <p className="mt-3">الملفات ترفع فقط عبر بوابة محمية لاحقًا، وتخزن في مساحة خاصة على الخادم ولا تخدم مباشرة من Nginx أو مجلد public.</p>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
