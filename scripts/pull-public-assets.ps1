# Pull key images from bbncs.com into public/images (for local dev and deploy).
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$Base = "https://bbncs.com/wp-content/uploads/2023/03"
$Out = Join-Path $ProjectRoot "public\images"

$files = @{
  "logo.png" = "$Base/bbncs-logo-200.png"
  "services\it-service-management.jpg" = "$Base/it-service-management.jpg"
  "services\home-content-background.jpg" = "$Base/home-content-background.jpg"
  "clients\rcs-logo-75.png" = "$Base/RCS-logo-75.png"
  "clients\niterider-off-road-logo-75.png" = "$Base/niterider-off-road-logo-75.png"
  "clients\temecula-valley-buick-gmc-75.png" = "$Base/temecula-valley-buick-gmc-75.png"
  "clients\tqp-logo.png" = "$Base/TQP-Logo.png"
  "clients\epic-rollertainment.png" = "$Base/epic-rollertainment.png"
  "clients\certified-medical-sales.png" = "$Base/certified-medical-sales.png"
  "clients\palm-desert-ac.png" = "$Base/Palm_Desert_AC.png"
  "clients\allison-air-conditioning-logo.jpg" = "$Base/allison-air-conditioning-logo.jpg"
}

foreach ($entry in $files.GetEnumerator()) {
  $local = Join-Path $Out $entry.Key
  $parent = Split-Path $local -Parent
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  if (Test-Path $local) {
    Write-Host "skip $($entry.Key)"
    continue
  }
  try {
    Write-Host "GET $($entry.Value)"
    Invoke-WebRequest -Uri $entry.Value -OutFile $local -UseBasicParsing
  } catch {
    Write-Warning "Failed $($entry.Key): $($_.Exception.Message)"
  }
}

Write-Host "Done."
