// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import type { MaterialLinkDto, MigrationDto } from "../api/stock-migration-api";
import { MigrationMaterialLinks } from "./migration-material-links";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const permissions = ["CanViewOpeningBalances", "CanCorrectOpeningBalances", "CanLinkRawMaterials", "CanLinkPackagingMaterials"];
const migration: MigrationDto = { id: "m1", status: 0, departmentId: "558da105-a506-44a9-8ff5-8d005a54f294", departmentName: "Oral Solid-Tablet" };
const raw: MaterialLinkDto[] = [
  { materialId: "rm1", kind: 0, code: "RM001", name: "Powder", uoMId: "mg", unitName: "Milligram", unitSymbol: "mg", minimumStockLevel: 100_000_000, reOrderLevel: 1_000_000_000, maximumStockLevel: 10_000_000_000 },
  { materialId: "rm2", kind: 0, code: "RM002", name: "Liquid", uoMId: "ml", unitName: "Milliliter", unitSymbol: "ml", minimumStockLevel: 100_000, reOrderLevel: 1_000_000, maximumStockLevel: 10_000_000 },
];
const packing: MaterialLinkDto[] = [{ materialId: "pm1", kind: 1, code: "PMF016", name: "Foil", uoMId: "piece", unitName: "Piece", unitSymbol: "piece", minimumStockLevel: 100, reOrderLevel: 1000, maximumStockLevel: 10000 }];
function RefreshSession() {
  const { refresh, state } = useSession();
  return <><button onClick={() => void refresh()}>Refresh session</button><span>{state.status}</span></>;
}
function open(options: { keys?: string[]; draft?: MigrationDto; raws?: MaterialLinkDto[]; fail?: boolean } = {}) {
  const backend = stubBackend({ permissions: options.keys ?? permissions });
  rememberSession();
  const calls: { path: string; body: string; module: string | null; subModule: string | null }[] = [];
  const reads: string[] = [];
  let remainingRaw = options.raws ?? raw;
  let remainingPacking = packing;
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const kind = url.pathname.endsWith("/0") ? 0 : 1;
    if (input.method === "GET") { reads.push(url.pathname); return Response.json(kind === 0 ? remainingRaw : remainingPacking); }
    const body = await input.text();
    calls.push({ path: url.pathname, body, module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
    if (options.fail) return Response.json({ title: "The preview changed. Refresh before linking." }, { status: 409 });
    const requested: { materials: MaterialLinkDto[] } = JSON.parse(body);
    const ids = new Set(requested.materials.map((item) => item.materialId));
    if (kind === 0) remainingRaw = remainingRaw.filter((item) => !ids.has(item.materialId));
    else remainingPacking = remainingPacking.filter((item) => !ids.has(item.materialId));
    return Response.json({ created: requested.materials.length, alreadyLinked: 0 });
  });
  render(<SessionProvider><ApiProvider><RefreshSession /><MigrationMaterialLinks migration={options.draft ?? migration} /></ApiProvider></SessionProvider>);
  return { backend, calls, reads };
}

it.each([
  ["without correction", ["CanLinkRawMaterials"]],
  ["without either kind's link permission", ["CanCorrectOpeningBalances"]],
])("hides linking %s and sends no material-link requests", async (_label, keys) => {
  const { calls, reads } = open({ keys });
  await screen.findByText("authenticated");
  await waitFor(() => expect(screen.queryByRole("button", { name: "Link missing materials" })).toBeNull());
  expect(calls).toHaveLength(0);
  expect(reads).toHaveLength(0);
});

it.each([1, 2] as const)("hides the action on a non-draft with status %s", (status) => {
  const { calls, reads } = open({ draft: { ...migration, status } });
  expect(screen.queryByRole("button", { name: "Link missing materials" })).toBeNull();
  expect(calls).toHaveLength(0);
  expect(reads).toHaveLength(0);
});

