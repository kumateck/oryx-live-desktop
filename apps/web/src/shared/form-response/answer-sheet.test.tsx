// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm, type FieldValues } from "react-hook-form";
import { afterEach, expect, it } from "vitest";
import { QuestionType } from "@/shared/questions/question-types";
import { AnswerSheet } from "./answer-sheet";
import { formSchema } from "./form-model";

const drying = { type: 3, expression: "(:W2 - :W3) / (:W2 - :W1) * 100", manualVarLabels: { W1: "Empty crucible", W2: "Before drying", W3: "After drying" }, numberOfSamples: 1, numberOfReadings: 0, finalResultDecimalPlaces: 2 };
const assay = { type: 3, expression: ":sample1Avg / :standardAvg * :factor", headers: ["Blank", "Sample 1"], numberOfReadings: 1, numberOfSamples: 1, standardInTable: true,
  firstColumnPurpose: "blank", standardInputs: [{ key: "wt", label: "Weight (g)", value: "" }], sampleInputs: [[{ key: "wt", label: "Weight (g)", value: "" }]], manualVarLabels: { factor: "Factor" } };
const template = formSchema.parse({ id: "f1", sections: [
  { id: "s1", name: "Loss on Drying", description: '<p><span style="color:black">Maximum <strong>0.5%</strong></span></p>', fields: [
    { id: "note", description: "<p>Record <em>observations</em></p><script>unsafe()</script>", question: { type: QuestionType.ShortAnswer, label: "Observation" } },
    { id: "drying", question: { type: QuestionType.Formula, label: "Loss on Drying", options: [{ name: JSON.stringify(JSON.stringify(drying)) }] } },
  ] },
  { id: "s2", name: "Assay", fields: [{ id: "assay", question: { type: QuestionType.Formula, label: "Assay – Titration", options: [{ name: JSON.stringify({ settings: assay, type: 3 }) }] } }] },
] });

function Worksheet({ disabled = false }: { disabled?: boolean }) {
  const form = useForm<FieldValues>({ defaultValues: { note: "Retained observation", drying: "", assay: "" } });
  return <><AnswerSheet form={form} sections={template.sections} drafts={null} disabled={disabled} loadEquipment={async () => ({ options: [], hasNext: false, hasPrevious: false })} />
    <button onClick={() => form.setValue("note", JSON.stringify(form.getValues()))}>Capture answers</button></>;
}

afterEach(cleanup);

it("renders saved rich descriptions with formatting and no HTML tags or unsafe content", async () => {
  const { container } = render(<Worksheet />);
  expect(container.querySelector("strong")?.textContent).toBe("0.5%");
  await screen.findByRole("textbox", { name: "Observation" });
  expect(container.querySelector("em")?.textContent).toBe("observations");
  expect(container.textContent).not.toContain("<p>");
  expect(container.textContent).not.toContain("unsafe()");
  expect(container.querySelector("[style], script")).toBeNull();
  await screen.findByRole("textbox", { name: "Before drying (W2)" });
});

it("loads calculation inputs through FormWizard and retains readings in the answer contract", async () => {
  render(<Worksheet />);
  fireEvent.change(await screen.findByRole("textbox", { name: "Before drying (W2)" }), { target: { value: "12" } });
  fireEvent.change(screen.getByRole("textbox", { name: "After drying (W3)" }), { target: { value: "11.99" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Empty crucible (W1)" }), { target: { value: "10" } });
  expect(await screen.findByRole("textbox", { name: "Weight (g) (wt)" })).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Sample 1 Weight (g) (wt)" })).toBeTruthy();
  fireEvent.change(screen.getByRole("textbox", { name: "Factor (factor)" }), { target: { value: "100" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Blank reading 1" }), { target: { value: "2" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Sample 1 reading 1" }), { target: { value: "2" } });
  await waitFor(() => expect(screen.getAllByText("0.50").length).toBeGreaterThan(0));
  fireEvent.blur(screen.getByRole("textbox", { name: "Before drying (W2)" }));
  fireEvent.blur(screen.getByRole("textbox", { name: "Sample 1 reading 1" }));
  fireEvent.click(screen.getByRole("button", { name: "Capture answers" }));
  const captured = screen.getByRole("textbox", { name: "Observation" }) as HTMLInputElement;
  const answers = JSON.parse(captured.value) as { note: string; drying: string; assay: string };
  expect(answers.note).toBe("Retained observation");
  expect(JSON.parse(answers.drying)).toMatchObject({ manualVars: { W2: { raw: "12" }, W3: { raw: "11.99" } } });
  expect(JSON.parse(answers.assay)).toMatchObject({ tableData: [["2", "2"]] });
});

it("keeps calculation controls in a disabled fieldset for read-only answers", async () => {
  const { container } = render(<Worksheet disabled />);
  await screen.findByRole("textbox", { name: "Before drying (W2)" });
  expect(container.querySelectorAll("fieldset[disabled]")).toHaveLength(2);
});
