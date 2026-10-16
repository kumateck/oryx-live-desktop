import { tokenStore } from "@/shared/auth/token-store";

/** The bytes of a PNG, JPEG or WebP data URL, checked against its declared type and a size limit. */
export function imageDataBytes(value: string, limit: number, what = "image"): Uint8Array<ArrayBuffer> {
  const match = /^data:image\/(png|jpeg|webp);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match?.[2] || match[2].length > Math.ceil(limit / 3) * 4) throw new Error(`Choose a supported ${what} image up to ${Math.round(limit / 1024 / 1024)} MiB.`);
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = [82, 73, 70, 70].every((byte, index) => bytes[index] === byte) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
  if (bytes.length > limit || !(match[1] === "png" && png || match[1] === "jpeg" && jpeg || match[1] === "webp" && webp)) throw new Error(`The file does not contain a supported ${what} image.`);
  return bytes;
}

/** Reads a chosen image file as a data URL, as the server's upload endpoints take it. */
export function fileDataUrl(file: File, signal: AbortSignal, what = "image"): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => { reader.abort(); reject(new Error(`${what.charAt(0).toUpperCase()}${what.slice(1)} processing was cancelled.`)); };
    const finish = () => signal.removeEventListener("abort", abort);
    reader.onload = () => { finish(); if (typeof reader.result === "string") resolve(reader.result); else reject(new Error(`Cannot read this ${what} image.`)); };
    reader.onerror = () => { finish(); reject(new Error(`Cannot read this ${what} image.`)); };
    reader.onabort = finish;
    if (signal.aborted) { abort(); return; }
    signal.addEventListener("abort", abort, { once: true }); reader.readAsDataURL(file);
  });
}

/**
 * The server's image uploads can fail and still answer 204, so a stored image is read back and compared with
 * what was sent before it is reported as saved. `path` must already be a checked same-origin path.
 */
export async function verifyStoredImage(path: string | null, expected: Uint8Array, audit: { Module: string; SubModule: string }, signal: AbortSignal, what = "image"): Promise<void> {
  if (!path) throw new Error(`The server did not provide a ${what} that can be verified.`);
  const headers = new Headers(audit);
  const token = tokenStore.accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { headers, credentials: "omit", cache: "no-store", signal });
  if (!response.ok) throw new Error(`The uploaded ${what} could not be read back. Keep your draft and try again.`);
  const actual = new Uint8Array(await response.arrayBuffer());
  if (actual.length !== expected.length || !actual.every((byte, index) => byte === expected[index])) {
    throw new Error(`The server did not confirm the new ${what} was stored. Keep your draft and try again.`);
  }
}
