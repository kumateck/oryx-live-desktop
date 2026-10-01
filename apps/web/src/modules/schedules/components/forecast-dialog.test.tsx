// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { ForecastDialog } from "./forecast-dialog";

afterEach(() => { cleanup(); forgetSession(); });

const request = { product: { value: "p1", label: "Wormee" }, packing: { value: "s1", label: "1x100ml" }, sizeType: { value: "1", label: "Half" }, count: 3, market: null };

function open(response: () => Response) {
  const backend = stubBackend({ permissions: [] });
  rememberSession();
  const searches: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (url.pathname === "/api/v1/production-schedule/forecast") { searches.push(url.search); return response(); }
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider><ForecastDialog request={request} onClose={() => undefined} /></ApiProvider></SessionProvider>);
  return searches;
}

it("asks for the chosen batches and shows what is short, by how much", async () => {
  const searches = open(() => Response.json([
    { material: { id: "m1", code: "RM-1", name: "Sugar", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 500, quantityOnHand: 900, expiredQuantity: 100, reservedQuantity: 50, isAvailable: true },
    { material: { id: "m2", code: "RM-2", name: "Albendazole", kind: 0 }, uoM: { symbol: "g" }, quantityNeeded: 1500, quantityOnHand: 600, expiredQuantity: 400, isAvailable: false },
  ]));
  expect(await screen.findByText("Albendazole")).toBeTruthy();
  expect(searches[0]).toContain("productId=p1");
  expect(searches[0]).toContain("productPackingId=s1");
  expect(searches[0]).toContain("batchSize=1");
  expect(searches[0]).toContain("numberOfBatches=3");
  expect(screen.getByText("1 material is short. They are listed first.")).toBeTruthy();
  expect(screen.getByText("by 1.3 kg")).toBeTruthy();
  expect(screen.getByText("400 g expired")).toBeTruthy();
  expect(screen.getByText("50 g reserved for other batches")).toBeTruthy();
  expect(screen.getByText("3 × half")).toBeTruthy();
  expect(screen.getByText("No packaging materials needed")).toBeTruthy();
});

it("shows the reason and a retry when the forecast cannot be loaded", async () => {
  open(() => new Response(null, { status: 500 }));
  expect((await screen.findAllByRole("button", { name: "Retry" })).length).toBeGreaterThan(0);
  expect(screen.queryByText(/enough of every material|short\. They are listed/)).toBeNull();
});
