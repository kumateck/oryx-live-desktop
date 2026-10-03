// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { PageHeader } from "./page-header";

afterEach(cleanup);

const open = (address: string, header: React.ReactNode) => render(<MemoryRouter initialEntries={[address]}>{header}</MemoryRouter>);
const crumbs = () => within(screen.getByRole("navigation", { name: "breadcrumb" })).getAllByRole("listitem").map((item) => item.textContent);

it("builds the trail from the sidebar entry and links only real pages", () => {
  open("/production/products/658da105-a506-44a9-8ff5-8d005a54f294/edit/info",
    <PageHeader title="Edit Wormee" crumbs={[{ label: "Wormee", to: "/production/products/658da105-a506-44a9-8ff5-8d005a54f294/details" }, { label: "Edit" }]} />);
  expect(crumbs()).toEqual(["Production Planning", "Products", "Wormee", "Edit"]);
  const trail = screen.getByRole("navigation", { name: "breadcrumb" });
  // The current page is announced as a link without an address; only the real pages have one.
  expect(within(trail).getAllByRole("link").map((link) => link.getAttribute("href")).filter(Boolean))
    .toEqual(["/production/products", "/production/products/658da105-a506-44a9-8ff5-8d005a54f294/details"]);
  expect(within(trail).getByText("Edit").closest("[aria-current='page']")).toBeTruthy();
});

it("puts the breadcrumb beside the title when the right is free, and above it when there are actions", () => {
  const free = open("/access-management/roles/create", <PageHeader title="Create role" crumbs={[{ label: "Create" }]} />);
  const header = screen.getByRole("banner");
  expect(header.children[0]?.tagName).toBe("H1");
  expect(header.children[1]?.getAttribute("aria-label")).toBe("breadcrumb");
  expect(crumbs()).toEqual(["IT Support", "Access Management", "Manage Roles", "Create"]);
  free.unmount();
  open("/access-management/roles/create", <PageHeader title="QA Manager" crumbs={[{ label: "QA Manager" }]} actions={<button type="button">Delete role</button>} />);
  expect(screen.getByRole("banner").children[0]?.getAttribute("aria-label")).toBe("breadcrumb");
  expect(screen.getByRole("button", { name: "Delete role" })).toBeTruthy();
});

it("shows placeholders while the record name is loading", () => {
  open("/access-management/roles/1", <PageHeader title={null} crumbs={[{ label: null }]} />);
  expect(screen.queryByRole("heading")).toBeNull();
  expect(crumbs()).toEqual(["IT Support", "Access Management", "Manage Roles", ""]);
});

it("shows an explicitly supplied list parent once on create, detail, and edit pages", () => {
  for (const suffix of ["create", "record", "record/edit"]) {
    const view = open(`/settings/manufacturers/${suffix}`, <PageHeader title="Manufacturer"
      crumbs={[{ label: "Manufacturers", to: "/settings/manufacturers" }, { label: "Manufacturer" }]} />);
    expect(crumbs()).toEqual(["Procurement", "Manufacturers", "Manufacturer"]);
    expect(within(screen.getByRole("navigation", { name: "breadcrumb" })).getAllByRole("link")
      .map((link) => link.getAttribute("href")).filter(Boolean)).toEqual(["/settings/manufacturers"]);
    view.unmount();
  }
});

it("keeps record names that happen to match the list parent", () => {
  open("/settings/suppliers/record", <PageHeader title="Suppliers"
    crumbs={[{ label: "Suppliers", to: "/settings/suppliers" }, { label: "Suppliers" }]} />);
  expect(crumbs()).toEqual(["Procurement", "Suppliers", "Suppliers"]);
  expect(within(screen.getByRole("navigation", { name: "breadcrumb" })).getAllByRole("listitem")[2]
    ?.querySelector("[aria-current='page']")).toBeTruthy();
});
