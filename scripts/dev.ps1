# Start BBNCS local preview (keeps running until you close this window).
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path "node_modules")) {
  Write-Host "Installing dependencies..."
  npm install
}

Write-Host ""
Write-Host "Starting BBNCS preview at http://localhost:4322/"
Write-Host "Leave this window open while you preview. Press Ctrl+C to stop."
Write-Host ""

npm run dev
