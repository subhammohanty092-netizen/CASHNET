[CmdletBinding()]
param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$OutputDirectory = (Join-Path $env:TEMP "cashnet-phase6-backup-validation"),
  [string]$RestoreDatabaseName,
  [switch]$ConfirmCreateIsolatedRestoreDatabase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not $ConfirmCreateIsolatedRestoreDatabase) {
  throw "Refusing to create an isolated restore database. Re-run with -ConfirmCreateIsolatedRestoreDatabase after confirming this is the authorised PostgreSQL environment."
}
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "DATABASE_URL is required and is never printed." }

function Resolve-PostgresExecutable([string]$CommandName, [string]$FallbackPath) {
  $command = Get-Command $CommandName -ErrorAction SilentlyContinue
  $candidate = if ($null -ne $command) { [string]$command.Source } else { $FallbackPath }
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "$CommandName executable was not found. Install PostgreSQL client tools or add it to PATH." }
  return [System.IO.Path]::GetFullPath($candidate)
}

function Invoke-CashnetPsql([string]$Psql, [string]$Url, [string]$Sql, [switch]$Quiet) {
  if ($Quiet) {
    & $Psql --no-psqlrc --tuples-only --no-align --set "ON_ERROR_STOP=1" --dbname "$Url" --command "$Sql"
  } else {
    & $Psql --no-psqlrc --set "ON_ERROR_STOP=1" --dbname "$Url" --command "$Sql"
  }
  if ($LASTEXITCODE -ne 0) { throw "psql command failed." }
}

$psql = Resolve-PostgresExecutable "psql" "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$primaryUri = [uri]$DatabaseUrl
$primaryDatabase = $primaryUri.AbsolutePath.Trim('/')
if ([string]::IsNullOrWhiteSpace($primaryDatabase)) { throw "DATABASE_URL must include a database name." }
if ([string]::IsNullOrWhiteSpace($RestoreDatabaseName)) { $RestoreDatabaseName = "cashnet_phase6_restore_" + [guid]::NewGuid().ToString("N").Substring(0, 12) }
if ($RestoreDatabaseName -notmatch '^[a-z][a-z0-9_]{0,62}$' -or $RestoreDatabaseName -eq "cashnet") { throw "RestoreDatabaseName must be a new lower-case PostgreSQL identifier and cannot be cashnet." }

$escapedPrimaryDatabase = [regex]::Escape($primaryDatabase)
$targetDatabaseUrl = [regex]::Replace($DatabaseUrl, "/$escapedPrimaryDatabase(?=\?|$)", "/$RestoreDatabaseName", 1)
if ($targetDatabaseUrl -eq $DatabaseUrl) { throw "Could not derive a distinct isolated restore connection string." }

$exists = (Invoke-CashnetPsql $psql $DatabaseUrl "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '$RestoreDatabaseName');" -Quiet).Trim()
if ($exists -eq "t") { throw "Refusing to use pre-existing database $RestoreDatabaseName. Choose a new name." }

Write-Host "Creating isolated restore database $RestoreDatabaseName (primary cashnet is not modified)."
Invoke-CashnetPsql $psql $DatabaseUrl "CREATE DATABASE `"$RestoreDatabaseName`";"

$timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$backupPath = Join-Path $OutputDirectory "cashnet-phase6-$timestamp.backup"
& (Join-Path $PSScriptRoot "backup-cashnet.ps1") -OutputPath $backupPath -DatabaseUrl $DatabaseUrl
& (Join-Path $PSScriptRoot "restore-cashnet.ps1") -BackupPath $backupPath -TargetDatabaseUrl $targetDatabaseUrl -ConfirmIsolatedTarget

Write-Host "Verifying restored ledger, required data families, and audit immutability."
Invoke-CashnetPsql $psql $targetDatabaseUrl @'
SELECT 'migration_ledger' AS check, count(*)::text AS value FROM cashnet_schema_migrations
UNION ALL SELECT 'cases', count(*)::text FROM cases
UNION ALL SELECT 'investigations', count(*)::text FROM investigations
UNION ALL SELECT 'wallets', count(*)::text FROM wallets
UNION ALL SELECT 'transactions', count(*)::text FROM blockchain_transactions
UNION ALL SELECT 'graph_relationships', count(*)::text FROM investigation_graph_relationships
UNION ALL SELECT 'risk_runs', count(*)::text FROM risk_analysis_runs
UNION ALL SELECT 'risk_indicators', count(*)::text FROM risk_indicators
UNION ALL SELECT 'defi_interactions', count(*)::text FROM defi_protocol_interactions
UNION ALL SELECT 'mev_candidates', count(*)::text FROM mev_candidates
UNION ALL SELECT 'reports', count(*)::text FROM forensic_reports
UNION ALL SELECT 'audit_events', count(*)::text FROM audit_events
ORDER BY check;
'@

Invoke-CashnetPsql $psql $targetDatabaseUrl @'
DO $validation$
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM audit_events ORDER BY created_at DESC, id DESC LIMIT 1;
  IF target_id IS NULL THEN RAISE EXCEPTION 'Restored audit_events is empty.'; END IF;
  BEGIN
    UPDATE audit_events SET action = action WHERE id = target_id;
    RAISE EXCEPTION 'Restored audit UPDATE was not rejected.';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Audit events are immutable. UPDATE and DELETE are not permitted.' THEN
      RAISE NOTICE 'Restored audit UPDATE rejected by immutable-audit trigger.';
    ELSE RAISE;
    END IF;
  END;
  BEGIN
    DELETE FROM audit_events WHERE id = target_id;
    RAISE EXCEPTION 'Restored audit DELETE was not rejected.';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Audit events are immutable. UPDATE and DELETE are not permitted.' THEN
      RAISE NOTICE 'Restored audit DELETE rejected by immutable-audit trigger.';
    ELSE RAISE;
    END IF;
  END;
END $validation$;
'@

$manifestHash = (Get-Content -Raw -LiteralPath "$backupPath.manifest.json" | ConvertFrom-Json).sha256
Write-Host "PASS: backup=$backupPath manifest_sha256=$manifestHash restore_database=$RestoreDatabaseName"
Write-Host "The isolated restore database is intentionally retained for inspection. Drop it only under an approved cleanup procedure."
