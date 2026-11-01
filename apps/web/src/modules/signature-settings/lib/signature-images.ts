import { fileDataUrl, imageDataBytes } from "@/shared/images/stored-image";
export { signaturePath } from "@/shared/images/signature-path";
import { signatureLimit, type SignatureValues } from "../schemas/signature-schema";

export function signatureBytes(value: string): Uint8Array<ArrayBuffer> {
  return imageDataBytes(value, signatureLimit, "signature");
}

export function typedSignature(name: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 640; canvas.height = 160;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Cannot create a signature image on this device.");
  context.fillStyle = "#1a1c1f";
  context.font = "48px cursive"; context.textBaseline = "middle";
  context.fillText(name.trim(), 24, 80, 592);
  return canvas.toDataURL("image/png");
}

export async function prepareSignature(values: SignatureValues, signal: AbortSignal): Promise<string> {
  const data = values.mode === "draw" ? values.drawing : values.mode === "type" ? typedSignature(values.name) : values.image ? await fileDataUrl(values.image, signal, "signature") : null;
  if (!data) throw new Error("Choose or create a signature first.");
  signatureBytes(data); return data;
}
