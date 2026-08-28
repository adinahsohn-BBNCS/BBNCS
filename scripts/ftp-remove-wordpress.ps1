# Remove leftover WordPress files from bbncs.com hosting (one-time / maintenance).
# Keeps .well-known, .htaccess, and the Astro site.

param([switch]$DryRun)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.deploy"

function Load-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { throw "Missing $Path" }
  Get-Content $Path | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $name, $value = $_ -split "=", 2
    if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
  }
}

function Get-FtpUri {
  param([string]$RemotePath)
  $hostName = $env:SFTP_HOST
  $base = $script:FtpRemoteRoot.TrimEnd("/")
  $suffix = $RemotePath.TrimStart("/")
  if ($suffix) { return "ftp://${hostName}${base}/${suffix}" }
  return "ftp://${hostName}${base}/"
}

function New-FtpRequest {
  param([string]$RemotePath, [string]$Method)
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
    $items += [PSCustomObject]@{ Name = $name; Path = $childPath; IsDirectory = $isDir }
  }
  return $items
}

function Remove-FtpTree {
  param([string]$RemotePath)
  foreach ($item in (Get-FtpDetailedListing -RemotePath $RemotePath)) {
    if ($item.IsDirectory) {
      Remove-FtpTree -RemotePath $item.Path
      if ($DryRun) {
        Write-Host "[dry-run] remove dir $($item.Path)"
        continue
      }
      Write-Host "  removing dir $($item.Path)"
      try {
        $request = New-FtpRequest -RemotePath $item.Path -Method ([System.Net.WebRequestMethods+Ftp]::RemoveDirectory)
        $response = $request.GetResponse()
        $response.Close()
      } catch {
        Write-Warning "  could not remove dir $($item.Path): $($_.Exception.Message)"
      }
    } else {
      if ($DryRun) {
        Write-Host "[dry-run] remove file $($item.Path)"
        continue
      }
      Write-Host "  removing file $($item.Path)"
      try {
        $request = New-FtpRequest -RemotePath $item.Path -Method ([System.Net.WebRequestMethods+Ftp]::DeleteFile)
        $response = $request.GetResponse()
        $response.Close()
      } catch {
        Write-Warning "  could not remove file $($item.Path): $($_.Exception.Message)"
      }
    }
  }
}

function Remove-FtpFileIfExists {
  param([string]$RemotePath)
  if ($DryRun) {
    Write-Host "[dry-run] remove file $RemotePath"
    return
  }
  try {
    $request = New-FtpRequest -RemotePath $RemotePath -Method ([System.Net.WebRequestMethods+Ftp]::DeleteFile)
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "  removed file $RemotePath"
  } catch {
    Write-Warning "  could not remove file ${RemotePath}: $($_.Exception.Message)"
  }
}

Set-Location $ProjectRoot
Load-EnvFile -Path $EnvFile

if (-not $env:SFTP_HOST -or -not $env:SFTP_USER -or -not $env:SFTP_PASSWORD) {
  throw "FTP credentials missing in .env.deploy"
}

$script:FtpRemoteRoot = if ($env:FTP_REMOTE_DIR) { $env:FTP_REMOTE_DIR } else { "/public_html" }

$wordpressDirs = @("wp-content", "wp-includes", "wp-admin")
$wordpressFiles = @(
  "xmlrpc.php",
  "wp-cron.php",
  "wp-links-opml.php",
  "wp-load.php",
  "wp-login.php",
  "wp-mail.php",
  "wp-settings.php",
  "wp-signup.php",
  "wp-trackback.php",
  "wp-config.php",
  "wp-config-sample.php",
  "wp-blog-header.php",
  "wp-comments-post.php",
  "index.php",
  "license.txt",
  "readme.html"
)

Write-Host "Removing WordPress leftovers from ftp://$($env:SFTP_HOST)$($script:FtpRemoteRoot)/"
if ($DryRun) { Write-Host "DRY RUN - no files will be deleted." }

foreach ($dir in $wordpressDirs) {
  $items = @()
  try { $items = Get-FtpDetailedListing -RemotePath $dir } catch {}
  if ($items.Count -gt 0) {
    Write-Host "Cleaning $dir/ ..."
    Remove-FtpTree -RemotePath $dir
    if (-not $DryRun) {
      try {
        $request = New-FtpRequest -RemotePath $dir -Method ([System.Net.WebRequestMethods+Ftp]::RemoveDirectory)
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "  removed dir $dir"
      } catch {
        Write-Warning "  could not remove dir ${dir}: $($_.Exception.Message)"
      }
    }
  }
}

foreach ($file in $wordpressFiles) {
  Remove-FtpFileIfExists -RemotePath $file
}

Write-Host ""
Write-Host "WordPress cleanup complete. Astro site and .well-known were not touched."
