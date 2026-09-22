"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode, type FormEvent } from "react";
import { repairCopy } from "./repair-copy";

type DraftFields = Record<string, string | boolean>;
const DraftContext = createContext<Map<string, DraftFields> | null>(null);

export function FormDraftProvider({ children }: { children: ReactNode }) {
  const drafts = useRef(new Map<string, DraftFields>());
  return <DraftContext.Provider value={drafts.current}>{children}</DraftContext.Provider>;
}

export function useFormDraft(key: string) {
  const drafts = useContext(DraftContext);
  const formRef = useRef<HTMLFormElement>(null);
  const dirtyRef = useRef(false);
  const [restored, setRestored] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const saved = drafts?.get(key);
    if (!saved || !formRef.current) return;
    for (const control of Array.from(formRef.current.elements)) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) continue;
      const value = saved[control.name];
      if (value === undefined) continue;
      if (control instanceof HTMLInputElement && control.type === "checkbox") control.checked = Boolean(value);
      else {
        if (control instanceof HTMLSelectElement && value && !Array.from(control.options).some(option => option.value === String(value))) {
          control.add(new Option(repairCopy.unavailableSelection, String(value)));
        }
        control.value = String(value);
      }
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
    }
    dirtyRef.current = true;
    setDirty(true);
    setRestored(true);
  }, [drafts, key]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const guardLink = (event: MouseEvent) => {
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!dirtyRef.current || !anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || anchor.getAttribute("target") === "_blank") return;
      if (!window.confirm(repairCopy.unsaved)) {
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

  const capture = (event: FormEvent<HTMLFormElement>) => {
    const fields: DraftFields = {};
    for (const control of Array.from(event.currentTarget.elements)) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement) || !control.name) continue;
      if (control instanceof HTMLInputElement && ["password", "file"].includes(control.type)) continue;
      fields[control.name] = control instanceof HTMLInputElement && control.type === "checkbox" ? control.checked : control.value;
    }
    drafts?.set(key, fields);
    dirtyRef.current = true;
    setDirty(true);
  };
  const clear = () => {
    drafts?.delete(key);
    dirtyRef.current = false;
    setDirty(false);
    setRestored(false);
  };
  const discard = () => { formRef.current?.reset(); clear(); };
  return { formRef, capture, clear, discard, restored, dirty };
}
