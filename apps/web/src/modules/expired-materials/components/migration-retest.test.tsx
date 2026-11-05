// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ExpiryDetailPage } from "./expiry-detail-page";

class ResizeObserverStub implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver = ResizeObserverStub;
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });
function open(permissions: string[], refuse = false, arNumber = "", retestDate: string | null = "2027-06-08T00:00:00Z") {
  const backend = stubBackend({ permissions });
  rememberSession();
  const writes: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (input.method === "PUT") {
      writes.push(await input.text());
      return refuse ? Response.json({ errors: [{ code: "MaterialRetest.Changed", description: "The dates changed. Reload the batch before correcting them." }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    if (new URL(input.url).pathname === "/api/v1/material/batch/b1") return Response.json({
      id: "b1", material: { name: "Starch" }, batchNumber: "MIG-1", arNumber, status: 3, isOpeningBalanceBatch: true,
      expiryDate: "2026-01-01T00:00:00Z", retestDate, effectiveExpiryDate: "2027-06-08T00:00:00Z", totalQuantity: 10,
    });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/expired-materials/:id", element: <ExpiryDetailPage /> }], { initialEntries: ["/warehouse/expired-materials/b1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return writes;
}

it("hides migration corrections without their separate permission", async () => {
  open(["CanViewExpiredMaterials"]);
  await screen.findByText("Starch");
  expect(screen.queryByRole("button", { name: "Update migration retest date" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Update migration AR number" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Update migration batch number" })).toBeNull();
});

it("requires a reason, sends expected dates and preserves the correction after a stale-record refusal", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], true);
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(writes).toHaveLength(0);
  await user.type(await screen.findByLabelText(/Correction reason/), "Migration extension supplied by the site");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("The dates changed. Reload the batch before correcting them.");
  expect(screen.getByDisplayValue("Migration extension supplied by the site")).toBeTruthy();
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ expectedRetestDate: "2027-06-08T00:00:00Z", expectedExpiryDate: "2026-01-01T00:00:00Z", reason: "Migration extension supplied by the site" });
});

it("selects only month and year and submits the month end with the exact original dates", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"]);
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  expect((await screen.findByRole("button", { name: "Retest date" })).textContent).toContain("June 2027");
  await user.click(screen.getByRole("button", { name: "Retest date" }));
  expect(screen.queryByRole("grid")).toBeNull();
  await user.click(screen.getByRole("combobox", { name: "Year" }));
  await user.click(screen.getByRole("option", { name: "2028" }));
  await user.click(screen.getByRole("combobox", { name: "Month" }));
  await user.click(screen.getByRole("option", { name: "February" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  await user.type(screen.getByLabelText(/Correction reason/), "Correct the supplied retest month");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ retestDate: "2028-02-29T00:00:00.000Z",
    expectedRetestDate: "2027-06-08T00:00:00Z", expectedExpiryDate: "2026-01-01T00:00:00Z" });
});

it("clears an incorrect extension while retaining the correction reason and expected dates", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"]);
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  await user.click(await screen.findByRole("button", { name: "Retest date" }));
  await user.click(screen.getByRole("button", { name: "Clear" }));
  await user.type(screen.getByLabelText(/Correction reason/), "Remove the incorrect extension");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ retestDate: null, expectedRetestDate: "2027-06-08T00:00:00Z",
    expectedExpiryDate: "2026-01-01T00:00:00Z", reason: "Remove the incorrect extension" });
});

it("refuses an extension month before the original expiry without sending a mutation", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"]);
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  await user.click(await screen.findByRole("button", { name: "Retest date" }));
  await user.click(screen.getByRole("combobox", { name: "Year" }));
  await user.click(screen.getByRole("option", { name: "2025" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  await user.type(screen.getByLabelText(/Correction reason/), "Correct the supplied retest month");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("The retest extension must be later than the original expiry.")).toBeTruthy();
  expect(writes).toHaveLength(0);
});

it.each(["AR-NEW", ""])("saves an optional migration AR correction (%s) with the retest date", async (arNumber) => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], false, "AR-OLD");
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  const input = await screen.findByLabelText(/^AR number/);
  expect(input).toHaveProperty("value", "AR-OLD");
  await user.clear(input);
  if (arNumber) await user.type(input, arNumber);
  await user.type(screen.getByLabelText(/Correction reason/), "Migration reference correction");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("button", { name: "Update migration retest date" });
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ arNumber, expectedArNumber: "AR-OLD", retestDate: "2027-06-08T00:00:00Z" });
});

it.each([null, "2099-01-01T12:34:56Z", "2025-01-01T00:00:00Z"])("updates only the AR number while preserving the exact retest date (%s)", async (retestDate) => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], false, "AR-OLD", retestDate);
  await screen.findByText("AR-OLD");
  await user.click(await screen.findByRole("button", { name: "Update migration AR number" }));
  expect(screen.queryByLabelText("Retest date")).toBeNull();
  const input = await screen.findByLabelText(/^AR number/);
  await user.clear(input);
  await user.type(input, "AR-ONLY");
  await user.type(screen.getByLabelText(/Correction reason/), "Correct opening balance reference");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("button", { name: "Update migration AR number" });
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}")).toMatchObject({ arNumber: "AR-ONLY", expectedArNumber: "AR-OLD", retestDate, expectedRetestDate: retestDate });
});

it("keeps an AR-only correction open after a concurrent-change refusal", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], true, "AR-OLD", null);
  await user.click(await screen.findByRole("button", { name: "Update migration AR number" }));
  await user.clear(await screen.findByLabelText(/^AR number/));
  await user.type(screen.getByLabelText(/^AR number/), "AR-DRAFT");
  await user.type(screen.getByLabelText(/Correction reason/), "Reference correction");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("The dates changed. Reload the batch before correcting them.");
  expect(writes).toHaveLength(1);
  expect(screen.getByDisplayValue("AR-DRAFT")).toBeTruthy();
  expect(screen.getByDisplayValue("Reference correction")).toBeTruthy();
});

it.each([null, "2099-01-01T12:34:56Z"])("updates only the batch number, keeping the dates and AR reference exactly (%s)", async (retestDate) => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], false, "AR-OLD", retestDate);
  await user.click(await screen.findByRole("button", { name: "Update migration batch number" }));
  expect(screen.queryByLabelText("Retest date")).toBeNull();
  expect(screen.queryByLabelText(/^AR number/)).toBeNull();
  const input = await screen.findByLabelText(/^Batch number/);
  expect(input).toHaveProperty("value", "MIG-1");
  await user.clear(input);
  await user.type(screen.getByLabelText(/Correction reason/), "Spreadsheet turned the batch into a date");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("Enter the batch number")).toBeTruthy();
  expect(writes).toHaveLength(0);
  await user.type(input, "RMA016");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("button", { name: "Update migration batch number" });
  expect(writes).toHaveLength(1);
  const body = JSON.parse(writes[0] ?? "{}");
  expect(body).toMatchObject({ batchNumber: "RMA016", expectedBatchNumber: "MIG-1", retestDate, expectedRetestDate: retestDate });
  expect(body).not.toHaveProperty("arNumber");
});
