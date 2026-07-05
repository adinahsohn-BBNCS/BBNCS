param(
  [string]$User,
  [string]$Password,
  [string]$HostName = "bbncs.com",
  [string[]]$Paths = @("/public_html/", "/")
)

$ErrorActionPreference = "Continue"

$users = @($User, "${User}@${HostName}", "${User}@bbncs.com") | Select-Object -Unique

foreach ($tryUser in $users) {
  foreach ($ssl in @($true, $false)) {
    foreach ($path in $Paths) {
      $uri = "ftp://${HostName}${path}"
      Write-Host "Testing $uri as $tryUser SSL=$ssl ..."
      $req = [System.Net.FtpWebRequest]::Create($uri)
      $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
      $req.Credentials = New-Object System.Net.NetworkCredential($tryUser, $Password)
      $req.UsePassive = $true
      $req.EnableSsl = $ssl
      try {
        $resp = $req.GetResponse()
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $list = ($reader.ReadToEnd() -split "`r?`n" | Where-Object { $_ }) | Select-Object -First 8
        $reader.Close()
        $resp.Close()
        Write-Host "SUCCESS user=$tryUser ssl=$ssl path=$path"
        Write-Host "Items: $($list -join ', ')"
        exit 0
      } catch {
        Write-Host "Failed: $($_.Exception.Message)"
      }
    }
  }
}

exit 1
