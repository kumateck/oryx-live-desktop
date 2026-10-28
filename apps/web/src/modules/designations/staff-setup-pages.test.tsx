// @vitest-environment jsdom
import { cleanup, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { designationFormSchema, designationRowsSchema, sameDesignation } from "./designations";
import { useReferenceOptions } from "./hooks/use-reference-options";
import { DesignationsPage, LeaveTypesPage } from "./staff-setup-pages";

const all = ["CanViewDesignation", "CanEditDesignation", "CanCreateDesignation", "CanViewLeaveType", "CanEditLeaveType", "CanViewDepartments"];
const designation = (overrides: Record<string, unknown> = {}) => ({ id: "g1", name: "Analyst", description: "<p>QC analyst</p>", maximumLeaveDays: 21, departments: [{ id: "d1", name: "Quality" }], ...overrides });
const leaveType = (overrides: Record<string, unknown> = {}) => ({ id: "l1", name: "Annual", isPaid: true, deductFromBalance: true, numberOfDays: 21, isActive: false, deductionLimit: 5, designations: [{ id: "g1", name: "Analyst" }], ...overrides });
function RefreshAccess() { const session = useSession(); return <button onClick={() => void session.refresh()}>Recheck access</button>; }

function open(page: "designations" | "leave", granted = all) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { designation: designation(), leaveType: leaveType() };
  const calls: { path: string; method: string; search: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const body: unknown = input.method === "GET" ? null : await input.clone().json().catch(() => null);
    calls.push({ path: url.pathname, method: input.method, search: url.search, body });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    const list = (rows: unknown[]) => Response.json({ data: rows, pageIndex: 1, pageCount: 1, totalRecordCount: rows.length });
    if (url.pathname === "/api/v1/designation") return list([state.designation]);
    if (url.pathname === "/api/v1/designation/g1") return Response.json(state.designation);
    if (url.pathname === "/api/v1/leave-type") return list([state.leaveType]);
    if (url.pathname === "/api/v1/leave-type/l1") return Response.json(state.leaveType);
    if (url.pathname === "/api/v1/department") return Response.json({ data: [{ id: "d2", name: "Production" }], pageIndex: Number(url.searchParams.get("page")), pageCount: 3, totalRecordCount: 61 });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/", element: page === "designations" ? <DesignationsPage /> : <LeaveTypesPage /> }]);
  render(<SessionProvider><ApiProvider><RefreshAccess /><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { backend, state, calls, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); });

async function edit(name: string) {
  const user = userEvent.setup();
  await screen.findByText(name);
  await openMenu(`Actions for ${name}`);
  await user.click(screen.getByRole("menuitem", { name: "Edit" }));
  return { user, dialog: await screen.findByRole("dialog") };
}

it("compares a designation by content and refuses a department chosen twice", () => {
  const [opened] = designationRowsSchema.parse([designation()]);
  expect(sameDesignation(opened!, designationRowsSchema.parse([designation()])[0]!)).toBe(true);
  expect(sameDesignation(opened!, designationRowsSchema.parse([designation({ maximumLeaveDays: 20 })])[0]!)).toBe(false);
  expect(designationFormSchema.safeParse({ name: "Analyst", leaveDays: 21, departments: [{ value: "d", label: "QC" }, { value: "d", label: "QC" }] }).error?.issues[0]?.message).toBe("Choose each one only once");
});

it("searches departments on the server page by page instead of reading the first 1,000", async () => {
  const backend = stubBackend({ permissions: all });
  const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    return Response.json({ data: [{ id: "d9", name: "Packaging" }], pageIndex: 3, pageCount: 5, totalRecordCount: 130 });
  });
  rememberSession();
  const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider><ApiProvider>{children}</ApiProvider></SessionProvider>;
  const { result } = renderHook(() => useReferenceOptions(), { wrapper });
  const page = await result.current.departments("pack", 3, new AbortController().signal);
  expect(page).toEqual({ options: [{ value: "d9", label: "Packaging" }], hasNext: true, hasPrevious: true });
  const request = backend.fetcher.mock.calls.map(([input]) => input).find((input): input is Request => input instanceof Request);
  expect(new URL(request!.url).searchParams.get("pageSize")).toBe("30");
  expect(new URL(request!.url).searchParams.get("searchQuery")).toBe("pack");
});

it("re-reads a designation before saving and refuses to overwrite someone else's change", async () => {
  const page = open("designations");
  const { user, dialog } = await edit("Analyst");
  page.state.designation = designation({ maximumLeaveDays: 25 });
  await user.click(within(dialog).getByRole("button", { name: "Save designation" }));
  expect((await within(dialog).findByRole("alert")).textContent).toContain("changed this record after you opened it");
  expect(page.writes()).toHaveLength(0);
});

it("saves an unchanged designation with its departments", async () => {
  const page = open("designations");
  const { user, dialog } = await edit("Analyst");
  await user.click(within(dialog).getByRole("button", { name: "Save designation" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ method: "PUT", path: "/api/v1/designation/g1", body: { name: "Analyst", departmentIds: ["d1"], maximumLeaveDays: 21 } });
});

it("checks edit permission again at the moment of saving", async () => {
  const page = open("leave");
  const { user, dialog } = await edit("Annual");
  page.backend.set({ permissions: all.filter((key) => key !== "CanEditLeaveType") });
  fireEvent.click(screen.getByRole("button", { name: "Recheck access", hidden: true }));
  await waitFor(() => expect(page.backend.fetcher.mock.calls.filter(([input]) => String(input).includes("/permission/user/")).length).toBeGreaterThan(1));
  await user.click(within(dialog).getByRole("button", { name: "Save leave type" }));
  expect((await within(dialog).findByRole("alert")).textContent).toContain("do not have permission");
  expect(page.writes()).toHaveLength(0);
});

it("keeps a leave type's current active state and deduction limit when it is saved", async () => {
  const page = open("leave");
  const { user, dialog } = await edit("Annual");
  await user.click(within(dialog).getByRole("button", { name: "Save leave type" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ method: "PUT", path: "/api/v1/leave-type/l1", body: { isActive: false, deductionLimit: 5, designationList: ["g1"] } });
});
