import { appendFile } from "node:fs/promises";
import { desktopSigningStatus } from "../shared/desktop-signing.ts";

const status = desktopSigningStatus(process.env.ORYX_DESKTOP_UPDATE_PUBLIC_KEY ?? "", process.env.ORYX_DESKTOP_UPDATE_PRIVATE_KEY ?? "");
const message = status.configured
  ? `Desktop update signing configured. Verification-key SHA256: ${status.fingerprint}`
  : "Manual-only installer: desktop update signing keys are not configured. This build cannot accept in-app desktop updates.";
console.log(message);
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `configured=${status.configured}\n`);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${message}\n\n`);
