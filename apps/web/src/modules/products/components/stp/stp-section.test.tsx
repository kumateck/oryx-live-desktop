// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { StpSection } from "./stp-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const stpId = "11111111-1111-4111-8111-111111111111";

function open(options: { stp: boolean; status?: number }) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const calls: { method: string; path: string; body: string; form: boolean }[] = [];
  let exists = options.stp;
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const form = (input.headers.get("content-type") ?? "").startsWith("multipart/form-data");
    if (input.method !== "GET") calls.push({ method: input.method, path, form, body: form ? "" : await input.clone().text() });
    if (path === `/api/v1/product-stps/${id}/product`) return exists ? Response.json({ id: stpId, stpNumber: "QCD/STP/FP/007", description: "<p>Assay</p>" }) : new Response(null, { status: 404 });
    if (path === "/api/v1/product-stps" && input.method === "POST") { exists = true; return Response.json([{ productId: id, stpId }]); }
    if (path === `/api/v1/product-stps/${stpId}`) return new Response(null, { status: 204 });
    if (path === `/api/v1/stp-documents/ProductStandardTestProcedure/${stpId}`) return options.status === undefined ? new Response("null", { headers: { "content-type": "application/json" } })
      : Response.json({ id: "d1", status: options.status, versions: [{ versionNumber: 3, fileName: "assay.docx", createdByName: "Ama" }] });
    if (path === `/api/v1/stp-documents/ProductStandardTestProcedure/${stpId}/versions`) return Response.json({ id: "d1", status: 0, versions: [] });
    if (path === "/api/v1/configuration/ProductSTPNumber/count") return Response.json(41);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <StpSection productId={id} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

const numberInput = () => screen.findByLabelText(/STP number/, { selector: "input" });

it("suggests the next number for a new STP, asks for a document, then creates and uploads", async () => {
  const calls = open({ stp: false });
  const number = await numberInput();
  await waitFor(() => expect((number as HTMLInputElement).value).toBe("QCD/STP/FP/042"));
  expect(screen.getByText(/No document is attached yet/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Create STP" }));
  expect(await screen.findByText("Attach the STP as a .docx file")).toBeTruthy();
  expect(calls).toEqual([]);
  const picker = await screen.findByLabelText(/STP document/, { selector: "input" });
  fireEvent.change(picker, { target: { files: [new File(["x"], "assay.docx")] } });
  fireEvent.click(screen.getByRole("button", { name: "Create STP" }));
  await waitFor(() => expect(calls.length).toBe(2));
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ stpNumber: "QCD/STP/FP/042", description: "", productIds: [id] });
  expect(calls[1]).toMatchObject({ method: "POST", path: `/api/v1/stp-documents/ProductStandardTestProcedure/${stpId}/versions`, form: true });
});

it("edits a saved STP without touching its document", async () => {
  const calls = open({ stp: true, status: 0 });
  const number = await numberInput();
  expect((number as HTMLInputElement).value).toBe("QCD/STP/FP/007");
  expect(screen.getByText("assay.docx")).toBeTruthy();
  expect(screen.getByText("version 3")).toBeTruthy();
  fireEvent.change(number, { target: { value: "QCD/STP/FP/008" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]).toMatchObject({ method: "PUT", path: `/api/v1/product-stps/${stpId}` });
  expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ stpNumber: "QCD/STP/FP/008", description: "<p>Assay</p>" });
});

it("does not offer to replace a document that is under review", async () => {
  open({ stp: true, status: 1 });
  await numberInput();
  expect(screen.getByText("In review")).toBeTruthy();
  expect(screen.getByText(/cannot be replaced until the review/)).toBeTruthy();
  expect(screen.queryByLabelText(/Replace the document/)).toBeNull();
});
