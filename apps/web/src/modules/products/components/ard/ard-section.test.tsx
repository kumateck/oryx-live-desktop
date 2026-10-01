// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { ArdSection } from "./ard-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const ard = { id: "a1", specNumber: "SPEC-B", stage: 1, analysisType: 1, description: "Bulk checks", form: { id: "f-bulk", name: "Bulk form" },
  productStandardTestProcedure: { id: "stp-1", stpNumber: "QCD/STP/FP/001" }, attachments: [{ id: "x", name: "method.pdf", link: "javascript:alert(1)" }] };

function open(permissions: string[], ards: object[] = [ard]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === `/api/v1/product-ard/product/${id}`) return Response.json(ards);
    if (path === `/api/v1/product-stps/${id}/product`) return Response.json({ id: "stp-1", stpNumber: "QCD/STP/FP/001" });
    if (path === `/api/v1/product-specifications/product/${id}`) return Response.json([{ testStage: 2, specificationNumber: "SPEC-F", form: { id: "f-fin", name: "Finished form" } }]);
    if (path === "/api/v1/product-ard" && input.method === "POST") return Response.json("a2");
    if (path === "/api/v1/product-ard/a1") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <ArdSection productId={id} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("adds a record for a stage that is ready and explains the stage that is not", async () => {
  const calls = open(["CanCreateProductArd"]);
  expect(await screen.findByText("Bulk form")).toBeTruthy();
  expect(screen.getByText("Intermediate cannot be added yet: it needs an intermediate specification.")).toBeTruthy();
  // Without the edit permission there is no edit action.
  expect(screen.queryByRole("button", { name: /^Edit/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add finished" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Finished form")).toBeTruthy();
  const number = await within(dialog).findByLabelText(/Specification number/, { selector: "input" });
  expect((number as HTMLInputElement).value).toBe("SPEC-F");
  fireEvent.click(within(dialog).getByRole("button", { name: "Add analytical raw data" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ specNumber: "SPEC-F", description: "", stage: 2, stpId: "stp-1", formId: "f-fin" });
});

it("edits a record keeping its analysis type, and never links an unsafe file address", async () => {
  const calls = open(["CanEditProductArd"]);
  fireEvent.click(await screen.findByRole("button", { name: "Edit Bulk analytical raw data" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("method.pdf").closest("a")).toBeNull();
  expect(screen.queryByRole("button", { name: /^Add (bulk|finished|intermediate)$/ })).toBeNull();
  const number = await within(dialog).findByLabelText(/Specification number/, { selector: "input" });
  fireEvent.change(number, { target: { value: "SPEC-B2" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/v1/product-ard/a1" });
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ specNumber: "SPEC-B2", description: "Bulk checks", stage: 1, stpId: "stp-1", formId: "f-bulk", analysisType: 1 });
});
