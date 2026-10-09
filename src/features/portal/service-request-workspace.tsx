"use client";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { serviceRequestCopy } from "@/content/service-request-copy";

type Locale = "ar" | "en";
type Kind = keyof typeof serviceRequestCopy.en.kinds;
type Status = keyof typeof serviceRequestCopy.en.statuses;
type Intake = { title: string; purpose: string; language: "ar" | "en" | "both"; requestedDate: string; answers: Record<string, string> };
export type ServiceRequestView = {
  id: string; reference: string; kind: string; status: string; revision: number; quoteVersion: number; paymentId: string | null; clientId?: string; conversationThreadId?: string | null; sourceRequestId?: string | null;
  intake: Intake; quote: { amount: string; currency: string; scope: string; durationDays: number } | null;
  questionnaire: { version: number; questions: Array<{ id: string; ar: string; en: string }> } | null;
  documents: Array<{ id: string; fileName: string; deliveryVersion: number | null; createdAt: string }>;
  events: Array<{ id: string; action: string; body: string | null; internal: boolean; createdAt: string }>;
};
const field = "min-h-11 w-full min-w-0 rounded-lg border border-input bg-surface p-3 text-foreground";
const panel = "min-w-0 rounded-xl border border-border bg-surface p-5 space-y-4";

export function NewServiceRequest({ locale, verified, healthAvailable, sourceRequestId }: { locale: Locale; verified: boolean; healthAvailable: boolean; sourceRequestId?: string }) {
  const copy = serviceRequestCopy[locale]; const router = useRouter();
  const [kind, setKind] = useState<Kind>("CONTRACT_DRAFT"); const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  const key = useRef<string | null>(null);
  async function create(event: FormEvent) {
    event.preventDefault(); key.current ??= crypto.randomUUID(); setBusy(true); setError(false);
    try { const response = await fetch("/api/service-requests", { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify({ kind, locale, idempotencyKey: key.current, sourceRequestId }) });
      if (!response.ok) throw new Error(); const result = await response.json(); router.push(`/client/requests/services/${result.data.id}`);
    } catch { setError(true); setBusy(false); }
  }
  return <form onSubmit={create} className={panel}><h2 className="text-xl font-semibold">{sourceRequestId ? copy.followup : copy.newRequest}</h2>
    {!verified ? <p>{copy.verify} <Link className="underline" href="/client/assistant">KMT</Link></p> : <>
      <label>{copy.newRequest}<select className={field} disabled={busy} value={kind} onChange={e => { setKind(e.target.value as Kind); key.current = null; }}>{Object.entries(copy.kinds).map(([value, label]) => <option key={value} value={value} disabled={value === "HEALTH_CHECK" && !healthAvailable}>{label}</option>)}</select></label>
      <Button type="submit" disabled={busy}>{copy.create}</Button></>}
    {!healthAvailable && <p className="text-sm text-muted-foreground">{copy.healthPending}</p>}{error && <p role="alert">{copy.failed}</p>}
  </form>;
}

