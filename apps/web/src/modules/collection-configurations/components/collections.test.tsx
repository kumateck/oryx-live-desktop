// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction, openMenu } from "@/test/menu";
import CollectionsPage from "@/pages/(workspace)/settings/config/page";
import { collections } from "../lib/collections";
import { CollectionPanel } from "./collection-panel";

afterEach(() => { cleanup(); forgetSession(); });

const getDefinition = (id: string) => {
  const item = collections.find((collection) => collection.id === id);
  if (!item) throw new Error(`Missing collection ${id}`);
  return item;
};
interface Call { method: string; path: string; query: string; body: string; module: string | null; subModule: string | null }
function open(id: string, options: { permissions?: string[]; page?: boolean; failSave?: boolean; incompleteUnit?: boolean } = {}) {
  const definition = getDefinition(id);
  const backend = stubBackend({ permissions: options.permissions ?? Object.values(definition.permissions) });
  const session = backend.fetcher.getMockImplementation();
  const calls: Call[] = [];
  let rows = [{ id: "one", name: "Existing item", description: "Original description", symbol: "kg" }];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const body = input.method === "GET" ? "" : await input.text();
    calls.push({ method: input.method, path: url.pathname, query: url.search, body,
      module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
    if (input.method === "GET") return Response.json(rows);
    if (input.method === "POST" && url.pathname.endsWith("/uom/one")) return Response.json(options.incompleteUnit
      ? { id: "one", name: "Existing item", symbol: "kg" }
      : { id: "one", name: "Existing item", symbol: "kg", description: "Original description", isScalable: true, type: 0, category: 0 });
    if (options.failSave && input.method !== "DELETE") return Response.json({ errors: [{ code: "Name", description: "An item with this name already exists" }] }, { status: 400 });
    if (input.method === "DELETE") { rows = []; return new Response(null, { status: 204 }); }
    return Response.json("saved-id");
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><MemoryRouter initialEntries={[`/settings/config?collection=${id}`]}>
    {options.page ? <CollectionsPage /> : <CollectionPanel definition={definition} />}
  </MemoryRouter></ApiProvider></SessionProvider>);
  return calls;
}

it("loads only a permitted selected collection with its material kind and audit headers", async () => {
  const calls = open("package-categories", { page: true, permissions: ["CanViewPackageCategories"] });
  await screen.findByText("Existing item");
  expect(calls).toEqual([{ method: "GET", path: "/api/v1/collection/MaterialCategory", query: "?materialKind=1", body: "", module: "Settings", subModule: "Configurations" }]);
  expect(screen.queryByRole("button", { name: "Add item" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Actions for Existing item" })).toBeNull();
  fireEvent.change(screen.getByRole("textbox", { name: "Search packaging categories" }), { target: { value: "not present" } });
  expect(await screen.findByText("No matching items")).toBeTruthy();
  expect(calls).toHaveLength(1);
});

it("does not fetch an inaccessible collection addressed directly", async () => {
  const calls = open("product-categories", { page: true, permissions: ["CanViewPaymentTerms"] });
  await screen.findByRole("alert");
  expect(calls).toEqual([]);
});

it("validates a create, sends a trimmed payload, and refreshes only its collection", async () => {
  const calls = open("raw-categories");
  await screen.findByText("Existing item");
  fireEvent.click(screen.getByRole("button", { name: "Add item" }));
  const dialog = within(await screen.findByRole("dialog"));
  fireEvent.click(dialog.getByRole("button", { name: "Save item" }));
  await dialog.findByText("Enter a name");
  expect(calls.filter((call) => call.method !== "GET")).toEqual([]);
  fireEvent.change(dialog.getByRole("textbox", { name: /^Name/ }), { target: { value: " Active ingredients " } });
  fireEvent.change(dialog.getByRole("textbox", { name: "Description" }), { target: { value: " For production " } });
  fireEvent.click(dialog.getByRole("button", { name: "Save item" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const save = calls.find((call) => call.method === "POST");
  expect(save?.body).toBe(JSON.stringify({ name: "Active ingredients", description: "For production", materialKind: 0 }));
  expect(save?.module).toBe("Settings");
  await waitFor(() => expect(calls.filter((call) => call.method === "GET")).toHaveLength(2));
});

it("retains a failed edit and asks before discarding it", async () => {
  open("operations", { failSave: true });
  await screen.findByText("Existing item");
  await chooseAction("Actions for Existing item", "Edit");
  const dialog = within(await screen.findByRole("dialog"));
  const name = await dialog.findByRole("textbox", { name: /^Name/ });
  fireEvent.change(name, { target: { value: "Changed name" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save item" }));
  await dialog.findByRole("alert");
  expect(name).toHaveProperty("value", "Changed name");
  fireEvent.click(dialog.getByRole("button", { name: "Cancel" }));
  expect(await dialog.findByText("Discard your unsaved changes?")).toBeTruthy();
  fireEvent.click(dialog.getByRole("button", { name: "Keep editing" }));
  expect(name).toHaveProperty("value", "Changed name");
});

it("removes an item only after confirmation, then refreshes the list", async () => {
  const calls = open("operations");
  await screen.findByText("Existing item");
  await chooseAction("Actions for Existing item", "Remove");
  const dialog = within(await screen.findByRole("dialog"));
  expect(calls.filter((call) => call.method === "DELETE")).toEqual([]);
  fireEvent.click(dialog.getByRole("button", { name: "Remove" }));
  await screen.findByText("No items in this collection");
  expect(calls.find((call) => call.method === "DELETE")?.path).toBe("/api/v1/collection/Operation/one");
});

it("disables resource edits that would erase unreadable attributes", async () => {
  const calls = open("resources");
  await screen.findByText("Existing item");
  await openMenu("Actions for Existing item");
  expect(screen.getByRole("menuitem", { name: /^Edit/ }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("menuitem", { name: /^Edit/ }).textContent).toContain("availability");
  expect(calls).toHaveLength(1);
});

it("loads complete unit details on demand and preserves classification in an update", async () => {
  const calls = open("units");
  await screen.findByText("Existing item");
  expect(calls).toHaveLength(1);
  await chooseAction("Actions for Existing item", "Edit");
  const description = await screen.findByRole("textbox", { name: "Description" });
  const dialog = within(await screen.findByRole("dialog"));
  expect(dialog.getByRole("textbox", { name: /^Symbol/ })).toHaveProperty("value", "kg");
  fireEvent.change(description, { target: { value: "Changed description" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save unit" }));
  await waitFor(() => expect(calls.find((call) => call.method === "PUT")?.body).toBe(JSON.stringify({
    name: "Existing item", symbol: "kg", description: "Changed description", isScalable: true, type: 0, category: 0,
  })));
});

it("blocks unit editing when full attributes are missing", async () => {
  open("units", { incompleteUnit: true });
  await screen.findByText("Existing item");
  await chooseAction("Actions for Existing item", "Edit");
  const dialog = within(await screen.findByRole("dialog"));
  expect(await dialog.findByText("The unit details could not be read safely.")).toBeTruthy();
  expect(dialog.queryByRole("button", { name: "Save unit" })).toBeNull();
});

it("keeps unit changes made through a switch until explicitly discarded", async () => {
  const calls = open("units");
  await screen.findByText("Existing item");
  await chooseAction("Actions for Existing item", "Edit");
  const scalable = await screen.findByRole("switch", { name: "Scalable unit" });
  fireEvent.click(scalable);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(await screen.findByText("Discard your unsaved changes?")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(scalable.getAttribute("aria-checked")).toBe("false");
  expect(calls.some((call) => call.method === "PUT")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.some((call) => call.method === "PUT")).toBe(false);
});

it("keeps countries read-only even when write permissions are held", async () => {
  open("countries");
  await screen.findByText("Existing item");
  expect(screen.queryByRole("button", { name: "Add item" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Actions for Existing item" })).toBeNull();
});
