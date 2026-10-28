// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend, testUserId } from "@/test/backend";
import { useReceiptDecision } from "./hooks/use-receipt-decision";
import { receipt, item, id } from "./fixture";
function Probe({ decision, own }: { decision: "approve" | "reject"; own: boolean }) {
  const original = own ? { ...receipt, createdBy: { id: testUserId, firstName: "Ada" } } : receipt;
  const command = useReceiptDecision(original, decision);
  const [error, setError] = useState("");
  return (
    <>
      <p>{command.allowed ? "Ready" : "Denied"}</p>
      <button onClick={() => void command.run().then((e) => setError(e ?? "Recorded"))}>Decide</button>
      {error ? <p role="status">{error}</p> : null}
    </>
  );
}
import { useState } from "react";
function open(decision: "approve" | "reject" = "approve", own = false) {
  const backend = stubBackend({ permissions: ["CanViewItStoreReceivingArea", "CanApproveItStoreReceivingAreaEntry", "CanRejectItStoreReceivingAreaEntry"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  const state = {
    current: own ? { ...receipt, createdBy: { id: testUserId, firstName: "Ada" } } : structuredClone(receipt),
    stock: structuredClone(item),
    status: 204,
    reconcile: true,
  };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method === "POST") {
      writes.push(url.pathname);
      if (state.status !== 204) return new Response(null, { status: state.status });
      if (state.reconcile && decision === "approve") state.stock = { ...item, availableQuantity: 15 };
      return new Response(null, { status: 204 });
    }
    if (url.pathname.endsWith("/purchased-items")) {
      expect(url.searchParams.get("store")).toBe("0");
      expect(url.searchParams.get("status")).toBe("0");
      return Response.json({ data: [state.current], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    }
    expect(url.pathname).toBe(`/api/v1/items/${id}`);
    return Response.json(state.stock);
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe decision={decision} own={own} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
async function decide() {
  await screen.findByText("Ready");
  await userEvent.setup().click(screen.getByRole("button"));
}
it("approves a current receipt and reconciles the increased available stock", async () => {
  const p = open();
  await decide();
  await screen.findByText("Recorded");
  expect(p.writes).toEqual([`/api/v1/procurement/inventory/items/${receipt.id}/approve`]);
});
it("rejects without increasing available stock", async () => {
  const p = open("reject");
  await decide();
  await screen.findByText("Recorded");
  expect(p.writes[0]).toContain("/reject");
});
it("does not let the receipt creator approve their own stock entry", async () => {
  const p = open("approve", true);
  await decide();
  await screen.findByText(/Another authorized user/);
  expect(p.writes).toHaveLength(0);
});
it("refuses changed receipt quantities before the decision", async () => {
  const p = open();
  p.state.current = { ...receipt, quantity: 6 };
  await decide();
  await screen.findByText(/receipt changed/);
  expect(p.writes).toHaveLength(0);
});
it("detects a false-success stock effect and refuses replay", async () => {
  const p = open();
  p.state.reconcile = false;
  await decide();
  await screen.findByText(/could not be reconciled/);
  await decide();
  expect(p.writes).toHaveLength(1);
});
it("does not replay a failed decision", async () => {
  const p = open();
  p.state.status = 409;
  await decide();
  await waitFor(() => expect(p.writes).toHaveLength(1));
  await screen.findByRole("status");
  await decide();
  expect(p.writes).toHaveLength(1);
});
