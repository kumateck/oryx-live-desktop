/** Reads a response with a hard bound, including when Content-Length is absent or incorrect. */
export async function readBounded(response: Response, limit: number): Promise<ArrayBuffer> {
  if (!response.ok || response.status === 204) throw new Error(response.status === 403 ? "You do not have access to this file." : "The file could not be loaded. Its link may have expired. Close this preview and refresh the record.");
  if (Number(response.headers.get("Content-Length")) > limit) {
    await response.body?.cancel();
    throw new Error("This file exceeds the preview size limit. This file cannot be viewed here.");
  }
  if (!response.body) throw new Error("The server returned an empty file.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit) { await reader.cancel(); throw new Error("This file exceeds the preview size limit. This file cannot be viewed here."); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  if (size === 0) throw new Error("The server returned an empty file.");
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes.buffer;
}
