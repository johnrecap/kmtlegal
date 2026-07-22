"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, StateBlock, TextInput } from "@/components/ui";
import { formatDateTime } from "@/lib/legal-format";
import {
  plan35StorageDiagnosticUiCopy,
  plan35UserGovernanceUiCopy,
  roleDisplayLabel,
  technicalValueDisplayLabel
} from "@/lib/ui-copy";
import type { StorageRuntimeDiagnostic } from "@/server/storage/runtime-diagnostic";

type ApiMessage = {
  error?: {
    message?: string;
  };
};

type RoleOption = {
  id: string;
  name: string;
  description?: string | null;
};

type UserFormValue = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  roleId: string;
  roleName: string;
  status: string;
  locale: string;
  updatedAt: string;
};

type ClientProfileValue = {
  id: string;
  fullName: string;
  status: string;
} | null;

type ClientProfileCreateResponse = ApiMessage & {
  data?: {
    id?: string;
  };
};

type SettingValue = Record<string, unknown>;

const MIN_PASSWORD_LENGTH = 10;

async function readMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiMessage;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function checkedValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

export function AdminUserCreateForm({ roles }: { roles: RoleOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = textValue(formData, "password");
    const confirmPassword = textValue(formData, "confirmPassword");

    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(`كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: textValue(formData, "name"),
          email: textValue(formData, "email"),
          phone: textValue(formData, "phone"),
          roleId: textValue(formData, "roleId"),
          status: textValue(formData, "status"),
          locale: textValue(formData, "locale"),
          password
        })
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      form.reset();
      setMessage("تم إنشاء الحساب. لا يتم إرسال بريد تلقائيًا لأن SMTP غير مفعل في هذه النسخة.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء حساب جديد</CardTitle>
        <CardDescription>متاح لمدير النظام فقط. يتم إنشاء البريد وكلمة المرور يدويًا بدون إرسال SMTP.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={createUser}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInput disabled={isBusy} label="الاسم" name="name" required />
            <TextInput disabled={isBusy} label="البريد الإلكتروني" name="email" required type="email" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput disabled={isBusy} label="الهاتف" name="phone" />
            <Select disabled={isBusy} label="الدور" name="roleId" required>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {roleDisplayLabel(role.name)}
                </option>
              ))}
            </Select>
            <Select defaultValue="ACTIVE" disabled={isBusy} label="الحالة" name="status">
              <option value="ACTIVE">نشط</option>
              <option value="INVITED">مدعو</option>
              <option value="SUSPENDED">موقوف</option>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Select defaultValue="ar" disabled={isBusy} label="اللغة" name="locale">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
            <TextInput autoComplete="new-password" disabled={isBusy} label="كلمة المرور" minLength={MIN_PASSWORD_LENGTH} name="password" required type="password" />
            <TextInput autoComplete="new-password" disabled={isBusy} label="تأكيد كلمة المرور" minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" />
          </div>
          <Button loading={isBusy} type="submit">
            إنشاء الحساب
          </Button>
          <FormMessage message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function AdminUserActionPanel({
  canChangePassword,
  canManageClientAccount,
  clientProfile,
  user: initialUser,
  roles
}: {
  canChangePassword: boolean;
  canManageClientAccount: boolean;
  clientProfile: ClientProfileValue;
  user: UserFormValue;
  roles: RoleOption[];
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: textValue(formData, "name"),
          phone: textValue(formData, "phone"),
          roleId: textValue(formData, "roleId"),
          status: textValue(formData, "status"),
          locale: textValue(formData, "locale"),
          updatedAt: user.updatedAt
        })
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        data?: { updatedAt?: string; role?: { id?: string; name?: string }; status?: string; locale?: string; name?: string; phone?: string | null };
      };
      setUser((current) => ({
        ...current,
        name: payload.data?.name ?? current.name,
        phone: payload.data?.phone ?? current.phone,
        roleId: payload.data?.role?.id ?? current.roleId,
        roleName: payload.data?.role?.name ?? current.roleName,
        status: payload.data?.status ?? current.status,
        locale: payload.data?.locale ?? current.locale,
        updatedAt: payload.data?.updatedAt ?? current.updatedAt
      }));
      setMessage(plan35UserGovernanceUiCopy.saveSucceeded);
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createLinkedClientProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}/client-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      const body = (await response.json().catch(() => ({}))) as ClientProfileCreateResponse;
      setMessage("تم إنشاء ملف العميل وربطه بحساب الدخول.");
      router.refresh();
      if (body.data?.id) {
        router.push(`/admin/clients/${body.data.id}`);
      }
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدم</CardTitle>
          <CardDescription>تغيير الاسم والدور والحالة. لا يتم تعديل كلمة المرور أو البريد من هذه الشاشة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={saveUser}>
            <TextInput defaultValue={user.name} disabled={isBusy} label="الاسم" name="name" required />
            <TextInput defaultValue={user.email} disabled label="البريد الإلكتروني" name="email" type="email" />
            <TextInput defaultValue={user.phone ?? ""} disabled={isBusy} label="الهاتف" name="phone" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Select defaultValue={user.roleId} disabled={isBusy} label="الدور" name="roleId">
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {roleDisplayLabel(role.name)}
                  </option>
                ))}
              </Select>
              <Select defaultValue={user.status} disabled={isBusy} label="الحالة" name="status">
                <option value="INVITED">مدعو</option>
                <option value="ACTIVE">نشط</option>
                <option value="SUSPENDED">موقوف</option>
                <option value="DELETED">محذوف</option>
              </Select>
            </div>
            <Select defaultValue={user.locale} disabled={isBusy} label="اللغة" name="locale">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </Select>
            <Button loading={isBusy} type="submit">
              حفظ المستخدم
            </Button>
          </form>
        </CardContent>
      </Card>

      {user.roleName === "Client" ? (
        <Card>
          <CardHeader>
            <CardTitle>ملف العميل في CRM</CardTitle>
            <CardDescription>حسابات العملاء تحتاج ملف عميل مربوط حتى تظهر في صفحة العملاء وبوابة العميل.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {clientProfile ? (
              <>
                <div className="rounded border border-kmt-border bg-slate-50 p-3 text-sm leading-6">
                  <p className="font-semibold text-kmt-ink">{clientProfile.fullName}</p>
                  <p className="text-kmt-muted">الحالة: {clientProfile.status}</p>
                </div>
                <ButtonLink className="w-full" href={`/admin/clients/${clientProfile.id}`} variant="secondary">
                  فتح ملف العميل
                </ButtonLink>
              </>
            ) : canManageClientAccount ? (
              <form className="grid gap-3" onSubmit={createLinkedClientProfile}>
                <p className="text-sm leading-6 text-kmt-muted">
                  هذا الحساب غير ظاهر في CRM لأنه لا يملك ملف عميل مربوط. سيتم إنشاء ملف عميل بنفس الاسم والبريد والهاتف وربطه بهذا الحساب.
                </p>
                <Button loading={isBusy} type="submit" variant="secondary">
                  إنشاء ملف عميل وربطه
                </Button>
              </form>
            ) : (
              <StateBlock
                tone="permission"
                title="حساب عميل غير مربوط"
                description="هذا الحساب يحتاج صلاحية إدارة حسابات العملاء لإنشاء ملف CRM وربطه."
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {canChangePassword ? <AdminUserPasswordForm userId={user.id} /> : null}

      {message ? (
        <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900" role="status">
          {message}
        </div>
      ) : null}
    </div>
  );
}

function AdminUserPasswordForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = textValue(formData, "password");
    const confirmPassword = textValue(formData, "confirmPassword");

    setMessage(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage(`كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`);
      return;
    }

    if (password !== confirmPassword) {
      setMessage("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          revokeSessions: checkedValue(formData, "revokeSessions")
        })
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }

      form.reset();
      setMessage("تم تغيير كلمة المرور وتسجيل العملية.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>تغيير كلمة المرور</CardTitle>
        <CardDescription>متاح لمدير النظام فقط. لا يتم إرسال كلمة المرور بالبريد لأن SMTP غير مفعل في هذه النسخة.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={changePassword}>
          <TextInput autoComplete="new-password" disabled={isBusy} label="كلمة المرور الجديدة" minLength={MIN_PASSWORD_LENGTH} name="password" required type="password" />
          <TextInput autoComplete="new-password" disabled={isBusy} label="تأكيد كلمة المرور" minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" />
          <CheckboxField defaultChecked disabled={isBusy} label="إنهاء الجلسات الحالية لهذا المستخدم بعد تغيير كلمة المرور" name="revokeSessions" />
          <Button loading={isBusy} type="submit" variant="secondary">
            تغيير كلمة المرور
          </Button>
          <FormMessage message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function OfficeProfileSettingForm({ value }: { value: SettingValue }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings/office.profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "office.profile",
          firmName: textValue(formData, "firmName"),
          publicPhone: textValue(formData, "publicPhone"),
          publicEmail: textValue(formData, "publicEmail"),
          primaryLocale: textValue(formData, "primaryLocale")
        })
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }
      setMessage("تم حفظ بيانات المكتب.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={save}>
      <TextInput defaultValue={String(value.firmName ?? "KMT Legal")} disabled={isBusy} label="اسم المكتب" name="firmName" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput defaultValue={String(value.publicPhone ?? "")} disabled={isBusy} label="هاتف عام" name="publicPhone" />
        <TextInput defaultValue={String(value.publicEmail ?? "")} disabled={isBusy} label="بريد عام" name="publicEmail" type="email" />
      </div>
      <Select defaultValue={String(value.primaryLocale ?? "ar")} disabled={isBusy} label="اللغة الأساسية" name="primaryLocale">
        <option value="ar">العربية</option>
        <option value="en">English</option>
      </Select>
      <Button loading={isBusy} type="submit">
        حفظ
      </Button>
      <FormMessage message={message} />
    </form>
  );
}

export function SecurityStaff2faSettingForm({ value }: { value: SettingValue }) {
  const currentMode = value.requiredForStaff ? "مطلوب" : "معطل";

  return (
    <StateBlock
      tone="permission"
      title="التحقق الثنائي للموظفين مؤجل"
      description={`التحقق الثنائي للموظفين غير مفعل في هذا الإصدار. الوضع الحالي: ${currentMode}. إعدادات TOTP والمطالبة بالكود وإعادة الضبط تظل معطلة حتى خطة التحقق الثنائي للموظفين لاحقًا.`}
    />
  );
}

export function StorageRuntimeDiagnosticPanel({
  diagnostic
}: {
  diagnostic: StorageRuntimeDiagnostic;
}) {
  const copy = plan35StorageDiagnosticUiCopy;
  const tone = diagnostic.status === "configured" ? "success" : diagnostic.status === "degraded" ? "warning" : "error";
  return (
    <div className="space-y-5" data-testid="storage-runtime-diagnostic">
      <StateBlock
        description={copy.remediation[diagnostic.status]}
        title={copy[diagnostic.status]}
        tone={tone}
      />
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <DiagnosticValue label={copy.source} value={copy.sourceEnvironment} />
        <DiagnosticValue label={copy.status} value={copy[diagnostic.status]} />
        <DiagnosticValue label={copy.driver} value={diagnostic.driver} ltr />
        <DiagnosticValue label={copy.maxUpload} value={`${diagnostic.maxUploadMb} MB`} ltr />
        <DiagnosticValue label={copy.uploadsPathConfigured} value={diagnostic.uploadsPathConfigured ? copy.yes : copy.no} />
        <DiagnosticValue label={copy.rootStatus} value={copy.rootStatuses[diagnostic.rootStatus]} />
        <DiagnosticValue label={copy.scannerMode} value={copy.scannerModes[diagnostic.scannerMode]} />
        <DiagnosticValue label={copy.scannerStatus} value={copy.scannerStatuses[diagnostic.scannerStatus]} />
        <DiagnosticValue className="sm:col-span-2" label={copy.allowedTypes} value={diagnostic.allowedTypes.join(", ")} ltr />
        <DiagnosticValue className="sm:col-span-2" label={copy.checkedAt} value={formatDateTime(diagnostic.checkedAt)} dynamic />
      </dl>
      <p className="text-sm font-semibold text-kmt-muted">{copy.readOnly}</p>
    </div>
  );
}

function DiagnosticValue({
  label,
  value,
  ltr = false,
  dynamic = false,
  className
}: {
  label: string;
  value: string;
  ltr?: boolean;
  dynamic?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-kmt-border bg-kmt-canvas p-3 ${className ?? ""}`}>
      <dt className="text-kmt-muted">{label}</dt>
      <dd className="mt-1 break-words font-semibold text-kmt-ink" data-visual-dynamic={dynamic || undefined} dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export function EmailPolicySettingForm({ value }: { value: SettingValue }) {
  return (
    <StateBlock
      tone="permission"
      title="SMTP غير مفعل"
      description={`إعدادات SMTP موجودة في الخطة والمتغيرات، لكنها غير مفعلة في هذه النسخة. الوضع الحالي: ${technicalValueDisplayLabel(String(value.mode ?? "disabled"))}. لا توجد واجهة حفظ ولا إرسال بريد فعلي حتى يتم فتح خطة تفعيل SMTP لاحقًا.`}
    />
  );
}

function JsonBooleanSettingForm({
  endpoint,
  fields,
  settingKey,
  successMessage,
  value
}: {
  endpoint: string;
  fields: Array<[string, string]>;
  settingKey: string;
  successMessage: string;
  value: SettingValue;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsBusy(true);
    setMessage(null);

    try {
      const payload: Record<string, unknown> = { key: settingKey };
      for (const [name] of fields) {
        payload[name] = checkedValue(formData, name);
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }
      setMessage(successMessage);
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={save}>
      {fields.map(([name, label]) => (
        <CheckboxField key={name} defaultChecked={Boolean(value[name])} disabled={isBusy} label={label} name={name} />
      ))}
      <Button loading={isBusy} type="submit">
        حفظ
      </Button>
      <FormMessage message={message} />
    </form>
  );
}

function CheckboxField({
  defaultChecked,
  disabled,
  label,
  name
}: {
  defaultChecked: boolean;
  disabled?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded border border-kmt-border bg-white px-3 py-2 text-sm font-semibold text-kmt-ink">
      <input className="h-4 w-4 accent-kmt-navy" defaultChecked={defaultChecked} disabled={disabled} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function FormMessage({ message }: { message: string | null }) {
  return message ? (
    <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm leading-6 text-blue-900" role="status">
      {message}
    </div>
  ) : null;
}
