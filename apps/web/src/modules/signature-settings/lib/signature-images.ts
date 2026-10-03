import { signatureLimit, type SignatureValues } from "../schemas/signature-schema";

/** Only server signature paths are requested. A legacy HTTP host is never followed. */
export function signaturePath(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, "https://oryx.invalid");
    if (!/^\/api\/v1\/file\/signature\/[a-z0-9_-]+\.(?:png|jpe?g|webp)$/i.test(url.pathname)) return null;
    return url.pathname;
  } catch { return null; }
}

export function signatureBytes(value: string): Uint8Array<ArrayBuffer> {
  const match = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match?.[2] || match[2].length > Math.ceil(signatureLimit / 3) * 4) throw new Error("Choose a supported signature image up to 2 MiB.");
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = [82, 73, 70, 70].every((byte, index) => bytes[index] === byte) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
  if (bytes.length > signatureLimit || !(match[1] === "png" && png || match[1] === "jpeg" && jpeg || match[1] === "webp" && webp)) throw new Error("The file does not contain a supported signature image.");
  return bytes;
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

function imageDataUrl(file: File, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new Error("Signature processing was cancelled.")); };
    const finish = () => signal.removeEventListener("abort", abort);
    reader.onload = () => { finish(); if (typeof reader.result === "string") resolve(reader.result); else reject(new Error("Cannot read this signature image.")); };
    reader.onerror = () => { finish(); reject(new Error("Cannot read this signature image.")); };
    reader.onabort = finish;
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true }); reader.readAsDataURL(file);
  });
}

export async function prepareSignature(values: SignatureValues, signal: AbortSignal): Promise<string> {
  const data = values.mode === "draw" ? values.drawing : values.mode === "type" ? typedSignature(values.name) : values.image ? await imageDataUrl(values.image, signal) : null;
  if (!data) throw new Error("Choose or create a signature first.");
  signatureBytes(data); return data;
}
