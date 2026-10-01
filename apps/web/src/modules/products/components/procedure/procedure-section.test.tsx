// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { ProcedureSection } from "./procedure-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const routes = [
  { id: "r1", order: 1, operation: { id: "op-test", name: "Testing" }, estimatedTime: "2 hours", isCritical: true, workCenters: [{ workCenter: { id: "w1", name: "Lab" } }],
    responsibleUsers: [{ user: { id: "u1", name: "Ama" }, action: 7 }], responsibleRoles: [{ role: { id: "role-1", name: "Operator" }, action: 2 }] },
  { id: "r2", order: 2, operation: { id: "op-pack", name: "Packing" }, isCritical: false, workCenters: [{ workCenter: { id: "w2", name: "Line 2" } }],
    responsibleUsers: [], responsibleRoles: [{ role: { id: "role-1", name: "Operator" }, action: 2 }] },
];

function open(saved: object[] = routes) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET" && path !== "/api/v1/collection") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === `/api/v1/product/${id}/routes`) return input.method === "GET" ? Response.json(saved) : new Response(null, { status: 204 });
    if (path === "/api/v1/collection/operations") return Response.json([{ id: "op-test", name: "Testing" }, { id: "op-pack", name: "Packing" }, { id: "op-mix", name: "Mixing" }]);
    if (path === "/api/v1/collection") return Response.json({ WorkCenter: [{ id: "w1", name: "Lab" }], Role: [{ id: "role-1", name: "Operator" }], User: [{ id: "u1", name: "Ama" }] });
    if (path === `/api/v1/product-ard/product/${id}`) return Response.json([]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <ProcedureSection productId={id} departmentId="dept-1" /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("lists the steps with who is responsible and saves the remaining steps renumbered", async () => {
  const calls = open();
  const row = (await screen.findByText("Testing")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("Critical")).toBeTruthy();
  expect(within(row).getByText("2 hours")).toBeTruthy();
  expect(within(row).getByRole("button", { name: "Responsible for Testing: 1 user, 1 role" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Copy to products" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove Testing" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(screen.queryByText("Testing")).toBeNull());
  // Only a saved procedure can be copied.
  expect(screen.queryByRole("button", { name: "Copy to products" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save procedure" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(JSON.parse(calls[0]?.body ?? "[]")).toEqual([{ operationId: "op-pack", order: 1, isCritical: false, estimatedTime: null, workCenters: [{ workCenterId: "w2" }],
    responsibleUsers: [], responsibleRoles: [{ roleId: "role-1", action: 2, productAnalyticalRawDataId: null }] }]);
});

it("explains what a new step is missing before adding it", async () => {
  const calls = open();
  await screen.findByText("Testing");
  fireEvent.click(screen.getByRole("button", { name: "Add step" }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(within(dialog).getByRole("button", { name: "Add role" }));
  expect(await within(dialog).findByText("Role 1")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Add step" }));
  expect(await within(dialog).findByText("Choose an operation")).toBeTruthy();
  expect(await within(dialog).findByText("Choose who is responsible")).toBeTruthy();
  expect(await within(dialog).findByText("Choose an instruction")).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Remove responsible role 1" }));
  fireEvent.click(within(dialog).getByRole("button", { name: "Add step" }));
  expect((await within(dialog).findByText("Add at least one responsible user or role"))).toBeTruthy();
  expect(calls).toEqual([]);
});

it("refuses to save an empty procedure", async () => {
  const calls = open([routes[1]!]);
  fireEvent.click(await screen.findByRole("button", { name: "Remove Packing" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save procedure" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Add at least one step.");
  expect(calls).toEqual([]);
});
