const fs = require('fs');
const script = [CmdletBinding()]
param(
  [string]$ApiBaseUrl = 'http://127.0.0.1:5001',
  [int]$Iterations = 20
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Invoke-CashnetApi([string]$Method, [string]$Path, [hashtable]$Body) {
  $params = @{
    Method = $Method
    Uri = "$ApiBaseUrl$Path"
    Headers = @{ 'X-Cashnet-Dev-Actor' = 'demo.admin' }
    ErrorAction = 'Stop'
  }
  if ($Body) {
    $params.Body = ($Body | ConvertTo-Json -Compress)
    $params.ContentType = 'application/json'
  }
  return Invoke-RestMethod @params
}

Write-Host "Running $Iterations iterations of Phase 6 performance validation..."
$results = @()
$successCount = 0
$failureCount = 0

$sw = [System.Diagnostics.Stopwatch]::StartNew()

for ($i = 1; $i -le $Iterations; $i++) {
  try {
    $iterationSw = [System.Diagnostics.Stopwatch]::StartNew()
    $case = Invoke-CashnetApi 'POST' '/api/v1/cases' @{ title = 'Perf-Case'; description = 'Perf-Case'; caseNumber = "PERF-$i"; fraudType = 'SCAM'; reportedAmount = '100' }
    $case = Invoke-CashnetApi 'PATCH' "/api/v1/cases/$($case.id)" @{ investigationAuthorizationStatus = 'APPROVED' }
    $investigation = Invoke-CashnetApi 'POST' '/api/v1/investigations' @{ caseId = $case.id; chain = 'ETHEREUM'; walletAddress = '0x0000000000000000000000000000000000000001'; investigationDepth = 2 }
    $investigation = Invoke-CashnetApi 'PATCH' "/api/v1/investigations/$($investigation.id)" @{ status = 'AUTHORIZED' }
    
    $risk = Invoke-CashnetApi 'POST' "/api/v1/investigations/$($investigation.id)/risk-analysis"
    $features = Invoke-CashnetApi 'POST' "/api/v1/investigations/$($investigation.id)/graph-features" @{ max_edges = 100 }
    $communities = Invoke-CashnetApi 'POST' "/api/v1/investigations/$($investigation.id)/communities" @{ max_nodes = 100; max_edges = 100; max_runtime_ms = 1000; max_communities = 10 }
    $defi = Invoke-CashnetApi 'POST' "/api/v1/investigations/$($investigation.id)/defi-mev-analysis"
    $report = Invoke-CashnetApi 'POST' "/api/v1/investigations/$($investigation.id)/reports" @{ report_type = 'FULL_FORENSIC' }
    
    $iterationSw.Stop()
    $results += $iterationSw.ElapsedMilliseconds
    $successCount++
  } catch {
    $failureCount++
    Write-Warning "Iteration $i failed: $_"
  }
}

$sw.Stop()

$results = $results | Sort-Object
$p50 = if ($results.Count -gt 0) { $results[[Math]::Floor($results.Count * 0.50)] } else { 0 }
$p95 = if ($results.Count -gt 0) { $results[[Math]::Floor($results.Count * 0.95)] } else { 0 }
$p99 = if ($results.Count -gt 0) { $results[[Math]::Floor($results.Count * 0.99)] } else { 0 }

Write-Host ''
Write-Host '=========================================='
Write-Host 'PHASE 6 PERFORMANCE VALIDATION RESULTS'
Write-Host '=========================================='
Write-Host "Workload Size: $Iterations full analytical lifecycles"
Write-Host 'Graph Size: up to 100 nodes/edges bounded'
Write-Host "Request Count: $($Iterations * 9)"
Write-Host "Success Count: $successCount"
Write-Host "Failure Count: $failureCount"
Write-Host "p50 duration (ms/lifecycle): $p50"
Write-Host "p95 duration (ms/lifecycle): $p95"
Write-Host "p99 duration (ms/lifecycle): $p99"
Write-Host "Test Duration (ms): $($sw.ElapsedMilliseconds)"
Write-Host 'Execution Environment: Local API Server + Postgres'
Write-Host '==========================================';
fs.writeFileSync('scripts/validate-phase6-performance.ps1', script);
