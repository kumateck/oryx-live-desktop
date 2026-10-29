// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { PackingUnitsCell, PacksPerShipperCell } from "./packing-units-cell";

afterEach(cleanup);

const row = (label: string, quantity: number) => ({ uom: { label }, quantity });
const units = [row("Shipper (s)", 80), row("Outer Carton (Out ctn)", 20), row("Inner Carton (Inner ctn)", 10)];
const items = () => screen.getAllByRole("listitem").map((item) => item.textContent);

it("lists each unit with what it holds and marks the pack", () => {
  render(<PackingUnitsCell units={units} baseLabel="Tablet (tablet)" packPerShipper={80} />);
  expect(items()).toEqual(["Shipper · 80 Outer Cartons", "Outer CartonPack · 20 Inner Cartons", "Inner Carton · 10 Tablets"]);
});

it("marks the base unit as the pack when packs per shipper counts base units", () => {
  render(<PackingUnitsCell units={units} baseLabel="Tablet (tablet)" packPerShipper={16000} />);
  expect(items().at(-1)).toBe("TabletPack");
});

it("warns when no unit matches packs per shipper", () => {
  render(<PackingUnitsCell units={units} baseLabel="Tablet" packPerShipper={75} />);
  expect(screen.queryByText("Pack")).toBeNull();
  expect(screen.getByText("No unit matches 75 packs per shipper.")).toBeTruthy();
});

it("names the pack in packs per shipper and says what one holds", () => {
  render(<PacksPerShipperCell units={units} baseLabel="Tablet (tablet)" packPerShipper={1600} />);
  expect(screen.getByText("1,600 Inner Cartons")).toBeTruthy();
  expect(screen.getByText("10 Tablets each")).toBeTruthy();
});
