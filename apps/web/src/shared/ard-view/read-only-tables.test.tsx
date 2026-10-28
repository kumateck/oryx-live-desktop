// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { QuestionType } from "@/shared/questions/question-types";
import type { FormSectionDto } from "./dto";
import ArdTemplateBody from "./templates/body";
import { tableOptions } from "./__fixtures__/table-preview";

afterEach(cleanup);
const section: FormSectionDto = { id: "microbial", name: "TYMC", fields: [{
  id: "table-field", question: { type: QuestionType.Table, label: "TEST FOR SPECIFIED MICROORGANISMS", options: tableOptions },
}] };

it("renders saved table answers through the GRN/ATR test preview composition", () => {
  const { container } = render(<ArdTemplateBody sections={[section]} showRemarks={false} responses={[{
    formField: { id: "table-field" }, value: JSON.stringify({ value: JSON.stringify({ "3-1": "complies", "3-2": "fails" }) }),
  }]} />);
  expect(screen.getByText("MacConkey Broth")).toBeTruthy();
  expect(screen.getByText("MacConkey Agar")).toBeTruthy();
  const layout = screen.getByText("MacConkey Broth").closest("table");
  expect(layout?.rows.length).toBe(4);
  expect(layout?.querySelector('[colspan="3"]')).toBeTruthy();
  expect(layout?.rows[3]?.cells[1]?.textContent).toBe("Complies");
  expect(layout?.rows[3]?.cells[2]?.textContent).toBe("Does not comply");
  expect(container.textContent).not.toContain("cellConfigs");
  expect(container.textContent).not.toContain("Col 3");
  expect(container.querySelector("input,select")).toBeNull();
});

it("prints the same table layout with blank answer cells in blank mode", () => {
  render(<ArdTemplateBody sections={[section]} responses={[]} noResponse showRemarks={false} />);
  const layout = screen.getByText("MacConkey Broth").closest("table");
  expect(layout?.rows.length).toBe(4);
  expect(layout?.rows[3]?.cells[1]?.textContent).toBe("");
  expect(layout?.rows[3]?.cells[2]?.textContent).toBe("");
});
