// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ListPage from "../../../pages/(workspace)/warehouse/quarantine-area/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";

afterEach(() => { cleanup(); forgetSession(); });

function open(empty = false) {
  const backend = stubBackend({ permissions: ["CanViewQuarantineRawMaterials"] });
  const auth = backend.fetcher.getMockImplementation();
  const reads: URL[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    reads.push(url);
    if (url.pathname === "/api/v1/warehouse/grns") return Response.json({
      data: empty ? [] : [{ id: "grn-1", grnNumber: "WHD/RM/26/001", createdAt: "2026-10-01T10:00:00Z",
        status: 0, carrierName: "Carrier name", vehicleNumber: "GT-1", remarks: null, declarationNumber: null,
        materialBatches: [{ id: "batch-1", supplierName: "Supplier name" }, { id: "batch-2", supplierName: "Supplier name" }] }],
      totalRecordCount: empty ? 0 : 1, pageCount: 1, pageIndex: 1,
    });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/warehouse/quarantine-area", element: <ListPage /> },
    { path: "/warehouse/quarantine-area/:id/details", element: <p>GRN details</p> },
  ], { initialEntries: ["/warehouse/quarantine-area?type=0"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { reads, router };
}

it("renders the lightweight list contract with correct batch count, supplier and existing detail navigation", async () => {
  const { reads, router } = open();
  const label = await screen.findByText("WHD/RM/26/001");
  const row = label.closest("tr");
  if (!row) throw new Error("Missing GRN row");
  expect(within(row).getByText("2")).toBeTruthy();
  expect(within(row).getAllByText("Supplier name")).toHaveLength(1);
  expect(within(row).getByText("Carrier name")).toBeTruthy();
  expect(within(row).getByText("GT-1")).toBeTruthy();
  const list = reads.find(url => url.pathname === "/api/v1/warehouse/grns");
  expect(list?.searchParams.get("kind")).toBe("0");
  expect(list?.searchParams.get("pageSize")).toBe("50");
  await userEvent.dblClick(row);
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/quarantine-area/grn-1/details"));
});

it("handles an empty summary page without reading batch details", async () => {
  const { reads } = open(true);
  expect(await screen.findByText("No goods received notes")).toBeTruthy();
  expect(reads.some(url => url.pathname.startsWith("/api/v1/warehouse/grn/"))).toBe(false);
});
