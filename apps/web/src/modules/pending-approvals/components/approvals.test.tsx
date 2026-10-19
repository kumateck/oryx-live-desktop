// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import PendingApprovalPage from "../../../pages/(workspace)/qa/pending-approvals/[type]/[id]/page";
import PendingApprovalsPage from "../../../pages/(workspace)/qa/pending-approvals/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { decidedElsewhere, decisionProblem, documentLabel, isReadable, waitingDocuments } from "../lib/approval-documents";

afterEach(() => { cleanup(); forgetSession(); });

it("names documents, says where each is decided, and asks for a reason only when rejecting", () => {
  expect([documentLabel("PurchaseOrder"), documentLabel("ProductionExtraPacking"), documentLabel("QcCoa"), documentLabel("QcOosCase"), documentLabel("TemplateFormRevision"), documentLabel(null)])
    .toEqual(["Purchase order", "Production extra material", "QC COA", "QC OOS case", "Template form revision", "Document"]);
  expect([isReadable("LeaveRequest"), isReadable("PayrollRun"), isReadable("ServiceMemo"), isReadable("QcCoa")]).toEqual([true, true, false, false]);
  expect(decidedElsewhere("PurchaseOrder")).toBeNull();
  expect(decidedElsewhere("PayrollRun")).toBeNull();
  expect(decidedElsewhere("QcSpecification")).toContain("Quality Control");
  expect(decidedElsewhere("Payment")).toContain("Finance");
  expect(decidedElsewhere("TemplateSectionRevision")).toContain("template");
  expect(waitingDocuments({ LeaveRequest: 2, PurchaseOrder: 5, BillingSheet: 0 }, "BillingSheet")).toEqual([{ type: "PurchaseOrder", count: 5 }, { type: "LeaveRequest", count: 2 }, { type: "BillingSheet", count: 0 }]);
  expect(decisionProblem("approve", "")).toBeNull();
  expect(decisionProblem("reject", "  ")).toBe("Say why the request is rejected");
  expect(decisionProblem("reject", "Wrong supplier")).toBeNull();
  expect(decisionProblem("approve", "x".repeat(2001))).toContain("2000");
});

import { entity, leave } from "./__fixtures__/approval-records";
interface Call { method: string; path: string; body: unknown }

