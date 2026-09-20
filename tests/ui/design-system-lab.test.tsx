// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ComponentGallery } from "@/features/ui-preview/component-gallery";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() })
}));

beforeEach(() => {
  // Class (not arrow) mock: framer-motion constructs `new IntersectionObserver`.
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      addEventListener: vi.fn(() => {}),
      removeEventListener: vi.fn(() => {}),
      addListener: vi.fn(() => {}),
      removeListener: vi.fn(() => {}),
      dispatchEvent: vi.fn(() => false)
    }))
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("kmt design system lab", () => {
  it("renders the lab toolbar, required sections, and internal-only provenance labels", () => {
    render(<ComponentGallery />);

    expect(screen.getByRole("heading", { name: "Design System Lab" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Theme" })).toBeVisible();
    expect(screen.getByRole("group", { name: "Locale and direction" })).toBeVisible();

    for (const section of [
      "Brand / Logo",
      "Stateful Button",
      "Admin Tabs",
      "Accordion",
      "Admin Pagination",
      "Confirm Dialog",
      "Sheet",
      "Menu",
      "Popover",
      "Tooltip",
      "File Upload",
      "Sidebar",
      "Public components",
      "Data",
      "Pagination"
    ]) {
      expect(screen.getByRole("heading", { name: section })).toBeVisible();
    }

    expect(screen.getAllByText("Local KMT").length).toBeGreaterThan(5);
    expect(screen.getAllByText("Animate UI").length).toBeGreaterThan(3);
    expect(screen.getAllByText("Aceternity UI").length).toBeGreaterThan(2);
    expect(screen.getByText("Owner-approved adaptation (native DnD, no new packages).")).toBeVisible();
    expect(screen.getAllByText("Owner-approved dependency-namespace adaptation.")).toHaveLength(2);
  });
});
