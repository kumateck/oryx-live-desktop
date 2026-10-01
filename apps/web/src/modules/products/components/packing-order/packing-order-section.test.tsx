// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { PackingOrderSection } from "./packing-order-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";

function open(product: object | null) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push(`${input.method} ${path}`);
    if (path === `/api/v1/product/${id}`) return product ? Response.json(product) : new Response(null, { status: 500 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <PackingOrderSection productId={id} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("opens ready to edit and names each pack that is not described", async () => {
  const calls = open({ id, primaryPackDescription: "<p>Fill 100 ml into the bottle</p>", secondaryPackDescription: null });
  expect(await screen.findByText("Fill 100 ml into the bottle")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Save packing order" }));
  expect(await screen.findByText("Describe the secondary pack")).toBeTruthy();
  expect(screen.getByText("Describe the tertiary pack")).toBeTruthy();
  expect(screen.queryByText("Describe the primary pack")).toBeNull();
  expect(calls).toEqual([]);
});

it("offers a retry when the product cannot be loaded", async () => {
  open(null);
  expect((await screen.findByRole("alert")).textContent).toContain("Retry");
});
