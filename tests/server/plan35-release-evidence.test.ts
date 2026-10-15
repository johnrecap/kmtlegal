import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import archivedEvidence from "../fixtures/release/plan35-evidence.json";

type GateResult = "PASS" | "FAIL" | "BLOCKED" | "SKIPPED";
type EvidenceGate = {
  gate: "local" | "database" | "authenticated-browser" | "live-read-only";
  result: GateResult;
  countsAsAchieved: boolean;
  evidence: string;
};

const root = process.cwd();

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function cells(line: string) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

function parseGateLedger(source: string): EvidenceGate[] {
  const start = source.indexOf("## Gate ledger");
  const end = source.indexOf("## ", start + "## Gate ledger".length);
  if (start < 0 || end < 0) throw new Error("Could not parse PLAN-35 gate ledger");
  return source.slice(start, end).split(/\r?\n/).flatMap((line) => {
    const row = cells(line);
    const gate = row[0]?.match(/^`(local|database|authenticated-browser|live-read-only)`$/)?.[1] as EvidenceGate["gate"] | undefined;
    const result = row[2]?.match(/^`(PASS|FAIL|BLOCKED|SKIPPED)`$/)?.[1] as GateResult | undefined;
    const countsAsAchieved = row[3]?.match(/^`(yes|no)`$/)?.[1];
    if (!gate || !result || !countsAsAchieved || row.length !== 5) return [];
    return [{ gate, result, countsAsAchieved: countsAsAchieved === "yes", evidence: row[4] }];
  });
}

function highestVerifiedState(gates: EvidenceGate[]) {
  const states = [
    ["local", "Local-Verified"],
    ["database", "DB-Verified"],
    ["authenticated-browser", "Browser-Verified"],
    ["live-read-only", "Live-Accepted"]
  ] as const;
  let highest = "Implemented";
  for (const [gate, state] of states) {
    const evidence = gates.find((candidate) => candidate.gate === gate);
    if (!evidence || evidence.result !== "PASS" || !evidence.countsAsAchieved) break;
    highest = state;
  }
  return highest;
}

describe("PLAN-35 archived release evidence and executable QA safeguards", () => {
  it("derives archived Local-Verified only and never promotes blocked or skipped gates", () => {
    const evidence = archivedEvidence.evidence;
    const gates = parseGateLedger(evidence);

    expect(gates.map(({ gate }) => gate)).toEqual([
      "local",
      "database",
      "authenticated-browser",
      "live-read-only"
    ]);
    expect(gates.map(({ result }) => result)).toEqual(["PASS", "BLOCKED", "BLOCKED", "SKIPPED"]);
    for (const gate of gates) {
      expect(gate.countsAsAchieved, gate.gate).toBe(gate.result === "PASS");
      expect(gate.evidence, gate.gate).not.toBe("");
    }
    expect(highestVerifiedState(gates)).toBe("Local-Verified");
    expect(evidence).toContain("Highest evidenced state: `Local-Verified`");
    expect(evidence).toContain("Production database used: `no`");
  });

  it("preserves the archived open DB, authenticated-browser, and live acceptance tasks", () => {
    const tasks = archivedEvidence.tasks;
    for (const taskId of ["T123", "T124", "T125"]) {
      expect(tasks).toMatch(new RegExp(`- \\[ \\] ${taskId}\\b`));
    }
    expect(tasks).not.toMatch(/- \[[xX]\] T12[345]\b/);
  });

  it("keeps archived roll-up markers at the same highest evidenced state", () => {
    const expectedMarker = "Highest evidenced PLAN-35 state: `Local-Verified`";
    expect(archivedEvidence.rollups["docs/KMT_LEGAL_IMPLEMENTATION_STATUS.md"]).toContain(expectedMarker);
    expect(archivedEvidence.rollups["docs/KMT_LEGAL_SPEC_KIT_PLAN_INDEX.md"]).toContain(expectedMarker);
    expect(archivedEvidence.rollups["specs/kmt-legal-platform/tasks.md"]).toContain(expectedMarker);
  });

  it("keeps PLAN-35 browser and DB specs in the standard QA harness without treating collection as acceptance", () => {
    const harness = read("scripts/plan23-local-qa.mjs");
    const packageJson = read("package.json");
    expect(harness).toContain("test:e2e:plan35");
    expect(harness).toContain("test:e2e:db");
    expect(packageJson).toContain("tests/e2e/plan35-admin-operations.spec.ts");
    expect(packageJson).toContain("tests/e2e/plan35-db-backed.spec.ts");
  });

  it("requires exact live document outcomes instead of accepting any response below 500", () => {
    const liveSmoke = read("tests/e2e/live-admin-smoke.spec.ts");
    expect(liveSmoke).not.toContain("toBeLessThan(500)");
    expect(liveSmoke).toContain("expectPlan35DocumentOutcome");
    expect(liveSmoke).toContain("new URL(response.url()).pathname");
    expect(liveSmoke).toContain("new URL(response!.url()).pathname");
    for (const href of [
      "/admin/contact-messages",
      "/admin/notifications",
      "/admin/cases/new",
      "/admin/roles"
    ]) {
      expect(liveSmoke).toContain(`\"${href}\"`);
    }
  });
});
