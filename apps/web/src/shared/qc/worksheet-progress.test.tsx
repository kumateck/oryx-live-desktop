// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { formSchema } from "@/shared/form-response/form-model";
import { QuestionType } from "@/shared/questions/question-types";
import { formAssigneeSchema } from "./assignments";
import { WorksheetProgress } from "./worksheet-progress";

afterEach(cleanup);

const form = formSchema.parse({ id: "worksheet", sections: [
  { id: "description", name: "Description", fields: [{ id: "appearance", question: { label: "Appearance" } }] },
  { id: "results", name: "Results", fields: [
    { id: "identity", question: { label: "Identification" } },
    { id: "assay", question: { label: "Assay", type: QuestionType.Formula } },
  ] },
] });
const assignees = formAssigneeSchema.parse({ id: "assignment", fieldAssignees: [
  { formField: { id: "appearance" }, assignee: { id: "analyst", firstName: "New", lastName: "Analyst" } },
] });

it("shows saved completion, the current analyst, and a filled print action", async () => {
  render(<WorksheetProgress form={form} stored={new Map([
    ["appearance", { value: "Complies", responseId: "draft" }],
    ["identity", { value: " ", responseId: "draft" }],
  ])} responses={[
    { formField: { id: "appearance" }, value: "Complies" },
    { formField: { id: "assay" }, value: "{}", formulaRepairPending: true },
  ]} assignments={assignees} submitted={false} preview={() => <p>Filled worksheet preview</p>} />);

  const appearance = within(screen.getByRole("row", { name: /Appearance/ }));
  expect(appearance.getByText("Completed")).toBeTruthy();
  expect(appearance.getByText("New Analyst")).toBeTruthy();
  expect(within(screen.getByRole("row", { name: /Identification/ })).getByText("Outstanding")).toBeTruthy();
  expect(within(screen.getByRole("row", { name: /Assay/ })).getByText("Outstanding")).toBeTruthy();
  expect(screen.getByText("Worksheet in progress · shows saved answers")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "Print filled worksheet" }));
  expect(screen.getByText("Filled worksheet preview")).toBeTruthy();
});

it("disables filled printing when the worksheet has no saved results", () => {
  render(<WorksheetProgress form={form} stored={new Map()} responses={[]} assignments={null} submitted={false} preview={() => null} />);
  expect(screen.getByRole("button", { name: "Print filled worksheet" })).toHaveProperty("disabled", true);
});
