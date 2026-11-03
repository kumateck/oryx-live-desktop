// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction } from "@/test/menu";
import { PackagingSection } from "./packaging-section";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });
const id = "658da105-a506-44a9-8ff5-8d005a54f294";
interface Unit { id: string; symbol: string }

function open({ symbol = "mg", quantity = 2_500_000, allowance = 125_000, unitResponse, failSave = false }: {
  symbol?: string; quantity?: number; allowance?: number; unitResponse?: () => Response; failSave?: boolean;
} = {}) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const writes: { path: string; body: string }[] = [];
  const reads: string[] = [];
  const unit: Unit = { id: `unit-${symbol}`, symbol };
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "GET") reads.push(path);
    else writes.push({ path, body: await input.clone().text() });
    if (path === `/api/v1/product/${id}/packages`) return input.method === "GET" ? Response.json([
      { id: "foil", material: { id: "m-foil", name: "Foil", code: "PM-1" }, prescribedQuantity: quantity, packingExcessMargin: allowance,
        materialThickness: "0.02mm", otherStandards: "Keep this", baseQuantity: 1, unitCapacity: 0 },
    ]) : failSave ? Response.json({ detail: "Packing could not be saved" }, { status: 409 }) : Response.json("ok");
    if (path === `/api/v1/product/${id}/packing`) return Response.json([]);
    if (path === "/api/v1/material/m-foil/uom") return unitResponse ? unitResponse() : Response.json(unit);
    if (path === "/api/v1/material/department") return Response.json({ data: [
      { material: { id: "m-foil", name: "Foil", code: "PM-1" }, uoM: unit },
      { material: { id: "m-label", name: "Label", code: "PM-2" }, uoM: { id: "unit-pcs", symbol: "pcs" } },
      { material: { id: "m-liquid", name: "Liquid", code: "PM-3" }, uoM: { id: "unit-ml", symbol: "ml" } },
    ], pageIndex: 1, pageCount: 1 });
    if (path.startsWith("/api/v1/material-specifications/")) return Response.json(null);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <PackagingSection productId={id} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}

async function edit() {
  await chooseAction("Actions for Foil", "Edit");
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByRole("spinbutton", { name: /Prescribed quantity/ });
  return dialog;
}

async function selectUnit(symbol: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "Enter quantities in" }));
  await user.click(await screen.findByRole("option", { name: symbol }));
}

it("shows mass units in the table and converts both inputs without changing the linked UOM", async () => {
  const { writes, reads } = open();
  expect(await screen.findByText("2.5 kg")).toBeTruthy();
  expect(screen.getByText("125 g")).toBeTruthy();
  expect(screen.getByText("2.625 kg")).toBeTruthy();
  expect(reads.filter((path) => path.endsWith("/uom"))).toHaveLength(1);
  const dialog = await edit();
  expect(within(dialog).getByText("Material unit").nextElementSibling?.textContent).toBe("mg");
  await selectUnit("kg");
  expect(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (kg)" })).toHaveProperty("value", "2.5");
  expect(within(dialog).getByRole("spinbutton", { name: "Packing allowance (kg)" })).toHaveProperty("value", "0.125");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (kg)" }), { target: { value: "1.234567891" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Packing allowance (kg)" }), { target: { value: "0.00000001" } });
  await selectUnit("g");
  expect(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (g)" })).toHaveProperty("value", "1234.567891");
  await selectUnit("mg");
  expect(within(dialog).getByRole("spinbutton", { name: "Packing allowance (mg)" })).toHaveProperty("value", "0.01");
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  // Reopening starts in the linked unit, preserving the draft amount without a second conversion.
  const reopened = await edit();
  expect(within(reopened).getByRole("spinbutton", { name: "Prescribed quantity (mg)" })).toHaveProperty("value", "1234567.891");
  fireEvent.click(within(reopened).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "[]")).toEqual([{
    materialId: "m-foil", productPackingId: null, prescribedQuantity: 1234567.891, packingExcessMargin: 0.01, loose: 0.01,
    baseQuantity: 1, unitCapacity: 0, directLinkMaterialId: null, materialThickness: "0.02mm", otherStandards: "Keep this", substituteMaterialIds: [],
  }]);
});

it("allows ml or L and saves entered litres as linked millilitres", async () => {
  const { writes } = open({ symbol: "ml", quantity: 1500, allowance: 25 });
  const dialog = await edit();
  await selectUnit("L");
  expect(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (L)" })).toHaveProperty("value", "1.5");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (L)" }), { target: { value: "2.3456789" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "[]")[0]).toMatchObject({ prescribedQuantity: 2345.6789, packingExcessMargin: 25, loose: 25 });
});

