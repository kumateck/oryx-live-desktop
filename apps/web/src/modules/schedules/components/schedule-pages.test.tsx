// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ScheduleDetailsPage from "../../../pages/(workspace)/production/schedules/[id]/details/page";
import AddScheduleProductsPage from "../../../pages/(workspace)/production/schedules/[id]/products/add/page";
import RemoveScheduleProductsPage from "../../../pages/(workspace)/production/schedules/[id]/products/remove/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { openMenu } from "../../../test/menu";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();
const product = { id: "p1", name: "Wormee", code: "NL-047", baseUoM: { symbol: "ml" } };
const batch = { quantity: 1_500_000, batchSize: 0, product, productPacking: { id: "s1", name: "150 X 20ml" } };
const schedule = (endOffset: number) => ({ id, code: "PS-0007", scheduledStartTime: iso(-2), scheduledEndTime: iso(endOffset), remarks: "<p>Night shift</p>", products: [
  { ...batch, id: "b1", batchNumber: "WM-001", hasStarted: true, productionActivityId: "act-1" },
  { ...batch, id: "b2" },
  { ...batch, id: "b3" },
] });
const material = (name: string, needed: number, onHand: number) => ({ material: { id: name, name, code: `C-${name}` }, materialDepartment: { uoM: { symbol: "g" } }, quantityNeeded: needed, quantityOnHand: onHand, status: 2 });

