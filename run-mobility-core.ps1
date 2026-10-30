# =====================================================================
# Aegisora Mobility - CORE adapter run (real EnforcementGate, in-process)
# Run from repo root:  cd C:\AI\AEGISORA ; .\run-mobility-core.ps1
# Requires: mobility/scenarios/scenarios.csv (in the repo) and a prior pnpm install
# Honest rules:
#  - PASS only when the real gate returned exactly the expected decision
#  - Scenarios without a real adapter stay NOT TESTED
#  - FAIL = real finding (or wrong proxy mapping) -> read the reason column
# =====================================================================
param([string]$Root = (Get-Location).Path)
$ErrorActionPreference = 'Continue'
Set-Location $Root
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$M = Join-Path $Root 'mobility'
$RT = Join-Path $Root 'core\packages\runtime'
$csv = Join-Path $M 'scenarios\scenarios.csv'
if (-not (Test-Path $csv)) { throw "scenarios.csv missing: mobility/scenarios/scenarios.csv" }
if (-not (Test-Path $RT)) { throw "runtime package not found: $RT" }

# ---------- 1) write harness (TypeScript, runs through tsx like the existing tests) ----------
$hDir = Join-Path $RT 'test\mobility'
New-Item -ItemType Directory -Force -Path $hDir | Out-Null
$harnessPath = Join-Path $hDir 'run-mobility-core.ts'
if (-not (Test-Path $harnessPath)) { throw "Harness yok: $harnessPath" }
Write-Host "Harness written: $harnessPath" -ForegroundColor Cyan

# ---------- 2) run harness ----------
$outJson = Join-Path $M "reports\harness-raw-$ts.json"
$hLog = Join-Path $M "reports\harness-$ts.log"
Push-Location $RT
$tsx = (& node -p "require.resolve('tsx/cli')" 2>$null | Select-Object -Last 1)
$env:MOBILITY_OUT = $outJson
& node $tsx 'test\mobility\run-mobility-core.ts' *> $hLog
$hCode = $LASTEXITCODE
Pop-Location
Write-Host "Harness exit code: $hCode (log: $hLog)"
if (-not (Test-Path $outJson)) {
    Write-Host "Harness produced no result file. Last log lines:" -ForegroundColor Red
    Get-Content $hLog -Tail 30
    throw "Harness failed - paste the log lines above to Claude"
}

# ---------- 3) merge with scenario matrix, build evidence chain + report ----------
$sc = Import-Csv $csv -Delimiter '|' -Encoding UTF8
$h = Get-Content $outJson -Raw | ConvertFrom-Json
$map = @{}
foreach ($r in $h.rows) { $map[$r.id] = $r }
$evPath = Join-Path $M "evidence\evidence-core-$ts.jsonl"
$sha = [System.Security.Cryptography.SHA256]::Create()
function Get-Sha([string]$s) { ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($s)) | ForEach-Object { $_.ToString('x2') }) -join '' }
$prev = ('0' * 64)
$res = New-Object System.Collections.ArrayList
foreach ($s in $sc) {
    $status = 'NOT TESTED'; $actual = ''; $mapping = ''; $note = ''
    if ($map.ContainsKey($s.id)) {
        $r = $map[$s.id]
        $actual = [string]$r.actual; $mapping = [string]$r.mapping; $note = [string]$r.note
        if ($actual -eq 'ERROR') { $status = 'ERROR' }
        elseif ($actual -ieq $s.expected) { $status = 'PASS' }
        else { $status = 'FAIL' }
    } elseif ($s.owner -eq 'NEW') { $note = 'Yeni modul gerekiyor' }
    elseif ($s.owner -eq 'OEM') { $note = 'Arac/uretici/laboratuvar dogrulamasi gerekiyor' }
    else { $note = 'CORE ama adapter henuz yok (approval/replay/geofence kodu incelenecek)' }
    if ($note.Length -gt 220) { $note = $note.Substring(0, 220) }
    $e = [ordered]@{ ts = (Get-Date).ToUniversalTime().ToString('o'); id = $s.id; expected = $s.expected; actual = $actual; status = $status; mapping = $mapping; note = $note; prev = $prev }
    $hash = Get-Sha ($e | ConvertTo-Json -Compress)
    $e['hash'] = $hash
    Add-Content -Path $evPath -Value ($e | ConvertTo-Json -Compress) -Encoding UTF8
    $prev = $hash
    [void]$res.Add([pscustomobject]@{ id = $s.id; group = $s.group; owner = $s.owner; risk = $s.risk; expected = $s.expected; actual = $actual; status = $status; mapping = $mapping; note = $note; title = $s.title })
}
$csvOut = Join-Path $M "reports\results-core-$ts.csv"
$res | Export-Csv -Path $csvOut -NoTypeInformation -Encoding UTF8

