$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$EnvFile = Join-Path $ProjectRoot ".env.deploy"

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
  $name, $value = $_ -split "=", 2
  if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
}

$root = if ($env:FTP_REMOTE_DIR) { $env:FTP_REMOTE_DIR } else { "/public_html" }
$hostName = $env:SFTP_HOST
$base = $root.TrimEnd("/")

function Invoke-FtpList {
  param([string]$RemotePath)
  $suffix = $RemotePath.TrimStart("/")
  $uri = if ($suffix) { "ftp://${hostName}${base}/${suffix}" } else { "ftp://${hostName}${base}/" }
  $request = [System.Net.FtpWebRequest]::Create($uri)
  $request.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
  $request.Credentials = New-Object System.Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
  $request.UsePassive = $true
  $request.EnableSsl = $true
  $response = $request.GetResponse()
  $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
  $text = $reader.ReadToEnd()
  $reader.Close()
  $response.Close()
  return $text
}

Write-Host "=== public_html root ==="
Invoke-FtpList "" | Write-Host

foreach ($path in @("about", "about-us", "blog", "contact")) {
  Write-Host "`n=== $path ==="
  try {
    Invoke-FtpList $path | Write-Host
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
  }
}
