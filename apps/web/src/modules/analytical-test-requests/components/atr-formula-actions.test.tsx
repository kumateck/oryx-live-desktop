// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { fieldSchema } from "@/shared/form-response/form-model";
import { QuestionType } from "@/shared/questions/question-types";
import { sha256Hex } from "@/shared/formula/core/sha256";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { SessionReady } from "@/test/session-ready";
import { AtrFormulaActions } from "./atr-formula-actions";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const hash = "c".repeat(64);
const assay = fieldSchema.parse({ id: "field-1", formulaConfigurationHash: hash, question: { id: "question-1", type: QuestionType.Formula, label: "Assay", options: [] } });

function open(disabled: boolean) {
  const backend = stubBackend({ permissions: ["CanExecuteFormulaResponse", "CanViewQuestions", "CanRepairTestFormula"] });
  const auth = backend.fetcher.getMockImplementation();
  const evaluations: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/formula-repairs/tests/atr-1/fields/field-1/evaluate") {
      evaluations.push(await input.text());
      return Response.json("01a1a8ad-8c32-7cd6-9862-456570ca67e1");
    }
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const onReload = vi.fn();
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter>
    <AtrFormulaActions atrId="atr-1" fields={[assay]} responses={[{ formField: { id: "field-1" }, formulaRepairPending: true }]} disabled={disabled} onReload={onReload} />
  </MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  return { evaluations, onReload };
}

it("shows pending recalculation and recalculates against the configuration the worksheet opened with", async () => {
  const { evaluations, onReload } = open(false);
  expect(await screen.findByText("Repaired formula needs recalculation")).toBeTruthy();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Assay" }));
  expect(await screen.findByRole("menuitem", { name: "Repair formula" })).toBeTruthy();
  await user.click(screen.getByRole("menuitem", { name: "Recalculate saved readings" }));
  await waitFor(() => expect(onReload).toHaveBeenCalledOnce());
  expect(evaluations.map(body => JSON.parse(body))).toEqual([{ expectedConfigurationHash: hash }]);
});

it("keeps repair available while unsaved readings block only recalculation", async () => {
  const { evaluations } = open(true);
  const menu = await screen.findByRole("button", { name: "Assay" });
  expect(menu).toHaveProperty("disabled", false);
  await userEvent.setup().click(menu);
  expect((await screen.findByRole("menuitem", { name: "Repair formula" })).getAttribute("aria-disabled")).not.toBe("true");
  expect(screen.getByRole("menuitem", { name: /Recalculate saved readings/ }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.queryByText("Save your changes before repairing or recalculating a formula.")).toBeNull();
  expect(evaluations).toEqual([]);
});

it("repairs a test with no saved response in a dialog while keeping the worksheet mounted", async () => {
  const questionId = "019af455-024a-76f0-823c-8ec2e065cbe2";
  const atrId = "01a1a8ad-8c32-7cd6-9862-456570ca67e1";
  const fieldId = "01a1a8ad-8c32-7cd6-9862-456570ca67e2";
  const definition = JSON.stringify({ type: 0, expression: ":a/:b", decimalPlaces: 2 });
  const backend = stubBackend({ permissions: ["CanViewQuestions", "CanRepairTestFormula"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: { candidate: { definition: string; targets: { atrId: string; formFieldId: string }[] } }[] = [];
  const drafts: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === `/api/v1/formula-repairs/questions/${questionId}`) return Response.json({
      questionId, label: "Assay", definition, definitionHash: hash, canRepairQuestion: false, canRepairTests: true,
      formsUsingQuestion: 1, responsesAffected: 0, blockers: [],
      tests: [{ atrId, formFieldId: fieldId, responseId: null, label: "AR-1", eligible: true, blocker: null }],
    });
    if (path.endsWith("/history")) return Response.json([]);
    if (path.endsWith("/preview")) {
      const candidate = await input.json() as { definition: string };
      return Response.json({ previewToken: hash, before: definition, after: candidate.definition,
        captures: 1, selectedTests: 1, missingInputs: [], blockers: [], tests: [] });
    }
    if (path.endsWith("/apply")) {
      writes.push(await input.json());
      return Response.json({ repairId: atrId, responseIds: [atrId], formIds: [], alreadyApplied: false });
    }
    if (path.endsWith("/responses/draft")) drafts.push(path);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const onRepaired = vi.fn();
  const field = fieldSchema.parse({ id: fieldId, formulaConfigurationHash: hash,
    question: { id: questionId, type: QuestionType.Formula, label: "Assay", options: [{ name: definition }] } });
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter>
    <input aria-label="Unsaved reading" defaultValue="1.2300" />
    <AtrFormulaActions atrId={atrId} fields={[field]} responses={[]} disabled onReload={() => {}} onRepaired={onRepaired} />
  </MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  const reading = await screen.findByRole("textbox", { name: "Unsaved reading" });
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Assay" }));
  await user.click(await screen.findByRole("menuitem", { name: "Repair formula" }));
  fireEvent.change(await screen.findByRole("textbox", { name: /Corrected expression/ }), { target: { value: ":a/:b*100" } });
  fireEvent.click(screen.getByRole("button", { name: "Preview repair" }));
  fireEvent.change(await screen.findByRole("textbox", { name: /Reason for repair/ }), { target: { value: "Correct the confirmed scaling error" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply repair" }));
  await screen.findByText("Formula repair saved");
  fireEvent.click(screen.getByRole("button", { name: "Return to test" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByRole("textbox", { name: "Unsaved reading" })).toBe(reading);
  expect(reading).toHaveProperty("value", "1.2300");
  expect(writes).toHaveLength(1);
  expect(writes[0]?.candidate.targets).toEqual([{ atrId, formFieldId: fieldId }]);
  expect(onRepaired).toHaveBeenCalledWith(fieldId, sha256Hex(writes[0]?.candidate.definition ?? ""));
  expect(drafts).toEqual([]);
});
