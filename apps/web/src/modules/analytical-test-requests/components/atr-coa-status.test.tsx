// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { AtrListPage } from "./atr-list";

afterEach(() => { cleanup(); forgetSession(); });
it("distinguishes generated certificates while all requests remain test taken", async () => {
  const backend = stubBackend({ permissions: ["CanViewProductAnalyticalTestRequests"] });
  const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/qa/analytical-tests") return Response.json({
      data: ["Not generated", "Pending approval", "Approved", "Revision required"].map((coaStatus, index) => ({
        id: `atr-${index}`, status: 4, stage: 1, coaStatus,
        batchManufacturingRecord: { batchNumber: `LOT-${index}` },
        productionScheduleProduct: { product: { name: "Paracetamol syrup", code: "NL-001" } },
      })), pageIndex: 1, pageCount: 1, totalRecordCount: 4,
    });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter initialEntries={["/atr?type=4"]}><AtrListPage /></MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  expect(await screen.findByText("LOT-0")).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "COA status" })).toBeTruthy();
  for (const [index, status] of ["Not generated", "Pending approval", "Approved", "Revision required"].entries()) {
    const row = screen.getByText(`LOT-${index}`).closest("tr");
    if (!row) throw new Error("Missing request row");
    expect(within(row).getByText(status)).toBeTruthy();
    expect(within(row).getByText("Test taken")).toBeTruthy();
  }
});
