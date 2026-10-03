// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { forgetSession } from "@/test/backend";
import { mountSettings, settingsBackend } from "@/modules/settings-support/testing";
import SitesPage from "@/pages/(workspace)/settings/sites/page";
afterEach(() => { cleanup(); forgetSession(); });
it("uses the Site collection, exact site permissions, and Sites audit context for reads and writes", async () => {
  const calls = settingsBackend(["CanViewSite", "CanCreateSite"], (request) => request.method === "GET" ? Response.json([]) : Response.json("new-site"));
  mountSettings(<SitesPage />);
  const add = await screen.findByRole("button", { name: "Add site" });
  await waitFor(() => expect(add.hasAttribute("disabled")).toBe(false));
  fireEvent.click(add);
  fireEvent.change(await screen.findByRole("textbox", { name: /^Name/ }), { target: { value: " Factory One " } });
  fireEvent.click(screen.getByRole("button", { name: "Save item" }));
  await waitFor(() => expect(calls.some((call) => call.method === "POST")).toBe(true));
  const write = calls.find((call) => call.method === "POST");
  expect(write?.path).toBe("/api/v1/collection/Site"); expect(write?.subModule).toBe("Sites");
  expect(JSON.parse(write?.body ?? "null")).toEqual({ name: "Factory One", description: "" });
  expect(calls.every((call) => call.subModule === "Sites")).toBe(true);
});