export function ServiceRequestWorkspace({ value, locale, staff = false, manager = false, canQuote = false, canWork = false, staffLinks = { client: false, conversation: false, finance: false }, lawyers = [] }: { value: ServiceRequestView; locale: Locale; staff?: boolean; manager?: boolean; canQuote?: boolean; canWork?: boolean; staffLinks?: { client: boolean; conversation: boolean; finance: boolean }; lawyers?: Array<{ id: string; name: string }> }) {
  const copy = serviceRequestCopy[locale]; const router = useRouter(); const [intake, setIntake] = useState(value.intake);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const terminal = ["COMPLETED", "CANCELLED"].includes(value.status); const editable = !staff && ["DRAFT", "NEEDS_INFORMATION"].includes(value.status);
  async function act(body: Record<string, unknown>) {
    setBusy(true); setNotice("");
    try { const response = await fetch(`/api/service-requests/${value.id}`, { method: "POST", headers: { "Content-Type": "application/json", "x-kmt-locale": locale }, body: JSON.stringify({ ...body, revision: value.revision }) }); if (!response.ok) throw new Error(); setNotice(copy.saved); router.refresh(); }
    catch { setNotice(copy.failed); } finally { setBusy(false); }
  }
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); data.set("serviceRequestId", value.id); data.set("category", value.kind === "HEALTH_CHECK" ? "OTHER" : "CONTRACT"); setBusy(true); setNotice("");
    try { const response = await fetch("/api/files/upload", { method: "POST", body: data }); if (!response.ok) throw new Error(); setNotice(copy.saved); router.refresh(); } catch { setNotice(copy.failed); } finally { setBusy(false); }
  }
  function submitForm(event: FormEvent<HTMLFormElement>, build: (data: FormData) => Record<string, unknown>) { event.preventDefault(); void act(build(new FormData(event.currentTarget))); }
  return <div className="grid min-w-0 gap-5" dir={locale === "ar" ? "rtl" : "ltr"}>
    <Link className="underline" href={staff ? "/admin/service-requests" : "/client/requests"}>{copy.back}</Link>
    {staff && staffLinks.client && value.clientId && <Link className="underline" href={`/admin/clients/${value.clientId}`}>{copy.client}</Link>}
    {staff && staffLinks.conversation && value.conversationThreadId && <Link className="underline" href={`/admin/messages/${value.conversationThreadId}`}>{copy.notes}</Link>}
    {value.sourceRequestId && <Link className="underline" href={staff ? `/admin/service-requests/${value.sourceRequestId}` : `/client/requests/services/${value.sourceRequestId}`}>{copy.source}</Link>}
    <div className={panel}><h1 className="text-2xl font-semibold">{copy.kinds[value.kind as Kind]}</h1><p className="break-all" dir="ltr">{value.reference}</p><p>{copy.statuses[value.status as Status]}</p></div>
    {notice && <p role="status" className={panel}>{notice}</p>}
    <form className={panel} onSubmit={e => { e.preventDefault(); void act({ action: "save", intake }); }}>
      <label className="block">{copy.name}<input className={field} value={intake.title} maxLength={180} disabled={!editable || busy} onChange={e => setIntake({ ...intake, title: e.target.value })} /></label>
      <label className="block">{copy.purpose}<textarea className={`${field} min-h-32`} value={intake.purpose} maxLength={5000} disabled={!editable || busy} onChange={e => setIntake({ ...intake, purpose: e.target.value })} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><label>{copy.language}<select className={field} value={intake.language} disabled={!editable || busy} onChange={e => setIntake({ ...intake, language: e.target.value as Intake["language"] })}>{Object.entries(copy.languages).map(([key, text]) => <option value={key} key={key}>{text}</option>)}</select></label>
        <label>{copy.requestedDate}<input type="date" className={field} value={intake.requestedDate} disabled={!editable || busy} onChange={e => setIntake({ ...intake, requestedDate: e.target.value })} /></label></div>
      {value.questionnaire && <fieldset className="space-y-4"><legend>{copy.kinds.HEALTH_CHECK} · {value.questionnaire.version}</legend><p>{copy.healthHint}</p>{value.questionnaire.questions.map(question => <label className="block" key={question.id}>{question[locale]}<select className={field} value={intake.answers[question.id] ?? ""} disabled={!editable || busy} onChange={e => { const answers = { ...intake.answers }; if (e.target.value) answers[question.id] = e.target.value; else delete answers[question.id]; setIntake({ ...intake, answers }); }}><option value="">{copy.unanswered}</option>{Object.entries(copy.answers).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>)}<p className="text-sm">{copy.noAutomatedResult}</p></fieldset>}
      {editable && <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy}>{copy.save}</Button><Button type="button" disabled={busy || JSON.stringify(intake) !== JSON.stringify(value.intake)} onClick={() => void act({ action: "submit" })}>{copy.submit}</Button></div>}
    </form>
    {value.quote && <section className={panel}><h2 className="text-xl font-semibold">{copy.quote} · {value.quoteVersion}</h2><p className="whitespace-pre-wrap break-words">{value.quote.scope}</p><p>{copy.amount}: <bdi>{value.quote.amount} {value.quote.currency}</bdi></p><p>{copy.duration}: {value.quote.durationDays}</p>{!staff && value.status === "AWAITING_ACCEPTANCE" && <Button disabled={busy} onClick={() => void act({ action: "accept", quoteVersion: value.quoteVersion })}>{copy.accept}</Button>}{value.paymentId && (!staff || staffLinks.finance) && <Link className="block underline" href={staff ? `/admin/finance?editPaymentId=${value.paymentId}` : "/client/payments"}>{copy.invoice}</Link>}</section>}
    <section className={panel}><h2 className="text-xl font-semibold">{copy.files}</h2><ul className="space-y-3">{value.documents.map(document => <li className="break-words" key={document.id}><a className="underline" href={`/api/files/${document.id}/download`}>{document.fileName}</a>{document.deliveryVersion && <span> · {copy.version} {document.deliveryVersion}</span>} <time className="text-sm text-muted-foreground">{new Date(document.createdAt).toLocaleDateString(locale)}</time></li>)}</ul>
      {!terminal && (!staff || canWork) && <form className="space-y-3" onSubmit={upload}><label className="block">{copy.upload}<input className={field} type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" required disabled={busy} /></label><p className="text-sm">{copy.fileHelp}</p>{staff && value.status === "IN_PROGRESS" && <label className="flex items-center gap-3"><input type="checkbox" name="delivery" value="true" />{copy.delivery}</label>}<Button disabled={busy} type="submit">{copy.upload}</Button></form>}
    </section>
    {staff && manager && !terminal && <form className={panel} onSubmit={e => submitForm(e, data => ({ action: "assign", lawyerId: data.get("lawyerId") }))}><label>{copy.lawyer}<select className={field} required name="lawyerId" disabled={busy}><option value="">{copy.choose}</option>{lawyers.map(lawyer => <option key={lawyer.id} value={lawyer.id}>{lawyer.name}</option>)}</select></label><Button type="submit" disabled={busy}>{copy.assign}</Button></form>}
    {staff && canQuote && ["RECEIVED", "NEEDS_INFORMATION", "AWAITING_ACCEPTANCE"].includes(value.status) && <form className={panel} onSubmit={e => submitForm(e, data => ({ action: "quote", quote: { amount: data.get("amount"), currency: data.get("currency"), scope: data.get("scope"), durationDays: Number(data.get("duration")) } }))}>
      <h2 className="text-xl font-semibold">{copy.quote}</h2><label>{copy.amount}<input className={field} name="amount" inputMode="decimal" required pattern="[0-9]+([.][0-9]{1,2})?" /></label><label>{copy.currency}<select className={field} name="currency">{["EGP", "USD", "EUR", "SAR", "AED"].map(currency => <option key={currency}>{currency}</option>)}</select></label><label>{copy.scope}<textarea className={field} name="scope" minLength={10} maxLength={6000} required /></label><label>{copy.duration}<input className={field} name="duration" type="number" min={1} max={365} required /></label><Button type="submit" disabled={busy}>{copy.sendQuote}</Button>
    </form>}
    <section className={panel}><h2 className="text-xl font-semibold">{copy.notes}</h2>{value.events.filter(event => event.body).map(event => <div key={event.id} className="border-b border-border py-3"><p className="whitespace-pre-wrap break-words">{event.body}</p>{event.internal && <small>{copy.internal}</small>}<time className="block text-sm">{new Date(event.createdAt).toLocaleString(locale)}</time></div>)}
      {!terminal && (!staff || canWork) && <form className="space-y-3" onSubmit={e => submitForm(e, data => ({ action: "message", body: data.get("body"), internal: data.get("internal") === "on" }))}><label>{copy.message}<textarea className={field} name="body" required maxLength={5000} /></label>{staff && <label className="flex items-center gap-3"><input type="checkbox" name="internal" />{copy.internal}</label>}<Button type="submit" disabled={busy}>{copy.send}</Button></form>}
    </section>
    {!terminal && (staff ? canWork : value.status !== "IN_PROGRESS") && <form className={panel} onSubmit={e => submitForm(e, data => ({ action: "transition", status: data.get("status"), body: data.get("body") }))}>
      <label>{copy.changeStatus}<select className={field} name="status" required><option value="">{copy.choose}</option>{(staff ? (value.status === "IN_PROGRESS" ? ["READY", "CANCELLED"] : value.status === "READY" ? ["IN_PROGRESS", "COMPLETED", "CANCELLED"] : value.status === "RECEIVED" || value.status === "AWAITING_ACCEPTANCE" ? ["NEEDS_INFORMATION", "CANCELLED"] : ["CANCELLED"]) : value.status === "READY" ? ["IN_PROGRESS", "COMPLETED"] : ["DRAFT", "RECEIVED", "NEEDS_INFORMATION", "AWAITING_ACCEPTANCE"].includes(value.status) ? ["CANCELLED"] : []).map(status => <option key={status} value={status}>{!staff && status === "IN_PROGRESS" ? copy.revision : copy.statuses[status as Status]}</option>)}</select></label><label>{copy.reason}<textarea className={field} name="body" maxLength={5000} /></label><Button type="submit" disabled={busy}>{copy.changeStatus}</Button>
    </form>}
    {!staff && value.kind === "HEALTH_CHECK" && ["READY", "COMPLETED"].includes(value.status) && <NewServiceRequest locale={locale} verified healthAvailable={false} sourceRequestId={value.id} />}
  </div>;
}

