// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import LocationsPage from "../../../pages/(workspace)/settings/locations/page";
import StoresPage from "../../../pages/(workspace)/settings/warehouses/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";
import { locationChangeBlock, locationNames, storeChangeBlock } from "../lib/store-rules";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

it("lets a store or a location be changed only while it is empty", () => {
  expect(storeChangeBlock({ locations: 0 })).toBeNull();
  expect(storeChangeBlock({ locations: 2 })).toContain("2 locations");
  expect(locationChangeBlock({ racks: 0 })).toBeNull();
  expect(locationChangeBlock({ racks: 1 })).toContain("1 rack.");
  expect(locationNames(1)?.map((item) => item.label)).toEqual(["General", "Foils", "PVC", "Packaging Room 1", "Packaging Room 2"]);
  expect(locationNames(2)).toBeNull();
});

const stores = [{ id: "w1", name: "Main raw store", type: 0, locations: [{ id: "l1" }] }, { id: "w2", name: "New store", type: 1, locations: [] }, { id: "w3", name: "Dispatch", type: 2, locations: [] }];
const locations = [{ id: "l1", name: "Excipient", floorName: "Ground", warehouse: { id: "w1", name: "Main raw store", type: 0 }, racks: [{ id: "r1" }] },
  { id: "l2", name: "PackagingRoom1", floorName: "First", warehouse: { id: "w2", name: "New store", type: 1 }, racks: [] }];
const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });
interface Call { method: string; path: string; body: unknown }

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const text = input.method === "GET" || input.method === "DELETE" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/warehouse") return input.method === "GET" ? page(stores) : Response.json("w9", { status: 201 });
    if (path === "/api/v1/warehouse/location") return page(locations);
    if (path === "/api/v1/warehouse/w3/location") return Response.json("l9", { status: 201 });
    if (path.startsWith("/api/v1/warehouse/")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/warehouses", element: <StoresPage /> }, { path: "/settings/locations", element: <LocationsPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("adds a store, and will not save or remove one that has locations", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/warehouses", ["CanViewWarehouses"]);
  await screen.findByText("Main raw store");
  await openMenu("Actions for Main raw store");
  expect(screen.getByRole("menuitem", { name: /Remove/ }).textContent).toContain("The store has locations");
  await user.click(screen.getByRole("menuitem", { name: "Edit" }));
  let dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/Saving or removing it would remove them/)).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Save store" })).toBeNull();
  await user.click(within(dialog).getAllByRole("button", { name: "Close" })[0] as HTMLElement);
  await user.click(screen.getByRole("button", { name: "Add store" }));
  dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Add store" }));
  expect(await within(dialog).findByText("Enter the store name")).toBeTruthy();
  await user.type(within(dialog).getByRole("textbox", { name: /Store name/ }), "Quarantine");
  await user.click(within(dialog).getByRole("radio", { name: "Raw materials" }));
  await user.click(within(dialog).getByRole("button", { name: "Add store" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/warehouse", body: { name: "Quarantine", description: "", type: 0 } }]);
}, 20_000);

it("adds a location with a typed area where the store type has no fixed list, and guards one with racks", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/locations", ["CanViewLocations", "CanAddNewLocation", "CanEditLocation", "CanDeleteLocation"]);
  await screen.findByText("Excipient");
  expect(screen.getByText("Packaging Room 1")).toBeTruthy();
  await openMenu("Actions for Excipient, Main raw store");
  expect(screen.getByRole("menuitem", { name: /Remove/ }).textContent).toContain("The location has racks");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Add location" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /Store/ }));
  await user.click(await screen.findByRole("option", { name: "Dispatch · Finished goods" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Floor/ }));
  await user.click(await screen.findByRole("option", { name: "Ground floor" }));
  await user.click(within(dialog).getByRole("button", { name: "Add location" }));
  expect(await within(dialog).findByText("Choose or name the area")).toBeTruthy();
  await user.type(within(dialog).getByRole("textbox", { name: /Area/ }), "Loading bay");
  await user.click(within(dialog).getByRole("button", { name: "Add location" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/warehouse/w3/location", body: { name: "Loading bay", floorName: "Ground", description: "" } }]);
  await chooseAction("Actions for Packaging Room 1, New store", /Remove/);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove location" }));
  await waitFor(() => expect(writes(calls).at(-1)).toMatchObject({ method: "DELETE", path: "/api/v1/warehouse/location/l2" }));
}, 20_000);

it("shows locations to a viewer without any action", async () => {
  open("/settings/locations", ["CanViewLocations"]);
  await screen.findByText("Excipient");
  expect(screen.queryByRole("button", { name: "Add location" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
});
