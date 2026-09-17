"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";

interface VanishParticle {
  x: number;
  y: number;
  r: number;
  color: string;
}

/**
 * Aceternity UI Placeholders And Vanish Input (vendored + adapted).
 * Sliding-in placeholders and a vanish (particle) effect of the input
 * on submit.
 *
 * KMT adaptations (behavior contract preserved, styling owned by caller):
 * - Controlled `value` / `onValueChange` so the parent keeps its submit,
 *   validation, restore, and language-transfer logic untouched.
 * - `onChange` is never blocked mid-animation (upstream ignores keystrokes
 *   while vanishing); the canvas snapshot is taken at submit time, so typing
 *   stays responsive and scripted fills always land.
 * - `disabled` renders a static pending placeholder with no cycling.
 * - prefers-reduced-motion: static first placeholder, instant submit, no
 *   canvas work and no animation frames.
 */
export function PlaceholdersAndVanishInput({
  placeholders,
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  inputName = "chatMessage",
  inputId,
  ariaLabel,
  autoComplete = "off",
  formClassName,
  inputClassName,
  placeholderClassName,
  canvasClassName,
  formTestId,
  trailing,
}: {
  placeholders: string[];
  value: string;
  onValueChange: (next: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  inputName?: string;
  inputId?: string;
  ariaLabel?: string;
  autoComplete?: string;
  formClassName?: string;
  inputClassName?: string;
  placeholderClassName?: string;
  canvasClassName?: string;
  /** Test hook for the single form (e.g. booking-chat-composer). */
  formTestId?: string;
  /** Caller-owned submit action rendered inside the form (KMT send button). */
  trailing?: ReactNode;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const particlesRef = useRef<VanishParticle[]>([]);
  const frameRef = useRef(0);
  const shouldCycle = !disabled && !reduceMotion && placeholders.length > 1;

  const startPlaceholderCycle = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (!shouldCycle) return;
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3200);
  }, [placeholders.length, shouldCycle]);

  useEffect(() => {
    startPlaceholderCycle();
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else {
        startPlaceholderCycle();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [startPlaceholderCycle]);

  const rasterize = useCallback((text: string) => {
    const canvas = canvasRef.current;
    const input = inputRef.current;
    if (!canvas || !input || !text) {
      particlesRef.current = [];
      return;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      particlesRef.current = [];
      return;
    }
    const scale = 2;
    const width = Math.max(2, Math.ceil(input.clientWidth * scale));
    const height = Math.max(2, Math.ceil(input.clientHeight * scale));
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    const computed = getComputedStyle(input);
    const fontSize = Number.parseFloat(computed.getPropertyValue("font-size")) || 16;
    ctx.font = `${computed.fontWeight} ${fontSize * scale}px ${computed.fontFamily}`;
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    // Canvas bidi handles LTR + RTL (Arabic) shaping and ordering natively.
    ctx.fillText(text, 8 * scale, (height / scale / 2) * scale);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const step = 2 * scale;
    const particles: VanishParticle[] = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 128) {
          particles.push({ x: x / scale, y: y / scale, r: Math.random() * 1.6 + 0.4, color: "#d8ab55" });
        }
      }
    }
    particlesRef.current = particles;
  }, []);

  const runVanish = useCallback(() => {
    const canvas = canvasRef.current;
    const input = inputRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !input || !ctx || particlesRef.current.length === 0) {
      setAnimating(false);
      return;
    }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.ceil(input.clientWidth * dpr);
    canvas.height = Math.ceil(input.clientHeight * dpr);
    const start = performance.now();
    const duration = 620;
    const cancel: { id: number } = { id: 0 };
    frameRef.current = cancel.id;
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = 1 - progress;
      for (const particle of particlesRef.current) {
        const rise = progress * (28 + particle.r * 22);
        const drift = Math.sin((particle.x + particle.y) * 0.08 + progress * 5) * 10 * progress;
        ctx.globalAlpha = Math.max(0, fade);
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc((particle.x + drift) * dpr, (particle.y - rise) * dpr, particle.r * dpr * (1 - progress * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (progress < 1) {
        cancel.id = requestAnimationFrame(tick);
        frameRef.current = cancel.id;
      } else {
        particlesRef.current = [];
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setAnimating(false);
      }
    };
    cancel.id = requestAnimationFrame(tick);
    frameRef.current = cancel.id;
  }, []);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    // Snapshot the submitted text for the particle pass BEFORE the parent
    // clears the controlled value in onSubmit.
    if (!reduceMotion) {
      rasterize(inputRef.current?.value ?? "");
      setAnimating(true);
      // Defer one frame so the canvas snapshot paints before React clears.
      requestAnimationFrame(() => runVanish());
    }
    onSubmit(event);
  };

  const shownPlaceholder = disabled ? (placeholders[0] ?? "") : (placeholders[currentPlaceholder] ?? placeholders[0] ?? "");

  return (
    <form
      className={cn("relative w-full overflow-hidden", formClassName)}
      data-testid={formTestId}
      noValidate
      onSubmit={handleSubmit}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={cn("pointer-events-none absolute inset-0 h-full w-full", !animating && "opacity-0", canvasClassName)}
      />
      <input
        ref={inputRef}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        className={cn("peer w-full bg-transparent outline-none", animating && "text-transparent", inputClassName)}
        disabled={disabled}
        id={inputId}
        name={inputName}
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              key={`placeholder-${shouldCycle ? currentPlaceholder : "static"}`}
              animate={{ y: 0, opacity: 1 }}
              className={cn("truncate", placeholderClassName)}
              exit={{ y: -15, opacity: 0 }}
              initial={{ y: 5, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.3 }}
            >
              {shownPlaceholder}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      {trailing}
    </form>
  );
}
