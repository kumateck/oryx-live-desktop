// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import LinkedMaterialsRoute from "../../../pages/(workspace)/warehouse/materials/linked/page";
import MaterialsPage from "../../../pages/(workspace)/warehouse/materials/page";
import UnlinkedMaterialsRoute from "../../../pages/(workspace)/warehouse/materials/unlink/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";
import { codeLetter, enteredLevel, showStock, stockStanding, storedLevel } from "../lib/materials";
import { linkFormSchema } from "../schemas/material-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

it("letters codes, converts levels and judges stock against them", () => {
  expect([codeLetter(0, "maize starch", "Excipient"), codeLetter(1, "Bottle cap", "closures"), codeLetter(1, "Bottle cap", null)]).toEqual(["M", "C", ""]);
  // Levels are typed in the largest unit of the family and stored in the smallest.
  expect([storedLevel(2.5, "kg"), storedLevel(2.5, "mg"), enteredLevel(2_500_000, "g"), storedLevel(40, "pcs"), enteredLevel(40, "pcs")]).toEqual([2_500_000, 2_500_000, 2.5, 40, 40]);
  expect([showStock(2_500_000, "kg"), showStock(500, "g"), showStock(12, "pcs"), showStock(null, "kg")]).toEqual(["2.5 kg", "500 mg", "12 pcs", "–"]);
  const levels = { minimum: 10, reorder: 20, maximum: 100 };
  expect([stockStanding({ ...levels, stock: 50, reserved: 0 }), stockStanding({ ...levels, stock: 25, reserved: 10 }), stockStanding({ ...levels, stock: 15, reserved: 10 }), stockStanding({ ...levels, stock: 120, reserved: 0 }),
    stockStanding({ minimum: 0, reorder: 0, maximum: 0, stock: 5, reserved: 0 })]).toEqual(["ok", "reorder", "below-minimum", "above-maximum", "none"]);
  const unit = { value: "u", label: "kg" };
  const messages = (value: object) => linkFormSchema.safeParse(value).error?.issues.map((issue) => issue.message) ?? [];
  expect(messages({ unit, minimum: 10, reorder: 20, maximum: 100 })).toEqual([]);
  expect(messages({ unit, minimum: 30, reorder: 20, maximum: 100 })).toEqual(["The re-order level cannot be below the minimum"]);
  expect(messages({ unit, minimum: 10, reorder: 200, maximum: 100 })).toEqual(["The re-order level cannot be above the maximum"]);
  expect(messages({ unit: null, minimum: 0, reorder: 20, maximum: 100 })).toEqual(["Choose the unit the stock is counted in", "Enter a minimum level above zero"]);
});

const material = (id: string, name: string, extra: object = {}) => ({ id, name, code: id.toUpperCase(), kind: 0, materialCategory: { id: "c1", name: "Excipient" }, totalStock: 0, alphabet: "M", ...extra });
interface Call { method: string; path: string; body: unknown; search: string }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path: url.pathname, body: text ? JSON.parse(text) as unknown : null, search: url.search });
    if (url.pathname === "/api/v1/material" && input.method === "GET") return Response.json({ data: [material("m1", "Maize starch"), material("m2", "Lactose", { totalStock: 500 })], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (url.pathname === "/api/v1/material/department" && input.method === "GET") return Response.json({ data: [
      { material: material("m1", "Maize starch"), uoM: { id: "u-kg", symbol: "kg" }, density: 1.2, minimumStockLevel: 10_000_000, reOrderLevel: 20_000_000, maximumStockLevel: 100_000_000, warehouseStock: 15_000_000, reservedQuantity: 10_000_000 },
      { material: material("m2", "Lactose"), uoM: { id: "u-kg", symbol: "kg" }, minimumStockLevel: 1_000_000, reOrderLevel: 2_000_000, maximumStockLevel: 9_000_000, warehouseStock: 0 }], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (url.pathname === "/api/v1/collection/uom/paginated") return Response.json({ data: [{ id: "u-kg", name: "Kilogram", symbol: "kg", type: 0, category: 0 }], totalRecordCount: 1 });
    if (url.pathname === "/api/v1/material/department/not-linked") return Response.json({ data: [material("m3", "Sorbitol"), material("m4", "Mannitol")], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (url.pathname === "/api/v1/collection") return Response.json({ UnitOfMeasure: [{ id: "u-kg", symbol: "kg" }, { id: "u-l", symbol: "L" }] });
    if (url.pathname === "/api/v1/collection/MaterialCategory") return Response.json([{ id: "c1", name: "Excipient" }]);
    if (url.pathname.startsWith("/api/v1/configuration/by-model-type/")) return Response.json({ prefix: "RM-", namingType: 0, minimumNameLength: 3, maximumNameLength: 5 });
    if (url.pathname.startsWith("/api/v1/configuration/")) return Response.json(7);
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/materials", element: <MaterialsPage /> }, { path: "/warehouse/materials/linked", element: <LinkedMaterialsRoute /> }, { path: "/warehouse/materials/unlink", element: <UnlinkedMaterialsRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection" && call.path !== "/api/v1/collection/uom/paginated");

it("offers each action to those who hold it, and will not delete a material that has stock", async () => {
  open("/warehouse/materials", ["CanViewRawMaterials", "CanDeleteRawMaterials"]);
  await screen.findByText("Maize starch");
  expect(screen.queryByRole("button", { name: /Add material/ })).toBeNull();
  await openMenu("Actions for Lactose");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["View", expect.stringContaining("has stock, so it cannot be deleted")]);
});

it("adds a material with a suggested code that follows its name, sending the kind of the open list", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/materials", ["CanViewRawMaterials", "CanCreateNewRawMaterials"]);
  await user.click(await screen.findByRole("button", { name: /Add material/ }));
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByRole("textbox", { name: /^Name/ }), "Sorbitol");
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /^Code/ }) as HTMLInputElement).value).toBe("RM-S008"));
  expect(calls.some((call) => call.path.endsWith("/RawMaterial/count") && call.search.includes("prefix=RM-S"))).toBe(true);
  await user.click(within(dialog).getByRole("button", { name: "Add material" }));
  expect(await within(dialog).findByText("Choose the category")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("combobox", { name: /Category/ }));
  await user.click(await screen.findByRole("option", { name: "Excipient" }));
  await user.click(within(dialog).getByRole("button", { name: "Add material" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "POST", path: "/api/v1/material", body: { name: "Sorbitol", code: "RM-S008", materialCategoryId: "c1", kind: 0 } });
}, 30_000);

