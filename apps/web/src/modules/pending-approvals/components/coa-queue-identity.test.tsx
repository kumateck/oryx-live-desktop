// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { SessionReady } from "@/test/session-ready";
import { ApprovalsQueuePage } from "./approvals-queue-page";
import { StockAdjustmentDetails } from "./details/production-details";
import { entity } from "./__fixtures__/approval-records";

afterEach(() => { cleanup(); forgetSession(); });
function backendFor(records: Record<string, object>) {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals"] });
  const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const record = records[new URL(input.url).pathname];
    return record ? Response.json(record) : new Response(null, { status: 404 });
  });
  rememberSession();
}
it("identifies each product and material certificate directly in the approval queue", async () => {
  backendFor({
    "/api/v1/approval/my-pending/document-counts": { Response: 2 },
    "/api/v1/approval/my-pending": [
      entity("Response", "coa-1", { code: null, productName: "Paracetamol syrup", productCode: "NL-001", productStage: 1, batchNumber: "L001K074" }),
      entity("Response", "coa-2", { code: null, materialName: "Glibenclamide", materialCode: "RMG001", batchNumber: "GLB-M/028/0620" }),
    ],
  });
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter initialEntries={["/qa/pending-approvals?type=Response"]}><ApprovalsQueuePage /></MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  expect(await screen.findByText("Paracetamol syrup")).toBeTruthy();
  expect(screen.getByText("NL-001 · Batch L001K074 · Bulk")).toBeTruthy();
  expect(screen.getByText("Glibenclamide")).toBeTruthy();
  expect(screen.getByText("RMG001 · Batch GLB-M/028/0620")).toBeTruthy();
  expect(screen.queryByText("No number")).toBeNull();
});
it("shows the stock adjustment note in its own labelled column for approvers", async () => {
  backendFor({ "/api/v1/stock-adjustment/adj-1": { adjustmentNumber: "ADJ-261124-3992", targetType: 1, lines: [
    { id: "line-1", materialName: "Albendazole", batchNumber: "961224", shelfName: "G/09/B", uom: { symbol: "kg" },
      systemQuantitySnapshot: 159.4, physicalCount: 160, variance: 0.6, reasonCode: "PhysicalCount", notes: "Test note\nRecounted by the store keeper" },
  ] } });
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter><StockAdjustmentDetails id="adj-1" /></MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  expect(await screen.findByText("Albendazole")).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Note" })).toBeTruthy();
  expect(screen.getByText(/Test note/).textContent).toContain("Recounted by the store keeper");
  expect(screen.getByText("Physical count")).toBeTruthy();
});
