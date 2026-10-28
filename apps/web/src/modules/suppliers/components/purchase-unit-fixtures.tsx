import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { DomainEntitiesProcurementSuppliersSupplierDto } from "@/shared/api/generated/procurement";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, stubBackend } from "@/test/backend";
import { SupplierEditor } from "./supplier-editor";

export const massUnit = { id: "u-mg", symbol: "mg", name: "Milligram" };
export const volumeUnit = { id: "u-ml", symbol: "ml", name: "Millilitre" };
export const units = ["kg", "L", "mg", "PCS", "ml", "g"].map((symbol) => ({ id: `u-${symbol}`, symbol, name: symbol }));
const material = { id: "m1", name: "Starch", code: "RM-1", kind: 0 as const };
export const supplier: DomainEntitiesProcurementSuppliersSupplierDto = {
  id: "s1", name: "Supply Co", email: "supply@example.test", contactPerson: "Ama", contactNumber: "0123456789", address: "Accra",
  country: { id: "gh", name: "Ghana" }, currency: { id: "ghs", name: "GHS" },
  associatedManufacturers: [{ material, manufacturer: { id: "f1", name: "Factory" }, default: true, uoM: { id: "u-kg", symbol: "kg", name: "Kilogram" } }],
};

export function openSupplier(purchaseUnit = "kg", permissions = ["CanUpdateVendorDetails"]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  const state = { failUnits: false, emptyUnits: false, volume: false, multiple: false, duplicate: false };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/collection") return Response.json({ Country: [{ id: "gh", name: "Ghana" }], Currency: [{ id: "ghs", name: "GHS" }], UnitOfMeasure: units });
    if (path.endsWith("/purchase-units")) return state.failUnits ? new Response(null, { status: 503 }) : Response.json(state.emptyUnits ? [] : state.multiple ? [massUnit, volumeUnit, massUnit] : state.duplicate ? [massUnit, massUnit] : [path.includes("m2") || state.volume ? volumeUnit : massUnit]);
    if (path.startsWith("/api/v1/procurement/manufacturer/material/")) return Response.json([{ id: "f1", name: "Factory" }]);
    if (path === "/api/v1/material") return Response.json({ data: [material, { ...material, id: "m2", name: "Liquid", code: "RM-2" }], pageCount: 1 });
    if (input.method === "PUT" && path === "/api/v1/procurement/supplier/s1") { writes.push(await input.text()); return new Response(null, { status: 204 }); }
    return new Response(null, { status: 404 });
  });
  const associations = (supplier.associatedManufacturers ?? []).map((row) => ({ ...row, purchaseUnit, uoM: { id: `u-${purchaseUnit}`, symbol: purchaseUnit, name: purchaseUnit } }));
  const router = createMemoryRouter([
    { path: "/", element: <SupplierEditor supplier={supplier} associations={associations} /> },
    { path: "/settings/suppliers/s1", element: <p>Supplier saved</p> },
  ]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, state, backend };
}
