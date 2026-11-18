// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { formAssigneeSchema } from "./assignments";
import { ReassignPanel } from "./reassign-fields-panel";

const target1 = "019af455-024a-76f0-823c-8ec2e065cbe2";
const target2 = "019af455-024a-76f0-823c-8ec2e065cbe3";
vi.mock("@/shared/forms/searchable-select", () => ({ SearchableSelect: ({ label, value, onChange, disabled }: {
  label: string; value: { value: string; label: string } | null; onChange: (value: { value: string; label: string } | null) => void; disabled?: boolean;
}) => <select aria-label={label} disabled={disabled} value={value?.value ?? ""} onChange={event => onChange(event.target.value ? { value: event.target.value, label: event.target.value === target1 ? "Kojo Analyst" : "Esi Analyst" } : null)}>
  <option value="">Keep current analyst</option><option value={target1}>Kojo Analyst</option><option value={target2}>Esi Analyst</option>
</select> }));
afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });
function open(allowed = true, status = 200) {
  const backend = stubBackend({ permissions: allowed ? ["CanReassignProductTest"] : [] }); rememberSession();
  const session = backend.fetcher.getMockImplementation(); const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    writes.push(await input.text());
    return status === 200 ? Response.json({ fieldsChanged: 2, alreadyApplied: false }) : Response.json({ errors: [{ code: "TestReassignment.Changed", description: "Assignments changed. Reload." }] }, { status });
  });
  const assignees = formAssigneeSchema.parse({ id: "test-assignment", fieldAssignees: ["Weight", "Appearance", "Identification"].map((label, index) => ({
    id: `assignment-${index}`, assignee: { id: "current-analyst", firstName: "Ama", lastName: "Analyst" },
    formField: { id: `field-${index}`, formSection: { id: "section", name: "Assay" }, question: { label } },
  })) });
  render(<SessionProvider><ApiProvider><ReassignPanel assignees={assignees} require="CanReassignProductTest" audit={{ module: "QC", subModule: "Test" }} onDone={() => {}} /></ApiProvider></SessionProvider>);
  return writes;
}

it("shows current assignments and transfers only the chosen questions to different people in one request", async () => {
  const writes = open();
  await waitFor(() => expect(screen.getByRole("combobox", { name: "New analyst for Weight" })).toHaveProperty("disabled", false));
  expect(screen.getAllByText("Currently assigned to Ama Analyst")).toHaveLength(3);
  fireEvent.change(screen.getByRole("combobox", { name: "New analyst for Weight" }), { target: { value: target1 } });
  fireEvent.change(screen.getByRole("combobox", { name: "New analyst for Appearance" }), { target: { value: target2 } });
  expect(screen.getByRole("region", { name: "Reassignment review" }).textContent).toContain("Ama Analyst → Kojo Analyst");
  expect(screen.getByText("1 questions keep their current analysts.")).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Reason for reassignment" }), { target: { value: "Split the remaining work between analysts" } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm selected reassignments" }));
  await screen.findByRole("status");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}").fields).toEqual([
    { assignmentId: "assignment-0", expectedAssigneeId: "current-analyst", newAssigneeId: target1 },
    { assignmentId: "assignment-1", expectedAssigneeId: "current-analyst", newAssigneeId: target2 },
  ]);
});

it("hides the write action and disables assignment changes without the test reassignment key", async () => {
  const writes = open(false);
  await screen.findByText("Identification");
  expect(screen.queryByRole("button", { name: "Confirm selected reassignments" })).toBeNull();
  expect(screen.getByRole("combobox", { name: "New analyst for Weight" })).toHaveProperty("disabled", true);
  expect(writes).toHaveLength(0);
});
