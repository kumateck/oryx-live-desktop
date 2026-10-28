// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { buildWorkbook } from "../lib/workbook";
import { UploadCenterPage } from "./upload-center-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

function open(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; search: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") { calls.push({ method: input.method, path: url.pathname, search: url.search }); return new Response(null, { status: 204 }); }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <UploadCenterPage /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("shows only the uploads the user may make, and sends a sheet only once its rows are clean", async () => {
  const user = userEvent.setup();
  const calls = open(["CanSubmitShiftScheduleReportUpload", "CanSubmitAttendanceReportUpload"]);
  expect(await screen.findByRole("tab", { name: "Attendance" })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "Material stock" })).toBeNull();
  const file = await buildWorkbook([{ EmpId: "E1", Name: "Ama", Time: "2026-10-15 08:00", WorkState: "In" }, { EmpId: "", Name: "Kofi", Time: "2026-10-15 08:05", WorkState: "In" }],
    ["EmpId", "Name", "Time", "WorkState"], "attendance.xlsx");
  fireEvent.change(screen.getByLabelText(/Sheet/), { target: { files: [file] } });
  expect(await screen.findByText("Employee ID is empty")).toBeTruthy();
  expect((screen.getByRole("button", { name: /Submit upload/ }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(screen.getByRole("button", { name: "Remove row 2" }));
  await user.click(await screen.findByRole("button", { name: "Remove row" }));
  await waitFor(() => expect((screen.getByRole("button", { name: /Submit upload/ }) as HTMLButtonElement).disabled).toBe(false));
  await user.click(screen.getByRole("button", { name: /Submit upload/ }));
  await user.click(await screen.findByRole("button", { name: "Submit upload", hidden: false }));
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]?.path).toMatch(/^\/api\/v1\/attendance-records\/upload\//);
}, 30_000);
