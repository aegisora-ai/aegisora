$ErrorActionPreference = "Continue"
$root = "C:\AI\AEGISORA"
$tmp = $env:TEMP
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outDir = Join-Path $root "docs\evidence"
New-Item -ItemType Directory -Force $outDir | Out-Null

function Sum-Tap($lines, $k) {
  $s = ($lines | Where-Object { $_ -match "^# $k (\d+)$" } | ForEach-Object { [int]$Matches[1] } | Measure-Object -Sum).Sum
  if ($s) { [int]$s } else { 0 }
}

Write-Host "1/5 runtime testleri..."
Push-Location "$root\core\packages\runtime"
pnpm test *> "$tmp\ev-runtime.txt"
$rt = Get-Content "$tmp\ev-runtime.txt"
$m = $rt | Select-String "ALL (\d+) RUNTIME TESTS PASSED" | Select-Object -First 1
$rtCount = 0; $rtStatus = "FAIL"
if ($m) { $rtCount = [int]$m.Matches[0].Groups[1].Value; $rtStatus = "PASS" }

Write-Host "2/5 guvenlik benchmark..."
pnpm benchmark:security *> "$tmp\ev-bench.txt"
$benchOk = [bool](Select-String -Path "$tmp\ev-bench.txt" -Pattern "BENCHMARK STATUS: PASS" -Quiet)
$bench = $null
$bf = "benchmark\results\agent-security-benchmark.json"
if (Test-Path $bf) { $bench = Get-Content $bf -Raw -Encoding UTF8 | ConvertFrom-Json }

$matrix = $null
$mf = "benchmark\results\model-matrix.json"
if (Test-Path $mf) { $matrix = Get-Content $mf -Raw -Encoding UTF8 | ConvertFrom-Json }
Pop-Location

Write-Host "3/5 core testleri..."
Push-Location "$root\core\packages\core"
$files = Get-ChildItem test -Filter *.test.ts | ForEach-Object { "test/$($_.Name)" }
npx tsx --test $files *> "$tmp\ev-core.txt"
$core = Get-Content "$tmp\ev-core.txt"
$coreTests = Sum-Tap $core "tests"; $corePass = Sum-Tap $core "pass"; $coreFail = Sum-Tap $core "fail"
Pop-Location

Write-Host "4/5 website testleri..."
Push-Location "$root\website4"
pnpm test:revenue *> "$tmp\ev-rev.txt"
$revOk = [bool](Select-String -Path "$tmp\ev-rev.txt" -Pattern "REVENUE API = GREEN" -Quiet)
pnpm test:security:policy-redaction *> "$tmp\ev-pol.txt"
$polTxt = Get-Content "$tmp\ev-pol.txt" -Raw
$polOk = $polTxt -match '"status":\s*"PASS"'
$polCount = 0
if ($polTxt -match '"test_count":\s*(\d+)') { $polCount = [int]$Matches[1] }
Pop-Location

Write-Host "5/5 rapor yaziliyor..."
Push-Location $root
$commit = (git rev-parse --short HEAD).Trim()
$branch = (git branch --show-current).Trim()
Pop-Location

$total = $rtCount + $corePass + $polCount
$allOk = ($rtStatus -eq "PASS") -and ($coreFail -eq 0) -and ($coreTests -gt 0) -and $benchOk -and $revOk -and $polOk

