// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { shelfBatchRowsSchema } from "../schemas/approved-material-schema";
import { StockByBatchTable } from "./stock-tables";

afterEach(() => { cleanup(); forgetSession(); });
it("shows the warehouse's converted unit while retaining the physical stock value", async () => {
  const row = { id: "shelf-1", quantity: 100, uoM: { symbol: "l" }, materialBatch: { id: "lot-1", batchNumber: "RMG006-LOT" },
    warehouseQuantity: 126, warehouseUoM: { symbol: "kg" } };
  const parsed = shelfBatchRowsSchema.parse([row]);
  expect(parsed[0]?.quantity).toBe(100); expect(parsed[0]?.unit).toBe("l");
  const backend = stubBackend(); rememberSession(); const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request && new URL(input.url).pathname.includes("/batches/v2/")) return Response.json({ data: [row], pageIndex: 1, totalRecordCount: 1, pageCount: 1 });
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <StockByBatchTable materialId="m-1" departmentId="d-1" /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  expect(await screen.findByText("126 kg")).toBeTruthy();
});
