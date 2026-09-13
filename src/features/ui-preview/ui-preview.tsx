"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { KmtBrandLogo } from "@/components/brand";
import { getPublicContent } from "@/content/public-content";
import { getUiPreviewCopy } from "@/content/ui-preview-content";
import type { PublicLocale } from "@/lib/public-locale";
import styles from "./ui-preview.module.css";

type View = "home" | "service" | "booking";
type Mode = "ONLINE" | "PHONE" | "OFFICE";
type BookingStage = "service" | "method" | "details" | "slot" | "review";
const slots = ["10:00", "12:30", "15:00"] as const;

export function UiPreview() {
  const [locale, setLocale] = useState<PublicLocale>("en");
  const [view, setView] = useState<View>("home");
  const [serviceSlug, setServiceSlug] = useState("corporate-business-services");
  const [method, setMethod] = useState<Mode>("ONLINE");
  const [methodChosen, setMethodChosen] = useState(false);
  const [details, setDetails] = useState("");
  const [slot, setSlot] = useState("");
  const [unavailableSlot, setUnavailableSlot] = useState("");
  const [status, setStatus] = useState<"idle" | "conflict" | "confirmed">("idle");
  const [stage, setStage] = useState<BookingStage>("service");
  const dialog = useRef<HTMLDialogElement>(null);
  const content = getPublicContent(locale);
  const copy = getUiPreviewCopy(locale);
  const service = content.legalServices.find((item) => item.slug === serviceSlug) ?? content.legalServices[0];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const chooseView = (next: View) => { setView(next); setStatus("idle"); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const editStage = (next: BookingStage) => { const safeStage = next === "slot" && !methodChosen ? "method" : next === "slot" && !details ? "details" : next; setStatus("idle"); setStage(safeStage); dialog.current?.close(); window.setTimeout(() => document.querySelector<HTMLElement>(`[data-preview-stage="${safeStage}"]`)?.focus(), 0); };
  const summary = <RequestSummary copy={copy.booking} service={service.title} method={copy.booking[method.toLowerCase() as "online" | "phone" | "office"]} details={details} slot={slot} status={status} onEdit={editStage} />;

  return <main className={styles.preview} dir={locale === "ar" ? "rtl" : "ltr"}>
    <a className={styles.skip} href="#preview-main">{copy.skip}</a>
    <header className={styles.header}>
      <button className={styles.brand} onClick={() => chooseView("home")} type="button"><KmtBrandLogo label="KMT Legal" size="sm" /></button>
      <nav aria-label={copy.navigationLabel} className={styles.nav}>
        {(["home", "service", "booking"] as View[]).map((item) => <button aria-current={view === item ? "page" : undefined} className={view === item ? styles.activeNav : ""} key={item} onClick={() => chooseView(item)} type="button">{copy.navigation[item]}</button>)}
      </nav>
      <button className={styles.language} onClick={() => setLocale(locale === "en" ? "ar" : "en")} type="button">{copy.switchLanguage}</button>
    </header>
    <p className={styles.warning}>{copy.label}</p>
    <div id="preview-main">
      {view === "home" ? <Home content={content} copy={copy} chooseView={chooseView} setService={setServiceSlug} /> : null}
      {view === "service" ? <Service content={content} copy={copy} service={service} chooseView={chooseView} setService={setServiceSlug} /> : null}
      {view === "booking" ? <section className={styles.booking} aria-labelledby="booking-title"><div className={styles.bookingLead}><p className={styles.eyebrow}>{copy.booking.eyebrow}</p><h1 id="booking-title">{copy.booking.title}</h1><p>{copy.booking.lead}</p><p className={styles.sample}>{copy.booking.sample} · {copy.booking.noNetwork}</p><BookingForm content={content} copy={copy.booking} details={details} method={method} methodChosen={methodChosen} serviceSlug={serviceSlug} slot={slot} unavailableSlot={unavailableSlot} stage={stage} status={status} setDetails={setDetails} setMethod={setMethod} setMethodChosen={setMethodChosen} setService={setServiceSlug} setSlot={setSlot} setUnavailableSlot={setUnavailableSlot} setStage={setStage} setStatus={setStatus} /></div><aside className={styles.desktopSummary}>{summary}</aside><button className={styles.summaryOpener} onClick={() => dialog.current?.showModal()} type="button">{copy.booking.openSummary}</button><dialog aria-label={copy.booking.summary} className={styles.drawer} ref={dialog}><button className={styles.close} onClick={() => dialog.current?.close()} type="button">{copy.booking.close}</button>{summary}</dialog></section> : null}
    </div>
    <footer className={styles.footer}>{copy.footer}</footer>
  </main>;
}

function Home({ content, copy, chooseView, setService }: { content: ReturnType<typeof getPublicContent>; copy: ReturnType<typeof getUiPreviewCopy>; chooseView: (view: View) => void; setService: (slug: string) => void }) {
  return <><section className={styles.hero}><Image alt="" className={styles.heroImage} fill priority sizes="100vw" src="/stitch-assets/b392b48a7cb6b561.png"/><div className={styles.heroShade}/><div className={styles.heroCopy}><p className={styles.eyebrow}>{content.home.heroEyebrow}</p><h1>{content.home.heroTitle}</h1><p className={styles.lead}>{content.home.heroDescription}</p><div className={styles.actions}><button className={styles.primary} onClick={() => chooseView("booking")} type="button">{content.shared.bookConsultation}</button><button className={styles.secondary} onClick={() => chooseView("service")} type="button">{content.shared.browsePracticeAreas}</button></div></div><div className={styles.trust}>{content.home.trustItems.map((item) => <span key={item.label}>{item.label}</span>)}</div></section>
  <section className={styles.section}><p className={styles.eyebrow}>{copy.home.serviceEyebrow}</p><h2>{copy.home.serviceTitle}</h2><div className={styles.serviceList}>{content.legalServices.map((item, index) => <button className={styles.serviceRow} key={item.slug} onClick={() => { setService(item.slug); chooseView("service"); }} type="button"><span>0{index + 1}</span><strong>{item.title}</strong><p>{item.description}</p><b aria-hidden="true">↗</b></button>)}</div></section>
  <section className={styles.process}><div><p className={styles.eyebrow}>{copy.home.processEyebrow}</p><h2>{copy.home.processTitle}</h2><p>{content.home.approachDescription}</p></div><ol>{content.home.approachSteps.map((step) => <li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.summary}</p></div></li>)}</ol></section>
  <section className={styles.people}><div><p className={styles.eyebrow}>{copy.home.peopleEyebrow}</p><h2>{copy.home.peopleTitle}</h2></div><div className={styles.peopleRail}>{content.lawyers.map((lawyer) => <article key={lawyer.slug}><Image alt={lawyer.name} fill sizes="(min-width: 900px) 30vw, 80vw" src={lawyer.image}/><div><h3>{lawyer.name}</h3><p>{lawyer.title}</p></div></article>)}</div></section>
  <section className={styles.sectors}><p className={styles.eyebrow}>{copy.home.sectorsEyebrow}</p><h2>{copy.home.sectorsTitle}</h2><div>{content.publicIndustries.slice(0, 4).map((industry) => <article key={industry.title}><h3>{industry.title}</h3><p>{industry.summary}</p></article>)}</div></section></>;
}

