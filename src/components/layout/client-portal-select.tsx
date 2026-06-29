"use client";

import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { MaterialSymbol } from "@/components/ui";
import { cn } from "@/lib/cn";

export type ClientPortalSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type ClientPortalSelectProps = {
  id?: string;
  name: string;
  label: string;
  options: ClientPortalSelectOption[];
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  className?: string;
  onChange?: (value: string) => void;
};

function nextEnabledIndex(options: ClientPortalSelectOption[], startIndex: number, direction: 1 | -1) {
  if (!options.length) {
    return -1;
  }

  let nextIndex = startIndex;
  for (let step = 0; step < options.length; step += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;
    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

export function ClientPortalSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  value,
  disabled = false,
  required = false,
  hint,
  className,
  onChange
}: ClientPortalSelectProps) {
  const reactId = useId();
  const controlId = id ?? `${name}-${reactId}`;
  const labelId = `${controlId}-label`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const listboxId = `${controlId}-listbox`;
  const isControlled = value !== undefined;
  const fallbackValue = useMemo(() => defaultValue ?? options.find((option) => !option.disabled)?.value ?? "", [defaultValue, options]);
  const [internalValue, setInternalValue] = useState(fallbackValue);
  const currentValue = isControlled ? (value ?? fallbackValue) : internalValue;
  const selectedOption = options.find((option) => option.value === currentValue) ?? options.find((option) => option.value === fallbackValue) ?? options.find((option) => !option.disabled);
  const selectedIndex = selectedOption ? options.findIndex((option) => option.value === selectedOption.value) : -1;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const submittedValue = selectedOption?.value ?? "";

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      window.requestAnimationFrame(() => listboxRef.current?.focus());
    }
  }, [isOpen, selectedIndex]);

  useEffect(() => {
    if (isControlled) {
      return undefined;
    }

    const form = rootRef.current?.closest("form");
    if (!form) {
      return undefined;
    }

    const handleReset = () => {
      setInternalValue(fallbackValue);
      setIsOpen(false);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    };

    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [fallbackValue, isControlled, selectedIndex]);

  function chooseOption(option: ClientPortalSelectOption, index: number) {
    if (disabled || option.disabled) {
      return;
    }

    if (!isControlled) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    setActiveIndex(index);
    setIsOpen(false);
    window.requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function openFromButton(direction: 1 | -1) {
    const startIndex = selectedIndex >= 0 ? selectedIndex : direction === 1 ? -1 : 0;
    const nextIndex = nextEnabledIndex(options, startIndex, direction);
    setActiveIndex(nextIndex >= 0 ? nextIndex : selectedIndex);
    setIsOpen(true);
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      openFromButton(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openFromButton(-1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((open) => !open);
    }
  }

  function handleListboxKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => nextEnabledIndex(options, index >= 0 ? index : selectedIndex, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => nextEnabledIndex(options, index >= 0 ? index : selectedIndex, -1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) {
        chooseOption(option, activeIndex);
      }
    } else if (event.key === "Tab") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("space-y-2", className)}>
      <label id={labelId} className="block text-sm font-semibold text-white" htmlFor={controlId}>
        {label}
      </label>
      <input disabled={disabled} name={name} required={required} type="hidden" value={submittedValue} />
      <div className="relative">
        <button
          ref={buttonRef}
          id={controlId}
          aria-controls={isOpen ? listboxId : undefined}
          aria-describedby={hintId}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={cn(
            "flex min-h-11 w-full items-center justify-between gap-3 rounded border border-white/15 bg-black/25 px-3 py-2.5 text-start text-base text-stone-50 shadow-none transition-colors",
            "hover:border-kmt-gold/55 hover:bg-white/[0.045]",
            "focus:border-kmt-gold/75 focus:outline-none focus:ring-2 focus:ring-kmt-gold/20",
            disabled ? "cursor-not-allowed border-white/10 bg-white/[0.035] text-slate-500" : undefined
          )}
          disabled={disabled}
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          onKeyDown={handleButtonKeyDown}
        >
          <span className="block min-w-0 flex-1 truncate">{selectedOption?.label}</span>
          <MaterialSymbol className={cn("text-[22px] text-[#c79a52] transition-transform", isOpen ? "rotate-180" : undefined)} name="expand_more" />
        </button>
        {isOpen ? (
          <ul
            ref={listboxRef}
            id={listboxId}
            aria-activedescendant={activeIndex >= 0 ? `${controlId}-option-${activeIndex}` : undefined}
            aria-labelledby={labelId}
            className="absolute inset-x-0 top-[calc(100%+0.4rem)] z-50 max-h-64 overflow-y-auto rounded border border-kmt-gold/35 bg-[#090806] p-1 text-start shadow-[0_18px_58px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.05)] outline-none"
            role="listbox"
            tabIndex={-1}
            onKeyDown={handleListboxKeyDown}
          >
            {options.map((option, index) => {
              const isSelected = option.value === submittedValue;
              const isActive = index === activeIndex;

              return (
                <li
                  key={`${option.value}-${index}`}
                  id={`${controlId}-option-${index}`}
                  aria-disabled={option.disabled || undefined}
                  aria-selected={isSelected}
                  className={cn(
                    "cursor-pointer select-none rounded px-3 py-2 text-sm leading-6 transition-colors",
                    isSelected ? "bg-kmt-gold text-[#120d07]" : isActive ? "bg-white/10 text-white" : "text-slate-100 hover:bg-white/[0.075]",
                    option.disabled ? "cursor-not-allowed text-slate-500 hover:bg-transparent" : undefined
                  )}
                  role="option"
                  onClick={() => chooseOption(option, index)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="text-sm leading-6 text-slate-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
