import { readFileSync, writeFileSync } from "node:fs";
import { rootCertificates } from "node:tls";

if (process.platform !== "linux" || process.getuid?.() !== 0 || process.env.ORYX_CUSTOMER_INSTALL_FIXTURE !== "container-only") {
  throw new Error("APT bootstrap is restricted to the disposable validation build stage.");
}
// The slim image lacks the OS CA package. Bootstrap HTTPS from the pinned Node image's
// public trust bundle; APT still verifies TLS peers and Debian's signed package indexes.
writeFileSync("/tmp/oryx-apt-ca.pem", rootCertificates.join("\n"));
const path = "/etc/apt/sources.list.d/debian.sources";
writeFileSync(path, readFileSync(path, "utf8").replaceAll("http://deb.debian.org", "https://deb.debian.org"));