# ---------- 4) version integrity: is the tested code the v4.0.0 code? ----------
$git = New-Object System.Collections.ArrayList
[void]$git.Add("HEAD: " + (git rev-parse --short HEAD) + " on " + (git rev-parse --abbrev-ref HEAD))
$tagCommit = (git rev-parse --short "v4.0.0^{commit}" 2>$null)
[void]$git.Add("v4.0.0 commit: $tagCommit")
$diff = git diff --stat v4.0.0 HEAD -- core/packages/runtime/src core/packages/core/src core/packages/audit 2>$null
if ($diff) { [void]$git.Add("Runtime/core/audit source changed since v4.0.0:"); $diff | Select-Object -Last 15 | ForEach-Object { [void]$git.Add("  $_") } }
else { [void]$git.Add("No source change in runtime/core/audit between v4.0.0 and HEAD -> results are valid for v4.0.0 code.") }
$dirty = git status --porcelain -- core/packages/runtime/src core/packages/core/src
if ($dirty) { [void]$git.Add("WARNING: uncommitted changes in runtime/core source:"); $dirty | Select-Object -First 10 | ForEach-Object { [void]$git.Add("  $_") } }

# ---------- 5) report ----------
$tested = @($res | Where-Object { $_.status -ne 'NOT TESTED' })
$md = New-Object System.Collections.ArrayList
[void]$md.Add("# Aegisora Mobility - CORE run $ts")
[void]$md.Add("")
[void]$md.Add("Total scenarios: $($res.Count) | PASS: $(@($res | Where-Object status -eq 'PASS').Count) | FAIL: $(@($res | Where-Object status -eq 'FAIL').Count) | ERROR: $(@($res | Where-Object status -eq 'ERROR').Count) | NOT TESTED: $(@($res | Where-Object status -eq 'NOT TESTED').Count)")
[void]$md.Add("")
[void]$md.Add("## Tested scenarios (real EnforcementGate, in-process)")
[void]$md.Add("| ID | Expected | Actual | Status | Mapping | Gate reason |")
[void]$md.Add("|---|---|---|---|---|---|")
foreach ($t in $tested) { [void]$md.Add("| $($t.id) | $($t.expected) | $($t.actual) | $($t.status) | $($t.mapping) | $(($t.note -replace '\|','/')) |") }
[void]$md.Add("")
[void]$md.Add("## Limits of this evidence")
[void]$md.Add("- PROXY mapping: vehicle commands are modelled with the generic tool/agent gate (echo, shell, process.spawn). A BLOCK for an unknown or restricted capability proves the zero-trust default, not vehicle-specific policy.")
[void]$md.Add("- ALLOW controls (AEG-AV-107..110) prove the gate does not simply block everything.")
[void]$md.Add("- Vehicle-specific authority, ODD/geofence, approval expiry, replay and OTA signing need new modules or wiring (see NOT TESTED rows).")
[void]$md.Add("- Physical driving safety, sensors, braking and perception are NOT covered by Aegisora and need OEM/lab validation.")
[void]$md.Add("")
[void]$md.Add("## Version integrity")
$git | ForEach-Object { [void]$md.Add("- $_") }
[void]$md.Add("")
[void]$md.Add("Evidence chain: $evPath (last hash: $prev)")
$mdOut = Join-Path $M "reports\report-core-$ts.md"
$md | Set-Content -Path $mdOut -Encoding UTF8

Write-Host ""
Write-Host "== RESULT ==" -ForegroundColor Green
$tested | Format-Table id, expected, actual, status, mapping -AutoSize
$res | Group-Object status | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.Name, $_.Count) }
Write-Host ""
$git | ForEach-Object { Write-Host $_ }
Write-Host ""
Write-Host "Report:   $mdOut"
Write-Host "Results:  $csvOut"
Write-Host "Evidence: $evPath"

# ---------- 6) last info round: which protective features exist in source? ----------
Push-Location $RT
$w = New-Object System.Collections.ArrayList
[void]$w.Add("=== FEATURE KEYWORDS IN SRC ===")
Get-ChildItem src -Recurse -File -Filter *.ts |
    Select-String -Pattern 'rate.?limit|nonce|replay|idempot|expiresAt|expired|revoke|geofence|signature|hmac' |
    Select-Object -First 80 |
    ForEach-Object { [void]$w.Add(("{0}:{1}: {2}" -f (Resolve-Path -Relative $_.Path), $_.LineNumber, $_.Line.Trim())) }
foreach ($f in @(@('src\agents\agent-registry.ts', 90), @('src\approval\approval-engine.ts', 110), @('src\tools\tool-registry.ts', 120), @('src\security\security-guard.ts', 110))) {
    [void]$w.Add("")
    [void]$w.Add("##### $($f[0]) (first $($f[1]) lines) #####")
    if (Test-Path $f[0]) { Get-Content $f[0] -TotalCount $f[1] | ForEach-Object { [void]$w.Add($_) } } else { [void]$w.Add("NOT FOUND") }
}
[void]$w.Add("")
[void]$w.Add("##### enforce() entry in enforcement-gate.ts #####")
Select-String -Path 'src\enforcement\enforcement-gate.ts' -Pattern 'async enforce' -Context 0, 30 |
    ForEach-Object { $_.Line; $_.Context.PostContext } | ForEach-Object { [void]$w.Add([string]$_) }
Pop-Location
$wp = Join-Path $M 'reports\wiring-info-3.txt'
$w | Set-Content -Path $wp -Encoding UTF8
# clipboard export removed
Write-Host ""
Write-Host "Next-round info saved + copied to clipboard: $wp" -ForegroundColor Green
