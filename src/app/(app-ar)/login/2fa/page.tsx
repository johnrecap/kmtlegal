import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TwoFactorForm } from "@/features/auth/two-factor-form";
import { getAuthContextForPage } from "@/server/auth/page-guards";
import { isStaffTwoFactorEnabled } from "@/server/auth/two-factor";
import { signedInRedirectPath } from "@/lib/auth-routing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "التحقق الثنائي | KMT Legal",
  description: "التحقق الثنائي لفريق المكتب."
};

type SearchParams = Record<string, string | string[] | undefined>;

export default async function TwoFactorPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const query = (await searchParams) ?? {};
  const nextParam = Array.isArray(query.next) ? query.next[0] : query.next;
  const next = nextParam && nextParam.startsWith("/") ? nextParam : null;

  const context = await getAuthContextForPage({ allowPendingTwoFactor: true });
  if (!context) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  if (context.sessionStatus !== "PENDING_2FA") redirect(signedInRedirectPath(context.principal.roleName, next));
  if (!isStaffTwoFactorEnabled()) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-kmt-canvas px-4 py-10 sm:px-6 lg:px-8">
      <TwoFactorForm locale="ar" next={next} />
    </main>
  );
}
