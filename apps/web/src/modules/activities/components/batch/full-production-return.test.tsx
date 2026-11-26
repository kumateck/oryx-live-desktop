// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { activitySchema } from "../../schemas/activity-schema";
import { FullProductionReturn } from "./full-production-return";

afterEach(() => { cleanup(); forgetSession(); });
const activity = activitySchema.parse({ id: "a", status: 1, productionScheduleProduct: {
  id: "b", batchNumber: "L014K029", product: { name: "Metronidazole 125mg", code: "NL-014" },
}, steps: [{ id: "dispensing", order: 4, status: 1, operation: { name: "Dispensing" } },
  { id: "consume", order: 5, status: 0, operation: { name: "Product Preparation" } }] });

function open({ permission = true, consumed = false, fail = false } = {}) {
  const backend = stubBackend({ permissions: permission ? ["CanReturnProductionMaterials"] : [] });
  const base = backend.fetcher.getMockImplementation();
  const writes: { batch: string | null; reason: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request && input.url.includes("/return-before-production")) {
      const url = new URL(input.url); writes.push({ batch: url.searchParams.get("productionScheduleProductId"), reason: url.searchParams.get("reason") });
      return fail ? Response.json({ errors: [{ code: "FullReturn.Consumed", description: "Consumption has been recorded. Full return is blocked." }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    return base ? base(input, init) : new Response(null, { status: 500 });
  });
  rememberSession();
  const shown = consumed ? { ...activity, steps: activity.steps.map(step => step.order === 5 ? { ...step, status: 1, startedAt: "2026-11-25T10:00:00Z" } : step) } : activity;
  render(<SessionProvider><ApiProvider><FullProductionReturn activity={shown} /></ApiProvider></SessionProvider>);
  return writes;
}

it("offers full return before consumption even when the current step has no Full return instruction", async () => {
  const writes = open();
  fireEvent.click(await screen.findByRole("button", { name: "Full return" }));
  expect(screen.getByText(/Metronidazole 125mg · L014K029/)).toBeTruthy();
  expect(screen.getByText(/Only materials already issued/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Return packaging and cancel batch" } });
  fireEvent.click(screen.getByRole("button", { name: "Return and cancel" }));
  await waitFor(() => expect(writes).toEqual([{ batch: "b", reason: "Return packaging and cancel batch" }]));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("keeps a server refusal visible when consumption changes after the screen was loaded", async () => {
  open({ fail: true });
  fireEvent.click(await screen.findByRole("button", { name: "Full return" }));
  fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Cancel" } });
  fireEvent.click(screen.getByRole("button", { name: "Return and cancel" }));
  expect((await screen.findByRole("alert")).textContent).toContain("Full return is blocked");
  expect(screen.getByRole("dialog")).toBeTruthy();
});

it.each([{ permission: false }, { consumed: true }])("hides full return without the task permission or after consumption: %j", async options => {
  const writes = open(options);
  await waitFor(() => expect(screen.queryByRole("button", { name: "Full return" })).toBeNull());
  expect(writes).toEqual([]);
});
