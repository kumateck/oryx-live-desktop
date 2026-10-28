// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import FinalPackingPage from "@/pages/(workspace)/production/activities/[id]/final-packing/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { notifyPermissionDenied } from "@/shared/auth/session-events";
import { usePermissionAction } from "@/shared/auth/use-permission-action";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";

afterEach(() => { cleanup(); forgetSession(); });
interface Options { category?: "syrup" | "tablet"; packingUnitName?: string | null; productCategoryName?: string | null; fullBatchSize?: number; composition?: number; configuredYield?: number; scheduleQuantity?: number; missingSetup?: boolean; changeSetup?: boolean; legacyAbsent?: boolean; readStatus?: number; returnStatus?: number; saveStatus?: number; changeStep?: boolean; changeStock?: boolean; malformedStock?: boolean; missingUnit?: boolean; revokeOnSave?: boolean; extraStatus?: number }

function AccessProbe() {
  const access = usePermissionAction({ kind: "all", permissions: ["CanViewPlannedProducts"], departmentType: 0 });
  return <p>{access.allowed ? "Packing access allowed" : "Packing access blocked"}</p>;
}

function open(options: Options = {}, address = "/production/activities/a1/final-packing") {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts"] });
  const session = backend.fetcher.getMockImplementation();
  rememberSession();
  const calls: { path: string; body: string }[] = [];
  let saved = false;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "POST") {
      calls.push({ path, body: await input.clone().text() });
      if (path.endsWith("/final-packing")) {
        if (options.saveStatus) return new Response(null, { status: options.saveStatus });
        saved = true;
        if (options.revokeOnSave) {
          backend.set({ permissions: [] }); notifyPermissionDenied();
          await waitFor(() => expect(screen.getByText("Packing access blocked")).toBeTruthy());
        }
        return Response.json("fp1");
      }
      if (path.endsWith("/return-after-production")) return new Response(null, { status: options.returnStatus ?? 204 });
    }
    if (path.endsWith("/activity/a1")) {
      return Response.json({ id: "a1", currentStep: { id: saved || options.changeStep ? "later" : "step" },
        productionScheduleProduct: { id: "b1", quantity: options.scheduleQuantity ?? 100_000, product: { name: "Product", baseUoM: { symbol: options.category === "tablet" ? "mg" : "ml" } } },
        steps: [{ id: "step", status: saved ? 2 : 1, isCritical: true, operation: { name: "Packing" }, responsibleUsers: [{ user: { id: testUserId }, action: 4 }] }],
      });
    }
    if (path.endsWith("/manufacturing/product/b1")) return Response.json({ productionScheduleProduct: { product: {
      fullBatchSize: options.missingSetup ? null : options.fullBatchSize ?? 100_000, baseQuantity: options.changeSetup ? 150 : options.composition ?? 100,
      category: { name: options.productCategoryName === undefined ? options.category ?? "syrup" : options.productCategoryName },
      baseUoM: { symbol: options.category === "tablet" ? "mg" : "ml" },
    }, productPacking: {
      id: "style", name: "10 x 100 ml", packPerShipper: 10, expectedYield: options.configuredYield ?? 1000, basePackingUoM: { name: options.packingUnitName === undefined ? options.category ?? "syrup" : options.packingUnitName },
    } } });
    if (path.endsWith("/stock-requisition/package/b1")) return Response.json({ items: [{ material: { id: "m1", name: "Bottle", code: "PM1" },
      uoM: { id: options.missingUnit ? null : "piece", symbol: "piece" }, quantity: options.malformedStock ? -10 : options.changeStock ? 1200 : 1100 }] });
    if (path.endsWith("/extra-packing/by-product/b1")) return Response.json(options.extraStatus === undefined ? [] : [{
      material: { id: "m1" }, quantity: 100, uoM: { id: "piece" }, status: options.extraStatus,
    }]);
    if (path.endsWith("/final-packing/product/b1")) {
      if (options.readStatus) return new Response(null, { status: options.readStatus });
      if (options.legacyAbsent && !saved) return Response.json({errors:[{code:"Error.NullValue",description:"The specified result value is null."}]},{status:400});
      return Response.json(saved ? { id: "fp1", totalQuantityPacked: 1000, nUmberOfFullShipperPacked: 100, leftOver: 0,
        numberOfBottlesPerShipper: 10, yieldTotalQuantityPacked: 1000, totalGainOrLoss: 0, expectedYield: 1000 } : null);
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/activities/:id/final-packing", element: <FinalPackingPage /> },
    { path: "/production/activities/:id/board", element: <p>Batch board</p> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><AccessProbe /><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, options, router };
}

