// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ExtraMaterialRequisitionsPage from "../../pages/(workspace)/warehouse/extra-material/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { chooseAction, openMenu } from "../../test/menu";

afterEach(() => { cleanup(); forgetSession(); });

const extra = (id: string, material: string, more: object = {}) => ({ id, quantity: 2000, approved: true, uoM: { symbol: "g" }, material: { name: material, code: "PM-1" }, productionScheduleProduct: { batchNumber: "T081K004", product: { name: "Paracetamol syrup" } },
  batches: [{ quantityToTake: 2000, batch: { id: `${id}-b`, batchNumber: "B-7", expiryDate: "2099-01-01T00:00:00Z" } }], ...more });

it("issues extra material only after a confirmation, sending the picked batches, and holds what is not ready", async () => {
  const user = userEvent.setup();
  const backend = stubBackend({ permissions: ["CanIssuePackagingMaterialRequisitions"] });
  rememberSession();
  const calls: { method: string; path: string; body: unknown; kind: string | null }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path: url.pathname, body: text ? JSON.parse(text) as unknown : null, kind: url.searchParams.get("kind") });
    if (url.pathname === "/api/v1/production-schedule/extra-packing") return Response.json({ data: [extra("x1", "Bottle caps"), extra("x2", "Labels", { approved: false }), extra("x3", "Cartons", { batches: [] })], pageIndex: 1, pageCount: 1, totalRecordCount: 3 });
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/extra-material", element: <ExtraMaterialRequisitionsPage /> }], { initialEntries: ["/warehouse/extra-material"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  await screen.findByText("Bottle caps");
  // Only the packaging permission is held, so packaging is what is asked for.
  expect(calls[calls.length - 1]?.kind).toBe("1");
  await openMenu("Actions for Labels");
  expect(screen.getByRole("menuitem", { name: /Issue/ }).textContent).toContain("waiting for approval");
  await user.keyboard("{Escape}");
  await openMenu("Actions for Cartons");
  expect(screen.getByRole("menuitem", { name: /Issue/ }).textContent).toContain("No stock has been picked");
  await user.keyboard("{Escape}");
  await chooseAction("Actions for Bottle caps", "Issue");
  const writes = () => calls.filter((call) => call.method !== "GET");
  expect(writes()).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue material" }));
  await waitFor(() => expect(writes()).toHaveLength(1));
  expect(writes()[0]).toMatchObject({ method: "POST", path: "/api/v1/production-schedule/extra-packing/approve/x1", body: [{ batchId: "x1-b", quantity: 2000 }] });
}, 20_000);
