// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { reservedRowsSchema } from "../schemas/approved-material-schema";
import { groupReservedProducts } from "../lib/reserved-groups";
import { ReservedProductGroups } from "./reserved-product-groups";

afterEach(cleanup);
it("shows product and batch totals and expands the original allocations", async () => {
  const rows = reservedRowsSchema.parse([9.6, 110.4].map((reservedQuantity, index) => ({ productCode: "NT-015", productName: "Lufart Tablet 20/120mg",
    productBatchNumber: "T015K051", schedule: "PS007", materialBatchNumber: `LF-E-2613${index}`, reservedQuantity, uomSymbol: "kg", balanceQuantity: 14.6 })));
  render(<ReservedProductGroups rows={groupReservedProducts(rows)} loading={false} error={null} onRetry={() => {}} />);
  expect(screen.getByText("Lufart Tablet 20/120mg")).toBeTruthy();
  expect(screen.getAllByText("120 kg")).toHaveLength(2);
  expect(screen.getByText("Batch T015K051")).toBeTruthy();
  await userEvent.click(screen.getByText("Batch T015K051"));
  const details = screen.getByRole("table", { name: "Allocations for batch T015K051" });
  expect(within(details).getByText("9.6 kg")).toBeTruthy();
  expect(within(details).getByText("110.4 kg")).toBeTruthy();
  expect(within(details).getByText("LF-E-26130")).toBeTruthy();
  expect(within(details).getByText("LF-E-26131")).toBeTruthy();
});
