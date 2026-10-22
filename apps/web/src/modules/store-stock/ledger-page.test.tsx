// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { LedgerPage } from "./components/ledger-page";
import { item, id, transaction } from "./fixture";
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
function Ready() {
  const user = useCurrentUser();
  return user ? <LedgerPage /> : null;
}
function open(mode: "valid" | "wrong-item" | "wrong-ledger" = "valid") {
  const backend = stubBackend({ permissions: ["CanViewItStoreAvailableStocks"] });
  const auth = backend.fetcher.getMockImplementation();
  const filters: (string | null)[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (url.pathname.endsWith("/transactions")) {
      filters.push(url.searchParams.get("transactionType"));
      return Response.json([{ ...transaction, itemCode: mode === "wrong-ledger" ? "OTHER" : "GLV" }]);
    }
    return Response.json(mode === "wrong-item" ? { ...item, store: 1 } : item);
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <MemoryRouter initialEntries={[`/extrals/available-stocks/GLV/item-transactions?storeType=0&itemId=${id}`]}>
          <Routes>
            <Route path="/extrals/available-stocks/:code/item-transactions" element={<Ready />} />
          </Routes>
        </MemoryRouter>
      </ApiProvider>
    </SessionProvider>,
  );
  return filters;
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("renders recorded zeros and sends the Damaged filter as enum zero", async () => {
  const filters = open();
  const user = userEvent.setup();
  const row = await screen.findByRole("row", { name: /Purchased/ });
  expect(within(row).getAllByText("0")).toHaveLength(2);
  await user.click(await screen.findByRole("combobox", { name: "Transaction type" }));
  await user.click(await screen.findByRole("option", { name: "Damaged" }));
  await waitFor(() => expect(filters).toContain("0"));
});
it("does not read a ledger for an item that belongs to another store", async () => {
  const filters = open("wrong-item");
  await screen.findByRole("alert");
  expect(filters).toHaveLength(0);
});
it("refuses ledger rows returned for another item code", async () => {
  open("wrong-ledger");
  await screen.findByText("The item ledger identity could not be verified.");
  expect(screen.queryByRole("row", { name: /Purchased/ })).toBeNull();
});
