"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { InlineFeedback, Select, TextInput, Textarea } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import {
  articleStatusLabels,
  articleStatusValues,
  caseStudyStatusLabels,
  caseStudyStatusValues,
  socialDraftStatusLabels,
  socialDraftStatusValues,
  socialPlatformLabels,
  socialPlatformValues
} from "@/lib/legal-content";
import { labelFrom } from "@/lib/legal-format";
import { contentLifecycleUiCopy, sourceTypeDisplayLabel } from "@/lib/ui-copy";
import { useHydrated } from "@/lib/use-hydrated";
import { readAdminApiErrorMessage } from "@/features/admin/shared/admin-api-error";

type ActionMessage = {
  tone: "success" | "error";
  text: string;
};

type ArticleValue = {
  id?: string;
  title?: string;
  slug?: string;
  locale?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  status?: string;
  publishedAt?: string | Date | null;
};

type CaseStudyValue = {
  id?: string;
  title?: string;
  slug?: string;
  locale?: string;
  category?: string;
  challenge?: string;
  approach?: string;
  generalOutcome?: string;
  lessons?: string;
  status?: string;
  isAnonymized?: boolean;
  publishedAt?: string | Date | null;
};

type SocialDraftValue = {
  id?: string;
  title?: string;
  platform?: string;
  content?: string;
  sourceType?: string | null;
  sourceId?: string | null;
  status?: string;
  scheduledAt?: string | Date | null;
};

async function readMessage(response: Response) {
  return readAdminApiErrorMessage(response);
}

function useUnsavedFormGuard() {
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);
  const markSaved = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLink = (event: MouseEvent) => {
      if (!dirtyRef.current) return;
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!target) return;
      if (!window.confirm("لديك تعديلات غير محفوظة. هل تريد مغادرة المحرر وفقد هذه التعديلات؟")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", guardLink, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", guardLink, true);
    };
  }, []);

  return { dirty, markDirty, markSaved };
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function checkedValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function toDateInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

