// @vitest-environment jsdom
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PendingReviewsRoute from "../../pages/(workspace)/qa/pending-reviews/page";
import ReviewSettingsRoute from "../../pages/(workspace)/settings/reviews/page";
import { reviewDocumentPath } from "../../modules/pending-reviews/lib/review-documents";
import { requisitionReview } from "../../modules/requisitions/lib/requisition-review";
import { reviewersPayload } from "../../modules/review-settings/schemas/reviewers-schema";
import { checkNote, issueCheckKeys } from "../../modules/stock-issue/lib/stock-issue";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { ApiProvider } from "../api/api-provider";
import { SessionProvider } from "../auth/session-provider";
import { ReviewPanel } from "./review-panel";
import { documentSigners } from "./use-document-signatures";
import type { DocumentReviewState } from "./review-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const person = (id: string, name: string) => ({ id, name, signature: `${id}.png` });
const state = (overrides: Partial<DocumentReviewState> = {}): DocumentReviewState => ({
  modelType: "PurchaseRequisition", modelId: "r1", code: "PR-0001", reviewRequired: true,
  review: { id: "v1", submission: 1, version: 3, status: 0, preparedBy: person("u1", "Ama Owusu"), submittedAt: "2026-11-16T08:00:00Z", reviewedBy: null, reviewedAt: null, comments: null,
    events: [{ action: 0, actor: person("u1", "Ama Owusu"), comments: null, at: "2026-11-16T08:00:00Z" }] },
  canConfirm: true, canReturn: true, canResubmit: false,
  signatures: { preparedBy: person("u1", "Ama Owusu"), checkedBy: null, checkedAt: null, approvedBy: null, approvedAt: null },
  ...overrides,
});
interface Call { method: string; path: string; body: unknown }

function serve(permissions: string[], routes: Record<string, unknown>) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) : null });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    return path in routes ? Response.json(routes[path]) : new Response(null, { status: 404 });
  });
  return calls;
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");
const keys = { confirm: "CanReviewRawMaterialPurchaseRequisition", return: "CanReturnRawMaterialPurchaseRequisition", resubmit: "CanEditRawMaterialPurchaseRequisition" };

