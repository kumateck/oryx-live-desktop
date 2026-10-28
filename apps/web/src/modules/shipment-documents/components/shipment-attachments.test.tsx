// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import ShipmentDocumentPage from "../../../pages/(workspace)/logistics/shipment-documents/[id]/details/page";
import WaybillPage from "../../../pages/(workspace)/logistics/waybill/[id]/details/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";

vi.mock("@/shared/attachments/validation-client", () => ({ validateInWorker: async (bytes: ArrayBuffer) => bytes }));
afterEach(() => { cleanup(); forgetSession(); });
const fileName = "Invoice_KUMATECK_24th_July_2026.pdf";
const fileLink = "http://customer.example/api/v1/file/shipmentdocument/record/reference";
const cases = [
  { Page: ShipmentDocumentPage, route: "/logistics/shipment-documents/:id/details", address: "/logistics/shipment-documents/record/details", endpoint: "shipment-document", permission: "CanViewShipmentDocument", type: 0 },
  { Page: WaybillPage, route: "/logistics/waybill/:id/details", address: "/logistics/waybill/record/details", endpoint: "waybill", permission: "CanViewWaybill", type: 1 },
];

it.each(cases)("opens PDF bytes rather than a native PDF iframe on $address", async ({ Page, route, address, endpoint, permission, type }) => {
  const backend = stubBackend({ permissions: [permission] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const files: string[] = [];
  const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/v1/file/")) {
      files.push(input);
      return new Response("%PDF-1.7 test bytes", { headers: { "Content-Type": "application/pdf", "Content-Disposition": "attachment; filename=invoice.pdf" } });
    }
    if (typeof input === "string" && input.startsWith("/viewers/")) return new Response(input.endsWith(".js") ? "export {};" : "wasm fixture");
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (input.method !== "GET") writes.push(input.method);
    return new URL(input.url).pathname === `/api/v1/procurement/${endpoint}/record`
      ? Response.json({ id: "record", code: "SD049", type, status: 4, shipmentInvoice: null, attachments: [{ id: "pdf", name: fileName, link: fileLink }] })
      : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: route, element: <Page /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  await userEvent.click(await screen.findByRole("button", { name: fileName }));
  expect(await screen.findByRole("dialog", { name: fileName })).toBeTruthy();
  const frame = await waitFor(() => {
    const element = screen.getByTitle(`Preview of ${fileName}`);
    expect(element.getAttribute("srcdoc")).toContain("pdfcraft_canvas");
    return element;
  });
  expect(frame.getAttribute("src")).toBeNull();
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
  expect(files).toEqual(["/api/v1/file/shipmentdocument/record/reference"]);
  expect(screen.queryByRole("link", { name: "Open in browser" })).toBeNull();
  expect(writes).toEqual([]);
});
