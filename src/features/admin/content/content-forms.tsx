"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button, InlineFeedback, Select, TextInput, Textarea } from "@/components/ui";
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
import { sourceTypeDisplayLabel } from "@/lib/ui-copy";

type ApiMessage = {
  error?: {
    message?: string;
  };
};

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
  const body = (await response.json().catch(() => ({}))) as ApiMessage;
  return body.error?.message ?? "تعذر تنفيذ الإجراء الآن.";
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
    <label className="flex items-start gap-3 rounded border border-kmt-border bg-white px-3 py-2 text-sm font-semibold leading-6 text-kmt-ink">
      <input className="mt-1 h-4 w-4 accent-kmt-navy" defaultChecked={defaultChecked} disabled={disabled} id={`${idPrefix}-${name}`} name={name} type="checkbox" />
      <span>{label}</span>
    </label>
  );
}

function allowedArticleStatuses(canApprove: boolean) {
  return articleStatusValues.filter((status) => canApprove || !["PUBLISHED", "ARCHIVED"].includes(status));
}

function allowedCaseStudyStatuses(canApprove: boolean) {
  return caseStudyStatusValues.filter((status) => canApprove || !["APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status));
}

function allowedSocialDraftStatuses(canApprove: boolean) {
  return socialDraftStatusValues.filter((status) => canApprove || !["APPROVED", "SCHEDULED", "PUBLISHED", "REJECTED", "ARCHIVED"].includes(status));
}

export function ArticleForm({ article, canApprove }: { article?: ArticleValue; canApprove: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isEdit = Boolean(article?.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
        event.currentTarget.reset();
      }
      setMessage({ tone: "success", text: isEdit ? "تم حفظ المقال." : "تم إنشاء المقال." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput defaultValue={article?.title ?? ""} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="عنوان المقال" name="title" required />
      <TextInput defaultValue={article?.slug ?? ""} disabled={isBusy} hint="صيغة lowercase-kebab-case مثل contract-risk-basics." idPrefix={`article-${article?.id ?? "create"}`} label="معرّف الرابط (Slug)" name="slug" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={article?.locale ?? "en"} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="لغة المحتوى" name="locale">
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
        <TextInput defaultValue={article?.category ?? ""} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="التصنيف" name="category" required />
      </div>
      <Textarea defaultValue={article?.excerpt ?? ""} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="الملخص" name="excerpt" required />
      <Textarea className="min-h-48" defaultValue={article?.content ?? ""} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="المحتوى" name="content" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={article?.status ?? "DRAFT"} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="الحالة" name="status">
          {allowedArticleStatuses(canApprove).map((status) => (
            <option key={status} value={status}>
              {labelFrom(articleStatusLabels, status)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateInput(article?.publishedAt)} disabled={isBusy} idPrefix={`article-${article?.id ?? "create"}`} label="تاريخ النشر" name="publishedAt" type="date" />
      </div>
      <Button loading={isBusy} type="submit">
        {isEdit ? "حفظ المقال" : "إنشاء مقال"}
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}

export function CaseStudyForm({ study, canApprove }: { study?: CaseStudyValue; canApprove: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isEdit = Boolean(study?.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
        event.currentTarget.reset();
      }
      setMessage({ tone: "success", text: isEdit ? "تم حفظ دراسة الحالة." : "تم إنشاء دراسة الحالة." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput defaultValue={study?.title ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="عنوان دراسة الحالة" name="title" required />
      <TextInput defaultValue={study?.slug ?? ""} disabled={isBusy} hint="صيغة lowercase-kebab-case." idPrefix={`case-study-${study?.id ?? "create"}`} label="معرّف الرابط (Slug)" name="slug" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={study?.locale ?? "en"} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="لغة المحتوى" name="locale">
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </Select>
        <TextInput defaultValue={study?.category ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="التصنيف" name="category" required />
      </div>
      <Textarea defaultValue={study?.challenge ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="التحدي" name="challenge" required />
      <Textarea defaultValue={study?.approach ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="طريقة التعامل" name="approach" required />
      <Textarea defaultValue={study?.generalOutcome ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="النتيجة العامة" name="generalOutcome" required />
      <Textarea defaultValue={study?.lessons ?? ""} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="الدروس" name="lessons" required />
      <CheckboxField defaultChecked={study?.isAnonymized ?? false} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="تمت مراجعة إخفاء الهوية ولا توجد أسماء عملاء أو أرقام قضايا أو بيانات اتصال." name="isAnonymized" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={study?.status ?? "DRAFT"} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="الحالة" name="status">
          {allowedCaseStudyStatuses(canApprove).map((status) => (
            <option key={status} value={status}>
              {labelFrom(caseStudyStatusLabels, status)}
            </option>
          ))}
        </Select>
        <TextInput defaultValue={toDateInput(study?.publishedAt)} disabled={isBusy} idPrefix={`case-study-${study?.id ?? "create"}`} label="تاريخ النشر" name="publishedAt" type="date" />
      </div>
      <Button loading={isBusy} type="submit">
        {isEdit ? "حفظ دراسة الحالة" : "إنشاء دراسة حالة"}
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}

export function SocialDraftForm({ draft, canApprove }: { draft?: SocialDraftValue; canApprove: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const isEdit = Boolean(draft?.id);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
        event.currentTarget.reset();
      }
      setMessage({ tone: "success", text: isEdit ? "تم حفظ مسودة السوشيال." : "تم إنشاء مسودة السوشيال." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput defaultValue={draft?.title ?? ""} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="عنوان داخلي" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue={draft?.platform ?? "linkedin"} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="المنصة" name="platform">
          {socialPlatformValues.map((platform) => (
            <option key={platform} value={platform}>
              {labelFrom(socialPlatformLabels, platform)}
            </option>
          ))}
        </Select>
        <Select defaultValue={draft?.status ?? "DRAFT"} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="الحالة" name="status">
          {allowedSocialDraftStatuses(canApprove).map((status) => (
            <option key={status} value={status}>
              {labelFrom(socialDraftStatusLabels, status)}
            </option>
          ))}
        </Select>
      </div>
      <Textarea className="min-h-36" defaultValue={draft?.content ?? ""} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="المحتوى" name="content" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextInput defaultValue={draft?.sourceType ?? ""} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="نوع المصدر" name="sourceType" />
        <TextInput defaultValue={draft?.sourceId ?? ""} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="معرف المصدر" name="sourceId" />
      </div>
      <TextInput defaultValue={toDateTimeInput(draft?.scheduledAt)} disabled={isBusy} idPrefix={`social-draft-${draft?.id ?? "create"}`} label="موعد الجدولة" name="scheduledAt" type="datetime-local" />
      <Button loading={isBusy} type="submit">
        {isEdit ? "حفظ المسودة" : "إنشاء مسودة"}
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}

export function AiSocialDraftForm() {
  const router = useRouter();
  const [message, setMessage] = useState<ActionMessage | null>(null);
  const [isBusy, setIsBusy] = useState(false);

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
      setMessage({ tone: "success", text: "تم توليد مسودة بالذكاء الاصطناعي وحفظها في حالة مراجعة قانونية." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "لا يمكن الوصول إلى الخادم الآن." });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <TextInput disabled={isBusy} idPrefix="ai-social-draft" label="عنوان المسودة" name="title" required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select defaultValue="linkedin" disabled={isBusy} idPrefix="ai-social-draft" label="المنصة" name="platform">
          {socialPlatformValues.map((platform) => (
            <option key={platform} value={platform}>
              {labelFrom(socialPlatformLabels, platform)}
            </option>
          ))}
        </Select>
        <Select defaultValue="ar" disabled={isBusy} idPrefix="ai-social-draft" label="اللغة" name="locale">
          <option value="ar">العربية</option>
          <option value="en">الإنجليزية</option>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="sourceType" type="hidden" value="manual" />
        <TextInput defaultValue={sourceTypeDisplayLabel("manual")} disabled idPrefix="ai-social-draft" label="نوع المصدر" name="sourceTypeDisplay" />
        <TextInput disabled={isBusy} idPrefix="ai-social-draft" label="معرف المصدر" name="sourceId" />
      </div>
      <Textarea className="min-h-32" disabled={isBusy} idPrefix="ai-social-draft" label="المادة الخام للمسودة" name="sourceText" required />
      <Button loading={isBusy} type="submit" variant="secondary">
        توليد المسودة
      </Button>
      <ActionFeedback message={message} />
    </form>
  );
}
