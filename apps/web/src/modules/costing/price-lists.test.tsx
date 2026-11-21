// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { modules } from "../registry";
import { canAccess, routeAccessRule } from "../registry-model";
import { PriceListRevisionsPage } from "./components/price-list-revisions-page";
import { PriceListDetailPage } from "./components/price-list-detail-page";
import { priceListKeys, editablePriceList, priceListSummarySchema } from "./lib/price-lists";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const id = "10000000-0000-4000-8000-000000000001";
const packing = "10000000-0000-4000-8000-000000000002";
const product = "10000000-0000-4000-8000-000000000003";
const currency = "10000000-0000-4000-8000-000000000004";
const dollars = "10000000-0000-4000-8000-000000000005";
const revision = { id, division: 1, documentNumber: "FIN/PL/001", revisionNumber: 21, previousRevisionId: null,
  supersedesRevision: 20, effectiveFrom: "2026-12-01T00:00:00Z", revisionReason: "Packaging review", status: 4,
  stage: "Draft", reviewStatus: null, version: 3, lineCount: 2, preparedBy: "Price Officer", createdAt: "2026-11-21T12:00:00Z", approvedAt: null,
  preparedBySignatory: null, checkedBy: null, approvedBy: null };
const line = { id: "line1", productId: product, productPackingId: packing, packingStyle: "24 x 100 ml bottles", productCode: "FP001", productName: "Suspension",
  price: 240, previousPrice: 220, previousCurrencySymbol: "GHS", priceUoM: "pack", currencyId: currency, currencyName: "Cedi", currencySymbol: "GHS" };