function panel(permissions: string[], review: DocumentReviewState) {
  const calls = serve(permissions, { "/api/v1/document-review/PurchaseRequisition/r1": review });
  const router = createMemoryRouter([{ path: "/", element: <ReviewPanel record={{ modelType: "PurchaseRequisition", modelId: "r1" }} keys={keys} label="requisition" /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

describe("review panel", () => {
  it("confirms with an optional comment and the version the reviewer saw", async () => {
    const user = userEvent.setup();
    const calls = panel([keys.confirm, keys.return], state());
    expect(await screen.findByText("Awaiting review")).toBeTruthy();
    expect(screen.getByText("Ama Owusu", { selector: "dd" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Confirm checked" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Comment (optional)"), "Quantities agree with the BOM");
    await user.click(within(dialog).getByRole("button", { name: "Confirm checked" }));
    await waitFor(() => expect(writes(calls)).toHaveLength(1));
    expect(writes(calls)[0]).toEqual({ method: "POST", path: "/api/v1/document-review/PurchaseRequisition/r1/confirm", body: { comments: "Quantities agree with the BOM", version: 3 } });
  }, 20_000);

  it("needs a comment to return a record and sends nothing without one", async () => {
    const user = userEvent.setup();
    const calls = panel([keys.confirm, keys.return], state());
    await user.click(await screen.findByRole("button", { name: "Return for correction" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Return" }));
    expect(await within(dialog).findByText("Say what needs correcting.")).toBeTruthy();
    expect(writes(calls)).toEqual([]);
    await user.type(within(dialog).getByLabelText("What needs correcting"), "Lactose should be 12 kg");
    await user.click(within(dialog).getByRole("button", { name: "Return" }));
    await waitFor(() => expect(writes(calls)[0]?.path).toBe("/api/v1/document-review/PurchaseRequisition/r1/return"));
  }, 20_000);

  it("does not send a confirm without the record's review key, even when the server offers it", async () => {
    const user = userEvent.setup();
    const calls = panel(["CanReviewPackageMaterialPurchaseRequisition"], state());
    await user.click(await screen.findByRole("button", { name: "Confirm checked" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("button", { name: "Confirm checked" }).hasAttribute("disabled")).toBe(true);
    expect(writes(calls)).toEqual([]);
  });

  it("shows only what the server allows, the reviewer's return comment, and nothing for a type with no review", async () => {
    panel([keys.resubmit], state({ canConfirm: false, canReturn: false, canResubmit: true,
      review: { ...state().review!, status: 1, reviewedBy: person("u2", "Kofi Mensah"), comments: "Wrong unit" } }));
    expect(await screen.findByText(/Returned by Kofi Mensah/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirm checked" })).toBeNull();
    expect(screen.getByRole("button", { name: "Send back for review" })).toBeTruthy();
    cleanup(); forgetSession();
    panel([keys.confirm], state({ reviewRequired: false, review: null, canConfirm: false, canReturn: false }));
    await waitFor(() => expect(screen.queryByText("Review")).toBeNull());
  });
});

describe("review contracts", () => {
  it("prints Prepared, Checked and Approved by from the review, leaving unsigned lines blank", () => {
    const signed = state({ signatures: { preparedBy: person("u1", "Ama Owusu"), checkedBy: person("u2", "Kofi Mensah"), checkedAt: "2026-11-16T09:00:00Z", approvedBy: null, approvedAt: null } });
    expect(documentSigners(signed)).toEqual([
      { role: "Prepared by", name: "Ama Owusu", signature: "u1.png", signedOn: null },
      { role: "Checked by", name: "Kofi Mensah", signature: "u2.png", signedOn: expect.any(String) as string },
      { role: "Approved by" },
    ]);
    expect(documentSigners(undefined).map((line) => Object.keys(line))).toEqual([["role"], ["role"], ["role"]]);
  });

  it("chooses a requisition's review type and keys from its stored type and line kinds", () => {
    const line = (kind: 0 | 1) => ({ id: `l${kind}`, materialId: `m${kind}`, materialName: "M", materialCode: null, materialKind: kind, quantity: 1, unit: "kg", unitId: "kg", status: 0 as const });
    const base = { id: "r1", code: "R", status: 0 as const, approved: false, comments: null, requestedBy: null, department: null, createdAt: null, expectedDelivery: null, product: null, whitePlaceboPreparationId: null };
    const mixed = requisitionReview({ ...base, type: 1, items: [line(0), line(1)] });
    expect(mixed?.record.modelType).toBe("PurchaseRequisition");
    expect(mixed?.keys.confirm).toEqual({ kind: "all", permissions: ["CanReviewRawMaterialPurchaseRequisition", "CanReviewPackageMaterialPurchaseRequisition"] });
    const packaging = requisitionReview({ ...base, type: 0, items: [line(1)] });
    expect(packaging?.record.modelType).toBe("PackageStockRequisition");
    expect(packaging?.keys.confirm).toBe("CanReviewPackageMaterialStockRequisition");
    expect(packaging?.edit).toBeNull();
    expect(requisitionReview({ ...base, type: 2, items: [line(0)] })).toBeNull();
  });

  it("opens each pending record on its own page and saves reviewers as roles and people", () => {
    expect(reviewDocumentPath({ modelType: "PurchaseOrder", modelId: "po1", variant: 1 })).toBe("/procurement/purchase-orders/po1?type=1");
    expect(reviewDocumentPath({ modelType: "PurchaseOrder", modelId: "po1", variant: null })).toBeNull();
    expect(reviewDocumentPath({ modelType: "RawStockRequisition", modelId: "r1", variant: null })).toBe("/production/requisition/r1/details");
    expect(reviewDocumentPath({ modelType: "BillingSheet", modelId: "b1", variant: null })).toBe("/logistics/billing-sheets/b1");
    expect(reviewDocumentPath({ modelType: "LeaveRequest", modelId: "l1", variant: null })).toBe("/hr/leave-management/l1/details");
    expect(reviewDocumentPath({ modelType: "AllocateProductionOrder", modelId: "a1", variant: null })).toBe("/crm/allocations/a1");
    expect(reviewDocumentPath({ modelType: "JobRequest", modelId: "j1", variant: null })).toBe("/extrals/job-requests/j1/details");
    expect(reviewDocumentPath({ modelType: "StockRequisitionIssue", modelId: "i1", variant: 0, parentId: "r9" })).toBe("/warehouse/stock-requisition/r9");
    expect(reviewDocumentPath({ modelType: "FormulaRevision", modelId: "f1", variant: null, parentId: "q1" })).toBe("/qa/formula-reviews/q1?revisionId=f1");
    expect(reviewDocumentPath({ modelType: "FormulaRevision", modelId: "f1", variant: null })).toBeNull();
    expect(reviewDocumentPath({ modelType: "Unknown", modelId: "x", variant: null })).toBeNull();
    // A stock issue's check is its review: keys by material kind; a returned issue says so on the voucher.
    expect(issueCheckKeys[1]).toEqual({ confirm: "CanCheckPackagingMaterialIssue", return: "CanReturnPackagingMaterialIssue", resubmit: "CanRepairIssuedPackaging" });
    expect(checkNote("Returned")).toBe("Returned to the store for correction");
    expect(reviewersPayload("PurchaseRequisition", { roles: [{ value: "role1", label: "QA" }], users: [{ value: "u1", label: "Ama" }] }))
      .toEqual({ itemType: "PurchaseRequisition", assignees: [{ roleId: "role1" }, { userId: "u1" }] });
    expect(() => reviewersPayload("PurchaseRequisition", { roles: [], users: [] })).toThrow();
  });
});

describe("review pages", () => {
  it("lists records waiting for the user's review and those returned to them", async () => {
    serve(["CanViewPendingReviews"], { "/api/v1/document-review/pending": { pageIndex: 1, pageCount: 1, totalRecordCount: 2, data: [
      { reviewId: "v1", modelType: "PurchaseOrder", documentLabel: "Purchase order", modelId: "po1", code: "PO-0009", variant: 0, status: 0, preparedBy: person("u1", "Ama Owusu"), submittedAt: "2026-11-16T08:00:00Z", comments: null },
      { reviewId: "v2", modelType: "PurchaseRequisition", documentLabel: "Purchase requisition", modelId: "r1", code: "PR-0001", variant: null, status: 1, preparedBy: person("u3", "Me"), submittedAt: "2026-11-16T08:00:00Z", comments: "Wrong unit" },
    ] } });
    const router = createMemoryRouter([{ path: "/qa/pending-reviews", element: <PendingReviewsRoute /> }], { initialEntries: ["/qa/pending-reviews"] });
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
    expect(await screen.findByText("PO-0009")).toBeTruthy();
    expect(screen.getByText("Your correction")).toBeTruthy();
    expect(screen.getByText("Wrong unit")).toBeTruthy();
  });

  it("shows review settings and offers changes only with the edit key", async () => {
    serve(["CanViewDocumentReviewSettings"], {
      "/api/v1/document-review/types": [{ itemType: "PurchaseOrder", label: "Purchase order", alwaysReviewed: true }, { itemType: "PurchaseRequisition", label: "Purchase requisition", alwaysReviewed: false }],
      "/api/v1/document-review/settings": [{ id: "c1", itemType: "PurchaseRequisition", label: "Purchase requisition", assignees: [{ role: { id: "role1", name: "QA officer" }, user: null }] }],
    });
    const router = createMemoryRouter([{ path: "/settings/reviews", element: <ReviewSettingsRoute /> }], { initialEntries: ["/settings/reviews"] });
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
    expect(await screen.findByText("QA officer (role)")).toBeTruthy();
    expect(screen.getByText(/Always checked before approval/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /reviewers/ })).toBeNull();
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });
});
