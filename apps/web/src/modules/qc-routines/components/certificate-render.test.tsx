// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { CommercialCertificatePage } from "@/modules/commercial-certificates/components/commercial-certificate-page";
import { CertificateResult, CertificateSpecification } from "./certificate-result";

afterEach(() => { cleanup(); forgetSession(); });
it("renders the issued COA route and print preview from its frozen result rows", async () => {
  const backend = stubBackend();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  rememberSession();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") writes.push(path);
    if (path === "/api/v1/qc/commercial-certificates/c1") return Response.json({ id: "c1", certificateCode: "COA-1", issuedAt: "2026-10-19T12:00:00Z", rowsJson: JSON.stringify([
      { FormFieldId: "f1", DisplayLabel: "<p>Assay</p>", SpecificationText: "<p>99–101%</p>", result: JSON.stringify({ result: "99.87" }), Unit: "%" },
      { FormFieldId: "f2", DisplayLabel: "Loss on Drying", result: JSON.stringify({ W1: "10", W2: "12", W3: "11.99" }) },
    ]) });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qc/commercial-certificates/:id", element: <CommercialCertificatePage /> }], { initialEntries: ["/qc/commercial-certificates/c1"] });
  const { container } = render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  expect(await screen.findByText("99.87")).toBeTruthy();
  expect(screen.getByText("Assay")).toBeTruthy();
  // The issued COA reads as the printed certificate: numbered tests and a conclusion.
  expect(screen.getByRole("table", { name: "Certificate results" }).textContent).toContain("1.Assay");
  expect(screen.getByText(/complies with specification/)).toBeTruthy();
  expect(container.textContent).not.toContain("<p>");
  expect(container.textContent).not.toContain('"result"');
  expect(screen.getByText("Final formula result is not included in this issued snapshot.")).toBeTruthy();
  await userEvent.click(screen.getByText("Recorded inputs"));
  expect(screen.getByText("11.99")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: /^Print$/ }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("99.87")).toBeTruthy();
  expect(writes).toEqual([]);
});

it("keeps governed issued results authoritative and preserves zero values", () => {
  const { unmount } = render(<CertificateResult value={JSON.stringify({ formulaGoverned: true, formulaResultFinalized: true,
    formulaDisplayResultsJson: JSON.stringify([{ key: "Assay", value: "99.87", unit: "%" }]), result: 0 })} unit={null} />);
  expect(screen.getByText("99.87 %")).toBeTruthy();
  unmount();
  render(<CertificateResult value="0" unit="%" />);
  expect(screen.getByText("0")).toBeTruthy();
});

it("preserves the exact stored result text and does not duplicate a percent unit", () => {
  render(<CertificateResult value={JSON.stringify({ result: "99.8700%" })} unit="%" />);
  expect(screen.getByText("99.8700%")).toBeTruthy();
  expect(screen.queryByText("%", { exact: true })).toBeNull();
});

it("prints the issued product certificate's frozen conversion instead of its original worksheet inputs", () => {
  const average = { key: "average", label: "Average", sourceValue: 101.39, value: 2.43336, displayValue: "2.4334",
    unit: "% w/v", minimum: 2.32, maximum: 2.52, complies: true, nominalConcentration: 2.4, definitionHash: "hash", converted: true };
  const value = JSON.stringify({ originalResponse: '{"assay":101.39}', coaReportedResults: [
    { ...average, key: "sample1", label: "Sample 1", displayValue: "101.39", converted: false }, average,
  ] });
  render(<><CertificateResult value={value} unit="%" /><CertificateSpecification value={value} original="98–102%<br/>Average: 2.32–2.52 % w/v" /></>);
  expect(screen.getByText("2.4334 % w/v")).toBeTruthy();
  expect(screen.getByText("2.32–2.52 % w/v")).toBeTruthy();
  expect(screen.queryByText(/Sample 1|Average|101\.39|98–102%/)).toBeNull();
});

it("prints the issued header and signature table, and leaves them out on certificates issued without one", async () => {
  const header = { subject: "Product", name: "Paracetamol 120 Syrup BP", code: "NL-001", batchNumber: "L001K076",
    manufacturingDate: "2026-11-01T00:00:00Z", expiryDate: "2029-10-01T00:00:00Z", arNumber: "LQC/FP/26/0503",
    sampledAt: "2026-11-06T00:00:00Z", analysedAt: "2026-11-06T00:00:00Z",
    composition: "Each 5ml contains: Paracetamol BP 120mg", packStyle: "100 ml amber glass bottle with measuring cup", shelfLife: "36 Months",
    analysedBy: [{ name: "Richmond Ocran Danso", designation: "Analyst" }], checkedBy: [{ name: "Michael Arthur", designation: "QC Head" }],
    approvedBy: [{ name: "Nandkumar Chavan", designation: "GM-QA" }] };
  const open = (headerJson: string | null) => {
    const backend = stubBackend();
    const session = backend.fetcher.getMockImplementation();
    rememberSession();
    backend.fetcher.mockImplementation(async (input, init) => {
      if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 404 });
      if (new URL(input.url).pathname === "/api/v1/qc/commercial-certificates/c2") return Response.json({ id: "c2", certificateCode: "COA-2", target: 1,
        issuedAt: "2026-11-07T12:00:00Z", headerJson, rowsJson: JSON.stringify([{ AnalysisType: 0, FormFieldId: "ph", DisplayLabel: "pH", SpecificationText: "4.0 – 6.0", result: "4.99" }]) });
      return new Response(null, { status: 404 });
    });
    const router = createMemoryRouter([{ path: "/qc/commercial-certificates/:id", element: <CommercialCertificatePage /> }], { initialEntries: ["/qc/commercial-certificates/c2"] });
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  };
  open(JSON.stringify(header));
  const details = await screen.findByRole("table", { name: "Certificate details" });
  expect(details.textContent).toContain("L001K076");
  expect(details.textContent).toContain("LQC/FP/26/0503");
  expect(within(details).getByText(/Paracetamol 120 Syrup BP/)).toBeTruthy();
  expect(screen.getByRole("table", { name: "Product details" }).textContent).toContain("36 Months");
  const signatures = screen.getByRole("table", { name: "Certificate signatures" });
  expect(signatures.textContent).toContain("Nandkumar Chavan");
  expect(signatures.textContent).toContain("GM-QA");
  cleanup(); forgetSession();
  open(null);
  expect(await screen.findByText("4.99")).toBeTruthy();
  expect(screen.queryByRole("table", { name: "Certificate details" })).toBeNull();
  expect(screen.queryByRole("table", { name: "Certificate signatures" })).toBeNull();
});
