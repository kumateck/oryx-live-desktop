import { createPublicKey, verify } from "node:crypto";
import { jsonObject, parseJson, versionParts } from "../../../../shared/desktop-updates.ts";

export interface InstallerRelease { version: string; platform: "win32"; arch: "universal"; size: number; sha512: string; notes: string }
export function feedPath(): string { return "/downloads/desktop/windows/latest.json"; }
export function installerPath(version: string): string {
  versionParts(version);
  return `/downloads/desktop/windows/${version}/OryxLiveDesktop-Setup.exe`;
}
/** Sign the exact UTF-8 payload, including version, target, size and digest; server hashes alone are not trust. */
export function verifyRelease(text: string, publicKey: string, arch: "ia32" | "x64"): InstallerRelease {
  if (Buffer.byteLength(text) > 64 * 1024) throw new Error("Update metadata is too large");
  const envelope = jsonObject(parseJson(text));
  if (typeof envelope.payload !== "string" || typeof envelope.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature)) throw new Error("Invalid update signature envelope");
  const key = createPublicKey(publicKey);
  if (key.asymmetricKeyType !== "ed25519" || !verify(null, Buffer.from(envelope.payload), key, Buffer.from(envelope.signature, "base64"))) throw new Error("The update signature could not be verified");
  const item = jsonObject(parseJson(envelope.payload));
  if (typeof item.version !== "string" || item.platform !== "win32" || (item.arch !== "universal" || !Array.isArray(item.architectures) || !item.architectures.includes(arch) || !item.architectures.includes("ia32") || !item.architectures.includes("x64")) || typeof item.size !== "number" || !Number.isSafeInteger(item.size) || item.size < 1 || item.size > 1024 ** 3 || typeof item.sha512 !== "string" || !/^[a-f0-9]{128}$/.test(item.sha512) || typeof item.notes !== "string" || item.notes.length > 8000) throw new Error("Invalid installer release");
  versionParts(item.version);
  return { version: item.version, platform: item.platform, arch: "universal", size: item.size, sha512: item.sha512, notes: item.notes };
}
