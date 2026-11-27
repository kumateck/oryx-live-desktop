// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { MaterialSpecificationDetailPage } from "./material-specification-pages";

afterEach(() => { cleanup(); forgetSession(); });
// A packaging specification (kind 1) with a microbial template.
const spec = { id: "s1", specificationNumber: "QCD/SPC/PM/003", revisionNumber: "01", supersedesNumber: "None", effectiveDate: "2026-01-01T00:00:00Z",
  reviewDate: "2027-01-01T00:00:00Z", form: { id: "f1", name: "Bottle template" }, microbialFormId: "micro", microbialForm: { id: "micro", name: "Microbial" },
  isVerified: true, material: { id: "m1", name: "Amber bottle", code: "PM-9", kind: 1 } };
const field = (id: string, label: string, template: boolean) => ({ formFieldId: id, formSectionId: `s-${id}`, sectionName: label, questionLabel: label,
  questionType: 0, templateReportOnCoa: template, override: null, reportOnCoa: template });
const reporting = { specificationId: "s1", analysisType: 1, formId: "micro", reason: null, savedAt: null,
  fields: [field("tamc", "TAMC", true), field("media", "Culture media verification", true)] };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions: ["CanViewPackagingMaterialSpecifications", ...permissions] });
  const session = backend.fetcher.getMockImplementation();
  const calls: { method: string; path: string; body: string }[] = [];
  rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
    const path = new URL(input.url).pathname;
    if (path.includes("/coa-reporting/")) {
      calls.push({ method: input.method, path, body: input.method === "GET" ? "" : await input.clone().text() });
      return Response.json(reporting);
    }
    if (path === "/api/v1/material-specifications/s1") return Response.json(spec);
    if (path === "/api/v1/form/f1" || path === "/api/v1/form/micro") return Response.json({ name: "Template", sections: [] });
    if (path === "/api/v1/form/section") return Response.json({ data: [] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/material-specification/:id/details", element: <MaterialSpecificationDetailPage /> }],
    { initialEntries: ["/qc/material-specification/s1/details"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}

it("does not offer the reported tests without the packaging view key, even with the raw material keys", async () => {
  const { calls } = open(["CanViewRawMaterialCoaReportedTests", "CanEditRawMaterialCoaReportedTests"]);
  await screen.findByRole("heading", { name: /QCD\/SPC\/PM\/003/ });
  expect(screen.queryByRole("button", { name: "Microbial tests on COA" })).toBeNull();
  expect(calls).toEqual([]);
});

it("shows the material's reported tests read-only without the packaging edit key", async () => {
  const { calls } = open(["CanViewPackagingMaterialCoaReportedTests"]);
  await userEvent.click(await screen.findByRole("button", { name: "Microbial tests on COA" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findAllByText("Culture media verification")).not.toHaveLength(0);
  expect(within(dialog).queryByRole("button", { name: "Edit reported tests" })).toBeNull();
  expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(["GET /api/v1/material-specifications/s1/coa-reporting/1"]);
});

it("saves the material specification's override with a reason through the material endpoint", async () => {
  const { calls } = open(["CanViewPackagingMaterialCoaReportedTests", "CanEditPackagingMaterialCoaReportedTests"]);
  await userEvent.click(await screen.findByRole("button", { name: "Microbial tests on COA" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(await within(dialog).findByRole("button", { name: "Edit reported tests" }));
  await userEvent.click(within(dialog).getByRole("switch", { name: "Report Culture media verification on COA" }));
  fireEvent.change(within(dialog).getByLabelText("Reason for the change"), { target: { value: "Media verification is a lab control, not a result." } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Save reported tests" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
  const put = calls.find((call) => call.method === "PUT");
  expect(put?.path).toBe("/api/v1/material-specifications/s1/coa-reporting/1");
  expect(JSON.parse(put?.body ?? "{}")).toEqual({ reason: "Media verification is a lab control, not a result.", overrides: [{ formFieldId: "media", reportOnCoa: false }] });
});
