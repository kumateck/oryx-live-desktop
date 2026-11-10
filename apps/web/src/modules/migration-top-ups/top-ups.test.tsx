// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { TopUpEntryPage } from "./components/top-up-entry-page";
import { TopUpsPage } from "./components/top-ups-page";
import { sameLot, topUpLineRequest, type TopUpLine } from "./lib/top-up";
import { topUpLineFormSchema } from "./schemas/top-up-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const materials = { data: [
  { material: { id: "m-amaranth", code: "RMA016", name: "Amaranth (W/S)" }, uoM: { symbol: "mg" } },
  { material: { id: "m-nolink", code: "RMA099", name: "Unlinked dye" }, uoM: null },
  { material: { id: "m-cap", code: "PMC010", name: "Bottle cap 28 mm" }, uoM: { symbol: "pcs" } },
], pageIndex: 1, pageCount: 1 };
const shelves = [{ id: "s-b2", name: "B2", code: "RM/B2", warehouseLocationRack: { name: "Rack B", warehouseLocation: { name: "Room 1", warehouse: { name: "Raw store" } } } }];

function open(path: string, { upload = true, refuse = false } = {}) {
  const backend = stubBackend({ permissions: ["CanViewOpeningBalances", ...(upload ? ["CanUploadOpeningBalances"] : [])] });
  rememberSession();
  const calls: { path: string; body: unknown }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method === "POST") {
      calls.push({ path: url.pathname, body: JSON.parse(await input.text()) });
      return refuse ? json({ errors: [{ code: "StockMigration.Lines", description: "Enter between 1 and 1,000 stock rows." }] }, 400) : json("draft-7");
    }
    if (url.pathname === "/api/v1/material/department") return json(materials);
    if (url.pathname === "/api/v1/warehouse/shelf/by-department") return json(shelves);
    return json([]);
  });
  const router = createMemoryRouter([
    { path: "/warehouse/migration-top-ups", element: <TopUpsPage /> },
    { path: "/warehouse/migration-top-ups/new", element: <TopUpEntryPage /> },
    { path: "/warehouse/migration-top-ups/:id", element: <p>Top-up review page</p> },
  ], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

async function addLine(batch: string, quantity = "2.5") {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Add stock line" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /^Material/ }, { timeout: 5000 }));
  await user.click(await screen.findByRole("option", { name: "RMA016 · Amaranth (W/S)" }));
  await user.type(within(dialog).getByLabelText(/^Batch number/), batch);
  await user.type(within(dialog).getByLabelText(/^AR number/), "AR/RM/0912");
  await user.click(within(dialog).getByRole("combobox", { name: /^Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "B2 — Rack B · Raw store" }));
  await user.click(within(dialog).getByRole("combobox", { name: "Enter quantities in" }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity in stock \(kg\)/ }), quantity);
  await user.click(within(dialog).getByRole("button", { name: "Add to list" }));
  return dialog;
}

