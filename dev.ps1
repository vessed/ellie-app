# Opens Ellie App in live hot-reload dev mode.
# Usage: pwsh -File dev.ps1

$ErrorActionPreference = 'Stop'
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

Set-Location -LiteralPath $PSScriptRoot

Write-Host "Starting Ellie App in dev (hot-reload)..." -ForegroundColor Cyan
npm run app:dev