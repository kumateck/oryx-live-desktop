// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { modules } from "@/modules/registry";
import { routeAccessPolicy } from "@/modules/registry-model";
import { decisionPermission } from "@/modules/pending-approvals/lib/approval-documents";
import { reviewDocumentPath } from "@/modules/pending-reviews/lib/review-documents";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { proposalSchema } from "./stp-content";
import { blankContent, contentFromProposal, contentProblem, contentRequest } from "./stp-draft";
import { stpRevisionKeys, type StpRevisionRoutes } from "./stp-keys";
import { proposalFlags } from "./stp-proposal-view";
import { StpRevisionDetailPage } from "./stp-revision-detail";
import { StpRevisionEditorPage } from "./stp-revision-editor";
import { StpImportPage } from "./stp-import-page";
import { StpTestLinksPanel } from "./stp-test-links-panel";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const product = stpRevisionKeys(2);
const raw = stpRevisionKeys(0);
const routes: StpRevisionRoutes = {
  list: (stp) => `/list${stp ? `?stp=${stp}` : ""}`, detail: (id) => `/detail/${id}`, draft: (id) => `/draft/${id}`,
  correct: (id) => `/correct/${id}`, create: (stp) => `/create?stp=${stp}`, import: (stp) => `/import?stp=${stp}`,
};
const routesFor = () => routes;
const revision = (status: number, extra: Record<string, unknown> = {}) => ({
  id: "r1", kind: 2, stpNumber: "QCD/STP/FP/009", revisionNumber: 2, supersedesRevision: 1, status, reviewStatus: null,
  title: "X'ZOLE SUSPENSION", testCount: 1, preparedBy: "Ama Owusu", createdAt: "2026-11-27T00:00:00Z", approvedAt: null, supersededAt: null,
  revisedFromId: null, reasonForChange: null, area: "Quality Control", reference: "BP", effectiveDate: null, reviewDate: null, issueDate: null,
  source: "009 Xzole susp.docx", version: 3, reviewVersion: null,
  sections: [{ id: "s1", kind: 0, text: "Analyse X'Zole." }, { id: "s2", kind: 1, text: "All batches." }, { id: "s3", kind: 2, text: "QC Analyst" }, { id: "s4", kind: 3, text: "QC Manager" }],
  tests: [{ id: "t1", testKey: "assay", number: "5.1", title: "Assay", steps: [
    { id: "p1", kind: 1, number: null, heading: "Chromatographic Conditions", text: "Flowrate: 1.0ml/min", referenceCode: null },
    { id: "p2", kind: 0, number: "5.1.1", heading: null, text: "Inject 20 µl.", referenceCode: "QCD/SOP/003" }] }],
  ...extra,
});
const field = (value: string | null, confidence = 0, flag: string | null = null) => ({ value, confidence, flag });
const proposal = {
  succeeded: true, failureReason: null, fileName: "009 Xzole susp.docx", source: "009 Xzole susp.docx", kind: 2,
  stpNumber: field("QCD/STP/FP/009"), title: field("X'ZOLE SUSPENSION"), revisionNumber: field("02"), supersedesRevision: field("01"),
  area: field("Quality Control"), reference: field("BP"), effectiveDate: field(null), reviewDate: field(null), issueDate: field(null),
  sections: [{ kind: 0, text: "Analyse.", confidence: 0, flag: null }, { kind: 4, text: "Methanol\nAcetone", confidence: 1, flag: "Reagents were split at the dashes." }],
  tests: [{ testKey: "assay", number: "5.1", title: "Assay", confidence: 0, flag: null, steps: [
    { kind: 0, number: "5.1.1", heading: null, text: "Weigh.", referenceCode: null, confidence: 1, flag: "Printed as 5.11; read as 5.1.1." }] }],
  warnings: ["Test numbers skip from 5.7 to 5.9."], flaggedCount: 2,
};

