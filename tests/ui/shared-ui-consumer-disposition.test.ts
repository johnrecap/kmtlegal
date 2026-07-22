import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

type ConsumerDisposition = {
  path: string;
  contracts: string[];
  disposition: "migrated" | "backward-compatible" | "blocked-re-spec";
  evidence: string;
};

type DispositionArtifact = {
  contractProviders: string[];
  consumers: ConsumerDisposition[];
};

const artifactPath = join(process.cwd(), "test-results", "plan35", "shared-ui-consumer-disposition.json");

const changedBarrelExports = new Set([
  "Badge",
  "Button",
  "ButtonLink",
  "DataTable",
  "DataTableColumn",
  "FilterBar",
  "InlineFeedback",
  "SearchInput",
  "Select",
  "Skeleton",
  "StateBlock",
  "TextInput",
  "Textarea",
  "Toast",
  "buttonClasses"
]);

const expectedProviders = [
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/data-table.tsx",
  "src/components/ui/field.tsx",
  "src/components/ui/filter-bar.tsx",
  "src/components/ui/index.ts",
  "src/components/ui/inline-feedback.tsx",
  "src/components/ui/search-input.tsx",
  "src/components/ui/skeleton.tsx",
  "src/components/ui/state.tsx",
  "src/components/ui/toast.tsx",
  "src/lib/design-system/tokens.ts",
  "src/app/globals.css",
  "tailwind.config.ts"
] as const;

describe("PLAN-35 shared UI consumer disposition", () => {
  it("classifies every source consumer and leaves no silent or blocked impact", () => {
    expect(existsSync(artifactPath), "T111 disposition artifact must exist").toBe(true);
    const artifact = JSON.parse(readFileSync(artifactPath, "utf8")) as DispositionArtifact;
    const discovered = discoverConsumers();
    const recorded = new Map(artifact.consumers.map((consumer) => [consumer.path, consumer]));

    expect([...recorded.keys()].sort()).toEqual([...discovered.keys()].sort());
    expect(new Set(artifact.contractProviders)).toEqual(new Set(expectedProviders));

    for (const [path, contracts] of discovered) {
      const disposition = recorded.get(path);
      expect(disposition, path).toBeDefined();
      expect(disposition?.disposition, path).not.toBe("blocked-re-spec");
      expect(new Set(disposition?.contracts), path).toEqual(new Set(contracts));
      expect(disposition?.evidence, path).toMatch(/^tests\/ui\/.+\.test\.tsx?$/);
      expect(existsSync(join(process.cwd(), disposition!.evidence)), disposition?.evidence).toBe(true);
    }
  });
});

function discoverConsumers() {
  const consumers = new Map<string, string[]>();
  for (const absolutePath of walk(join(process.cwd(), "src"))) {
    if (!/\.(?:ts|tsx)$/.test(absolutePath)) continue;
    const source = readFileSync(absolutePath, "utf8");
    const contracts = new Set<string>();
    const barrelImports = source.matchAll(/import\s+(?:type\s+)?\{([\s\S]*?)\}\s+from\s+["']@\/components\/ui["']/g);

    for (const match of barrelImports) {
      for (const imported of match[1].split(",")) {
        const name = imported.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
        if (changedBarrelExports.has(name)) contracts.add(name);
      }
    }

    for (const match of source.matchAll(/from\s+["']@\/components\/ui\/(badge|button|data-table|field|filter-bar|inline-feedback|search-input|skeleton|state|toast)["']/g)) {
      contracts.add(match[1]);
    }
    if (source.includes("@/lib/design-system/tokens")) contracts.add("design-system-tokens");

    if (contracts.size) {
      consumers.set(normalize(relative(process.cwd(), absolutePath)), [...contracts].sort());
    }
  }
  return consumers;
}

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function normalize(path: string) {
  return path.split(sep).join("/");
}
