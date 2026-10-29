// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import type { PackingStyle } from "../../lib/packing-styles";
import { PackingStyleDialog } from "./packing-style-dialog";

afterEach(cleanup);
// jsdom has no scrollIntoView, which the unit picker calls when it opens.
Element.prototype.scrollIntoView ??= vi.fn();

const unit = (value: string, label: string) => ({ value, label });
const tablet = unit("u-tab", "Tablet (tablet)");
const all = [unit("u-s", "Shipper (s)"), unit("u-out", "Outer Carton (Out ctn)"), unit("u-in", "Inner Carton (Inner ctn)"), tablet];
const style: PackingStyle = {
  key: "k1", id: "k1", name: "80 X 20 X 10", description: "", isDefault: true, basePackingUom: tablet, basePackingQuantity: 329,
  expectedYield: 1_000_000, packPerShipper: 80,
  units: [{ uom: all[0]!, quantity: 80 }, { uom: all[1]!, quantity: 20 }, { uom: all[2]!, quantity: 10 }],
};

function open(editing: PackingStyle | null = style) {
  render(<PackingStyleDialog editing={editing} styles={editing ? [editing] : []} packingUnits={[tablet]} allUnits={all}
    fullBatchSize={null} baseUnit="mg" onSubmit={vi.fn()} onClose={vi.fn()} />);
}

const hint = (row: number) => screen.getByTestId(`unit-hint-${row}`).textContent;

it("explains what each packing unit holds, down to base units", () => {
  open();
  expect(screen.getByText(/List units from the outermost in\..*the last row counts base packing units \(Tablet\)\./)).toBeTruthy();
  expect(hint(1)).toBe("1 Shipper = 80 Outer Cartons");
  expect(hint(2)).toBe("1 Outer Carton = 20 Inner Cartons");
  expect(hint(3)).toBe("1 Inner Carton = 10 Tablets");
  expect(screen.getByTestId("packing-units-summary").textContent).toBe("In total, 1 Shipper = 80 × 20 × 10 = 16,000 Tablets");
  expect(screen.getByLabelText("Quantity of unit 1").getAttribute("aria-describedby")).toBe(screen.getByTestId("unit-hint-1").id);
});

it("updates the hints as quantities and rows change", () => {
  open();
  fireEvent.change(screen.getByLabelText("Quantity of unit 2"), { target: { value: "" } });
  expect(hint(2)).toBe("1 Outer Carton = how many Inner Cartons?");
  expect(screen.queryByTestId("packing-units-summary")).toBeNull();
  fireEvent.change(screen.getByLabelText("Quantity of unit 2"), { target: { value: "12" } });
  expect(screen.getByTestId("packing-units-summary").textContent).toBe("In total, 1 Shipper = 80 × 12 × 10 = 9,600 Tablets");
  fireEvent.click(screen.getByRole("button", { name: "Remove unit 3" }));
  expect(hint(2)).toBe("1 Outer Carton = 12 Tablets");
  fireEvent.click(screen.getByRole("button", { name: "Add unit" }));
  expect(hint(2)).toBe("1 Outer Carton = 12 of the next unit");
  expect(hint(3)).toBe("1 unit = how many Tablets?");
});

it("shows the same guidance when adding a style", () => {
  open(null);
  expect(screen.getByText(/the last row counts base packing units\./)).toBeTruthy();
  expect(hint(1)).toBe("1 unit = how many base packing units?");
});

it("picks the pack automatically from the entered packs per shipper", async () => {
  open();
  const perShipperField = await screen.findByLabelText(/^Packs per shipper/);
  const result = () => screen.getByTestId("shipper-pack-result").textContent;
  // 80 packs per shipper is one shipper row down: the pack is the Outer Carton.
  expect(screen.getByRole("combobox", { name: "Pack is" }).textContent).toBe("Automatic: Outer Carton");
  expect(result()).toContain("1 shipper (Shipper) = 80 packs (Outer Cartons)");
  expect(result()).toContain("1 pack (Outer Carton) = 200 Tablets = 65,800 mg of product");
  // Two rows down: 80 × 20 inner cartons.
  fireEvent.change(perShipperField, { target: { value: "1600" } });
  expect(screen.getByRole("combobox", { name: "Pack is" }).textContent).toBe("Automatic: Inner Carton");
  expect(result()).toContain("1 shipper (Shipper) = 80 × 20 = 1,600 packs (Inner Cartons)");
  expect(result()).toContain("1 pack (Inner Carton) = 10 Tablets");
  // No level matches: say so and list what the units give.
  fireEvent.change(perShipperField, { target: { value: "75" } });
  expect(screen.getByText(/No unit gives 75 packs per shipper\./)).toBeTruthy();
  expect(screen.getByTestId("pack-options").textContent).toBe("These units give: 80 Outer Cartons, 1,600 Inner Cartons, 16,000 Tablets.");
  expect(screen.queryByTestId("shipper-pack-result")).toBeNull();
});

it("lets a chosen pack override the automatic one and apply its packs per shipper", async () => {
  const user = userEvent.setup();
  open();
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Pack is" }), { key: "Enter" });
  await user.click(await screen.findByRole("option", { name: "Tablet (base unit) · 16,000 per shipper" }));
  expect(screen.getByTestId("shipper-pack-result").textContent).toContain("80 × 20 × 10 = 16,000 packs (Tablets)");
  expect(screen.getByText(/Packs per shipper is 80, but Tablets as the pack give 16,000\./)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Use 16,000" }));
  expect(screen.queryByText(/as the pack give/)).toBeNull();
  expect((await screen.findByLabelText(/^Packs per shipper/) as HTMLInputElement).value).toBe("16000");
});

it("splits a typed quantity of packs into shippers and loose", () => {
  open();
  const field = screen.getByLabelText("Try a quantity of packs");
  fireEvent.change(field, { target: { value: "250" } });
  expect(screen.getByTestId("trial-split").textContent).toBe("250 packs = 3 shippers + 10 loose (3 × 80 + 10; 50,000 Tablets in all)");
  fireEvent.change(field, { target: { value: "abc" } });
  expect(screen.getByText("Enter a number of Outer Cartons of 0 or more.")).toBeTruthy();
});
