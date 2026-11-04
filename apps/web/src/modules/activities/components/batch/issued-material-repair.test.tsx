// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import RepairDialog from "./issued-material-repair-dialog";
import { IssuedMaterialRepairMenu } from "./issued-material-repair-menu";

afterEach(() => { cleanup(); forgetSession(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const token = "a".repeat(64);
const makePreview = () => ({ batchId: "b1", batchNumber: "BFC4K338", kind: 1, requisitionCode: "PM/26/001", previewToken: token,
  canApply: true, hasChanges: true, blockers: [] as string[], history: [], rows: [
    { materialId: "m1", code: "PMF015", name: "Amoxicillin foil", unit: "mg", approvedQuantity: 22.5, beforeQuantity: 22.5,
      targetQuantity: 22_500_000, adjustment: 22_499_977.5, availableQuantity: 100_000_000,
      lots: [{ materialBatchId: "lot1", shelfId: "s1", batchNumber: "FOIL-LOT", adjustment: 22_499_977.5 }] },
    { materialId: "m2", code: "PMF093", name: "PVC", unit: "mg", approvedQuantity: 95, beforeQuantity: 95,
      targetQuantity: 95_000_000, adjustment: 94_999_905, availableQuantity: 100_000_000,
      lots: [{ materialBatchId: "lot2", shelfId: "s1", batchNumber: "PVC-LOT", adjustment: 94_999_905 }] },
  ] });

function open({ permission = true, menu = false, preview = makePreview(), failFirst = false, malformed = false } = {}) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts", ...(permission ? ["CanRepairIssuedPackaging"] : [])] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const calls: { method: string; path: string; body: string }[] = [];
  const saved = { closed: false };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/production-schedule/b1/issued-material-repair/1") {
      if (input.method === "GET") return Response.json(malformed ? { rows: null } : preview);
      calls.push({ method: input.method, path, body: await input.clone().text() });
      if (failFirst && calls.length === 1) return Response.json({ errors: [{ code: "Repair.StalePreview", description: "The stock changed. Reload the preview." }] }, { status: 409 });
      return Response.json({ applied: true, alreadyApplied: false, repairId: "repair-1" });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: menu ? <IssuedMaterialRepairMenu batchId="b1" /> :
    <RepairDialog batchId="b1" kind={1} onClose={() => { saved.closed = true; }} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, saved, backend };
}

it("previews corrected kg quantities and submits the reviewed stock difference once with an audit reason", async () => {
  const { calls, saved } = open();
  expect(await screen.findByText("PMF015")).toBeTruthy();
  expect(screen.getByText("22.5 kg")).toBeTruthy();
  expect(screen.getByText("95 kg")).toBeTruthy();
  expect(screen.getByText("22,499,977.5 mg")).toBeTruthy();
  expect(screen.getByText("94,999,905 mg")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  expect(await screen.findByText("Record why this issued stock needs correcting")).toBeTruthy();
  expect(calls).toHaveLength(0);
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Correct kg quantities entered as mg" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  await waitFor(() => expect(saved.closed).toBe(true));
  expect(calls).toHaveLength(1);
  expect(JSON.parse(calls[0]?.body ?? "null")).toMatchObject({ previewToken: token, reason: "Correct kg quantities entered as mg" });
  expect(JSON.parse(calls[0]?.body ?? "null").requestId).toMatch(/^[a-f0-9-]{36}$/);
});

it("requires a fresh review after a refused write and retains the reason and request ID on retry", async () => {
  const { calls, saved } = open({ failFirst: true });
  await screen.findByText("PMF015");
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Correct the packaging units" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  expect(await screen.findByText("The stock changed. Reload the preview.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply stock repair" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("textbox", { name: /Repair reason/ })).toHaveProperty("value", "Correct the packaging units");
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Apply stock repair" })).toHaveProperty("disabled", false));
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  await waitFor(() => expect(saved.closed).toBe(true));
  expect(calls).toHaveLength(2);
  expect(calls[1]?.body).toBe(calls[0]?.body);
});

it("blocks an entire repair when the server reports insufficient stock", async () => {
  const preview = makePreview(); preview.canApply = false; preview.blockers = ["PMF093: insufficient eligible stock for the additional requirement."];
  const { calls } = open({ preview });
  expect(await screen.findByText(preview.blockers[0] ?? "")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply stock repair" })).toHaveProperty("disabled", true);
  expect(calls).toHaveLength(0);
});

it("rejects unreadable evidence and reports an already reconciled batch without enabling stock writes", async () => {
  const { calls } = open({ malformed: true });
  expect(await screen.findByText(/unreadable repair preview/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply stock repair" })).toHaveProperty("disabled", true);
  expect(calls).toHaveLength(0);
});

it("hides post-issue actions without their own permission", async () => {
  open({ permission: false, menu: true });
  await waitFor(() => expect(screen.queryByRole("button", { name: "Repair issued stock" })).toBeNull());
});

it("shows only permitted repair choices", async () => {
  open({ menu: true });
  const button = await screen.findByRole("button", { name: "Repair issued stock" });
  fireEvent.pointerDown(button, { button: 0, ctrlKey: false });
  expect(await screen.findByRole("menuitem", { name: "Repair packaging after issue" })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: "Repair BOM after issue" })).toBeNull();
});


it("submits and retries the same repair on HTTP where randomUUID is unavailable", async () => {
  const cryptoApi = globalThis.crypto;
  const randomBytes = vi.fn(cryptoApi.getRandomValues.bind(cryptoApi));
  vi.stubGlobal("crypto", { getRandomValues: randomBytes });
  const { calls, saved } = open({ failFirst: true });
  await screen.findByText("PMF015");
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Correct packaging units on the customer intranet" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  await screen.findByText("The stock changed. Reload the preview.");
  const request = JSON.parse(calls[0]?.body ?? "null");
  expect(request.requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(randomBytes).toHaveBeenCalled();
  expect(request.previewToken).toBe(token);
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Apply stock repair" })).toHaveProperty("disabled", false));
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  await waitFor(() => expect(saved.closed).toBe(true));
  expect(calls).toHaveLength(2);
  expect(calls[1]?.body).toBe(calls[0]?.body);
});

it("handles an ID-generation failure without posting stock or trapping the repair dialog", async () => {
  const { calls, saved } = open();
  await screen.findByText("PMF015");
  vi.stubGlobal("crypto", { getRandomValues: () => { throw new Error("Random source unavailable"); } });
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Correct the issued packaging units" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply stock repair" }));
  await screen.findByText("The repair response could not be confirmed. Reload the saved stock before retrying.");
  expect(calls).toHaveLength(0);
  fireEvent.click(screen.getByText("Close", { selector: "button" }));
  await waitFor(() => expect(saved.closed).toBe(true));
});
