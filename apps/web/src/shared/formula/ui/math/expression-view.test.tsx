// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ExpressionView } from "./expression-view";

afterEach(cleanup);

it("shows old table input tokens by their dot-free names", () => {
  const { container } = render(<ExpressionView expression="(:sample1Avg/:standardAvg)*(:standardInput.wt/:sampleInput1.wt)*:spl.wt" />);
  const text = container.textContent ?? "";
  expect(text).toContain("standardWeight");
  expect(text).toContain("sample1Weight");
  expect(text).toContain("sampleWeight");
  expect(text).not.toMatch(/standardInput|sampleInput|spl/);
  expect(screen.getByLabelText("Formula: (:sample1Avg/:standardAvg)*(:standardWeight/:sample1Weight)*:sampleWeight")).toBeTruthy();
});

it("leaves other variable names alone", () => {
  const { container } = render(<ExpressionView expression=":wt/:ml*:purity" />);
  expect(container.textContent).toMatch(/wt.*ml.*purity/);
});
