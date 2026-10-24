// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { SupplierDetail } from "./supplier-detail";

afterEach(() => { cleanup(); forgetSession(); });

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();
const supplier = { id: "s1", name: "Acme Chemicals", email: "sales@acme.test", contactPerson: "Ama Owusu", contactNumber: "+233 20 000 0000", address: "1 Harbour Rd\nTema",
  type: 0 as const, status: 1 as const, approvedAt: iso(-300), requalificationDueDate: iso(-4), country: { name: "India" }, currency: { name: "US Dollar", symbol: "$" },
  associatedManufacturers: [
    { material: { id: "m1", name: "Albendazole", code: "RM-001" }, manufacturer: { id: "f1", name: "Sequent" }, default: true },
    { material: { id: "m1", name: "Albendazole", code: "RM-001" }, manufacturer: { id: "f2", name: "Cipla" } },
  ] };
const certificate = (expiry: number, number: string) => ({ id: number, supplierId: "s1", certificationType: 0, certificateNumber: number, issuingBody: "FDA", issueDate: iso(-400), expiryDate: iso(expiry), attachments: [] });

function open(permissions: string[], address = "/") {
  const backend = stubBackend({ permissions });
  rememberSession();
  const paths: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    paths.push(path);
    if (path === "/api/v1/procurement/supplier/s1/material") return Response.json([{ ...supplier.associatedManufacturers[0], uoM: { name: "Kilogram", symbol: "kg" } }, supplier.associatedManufacturers[1]]);
    if (path === "/api/v1/suppliers/s1/certifications") return Response.json([certificate(300, "GMP-1"), certificate(-10, "GMP-0")]);
    if (path === "/api/v1/suppliers/s1/performance") return Response.json([]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <SupplierDetail supplier={supplier} /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { paths, router };
}

it("shows where the supplier stands and what needs attention before any detail", async () => {
  open(["CanViewVendors", "CanViewSupplierCertifications"]);
  expect(await screen.findByText("1 certificate has expired.")).toBeTruthy();
  expect(within(screen.getByRole("list", { name: "Needs attention" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Requalification is 4 days overdue.", "1 certificate has expired.Review"]);
  expect(screen.getByText("1 valid")).toBeTruthy();
  expect(screen.getByText("from 2 manufacturers")).toBeTruthy();
  // Contact details are links that start an email or a call.
  expect(screen.getByRole("link", { name: "sales@acme.test" }).getAttribute("href")).toBe("mailto:sales@acme.test");
  expect(screen.getByRole("link", { name: "+233 20 000 0000" }).getAttribute("href")).toBe("tel:+233200000000");
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Overview", "Materials (1)", "Certifications"]);
  // Without the edit and delete permissions the page offers no actions.
  expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
});

it("opens the records behind an alert, and keeps the open tab in the address", async () => {
  const { router } = open(["CanViewVendors", "CanViewSupplierCertifications"]);
  await screen.findByText("1 certificate has expired.");
  fireEvent.click(screen.getByRole("button", { name: "Review" }));
  expect(await screen.findByText(/GMP-0/)).toBeTruthy();
  expect(router.state.location.search).toBe("?tab=certifications");
  fireEvent.click(screen.getByRole("tab", { name: "Materials (1)" }));
  expect(await screen.findByText("Sequent")).toBeTruthy();
  expect(screen.getByText("Preferred")).toBeTruthy();
  expect(screen.getByText("kg")).toBeTruthy();
  fireEvent.change(screen.getByRole("searchbox", { name: "Search materials or manufacturers" }), { target: { value: "cipla" } });
  expect(screen.queryByText("Sequent")).toBeNull();
});

it("does not ask for records the user may not read", async () => {
  const { paths } = open(["CanViewVendors"], "/?tab=certifications");
  expect(await screen.findByText("Main contact")).toBeTruthy();
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Overview", "Materials (1)"]);
  expect(screen.queryByText("Certificates")).toBeNull();
  expect(paths.some((path) => path.includes("/certifications") || path.includes("/performance"))).toBe(false);
});
