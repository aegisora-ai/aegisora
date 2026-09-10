import {
  assertEnterpriseWorkspace,
} from "../src";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERTION_FAILED: ${message}`);
}

assertEnterpriseWorkspace("ws-1", "ws-1");

let rejected = false;

try {
  assertEnterpriseWorkspace("ws-1", "ws-2");
} catch {
  rejected = true;
}

assert(rejected, "cross-workspace identity must be rejected");

console.log("TRACE IDENTITY CONTRACT PASS");
console.log("PASS: same-workspace identity");
console.log("PASS: cross-workspace identity rejection");
