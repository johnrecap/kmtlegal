import { CONSULTATION_TIMEZONE } from "./consultation-availability-service";

export function cairoDateString(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CONSULTATION_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function addCairoDays(date: string, offset: number) {
  const base = new Date(`${date}T12:00:00+03:00`);
  base.setUTCDate(base.getUTCDate() + offset);
  return cairoDateString(base);
}

export function cairoWeekday(date: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CONSULTATION_TIMEZONE,
    weekday: "short"
  }).formatToParts(new Date(`${date}T12:00:00+03:00`));
  const day = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}
