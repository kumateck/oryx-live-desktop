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
const field = (id: string, section: string, label: string, template: boolean) => ({ formFieldId: id, formSectionId: section, sectionName: label, questionLabel: label, questionType: 0, templateReportOnCoa: template, override: null, reportOnCoa: template });
const reporting = { specificationId: "spec-a", analysisType: 1, formId: "micro", reason: null, savedAt: null,
  fields: [field("tamc", "s-tamc", "TAMC", true), field("media", "s-media", "Culture media verification", true), field("conclusion", "s-conclusion", "Conclusion", false)] };
function open(extra: string[]) {
  const backend = stubBackend({ permissions: ["CanViewProductSpecifications", ...extra] });
  const session = backend.fetcher.getMockImplementation();
  const calls: { method: string; body: string }[] = [];
  rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/product-specifications/spec-a/coa-reporting/1") {
      calls.push({ method: input.method, body: input.method === "GET" ? "" : await input.clone().text() });
      return Response.json(reporting);
    }
    if (path === "/api/v1/product-specifications/spec-a") return Response.json({ id: "spec-a", specificationNumber: "QCD/SPC/FP/120", product: { id: "product-a", name: "Paracetamol 120mg Syrup" }, testStage: 2,
      form: { id: "form", name: "Chemical" }, microbialFormId: "micro", microbialForm: { id: "micro", name: "Microbial" } });
    if (path === "/api/v1/form/form" || path === "/api/v1/form/micro") return Response.json({ id: "form", name: "Template", sections: [] });
    if (path === "/api/v1/form/section") return Response.json({ data: [] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/product-specification/:id/details", element: <ProductSpecificationDetailPage /> }], { initialEntries: ["/qc/product-specification/spec-a/details"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}

it("does not offer or query the reported tests without the view key", async () => {
  const { calls } = open(["CanEditProductSpecification", "CanEditProductCoaReportedTests"]);
  await screen.findByRole("heading", { name: /QCD\/SPC\/FP\/120/ });
  expect(screen.queryByRole("button", { name: "Microbial tests on COA" })).toBeNull();
  expect(calls).toEqual([]);
});
it("shows the reported tests read-only without the edit key", async () => {
  const { calls } = open(["CanViewProductCoaReportedTests"]);
  await userEvent.click(await screen.findByRole("button", { name: "Microbial tests on COA" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findAllByText("Culture media verification")).not.toHaveLength(0);
  expect(within(dialog).queryByRole("button", { name: "Edit reported tests" })).toBeNull();
  expect(within(dialog).getByRole("switch", { name: "Report TAMC on COA" }).hasAttribute("disabled")).toBe(true);
  expect(calls.filter((call) => call.method === "PUT")).toEqual([]);
});
it("saves only the choices that differ from the template, with a reason", async () => {
  const { calls } = open(["CanViewProductCoaReportedTests", "CanEditProductCoaReportedTests"]);
  await userEvent.click(await screen.findByRole("button", { name: "Microbial tests on COA" }));
  const dialog = await screen.findByRole("dialog");
  await userEvent.click(await within(dialog).findByRole("button", { name: "Edit reported tests" }));
  await userEvent.click(within(dialog).getByRole("switch", { name: "Report Culture media verification on COA" }));
  fireEvent.change(within(dialog).getByLabelText("Reason for the change"), { target: { value: "Media verification is a lab control, not a result." } });
  await userEvent.click(within(dialog).getByRole("button", { name: "Save reported tests" }));
  await waitFor(() => expect(calls.filter((call) => call.method === "PUT")).toHaveLength(1));
  expect(JSON.parse(calls.find((call) => call.method === "PUT")?.body ?? "{}")).toEqual({
    reason: "Media verification is a lab control, not a result.", overrides: [{ formFieldId: "media", reportOnCoa: false }] });
});