function open(address: string, options: { end?: number; rawFor?: Record<string, object[]>; packagingFor?: Record<string, object[]>; refuse?: string[]; extraPermissions?: string[] } = {}) {
  const backend = stubBackend({ permissions: ["CanViewProductSchedules", "CanEditProductSchedule", "CanAddProductsToProductSchedule", "CanRemoveProductsFromProductSchedule", ...(options.extraPermissions ?? [])] });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === `/api/v1/production-schedule/${id}`) return Response.json(schedule(options.end ?? 5));
    const stock = /^\/api\/v1\/production-schedule\/(package-)?material-stock\/(.+)$/.exec(path);
    if (stock) return Response.json((stock[1] ? options.packagingFor : options.rawFor)?.[stock[2] ?? ""] ?? []);
    if (path === "/api/v1/production-schedule/activity/product/b1") return Response.json({ id: "act-1", currentStep: { order: 3, status: 1, operation: { name: "Dispensing" } } });
    if (path.startsWith("/api/v1/production-schedule/activity/product/")) return new Response(null, { status: 404 });
    if (path.startsWith("/api/v1/production-schedule/activity/start/")) return Response.json("act-2", { status: 201 });
    const removed = /^\/api\/v1\/production-schedule\/product\/(.+)$/.exec(path);
    if (removed && input.method === "DELETE") return options.refuse?.includes(removed[1] ?? "") ? Response.json({ errors: [{ code: "ProductionSchedule.Validation", description: "Cannot remove a product that has already started production" }] }, { status: 422 }) : new Response(null, { status: 204 });
    if (path === "/api/v1/material/Sugar/stock/across-warehouses") return Response.json([{ warehouse: { id: "w1", name: "Main store", type: 0 }, stockQuantity: 4000, expiredQuantity: 1000 },
      { warehouse: { id: "w2", name: "Liquids floor", type: 3 }, stockQuantity: 200 }]);
    if (path === "/api/v1/material/Sugar/stock/pipeline") return Response.json([]);
    if (path === "/api/v1/customers") return Response.json({ data: [] });
    if (path === "/api/v1/configuration/by-model-type/Requisition") return Response.json({ prefix: "PR-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/Requisition/count") return Response.json(7);
    if (path === "/api/v1/requisition") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/schedules/:id/details", element: <ScheduleDetailsPage /> },
    { path: "/production/schedules/:id/products/add", element: <AddScheduleProductsPage /> },
    { path: "/production/schedules/:id/products/remove", element: <RemoveScheduleProductsPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("shows a schedule with its batches, and the running batch's current step", async () => {
  open(`/production/schedules/${id}/details`);
  const nav = await screen.findByRole("navigation", { name: "Batches" });
  expect(within(nav).getByText("Full (1,500 L) · 150 X 20ml")).toBeTruthy();
  expect(within(nav).getAllByRole("button").map((button) => button.textContent)).toEqual(["WM-001In production", "Batch 2Awaiting start", "Batch 3Awaiting start"]);
  expect(await screen.findByText("Current step: Dispensing")).toBeTruthy();
  // A batch in production is not offered to start again.
  expect(screen.queryByRole("button", { name: "Start production" })).toBeNull();
  expect(screen.getByText("Night shift")).toBeTruthy();
  await openMenu("Manage schedule");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Edit dates and remarks", "Add products", "Remove products"]);
});

it("starts a batch only when every material is covered, after confirming", async () => {
  const { calls, router } = open(`/production/schedules/${id}/details?batch=b2`, { rawFor: { b2: [material("Sugar", 500, 900)], b3: [material("Sugar", 500, 100)] } });
  const start = await screen.findByRole("button", { name: "Start production" });
  await waitFor(() => expect(start.hasAttribute("disabled")).toBe(false));
  fireEvent.click(start);
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Start production" }));
  await waitFor(() => expect(calls.map((call) => call.path)).toEqual(["/api/v1/production-schedule/activity/start/b2"]));
  fireEvent.click(within(screen.getByRole("navigation", { name: "Batches" })).getByRole("button", { name: /Batch 3/ }));
  expect(await screen.findByText(/1 raw material is short, so production cannot start/)).toBeTruthy();
  expect(router.state.location.search).toBe("?batch=b3");
  expect(screen.getByText("short by 400 g")).toBeTruthy();
  expect(screen.getByText("Purchase requisition")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Start production" }).hasAttribute("disabled")).toBe(true);
});

it("starts a batch while packaging is short, saying it is requested later", async () => {
  const { calls } = open(`/production/schedules/${id}/details?batch=b2`, { rawFor: { b2: [material("Sugar", 500, 900)] }, packagingFor: { b2: [material("Bottle", 500, 100)] } });
  expect(await screen.findByText(/1 packaging material is short\. Production can start without it/)).toBeTruthy();
  const start = screen.getByRole("button", { name: "Start production" });
  await waitFor(() => expect(start.hasAttribute("disabled")).toBe(false));
  fireEvent.click(start);
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Start production" }));
  await waitFor(() => expect(calls.map((call) => call.path)).toEqual(["/api/v1/production-schedule/activity/start/b2"]));
});

it("removes the chosen batches and keeps the ones the server refused, with its reason", async () => {
  const { calls } = open(`/production/schedules/${id}/products/remove`, { refuse: ["b3"] });
  const started = await screen.findByRole("checkbox", { name: "Remove WM-001 of Wormee" });
  expect(started.hasAttribute("disabled")).toBe(true);
  expect(screen.getByText("3 batches · 2 can be removed")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Take off"), { target: { value: "5" } });
  fireEvent.click(screen.getByRole("button", { name: "Select 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove selected (2)" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Wormee, Batch 2")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["DELETE /api/v1/production-schedule/product/b2", "DELETE /api/v1/production-schedule/product/b3"]));
  expect((await screen.findByRole("alert")).textContent).toContain("Wormee, Batch 3: Cannot remove a product that has already started production");
  // The refused batch stays selected so it can be tried again.
  expect(screen.getByRole("button", { name: "Remove selected (1)" })).toBeTruthy();
});

it("shows what is already on a schedule when adding, and closes an ended schedule to changes", async () => {
  const { calls } = open(`/production/schedules/${id}/products/add`);
  expect(await screen.findByText("Already on this schedule")).toBeTruthy();
  expect(screen.getByText("×3")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Add to schedule" }));
  expect(await screen.findByText("Choose a product")).toBeTruthy();
  expect(calls).toEqual([]);
  cleanup(); forgetSession();
  open(`/production/schedules/${id}/products/add`, { end: -1 });
  expect((await screen.findByRole("alert")).textContent).toContain("PS-0007 has ended. Products cannot be added.");
  expect(screen.queryByRole("button", { name: "Add to schedule" })).toBeNull();
  cleanup(); forgetSession();
  open(`/production/schedules/${id}/details?batch=b2`, { end: -1 });
  expect(await screen.findByText(/was not started before the schedule ended/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Start production" })).toBeNull();
});

it("raises a purchase requisition for a batch's shortages that are not already being bought", async () => {
  const short = { material: { id: "m-salt", name: "Salt", code: "C-Salt" }, materialDepartment: { uoM: { id: "u-g", symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 100, status: 0 };
  const { calls } = open(`/production/schedules/${id}/details?batch=b3`, { rawFor: { b3: [material("Sugar", 500, 100), short] }, extraPermissions: ["CanCreateRawMaterialRequisitions"] });
  // Sugar is already on a requisition, so only Salt can be raised.
  fireEvent.click(await screen.findByRole("button", { name: "Raise purchase requisition (1)" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByText("Sugar")).toBeNull();
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: "Order quantity of Salt" }) as HTMLInputElement).value).toBe("0.4"));
  // 400 g short, offered in the largest unit of its family.
  expect(within(dialog).getByRole("combobox", { name: "Unit for Salt" }).textContent).toBe("kg");
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /Requisition number/ }) as HTMLInputElement).value).toMatch(/^PR-/));
  fireEvent.click(within(dialog).getByRole("button", { name: "Raise requisition" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/requisition")).toBe(true));
  expect(JSON.parse(calls.find((call) => call.path === "/api/v1/requisition")?.body ?? "{}")).toMatchObject({ requisitionType: 1, productionScheduleProductId: "b3", items: [{ materialId: "m-salt", quantity: 400, uomId: "u-g" }] });
});

it("does not offer to raise a requisition to someone who may not create one", async () => {
  open(`/production/schedules/${id}/details?batch=b3`, { rawFor: { b3: [{ material: { id: "m-salt", name: "Salt" }, materialDepartment: { uoM: { id: "u-g", symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 100, status: 0 }] } });
  expect(await screen.findByText(/1 raw material is short/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Raise purchase requisition/ })).toBeNull();
});

it("shows where a material's other stock is, store by store", async () => {
  open(`/production/schedules/${id}/details?batch=b2`, { rawFor: { b2: [{ ...material("Sugar", 500, 100), material: { id: "Sugar", name: "Sugar", code: "C-Sugar", totalStock: 4200 } }] } });
  fireEvent.click(await screen.findByRole("button", { name: "Stock of Sugar in every store" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Main store")).toBeTruthy();
  expect(within(dialog).getByText("Liquids floor")).toBeTruthy();
  expect(within(dialog).getAllByText("3 kg").length).toBeGreaterThan(0);
  expect(within(dialog).getByText("Production floors")).toBeTruthy();
});
