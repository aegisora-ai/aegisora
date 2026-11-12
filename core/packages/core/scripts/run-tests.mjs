import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, "..");
// Some tests read files relative to core/ (for example supabase/migrations).
const coreRoot = resolve(pkgDir, "..", "..");
const testDir = join(pkgDir, "test");
const tsxCli = createRequire(import.meta.url).resolve("tsx/cli");

const tests = readdirSync(testDir)
    .filter((file) => file.endsWith(".ts"))
    .sort();

if (tests.length === 0) {
    console.error("CORE TEST SUITE: no test files found");
    process.exit(1);
}

const failed = [];

for (const test of tests) {
    console.log(`RUNNING: ${test}`);
    const result = spawnSync(process.execPath, [tsxCli, join(testDir, test)], {
        cwd: coreRoot,
        stdio: "inherit",
        shell: false,
        timeout: 120000
    });
    if (result.status !== 0) {
        failed.push(test);
        console.error(`FAILED: ${test}`);
    }
}

console.log("");
console.log(`CORE_TESTS_PASSED=${tests.length - failed.length}/${tests.length}`);

if (failed.length > 0) {
    console.error("FAILED TESTS:");
    for (const test of failed) console.error(`- ${test}`);
    process.exit(1);
}