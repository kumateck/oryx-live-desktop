// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import RacksPage from "../../../pages/(workspace)/settings/racks/page";
import ShelvesPage from "../../../pages/(workspace)/settings/shelves/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";

// Radix Select needs these and jsdom has neither.
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const place = { id: "l1", name: "Bay 1", floorName: "Ground", warehouse: { name: "Warehouse A", type: 0 } };
const racks = [
  { id: "r1", name: "G/01", description: "Nearest the door", warehouseLocation: place, shelves: [{ id: "s1", code: "W/RM/G/01/A", name: "A", materialBatches: [{ quantity: 12 }] }, { id: "s2", code: "W/RM/G/01/B", name: "B", materialBatches: [] }] },
  { id: "r2", name: "G/02", warehouseLocation: place, shelves: [{ id: "s3", code: "W/RM/G/02/A", name: "A", description: "Top", materialBatches: [] }] },
];
const shelfRows = racks.flatMap((rack) => rack.shelves.map((shelf) => ({ ...shelf, warehouseLocationRack: { id: rack.id, name: rack.name, warehouseLocation: place } })));
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
    if (path === "/api/v1/warehouse/rack") return page(racks);
    if (path === "/api/v1/warehouse/location") return page([{ ...place, racks: racks.map((rack) => ({ name: rack.name })) }]);
    if (path === "/api/v1/warehouse/l1/rack") return Response.json("new-rack", { status: 201 });
    if (path === "/api/v1/warehouse/shelf") return page(shelfRows);
    for (const shelf of shelfRows) if (path === `/api/v1/warehouse/shelf/${shelf.id}`) return input.method === "GET" ? Response.json(shelf) : new Response(null, { status: 204 });
    if (path === "/api/v1/warehouse/r2/shelf") return Response.json({ errors: [{ code: "WarehouseLocationShelf.AlreadyExists", description: "Warehouse location shelf already exists" }] }, { status: 409 });
    if (path.startsWith("/api/v1/warehouse/rack/")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/racks", element: <RacksPage /> }, { path: "/settings/shelves", element: <ShelvesPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("adds a rack named after its location, with shelves coded from it", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/racks", ["CanViewRacks", "CanAddNewRack"]);
  await screen.findByText("G/01");
  await user.click(screen.getByRole("button", { name: "Add raw rack" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /Location/ }));
  await user.click(await screen.findByRole("option", { name: "Warehouse A · Bay 1 · Ground" }));
  // Two racks stand here already, so the third number is offered.
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /Rack name/ }) as HTMLInputElement).value).toBe("G/03"));
  await user.click(within(dialog).getByRole("button", { name: "Add shelf" }));
  await user.click(within(dialog).getByRole("button", { name: "Add shelf" }));
  expect(within(dialog).getAllByRole("textbox", { name: /Code/ }).map((input) => (input as HTMLInputElement).value)).toEqual(["W/RM/G/03/A", "W/RM/G/03/B"]);
  await user.click(within(dialog).getByRole("button", { name: "Add rack" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/warehouse/l1/rack", body: { name: "G/03", description: "",
    shelves: [{ code: "W/RM/G/03/A", name: "A", description: "" }, { code: "W/RM/G/03/B", name: "B", description: "" }] } }]);
}, 20_000);

it("will not save a rack whose shelves carry stock records, and says why", async () => {
  const { calls } = open("/settings/racks", ["CanViewRacks", "CanEditRack", "CanDeleteRack"]);
  await chooseAction("Actions for rack G/01", "Edit");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/Saving the rack would replace its shelves and detach that stock/)).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Save rack" })).toBeNull();
  expect(within(dialog).getByRole("link", { name: "Shelves page" }).getAttribute("href")).toBe("/settings/shelves?type=0");
  expect(writes(calls)).toEqual([]);
});

it("saves a rack with no stock records, sending its shelves back unchanged, and removes an empty rack only", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/racks", ["CanViewRacks", "CanEditRack", "CanDeleteRack"]);
  await openMenu("Actions for rack G/01");
  expect(screen.getByRole("menuitem", { name: /Remove/ }).textContent).toContain("Shelves still hold stock");
  await user.keyboard("{Escape}");
  await chooseAction("Actions for rack G/02", "Edit");
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("textbox", { name: /Description/ }), "By the window");
  await user.click(within(dialog).getByRole("button", { name: "Save rack" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/warehouse/rack/r2", body: { name: "G/02", description: "By the window", shelves: [{ code: "W/RM/G/02/A", name: "A", description: "Top" }] } }]);
  await chooseAction("Actions for rack G/02", /Remove/);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove rack" }));
  await waitFor(() => expect(writes(calls).at(-1)).toMatchObject({ method: "DELETE", path: "/api/v1/warehouse/rack/r2" }));
}, 20_000);

it("renames a shelf without touching its stock, and refuses to remove one that holds stock", async () => {
  const user = userEvent.setup();
  const { calls } = open("/settings/shelves", ["CanViewShelves", "CanEditShelf", "CanDeleteShelf"]);
  await chooseAction("Actions for shelf W/RM/G/01/A", "Edit");
  let dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("combobox", { name: /Rack/ })).toBeNull();
  await user.clear(within(dialog).getByRole("textbox", { name: /Shelf name/ }));
  await user.type(within(dialog).getByRole("textbox", { name: /Shelf name/ }), "Lower");
  await user.click(within(dialog).getByRole("button", { name: "Save shelf" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/warehouse/shelf/s1", body: { code: "W/RM/G/01/A", name: "Lower", description: "" } }]);

  await chooseAction("Actions for shelf W/RM/G/01/A", /Remove/);
  dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/This shelf still holds stock/)).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: "Remove shelf" })).toBeNull();
  await user.click(within(dialog).getAllByRole("button", { name: "Close" })[0] as HTMLElement);
  await chooseAction("Actions for shelf W/RM/G/01/B", /Remove/);
  dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("button", { name: "Remove shelf" }));
  await waitFor(() => expect(writes(calls).at(-1)).toMatchObject({ method: "DELETE", path: "/api/v1/warehouse/shelf/s2" }));
}, 20_000);

it("offers only what each permission allows", async () => {
  open("/settings/shelves", ["CanViewShelves"]);
  await screen.findByText("W/RM/G/01/A");
  expect(screen.queryByRole("button", { name: /Add raw shelf/ })).toBeNull();
  expect(screen.queryByRole("button", { name: /Actions for shelf/ })).toBeNull();
});
