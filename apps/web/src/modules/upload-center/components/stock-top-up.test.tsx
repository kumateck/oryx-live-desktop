// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { StockTopUpTab } from "./stock-top-up-tab";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

function open(uploadPermission = true, refuse = false) {
  const backend = stubBackend({ permissions: ["CanViewOpeningBalances", ...(uploadPermission ? ["CanUploadOpeningBalances"] : [])] });
  rememberSession();
  const calls: { path: string; search: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") {
      calls.push({ path: url.pathname, search: url.search, body: await input.text() });
      return new Response(JSON.stringify(refuse ? { errors: [{ code: "StockMigration.TestRefusal", description: "Stock draft was refused" }] } : "draft-1"), { status: refuse ? 409 : 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  });
  const router = createMemoryRouter([
    { path: "/", element: <StockTopUpTab /> },
    { path: "/settings/upload-center/stock-migrations/:id", element: <p>Review saved top-up</p> },
  ]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

async function ready() {
  await waitFor(() => expect(screen.getByRole("button", { name: "Save top-up draft" })).toHaveProperty("disabled", false));
  await screen.findByLabelText(/^Reason for migration top-up/);
}

async function addLine() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Add stock line" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByLabelText(/^Material code/), "RM001");
  await user.type(within(dialog).getByLabelText(/^Batch number/), "B-2026-02");
  await user.type(within(dialog).getByLabelText(/^Base UOM/), "mg");
  await user.type(within(dialog).getByLabelText(/^Quantity/), "1.23456789");
  await user.type(within(dialog).getByLabelText(/^GRN reference/), "GRN-02");
  await user.type(within(dialog).getByLabelText(/^AR number/), "AR-02");
  await user.click(within(dialog).getByRole("button", { name: "Keep line" }));
  await screen.findByText("B-2026-02");
}

it.each([false, true])("saves manual top-up lines with batch evidence (HTTP fallback: %s)", async (http) => {
  if (http) vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto), subtle: crypto.subtle });
  const user = userEvent.setup();
  const calls = open();
  await ready();
  await user.click(await screen.findByRole("button", { name: "Save top-up draft" }));
  expect(await screen.findByText("Enter the reason for this top-up")).toBeTruthy();
  expect(calls).toHaveLength(0);
  await user.type(screen.getByLabelText(/^Reason for migration top-up/), "Additional stock after migration");
  await addLine();
  expect(screen.getByText("1.23456789")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save top-up draft" }));
  expect(await screen.findByText("Review saved top-up")).toBeTruthy();
  expect(calls).toHaveLength(1);
  expect(calls[0]?.path).toBe("/api/v1/stock-migrations/top-ups");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ reason: "Additional stock after migration", massUnit: "mg", volumeUnit: "ml",
    lines: [{ materialCode: "RM001", batchNumber: "B-2026-02", quantityInSheet: 1.23456789, grn: "GRN-02", arNumber: "AR-02" }] });
}, 30_000);

it("keeps entered lines and reason when saving fails", async () => {
  const user = userEvent.setup();
  const calls = open(true, true);
  await ready();
  await user.type(await screen.findByLabelText(/^Reason for migration top-up/), "Missed stock");
  await addLine();
  await user.click(screen.getByRole("button", { name: "Save top-up draft" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(await screen.findByText("Stock draft was refused")).toBeTruthy();
  expect(screen.getByText("B-2026-02")).toBeTruthy();
  expect(screen.getByLabelText(/^Reason for migration top-up/)).toHaveProperty("value", "Missed stock");
}, 30_000);

it("uploads Excel as an additive draft with the required reason", async () => {
  const user = userEvent.setup();
  const calls = open();
  await ready();
  await user.type(await screen.findByLabelText(/^Reason for migration top-up/), "New batch from migration review");
  await user.click(screen.getByRole("tab", { name: "Upload Excel" }));
  await user.upload(await screen.findByLabelText(/Choose a file or drag and drop/, { selector: "input" }), new File(["stock"], "topup.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  await user.click(screen.getByRole("button", { name: "Save top-up draft" }));
  expect(await screen.findByText("Review saved top-up")).toBeTruthy();
  expect(calls[0]?.path).toBe("/api/v1/stock-migrations/top-ups/upload");
  expect(new URLSearchParams(calls[0]?.search).get("reason")).toBe("New batch from migration review");
  expect(calls[0]?.body).toContain('name="file"');
}, 30_000);

it("lets a reviewer see history without creating top-ups", async () => {
  open(false);
  expect(await screen.findByRole("button", { name: "Save top-up draft" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Add stock line" })).toHaveProperty("disabled", true);
  expect(await screen.findByText("No migration top-ups yet")).toBeTruthy();
});

it("adds and saves a top-up line without batch or AR numbers", async () => {
  const user = userEvent.setup();
  const calls = open();
  await ready();
  await user.type(screen.getByLabelText(/^Reason for migration top-up/), "Unnumbered stock found");
  await user.click(screen.getByRole("button", { name: "Add stock line" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByLabelText(/^Material code/), "RM002");
  await user.type(within(dialog).getByLabelText(/^Base UOM/), "mg");
  await user.type(within(dialog).getByLabelText(/^Quantity/), "2.5");
  await user.click(within(dialog).getByRole("button", { name: "Keep line" }));
  await screen.findByText("RM002");
  await user.click(screen.getByRole("button", { name: "Save top-up draft" }));
  await screen.findByText("Review saved top-up");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ lines: [{ materialCode: "RM002", batchNumber: "", arNumber: null, quantityInSheet: 2.5 }] });
});
