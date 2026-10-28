import { verifyStoredImage } from "@/shared/images/stored-image";
import { signatureBytes, signaturePath } from "./signature-images";

/** The upload endpoint can silently fail with HTTP 204. Read the file back before confirming it. */
export async function verifySignature(stored: string | null, data: string, signal: AbortSignal): Promise<void> {
  await verifyStoredImage(signaturePath(stored), signatureBytes(data), { Module: "Settings", SubModule: "Signature" }, signal, "signature");
}
