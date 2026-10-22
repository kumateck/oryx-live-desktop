// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { MaterialStpDetailPage, MaterialStpDocumentPage } from "./material-stp-pages";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); vi.restoreAllMocks(); });

const stp = { id: "t1", stpNumber: "QCD/STP/RM/004", description: "<p>Assay</p>", createdAt: "2026-02-01T00:00:00Z", material: { id: "m1", name: "Lactose", code: "RM-1" }, attachments: [] };
const documentOf = (status: number) => ({ id: "d1", ownerType: "MaterialStandardTestProcedure", ownerId: "t1", status, versions: [
  { id: "v1", versionNumber: 1, fileName: "assay.docx", source: 0, createdByName: "Ama", signatures: [{ id: "s1", action: 0, meaning: "Checked", createdByName: "Kofi" }] }] });

function open(path: string, permissions: string[], status: number) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string; form: FormData | null }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") {
      const form = input.headers.get("content-type")?.includes("multipart") ? new FormData() : null;
      calls.push({ method: input.method, path: url.pathname, body: form ? "" : await input.clone().text(), form });
      return url.pathname.endsWith("/editor-sessions") ? new Response(null, { status: 503 }) : Response.json(documentOf(status));
    }
    if (url.pathname === "/api/v1/material-stps/t1") return Response.json(stp);
    if (url.pathname === "/api/v1/stp-documents/MaterialStandardTestProcedure/t1") return Response.json(documentOf(status));
    if (url.pathname.startsWith("/api/v1/material-stps/") && url.pathname.endsWith("/materials")) return Response.json([stp]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/qc/material-stp/:id", element: <MaterialStpDetailPage /> },
    { path: "/qc/material-stp/:id/document", element: <MaterialStpDocumentPage /> },
  ], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}
const writes = <T extends { path: string }>(calls: T[]) => calls.filter((call) => !call.path.endsWith("/editor-sessions"));

it("records a review only with the reviewer's password and the meaning of the signature", async () => {
  const user = userEvent.setup();
  const calls = open("/qc/material-stp/t1/document?type=0", ["CanViewRawMaterialStps", "CanEditRawMaterialStp"], 1);
  await user.click(await screen.findByRole("button", { name: "Record review" }));
  await screen.findByLabelText(/Your password/);
  await screen.findByLabelText(/Meaning of the signature/);
  await user.click(screen.getByRole("button", { name: "Sign review" }));
  expect(await screen.findByText("Enter your password.")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.type(screen.getByLabelText(/Your password/), "secret-pass");
  await user.type(screen.getByLabelText(/Meaning of the signature/), "Reviewed for accuracy");
  await user.click(screen.getByRole("button", { name: "Sign review" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "POST", path: "/api/v1/stp-documents/documents/d1/review" });
  expect(JSON.parse(writes(calls)[0]?.body ?? "")).toEqual({ password: "secret-pass", meaning: "Reviewed for accuracy" });
}, 30_000);

it("offers no review step without the kind's edit permission", async () => {
  open("/qc/material-stp/t1/document?type=1", ["CanViewPackagingMaterialStps", "CanEditRawMaterialStp"], 1);
  expect(await screen.findByText("In review")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Record review" })).toBeNull();
});

it("replaces an approved document only with a reason, after saving the STP", async () => {
  const user = userEvent.setup();
  // jsdom cannot read a multipart body back, so the fields are taken as the upload builds them.
  const sent = new Map<string, string | Blob>();
  vi.spyOn(FormData.prototype, "append").mockImplementation((name: string, value: string | Blob) => { sent.set(name, value); });
  const calls = open("/qc/material-stp/t1?type=0", ["CanViewRawMaterialStps", "CanEditRawMaterialStp"], 2);
  expect(await screen.findByText("Reviewed")).toBeTruthy();
  expect(screen.getByText(/by Kofi/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Edit STP" }));
  const picker = await screen.findByLabelText(/Replace the document/, { selector: "input" });
  fireEvent.change(picker, { target: { files: [new File(["x"], "assay-v2.docx")] } });
  await user.click(screen.getByRole("button", { name: "Save STP" }));
  expect(await screen.findByText(/Give the reason for the change/)).toBeTruthy();
  expect(calls).toEqual([]);
  await user.type(screen.getByLabelText(/Reason for change/), "New limits");
  await user.click(screen.getByRole("button", { name: "Save STP" }));
  await waitFor(() => expect(calls).toHaveLength(2));
  expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/v1/material-stps/t1" });
  expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ stpNumber: "QCD/STP/RM/004", materialIds: ["m1"], description: "<p>Assay</p>" });
  expect(calls[1]).toMatchObject({ method: "POST", path: "/api/v1/stp-documents/MaterialStandardTestProcedure/t1/versions" });
  expect(calls[1]?.form).toBeTruthy();
  expect(sent.get("reasonForChange")).toBe("New limits");
  expect((sent.get("file") as File | undefined)?.name).toBe("assay-v2.docx");
}, 30_000);