function Service({ content, copy, service, chooseView, setService }: { content: ReturnType<typeof getPublicContent>; copy: ReturnType<typeof getUiPreviewCopy>; service: ReturnType<typeof getPublicContent>["legalServices"][number]; chooseView: (view: View) => void; setService: (slug: string) => void }) {
  return <section className={styles.serviceDetail}><div className={styles.serviceIntro}><p className={styles.eyebrow}>{copy.service.eyebrow}</p><h1>{service.title}</h1><p>{service.description}</p><button className={styles.primary} onClick={() => chooseView("booking")} type="button">{copy.service.next}</button></div><article className={styles.scope}><p className={styles.eyebrow}>{copy.service.included}</p><p>{service.content}</p><div>{service.outcomes.map((outcome) => <span key={outcome}>{outcome}</span>)}</div></article><aside className={styles.documents}><h2>{copy.service.documents}</h2><p>{copy.service.documentsNote}</p><ul>{service.requiredDocuments.map((item) => <li key={item}>{item}</li>)}</ul></aside><div className={styles.otherServices}>{content.legalServices.filter((item) => item.slug !== service.slug).slice(0, 3).map((item) => <button key={item.slug} onClick={() => setService(item.slug)} type="button">{item.title}</button>)}</div></section>;
}

function BookingForm({ content, copy, serviceSlug, method, methodChosen, details, slot, unavailableSlot, stage, status, setService, setMethod, setMethodChosen, setDetails, setSlot, setUnavailableSlot, setStage, setStatus }: { content: ReturnType<typeof getPublicContent>; copy: ReturnType<typeof getUiPreviewCopy>["booking"]; serviceSlug: string; method: Mode; methodChosen: boolean; details: string; slot: string; unavailableSlot: string; stage: BookingStage; status: "idle" | "conflict" | "confirmed"; setService: (value: string) => void; setMethod: (value: Mode) => void; setMethodChosen: (value: boolean) => void; setDetails: (value: string) => void; setSlot: (value: string) => void; setUnavailableSlot: (value: string) => void; setStage: (value: BookingStage) => void; setStatus: (value: "idle" | "conflict" | "confirmed") => void }) {
  const reset = () => setStatus("idle");
  const service = content.legalServices.find((item) => item.slug === serviceSlug) ?? content.legalServices[0];
  return <section className={styles.conversation} aria-label={copy.title}>
    <p className={styles.assistantMessage}>{copy.service}</p>
    {stage === "service" ? <div className={styles.quickChoices}>{content.legalServices.map((item, index) => <button autoFocus={index === 0} data-preview-stage="service" key={item.slug} onClick={() => { setService(item.slug); setSlot(""); reset(); setStage(methodChosen ? "details" : "method"); }} type="button">{item.title}</button>)}</div> : <p className={styles.userMessage}>{service.title}<button onClick={() => setStage("service")} type="button">{copy.edit}</button></p>}
    {stage !== "service" ? <><p className={styles.assistantMessage}>{copy.method}</p>{stage === "method" ? <div className={styles.quickChoices}>{(["ONLINE", "PHONE", "OFFICE"] as Mode[]).map((item, index) => <button autoFocus={index === 0} data-preview-stage="method" key={item} onClick={() => { setMethod(item); setMethodChosen(true); setSlot(""); reset(); setStage("details"); }} type="button">{copy[item.toLowerCase() as "online" | "phone" | "office"]}</button>)}</div> : <p className={styles.userMessage}>{copy[method.toLowerCase() as "online" | "phone" | "office"]}<button onClick={() => setStage("method")} type="button">{copy.edit}</button></p>}</> : null}
    {stage === "details" ? <><p className={styles.assistantMessage}>{copy.detailsHint}</p><label className={styles.replyComposer}><span>{copy.details}</span><textarea autoFocus data-preview-stage="details" onChange={(event) => { setDetails(event.target.value); reset(); }} placeholder={copy.detailsHint} value={details}/><button className={styles.primary} disabled={!details.trim()} onClick={() => setStage(slot ? "review" : "slot")} type="button">{copy.chooseSlot}</button></label></> : null}
    {["slot", "review"].includes(stage) ? <><p className={styles.userMessage}>{details || "—"}<button onClick={() => setStage("details")} type="button">{copy.edit}</button></p><p className={styles.assistantMessage}>{copy.slot}</p>{status === "conflict" ? <p className={styles.error} role="alert">{copy.conflictMessage}</p> : null}{stage === "slot" ? <div className={styles.quickChoices}>{slots.filter((item) => item !== unavailableSlot).map((item, index) => <button autoFocus={index === 0} data-preview-stage="slot" key={item} onClick={() => { setSlot(item); reset(); setStage("review"); }} type="button">{item}</button>)}</div> : <p className={styles.userMessage}>{slot}<button onClick={() => setStage("slot")} type="button">{copy.edit}</button></p>}</> : null}
    {stage === "review" ? <div className={styles.reviewPanel}><p className={styles.assistantMessage}>{copy.summary}</p>{status === "confirmed" ? <p className={styles.success} role="status"><strong>{copy.confirmed}</strong>{copy.confirmation}</p> : null}<div className={styles.formActions}><button className={styles.primary} disabled={!slot || !details || !methodChosen} onClick={() => setStatus("confirmed")} type="button">{copy.confirm}</button><button className={styles.secondary} disabled={!slot} onClick={() => { setUnavailableSlot(slot); setSlot(""); setStatus("conflict"); setStage("slot"); }} type="button">{copy.conflict}</button></div></div> : null}
  </section>;
}

function RequestSummary({ copy, service, method, details, slot, status, onEdit }: { copy: ReturnType<typeof getUiPreviewCopy>["booking"]; service: string; method: string; details: string; slot: string; status: "idle" | "conflict" | "confirmed"; onEdit: (stage: BookingStage) => void }) {
  return <section className={styles.summary}><p className={styles.eyebrow}>{copy.summary}</p><dl><SummaryItem label={copy.service} value={service} onEdit={() => onEdit("service")} edit={copy.edit}/><SummaryItem label={copy.method} value={method} onEdit={() => onEdit("method")} edit={copy.edit}/><SummaryItem label={copy.slot} value={slot || "—"} onEdit={() => onEdit("slot")} edit={copy.edit}/><SummaryItem label={copy.details} value={details || "—"} onEdit={() => onEdit("details")} edit={copy.edit}/></dl><p className={styles.noNetwork}>{copy.noNetwork}</p></section>;
}

function SummaryItem({ label, value, edit, onEdit }: { label: string; value: string; edit: string; onEdit: () => void }) {
  return <div><dt>{label}<button aria-label={`${edit}: ${label}`} onClick={onEdit} type="button">{edit}</button></dt><dd>{value}</dd></div>;
}
