// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { boardOrderPermissions, tabletOrder, tabletSequence } from "../lib/board-order";
import { BoardOrderPage } from "./board-order-page";

afterEach(() => { cleanup(); forgetSession(); });
const operations = [...tabletSequence].reverse().map((name, index) => ({ id: `operation-${index}`, name, order: index }));
const version = "a".repeat(64);
interface Save { version: string; operationIds: string[] }
function open({ edit = true, view = true, conflict = false } = {}) {
  const backend = stubBackend({ permissions: [...(view ? [boardOrderPermissions.view] : []), ...(edit ? [boardOrderPermissions.edit] : [])] });
  const base = backend.fetcher.getMockImplementation();
  const writes: Save[] = [];
  const reads: string[] = [];
  let saved = false;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request) {
      const path = new URL(input.url).pathname;
      if (path === "/api/v1/department") return Response.json({ data: [{ id: "tablet", name: "Tablet", type: 0 }] });
      if (path === "/api/v1/production-board-order/tablet") {
        if (input.method === "PUT") {
          writes.push(await input.json());
          if (conflict) return Response.json({ errors: [{ code: "BoardOrder.Changed", description: "The department's operations changed. Reload and review the current list." }] }, { status: 409 });
          saved = true;
          return new Response(null, { status: 204 });
        }
        reads.push(path);
        return Response.json({ departmentId: "tablet", departmentName: "Tablet", version: saved ? "b".repeat(64) : version,
          operations: saved ? tabletOrder(operations) : operations });
      }
    }
    return base ? base(input, init) : new Response(null, { status: 500 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/settings/production-board-order", element: <BoardOrderPage /> }], { initialEntries: ["/settings/production-board-order?departmentId=tablet"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads };
}

it("matches all 21 Tablet operations despite punctuation and keeps unmatched operations visible", () => {
  const extra = { id: "extra", name: "Additional operation", order: 99 };
  const rows = operations.map(row => ({ ...row, name: `\u2060${row.name.replaceAll(".", "")}` }));
  expect(tabletOrder([extra, ...rows]).map(row => row.id)).toEqual([...operations].reverse().map(row => row.id).concat(extra.id));
});

it("uses the draggable table and saves all ordered IDs with the reviewed version", async () => {
  const { writes } = open();
  const preset = await screen.findByRole("button", { name: "Use Tablet sequence" });
  expect(screen.getAllByRole("button", { name: /^Reorder / })).toHaveLength(21);
  expect(screen.getByRole("button", { name: "Save order" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(preset);
  expect(screen.getAllByRole("row")[1]?.textContent).toContain(tabletSequence[0]);
  expect(writes).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Save order" }));
  await waitFor(() => expect(writes).toEqual([{ version, operationIds: [...operations].reverse().map(row => row.id) }]));
  await waitFor(() => expect(screen.queryByText(/Order changed\. Save/)).toBeNull());
});

it("keeps the arranged draft visible when another editor changed the saved list", async () => {
  open({ conflict: true });
  fireEvent.click(await screen.findByRole("button", { name: "Use Tablet sequence" }));
  fireEvent.click(screen.getByRole("button", { name: "Save order" }));
  expect((await screen.findByRole("alert")).textContent).toContain("operations changed");
  expect(screen.getByText(/Order changed\. Save/)).toBeTruthy();
  expect(screen.getAllByRole("row")[1]?.textContent).toContain(tabletSequence[0]);
});

it("allows a viewer to read the order while disabling drag and hiding save", async () => {
  const { writes } = open({ edit: false });
  const handles = await screen.findAllByRole("button", { name: /^Reorder / });
  expect(handles.every(handle => handle.hasAttribute("disabled"))).toBe(true);
  expect(screen.queryByRole("button", { name: "Save order" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Use Tablet sequence" })).toBeNull();
  expect(writes).toEqual([]);
});

it("does not load board data without the view permission", async () => {
  const { reads, writes } = open({ view: false });
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("do not have permission"));
  expect(reads).toEqual([]); expect(writes).toEqual([]);
});
