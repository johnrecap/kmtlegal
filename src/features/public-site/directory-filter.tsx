"use client";

import { useMemo, useState } from "react";
import { Badge, ButtonLink, MaterialSymbol, TextInput } from "@/components/ui";
import { getPublicContent, type PublicContent } from "@/content/public-content";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";

export type DirectoryItem = {
  title: string;
  description: string;
  href: string;
  category: string;
  categoryLabel: string;
  meta?: string;
};

const darkFieldScopeClasses =
  "[&_label]:text-amber-100 [&_p[id$='-hint']]:text-slate-300 [&_p[id$='-error']]:text-red-200";

const darkControlClasses =
  "!border-kmt-gold/25 !bg-black/30 !text-white placeholder:!text-amber-100/45 focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!border-white/10 disabled:!bg-black/40 disabled:!text-slate-500";

export function DirectoryFilter({
  items,
  searchLabel,
  emptyTitle,
  locale = "en",
  copy
}: {
  items: DirectoryItem[];
  searchLabel?: string;
  emptyTitle: string;
  locale?: PublicLocale;
  copy?: PublicContent["directoryFilter"];
}) {
  const content = getPublicContent(locale);
  const dictionary = copy ?? content.directoryFilter;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of items) {
      map.set(item.category, item.categoryLabel);
    }
    return Array.from(map.entries());
  }, [items]);

  const filteredItems = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const text = `${item.title} ${item.description} ${item.categoryLabel} ${item.meta ?? ""}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  });
  const hasActiveFilters = query.trim().length > 0 || category !== "all";
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };
  const categoryButtonClasses = (active: boolean) =>
    cn(
      "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
      active
        ? "border-kmt-gold bg-kmt-gold text-white shadow-[0_10px_28px_-18px_rgba(153,123,68,0.95)]"
        : "border-kmt-gold/25 bg-black/20 text-amber-100 hover:border-kmt-gold hover:bg-kmt-gold/10 hover:text-white"
    );

  return (
    <div>
      <div
        data-testid="public-directory-filter"
        className={cn(
          "grid gap-4 rounded-lg border border-kmt-gold/25 bg-[linear-gradient(145deg,#17110a_0%,#0b0c0e_48%,#050505_100%)] p-4 shadow-[0_28px_90px_-56px_rgba(0,0,0,0.95)] lg:grid-cols-[minmax(0,1fr)_auto]",
          darkFieldScopeClasses
        )}
      >
        <TextInput
          className={darkControlClasses}
          label={searchLabel ?? dictionary.defaultSearchLabel}
          name="public-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={dictionary.placeholder}
          value={query}
        />
        <div className="flex flex-wrap items-end gap-2">
          <button
            aria-pressed={category === "all"}
            className={categoryButtonClasses(category === "all")}
            type="button"
            onClick={() => setCategory("all")}
          >
            {dictionary.all}
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              aria-pressed={category === key}
              className={categoryButtonClasses(category === key)}
              type="button"
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
          {hasActiveFilters ? (
            <button
              className="min-h-11 rounded border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-kmt-gold/60 hover:bg-kmt-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
              type="button"
              onClick={clearFilters}
            >
              {content.shared.clearFilters}
            </button>
          ) : null}
        </div>
      </div>

      {filteredItems.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.href}
              data-testid="public-directory-card"
              className="group relative overflow-hidden rounded-lg border border-kmt-gold/20 bg-[linear-gradient(150deg,#15100a_0%,#0a0b0d_50%,#050505_100%)] p-5 shadow-[0_24px_80px_-54px_rgba(0,0,0,0.95)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-kmt-gold/55 hover:shadow-[0_30px_90px_-52px_rgba(153,123,68,0.55)]"
            >
              <div className="flex items-start justify-between gap-3">
                <Badge className="border-kmt-gold/35 bg-kmt-gold/10 text-amber-100">{item.categoryLabel}</Badge>
                {item.meta ? <span className="text-xs text-amber-100/70">{item.meta}</span> : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
              <ButtonLink
                className="mt-5 !border-kmt-gold/35 !text-amber-100 hover:!bg-kmt-gold hover:!text-white"
                href={localizedPublicHref(item.href, locale)}
                size="sm"
                variant="secondary"
                trailingIcon={<MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />}
              >
                {content.shared.viewDetails}
              </ButtonLink>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-kmt-gold/20 bg-[linear-gradient(150deg,#15100a_0%,#080808_100%)] p-6 text-slate-300" role="status">
          <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{dictionary.emptyDescription}</p>
          {hasActiveFilters ? (
            <button
              className="mt-4 min-h-11 rounded border border-kmt-gold/40 px-4 py-2 text-sm font-semibold text-amber-100 transition-colors hover:bg-kmt-gold hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
              type="button"
              onClick={clearFilters}
            >
              {content.shared.clearFilters}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
