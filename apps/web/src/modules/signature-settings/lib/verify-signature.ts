import { tokenStore } from "@/shared/auth/token-store";
import { signatureBytes, signaturePath } from "./signature-images";

/** The upload endpoint can silently fail with HTTP 204. Read the file back before confirming it. */
export async function verifySignature(stored: string | null, data: string, signal: AbortSignal): Promise<void> {
  const path = signaturePath(stored);
  if (!path) throw new Error("The server did not provide a signature that can be verified.");
  const expected = signatureBytes(data);
  const headers = new Headers({ Module: "Settings", SubModule: "Signature" });
  const token = tokenStore.accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { headers, credentials: "omit", cache: "no-store", signal });
  if (!response.ok) throw new Error("The uploaded signature could not be read back. Keep your draft and try again.");
  const actual = new Uint8Array(await response.arrayBuffer());
  if (actual.length !== expected.length || !actual.every((byte, index) => byte === expected[index])) {
    throw new Error("The server did not confirm the new signature was stored. Keep your draft and try again.");
  }
}
