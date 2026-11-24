// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ProductSpecificationDetailPage } from "./product-specification-pages";

afterEach(() => { cleanup(); forgetSession(); });
const configuration = { specificationId: "spec-a", productId: "product-a", productName: "Product A", specificationNumber: "SHARED", testStage: 2, token: "version-1", rules: [],
  fields: [{ formFieldId: "field-a", testName: "Assay", label: "Active A", specification: "2.32–2.52% w/v", definitionHash: "hash-a", outputs: [{ key: "average", label: "Average" }] },
    { formFieldId: "field-b", testName: "Assay", label: "Active B", specification: "98–102%", definitionHash: "hash-b", outputs: [{ key: "average", label: "Average" }] }] };
function open(extra: string[], status = 200) {
  const backend = stubBackend({ permissions: ["CanViewProductSpecifications", ...extra] });
  const session = backend.fetcher.getMockImplementation();
  const calls: { method: string; path: string; body: string }[] = [];
  rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/product-specifications/spec-a/assay-reporting") {
      calls.push({ method: input.method, path, body: input.method === "GET" ? "" : await input.clone().text() });
      if (input.method === "PUT") return status === 200 ? Response.json({ ...configuration, token: "version-2" }) : Response.json({ title: "The settings changed. Reload and review." }, { status });
      return Response.json(configuration);
    }
    if (path === "/api/v1/product-specifications/spec-a") return Response.json({ id: "spec-a", specificationNumber: "SHARED", product: { id: "product-a", name: "Product A" }, testStage: 2, form: { id: "form", name: "Reusable template" } });
    if (path === "/api/v1/form/form") return Response.json({ id: "form", name: "Reusable template", sections: [] });
    if (path === "/api/v1/form/section") return Response.json({ data: [] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/product-specification/:id/details", element: <ProductSpecificationDetailPage /> }], { initialEntries: ["/qc/product-specification/spec-a/details"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, backend };
}

it("does not offer or query reporting settings without the dedicated view key", async () => {
  const { calls } = open(["CanEditProductSpecification"]);
  await screen.findByRole("heading", { name: /SHARED.*Product A/ });
  expect(screen.queryByRole("button", { name: "COA assay reporting" })).toBeNull();
  expect(calls).toEqual([]);
});
it("shows independent assay outputs without edit actions for a reporting viewer", async () => {
  const { calls } = open(["CanViewProductAssayReporting"]);
  await userEvent.click(await screen.findByRole("button", { name: "COA assay reporting" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Active A · Average")).toBeTruthy();
  expect(within(dialog).getByText("Active B · Average")).toBeTruthy();
  expect(within(dialog).queryByRole("button", { name: /Reporting for/ })).toBeNull();
  expect(calls.filter(call => call.method === "PUT")).toEqual([]);
});
it.each([200, 409])("saves only the selected product/output and keeps a refused save visible (%s)", async status => {
  const { calls } = open(["CanViewProductAssayReporting", "CanEditProductAssayReporting"], status);
  await userEvent.click(await screen.findByRole("button", { name: "COA assay reporting" }));
  await userEvent.click(await screen.findByRole("button", { name: "Reporting for Active A · Average" }));
  await userEvent.click(await screen.findByRole("menuitem", { name: "Edit reporting" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(await within(dialog).findByRole("switch", { name: /Report this output/ }));
  fireEvent.change(within(dialog).getByLabelText(/Nominal concentration \(% w\/v\)/), { target: { value: "2.4" } });
  fireEvent.change(within(dialog).getByLabelText(/Specification lower limit/), { target: { value: "2.32" } });
  fireEvent.change(within(dialog).getByLabelText(/Specification upper limit/), { target: { value: "2.52" } });
  fireEvent.change(within(dialog).getByLabelText(/Reason for change/), { target: { value: "Approved product assay basis." } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Save reporting settings" }));
  await waitFor(() => expect(calls.filter(call => call.method === "PUT")).toHaveLength(1));
  const saved = calls.find(call => call.method === "PUT");
  expect(JSON.parse(saved?.body ?? "{}")).toMatchObject({ expectedToken: "version-1", rules: [{ formFieldId: "field-a", resultKey: "average", nominalConcentration: 2.4 }] });
  expect(saved?.body).not.toContain("field-b");
  if (status === 409) expect(await screen.findByRole("alert")).toBeTruthy();
  else await screen.findByText("Active B · Average");
});
