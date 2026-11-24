// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvailableVariables, type AvailableVariable } from "./available-variables";

// These pure editor tests insert tokens locally; save authorization is tested by the owning form.
vi.mock("@/shared/auth/use-access", () => ({ useAccess: () => ({ allows: () => true, allowsNow: () => true }) }));

const input = (key: string, label: string, isTemplate = true): AvailableVariable =>
  ({ key, label, isTemplate, value: isTemplate ? null : 0.000123456 });
const sample = [
  input("sampleWeight", "Sample Weight (g) (auto)"),
  input("sampleConc", "Sample Concentration (mg/mL) (auto)"),
  input("sampleAbsorbance", "Sample Absorbance (auto)"),
  input("samplePeakAreas", "Sample Peak Areas (auto)"),
  input("sampleTitreValue", "Sample Titre Value (auto)"),
];
const formatValue = (value: AvailableVariable["value"]) => String(value);
afterEach(cleanup);

describe("available variable display", () => {
  it("shows one dropdown for five supplied aliases and keeps statistics separate", async () => {
    const user = userEvent.setup();
    const insert = vi.fn();
    render(<AvailableVariables items={[input("sampleAvg", "Sample Average (auto)"), ...sample]}
      onInsert={insert} formatValue={formatValue} />);
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.getByText("Sample variable (5 aliases)")).toBeTruthy();
    expect(screen.queryByText(":samplePeakAreas")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Sample variable/ }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(5);
    await user.click(screen.getByRole("menuitem", { name: /:samplePeakAreas/ }));
    expect(insert).toHaveBeenCalledExactlyOnceWith("samplePeakAreas");
    expect(screen.queryByRole("menuitem")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Sample variable/ }));
    await user.click(screen.getByRole("menuitem", { name: /:samplePeakAreas/ }));
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it("only offers keys supplied by the existing implementation", async () => {
    const user = userEvent.setup();
    render(<AvailableVariables items={sample.slice(0, 2)} onInsert={vi.fn()} formatValue={formatValue} />);
    await user.click(screen.getByRole("button", { name: /Sample variable/ }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    expect(screen.queryByText(":sampleAbsorbance")).toBeNull();
  });

  it("keeps standard and numbered samples separate and preserves their exact values", async () => {
    const user = userEvent.setup();
    const insert = vi.fn();
    render(<AvailableVariables items={[
      input("standardWeight", "Standard Weight", false), input("standardConc", "Standard Concentration", false),
      input("sample1Weight", "Sample 1 Weight"), input("sample1Conc", "Sample 1 Concentration"),
      input("sample2Weight", "Sample 2 Weight"), input("sample2Conc", "Sample 2 Concentration"),
    ]} onInsert={insert} formatValue={formatValue} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: /Standard variable/ }));
    expect(screen.getAllByText(/0\.000123456/)).toHaveLength(2);
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: /Sample 2 variable/ }));
    await user.click(screen.getByRole("menuitem", { name: /:sample2Conc/ }));
    expect(insert).toHaveBeenCalledExactlyOnceWith("sample2Conc");
  });

  it("preserves direct insertion for ungrouped and legacy keys", async () => {
    const user = userEvent.setup();
    const insert = vi.fn();
    render(<AvailableVariables items={[input("sampleInput.wt", "Sample Weight"), input("sampleAvg", "Sample Average")]}
      onInsert={insert} formatValue={formatValue} />);
    await user.click(screen.getByRole("button", { name: /:sampleInput.wt/ }));
    expect(insert).toHaveBeenCalledExactlyOnceWith("sampleInput.wt");
    expect(screen.queryByRole("menuitem")).toBeNull();
  });

  it("does not open a dropdown or insert keys when the editor is disabled", async () => {
    const user = userEvent.setup();
    const insert = vi.fn();
    render(<AvailableVariables items={sample} disabled onInsert={insert} formatValue={formatValue} />);
    await user.click(screen.getByRole("button", { name: /Sample variable/ }));
    expect(screen.queryByRole("menuitem")).toBeNull();
    expect(insert).not.toHaveBeenCalled();
  });
});
