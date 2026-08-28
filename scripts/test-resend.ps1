# Quick Resend API test - reads .env.supabase (never commit)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root ".env.supabase"
$key = $null
$from = "BBNCS Support <onboarding@resend.dev>"
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^RESEND_API_KEY=(.+)$") { $key = $matches[1].Trim() }
  if ($_ -match "^NOTIFY_FROM_EMAIL=(.+)$") { $from = $matches[1].Trim() }
}
if (-not $key) { throw "RESEND_API_KEY not in .env.supabase" }

$body = @{
  from    = $from
  to      = "adinahsohn@gmail.com"
  subject = "BBNCS Resend test"
  html    = "<p>If you see this, Resend is working.</p>"
} | ConvertTo-Json

Write-Host "Sending test to adinahsohn@gmail.com ..."
try {
  $r = Invoke-RestMethod -Uri "https://api.resend.com/emails" -Method POST `
    -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
    -Body $body
  Write-Host "OK Resend id:" $r.id
} catch {
  Write-Host "FAILED"
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  exit 1
}
