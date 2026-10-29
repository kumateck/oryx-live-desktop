// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { ExtraMaterialForm } from "./extra-material-form";

afterEach(() => { cleanup(); forgetSession(); });

const stock = (id: string, name: string) => [{ material: { id, name, code: id.toUpperCase(), totalStock: 5000 }, materialDepartment: { uoM: { id: "u-g", symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 5000 }];

function open(raised: { raw: boolean; packaging: boolean }) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts"] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/production-schedule/material-stock/b1") return Response.json(stock("m-sugar", "Sugar"));
    if (path === "/api/v1/production-schedule/package-material-stock/b1") return Response.json(stock("m-bottle", "Bottle"));
    if (path === "/api/v1/production-schedule/stock-requisition/raw/b1") return raised.raw ? Response.json({ id: "r1", code: "RM/N/26/001", status: 3 }) : new Response(null, { status: 404 });
    if (path === "/api/v1/production-schedule/stock-requisition/package/b1") return raised.packaging ? Response.json({ id: "r2", code: "PM/N/26/001", status: 1 }) : new Response(null, { status: 404 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/x", element: <ExtraMaterialForm activityId="a1" batchId="b1" /> }], { initialEntries: ["/x"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
}

it("offers extra material only for kinds whose main requisition has been raised", async () => {
  open({ raw: true, packaging: false });
  expect(await screen.findByText("Sugar")).toBeTruthy();
  expect(screen.queryByText("Bottle")).toBeNull();
  expect(screen.getByText(/raise the batch's packaging stock requisition first/)).toBeTruthy();
  cleanup(); forgetSession();

  open({ raw: true, packaging: true });
  expect(await screen.findByText("Bottle")).toBeTruthy();
  expect(screen.getByText("Sugar")).toBeTruthy();
});

it("refuses extra material before any main requisition", async () => {
  open({ raw: false, packaging: false });
  expect(await screen.findByText(/Raise the batch's raw material stock requisition before requesting extra material/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Request extra material" }).hasAttribute("disabled")).toBe(true);
});
