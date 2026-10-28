// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import MonthlyReportPage from "../../../pages/(workspace)/production/schedules/monthly-report/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const now = new Date();
const at = (monthOffset: number, day: number) => new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 9).toISOString();
const product = { id: "p1", name: "Wormee", code: "NL-047", price: 12, priceUoM: "bottle" };
const packing = { id: "k1", name: "100 ml", expectedYield: 1000, packPerShipper: 24 };
const schedules = [
  { id: "s1", scheduledStartTime: at(0, 2), scheduledEndTime: at(0, 6), products: [{ product, productPacking: packing }, { product, productPacking: packing, batchSize: 1 }] },
  { id: "s2", scheduledStartTime: at(1, 2), scheduledEndTime: at(1, 6), products: [{ product: { ...product, id: "p2", name: "Amoxil" }, productPacking: packing }] },
];

function open() {
  const backend = stubBackend({ permissions: ["CanViewProductSchedules"] });
  rememberSession();
  const pages: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (url.pathname === "/api/v1/production-schedule") {
      const page = Number(url.searchParams.get("page"));
      pages.push(String(page));
      return Response.json({ data: page === 1 ? [schedules[0]] : [schedules[1]], pageIndex: page, pageCount: 2, totalRecordCount: 2 });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/production/schedules/monthly-report", element: <MonthlyReportPage /> }], { initialEntries: ["/production/schedules/monthly-report"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return pages;
}

it("reads every page of schedules once and shows the month's plan, moving between months without asking again", async () => {
  const pages = open();
  expect(await screen.findByText("Wormee")).toBeTruthy();
  expect(new Set(pages)).toEqual(new Set(["1", "2"]));
  const read = pages.length;
  expect(screen.getAllByText("1.5")).toHaveLength(2);
  expect(screen.getAllByText("1,500").length).toBeGreaterThan(0);
  expect(screen.getByText(/does not say which market/)).toBeTruthy();
  expect(screen.queryByText("Amoxil")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(await screen.findByText("Amoxil")).toBeTruthy();
  expect(pages).toHaveLength(read);
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  expect(await screen.findByText(/No production is planned/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Print" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "This month" }));
  fireEvent.click(await screen.findByRole("button", { name: "Print" }));
  expect((await screen.findByRole("dialog")).textContent).toContain("Grand total");
});
