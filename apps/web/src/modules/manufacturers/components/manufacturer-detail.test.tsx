// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { ManufacturerDetail } from "./manufacturer-detail";

afterEach(() => { cleanup(); forgetSession(); });

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();
const manufacturer = { id: "f1", name: "Sequent Scientific", email: "qa@sequent.test", address: "Plot 9\nThane", country: { name: "India" }, approvedAt: iso(-500), validityDate: iso(-6),
  materials: [
    { material: { id: "m1", name: "Albendazole", code: "RM-001", kind: 0 as const }, quantityType: 0 as const, quantityPerPackOption: { values: [25, 50] } },
    { material: { id: "m2", name: "Glass bottle", code: "PM-012", kind: 1 as const }, quantityType: 1 as const, quantityPerPackOption: { min: 100, max: 500 } },
  ] };

function open(permissions: string[]) {
  stubBackend({ permissions });
  rememberSession();
  const router = createMemoryRouter([{ path: "/", element: <ManufacturerDetail manufacturer={manufacturer} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return router;
}

it("says the approval has lapsed before anything else, and shows the key figures", async () => {
  open(["CanViewManufacturers"]);
  expect(await screen.findByText(/The approval ran out 6 days ago/)).toBeTruthy();
  expect(screen.getAllByText("Approval lapsed").length).toBeGreaterThan(0);
  expect(screen.getByText("1 raw · 1 packaging")).toBeTruthy();
  expect(screen.getByRole("link", { name: "qa@sequent.test" }).getAttribute("href")).toBe("mailto:qa@sequent.test");
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Overview", "Materials (2)"]);
  expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
});

it("lists what it makes with pack sizes, in a searchable table", async () => {
  const router = open(["CanViewManufacturers", "CanUpdateManufacturerDetails"]);
  expect((await screen.findByRole("link", { name: "Edit" })).getAttribute("href")).toBe("/settings/manufacturers/f1/edit");
  fireEvent.click(screen.getByRole("tab", { name: "Materials (2)" }));
  expect(router.state.location.search).toBe("?tab=materials");
  const row = (await screen.findByText("Albendazole")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("Raw material")).toBeTruthy();
  expect(row.textContent).toContain("25, 50 (pack sizes)");
  expect(screen.getByText("Glass bottle").closest("tr")?.textContent).toContain("100 to 500 (range)");
  fireEvent.change(screen.getByRole("searchbox", { name: "Search manufactured materials" }), { target: { value: "bottle" } });
  expect(screen.queryByText("Albendazole")).toBeNull();
});
