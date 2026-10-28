// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { forgetSession } from "@/test/backend";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import { ApprovalEditor } from "./approval-editor";
import { ApprovalConfigurationsWorkspace } from "./approval-configurations-workspace";
import { approvalRecordSchema } from "../schemas/approval-settings-schema";

afterEach(() => { cleanup(); forgetSession(); });
const record = approvalRecordSchema.parse({ id: "approval-one", itemType: "PurchaseOrder", escalationDuration: "2.03:04:05.1234567", approvalStages: [
  { role: { id: "role-one", name: "QA" }, user: null, required: true, order: 1 },
  { role: null, user: { id: "user-one", name: "Ada" }, required: false, order: 2 },
] });
it("saves reordered stages without changing required flags or delay", async () => {
  const close = vi.fn();
  const calls = settingsBackend(["CanViewApprovals", "CanEditApprovalWorkflow"], (request) => {
    if (request.method === "GET") return Response.json([{ id: new URL(request.url).pathname.endsWith("Role") ? "role-one" : "user-one", name: "Approver" }]);
    return new Response(null, { status: 204 });
  });
  mountSettings(<ApprovalEditor record={record} onClose={close} />);
  await screen.findAllByRole("checkbox", { name: "Required approval" });
  await waitFor(() => expect(calls.filter((call) => call.method === "GET")).toHaveLength(2));
  fireEvent.click(screen.getByRole("button", { name: "Move stage 2 up" }));
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  const save = calls.find((call) => call.method === "PUT");
  expect(save?.path).toBe("/api/v1/approval/approval-one"); expect(save?.subModule).toBe("Approvals");
  expect(JSON.parse(save?.body ?? "null")).toEqual({ itemType: "PurchaseOrder", escalationDuration: "2.03:04:05.1234567", approvalStages: [
    { userId: "user-one", required: false, order: 1 }, { roleId: "role-one", required: true, order: 2 },
  ] });
}, 10000);
it("hides unauthorized workflow actions and never calls the non-persisting delegation endpoint", async () => {
  const calls = settingsBackend(["CanViewApprovals"], () => Response.json({ data: [record], totalRecordCount: 1 }));
  mountSettings(<ApprovalConfigurationsWorkspace />, "/settings/approvals");
  await screen.findByText("Purchase Order");
  expect(screen.queryByRole("button", { name: "Create workflow" })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Actions for/ })).toBeNull();
  expect(screen.getByText(/Timed delegation is unavailable/)).toBeTruthy();
  expect(calls.every((call) => call.path === "/api/v1/approval" && call.method === "GET")).toBe(true);
});

it("explains the malformed legacy Stock configuration without recreating or changing routing", async () => {
  const stock = { id: "legacy-stock", itemType: "Stock", escalationDuration: "00:00:00", approvalStages: [false, true, false].map((required) => ({ required, order: 0, role: null, user: null })) };
  const current = { ...record, id: "current-stock-requisition", itemType: "StockRequisition" };
  const calls = settingsBackend(["CanViewApprovals", "CanEditApprovalWorkflow"], () => Response.json({ data: [stock, current], totalRecordCount: 2 }));
  mountSettings(<ApprovalConfigurationsWorkspace />, "/settings/approvals");
  expect(await screen.findByText("Stock Requisition")).toBeTruthy();
  expect(screen.getByText(/legacy Stock configuration is separate from Stock Requisition routing/)).toBeTruthy();
  expect(screen.getByText(/unique stage numbers starting at 1/)).toBeTruthy();
  expect(screen.queryByText(/Recreate/)).toBeNull();
  expect(screen.queryByRole("button", { name: /Actions for Stock$/ })).toBeNull();
  expect(screen.getByRole("link", { name: "Repair Stock workflow" }).getAttribute("href")).toBe("/settings/approvals/edit/legacy-stock");
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});
