[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)] [string] $OutputPath,
  [string] $DatabaseUrl = $env:DATABASE_URL
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) { throw "DATABASE_URL is required. It is never printed by this script." }
if ([string]::IsNullOrWhiteSpace($OutputPath)) { throw "OutputPath is required." }

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputPath)
$outputDirectory = [System.IO.Path]::GetDirectoryName($resolvedOutput)
if ([string]::IsNullOrWhiteSpace($outputDirectory)) { throw "OutputPath must include a directory." }
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

& pg_dump --format=custom --no-owner --no-privileges --file=$resolvedOutput $DatabaseUrl
if ($LASTEXITCODE -ne 0) { throw "pg_dump failed." }

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedOutput).Hash.ToLowerInvariant()
$manifest = [ordered]@{ createdAt = (Get-Date).ToUniversalTime().ToString("o"); file = [System.IO.Path]::GetFileName($resolvedOutput); sha256 = $hash; format = "pg_dump custom" } | ConvertTo-Json
Set-Content -NoNewline -Encoding utf8 -LiteralPath "$resolvedOutput.manifest.json" -Value $manifest
Write-Output "Backup created and SHA-256 manifest written. Store both files in approved encrypted storage; apply retention under the case-data retention policy."
