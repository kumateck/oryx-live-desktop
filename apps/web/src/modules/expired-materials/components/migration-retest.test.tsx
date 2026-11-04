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
function open(permissions: string[], refuse = false) {
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
      id: "b1", material: { name: "Starch" }, batchNumber: "MIG-1", status: 3, isOpeningBalanceBatch: true,
      expiryDate: "2026-01-01T00:00:00Z", retestDate: "2027-06-08T00:00:00Z", effectiveExpiryDate: "2027-06-08T00:00:00Z", totalQuantity: 10,
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
});

it("requires a reason, sends expected dates and preserves the correction after a stale-record refusal", async () => {
  const user = userEvent.setup();
  const writes = open(["CanViewExpiredMaterials", "CanUpdateMigrationRetestDate"], true);
  await user.click(await screen.findByRole("button", { name: "Update migration retest date" }));
  await user.click(screen.getByRole("button", { name: "Save retest date" }));
  expect(writes).toHaveLength(0);
  await user.type(await screen.findByLabelText(/Correction reason/), "Migration extension supplied by the site");
  await user.click(screen.getByRole("button", { name: "Save retest date" }));
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
  await user.click(screen.getByRole("button", { name: "Save retest date" }));
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
  await user.click(screen.getByRole("button", { name: "Save retest date" }));
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
  await user.click(screen.getByRole("button", { name: "Save retest date" }));
  expect(await screen.findByText("The retest extension must be later than the original expiry.")).toBeTruthy();
  expect(writes).toHaveLength(0);
});
