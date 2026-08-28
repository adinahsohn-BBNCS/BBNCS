# Deploy ticket Edge Functions to Supabase (BBNCS-TICKETS).
# Prerequisites: npx supabase login, .env.supabase with secrets

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
    Write-Host "Create .env.supabase from .env.supabase.example" -ForegroundColor Yellow
    exit 1
  }

  if (-not $env:SUPABASE_ACCESS_TOKEN) {
    Write-Host "Run: npx supabase login" -ForegroundColor Yellow
    exit 1
  }

  $siteUrl = if ($env:SITE_URL) { $env:SITE_URL } else { "https://bbncs.com" }

  Write-Host "Linking project $ProjectRef..."
  npx supabase link --project-ref $ProjectRef

  $secretArgs = @("SITE_URL=$siteUrl")
  if ($env:RESEND_API_KEY) { $secretArgs += "RESEND_API_KEY=$env:RESEND_API_KEY" }
  if ($env:NOTIFY_FROM_EMAIL) { $secretArgs += "NOTIFY_FROM_EMAIL=$env:NOTIFY_FROM_EMAIL" }
  if ($env:GOOGLE_CLIENT_ID) { $secretArgs += "GOOGLE_CLIENT_ID=$env:GOOGLE_CLIENT_ID" }
  if ($env:GOOGLE_CLIENT_SECRET) { $secretArgs += "GOOGLE_CLIENT_SECRET=$env:GOOGLE_CLIENT_SECRET" }

  Write-Host "Setting Edge Function secrets..."
  npx supabase secrets set @secretArgs

  foreach ($fn in @("ticket-notify", "ticket-attachment", "calendar-oauth", "calendar-sync", "calendar-events")) {
    Write-Host "Deploying $fn..."
    npx supabase functions deploy $fn
  }

  Write-Host ""
  Write-Host "Done. Run 002_ticket_extras.sql in Supabase SQL Editor if not already applied." -ForegroundColor Green
}
finally {
  Pop-Location
}
