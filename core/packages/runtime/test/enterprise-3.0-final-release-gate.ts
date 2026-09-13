import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Case = {
  name: string;
  cwd: string;
  args: string[];
};

const testDir = dirname(
  fileURLToPath(import.meta.url),
);

const runtimeRoot = dirname(
  testDir,
);

const root = resolve(
  runtimeRoot,
  "../..",
);

const pnpmCommand =
  process.platform === "win32"
    ? "pnpm.cmd"
    : "pnpm";

const cases: Case[] = [
  {
    name: "Core typecheck",
    cwd: root,
    args: [
      "exec",
      "tsc",
      "-p",
      "./packages/core/tsconfig.json",
      "--noEmit",
    ],
  },
  {
    name: "Runtime typecheck",
    cwd: root,
    args: [
      "exec",
      "tsc",
      "-p",
      "./packages/runtime/tsconfig.json",
      "--noEmit",
    ],
  },
  {
    name: "17A Entitlement Engine",
    cwd: root,
    args: [
      "exec",
      "tsx",
      "./packages/core/test/enterprise-entitlement-engine.test.ts",
    ],
  },
  {
    name: "17B Runtime Entitlement Enforcement",
    cwd: root,
    args: [
      "exec",
      "tsx",
      "./packages/runtime/test/trace-17b-entitlement-runtime-enforcement.test.ts",
    ],
  },
  {
    name: "Billing Contract",
    cwd: root,
    args: [
      "exec",
      "tsx",
      "./packages/core/test/enterprise-billing-contract.test.ts",
    ],
  },
  {
    name: "Identity Contract",
    cwd: root,
    args: [
      "exec",
      "tsx",
      "./packages/core/test/enterprise-identity-contract.test.ts",
    ],
  },
  {
    name: "Recovery Contract",
    cwd: root,
    args: [
      "exec",
      "tsx",
      "./packages/core/test/enterprise-recovery-contract.test.ts",
    ],
  },
];

function run(test: Case): void {
  const command = [
    pnpmCommand,
    ...test.args.map((arg) => `"${arg.replaceAll('"', '""')}"`),
  ].join(" ");

  execSync(command, {
    cwd: test.cwd,
    stdio: "inherit",
    windowsHide: true,
    shell: true,
  });
}

let passed = 0;

for (const test of cases) {
  process.stdout.write(`\n[RUN ] ${test.name}\n`);

  try {
    run(test);
    console.log(`[PASS] ${test.name}`);
    passed++;
  } catch (error) {
    console.error(`[FAIL] ${test.name}`);

    if (error instanceof Error) {
      console.error(error.message);
    }
  }
}

console.log("");
console.log("============================================================");
console.log(`ENTERPRISE 3.0 RELEASE GATE: ${passed}/${cases.length}`);
console.log("============================================================");

if (passed !== cases.length) {
  console.error("RELEASE BLOCKED");
  process.exit(1);
}

console.log("RELEASE GATE GREEN");
