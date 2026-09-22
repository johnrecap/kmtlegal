"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, InlineFeedback, MaterialSymbol, TextInput } from "@/components/ui";
import { buttonClasses } from "@/components/ui/button";
import { Button as StatefulButton } from "@/components/ui/stateful-button";
import { useInvalidFieldAccordion } from "@/components/admin/use-invalid-field-accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/animate-ui/components/radix/accordion";
import { cn } from "@/lib/cn";
import { consultationAvailabilityUiCopy as copy } from "@/lib/ui-copy";
import type { ConsultationAvailability, ConsultationMode } from "@/server/consultations/consultation-availability-service";
import { AdminApiError, readAdminApiResponse } from "@/features/admin/shared/admin-api-error";

const modeOptions: Array<{ value: ConsultationMode; label: string }> = [
  { value: "ONLINE", label: copy.modes.ONLINE },
  { value: "PHONE", label: copy.modes.PHONE },
  { value: "OFFICE", label: copy.modes.OFFICE }
];

export function ConsultationAvailabilityForm({ initialValue }: { initialValue: ConsultationAvailability }) {
  const router = useRouter();
  const [value, setValue] = useState<ConsultationAvailability>(initialValue);
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error"; message: string }>({ tone: "idle", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const enabledCount = useMemo(() => value.days.filter((day) => day.enabled).length, [value.days]);
  const dayGroups = useInvalidFieldAccordion({
    type: "multiple",
    defaultValue: value.days.map((day) => `day-${day.weekday}`)
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Client-side range check with validation auto-open: the failing
    // weekday group must never stay closed (mirrors the server end>start
    // rule before any fetch).
    const invalidDay = value.days.find((day) => day.enabled && day.end <= day.start);
    if (invalidDay) {
      dayGroups.onValueChange(
        dayGroups.value.includes(`day-${invalidDay.weekday}`)
          ? dayGroups.value
          : [...dayGroups.value, `day-${invalidDay.weekday}`]
      );
      setStatus({
        tone: "error",
        message: `وقت النهاية يجب أن يكون بعد وقت البداية في يوم ${copy.days[invalidDay.weekday]}.`
      });
      return;
    }
    setIsSaving(true);
    setStatus({ tone: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/consultation-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value)
      });
      const data = await readAdminApiResponse<{ value: ConsultationAvailability }>(response);
      if (!data?.value) {
        setStatus({ tone: "error", message: copy.saveFailed });
        return;
      }

      setValue(data.value);
      setStatus({ tone: "success", message: copy.saved });
      router.refresh();
    } catch (error) {
      setStatus({
        tone: "error",
        message: error instanceof AdminApiError ? error.message : copy.connectionFailed
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>{copy.rulesTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              idPrefix="consultation-availability-rules"
              label={copy.duration}
              min={15}
              max={240}
              name="slotDurationMinutes"
              type="number"
              value={value.slotDurationMinutes}
              onChange={(event) => updateNumber("slotDurationMinutes", event.target.value)}
            />
            <TextInput
              idPrefix="consultation-availability-rules"
              label={copy.leadTime}
              min={0}
              max={168}
              name="minLeadHours"
              type="number"
              value={value.minLeadHours}
              onChange={(event) => updateNumber("minLeadHours", event.target.value)}
            />
            <TextInput
              idPrefix="consultation-availability-rules"
              label={copy.bookingWindow}
              min={1}
              max={60}
              name="bookingWindowDays"
              type="number"
              value={value.bookingWindowDays}
              onChange={(event) => updateNumber("bookingWindowDays", event.target.value)}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {copy.timezone}: {value.timezone}. {copy.enabledDays}: {enabledCount}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.weeklyHours}</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" value={dayGroups.value} onValueChange={dayGroups.onValueChange} className="space-y-3">
            {value.days.map((day, index) => (
              <AccordionItem
                key={day.weekday}
                value={`day-${day.weekday}`}
                data-form-group={`day-${day.weekday}`}
                className="rounded border border-border bg-surface px-4"
              >
                <div className="flex items-center gap-3">
                  <input
                    checked={day.enabled}
                    className="h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-kmt-gold/30"
                    id={`consultation-availability-${day.weekday}-enabled`}
                    type="checkbox"
                    onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                    aria-label={copy.days[day.weekday]}
                  />
                  <AccordionTrigger className="flex-1 py-3 hover:no-underline">
                    <span className="flex flex-1 items-center justify-between gap-3 text-start text-sm font-semibold text-foreground">
                      <span>{copy.days[day.weekday]}</span>
                      <span className="font-normal text-muted-foreground">
                        {day.enabled ? `${day.start} - ${day.end}` : "متوقف"}
                      </span>
                    </span>
                  </AccordionTrigger>
                </div>
                <AccordionContent>
                  <div className="grid gap-4 pb-4 lg:grid-cols-[9rem_9rem_minmax(16rem,1fr)] lg:items-center">
                    <TextInput
                      disabled={!day.enabled}
                      idPrefix={`consultation-availability-${day.weekday}`}
                      label={copy.start}
                      name={`start-${day.weekday}`}
                      type="time"
                      value={day.start}
                      onChange={(event) => updateDay(index, { start: event.target.value })}
                    />
                    <TextInput
                      disabled={!day.enabled}
                      idPrefix={`consultation-availability-${day.weekday}`}
                      label={copy.end}
                      name={`end-${day.weekday}`}
                      type="time"
                      value={day.end}
                      onChange={(event) => updateDay(index, { end: event.target.value })}
                    />
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{copy.availableMethods}</p>
                      <div className="flex flex-wrap gap-2">
                        {modeOptions.map((mode) => (
                          <label
                            key={mode.value}
                            className={cn(
                              "inline-flex min-h-10 items-center gap-2 rounded border px-3 text-sm font-medium",
                              day.enabled ? "border-border bg-surface text-foreground" : "border-border bg-surface-muted text-muted-foreground"
                            )}
                          >
                            <input
                              checked={day.modes.includes(mode.value)}
                              disabled={!day.enabled}
                              id={`consultation-availability-${day.weekday}-${mode.value.toLowerCase()}`}
                              type="checkbox"
                              onChange={(event) => toggleMode(index, mode.value, event.target.checked)}
                            />
                            {mode.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {status.message ? <InlineFeedback title={status.message} tone={status.tone === "success" ? "success" : "error"} /> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <StatefulButton
          aria-busy={isSaving}
          className={buttonClasses()}
          disabled={isSaving}
          type="submit"
        >
          <MaterialSymbol name="save" />
          {copy.save}
        </StatefulButton>
      </div>
    </form>
  );

  function updateNumber(key: "slotDurationMinutes" | "minLeadHours" | "bookingWindowDays", rawValue: string) {
    setValue((current) => ({ ...current, [key]: Number(rawValue) }));
  }

  function updateDay(index: number, patch: Partial<ConsultationAvailability["days"][number]>) {
    setValue((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day))
    }));
  }

  function toggleMode(index: number, mode: ConsultationMode, checked: boolean) {
    setValue((current) => ({
      ...current,
      days: current.days.map((day, dayIndex) => {
        if (dayIndex !== index) {
          return day;
        }
        const modes = checked ? Array.from(new Set([...day.modes, mode])) : day.modes.filter((item) => item !== mode);
        return { ...day, modes: modes.length ? modes : [mode] };
      })
    }));
  }
}