it("shows where stock stands against its levels, and changes one level without shifting the others", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/materials/linked", ["CanViewLinkedRawMaterials", "CanEditLinkedRawMaterials", "CanUnlinkRawMaterials"]);
  await screen.findByText("Maize starch");
  // Maize starch: 15 kg held, 10 kg reserved, minimum 10 kg. Lactose: none held.
  expect(screen.getAllByText("Below minimum")).toHaveLength(2);
  await openMenu("Actions for Maize starch");
  expect(screen.getByRole("menuitem", { name: /Unlink/ }).textContent).toContain("holds stock of this material");
  await user.keyboard("{Escape}");
  await chooseAction("Actions for Maize starch", "Change stock levels");
  const dialog = await screen.findByRole("dialog");
  const maximum = await within(dialog).findByRole("spinbutton", { name: /Maximum level \(kg\)/ });
  expect((within(dialog).getByRole("spinbutton", { name: /Minimum level/ }) as HTMLInputElement).value).toBe("10");
  await user.clear(maximum);
  await user.type(maximum, "150");
  await user.click(within(dialog).getByRole("button", { name: "Save levels" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "POST", path: "/api/v1/material/department", body: [{ materialId: "m1", uoMId: "u-kg", minimumStockLevel: 10_000_000, reOrderLevel: 20_000_000, maximumStockLevel: 150_000_000, density: 1.2 }] });
}, 30_000);

it("links an unlinked material only with a unit and levels in order", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/materials/unlink", ["CanViewUnlinkedRawMaterials", "CanLinkRawMaterials"]);
  await screen.findByText("Sorbitol");
  await chooseAction("Actions for Sorbitol", "Link to my department");
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByRole("spinbutton", { name: /Minimum level/ }), "5");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Re-order level/ }), "2");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Maximum level/ }), "50");
  await user.click(within(dialog).getByRole("button", { name: "Link material" }));
  expect(await within(dialog).findByText("Choose the unit the stock is counted in")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
}, 30_000);

it("fills in several unlinked materials and links the complete ones in one request", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/materials/unlink", ["CanViewUnlinkedRawMaterials", "CanLinkRawMaterials"]);
  await screen.findByText("Sorbitol");
  const fill = async (label: string, value: string) => { const input = screen.getByRole("textbox", { name: new RegExp(label) }); await user.click(input); await user.type(input, value); await user.tab(); };
  await user.click(screen.getByRole("combobox", { name: "Unit of Sorbitol" }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  await fill("Minimum of Sorbitol", "5"); await fill("Re-order of Sorbitol", "10"); await fill("Maximum of Sorbitol", "50");
  // Mannitol is started but has no unit.
  await fill("Minimum of Mannitol", "1");
  expect(screen.getByRole("status", { name: "Materials filled in" }).textContent).toContain("2 filled in · 1 ready to link · 1 incomplete");
  await user.click(screen.getByRole("button", { name: "Link 1 material" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  // Levels are typed in kg and stored in the smallest unit.
  expect(writes(calls)[0]).toMatchObject({ method: "POST", path: "/api/v1/material/department", body: [{ materialId: "m3", uoMId: "u-kg", minimumStockLevel: 5_000_000, reOrderLevel: 10_000_000, maximumStockLevel: 50_000_000 }] });
  // The incomplete one stays filled in and says what it lacks.
  expect(await screen.findByText("Choose the unit the stock is counted in")).toBeTruthy();
  expect(screen.getByRole("status", { name: "Materials filled in" }).textContent).toContain("1 filled in · 0 ready to link");
}, 30_000);
