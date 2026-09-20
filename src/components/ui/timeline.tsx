"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

/**
 * KMT-adapted Aceternity Timeline.
 *
 * Upstream ships a demo page header ("Changelog from my journey") and a
 * purple/blue progress beam on white. For KMT the header is removed (section
 * headers come from PublicSection), the rail is a low-alpha gold/neutral
 * line, progress is a restrained KMT-gold beam, and step markers are small
 * gold dots. Desktop gets scroll-linked progress; mobile renders a clear
 * vertical sequence; reduced motion shows the static rail with all steps
 * fully visible. Item containers stay minimal — no giant cards.
 */
export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full bg-transparent font-sans"
      ref={containerRef}
    >
      <div ref={ref} className="relative mx-auto max-w-7xl pb-10">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:gap-10 md:pt-16"
          >
            <div className="sticky z-40 flex max-w-xs flex-col items-center self-start top-28 md:w-full md:flex-row lg:max-w-sm">
              <div className="absolute start-3 flex h-10 w-10 items-center justify-center rounded-full border border-kmt-gold/30 bg-[var(--kmt-public-surface-muted)] md:start-3">
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--kmt-public-gold)]" />
              </div>
              <h3 className="hidden text-xl font-semibold text-[var(--kmt-public-text)] md:block md:ps-20 md:text-2xl ">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pe-4 ps-20 md:ps-4">
              <h3 className="mb-4 block text-start text-xl font-semibold text-[var(--kmt-public-text)] md:hidden">
                {item.title}
              </h3>
              {item.content}{" "}
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute start-8 top-0 w-[2px] overflow-hidden bg-[var(--kmt-public-line)] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:start-8 "
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className={cn(
              "absolute inset-x-0 top-0 w-[2px] rounded-full",
              "bg-gradient-to-t from-[var(--kmt-public-gold)] via-[var(--kmt-public-gold)]/70 to-transparent motion-reduce:opacity-100"
            )}
          />
        </div>
      </div>
    </div>
  );
};
