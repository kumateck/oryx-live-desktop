// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { fieldSchema } from "@/shared/form-response/form-model";
import { QuestionType } from "@/shared/questions/question-types";
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

it("blocks repair and recalculation while the worksheet has unsaved readings", async () => {
  const { evaluations } = open(true);
  expect(await screen.findByText("Save your changes before repairing or recalculating a formula.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Assay" })).toHaveProperty("disabled", true);
  expect(evaluations).toEqual([]);
});
