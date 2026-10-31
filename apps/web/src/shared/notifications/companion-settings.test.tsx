// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CompanionSettings } from "./companion-settings";
import { CompanionCommand, type CompanionPreferences } from "../../../../../shared/companion";
import { nextPreferences } from "../../../../desktop/src/companion/preferences";
afterEach(() => { cleanup(); delete window.oryxCompanion; });
const base: CompanionPreferences = { visible: true, quiet: false, roaming: true, showIndicators: true, size: "medium" };
/** A shell double that applies commands the way the installed shell does. */
function shell(initial: CompanionPreferences = base) {
  let preferences = initial;
  const command = vi.fn(async (action: CompanionCommand) => { preferences = nextPreferences(preferences, action); return preferences; });
  window.oryxCompanion = { settings: async () => preferences, command, summary: async () => {}, onOpen: () => () => {} };
  return command;
}
it("explains desktop availability in browsers and older shells", async () => {
  render(<CompanionSettings />);
  expect(await screen.findByText(/Companion controls are available in an updated Oryx desktop app/)).toBeTruthy();
});
it("chooses a size and shows the chosen one as pressed", async () => {
  const command = shell();
  render(<CompanionSettings />);
  const large = await screen.findByRole("button", { name: "Large" });
  expect((await screen.findByRole("button", { name: "Medium" })).getAttribute("aria-pressed")).toBe("true");
  await userEvent.click(large);
  expect(command).toHaveBeenCalledWith(CompanionCommand.SizeLarge);
  await waitFor(() => expect(large.getAttribute("aria-pressed")).toBe("true"));
});
it("maps movement onto the shell's quiet and roaming switches", async () => {
  const command = shell();
  render(<CompanionSettings />);
  expect((await screen.findByRole("button", { name: "Playful" })).getAttribute("aria-pressed")).toBe("true");
  await userEvent.click(screen.getByRole("button", { name: "Subtle" }));
  expect(command.mock.calls.map(([action]) => action)).toEqual([CompanionCommand.QuietOff, CompanionCommand.RoamingOff]);
  await userEvent.click(screen.getByRole("button", { name: "Still" }));
  expect(command).toHaveBeenLastCalledWith(CompanionCommand.QuietOn);
  await waitFor(() => expect(screen.getByRole("button", { name: "Still" }).getAttribute("aria-pressed")).toBe("true"));
});
it("hides size choices on shells that predate them", async () => {
  shell({ visible: true, quiet: false, roaming: true, showIndicators: true });
  render(<CompanionSettings />);
  await screen.findByRole("button", { name: "Playful" });
  expect(screen.queryByRole("button", { name: "Large" })).toBeNull();
});
it("reports a failed native save without claiming the setting changed", async () => {
  window.oryxCompanion = { settings: async () => base, command: async () => { throw new Error("write failed"); }, summary: async () => {}, onOpen: () => () => {} };
  render(<CompanionSettings />);
  const still = await screen.findByRole("button", { name: "Still" });
  await userEvent.click(still);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(still.getAttribute("aria-pressed")).toBe("false");
});
it("turns new alert cards off through the explicit indicators command", async () => {
  const command = shell();
  render(<CompanionSettings />);
  const cards = await screen.findByRole("switch", { name: "New alert cards" });
  await userEvent.click(cards);
  expect(command).toHaveBeenCalledWith(CompanionCommand.IndicatorsOff);
  await waitFor(() => expect(cards.getAttribute("aria-checked")).toBe("false"));
});
it("sends a labelled device test through the native bridge without changing unread state", async () => {
  const notify = vi.fn(async () => true), summary = vi.fn(async () => {});
  window.oryxCompanion = { settings: async () => base, command: async () => base, notify, summary, onOpen: () => () => {} };
  render(<CompanionSettings />);
  await userEvent.click(await screen.findByRole("button", { name: "Send test notification" }));
  await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ title: "ORYX · Test notification", body: expect.stringContaining("No ERP record") })));
  expect((await screen.findByRole("status")).textContent).toContain("Test submitted");
  expect(summary).not.toHaveBeenCalled();
});
