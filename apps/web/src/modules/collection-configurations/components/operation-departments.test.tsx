// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction, openMenu } from "@/test/menu";
import { collections } from "../lib/collections";
import { CollectionPanel } from "./collection-panel";

// jsdom has no layout; the select scrolls its keyboard-focused option into view.
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const found = collections.find((item) => item.id === "operations");
if (!found) throw new Error("Missing operations collection");
const operations = found;
const view = "CanViewOperations";
const link = "CanLinkOperationDepartment";
const unlink = "CanUnlinkOperationDepartment";
interface Call { method: string; path: string; query: string }

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  const session = backend.fetcher.getMockImplementation();
  const calls: Call[] = [];
  let rows = [
    { id: "filling", name: "Filling and Capping", description: "Filling", linkedDepartmentId: "general", linkedDepartmentName: "General production" },
    { id: "indent", name: "Indent of materials", description: "Indent", linkedDepartmentId: null, linkedDepartmentName: null },
  ];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, query: url.search });
    if (input.method === "GET" && url.pathname === "/api/v1/department")
      return Response.json({ data: [{ id: "general", name: "General production" }, { id: "beta", name: "Beta-lactam production" }] });
    if (input.method === "GET") return Response.json(rows);
    if (input.method === "PUT") { rows = rows.map((row) => row.id === "indent" ? { ...row, linkedDepartmentId: "beta", linkedDepartmentName: "Beta-lactam production" } : row); return new Response(null, { status: 204 }); }
    if (input.method === "DELETE") { rows = rows.map((row) => row.id === "filling" ? { ...row, linkedDepartmentId: null, linkedDepartmentName: null } : row); return new Response(null, { status: 204 }); }
    return new Response(null, { status: 500 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><MemoryRouter><CollectionPanel definition={operations} /></MemoryRouter></ApiProvider></SessionProvider>);
  return calls;
}
const writes = (calls: Call[]) => calls.filter((call) => call.method !== "GET");

it("shows the department each operation is linked to", async () => {
  open([view]);
  const filling = (await screen.findByText("Filling and Capping")).closest("tr");
  const indent = screen.getByText("Indent of materials").closest("tr");
  if (!filling || !indent) throw new Error("Missing rows");
  expect(within(filling).getByText("General production")).toBeTruthy();
  expect(within(indent).getByText("Not linked")).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: /Department/ })).toBeTruthy();
});

it("links an unlinked operation to a production department chosen by the user", async () => {
  const calls = open([view, link]);
  await screen.findByText("Indent of materials");
  await chooseAction("Actions for Indent of materials", "Link to department");
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: "Link department" }));
  expect(await dialog.findByText("Choose a production department")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  expect(calls.find((call) => call.path === "/api/v1/department")?.query).toContain("type=0");
  fireEvent.keyDown(dialog.getByRole("combobox", { name: /Production department/ }), { key: "ArrowDown" });
  fireEvent.keyDown(await screen.findByRole("option", { name: "Beta-lactam production" }), { key: "Enter" });
  fireEvent.click(dialog.getByRole("button", { name: "Link department" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/collection/operations/indent/department/beta", query: "" }]);
  const indent = (await screen.findAllByText("Beta-lactam production")).find((cell) => cell.closest("tr"));
  expect(indent).toBeTruthy();
});

it("will not link an operation that is already linked until it is unlinked", async () => {
  open([view, link, unlink]);
  await screen.findByText("Filling and Capping");
  await openMenu("Actions for Filling and Capping");
  expect(screen.getByRole("menuitem", { name: /^Link to department/ }).getAttribute("aria-disabled")).toBe("true");
});

it("unlinks only after confirmation", async () => {
  const calls = open([view, unlink]);
  await screen.findByText("Filling and Capping");
  await chooseAction("Actions for Filling and Capping", "Unlink department");
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByText(/General production/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  fireEvent.click(dialog.getByRole("button", { name: "Unlink" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "DELETE", path: "/api/v1/collection/operations/filling/department", query: "" }]);
  expect(await screen.findAllByText("Not linked")).toHaveLength(2);
});

it("hides link and unlink from users without their keys", async () => {
  const calls = open([view, "CanEditOperation"]);
  await screen.findByText("Filling and Capping");
  await openMenu("Actions for Filling and Capping");
  expect(screen.queryByRole("menuitem", { name: /Link to department/ })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: /Unlink department/ })).toBeNull();
  expect(writes(calls)).toEqual([]);
});

it("offers link without unlink when only the link key is held", async () => {
  open([view, link]);
  await screen.findByText("Indent of materials");
  await openMenu("Actions for Indent of materials");
  expect(screen.getByRole("menuitem", { name: /^Link to department/ })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: /Unlink department/ })).toBeNull();
});
