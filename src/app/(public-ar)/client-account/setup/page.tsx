import Link from "next/link";
import { PublicShell } from "@/components/layout/public-shell";
import { MaterialSymbol } from "@/components/ui";
import { getPublicContent, navForPath } from "@/content/public-content";
import { ClientAccountSetupForm } from "@/features/public-site/client-account-setup-form";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/legal-format";
import { getClientAccountSetupContext } from "@/server/portal/client-account-setup-service";

export const dynamic = "force-dynamic";

const content = getPublicContent("ar");
const copy = content.clientAccountSetup;

export const metadata = {
  title: copy.metadataTitle
};

type ClientAccountSetupPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function ClientAccountSetupPage({ searchParams }: ClientAccountSetupPageProps) {
  const params = await searchParams;
  const token = params?.token ?? "";
  const context = token ? await getSetupContext(token) : null;

  return (
    <PublicShell currentPath="/client-account/setup" locale="ar" navItems={navForPath("/", "ar")}>
      <main className="mx-auto min-h-[68vh] max-w-[1060px] px-4 py-14 sm:px-6 lg:px-10" dir="rtl">
        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-start">
          <div className="rounded-[1.75rem] border border-kmt-gold/35 bg-[linear-gradient(145deg,#17110a_0%,#090b0d_54%,#020202_100%)] p-6 shadow-[0_34px_120px_-68px_rgba(183,134,64,0.58)] sm:p-8">
            <p className="text-sm font-semibold text-kmt-gold">{copy.eyebrow}</p>
            <h1 className="mt-3 font-serif text-3xl font-semibold leading-tight text-white sm:text-4xl">{context ? copy.title : copy.expiredTitle}</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-amber-50/78">{context ? copy.description : copy.expiredDescription}</p>

            {!context ? (
              <div className="mt-8 flex flex-wrap gap-3">
                <Link className={primaryActionClasses()} href="/login?next=/client">
                  <MaterialSymbol name="account_circle" />
                  {copy.login}
                </Link>
                <Link className={secondaryActionClasses()} href="/ar/book-consultation">
                  <MaterialSymbol name="event_available" />
                  {content.shell.consultationCta}
                </Link>
              </div>
            ) : context.client.hasPortalAccount ? (
              <div className="mt-8 rounded-2xl border border-kmt-gold/25 bg-black/25 p-5">
                <h2 className="text-xl font-semibold text-white">{copy.existingAccountTitle}</h2>
                <p className="mt-2 text-sm leading-7 text-amber-50/72">{copy.existingAccountDescription}</p>
                <Link className={cn(primaryActionClasses(), "mt-5")} href="/login?next=/client">
                  <MaterialSymbol name="account_circle" />
                  {copy.login}
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <ClientAccountSetupForm copy={copy} initialEmail={context.client.email} token={context.token} />
              </div>
            )}
          </div>

          {context ? <ConsultationSummary context={context} /> : null}
        </section>
      </main>
    </PublicShell>
  );
}

async function getSetupContext(token: string) {
  try {
    return await getClientAccountSetupContext({ token });
  } catch {
    return null;
  }
}

function ConsultationSummary({ context }: { context: NonNullable<Awaited<ReturnType<typeof getSetupContext>>> }) {
  const rows = [
    { label: copy.clientName, value: context.client.fullName },
    { label: copy.consultationReference, value: context.consultation.reference, dir: "ltr" as const },
    { label: copy.consultationSummary, value: context.consultation.summary },
    {
      label: copy.appointmentTime,
      value: context.consultation.appointment ? formatDateTime(context.consultation.appointment.startsAt) : content.bookingChat.noSlot
    }
  ];

  return (
    <aside className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 shadow-[0_26px_90px_-62px_rgba(183,134,64,0.5)] backdrop-blur sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl border border-kmt-gold/35 bg-black/35 text-kmt-gold">
          <MaterialSymbol name="description" />
        </span>
        <div>
          <p className="text-sm font-semibold text-kmt-gold">{copy.consultationReference}</p>
          <p className="mt-1 font-semibold text-white" dir="ltr">
            {context.consultation.reference}
          </p>
        </div>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <dt className="text-xs font-semibold text-kmt-gold">{row.label}</dt>
            <dd className="mt-1 text-sm leading-7 text-amber-50" dir={row.dir}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function primaryActionClasses(className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-kmt-gold bg-kmt-gold px-5 text-sm font-semibold text-[#120d07] transition-colors hover:bg-[#c7a363]",
    className
  );
}

function secondaryActionClasses(className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold text-amber-50 transition-colors hover:border-kmt-gold/60 hover:text-kmt-gold",
    className
  );
}
