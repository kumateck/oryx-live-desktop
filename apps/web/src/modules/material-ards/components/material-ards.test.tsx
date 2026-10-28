// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { MaterialArdDetailPage } from "./material-ard-detail";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const ard = { id: "a1", specNumber: "QCD/SPC/PM/002", description: "Old notes", isVerified: false, analysisType: 1, coaItems: [{ formFieldId: "x1" }], uniformityOfWeight: { id: "u1" },
  form: { id: "f1", name: "Bottle ARD" }, materialStandardTestProcedure: { id: "t1", stpNumber: "QCD/STP/PM/002", material: { id: "m1", name: "Amber bottle", code: "PM-9" } } };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") { calls.push({ method: input.method, path: url.pathname, body: await input.clone().text() }); return new Response(null, { status: 200 }); }
    if (url.pathname === "/api/v1/material-ard/a1") return Response.json(ard);
    if (url.pathname === "/api/v1/form/f1") return Response.json({ id: "f1", name: "Bottle ARD", sections: [{ id: "s1", name: "<p>Leak test</p>", order: 1, fields: [] }] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/analytical-raw-data/:id", element: <MaterialArdDetailPage /> }], { initialEntries: ["/qc/analytical-raw-data/a1?type=1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("saves an edit with the STP, template and the fields the page does not edit sent back unchanged", async () => {
  const user = userEvent.setup();
  const calls = open(["CanViewPackagingMaterialArds", "CanEditPackagingMaterialArd"]);
  await user.click(await screen.findByRole("button", { name: "Edit" }));
  const dialog = await screen.findByRole("dialog");
  const description = await within(dialog).findByLabelText(/Description/, { selector: "textarea" });
  await user.clear(description);
  await user.type(description, "New notes");
  await user.click(within(dialog).getByRole("button", { name: "Save" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/v1/material-ard/a1" });
  expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ stpId: "t1", formId: "f1", materialId: "m1", specNumber: "QCD/SPC/PM/002", description: "New notes",
    analysisType: 1, coaItems: [{ formFieldId: "x1" }], uniformityOfWeightId: "u1" });
}, 30_000);

it("approves a packaging record only with the packaging approval permission", async () => {
  const user = userEvent.setup();
  const calls = open(["CanViewPackagingMaterialArds", "CanVerifyPackagingMaterialArd"]);
  await user.click(await screen.findByRole("button", { name: "Approve" }));
  await user.click(await screen.findByRole("button", { name: "Approve" }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(JSON.parse(calls[0]?.body ?? "")).toEqual({ modelType: 3, modelId: "a1" });
}, 30_000);

it("offers no approval with only the raw permission", async () => {
  open(["CanViewPackagingMaterialArds", "CanVerifyRawMaterialArd"]);
  expect(await screen.findByText("Bottle ARD")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
});