function open(address: string, options: { countsFail?: boolean; permissions?: string[] } = {}) {
  const backend = stubBackend({ permissions: options.permissions ?? ["CanViewPendingApprovals", "CanApprovePendingApproval", "CanRejectPendingApproval"] });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/approval/my-pending/document-counts") return options.countsFail ? new Response(null, { status: 404 }) : Response.json({ LeaveRequest: 2, PurchaseOrder: 1, QcCoa: 3, PayrollRun: 1, BillingSheet: 0 });
    if (path === "/api/v1/approval/my-pending/stats") return Response.json({ LeaveRequest: 2 });
    if (path === "/api/v1/approval/my-pending") return Response.json([entity("LeaveRequest", "lr-1"), entity("LeaveRequest", "lr-2", { approvalLogs: [{ user: { name: "K. Mensah" }, status: 1, approvedAt: "2026-10-01T08:00:00Z" }], onBehalfOf: { name: "Ama Owusu" } }), entity("PurchaseOrder", "po-9")]);
    if (path === "/api/v1/approval/delegations/mine") return Response.json({ given: [{ id: "dg-1", delegator: { name: "Ada Mensah" }, delegate: { name: "Kofi Boateng" }, startsAt: "2026-10-14T08:00:00Z", endsAt: "2026-10-20T00:00:00Z", reason: "Annual leave", status: 1 }],
      received: [{ id: "dg-2", delegator: { name: "Ama Owusu" }, delegate: { name: "Ada Mensah" }, startsAt: "2026-10-01T08:00:00Z", endsAt: "2026-10-03T00:00:00Z", status: 2 }] });
    if (path === "/api/v1/approval/delegations/dg-1" && input.method === "DELETE") return new Response(null, { status: 204 });
    if (path === "/api/v1/approval/my-pending/LeaveRequest/lr-1") return Response.json(entity("LeaveRequest", "lr-1", { approvalLogs: [{ user: { name: "K. Mensah" }, status: 2, approvedAt: "2026-09-30T12:00:00Z", comments: "Dates clash with the audit" }] }));
    if (path === "/api/v1/approval/my-pending/ServiceMemo/sm-1") return Response.json(entity("ServiceMemo", "sm-1"));
    if (path === "/api/v1/approval/my-pending/LeaveRequest/gone") return new Response(null, { status: 403 });
    if (path === "/api/v1/leave-request/lr-1") return Response.json(leave);
    if (path.startsWith("/api/v1/approval/approve/") || path.startsWith("/api/v1/approval/reject/")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals", element: <PendingApprovalsPage /> }, { path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("shows what is waiting by document, linking only those decided here", async () => {
  const { router } = open("/qa/pending-approvals");
  expect(await screen.findByText("7 requests are waiting for your decision.")).toBeTruthy();
  const cards = within(screen.getByRole("list", { name: "Documents waiting for you" }));
  // Nothing waiting for billing sheets, so no card; QC is decided on its own page, so its card is not a link.
  expect(cards.queryByText("Billing sheet")).toBeNull();
  expect(cards.queryByRole("link", { name: /QC COA/ })).toBeNull();
  expect(cards.getByText(/Decided in Quality Control/)).toBeTruthy();
  expect(cards.getByRole("link", { name: "Payroll run, 1 waiting" })).toBeTruthy();
  await userEvent.setup().click(cards.getByRole("link", { name: "Leave request, 2 waiting" }));
  await waitFor(() => expect(router.state.location.search).toBe("?type=LeaveRequest"));
  expect(await screen.findByText("LR-1")).toBeTruthy();
  // The purchase order the server also sent is not shown under leave requests.
  expect(screen.queryByText("PO-9")).toBeNull();
  expect(screen.getByText("1 recorded")).toBeTruthy();
  // A request reached through a delegation says whose it is.
  expect(screen.getByText("For Ama Owusu")).toBeTruthy();
});

it("lists delegations given and received, and ends one only after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/qa/pending-approvals");
  // The page may be drawn again once the session settles, so the panel is looked up after it has loaded.
  expect(await screen.findByText("Kofi Boateng")).toBeTruthy();
  const panel = within(screen.getByRole("region", { name: "Delegation" }));
  expect(panel.getByText("Annual leave")).toBeTruthy();
  // An ended delegation cannot be ended again.
  expect(panel.getAllByRole("button", { name: /^(End|Give back)$/ })).toHaveLength(1);
  await user.click(panel.getByRole("button", { name: "End" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("Kofi Boateng stops seeing and deciding your approvals now");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "End delegation" }));
  await waitFor(() => expect(writes(calls).map((call) => [call.method, call.path])).toEqual([["DELETE", "/api/v1/approval/delegations/dg-1"]]));
}, 20_000);

it("falls back to the older count when the full one is not there", async () => {
  open("/qa/pending-approvals", { countsFail: true });
  expect(await screen.findByText("2 requests are waiting for your decision.")).toBeTruthy();
});

