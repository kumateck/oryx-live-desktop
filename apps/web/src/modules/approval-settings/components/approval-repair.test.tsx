// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { forgetSession } from "@/test/backend";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import { ApprovalEditPage } from "./approval-edit-page";
import { ApprovalConfigurationsWorkspace } from "./approval-configurations-workspace";

// jsdom has no layout; the real select scrolls its keyboard-focused option into view.
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const broken = { id: "legacy-stock", itemType: "Stock", escalationDuration: "00:00:00", approvalStages: [false, true, false].map((required) => ({ role: null, user: null, required, order: 0 })) };

async function repairDraft() {
  const user = userEvent.setup();
  await screen.findByText(/Review every retained stage/);
  expect((await screen.findAllByRole("checkbox", { name: "Required approval" })).map((box) => box.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findAllByText("Choose a role")).toHaveLength(3);
  await user.click(screen.getByRole("button", { name: "Remove stage 3" }));
  await user.click(screen.getByRole("button", { name: "Remove stage 1" }));
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Approver role" }), { key: "ArrowDown" });
  fireEvent.keyDown(await screen.findByRole("option", { name: "General Manager Production" }), { key: "Enter" });
  expect(screen.getByRole("checkbox", { name: "Required approval" }).getAttribute("aria-checked")).toBe("true");
  return user;
}

it("repairs the same legacy record only after an explicit approver choice and fresh evidence check", async () => {
  const calls = settingsBackend(["CanViewApprovals", "CanEditApprovalWorkflow"], (request) => {
    if (request.method === "PUT") return new Response(null, { status: 204 });
    if (new URL(request.url).pathname === "/api/v1/approval/legacy-stock") return Response.json(broken);
    return Response.json([{ id: "production-role", name: "General Manager Production" }]);
  });
  mountSettings(<ApprovalEditPage id="legacy-stock" />, "/settings/approvals/edit/legacy-stock");
  const user = await repairDraft();
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(calls.filter((call) => call.method === "PUT")).toHaveLength(1));
  const save = calls.find((call) => call.method === "PUT");
  expect(save?.path).toBe("/api/v1/approval/legacy-stock");
  expect(JSON.parse(save?.body ?? "null")).toEqual({ itemType: "Stock", escalationDuration: "00:00:00", approvalStages: [{ required: true, order: 1, roleId: "production-role" }] });
  expect(calls.filter((call) => call.method === "GET" && call.path === "/api/v1/approval/legacy-stock").length).toBeGreaterThanOrEqual(2);
  expect(calls.some((call) => call.method === "POST" || call.method === "DELETE")).toBe(false);
}, 15000);

it("refuses a repair after another operator changes the workflow", async () => {
  let reads = 0;
  const calls = settingsBackend(["CanViewApprovals", "CanEditApprovalWorkflow"], (request) => {
    if (new URL(request.url).pathname === "/api/v1/approval/legacy-stock") {
      reads++;
      return Response.json(reads === 1 ? broken : { ...broken, escalationDuration: "01:00:00" });
    }
    return Response.json([{ id: "production-role", name: "General Manager Production" }]);
  });
  mountSettings(<ApprovalEditPage id="legacy-stock" />, "/settings/approvals/edit/legacy-stock");
  const user = await repairDraft();
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText(/This workflow changed/)).toBeTruthy();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
}, 15000);

it("keeps the repair action hidden from a view-only account", async () => {
  settingsBackend(["CanViewApprovals"], () => Response.json({ data: [broken], totalRecordCount: 1 }));
  mountSettings(<ApprovalConfigurationsWorkspace />, "/settings/approvals");
  await screen.findByText(/legacy Stock configuration/);
  expect(screen.queryByRole("link", { name: "Repair Stock workflow" })).toBeNull();
});
