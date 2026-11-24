// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { linkRowsSchema } from "../schemas/material-schema";
import { LinkDialog } from "./link-dialog";

afterEach(() => { cleanup(); forgetSession(); });
function open(kind: 0 | 1, mayClear = true, fail = false, legacy = false) {
  const edit = kind === 0 ? "CanEditLinkedRawMaterials" : "CanEditLinkedPackagingMaterials";
  const density = kind === 0 ? "CanEditRawMaterialDensity" : "CanEditPackagingMaterialDensity";
  const backend = stubBackend({ permissions: [edit, ...(mayClear ? [density] : [])] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: { method: string; path: string }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/collection") return Response.json({ UnitOfMeasure: [{ id: "kg", symbol: "kg" }, { id: "density", symbol: "g/mL" }] });
    if (input.method === "DELETE") {
      writes.push({ method: input.method, path });
      return fail ? Response.json({ errors: [{ code: "MaterialDensity.Conflict", description: "The density could not be cleared" }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const link = linkRowsSchema.parse([{ material: { id: "material-1", name: "Sorbitol", code: "RMS001", kind },
    uoM: { id: "kg", symbol: "kg" }, density: legacy ? 1450 : 1.45,
    densityUoM: { id: "density", symbol: legacy ? "kg/m³" : "g/mL" }, minimumStockLevel: 1000000, reOrderLevel: 2000000, maximumStockLevel: 3000000 }])[0];
  if (!link) throw new Error("Missing material fixture");
  let closed = 0;
  rememberSession();
  render(<SessionProvider><SessionReady><ApiProvider><MemoryRouter><LinkDialog material={link.material} link={link} onClose={() => { closed++; }} /></MemoryRouter></ApiProvider></SessionReady></SessionProvider>);
  return { writes, closed: () => closed };
}
it.each([0, 1] as const)("clears density for kind %s only after explicit confirmation", async kind => {
  const user = userEvent.setup(); const state = open(kind);
  await user.click(await screen.findByRole("button", { name: "Clear density" }));
  const confirm = within(await screen.findByRole("dialog", { name: "Clear density for Sorbitol?" }));
  expect(confirm.getByText(/every department/)).toBeTruthy(); expect(state.writes).toEqual([]);
  await user.click(confirm.getByRole("button", { name: "Clear density" }));
  await waitFor(() => expect(state.writes).toEqual([{ method: "DELETE", path: `/api/v1/material/${kind === 0 ? "raw" : "packaging"}/material-1/density` }]));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Clear density" })).toBeNull());
  expect(state.closed()).toBe(0); // Keep unsaved stock-level edits available in the parent dialog.
  expect(screen.getByRole("spinbutton", { name: "Density (g/mL)" })).toHaveProperty("value", "");
});
it.each([0, 1] as const)("does not offer clearing without the density permission for kind %s", async kind => {
  const state = open(kind, false);
  await screen.findByRole("dialog");
  expect(screen.queryByRole("button", { name: "Clear density" })).toBeNull(); expect(state.writes).toEqual([]);
});
it("can clear an old density whose unit is not g/mL and keeps a refused clear visible", async () => {
  const user = userEvent.setup(); const state = open(0, true, true, true);
  await user.click(await screen.findByRole("button", { name: "Clear density" }));
  const confirm = within(await screen.findByRole("dialog", { name: "Clear density for Sorbitol?" }));
  await user.click(confirm.getByRole("button", { name: "Clear density" }));
  expect(await screen.findByText("The density could not be cleared")).toBeTruthy();
  expect(state.closed()).toBe(0); expect(state.writes).toHaveLength(1);
}, 20_000);
