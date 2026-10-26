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
interface Options { readStatus?: number; returnStatus?: number; saveStatus?: number; changeStep?: boolean; changeStock?: boolean; malformedStock?: boolean; missingUnit?: boolean; revokeOnSave?: boolean }

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
        productionScheduleProduct: { id: "b1", quantity: 100_000, product: { name: "Syrup", baseUoM: { symbol: "ml" } } },
        steps: [{ id: "step", status: saved ? 2 : 1, isCritical: true, operation: { name: "Packing" }, responsibleUsers: [{ user: { id: testUserId }, action: 4 }] }],
      });
    }
    if (path.endsWith("/manufacturing/product/b1")) return Response.json({ productionScheduleProduct: { productPacking: {
      id: "style", name: "10 x 100 ml", packPerShipper: 10, expectedYield: 1000, basePackingUoM: { name: "syrup" },
    } } });
    if (path.endsWith("/stock-requisition/package/b1")) return Response.json({ items: [{ material: { id: "m1", name: "Bottle", code: "PM1" },
      uoM: { id: options.missingUnit ? null : "piece", symbol: "piece" }, quantity: options.malformedStock ? -10 : options.changeStock ? 1200 : 1100 }] });
    if (path.endsWith("/extra-packing/by-product/b1")) return Response.json([]);
    if (path.endsWith("/final-packing/product/b1")) {
      if (options.readStatus) return new Response(null, { status: options.readStatus });
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
  const received = await screen.findByRole("spinbutton", { name: "Total volume received" });
  fireEvent.change(received, { target: { value: "100" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Average volume filled per bottle" }), { target: { value: "100" } });
  fireEvent.change(screen.getByRole("spinbutton", { name: "Actual quantity packed" }), { target: { value: "1000" } });
}

it("keeps the material return failure visible after packing completes the active step, and retries only the return", async () => {
  const { calls, options } = open({ returnStatus: 400 });
  await fill();
  fireEvent.click(screen.getByRole("button", { name: "Record final packing" }));
  const retry = await screen.findByRole("button", { name: "Return the leftovers again" });
  expect(calls.map((call) => call.path.split("/").at(-1))).toEqual(["final-packing", "return-after-production"]);
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ batchSize: 100, totalQuantityPacked: 1000, materials: [{ packedQuantity: 1000, returnedQuantity: 100 }] });
  options.returnStatus = 204;
  fireEvent.click(retry);
  await screen.findByText("Batch board");
  expect(calls.map((call) => call.path.split("/").at(-1))).toEqual(["final-packing", "return-after-production", "return-after-production"]);
});

it("exposes yield validation errors when saving from the reconciliation tab", async () => {
  open();
  fireEvent.click(await screen.findByRole("button", { name: "Record final packing" }));
  await screen.findByText("Enter how much was received");
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
  await screen.findByRole("spinbutton", { name: "Total volume received" });
  expect(screen.getByRole("tab", { name: "Yield on packaging" }).getAttribute("aria-selected")).toBe("true");
  expect(restored.calls).toHaveLength(0);
});
