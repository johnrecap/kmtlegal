import type { Metadata } from "next";
import { ClientSiteShell } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ProfileForm } from "@/features/portal/profile-form";
import { formatDateTime } from "@/lib/legal-format";
import { PermissionBlocked, requirePortalPage } from "@/server/auth/page-guards";
import { getPortalProfile } from "@/server/portal/client-portal-service";
import { clientNavForPath } from "../client-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "الملف الشخصي | KMT Legal"
};

export default async function ClientProfilePage() {
  const guard = await requirePortalPage("/client/profile");
  if (guard.status === "forbidden") {
    return <PermissionBlocked title={guard.title} description={guard.description} />;
  }

  const profile = await getPortalProfile(guard.context.principal);

  return (
    <ClientSiteShell navItems={clientNavForPath("/client/profile")} title="الملف الشخصي" userLabel={guard.context.user.name}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <ProfileForm
          profile={{
            fullName: profile.fullName,
            phone: profile.phone,
            email: profile.email,
            city: profile.city
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>بيانات الحساب</CardTitle>
            <CardDescription>البريد وكلمة المرور يتم تحديثهما من خلال المكتب.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-kmt-muted">بريد تسجيل الدخول</dt>
                <dd className="mt-1 text-kmt-ink">{profile.user?.email ?? "غير محدد"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-kmt-muted">المحامي المسؤول</dt>
                <dd className="mt-1 text-kmt-ink">{profile.assignedLawyer?.name ?? "غير معين"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-kmt-muted">تاريخ إنشاء الملف</dt>
                <dd className="mt-1 text-kmt-ink">{formatDateTime(profile.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </ClientSiteShell>
  );
}
