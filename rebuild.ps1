# Rebuilds the Ellie App Windows installer (.exe).
# Usage:  pwsh -File rebuild.ps1
# Output: src-tauri\target\release\bundle\nsis\Ellie App_0.1.0_x64-setup.exe

$ErrorActionPreference = 'Stop'
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

Set-Location -LiteralPath $PSScriptRoot

Write-Host "Building Ellie App..." -ForegroundColor Magenta
npm run tauri build

Write-Host "`nDone! Installer:" -ForegroundColor Green
Get-ChildItem -Path "src-tauri\target\release\bundle\nsis" -Filter *.exe -ErrorAction SilentlyContinue |
    Select-Object FullName, Length