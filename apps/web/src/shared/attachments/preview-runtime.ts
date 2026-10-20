/** Serialized into the opaque-origin frame; keep this function independent of module imports. */
export function previewRuntime(channel: string, parentOrigin: string, initialize: (input: { module_or_path: ArrayBuffer }) => Promise<object>) {
  const announce = (kind: string) => parent.postMessage({ channel, kind }, parentOrigin);
  let initialized = false;
  let failed = false;
  window.addEventListener("error", () => { failed = true; announce("error"); });
  window.addEventListener("unhandledrejection", () => { failed = true; announce("error"); });
  for (const event of ["drop", "dragover"]) window.addEventListener(event, (input) => { input.preventDefault(); input.stopImmediatePropagation(); }, true);
  window.addEventListener("message", async (event: MessageEvent) => {
    if (initialized || event.source !== parent || event.origin !== parentOrigin) return;
    const data = event.data;
    if (!data || typeof data !== "object" || data.channel !== channel || data.kind !== "initialize"
      || typeof data.name !== "string" || data.name.length > 512 || !(data.bytes instanceof ArrayBuffer)
      || data.bytes.byteLength > 16 * 1024 * 1024 || !(data.wasm instanceof ArrayBuffer) || data.wasm.byteLength > 64 * 1024 * 1024) return;
    initialized = true;
    const bridge = {
      read: async () => ({ name: data.name, bytes: new Uint8Array(data.bytes) }),
      // This host has no persistence or upload capability. Never report that a preview edit was saved.
      save: async () => { failed = true; announce("error"); throw new Error("Read-only attachments cannot save changes."); },
      dirty: (value: boolean) => { if (value) { failed = true; announce("error"); } },
      failed: () => { failed = true; announce("error"); },
    };
    Object.defineProperty(window, "dodoDocument", { value: Object.freeze(bridge), writable: false, configurable: false });
    try {
      await initialize({ module_or_path: data.wasm });
      requestAnimationFrame(() => requestAnimationFrame(() => { if (!failed) announce("ready"); }));
    } catch { failed = true; announce("error"); }
  });
}
