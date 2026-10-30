// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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

it("works out packs per shipper from the unit the person ticks as the pack", async () => {
  const onSubmit = vi.fn();
  render(<PackingStyleDialog editing={style} styles={[style]} packingUnits={[tablet]} allUnits={all} fullBatchSize={null} baseUnit="mg" onSubmit={onSubmit} onClose={vi.fn()} />);
  const result = () => screen.getByTestId("shipper-pack-result").textContent;
  // A saved 80 per shipper is one row down: the Outer Carton is ticked. Neither figure can be typed.
  expect(screen.queryByLabelText(/^Packs per shipper/)).toBeNull();
  expect(screen.queryByRole("combobox", { name: "Pack is" })).toBeNull();
  expect((screen.getByRole("radio", { name: /Outer Carton/ }) as HTMLButtonElement).getAttribute("aria-checked")).toBe("true");
  expect(screen.getByTestId("pack-is").textContent).toBe("Outer Carton");
  expect(screen.getByTestId("packs-per-shipper").textContent).toBe("80");
  expect(result()).toContain("1 pack (Outer Carton) = 200 Tablets = 65,800 mg of product");
  // Ticking the inner carton multiplies down to it.
  fireEvent.click(screen.getByRole("radio", { name: /Inner Carton/ }));
  expect(screen.getByTestId("pack-is").textContent).toBe("Inner Carton");
  expect(screen.getByTestId("packs-per-shipper").textContent).toBe("80 × 20 = 1,600");
  expect(result()).toContain("1 pack (Inner Carton) = 10 Tablets");
  // Changing a quantity changes the figure with it.
  fireEvent.change(screen.getByLabelText("Quantity of unit 2"), { target: { value: "12" } });
  expect(screen.getByTestId("packs-per-shipper").textContent).toBe("80 × 12 = 960");
  fireEvent.click(screen.getByRole("button", { name: "Update style" }));
  await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
  expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ packPerShipper: 960 });
});

it("asks for the pack to be ticked when a saved figure matches no unit", async () => {
  const onSubmit = vi.fn();
  const odd = { ...style, packPerShipper: 75 };
  render(<PackingStyleDialog editing={odd} styles={[odd]} packingUnits={[tablet]} allUnits={all} fullBatchSize={null} baseUnit="mg" onSubmit={onSubmit} onClose={vi.fn()} />);
  expect(screen.getByText(/saved with 75 packs per shipper, which no unit gives/)).toBeTruthy();
  expect(screen.getByTestId("pack-is").textContent).toBe("Not ticked");
  fireEvent.click(screen.getByRole("radio", { name: /Tablet/ }));
  expect(screen.getByTestId("packs-per-shipper").textContent).toBe("80 × 20 × 10 = 16,000");
});

it("asks for the tick before a new style is added", async () => {
  const onSubmit = vi.fn();
  render(<PackingStyleDialog editing={null} styles={[]} packingUnits={[tablet]} allUnits={all} fullBatchSize={null} baseUnit="mg" onSubmit={onSubmit} onClose={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Add style" }));
  expect(await screen.findByText("Tick the unit that is the pack.")).toBeTruthy();
  expect(onSubmit).not.toHaveBeenCalled();
});

it("shows each unit's hint above its row", () => {
  open();
  const hintRow = screen.getByTestId("unit-hint-2");
  const quantity = screen.getByLabelText("Quantity of unit 2");
  expect(hintRow.compareDocumentPosition(quantity) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it("offers no trial quantity input", () => {
  open();
  expect(screen.queryByLabelText("Try a quantity of packs")).toBeNull();
});
