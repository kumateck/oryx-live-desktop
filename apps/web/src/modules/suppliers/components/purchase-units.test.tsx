// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { forgetSession } from "@/test/backend";
import { openSupplier } from "./purchase-unit-fixtures";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(async () => { cleanup(); await new Promise<void>((resolve) => setTimeout(resolve, 0)); forgetSession(); });

async function purchaseUnit() {
  await screen.findByRole("combobox", { name: /Purchase unit/ });
  // Session initialization remounts the API store; always read the currently mounted control.
  await waitFor(() => expect(screen.getByRole("combobox", { name: /Purchase unit/ }).hasAttribute("disabled")).toBe(false));
  return screen.getByRole("combobox", { name: /Purchase unit/ });
}

function submit() {
  const form = screen.getByRole("button", { name: "Save supplier" }).closest("form");
  if (!form) throw new Error("Supplier form missing");
  fireEvent.submit(form);
}

it("loads the linked mass family in order and preserves the saved kg symbol", async () => {
  const { writes } = openSupplier();
  const user = userEvent.setup();
  const control = await purchaseUnit();
  expect(control.textContent).toBe("kg");
  await user.click(control);
  expect((await screen.findAllByRole("option")).map((item) => item.textContent)).toEqual(["mg", "g", "kg"]);
  await user.keyboard("{Escape}");
  submit();
  await screen.findByText("Supplier saved");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}").associatedManufacturers[0].purchaseUnit).toBe("kg");
});

it("clears the old unit when material changes and offers only ml then L", async () => {
  openSupplier();
  const user = userEvent.setup();
  await purchaseUnit();
  await user.click(screen.getByRole("combobox", { name: /^Material\s*\*?$/ }));
  await user.click(await screen.findByRole("option", { name: /Liquid/ }));
  const control = await purchaseUnit();
  expect(control.textContent).toBe("ml");
  await user.click(control);
  expect((await screen.findAllByRole("option")).map((item) => item.textContent)).toEqual(["ml", "L"]);
});

it("blocks a legacy incompatible selection until a compatible replacement is chosen", async () => {
  const { writes } = openSupplier("L");
  const user = userEvent.setup();
  const control = await purchaseUnit();
  expect(control.textContent).toBe("L");
  submit();
  expect(await screen.findByText(/Choose a purchase unit compatible/)).toBeTruthy();
  expect(writes).toEqual([]);
  await user.click(control);
  await user.click(await screen.findByRole("option", { name: "kg" }));
  submit();
  await screen.findByText("Supplier saved");
  expect(writes).toHaveLength(1);
});

it("blocks saving if the linked unit changed after the options were loaded", async () => {
  const { state, writes } = openSupplier();
  await purchaseUnit();
  state.volume = true;
  submit();
  expect(await screen.findByText(/Choose a purchase unit compatible/)).toBeTruthy();
  expect(writes).toEqual([]);
});

it("shows a retry on lookup failure and never saves when verification fails", async () => {
  const { state, writes } = openSupplier();
  await purchaseUnit();
  state.failUnits = true;
  submit();
  expect(await screen.findByText(/could not be verified/)).toBeTruthy();
  const retry = await screen.findByRole("button", { name: "Retry purchase units" });
  expect(writes).toEqual([]);
  state.failUnits = false;
  await userEvent.setup().click(retry);
  await purchaseUnit();
});

it("does not bypass the supplier update permission on direct submission", async () => {
  const { writes } = openSupplier("kg", ["CanViewVendors"]);
  await purchaseUnit();
  submit();
  expect(await screen.findByText(/access has changed/)).toBeTruthy();
  expect(writes).toEqual([]);
});

it("requires a department linkage instead of offering the entire unit collection", async () => {
  const { state, writes } = openSupplier();
  state.emptyUnits = true;
  expect(await screen.findByText(/No compatible purchase units/)).toBeTruthy();
  expect(screen.getByRole("combobox", { name: /Purchase unit/ }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("combobox", { name: /Purchase unit/ }).textContent).toBe("kg");
  submit();
  expect(await screen.findByText(/Choose a purchase unit compatible/)).toBeTruthy();
  expect(writes).toEqual([]);
});

it("shows the saved purchase unit even when the first lookup fails", async () => {
  const { state, writes } = openSupplier();
  state.failUnits = true;
  await screen.findByRole("button", { name: "Retry purchase units" });
  const control = screen.getByRole("combobox", { name: /Purchase unit/ });
  expect(control.textContent).toBe("kg");
  expect(control.hasAttribute("disabled")).toBe(true);
  expect(writes).toEqual([]);
});

it("offers every linked family across departments once, even without a current-department linkage", async () => {
  const { state } = openSupplier();
  state.multiple = true;
  const control = await purchaseUnit();
  await userEvent.setup().click(control);
  expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["mg", "g", "kg", "ml", "L"]);
});

it("filters material rows without removing hidden associations from the save", async () => {
  const { writes } = openSupplier();
  await purchaseUnit();
  fireEvent.click(screen.getByRole("button", { name: "Packaging materials (0)" }));
  expect(screen.queryByRole("combobox", { name: /Purchase unit/ })).toBeNull();
  expect(screen.getByText(/Showing 0 of 1 material rows/)).toBeTruthy();
  submit();
  await screen.findByText("Supplier saved");
  expect(JSON.parse(writes[0] ?? "{}").associatedManufacturers).toMatchObject([{ materialId: "m1", manufacturerId: "f1", purchaseUnit: "kg" }]);
});

it("prepends a blank material, clears the filter, and reveals hidden invalid rows on save", async () => {
  const { writes } = openSupplier();
  await purchaseUnit();
  fireEvent.click(screen.getByRole("button", { name: "Raw materials (1)" }));
  fireEvent.click(screen.getByRole("button", { name: "Add material" }));
  expect(screen.getByRole("button", { name: "All materials (2)" }).getAttribute("aria-pressed")).toBe("true");
  const kinds = screen.getAllByRole("combobox", { name: /Material kind/ });
  expect(kinds.map((kind) => kind.textContent)).toEqual(["Select an option", "Raw material"]);
  fireEvent.click(screen.getByRole("button", { name: "Raw materials (1)" }));
  submit();
  await waitFor(() => expect(screen.getByRole("button", { name: "All materials (2)" }).getAttribute("aria-pressed")).toBe("true"));
  expect(screen.getAllByRole("combobox", { name: /Material kind/ })).toHaveLength(2);
  expect(writes).toEqual([]);
});

it("reveals a hidden row whose purchase unit fails fresh validation", async () => {
  const { state, writes } = openSupplier();
  await purchaseUnit();
  fireEvent.click(screen.getByRole("button", { name: "Packaging materials (0)" }));
  state.volume = true;
  submit();
  expect(await screen.findByText(/Choose a purchase unit compatible/)).toBeTruthy();
  expect(screen.getByRole("combobox", { name: /Purchase unit/ })).toBeTruthy();
  expect(screen.getByRole("button", { name: "All materials (1)" }).getAttribute("aria-pressed")).toBe("true");
  expect(writes).toEqual([]);
});