export function QuestionnairePublisher() {
  const copy = serviceRequestCopy.ar; const [questions, setQuestions] = useState([{ id: "question_1", ar: "", en: "" }]); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const router = useRouter();
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); try { const response = await fetch("/api/admin/health-questionnaire", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questions, approved: true }) }); if (!response.ok) throw new Error(); setNotice(copy.saved); router.refresh(); } catch { setNotice(copy.failed); } finally { setBusy(false); } }
  return <form className={panel} onSubmit={submit}><h2 className="text-xl font-semibold">{copy.questionnaire}</h2>{questions.map((question, index) => <div className="grid gap-3 sm:grid-cols-2" key={question.id}>{(["ar", "en"] as const).map(locale => <label key={locale}>{locale === "ar" ? copy.questionAr : copy.questionEn} {index + 1}<input className={field} dir={locale === "ar" ? "rtl" : "ltr"} required minLength={5} maxLength={500} value={question[locale]} onChange={e => setQuestions(questions.map((q, i) => i === index ? { ...q, [locale]: e.target.value } : q))} /></label>)}</div>)}<Button type="button" disabled={busy || questions.length >= 60} onClick={() => setQuestions([...questions, { id: `question_${questions.length + 1}`, ar: "", en: "" }])}>{copy.addQuestion}</Button><label className="flex items-center gap-3"><input type="checkbox" required />{copy.approve}</label><Button type="submit" disabled={busy}>{copy.publish}</Button>{notice && <p role="status">{notice}</p>}</form>;
}
