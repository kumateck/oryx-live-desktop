// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { strToU8, zipSync } from "fflate";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AttachmentList } from "./attachment-list";
import { officeFixture } from "./preview-fixtures";

const state = vi.hoisted(() => ({ mode: "ready" as "ready" | "error" }));
vi.mock("./use-preview-document", () => ({ usePreviewDocument: () => state.mode === "error" ? { state: "error", message: "The file link expired." }
  : { state: "ready", format: "docx", bytes: new ArrayBuffer(2), wasm: new ArrayBuffer(2), glue: "", channel: "trusted-channel" } }));
afterEach(() => { cleanup(); state.mode = "ready"; vi.unstubAllGlobals(); });
// The server's bytes for each sample file, so the viewer detects types the way it does in production.
const served: Record<string, Uint8Array> = {
  docx: officeFixture("docx"), xlsx: officeFixture("xlsx"), pdf: new TextEncoder().encode("%PDF-1.7\n"), zip: zipSync({ "a.txt": strToU8("a") }),
  png: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), xls: new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
};
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (input) => new Response(served[String(input).split(".").at(-1) ?? ""] as BodyInit)));
  vi.stubGlobal("URL", class extends URL { static override createObjectURL = () => "blob:viewer-image"; static override revokeObjectURL = () => {}; });
});
const files = ["analysis.docx", "results.xlsx", "certificate.pdf", "archive.zip", "old.xls"].map((name) => ({ id: name, name, link: `https://minio.example/${name}` }));

it("offers native Oryx previews for all three document formats, using one viewer for all attached files", async () => {
  const user = userEvent.setup();
  render(<AttachmentList title="Evidence" files={[...files, { id: "unsafe", name: "unsafe.docx", link: "javascript:alert(1)" }]} />);
  expect(screen.getAllByRole("button", { name: /^View / })).toHaveLength(5);
  expect(screen.getByRole("button", { name: "View old.xls" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: /unsafe/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "View analysis.docx" }));
  await screen.findByRole("dialog");
  const frame = await waitFor(() => {
    const value = document.querySelector("iframe");
    if (!value) throw new Error("Preview frame not mounted");
    return value;
  });
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
  expect(frame.getAttribute("src")).toBeNull();
  expect(frame.getAttribute("srcdoc")).not.toContain("minio.example");
  expect(screen.queryByRole("link", { name: "Open original" })).toBeNull();
  fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "null", data: { channel: "wrong", kind: "ready" } }));
  expect(screen.getByText("Starting document viewer…")).toBeTruthy();
  await act(async () => { fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "null", data: { channel: "trusted-channel", kind: "ready" } })); });
  expect(screen.getByText("Read-only attachment")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("shows loading failures with retry and keeps failures inside the viewer", async () => {
  state.mode = "error";
  render(<AttachmentList title="Evidence" files={files} />);
  await userEvent.click(screen.getByRole("button", { name: "View certificate.pdf" }));
  expect(await screen.findByText("The file link expired.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Retry preview" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Open original" })).toBeNull();
});

it("releases a failed rendering frame while retaining retry without external links", async () => {
  render(<AttachmentList title="Evidence" files={files} />);
  await userEvent.click(screen.getByRole("button", { name: "View analysis.docx" }));
  await screen.findByTitle("Preview of analysis.docx");
  const frame = document.querySelector("iframe");
  if (!frame) throw new Error("Missing preview frame");
  await act(async () => { fireEvent(window, new MessageEvent("message", { source: frame.contentWindow, origin: "null", data: { channel: "trusted-channel", kind: "error" } })); });
  expect(document.querySelector("iframe")).toBeNull();
  expect(screen.getByRole("button", { name: "Retry preview" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Open original" })).toBeNull();
});

it.each(["certificate.pdf", "analysis.docx", "results.xlsx", "photo.png", "archive.zip", "old.xls"])("opens %s from its filename inside Oryx", async (name) => {
  const user = userEvent.setup();
  render(<AttachmentList title="Evidence" files={[{ id: name, name, link: `https://minio.example/${name}` }]} />);
  expect(screen.queryByRole("link")).toBeNull();
  const filename = screen.getByRole("button", { name });
  filename.focus();
  await user.keyboard("{Enter}");
  expect(await screen.findByRole("dialog", { name })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Open original" })).toBeNull();
  if (name.endsWith(".zip") || name.endsWith(".xls")) expect((await screen.findByRole("alert")).textContent).toContain(name.endsWith(".zip") ? "Compressed archives" : "Older Word, Excel");
  if (name.endsWith(".png")) expect((await screen.findByRole("img", { name })).getAttribute("src")).toBe(`https://minio.example/${name}`);
});
