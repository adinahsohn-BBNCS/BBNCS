# Delete specific remote FTP paths (handles filenames with spaces).
param([string[]]$RemotePaths)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Get-Content (Join-Path $ProjectRoot ".env.deploy") | ForEach-Object {
  if ($_ -match "^\s*#" -or $_ -match "^\s*$") { return }
  $name, $value = $_ -split "=", 2
  if ($name) { Set-Item -Path "env:$($name.Trim())" -Value $value.Trim() }
}

$base = if ($env:FTP_REMOTE_DIR) { $env:FTP_REMOTE_DIR.TrimEnd("/") } else { "/public_html" }

foreach ($path in $RemotePaths) {
  $uri = "ftp://$($env:SFTP_HOST)${base}/$path"
  Write-Host "Deleting $uri"
  try {
    $request = [Net.FtpWebRequest]::Create($uri)
    $request.Method = [Net.WebRequestMethods+Ftp]::DeleteFile
    $request.Credentials = New-Object Net.NetworkCredential($env:SFTP_USER, $env:SFTP_PASSWORD)
    $request.UsePassive = $true
    $request.EnableSsl = $true
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "  OK"
  } catch {
    Write-Warning "  $($_.Exception.Message)"
  }
}
