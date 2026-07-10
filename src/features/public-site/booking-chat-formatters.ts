import { findPublicService, getPublicContent } from "@/content/public-content";
import type { PublicLocale } from "@/lib/public-locale";

export function formatPublicDate(value: string, locale: PublicLocale) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(date);
}

export function formatPublicDay(value: string, locale: PublicLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "Africa/Cairo"
  }).format(date);
}

export function formatPublicTime(value: string, locale: PublicLocale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    timeStyle: "short",
    timeZone: "Africa/Cairo"
  }).format(date);
}

export function bookingModeLabel(value: string, locale: PublicLocale) {
  const labels = getPublicContent(locale).bookingForm.preferredModeLabels as Record<string, string>;
  return labels[value] ?? value;
}

export function formatServiceCategory(value: string, locale: PublicLocale) {
  if (!value) return "";
  const content = getPublicContent(locale);
  const bookingCategories = content.bookingForm.categories as Record<string, string>;
  const serviceCategories = content.serviceCategories as Record<string, string>;
  const service = findPublicService(locale, value);
  return bookingCategories[value] ?? serviceCategories[value] ?? service?.title ?? value;
}

export function formatPublicMoney(amount: string, currency: string, locale: PublicLocale) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || !currency) return [amount, currency].filter(Boolean).join(" ");

  try {
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch {
    return `${amount} ${currency}`.trim();
  }
}

export function groupSlotsByDay<T extends { startsAt: string }>(slots: T[], locale: PublicLocale) {
  const groups = new Map<string, { key: string; label: string; slots: T[] }>();
  for (const slot of slots) {
    const key = cairoDateKey(slot.startsAt);
    const existing = groups.get(key);
    if (existing) existing.slots.push(slot);
    else groups.set(key, { key, label: formatPublicDay(slot.startsAt, locale), slots: [slot] });
  }
  return Array.from(groups.values());
}

function cairoDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
