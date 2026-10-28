// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { BillingSheetDetails, PurchaseOrderDetails, ShipmentDetails } from "./details/procurement-details";
import { JobRequestDetails, LeaveRequestDetails } from "./details/people-details";

const attachments = [{ id: "evidence", name: "evidence.png", link: "https://files.test/evidence.png" }];
const cases = [
  { View: PurchaseOrderDetails, path: "/api/v1/procurement/purchase-order/record" },
  { View: ShipmentDetails, path: "/api/v1/procurement/shipment-document/record" },
  { View: BillingSheetDetails, path: "/api/v1/procurement/billing-sheet/record" },
  { View: JobRequestDetails, path: "/api/v1/job-requests/record" },
  { View: LeaveRequestDetails, path: "/api/v1/leave-request/record" },
];
afterEach(() => { cleanup(); forgetSession(); });

it.each(cases)("opens approval evidence through the shared viewer for $path", async ({ View, path }) => {
  const backend = stubBackend();
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const reads: Request[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    reads.push(input);
    return new URL(input.url).pathname === path ? Response.json({ id: "record", code: "REC-1", attachments, shipmentInvoice: null, supplier: null, invoice: null }) : new Response(null, { status: 404 });
  });
  render(<SessionProvider><ApiProvider><MemoryRouter><View id="record" /></MemoryRouter></ApiProvider></SessionProvider>);
  await userEvent.click(await screen.findByRole("button", { name: "evidence.png" }));
  expect(await screen.findByRole("dialog", { name: "evidence.png" })).toBeTruthy();
  expect(screen.getByRole("img", { name: "evidence.png" }).getAttribute("src")).toBe("https://files.test/evidence.png");
  expect(reads.every((request) => request.method === "GET")).toBe(true);
});
