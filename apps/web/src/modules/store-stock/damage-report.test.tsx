// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { useDamageReport } from "./hooks/use-damage-report";
import { item, id, receiptId, transaction } from "./fixture";
function Probe({ quantity }: { quantity: number }) {
  const command = useDamageReport(item, 0, () => {});
  return (
    <>
      <p>{command.allowed ? "Ready" : "Denied"}</p>
      <button disabled={command.busy} onClick={() => void command.run({ quantity, remarks: "Broken" })}>
        Report
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open(quantity = 2) {
  const backend = stubBackend({ permissions: ["CanViewItStoreAvailableStocks", "CanCreateItStoreDamageMissingItemRecord"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  const state = { stock: structuredClone(item), posted: false, status: 200, reconcile: true, ledgerBalance: 10 };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "POST") {
      writes.push(await input.text());
      if (state.status !== 200) return new Response(null, { status: state.status });
      state.posted = true;
      if (state.reconcile) {
        state.stock = { ...item, availableQuantity: 8 };
        state.ledgerBalance = 8;
      }
      return Response.json(receiptId);
    }
    if (path.endsWith("/transactions")) return Response.json([{ ...transaction, totalBalance: state.ledgerBalance }]);
    if (path.includes("damaged-goods")) return Response.json({ id: receiptId, itemId: id, quantityDamaged: 2, damageStatus: 0 });
    return Response.json(state.stock);
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe quantity={quantity} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
async function report() {
  await screen.findByText("Ready");
  await userEvent.setup().click(screen.getByRole("button"));
}
it("posts damaged enum zero and confirms the report, stock and ledger together", async () => {
  const p = open();
  await report();
  await waitFor(() => expect(p.state.posted).toBe(true));
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  expect(JSON.parse(p.writes[0] ?? "{}")).toMatchObject({ itemId: id, damageStatus: 0, quantityDamaged: 2 });
  expect(screen.queryByRole("alert")).toBeNull();
});
it("refuses zero and excess damage quantities", async () => {
  const p = open(0);
  await report();
  await screen.findByRole("alert");
  expect(p.writes).toHaveLength(0);
});
it("refuses a stock/ledger mismatch before a write", async () => {
  const p = open();
  p.state.ledgerBalance = 9;
  await report();
  await screen.findByRole("alert");
  expect(p.writes).toHaveLength(0);
});
it("does not replay a report when the returned stock effect is wrong", async () => {
  const p = open();
  p.state.reconcile = false;
  await report();
  await screen.findByRole("alert");
  await report();
  expect(p.writes).toHaveLength(1);
});
it("refuses changed stock before a report", async () => {
  const p = open();
  p.state.stock = { ...item, availableQuantity: 9 };
  await report();
  await screen.findByRole("alert");
  expect(p.writes).toHaveLength(0);
});
