param([string]$ZipPath = (Join-Path (Split-Path -Parent $PSScriptRoot) "import\maintenance.zip"))

if (-not (Test-Path $ZipPath)) {
  Write-Host "NOT FOUND: $ZipPath"
  Get-ChildItem (Split-Path $ZipPath) -Force | ForEach-Object { Write-Host $_.Name }
  exit 1
}

$item = Get-Item $ZipPath
Write-Host "File: $($item.Name)"
Write-Host "Size: $([math]::Round($item.Length / 1MB, 2)) MB"
Write-Host "Modified: $($item.LastWriteTime)"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
Write-Host "Total entries: $($zip.Entries.Count)"

$tops = $zip.Entries | ForEach-Object {
  $parts = $_.FullName -replace '\\', '/' -split '/'
  if ($parts.Count -gt 0) { $parts[0] }
} | Where-Object { $_ } | Group-Object | Sort-Object Count -Descending

Write-Host "`nTop-level folders/files:"
$tops | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Name) ($($_.Count) entries)" }

Write-Host "`nSample paths:"
$zip.Entries | Select-Object -First 20 | ForEach-Object { Write-Host "  $($_.FullName)" }

$hasUploads = ($zip.Entries | Where-Object { $_.FullName -match 'uploads/' }).Count
$hasThemes = ($zip.Entries | Where-Object { $_.FullName -match 'themes/' }).Count
$hasPlugins = ($zip.Entries | Where-Object { $_.FullName -match 'plugins/' }).Count
Write-Host "`nwp-content breakdown:"
Write-Host "  uploads/: $hasUploads files"
Write-Host "  themes/:  $hasThemes files"
Write-Host "  plugins/: $hasPlugins files"

$zip.Dispose()
