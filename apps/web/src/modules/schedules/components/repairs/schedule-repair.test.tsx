// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction } from "@/test/menu";
import { scheduleRowSchema } from "../../schemas/schedule-schema";
import { ScheduleRepairMenu } from "./schedule-repair-menu";

afterEach(() => { cleanup(); forgetSession(); });
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const scheduleId = "658da105-a506-44a9-8ff5-8d005a54f294";
const productId = "758da105-a506-44a9-8ff5-8d005a54f294";
const otherProduct = "858da105-a506-44a9-8ff5-8d005a54f294";
const schedule = scheduleRowSchema.parse({ id: scheduleId, products: [
  { id: "b1", product: { id: productId, name: "Amoxicillin", code: "BFC-04" }, hasStarted: true, productionActivityId: "a1" },
  { id: "b2", product: { id: productId, name: "Amoxicillin", code: "BFC-04" }, hasStarted: true, productionActivityId: "a2", batchSize: 1 },
  { id: "b3", product: { id: otherProduct, name: "Other product", code: "OTHER" } },
] });
const batch = (id: string) => ({ batchId: id, activityId: `a-${id}`, batchNumber: id.toUpperCase(), status: "ready", message: "", evidenceHash: "e".repeat(64),
  materials: { approvalRequired: true, lines: [{ materialId: "m1", name: "Starch", unit: "mg", before: 20, after: 20_000_000, reservedBefore: 20, reservedAfter: 20_000_000, shortage: 0 }] },
  procedure: null });

