import type { ReactNode } from "react";
import { ButtonLink, MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export function PublicSection({
  eyebrow,
  title,
  description,
  children,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-sm font-semibold text-kmt-gold">{eyebrow}</p> : null}
          <h2 className="mt-2 text-3xl font-semibold leading-tight text-kmt-ink md:text-4xl">{title}</h2>
          {description ? <p className="mt-4 text-base leading-8 text-kmt-muted">{description}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  image,
  actions,
  size = "full"
}: {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  actions?: ReactNode;
  size?: "full" | "compact";
}) {
  const isCompact = size === "compact";
  const imageOpacity = isCompact ? "opacity-60" : "opacity-50";
  const overlay = isCompact ? "from-kmt-navy/75 via-kmt-navy/40 to-kmt-navy/5" : "from-kmt-navy/80 via-kmt-navy/60 to-kmt-navy/10";

  return (
    <section className={cn("relative isolate overflow-hidden bg-kmt-navy text-white", isCompact ? "min-h-[340px]" : "min-h-[520px]")}>
      <img alt="" aria-hidden="true" className={cn("absolute inset-0 h-full w-full object-cover", imageOpacity)} src={image} />
      <div className={cn("absolute inset-0 bg-gradient-to-l", overlay)} />
      <div className={cn("relative mx-auto flex max-w-[1200px] items-center px-4 sm:px-6 lg:px-10", isCompact ? "min-h-[340px] py-12" : "min-h-[520px] py-16")}>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-amber-100">{eyebrow}</p>
          <h1 className={cn("mt-4 font-semibold leading-tight", isCompact ? "text-3xl md:text-5xl" : "text-4xl md:text-6xl")}>{title}</h1>
          <p className={cn("mt-5 max-w-2xl leading-9 text-slate-100", isCompact ? "text-base md:text-lg" : "text-lg")}>{description}</p>
          {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function TrustStrip() {
  return (
    <div className="border-y border-kmt-border bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-4 px-4 py-5 text-sm text-kmt-muted sm:px-6 md:grid-cols-3 lg:px-10">
        <div className="flex items-center gap-2">
          <MaterialSymbol className="text-kmt-gold" name="verified_user" />
          مراجعة بشرية قبل أي قرار قانوني
        </div>
        <div className="flex items-center gap-2">
          <MaterialSymbol className="text-kmt-gold" name="lock" />
          لا ننشر بيانات العملاء أو المستندات
        </div>
        <div className="flex items-center gap-2">
          <MaterialSymbol className="text-kmt-gold" name="schedule" />
          متابعة منظمة من الطلب حتى الموعد
        </div>
      </div>
    </div>
  );
}

export function DetailCta({ serviceTitle }: { serviceTitle?: string }) {
  const href = serviceTitle ? `/book-consultation?service=${encodeURIComponent(serviceTitle)}` : "/book-consultation";

  return (
    <div className="rounded-lg border border-kmt-border bg-white p-6">
      <h2 className="text-2xl font-semibold text-kmt-ink">ابدأ بطلب استشارة منظم</h2>
      <p className="mt-3 leading-7 text-kmt-muted">
        اكتب ملخصًا واضحًا، وسنرتب البيانات مبدئيًا للمراجعة البشرية. لا يتم تقديم استشارة قانونية نهائية عبر النموذج.
      </p>
      <ButtonLink className="mt-5" href={href} trailingIcon={<MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />}>
        احجز استشارة
      </ButtonLink>
    </div>
  );
}
