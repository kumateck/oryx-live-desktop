// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { MarketQuotesDialog } from "./components/market-quotes-dialog";
import { keys, marketSchema } from "./lib/procurement";
import { marketQuotesFormSchema, vendorPricesFormSchema } from "./schemas/quotation-forms";

const market = marketSchema.parse({ id: "m1", quantity: 10, item: { name: "Paper", code: "PPR" }, uoM: { symbol: "bx" } });
const quote = { name: "Alpha", phone: "0200000000", price: "4.5000", terms: { value: "t1", label: "Cash" }, address: "Accra", payment: "Transfer", delivery: "Collect" };
function open(granted = [keys.marketSheetsView, keys.marketSheetCreate]) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { refuse: true };
  const bodies: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/collection") return Response.json({ TermsOfPayment: [{ id: "t1", name: "Cash" }] });
    if (input.method === "POST") {
      bodies.push(await input.clone().text());
      return state.refuse ? Response.json({ errors: [{ description: "The quote could not be saved." }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const close = vi.fn<() => void>();
  render(<SessionProvider><SessionReady><ApiProvider><MarketQuotesDialog market={market} existing={["existing"]} onClose={close} /></ApiProvider></SessionReady></SessionProvider>);
  return { state, bodies, close };
}
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("rejects repeated vendors regardless of case and refuses non-finite or zero prices", () => {
  expect(marketQuotesFormSchema(["alpha"]).safeParse({ quotes: [quote] }).success).toBe(false);
  expect(marketQuotesFormSchema([]).safeParse({ quotes: [quote, { ...quote, name: " ALPHA " }] }).success).toBe(false);
  for (const price of ["", "0", "Infinity", "NaN", "-1"]) expect(vendorPricesFormSchema.safeParse({ prices: [{ price, per: "bx" }] }).success).toBe(false);
  expect(vendorPricesFormSchema.parse({ prices: [{ price: "0.00001", per: "bx" }] }).prices[0]?.price).toBe("0.00001");
});
it("preserves all entered quote values after a refused save and retries without rounding", async () => {
  const user = userEvent.setup(); const app = open();
  await user.type(await screen.findByRole("textbox", { name: "Vendor 1 name" }), "Alpha");
  await user.type(screen.getByRole("textbox", { name: "Vendor 1 phone" }), quote.phone);
  await user.type(screen.getByRole("textbox", { name: "Vendor 1 unit price" }), quote.price);
  await user.click(screen.getByRole("combobox", { name: "Vendor 1 terms of payment" }));
  await user.click(await screen.findByRole("option", { name: "Cash" }));
  await user.type(screen.getByRole("textbox", { name: "Vendor 1 address" }), quote.address);
  await user.type(screen.getByRole("textbox", { name: "Vendor 1 mode of payment" }), quote.payment);
  await user.type(screen.getByRole("textbox", { name: "Vendor 1 delivery mode" }), quote.delivery);
  await user.click(screen.getByRole("button", { name: "Save quotes" }));
  expect(await screen.findByText("The quote could not be saved.")).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Vendor 1 unit price" })).toHaveProperty("value", "4.5000");
  expect(app.close).not.toHaveBeenCalled();
  app.state.refuse = false;
  await user.click(screen.getByRole("button", { name: "Save quotes" }));
  await waitFor(() => expect(app.close).toHaveBeenCalledOnce());
  expect(app.bodies).toEqual(Array(2).fill(JSON.stringify({ marketRequisitionId: "m1", vendors: [{ vendorName: "Alpha", vendorAddress: "Accra", vendorPhoneNumber: quote.phone, pricePerUnit: 4.5, modeOfPayment: "Transfer", termsOfPaymentId: "t1", deliveryMode: "Collect", complete: false }] })));
});
it("removes a preceding vendor without moving the remaining vendor's field values", async () => {
  const user = userEvent.setup(); open();
  await screen.findByRole("textbox", { name: "Vendor 1 name" });
  await user.click(screen.getByRole("button", { name: "Add vendor" }));
  await user.type(await screen.findByRole("textbox", { name: "Vendor 2 name" }), "Beta");
  await user.type(screen.getByRole("textbox", { name: "Vendor 2 unit price" }), "0.00001");
  await user.click(screen.getByRole("button", { name: "Remove vendor 1" }));
  expect(await screen.findByRole("textbox", { name: "Vendor 1 name" })).toHaveProperty("value", "Beta");
  expect(screen.getByRole("textbox", { name: "Vendor 1 unit price" })).toHaveProperty("value", "0.00001");
});
it("prevents saving without the create grant", async () => {
  const app = open([keys.marketSheetsView]);
  expect(await screen.findByRole("button", { name: "Save quotes" })).toHaveProperty("disabled", true);
  expect(app.bodies).toHaveLength(0);
});