async function fill() {
  const material = await screen.findByRole("textbox", { name: "Packed Bottle" });
  fireEvent.change(material, { target: { value: "1000" } }); fireEvent.blur(material);
  fireEvent.mouseDown(screen.getByRole("tab", { name: "Yield on packaging" }), { button: 0, ctrlKey: false });
  const averageWeight = screen.queryByRole("spinbutton", { name: "Average weight of tablet" });
  if (averageWeight) fireEvent.change(averageWeight, { target: { value: "100" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Total quantity packed (including samples)" }), { target: { value: "1000" } });
}

it("omits received measurements for syrup and keeps samples out of the loss calculation and warehouse stock", async () => {
  const { calls } = open();
  await fill();
  expect(screen.queryByRole("spinbutton", { name: /Total (weight|volume).*received/ })).toBeNull();
  expect(screen.getByText(/Theoretical batch: 100 L/)).toBeTruthy();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Quality control analytical sample" }), { target: { value: "3" } });
  const table = screen.getByRole("table", { name: "Yield on packaging" });
  expect(table.textContent).toContain("997 bottles");
  expect(table.textContent).toContain("0 bottles");
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText("Batch board");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ totalWeightReceived: 0, yieldTotalQuantityPacked: 1000,
    qualityControlAnalyticalSample: 3, totalNumberOfBottles: 997, totalQuantityPacked: 997,
    totalGainOrLoss: 0, nUmberOfFullShipperPacked: 99, leftOver: 7 });
});

it("preloads full batch, composition and configured expected yield for a generic syrup bottle style", async () => {
  const { calls } = open({ packingUnitName: "Bottles", productCategoryName: null, fullBatchSize: 3_000_000,
    composition: 150, configuredYield: 20_000, scheduleQuantity: 500_000 });
  await fill();
  const table = screen.getByRole("table", { name: "Yield on packaging" });
  expect(table.textContent).toContain("3,000 L");
  expect(table.textContent).toContain("150 ml");
  expect(table.textContent).toContain("20,000 bottles");
  expect(screen.queryByRole("spinbutton", { name: /Average volume|received|Expected yield|Batch size/ })).toBeNull();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Total quantity packed (including samples)" }), { target: { value: "20000" } });
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText("Batch board");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ batchSize: 3000, averageVolumeFilledPerBottle: 150,
    totalWeightReceived: 0, yieldTotalQuantityPacked: 20_000, totalGainOrLoss: 0 });
});

it("uses the configured syrup expected yield without replacing it with a recalculation", async () => {
  open({ composition: 100, fullBatchSize: 100_000, configuredYield: 980, productCategoryName: "syrup", packingUnitName: "Bottle" });
  await fill();
  expect(screen.getByRole("table", { name: "Yield on packaging" }).textContent).toContain("980 bottles");
  expect(screen.queryByRole("spinbutton", { name: "Average volume filled per bottle" })).toBeNull();
});

it("blocks incomplete syrup setup instead of requesting a received quantity", async () => {
  const { calls } = open({ missingSetup: true, packingUnitName: null });
  await screen.findByText(/Configure the syrup product's full batch size/);
  expect(screen.queryByRole("spinbutton", { name: /received/ })).toBeNull();
  expect(screen.queryByRole("button", { name: "Record final packing" })).toBeNull();
  expect(calls).toEqual([]);
});

it("refuses a stale syrup composition value before saving", async () => {
  const { calls, options } = open({ packingUnitName: "Bottle" });
  await fill(); options.changeSetup = true;
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/issued quantities changed/);
  expect(calls).toEqual([]);
});

