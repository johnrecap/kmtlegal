import type { Metadata } from "next";
import { PublicShell } from "@/components/layout";
import { MaterialSymbol } from "@/components/ui";
import { branches, navForPath } from "@/content/public-content";
import { ContactForm } from "@/features/public-site/contact-form";
import { PublicSection } from "@/features/public-site/public-components";

export const metadata: Metadata = {
  title: "تواصل مع KMT Legal",
  description: "بيانات التواصل وفروع KMT Legal ونموذج تواصل عام.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <PublicShell navItems={navForPath("/contact")}>
      <PublicSection eyebrow="تواصل" title="ابدأ برسالة واضحة" description="استخدم نموذج التواصل للأسئلة العامة. للاستشارات القانونية، استخدم نموذج الحجز المنظم.">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <ContactForm />
          <aside className="grid gap-4">
            {branches.map((branch) => (
              <section key={branch.name} className="rounded-lg border border-kmt-border bg-white p-5">
                <h2 className="text-xl font-semibold text-kmt-ink">{branch.name}</h2>
                <p className="mt-3 flex gap-2 text-sm leading-7 text-kmt-muted">
                  <MaterialSymbol className="mt-1 text-base text-kmt-gold" name="location_on" />
                  {branch.address}
                </p>
                <p className="mt-2 text-sm text-kmt-muted">{branch.phone}</p>
                <p className="mt-1 text-sm text-kmt-muted">{branch.email}</p>
              </section>
            ))}
          </aside>
        </div>
      </PublicSection>
    </PublicShell>
  );
}
