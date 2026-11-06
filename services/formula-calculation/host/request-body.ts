import type { IncomingMessage } from "node:http";

export class FormulaHostPayloadTooLargeError extends Error {}

export const readBoundedRequestBody = (
  request: IncomingMessage,
  maximumBytes: number,
): Promise<Uint8Array> => {
  const declared = Number(request.headers["content-length"] ?? 0);
  if (Number.isFinite(declared) && declared > maximumBytes) {
    request.resume();
    return Promise.reject(new FormulaHostPayloadTooLargeError());
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let length = 0;
    request.on("data", (chunk: Buffer) => {
      length += chunk.length;
      if (length <= maximumBytes) chunks.push(chunk);
      else {
        request.removeAllListeners("data");
        request.resume();
        reject(new FormulaHostPayloadTooLargeError());
      }
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
    request.on("aborted", () => reject(new Error("Request was aborted.")));
  });
};
