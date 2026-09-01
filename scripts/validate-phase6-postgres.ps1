[CmdletBinding()]
param(
  [string] $DatabaseUrl = $env:DATABASE_URL,
  [switch] $SkipMigrations
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
  throw "DATABASE_URL is required. It is read only from the launching environment and is never printed."
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue
$psqlCandidates = @(
  $(if ($psqlCommand) { $psqlCommand.Source }),
  "C:\Program Files\PostgreSQL\18\bin\psql.exe"
) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }

if ($psqlCandidates.Count -eq 0) { throw "psql was not found. Install PostgreSQL client tools or add psql to PATH." }
$psql = $psqlCandidates[0]

function Invoke-CashnetPsql {
  param([Parameter(Mandatory = $true)][string] $Sql)
  # Keep the executable as a single scalar and every psql parameter as one
  # argument. This avoids PowerShell treating `C:\Program Files\...` as a
  # command fragment and keeps multi-line SQL intact on PowerShell 5.1 and 7.
  $psqlArguments = @(
    "--no-psqlrc",
    "--set", "ON_ERROR_STOP=1",
    "--dbname=$DatabaseUrl",
    "--command", $Sql
  )
  & $psql @psqlArguments
  if ($LASTEXITCODE -ne 0) { throw "psql validation command failed." }
}

if (-not $SkipMigrations) {
  Push-Location $projectRoot
  try {
    Write-Output "Running CASHNET migrations (first pass)."
    & pnpm --filter @workspace/db run migrate
    if ($LASTEXITCODE -ne 0) { throw "First migration pass failed." }
    Write-Output "Running CASHNET migrations (idempotency pass)."
    & pnpm --filter @workspace/db run migrate
    if ($LASTEXITCODE -ne 0) { throw "Second migration pass failed." }
  } finally {
    Pop-Location
  }
}

Write-Output "Migration ledger:"
Invoke-CashnetPsql @'
SELECT id, applied_at
FROM cashnet_schema_migrations
ORDER BY applied_at, id;
'@

Write-Output "Phase 6 tables:"
Invoke-CashnetPsql @'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'risk_analysis_runs', 'risk_indicator_evidence', 'risk_typologies',
    'graph_features', 'community_analysis_runs', 'graph_communities',
    'defi_protocol_interactions', 'mev_candidates', 'forensic_reports',
    'evaluation_runs'
  )
ORDER BY table_name;
'@

Write-Output "Phase 6 indexes, constraints, and foreign keys:"
Invoke-CashnetPsql @'
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename IN ('risk_indicators', 'risk_analysis_runs', 'graph_features',
                     'community_analysis_runs', 'graph_communities',
                     'defi_protocol_interactions', 'mev_candidates', 'forensic_reports')
       OR indexname IN ('graph_features_case_insensitive_unique', 'idx_risk_indicators_run'))
ORDER BY tablename, indexname;

SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('risk_indicators'::regclass, 'graph_features'::regclass,
                   'risk_analysis_runs'::regclass, 'risk_indicator_evidence'::regclass,
                   'community_analysis_runs'::regclass, 'graph_communities'::regclass,
                   'defi_protocol_interactions'::regclass, 'mev_candidates'::regclass,
                   'forensic_reports'::regclass)
ORDER BY table_name, conname;

SELECT tgname, tgenabled, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'audit_events'::regclass AND NOT tgisinternal;
'@

Write-Output "Testing audit UPDATE and DELETE immutability using an existing audit record. No data is committed."
Invoke-CashnetPsql @'
DO $validation$
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM audit_events ORDER BY created_at DESC, id DESC LIMIT 1;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'Cannot validate audit immutability: audit_events is empty.';
  END IF;

  BEGIN
    UPDATE audit_events SET action = action WHERE id = target_id;
    RAISE EXCEPTION 'Audit UPDATE was not rejected.';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Audit events are immutable. UPDATE and DELETE are not permitted.' THEN
      RAISE NOTICE 'Audit UPDATE rejected by immutable-audit trigger.';
    ELSE
      RAISE;
    END IF;
  END;

  BEGIN
    DELETE FROM audit_events WHERE id = target_id;
    RAISE EXCEPTION 'Audit DELETE was not rejected.';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Audit events are immutable. UPDATE and DELETE are not permitted.' THEN
      RAISE NOTICE 'Audit DELETE rejected by immutable-audit trigger.';
    ELSE
      RAISE;
    END IF;
  END;
END $validation$;
'@

Write-Output "Phase 6 PostgreSQL validation completed. Review the ledger and catalog output before marking a release gate passed."
