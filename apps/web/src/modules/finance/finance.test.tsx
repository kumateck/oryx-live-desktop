// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { PaymentDetailPage } from "./components/payment-detail-page";
import { PaymentApprovalQueue } from "./components/payment-approval-queue";
import { PaymentRegisterPage } from "./components/payment-register-page";
import { CashflowPage } from "./components/cashflow-page";
import { paymentFormSchema, rateSchema } from "./schemas/payment-schema";
import { paymentReviewProblem, dayStartUtc, PaymentStatus } from "./lib/payments";
import { payableOptions } from "./hooks/use-payable-options";
import type { Payment } from "./api/finance-api";
const payment = (): Payment => ({ id: "pay1", reference: "BANK-01", amount: 125.50, currency: { id: "usd", name: "USD", symbol: "$" }, paymentDate: "2026-10-20T00:00:00Z", method: 0, payableType: 1, payableId: "invoice1", status: 0, approved: false, recordedBy: { id: "other", firstName: "Someone", lastName: "Else" }, approvals: [{ id: "stage1", order: 1, status: 0, required: true }], notes: "Invoice settlement" });
function open(path: string, permissions = ["CanViewPayments", "CanApprovePayment", "CanViewCashflowReports"]) {
  const backend = stubBackend({ permissions }); const auth = backend.fetcher.getMockImplementation();
  const state = { payment: payment(), assigned: true, failed: false, missingAp: false };
  const calls: { method: string; path: string; search: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const body = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path: url.pathname, search: url.search, body, audit: input.headers.get("Module") });
    if (url.pathname.endsWith("/review")) return new Response(null, { status: state.failed ? 409 : 204 });
    if (url.pathname === "/api/v1/approval/my-pending") return Response.json(state.assigned ? [{ id: "pay1", code: "BANK-01", modelType: "Payment" }] : []);
    if (url.pathname.endsWith("/ap-aging") || url.pathname.endsWith("/ar-aging")) return state.missingAp && url.pathname.endsWith("/ap-aging") ? new Response(null, { status: 503 }) : Response.json({ baseCurrencyName: "GHS", totalOutstandingBase: 100, parties: [], dataQualityWarnings: ["Some due dates are missing"] });
    if (url.pathname.endsWith("/cashflow-summary")) return Response.json({ baseCurrencyName: "GHS", projectedInflows: { totalOutstandingBase: 0 }, projectedOutflows: { totalOutstandingBase: 100 } });
    if (url.pathname.endsWith("/currency-configuration")) return Response.json({ baseCurrency: { id: "ghs", name: "GHS" }, rates: [{ currency: { id: "usd", name: "USD" }, rateToBase: null, effectiveDate: null }] });
    if (url.pathname === "/api/v1/payments") return Response.json({ data: [state.payment], pageIndex: 1, totalRecordCount: 1 });
    if (url.pathname.includes("/payments/pay1")) return Response.json(state.payment);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/finance/payments", element: <PaymentRegisterPage /> }, { path: "/finance/payments/:id", element: <PaymentDetailPage /> },
    { path: "/finance/payment-approvals", element: <PaymentApprovalQueue /> }, { path: "/finance/payment-approvals/:id", element: <PaymentDetailPage approval /> },
    { path: "/finance/cashflow", element: <CashflowPage /> },
  ], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, calls, writes: () => calls.filter((call) => call.path.endsWith("/review")) };
}
afterEach(() => { cleanup(); forgetSession(); });
it("validates money, selected documents and positive conversion rates without dropping zero enums", () => {
  expect(paymentReviewProblem({ ...payment(), recordedBy: { id: testUserId } }, testUserId)).toContain("you recorded");
  expect(paymentReviewProblem({ ...payment(), status: PaymentStatus.Approved }, testUserId)).toContain("no longer pending");
  expect(paymentFormSchema.safeParse({ amount: -1 }).success).toBe(false);
  expect(rateSchema.safeParse({ currency: { value: "usd", label: "USD" }, rate: 0, effectiveDate: new Date() }).success).toBe(false);
  expect(dayStartUtc(new Date(2026, 9, 20))).toBe("2026-10-20T00:00:00.000Z");
  expect(payableOptions({ data: [{ id: "a", code: "INV1" }, { id: "b", proformaInvoice: { allocateProductionOrder: { invoiceCode: "INV2" } } }], pageIndex: 1, pageCount: 2 }, 1)).toMatchObject({ options: [{ value: "a", label: "INV1" }, { value: "b", label: "INV2" }], hasNext: true });
});
it("opens assigned approval evidence without payment-register access", async () => {
  const page = open("/finance/payment-approvals/pay1", ["CanApprovePayment"]);
  await screen.findByRole("heading", { name: "Payment BANK-01" });
  expect(page.calls.some((call) => call.path.endsWith("/approval-details"))).toBe(true);
  expect(page.calls.some((call) => call.path === "/api/v1/payments/pay1")).toBe(false);
  expect(screen.getByText("125.50", { exact: false })).toBeTruthy();
});
it("confirms a stage decision and verifies fresh evidence and assignment before writing", async () => {
  const user = userEvent.setup(); const page = open("/finance/payment-approvals/pay1");
  await screen.findByRole("heading", { name: "Payment BANK-01" });
  await user.click(screen.getByRole("button", { name: "Approve stage" }));
  expect(page.writes()).toHaveLength(0);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve stage" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ body: '{"status":1,"comments":""}', audit: "Cashflow" });
  expect(page.calls.some((call) => call.path === "/api/v1/approval/my-pending" && call.search.includes("modelType=Payment"))).toBe(true);
});
it("refuses changed payment evidence and no longer assigned records", async () => {
  const user = userEvent.setup(); const page = open("/finance/payment-approvals/pay1");
  await screen.findByRole("heading", { name: "Payment BANK-01" });
  await user.click(screen.getByRole("button", { name: "Approve stage" })); page.state.payment = { ...payment(), amount: 200 };
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve stage" }));
  expect((await screen.findByRole("alert")).textContent).toContain("changed"); expect(page.writes()).toHaveLength(0);
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "Approve stage" })); page.state.assigned = false;
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve stage" }));
  expect((await screen.findByRole("alert")).textContent).toContain("no longer assigned"); expect(page.writes()).toHaveLength(0);
});
it("hides stage actions for the recorder", async () => {
  const page = open("/finance/payment-approvals/pay1"); page.state.payment.recordedBy = { id: testUserId };
  await screen.findByText("You cannot review a payment or receipt you recorded."); expect(screen.queryByRole("button", { name: "Approve stage" })).toBeNull(); expect(page.writes()).toHaveLength(0);
});
it("keeps pending status and payment direction filters explicit", async () => {
  const user = userEvent.setup(); const page = open("/finance/payments?status=0&entry=payment");
  await screen.findByText("BANK-01");
  expect(page.calls.some((call) => call.search.includes("status=0") && call.search.includes("isReceipt=false"))).toBe(true);
  await user.click(screen.getByRole("button", { name: /^Receipts$/ }));
  await waitFor(() => expect(page.calls.some((call) => call.search.includes("isReceipt=true"))).toBe(true));
});
it("shows missing rates and data warnings while allowing independent report failure recovery", async () => {
  const page = open("/finance/cashflow"); page.state.missingAp = true;
  await screen.findByText("No rate recorded");
  await screen.findByRole("heading", { name: "Accounts payable aging unavailable" });
  expect(screen.getByRole("heading", { name: /Projected cashflow/ })).toBeTruthy();
  expect(screen.getByText("Some due dates are missing")).toBeTruthy(); expect(page.writes()).toHaveLength(0);
});

it("keeps a refused financial decision open without automatically repeating the write", async () => {
  const user = userEvent.setup(); const page = open("/finance/payment-approvals/pay1"); page.state.failed = true;
  await screen.findByRole("heading", { name: "Payment BANK-01" });
  await user.click(screen.getByRole("button", { name: "Approve stage" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve stage" }));
  expect((await screen.findByRole("alert")).textContent).toContain("409");
  expect(screen.getByRole("dialog")).toBeTruthy(); expect(page.writes()).toHaveLength(1);
});
