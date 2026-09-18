// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/animate-ui/components/radix/accordion";

function installMatchMedia() {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: vi.fn(() => {}),
      removeEventListener: vi.fn(() => {}),
    })),
  });
}

describe("vendored Animate UI accordion", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("matches the official radix accordion source shape", async () => {
    const { readFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const primitive = readFileSync(join(process.cwd(), "src/components/animate-ui/primitives/radix/accordion.tsx"), "utf8");
    for (const token of [
      "AccordionPrimitive.Root",
      "AccordionPrimitive.Item",
      "AccordionPrimitive.Header",
      "AccordionPrimitive.Trigger",
      "AccordionPrimitive.Content",
      "keepRendered",
      "data-slot=\"accordion-content\"",
      "useControlledState",
      "getStrictContext",
    ]) {
      expect(primitive).toContain(token);
    }
  });

  it("toggles content on trigger click with aria-expanded", () => {
    installMatchMedia();
    const { getByRole, queryByText } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>
            <div>Body A</div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = getByRole("button", { name: /section a/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(queryByText("Body A")).toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(queryByText("Body A")).not.toBeNull();
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("moves with keyboard: Enter opens, Tab reaches content links", () => {
    installMatchMedia();
    const { getByRole, getByText } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>Section A</AccordionTrigger>
          <AccordionContent>
            <div>
              <a href="/team/x">Profile X</a>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    );
    const trigger = getByRole("button", { name: /section a/i });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);
    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter", charCode: 13 });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(getByText("Profile X")).not.toBeNull();
  });
});
