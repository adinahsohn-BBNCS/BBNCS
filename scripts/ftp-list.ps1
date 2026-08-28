# List FTPS directory contents (read-only diagnostic)
param([string]$RemotePath = "")

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.deploy"

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
  $name, $value = $_ -split "=", 2
  if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
}

$base = if ($env:FTP_REMOTE_DIR) { $env:FTP_REMOTE_DIR.TrimEnd("/") } else { "/public_html" }
$suffix = $RemotePath.TrimStart("/")
$uri = if ($suffix) { "ftp://$($env:SFTP_HOST)${base}/$suffix" } else { "ftp://$($env:SFTP_HOST)${base}/" }

$request = [Net.FtpWebRequest]::Create($uri)
$request.Method = [Net.WebRequestMethods+Ftp]::ListDirectoryDetails
$request.Credentials = New-Object Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
$request.UsePassive = $true
$request.EnableSsl = $true
$response = $request.GetResponse()
$reader = New-Object IO.StreamReader($response.GetResponseStream())
$text = $reader.ReadToEnd()
$reader.Close()
$response.Close()

Write-Host "Listing: $uri"
$text -split "`r?`n" | Where-Object { $_.Trim() } | ForEach-Object { Write-Host $_ }
