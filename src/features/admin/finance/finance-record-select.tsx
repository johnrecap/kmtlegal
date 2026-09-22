"use client";

import { Button, Select, TextInput } from "@/components/ui";
import { useEffect, useId, useRef, useState } from "react";
import { readAdminApiResponse } from "@/features/admin/shared/admin-api-error";
import { repairCopy } from "@/features/admin/shared/repair-copy";

type Option = { id: string; label: string };
type OptionPage = { items: Option[]; selected: Option | null; total: number; page: number; pageSize: number };

export function FinanceRecordSelect({ entity, name, label, initialOptions, defaultValue = "", required = false, disabled = false, emptyLabel, clientId = "" }: {
  entity: "clients" | "cases"; name: string; label: string; initialOptions: Option[]; defaultValue?: string;
  required?: boolean; disabled?: boolean; emptyLabel?: string; clientId?: string;
}) {
  const id = useId();
  const host = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [options, setOptions] = useState(initialOptions);
  const [selected, setSelected] = useState<Option | null>(initialOptions.find(option => option.id === defaultValue) ?? null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const previousDefault = useRef(defaultValue);
  const [clientFilter, setClientFilter] = useState(clientId);

  useEffect(() => {
    if (entity !== "cases") return;
    const form = host.current?.querySelector("select")?.form;
    const readClient = () => {
      const control = form?.elements.namedItem("clientId");
      const next = control instanceof HTMLSelectElement || control instanceof HTMLInputElement ? control.value : clientId;
      setClientFilter(next);
      setPage(1);
    };
    const changed = (event: Event) => {
      if ((event.target as HTMLSelectElement | null)?.name === "clientId") readClient();
    };
    const reset = () => { setClientFilter(clientId); setPage(1); };
    readClient();
    form?.addEventListener("change", changed);
    form?.addEventListener("reset", reset);
    return () => { form?.removeEventListener("change", changed); form?.removeEventListener("reset", reset); };
  }, [entity, clientId]);

  useEffect(() => {
    if (previousDefault.current === defaultValue) return;
    previousDefault.current = defaultValue;
    setSelectedId(defaultValue);
    setSelected(initialOptions.find(option => option.id === defaultValue) ?? null);
  }, [defaultValue, initialOptions]);

  useEffect(() => {
    const select = host.current?.querySelector("select");
    const restore = () => setSelectedId(select?.value ?? "");
    select?.addEventListener("change", restore);
    const form = select?.form;
    const reset = () => { setSelectedId(defaultValue); setSelected(initialOptions.find(option => option.id === defaultValue) ?? null); };
    form?.addEventListener("reset", reset);
    return () => { select?.removeEventListener("change", restore); form?.removeEventListener("reset", reset); };
  }, [defaultValue, initialOptions]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ entity, q: query, page: String(page), pageSize: "20", selectedId });
        if (entity === "cases" && clientFilter) params.set("clientId", clientFilter);
        const response = await fetch(`/api/admin/finance/options?${params}`, { signal: controller.signal, cache: "no-store" });
        const result = await readAdminApiResponse<OptionPage>(response);
        if (controller.signal.aborted) return;
        setSelected(result.selected);
        setOptions(previous => page === 1 ? result.items : Array.from(new Map([...previous, ...result.items].map(option => [option.id, option])).values()));
        setTotal(result.total);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : repairCopy.lookupError);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [entity, page, query, selectedId, retry, clientFilter]);

  const missingSelection = Boolean(selectedId && !selected && !options.some(option => option.id === selectedId));
  useEffect(() => {
    host.current?.querySelector("select")?.setCustomValidity(missingSelection ? repairCopy.unavailableSelection : "");
  }, [missingSelection]);
  const visible = Array.from(new Map([...(selected ? [selected] : []), ...options].map(option => [option.id, option])).values());

  return <div ref={host} className="space-y-2" aria-busy={loading}>
    <TextInput id={`${id}-search`} label={`${label} — ${repairCopy.lookup}`} type="search" value={query} disabled={disabled} onChange={event => { setQuery(event.target.value); setPage(1); }} />
    <Select id={`${id}-select`} name={name} label={label} required={required} disabled={disabled} value={selectedId} error={missingSelection ? repairCopy.unavailableSelection : error ?? undefined} onChange={event => { setSelectedId(event.target.value); setSelected(visible.find(option => option.id === event.target.value) ?? null); }}>
      <option value="">{emptyLabel ?? (required ? repairCopy.chooseClient : repairCopy.noCase)}</option>
      {missingSelection ? <option value={selectedId}>{repairCopy.unavailableSelection}</option> : null}
      {visible.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
    </Select>
    {error ? <Button type="button" variant="secondary" disabled={disabled || loading} onClick={() => setRetry(value => value + 1)}>{repairCopy.retry}</Button> : null}
    {page * 20 < total ? <Button type="button" variant="secondary" disabled={disabled || loading} onClick={() => { setLoading(true); setPage(value => value + 1); }}>{repairCopy.more}</Button> : null}
  </div>;
}
