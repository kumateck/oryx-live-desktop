// @vitest-environment jsdom
import { engineDirectory } from "./engines";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { AttachedFile } from "./file-type";
import { usePreviewDocument } from "./use-preview-document";

const validate = vi.hoisted(() => vi.fn(async (bytes: ArrayBuffer) => bytes));
vi.mock("./validation-client", () => ({ validateInWorker: validate }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); validate.mockClear(); });
const file = { id: "file", name: "batch.docx", link: "http://customer-api.example:8086/api/v1/file/orders/id/ref" };
function Harness({ attempt = 0, source = file }: { attempt?: number; source?: AttachedFile }) {
  const value = usePreviewDocument(source, attempt);
  return <div>{value.state === "error" ? value.message : value.state}</div>;
}

it("fetches only the assigned attachment and Oryx's local engine assets, with no cookies or bearer headers, and aborts on close", async () => {
  const calls: { address: string; options: RequestInit | undefined }[] = [];
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input, options) => {
    const address = String(input);
    calls.push({ address, options });
    return new Response(address.endsWith(".js") ? "export {};" : new Uint8Array([0x50, 0x4b]));
  }));
  const view = render(<Harness />);
  await screen.findByText("ready");
  expect(calls).toHaveLength(3);
  expect(calls[0]?.address).toBe("/api/v1/file/orders/id/ref");
  expect(calls.slice(1).every((call) => call.address.startsWith(`${engineDirectory("docx")}/`))).toBe(true);
  expect(calls.every((call) => call.options?.credentials === "omit" && call.options.referrerPolicy === "no-referrer" && !call.options.headers)).toBe(true);
  expect(validate).toHaveBeenCalledTimes(1);
  view.unmount();
  expect(calls.every((call) => call.options?.signal?.aborted)).toBe(true);
});

it("reports an expired link, cancels pending work, and makes retry an explicit new load", async () => {
  const fetcher = vi.fn<typeof fetch>(async (input) => new Response(String(input).startsWith("/api/") ? null : "asset", { status: String(input).startsWith("/api/") ? 204 : 200 }));
  vi.stubGlobal("fetch", fetcher);
  const view = render(<Harness />);
  await screen.findByText(/link may have expired/);
  expect(validate).not.toHaveBeenCalled();
  view.rerender(<Harness attempt={1} />);
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(6));
});

it("opens on customer HTTP sites where randomUUID is unavailable, using cryptographic random bytes for the channel", async () => {
  const random = vi.fn((array: Uint8Array) => { array.fill(7); return array; });
  vi.stubGlobal("crypto", { getRandomValues: random });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response(new Uint8Array([0x50, 0x4b]))));
  render(<Harness />);
  await screen.findByText("ready");
  expect(random).toHaveBeenCalledTimes(1);
});

it("validates local file bytes and only fetches engine assets", async () => {
  const bytes = new Uint8Array([0x50, 0x4b]).buffer;
  const blob = new Blob([bytes]);
  Object.defineProperty(blob, "arrayBuffer", { value: async () => bytes });
  const fetcher = vi.fn<typeof fetch>(async () => new Response("engine asset"));
  vi.stubGlobal("fetch", fetcher);
  render(<Harness source={{ id: "local", name: "selected.docx", link: null, blob }} />);
  await screen.findByText("ready");
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls.every(([address]) => String(address).startsWith("/viewers/wordcraft-"))).toBe(true);
  expect(validate.mock.calls[0]?.[0]).toBe(bytes);
});

it("rejects oversized local files before document validation", async () => {
  const blob = new Blob(["x"]);
  Object.defineProperty(blob, "size", { value: 21 * 1024 * 1024 });
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => new Response("asset")));
  render(<Harness source={{ id: "local", name: "large.pdf", link: null, blob }} />);
  await screen.findByText("The preview supports files up to 20 MB.");
  expect(validate).not.toHaveBeenCalled();
});