function toDateTimeInput(value?: string | Date | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

async function sendJson(path: string, method: "POST" | "PATCH", payload: unknown) {
  return fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function ActionFeedback({ message }: { message: ActionMessage | null }) {
  return message ? <InlineFeedback title={message.text} tone={message.tone} /> : null;
}

function CheckboxField({
  defaultChecked,
  disabled,
  idPrefix,
  label,
  name
}: {
  defaultChecked?: boolean;
  disabled?: boolean;
  idPrefix: string;
  label: string;
  name: string;
}) {
  return (
    <label className="flex items-start gap-3 rounded border border-border bg-surface px-3 py-2 text-sm font-semibold leading-6 text-foreground">
      <input className="mt-1 h-4 w-4 accent-kmt-navy" defaultChecked={defaultChecked} disabled={disabled} id={`${idPrefix}-${name}`} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function withCurrentStatus(statuses: readonly string[], currentStatus?: string) {
  return currentStatus && !statuses.includes(currentStatus) ? [...statuses, currentStatus] : statuses;
}

function allowedArticleStatuses(canApprove: boolean, currentStatus?: string) {
  return withCurrentStatus(articleStatusValues.filter((status) => canApprove || !["PUBLISHED", "ARCHIVED"].includes(status)), currentStatus);
}

function allowedCaseStudyStatuses(canApprove: boolean, currentStatus?: string) {
  return withCurrentStatus(caseStudyStatusValues.filter((status) => canApprove || !["APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status)), currentStatus);
}

function allowedSocialDraftStatuses(canApprove: boolean, currentStatus?: string) {
  return withCurrentStatus(socialDraftStatusValues.filter((status) => canApprove || !["APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status)), currentStatus);
}

export function ArticleForm({ article, canApprove, idPrefix }: { article?: ArticleValue; canApprove: boolean; idPrefix?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isHydrated = useHydrated();
  const submitLock = useRef(false);
  const isEdit = Boolean(article?.id);
  const isProtected = isEdit && !canApprove && article?.status === "PUBLISHED";
  const prefix = idPrefix ?? `article-${article?.id ?? "create"}`;
  const unsaved = useUnsavedFormGuard();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isHydrated || submitLock.current) return;
    submitLock.current = true;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(isEdit ? `/api/admin/content/articles/${article?.id}` : "/api/admin/content/articles", isEdit ? "PATCH" : "POST", {
        title: textValue(formData, "title"),
        slug: textValue(formData, "slug"),
        locale: textValue(formData, "locale") || "en",
        excerpt: textValue(formData, "excerpt"),
        content: textValue(formData, "content"),
        category: textValue(formData, "category"),
        status: textValue(formData, "status"),
        publishedAt: textValue(formData, "publishedAt")
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      if (!isEdit) {
        form.reset();
      }
      unsaved.markSaved();
      setMessage({ tone: "success", text: isEdit ? "تم حفظ المقال." : "تم إنشاء المقال." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      submitLock.current = false;
      setIsBusy(false);
    }
  }

  return (
    <form aria-busy={isBusy} className="grid gap-4" onChangeCapture={unsaved.markDirty} onSubmit={submit}>
      {isProtected ? <InlineFeedback title={contentLifecycleUiCopy.protectedEdit(labelFrom(articleStatusLabels, article?.status ?? "PUBLISHED"))} tone="warning" /> : null}
      {unsaved.dirty ? <InlineFeedback title="لديك تعديلات غير محفوظة." tone="warning" /> : null}
      <fieldset className="grid gap-4 disabled:opacity-70" disabled={isProtected || !isHydrated}>
      <TextInput defaultValue={article?.title ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="عنوان المقال" name="title" required />
      <TextInput defaultValue={article?.slug ?? ""} disabled={isBusy} hint="صيغة lowercase-kebab-case مثل contract-risk-basics." idPrefix={prefix} label="معرّف الرابط (Slug)" name="slug" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={article?.locale ?? "en"} disabled={isBusy} idPrefix={prefix} label="لغة المحتوى" name="locale">
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
        <TextInput defaultValue={article?.category ?? ""} disabled={isBusy} idPrefix={prefix} label="التصنيف" name="category" required />
      </div>
      <Textarea defaultValue={article?.excerpt ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="الملخص" name="excerpt" required />
      <Textarea className="min-h-48" defaultValue={article?.content ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="المحتوى" name="content" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={article?.status ?? "DRAFT"} disabled={isBusy} idPrefix={prefix} label="الحالة" name="status">
          {allowedArticleStatuses(canApprove, article?.status).map((status) => (
            <option key={status} value={status}>
              {labelFrom(articleStatusLabels, status)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateInput(article?.publishedAt)} disabled={isBusy} idPrefix={prefix} label="تاريخ النشر" name="publishedAt" type="date" />
      </div>
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses()}
        disabled={isBusy}
        type="submit"
      >
        {isEdit ? "حفظ المقال" : "إنشاء مقال"}
      </StatefulButton>
      </fieldset>
      <ActionFeedback message={message} />
    </form>
  );
}

export function CaseStudyForm({ study, canApprove, idPrefix }: { study?: CaseStudyValue; canApprove: boolean; idPrefix?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isHydrated = useHydrated();
  const submitLock = useRef(false);
  const isEdit = Boolean(study?.id);
  const isProtected = isEdit && !canApprove && ["APPROVED", "PUBLISHED"].includes(study?.status ?? "");
  const prefix = idPrefix ?? `case-study-${study?.id ?? "create"}`;
  const unsaved = useUnsavedFormGuard();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isHydrated || submitLock.current) return;
    submitLock.current = true;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(isEdit ? `/api/admin/content/case-studies/${study?.id}` : "/api/admin/content/case-studies", isEdit ? "PATCH" : "POST", {
        title: textValue(formData, "title"),
        slug: textValue(formData, "slug"),
        locale: textValue(formData, "locale") || "en",
        category: textValue(formData, "category"),
        challenge: textValue(formData, "challenge"),
        approach: textValue(formData, "approach"),
        generalOutcome: textValue(formData, "generalOutcome"),
        lessons: textValue(formData, "lessons"),
        status: textValue(formData, "status"),
        isAnonymized: checkedValue(formData, "isAnonymized"),
        publishedAt: textValue(formData, "publishedAt")
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      if (!isEdit) {
        form.reset();
      }
      unsaved.markSaved();
      setMessage({ tone: "success", text: isEdit ? "تم حفظ دراسة الحالة." : "تم إنشاء دراسة الحالة." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      submitLock.current = false;
      setIsBusy(false);
    }
  }

  return (
    <form aria-busy={isBusy} className="grid gap-4" onChangeCapture={unsaved.markDirty} onSubmit={submit}>
      {isProtected ? <InlineFeedback title={contentLifecycleUiCopy.protectedEdit(labelFrom(caseStudyStatusLabels, study?.status ?? "PUBLISHED"))} tone="warning" /> : null}
      {unsaved.dirty ? <InlineFeedback title="لديك تعديلات غير محفوظة." tone="warning" /> : null}
      <fieldset className="grid gap-4 disabled:opacity-70" disabled={isProtected || !isHydrated}>
      <TextInput defaultValue={study?.title ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="عنوان دراسة الحالة" name="title" required />
      <TextInput defaultValue={study?.slug ?? ""} disabled={isBusy} hint="صيغة lowercase-kebab-case." idPrefix={prefix} label="معرّف الرابط (Slug)" name="slug" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={study?.locale ?? "en"} disabled={isBusy} idPrefix={prefix} label="لغة المحتوى" name="locale">
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
        <TextInput defaultValue={study?.category ?? ""} disabled={isBusy} idPrefix={prefix} label="التصنيف" name="category" required />
      </div>
      <Textarea defaultValue={study?.challenge ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="التحدي" name="challenge" required />
      <Textarea defaultValue={study?.approach ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="طريقة التعامل" name="approach" required />
      <Textarea defaultValue={study?.generalOutcome ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="النتيجة العامة" name="generalOutcome" required />
      <Textarea defaultValue={study?.lessons ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="الدروس" name="lessons" required />
      <CheckboxField defaultChecked={study?.isAnonymized ?? false} disabled={isBusy} idPrefix={prefix} label="تمت مراجعة إخفاء الهوية ولا توجد أسماء عملاء أو أرقام قضايا أو بيانات اتصال." name="isAnonymized" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={study?.status ?? "DRAFT"} disabled={isBusy} idPrefix={prefix} label="الحالة" name="status">
          {allowedCaseStudyStatuses(canApprove, study?.status).map((status) => (
            <option key={status} value={status}>
              {labelFrom(caseStudyStatusLabels, status)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateInput(study?.publishedAt)} disabled={isBusy} idPrefix={prefix} label="تاريخ النشر" name="publishedAt" type="date" />
      </div>
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses()}
        disabled={isBusy}
        type="submit"
      >
        {isEdit ? "حفظ دراسة الحالة" : "إنشاء دراسة حالة"}
      </StatefulButton>
      </fieldset>
      <ActionFeedback message={message} />
    </form>
  );
}

export function SocialDraftForm({ draft, canApprove, idPrefix }: { draft?: SocialDraftValue; canApprove: boolean; idPrefix?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isHydrated = useHydrated();
  const submitLock = useRef(false);
  const isEdit = Boolean(draft?.id);
  const isProtected = isEdit && !canApprove && ["APPROVED", "SCHEDULED", "PUBLISHED"].includes(draft?.status ?? "");
  const prefix = idPrefix ?? `social-draft-${draft?.id ?? "create"}`;
  const unsaved = useUnsavedFormGuard();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isHydrated || submitLock.current) return;
    submitLock.current = true;
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson(isEdit ? `/api/admin/content/social-drafts/${draft?.id}` : "/api/admin/content/social-drafts", isEdit ? "PATCH" : "POST", {
        title: textValue(formData, "title"),
        platform: textValue(formData, "platform"),
        content: textValue(formData, "content"),
        sourceType: textValue(formData, "sourceType"),
        sourceId: textValue(formData, "sourceId"),
        status: textValue(formData, "status"),
        scheduledAt: textValue(formData, "scheduledAt") ? new Date(textValue(formData, "scheduledAt")).toISOString() : ""
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      if (!isEdit) {
        form.reset();
      }
      unsaved.markSaved();
      setMessage({ tone: "success", text: isEdit ? "تم حفظ مسودة السوشيال." : "تم إنشاء مسودة السوشيال." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      submitLock.current = false;
      setIsBusy(false);
    }
  }

  return (
    <form aria-busy={isBusy} className="grid gap-4" onChangeCapture={unsaved.markDirty} onSubmit={submit}>
      {isProtected ? <InlineFeedback title={contentLifecycleUiCopy.protectedEdit(labelFrom(socialDraftStatusLabels, draft?.status ?? "PUBLISHED"))} tone="warning" /> : null}
      {unsaved.dirty ? <InlineFeedback title="لديك تعديلات غير محفوظة." tone="warning" /> : null}
      <fieldset className="grid gap-4 disabled:opacity-70" disabled={isProtected || !isHydrated}>
      <TextInput defaultValue={draft?.title ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="عنوان داخلي" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={draft?.platform ?? "linkedin"} disabled={isBusy} idPrefix={prefix} label="المنصة" name="platform">
          {socialPlatformValues.map((platform) => (
            <option key={platform} value={platform}>
              {labelFrom(socialPlatformLabels, platform)}
            </option>
          ))}
        </Select>
        <Select defaultValue={draft?.status ?? "DRAFT"} disabled={isBusy} idPrefix={prefix} label="الحالة" name="status">
          {allowedSocialDraftStatuses(canApprove, draft?.status).map((status) => (
            <option key={status} value={status}>
              {labelFrom(socialDraftStatusLabels, status)}
            </option>
          ))}
        </Select>
      </div>
      <Textarea className="min-h-36" defaultValue={draft?.content ?? ""} dir="auto" disabled={isBusy} idPrefix={prefix} label="المحتوى" name="content" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput defaultValue={draft?.sourceType ?? ""} disabled={isBusy} idPrefix={prefix} label="نوع المصدر" name="sourceType" />
        <TextInput defaultValue={draft?.sourceId ?? ""} disabled={isBusy} idPrefix={prefix} label="معرف المصدر" name="sourceId" />
      </div>
      <TextInput defaultValue={toDateTimeInput(draft?.scheduledAt)} disabled={isBusy} idPrefix={prefix} label="موعد الجدولة" name="scheduledAt" type="datetime-local" />
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses()}
        disabled={isBusy}
        type="submit"
      >
        {isEdit ? "حفظ المسودة" : "إنشاء مسودة"}
      </StatefulButton>
      </fieldset>
      <ActionFeedback message={message} />
    </form>
  );
}

export function AiSocialDraftForm({ idPrefix }: { idPrefix?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const prefix = idPrefix ?? "ai-social-draft";
  const unsaved = useUnsavedFormGuard();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setIsBusy(true);

    try {
      const response = await sendJson("/api/admin/content/social-drafts/ai", "POST", {
        title: textValue(formData, "title"),
        platform: textValue(formData, "platform"),
        sourceType: textValue(formData, "sourceType") || "manual",
        sourceId: textValue(formData, "sourceId"),
        sourceText: textValue(formData, "sourceText"),
        locale: textValue(formData, "locale") || "ar"
      });

      if (!response.ok) {
        setMessage({ tone: "error", text: await readMessage(response) });
        return;
      }

      form.reset();
      unsaved.markSaved();
      setMessage({ tone: "success", text: "تم توليد مسودة بالذكاء الاصطناعي وحفظها في حالة مراجعة قانونية." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onChangeCapture={unsaved.markDirty} onSubmit={submit}>
      {unsaved.dirty ? <InlineFeedback title="لديك تعديلات غير محفوظة." tone="warning" /> : null}
      <TextInput disabled={isBusy} idPrefix={prefix} label="عنوان المسودة" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="linkedin" disabled={isBusy} idPrefix={prefix} label="المنصة" name="platform">
          {socialPlatformValues.map((platform) => (
            <option key={platform} value={platform}>
              {labelFrom(socialPlatformLabels, platform)}
            </option>
          ))}
        </Select>
        <Select defaultValue="ar" disabled={isBusy} idPrefix={prefix} label="اللغة" name="locale">
          <option value="ar">العربية</option>
          <option value="en">الإنجليزية</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="sourceType" type="hidden" value="manual" />
        <TextInput defaultValue={sourceTypeDisplayLabel("manual")} disabled idPrefix={prefix} label="نوع المصدر" name="sourceTypeDisplay" />
        <TextInput disabled={isBusy} idPrefix={prefix} label="معرف المصدر" name="sourceId" />
      </div>
      <Textarea className="min-h-32" disabled={isBusy} idPrefix={prefix} label="المادة الخام للمسودة" name="sourceText" required />
      <StatefulButton
        aria-busy={isBusy}
        className={buttonClasses({ variant: "secondary" })}
        disabled={isBusy}
        type="submit"
      >
        توليد المسودة
      </StatefulButton>
      <ActionFeedback message={message} />
    </form>
  );
}
