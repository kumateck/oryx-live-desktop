// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ApprovalRightsTransferPage from "../../../pages/(workspace)/qa/approval-rights-transfer/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";
import { WorkflowCreatePage as CreateWorkflowPage, WorkflowEditPage as EditWorkflowPage, WorkflowListPage as ApprovalsSettingsPage } from "./workflow-pages";
import { transferSchema, userOptions } from "../../approval-rights-transfer/components/transfer-rights-page";
import { describeWait, formatWait, isSingleRoleRoute, parseWait, workflowLabel } from "../lib/workflows";
import { workflowFormSchema, workflowSchema } from "../schemas/workflow-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

it("reads and writes the escalation time, and holds a workflow to its rules", () => {
  expect([parseWait("2.04:30:00"), parseWait("08:00:00"), parseWait("soon"), parseWait(null)]).toEqual([{ days: 2, hours: 4, minutes: 30 }, { days: 0, hours: 8, minutes: 0 }, null, null]);
  expect([formatWait({ days: 2, hours: 4, minutes: 5 }), formatWait({ days: 0, hours: 8, minutes: 0 })]).toEqual(["2.04:05:00", "0.08:00:00"]);
  expect([describeWait({ days: 1, hours: 0, minutes: 30 }), describeWait(null)]).toEqual(["1 day 30 minutes", "Not set"]);
  expect([isSingleRoleRoute("ResponseMaterial"), isSingleRoleRoute("PurchaseOrder")]).toEqual([true, false]);
  expect([workflowLabel("PurchaseOrder"), workflowLabel("ResponseMaterial")]).toEqual(["Purchase order", "Material test results · raw or packaging → QA GM"]);
  const role = (id: string) => ({ kind: "role", approver: { value: id, label: id } });
  const base = { document: { value: "PurchaseOrder", label: "Purchase order" }, days: 1, hours: 0, minutes: 0 };
  const messages = (value: object) => workflowFormSchema.safeParse(value).error?.issues.map((issue) => issue.message) ?? [];
  expect(messages({ ...base, stages: [role("r1"), { kind: "user", approver: { value: "u1", label: "Ama" } }] })).toEqual([]);
  expect(messages({ ...base, stages: [] })).toEqual(["Add at least one approver"]);
  expect(messages({ ...base, days: 0, stages: [role("r1")] })).toEqual(["Give the stage some time before it is escalated"]);
  expect(messages({ ...base, stages: [role("r1"), role("r1")] })).toEqual(["This approver is already in the workflow"]);
  expect(messages({ ...base, document: { value: "ResponseMaterial", label: "x" }, stages: [role("r1"), role("r2")] })).toEqual(["This route takes exactly one approver, and it has to be a role"]);
  expect(messages({ ...base, document: { value: "ResponseMaterial", label: "x" }, stages: [{ kind: "user", approver: { value: "u1", label: "Ama" } }] })).toEqual(["This route takes exactly one approver, and it has to be a role"]);
  // Stages come back in any order and are read in theirs.
  expect(workflowSchema.parse({ id: "w", itemType: "PurchaseOrder", escalationDuration: "1.00:00:00", approvalStages: [{ order: 2, user: { id: "u1", name: "Ama" } }, { order: 1, role: { id: "r1", name: "QA Manager" } }] })?.stages)
    .toEqual([{ kind: "role", id: "r1", name: "QA Manager" }, { kind: "user", id: "u1", name: "Ama" }]);
  expect(userOptions([{ id: "u1", firstName: "Ama", lastName: "Owusu" }, { id: "u2", email: "k@x.com" }, { firstName: "No id" }])).toEqual([{ value: "u1", label: "Ama Owusu" }, { value: "u2", label: "k@x.com" }]);
  const person = (id: string) => ({ value: id, label: id });
  expect(transferSchema.safeParse({ from: person("a"), to: person("a") }).error?.issues[0]?.message).toBe("Choose a different person");
  expect(transferSchema.safeParse({ from: person("a"), to: person("b") }).success).toBe(true);
});

