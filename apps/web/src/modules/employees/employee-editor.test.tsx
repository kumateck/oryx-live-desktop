// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { EmployeeEditorPage } from "./components/employee-editor-page";
import type { Employee } from "./api/employee-api";
function open() {
  const backend = stubBackend({ permissions: ["CanUpdateEmployeeInfo", "CanViewEmployeeDetails"] }); const auth = backend.fetcher.getMockImplementation();
  const employee: Employee = { id: "employee1", firstName: "Ama", lastName: "Test", gender: 0, type: 0, status: 1, inactiveStatus: 3, level: 0, dateOfBirth: "1990-01-01", dateEmployed: "2020-01-01", staffNumber: "TEST001", children: [{ fullName: "Child", gender: 0 }] };
  const state = { employee, photoFails: true }; const calls: { method: string; path: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); calls.push({ method: input.method, path: url.pathname, body: input.method === "PUT" ? await input.clone().text() : "", audit: input.headers.get("Module") });
    if (url.pathname === "/api/v1/countries") return Response.json([]);
    if (url.pathname === "/api/v1/employee/employee1") return input.method === "GET" ? Response.json(state.employee) : new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/file/Employee/employee1") return new Response(null, { status: state.photoFails ? 503 : 204 });
    return new Response(null, { status: 404 });
  });
  rememberSession(); const router = createMemoryRouter([{ path: "/hr/employee-management/:id/edit/:type", element: <EmployeeEditorPage /> }, { path: "/hr/employee-management/:id/details", element: <p>Saved profile detail</p> }], { initialEntries: ["/hr/employee-management/employee1/edit/0"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, calls, writes: () => calls.filter((call) => call.method === "PUT") };
}
afterEach(() => { cleanup(); forgetSession(); });
it("keeps inactive status and full existing family records when a profile is saved", async () => {
  const user = userEvent.setup(); const page = open();
  const name = await screen.findByLabelText(/^First name/); await user.clear(name); await user.type(name, "Akua"); await user.click(screen.getByRole("button", { name: "Save employee" }));
  await screen.findByText("Saved profile detail"); expect(page.writes()).toHaveLength(1);
  expect(JSON.parse(page.writes()[0]?.body ?? "{}")).toMatchObject({ firstName: "Akua", status: 1, inactiveStatus: 3, level: 0, type: 0, children: [{ fullName: "Child", gender: 0 }] });
  expect(page.writes()[0]?.audit).toBe("HR Management");
});
it("refuses a profile save when fresh employee evidence has changed", async () => {
  const user = userEvent.setup(); const page = open(); await screen.findByLabelText(/^First name/);
  page.state.employee = { ...page.state.employee, status: 0 };
  await user.click(screen.getByRole("button", { name: "Save employee" }));
  expect((await screen.findByRole("alert")).textContent).toContain("changed"); expect(page.writes()).toHaveLength(0);
});
it("retries only a failed photograph after the profile write succeeds", async () => {
  const user = userEvent.setup(); const page = open(); await screen.findByLabelText(/^First name/);
  await user.upload(await screen.findByLabelText(/^Passport photograph/), new File(["test image"], "photo.png", { type: "image/png" }));
  await user.click(screen.getByRole("button", { name: "Save employee" }));
  await screen.findByText(/Employee profile saved. The photograph was not confirmed/); expect(page.writes()).toHaveLength(1);
  page.state.photoFails = false; await user.click(screen.getByRole("button", { name: "Retry photograph upload" }));
  await screen.findByText("Saved profile detail"); expect(page.writes()).toHaveLength(1);
  await waitFor(() => expect(page.calls.filter((call) => call.path.startsWith("/api/v1/file/")).length).toBe(2));
});
