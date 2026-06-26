"use client";

import { type FormEvent, useEffect, useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, TextInput } from "@/components/ui";
import { booleanDisplayLabel, localizeApiMessage } from "@/lib/ui-copy";

type InstallerStatus = {
  enabled: boolean;
  locked: boolean;
  hasActiveSuperAdmin: boolean;
  canInstall: boolean;
  reason: string | null;
};

type PreflightCheck = {
  id: string;
  ok: boolean;
  label: string;
};

type HostingMode = "terminal-vps" | "aapanel" | "cpanel";

type ApiResponse<T> = {
  data?: T;
  error?: {
    message?: string;
  };
};

type InstallWizardProps = {
  initialToken: string;
};

const MIN_PASSWORD_LENGTH = 10;

const hostingModes: Array<{
  value: HostingMode;
  title: string;
  description: string;
}> = [
  {
    value: "terminal-vps",
    title: "خادم VPS عبر الطرفية",
    description: "خادم Ubuntu/Debian جديد بصلاحية sudo أو root، ويستخدم سكربت التثبيت الكامل."
  },
  {
    value: "aapanel",
    title: "aaPanel",
    description: "خادم VPS مُدار من اللوحة. النطاق وSSL وقاعدة البيانات والـreverse proxy تظل داخل aaPanel."
  },
  {
    value: "cpanel",
    title: "cPanel",
    description: "يصلح فقط للحسابات التي توفر Node.js App وPostgreSQL ومشغل أوامر وتخزين خاص."
  }
];

