// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { stockRequisitionSchema } from "@/modules/stock-issue/schemas/stock-issue-schema";
import { BatchBreakdown } from "@/modules/stock-issue/components/batch-breakdown";
import { extraRowsSchema } from "@/modules/extra-material-issue/extra-material";
import { transferBatchesSchema } from "@/modules/stock-transfers/transfers";
import { swapSchema } from "@/modules/swap-requests/swaps";
import { expiryRowsSchema } from "@/modules/expired-materials/expiry";
import { reservedRowsSchema } from "@/modules/approved-materials/schemas/approved-material-schema";
import { rackShelfLocation, stockShelfLocation } from "./stock-location";

afterEach(cleanup);
const shelf = (name: string) => ({ name, code: name, warehouseLocationRack: { name: "Rack A" } });
const allocations = [
  { quantityToTake: 2, batch: { id: "same-batch", batchNumber: "B-12" }, warehouseLocationShelf: shelf("Shelf 1") },
  { quantityToTake: 3, batch: { id: "same-batch", batchNumber: "B-12" }, warehouseLocationShelf: shelf("Shelf 2") },
];

describe("warehouse batch picking locations", () => {
  it("keeps each shelf paired with its own quantity across requisitions, extras and transfers", () => {
    const request = stockRequisitionSchema.parse({ id: "request", items: [{ quantity: 5, uoM: { symbol: "kg" }, batches: allocations }] });
    expect(request?.items[0]?.batches.map((batch) => [batch.quantity, batch.location])).toEqual([[2, "Rack A (Shelf 1)"], [3, "Rack A (Shelf 2)"]]);
    expect(extraRowsSchema.parse([{ id: "extra", batches: allocations }])[0]?.batches.map((batch) => batch.location)).toEqual(["Rack A (Shelf 1)", "Rack A (Shelf 2)"]);
    expect(transferBatchesSchema.parse(allocations).map((batch) => batch.location)).toEqual(["Rack A (Shelf 1)", "Rack A (Shelf 2)"]);
    if (!request?.items[0]) throw new Error("Missing test allocation");
    render(<BatchBreakdown line={request.items[0]} />);
    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0] ?? document.body).getByText("Rack A (Shelf 1)")).toBeTruthy();
    expect(rows[0]?.textContent).toContain("2 kg");
    expect(rows[0]?.textContent?.indexOf("B-12")).toBeLessThan(rows[0]?.textContent?.indexOf("Rack A (Shelf 1)") ?? 0);
    expect(within(rows[1] ?? document.body).getByText("Rack A (Shelf 2)")).toBeTruthy();
    expect(rows[1]?.textContent).toContain("3 kg");
  });

  it("uses the exact shelf on each side of a swap", () => {
    const value = swapSchema.parse({ id: "swap", firstSwapShelfMaterialBatches: [{ quantity: 2, warehouseLocationShelf: shelf("Shelf 1") }],
      secondSwapShelfMaterialBatches: [{ quantity: 2, warehouseLocationShelf: shelf("Shelf 2") }] });
    expect(value?.giving[0]?.location).toBe("Rack A (Shelf 1)");
    expect(value?.taking[0]?.location).toBe("Rack A (Shelf 2)");
  });

  it("shows all occupied expiry-report locations and excludes empty shelves", () => {
    const value = expiryRowsSchema.parse([{ id: "batch", shelves: [
      { quantity: 2, warehouseLocationShelf: shelf("Shelf 1") },
      { quantity: 3, warehouseLocationShelf: shelf("Shelf 2") },
      { quantity: 0, warehouseLocationShelf: shelf("Empty shelf") },
    ] }]);
    expect(value[0]?.shelves).toEqual(["Rack A (Shelf 1)", "Rack A (Shelf 2)"]);
  });

  it("handles missing metadata and older servers without inventing a shelf", () => {
    expect(stockShelfLocation({ code: "S2", warehouseLocationRack: { name: "R1" } })).toBe("R1 (S2)");
    expect(rackShelfLocation("R1", null)).toBe("R1 (Shelf not recorded)");
    expect(stockShelfLocation(null)).toBeNull();
    expect(transferBatchesSchema.parse([{ quantityToTake: 2 }])[0]?.location).toBeNull();
    render(<BatchBreakdown line={{ unit: "kg", batches: [{ key: "legacy", number: "B-1", quantity: 2, expires: null, returned: false }] }} />);
    expect(screen.getByText("Location not recorded")).toBeTruthy();
  });

  it("retains the rack and shelf attached to a production reservation", () => {
    const row = reservedRowsSchema.parse([{ materialBatchNumber: "B-12", rackName: "Rack A", shelfName: "Shelf 2", reservedQuantity: 3 }])[0];
    expect(rackShelfLocation(row?.rackName, row?.shelfName)).toBe("Rack A (Shelf 2)");
    expect(row?.reserved).toBe(3);
  });
});
