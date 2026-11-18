// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { RouteAccess } from "@/components/shell/route-access";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { FormulaRepairPage } from "./formula-repair-page";

afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });
const questionId = "019af455-024a-76f0-823c-8ec2e065cbe2";
const raw = JSON.stringify({ type: 0, expression: ":a/:b", decimalPlaces: 2 });
type Reply = () => Response;
const ok: Reply = () => Response.json({ repairId: "01a1a8ad-8c32-7cd6-9862-456570ca67e1", alreadyApplied: false, formIds: [], responseIds: [] });
function open(permissions = ["CanViewQuestions", "CanRepairQuestionFormula"], applyReplies: Reply[] = [ok], context: Record<string, unknown> = {}, entry = `/settings/questions/formula/${questionId}/repair`) {
  const backend = stubBackend({ permissions }); rememberSession();
  const session = backend.fetcher.getMockImplementation(); const writes: string[] = []; const reads: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === `/api/v1/formula-repairs/questions/${questionId}`) {
      reads.push(`${path}${new URL(input.url).search}`);
      return Response.json({ questionId, label: "Assay", definition: raw, definitionHash: "a".repeat(64), canRepairQuestion: true, canRepairTests: false,
        formsUsingQuestion: 207, responsesAffected: 2, tests: [], blockers: [], ...context });
    }
    if (path.endsWith("/history")) return Response.json([]);
    if (path.endsWith("/preview")) {
      const candidate = await input.json();
      return Response.json({ previewToken: "b".repeat(64), before: raw, after: candidate.definition, captures: 2, selectedTests: 0, missingInputs: [], blockers: [], tests: [] });
    }
    if (path.endsWith("/apply")) {
      writes.push(await input.clone().text());
      return (applyReplies.shift() ?? ok)();
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/questions/formula/:id/repair", element: <RouteAccess><FormulaRepairPage /></RouteAccess> }],
    { initialEntries: [entry] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}

const problem = (status: number, code: string, description: string) => Response.json({ errors: [{ code, description }] }, { status });
async function previewAndReason(reason = "Correct the confirmed scaling error") {
  await screen.findByRole("heading", { name: "Repair Assay" });
  fireEvent.change(await screen.findByRole("textbox", { name: /Corrected expression/ }), { target: { value: ":a/:b*100" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  await screen.findByRole("region", { name: "Repair preview" });
  fireEvent.change(await screen.findByRole("textbox", { name: /Reason for repair/ }), { target: { value: reason } });
}

it("requires a current preview, invalidates it after edits and applies with a reason and HTTP-safe request ID", async () => {
  const { writes } = open();
  await screen.findByRole("heading", { name: "Repair Assay" });
  expect(screen.getByRole("button", { name: "Apply repair" })).toHaveProperty("disabled", true);
  expect(screen.queryByRole("textbox", { name: /Reason for repair/ })).toBeNull();
  await previewAndReason();
  expect(writes).toHaveLength(0);
  // The reason is entered after reviewing and does not invalidate the preview.
  expect(screen.getByRole("region", { name: "Repair preview" })).toBeTruthy();
  fireEvent.change(await screen.findByRole("textbox", { name: /Corrected expression/ }), { target: { value: ":a/:b*10" } });
  expect(screen.queryByRole("region", { name: "Repair preview" })).toBeNull();
  expect(screen.getByRole("button", { name: "Apply repair" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  await screen.findByRole("region", { name: "Repair preview" });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Formula repair saved");
  await waitFor(() => expect(writes).toHaveLength(1));
  const body = JSON.parse(writes[0] ?? "{}");
  expect(body).toMatchObject({ reason: "Correct the confirmed scaling error", previewToken: "b".repeat(64), candidate: { updateQuestion: true, targets: [] } });
  expect(body.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(body.actorId).toBeUndefined();
});

it("refuses to apply without a reason", async () => {
  const { writes } = open();
  await previewAndReason("short");
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Explain the repair in at least 10 characters.");
  expect(writes).toHaveLength(0);
});

it("retries a lost response with the same request ID, but a stale preview needs a new review", async () => {
  const { writes, reads } = open(undefined, [() => new Response(null, { status: 502 }), ok]);
  await previewAndReason();
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Repair not confirmed");
  fireEvent.click(screen.getByRole("button", { name: "Retry apply" }));
  await screen.findByText("Formula repair saved");
  expect(JSON.parse(writes[0] ?? "{}").requestId).toBe(JSON.parse(writes[1] ?? "{}").requestId);
  cleanup(); forgetSession(); vi.unstubAllGlobals();
  const stale = open(undefined, [() => problem(409, "FormulaRepair.StalePreview", "The question changed. Review a fresh preview.")]);
  await previewAndReason();
  const before = stale.reads.length;
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("The question changed. Review a fresh preview.");
  expect(screen.queryByRole("region", { name: "Repair preview" })).toBeNull();
  expect(screen.getByRole("button", { name: "Apply repair" })).toHaveProperty("disabled", true);
  await waitFor(() => expect(stale.reads.length).toBeGreaterThan(before));
  expect(reads.length).toBeGreaterThan(0);
});

it("shows a denied repair without retrying it", async () => {
  const { writes } = open(undefined, [() => new Response(null, { status: 403 })]);
  await previewAndReason();
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Not allowed");
  expect(writes).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Apply repair" })).toHaveProperty("disabled", true);
});

it("does not mount the repair query when only ordinary edit permission is held", async () => {
  const { reads, writes } = open(["CanViewQuestions", "CanEditQuestions"]);
  await screen.findByText("You don't have access to this page");
  expect(reads).toEqual([]); expect(writes).toEqual([]);
});

it("applies the approved revision to every field of the formula on the opened test", async () => {
  const atr = "019dfe00-ae40-70be-8348-91cd10000001";
  const fields = ["01a1c6a0-416f-7ff8-ac04-5b140d5b0001", "01a1c6a0-416f-7ff8-ac04-5b140d5b0002"];
  const approved = JSON.stringify({ type: 0, expression: ":a/:b*100", decimalPlaces: 2 });
  const test = (formFieldId: string, label: string) => ({ atrId: atr, responseId: null, formFieldId, label, eligible: true, blocker: null, currentDefinition: raw });
  const { writes, reads } = open(["CanViewQuestions", "CanRepairTestFormula"], [ok],
    { canRepairQuestion: false, canRepairTests: true, approvedDefinition: approved, approvedRevision: 3,
      tests: [test(fields[0] ?? "", "AR-1 · Assay"), test(fields[1] ?? "", "AR-1 · Assay (second)")] },
    `/settings/questions/formula/${questionId}/repair?atr=${atr}&field=${fields[0] ?? ""}`);
  await screen.findByRole("heading", { name: "Repair Assay" });
  expect(reads[0]).toContain(`atrId=${atr}`);
  // The approved formula is shown, not typed in again.
  expect(screen.getAllByText("Approved revision 3").length).toBe(2); // The formula heading and the settings column.
  expect(screen.getByRole("table", { name: "Formula settings" })).toBeTruthy();
  expect(screen.getByText("Current formula on this test")).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: /Corrected expression/ })).toBeNull();
  expect(screen.getByText(/one repair fixes them all/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  await screen.findByRole("region", { name: "Repair preview" });
  // The approved formula replaces the readings too; they are entered again.
  expect(screen.getByText(/take the approved formula in full/)).toBeTruthy();
  fireEvent.change(await screen.findByRole("textbox", { name: /Reason for repair/ }), { target: { value: "Apply the approved assay formula" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  const body = JSON.parse(writes[0] ?? "{}");
  expect(body.candidate.definition).toBe(approved);
  expect(body.candidate.targets).toEqual(fields.map(formFieldId => ({ atrId: atr, formFieldId })));
});
