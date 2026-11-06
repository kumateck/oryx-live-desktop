// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction } from "@/test/menu";
import { BomSection } from "./bom-section";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });
const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const name = "Gelatin Capsule Shells - Zinvite";

function open({ symbol = "piece", quantity = 500_000, unitResponse, failSave = false }: {
  symbol?: string; quantity?: number; unitResponse?: () => Response; failSave?: boolean;
} = {}) {
  const backend = stubBackend({ permissions: ["CanEditProductionProductInfo", "CanAddProductionProductBom", "CanEditProductionProductBom", "CanDeleteProductionProductBom", "CanArchiveProductionProductBom", "CanAddProductionProductPackingMaterials", "CanEditProductionProductPackingMaterials", "CanDeleteProductionProductPackingMaterials", "CanAddProductionProductPackingStyles", "CanEditProductionProductPackingStyles", "CanDeleteProductionProductPackingStyles", "CanEditProductionProductPackingOrder", "CanAddProductionProductProcedure", "CanEditProductionProductProcedure", "CanDeleteProductionProductProcedure"] });
  rememberSession();
  const writes: { path: string; body: string }[] = [];
  const reads: string[] = [];
  const unit = { id: `linked-${symbol}`, symbol };
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "GET") reads.push(path);
    else writes.push({ path, body: await input.clone().text() });
    if (path === `/api/v1/product/${id}/bom`) return Response.json({ version: 2, isActive: true, billOfMaterial: { items: [
      { id: "line-shells", order: 1, baseQuantity: quantity, baseUoM: { id: "old-mg", symbol: "mg" },
        material: { id: "shells", name, code: "RMG033" } },
    ] } });
    if (path === "/api/v1/material/shells/uom") return unitResponse ? unitResponse() : Response.json(unit);
    if (path === "/api/v1/material/department") return Response.json({ data: [
      { material: { id: "shells", name, code: "RMG033" }, uoM: unit },
      { material: { id: "liquid", name: "Liquid", code: "RM-L" }, uoM: { id: "linked-ml", symbol: "ml" } },
    ], pageIndex: 1, pageCount: 1 });
    if (path === "/api/v1/material/liquid/uom") return Response.json({ id: "linked-ml", symbol: "ml" });
    if (path === "/api/v1/bom") return failSave ? Response.json({ errors: [{ description: "BOM could not be saved." }] }, { status: 409 }) : Response.json("ok");
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <BomSection productId={id} compositionSize={1} batchSize={2} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}

async function edit(symbol: string) {
  await chooseAction(`Actions for ${name}`, "Edit");
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByRole("spinbutton", { name: `Unit quantity (${symbol})` });
  return dialog;
}

async function selectUnit(symbol: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Enter quantities in" }));
  await user.click(await screen.findByRole("option", { name: symbol }));
}

async function updateAndSave(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save bill of materials" }));
}

it("uses RMG033's linked piece unit instead of its saved mg unit in the table, edit and save", async () => {
  const { writes, reads } = open();
  expect(await screen.findByText("500,000 piece")).toBeTruthy();
  expect(screen.getByText("1,000,000 piece")).toBeTruthy();
  expect(screen.queryByText("500 g")).toBeNull();
  expect(reads.filter((path) => path.endsWith("/uom"))).toHaveLength(1);
  const dialog = await edit("piece");
  expect(within(dialog).queryByRole("combobox", { name: "Enter quantities in" })).toBeNull();
  expect(within(dialog).getByRole("spinbutton", { name: "Unit quantity (piece)" })).toHaveProperty("value", "500000");
  await updateAndSave(dialog);
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}").items[0]).toMatchObject({ materialId: "shells", baseUoMId: "linked-piece", baseQuantity: 500_000, prescribedQuantity: 1_000_000 });
});

it.each([
  ["mg", "kg", "2.3456789", 2_345_678.9],
  ["ml", "L", "2.3456789", 2345.6789],
  ["ML", "L", "2.3456789", 2345.6789],
] as const)("converts %s entry through %s and saves the linked quantity without losing entered digits", async (symbol, entry, value, expected) => {
  const { writes } = open({ symbol, quantity: 1500 });
  const dialog = await edit(symbol.toLowerCase());
  await selectUnit(entry);
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: `Unit quantity (${entry})` }), { target: { value } });
  await selectUnit(symbol.toLowerCase());
  expect(within(dialog).getByRole("spinbutton", { name: `Unit quantity (${symbol.toLowerCase()})` })).toHaveProperty("value", String(expected));
  await updateAndSave(dialog);
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}").items[0]).toMatchObject({ baseUoMId: `linked-${symbol}`, baseQuantity: expected, prescribedQuantity: expected * 2 });
});

it("preloads a newly selected material's linkage and uses the same unit controls", async () => {
  const { writes, reads } = open();
  const user = userEvent.setup();
  await screen.findByText(name);
  fireEvent.click(await screen.findByRole("button", { name: "Add material" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("combobox", { name: "Material" }));
  await user.click(await screen.findByRole("option", { name: /Liquid/ }));
  const dialog = screen.getByRole("dialog");
  await within(dialog).findByRole("spinbutton", { name: "Unit quantity (ml)" });
  await selectUnit("L");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Unit quantity (L)" }), { target: { value: "1.25" } });
  expect(reads).not.toContain("/api/v1/material/liquid/uom");
  fireEvent.click(within(dialog).getByRole("button", { name: "Add material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save bill of materials" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}").items[1]).toMatchObject({ materialId: "liquid", baseUoMId: "linked-ml", baseQuantity: 1250, prescribedQuantity: 2500 });
});

it("blocks missing linkage units and recovers from a failed lookup without writing", async () => {
  let healthy = false;
  const { writes } = open({ unitResponse: () => healthy ? Response.json({ id: "linked-piece", symbol: "piece" }) : new Response(null, { status: 503 }) });
  await chooseAction(`Actions for ${name}`, "Edit");
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("The material unit could not be loaded.")).toBeTruthy();
  expect(within(dialog).queryByRole("spinbutton")).toBeNull();
  expect(within(dialog).getByRole("button", { name: "Update material" }).hasAttribute("disabled")).toBe(true);
  healthy = true;
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry unit" }));
  expect(await within(dialog).findByRole("spinbutton", { name: "Unit quantity (piece)" })).toHaveProperty("value", "500000");
  expect(writes).toEqual([]);
});

it("keeps converted draft quantities when saving fails", async () => {
  open({ symbol: "mg", quantity: 1000, failSave: true });
  const dialog = await edit("mg");
  await selectUnit("g");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Unit quantity (g)" }), { target: { value: "2.5" } });
  await updateAndSave(dialog);
  expect(await screen.findByText("BOM could not be saved.")).toBeTruthy();
  expect(within(await edit("mg")).getByRole("spinbutton", { name: "Unit quantity (mg)" })).toHaveProperty("value", "2500");
});

it("refuses to reinterpret an edited quantity if the linkage changes before save", async () => {
  let changed = false;
  const { writes } = open({ unitResponse: () => Response.json(changed ? { id: "other-mg", symbol: "mg" } : { id: "linked-piece", symbol: "piece" }) });
  const dialog = await edit("piece");
  changed = true;
  await updateAndSave(dialog);
  expect(await screen.findByText(/A department-linked unit changed/)).toBeTruthy();
  expect(writes).toEqual([]);
});
