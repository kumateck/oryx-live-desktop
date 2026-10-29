// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { strToU8, zipSync } from "fflate";
import { afterEach, expect, it, vi } from "vitest";
import { AttachmentOpener } from "./attachment-opener";

const create = vi.fn(() => "blob:owned-preview");
const revoke = vi.fn();
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers(); create.mockClear(); revoke.mockClear(); });
function objectUrls() { vi.stubGlobal("URL", class extends URL { static override createObjectURL = create; static override revokeObjectURL = revoke; }); }

it("previews a selected local file and releases its object URL when closed", async () => {
  objectUrls();
  render(<AttachmentOpener file={{ id: "local", name: "evidence.png", link: null, blob: new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "evidence.png") }} />);
  await userEvent.click(screen.getByRole("button", { name: "evidence.png" }));
  expect(await screen.findByRole("img", { name: "evidence.png" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "evidence.png" }).getAttribute("src")).toBe("blob:owned-preview");
  expect(screen.queryByRole("link")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Close preview" }));
  await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:owned-preview"));
});

it("reads an authorized file once per click and cancels a pending read on unmount", async () => {
  let pendingSignal: AbortSignal | null = null;
  const read = vi.fn((signal: AbortSignal) => { pendingSignal = signal; return new Promise<Blob>(() => {}); });
  const view = render(<AttachmentOpener file={{ id: "protected", name: "version.docx", link: null, read }} />);
  const button = screen.getByRole("button", { name: "version.docx" });
  await userEvent.dblClick(button);
  expect(read).toHaveBeenCalledTimes(1);
  expect(button.hasAttribute("disabled")).toBe(true);
  view.unmount();
  expect(read.mock.calls[0]?.[0].aborted).toBe(true);
  expect(pendingSignal).not.toBeNull();
});

it("shows an authorized-read error and allows another attempt", async () => {
  const read = vi.fn(async () => { throw new Error("You cannot access this file."); });
  render(<AttachmentOpener file={{ id: "protected", name: "version.docx", link: null, read }} />);
  await userEvent.click(screen.getByRole("button", { name: "version.docx" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", "You cannot access this file.");
  expect(screen.queryByRole("dialog")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "version.docx" }));
  expect(read).toHaveBeenCalledTimes(2);
});

it("opens a protected result without leaking its source URL into record links", async () => {
  objectUrls();
  const read = vi.fn(async () => new Blob([zipSync({ "notes.txt": strToU8("inside") }) as BlobPart]));
  render(<AttachmentOpener file={{ id: "protected", name: "archive.zip", link: null, read }} />);
  await act(async () => { await userEvent.click(screen.getByRole("button", { name: "archive.zip" })); });
  expect(await screen.findByRole("dialog", { name: "archive.zip" })).toBeTruthy();
  expect((await screen.findByRole("alert")).textContent).toContain("Compressed archives cannot be opened in the app");
  expect(read).toHaveBeenCalledTimes(1);
});

it("releases a timed-out protected read and lets the user retry", async () => {
  vi.useFakeTimers();
  const read = vi.fn((_signal: AbortSignal) => new Promise<Blob>(() => {}));
  render(<AttachmentOpener file={{ id: "slow", name: "slow.pdf", link: null, read }} />);
  fireEvent.click(screen.getByRole("button", { name: "slow.pdf" }));
  await act(async () => { await vi.advanceTimersByTimeAsync(90_000); });
  expect(screen.getByRole("alert").textContent).toContain("The file took too long to load");
  expect(read.mock.calls[0]?.[0].aborted).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "slow.pdf" }));
  expect(read).toHaveBeenCalledTimes(2);
});
