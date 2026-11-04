// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, useWatch } from "react-hook-form";
import { afterEach, expect, it } from "vitest";
import WorksheetCellControl from "./cell-control";
import { WorksheetCellContext } from "./cell-context";
import type { WorksheetValues } from "./worksheet-model";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(cleanup);

function Example() {
  const form = useForm<WorksheetValues>({ defaultValues: { cells: [
    { fieldKey: "reagent", rowIndex: null, columnKey: "expiryDate", value: "2027-06-08" },
  ] } });
  const value = useWatch({ control: form.control, name: "cells.0.value" });
  return <WorksheetCellContext.Provider value={{ instanceId: "worksheet", require: "CanEnterChemicalWorksheetResult", equipment: [], reagents: [],
    definitions: [{ fieldKey: "reagent", rowIndex: null, columnKey: "expiryDate", label: "Lot expiry", type: 3, options: [], required: true }],
  }}>
    <WorksheetCellControl id="lot-expiry" name="cells.0.value" control={form.control} disabled={false} required invalid={false} />
    <output>{value}</output>
  </WorksheetCellContext.Provider>;
}

it("selects a worksheet lot expiry by month and preserves its date-only API value", async () => {
  const user = userEvent.setup();
  render(<Example />);
  await user.click(screen.getByRole("button", { name: "Lot expiry" }));
  expect(screen.queryByRole("grid")).toBeNull();
  await user.click(screen.getByRole("combobox", { name: "Year" }));
  await user.click(screen.getByRole("option", { name: "2028" }));
  await user.click(screen.getByRole("combobox", { name: "Month" }));
  await user.click(screen.getByRole("option", { name: "February" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  expect(screen.getByRole("status").textContent).toBe("2028-02-29");
  await user.click(screen.getByRole("button", { name: "Lot expiry" }));
  await user.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getByRole("status").textContent).toBe("");
});
