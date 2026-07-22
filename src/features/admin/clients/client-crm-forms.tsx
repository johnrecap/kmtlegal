"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  InlineFeedback,
  Select,
  StateBlock,
  TextInput,
  Textarea
} from "@/components/ui";
import { sourceTypeDisplayLabel } from "@/lib/ui-copy";

type LawyerOption = {
  id: string;
  name: string;
  email: string;
};

type ClientFormValue = {
  id?: string;
  fullName: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  source?: string | null;
  status: string;
  assignedLawyerId?: string | null;
  user?: {
    id: string;
    email: string;
    phone: string | null;
    status: string;
    locale: string;
  } | null;
};

type ApiErrorBody = {
  error?: {
    message?: string;
  };
  data?: {
    id?: string;
  };
};

type ActionMessage = {
  tone: "success" | "error";
  text: string;
};

const statusOptions = [
  { value: "LEAD", label: "عميل محتمل" },
  { value: "ACTIVE", label: "نشط" },
  { value: "INACTIVE", label: "غير نشط" },
  { value: "ARCHIVED", label: "مؤرشف" }
];

async function readMessage(response: Response) {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
}

function ActionFeedback({ message }: { message: ActionMessage | null }) {
  return message ? <InlineFeedback title={message.text} tone={message.tone} /> : null;
}

function payloadFromForm(form: HTMLFormElement) {
  const formData = new FormData(form);
  return {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    source: formData.get("source"),
    status: formData.get("status"),
    assignedLawyerId: formData.get("assignedLawyerId")
  };
}

export function ClientCreateForm({ lawyers }: { lawyers: LawyerOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadFromForm(event.currentTarget))
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
      const clientId = body.data?.id;
      setMessage({ tone: "success", text: "تم إنشاء ملف العميل." });
      if (clientId) {
        router.push(`/admin/clients/${clientId}`);
      } else {
        router.refresh();
      }
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إضافة عميل</CardTitle>
        <CardDescription>إنشاء ملف CRM يدوي بدون إنشاء قضية أو حساب دخول تلقائياً.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={createClient}>
          <TextInput idPrefix="client-create" label="الاسم الكامل" name="fullName" required />
          <TextInput idPrefix="client-create" label="الهاتف" name="phone" required />
          <TextInput idPrefix="client-create" label="البريد الإلكتروني" name="email" type="email" />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput idPrefix="client-create" label="المدينة" name="city" />
            <div>
              <input name="source" type="hidden" value="manual" />
              <TextInput defaultValue={sourceTypeDisplayLabel("manual")} disabled idPrefix="client-create" label="المصدر" name="sourceDisplay" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select defaultValue="LEAD" idPrefix="client-create" label="الحالة" name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Select idPrefix="client-create" label="المحامي المسؤول" name="assignedLawyerId">
              <option value="">غير معين</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
          </div>
          <Button loading={isBusy} type="submit">
            إنشاء العميل
          </Button>
          <ActionFeedback message={message} />
        </form>
      </CardContent>
    </Card>
  );
}

