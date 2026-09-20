"use client";

import * as React from "react";

/**
 * Accordion validation auto-open (Phase 11 kit). Forms whose fields live
 * inside Accordion groups must never hide a validation error in a closed
 * panel: attach `onInvalidCapture` to the `<form>`, mark each
 * `AccordionItem` with `data-form-group="<value>"`, and drive the
 * Accordion with the returned `value`/`onValueChange`.
 *
 * On any native `invalid` event (fired for the first invalid control on
 * submit — the browser then focuses it), the group holding that control
 * opens automatically. Works with uncontrolled + controlled Accordions
 * (`single` or `multiple`); server-error summaries are unaffected.
 */
type SingleReturn = {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  onInvalidCapture: (event: React.FormEvent<HTMLFormElement>) => void;
};

type MultipleReturn = {
  value: string[];
  onValueChange: (value: string[]) => void;
  onInvalidCapture: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function useInvalidFieldAccordion(options?: {
  type?: "single";
  defaultValue?: string | string[];
}): SingleReturn;
export function useInvalidFieldAccordion(options: {
  type: "multiple";
  defaultValue?: string | string[];
}): MultipleReturn;
export function useInvalidFieldAccordion(
  options: {
    type?: "single" | "multiple";
    defaultValue?: string | string[];
  } = {}
): SingleReturn | MultipleReturn {
  const { type = "single", defaultValue } = options;
  const initialSingle = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;
  const initialMultiple =
    defaultValue === undefined ? [] : Array.isArray(defaultValue) ? defaultValue : [defaultValue];
  const [singleValue, setSingleValue] = React.useState<string | undefined>(initialSingle);
  const [multipleValue, setMultipleValue] = React.useState<string[]>(initialMultiple);

  const onInvalidCapture = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      const target = event.target as HTMLElement | null;
      const group = target?.closest?.("[data-form-group]")?.getAttribute("data-form-group");
      if (!group) return;
      if (type === "multiple") {
        setMultipleValue((current) => (current.includes(group) ? current : [...current, group]));
      } else {
        setSingleValue(group);
      }
    },
    [type]
  );

  if (type === "multiple") {
    return { value: multipleValue, onValueChange: setMultipleValue, onInvalidCapture };
  }
  return { value: singleValue, onValueChange: setSingleValue, onInvalidCapture };
}
