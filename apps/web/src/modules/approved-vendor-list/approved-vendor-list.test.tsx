// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { decisionPermission } from "@/modules/pending-approvals/lib/approval-documents";
import { reviewDocumentPath } from "@/modules/pending-reviews/lib/review-documents";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { manufacturerRefusal, markOptions, supplierRefusal, useApprovedVendors } from "@/shared/procurement/approved-vendors";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { VendorListDetailPage } from "./components/avl-detail-page";
import { VendorListEditorPage } from "./components/avl-editor-page";
import { VendorListsPage } from "./components/avl-list-page";
import { lineProblem, lineRequest, shortMonth, stageLabel, type DraftLine } from "./lib/avl";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const view = "CanViewApprovedVendorList";
const summary = (status: number, extra: Record<string, unknown> = {}) => ({ id: "l1", annexureNumber: "QAD/SOP/007/A03-06", revisionNumber: 17, supersedesRevision: 16,
  status, reviewStatus: null, lineCount: 1, createdAt: "2026-11-19T00:00:00Z", approvedAt: null, preparedBy: "Ama Owusu", ...extra });
const detail = (status: number, extra: Record<string, unknown> = {}) => ({ ...summary(status, extra), reviewVersion: 3,
  lines: [{ id: "x1", order: 1, materialId: "m1", materialCode: "RMA002", materialName: "Albendazole USP (Micronized)", manufacturerId: "mf1",
    manufacturerName: "K. A. Malle Pharmaceuticals Ltd", manufacturerAddress: "Ankleshwar, Gujarat, India", supplierId: "s1", supplierName: "Indosol Export",
    quantityPerPack: 25, approvalDate: "2024-06-01T00:00:00Z", validityDate: "2027-06-01T00:00:00Z", lapsed: false }],
  preparedBySignatory: { name: "Ama Owusu", designation: "Officer QA", signedAt: "2026-11-19T00:00:00Z" } });

function open(element: ReactNode, granted: string[], data: { lists?: unknown[]; list?: unknown; deleteStatus?: number } = {}, path = "/x/l1") {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const calls: { path: string; method: string; body: unknown }[] = [];
  let deleted = false;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method === "DELETE") {
      if (data.deleteStatus) return Response.json({ title: "Conflict", errors: [{ code: "Maintenance.Changed", description: "The record or its references changed during validation." }] }, { status: data.deleteStatus });
      deleted = true;
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/v1/approved-vendor-list/eligibility")
      return Response.json([{ materialId: "m1", restricted: !deleted, approved: [] }]);
    if (input.method !== "GET") return Response.json("l2", { status: 201 });
    if (url.pathname === "/api/v1/approved-vendor-list") return Response.json(data.lists ?? []);
    if (url.pathname === "/api/v1/approved-vendor-list/l1") return Response.json(data.list ?? detail(1));
    if (url.pathname === "/api/v1/approved-vendor-list/options") return Response.json({ materials: [], manufacturers: [], suppliers: [] });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }, { path: "/qa/approved-vendor-list", element: <p>Vendor list overview</p> },
    { path: "/qa/approved-vendor-list/:id/details", element: <p>Saved revision details</p> }], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { backend, writes: () => calls.filter((c) => c.method !== "GET"), reads: () => calls.filter((c) => c.method === "GET") };
}
afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });

it("guards each page with the key for its task", () => {
  const can = (path: string, keys: string[]) => { const p = routeAccessPolicy(modules, path); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can("/qa/approved-vendor-list", [])).toBe(false);
  expect(can("/qa/approved-vendor-list", [view])).toBe(true);
  expect(can("/qa/approved-vendor-list/l1/details", [view])).toBe(true);
  expect(can("/qa/approved-vendor-list/new", [view])).toBe(false);
  expect(can("/qa/approved-vendor-list/new", [view, "CanCreateApprovedVendorList"])).toBe(true);
  expect(can("/qa/approved-vendor-list/revise", [view, "CanCreateApprovedVendorList"])).toBe(false);
  expect(can("/qa/approved-vendor-list/revise", [view, "CanReviseApprovedVendorList"])).toBe(true);
  expect(can("/qa/approved-vendor-list/l1/edit", [view, "CanReviseApprovedVendorList"])).toBe(false);
  expect(can("/qa/approved-vendor-list/l1/edit", [view, "CanEditApprovedVendorList"])).toBe(true);
});

it("offers the first list only with the create key", async () => {
  open(<VendorListsPage />, [view]);
  expect(await screen.findByText("No approved vendor list yet")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Prepare list/ })).toBeNull();
  cleanup(); forgetSession();
  open(<VendorListsPage />, [view, "CanCreateApprovedVendorList"]);
  expect(await screen.findByRole("button", { name: /Prepare list/ })).toBeTruthy();
});

