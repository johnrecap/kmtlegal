// @vitest-environment jsdom
import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

/**
 * Phase 1 regression: the StickyScroll sticky panel renders a caller-created
 * visual node next to a static hairline. That dynamic children array must be
 * fully keyed at the StickyScroll ownership level — the visual node crosses
 * the RSC flight boundary and can materialize as a lazy chunk reference,
 * which trips React key validation ("passed a child from HomePageView")
 * whenever it sits unkeyed in an array.
 */
function stickyPanelChildKeys(container: HTMLElement): (string | null | string)[] {
  const panel = container.querySelector(".sticky.top-28");
  if (!panel) return ["PANEL-MISSING"];
  const fiberKey = Object.keys(panel).find((key) => key.startsWith("__reactFiber$"));
  const fiber = (panel as unknown as Record<string, { memoizedProps?: { children?: unknown } }>)[fiberKey!];
  const children = fiber?.memoizedProps?.children;
  if (!Array.isArray(children)) return ["NOT-AN-ARRAY"];
  return children.map((child) =>
    child && typeof child === "object" && "$$typeof" in child
      ? ((child as { key?: string | null }).key ?? null)
      : typeof child
  );
}

const items = [
  { title: "Services included", description: "a · b", content: <div className="panel-a">A</div> },
  { title: "Documents That Help Review", description: "c · d", content: <div className="panel-b">B</div> },
  { title: "Expected Outputs", description: "e · f", content: <div className="panel-c">C</div> },
];

describe("StickyScroll key ownership", () => {
  it("keys every sticky-panel child with stable semantic ids", () => {
    const { container } = render(<StickyScroll content={items} />);

    const keys = stickyPanelChildKeys(container);

    expect(keys.length).toBe(2);
    for (const key of keys) {
      expect(typeof key).toBe("string");
      expect(key).not.toBeNull();
    }
    // The active visual is wrapped in a Fragment keyed by the stable item
    // title (preferred over index-only or generated ids).
    expect(keys).toContain("Services included");
  });

  it("renders the active visual content identically", () => {
    const { container } = render(<StickyScroll content={items} />);

    expect(container.querySelector(".panel-a")).not.toBeNull();
    expect(container.textContent).toContain("Services included");
    expect(container.textContent).toContain("Documents That Help Review");
    expect(container.textContent).toContain("Expected Outputs");
  });
});
