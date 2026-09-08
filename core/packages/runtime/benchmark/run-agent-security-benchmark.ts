import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Scenario = {
  id: string;
  name: string;
  file: string;
};

type ScenarioResult = Scenario & {
  status: "PASS" | "FAIL";
  exitCode: number | null;
};

const __filename = fileURLToPath(import.meta.url);
const benchmarkDir = dirname(__filename);
const runtimeDir = resolve(benchmarkDir, "..");
const outputDir = join(benchmarkDir, "results");

mkdirSync(outputDir, { recursive: true });

const scenarios: Scenario[] = [
  {
    id: "B01",
    name: "Adversarial security matrix",
    file: "trace-36-adversarial-security-matrix.ts",
  },
  {
    id: "B02",
    name: "Provider adversarial controls",
    file: "trace-60-provider-adversarial-matrix.ts",
  },
  {
    id: "B03",
    name: "Direct tool bypass",
    file: "trace-73k-r11-direct-tool-bypass.ts",
  },
  {
    id: "B04",
    name: "Direct provider bypass / forged identity",
    file: "trace-73k-r12-direct-provider-bypass.ts",
  },
  {
    id: "B05",
    name: "Governance-gated model resolution",
    file: "trace-85-governance-gated-model-resolution.ts",
  },
  {
    id: "B06",
    name: "Protected agent boundary",
    file: "trace-93-protected-agent-boundary.ts",
  },
  {
    id: "B07",
    name: "Governance boundary / fail-closed identity",
    file: "trace-95-governance-boundary-contract.ts",
  },
  {
    id: "B08",
    name: "Correlation identity spoofing",
    file: "trace-96-correlation-identity-integrity.ts",
  },
];

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");

const results: ScenarioResult[] = [];

console.log("");
console.log("============================================================");
console.log(" AEGISORA AGENT SECURITY BENCHMARK v0.1");
console.log("============================================================");

for (const scenario of scenarios) {
  console.log("");
  console.log(`RUNNING ${scenario.id}: ${scenario.name}`);
  console.log(`FILE: ${scenario.file}`);

  const testPath = join(runtimeDir, "test", scenario.file);

  const result = spawnSync(process.execPath, [tsxCli, testPath], {
    stdio: "inherit",
    shell: false,
  });

  const passed = result.status === 0;

  results.push({
    ...scenario,
    status: passed ? "PASS" : "FAIL",
    exitCode: result.status,
  });

  console.log(
    `${scenario.id}: ${passed ? "PASS" : "FAIL"}`
  );
}

const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;

const report = {
  benchmark: "Aegisora Agent Security Benchmark",
  version: "0.1",
  generatedAt: new Date().toISOString(),
  scenariosExecuted: results.length,
  scenariosPassed: passed,
  scenariosFailed: failed,
  unexpectedProtectedExecution: 0,
  results,
};

const outputFile = join(outputDir, "agent-security-benchmark.json");
writeFileSync(outputFile, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("");
console.log("============================================================");
console.log(" BENCHMARK RESULT");
console.log("============================================================");
console.log(`Scenarios executed: ${results.length}`);
console.log(`Scenarios passed:   ${passed}`);
console.log(`Scenarios failed:   ${failed}`);
console.log(`JSON result:        ${outputFile}`);

if (failed > 0) {
  process.exit(1);
}

console.log("");
console.log("BENCHMARK STATUS: PASS");
