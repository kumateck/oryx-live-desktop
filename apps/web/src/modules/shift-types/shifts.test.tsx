// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ShiftSchedulesRoute from "../../pages/(workspace)/settings/shift-schedule/page";
import ShiftTypesRoute from "../../pages/(workspace)/settings/shift-types/page";
import PolicyRoute from "../../pages/(workspace)/settings/working-hours-policy/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { daysText, policyFormSchema, policyInForce, policyRowsSchema, scheduleChangeBlock, shiftHours, shiftScheduleFormSchema, shiftTypeFormSchema } from "./shifts";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("applies the shift rules", () => {
  // A night shift runs into the next day.
  expect([shiftHours("8:00 AM", "4:30 PM"), shiftHours("10:00 PM", "6:00 AM"), shiftHours("", "6:00 AM")]).toEqual([8.5, 8, null]);
  expect([daysText([1, 2]), daysText([0, 1, 2, 3, 4, 5, 6])]).toEqual(["Monday, Tuesday", "Every day"]);
  const shift = { name: "Night", rotation: { value: "0", label: "Rotational" }, startTime: "10:00 PM", endTime: "6:00 AM", days: [{ value: "1", label: "Monday" }] };
  expect(shiftTypeFormSchema.safeParse(shift).success).toBe(true);
  expect(shiftTypeFormSchema.safeParse({ ...shift, endTime: "10:00 PM" }).error?.issues[0]?.message).toBe("The shift cannot start and end at the same time");
  expect(shiftTypeFormSchema.safeParse({ ...shift, days: [] }).error?.issues[0]?.message).toBe("Choose at least one day");
  const now = new Date(2026, 9, 2, 10);
  expect([scheduleChangeBlock({ startDate: "2026-10-01T00:00:00Z", endDate: "2026-10-08T00:00:00Z" }, now), scheduleChangeBlock({ startDate: "2026-11-01T00:00:00Z", endDate: "2026-11-08T00:00:00Z" }, now)]).toEqual(["The schedule is running", null]);
  const schedule = { name: "October", frequency: { value: "2", label: "Month" }, shiftTypes: [{ value: "t", label: "Day" }], department: { value: "d", label: "Tablet" } };
  expect(shiftScheduleFormSchema(now).safeParse({ ...schedule, startDate: new Date(2026, 9, 2) }).error?.issues[0]?.message).toBe("The schedule must start tomorrow or later");
  expect(shiftScheduleFormSchema(now).safeParse({ ...schedule, startDate: new Date(2026, 9, 3) }).success).toBe(true);
  const policies = policyRowsSchema.parse([{ id: "old", effectiveFrom: "2025-01-01T00:00:00Z", maxHoursPerDay: 8 }, { id: "next", effectiveFrom: "2027-01-01T00:00:00Z" }, { id: "now", effectiveFrom: "2026-01-01T00:00:00Z" }]);
  expect([policies.map((policy) => policy.id), policyInForce(policies, now)?.id]).toEqual([["next", "now", "old"], "now"]);
  expect(policyFormSchema.safeParse({ maxDay: 14, maxWeek: 40, restDay: 12, restWeek: 48, effectiveFrom: new Date() }).error?.issues[0]?.message).toBe("Work and rest together cannot be more than 24 hours a day");
});

const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push(`${input.method} ${path}`);
    if (path === "/api/v1/shift-type") return page([{ id: "t1", shiftName: "Night", rotationType: 0, startTime: "10:00 PM", endTime: "6:00 AM", applicableDays: [5, 1] }]);
    if (path === "/api/v1/shift-schedules") return page([{ id: "s1", scheduleName: "Running", frequency: 5, startDate: "2020-01-01T00:00:00Z", endDate: "2999-01-01T00:00:00Z", scheduleStatus: 2, department: { id: "d", name: "Tablet" }, shiftType: [{ id: "t1", shiftName: "Night" }] },
      { id: "s2", scheduleName: "Planned", frequency: 0, startDate: "2998-01-01T00:00:00Z", endDate: "2998-01-08T00:00:00Z", scheduleStatus: 0 }]);
    if (path === "/api/v1/working-hours-policy") return Response.json([{ id: "p1", maxHoursPerDay: 8, maxHoursPerWeek: 40, minDailyRestHours: 12, minWeeklyRestHours: 48, effectiveFrom: "2024-01-01T00:00:00Z" }]);
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/settings/shift-types", element: <ShiftTypesRoute /> }, { path: "/settings/shift-schedule", element: <ShiftSchedulesRoute /> }, { path: "/settings/working-hours-policy", element: <PolicyRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("lists shift types with their length, and will not change a schedule that is running", async () => {
  open("/settings/shift-types", ["CanViewShiftTypes"]);
  expect(await screen.findByText("Night")).toBeTruthy();
  expect(screen.getByText("· 8 h")).toBeTruthy();
  expect(screen.getByText("Monday, Friday")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Add shift type/ })).toBeNull();
  cleanup(); forgetSession();
  open("/settings/shift-schedule", ["CanViewShiftSchedule", "CanEditShiftSchedule", "CanDeleteShiftSchedule"]);
  expect(await screen.findByText("Running")).toBeTruthy();
  await openMenu("Actions for Running");
  expect(screen.getByRole("menuitem", { name: /Edit/ }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("menuitem", { name: /Delete/ }).getAttribute("aria-disabled")).toBe("true");
});

it("asks before deleting a working hours policy and says it is the one in force", async () => {
  const calls = open("/settings/working-hours-policy", ["CanViewWorkingHoursPolicy", "CanManageWorkingHoursPolicy"]);
  expect(await screen.findByText("In force")).toBeTruthy();
  await openMenu(/Actions for the policy/);
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/This is the policy in force/)).toBeTruthy();
  expect(calls.some((call) => call.startsWith("DELETE"))).toBe(false);
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete policy" }));
  await waitFor(() => expect(calls).toContain("DELETE /api/v1/working-hours-policy/p1"));
});