it("previews both kinds and links selected raw materials in bulk with audit headers", async () => {
  const user = userEvent.setup();
  const { calls } = open();
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  const rawGroup = await screen.findByRole("region", { name: "Raw materials" });
  await within(rawGroup).findByText("RM001");
  expect(within(rawGroup).getByText("Milligram (mg)")).toBeTruthy();
  expect(within(rawGroup).getByText("100 kg")).toBeTruthy();
  expect(within(rawGroup).getByText("10,000,000,000 mg")).toBeTruthy();
  expect(within(rawGroup).getByText("100 L")).toBeTruthy();
  expect(await screen.findByText("Piece (piece)")).toBeTruthy();
  await user.click(within(rawGroup).getByRole("button", { name: "Select all eligible" }));
  await user.click(within(rawGroup).getByRole("button", { name: "Link selected raw materials (2)" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]).toMatchObject({ path: "/api/v1/stock-migrations/m1/material-links/0", module: "Settings", subModule: "Configurations" });
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ materials: raw });
  expect(await screen.findByText(/2 material\(s\) linked.*Migration rows checked again/)).toBeTruthy();
  expect(await within(rawGroup).findByText("No missing materials")).toBeTruthy();
});

it("links one selected material and does not expose or query the other kind", async () => {
  const user = userEvent.setup();
  const { calls, reads } = open({ keys: permissions.filter((key) => key !== "CanLinkPackagingMaterials") });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  const code = await screen.findByText("RM002");
  const row = code.closest("tr");
  if (!row) throw new Error("Expected a material row");
  await user.click(within(row).getByRole("checkbox", { name: "Select row" }));
  await user.click(screen.getByRole("button", { name: "Link selected raw materials (1)" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ materials: [raw[1]] });
  expect(screen.queryByRole("region", { name: "Packaging materials" })).toBeNull();
  expect(reads.every((path) => path.endsWith("/0"))).toBe(true);
});

it("allows packaging linking with its own key", async () => {
  const user = userEvent.setup();
  const { calls, reads } = open({ keys: permissions.filter((key) => key !== "CanLinkRawMaterials") });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  await screen.findByText("PMF016");
  await user.click(screen.getByRole("button", { name: "Select all eligible" }));
  await user.click(screen.getByRole("button", { name: "Link selected packaging materials (1)" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]?.path).toBe("/api/v1/stock-migrations/m1/material-links/1");
  expect(reads.every((path) => path.endsWith("/1"))).toBe(true);
});

it("blocks requests when the migration and active departments differ", async () => {
  const user = userEvent.setup();
  const { calls, reads } = open({ draft: { ...migration, departmentId: "other" } });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Switch to Oral Solid-Tablet"));
  expect(calls).toHaveLength(0);
  expect(reads).toHaveLength(0);
});

it("shows missing-unit issues and prevents selecting those materials", async () => {
  const user = userEvent.setup();
  const { calls } = open({ raws: [{ ...raw[0], uoMId: null, issue: "No unique matching mg unit exists." }] });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  const issue = await screen.findByText("No unique matching mg unit exists.");
  const row = issue.closest("tr");
  if (!row) throw new Error("Expected a material row");
  expect(within(row).getByRole("checkbox", { name: "Select row" })).toHaveProperty("disabled", true);
  expect(screen.getByRole("button", { name: "Link selected raw materials (0)" })).toHaveProperty("disabled", true);
  expect(calls).toHaveLength(0);
});

it("keeps failures visible without retrying a refused mutation", async () => {
  const user = userEvent.setup();
  const { calls } = open({ fail: true, keys: permissions.filter((key) => key !== "CanLinkPackagingMaterials") });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  await screen.findByText("RM001");
  await user.click(screen.getByRole("button", { name: "Select all eligible" }));
  await user.click(screen.getByRole("button", { name: "Link selected raw materials (2)" }));
  expect(await screen.findByRole("alert")).toHaveProperty("textContent", expect.stringContaining("Refresh the preview before trying again"));
  expect(calls).toHaveLength(1);
});

it("removes write controls when link permission is revoked while the preview is open", async () => {
  const user = userEvent.setup();
  const { calls, backend } = open({ keys: permissions.filter((key) => key !== "CanLinkPackagingMaterials") });
  await user.click(await screen.findByRole("button", { name: "Link missing materials" }));
  await screen.findByText("RM001");
  backend.set({ permissions: ["CanViewOpeningBalances", "CanCorrectOpeningBalances"] });
  // Simulate the external session refresh while the preview remains open.
  fireEvent.click(screen.getByText("Refresh session"));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Link missing materials" })).toBeNull());
  expect(calls).toHaveLength(0);
});
