import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

// Synthetic scorer fixtures only: these do not establish model quality or reviewer approval.
test("the acceptance gate rejects stale reviews, missing corpus cases and original-incident failures", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "kmt-score-fixture-"));
  const model = "synthetic-fixture", sourceHash = "a".repeat(64);
  const cases = [ ...Array.from({ length: 30 }, (_, i) => ({ id: `L${String(i + 1).padStart(2, "0")}`, group: "LEGAL", holdout: i >= 20, fault: null, expectedTurns: i === 0 ? 5 : 1 })),
    ...["A", "F"].flatMap(p => Array.from({ length: 15 }, (_, i) => ({ id: `${p}${String(i + 1).padStart(2, "0")}`, group: p === "A" ? "ACCOUNT" : "FAILURE", holdout: i >= 10, fault: null, expectedTurns: 1 }))) ];
  const manifest = { sourceHash, models: [model], cases };
  const run = async () => {
    const child = spawnSync(process.execPath, ["scripts/assistant-evaluation-score.mjs", directory], { encoding: "utf8" });
    assert.notEqual(child.status, null, child.stderr);
    return JSON.parse(await readFile(path.join(directory, "summary.json"), "utf8"));
  };
  let firstReview;
  try {
    await writeFile(path.join(directory, "matrix-manifest.json"), JSON.stringify(manifest));
    for (const repetition of [1, 2, 3]) for (const c of cases) {
      const record = { model, sourceHash, route: ["synthetic"], repetition, scenario: c.id, group: c.group, holdout: c.holdout, fault: null, elapsed: Array(c.expectedTurns).fill(100), costUsd: .01, turns: Array(c.expectedTurns).fill({ answer: "Synthetic answer" }), errors: [] };
      const raw = JSON.stringify(record), filename = path.join(directory, `${model}-${repetition}-${c.id}`);
      const review = { artifactSha256: createHash("sha256").update(raw).digest("hex"), reviewer: "Synthetic test fixture", note: "Not an actual review", privacy: true, authorization: true, noDuplicate: true, noInventedLaw: true, relevant: true, continuity: true, legalSpecialist: true, legalSourceNote: "Synthetic fixture only" };
      if (repetition === 1 && c.id === "L01") firstReview = { path: `${filename}.review.json`, value: review };
      await writeFile(`${filename}.json`, raw); await writeFile(`${filename}.review.json`, JSON.stringify(review));
    }
    assert.equal((await run()).results[0].eligible, true);
    assert.equal((await run()).productionAccepted, false);
    await writeFile(firstReview.path, JSON.stringify({ ...firstReview.value, relevant: false }));
    assert.equal((await run()).results[0].eligible, false); // 99% aggregate cannot hide the original failure.
    await writeFile(firstReview.path, JSON.stringify({ ...firstReview.value, artifactSha256: "stale" }));
    assert.equal((await run()).results[0].criticalPass, false);
    await writeFile(firstReview.path, JSON.stringify(firstReview.value));
    await rm(path.join(directory, `${model}-3-F15.json`));
    assert.equal((await run()).results[0].evidenceComplete, false);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
