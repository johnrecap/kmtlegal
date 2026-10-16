"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { conversationCopy } from "@/content/conversation-copy";
import type { PublicLocale } from "@/lib/public-locale";

export type OfficeContact = { phone: string; contactChannel: string; consentedAt: string };
export type OfficeContactInput = { phone: string | null; contactChannel: "PHONE" | "WHATSAPP" | null; consent: boolean };

export function OfficeContactDialog({ locale, contact, expiresAt, accountReady, canSave, error, onClose, onSave }: {
  locale: PublicLocale; contact: OfficeContact | null; expiresAt?: string; accountReady: boolean; canSave: boolean;
  onClose: () => void; onSave: (value: OfficeContactInput) => Promise<boolean>;
  error?: string;
}) {
  const copy = conversationCopy[locale];
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [channel, setChannel] = useState<"PHONE" | "WHATSAPP">(contact?.contactChannel === "WHATSAPP" ? "WHATSAPP" : "PHONE");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function save(value: OfficeContactInput) {
    setBusy(true); setFailed(false);
    try { if (await onSave(value)) onClose(); else setFailed(true); }
    finally { setBusy(false); }
  }
  return <Dialog open onClose={onClose} title={copy.contactTitle} closeLabel={copy.contactClose} description={copy.contactHelp}
    className="kmt-consultation-dialog consultation-contact-dialog">
    <div className="space-y-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      {!accountReady && <p className="text-sm leading-7">{copy.guestFollowup}</p>}
      {expiresAt && <p className="text-sm leading-7">{copy.expiry.replace("{date}", new Intl.DateTimeFormat(locale, { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" }).format(new Date(expiresAt)))}</p>}
      {!contact && <p className="text-sm leading-7">{copy.contactNone}</p>}
      {!canSave ? <p role="status">{copy.contactUnavailable}</p> : <form className="space-y-4 consultation-contacts" onSubmit={event => { event.preventDefault(); void save({ phone: phone.trim(), contactChannel: channel, consent }); }}>
        <label className="block space-y-2"><span>{copy.optionalPhone}</span><input type="tel" dir="ltr" autoComplete="tel" maxLength={24} required value={phone} onChange={event => { setPhone(event.target.value); setConsent(false); }} /></label>
        <label className="block space-y-2"><span>{copy.contactMethod}</span><select aria-label={copy.contactMethod} value={channel} onChange={event => { setChannel(event.target.value as "PHONE" | "WHATSAPP"); setConsent(false); }}><option value="PHONE">{copy.contactPhone}</option><option value="WHATSAPP">{copy.contactWhatsapp}</option></select></label>
        <label className="flex items-start gap-3 text-sm leading-7"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} />{copy.contactConsent}</label>
        {failed && <p role="alert">{error || copy.unavailable}</p>}
        <div className="flex flex-wrap gap-3"><Button type="submit" disabled={busy || !phone.trim() || !consent}>{busy ? copy.waiting : copy.contactSave}</Button>
          {contact && <Button type="button" variant="outline" disabled={busy} onClick={() => void save({ phone: null, contactChannel: null, consent: false })}>{copy.contactRemove}</Button>}</div>
      </form>}
    </div>
  </Dialog>;
}
