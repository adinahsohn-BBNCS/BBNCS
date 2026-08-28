# Deploy Google Calendar Edge Functions to Supabase (BBNCS-TICKETS).
# Prerequisites: npx supabase login, then create .env.supabase from .env.supabase.example

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.supabase"
$ProjectRef = "uuoeebuivoxnwapgpnaq"

function Load-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $false }
  Get-Content $Path | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $name, $value = $_ -split "=", 2
    if ($name) {
      Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
    }
  }
  return $true
}

Push-Location $ProjectRoot
try {
  if (-not (Load-EnvFile $EnvFile)) {
    Write-Host "Create .env.supabase from .env.supabase.example (Google OAuth + optional access token)." -ForegroundColor Yellow
    exit 1
  }

  if (-not $env:GOOGLE_CLIENT_ID -or -not $env:GOOGLE_CLIENT_SECRET) {
    Write-Host "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.supabase" -ForegroundColor Red
    exit 1
  }

  if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "Run: npx supabase login" -ForegroundColor Yellow
    Write-Host "Or add SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens to .env.supabase"
    exit 1
  }

  $siteUrl = if ($env:SITE_URL) { $env:SITE_URL } else { "https://bbncs.com" }

  Write-Host "Linking project $ProjectRef..."
  npx supabase link --project-ref $ProjectRef

  Write-Host "Setting Edge Function secrets..."
  npx supabase secrets set `
    "GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID" `
    "GOOGLE_CLIENT_SECRET=$env:GOOGLE_CLIENT_SECRET" `
    "SITE_URL=$siteUrl"

  Write-Host "Deploying calendar-oauth..."
  npx supabase functions deploy calendar-oauth

  Write-Host "Deploying calendar-sync..."
  npx supabase functions deploy calendar-sync

  Write-Host "Deploying calendar-events..."
  npx supabase functions deploy calendar-events

  Write-Host ""
  Write-Host "Done. Open https://bbncs.com/admin/tickets/settings/ and click Connect Google Calendar." -ForegroundColor Green
}
finally {
  Pop-Location
}
