// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import RepairDialog from "./reservation-repair-dialog";
import { ReservationRepair } from "./reservation-repair";

afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });
const token = "a".repeat(64);
const makePreview = () => ({ batchId: "b1", batchNumber: "BFC4K338", migrationId: "migration-1", migrationFile: "Approved replacement.xlsx",
  previewToken: token, canApply: true, hasChanges: true, blockers: [] as string[], history: [], rows: [
    { reservationId: "r1", requisitionCode: "PM/26/001", materialCode: "PMF015", materialName: "Amoxicillin foil", unit: "mg",
      quantity: 22_500_000, oldBatchId: "old1", oldBatchNumber: "OLD-LOT", oldShelf: "Previous shelf",
      candidates: [{ batchId: "new1", batchNumber: "REPLACEMENT-LOT", shelfId: "s1", shelf: "Shelf A", availableQuantity: 100_000_000 }] },
  ] });

function open({ permission = true, button = false, preview = makePreview(), failFirst = false, malformed = false, badReceipt = false } = {}) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts", "CanRepairIssuedBom", "CanRepairIssuedPackaging",
    ...(permission ? ["CanRepairStockReservations"] : [])] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const calls: string[] = [];
  let previews = 0;
  const saved = { closed: false };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/production-schedule/b1/reservation-repair") {
      if (input.method === "GET") { previews++; return Response.json(malformed ? { rows: null } : preview); }
      const body = await input.clone().text(); calls.push(body);
      if (failFirst && calls.length === 1)
        return Response.json({ errors: [{ code: "ReservationRepair.StalePreview", description: "The reservations changed. Reload the preview." }] }, { status: 409 });
      const request: { requestId: string } = JSON.parse(body);
      return Response.json(badReceipt ? {} : { alreadyApplied: false, repairId: request.requestId });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: button ? <ReservationRepair batchId="b1" /> :
    <RepairDialog batchId="b1" onClose={() => { saved.closed = true; }} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, saved, getPreviews: () => previews };
}

it("reviews replacement evidence and requires a reason before applying once", async () => {
  const { calls, saved } = open();
  expect(await screen.findByText("REPLACEMENT-LOT")).toBeTruthy();
  expect(screen.getByText("Approved replacement.xlsx")).toBeTruthy();
  expect(screen.getByText("OLD-LOT")).toBeTruthy();
  expect(screen.getByText("22.5 kg")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Apply reservation repair" }));
  expect(await screen.findByText(/Explain why these reservations/)).toBeTruthy(); expect(calls).toHaveLength(0);
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Repair reservations after stock replacement" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply reservation repair" }));
  await waitFor(() => expect(saved.closed).toBe(true)); expect(calls).toHaveLength(1);
  expect(JSON.parse(calls[0] ?? "null")).toMatchObject({ previewToken: token, reason: "Repair reservations after stock replacement" });
});

it.each([false, true])("retains the reviewed request identity after reload and retry, including intranet HTTP (%s)", async (http) => {
  if (http) vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto), subtle: crypto.subtle });
  const { calls, saved } = open({ failFirst: true }); await screen.findByText("REPLACEMENT-LOT");
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Repair reservations after stock replacement" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply reservation repair" }));
  expect(await screen.findByText("The reservations changed. Reload the preview.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply reservation repair" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Apply reservation repair" })).toHaveProperty("disabled", false));
  fireEvent.click(screen.getByRole("button", { name: "Apply reservation repair" }));
  await waitFor(() => expect(saved.closed).toBe(true)); expect(calls).toHaveLength(2); expect(calls[1]).toBe(calls[0]);
});

it("does not grant reservation repair through BOM or packaging repair access", async () => {
  const state = open({ permission: false, button: true });
  await waitFor(() => expect(screen.queryByRole("button", { name: "Repair stock reservations" })).toBeNull());
  expect(state.getPreviews()).toBe(0); expect(state.calls).toHaveLength(0);
});

it("fetches no reservation evidence before the permitted batch action is opened", async () => {
  const state = open({ button: true });
  const button = await screen.findByRole("button", { name: "Repair stock reservations" });
  expect(state.getPreviews()).toBe(0); fireEvent.click(button);
  expect(await screen.findByText("REPLACEMENT-LOT")).toBeTruthy(); expect(state.getPreviews()).toBe(1);
});

it("blocks insufficient or ambiguous stock without submitting", async () => {
  const preview = makePreview(); preview.canApply = false; preview.blockers = ["Replacement stock is insufficient across the waiting queue"];
  const { calls } = open({ preview }); expect(await screen.findByText(preview.blockers[0] ?? "")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply reservation repair" })).toHaveProperty("disabled", true); expect(calls).toHaveLength(0);
});

it.each(["unreadable", "wrong batch", "inconsistent candidates"])("refuses %s preview evidence", async (kind) => {
  const preview = makePreview(); if (kind === "wrong batch") preview.batchId = "other-batch";
  if (kind === "inconsistent candidates" && preview.rows[0]) preview.rows[0].candidates = [];
  const { calls } = open({ preview, malformed: kind === "unreadable" });
  expect(await screen.findByText(/unreadable reservation preview/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply reservation repair" })).toHaveProperty("disabled", true); expect(calls).toHaveLength(0);
});

it("does not claim success when the server receipt is unreadable", async () => {
  const { saved } = open({ badReceipt: true }); await screen.findByText("REPLACEMENT-LOT");
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Repair reservations after stock replacement" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply reservation repair" }));
  expect(await screen.findByText(/repair receipt could not be confirmed/)).toBeTruthy(); expect(saved.closed).toBe(false);
});

it("shows the no-change state and prevents writes", async () => {
  const preview = makePreview(); preview.canApply = false; preview.hasChanges = false; preview.rows = [];
  const { calls } = open({ preview }); expect(await screen.findByText(/no migration reservations needing repair/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply reservation repair" })).toHaveProperty("disabled", true); expect(calls).toHaveLength(0);
});
