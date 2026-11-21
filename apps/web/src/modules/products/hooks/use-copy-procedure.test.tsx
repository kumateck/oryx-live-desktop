// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { fromSavedRoutes } from "../lib/procedure";
import { savedRoutesSchema } from "../schemas/procedure-schema";
import { useCopyProcedure } from "./use-copy-procedure";
const steps = fromSavedRoutes(savedRoutesSchema.parse([{ id: "r1", operation: { id: "op1", name: "Bulk testing" }, isCritical: true,
  responsibleUsers: [{ user: { id: "u1", name: "Analyst" }, action: 7, productAnalyticalRawData: { id: "source-bulk-ard", stage: 1, productStandardTestProcedure: { stpNumber: "STP-1" } } }],
  responsibleRoles: [{ role: { id: "role1", name: "QC" }, action: 7, productAnalyticalRawData: { id: "source-finished-ard", stage: 2, productStandardTestProcedure: { stpNumber: "STP-1" } } },
    { role: { id: "role2", name: "Store" }, action: 1 }] }]));
function Copy({ from }: { from: boolean }) {
  const copy = useCopyProcedure("current");
  return <><button onClick={() => void (from ? copy.copyToCurrent(steps) : copy.copy(steps, [{ value: "target", label: "Target" }]))}>Copy</button>
    {copy.outcomes?.map((result) => <p key={result.product}>{result.error ?? "Copied"}</p>)}</>;
}
afterEach(() => { cleanup(); forgetSession(); });
function open(from: boolean, allowed = true, failed = false) {
  const backend = stubBackend({ permissions: allowed ? ["CanAddProductionProductProcedure", "CanEditProductionProductProcedure", "CanDeleteProductionProductProcedure"] : [] });
  const requests: { path: string; body: string }[] = []; const session = backend.fetcher.getMockImplementation(); rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path.endsWith("/routes") && input.method === "POST") { requests.push({ path, body: await input.clone().text() });
      return failed ? Response.json({ title: "Validation", status: 400, errors: [{ code: "Route.AtrStage", description: "The target product has no Bulk analytical raw data. Its existing procedure was kept." }] }, { status: 400 }) : new Response(null, { status: 204 }); }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <SessionReady><Copy from={from} /></SessionReady> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>); return requests;
}
it.each([false, true])("retains user/role actions and both ATR stage references for copy-from=%s", async (from) => {
  const requests = open(from); fireEvent.click(await screen.findByRole("button", { name: "Copy" }));
  await screen.findByText("Copied"); expect(requests).toHaveLength(1);
  expect(requests[0]?.path).toBe(`/api/v1/product/${from ? "current" : "target"}/routes`);
  expect(JSON.parse(requests[0]?.body ?? "[]")[0]).toMatchObject({ responsibleUsers: [{ userId: "u1", action: 7, productAnalyticalRawDataId: "source-bulk-ard" }],
    responsibleRoles: [{ roleId: "role1", action: 7, productAnalyticalRawDataId: "source-finished-ard" }, { roleId: "role2", action: 1, productAnalyticalRawDataId: null }] });
});
it("does not send a copy without the current procedure permission", async () => {
  const requests = open(false, false); fireEvent.click(await screen.findByRole("button", { name: "Copy" }));
  await screen.findByText(/do not have permission/); expect(requests).toEqual([]);
});
it("reports an unmatched target stage instead of reporting that product as copied", async () => {
  const requests = open(false, true, true); fireEvent.click(await screen.findByRole("button", { name: "Copy" }));
  await waitFor(() => expect(screen.getByText(/no Bulk analytical raw data/)).toBeTruthy());
  expect(screen.queryByText("Copied")).toBeNull(); expect(requests).toHaveLength(1);
});
