"use client";

import { useHydrated } from "@/lib/use-hydrated";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
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
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { useInvalidFieldAccordion } from "@/components/admin/use-invalid-field-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
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
          <StatefulButton
            aria-busy={isBusy}
            className={buttonClasses()}
            disabled={isBusy}
            type="submit"
          >
            إنشاء العميل
          </StatefulButton>
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
  const isHydrated = useHydrated();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const archiveFormRef = useRef<HTMLFormElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const groups = useInvalidFieldAccordion({
    type: "multiple",
    defaultValue: ["edit", "assign", "account", "archive"]
  });

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
      <Accordion type="multiple" value={groups.value} onValueChange={groups.onValueChange}>
        <AccordionItem value="edit" data-form-group="edit" className="rounded-lg border border-kmt-border bg-white px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex flex-1 flex-col gap-1 text-start">
              <span className="text-base font-semibold text-kmt-ink">تعديل بيانات العميل</span>
              <span className="text-sm font-normal text-kmt-muted">تعديل بيانات CRM الأساسية فقط؛ لا يتم تعديل حساب الدخول من هنا.</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form className="grid gap-4 pb-4" onSubmit={saveClient} onInvalidCapture={groups.onInvalidCapture}>
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
              <StatefulButton
                aria-busy={isBusy}
                className={buttonClasses()}
                disabled={isBusy}
                type="submit"
              >
                حفظ البيانات
              </StatefulButton>
            </form>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="assign" data-form-group="assign" className="rounded-lg border border-kmt-border bg-white px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex flex-1 flex-col gap-1 text-start">
              <span className="text-base font-semibold text-kmt-ink">تعيين المحامي</span>
              <span className="text-sm font-normal text-kmt-muted">التعيين هنا يخص ملف العميل. تعيين القضايا نفسها يأتي في خطة إدارة القضايا.</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <form className="grid gap-3 pb-4 sm:grid-cols-[1fr_auto]" onSubmit={assignClient} onInvalidCapture={groups.onInvalidCapture}>
              <Select defaultValue={client.assignedLawyerId ?? ""} disabled={isBusy} idPrefix={`client-assign-${client.id}`} label="المحامي المسؤول" name="assignedLawyerId">
                <option value="">غير معين</option>
                {lawyers.map((lawyer) => (
                  <option key={lawyer.id} value={lawyer.id}>
                    {lawyer.name}
                  </option>
                ))}
              </Select>
              <StatefulButton
                aria-busy={isBusy}
                className={buttonClasses({ variant: "secondary", className: "self-end" })}
                disabled={isBusy}
                type="submit"
              >
                تحديث
              </StatefulButton>
            </form>
          </AccordionContent>
        </AccordionItem>

      {canManageAccount ? (
        <AccordionItem value="account" data-form-group="account" className="rounded-lg border border-kmt-border bg-white px-4">
          <AccordionTrigger className="hover:no-underline">
            <span className="flex flex-1 flex-col gap-1 text-start">
              <span className="text-base font-semibold text-kmt-ink">حساب بوابة العميل</span>
              <span className="text-sm font-normal text-kmt-muted">إنشاء أو تحديث حساب دخول للعميل فقط. لا يمكن استخدام هذا المسار لإنشاء حساب موظف.</span>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {client.user ? (
              <div className="space-y-4 pb-4">
                <div className="rounded border border-kmt-border bg-slate-50 p-3 text-sm leading-6">
                  <p className="font-semibold text-kmt-ink">{client.user.email}</p>
                  <p className="text-kmt-muted">الحالة: {client.user.status}</p>
                </div>
                <form ref={passwordFormRef} className="grid gap-3" method="post" onSubmit={resetClientAccountPassword} onInvalidCapture={groups.onInvalidCapture}>
                  <TextInput disabled={!isHydrated || isBusy} idPrefix={`client-account-password-${client.id}`} label="كلمة مرور جديدة" minLength={10} name="password" required type="password" />
                  <label className="flex items-center gap-2 text-sm text-kmt-muted">
                    <input className="h-4 w-4 rounded border-kmt-border" defaultChecked id={`client-account-password-${client.id}-revokeSessions`} name="revokeSessions" type="checkbox" />
                    إنهاء جلسات العميل الحالية
                  </label>
                  <Button disabled={!isHydrated || isBusy} type="button" variant="secondary" onClick={() => setPasswordResetOpen(true)}>
                    تحديث كلمة المرور
                  </Button>
                </form>
                <AdminDialog
                  variant="destructive"
                  open={passwordResetOpen}
                  onOpenChange={setPasswordResetOpen}
                  title="تأكيد تحديث كلمة المرور"
                  description="سيتم تحديث كلمة مرور حساب العميل وإنهاء جلساته الحالية. سيحتاج العميل لتسجيل الدخول مجددًا."
                  confirmLabel="تأكيد التحديث"
                  cancelLabel="إلغاء"
                  confirmBusy={isBusy}
                  onConfirm={() => {
                    setPasswordResetOpen(false);
                    passwordFormRef.current?.requestSubmit();
                  }}
                />
              </div>
            ) : (
              <form className="grid gap-3 pb-4" method="post" onSubmit={createClientAccount} onInvalidCapture={groups.onInvalidCapture}>
                <TextInput defaultValue={client.email ?? ""} disabled={!isHydrated || isBusy} idPrefix={`client-account-create-${client.id}`} label="البريد الإلكتروني" name="email" required type="email" />
                <TextInput disabled={!isHydrated || isBusy} idPrefix={`client-account-create-${client.id}`} label="كلمة المرور" minLength={10} name="password" required type="password" />
                <Select defaultValue="ar" disabled={!isHydrated || isBusy} idPrefix={`client-account-create-${client.id}`} label="لغة الحساب" name="locale">
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </Select>
                <StatefulButton
                  aria-busy={isBusy}
                  className={buttonClasses({ variant: "secondary" })}
                  disabled={!isHydrated || isBusy}
                  type="submit"
                >
                  إنشاء حساب عميل
                </StatefulButton>
              </form>
            )}
          </AccordionContent>
        </AccordionItem>
      ) : null}

      <AccordionItem value="archive" data-form-group="archive" className="rounded-lg border border-kmt-danger-border bg-kmt-danger-surface px-4">
        <AccordionTrigger className="hover:no-underline">
          <span className="flex flex-1 flex-col gap-1 text-start">
            <span className="text-base font-semibold text-kmt-ink">أرشفة العميل</span>
            <span className="text-sm font-normal text-kmt-muted">الأرشفة تغير حالة العميل فقط ولا تحذف القضايا أو السجلات المرتبطة.</span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <form ref={archiveFormRef} className="space-y-3 pb-4" onSubmit={archiveClient} onInvalidCapture={groups.onInvalidCapture}>
            <Textarea disabled={isBusy || isArchived} idPrefix={`client-archive-${client.id}`} label="سبب الأرشفة" name="reason" />
            <Button disabled={isArchived || isBusy} type="button" variant="danger" onClick={() => setArchiveOpen(true)}>
              أرشفة
            </Button>
          </form>
          <AdminDialog
            variant="destructive"
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
            title="تأكيد أرشفة العميل"
            description="سيتم تغيير حالة العميل إلى مؤرشف. القضايا والسجلات المرتبطة تبقى كما هي."
            confirmLabel="تأكيد الأرشفة"
            cancelLabel="إلغاء"
            confirmBusy={isBusy}
            onConfirm={() => {
              setArchiveOpen(false);
              archiveFormRef.current?.requestSubmit();
            }}
          />
        </AccordionContent>
      </AccordionItem>
      </Accordion>

      <ActionFeedback message={message} />
    </div>
  );
}
