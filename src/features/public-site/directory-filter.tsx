"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, ButtonLink, MaterialSymbol, TextInput } from "@/components/ui";
import { BlurFade } from "@/components/ui/blur-fade";
import { Card as FocusCard } from "@/components/ui/focus-cards";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { getPublicContent, type PublicContent } from "@/content/public-content";
import { normalizeText } from "@/lib/normalize-text";
import { cn } from "@/lib/cn";
import { localizedPublicHref, type PublicLocale } from "@/lib/public-locale";
import { publicGoldChip, publicPhotoTreatment } from "@/features/public-site/public-components";
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
  /** Role line for people cards (team focus renderer only). */
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  imageSizes?: string;
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
  copy,
  layout = "cards",
  cardVariant = "cards"
}: {
  items: DirectoryItem[];
  searchLabel?: string;
  emptyTitle: string;
  locale?: PublicLocale;
  copy?: PublicContent["directoryFilter"];
  /** rows = equal editorial ledger (services index); cards = default grid. */
  layout?: "cards" | "rows";
  /**
   * cards = generic editorial cards (articles/case-studies default);
   * focus = Aceternity Focus Cards people grid (team index only).
   * Renderer-scoped: Articles/Case Studies never pass "focus".
   */
  cardVariant?: "cards" | "focus";
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
        layout === "rows" ? (
          <ol className={cn("mt-6 overflow-hidden rounded-lg", publicMotionFilterResults)}>
            {filteredItems.map((item, index) => (
              <li key={item.href} className={cn(index > 0 && "-mt-px")}>
                <BlurFade className="kmt-blur-fade" delay={Math.min(index, 5) * 0.06} direction="up">
                  {/*
                    Services rows: Aceternity Glowing Effect is the border
                    interaction layer (pointer-following gold border light).
                    Editorial content (numeral, category, linked title,
                    description, chips, meta, details CTA) is unchanged.
                  */}
                  <div
                    className={cn(
                      "relative overflow-hidden border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)]",
                      index === 0 && "rounded-t-lg",
                      index === filteredItems.length - 1 && "rounded-b-lg"
                    )}
                  >
                    <GlowingEffect
                      spread={28}
                      borderWidth={1}
                      variant="kmt-gold"
                      disabled={false}
                      proximity={120}
                      inactiveZone={0.5}
                    />
                    <article
                      data-testid="public-directory-card"
                      className="group relative grid gap-4 p-5 transition-colors duration-kmt-fast ease-kmt-out motion-reduce:transition-none sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-8"
                    >
                      <div className="flex items-center gap-4 lg:w-40 lg:flex-col lg:items-start lg:gap-3">
                        <span aria-hidden="true" className="text-sm font-semibold tabular-nums tracking-widest text-[var(--kmt-public-gold)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Badge className={publicGoldChip}>{item.categoryLabel}</Badge>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-semibold text-[var(--kmt-public-text)]">
                          <Link
                            className="rounded transition-colors group-hover:text-[var(--kmt-public-gold)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold"
                            href={localizedPublicHref(item.href, locale)}
                          >
                            {item.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-[var(--kmt-public-muted)]">{item.description}</p>
                        {item.chips?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.chips.slice(0, 5).map((chip) => (
                              <span key={chip} className={cn("rounded-full border border-kmt-gold/35 bg-kmt-gold/10 px-3 py-1 text-xs font-semibold text-[var(--kmt-public-muted)]")}>
                                {chip}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:w-44 lg:flex-col lg:items-end lg:justify-center lg:gap-2 lg:text-end">
                        {item.meta ? (
                          <span className="text-xs text-[var(--kmt-public-muted)]">
                            <bdi>{item.meta}</bdi>
                          </span>
                        ) : null}
                        <ButtonLink
                          className={cn("!border-kmt-gold/35 !text-[var(--kmt-public-text)] hover:!bg-kmt-gold hover:!text-primary-foreground", publicMotionButton, publicMotionCta)}
                          href={localizedPublicHref(item.href, locale)}
                          size="sm"
                          variant="secondary"
                          trailingIcon={<MaterialSymbol className={cn("text-base", publicMotionArrow, publicMotionArrowTrail)} name="arrow_forward" />}
                        >
                          {content.shared.viewDetails}
                        </ButtonLink>
                      </div>
                    </article>
                  </div>
                </BlurFade>
              </li>
            ))}
          </ol>
        ) : cardVariant === "focus" ? (
        <FocusCardsGrid items={filteredItems} locale={locale} />
        ) : (
        <div className={cn("mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3", publicMotionFilterResults)}>
          {filteredItems.map((item) => (
            <article
              key={item.href}
              data-testid="public-directory-card"
              className={cn(publicMotionCardBeam, "kmt-motion-card group relative overflow-hidden rounded-lg border border-[var(--kmt-public-line)] bg-[var(--kmt-public-panel)] transition-[border-color,transform,box-shadow] duration-150 hover:border-kmt-gold/55 hover:[box-shadow:var(--kmt-public-panel-shadow)]", item.image ? undefined : "p-5")}
            >
              {item.image ? (
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    alt={item.imageAlt ?? item.title}
                    className={publicPhotoTreatment}
                    fill
                    sizes={item.imageSizes ?? "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
                    src={item.image}
                  />
                </div>
              ) : null}
              <div className={item.image ? "p-5" : undefined}>
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
              </div>
            </article>
          ))}
        </div>
        )
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

/**
 * Team index people grid: Aceternity Focus Cards wired to real lawyer data
 * (photo pipeline, name, role, specialties, profile link). Renderer-scoped —
 * only used when `cardVariant="focus"` (team index). Touch/mobile: every
 * card is a real link with always-visible name + role; hover emphasis is a
 * desktop/pointer enhancement inside the vendored Card only.
 */
function FocusCardsGrid({ items, locale }: { items: DirectoryItem[]; locale: PublicLocale }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", publicMotionFilterResults)}>
      {items.map((item, index) =>
        item.image ? (
          <FocusCard
            key={item.href}
            index={index}
            hovered={hovered}
            setHovered={setHovered}
            card={{
              title: item.title,
              subtitle: item.subtitle ?? item.categoryLabel,
              meta: [...(item.chips ?? []).slice(0, 3), item.meta].filter(Boolean).join(" · "),
              src: item.image,
              href: localizedPublicHref(item.href, locale)
            }}
          />
        ) : null
      )}
    </div>
  );
}
