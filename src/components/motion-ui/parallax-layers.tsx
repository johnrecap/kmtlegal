"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const PROGRESS_VAR = "--px-progress";
const LAYER_TRAVEL_PX = 160;

type SceneOffset = "start-start-end-start";

export function ParallaxScene({
  children,
  className,
  offset = "start-start-end-start",
}: {
  children: ReactNode;
  className?: string;
  offset?: SceneOffset;
}) {
  void offset;
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sceneRef.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let queued = false;

    const update = () => {
      queued = false;
      const rect = node.getBoundingClientRect();
      const total = Math.max(rect.height, 1);
      const past = Math.min(Math.max(-rect.top, 0), total);
      node.style.setProperty(PROGRESS_VAR, (past / total).toFixed(4));
    };

    const queue = () => {
      if (!queued) {
        queued = true;
        raf = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      className={cn("relative", className)}
      style={{ [PROGRESS_VAR]: "0" } as CSSProperties}
      data-testid="public-hero-parallax"
    >
      {children}
    </div>
  );
}

export function ParallaxLayer({
  children,
  speed,
  scaleDrift = 0,
  className,
  ["aria-hidden"]: ariaHidden,
}: {
  children: ReactNode;
  speed: number;
  scaleDrift?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}) {
  return (
    <div
      className={className}
      aria-hidden={ariaHidden}
      style={{
        transform: `translate3d(0, calc(var(${PROGRESS_VAR}, 0) * ${-LAYER_TRAVEL_PX * speed}px), 0) scale(calc(1 + var(${PROGRESS_VAR}, 0) * ${scaleDrift * speed}))`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