export function InstallWizard({ initialToken }: InstallWizardProps) {
  const [token, setToken] = useState(initialToken);
  const [hostingMode, setHostingMode] = useState<HostingMode>("terminal-vps");
  const [status, setStatus] = useState<InstallerStatus | null>(null);
  const [checks, setChecks] = useState<PreflightCheck[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [superAdminEmail, setSuperAdminEmail] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function refreshStatus() {
    const response = await fetch("/api/install/status", { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<InstallerStatus>;
    if (payload.data) {
      setStatus(payload.data);
    }
  }

  async function apiPost<T>(path: string, body?: unknown) {
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-installer-token": token
      },
      body: body === undefined ? "{}" : JSON.stringify(body)
    });
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
    if (!response.ok) {
      throw new Error(localizeApiMessage(payload.error?.message ?? "Installer request failed."));
    }
    return payload.data as T;
  }

  async function runPreflight() {
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiPost<{ checks: PreflightCheck[]; hostingMode: HostingMode; ready: boolean; status: InstallerStatus }>("/api/install/preflight", {
        hostingMode
      });
      setChecks(result.checks);
      setStatus(result.status);
      setMessage(result.ready ? "فحص الجاهزية سليم. يمكنك إنشاء حساب مدير النظام الأول." : "فحص الجاهزية وجد عناصر يجب إصلاحها قبل المتابعة.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر تشغيل فحص الجاهزية.");
    } finally {
      setIsBusy(false);
    }
  }

  async function bootstrap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setError(null);
    setMessage(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = textValue(formData, "password");
    const confirmPassword = textValue(formData, "confirmPassword");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`كلمة المرور يجب ألا تقل عن ${MIN_PASSWORD_LENGTH} أحرف.`);
      setIsBusy(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق.");
      setIsBusy(false);
      return;
    }

    try {
      const result = await apiPost<{ user: { email: string } }>("/api/install/bootstrap-super-admin", {
        office: {
          firmName: textValue(formData, "firmName"),
          publicPhone: textValue(formData, "publicPhone"),
          publicEmail: textValue(formData, "publicEmail"),
          primaryLocale: "ar"
        },
        admin: {
          name: textValue(formData, "adminName"),
          email: textValue(formData, "adminEmail"),
          password,
          locale: "ar"
        }
      });

      setSuperAdminEmail(result.user.email);
      setMessage("تم إنشاء حساب مدير النظام الأول. اقفل معالج التثبيت الآن.");
      form.reset();
      await refreshStatus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر إنشاء حساب المدير الأول.");
    } finally {
      setIsBusy(false);
    }
  }

  async function finish() {
    setIsBusy(true);
    setError(null);
    setMessage(null);
    try {
      await apiPost("/api/install/finish");
      setIsFinished(true);
      setMessage("تم قفل معالج التثبيت. عطّل INSTALLER_ENABLED على الخادم ثم سجل الدخول.");
      await refreshStatus();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر قفل معالج التثبيت.");
    } finally {
      setIsBusy(false);
    }
  }

  const blockedReason = status && !status.canInstall && !superAdminEmail ? status.reason : null;

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-kmt-gold">KMT Legal Installer</p>
        <h1 className="mt-3 text-3xl font-semibold text-kmt-ink">معالج تهيئة الاستضافة</h1>
        <p className="mt-3 text-base leading-8 text-kmt-muted">
          اختر نوع الاستضافة أولًا، ثم شغّل فحص الجاهزية قبل إنشاء حساب مدير النظام الأول. التحقق الثنائي وSMTP غير مفعلين في هذه النسخة.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>1. نوع الاستضافة</CardTitle>
              <CardDescription>اختر المسار الذي يطابق طريقة تشغيل هذا الخادم.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {hostingModes.map((mode) => (
                  <label
                    key={mode.value}
                    className={
                      hostingMode === mode.value
                        ? "flex cursor-pointer gap-3 rounded border border-kmt-gold bg-kmt-gold/10 p-3"
                        : "flex cursor-pointer gap-3 rounded border border-kmt-border p-3 hover:border-kmt-gold"
                    }
                  >
                    <input
                      checked={hostingMode === mode.value}
                      className="mt-1"
                      name="hostingMode"
                      onChange={() => setHostingMode(mode.value)}
                      type="radio"
                      value={mode.value}
                    />
                    <span>
                      <span className="block font-semibold text-kmt-ink">{mode.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-kmt-muted">{mode.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. رمز التثبيت</CardTitle>
              <CardDescription>سكربت التثبيت يعرض هذا الرمز مرة واحدة فقط. احتفظ به بشكل خاص.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextInput
                autoComplete="off"
                label="رمز إعداد التثبيت"
                name="token"
                onChange={(event) => setToken(event.target.value)}
                placeholder="الصق رمز التثبيت"
                value={token}
              />
              <Button disabled={!token || isBusy} loading={isBusy} onClick={runPreflight} type="button">
                تشغيل فحص الجاهزية
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. بيانات المكتب ومدير النظام الأول</CardTitle>
              <CardDescription>يتم إنشاء الحساب الأول مرة واحدة فقط. لا توجد خطوة TOTP في هذه النسخة.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4" onSubmit={bootstrap}>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput disabled={isBusy || Boolean(blockedReason)} label="اسم المكتب" name="firmName" required />
                  <TextInput disabled={isBusy || Boolean(blockedReason)} label="البريد العام للمكتب" name="publicEmail" type="email" />
                </div>
                <TextInput disabled={isBusy || Boolean(blockedReason)} label="الهاتف العام" name="publicPhone" />
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput disabled={isBusy || Boolean(blockedReason)} label="اسم مدير النظام" name="adminName" required />
                  <TextInput disabled={isBusy || Boolean(blockedReason)} label="بريد مدير النظام" name="adminEmail" required type="email" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextInput autoComplete="new-password" disabled={isBusy || Boolean(blockedReason)} label="كلمة المرور" minLength={MIN_PASSWORD_LENGTH} name="password" required type="password" />
                  <TextInput autoComplete="new-password" disabled={isBusy || Boolean(blockedReason)} label="تأكيد كلمة المرور" minLength={MIN_PASSWORD_LENGTH} name="confirmPassword" required type="password" />
                </div>
                <Button disabled={isBusy || Boolean(blockedReason)} loading={isBusy} type="submit">
                  إنشاء مدير النظام الأول
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. قفل معالج التثبيت</CardTitle>
              <CardDescription>بعد إنشاء مدير النظام، اقفل معالج التثبيت قبل استخدام لوحة المكتب.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button disabled={isBusy || (!superAdminEmail && !status?.hasActiveSuperAdmin) || isFinished} loading={isBusy} onClick={finish} type="button" variant="secondary">
                قفل معالج التثبيت
              </Button>
              {superAdminEmail ? <span className="text-sm text-kmt-muted">تم إنشاء الحساب: <span className="ltr inline-block">{superAdminEmail}</span></span> : null}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <ModePanel hostingMode={hostingMode} />
          <StatusPanel status={status} blockedReason={blockedReason} />
          <ChecksPanel checks={checks} />
          {message ? <Notice tone="success" message={message} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}
        </aside>
      </div>
    </div>
  );
}

function ModePanel({ hostingMode }: { hostingMode: HostingMode }) {
  const mode = hostingModes.find((item) => item.value === hostingMode) ?? hostingModes[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle>المسار المحدد</CardTitle>
        <CardDescription>{mode.title}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm leading-6 text-kmt-muted">
        {hostingMode === "cpanel"
          ? "يجب أن ينجح cPanel في كل متطلبات التشغيل قبل الإعداد: Node.js App وPostgreSQL ومشغل الأوامر ومتغيرات البيئة وتشغيل دائم وتخزين خاص خارج public_html."
          : mode.description}
      </CardContent>
    </Card>
  );
}

function StatusPanel({ blockedReason, status }: { blockedReason: string | null; status: InstallerStatus | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>حالة معالج التثبيت</CardTitle>
        <CardDescription>{blockedReason ? localizeApiMessage(blockedReason) : "جاهز للإعداد بعد نجاح فحص الجاهزية."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-kmt-muted">
        <StatusRow label="مفعل" value={status?.enabled} />
        <StatusRow label="مغلق" value={status?.locked} />
        <StatusRow label="يوجد مدير نظام نشط" value={status?.hasActiveSuperAdmin} />
      </CardContent>
    </Card>
  );
}

function ChecksPanel({ checks }: { checks: PreflightCheck[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>فحوصات الجاهزية</CardTitle>
        <CardDescription>أصلح الفحوصات غير الناجحة في بيئة الاستضافة المحددة، ثم شغّل الفحص مرة أخرى.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.length === 0 ? <p className="text-sm text-kmt-muted">لم يتم تشغيل أي فحص بعد.</p> : null}
        {checks.map((check) => (
          <div key={check.id} className="flex items-center justify-between gap-3 rounded border border-kmt-border px-3 py-2 text-sm">
            <span>{localizeApiMessage(check.label)}</span>
            <span className={check.ok ? "font-semibold text-emerald-700" : "font-semibold text-kmt-danger"}>{check.ok ? "سليم" : "يحتاج إصلاح"}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="font-semibold text-kmt-ink">{booleanDisplayLabel(value)}</span>
    </div>
  );
}

function Notice({ message, tone }: { message: string; tone: "success" | "error" }) {
  return (
    <div
      className={
        tone === "success"
          ? "rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-900"
          : "rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-kmt-danger"
      }
      role={tone === "error" ? "alert" : "status"}
    >
      {message}
    </div>
  );
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}
