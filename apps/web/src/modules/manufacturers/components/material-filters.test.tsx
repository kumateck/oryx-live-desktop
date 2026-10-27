// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import type { DomainEntitiesProcurementManufacturersManufacturerDto } from "@/shared/api/generated/procurement";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ManufacturerEditor } from "./manufacturer-editor";

afterEach(() => { cleanup(); forgetSession(); });

function openManufacturer() {
  const backend = stubBackend({ permissions: ["CanUpdateManufacturerDetails"] });
  const session = backend.fetcher.getMockImplementation();
  rememberSession();
  const writes: string[] = [];
  const manufacturer: DomainEntitiesProcurementManufacturersManufacturerDto = {
    id: "f1", name: "Factory", address: "Accra", country: { id: "gh", name: "Ghana" }, validityDate: "2030-01-01T00:00:00Z",
    materials: [
      { material: { id: "m1", name: "Starch", kind: 0 }, quantityType: 0, quantityPerPackOption: { values: [25] } },
      { material: { id: "m2", name: "Bottle", kind: 1 }, quantityType: 0, quantityPerPackOption: { values: [100] } },
    ],
  };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/collection") return Response.json({ Country: [{ id: "gh", name: "Ghana" }] });
    if (input.method === "PUT" && path === "/api/v1/procurement/manufacturer/f1") {
      writes.push(await input.text()); return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/", element: <ManufacturerEditor manufacturer={manufacturer} /> },
    { path: "/settings/manufacturers/f1", element: <p>Manufacturer saved</p> },
  ]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return writes;
}

it("keeps edited quantities and hidden rows when saving a filtered manufacturer", async () => {
  const writes = openManufacturer();
  await screen.findAllByRole("textbox", { name: /^Quantity/ });
  await waitFor(() => expect(screen.getByRole("button", { name: "Save manufacturer" }).hasAttribute("disabled")).toBe(false));
  const rawQuantity = screen.getAllByRole("textbox", { name: /^Quantity/ })[0];
  if (!rawQuantity) throw new Error("Raw material quantity missing");
  fireEvent.change(rawQuantity, { target: { value: "25.123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Packaging materials (1)" }));
  expect(screen.getAllByRole("textbox", { name: /^Quantity/ })).toHaveLength(1);
  const form = screen.getByRole("button", { name: "Save manufacturer" }).closest("form");
  if (!form) throw new Error("Manufacturer form missing");
  fireEvent.submit(form);
  await screen.findByText("Manufacturer saved");
  expect(JSON.parse(writes[0] ?? "{}").materials).toMatchObject([
    { materialId: "m1", quantityPerPackOption: { values: [25.123456] } },
    { materialId: "m2", quantityPerPackOption: { values: [100] } },
  ]);
});

it("prepends new rows and makes hidden validation failures visible", async () => {
  const writes = openManufacturer();
  await waitFor(() => expect(screen.getByRole("button", { name: "Save manufacturer" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Packaging materials (1)" }));
  fireEvent.click(screen.getByRole("button", { name: "Add material" }));
  expect(screen.getByRole("button", { name: "All materials (3)" }).getAttribute("aria-pressed")).toBe("true");
  await waitFor(() => expect(screen.getAllByRole("combobox", { name: /Material kind/ })).toHaveLength(3));
  expect(screen.getAllByRole("combobox", { name: /Material kind/ })[0]?.textContent).toBe("Select an option");
  fireEvent.click(screen.getByRole("button", { name: "Packaging materials (1)" }));
  const form = screen.getByRole("button", { name: "Save manufacturer" }).closest("form");
  if (!form) throw new Error("Manufacturer form missing");
  fireEvent.submit(form);
  await waitFor(() => expect(screen.getByRole("button", { name: "All materials (3)" }).getAttribute("aria-pressed")).toBe("true"));
  expect(writes).toEqual([]);
});
