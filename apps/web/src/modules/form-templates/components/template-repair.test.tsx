// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { RouteAccess } from "@/components/shell/route-access";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { TemplateRepairPage } from "./template-repair-page";

afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });
const formId = "019af455-024a-76f0-823c-8ec2e065cbe2";
const testId = "019af455-024a-76f0-823c-8ec2e065cbe3";
const fieldId = "019af455-024a-76f0-823c-8ec2e065cbe4";
const analystId = "019af455-024a-76f0-823c-8ec2e065cbe5";
const sectionId = "019af455-024a-76f0-823c-8ec2e065cbe6";
const repairId = "019af455-024a-76f0-823c-8ec2e065cbe7";
const allPermissions = ["CanViewTemplateRepair", "CanApplyTemplateRepair", "CanReassignProductTest"];
type Reply = () => Response;
const ok: Reply = () => Response.json({ repairId, alreadyApplied: false, formAssigneeIds: [testId], fieldsAdded: 1 });
function open(permissions = allPermissions, replies: Reply[] = [ok], eligible = true) {
  const backend = stubBackend({ permissions }); rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = []; const reads: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === `/api/v1/template-repairs/forms/${formId}`) {
      reads.push(path);
      return Response.json({ formId, formName: "Full Procedures", canApply: true, hiddenTests: 0,
        fields: [{ formFieldId: fieldId, sectionId, section: "Assay", label: "Appearance", required: true }],
        tests: [{ formAssigneeId: testId, kind: 0, retest: false, recordId: testId, label: "AR-1", responseId: null,
          answeredFields: 7, eligible, blocker: eligible ? null : "The worksheet is checked, approved, rejected or governed.",
          analysts: [{ userId: analystId, name: "Ama Analyst", fields: 7 }], missing: [{ formFieldId: fieldId, suggestedAssigneeId: analystId }] }],
      });
    }
    if (path.endsWith("/history")) return Response.json([]);
    if (path.endsWith("/preview")) return Response.json({ previewToken: "a".repeat(64), fieldsAdded: 1, blockers: [],
      tests: [{ formAssigneeId: testId, label: "AR-1", answersKept: 7,
        added: [{ formFieldId: fieldId, section: "Assay", label: "Appearance", assigneeId: analystId, assigneeName: "Ama Analyst" }] }],
    });
    if (path.endsWith("/apply")) { writes.push(await input.text()); return (replies.shift() ?? ok)(); }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/templates/:id/repair", element: <RouteAccess><TemplateRepairPage /></RouteAccess> }],
    { initialEntries: [`/settings/templates/${formId}/repair`] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}
async function review() {
  await screen.findByRole("heading", { name: "Repair Full Procedures" });
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all missing fields for AR-1" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  await screen.findByRole("region", { name: "Repair preview" });
}

it("denies the repair page before fetching business data without the view key", async () => {
  const { reads, writes } = open([]);
  await screen.findByText(/don.t have access to this page/i);
  expect(reads).toHaveLength(0); expect(writes).toHaveLength(0);
});

it("previews the added field and applies the exact reviewed assignments with a reason", async () => {
  const { writes } = open();
  await review();
  expect(screen.getByText("7 saved answers kept")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Explain the repair in 10–1000 characters.");
  expect(writes).toHaveLength(0);
  fireEvent.change(screen.getByRole("textbox", { name: "Reason for repair" }), { target: { value: "Appearance was added after assignment" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Template repair saved");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ previewToken: "a".repeat(64), reason: "Appearance was added after assignment",
    candidate: { assignments: [{ formAssigneeId: testId, formFieldId: fieldId, assigneeId: analystId }] } });
});

it("hides apply without the apply key while permitting a read-only preview", async () => {
  const { writes } = open(["CanViewTemplateRepair", "CanReassignProductTest"]);
  await review();
  expect(screen.queryByRole("button", { name: "Apply repair" })).toBeNull();
  expect(writes).toHaveLength(0);
});

it("refuses a variant permission mismatch before apply", async () => {
  const { writes } = open(["CanViewTemplateRepair", "CanApplyTemplateRepair", "CanReassignRawMaterialTest"]);
  await screen.findByRole("heading", { name: "Repair Full Procedures" });
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all missing fields for AR-1" }));
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  await screen.findByRole("alert");
  expect(screen.queryByRole("region", { name: "Repair preview" })).toBeNull();
  expect(writes).toHaveLength(0);
});

it("invalidates preview when selection changes and disables closed worksheets", async () => {
  open(); await review();
  fireEvent.click(screen.getByRole("checkbox", { name: "Select all missing fields for AR-1" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Repair preview" })).toBeNull());
  expect(screen.getByRole("button", { name: "Apply repair" })).toHaveProperty("disabled", true);
  cleanup(); forgetSession(); open(allPermissions, [ok], false);
  await screen.findByRole("heading", { name: "Repair Full Procedures" });
  expect(screen.getByRole("checkbox", { name: "Select all missing fields for AR-1" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Preview repair" })).toHaveProperty("disabled", true);
});

it("retries an unconfirmed write with the same request ID and requires a fresh preview after conflict", async () => {
  const { writes } = open(allPermissions, [() => new Response(null, { status: 502 }), ok]);
  await review();
  fireEvent.change(screen.getByRole("textbox", { name: "Reason for repair" }), { target: { value: "Appearance was added after assignment" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Template repair saved");
  expect(JSON.parse(writes[0] ?? "{}").requestId).toBe(JSON.parse(writes[1] ?? "{}").requestId);
  cleanup(); forgetSession();
  const conflict = open(allPermissions, [() => Response.json({ errors: [{ code: "TemplateRepair.StalePreview", description: "Review a fresh preview." }] }, { status: 409 })]);
  await review();
  fireEvent.change(screen.getByRole("textbox", { name: "Reason for repair" }), { target: { value: "Appearance was added after assignment" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await waitFor(() => expect(screen.queryByRole("region", { name: "Repair preview" })).toBeNull());
  expect(conflict.writes).toHaveLength(1);
});