const links = { kind: 2, stpNumbers: ["QCD/STP/FP/009"],
  tests: [{ formSectionId: "f1", sectionName: '<p><span style="color: rgb(0, 0, 0); font-size: 12pt;"><strong>Assay</strong></span></p><p><span style="font-size: 12pt;">Diclofenac Diethylamine</span></p>', stpNumber: "QCD/STP/FP/009", testKey: "assay", testNumber: "5.1", testTitle: "Assay", revisionNumber: 2, resolved: true },
    { formSectionId: "f2", sectionName: "pH", stpNumber: null, testKey: null, testNumber: null, testTitle: null, revisionNumber: null, resolved: false }],
  options: [{ stpNumber: "QCD/STP/FP/009", revisionNumber: 2, testKey: "assay", testNumber: "5.1", testTitle: "Assay" },
    { stpNumber: "QCD/STP/FP/009", revisionNumber: 2, testKey: "ph", testNumber: "5.2", testTitle: "pH" }] };

function open(element: ReactNode, granted: string[], data: { revision?: unknown; revisions?: unknown[] } = {}, path = "/x/r1") {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const calls: { path: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const body = input.method === "GET" ? null : input.headers.get("content-type")?.includes("multipart") ? "multipart" : await input.clone().json().catch(() => null);
    calls.push({ path: url.pathname, method: input.method, body });
    if (url.pathname === "/api/v1/stp-revisions/import") return Response.json(proposal);
    if (url.pathname === "/api/v1/stp-revisions/r1/docx") return new Response(new Blob(["docx"]), { status: 200 });
    if (url.pathname === "/api/v1/stp-test-links/product-specification/ps1" && input.method === "GET") return Response.json(links);
    if (url.pathname.endsWith("/draft") || url.pathname.endsWith("/submit") || input.method === "PUT") return new Response(null, { status: 204 });
    if (input.method === "POST") return Response.json("r9", { status: 201 });
    if (url.pathname === "/api/v1/stp-revisions") return Response.json(data.revisions ?? []);
    if (url.pathname === "/api/v1/stp-revisions/r1") return Response.json(data.revision ?? revision(4));
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }, { path: "/detail/:id", element: <p>Revision details</p> }, { path: "/draft/:id", element: <p>Draft editor</p> }],
    { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });

it("guards each revision page with the key for its task and kind", () => {
  const can = (path: string, keys: string[]) => {
    const policy = routeAccessPolicy(modules, path.split("?")[0] ?? path);
    return Boolean(policy && canAccess(policy.access, { state: "authenticated", permissions: new Set(keys) }));
  };
  expect(can("/qc/products-stp/revisions", [])).toBe(false);
  expect(can("/qc/products-stp/revisions", [product.view])).toBe(true);
  expect(can("/qc/products-stp/revisions", [raw.view])).toBe(false);
  expect(can("/qc/products-stp/revisions/new", [product.view])).toBe(false);
  expect(can("/qc/products-stp/revisions/new", [product.view, product.create])).toBe(true);
  expect(can("/qc/products-stp/revisions/import", [product.view, product.create])).toBe(false);
  expect(can("/qc/products-stp/revisions/import", [product.view, product.import])).toBe(true);
  expect(can("/qc/products-stp/revisions/r1/draft", [product.view, product.edit])).toBe(false);
  expect(can("/qc/products-stp/revisions/r1/draft", [product.view, product.editDraft])).toBe(true);
  expect(can("/qc/products-stp/revisions/r1/edit", [product.view, product.edit])).toBe(true);
  // The material STP record route does not swallow the revisions pages.
  expect(can("/qc/material-stp/revisions", ["CanViewRawMaterialStps"])).toBe(false);
  expect(can("/qc/material-stp/revisions", [raw.view])).toBe(true);
  expect(can("/qc/material-stp/revisions/r1/edit", [raw.view])).toBe(false);
  expect(can("/qc/material-stp/revisions/r1/edit", [raw.edit])).toBe(true);
});

