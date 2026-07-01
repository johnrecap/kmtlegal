import type { Metadata } from "next";
import { ClientPortalDetailItem, ClientPortalPanel, ClientSiteShell } from "@/components/layout";
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
        <ClientPortalPanel description="البريد وكلمة المرور يتم تحديثهما من خلال المكتب." title="بيانات الحساب">
          <div className="space-y-4 text-sm">
            <ClientPortalDetailItem label="بريد تسجيل الدخول" value={profile.user?.email ?? "غير محدد"} />
            <ClientPortalDetailItem label="المحامي المسؤول" value={profile.assignedLawyer?.name ?? "غير معين"} />
            <ClientPortalDetailItem label="تاريخ إنشاء الملف" value={formatDateTime(profile.createdAt)} />
          </div>
        </ClientPortalPanel>
      </div>
    </ClientSiteShell>
  );
}
