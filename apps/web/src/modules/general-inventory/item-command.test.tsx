// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { defaults } from "./schemas/editor";
import { item, id, unitId, otherId } from "./fixture";
import { useItemCommand } from "./hooks/use-item-command";
function Probe({ create, remove, files }: { create: boolean; remove: boolean; files: File[] }) {
  const command = useItemCommand(create ? null : item, 0, remove ? "delete" : "save", () => {});
  return (
    <>
      <button disabled={command.busy} onClick={() => void command.run({ ...defaults(item), name: "Updated gloves", files })}>
        Save
      </button>
      <p role="status">
        {command.allowed ? "Ready" : "Denied"} {command.savedId}
      </p>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open(options: { create?: boolean; remove?: boolean; files?: File[]; permissions?: string[] } = {}) {
  const backend = stubBackend({
    permissions: options.permissions ?? ["CanViewItemsInItStore", "CanCreateNewItemInItStore", "CanEditItemInItStore", "CanDeleteItemFromItStore"],
  });
  const auth = backend.fetcher.getMockImplementation();
  const writes: { path: string; body: string; module: string | null }[] = [];
  const state = {
    row: structuredClone(item),
    list: [structuredClone(item)],
    status: 204,
    reconcile: true,
    identity: id,
    uploadStatus: 204,
    changedDuringValidation: false,
  };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    if (path.endsWith("/collection")) return Response.json({ UnitOfMeasure: [{ id: unitId, name: "Pieces" }], ItemCategory: [] });
    if (input.method !== "GET") {
      const body = path.includes("/file/") ? "multipart" : await input.text();
      writes.push({ path, body, module: input.headers.get("Module") });
      if (path.includes("/file/")) return new Response(null, { status: state.uploadStatus });
      if (state.status !== 204) return new Response(null, { status: state.status });
      if (state.reconcile && input.method !== "DELETE") {
        const values = JSON.parse(body);
        state.row = { ...state.row, ...values };
      }
      return input.method === "POST" ? Response.json(state.identity) : new Response(null, { status: 204 });
    }
    if (path.endsWith("/items")) {
      if (state.changedDuringValidation) state.row = { ...state.row, availableQuantity: 1 };
      expect(url.searchParams.get("store")).toBe("0");
      return Response.json({ data: state.list, pageIndex: 1, pageCount: 1, totalRecordCount: state.list.length });
    }
    return Response.json(state.row);
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe create={!!options.create} remove={!!options.remove} files={options.files ?? []} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
async function save() {
  await screen.findByText(/Ready/);
  await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
}
it("saves exact zero enum values with audit headers and reconciles current data", async () => {
  const page = open();
  await save();
  await waitFor(() => expect(screen.getByRole("status").textContent).toContain(id));
  expect(page.writes).toHaveLength(1);
  expect(JSON.parse(page.writes[0]?.body ?? "{}")).toMatchObject({ store: 0, classification: 0, minimumLevel: 0, isActive: true });
  expect(page.writes[0]?.module).toBe("General Stores");
});
it("refuses a stale item before writing", async () => {
  const page = open();
  page.state.row = { ...item, name: "Changed" };
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("rechecks the item after asynchronous reference and duplicate validation", async () => {
  const page = open();
  page.state.changedDuringValidation = true;
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("refuses duplicate names or codes from the complete store register", async () => {
  const page = open();
  page.state.list.push({ ...item, id: otherId, name: "Updated gloves" });
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("does not replay a server conflict", async () => {
  const page = open();
  page.state.status = 409;
  await save();
  await screen.findByRole("alert");
  await save();
  expect(page.writes).toHaveLength(1);
});
it("detects an ignored save before uploading files", async () => {
  const page = open({ files: [new File(["PDF"], "manual.pdf")] });
  page.state.reconcile = false;
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(1);
});
it("uses only the confirmed created item identity for its attachment upload", async () => {
  const page = open({ create: true, files: [new File(["PDF"], "manual.pdf")] });
  page.state.list = [];
  await save();
  await waitFor(() => expect(page.writes).toHaveLength(2));
  expect(page.writes.map((w) => w.path)).toEqual(["/api/v1/items", `/api/v1/file/Item/${id}`]);
});
it("retains a saved item after failed upload without recreating it", async () => {
  const page = open({ create: true, files: [new File(["PDF"], "manual.pdf")] });
  page.state.list = [];
  page.state.uploadStatus = 500;
  await save();
  await screen.findByRole("alert");
  await save();
  expect(page.writes).toHaveLength(2);
  expect(screen.getByRole("status").textContent).toContain(id);
});
it("never uploads files when the create response lacks a valid saved identity", async () => {
  const page = open({ create: true, files: [new File(["PDF"], "manual.pdf")] });
  page.state.list = [];
  page.state.identity = "invalid";
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(1);
});
it("refuses deleting stock and does not call an item mutation", async () => {
  const page = open({ remove: true });
  page.state.row = { ...item, availableQuantity: 5 };
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("callback-time permission checks block an item action for another store", async () => {
  const page = open({ permissions: ["CanViewItemsInGeneralStore", "CanEditItemInGeneralStore"] });
  await screen.findByText(/Denied/);
  await userEvent.setup().click(screen.getByRole("button", { name: "Save" }));
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