it("shows the document and its history, and rejects only with a reason", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/qa/pending-approvals/LeaveRequest/lr-1");
  expect(await screen.findByText("Annual leave")).toBeTruthy();
  expect(screen.getByText("Family event")).toBeTruthy();
  expect(document.querySelector("script")).toBeNull();
  expect(screen.getByText(/2 days more than the balance/)).toBeTruthy();
  expect(screen.getByText(/was rejected earlier by K. Mensah/)).toBeTruthy();
  expect(within(screen.getByRole("list", { name: "Approval history" })).getByText("Dates clash with the audit")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Reject" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Reject request" }));
  expect(await within(dialog).findByText("Say why the request is rejected")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.type(within(dialog).getByRole("textbox"), "Balance is too low");
  await user.click(within(dialog).getByRole("button", { name: "Reject request" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/approval/reject/LeaveRequest/lr-1", body: { comments: "Balance is too low" } }]));
  await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe("/qa/pending-approvals?type=LeaveRequest"));
}, 20_000);

it("approves after a confirmation, with an optional comment", async () => {
  const user = userEvent.setup();
  const { calls } = open("/qa/pending-approvals/LeaveRequest/lr-1");
  await screen.findByText("Annual leave");
  await user.click(screen.getByRole("button", { name: "Approve" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve request" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/approval/approve/LeaveRequest/lr-1", body: { comments: null } }]));
}, 20_000);

