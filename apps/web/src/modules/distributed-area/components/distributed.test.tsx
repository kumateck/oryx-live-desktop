// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import DistributedAreaPage from "../../../pages/(workspace)/warehouse/distributed-area/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction } from "../../../test/menu";
import { shelvingProblems, shelvingRequest } from "../lib/shelving";
import { distributedRowsSchema } from "../schemas/distributed-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const delivery = { id: "dm1", createdAt: "2026-09-29T08:00:00Z", quantity: 5_000_000, uoM: { id: "u-mg", symbol: "mg" }, warehouse: { name: "Raw store" },
  materialBatch: { id: "b1", batchNumber: "B-01", material: { code: "RM-001", name: "Maize starch" } } };
const [stock] = distributedRowsSchema.parse([delivery, { quantity: 1 }]);
if (!stock) throw new Error("fixture");
const line = (shelf: string, quantity: number) => ({ quantity, rack: { value: "r1", label: "Rack 1" }, shelf: { value: shelf, label: shelf }, note: "" });

it("needs the whole delivery placed, no more and no less, with no shelf used twice", () => {
  expect(shelvingProblems(stock, [line("s1", 2), line("s2", 3)])).toEqual([]);
  expect(shelvingProblems(stock, [line("s1", 2)])).toEqual([{ index: null, message: "3 kg of the 5 kg received is not placed yet. Put all of it on shelves." }]);
  expect(shelvingProblems(stock, [line("s1", 6)])).toEqual([{ index: null, message: "The quantities add up to 6 kg, more than the 5 kg received" }]);
  expect(shelvingProblems(stock, [line("s1", 2), line("s1", 3)])[0]).toMatchObject({ index: 1 });
  expect(shelvingRequest(stock, [line("s1", 2), line("s2", 3)])).toEqual({ distributeMaterialId: "dm1", materialBatchId: "b1", shelfMaterialBatches: [
    { warehouseLocationShelfId: "s1", quantity: 2_000_000, uomId: "u-mg", note: "" }, { warehouseLocationShelfId: "s2", quantity: 3_000_000, uomId: "u-mg", note: "" }] });
});

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; search: string; body: unknown }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, body: input.method === "GET" ? null : await input.clone().json() });
    if (url.pathname === "/api/v1/procurement/distribute-material") return Response.json({ data: [delivery], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/warehouse/rack/by-department/summary") return Response.json([{ id: "r1", name: "Rack 1", warehouseLocation: { name: "Raw store" }, shelves: [{ id: "s1", code: "A1" }, { id: "s2", code: "A2" }] }]);
    if (url.pathname === "/api/v1/material/distribute-material/move-batch") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/distributed-area", element: <DistributedAreaPage /> }], { initialEntries: ["/warehouse/distributed-area"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}

it("lists the department's deliveries still to be shelved, and shelves one in full", async () => {
  const user = userEvent.setup();
  const { calls } = open(["CanViewDistributedRawMaterials", "CanAssignRawMaterialsStockToShelves"]);
  const row = (await screen.findByText("Maize starch")).closest("tr") as HTMLElement;
  expect(within(row).getByText("5 kg")).toBeTruthy();
  const asked = new URLSearchParams(calls.find((call) => call.path === "/api/v1/procurement/distribute-material")?.search);
  // Only what is still waiting, and only this user's department.
  expect([asked.get("status"), asked.get("departmentId")]).toEqual(["0", "558da105-a506-44a9-8ff5-8d005a54f294"]);
  await chooseAction(/Actions for Maize starch, batch B-01/, "Put on shelves");
  const dialog = await screen.findByRole("dialog");
  // The whole quantity is offered on the first line.
  const quantity = await within(dialog).findByRole("spinbutton", { name: /Quantity \(kg\)/ });
  expect((quantity as HTMLInputElement).value).toBe("5");
  await user.clear(quantity);
  await user.type(quantity, "2");
  await user.click(within(dialog).getByRole("combobox", { name: /Rack/ }));
  await user.click(await screen.findByRole("option", { name: "Raw store · Rack 1" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "A1" }));
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Put on shelves" }).hasAttribute("disabled")).toBe(false));
  await user.click(within(dialog).getByRole("button", { name: "Put on shelves" }));
  expect(await within(dialog).findByText("3 kg of the 5 kg received is not placed yet. Put all of it on shelves.")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);
  await user.clear(quantity);
  await user.type(quantity, "5");
  await user.click(within(dialog).getByRole("button", { name: "Put on shelves" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.find((call) => call.method === "POST")?.body).toEqual({ distributeMaterialId: "dm1", materialBatchId: "b1", shelfMaterialBatches: [{ warehouseLocationShelfId: "s1", quantity: 5_000_000, uomId: "u-mg", note: "" }] });
}, 20_000);

it("shows deliveries to someone who may not shelve them, with no action", async () => {
  open(["CanViewDistributedRawMaterials", "CanReassignRawMaterialStock"]);
  await screen.findByText("Maize starch");
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
});
