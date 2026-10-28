export async function reportRequest<T>(request: { unwrap: () => Promise<T>; abort: () => void }, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { request.abort(); throw new Error("Report cancelled"); }
  const cancel = () => request.abort(); signal.addEventListener("abort", cancel, { once: true });
  try { return await request.unwrap(); } finally { signal.removeEventListener("abort", cancel); }
}
