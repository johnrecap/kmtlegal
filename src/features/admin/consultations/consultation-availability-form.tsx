"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, MaterialSymbol, TextInput } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ConsultationAvailability, ConsultationMode } from "@/server/consultations/consultation-availability-service";

type AvailabilityResponse = {
  data?: {
    value: ConsultationAvailability;
  };
  error?: {
    message?: string;
    requestId?: string;
  };
};

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const modeOptions: Array<{ value: ConsultationMode; label: string }> = [
  { value: "ONLINE", label: "Online" },
  { value: "PHONE", label: "Phone" },
  { value: "OFFICE", label: "Office" }
];

export function ConsultationAvailabilityForm({ initialValue }: { initialValue: ConsultationAvailability }) {
  const router = useRouter();
  const [value, setValue] = useState<ConsultationAvailability>(initialValue);
  const [status, setStatus] = useState<{ tone: "idle" | "success" | "error"; message: string }>({ tone: "idle", message: "" });
  const [isSaving, setIsSaving] = useState(false);

  const enabledCount = useMemo(() => value.days.filter((day) => day.enabled).length, [value.days]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setStatus({ tone: "idle", message: "" });

    try {
      const response = await fetch("/api/admin/consultation-availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value)
      });
      const body = (await response.json().catch(() => ({}))) as AvailabilityResponse;
      if (!response.ok || !body.data?.value) {
        const message = body.error?.requestId
          ? `${body.error.message ?? "Availability could not be saved."} (${body.error.requestId})`
          : body.error?.message ?? "Availability could not be saved.";
        setStatus({ tone: "error", message });
        return;
      }

      setValue(body.data.value);
      setStatus({ tone: "success", message: "Consultation availability was saved." });
      router.refresh();
    } catch {
      setStatus({ tone: "error", message: "Availability could not be saved. Check the connection and try again." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <Card>
        <CardHeader>
          <CardTitle>Consultation booking rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInput
              label="Consultation duration"
              min={15}
              max={240}
              name="slotDurationMinutes"
              type="number"
              value={value.slotDurationMinutes}
              onChange={(event) => updateNumber("slotDurationMinutes", event.target.value)}
            />
            <TextInput
              label="Minimum lead time"
              min={0}
              max={168}
              name="minLeadHours"
              type="number"
              value={value.minLeadHours}
              onChange={(event) => updateNumber("minLeadHours", event.target.value)}
            />
            <TextInput
              label="Days shown to client"
              min={1}
              max={60}
              name="bookingWindowDays"
              type="number"
              value={value.bookingWindowDays}
              onChange={(event) => updateNumber("bookingWindowDays", event.target.value)}
            />
          </div>
          <p className="mt-4 text-sm leading-6 text-kmt-muted">
            Timezone: {value.timezone}. Enabled working days: {enabledCount}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly consultation hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {value.days.map((day, index) => (
              <section key={day.weekday} className="rounded border border-slate-200 bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[minmax(11rem,1fr)_9rem_9rem_minmax(16rem,1fr)] lg:items-center">
                  <label className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-kmt-ink">
                    <input
                      checked={day.enabled}
                      className="h-4 w-4 rounded border-slate-300 text-kmt-navy focus:ring-kmt-gold/30"
                      type="checkbox"
                      onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                    />
                    <span>{dayLabels[day.weekday]}</span>
                  </label>
                  <TextInput
                    disabled={!day.enabled}
                    label="Start"
                    name={`start-${day.weekday}`}
                    type="time"
                    value={day.start}
                    onChange={(event) => updateDay(index, { start: event.target.value })}
                  />
                  <TextInput
                    disabled={!day.enabled}
                    label="End"
                    name={`end-${day.weekday}`}
                    type="time"
                    value={day.end}
                    onChange={(event) => updateDay(index, { end: event.target.value })}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-kmt-ink">Available methods</p>
                    <div className="flex flex-wrap gap-2">
                      {modeOptions.map((mode) => (
                        <label
                          key={mode.value}
                          className={cn(
                            "inline-flex min-h-10 items-center gap-2 rounded border px-3 text-sm font-medium",
                            day.enabled ? "border-slate-300 bg-white text-kmt-ink" : "border-slate-200 bg-slate-50 text-slate-400"
                          )}
                        >
                          <input
                            checked={day.modes.includes(mode.value)}
                            disabled={!day.enabled}
                            type="checkbox"
                            onChange={(event) => toggleMode(index, mode.value, event.target.checked)}
                          />
                          {mode.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>

      {status.message ? (
        <p
          className={cn(
            "rounded border px-4 py-3 text-sm",
            status.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
          )}
          role={status.tone === "error" ? "alert" : "status"}
        >
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button loading={isSaving} type="submit">
          <MaterialSymbol name="save" />
          Save availability
        </Button>
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