$mdLines = @()
$mdLines += "# Aegisora Pilot Evidence Report"
$mdLines += ""
$mdLines += "- Generated (UTC): $((Get-Date).ToUniversalTime().ToString('s'))Z"
$mdLines += "- Repo: branch $branch, commit $commit"
$mdLines += "- Overall: $(if ($allOk) {'PASS'} else {'FAIL - see details'})"
$mdLines += ""
$mdLines += "## Summary"
$mdLines += ""
$mdLines += "| Area | Result | Detail |"
$mdLines += "|---|---|---|"
$mdLines += "| Runtime tests | $rtStatus | $rtCount tests |"
$mdLines += "| Core tests | $(if ($coreFail -eq 0 -and $coreTests -gt 0) {'PASS'} else {'FAIL'}) | $corePass / $coreTests passed, $coreFail failed |"
$mdLines += "| Policy and redaction (website) | $(if ($polOk) {'PASS'} else {'FAIL'}) | $polCount tests |"
$mdLines += "| Revenue API smoke (local) | $(if ($revOk) {'PASS'} else {'FAIL'}) | auth and webhook gates |"
$mdLines += "| Agent security benchmark | $(if ($benchOk) {'PASS'} else {'FAIL'}) | $($bench.scenariosPassed) / $($bench.scenariosExecuted) scenarios, unexpectedProtectedExecution = $($bench.unexpectedProtectedExecution) |"
$mdLines += ""
$mdLines += "Automated tests passing: $total"
$mdLines += ""
$mdLines += "## Benchmark scenarios"
$mdLines += ""
$mdLines += "| ID | Scenario | Status |"
$mdLines += "|---|---|---|"
foreach ($r in $bench.results) { $mdLines += "| $($r.id) | $($r.name) | $($r.status) |" }
$mdLines += ""
$mdLines += "## Live provider matrix"
$mdLines += ""
if ($matrix) {
  $mdLines += "Source file generated at: $($matrix.generatedAt) (not re-run by this report)."
  $mdLines += ""
  $mdLines += "| Provider | Scenario | Expected | Actual | HTTP calls | Status |"
  $mdLines += "|---|---|---|---|---|---|"
  foreach ($r in $matrix.rows) { $mdLines += "| $($r.provider) | $($r.scenario) | $($r.expected) | $($r.actual) | $($r.httpCalls) | $($r.status) |" }
} else {
  $mdLines += "No matrix result found. Run benchmark\model-matrix.ts first."
}
$mdLines += ""
$mdLines += "## What this does NOT prove"
$mdLines += ""
$mdLines += "- Providers marked SKIPPED were not tested live."
$mdLines += "- The matrix has 3 scenarios per provider. It shows the gate decides before the model is called, not model-by-model attack resistance."
$mdLines += "- ESCALATE in the matrix is triggered by a caller-supplied review flag, not automatic detection."
$mdLines += "- Most runtime and core tests use fake providers. Only the matrix calls real APIs."
$mdLines += "- Revenue smoke test is local. Live Stripe mode is not verified."
$mdLines += "- Results are produced by the vendor. No independent verification yet."
$mdLines += ""
$mdLines += "## Reproduce"
$mdLines += ""
$mdLines += "    powershell -File scripts\enterprise\pilot-evidence-report.ps1"

$mdPath = Join-Path $outDir "PILOT-EVIDENCE-$stamp.md"
$jsonPath = Join-Path $outDir "PILOT-EVIDENCE-$stamp.json"
[System.IO.File]::WriteAllText($mdPath, ($mdLines -join "`n") + "`n", (New-Object System.Text.UTF8Encoding($false)))

$obj = [ordered]@{
  generatedUtc = (Get-Date).ToUniversalTime().ToString("s") + "Z"
  branch = $branch; commit = $commit; overallPass = $allOk
  runtime = @{ status = $rtStatus; tests = $rtCount }
  core = @{ tests = $coreTests; passed = $corePass; failed = $coreFail }
  policyRedaction = @{ pass = $polOk; tests = $polCount }
  revenueSmoke = @{ pass = $revOk }
  benchmark = $bench
  providerMatrix = $matrix
}
[System.IO.File]::WriteAllText($jsonPath, ($obj | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ""
Write-Host "OVERALL: $(if ($allOk) {'PASS'} else {'FAIL'})  runtime=$rtCount core=$corePass/$coreTests policy=$polCount benchmark=$($bench.scenariosPassed)/$($bench.scenariosExecuted)"
Write-Host "Rapor: $mdPath"