// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { forgetSession } from "@/test/backend";
import { chooseAction, openMenu } from "@/test/menu";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import { AlertsWorkspace } from "./alerts-workspace";

afterEach(() => { cleanup(); forgetSession(); });
const alert = { id: "alert-one", title: "Stock below minimum", notificationType: 4, alertTypes: [0, 1], timeFrame: "2.03:04:05.1234567", roles: [{ id: "role-one", name: "QA" }], users: [{ id: "user-one", firstName: "Ada", lastName: "Mensah" }], isDisabled: false, isConfigurable: true };
function open(options: { permissions?: string[]; system?: boolean; fail?: boolean } = {}) {
  const row = { ...alert, isConfigurable: !options.system };
  const calls = settingsBackend(options.permissions ?? ["CanViewAlerts", "CanEditAlerts", "CanDeleteAlerts", "CanEnableDisableAlerts"], (request) => {
    const path = new URL(request.url).pathname;
    if (path.includes("/collection/")) return Response.json([{ id: path.endsWith("Role") ? "role-one" : "user-one", name: path.endsWith("Role") ? "QA" : "Ada Mensah" }]);
    if (request.method !== "GET") return options.fail ? Response.json({ title: "Save failed" }, { status: 500 }) : new Response(null, { status: 204 });
    return Response.json(path === "/api/v1/alert" ? { data: [row], totalRecordCount: 1 } : row);
  });
  mountSettings(<AlertsWorkspace />, "/settings/alert"); return calls;
}
it("loads directories only when editing, preserving recipients and the exact delay on save", async () => {
  const calls = open(); await screen.findByText(alert.title);
  expect(calls.some((call) => call.path.includes("/collection/"))).toBe(false);
  await chooseAction(`Actions for ${alert.title}`, "Edit");
  const title = await screen.findByRole("textbox", { name: /^Title/ });
  const dialog = within(screen.getByRole("dialog"));
  await waitFor(() => expect(calls.filter((call) => call.path.includes("/collection/"))).toHaveLength(2));
  fireEvent.change(title, { target: { value: "Updated stock alert" } });
  fireEvent.click(dialog.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const save = calls.find((call) => call.method === "PUT");
  expect(save?.subModule).toBe("Alerts");
  expect(JSON.parse(save?.body ?? "null")).toEqual({ title: "Updated stock alert", notificationType: 4, timeFrame: "2.03:04:05.1234567", alertTypes: [0, 1], roleIds: ["role-one"], userIds: ["user-one"] });
}, 10000);
it("disables configuration and deletion of system alerts while allowing the authorized toggle", async () => {
  open({ system: true }); await screen.findByText(alert.title);
  await openMenu(`Actions for ${alert.title}`);
  expect(screen.getByRole("menuitem", { name: /^Edit/ }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("menuitem", { name: /^Remove/ }).getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("menuitem", { name: "Disable" }).getAttribute("aria-disabled")).not.toBe("true");
});
it("retains the editor and dirty draft when a save fails", async () => {
  open({ fail: true }); await screen.findByText(alert.title);
  await chooseAction(`Actions for ${alert.title}`, "Edit");
  const title = await screen.findByRole("textbox", { name: /^Title/ });
  fireEvent.change(title, { target: { value: "Keep my draft" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("alert");
  if (!(title instanceof HTMLInputElement)) throw new Error("Missing title input");
  expect(title.value).toBe("Keep my draft");
});
it("does not query the alert directory without view access", async () => {
  const calls = open({ permissions: [] }); await screen.findByRole("heading", { name: "Alerts" });
  expect(calls).toEqual([]); expect(screen.queryByRole("button", { name: "Create alert" })).toBeNull();
});
