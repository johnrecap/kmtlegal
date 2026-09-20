"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type FocusCardItem = {
  title: string;
  /** e.g. lawyer role — always visible. */
  subtitle?: string;
  /** e.g. specialties — always visible. */
  meta?: string;
  src: string;
  href?: string;
};

/**
 * KMT-adapted Aceternity Focus Cards.
 *
 * People stay the focus: name + title remain readable at ALL times on a
 * permanent legibility gradient (upstream only reveals text on hover).
 * Non-hovered cards lose emphasis subtly via saturation/brightness only —
 * no aggressive blur, no heavy face darkening, no flip/tilt/3D. Keyboard
 * focus mirrors hover. Mobile stacks every card fully readable with no
 * hover dependency.
 */
export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: FocusCardItem;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => {
    const body = (
      <>
        <Image
          src={card.src}
          alt={card.title}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[rgb(var(--kmt-public-scrim)/0.92)] via-[rgb(var(--kmt-public-scrim)/0.25)] to-transparent"
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--kmt-public-gold)]/50 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xl font-semibold text-[var(--kmt-public-text)]">{card.title}</p>
          {card.subtitle ? (
            <p className="mt-1 text-sm text-[var(--kmt-public-gold)]">{card.subtitle}</p>
          ) : null}
          {card.meta ? (
            <p className="mt-2 text-xs leading-5 text-[var(--kmt-public-muted)]">{card.meta}</p>
          ) : null}
        </div>
      </>
    );

    const frameClass = cn(
      "relative block h-72 w-full overflow-hidden rounded-lg border border-kmt-gold/25 bg-[var(--kmt-public-panel)] transition-all duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kmt-gold motion-reduce:transition-none md:h-96",
      hovered !== null && hovered !== index && "saturate-[.6] brightness-90",
      hovered === index && "border-kmt-gold/60"
    );

    const handlers = {
      onMouseEnter: () => setHovered(index),
      onMouseLeave: () => setHovered(null),
      onFocus: () => setHovered(index),
      onBlur: () => setHovered(null),
    };

    return card.href ? (
      <Link href={card.href} className={frameClass} {...handlers}>
        {body}
      </Link>
    ) : (
      <div className={frameClass} {...handlers}>
        {body}
      </div>
    );
  }
);

Card.displayName = "Card";

export function FocusCards({ cards }: { cards: FocusCardItem[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="mx-auto grid w-full grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:max-w-5xl">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}
