// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { QuestionType } from "@/shared/questions/question-types";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { BatchTestPage } from "./batch-pages";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

// A raw material batch under test: its worksheet has one formula field assigned to the analyst, and its sample (the material test).
const form = { id: "form-1", name: "Sucrose worksheet", sections: [{ id: "section-1", name: "Assay", order: 1,
  fields: [{ id: "field-1", question: { id: "question-1", label: "Assay", type: QuestionType.Formula, options: [] } }] }] };
const assignees = { id: "assignee-1", fieldAssignees: [{ id: "a1", formField: { id: "field-1", formSection: { id: "section-1", name: "Assay" }, question: { label: "Assay" } },
  assignee: { id: testUserId, firstName: "Ama", lastName: "Owusu" } }] };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  const session = backend.fetcher.getMockImplementation();
  const reads: string[] = [];
  rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
    const url = new URL(input.url);
    reads.push(`${url.pathname}${url.search}`);
    if (url.pathname === "/api/v1/material-ard/material/batch/batch-1") return Response.json({ form: { id: "form-1", name: "Sucrose worksheet" } });
    if (url.pathname === "/api/v1/material-ard/material/batch-details/batch-1") return Response.json({ worksheetFormId: "form-1", worksheetResponseId: null });
    if (url.pathname === "/api/v1/form/responses/material-batch/batch-1") return Response.json([]);
    if (url.pathname === "/api/v1/form/assignees/material-batch/batch-1") return Response.json(assignees);
    if (url.pathname === "/api/v1/form/form-1") return Response.json(form);
    if (url.pathname === "/api/v1/material-samplings/grn-1/batch-1") return Response.json({ id: "sampling-1", arNumber: "QCD/RM/26/0001" });
    if (url.pathname === "/api/v1/formula-repairs/questions/question-1") return new Response(null, { status: 403 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/goods-receipt-note/:id/batches/:batchId/test", element: <BatchTestPage /> }],
    { initialEntries: ["/qc/goods-receipt-note/grn-1/batches/batch-1/test?type=0"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { reads };
}

it("offers formula repair on a raw material test and opens it for the material test's sample", async () => {
  const { reads } = open(["CanViewRawMaterialGoodsReceiptNotes", "CanStartRawMaterialTest", "CanViewQuestions", "CanRepairTestFormula"]);
  await openMenu(/Assay/);
  (await screen.findByRole("menuitem", { name: "Repair formula" })).click();
  await waitFor(() => expect(reads).toContain("/api/v1/formula-repairs/questions/question-1?atrId=sampling-1"));
});

it("offers no formula repair without a repair permission", async () => {
  const { reads } = open(["CanViewRawMaterialGoodsReceiptNotes", "CanStartRawMaterialTest"]);
  await waitFor(() => expect(reads).toContain("/api/v1/material-samplings/grn-1/batch-1"));
  expect(await screen.findAllByText("Assay")).not.toHaveLength(0);
  expect(screen.queryByRole("button", { name: /Assay/ })).toBeNull();
  expect(reads.some((read) => read.startsWith("/api/v1/formula-repairs/"))).toBe(false);
});