it("offers a new revision of the current list only with the revise key, and none while one is being prepared", async () => {
  open(<VendorListsPage />, [view, "CanCreateApprovedVendorList"], { lists: [summary(1)] });
  expect(await screen.findByText("Current")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /New revision/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Prepare list/ })).toBeNull();
  cleanup(); forgetSession();
  open(<VendorListsPage />, [view, "CanReviseApprovedVendorList"], { lists: [summary(1)] });
  expect(await screen.findByRole("button", { name: /New revision/ })).toBeTruthy();
  cleanup(); forgetSession();
  open(<VendorListsPage />, [view, "CanReviseApprovedVendorList"], { lists: [summary(0, { id: "l2", revisionNumber: 18, reviewStatus: 0 }), summary(1)] });
  expect(await screen.findByText("Awaiting check")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /New revision/ })).toBeNull();
});

it("offers correction and printing only with their keys", async () => {
  open(<VendorListDetailPage />, [view], { list: detail(0, { reviewStatus: 0 }) });
  expect(await screen.findByRole("heading", { name: "Revision 17" })).toBeTruthy();
  expect(screen.getByText("Albendazole USP (Micronized)")).toBeTruthy();
  // Without the edit or print keys there is nothing to offer, so no action menu at all.
  expect(screen.queryByRole("button", { name: /Actions for Revision 17/ })).toBeNull();
  cleanup(); forgetSession();
  open(<VendorListDetailPage />, [view, "CanEditApprovedVendorList", "CanPrintApprovedVendorList"], { list: detail(0, { reviewStatus: 0 }) });
  await openMenu(/Actions for Revision 17/);
  expect(screen.getByRole("menuitem", { name: "Correct list" })).toBeTruthy();
  expect(screen.getByRole("menuitem", { name: "Print" })).toBeTruthy();
});

it("requires the delete permission even for an editor", async () => {
  const denied = open(<VendorListDetailPage />, [view, "CanEditApprovedVendorList"], { list: detail(1) });
  await screen.findByRole("heading", { name: "Revision 17" });
  expect(screen.queryByRole("button", { name: /Actions for Revision 17/ })).toBeNull();
  expect(denied.writes()).toHaveLength(0);
});

it.each([0, 1, 2, 3])("confirms deleting a revision in status %s and returns to the overview", async (status) => {
  const allowed = open(<VendorListDetailPage />, [view, "CanDeleteApprovedVendorList"], { list: detail(status) });
  await openMenu(/Actions for Revision 17/);
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete revision" }));
  await screen.findByRole("dialog", { name: "Delete revision 17?" });
  expect(screen.getByText(/Deleting the current approved revision removes its procurement restrictions/)).toBeTruthy();
  expect(allowed.writes()).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Delete revision" }));
  await screen.findByText("Vendor list overview");
  expect(allowed.writes()).toMatchObject([{ path: "/api/v1/approved-vendor-list/l1", method: "DELETE" }]);
});

