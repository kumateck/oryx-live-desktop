// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { formatDateTime } from "../../../shared/format/dates";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { CompleteMaterialSpecificationPage, MaterialSpecificationDetailPage } from "./material-specification-pages";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const spec = { id: "s1", specificationNumber: "QCD/SPC/PM/003", revisionNumber: "01", supersedesNumber: "None", effectiveDate: "2026-01-01T00:00:00Z", reviewDate: "2027-01-01T00:00:00Z",
  form: { id: "f1", name: "Bottle template" }, isVerified: false, material: { id: "m1", name: "Amber bottle", code: "PM-9", kind: 1 } };
const template = { name: "Bottle template", sections: [{ id: "b", name: "<p>Leak test</p>", description: "<p>No leaks</p>", order: 2 }, { id: "a", name: "<p>Dimensions</p>", description: "<p>40 mm</p>", order: 1 }] };

function open(path: string, permissions: string[], waitForSavedReferences?: Promise<void>) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; search: string; body: string }[] = [];
  let savedReferences = [{ id: "a", value: "0" }];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") {
      calls.push({ method: input.method, path: url.pathname, search: url.search, body: await input.clone().text() });
      if (url.pathname === "/api/v1/form/responses/section") {
        savedReferences = [{ id: "a", value: "0" }, { id: "b", value: "1" }];
      }
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/api/v1/material-specifications/s1") return Response.json(spec);
    if (url.pathname === "/api/v1/specification-print/packaging-material/s1") return Response.json({
      revisedBy: "Kofi Mensah", revisedAt: "2026-11-12T15:10:00Z", historyAvailableFrom: "2026-10-27T09:00:00Z",
      revisions: [{ specificationNumber: "QCD/SPC/PM/003", revisionNumber: "01", supersedesNumber: "None",
        recordedBy: "Ama Owusu", occurredAt: "2026-10-27T09:00:00Z", event: "History baseline" }],
    });
    if (url.pathname === "/api/v1/form/f1") return Response.json(template);
    if (url.pathname === "/api/v1/form/section") {
      if (savedReferences.length > 1) await waitForSavedReferences;
      return Response.json({ data: savedReferences });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/qc/material-specification/:id/details", element: <MaterialSpecificationDetailPage /> },
    { path: "/qc/material-specification/:id/complete", element: <CompleteMaterialSpecificationPage /> },
  ], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("sends every test's reference only once each test has one", async () => {
  const user = userEvent.setup();
  let releaseRefresh = () => {};
  const refresh = new Promise<void>((resolve) => { releaseRefresh = resolve; });
  const { calls, router } = open("/qc/material-specification/s1/complete", ["CanEditPackagingMaterialSpecification"], refresh);
  const first = await screen.findByRole("combobox", { name: "Reference for test 1" });
  // Tests follow the template's order, with the saved reference already chosen.
  expect(first.textContent).toBe("BP");
  await user.click(screen.getByRole("button", { name: "Save specification" }));
  expect(await screen.findByText("Choose a reference for every test.")).toBeTruthy();
  expect(calls).toEqual([]);
  await user.click(screen.getByRole("combobox", { name: "Reference for test 2" }));
  await user.click(await screen.findByRole("option", { name: "USP" }));
  await user.click(screen.getByRole("button", { name: "Save specification" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]).toMatchObject({ method: "POST", path: "/api/v1/form/responses/section", search: "?materialSpecificationId=s1" });
  expect(JSON.parse(calls[0]?.body ?? "")).toEqual([{ formSectionId: "a", value: "0" }, { formSectionId: "b", value: "1" }]);
  await waitFor(() => expect(router.state.location.pathname).toBe("/qc/material-specification/s1/details"));
  expect(await screen.findByRole("status", { name: "Loading specification" })).toBeTruthy();
  expect(screen.queryByText("Not set")).toBeNull();
  releaseRefresh();
  expect(await screen.findByText("USP")).toBeTruthy();
}, 30_000);

it("approves a packaging specification with the packaging permission, after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/qc/material-specification/s1/details", ["CanViewPackagingMaterialSpecifications", "CanVerifyPackagingMaterialSpecification"]);
  expect(await screen.findByText("Leak test")).toBeTruthy();
  expect(screen.getByText("BP")).toBeTruthy();
  expect(screen.getByText("Not set")).toBeTruthy();
  // Without edit permission there is nothing to edit or complete.
  expect(screen.queryByRole("link", { name: /Edit/ })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Approve" }));
  expect(calls).toEqual([]);
  await user.click(await screen.findByRole("button", { name: "Approve", hidden: false }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/verification")).toBe(true));
  expect(JSON.parse(calls.find((call) => call.path === "/api/v1/verification")?.body ?? "")).toEqual({ modelType: 1, modelId: "s1" });
}, 30_000);

it("requires the packaging export permission to print", async () => {
  open("/qc/material-specification/s1/details", ["CanViewPackagingMaterialSpecifications", "CanExportRawMaterialSpecification"]);
  expect(await screen.findByText("Leak test")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Print specification" })).toBeNull();
});

it("prints the saved specification with revision author, date and history", async () => {
  const { calls } = open("/qc/material-specification/s1/details", ["CanViewPackagingMaterialSpecifications", "CanExportPackagingMaterialSpecification"]);
  await userEvent.click(await screen.findByRole("button", { name: "Print specification" }));
  const preview = within(await screen.findByRole("dialog"));
  expect(await preview.findByRole("heading", { name: "Material specification" })).toBeTruthy();
  expect(preview.getByText("Amber bottle")).toBeTruthy();
  expect(preview.getByText("40 mm")).toBeTruthy();
  expect(preview.getByText("No leaks")).toBeTruthy();
  expect(preview.getByText("BP")).toBeTruthy();
  expect(preview.getByText("Revision By")).toBeTruthy();
  expect(preview.getByText("Kofi Mensah")).toBeTruthy();
  expect(preview.getByText(formatDateTime("2026-11-12T15:10:00Z") ?? "missing date")).toBeTruthy();
  const history = within(preview.getByRole("table", { name: "Specification history" }));
  expect(history.getByText("History baseline")).toBeTruthy();
  expect(history.getByText("Ama Owusu")).toBeTruthy();
  expect(preview.getByRole("button", { name: "Print" })).toHaveProperty("disabled", false);
  expect(calls).toEqual([]);
});
