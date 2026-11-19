// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { formatDateTime, formatMonthYear } from "@/shared/format/dates";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { SessionReady } from "@/test/session-ready";
import { AtrRequestSection } from "./atr-request-section";

afterEach(() => { cleanup(); forgetSession(); });

// Paracetamol Syrup 120mg, as on the paper request (Annexure QAD/SOP/046/F02-04).
const request = {
  stage: 1 as const, state: { name: "Liquid" }, createdAt: "2026-11-02T08:00:00Z", createdBy: { firstName: "Ama", lastName: "Owusu" },
  manufacturingDate: "2026-11-01T00:00:00Z", expiryDate: "2029-10-31T00:00:00Z", filled: "100 mL", sampledQuantity: "100 mL", numberOfContainers: 2,
  sampledBy: { firstName: "Kofi", lastName: "Mensah" }, sampledAt: "2026-11-02T09:00:00Z", acknowledgedBy: { firstName: "Esi", lastName: "Boateng" },
  acknowledgedAt: "2026-11-02T10:00:00Z", releasedAt: null,
  batchManufacturingRecord: { batchNumber: "L001K073" },
  productionScheduleProduct: { product: { name: "Paracetamol Syrup 120mg", code: "NL-012" }, productPacking: { name: "1 x 100 mL" } },
};

// The stage's test response: QC generated the certificate, then QA gave the final approval.
const response = { checkedBy: { firstName: "Isaac", lastName: "Aidoo" }, checkedAt: "2026-11-12T14:05:00Z",
  approvedBy: { firstName: "Abena", lastName: "Darko" }, approvedAt: "2026-11-13T09:30:00Z" };

function open(permissions: string[], withResponse: typeof response | null = null) {
  stubBackend({ permissions });
  rememberSession();
  render(<SessionProvider><SessionReady><AtrRequestSection data={request} response={withResponse} /></SessionReady></SessionProvider>);
}

it("lays out the request like the paper form, ticking its stage and product state", async () => {
  open([]);
  const table = await screen.findByRole("table", { name: "Analytical test request" });
  const form = within(table);
  const ticked = (label: string) => form.getByText(label).parentElement?.textContent?.includes("(ticked)");
  expect(ticked("Bulk")).toBe(true);
  expect(ticked("Intermediate")).toBe(false);
  expect(ticked("Liquid")).toBe(true);
  expect(ticked("Granules")).toBe(false);
  const text = table.textContent ?? "";
  for (const value of ["Paracetamol Syrup 120mg · NL-012", "L001K073", formatMonthYear("2026-11-01T00:00:00Z"), formatMonthYear("2029-10-31T00:00:00Z"),
    "1 x 100 mL", `Kofi Mensah · ${formatDateTime("2026-11-02T09:00:00Z")}`, `Esi Boateng · ${formatDateTime("2026-11-02T10:00:00Z")}`, `Ama Owusu · ${formatDateTime("2026-11-02T08:00:00Z")}`]) {
    expect(text).toContain(value);
  }
  expect(screen.getByText("Annexure No. QAD/SOP/046/F02-04")).toBeTruthy();
});

it("prints the request form only with the print key", async () => {
  open([]);
  await screen.findByRole("table", { name: "Analytical test request" });
  expect(screen.queryByRole("button", { name: "Print request form" })).toBeNull();
  cleanup(); forgetSession();

  open(["CanPrintProductAnalyticalTestRequest"]);
  await userEvent.click(await screen.findByRole("button", { name: "Print request form" }));
  expect(await screen.findByText("Print preview · Analytical test request")).toBeTruthy();
});

it("shows nothing when the request cannot be read", () => {
  stubBackend({ permissions: [] });
  const { container } = render(<AtrRequestSection data={null} />);
  expect(container.textContent).toBe("");
});

it("signs the form: prepared by the requester, released by whoever generated the certificate, approved by its final approver, each with date and time", async () => {
  open([], response);
  await screen.findByRole("table", { name: "Analytical test request" });
  const signature = (role: string) => screen.getByText(role).parentElement?.textContent ?? "";
  expect(signature("Prepared by (Production)")).toContain(`Ama Owusu${formatDateTime("2026-11-02T08:00:00Z")}`);
  expect(signature("Released by Manager QC")).toContain(`Isaac Aidoo${formatDateTime("2026-11-12T14:05:00Z")}`);
  expect(signature("Approved by Manager QA")).toContain(`Abena Darko${formatDateTime("2026-11-13T09:30:00Z")}`);
});

it("leaves the release and approval signatures blank until the certificate is generated and approved", async () => {
  open([]);
  await screen.findByRole("table", { name: "Analytical test request" });
  expect(screen.getByText("Released by Manager QC").parentElement?.textContent).toBe("Released by Manager QC");
  expect(screen.getByText("Approved by Manager QA").parentElement?.textContent).toBe("Approved by Manager QA");
});
