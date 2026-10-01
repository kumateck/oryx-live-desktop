// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { SpecificationSection } from "./spec-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const spec = { id: "s1", testStage: 1, specificationNumber: "NMP/B/SPC/004", revisionNumber: "01", supersedesNumber: "None", effectiveDate: "2999-01-01T00:00:00Z",
  reviewDate: "2999-06-01T00:00:00Z", dueDate: "2026-01-01T00:00:00Z", reference: "REF-1", description: "<p>Bulk</p>", form: { id: "f-bulk", name: "Bulk form" } };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") calls.push({ method: input.method, path: url.pathname, body: await input.clone().text() });
    if (url.pathname === `/api/v1/product-specifications/product/${id}`) return Response.json([spec]);
    if (url.pathname === "/api/v1/product-specifications/s1") return Response.json([]);
    if (url.pathname === "/api/v1/configuration/ProductSpecNumber/count") return Response.json(url.searchParams.get("prefix") === "NMP/FP/SPC" ? 9 : 0);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <SpecificationSection productId={id} division={1} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("offers the stages without a specification and suggests the next number in the stage's series", async () => {
  const calls = open(["CanCreateProductSpecification"]);
  expect(await screen.findByText("NMP/B/SPC/004")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add bulk" })).toBeNull();
  expect(screen.queryByRole("button", { name: /^Edit/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add finished" }));
  const dialog = await screen.findByRole("dialog");
  const number = await within(dialog).findByLabelText(/Specification number/, { selector: "input" });
  await waitFor(() => expect((number as HTMLInputElement).value).toBe("NMP/FP/SPC/010"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Add specification" }));
  expect(await within(dialog).findByText("Enter the revision number")).toBeTruthy();
  expect(await within(dialog).findByText("Choose a template")).toBeTruthy();
  expect(calls).toEqual([]);
});

it("edits a specification keeping its stage, due date and reference", async () => {
  const calls = open(["CanEditProductSpecification"]);
  fireEvent.click(await screen.findByRole("button", { name: "Edit Bulk specification" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/shared by several products/)).toBeTruthy();
  const revision = await within(dialog).findByLabelText(/^Revision\b(?! date)/, { selector: "input" });
  fireEvent.change(revision, { target: { value: "02" } });
  fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/v1/product-specifications/s1" });
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ specificationNumber: "NMP/B/SPC/004", revisionNumber: "02", supersedesNumber: "None", formId: "f-bulk",
    testStage: 1, dueDate: "2026-01-01T00:00:00Z", reference: "REF-1", description: "<p>Bulk</p>" });
});
