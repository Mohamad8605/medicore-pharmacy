# Reset demo data for screencast recording
# Run this before starting the dev server

$demoDir = Join-Path $PSScriptRoot "..\.demo-data"

Write-Host "Resetting demo data..." -ForegroundColor Cyan

# Delete existing data
Remove-Item (Join-Path $demoDir "orders.json") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $demoDir "profiles.json") -Force -ErrorAction SilentlyContinue

Write-Host "Demo data cleared. Start the dev server to generate fresh data." -ForegroundColor Green
Write-Host "npm run dev" -ForegroundColor Yellow
