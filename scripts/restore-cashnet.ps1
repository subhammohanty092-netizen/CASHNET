[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $BackupPath,
  [Parameter(Mandatory = $true)] [string] $TargetDatabaseUrl,
  [switch] $ConfirmIsolatedTarget,
  [string] $PgRestorePath
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmIsolatedTarget) { throw "Restore requires -ConfirmIsolatedTarget and must target a disposable isolated database." }
$resolvedBackup = [System.IO.Path]::GetFullPath($BackupPath)
if (-not (Test-Path -LiteralPath $resolvedBackup -PathType Leaf)) { throw "Backup file was not found." }
$manifestPath = "$resolvedBackup.manifest.json"
if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
  $manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json
  $actual = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedBackup).Hash.ToLowerInvariant()
  if ($manifest.sha256 -ne $actual) { throw "Backup integrity verification failed." }
}
if ($TargetDatabaseUrl -match "[/=:]cashnet([?/#]|$)") { throw "Refusing to restore into the primary cashnet database. Use a separately created temporary target." }

function Resolve-PgRestore([string]$RequestedPath) {
  if (-not [string]::IsNullOrWhiteSpace($RequestedPath)) {
    $candidate = [string]$RequestedPath
  } else {
    $command = Get-Command pg_restore -ErrorAction SilentlyContinue
    $candidate = if ($null -ne $command) { [string]$command.Source } else { "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" }
  }
  if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw "pg_restore executable was not found. Install PostgreSQL client tools or provide -PgRestorePath." }
  return [System.IO.Path]::GetFullPath($candidate)
}

$pgRestore = Resolve-PgRestore $PgRestorePath
& $pgRestore --clean --if-exists --no-owner --no-privileges "--dbname=$TargetDatabaseUrl" $resolvedBackup
if ($LASTEXITCODE -ne 0) { throw "pg_restore failed." }
Write-Output "Restore completed. Next verify the migration ledger, foreign keys, record counts, and audit immutability before any controlled promotion."
