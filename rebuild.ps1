# Rebuilds the Ellie App Windows installer (.exe).
# Usage:  pwsh -File rebuild.ps1
# Output: src-tauri\target\release\bundle\nsis\Ellie App_<version>_x64-setup.exe

$ErrorActionPreference = 'Stop'
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

Set-Location -LiteralPath $PSScriptRoot

# The updater key in this folder has an empty password. Load it automatically
# so the signed updater artifact is always produced.
$keyPath = Join-Path $PSScriptRoot 'tauri-updater-private.key'
if (Test-Path -LiteralPath $keyPath) {
    $env:TAURI_SIGNING_PRIVATE_KEY = (Get-Content -Raw -LiteralPath $keyPath).Trim()
    Remove-Item Env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD -ErrorAction SilentlyContinue
}

Write-Host "Building Ellie App..." -ForegroundColor Magenta
npm run tauri build

Write-Host "`nDone! Installer:" -ForegroundColor Green
Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter *.exe -ErrorAction SilentlyContinue |
    Select-Object FullName, Length