it("chooses the approval key and review page from the revision's stored kind", () => {
  expect(decisionPermission("StpRevision", "approve", null, 2)).toBe("CanApproveProductStpRevision");
  expect(decisionPermission("StpRevision", "reject", null, 1)).toBe("CanRejectPackagingMaterialStpRevision");
  expect(decisionPermission("StpRevision", "approve")).toBeNull();
  expect(reviewDocumentPath({ modelType: "StpRevision", modelId: "r1", variant: 2 })).toBe("/qc/products-stp/revisions/r1");
  expect(reviewDocumentPath({ modelType: "StpRevision", modelId: "r1", variant: 1 })).toBe("/qc/material-stp/revisions/r1?type=1");
  expect(reviewDocumentPath({ modelType: "StpRevision", modelId: "r1", variant: null })).toBeNull();
});

it("turns a proposal into content and requests, keeping test keys and leaving blank sections out", () => {
  const parsed = proposalSchema.parse(proposal);
  const content = contentFromProposal(parsed);
  expect(content.revisionNumber).toBe("2");
  expect(content.supersedesRevision).toBe("1");
  const request = contentRequest(content);
  expect(request.sections).toEqual([{ kind: 0, text: "Analyse." }, { kind: 4, text: "Methanol\nAcetone" }]);
  expect(request.tests?.[0]).toMatchObject({ testKey: "assay", number: "5.1", title: "Assay", steps: [{ kind: 0, number: "5.1.1", text: "Weigh." }] });
  expect(proposalFlags(parsed).map((flag) => flag.where)).toEqual(["Reagents", "5.1 5.1.1"]);
  // Saving a draft needs a number; submitting needs the whole procedure.
  expect(contentProblem(blankContent(), false)).toBe("Enter the revision number.");
  expect(contentProblem(content, false)).toBeNull();
  expect(contentProblem(content, true)).toBe("Sections 1.0 to 4.0 must all be filled in.");
});

it("offers draft actions only with their keys, and a raw-material key does not reach a product revision", async () => {
  open(<StpRevisionDetailPage kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view, raw.editDraft, raw.submit]);
  expect(await screen.findByRole("heading", { name: "QCD/STP/FP/009 · revision 2" })).toBeTruthy();
  expect(screen.getByText("Inject 20 µl.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
  cleanup(); forgetSession();
  const allowed = open(<StpRevisionDetailPage kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view, product.editDraft, product.submit]);
  await openMenu(/Actions for QCD\/STP\/FP\/009/);
  expect(screen.getByRole("menuitem", { name: "Edit draft" })).toBeTruthy();
  fireEvent.click(screen.getByRole("menuitem", { name: "Submit for review" }));
  fireEvent.click(await screen.findByRole("button", { name: "Submit for review" }));
  await waitFor(() => expect(allowed.writes()).toMatchObject([{ path: "/api/v1/stp-revisions/r1/submit", method: "POST", body: { version: 3 } }]));
});

it("does not show a revision of another kind on a module's page", async () => {
  open(<StpRevisionDetailPage kinds={[0, 1]} routes={routesFor} crumbs={[]} />, [product.view, raw.view]);
  expect((await screen.findByRole("alert")).textContent).toContain("could not read");
});

it("saves a draft with the version it was opened at and the tests' keys", async () => {
  const denied = open(<StpRevisionEditorPage mode="draft" kind={null} kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view]);
  expect(((await screen.findByRole("button", { name: "Save draft" })) as HTMLButtonElement).disabled).toBe(true);
  expect(denied.writes()).toHaveLength(0);
  cleanup(); forgetSession();
  const allowed = open(<StpRevisionEditorPage mode="draft" kind={null} kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view, product.editDraft]);
  fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "X'ZOLE & METRONIDAZOLE SUSPENSION" } });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("Revision details");
  expect(allowed.writes()).toMatchObject([{ path: "/api/v1/stp-revisions/r1/draft", method: "PUT", body: {
    version: 3, revisionNumber: 2, title: "X'ZOLE & METRONIDAZOLE SUSPENSION",
    tests: [{ testKey: "assay", steps: [{ kind: 1, heading: "Chromatographic Conditions" }, { kind: 0, number: "5.1.1", referenceCode: "QCD/SOP/003" }] }] } }]);
});

it("refuses to edit a revision that is no longer a draft", async () => {
  open(<StpRevisionEditorPage mode="draft" kind={null} kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view, product.editDraft], { revision: revision(0, { reviewStatus: 0 }) });
  expect((await screen.findByRole("alert")).textContent).toContain("no longer an editable draft");
});

