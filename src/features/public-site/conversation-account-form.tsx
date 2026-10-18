"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/field";
import { conversationCopy } from "@/content/conversation-copy";
import { getAuthContent } from "@/content/auth-content";
import { publicOfficeProfile } from "@/content/public-office-profile";
import type { PublicLocale } from "@/lib/public-locale";

export type RegistrationFields = { fullName: string; phone: string; email: string; password: string; confirmPassword: string };
export function ConversationAccountForm({ locale, initial, busy, authenticated, panelOpen, onRegister, onAttach }: {
  locale: PublicLocale; initial: Partial<RegistrationFields>; busy: boolean; authenticated: boolean; panelOpen: boolean;
  onRegister: (value: RegistrationFields) => Promise<boolean>; onAttach: () => void;
}) {
  const copy = conversationCopy[locale], auth = getAuthContent(locale).login;
  const [fields, setFields] = useState<RegistrationFields>({ fullName: initial.fullName ?? "", phone: initial.phone ?? "", email: initial.email ?? "", password: "", confirmPassword: "" });
  const [recovery, setRecovery] = useState(false), [visible, setVisible] = useState(false), [mismatch, setMismatch] = useState(false);
  useEffect(() => {
    if (!panelOpen) { setFields(current => ({ ...current, password: "", confirmPassword: "" })); setVisible(false); }
  }, [panelOpen]);
  useEffect(() => {
    setFields(current => ({ ...current, fullName: current.fullName || initial.fullName || "", phone: current.phone || initial.phone || "", email: current.email || initial.email || "" }));
  }, [initial.fullName, initial.phone, initial.email]);
  function update(key: keyof RegistrationFields, value: string) { setFields(current => ({ ...current, [key]: value })); setMismatch(false); }
  const loginHref = `/login?locale=${locale}&next=${encodeURIComponent(locale === "ar" ? "/ar/book-consultation" : "/book-consultation")}`;
  return <div className="space-y-4 border-t border-kmt-gold/20 pt-4">
    {authenticated ? <Button type="button" disabled={busy} onClick={onAttach}>{copy.attach}</Button> : <>
      <h3 className="font-semibold">{copy.register}</h3>
      <form className="space-y-4" onSubmit={async event => {
        event.preventDefault();
        if (busy) return;
        if (fields.password !== fields.confirmPassword) { setMismatch(true); return; }
        setVisible(false);
        if (await onRegister(fields)) setFields(current => ({ ...current, password: "", confirmPassword: "" }));
      }}>
        <p className="text-sm leading-7">{copy.registerIntro}</p>
        <TextInput label={copy.accountFields.fullName} name="fullName" autoComplete="name" minLength={2} maxLength={160} required value={fields.fullName} disabled={busy} onChange={event => update("fullName", event.target.value)} />
        <TextInput label={copy.accountFields.phone} name="phone" type="tel" autoComplete="tel" dir="ltr" maxLength={24} required value={fields.phone} disabled={busy} onChange={event => update("phone", event.target.value)} />
        <TextInput label={copy.email} name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} required value={fields.email} disabled={busy} onChange={event => update("email", event.target.value)} />
        <TextInput label={copy.signupPassword} name="password" type={visible ? "text" : "password"} autoComplete="new-password" minLength={10} maxLength={256} required value={fields.password} disabled={busy} hint={copy.passwordHint} onChange={event => update("password", event.target.value)}
          endAdornment={<Button type="button" variant="ghost" className="h-11 w-11 min-w-11 border-0 p-0" disabled={busy} aria-label={visible ? auth.hidePassword : auth.showPassword} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>} />
        <TextInput label={copy.confirmPassword} name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={256} required value={fields.confirmPassword} disabled={busy} error={mismatch ? copy.passwordMismatch : undefined} onChange={event => update("confirmPassword", event.target.value)} />
        <Button type="submit" className="h-auto min-h-11 whitespace-normal" disabled={busy}>{busy ? copy.registerWaiting : copy.registerSubmit}</Button>
      </form>
      <Link className="flex min-h-11 items-center underline" href={loginHref}>{copy.signIn}</Link>
    </>}
    <Button type="button" variant="ghost" onClick={() => setRecovery(value => !value)} aria-expanded={recovery}>{copy.forgotPassword}</Button>
    {recovery && <div className="space-y-2 text-sm leading-7"><p>{copy.recoveryHelp}</p><a className="inline-flex min-h-11 items-center underline" href={publicOfficeProfile.whatsappHref}>{copy.whatsapp}</a></div>}
  </div>;
}
