// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CompanionSettings } from "./companion-settings";
import { CompanionCommand, type CompanionPreferences } from "../../../../../shared/companion";
afterEach(() => { cleanup(); delete window.oryxCompanion; });
it("explains desktop availability in browsers and older shells", async () => {
  render(<CompanionSettings />);
  expect(await screen.findByText(/Companion controls are available in an updated Oryx desktop app/)).toBeTruthy();
});
it("loads persisted preferences and applies an explicit quiet command", async () => {
  let preferences: CompanionPreferences = { visible: true, quiet: false, roaming: true, showIndicators: true };
  const command = vi.fn(async () => { preferences = { ...preferences, quiet: true }; return preferences; });
  window.oryxCompanion = { settings: async () => preferences, command, summary: async () => {}, onOpen: () => () => {} };
  render(<CompanionSettings />);
  const quiet = await screen.findByRole("button", { name: "Quiet movement" });
  expect(quiet.getAttribute("aria-pressed")).toBe("false");
  await userEvent.click(quiet);
  expect(command).toHaveBeenCalledWith(CompanionCommand.QuietOn);
  await waitFor(() => expect(quiet.getAttribute("aria-pressed")).toBe("true"));
});
it("reports a failed native save without claiming the setting changed", async () => {
  window.oryxCompanion = { settings: async () => ({ visible: true, quiet: false, roaming: true, showIndicators: true }), command: async () => { throw new Error("write failed"); }, summary: async () => {}, onOpen: () => () => {} };
  render(<CompanionSettings />);
  const quiet = await screen.findByRole("button", { name: "Quiet movement" });
  await userEvent.click(quiet);
  expect(await screen.findByRole("alert")).toBeTruthy(); expect(quiet.getAttribute("aria-pressed")).toBe("false");
});

it("Appearance has an explicit persisted alert-details command", async () => {
  const preferences = { visible: true, quiet: false, roaming: true, showIndicators: true };
  const command = vi.fn(async () => ({ ...preferences, showIndicators: false }));
  window.oryxCompanion = { settings: async () => preferences, command, summary: async () => {}, onOpen: () => () => {} };
  render(<CompanionSettings />);
  const details = await screen.findByRole("button", { name: "Show alert details" });
  await userEvent.click(details);
  expect(command).toHaveBeenCalledWith(CompanionCommand.IndicatorsOff);
  await waitFor(() => expect(details.getAttribute("aria-pressed")).toBe("false"));
});

it("sends a labelled device test through the native bridge without changing unread state", async () => {
  const notify = vi.fn(async () => true), summary = vi.fn(async () => {});
  window.oryxCompanion = { settings: async () => ({ visible: true, quiet: false, roaming: true, showIndicators: true }), command: async () => ({ visible: true, quiet: false, roaming: true, showIndicators: true }), notify, summary, onOpen: () => () => {} };
  render(<CompanionSettings />);
  await userEvent.click(await screen.findByRole("button", { name: "Send test notification" }));
  await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: "ORYX · Test notification", body: expect.stringContaining("No ERP record") })));
  expect((await screen.findByRole("status")).textContent).toContain("Test submitted");
  expect(summary).not.toHaveBeenCalled();
});