function open(options: { permission?: boolean; refuse?: number; blocked?: boolean; malformed?: boolean; repeatFailure?: boolean } = {}) {
  const backend = stubBackend({ permissions: ["CanViewProductSchedules", "CanViewPlannedProducts", ...(options.permission === false ? [] : ["CanRepairBom", "CanRepairPackaging", "CanRepairProcedure"])] });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  let attempts = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, body: input.method === "POST" ? await input.clone().text() : "" });
    if (input.method === "POST") {
      attempts++;
      if (options.refuse && (attempts === 1 || options.repeatFailure)) return Response.json({ errors: [{ code: "Repair.Test", description: "Repair response refused" }] }, { status: options.refuse });
      return Response.json({ repairId: "repair-1", repaired: 2, unchanged: 0, skipped: 1, requiringApproval: 2 });
    }
    const kind = Number(path.split("/").at(-1));
    const selected = path.includes(otherProduct) ? otherProduct : productId;
    return Response.json(options.malformed ? { canApply: true } : { scheduleId, productId: selected, kind, previewHash: "a".repeat(64), canApply: !options.blocked,
      blockers: options.blocked ? ["Resolve the blocked batches"] : [], batches: [batch("b1"), { ...batch("b2"), status: options.blocked ? "blocked" : "ready", message: options.blocked ? "Stock has already been issued" : "" },
        { ...batch("waiting"), activityId: null, status: "skipped", message: "Not started", materials: null }] });
  });
  const router = createMemoryRouter([{ path: "/", element: <PermissionGuard require="CanViewProductSchedules"><p>Schedule loaded</p><ScheduleRepairMenu schedule={schedule} initialProductId={productId} /></PermissionGuard> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, backend };
}

async function preview(label = "Repair BOM") {
  const user = userEvent.setup();
  await chooseAction("Repair product batches", label);
  await user.click(await screen.findByRole("button", { name: "Preview batches" }));
  await screen.findByRole("table", { name: "Schedule product repair preview" });
  return user;
}

it("hides all bulk repair choices without their permissions", async () => {
  open({ permission: false });
  await screen.findByText("Schedule loaded");
  expect(screen.queryByRole("button", { name: "Repair product batches" })).toBeNull();
});

it.each(["Repair BOM", "Repair packaging", "Repair procedure"])("previews %s without writing and sends one product-scoped repair", async (label) => {
  const { calls } = open();
  const user = await preview(label);
  expect(calls.filter(call => call.method === "POST")).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Apply to 2 batches" }));
  await screen.findByText("Explain the repair in at least 5 characters");
  expect(calls.filter(call => call.method === "POST")).toHaveLength(0);
  await user.type(screen.getByLabelText(/^Repair reason/), "Wrong configuration copied to several batches");
  await user.dblClick(screen.getByRole("button", { name: "Apply to 2 batches" }));
  await screen.findByText(/2 batches repaired/);
  expect(calls.filter(call => call.method === "POST")).toHaveLength(1);
  const request = calls.find(call => call.method === "POST");
  expect(request?.path).toContain(`/production-schedule/${scheduleId}/product/${productId}/repair/`);
  expect(JSON.parse(request?.body ?? "{}")).toMatchObject({ previewHash: "a".repeat(64), reason: "Wrong configuration copied to several batches" });
  expect(await screen.findByText(/2 requisitions require fresh approval/)).toBeTruthy();
});

it("shows a blocked batch and refuses the whole product repair", async () => {
  const { calls } = open({ blocked: true });
  await preview();
  expect(await screen.findByText("Stock has already been issued")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Apply to 1 batch" })).toHaveProperty("disabled", true);
  expect(calls.filter(call => call.method === "POST")).toHaveLength(0);
});

it("preserves the reason after a stale refusal and requires reviewing a fresh preview", async () => {
  const { calls } = open({ refuse: 409 });
  const user = await preview();
  await user.type(screen.getByLabelText(/^Repair reason/), "Correction for repeated batches");
  await user.click(screen.getByRole("button", { name: "Apply to 2 batches" }));
  await screen.findByText("Repair response refused");
  expect(screen.getByLabelText(/^Repair reason/)).toHaveProperty("value", "Correction for repeated batches");
  expect(screen.getByRole("button", { name: "Apply to 2 batches" })).toHaveProperty("disabled", true);
  await user.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Apply to 2 batches" })).toHaveProperty("disabled", false));
  expect(calls.filter(call => call.method === "POST")).toHaveLength(1);
});

it("checks an uncertain result with the exact same request ID and body", async () => {
  const { calls } = open({ refuse: 500 });
  const user = await preview();
  await user.type(screen.getByLabelText(/^Repair reason/), "Correct repeated batches");
  await user.click(screen.getByRole("button", { name: "Apply to 2 batches" }));
  await user.click(await screen.findByRole("button", { name: "Check same repair request" }));
  await screen.findByText(/2 batches repaired/);
  const writes = calls.filter(call => call.method === "POST");
  expect(writes).toHaveLength(2); expect(writes[0]?.body).toBe(writes[1]?.body);
});

it("rejects unreadable preview data without enabling a write", async () => {
  const { calls } = open({ malformed: true });
  const user = userEvent.setup();
  await chooseAction("Repair product batches", "Repair BOM");
  await user.click(await screen.findByRole("button", { name: "Preview batches" }));
  await screen.findByText(/unreadable preview/);
  expect(screen.getByRole("button", { name: "Apply to 0 batches" })).toHaveProperty("disabled", true);
  expect(calls.filter(call => call.method === "POST")).toHaveLength(0);
});

it("invalidates the reviewed batches when a different product is selected", async () => {
  const { calls } = open();
  const user = await preview();
  await user.click(screen.getByRole("combobox", { name: /Product in this schedule/ }));
  await user.click(await screen.findByRole("option", { name: "OTHER · Other product" }));
  expect(screen.queryByRole("table", { name: "Schedule product repair preview" })).toBeNull();
  expect(screen.getByRole("button", { name: "Apply to 0 batches" })).toHaveProperty("disabled", true);
  await user.click(screen.getByRole("button", { name: "Preview batches" }));
  await screen.findByRole("table", { name: "Schedule product repair preview" });
  expect(calls.filter(call => call.method === "GET").at(-1)?.path).toContain(`/product/${otherProduct}/repair/0`);
  expect(calls.filter(call => call.method === "POST")).toHaveLength(0);
});
