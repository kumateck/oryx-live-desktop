// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { StpVersionFile } from "./stp-version-file";

vi.mock("@/shared/attachments/use-preview-document", () => ({ usePreviewDocument: () => ({ state: "error", message: "Test preview" }) }));
afterEach(() => { cleanup(); forgetSession(); vi.restoreAllMocks(); });
function SignedIn() {
  const { state } = useSession();
  return state.status === "authenticated" ? <ApiProvider><StpVersionFile documentId="doc1" version={{ id: "v1", fileName: "assay.docx", versionNumber: 1 }} /></ApiProvider> : null;
}
function open(status = 200) {
  const backend = stubBackend();
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const calls: Request[] = [];
  const revoke = vi.fn();
  let nextUrl = 0;
  vi.stubGlobal("URL", class extends URL {
    static override createObjectURL = vi.fn(() => `blob:owned-${++nextUrl}`);
    static override revokeObjectURL = revoke;
  });
  backend.fetcher.mockImplementation(async (input, init) => {
    if (typeof input === "string" && input.startsWith("blob:owned-")) return new Response("authorized file bytes");
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    calls.push(input);
    return new Response(status === 200 ? "authorized file bytes" : null, { status });
  });
  render(<SessionProvider><SignedIn /></SessionProvider>);
  return { calls, revoke };
}

it("uses the existing authenticated, audited version GET then opens the shared viewer", async () => {
  const { calls, revoke } = open();
  await userEvent.click(await screen.findByRole("button", { name: "assay.docx" }));
  expect(await screen.findByRole("dialog", { name: "assay.docx" })).toBeTruthy();
  expect(calls).toHaveLength(1);
  expect(calls[0]?.method).toBe("GET");
  expect(new URL(calls[0]?.url ?? "https://invalid").pathname).toBe("/api/v1/stp-documents/documents/doc1/versions/v1/file");
  expect(calls[0]?.headers.get("authorization")).toBe("Bearer access-renewed");
  expect(calls[0]?.headers.get("Module")).toBe("Quality Assurance");
  expect(calls[0]?.headers.get("SubModule")).toBe("Standard Test Procedure");
  expect(revoke).toHaveBeenCalledWith("blob:owned-1");
  await userEvent.click(screen.getByRole("button", { name: "Close preview" }));
  expect(revoke).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("link")).toBeNull();
});

it("keeps a refused version read out of the viewer and leaves retry available", async () => {
  const { calls, revoke } = open(403);
  await userEvent.click(await screen.findByRole("button", { name: "assay.docx" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(revoke).not.toHaveBeenCalled();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
  expect(screen.getByRole("button", { name: "assay.docx" }).hasAttribute("disabled")).toBe(false);
});
