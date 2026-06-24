"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Select, StateBlock, TextInput, Textarea } from "@/components/ui";

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
      setMessage("تم إنشاء الحساب. لا يتم إرسال بريد تلقائيًا لأن SMTP مؤجل ومعطل.");
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
        <CardDescription>متاح لحساب Super Admin فقط. يتم إنشاء البريد وكلمة المرور يدويًا بدون إرسال SMTP.</CardDescription>
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
                  {role.name}
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

export function AdminUserActionPanel({ canChangePassword, user, roles }: { canChangePassword: boolean; user: UserFormValue; roles: RoleOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function send(path: string, method: "PATCH" | "POST", payload: unknown, successMessage: string) {
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await fetch(path, {
        method,
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

  function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send(
      `/api/admin/users/${user.id}`,
      "PATCH",
      {
        name: textValue(formData, "name"),
        phone: textValue(formData, "phone"),
        roleId: textValue(formData, "roleId"),
        status: textValue(formData, "status"),
        locale: textValue(formData, "locale")
      },
      "تم حفظ بيانات المستخدم."
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>إدارة المستخدم</CardTitle>
          <CardDescription>تغيير الاسم والدور والحالة. لا يتم تعديل كلمة المرور أو البريد من هذه الشاشة في MVP.</CardDescription>
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
                    {role.name}
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
        <CardDescription>متاح لـ Super Admin فقط. لا يتم إرسال كلمة المرور بالبريد لأن SMTP مؤجل ومعطل.</CardDescription>
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
  return (
    <StateBlock
      tone="permission"
      title="Staff 2FA is deferred"
      description={`Current mode: ${String(value.requiredForStaff ? "required" : "disabled")}. TOTP setup, prompts, and resets are disabled until the future Staff 2FA Rework plan.`}
    />
  );
}

export function StoragePolicySettingForm({ value }: { value: SettingValue }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings/storage.policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "storage.policy",
          driver: "vps-filesystem",
          uploadsDir: textValue(formData, "uploadsDir"),
          maxUploadMb: textValue(formData, "maxUploadMb"),
          allowedTypes: textValue(formData, "allowedTypes")
        })
      });

      if (!response.ok) {
        setMessage(await readMessage(response));
        return;
      }
      setMessage("تم حفظ سياسة التخزين.");
      router.refresh();
    } catch {
      setMessage("لا يمكن الوصول إلى الخادم الآن.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={save}>
      <TextInput defaultValue="vps-filesystem" disabled label="نوع التخزين" name="driver" />
      <TextInput defaultValue={String(value.uploadsDir ?? "/var/lib/kmt-legal/uploads")} disabled={isBusy} label="مسار التخزين الخاص" name="uploadsDir" required />
      <TextInput defaultValue={String(value.maxUploadMb ?? 5)} disabled={isBusy} label="أقصى حجم بالميجابايت" max={5} min={1} name="maxUploadMb" type="number" />
      <Textarea defaultValue={String(value.allowedTypes ?? "")} disabled={isBusy} label="أنواع الملفات المسموحة" name="allowedTypes" />
      <Button loading={isBusy} type="submit">
        حفظ
      </Button>
      <FormMessage message={message} />
    </form>
  );
}

export function EmailPolicySettingForm({ value }: { value: SettingValue }) {
  return (
    <StateBlock
      tone="permission"
      title="SMTP مؤجل ومعطل"
      description={`إعدادات SMTP موجودة في الخطة والمتغيرات، لكنها غير مفعلة في هذه النسخة. الوضع الحالي: ${String(value.mode ?? "disabled")}. لا توجد واجهة حفظ ولا إرسال بريد فعلي حتى يتم فتح خطة تفعيل SMTP لاحقًا.`}
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
