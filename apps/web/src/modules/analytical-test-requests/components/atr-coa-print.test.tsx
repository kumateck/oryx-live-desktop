// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { SessionReady } from "@/test/session-ready";
import { AtrListPage } from "./atr-list";

vi.setConfig({ testTimeout: 30_000 });
afterEach(() => { cleanup(); forgetSession(); });

/** One request in the Test taken queue, as QC sees it once the results are checked. */
function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/qa/analytical-tests") return Response.json({ data: [{ id: "atr-1", status: 4, stage: 2, batchManufacturingRecord: { id: "bmr-1", batchNumber: "L045K004" },
      productionScheduleProduct: { product: { id: "p1", name: "Tobcee Forte Syrup", code: "NL-045" } }, assignees: [] }], totalRecordCount: 1, pageIndex: 1, pageCount: 1 });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter initialEntries={["/qc/atr?type=4"]}><AtrListPage /></MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
}

it("offers Print COA on a tested request only to holders of the print key", async () => {
  open(["CanCheckProductTest"]);
  await screen.findByText("Tobcee Forte Syrup");
  await openMenu(/Actions for Tobcee Forte Syrup/);
  expect(screen.queryByRole("menuitem", { name: "Print COA" })).toBeNull();
  cleanup(); forgetSession();

  open(["CanCheckProductTest", "CanPrintProductCertificateOfAnalysis"]);
  await screen.findByText("Tobcee Forte Syrup");
  await openMenu(/Actions for Tobcee Forte Syrup/);
  expect(await screen.findByRole("menuitem", { name: "Print COA" })).toBeTruthy();
});
