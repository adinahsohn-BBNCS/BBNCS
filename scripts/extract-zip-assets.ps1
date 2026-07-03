# Extract maintenance.zip (wp-content) and copy key assets to public/images.
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ZipPath = Join-Path $ProjectRoot "import\maintenance.zip"
$ExtractRoot = Join-Path $ProjectRoot "import\wp-content"
$UploadsRoot = Join-Path $ExtractRoot "uploads"
$PublicImages = Join-Path $ProjectRoot "public\images"

if (-not (Test-Path $ZipPath)) { throw "Missing $ZipPath" }

Write-Host "Extracting $ZipPath ..."
if (Test-Path $ExtractRoot) {
  Write-Host "Removing previous $ExtractRoot"
  Remove-Item $ExtractRoot -Recurse -Force
}
New-Item -ItemType Directory -Path $ExtractRoot -Force | Out-Null
Expand-Archive -Path $ZipPath -DestinationPath $ExtractRoot -Force
Write-Host "Extracted to import/wp-content/"

if (-not (Test-Path $UploadsRoot)) {
  throw "Expected uploads folder at $UploadsRoot"
}

function Copy-Asset {
  param([string]$RelativePath, [string]$DestRelative)
  $src = Join-Path $UploadsRoot ($RelativePath -replace '/', '\')
  $dest = Join-Path $PublicImages ($DestRelative -replace '/', '\')
  if (-not (Test-Path $src)) {
    Write-Warning "Missing: $RelativePath"
    return $false
  }
  $parent = Split-Path $dest -Parent
  New-Item -ItemType Directory -Path $parent -Force | Out-Null
  Copy-Item -Path $src -Destination $dest -Force
  Write-Host "Copied -> public/images/$DestRelative"
  return $true
}

# Priority assets for the new site
$assets = @(
  @{ Src = "2023/03/bbncs-logo-200.png"; Dest = "logo.png" },
  @{ Src = "2023/03/bbncs-logo.png"; Dest = "logo-full.png" },
  @{ Src = "2023/03/it-service-management.jpg"; Dest = "services/it-service-management.jpg" },
  @{ Src = "2023/03/home-content-background.jpg"; Dest = "services/home-content-background.jpg" },
  @{ Src = "2023/03/RCS-logo-75.png"; Dest = "clients/rcs-logo-75.png" },
  @{ Src = "2023/03/niterider-off-road-logo-75.png"; Dest = "clients/niterider-off-road-logo-75.png" },
  @{ Src = "2023/03/temecula-valley-buick-gmc-75.png"; Dest = "clients/temecula-valley-buick-gmc-75.png" },
  @{ Src = "2023/03/TQP-Logo.png"; Dest = "clients/tqp-logo.png" },
  @{ Src = "2023/03/epic-rollertainment.png"; Dest = "clients/epic-rollertainment.png" },
  @{ Src = "2023/03/certified-medical-sales.png"; Dest = "clients/certified-medical-sales.png" },
  @{ Src = "2023/03/Palm_Desert_AC.png"; Dest = "clients/palm-desert-ac.png" },
  @{ Src = "2023/03/allison-air-conditioning-logo.jpg"; Dest = "clients/allison-air-conditioning-logo.jpg" }
)

$copied = 0
foreach ($a in $assets) {
  if (Copy-Asset -RelativePath $a.Src -DestRelative $a.Dest) { $copied++ }
}

# Find largest bbncs logo if primary missing
$logoPath = Join-Path $PublicImages "logo.png"
if (-not (Test-Path $logoPath)) {
  $logoCandidate = Get-ChildItem $UploadsRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'bbncs.*logo' -and $_.Extension -match '\.(png|jpg|svg)$' } |
    Sort-Object Length -Descending |
    Select-Object -First 1
  if ($logoCandidate) {
    Copy-Item $logoCandidate.FullName $logoPath -Force
    Write-Host "Copied fallback logo from $($logoCandidate.FullName)"
    $copied++
  }
}

Write-Host ""
Write-Host "Done. Copied $copied assets to public/images/"
Write-Host "Full uploads archive at import/wp-content/uploads/"
