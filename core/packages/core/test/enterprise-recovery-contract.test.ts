import {
  executionAllowedDuringRecovery,
} from "../src";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERTION_FAILED: ${message}`);
}

assert(
  executionAllowedDuringRecovery({
    workspaceId: "ws-1",
    state: "HEALTHY",
    failures: [],
    acceptingExecution: true,
  }),
  "healthy system should allow execution",
);

assert(
  !executionAllowedDuringRecovery({
    workspaceId: "ws-1",
    state: "SAFE_MODE",
    failures: ["PROVIDER"],
    acceptingExecution: true,
  }),
  "safe mode must block execution",
);

assert(
  !executionAllowedDuringRecovery({
    workspaceId: "ws-1",
    state: "DEGRADED",
    failures: ["AUDIT"],
    acceptingExecution: true,
  }),
  "audit failure must block execution",
);

assert(
  !executionAllowedDuringRecovery({
    workspaceId: "ws-1",
    state: "DEGRADED",
    failures: ["STORAGE"],
    acceptingExecution: true,
  }),
  "storage failure must block execution",
);

console.log("TRACE RECOVERY CONTRACT PASS");
console.log("PASS: healthy execution");
console.log("PASS: safe mode blocks");
console.log("PASS: audit failure blocks");
console.log("PASS: storage failure blocks");
