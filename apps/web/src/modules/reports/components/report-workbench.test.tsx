// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ReportWorkbench } from "./report-workbench";
afterEach(() => { cleanup(); forgetSession(); });
function Ready() { return useCurrentUser() ? <p>Report session ready</p> : null; }

it("keeps filters in the dialog, generates submitted details, and opens the system print preview", async () => {
  const backend = stubBackend({ permissions: ["CanViewStoreAndInventoryReport"] });
  const session = backend.fetcher.getMockImplementation(); rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (url.pathname.endsWith("history/capabilities")) return Response.json({ protocolVersion: 1, available: true, basis: "RecordedState", serverTime: "2026-10-27T12:00:00Z", availableFrom: "2026-10-01T00:00:00Z" });
    if (url.pathname.endsWith("items-per-store-type")) return Response.json([{ id: "i1", name: "Report fixture item", code: "ITEM-1", store: 0, availableQuantity: 0, unitOfMeasure: { symbol: "pcs" } }]);
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider><MemoryRouter><Ready /><ReportWorkbench group="stores" /></MemoryRouter></ApiProvider></SessionProvider>);
  await screen.findByText("Report session ready");
  fireEvent.click(await screen.findByRole("button", { name: "Choose filters" }));
  await screen.findByRole("dialog", { name: "Filters · Items per store type" });
  expect(await screen.findByLabelText("Store type")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Generate report" }));
  await screen.findByText("Report fixture item");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.queryByLabelText("Store type")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Filter details" }));
  await screen.findByRole("dialog", { name: "Applied report filters" });
  expect(screen.getByText("Current snapshot")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Print" }));
  await screen.findByRole("dialog", { name: "Print preview · Items per store type" });
  expect(document.querySelector(".print-portal")?.textContent).toContain("Report fixture item");
  expect(document.querySelector(".print-portal")?.textContent).toContain("As of date (UTC): Current snapshot");
});