export function ClientActionPanel({
  client,
  lawyers,
  canManage,
  canManageAccount
}: {
  client: ClientFormValue;
  lawyers: LawyerOption[];
  canManage: boolean;
  canManageAccount: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  if (!canManage) {
    return (
      <StateBlock
        tone="permission"
        title="صلاحية قراءة فقط"
        description="يمكنك مراجعة ملف العميل داخل نطاق صلاحياتك، لكن تعديل البيانات أو التعيين يحتاج صلاحية إدارة العملاء."
      />
    );
  }

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
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      setMessage({ tone: "success", text: successMessage });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  function saveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(`/api/admin/clients/${client.id}`, "PATCH", payloadFromForm(event.currentTarget), "تم حفظ بيانات العميل.");
  }

  function assignClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send(
      `/api/admin/clients/${client.id}/assign`,
      "POST",
      { assignedLawyerId: formData.get("assignedLawyerId") },
      "تم تحديث المحامي المسؤول."
    );
  }

  function archiveClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send(`/api/admin/clients/${client.id}/archive`, "POST", { reason: formData.get("reason") }, "تمت أرشفة العميل.");
  }

  function createClientAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send(
      `/api/admin/clients/${client.id}/account`,
      "POST",
      {
        email: formData.get("email"),
        password: formData.get("password"),
        locale: formData.get("locale")
      },
      "تم إنشاء حساب بوابة العميل."
    );
  }

  function resetClientAccountPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    send(
      `/api/admin/clients/${client.id}/account/password`,
      "POST",
      {
        password: formData.get("password"),
        revokeSessions: formData.get("revokeSessions") === "on"
      },
      "تم تحديث كلمة مرور حساب العميل."
    );
  }

  const isArchived = client.status === "ARCHIVED";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>تعديل بيانات العميل</CardTitle>
          <CardDescription>تعديل بيانات CRM الأساسية فقط؛ لا يتم تعديل حساب الدخول من هنا.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={saveClient}>
            <TextInput defaultValue={client.fullName} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="الاسم الكامل" name="fullName" required />
            <TextInput defaultValue={client.phone} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="الهاتف" name="phone" required />
            <TextInput defaultValue={client.email ?? ""} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="البريد الإلكتروني" name="email" type="email" />
            <TextInput defaultValue={client.city ?? ""} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="المدينة" name="city" />
            {client.source === "manual" ? (
              <div>
                <input name="source" type="hidden" value="manual" />
                <TextInput defaultValue={sourceTypeDisplayLabel(client.source)} disabled idPrefix={`client-edit-${client.id}`} label="المصدر" name="sourceDisplay" />
              </div>
            ) : (
              <TextInput defaultValue={client.source ?? ""} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="المصدر" name="source" />
            )}
            <Select defaultValue={client.status} disabled={isBusy} idPrefix={`client-edit-${client.id}`} label="الحالة" name="status">
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <input name="assignedLawyerId" type="hidden" value={client.assignedLawyerId ?? ""} />
            <Button loading={isBusy} type="submit">
              حفظ البيانات
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تعيين المحامي</CardTitle>
          <CardDescription>التعيين هنا يخص ملف العميل. تعيين القضايا نفسها يأتي في خطة إدارة القضايا.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={assignClient}>
            <Select defaultValue={client.assignedLawyerId ?? ""} disabled={isBusy} idPrefix={`client-assign-${client.id}`} label="المحامي المسؤول" name="assignedLawyerId">
              <option value="">غير معين</option>
              {lawyers.map((lawyer) => (
                <option key={lawyer.id} value={lawyer.id}>
                  {lawyer.name}
                </option>
              ))}
            </Select>
            <Button className="self-end" loading={isBusy} type="submit" variant="secondary">
              تحديث
            </Button>
          </form>
        </CardContent>
      </Card>

      {canManageAccount ? (
        <Card>
          <CardHeader>
            <CardTitle>حساب بوابة العميل</CardTitle>
            <CardDescription>إنشاء أو تحديث حساب دخول للعميل فقط. لا يمكن استخدام هذا المسار لإنشاء حساب موظف.</CardDescription>
          </CardHeader>
          <CardContent>
            {client.user ? (
              <div className="space-y-4">
                <div className="rounded border border-kmt-border bg-slate-50 p-3 text-sm leading-6">
                  <p className="font-semibold text-kmt-ink">{client.user.email}</p>
                  <p className="text-kmt-muted">الحالة: {client.user.status}</p>
                </div>
                <form className="grid gap-3" onSubmit={resetClientAccountPassword}>
                  <TextInput disabled={isBusy} idPrefix={`client-account-password-${client.id}`} label="كلمة مرور جديدة" minLength={10} name="password" required type="password" />
                  <label className="flex items-center gap-2 text-sm text-kmt-muted">
                    <input className="h-4 w-4 rounded border-kmt-border" defaultChecked id={`client-account-password-${client.id}-revokeSessions`} name="revokeSessions" type="checkbox" />
                    إنهاء جلسات العميل الحالية
                  </label>
                  <Button loading={isBusy} type="submit" variant="secondary">
                    تحديث كلمة المرور
                  </Button>
                </form>
              </div>
            ) : (
              <form className="grid gap-3" onSubmit={createClientAccount}>
                <TextInput defaultValue={client.email ?? ""} disabled={isBusy} idPrefix={`client-account-create-${client.id}`} label="البريد الإلكتروني" name="email" required type="email" />
                <TextInput disabled={isBusy} idPrefix={`client-account-create-${client.id}`} label="كلمة المرور" minLength={10} name="password" required type="password" />
                <Select defaultValue="ar" disabled={isBusy} idPrefix={`client-account-create-${client.id}`} label="لغة الحساب" name="locale">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </Select>
                <Button loading={isBusy} type="submit" variant="secondary">
                  إنشاء حساب عميل
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>أرشفة العميل</CardTitle>
          <CardDescription>الأرشفة تغير حالة العميل فقط ولا تحذف القضايا أو السجلات المرتبطة.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={archiveClient}>
            <Textarea disabled={isBusy || isArchived} idPrefix={`client-archive-${client.id}`} label="سبب الأرشفة" name="reason" />
            <Button disabled={isArchived} loading={isBusy} type="submit" variant="danger">
              أرشفة
            </Button>
          </form>
        </CardContent>
      </Card>

      <ActionFeedback message={message} />
    </div>
  );
}
