"use client";

import { useMemo, useState } from "react";
import { Badge, ButtonLink, MaterialSymbol, TextInput } from "@/components/ui";
import { getPublicContent, type PublicContent } from "@/content/public-content";
import { normalizeText } from "@/lib/normalize-text";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import { publicGoldChip } from "@/features/public-site/public-components";
import {
  publicMotionArrow,
  publicMotionArrowTrail,
  publicMotionButton,
  publicMotionCardBeam,
  publicMotionControl,
  publicMotionCta,
  publicMotionFilterResults,
  publicMotionForm,
  publicMotionStatus
} from "@/features/public-site/public-motion";

export type DirectoryItem = {
  title: string;
  description: string;
  href: string;
  category: string;
  categoryLabel: string;
  meta?: string;
  chips?: readonly string[];
  searchText?: string;
};

const fieldScopeClasses =
  "[&_label]:text-[var(--kmt-public-muted)] [&_p[id$='-hint']]:text-[var(--kmt-public-muted)] [&_p[id$='-error']]:text-[var(--state-danger)]";

const controlClasses =
  cn(
    publicMotionControl,
    "!border-[var(--kmt-public-line)] !bg-[var(--kmt-public-surface)] !text-[var(--kmt-public-text)] placeholder:!text-[var(--kmt-public-muted)] focus:!border-kmt-gold focus:!ring-kmt-gold/25 disabled:!opacity-50"
  );

const clearButtonClasses =
  cn(
    "min-h-11 rounded border border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface)] px-4 py-2 text-sm font-semibold text-[var(--kmt-public-muted)] transition-colors hover:border-kmt-gold/60 hover:bg-kmt-gold/10 hover:text-[var(--kmt-public-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
    publicMotionButton,
    publicMotionCta
  );

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

  const normalizedQuery = normalizeText(query);
  const filteredItems = items.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    const text = normalizeText(`${item.title} ${item.description} ${item.categoryLabel} ${item.meta ?? ""} ${(item.chips ?? []).join(" ")} ${item.searchText ?? ""}`);
    return matchesCategory && (normalizedQuery.length === 0 || text.includes(normalizedQuery));
  });
  const hasActiveFilters = query.trim().length > 0 || category !== "all";
  const clearFilters = () => {
    setQuery("");
    setCategory("all");
  };
  const categoryButtonClasses = (active: boolean) =>
    cn(
      "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold",
      publicMotionButton,
      publicMotionCta,
      active
        ? "border-kmt-gold bg-kmt-gold text-primary-foreground"
        : "border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface)] text-[var(--kmt-public-muted)] hover:border-kmt-gold hover:bg-kmt-gold/10 hover:text-[var(--kmt-public-text)]"
    );

  return (
    <div>
      <div
        data-testid="public-directory-filter"
        className={cn(
          "grid gap-4 rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-surface-muted)] p-4 lg:grid-cols-[minmax(0,1fr)_auto]",
          publicMotionForm,
          fieldScopeClasses
        )}
      >
        <TextInput
          className={controlClasses}
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
              className={clearButtonClasses}
              type="button"
              onClick={clearFilters}
            >
              {content.shared.clearFilters}
            </button>
          ) : null}
        </div>
      </div>

      {filteredItems.length ? (
        <div className={cn("mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3", publicMotionFilterResults)}>
          {filteredItems.map((item) => (
            <article
              key={item.href}
              data-testid="public-directory-card"
              className={cn(publicMotionCardBeam, "kmt-motion-card group relative overflow-hidden rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-5 transition-[border-color,transform,box-shadow] duration-150 hover:border-kmt-gold/55 hover:[box-shadow:var(--kmt-public-panel-shadow)]")}
            >
              <div className="flex items-start justify-between gap-3">
                <Badge className={publicGoldChip}>{item.categoryLabel}</Badge>
                {item.meta ? (
                  <span className="text-xs text-[var(--kmt-public-muted)]">
                    <bdi>{item.meta}</bdi>
                  </span>
                ) : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-[var(--kmt-public-text)]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--kmt-public-muted)]">{item.description}</p>
              {item.chips?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.chips.slice(0, 5).map((chip) => (
                    <span key={chip} className={cn("rounded-full border px-3 py-1 text-xs font-semibold text-[var(--kmt-public-muted)]", publicGoldChip)}>
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
              <ButtonLink
                className={cn("mt-5 !border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground", publicMotionButton, publicMotionCta)}
                href={localizedPublicHref(item.href, locale)}
                size="sm"
                variant="secondary"
                trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}
              >
                {content.shared.viewDetails}
              </ButtonLink>
            </article>
          ))}
        </div>
      ) : (
        <div className={cn("mt-6 rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] p-6 text-[var(--kmt-public-muted)]", publicMotionStatus)} role="status">
          <h3 className="text-lg font-semibold text-[var(--kmt-public-text)]">{emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--kmt-public-muted)]">{dictionary.emptyDescription}</p>
          {hasActiveFilters ? (
            <button
              className={cn("mt-4", clearButtonClasses)}
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
