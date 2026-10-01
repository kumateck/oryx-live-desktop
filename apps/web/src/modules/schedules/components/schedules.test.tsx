// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import SchedulesPage from "../../../pages/(workspace)/production/schedules/page";
import CreateSchedulePage from "../../../pages/(workspace)/production/schedules/create/page";
import EditSchedulePage from "../../../pages/(workspace)/production/schedules/[id]/edit/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { openMenu } from "../../../test/menu";

afterEach(() => { cleanup(); forgetSession(); });

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();
const batch = { quantity: 1_500_000, product: { id: "p1", name: "Wormee", baseUoM: { symbol: "ml" } } };
const upcoming = { id: "658da105-a506-44a9-8ff5-8d005a54f294", code: "PS-0007", scheduledStartTime: iso(3), scheduledEndTime: iso(9), remarks: "<p>Night shift</p>", products: [batch, batch] };
const running = { ...upcoming, id: "11111111-1111-4111-8111-111111111111", code: "PS-0006", scheduledStartTime: iso(-3) };
const ended = { ...upcoming, id: "22222222-2222-4222-8222-222222222222", code: "PS-0001", scheduledStartTime: iso(-9), scheduledEndTime: iso(-2), products: [] };

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === "/api/v1/production-schedule") return input.method === "GET" ? Response.json({ data: [upcoming, running, ended], pageIndex: 1, pageCount: 1, totalRecordCount: 3 }) : Response.json("new-id", { status: 201 });
    for (const schedule of [upcoming, running, ended]) if (path === `/api/v1/production-schedule/${schedule.id}`) return input.method === "GET" ? Response.json(schedule) : new Response(null, { status: 204 });
    if (path === "/api/v1/configuration/by-model-type/ProductionSchedule") return Response.json({ prefix: "PS-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/ProductionSchedule/count") return Response.json(7);
    if (path === "/api/v1/customers") return new Response(null, { status: 403 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/schedules", element: <SchedulesPage /> },
    { path: "/production/schedules/create", element: <CreateSchedulePage /> },
    { path: "/production/schedules/:id/edit", element: <EditSchedulePage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("lists schedules with their batches counted, their state, and only the actions allowed", async () => {
  open("/production/schedules", ["CanViewProductSchedules", "CanEditProductSchedule"]);
  const row = (await screen.findByText("PS-0007")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("Wormee (1,500 L) ×2")).toBeTruthy();
  expect(within(row).getByText("Upcoming")).toBeTruthy();
  expect(screen.getByText("In progress")).toBeTruthy();
  expect(screen.getByText("No products")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Create" })).toBeNull();
  await openMenu("Actions for PS-0007");
  expect(screen.getByRole("menuitem", { name: "Edit dates and remarks" }).getAttribute("href")).toBe(`/production/schedules/${upcoming.id}/edit`);
  cleanup();
});

it("explains in the menu why an ended schedule cannot be edited", async () => {
  open("/production/schedules", ["CanViewProductSchedules", "CanEditProductSchedule"]);
  await openMenu("Actions for PS-0001");
  const item = screen.getByRole("menuitem", { name: /Edit dates and remarks/ });
  expect(item.getAttribute("aria-disabled")).toBe("true");
  expect(item.textContent).toContain("This schedule has ended");
});

it("suggests the next code and says what a new schedule is missing before sending anything", async () => {
  const { calls } = open("/production/schedules/create", ["CanViewProductSchedules", "CanCreateProductSchedule"]);
  const code = await screen.findByLabelText(/Schedule code/, { selector: "input" });
  await waitFor(() => expect((code as HTMLInputElement).value).toBe("PS-0008"));
  expect(await screen.findByText(/Market types could not be loaded/)).toBeTruthy();
  // A schedule always has one product line, which cannot be removed until there is another.
  expect(screen.queryByRole("button", { name: "Remove product 1" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Add product" }));
  expect(await screen.findByRole("button", { name: "Remove product 2" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Remove product 2" }));
  fireEvent.click(screen.getByRole("button", { name: "Create schedule" }));
  expect(await screen.findByText("Choose the start date")).toBeTruthy();
  expect(await screen.findByText("Choose a product")).toBeTruthy();
  expect(await screen.findByText("Choose a packing style")).toBeTruthy();
  expect(calls).toEqual([]);
});

it("says a running schedule must move its start date, and refuses to edit an ended one", async () => {
  const { calls } = open(`/production/schedules/${running.id}/edit`, ["CanViewProductSchedules", "CanEditProductSchedule"]);
  expect(await screen.findByText(/has already started/)).toBeTruthy();
  expect(screen.getAllByText("PS-0006").length).toBeGreaterThan(0);
  fireEvent.click(await screen.findByRole("button", { name: "Save changes" }));
  expect(await screen.findByText("The start date must be after today")).toBeTruthy();
  expect(calls).toEqual([]);
  cleanup(); forgetSession();
  open(`/production/schedules/${ended.id}/edit`, ["CanViewProductSchedules", "CanEditProductSchedule"]);
  expect((await screen.findByRole("alert")).textContent).toContain("This schedule has ended");
  expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
});