it("does not let a document be decided unseen, or one that is not waiting for the user", async () => {
  open("/qa/pending-approvals/ServiceMemo/sm-1");
  expect(await screen.findByText(/cannot show a service memo yet, so it cannot be decided here/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Reject" }) as HTMLButtonElement).disabled).toBe(true);
  cleanup();
  open("/qa/pending-approvals/LeaveRequest/gone");
  expect(await screen.findByText("Not waiting for you")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
}, 20_000);

it("offers approving and rejecting each to those who hold that permission", async () => {
  open("/qa/pending-approvals/LeaveRequest/lr-1", { permissions: ["CanViewPendingApprovals"] });
  await screen.findByText("Annual leave");
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
  cleanup();
  open("/qa/pending-approvals/LeaveRequest/lr-1", { permissions: ["CanViewPendingApprovals", "CanRejectPendingApproval"] });
  await screen.findByText("Annual leave");
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
});

it("lays out every readable document without failing, from full or sparse data", async () => {
  const documents: Record<string, object> = {
    StockAdjustment: { adjustmentNumber: "ADJ-1", targetType: 1, lines: [{ id: "l1", materialName: "Maize starch", batchNumber: "B-1", systemQuantitySnapshot: 5000, physicalCount: 4000, variance: -1000, uom: { symbol: "g" }, reasonCode: "PhysicalCount" }] },
    ProductionOrder: { code: "SO-1", customer: { name: "Kinapharma" }, totalValue: 1200, products: [{ product: { name: "Paracetamol syrup", code: "FP-1" }, totalOrderQuantity: 100, unitPrice: 12, totalValue: 1200 }] },
    AllocateProductionOrder: { productionOrder: { code: "SO-1" }, products: [{ product: { name: "Paracetamol syrup" }, fulfilledQuantities: [{ quantity: 60, finishedGoodsTransferNote: { transferNoteNumber: "FG-7" } }] }] },
    OvertimeRequest: { code: "OT-1", totalHours: 3, employees: [{ id: "e1", firstName: "Kofi", lastName: "Boateng" }, { id: "e2", firstName: "Esi", lastName: "Arthur" }] },
  };
  documents.CustomerQuotation = { code: "CQ-1", customerName: "Kinapharma", totalValue: 1140, currency: { symbol: "GH₵" }, items: [{ id: "i1", productName: "Paracetamol syrup", quantity: 100, shippers: 4, loose: 4, unitPrice: 12, discountPercent: 5, totalValue: 1140 }] };
  documents.SupplierPricingAgreement = { changeKind: 1, materialName: "Maize starch", agreedPrice: 13.2, priceUoM: "kg", currency: { symbol: "$" }, priorAgreedPrice: 12, priorPriceUoM: "kg", priorCurrencySymbol: "$", effectiveFrom: "2026-11-01T00:00:00Z" };
  documents.PayrollRun = { periodStart: "2026-09-01T00:00:00Z", periodEnd: "2026-09-30T00:00:00Z", employeeCount: 84, totalGrossPay: 250000, totalNetPay: 190000 };
  documents.PerformanceReview = { employeeName: "Ama Owusu", overallRating: 3, goalRatings: [{ goalId: "g1", goalTitle: "Reduce rework", achievementPercentage: 80 }] };
  documents.RndProject = { code: "RD-7", title: "Paediatric syrup", status: 5 };
  documents.RndFormulation = { project: { code: "RD-7", title: "Paediatric syrup", status: 2 }, formulation: { version: 3, items: [{ id: "f1", order: 1, material: { name: "Sorbitol", code: "RM-9" }, baseQuantity: 25, baseUoM: { symbol: "g" }, percentage: 12.5 }] } };
  documents.RndTechnologyTransfer = { rndProjectId: "p1", rndFormulationId: "f1", status: 4 };
  documents.Response = { form: { id: "form-1" }, materialBatch: { id: "mb-1", name: "Maize starch" }, formResponses: [] };
  // Records a document's page reads after the document itself.
  const related: Record<string, object> = { "/api/v1/rnd/projects/p1/formulations/f1": { version: 2, items: [{ id: "f1", order: 1, material: { name: "Sorbitol" }, baseQuantity: 25 }] }, "/api/v1/rnd/projects/p1": { code: "RD-7", title: "Paediatric syrup", status: 3 },
    "/api/v1/form/form-1": { sections: [{ id: "s1", name: "<p>Assay</p>", description: "<p>98.0% to 102.0%</p>", order: 1, fields: [{ id: "fld-1", question: { label: "Assay" } }] }] },
    "/api/v1/form/responses/material-batch/mb-1": [{ responseId: "doc-1", formField: { id: "fld-1" }, value: "94.1% Does not comply" }, { responseId: "other", formField: { id: "fld-1" }, value: "99.9%" }],
    "/api/v1/material-ard/material/batch-details/mb-1": { arNumber: "AR-55", materialBatch: { batchNumber: "B-1", material: { name: "Maize starch" } } } };
  const expected: Record<string, string> = { CustomerQuotation: "GH₵ 1,140.00", SupplierPricingAgreement: "10% above the current one", PayrollRun: "190,000.00", PerformanceReview: "Exceeds expectations", RndProject: "On hold",
    RndFormulation: "V3", RndTechnologyTransfer: "Execution in progress", Response: "No.Test & Observations1Assay94.1% does not comply", StockAdjustment: "-1 kg", ProductionOrder: "Kinapharma", AllocateProductionOrder: "FG-7", OvertimeRequest: "6 for 2 people" };
  for (const type of ["StockAdjustment", "ProductionOrder", "AllocateProductionOrder", "OvertimeRequest", "ProformaInvoice", "FinishedGoodsTransferNote", "ProductionExtraPacking", "StaffRequisition", "JobRequest", "PurchaseOrder", "BillingSheet", "ShipmentDocument", "PurchaseRequisition",
    "CustomerQuotation", "SupplierPricingAgreement", "PayrollRun", "PerformanceReview", "RndProject", "RndFormulation", "RndTechnologyTransfer", "Response"]) {
    const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval"] });
    rememberSession();
    const session = backend.fetcher.getMockImplementation();
    backend.fetcher.mockImplementation(async (input, init) => {
      if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
      const path = new URL(input.url).pathname;
      if (path.startsWith("/api/v1/approval/my-pending/")) return Response.json(entity(type, "doc-1", { supplierId: "s0" }));
      for (const [part, body] of Object.entries(related)) if (path.includes(part)) return Response.json(body);
      return Response.json(documents[type] ?? {});
    });
    const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: [`/qa/pending-approvals/${type}/doc-1`] });
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
    const section = await screen.findByRole("region", { name: /details$/ });
    await waitFor(() => expect(within(section).queryByText(/^Loading the/)).toBeNull());
    const text = expected[type];
    if (text) expect(section.textContent).toContain(text);
    expect((screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement).disabled).toBe(false);
    cleanup(); forgetSession();
  }
}, 60_000);
