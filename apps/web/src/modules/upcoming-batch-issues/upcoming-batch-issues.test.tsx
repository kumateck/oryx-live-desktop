// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { manifest } from "./manifest";
import { UpcomingBatchIssuesPage } from "./components/upcoming-page";

vi.setConfig({ testTimeout: 30_000 });
afterEach(() => { cleanup(); forgetSession(); });

const page = { pageIndex: 1, pageCount: 1, totalRecordCount: 1, data: [{
  bmrId: "bmr-1", productionScheduleProductId: "psp-1", productCode: "PDT-9", productName: "Lufart DS Tablet", scheduleCode: "PS-11",
  startedAt: "2026-11-17T08:00:00Z", batchNumber: null, batchQuantity: 500_000, batchUnit: "tabs",
  materials: [
    { materialId: "m1", materialCode: "RML001", materialName: "Lumefantrine", kind: 0, lotNumber: "LF-E-26137", warehouse: "Tablet raw store", location: "Bay A · R1 · S2", quantity: 129_400_000, unit: "mg" },
    { materialId: "m2", materialCode: "PMB001", materialName: "Blister foil", kind: 1, lotNumber: "BF-1", warehouse: "Tablet packing store", location: "", quantity: 2_000, unit: "pcs" },
  ] }] };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  const auth = backend.fetcher.getMockImplementation();
  const paths: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    paths.push(path);
    if (path === "/api/v1/upcoming-batch-issues") return Response.json(page);
    if (path === "/api/v1/upcoming-batch-issues/psp-1/alternative-batches") return Response.json([]);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/warehouse/upcoming-batch-issues", element: <UpcomingBatchIssuesPage /> }], { initialEntries: ["/warehouse/upcoming-batch-issues"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { paths };
}

it("is open only to holders of the page's key", () => {
  expect(manifest.access).toEqual({ kind: "all", permissions: ["CanViewUpcomingBatchIssues"] });
});

it("lists each started batch with the lots reserved for it, one material kind at a time, before any batch number or requisition", async () => {
  const user = userEvent.setup();
  open(["CanViewUpcomingBatchIssues"]);
  const batch = await screen.findByRole("region", { name: "Lufart DS Tablet" });
  expect(within(batch).getByText("Batch number not assigned yet")).toBeTruthy();
  const raw = within(batch).getByRole("table", { name: "Raw materials" });
  expect(within(raw).getByText("LF-E-26137")).toBeTruthy();
  expect(within(raw).getByText("129.4 kg")).toBeTruthy();
  expect(within(raw).getByText("Bay A · R1 · S2")).toBeTruthy();
  expect(within(batch).queryByRole("table", { name: "Packaging materials" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Packaging" }));
  const packaging = await within(await screen.findByRole("region", { name: "Lufart DS Tablet" })).findByRole("table", { name: "Packaging materials" });
  expect(within(packaging).getByText("No shelf recorded")).toBeTruthy();
  expect(screen.queryByRole("table", { name: "Raw materials" })).toBeNull();
});

it("folds and unfolds each batch", async () => {
  const user = userEvent.setup();
  open(["CanViewUpcomingBatchIssues"]);
  const batch = await screen.findByRole("region", { name: "Lufart DS Tablet" });
  const toggle = within(batch).getByRole("button", { expanded: true, name: /Lufart DS Tablet/ });
  await user.click(toggle);
  expect(within(batch).queryByRole("table", { name: "Raw materials" })).toBeNull();
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  await user.click(screen.getByRole("button", { name: "Expand all" }));
  expect(within(batch).getByRole("table", { name: "Raw materials" })).toBeTruthy();
});

it("looks for swaps against the started batch itself, and only an issuing store may ask for them", async () => {
  const user = userEvent.setup();
  const { paths } = open(["CanViewUpcomingBatchIssues"]);
  await user.click(await screen.findByRole("button", { name: "Earlier batches to swap" }));
  expect(await screen.findByText("No other store holds a batch that expires before the ones set aside.")).toBeTruthy();
  expect(paths).toContain("/api/v1/upcoming-batch-issues/psp-1/alternative-batches");
  expect(paths.some((path) => path.includes("/requisition/"))).toBe(false);
});
