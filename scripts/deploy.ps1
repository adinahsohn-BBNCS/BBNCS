# Deploy BBNCS Astro site to bbncs.com hosting via FTPS (FTP over SSL).
# Requires .env.deploy - copy from .env.deploy.example

param(
  [switch]$SkipBuild,
  [switch]$SkipClean,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DistPath = Join-Path $ProjectRoot "dist"
$EnvFile = Join-Path $ProjectRoot ".env.deploy"

function Load-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }
  Get-Content $Path | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $name, $value = $_ -split "=", 2
    if ($name) {
      Set-Item -Path "env:$($name.Trim())" -Value $value.Trim()
    }
  }
}

function Get-FtpUri {
  param([string]$RemotePath)
  $hostName = $env:SFTP_HOST
  $base = $script:FtpRemoteRoot.TrimEnd("/")
  $suffix = $RemotePath.TrimStart("/")
  if ($suffix) {
    return "ftp://${hostName}${base}/${suffix}"
  }
  return "ftp://${hostName}${base}/"
}

function New-FtpRequest {
  param(
    [string]$RemotePath,
    [string]$Method
  )
  $request = [System.Net.FtpWebRequest]::Create((Get-FtpUri -RemotePath $RemotePath))
  $request.Method = $Method
  $request.Credentials = New-Object System.Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
  $request.UsePassive = $true
  $request.UseBinary = $true
  $request.EnableSsl = $true
  $request.KeepAlive = $false
  return $request
}

function Get-FtpDetailedListing {
  param([string]$RemotePath = "")
  $request = New-FtpRequest -RemotePath $RemotePath -Method ([System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails)
  $response = $request.GetResponse()
  $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
  $text = $reader.ReadToEnd()
  $reader.Close()
  $response.Close()

  $items = @()
  foreach ($line in ($text -split "`r?`n")) {
    if (-not $line.Trim()) { continue }
    $isDir = $line.StartsWith("d")
    $name = ($line -split "\s+")[-1]
    if ($name -in @(".", "..")) { continue }
    $childPath = if ($RemotePath) { "$RemotePath/$name" } else { $name }
    $items += [PSCustomObject]@{
      Name = $name
      Path = $childPath
      IsDirectory = $isDir
    }
  }
  return $items
}

function Remove-FtpTree {
  param([string]$RemotePath)
  foreach ($item in (Get-FtpDetailedListing -RemotePath $RemotePath)) {
    if ($item.Name -eq ".well-known") { continue }
    if ($item.IsDirectory) {
      Remove-FtpTree -RemotePath $item.Path
      Write-Host "  removing dir $($item.Path)"
      $request = New-FtpRequest -RemotePath $item.Path -Method ([System.Net.WebRequestMethods+Ftp]::RemoveDirectory)
      $response = $request.GetResponse()
      $response.Close()
    } else {
      Write-Host "  removing file $($item.Path)"
      $request = New-FtpRequest -RemotePath $item.Path -Method ([System.Net.WebRequestMethods+Ftp]::DeleteFile)
      $response = $request.GetResponse()
      $response.Close()
    }
  }
}

function Ensure-FtpDirectory {
  param([string]$RemotePath)
  if (-not $RemotePath) { return }
  $parts = $RemotePath -split "/"
  $current = ""
  foreach ($part in $parts) {
    if (-not $part) { continue }
    $current = if ($current) { "$current/$part" } else { $part }
    try {
      $null = Get-FtpDetailedListing -RemotePath $current
    } catch {
      Write-Host "  creating dir $current"
      $request = New-FtpRequest -RemotePath $current -Method ([System.Net.WebRequestMethods+Ftp]::MakeDirectory)
      $response = $request.GetResponse()
      $response.Close()
    }
  }
}

function Send-FtpFile {
  param(
    [string]$LocalPath,
    [string]$RemotePath
  )
  $remoteDir = Split-Path $RemotePath -Parent
  if ($remoteDir) {
    Ensure-FtpDirectory -RemotePath ($remoteDir -replace "\\", "/")
  }
  $request = New-FtpRequest -RemotePath $RemotePath -Method ([System.Net.WebRequestMethods+Ftp]::UploadFile)
  $request.ContentLength = (Get-Item $LocalPath).Length
  $stream = $request.GetRequestStream()
  $fileBytes = [System.IO.File]::ReadAllBytes($LocalPath)
  $stream.Write($fileBytes, 0, $fileBytes.Length)
  $stream.Close()
  $response = $request.GetResponse()
  $response.Close()
}

function Upload-FtpDirectory {
  param(
    [string]$LocalPath,
    [string]$RemotePath = ""
  )
  Get-ChildItem -LiteralPath $LocalPath -Force | ForEach-Object {
    $item = $_
    $remoteItem = if ($RemotePath) { "$RemotePath/$($item.Name)" } else { $item.Name }
    if ($item.PSIsContainer) {
      Ensure-FtpDirectory -RemotePath $remoteItem
      Upload-FtpDirectory -LocalPath $item.FullName -RemotePath $remoteItem
    } else {
      try {
        Send-FtpFile -LocalPath $item.FullName -RemotePath $remoteItem
        Write-Host "  uploaded $remoteItem"
        Start-Sleep -Milliseconds 250
      } catch {
        Write-Host "  retrying $remoteItem"
        Start-Sleep -Seconds 2
        Send-FtpFile -LocalPath $item.FullName -RemotePath $remoteItem
        Write-Host "  uploaded $remoteItem"
        Start-Sleep -Milliseconds 250
      }
    }
  }
}

Set-Location $ProjectRoot
Load-EnvFile -Path $EnvFile

if (-not $env:SFTP_HOST -or -not $env:SFTP_USER -or -not $env:SFTP_PASSWORD) {
  throw "FTP credentials missing. Add SFTP_HOST, SFTP_USER, and SFTP_PASSWORD to .env.deploy."
}

if ($env:FTP_REMOTE_DIR) {
  $script:FtpRemoteRoot = $env:FTP_REMOTE_DIR
} elseif ($env:SFTP_REMOTE_DIR -match "public_html") {
  $script:FtpRemoteRoot = "/public_html"
} else {
  $script:FtpRemoteRoot = "/public_html"
}

if (-not $SkipBuild) {
  Write-Host "Building site..."
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
}

if (-not (Test-Path $DistPath)) {
  throw "dist/ not found - run npm run build first"
}

$fileCount = (Get-ChildItem -Path $DistPath -Recurse -File).Count
Write-Host "Ready to upload $fileCount files from dist/ to ftp://$($env:SFTP_HOST)$($script:FtpRemoteRoot)/"

if ($DryRun) {
  Write-Host "Dry run - would clear $($script:FtpRemoteRoot) (except .well-known) and upload from $DistPath"
  exit 0
}

Write-Host "Clearing old site (keeping .well-known for SSL)..."
if ($SkipClean) {
  Write-Host "Skipping cleanup (-SkipClean)."
} else {
  Remove-FtpTree -RemotePath ""
}

Write-Host "Uploading new site from dist/ ..."
Upload-FtpDirectory -LocalPath $DistPath

Write-Host ""
Write-Host "Deploy complete. Verify https://bbncs.com"
