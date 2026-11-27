// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { CertificateChangeRequestNotice, CertificateRequestButtons, PendingCertificateEditButton } from "./pending-certificate-actions";

const pending = { id: "response-1", checkedAt: "2026-11-25", checkedBy: { id: testUserId }, hasPendingApproval: true, coaSubjectKind: 0, coaVersion: 3 };
const sections = [{ id: "ph", name: "pH" }, { id: "assay", name: "Assay" }];
const compliance = [{ formSectionId: "ph", complies: true }, { formSectionId: "assay", complies: true, reportingLocked: true }];

function mount(element: React.ReactNode, permissions: string[]) {
  const backend = stubBackend({ permissions });
  const base = backend.fetcher.getMockImplementation();
  const writes: { path: string; method: string; body: string }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request && input.url.includes("/pending-certificates/")) {
      writes.push({ path: new URL(input.url).pathname, method: input.method, body: await input.text() });
      return new Response(null, { status: 204 });
    }
    return base ? base(input, init) : new Response(null, { status: 500 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider>{element}</ApiProvider></SessionProvider>);
  return writes;
}

afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });

it("shows the request reason and lets the preparer change compliance and notes", async () => {
  const response = { ...pending, coaReturnKind: 2 as const, coaReturnReason: "Check the pH decision.", certificateNotes: "Previous note" };
  const onSaved = vi.fn();
  const writes = mount(<><CertificateChangeRequestNotice response={response} />
    <PendingCertificateEditButton response={response} sections={sections} compliance={compliance} onSaved={onSaved} /></>, ["CanEditProductCertificateOfAnalysis"]);
  fireEvent.click(await screen.findByRole("button", { name: "Review and resubmit" }));
  const dialog = await screen.findByRole("dialog", { name: "Edit certificate" });
  const editor = within(dialog);
  expect(editor.getByText("Check the pH decision.")).toBeTruthy();
  expect(editor.queryByText("Assay")).toBeNull();
  fireEvent.click(editor.getByRole("radio", { name: "Does not comply" }));
  fireEvent.change(editor.getByLabelText("Certificate notes"), { target: { value: "Updated note" } });
  fireEvent.change(editor.getByLabelText("Reason for resubmission"), { target: { value: "Rechecked the worksheet" } });
  fireEvent.click(editor.getByRole("button", { name: "Save and resubmit" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  expect(writes).toHaveLength(1);
  expect(writes[0]).toMatchObject({ path: "/api/v1/pending-certificates/response-1/product", method: "PUT" });
  expect(JSON.parse(writes[0]?.body ?? "{}")).toEqual({ version: 3, reason: "Rechecked the worksheet", notes: "Updated note",
    compliance: [{ formSectionId: "ph", complies: false }] });
});

it("re-runs the compliance check and saves its result even when the preparer changes nothing", async () => {
  // pH was saved as not complying; the corrected specification now passes it, as generating the certificate would.
  const saved = [{ formSectionId: "ph", complies: false }, { formSectionId: "assay", complies: true, reportingLocked: true }];
  const rechecked = [{ formSectionId: "ph", complies: true, requiresReview: false }, { formSectionId: "assay", complies: false, requiresReview: false }];
  const onSaved = vi.fn();
  const writes = mount(<PendingCertificateEditButton response={pending} sections={sections} compliance={saved} rechecked={rechecked} onSaved={onSaved} />,
    ["CanEditProductCertificateOfAnalysis"]);
  fireEvent.click(await screen.findByRole("button", { name: "Edit COA" }));
  const editor = within(await screen.findByRole("dialog", { name: "Edit certificate" }));
  expect((editor.getByRole("radio", { name: "Complies" }) as HTMLButtonElement).getAttribute("aria-checked")).toBe("true");
  expect(editor.getByText(/Re-checked against the specification: saved as does not comply/)).toBeTruthy();
  fireEvent.change(editor.getByLabelText("Reason for resubmission"), { target: { value: "Specification corrected" } });
  fireEvent.click(editor.getByRole("button", { name: "Save and resubmit" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
  // The assay is locked by its reporting limits, so it is neither re-checked nor sent.
  expect(JSON.parse(writes[0]?.body ?? "{}")).toMatchObject({ compliance: [{ formSectionId: "ph", complies: true }] });
});

it("keeps the saved decision where the check cannot assess the result", async () => {
  const saved = [{ formSectionId: "ph", complies: false }];
  const writes = mount(<PendingCertificateEditButton response={pending} sections={sections} compliance={saved}
    rechecked={[{ formSectionId: "ph", complies: false, requiresReview: true }]} onSaved={() => {}} />, ["CanEditProductCertificateOfAnalysis"]);
  fireEvent.click(await screen.findByRole("button", { name: "Edit COA" }));
  const editor = within(await screen.findByRole("dialog", { name: "Edit certificate" }));
  expect(editor.queryByText(/Re-checked against the specification/)).toBeNull();
  fireEvent.change(editor.getByLabelText("Reason for resubmission"), { target: { value: "Resubmitting" } });
  fireEvent.click(editor.getByRole("button", { name: "Save and resubmit" }));
  await waitFor(() => expect(writes).toHaveLength(1));
  expect(JSON.parse(writes[0]?.body ?? "{}")).toMatchObject({ compliance: [{ formSectionId: "ph", complies: false }] });
});

it("uses the matching review or correction permission and sends a reason with the reviewed version", async () => {
  const onRequested = vi.fn();
  const writes = mount(<CertificateRequestButtons response={pending} onRequested={onRequested} />, ["CanRequestProductCertificateCorrection"]);
  fireEvent.click(await screen.findByRole("button", { name: "Request correction" }));
  expect(screen.queryByRole("button", { name: "Request review" })).toBeNull();
  const dialog = within(await screen.findByRole("dialog", { name: "Request correction" }));
  fireEvent.click(dialog.getByRole("button", { name: "Request correction" }));
  expect((await dialog.findByRole("alert")).textContent).toMatch(/Enter what the preparer needs to address/);
  expect(writes).toHaveLength(0);
  fireEvent.change(dialog.getByLabelText("Reason"), { target: { value: "Correct the notes" } });
  fireEvent.click(dialog.getByRole("button", { name: "Request correction" }));
  await waitFor(() => expect(onRequested).toHaveBeenCalledOnce());
  expect(writes[0]).toMatchObject({ path: "/api/v1/pending-certificates/response-1/product/correction-request", method: "POST" });
  expect(JSON.parse(writes[0]?.body ?? "{}")).toEqual({ version: 3, reason: "Correct the notes" });
});

it("keeps approved certificates read-only and shows no edit for someone else's certificate", async () => {
  const writes = mount(<>
    <PendingCertificateEditButton response={{ ...pending, approved: true }} sections={sections} compliance={[]} onSaved={() => {}} />
    <PendingCertificateEditButton response={{ ...pending, checkedBy: { id: "other" } }} sections={sections} compliance={[]} onSaved={() => {}} />
    <CertificateRequestButtons response={{ ...pending, approved: true }} onRequested={() => {}} />
    <CertificateRequestButtons response={pending} onRequested={() => {}} />
  </>, ["CanEditProductCertificateOfAnalysis", "CanRequestProductCertificateReview"]);
  await screen.findByRole("button", { name: "Request review" });
  expect(screen.queryByRole("button", { name: "Edit COA" })).toBeNull();
  expect(screen.getByText(/Only the original preparer can edit/)).toBeTruthy();
  expect(writes).toEqual([]);
});

it("exposes Edit COA for the original preparer before approval without waiting for a correction request", async () => {
  mount(<PendingCertificateEditButton response={pending} sections={sections} compliance={compliance} onSaved={() => {}} />,
    ["CanEditProductCertificateOfAnalysis"]);
  fireEvent.click(await screen.findByRole("button", { name: "Edit COA" }));
  expect(await screen.findByRole("dialog", { name: "Edit certificate" })).toBeTruthy();
});