it("shows a fixed unit for counted materials and keeps quantity validation", async () => {
  const { writes } = open({ symbol: "pcs", quantity: 100, allowance: 2 });
  const dialog = await edit();
  expect(within(dialog).queryByRole("combobox", { name: "Enter quantities in" })).toBeNull();
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (pcs)" }), { target: { value: "0" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Packing allowance (pcs)" }), { target: { value: "-1" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  expect(await within(dialog).findByText("The prescribed quantity must be greater than 0")).toBeTruthy();
  expect(within(dialog).getByText("The packing allowance cannot be negative")).toBeTruthy();
  expect(writes).toEqual([]);
});

it("blocks edits on a missing or unreadable linked unit while retaining visible saved quantities", async () => {
  const { writes } = open({ unitResponse: () => Response.json(null) });
  expect((await screen.findAllByText("(unit not set)")).length).toBe(3);
  await chooseAction("Actions for Foil", "Edit");
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/No unit is set for this material/)).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: "Update material" }).hasAttribute("disabled")).toBe(true);
  expect(within(dialog).queryByRole("spinbutton")).toBeNull();
  expect(writes).toEqual([]);
});

it("recovers from a failed unit lookup and makes no writes during retry", async () => {
  let available = false;
  const { writes } = open({ unitResponse: () => available ? Response.json({ id: "unit-mg", symbol: "mg" }) : new Response(null, { status: 503 }) });
  await chooseAction("Actions for Foil", "Edit");
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("The material unit could not be loaded.")).toBeTruthy();
  available = true;
  fireEvent.click(within(dialog).getByRole("button", { name: "Retry unit" }));
  expect(await within(dialog).findByRole("spinbutton", { name: "Prescribed quantity (mg)" })).toBeTruthy();
  expect(writes).toEqual([]);
});

it("uses the new material's linked unit after switching from mass to a counted material", async () => {
  const { writes } = open();
  const dialog = await edit();
  await selectUnit("kg");
  const user = userEvent.setup();
  await user.click(within(dialog).getByRole("combobox", { name: "Component material" }));
  await user.click(await screen.findByRole("option", { name: "PM-2 - Label" }));
  expect(await within(dialog).findByRole("spinbutton", { name: "Prescribed quantity (pcs)" })).toHaveProperty("value", "2500000");
  expect(within(dialog).queryByRole("combobox", { name: "Enter quantities in" })).toBeNull();
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (pcs)" }), { target: { value: "10" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Packing allowance (pcs)" }), { target: { value: "1" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "[]")[0]).toMatchObject({ materialId: "m-label", prescribedQuantity: 10, packingExcessMargin: 1 });
  expect(writes[0]?.path).toBe(`/api/v1/product/${id}/packages`);
});

it("adds a material using its picker's linked unit and converts both quantities before saving", async () => {
  const { writes, reads } = open();
  await screen.findByText("Foil");
  fireEvent.click(await screen.findByRole("button", { name: "Add material" }));
  const dialog = await screen.findByRole("dialog");
  const user = userEvent.setup();
  await user.click(await within(dialog).findByRole("combobox", { name: "Component material" }));
  await user.click(await screen.findByRole("option", { name: "PM-3 - Liquid" }));
  await selectUnit("L");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (L)" }), { target: { value: "0.5" } });
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Packing allowance (L)" }), { target: { value: "0.025" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Add material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByText("525 ml")).toBeTruthy();
  expect(reads).not.toContain("/api/v1/material/m-liquid/uom");
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "[]")[1]).toMatchObject({ materialId: "m-liquid", prescribedQuantity: 500, packingExcessMargin: 25, loose: 25 });
});

it("keeps converted draft quantities after a failed save", async () => {
  open({ failSave: true });
  const dialog = await edit();
  await selectUnit("kg");
  fireEvent.change(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (kg)" }), { target: { value: "3.25" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("3.25 kg")).toBeTruthy();
  const reopened = await edit();
  expect(within(reopened).getByRole("spinbutton", { name: "Prescribed quantity (mg)" })).toHaveProperty("value", "3250000");
});

it("recognizes uppercase linked symbols without offering units from another family", async () => {
  open({ symbol: "ML", quantity: 1500, allowance: 25 });
  const dialog = await edit();
  expect(within(dialog).getByRole("spinbutton", { name: "Prescribed quantity (ml)" })).toHaveProperty("value", "1500");
  const user = userEvent.setup();
  await user.click(within(dialog).getByRole("combobox", { name: "Enter quantities in" }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["ml", "L"]);
});
