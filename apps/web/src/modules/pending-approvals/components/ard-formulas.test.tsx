// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ardAnswersSchema, ardFormSchema } from "../schemas/ard-result-schema";
import { answersByField } from "../lib/ard-results";
import PendingApprovalPage from "@/pages/(workspace)/qa/pending-approvals/[type]/[id]/page";
import { ArdResultsTable } from "./details/ard-results-table";
import { formulaAnswers, formulaForm } from "./__fixtures__/ard-formulas";

const sections = (form: object = formulaForm) => (ardFormSchema.parse(form).sections ?? []).map((section) => ({ ...section, fields: section.fields ?? [] }));
afterEach(() => { cleanup(); forgetSession(); vi.restoreAllMocks(); });

it("reviews the COA on the page and prints detailed worksheet or COA previews without changing results", async () => {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval"] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") writes.push(path);
    if (path === "/api/v1/approval/my-pending/Response/doc-1") return Response.json({ id: "doc-1", modelType: "Response", approvalLogs: [] });
    if (path === "/api/v1/form/responses/doc-1") return Response.json({ form: { id: "form-1" }, materialBatch: { id: "mb-1" }, formResponses: [], checkedBy: { id: "checker-1", firstName: "Recorded", lastName: "Checker" } });
    if (path === "/api/v1/form/form-1") return Response.json(formulaForm);
    if (path === "/api/v1/form/responses/material-batch/mb-1") return Response.json([...formulaAnswers.map((answer) => ({ ...answer, createdBy: { id: "analyst-1", firstName: "Recorded", lastName: "Analyst" } })),
      { ...formulaAnswers[0], responseId: "other-document", value: "Unrelated result", createdBy: { firstName: "Other", lastName: "Analyst" } }]);
    if (path === "/api/v1/material-ard/material/batch-details/mb-1") return Response.json({ arNumber: "AR-1", materialBatch: { batchNumber: "B-1", material: { name: "Synthetic material" } } });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: ["/qa/pending-approvals/Response/doc-1"] });
  const { container } = render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  expect(await screen.findByText("0.50%")).toBeTruthy();
  expect(await screen.findAllByText("10.04%")).toBeTruthy();
  expect(screen.getAllByText("7.17%")).toBeTruthy();
  expect(container.textContent).not.toContain('"tableData"');
  expect(container.textContent).not.toContain("Unrelated result");
  expect(screen.queryByText("Test & Observations")).toBeNull();
  expect(screen.getByRole("article", { name: "Certificate of analysis" }).textContent).toContain("10.04%");
  expect(container.querySelector("input, textarea")).toBeNull();
  const print = vi.spyOn(window, "print").mockImplementation(() => {});
  await userEvent.click(screen.getByRole("button", { name: "Print Worksheet" }));
  const worksheet = await screen.findByRole("dialog");
  expect(within(worksheet).getByText("Test & Observations")).toBeTruthy();
  expect(worksheet.textContent).toContain("10.04%");
  expect(worksheet.textContent).not.toContain("Unrelated result");
  expect(within(worksheet).getByText("Recorded Analyst")).toBeTruthy();
  expect(within(worksheet).getByText("Recorded Checker")).toBeTruthy();
  expect(worksheet.textContent).not.toContain("Other Analyst");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).toContain("Test & Observations");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).toContain("Recorded Analyst");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).toContain("Recorded Checker");
  expect(print).not.toHaveBeenCalled();
  await userEvent.click(within(worksheet).getByRole("button", { name: "Print" }));
  expect(print).toHaveBeenCalledTimes(1);
  await userEvent.click(within(worksheet).getAllByRole("button", { name: "Close" })[0] as HTMLElement);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.body.querySelector(".print-portal")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Print COA" }));
  const preview = await screen.findByRole("dialog");
  expect(await within(preview).findByText("10.04%")).toBeTruthy();
  expect(preview.textContent).toContain("Does not comply");
  expect(preview.textContent).not.toContain('"manualVars"');
  expect(within(preview).queryByText("Test & Observations")).toBeNull();
  expect(within(preview).getByText("Recorded Analyst")).toBeTruthy();
  expect(within(preview).getByText("Recorded Checker")).toBeTruthy();
  expect(preview.textContent).not.toContain("Other Analyst");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).not.toContain("Test & Observations");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).toContain("Recorded Analyst");
  expect(document.body.querySelector(":scope > .print-portal")?.textContent).toContain("Recorded Checker");
  await userEvent.click(within(preview).getByRole("button", { name: "Print" }));
  expect(print).toHaveBeenCalledTimes(2);
  expect(writes).toEqual([]);
}, 20_000);

it("preserves authoritative results and never recalculates a governed answer", async () => {
  const recorded = answersByField(ardAnswersSchema.parse([{ ...formulaAnswers[1], formulaGoverned: true, formulaResultFinalized: true,
    formulaExecutionId: "execution-1", formulaDisplayResultsJson: JSON.stringify([{ key: "Assay", value: "99.87", unit: "%" }]) }]));
  render(<ArdResultsTable sections={sections()} recorded={recorded} />);
  expect(await screen.findAllByText("99.87 %")).toBeTruthy();
  expect(screen.queryByText("10.04%")).toBeNull();
  expect(screen.queryByText("Stored authoritative draft result — not finalized")).toBeNull();
});

it("shows absent authoritative results instead of using legacy input values", async () => {
  const recorded = answersByField(ardAnswersSchema.parse([{ ...formulaAnswers[1], formulaGoverned: true }]));
  render(<ArdResultsTable sections={sections()} recorded={recorded} />);
  expect(await screen.findAllByText("Authoritative formula result unavailable.")).toBeTruthy();
  expect(screen.queryByText("10.04%")).toBeNull();
});

it("explains a missing formula definition without exposing response JSON", async () => {
  const fields = [{ id: "f-assay", question: { type: 10, label: "Assay", options: [] } }];
  const { container } = render(<ArdResultsTable sections={sections({ sections: [{ name: "Assay", fields }] })} recorded={answersByField(formulaAnswers)} />);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(container.textContent).not.toContain('"tableData"');
});

it("keeps missing readings unresolved and uses response question settings if supplied", async () => {
  const record = { ...formulaAnswers[0], value: "{}", formField: formulaForm.sections[0]?.fields[0] };
  const { container } = render(<ArdResultsTable sections={sections()} recorded={answersByField(ardAnswersSchema.parse([record]))} />);
  expect(await screen.findByText("Formula")).toBeTruthy();
  expect(screen.queryByText("0%", { exact: true })).toBeNull();
  expect(container.textContent).not.toContain("NaN");
});
