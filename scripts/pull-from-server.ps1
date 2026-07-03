# Pull WordPress assets from bbncs.com hosting via SFTP.
# Requires .env.deploy in project root (never commit).

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.deploy"
$ImportRoot = Join-Path $ProjectRoot "import"

function Load-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { throw "Missing $Path" }
  Get-Content $Path | ForEach-Object {
    if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
    $name, $value = $_ -split "=", 2
    if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
  }
}

function Ensure-PoshSSH {
  if (Get-Module -ListAvailable -Name Posh-SSH) {
    Import-Module Posh-SSH -ErrorAction Stop
    return
  }
  Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force -Scope CurrentUser | Out-Null
  Install-Module -Name Posh-SSH -Scope CurrentUser -Force -AllowClobber
  Import-Module Posh-SSH -ErrorAction Stop
}

function Get-RemoteListing {
  param($SessionId, [string]$RemotePath)
  Get-SFTPChildItem -SessionId $SessionId -Path $RemotePath | ForEach-Object {
    [PSCustomObject]@{
      Name = $_.Name
      IsDirectory = $_.IsDirectory
      FullName = $_.FullName
      Length = $_.Length
    }
  }
}

Set-Location $ProjectRoot
Load-EnvFile -Path $EnvFile
Ensure-PoshSSH

$secure = ConvertTo-SecureString $env:SFTP_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:SFTP_USER, $secure)
$port = if ($env:SFTP_PORT) { [int]$env:SFTP_PORT } else { 22 }

Write-Host "Connecting to $($env:SFTP_HOST):$port as $($env:SFTP_USER)..."
$session = New-SFTPSession -ComputerName $env:SFTP_HOST -Port $port -Credential $credential -AcceptKey -Force
if (-not $session) { throw "SFTP connection failed" }

try {
  $remote = $env:SFTP_REMOTE_DIR
  Write-Host "Listing $remote ..."
  $listing = Get-RemoteListing -SessionId $session.SessionId -RemotePath $remote
  $listing | Format-Table -AutoSize

  $pullDirs = @("wp-content/uploads", "wp-content/themes")
  foreach ($rel in $pullDirs) {
    $remoteDir = "$remote/$rel".Replace("//", "/")
    $localDir = Join-Path $ImportRoot ($rel -replace "/", [IO.Path]::DirectorySeparatorChar)
    New-Item -ItemType Directory -Path $localDir -Force | Out-Null
    Write-Host "Downloading $remoteDir -> $localDir"
    Get-SFTPItem -SessionId $session.SessionId -Path $remoteDir -Destination $localDir -Force
  }
} finally {
  Remove-SFTPSession -SessionId $session.SessionId | Out-Null
}

Write-Host "Done. Files saved under import/"
