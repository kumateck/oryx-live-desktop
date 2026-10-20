import { createContext, runInContext } from "node:vm";
import { expect, it, vi } from "vitest";
import { previewRuntime } from "./preview-runtime";
import { previewFrame, previewSandbox } from "./preview-frame";

interface Bridge { read: () => Promise<{ name: string; bytes: Uint8Array }>; save: () => Promise<void>; dirty: (value: boolean) => void; failed: () => void }
function host() {
  const callbacks = new Map<string, (event: object) => Promise<void>>();
  const parent = { postMessage: vi.fn() };
  const window: { dodoDocument?: Bridge; addEventListener: (name: string, handler: (event: object) => Promise<void>) => void } = {
    addEventListener: (name, handler) => { callbacks.set(name, handler); },
  };
  const initialize = vi.fn(async () => ({}));
  const context = createContext({ window, parent, ArrayBuffer, Uint8Array, initialize, requestAnimationFrame: (fn: () => void) => fn() });
  runInContext(`(${previewRuntime.toString()})("channel", "https://oryx.example", initialize);`, context);
  const send = (source: object, origin: string, channel = "channel") => callbacks.get("message")?.({ source, origin,
    data: { channel, kind: "initialize", name: "evidence.docx", bytes: new Uint8Array([1, 2]).buffer, wasm: new ArrayBuffer(1) } });
  return { window, parent, initialize, send };
}

it("accepts one assigned file from its exact parent and exposes no storage, credentials, URLs or upload capability", async () => {
  const state = host();
  await state.send({}, "https://oryx.example");
  await state.send(state.parent, "https://other.example");
  await state.send(state.parent, "https://oryx.example", "wrong-channel");
  expect(state.initialize).not.toHaveBeenCalled();
  await state.send(state.parent, "https://oryx.example");
  expect(state.initialize).toHaveBeenCalledTimes(1);
  const bridge = state.window.dodoDocument;
  if (!bridge) throw new Error("Missing assigned-file bridge");
  expect(Object.keys(bridge).sort()).toEqual(["dirty", "failed", "read", "save"]);
  expect(Object.isFrozen(bridge)).toBe(true);
  expect(await bridge.read()).toEqual({ name: "evidence.docx", bytes: new Uint8Array([1, 2]) });
  bridge.dirty(true);
  await expect(bridge.save()).rejects.toThrow(/cannot save/);
  await state.send(state.parent, "https://oryx.example");
  expect(state.initialize).toHaveBeenCalledTimes(1);
  expect(state.parent.postMessage).toHaveBeenCalledWith({ channel: "channel", kind: "error" }, "https://oryx.example");
});

it("builds an opaque-origin, network-denied frame with the matching canvas and a script-safe inline host", () => {
  expect(previewSandbox).toBe("allow-scripts");
  for (const format of ["docx", "pdf", "xlsx"] as const) {
    const html = previewFrame(format, 'const unsafe = "</script><script>";', "nonce", "https://oryx.example");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("object-src 'none'");
    expect(html).toContain("wasm-unsafe-eval");
    expect(html).not.toContain("'unsafe-eval'");
    expect(html).not.toContain('"</script><script>"');
    expect(html.match(/<script /g)).toHaveLength(1);
  }
});

it("fails closed instead of announcing ready when an engine reports a mutation during initialization", async () => {
  const state = host();
  state.initialize.mockImplementationOnce(async () => {
    const bridge = state.window.dodoDocument;
    if (!bridge) throw new Error("Missing assigned-file bridge");
    bridge.dirty(true);
    return {};
  });
  await state.send(state.parent, "https://oryx.example");
  expect(state.parent.postMessage).toHaveBeenCalledWith({ channel: "channel", kind: "error" }, "https://oryx.example");
  expect(state.parent.postMessage).not.toHaveBeenCalledWith({ channel: "channel", kind: "ready" }, "https://oryx.example");
});
