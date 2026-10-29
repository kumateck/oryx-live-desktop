// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { readinessFixture } from "../test/production-readiness-fixture";
import { readinessChecks } from "../schemas/production-readiness";
import { ProductionReadinessView } from "./production-readiness-view";

afterEach(cleanup);

it("shows market groups, every configuration, shipping, exact prices, totals and the applied scope without opening a row", () => {
  render(<ProductionReadinessView view={{ report: readinessFixture(), mode: "schedule" }} />);
  const table = screen.getByRole("table", { name: "Production schedule and configuration readiness" });
  for (const { label } of readinessChecks) expect(within(table).getByRole("columnheader", { name: label })).toBeTruthy();
  expect(screen.getByText("1 of 2 products ready")).toBeTruthy();
  expect(screen.getByText("Oral Solid-Tablet (Ben Botwe)")).toBeTruthy();
  expect(within(table).getByText("Grand total")).toBeTruthy();
  expect(within(table).getByText("1,000,000")).toBeTruthy();
  expect(within(table).getAllByText("1.1234567")).toHaveLength(2);
  expect(within(table).getAllByText("800 loose")).toHaveLength(4);
  expect(within(table).getAllByRole("img", { name: "STP: Missing" }).length).toBeGreaterThan(0);
  expect(screen.queryByText("View all fields")).toBeNull();
});

it("shows each unique product once in the product matrix with all checks and a non-colour unavailable state", () => {
  const report = readinessFixture();
  const product = report.products[1]; if (!product) throw new Error("Fixture product missing");
  product.configuration = { ...product.configuration, ard: 2, readiness: 2 };
  report.actionNeededProductCount = 0; report.unavailableProductCount = 1;
  render(<ProductionReadinessView view={{ report, mode: "products" }} />);
  const table = screen.getByRole("table", { name: "Product configuration readiness" });
  expect(within(table).getAllByText("Dicnac 100 Tablets")).toHaveLength(1);
  expect(within(table).getByText("Could not verify")).toBeTruthy();
  expect(within(table).getAllByRole("img", { name: "ARD: Could not be verified" }).length).toBeGreaterThan(0);
  expect(screen.getByText("1 could not be verified")).toBeTruthy();
});

it("shows an actionable empty result without fabricated products", () => {
  const report = readinessFixture(); report.markets = []; report.products = [];
  report.productCount = 0; report.readyProductCount = 0; report.actionNeededProductCount = 0;
  render(<ProductionReadinessView view={{ report, mode: "schedule" }} />);
  expect(screen.getByText("No production planned")).toBeTruthy();
  expect(screen.queryByRole("table")).toBeNull();
});

it("prints a stable table with paired quantity/check rows and every market total", () => {
  render(<div className="print-sheet"><ProductionReadinessView view={{ report: readinessFixture(), mode: "schedule" }} paper /></div>);
  const table = screen.getByRole("table", { name: "Production schedule and configuration readiness" });
  expect(within(table).getAllByRole("columnheader")).toHaveLength(6);
  expect(table.querySelectorAll(".readiness-paper-pair")).toHaveLength(3);
  for (const pair of table.querySelectorAll(".readiness-paper-pair")) {
    expect(pair.children).toHaveLength(2);
    expect(pair.querySelectorAll('[role="img"]')).toHaveLength(7);
  }
  expect(within(table).getByText("Grand total")).toBeTruthy();
});

it("pages dense reports through the existing table controls without changing totals or limiting print", () => {
  const report = readinessFixture();
  const group = report.markets[0]; const row = group?.rows[0]; const product = report.products[0];
  if (!group || !row || !product) throw new Error("Fixture row missing");
  const rows = Array.from({ length: 35 }, (_, index) => ({ ...row,
    productId: `00000000-0000-4000-8000-${String(index + 100).padStart(12, "0")}`,
    productName: `Product ${index + 1}`,
    scheduleProductIds: [`00000000-0000-4000-8000-${String(index + 200).padStart(12, "0")}`] }));
  report.markets = [{ ...group, rows, totals: { batches: 17.5, expectedYield: 17500000, shippers: 10920, loosePacks: 28000 } }];
  report.products = rows.map((item) => ({ ...product, productId: item.productId, productName: item.productName,
    batches: 0.5, markets: [group.market] }));
  report.productCount = 35; report.readyProductCount = 35; report.actionNeededProductCount = 0;
  report.totals = report.markets[0]?.totals ?? report.totals;
  const screenView = render(<ProductionReadinessView view={{ report, mode: "schedule" }} />);
  expect(screenView.container.querySelectorAll(".readiness-data-row")).toHaveLength(30);
  expect(screen.getByText("1–30 of 35")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next page" }));
  expect(screenView.container.querySelectorAll(".readiness-data-row")).toHaveLength(5);
  expect(screen.getByText("31–35 of 35")).toBeTruthy();
  expect(screen.getByText("Product 35")).toBeTruthy();
  expect(screen.getAllByText("17,500,000")).toHaveLength(2);
  screenView.unmount();
  const paper = render(<ProductionReadinessView view={{ report, mode: "schedule" }} paper />);
  expect(paper.container.querySelectorAll(".readiness-data-row")).toHaveLength(35);
  expect(screen.queryByRole("navigation", { name: "Pagination" })).toBeNull();
});