describe("warehouse migration stock top-up", () => {
  it("uses month and year pickers for manufacturing, expiry and retest", async () => {
    const user = userEvent.setup();
    open("/warehouse/migration-top-ups/new");
    await user.click(await screen.findByRole("button", { name: "Add stock line" }));
    for (const name of ["Manufacturing month", "Expiry month", "Retest month"]) {
      await user.click(await screen.findByRole("button", { name }));
      expect(screen.getByRole("combobox", { name: "Year" })).toBeTruthy();
      expect(screen.getByRole("combobox", { name: "Month" })).toBeTruthy();
      expect(screen.queryByRole("grid")).toBeNull();
      await user.click(screen.getByRole("button", { name: "Apply" }));
    }
  });

  it("adds lots picked from the system and submits them only after the irreversible warning is acknowledged", async () => {
    const user = userEvent.setup();
    const calls = open("/warehouse/migration-top-ups/new");
    await user.type(await screen.findByLabelText(/^Reason for this top-up/), "Order received in August, missed by the opening count");
    await addLine("LOT-0825");
    expect(await screen.findByText("LOT-0825")).toBeTruthy();
    expect(screen.getByText("2.5 kg")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Submit for approval" }));
    const confirm = await screen.findByRole("dialog");
    expect(within(confirm).getByText(/Adding stock cannot be reversed/)).toBeTruthy();
    const send = within(confirm).getByRole("button", { name: "Submit for approval" });
    expect(send).toHaveProperty("disabled", true);
    await user.click(within(confirm).getByRole("checkbox"));
    await user.click(send);
    expect(await screen.findByText("Top-up review page")).toBeTruthy();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.path).toBe("/api/v1/stock-migrations/top-ups");
    expect(calls[0]?.body).toMatchObject({ departmentId: "558da105-a506-44a9-8ff5-8d005a54f294", exactDates: false, massUnit: "mg", volumeUnit: "ml",
      reason: "Order received in August, missed by the opening count",
      lines: [{ materialId: "m-amaranth", materialCode: "RMA016", shelfId: "s-b2", batchNumber: "LOT-0825", arNumber: "AR/RM/0912",
        unitSymbol: "mg", quantityInSheet: 2_500_000, expiryDate: null, retestDate: null }] });
  }, 40_000);

  it("refuses a repeated batch, an empty list and a short reason before anything is sent", async () => {
    const user = userEvent.setup();
    const calls = open("/warehouse/migration-top-ups/new");
    expect(await screen.findByRole("button", { name: "Submit for approval" })).toHaveProperty("disabled", true);
    await user.type(screen.getByLabelText(/^Reason for this top-up/), "Too short");
    await addLine("LOT-1");
    await screen.findByText("LOT-1");
    const dialog = await addLine("lot-1");
    expect(await within(dialog).findByText("This batch of this material is already in the list. Edit that line instead.")).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Submit for approval" }));
    expect(await screen.findByText(/at least 10 characters/)).toBeTruthy();
    expect(calls).toHaveLength(0);
  }, 40_000);

  it("keeps the list when the server refuses it", async () => {
    const user = userEvent.setup();
    const calls = open("/warehouse/migration-top-ups/new", { refuse: true });
    await user.type(await screen.findByLabelText(/^Reason for this top-up/), "Stock missed by the opening count");
    await addLine("LOT-9");
    await user.click(await screen.findByRole("button", { name: "Submit for approval" }));
    const confirm = await screen.findByRole("dialog");
    await user.click(within(confirm).getByRole("checkbox"));
    await user.click(within(confirm).getByRole("button", { name: "Submit for approval" }));
    await waitFor(() => expect(calls).toHaveLength(1));
    expect(await screen.findByText("Enter between 1 and 1,000 stock rows.")).toBeTruthy();
    expect(screen.getByText("LOT-9")).toBeTruthy();
  }, 40_000);

  it("adds a packaging line with no batch or AR number, in its fixed counted unit", async () => {
    const user = userEvent.setup();
    const calls = open("/warehouse/migration-top-ups/new");
    await user.type(await screen.findByLabelText(/^Reason for this top-up/), "Caps received before go-live without a batch number");
    await user.click(await screen.findByRole("button", { name: "Add stock line" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: "Packaging" }));
    await user.click(await within(dialog).findByRole("combobox", { name: /^Material/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("option", { name: "PMC010 · Bottle cap 28 mm" }));
    await user.click(within(dialog).getByRole("combobox", { name: /^Shelf/ }));
    await user.click(await screen.findByRole("option", { name: "B2 — Rack B · Raw store" }));
    expect(within(dialog).getByText("pcs", { selector: "strong" })).toBeTruthy();
    expect(within(dialog).queryByRole("combobox", { name: "Enter quantities in" })).toBeNull();
    await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity in stock \(pcs\)/ }), "1200");
    await user.click(within(dialog).getByRole("button", { name: "Add to list" }));
    expect(await screen.findByText("No batch number")).toBeTruthy();
    // A second line without a batch number is a separate lot, not a repeat.
    await user.click(screen.getByRole("button", { name: "Add stock line" }));
    const second = await screen.findByRole("dialog");
    await user.click(within(second).getByRole("radio", { name: "Packaging" }));
    await user.click(await within(second).findByRole("combobox", { name: /^Material/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("option", { name: "PMC010 · Bottle cap 28 mm" }));
    await user.click(within(second).getByRole("combobox", { name: /^Shelf/ }));
    await user.click(await screen.findByRole("option", { name: "B2 — Rack B · Raw store" }));
    await user.type(within(second).getByRole("spinbutton", { name: /Quantity in stock \(pcs\)/ }), "300");
    await user.click(within(second).getByRole("button", { name: "Add to list" }));
    await waitFor(() => expect(screen.getAllByText("No batch number")).toHaveLength(2));
    await user.click(screen.getByRole("button", { name: "Submit for approval" }));
    const confirm = await screen.findByRole("dialog");
    await user.click(within(confirm).getByRole("checkbox"));
    await user.click(within(confirm).getByRole("button", { name: "Submit for approval" }));
    await screen.findByText("Top-up review page");
    expect(calls[0]?.body).toMatchObject({ lines: [{ materialId: "m-cap", batchNumber: "", arNumber: null, unitSymbol: "pcs", quantityInSheet: 1200 },
      { materialId: "m-cap", batchNumber: "", quantityInSheet: 300 }] });
  }, 60_000);

  it("blocks a material with no department unit", async () => {
    const user = userEvent.setup();
    open("/warehouse/migration-top-ups/new");
    await user.click(await screen.findByRole("button", { name: "Add stock line" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(await within(dialog).findByRole("combobox", { name: /^Material/ }, { timeout: 5000 }));
    await user.click(await screen.findByRole("option", { name: "RMA099 · Unlinked dye" }));
    expect(await within(dialog).findByText(/no unit on its department link, so its quantity cannot be entered/)).toBeTruthy();
  }, 30_000);

  it("shows the list without the new button to someone who cannot enter stock", async () => {
    open("/warehouse/migration-top-ups", { upload: false });
    expect(await screen.findByText("No migration top-ups yet")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "New top-up" })).toBeNull();
  });

  it("offers the new button to someone who can enter stock", async () => {
    open("/warehouse/migration-top-ups");
    expect(await screen.findByRole("link", { name: "New top-up" })).toBeTruthy();
  });
});

describe("top-up line rules", () => {
  const line: TopUpLine = { key: "a", kind: 0, material: { id: "m", code: "RM", name: "Raw" }, unit: "mg", quantity: 1500, shelf: { id: "s", label: "S" },
    batchNumber: "B1", arNumber: "", grn: "GRN-5", manufactured: "2026-08", expiry: "2029-07", retest: "2027-08" };

  it("sends month boundaries, the retest month and counted units unchanged", () => {
    expect(topUpLineRequest(line)).toMatchObject({ quantityInSheet: 1500, arNumber: null, grn: "GRN-5",
      manufacturingDate: "2026-08-01T00:00:00.000Z", expiryDate: "2029-07-31T00:00:00.000Z", retestDate: "2027-08-31T00:00:00.000Z" });
    expect(topUpLineRequest({ ...line, unit: "pcs", quantity: 120 }).quantityInSheet).toBe(120);
    expect(topUpLineRequest({ ...line, unit: "L", quantity: 2 }).quantityInSheet).toBe(2000);
  });

  it("matches lots by material and batch regardless of case", () => {
    expect(sameLot(line, { ...line, batchNumber: " b1 " })).toBe(true);
    expect(sameLot(line, { ...line, material: { ...line.material, id: "other" } })).toBe(false);
    expect(sameLot({ ...line, batchNumber: "" }, { ...line, batchNumber: " " })).toBe(false);
  });

  it("keeps the retest date within the lot's life", () => {
    const base = { kind: "0", material: { value: "m", label: "RM" }, shelf: { value: "s", label: "S" }, batchNumber: "B1", arNumber: "", grn: "", quantity: 1 } as const;
    const issues = (values: object) => topUpLineFormSchema.safeParse({ ...base, manufactured: null, expiry: null, retest: null, ...values }).error?.issues.map((issue) => issue.message) ?? [];
    expect(issues({ expiry: "2028-01", retest: "2028-02" })).toContain("The retest date cannot be after the expiry date");
    expect(issues({ manufactured: "2026-05", retest: "2026-04" })).toContain("The retest date cannot be before the manufacturing date");
    expect(issues({ manufactured: "2026-05", expiry: "2026-04" })).toContain("The expiry date cannot be before the manufacturing date");
    expect(issues({ manufactured: "2999-01" })).toContain("The manufacturing date cannot be in the future");
    expect(issues({ expiry: "2029-01", retest: "2027-01" })).toEqual([]);
    expect(issues({ manufactured: "2026-02", expiry: "2026-02", retest: "2026-02" })).toEqual([]);
  });
});
