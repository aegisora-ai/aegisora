# Aegisora mobility test run

A reproducible run of 110 autonomous-vehicle security scenarios (`scenarios/scenarios.csv`) against the real `EnforcementGate`, in-process.

## Results (run `20261030-193449`, commit `26687e3`)

| | Count |
|---|---|
| Scenarios in the suite | 110 |
| Executed | 12 |
| **Not tested** | **98** |
| BLOCK scenarios passed | 8 / 8 |
| ALLOW controls passed | 4 / 4 |
| FAIL | 0 |

Only 12 of 110 scenarios have an executable adapter. The other 98 are listed as `NOT TESTED` and are not counted as passes.

The first run executed 10 PASS and **2 FAIL**:

- **AEG-AV-011** (prompt injection): the guard missed a role/mode-switch payload.
- **AEG-AV-023** (flood): 300 calls from one agent were all allowed; there was no rate limiting.

Both were fixed in `26687e3`.

## Read this before citing the numbers

- **Proxy mapping.** The scenarios describe vehicle commands (unauthorized identity, command injection, flooding, ...). The gate is a generic tool/agent gate, so each scenario is modeled through it as a proxy (see the `PROXY` / `DIRECT` column in the report). This is not a test against a real vehicle stack.
- **AV-011 is a regression set, not an independent evaluation.** The fix adds regex pattern families (role/mode switching, override labels, rule dismissal, disabling safety checks). Five of the eight payloads were written together with the fix. Pattern matching can be bypassed by paraphrase. `guard-variants.ts` also checks that benign sentences are not blocked.
- **Rate limiting is in-memory and per gate instance.** It resets when the process restarts. Default: 100 calls per 60 s per agent, on by default. Configure with `AEGISORA_RATE_LIMIT_MAX` and `AEGISORA_RATE_LIMIT_WINDOW_MS`; `AEGISORA_RATE_LIMIT_MAX=0` disables it. This changes behavior for existing users who send more than 100 calls per minute from one agent.
- The `you are now ... mode` pattern is broad and can block harmless text such as "you are now in standby mode".

## Reproduce

From the repo root (Node and pnpm required):

    pnpm install --frozen-lockfile
    powershell -ExecutionPolicy Bypass -File .\run-mobility-core.ps1

The first run builds the workspace packages the runtime depends on (this takes a minute). New output goes to `mobility/reports/` and `mobility/evidence/` (git-ignored; only the run above is tracked). The harness is `core/packages/runtime/test/mobility/run-mobility-core.ts`.

## Files

- `scenarios/scenarios.csv`: the 110 scenarios (some titles are in Turkish)
- `reports/report-core-*.md`, `reports/results-core-*.csv`: the published run
- `evidence/evidence-core-*.jsonl`: per-scenario evidence