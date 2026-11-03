// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { RouteAccess } from "@/components/shell/route-access";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction, openMenu } from "@/test/menu";
import { IssuedBmrPage } from "./components/issued-bmr-page";
import { issuedBmrPermissions as p } from "./lib/access";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const made = "2026-01-01T00:00:00Z";
const expires = "2028-01-31T00:00:00Z";

function open(permissions: string[], { refuse = false, self = false }: { refuse?: boolean; self?: boolean } = {}) {
  const backend = stubBackend({ permissions }); rememberSession();
  const writes: { path: string; body: string }[] = []; const reads: string[] = [];
  const row = { id: "bmr-1", scheduleProductId: "batch-1", productId: "product-1", productName: "Zinvite", productCode: "P1",
    departmentName: "Production", scheduleCode: "PS1", batchNumber: "BATCH-1", manufacturingDate: made, expiryDate: expires,
    issuedAt: "2026-02-01T00:00:00Z", isRetired: false, pendingRevisions: 0 };
  const revision = { id: "revision-1", requestedByName: "Requester", requestedAt: "2026-11-03T00:00:00Z", reason: "Verify source expiry",
    batchNumber: "BATCH-1", previousManufacturingDate: made, previousExpiryDate: expires, manufacturingDate: made, expiryDate: "2029-01-31T00:00:00Z",
    status: 0, reviewedByName: null, reviewedAt: null, reviewReason: null, isRequester: self };
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") {
      const body = await input.clone().text(); writes.push({ path, body });
      if (refuse) return Response.json({ errors: [{ code: "IssuedBmr.Changed", description: "The batch details changed. Reload before continuing." }] }, { status: 409 });
      if (path.endsWith("/batch-number")) row.batchNumber = "BATCH-NEW";
      if (path.endsWith("/revisions")) { row.pendingRevisions = 1; return Response.json("revision-1"); }
      if (path.endsWith("/review")) { revision.status = 1; row.pendingRevisions = 0; row.expiryDate = revision.expiryDate; }
      return new Response(null, { status: 204 });
    }
    reads.push(path);
    if (path === "/api/v1/issued-bmrs") return Response.json({ data: [row], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path.endsWith("/history")) return Response.json({ changes: [], revisions: [revision] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/issued-bmrs", element: <RouteAccess><IssuedBmrPage /></RouteAccess> }], { initialEntries: ["/qa/issued-bmrs"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}

it("denies the issued-only list before fetching without its dedicated permission", async () => {
  const { reads } = open(["CanViewIssuedBmrBprs", "CanIssueBmr"]);
  expect(await screen.findByRole("heading", { name: "You don't have access to this page" })).toBeTruthy();
  expect(reads).toEqual([]);
});

it("shows the issued list but hides correction and revision actions from a viewer", async () => {
  const { writes } = open([p.view]);
  await openMenu("Actions for BATCH-1");
  expect(screen.queryByRole("menuitem", { name: "Correct batch number" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Request date revision" })).toBeNull();
  expect(screen.getByRole("menuitem", { name: "History and revisions" })).toBeTruthy();
  expect(writes).toEqual([]);
});

it("corrects only the number and reason with current-value evidence, then refreshes the list", async () => {
  const { writes } = open([p.view, p.correct]);
  const user = userEvent.setup();
  await chooseAction("Actions for BATCH-1", "Correct batch number");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByText("Manufacturing month")).toBeNull();
  await user.clear(await within(dialog).findByRole("textbox", { name: "Batch number" }));
  await user.type(within(dialog).getByRole("textbox", { name: "Batch number" }), "BATCH-NEW");
  await user.type(within(dialog).getByRole("textbox", { name: "Correction reason" }), "Correct source transcription");
  await user.click(within(dialog).getByRole("button", { name: "Save typo correction" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}")).toEqual({ batchNumber: "BATCH-NEW", reason: "Correct source transcription",
    expectedBatchNumber: "BATCH-1", expectedManufacturingDate: made, expectedExpiryDate: expires });
  expect(await screen.findByText("BATCH-NEW")).toBeTruthy();
});

it("keeps a refused correction and its reason available for review", async () => {
  const { writes } = open([p.view, p.correct], { refuse: true }); const user = userEvent.setup();
  await chooseAction("Actions for BATCH-1", "Correct batch number");
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("textbox", { name: "Correction reason" }), "Original source was checked");
  await user.click(within(dialog).getByRole("button", { name: "Save typo correction" }));
  expect(await within(dialog).findByRole("alert")).toHaveProperty("textContent", "The batch details changed. Reload before continuing.");
  expect(within(dialog).getByRole("textbox", { name: "Correction reason" })).toHaveProperty("value", "Original source was checked");
  expect(writes).toHaveLength(1);
});

it("requests a date revision without applying a correction or exposing a batch-number input", async () => {
  const { writes } = open([p.view, p.revise]); const user = userEvent.setup();
  await chooseAction("Actions for BATCH-1", "Request date revision");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("textbox", { name: "Batch number" })).toBeNull();
  await user.click(await within(dialog).findByRole("button", { name: /Expiry month/ }));
  await user.click(screen.getByRole("combobox", { name: "Year" }));
  await user.click(await screen.findByRole("option", { name: "2029" }));
  await user.click(screen.getByRole("button", { name: "Apply" }));
  await user.type(within(dialog).getByRole("textbox", { name: "Revision reason" }), "Expiry was transcribed incorrectly");
  await user.click(within(dialog).getByRole("button", { name: "Request revision" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(writes[0]?.path).toBe("/api/v1/issued-bmrs/bmr-1/revisions");
  expect(JSON.parse(writes[0]?.body ?? "{}")).toMatchObject({ expectedBatchNumber: "BATCH-1", expectedExpiryDate: expires,
    manufacturingDate: "2026-01-01T00:00:00.000Z", expiryDate: "2029-01-31T00:00:00.000Z" });
  expect(await screen.findByText("Pending approval")).toBeTruthy();
});

it("allows a separate approver to review the recorded dates and approve with a reason", async () => {
  const { writes } = open([p.view, p.approve]); const user = userEvent.setup();
  await chooseAction("Actions for BATCH-1", "History and revisions");
  await openMenu("Review revision for BATCH-1");
  fireEvent.click(screen.getByRole("menuitem", { name: "Approve revision" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/Manufacturing:.*Expiry:/)).toBeTruthy();
  await user.type(within(dialog).getByRole("textbox", { name: "Review reason" }), "Verified controlled source evidence");
  await user.click(within(dialog).getByRole("button", { name: "Approve revision" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}")).toEqual({ approve: true, reason: "Verified controlled source evidence" });
  expect(await screen.findByText("Approved")).toBeTruthy();
});

it("does not offer approval for the requester's own revision", async () => {
  const { writes } = open([p.view, p.approve], { self: true });
  await chooseAction("Actions for BATCH-1", "History and revisions");
  expect(await screen.findByText("Someone else with approval permission must review your request.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Review revision for BATCH-1" })).toBeNull();
  expect(writes).toEqual([]);
});