it("deletes from the revision table and refreshes the cached list", async () => {
  const allowed = open(<VendorListsPage />, [view, "CanDeleteApprovedVendorList"], { lists: [summary(0, { reviewStatus: 0 })] });
  await openMenu(/Actions for revision 17/);
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete revision" }));
  fireEvent.click(await screen.findByRole("button", { name: "Delete revision" }));
  await waitFor(() => expect(allowed.writes()).toHaveLength(1));
  await waitFor(() => expect(allowed.reads().filter(call => call.path === "/api/v1/approved-vendor-list").length).toBeGreaterThan(1));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("refreshes procurement eligibility after the current revision is deleted", async () => {
  function Eligibility() {
    const material = useApprovedVendors(["m1"]).get("m1");
    return material ? <p>{material.restricted ? "Vendors restricted" : "Vendors unrestricted"}</p> : null;
  }
  open(<><Eligibility /><VendorListsPage /></>, [view, "CanDeleteApprovedVendorList", "CanViewApprovedVendorEligibility"], { lists: [summary(1)] });
  await screen.findByText("Vendors restricted");
  await openMenu(/Actions for revision 17/);
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete revision" }));
  fireEvent.click(await screen.findByRole("button", { name: "Delete revision" }));
  await screen.findByText("Vendors unrestricted");
});

it("keeps the confirmation open with the server's status refusal", async () => {
  open(<VendorListDetailPage />, [view, "CanDeleteApprovedVendorList"], { list: detail(2), deleteStatus: 409 });
  await openMenu(/Actions for Revision 17/);
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete revision" }));
  fireEvent.click(await screen.findByRole("button", { name: "Delete revision" }));
  expect((await screen.findByRole("alert")).textContent).toContain("The record or its references changed during validation.");
  expect(screen.getByRole("dialog")).toBeTruthy();
});

it("refuses an open delete confirmation after the grant is revoked", async () => {
  function Refresh() {
    const { refresh } = useSession();
    return <button type="button" onClick={() => void refresh()}>Refresh access</button>;
  }
  const allowed = open(<><Refresh /><VendorListDetailPage /></>, [view, "CanDeleteApprovedVendorList"], { list: detail(2) });
  await openMenu(/Actions for Revision 17/);
  fireEvent.click(screen.getByRole("menuitem", { name: "Delete revision" }));
  await screen.findByRole("dialog");
  allowed.backend.set({ permissions: [view] });
  fireEvent.click(screen.getByText("Refresh access"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Delete revision" }).hasAttribute("disabled")).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Delete revision" }));
  expect(allowed.writes()).toHaveLength(0);
});

it("sends a correction only with the edit key, with the review version it was opened at", async () => {
  const denied = open(<VendorListEditorPage mode="edit" />, [view], { list: detail(0, { reviewStatus: 1 }) });
  const save = await screen.findByRole("button", { name: "Save correction" });
  expect((save as HTMLButtonElement).disabled).toBe(true);
  expect(denied.writes()).toHaveLength(0);
  cleanup(); forgetSession();
  const allowed = open(<VendorListEditorPage mode="edit" />, [view, "CanEditApprovedVendorList"], { list: detail(0, { reviewStatus: 1 }) });
  (await screen.findByRole("button", { name: "Save correction" })).click();
  await waitFor(() => expect(allowed.writes()).toHaveLength(1));
  expect(allowed.writes()[0]).toMatchObject({ path: "/api/v1/approved-vendor-list/l1", method: "PUT", body: { revisionNumber: 17, reviewVersion: 3,
    lines: [{ materialId: "m1", manufacturerId: "mf1", supplierId: "s1", quantityPerPack: 25, approvalDate: "2024-06-01", validityDate: "2027-06-01" }] } });
  await screen.findByText("Saved revision details");
});

it("checks lines, names stages and prints months as on paper", () => {
  const line: DraftLine = { key: "a", materialId: "m1", materialLabel: "RMA002", manufacturer: { id: null, name: "New Pharma", address: "Hyderabad" },
    supplier: { id: null, name: "New Traders", address: null, type: 0 }, quantityPerPack: "25", approvalMonth: "2024-06", validityMonth: "2027-06" };
  expect(lineProblem(line, [line])).toBeNull();
  expect(lineProblem({ ...line, validityMonth: "2024-05" }, [])).toMatch(/cannot be before/);
  expect(lineProblem({ ...line, quantityPerPack: "0" }, [])).toMatch(/quantity per pack/);
  expect(lineProblem({ ...line, key: "b" }, [line])).toMatch(/already on the list/);
  expect(lineRequest(line)).toMatchObject({ newManufacturer: { name: "New Pharma", address: "Hyderabad" }, newSupplier: { name: "New Traders", type: 0 } });
  expect(shortMonth("2024-06")).toBe("Jun 24");
  expect(stageLabel(0, 1)).toBe("Returned for correction");
  expect(stageLabel(0, null)).toBe("Awaiting approval");
  expect(stageLabel(2, null)).toBe("Superseded");
});

it("uses the list's own approval keys and opens its page from the review queue", () => {
  expect(decisionPermission("ApprovedVendorList", "approve")).toBe("CanApproveApprovedVendorList");
  expect(decisionPermission("ApprovedVendorList", "reject")).toBe("CanRejectApprovedVendorList");
  expect(reviewDocumentPath({ modelType: "ApprovedVendorList", modelId: "l1", variant: null })).toBe("/qa/approved-vendor-list/l1/details");
});

it("disables suppliers and manufacturers the current list does not allow, and leaves unlisted materials alone", () => {
  const listed = { materialId: "m1", restricted: true, approved: [{ manufacturerId: "mf1", supplierId: "s1" }] };
  expect(supplierRefusal(listed, "s1")).toBeNull();
  expect(supplierRefusal(listed, "s2")).toMatch(/approved vendor list/);
  expect(supplierRefusal({ materialId: "m2", restricted: false, approved: [] }, "s2")).toBeNull();
  expect(supplierRefusal(undefined, "s2")).toBeNull();
  expect(manufacturerRefusal(listed, "mf1", "s2")).not.toBeNull();
  expect(manufacturerRefusal(listed, "mf1", null)).toBeNull();
  expect(markOptions([{ value: "s1", label: "Indosol" }, { value: "s2", label: "Other" }], (id) => supplierRefusal(listed, id)))
    .toEqual([{ value: "s1", label: "Indosol" }, { value: "s2", label: "Other (not approved)", disabled: true }]);
});

it("opens the line editor on a plain HTTP site, where the browser has no crypto.randomUUID", async () => {
  // The testing and customer servers are served over HTTP: only getRandomValues is available there.
  const real = globalThis.crypto;
  vi.stubGlobal("crypto", { getRandomValues: (bytes: Uint8Array<ArrayBuffer>) => real.getRandomValues(bytes) });
  open(<VendorListEditorPage mode="new" />, [view, "CanCreateApprovedVendorList"], {}, "/x");
  (await screen.findByRole("button", { name: /Add material/ })).click();
  expect(await screen.findByRole("dialog", { name: "Add material" })).toBeTruthy();
  expect(screen.queryByText(/Something went wrong/i)).toBeNull();
});
