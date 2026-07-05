# Upload a single file via FTPS (for emergency fixes)
param(
  [Parameter(Mandatory = $true)]
  [string]$LocalFile,
  [Parameter(Mandatory = $true)]
  [string]$RemotePath
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.deploy"

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
  $name, $value = $_ -split "=", 2
  if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
}

$hostName = $env:SFTP_HOST
$base = if ($env:FTP_REMOTE_DIR) { $env:FTP_REMOTE_DIR.TrimEnd("/") } else { "/public_html" }
$remotePath = $RemotePath -replace "\\", "/"
$uri = "ftp://${hostName}${base}/${remotePath}"
$bytes = [IO.File]::ReadAllBytes($LocalFile)

Write-Host "Uploading $LocalFile -> $uri ($($bytes.Length) bytes)"

# Delete existing file first
try {
  $del = [Net.FtpWebRequest]::Create($uri)
  $del.Method = [Net.WebRequestMethods+Ftp]::DeleteFile
  $del.Credentials = New-Object Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
  $del.UsePassive = $true
  $del.EnableSsl = $true
  $del.GetResponse().Close()
  Write-Host "Deleted existing remote file"
} catch {
  Write-Host "No existing file to delete (ok)"
}

$request = [Net.FtpWebRequest]::Create($uri)
$request.Method = [Net.WebRequestMethods+Ftp]::UploadFile
$request.Credentials = New-Object Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
$request.UsePassive = $true
$request.UseBinary = $true
$request.EnableSsl = $true
$request.ContentLength = $bytes.Length
$stream = $request.GetRequestStream()
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()
$response = $request.GetResponse()
Write-Host "Upload response: $($response.StatusDescription)"
$response.Close()

# Verify via HTTP
Start-Sleep -Seconds 2
$check = Invoke-WebRequest -Uri "https://bbncs.com/" -UseBasicParsing
Write-Host "Live homepage size: $($check.Content.Length) bytes"
