import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { MaterialSymbol } from "@/components/ui";
import { branches, navForPath } from "@/content/public-content";
import { ContactForm } from "@/features/public-site/contact-form";
import { PageHero, PublicSection, publicGoldText, publicMutedText, publicPanel } from "@/features/public-site/public-components";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "تواصل مع KMT Legal",
  description: "بيانات التواصل وفروع KMT Legal ونموذج تواصل عام.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <PublicShell navItems={navForPath("/contact")}>
      <PageHero
        eyebrow="تواصل"
        image="/stitch-assets/11c3bae2e63b7192.png"
        size="compact"
        title="تواصل واضح من أول رسالة"
        description="أرسل سؤالا عاما أو اختر حجز استشارة إذا كان الطلب يحتاج مراجعة قانونية منظمة."
      />
      <PublicSection eyebrow="تواصل" title="ابدأ برسالة واضحة" description="استخدم نموذج التواصل للأسئلة العامة. للاستشارات القانونية، استخدم نموذج الحجز المنظم.">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <ContactForm />
          <aside className="grid gap-4">
            {branches.map((branch) => (
              <section key={branch.name} className={cn(publicPanel, "p-5")}>
                <h2 className="text-xl font-semibold text-white">{branch.name}</h2>
                <p className={cn("mt-3 flex gap-2 text-sm leading-7", publicMutedText)}>
                  <MaterialSymbol className={cn("mt-1 text-base", publicGoldText)} name="location_on" />
                  {branch.address}
                </p>
                <p className={cn("mt-2 text-sm", publicMutedText)}>{branch.phone}</p>
                <p className={cn("mt-1 text-sm", publicMutedText)}>{branch.email}</p>
              </section>
            ))}
          </aside>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
