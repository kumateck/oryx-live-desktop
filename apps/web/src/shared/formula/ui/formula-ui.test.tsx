// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TheAduseiFormula from "./types/expression";
import { TheAduseiEvaluation } from "./types/evaluate";

afterEach(cleanup);
const simple = JSON.stringify({ type: 0, expression: ":weight * :factor" });
const uniformity = JSON.stringify({ type: 2, mode: "tablet", expression: "", sampleCount: 20 });
const universal = JSON.stringify({ type: 3, expression: ":sample1Avg / :standardAvg * 100", headers: ["Standard", "Sample 1"], numberOfReadings: 3, numberOfSamples: 1 });

describe("formula builders and evaluators", () => {
  for (const [name, option] of [["simple", simple], ["uniformity", uniformity], ["universal", universal]] as const) {
    it(`renders the ${name} evaluator for an analyst`, async () => {
      const { container } = render(<TheAduseiEvaluation option={option} value="" onChange={() => {}} showMetaPanels={false} />);
      await screen.findByText(name === "simple" ? "Manual Variables" : name === "universal" ? "Calculations" : "Uniformity of Weight", { exact: false });
      expect(container.textContent?.length).toBeGreaterThan(0);
    });
  }
  it("renders the builder for each formula type", () => {
    for (const type of [0, 2, 3] as const) {
      const { container, unmount } = render(<TheAduseiFormula type={type} value="" onChange={() => {}} />);
      expect(container.innerHTML.length).toBeGreaterThan(0);
      unmount();
    }
    expect(screen.queryByText("Unsupported")).toBeNull();
  });
});

 it("explains an unreadable definition instead of showing an empty formula", () => {
  render(<TheAduseiEvaluation option="broken" />);
  expect(screen.getByRole("alert").textContent).toContain("template owner");
});
