# Dot-source before FTPS requests. Hostinger's FTP server presents a valid certificate for *.hstgr.io,
# which never matches the IP we connect to; accept that one name mismatch and nothing else.
if (-not ("FtpCertPolicy" -as [type])) {
  Add-Type -TypeDefinition @"
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;

public static class FtpCertPolicy {
  public static string AllowedName = "*.hstgr.io";

  public static bool Validate(object sender, X509Certificate cert, X509Chain chain, SslPolicyErrors errors) {
    if (errors == SslPolicyErrors.None) return true;
    if (errors == SslPolicyErrors.RemoteCertificateNameMismatch && cert != null) {
      var name = new X509Certificate2(cert).GetNameInfo(X509NameType.SimpleName, false);
      return name == AllowedName;
    }
    return false;
  }

  public static void Install() {
    ServicePointManager.ServerCertificateValidationCallback = Validate;
  }
}
"@
}
[FtpCertPolicy]::Install()
