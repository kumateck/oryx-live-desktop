// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { CommercialCertificatePage } from "@/modules/commercial-certificates/components/commercial-certificate-page";
import { CertificateResult } from "./certificate-result";

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