it("still requires received weight for tablets and leaves the record unsaved when it is missing", async () => {
  const { calls } = open({ category: "tablet" }); await fill();
  expect(screen.getByRole("spinbutton", { name: "Total weight of tablets received for packaging" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText("Enter how much was received");
  expect(calls).toHaveLength(0);
});

it("keeps the material return failure visible after packing completes the active step, and retries only the return", async () => {
  const { calls, options } = open({ returnStatus: 400 });
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  const retry = await screen.findByRole("button", { name: "Return the leftovers again" });
  expect(calls.map((call) => call.path.split("/").at(-1))).toEqual(["final-packing", "return-after-production"]);
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ batchSize: 100, totalWeightReceived: 0, totalNumberOfBottles: 1000, totalGainOrLoss: 0, totalQuantityPacked: 1000, materials: [{ packedQuantity: 1000, returnedQuantity: 100 }] });
  options.returnStatus = 204;
  fireEvent.click(retry);
  await screen.findByText("Batch board");
  expect(calls.map((call) => call.path.split("/").at(-1))).toEqual(["final-packing", "return-after-production", "return-after-production"]);
});

it("exposes yield validation errors when saving from the reconciliation tab", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Record final packing" }));
  await screen.findByText(/Enter the actual quantity packed/);
  expect(screen.getByRole("tab", { name: "Yield on packaging" }).getAttribute("aria-selected")).toBe("true");
});

it("prevents writes when the active step changes during preflight", async () => {
  const { calls, options } = open();
  await fill(); options.changeStep = true;
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/Final packing can be recorded only/);
  expect(calls).toHaveLength(0);
});

it("rejects malformed stock data and errors reading the existing final packing", async () => {
  const { calls } = open({ malformedStock: true });
  await screen.findByText(/packing data the app could not validate/);
  expect(calls).toHaveLength(0);
  cleanup(); forgetSession();
  const second = open({ readStatus: 500 });
  await screen.findByText(/could not complete the request \(500\)/);
  expect(second.calls).toHaveLength(0);
});

it("blocks missing return units before creating packing", async () => {
  const { calls } = open({ missingUnit: true });
  await fill(); fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/unit of measure is missing/);
  expect(calls).toHaveLength(0);
});

it("blocks blind retries after an ambiguous return failure", async () => {
  const { calls } = open({ returnStatus: 500 });
  await fill(); fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/The server may have saved this request/);
  expect(screen.queryByRole("button", { name: "Return the leftovers again" })).toBeNull();
  expect(calls).toHaveLength(2);
});

it("prevents rapid repeat submissions from creating duplicate records", async () => {
  const { calls } = open();
  await fill();
  const button = screen.getByRole("button", { name: "Record final packing" });
  fireEvent.click(button); fireEvent.click(button);
  await screen.findByText("Batch board");
  expect(calls.filter((call) => call.path.endsWith("/final-packing"))).toHaveLength(1);
});

it("blocks a changed stock baseline until it has been reviewed", async () => {
  const { calls, options } = open(); await fill(); options.changeStock = true;
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/issued quantities changed/);
  expect(calls).toHaveLength(0);
});

it("rechecks permission before the second write and leaves the return pending", async () => {
  const { calls } = open({ revokeOnSave: true }); await fill();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/Your access has changed/);
  expect(calls).toHaveLength(1);
  expect(calls[0]?.path).toContain("/final-packing");
});

it("never sends returns when the packing write has an uncertain outcome", async () => {
  const { calls } = open({ saveStatus: 500 }); await fill();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText(/The server may have saved this request/);
  expect(calls).toHaveLength(1);
});

it("restores the selected packing tab from the URL after a full page reload", async () => {
  const { router } = open();
  await fill();
  expect(router.state.location.search).toBe("?tab=yield");
  const address = `${router.state.location.pathname}${router.state.location.search}`;
  cleanup(); forgetSession();
  const restored = open({}, address);
  await screen.findByRole("table", { name: "Yield on packaging" });
  expect(screen.getByRole("tab", { name: "Yield on packaging" }).getAttribute("aria-selected")).toBe("true");
  expect(restored.calls).toHaveLength(0);
});

it.each([0, 1])("blocks final packing when extra material has not been issued (%s)", async (extraStatus) => {
  const { calls } = open({ extraStatus });
  await screen.findByText("All extra material must be approved and issued before recording final packing.");
  expect(screen.queryByRole("button", { name: "Record final packing" })).toBeNull();
  expect(calls).toEqual([]);
});

it("rechecks extra-material issue before final packing completes the step", async () => {
  const { calls, options } = open(); await fill(); options.extraStatus = 1;
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText("All extra material must be approved and issued before recording final packing.");
  expect(calls).toEqual([]);
});

it("opens and saves first final packing when an older backend reports the absent record as Error.NullValue", async () => {
  const { calls } = open({ legacyAbsent: true });
  await fill();
  expect(screen.queryByText("The specified result value is null.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  await screen.findByText("Batch board");
  expect(calls.filter((call) => call.path.endsWith("/final-packing"))).toHaveLength(1);
});