interface Call { method: string; path: string; query: string; body: object | null }
function open(address: string, permissions: string[], stage = revision) {
  const backend = stubBackend({ permissions }); const session = backend.fetcher.getMockImplementation();
  rememberSession(); const calls: Call[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const path = url.pathname;
    calls.push({ method: input.method, path, query: url.search, body: input.method === "GET" ? null : await input.clone().json() });
    if (path === "/api/v1/collection") return Response.json({ Currency: [{ id: currency, name: "Cedi", symbol: "GHS" }, { id: dollars, name: "US Dollar", symbol: "$" }] });
    if (path === "/api/v1/costing/price-lists") return Response.json({ data: [stage], pageIndex: 1, pageCount: 1, totalRecordCount: 1,
      latestApproved: { ...stage, status: 1, stage: "Current" }, openRevisionId: null, nextRevisionNumber: 22 });
    if (path === `/api/v1/costing/price-lists/${id}/lines` && input.method === "GET") return Response.json({ data: [line,{ ...line, id: "line2", productPackingId: "other", packingStyle: "100 ml bottle", price: 12 }], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (path === `/api/v1/costing/price-lists/${id}`) return Response.json(stage);
    if (path === `/api/v1/costing/price-lists/${id}/print`) return Response.json({ revision: stage, lines: [line] });
    if (path === `/api/v1/costing/price-lists/${id}/submit` || input.method === "PUT") return new Response(null,{ status:204 });
    if (path.includes("document-review")) return Response.json({ reviewRequired: true, canConfirm:false, canReturn:false, canResubmit:false, review:null });
    return new Response(null,{status:404});
  });
  const router = createMemoryRouter([{path:"/finance/costing",element:<PriceListRevisionsPage/>},
    {path:"/finance/costing/revisions/:id",element:<PriceListDetailPage/>}],{initialEntries:[address]});
  render(<SessionProvider><ApiProvider><RouterProvider router={router}/></ApiProvider></SessionProvider>);
  return calls;
}
it("requires the price-list view key and never infers it from agreement management", () => {
  const rule=routeAccessRule(modules,`/finance/costing/revisions/${id}`);
  expect(rule).toEqual({kind:"all",permissions:[priceListKeys.view]});
  expect(canAccess(rule ?? {kind:"all",permissions:["never"]},{state:"authenticated",permissions:new Set(["ManageCosting"])})).toBe(false);
  expect(canAccess(rule ?? {kind:"all",permissions:["never"]},{state:"authenticated",permissions:new Set([priceListKeys.view])})).toBe(true);
  expect(editablePriceList(priceListSummarySchema.parse(revision))).toBe(true);
  expect(editablePriceList(priceListSummarySchema.parse({...revision,status:1}))).toBe(false);
});
it("loads paged division summaries and offers a revision with its own permission", async () => {
  const calls=open("/finance/costing?division=1",[priceListKeys.view,priceListKeys.revise]);
  expect(await screen.findByText("Rev. 21")).toBeTruthy();
  expect(screen.getByRole("button",{name:"New revision"})).toBeTruthy();
  expect(calls.find(call=>call.path==="/api/v1/costing/price-lists")?.query).toContain("division=1");
  expect(calls.some(call=>call.path.endsWith("/lines") || call.path.endsWith("/print") || call.path.includes("/product/"))).toBe(false);
  await userEvent.click(screen.getByRole("button",{name:"New revision"}));
  const dialog=await screen.findByRole("dialog");
  expect(await within(dialog).findByDisplayValue("22")).toBeTruthy();
});
it("shows pack-specific prices and hides writes and print without their own keys", async () => {
  const calls=open(`/finance/costing/revisions/${id}`,[priceListKeys.view]);
  expect(await screen.findByText("GHS 240.00")).toBeTruthy(); expect(screen.getByText("GHS 12.00")).toBeTruthy();
  expect(screen.queryByRole("button",{name:"Add product pack"})).toBeNull();
  expect(screen.queryByRole("button",{name:/Actions for Revision/})).toBeNull();
  expect(calls.some(call=>call.method!=="GET" || call.path.endsWith("/print"))).toBe(false);
});
it("submits the exact revision version using the submit permission", async () => {
  const calls=open(`/finance/costing/revisions/${id}`,[priceListKeys.view,priceListKeys.submit]);
  await screen.findByText("GHS 240.00"); await openMenu("Actions for Revision 21");
  await userEvent.click(await screen.findByRole("menuitem",{name:"Send for review"}));
  await waitFor(()=>expect(calls.find(call=>call.method==="POST")?.body).toEqual({version:3}));
});
it("opens print only on request and includes the selected packing style", async () => {
  const calls=open(`/finance/costing/revisions/${id}`,[priceListKeys.view,priceListKeys.print]);
  await screen.findByText("GHS 240.00"); expect(calls.some(call=>call.path.endsWith("/print"))).toBe(false);
  await openMenu("Actions for Revision 21"); await userEvent.click(await screen.findByRole("menuitem",{name:"Print"}));
  await waitFor(()=>expect(calls.some(call=>call.path.endsWith("/print"))).toBe(true));
  expect(await screen.findByRole("dialog")).toBeTruthy();
});

it("sets the pack price in the chosen currency through FormWizard", async () => {
  const calls=open(`/finance/costing/revisions/${id}`,[priceListKeys.view,priceListKeys.edit]);
  await screen.findByText("GHS 240.00");await openMenu("Actions for Suspension / 24 x 100 ml bottles");
  await userEvent.click(await screen.findByRole("menuitem",{name:"Change price"}));
  const dialog=await screen.findByRole("dialog");
  const pricedIn=await within(dialog).findByRole("combobox",{name:/Priced in/});
  await userEvent.click(pricedIn);await userEvent.click(await screen.findByRole("option",{name:"US Dollar ($)"}));
  await userEvent.click(within(dialog).getByRole("button",{name:"Save pack price"}));
  await waitFor(()=>expect(calls.find(call=>call.method==="PUT")?.body).toEqual({version:3,productId:product,productPackingId:packing,price:240,currencyId:dollars,priceUoM:"pack"}));
});
