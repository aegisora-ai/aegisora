param([string]$M = (Split-Path -Parent $PSScriptRoot))
$ErrorActionPreference = 'Stop'
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$sc = Import-Csv (Join-Path $M 'scenarios\scenarios.csv') -Delimiter '|' -Encoding UTF8
$cfg = Get-Content (Join-Path $M 'adapters\aegisora.config.json') -Raw | ConvertFrom-Json
$evPath = Join-Path $M "evidence\evidence-$ts.jsonl"
$sha = [System.Security.Cryptography.SHA256]::Create()
function Get-Sha([string]$s) { ($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($s)) | ForEach-Object { $_.ToString('x2') }) -join '' }
$prev = ('0' * 64)
$res = New-Object System.Collections.ArrayList
foreach ($s in $sc) {
    $status = 'NOT TESTED'; $actual = ''; $note = ''
    if ($s.owner -eq 'NEW') { $note = 'Yeni modul gerekiyor' }
    elseif ($s.owner -eq 'OEM') { $note = 'Arac/uretici/laboratuvar dogrulamasi gerekiyor' }
    elseif (-not $cfg.enabled) { $note = 'Adapter yapilandirilmadi (aegisora.config.json)' }
    else {
        $inPath = Join-Path $M ("scenarios\inputs\{0}.json" -f $s.id)
        if (-not (Test-Path $inPath)) { $note = 'Senaryo girdisi tanimli degil' }
        else {
            try {
                $h = @{}
                if ($cfg.apiKey) { $h['Authorization'] = "Bearer $($cfg.apiKey)" }
                $r = Invoke-RestMethod -Uri $cfg.endpoint -Method Post -Body (Get-Content $inPath -Raw) -ContentType 'application/json' -Headers $h -TimeoutSec 20
                $actual = [string]($r.($cfg.decisionField))
                if ($actual -eq $s.expected) { $status = 'PASS' } else { $status = 'FAIL' }
            } catch { $status = 'ERROR'; $note = $_.Exception.Message }
        }
    }
    $e = [ordered]@{ ts = (Get-Date).ToUniversalTime().ToString('o'); id = $s.id; expected = $s.expected; actual = $actual; status = $status; note = $note; prev = $prev }
    $json = $e | ConvertTo-Json -Compress
    $hash = Get-Sha $json
    $e['hash'] = $hash
    Add-Content -Path $evPath -Value ($e | ConvertTo-Json -Compress) -Encoding UTF8
    $prev = $hash
    [void]$res.Add([pscustomobject]@{ id = $s.id; group = $s.group; owner = $s.owner; risk = $s.risk; expected = $s.expected; actual = $actual; status = $status; note = $note; title = $s.title })
}
$csvOut = Join-Path $M "reports\results-$ts.csv"
$res | Export-Csv -Path $csvOut -NoTypeInformation -Encoding UTF8
$md = New-Object System.Collections.ArrayList
[void]$md.Add("# Aegisora Mobility Test Report $ts")
[void]$md.Add("")
[void]$md.Add("Total: $($res.Count) | PASS: $(@($res | ? status -eq 'PASS').Count) | FAIL: $(@($res | ? status -eq 'FAIL').Count) | ERROR: $(@($res | ? status -eq 'ERROR').Count) | NOT TESTED: $(@($res | ? status -eq 'NOT TESTED').Count)")
[void]$md.Add("Evidence chain: $evPath (last hash: $prev)")
[void]$md.Add("")
[void]$md.Add("| Owner | Total | PASS | FAIL | NOT TESTED |")
[void]$md.Add("|---|---|---|---|---|")
foreach ($g in ($res | Group-Object owner)) {
    [void]$md.Add("| $($g.Name) | $($g.Count) | $(@($g.Group | ? status -eq 'PASS').Count) | $(@($g.Group | ? status -eq 'FAIL').Count) | $(@($g.Group | ? status -eq 'NOT TESTED').Count) |")
}
[void]$md.Add("")
[void]$md.Add("Owner: CORE = Aegisora v4 direkt, NEW = yeni modul, OEM = arac/uretici/laboratuvar")
$mdOut = Join-Path $M "reports\report-$ts.md"
$md | Set-Content -Path $mdOut -Encoding UTF8
Write-Host "Report:   $mdOut"
Write-Host "Results:  $csvOut"
Write-Host "Evidence: $evPath"
$res | Group-Object status | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.Name, $_.Count) }
