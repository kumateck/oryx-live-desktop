import { z } from "zod";
import type { DocumentFormat } from "./engines";

const response = z.discriminatedUnion("ok", [z.object({ ok: z.literal(true), bytes: z.instanceof(ArrayBuffer) }), z.object({ ok: z.literal(false), message: z.string() })]);
/** Terminating the dedicated worker bounds parsing time and releases a closed preview's resources. */
export function validateInWorker(bytes: ArrayBuffer, format: DocumentFormat, signal: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./validation.worker.ts", import.meta.url), { type: "module" });
    const clean = () => { clearTimeout(timer); signal.removeEventListener("abort", abort); worker.terminate(); };
    const fail = (message: string) => { clean(); reject(new Error(message)); };
    const abort = () => fail("Preview closed.");
    const timer = setTimeout(() => fail("This file took too long to validate. This file cannot be viewed here."), 15_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent) => {
      const value = response.safeParse(event.data);
      clean();
      if (!value.success) { reject(new Error("The file could not be validated.")); return; }
      if (value.data.ok) resolve(value.data.bytes);
      else reject(new Error(value.data.message));
    };
    worker.onerror = () => fail("The file validator could not start. Close the preview and try again.");
    if (signal.aborted) abort();
    else worker.postMessage({ format, bytes }, [bytes]);
  });
}
