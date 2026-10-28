import { z } from "zod";
import { validateDocument } from "./validate-document";

const request = z.object({ format: z.enum(["pdf", "docx", "xlsx"]), bytes: z.instanceof(ArrayBuffer) });
self.onmessage = async (event: MessageEvent) => {
  try {
    const input = request.parse(event.data);
    await validateDocument(new Uint8Array(input.bytes), input.format);
    self.postMessage({ ok: true, bytes: input.bytes }, { transfer: [input.bytes] });
  } catch (error) {
    self.postMessage({ ok: false, message: error instanceof Error && !error.message.startsWith("[") ? error.message : "This document could not be validated. Ask the sender to check the file." });
  }
};