const workflow = { id: "w-1", itemType: "PurchaseOrder", escalationDuration: "2.04:00:00", approvalStages: [{ order: 1, role: { id: "r1", name: "Procurement Manager" } }, { order: 2, user: { id: "u1", name: "Ama Owusu" } }] };
interface Call { method: string; path: string; body: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/collection") return Response.json({ Role: [{ id: "r1", name: "Procurement Manager" }, { id: "r2", name: "Finance Manager" }], User: [{ id: "u1", name: "Ama Owusu" }] });
    if (path === "/api/v1/approval" && input.method === "GET") return Response.json({ data: [workflow], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === "/api/v1/approval") return Response.json("w-9", { status: 201 });
    if (path === "/api/v1/approval/w-1") return input.method === "GET" ? Response.json(workflow) : new Response(null, { status: 204 });
    if (path === "/api/v1/approval/users-with-pending") return Response.json([{ id: "u1", firstName: "Ama", lastName: "Owusu" }]);
    if (path === "/api/v1/user") return Response.json({ data: [{ id: "u1", firstName: "Ama", lastName: "Owusu" }, { id: "u2", firstName: "Kofi", lastName: "Boateng" }], pageIndex: 1, pageCount: 1 });
    if (path === "/api/v1/approval/transfer-rights") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/approvals", element: <ApprovalsSettingsPage /> }, { path: "/settings/approvals/create", element: <CreateWorkflowPage /> }, { path: "/settings/approvals/edit/:id", element: <EditWorkflowPage /> },
    { path: "/qa/approval-rights-transfer", element: <ApprovalRightsTransferPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection");

it("lists workflows with their approvers in order, and offers only what the user may do", async () => {
  open("/settings/approvals", ["CanViewApprovals", "CanEditApprovalWorkflow"]);
  expect(await screen.findByText("Purchase order")).toBeTruthy();
  expect(screen.getByText("Procurement Manager")).toBeTruthy();
  expect(screen.getByText("2 days 4 hours")).toBeTruthy();
  expect(screen.queryByRole("link", { name: /New workflow/ })).toBeNull();
  await openMenu("Actions for Purchase order");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit"]);
});

it("deletes a workflow only after saying what that means", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/approvals", ["CanViewApprovals", "CanDeleteApprovals"]);
  await screen.findByText("Purchase order");
  await chooseAction("Actions for Purchase order", "Delete");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/approved automatically, with nobody asked/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Delete workflow" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "DELETE", path: "/api/v1/approval/w-1", body: null }]));
}, 20_000);

it("edits a workflow with its document fixed and its time and stages filled in, sending stages in page order", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/settings/approvals/edit/w-1", ["CanViewApprovals", "CanEditApprovalWorkflow"]);
  expect(((await screen.findByRole("spinbutton", { name: /days/ })) as HTMLInputElement).value).toBe("2");
  expect((screen.getByRole("spinbutton", { name: "Hours" }) as HTMLInputElement).value).toBe("4");
  expect((await screen.findByRole("combobox", { name: /^Document/ }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: "Move stage 2 up" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/settings/approvals"));
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/approval/w-1", body: { itemType: "PurchaseOrder", escalationDuration: "2.04:00:00",
    approvalStages: [{ userId: "u1", required: true, order: 1 }, { roleId: "r1", required: true, order: 2 }] } }]);
}, 30_000);

it("does not create a workflow without a document and an approver", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/approvals/create", ["CanViewApprovals", "CanCreateNewApproval"]);
  await screen.findByRole("combobox", { name: /^Document/ });
  await user.click(screen.getByRole("button", { name: "Create workflow" }));
  expect(await screen.findByText("Choose the document")).toBeTruthy();
  expect(screen.getByText("Choose the approver")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  // A document that already has a workflow is shown as taken.
  await user.click(screen.getByRole("combobox", { name: /^Document/ }));
  expect(await screen.findByRole("option", { name: "Purchase order (already has a workflow)" })).toBeTruthy();
}, 30_000);

it("transfers approval rights only after both people are chosen and the consequences are confirmed", async () => {
  const user = userEvent.setup();
  const { calls } = open("/qa/approval-rights-transfer", ["CanTransferApprovalRights"]);
  await screen.findByRole("combobox", { name: /Take approvals from/ });
  await user.click(screen.getByRole("button", { name: "Transfer rights" }));
  expect(await screen.findByText("Choose who the approvals are taken from")).toBeTruthy();
  await user.click(screen.getByRole("combobox", { name: /Take approvals from/ }));
  await user.click(await screen.findByRole("option", { name: "Ama Owusu" }));
  await user.click(screen.getByRole("combobox", { name: /Give them to/ }));
  // The person giving up their approvals is not offered as the one taking them.
  const offered = await screen.findAllByRole("option");
  expect(offered.map((item) => item.textContent)).toEqual(["Kofi Boateng"]);
  await user.click(offered[0]!);
  await user.click(screen.getByRole("button", { name: "Transfer rights" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/replaces Ama Owusu in every approval workflow/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Transfer rights" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/approval/transfer-rights", body: { fromUserId: "u1", toUserId: "u2" } }]));
}, 30_000);
