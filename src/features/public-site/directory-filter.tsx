"use client";

import { useMemo, useState } from "react";
import { Badge, ButtonLink, MaterialSymbol, TextInput } from "@/components/ui";

export type DirectoryItem = {
  title: string;
  description: string;
  href: string;
  category: string;
  categoryLabel: string;
  meta?: string;
};

export function DirectoryFilter({ items, searchLabel = "ابحث", emptyTitle }: { items: DirectoryItem[]; searchLabel?: string; emptyTitle: string }) {
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

  return (
    <div>
      <div className="grid gap-4 rounded-lg border border-kmt-border bg-white p-4 lg:grid-cols-[1fr_auto]">
        <TextInput label={searchLabel} name="public-search" onChange={(event) => setQuery(event.target.value)} placeholder="اكتب كلمة بحث" value={query} />
        <div className="flex flex-wrap items-end gap-2">
          <button
            className={category === "all" ? "rounded-full bg-kmt-navy px-3 py-2 text-sm font-medium text-white" : "rounded-full border border-kmt-border px-3 py-2 text-sm font-medium text-kmt-muted"}
            type="button"
            onClick={() => setCategory("all")}
          >
            الكل
          </button>
          {categories.map(([key, label]) => (
            <button
              key={key}
              className={category === key ? "rounded-full bg-kmt-navy px-3 py-2 text-sm font-medium text-white" : "rounded-full border border-kmt-border px-3 py-2 text-sm font-medium text-kmt-muted"}
              type="button"
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filteredItems.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.href} className="rounded-lg border border-kmt-border bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge>{item.categoryLabel}</Badge>
                {item.meta ? <span className="text-xs text-kmt-muted">{item.meta}</span> : null}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-kmt-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-kmt-muted">{item.description}</p>
              <ButtonLink className="mt-5" href={item.href} size="sm" variant="secondary" trailingIcon={<MaterialSymbol className="text-base rtl:rotate-180" name="arrow_forward" />}>
                عرض التفاصيل
              </ButtonLink>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-kmt-border bg-white p-6" role="status">
          <h3 className="text-lg font-semibold text-kmt-ink">{emptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-kmt-muted">جرّب كلمة بحث مختلفة أو اختر تصنيفًا آخر.</p>
        </div>
      )}
    </div>
  );
}