it("reads a Word STP into a proposal, lists what to check, and creates the first draft only when applied", async () => {
  const denied = open(<StpImportPage kind={2} routes={routesFor} crumbs={[]} />, [product.view], {}, "/x?stp=QCD/STP/FP/009");
  expect(((await screen.findByRole("button", { name: /Read file/ })) as HTMLButtonElement).disabled).toBe(true);
  expect(denied.writes()).toHaveLength(0);
  cleanup(); forgetSession();
  const allowed = open(<StpImportPage kind={2} routes={routesFor} crumbs={[]} />, [product.view, product.import, product.create], {}, "/x?stp=QCD/STP/FP/009");
  await waitFor(() => expect((screen.getByRole("button", { name: /Read file/ }) as HTMLButtonElement).disabled).toBe(false));
  const input = screen.getByLabelText("Word STP (.docx)");
  fireEvent.change(input, { target: { files: [new File(["docx"], "009 Xzole susp.docx")] } });
  fireEvent.click(screen.getByRole("button", { name: /Read file/ }));
  expect(await screen.findByText("To check (2)")).toBeTruthy();
  expect(screen.getByText("Test numbers skip from 5.7 to 5.9.")).toBeTruthy();
  expect(allowed.writes()).toMatchObject([{ path: "/api/v1/stp-revisions/import", method: "POST", body: "multipart" }]);
  fireEvent.click(await screen.findByRole("button", { name: "Create draft from this" }));
  await screen.findByText("Draft editor");
  expect(allowed.writes()[1]).toMatchObject({ path: "/api/v1/stp-revisions", method: "POST", body: {
    kind: 2, stpNumber: "QCD/STP/FP/009", revisionNumber: 2, supersedesRevision: 1, source: "009 Xzole susp.docx", tests: [{ testKey: "assay" }] } });
});

it("downloads the Word file and prints only with their keys", async () => {
  URL.createObjectURL = vi.fn(() => "blob:stp");
  URL.revokeObjectURL = vi.fn();
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  open(<StpRevisionDetailPage kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view], { revision: revision(1, { approvedFileSha256: "ab".repeat(32) }) });
  expect(await screen.findByText(/Approved Word file SHA-256/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
  cleanup(); forgetSession();
  open(<StpRevisionDetailPage kinds={[2]} routes={routesFor} crumbs={[]} />, [product.view, product.export, product.print], { revision: revision(1) });
  await openMenu(/Actions for QCD\/STP\/FP\/009/);
  expect(screen.getByRole("menuitem", { name: "Print" })).toBeTruthy();
  fireEvent.click(screen.getByRole("menuitem", { name: "Download Word file" }));
  await waitFor(() => expect(click).toHaveBeenCalled());
  click.mockRestore();
});

it("cites an STP test from a specification test only with the specification's edit key", async () => {
  open(<StpTestLinksPanel specification={{ kind: "product", id: "ps1" }} />, ["CanViewProductSpecifications"]);
  expect(await screen.findByText("Not cited")).toBeTruthy();
  expect(screen.getByText(/5.1 Assay/)).toBeTruthy();
  // Specification test names are saved rich text: shown formatted, never as markup.
  expect(screen.getByText("Diclofenac Diethylamine")).toBeTruthy();
  expect(screen.queryByText(/<p>|<span|<strong>/)).toBeNull();
  expect(screen.queryByRole("button", { name: /STP test for/ })).toBeNull();
  cleanup(); forgetSession();
  const allowed = open(<StpTestLinksPanel specification={{ kind: "product", id: "ps1" }} />, ["CanViewProductSpecifications", "CanEditProductSpecification"]);
  await openMenu("STP test for Assay Diclofenac Diethylamine");
  fireEvent.click(screen.getByRole("menuitem", { name: "Remove citation" }));
  fireEvent.click(await screen.findByRole("button", { name: "Remove citation" }));
  await waitFor(() => expect(allowed.writes()).toMatchObject([{ path: "/api/v1/stp-test-links/product-specification/ps1/f1", method: "PUT", body: { stpNumber: null, testKey: null } }]));
});
