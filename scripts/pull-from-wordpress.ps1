# Pull public WordPress content from bbncs.com (no login required).
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ImportRoot = Join-Path $ProjectRoot "import"
$ContentDir = Join-Path $ImportRoot "content"
$MediaDir = Join-Path $ImportRoot "media"
$BaseUrl = "https://bbncs.com"

New-Item -ItemType Directory -Path $ContentDir -Force | Out-Null
New-Item -ItemType Directory -Path $MediaDir -Force | Out-Null

function Get-WpJson {
  param([string]$Path)
  $url = "$BaseUrl/wp-json$Path"
  Write-Host "Fetching $url"
  return Invoke-RestMethod -Uri $url -Method Get
}

function Get-AllPages {
  param([string]$Endpoint)
  $page = 1
  $all = @()
  do {
    $batch = Invoke-RestMethod -Uri "$BaseUrl/wp-json/wp/v2/$Endpoint`?per_page=100&page=$page" -Method Get
    if (-not $batch -or $batch.Count -eq 0) { break }
    $all += $batch
    $page++
  } while ($batch.Count -eq 100)
  return $all
}

Write-Host "Downloading pages..."
$pages = Get-AllPages -Endpoint "pages"
$pages | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $ContentDir "pages.json") -Encoding UTF8
Write-Host "  $($pages.Count) pages saved"

Write-Host "Downloading posts..."
$posts = Get-AllPages -Endpoint "posts"
$posts | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $ContentDir "posts.json") -Encoding UTF8
Write-Host "  $($posts.Count) posts saved"

Write-Host "Downloading media..."
$media = Get-AllPages -Endpoint "media"
$media | ConvertTo-Json -Depth 20 | Set-Content (Join-Path $ContentDir "media.json") -Encoding UTF8
Write-Host "  $($media.Count) media items cataloged"

$downloaded = 0
foreach ($item in $media) {
  $url = $item.source_url
  if (-not $url) { continue }
  try {
    $uri = [Uri]$url
    $relative = $uri.AbsolutePath -replace "^/wp-content/uploads/", ""
    if (-not $relative -or $relative -eq $uri.AbsolutePath) { continue }
    $localPath = Join-Path $MediaDir ($relative -replace "/", [IO.Path]::DirectorySeparatorChar)
    $parent = Split-Path $localPath -Parent
    if (Test-Path $localPath) { continue }
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
    Invoke-WebRequest -Uri $url -OutFile $localPath -UseBasicParsing
    $downloaded++
  } catch {
    Write-Warning "Could not download $url : $($_.Exception.Message)"
  }
}

Write-Host "Downloaded $downloaded media files to import/media/"

# Save simplified markdown-friendly extracts per page
$extractDir = Join-Path $ContentDir "pages"
New-Item -ItemType Directory -Path $extractDir -Force | Out-Null
foreach ($p in $pages) {
  $slug = if ($p.slug) { $p.slug } else { "page-$($p.id)" }
  $extract = @{
    id = $p.id
    slug = $p.slug
    title = $p.title.rendered
    link = $p.link
    excerpt = $p.excerpt.rendered
    content = $p.content.rendered
    modified = $p.modified
  }
  $extract | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $extractDir "$slug.json") -Encoding UTF8
}

Write-Host "Done. Content in import/content/, images in import/media/"
